<template>
  <v-container fluid>
    <v-row>
      <!-- ChatWindow.vue -->
      <ChatWindow :messages="messages" :selectedChatTitle="selectedChatTitle" :selectedRoom="selectedRoom"
        :websocket="websocket" @newMessage="addNewMessage" @sendMessage="sendMessage" @uploadMedia="uploadMedia" />
      <!-- Sidebar.vue -->
      <Sidebar :users="users" :groups="groups" :notifications="phaseContents" @selectChat="handleChatSelection" />
    </v-row>
  </v-container>
</template>

<script>
import Sidebar from "@/components/Sidebar.vue";
import ChatWindow from "@/components/ChatWindow.vue";

export default {
  components: { Sidebar, ChatWindow },
  data() {
    return {
      username: '',
      users: [],
      groups: [],
      messages: [],
      selectedChatTitle: "",
      selectedRoom: null,
      websocket: null, // WebSocket واحد لجميع المجموعات
      phaseContents: [],
    };
  },
  methods: {
    isImage(path) {
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
      const extension = this.getFileExtension(path);
      return imageExtensions.includes(extension);
    },
    isVideo(path) {
      const videoExtensions = ['mp4', 'mov', 'wmv', 'flv', 'avi', 'mkv', 'webm'];
      const extension = this.getFileExtension(path);
      return videoExtensions.includes(extension);
    },
    isAudio(path) {
      const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
      const extension = this.getFileExtension(path);
      return audioExtensions.includes(extension);
    },
    isFile(path) {
      const fileExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar'];
      const extension = this.getFileExtension(path);
      return fileExtensions.includes(extension);
    },
    getFileExtension(path) {
      const url = typeof path === 'object' && path.url ? path.url : path;
      if (typeof url === 'string') {
        return url.split('.').pop().toLowerCase();
      }
      return "";
    },
    async fetchRoomsAndUsers() {
      try {
        const response = await this.axios.get("/api/rooms/");
        this.groups = response.data.rooms;
        this.phaseContents = response.data.phase_contents;
        console.log(this.groups);

        const unreadMessagesResponse = await this.axios.get("/api/unread-messages/");
        const unreadMessages = unreadMessagesResponse.data.unread_messages;

        unreadMessages.forEach(message => {
          this.showUnreadNotification({
            id: message.id,
            content: message.message_data.content,
            user: {
              username: message.user_data.username,
              first_name: message.user_data.first_name,
              last_name: message.user_data.last_name,
            },
          }, message.room_name);
        });

        this.initWebSocketConnection(); // Initialize a single WebSocket connection
      } catch (error) {
        if (error.response && error.response.status === 401) {
          await this.logout();
        }
        console.error("Error fetching rooms and users:", error);
      }
    },
    initWebSocketConnection() {
      const token = localStorage.getItem("accessToken");
      const socketUrl = `ws://localhost:3456/ws/chat/all/?token=${token}`; // WebSocket واحد لجميع المجموعات
      
      this.websocket = new WebSocket(socketUrl);
      console.log(this.websocket.url,'rrrrrrrrrrrrrrr');


      this.websocket.onopen = () => {
        console.log("WebSocket connected for all groups");
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // التحقق من أن المجموعة المرسلة منها الرسالة موجودة في this.groups
          const isGroupValid = this.groups.some(group => group.name === data.room);

          if (!isGroupValid) {
            console.log(`Message from unknown group: ${data.room}`);
            return; // تجاهل الرسالة إذا كانت المجموعة غير موجودة
          }

          const isUser = data.user.username === localStorage.getItem("username");
          let messageContent = data.message;
          let media = null;
          let messageType = 'text';


          if (data.media && data.media.url) {
            const mediaUrl = 'http://127.0.0.1:3456' + data.media.url;

            if (this.isImage(mediaUrl)) {
              messageType = 'image';
              media = mediaUrl;
            } else if (this.isVideo(mediaUrl)) {
              messageType = 'video';
              media = mediaUrl;
            } else if (this.isAudio(mediaUrl)) {
              messageType = 'audio';
              media = mediaUrl;
            } else if (this.isFile(mediaUrl)) {
              messageType = 'file';
              media = mediaUrl;
            } else {
              messageType = 'text';
            }
          }

          const newMessage = {
            content: messageContent,
            media: media,
            user: {
              username: data.user.username,
              first_name: data.user.first_name,
              last_name: data.user.last_name,
            },
            formatted_time: data.timestamp,
            isUser: isUser,
            type: messageType,
            room: data.room, // إضافة room لتحديد المجموعة
          };

          // التحقق من أن الرسالة موجهة للمجموعة المحددة حاليًا
          if (data.room === this.selectedRoom) {
            this.messages.push(newMessage);
            if (data.user.username === localStorage.getItem("username") ) {
              this.showNotification(newMessage, data.room);
            }
          } else {
            this.showUnreadNotification(newMessage, data.room);
          }

          this.$nextTick(() => {
            this.scrollToBottom();
          });
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      this.websocket.onclose = () => {
        console.log("WebSocket connection closed");
      };
    },
    handleChatSelection(chat) {
      this.fetchGroupMessages(chat.name);
    },
    async fetchGroupMessages(groupName) {
      try {
        const response = await this.axios.get(`/api/rooms/${groupName}/`);
        this.messages = response.data.messages.map((msg) => ({
          ...msg,
          isUser: msg.user.username === localStorage.getItem("username"),
        }));
        this.selectedChatTitle = `Group: ${groupName}`;
        this.selectedRoom = groupName;
      } catch (error) {
        console.error("Error fetching group messages:", error);
      }
    },
    showNotification(message, room) {
      if (Notification.permission === "granted" && document.hidden) {
        const notification = new Notification(`رسالة جديدة ${room}`, {
          body: `${message.user.first_name} ${message.user.last_name}: ${message.content || "رسالة وسائط"}`,
          icon: "@/assets/notifications.png",
        });

        notification.onclick = () => window.focus();
      }
    },
    async showUnreadNotification(message, room) {
      if (Notification.permission === "granted") {
        const notification = new Notification(`رسالة جديدة ${room}`, {
          body: `${message.user.first_name} ${message.user.last_name}: ${message.content || "رسالة وسائط"}`,
          icon: "@/assets/notifications.png",
        });

        notification.onclick = () => window.focus();
      }

      await this.axios.post('/api/message/status/', { id: message.id });
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
  },
  mounted() {
    this.username = localStorage.getItem("username") || "Guest";
    this.fetchRoomsAndUsers();
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  },
  beforeDestroy() {
    if (this.websocket) {
      this.websocket.close();
    }
  },
};
</script>

<style scoped>
/* Header Styles */
.header {
  background-color: #005f73;
  color: #ffffff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 2rem;
  font-weight: 600;
}

.logout-btn {
  color: #ffffff;
  border-radius: 50%;
  transition: transform 0.3s ease-in-out;
}

.logout-btn:hover {
  transform: scale(1.1);
}

/* Main Chat and Sidebar Container Styles */
.chat-container {
  background-color: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1);
}

.sidebar-container {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

/* Chat and Sidebar Element Spacing */
.v-col {
  padding: 16px;
}

/* Button Hover Effects */
.v-btn {
  transition: transform 0.3s ease;
}

.v-btn:hover {
  transform: scale(1.05);
}

/* Overall Layout Padding */
.v-container {
  padding: 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header {
    padding: 15px;
  }

  .title {
    font-size: 1.5rem;
  }
}
</style>
