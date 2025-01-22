<template>
  <v-col cols="9" class="messages-section">
    <!-- Header -->
    <v-toolbar flat dense class="chat-header">
      <v-toolbar-title class="white--text">
        {{ selectedChatTitle || "Select a chat to start messaging" }}
      </v-toolbar-title>
    </v-toolbar>
    <v-divider />

    <!-- Messages Content -->
    <div class="messages-content" ref="messagesContainer" v-if="selectedRoom">
      <div v-if="messages.length === 0" class="no-messages">
        <v-text class="text-center grey--text">
          لا توجد رسائل بعد
        </v-text>
      </div>

      <!-- Display the messages -->
      <v-list dense v-else>
        <v-list-item v-for="(message, index) in messages" :key="index" :class="{
          'my-message': message.isUser,
          'other-message': !message.isUser
        }">
          <v-list-item-content>
            <template v-if="message.media">
              <!-- <strong> {{ message.user.username }} </strong> -->
              <strong>{{ message.user.first_name }} {{ message.user.last_name }} </strong>
              <!-- عرض الصور -->
              <v-img v-if="isImage(message.media)" :src="message.media" class="message-image" alt="User Media" />
              <!-- عرض الفيديو -->
              <video v-else-if="isVideo(message.media)" controls class="message-video">
                <source :src="message.media" type="video/mp4" />
              </video>
              <!-- عرض الصوت -->
              <audio v-else-if="isAudio(message.media)" controls class="message-audio">
                <source :src="message.media" type="audio/mpeg" />
              </audio>
              <!-- عرض الملفات -->
              <a v-else-if="isFile(message.media)" :href="message.media" target="_blank" class="message-file">
                Download File
              </a>
            </template>

            <template v-else>
              <!-- عرض نص الرسالة -->
              <strong>{{ message.user.first_name }} {{ message.user.last_name }}</strong>
              <!-- <strong>{{ message.user.first_name }} {{ message.user.last_name }}</strong> -->
              <v-list-item-title>{{ message.content }}</v-list-item-title>
            </template>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </div>

    <!-- Message Input -->
    <v-row class="message-input-container" v-if="selectedRoom">
      <v-col cols="9">
        <v-text-field v-model="newMessage" label="Type a message" @keyup.enter="sendMessage" solo outlined dense
          hide-details class="message-input"></v-text-field>
      </v-col>
      <v-col cols="3">
        <v-btn @click="sendMessage" color="#5F8780" class="send-button">
          <v-icon>mdi-send</v-icon>
        </v-btn>
        <v-btn color="grey lighten-2" class="attach-button" @click="$refs.mediaInput.click()">
          <v-icon>mdi-paperclip</v-icon>
        </v-btn>
        <input type="file" ref="mediaInput" style="display: none;" @change="uploadMedia" />
      </v-col>
    </v-row>
  </v-col>
</template>

