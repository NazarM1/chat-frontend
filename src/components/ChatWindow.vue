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
              <strong>{{ message.user.first_name }} {{ message.user.last_name }}</strong>
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
              <v-list-item-title>{{ message.content }}</v-list-item-title>
            </template>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </div>

    <!-- Message Input -->
    <v-row class="message-input-container" v-if="selectedRoom">
      <v-col cols="9">
        <v-text-field
          v-model="newMessage"
          label="Type a message"
          @keyup.enter="sendMessage"
          solo
          outlined
          dense
          hide-details
          class="message-input" />
      </v-col>
      <v-col cols="3" class="d-flex align-center">
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
    activeWebsockets: Object, // قائمة باتصالات WebSocket النشطة
  },
  data() {
    return {
      newMessage: "",
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
    sendMessage() {
      if (!this.newMessage.trim()) return;

      const messageData = {
        content: this.newMessage,
        room: this.selectedRoom,
        user: localStorage.getItem("username"),
        media: null,
      };

      const websocket = this.activeWebsockets[this.selectedRoom];
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(messageData));
      }

      this.newMessage = "";
      this.scrollToBottom();
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

        const websocket = this.activeWebsockets[this.selectedRoom];
        if (websocket && websocket.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify(messageData));
        }
      };
      reader.readAsDataURL(file);
      this.scrollToBottom();
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
  watch: {
    messages: {
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      },
      immediate: true,
    },
  },
};
</script>

<style scoped>
@import '@/assets/main.css';
</style>
