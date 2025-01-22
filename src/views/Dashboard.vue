<template>
  <v-container fluid>
    <v-row>


      <!-- Chat Window -->
      <ChatWindow
      :messages="messages"
      :selectedChatTitle="selectedChatTitle"
      :selectedRoom="selectedRoom"
      @newMessage="addNewMessage"
      @sendMessage="sendMessage"
      @uploadMedia="uploadMedia"
      />
      <!-- Sidebar -->
      <Sidebar
        :users="users"
        :groups="groups"
        @selectChat="handleChatSelection"
      />
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
      users: [],
      groups: [],
      messages: [],
      selectedChatTitle: "",
      selectedRoom: null,
    };
  },
  methods: {

    async fetchRoomsAndUsers() {
      try {
        const response = await axios.get("/api/rooms/");
        this.groups = response.data.rooms;
        this.users = response.data.users;
      } catch (error) {
        console.error("Error fetching rooms and users:", error);
      }
    },

    // معالج اختيار المحادثة (سواء كانت مجموعة أو مستخدم)
    handleChatSelection(chat) {
      // if (chat.type === "user") {
      //   this.fetchPrivateChat(chat.name);  // جلب المحادثة الخاصة إذا كانت موجودة
      // } else if (chat.type === "group") {
        this.fetchGroupMessages(chat.name);
      // }
    },

    // جلب رسائل مجموعة
    async fetchGroupMessages(groupName) {
      try {
        const response = await axios.get(`/api/rooms/${groupName}/`);
        this.messages = response.data.messages.map((msg) => ({
          ...msg,
          isUser: "username" in msg.user? msg.user.username ===localStorage.getItem("username"):'',
        }));
        this.selectedChatTitle = `Group: ${groupName}`;
        this.selectedRoom = groupName;
      } catch (error) {
        console.error("Error fetching group messages:", error);
      }
    },

    // async sendMessage(content) {
    //   try {
    //     const payload = { content, room: this.selectedRoom };
    //     await axios.post("/api/messages/", payload);
    //     this.fetchGroupMessages(this.selectedRoom); // تحديث الرسائل
    //   } catch (error) {
    //     console.error("Error sending message:", error);
    //   }
    // },

    // async uploadMedia(file) {
    //   try {
    //     const formData = new FormData();
    //     formData.append("media", file);
    //     formData.append("room", this.selectedRoom);
    //     await axios.post("/api/messages/media/", formData);
    //     this.fetchGroupMessages(this.selectedRoom); // تحديث الرسائل
    //   } catch (error) {
    //     console.error("Error uploading media:", error);
    //   }
    // },
  },
  mounted() {
    this.fetchRoomsAndUsers();
  },
};
</script>
