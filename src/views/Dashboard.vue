<template >
  <v-container fluid>

    <v-row>
      <!-- ChatWindow.vue -->
      <ChatWindow :messages="messages" :selectedChatTitle="selectedChatTitle" :selectedRoom="selectedRoom"
        :activeWebsockets="activeWebsockets" @newMessage="addNewMessage" @sendMessage="sendMessage"
        @uploadMedia="uploadMedia" />
      <!-- Sidebar.vue -->
      <Sidebar :users="users" :groups="groups" @selectChat="handleChatSelection" />
    </v-row>
  </v-container>
</template>

<script>
import Sidebar from "@/components/Sidebar.vue";
import ChatWindow from "@/components/ChatWindow.vue";
import axios from "../utils/axios";

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
      activeWebsockets: {}, // لتتبع اتصالات الـ WebSocket
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
        const response = await axios.get("/api/rooms/");
        this.groups = response.data.rooms;
        this.users = response.data.users;
        this.initWebSocketConnections();
      } catch (error) {
        console.error("Error fetching rooms and users:", error);
      }
    },

    initWebSocketConnections() {
  const token = localStorage.getItem("accessToken");
  this.groups.forEach((group) => {
    const groupName = group.name;
    if (!this.activeWebsockets[groupName]) {
      const socketUrl = `ws://localhost:3456/ws/chat/${groupName}/?token=${token}`;
      const websocket = new WebSocket(socketUrl);

      websocket.onopen = () => {
        console.log(`WebSocket connected for group: ${groupName}`);
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // تحقق من نوع الرسالة
          const isUser = data.user.username === localStorage.getItem("username");
          let messageContent = data.message;
          let media = null;
          let messageType = 'text'; // نوع الرسالة الافتراضي هو نص

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
            }else{
              messageType = 'text';
            }
          }
          // console.log(messageType);
          // console.log(messageContent);
          const newMessage = {
            content: messageContent , // النص
            media: media, // الوسائط
            user: {
              username: data.user.username,
              first_name: data.user.first_name,
              last_name: data.user.last_name,
            },
            isUser: data.user.username === localStorage.getItem("username"), // المستخدم الحالي
            type: messageType, // نوع الرسالة
          };

          if (isUser) {
            this.messages.push(newMessage);
          } else {
            if(data.room == this.selectedRoom){
              this.messages.push(newMessage);
            }else{
              this.showNotification(newMessage, data.room);
              // this.messages.push(newMessage);
            }
          }

          // التمرير للأسفل تلقائيًا
          this.$nextTick(() => {
            this.scrollToBottom();
          });

        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      websocket.onclose = () => {
        console.log(`WebSocket connection closed for group: ${groupName}`);
      };

      this.activeWebsockets[groupName] = websocket;
    }
  });
},
    handleChatSelection(chat) {
      this.fetchGroupMessages(chat.name);
    },

    async fetchGroupMessages(groupName) {
      try {
        const response = await axios.get(`/api/rooms/${groupName}/`);
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
    scrollToBottom() {
  this.$nextTick(() => {
    const container = this.$refs.messagesContainer;
    if (container) {
      // تأخير بسيط لضمان تحميل جميع العناصر (مثل الصور والوسائط)
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100); // يمكنك تعديل الوقت إذا كان هناك وسائط كبيرة
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
    Object.values(this.activeWebsockets).forEach((websocket) => websocket.close());
  },
};
</script>

<style scoped>
/* Header Styles */
.header {
  background-color: #005f73; /* لون خلفية احترافي */
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
