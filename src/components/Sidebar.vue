<template>
  <v-col cols="3" class="sidebar">
    <v-divider />

    <!-- Content based on selected tab -->
    <v-list dense>
      <template v-if="activeTab === 0">
        <div style="display: flex; flex-direction: column;">
          <div style="display: flex; flex-direction: row-reverse; justify-content: space-between; align-items: center;">
            <v-subheader class="sidebar-title">{{ username }}</v-subheader>
            <!-- زر تسجيل الخروج -->
            <v-btn icon @click="logout">
              <v-icon>mdi-logout</v-icon> <!-- أيقونة تسجيل الخروج -->
            </v-btn>
          </div>
          <v-subheader class="sidebar-title">المجموعات</v-subheader>
        </div>
        <v-list-item v-for="group in groups" :key="group.id" @click="selectGroupChat(group.name)"
          class="cursor-pointer groups-name">
          <v-list-item-content>
            <v-list-item-title>{{ group.name }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-list>
  </v-col>
</template>

<script>
import axios from "../utils/axios";

export default {
  props: {
    groups: Array,
  },
  data() {
    return {
      username: '',
      activeTab: 0, // Keep only the "Groups" tab active
    };
  },
  methods: {
    async logout() {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log("Logging out user...");
          await axios.post('/api/token/logout/', { refresh: refreshToken });
        }
      } catch (error) {
        console.error("Error during logout API call:", error);
      } finally {
        const username = localStorage.getItem('username');
        if (username) {
          try {
            console.log("Updating user status to offline...");
            await axios.post('/api/user/status/', { username: username, status: 'offline' });
          } catch (error) {
            console.error("Error updating user status:", error);
          }
        }
        this.closeAllWebSocketConnections();
        console.log("Clearing localStorage...");
        localStorage.clear();
        console.log("Redirecting to login page...");
        this.$router.push({ name: 'Login' });
      }
    },
    closeAllWebSocketConnections() {
    if (this.$root.activeWebsockets) {
      Object.values(this.$root.activeWebsockets).forEach((websocket) => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
          websocket.close(); // إغلاق الاتصال
          console.log("WebSocket connection closed.");
        }
      });
      this.$root.activeWebsockets = {}; // مسح جميع اتصالات الـ WebSocket من الذاكرة
    }
  },
    selectGroupChat(groupName) {
      this.$emit("selectChat", { type: 'group', name: groupName });
    },
  },
  mounted() {
    this.username = localStorage.getItem("username") || "Guest";
  },
};
</script>

<style scoped>
.sidebar {
  height: 100vh;
  overflow-y: auto;
}

.sidebar-title {
  color: white;
  text-align: end;
}

.groups-name {
  display: flex;
  justify-content: end;
}
</style>