<script>
export default {
  props: {
    messages: Array,
    selectedChatTitle: String,
    selectedRoom: String,
    chatType: String,
  },
  data() {
    return {
      newMessage: "",
      websocket: null, // WebSocket instance
    };
  },
  mounted() {
    this.initWebSocket();
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  },
  methods: {
    isImage(path) {
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];

      const url = typeof path === 'object' && path.url ? path.url : path;
      if (typeof url === 'string') {
        const extension = url.split('.').pop().toLowerCase();
        return imageExtensions.includes(extension);
      }

      return false;
    },
    isVideo(path) {
      const videoExtensions = ['mp4', 'mov', 'wmv', 'flv', 'avi', 'mkv', 'webm'];

      const url = typeof path === 'object' && path.url ? path.url : path;
      if (typeof url === 'string') {
        const extension = url.split('.').pop().toLowerCase();
        return videoExtensions.includes(extension);
      }

      return false;
    },
    isAudio(path) {
      const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];

      const url = typeof path === 'object' && path.url ? path.url : path;
      if (typeof url === 'string') {
        const extension = url.split('.').pop().toLowerCase();
        return audioExtensions.includes(extension);
      }

      return false;
    },
    isFile(path) {
      const fileExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar'];

      const url = typeof path === 'object' && path.url ? path.url : path;
      if (typeof url === 'string') {
        const extension = url.split('.').pop().toLowerCase();
        return fileExtensions.includes(extension);
      }

      return false;
    },

    // async fetchGroupMessages(groupName) {
    //   try {
    //     const response = await axios.get(`/api/rooms/${groupName}/`);
    //     const currentUser = localStorage.getItem("username");
    //     // console.log(currentUser);
    //     this.messages = response.data.messages.map((msg) => ({
    //       ...msg,
    //       isUser: msg.user.username === currentUser,
    //     }));
    //     this.selectedChatTitle = `Group: ${groupName}`;
    //     this.selectedRoom = groupName;
    //   } catch (error) {
    //     console.error("Error fetching group messages:", error);
    //   }
    // },

    // دالة لإظهار إشعار بسيط
    showNotification(message, room) {
      if (!("Notification" in window)) return;

      // تحقق من إذن الإشعارات
      if (Notification.permission === "granted") {
        // افترض أن roomNameCurrent هو اسم الغرفة التي يتواجد فيها المستخدم حاليًا
        const roomNameCurrent = this.selectedRoom; // استبدل getCurrentRoomName بالوظيفة المناسبة لديك للحصول على اسم الغرفة الحالية

        // تحقق مما إذا كانت الصفحة غير نشطة أو المستخدم في غرفة مختلفة
        if (document.hidden || roomNameCurrent !== room) {
          const notification = new Notification(`New Message in ${room}`, {
            body: `${message.user.username}: ${message.content || "Media message"}`,
            icon: "@/assets/notifications.png", // أيقونة الإشعار
          });

          // التركيز على الصفحة عند النقر على الإشعار
          notification.onclick = () => window.focus();
        }
      }
    },


    initWebSocket() {
      const token = localStorage.getItem("accessToken");
      const socketUrl = `ws://localhost:3456/ws/chat/${this.selectedRoom}/?token=${token}`;
      this.websocket = new WebSocket(socketUrl);

      this.websocket.onopen = () => {
        console.log("WebSocket connection established");
      };

      this.websocket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

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
            }
          }
          // console.log(data.room)
          const newMessage = {
            content: messageContent,
            user: {
                    username: data.user.username, // للاحتفاظ بـ username للمقارنة
                    first_name: data.user.first_name,
                    last_name: data.user.last_name,
                  },
            message_type: messageType,
            media: media,
            isUser: isUser,
          };
          const username = localStorage.getItem("username");
          if (isUser) {
            this.messages.push(newMessage);
          } else {
            console.log('hiiiiiiiiiiiii');
            this.showNotification(newMessage, data.room);
            this.messages.push(newMessage);
          }

          this.$nextTick(() => {
            this.scrollToBottom();
          });
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      this.websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.websocket.onclose = () => {
        console.log("WebSocket connection closed");
      };
    },

    sendMessage() {
      if (!this.newMessage.trim()) return;

      const messageData = {
        content: this.newMessage,
        room: this.selectedRoom,
        user: localStorage.getItem("username"),
        media: null,
      };

      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify(messageData));
      }

      this.newMessage = "";
    },

    uploadMedia(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        const messageData = {
          content: "",
          room: this.selectedRoom,
          user: localStorage.getItem("username"),
          media: base64String,
        };

        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          this.websocket.send(JSON.stringify(messageData));
        }
      };
      reader.readAsDataURL(file);
    },

    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
  },

  watch: {
    selectedRoom(newRoom) {
      if (this.websocket) {
        this.websocket.close();
      }
      this.initWebSocket();
    },
    messages: {
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      },
      immediate: true,
    },
  },

  beforeDestroy() {
    if (this.websocket) {
      this.websocket.close();
    }
  },
};
</script>

<style scoped>
@import '@/assets/main.css';
</style>
