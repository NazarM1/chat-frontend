<template>
  <v-card class="full-height-card">
    <v-layout>
      <SideNav />
      <MessageList v-if="!selectedUser" :filter="filter" :search="search" @open-chat="openChat" />
      <ChatScreen v-if="selectedUser" :selectedUser="selectedUser" @close-chat="closeChat" @send-message="sendMessage" />
    </v-layout>
  </v-card>
</template>

<script>
import SideNav from '@/components/ComponentsGlobal/SideNav.vue';
import MessageList from '@/components/ComponentsGlobal/MessageList.vue';
import ChatScreen from '@/components/ComponentsGlobal/ChatScreen.vue';

export default {
  data() {
    return {
      search: "",
      filter: "all",
      selectedUser: null,
    };
  },
  methods: {
    openChat(user) {
      this.selectedUser = user;
    },
    closeChat() {
      this.selectedUser = null;
    },
    sendMessage(message) {
      // إرسال الرسالة
      if (this.selectedUser) {
        this.selectedUser.messages.push({
          subtitle: message,
          isUser: true,
        });
      }
    },
  },
};
</script>
