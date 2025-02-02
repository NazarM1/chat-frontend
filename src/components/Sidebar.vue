<template>
  <v-col cols="3" class="sidebar">
    <v-list dense>
      <template v-if="activeTab === 0">
        <div style="display: flex; flex-direction: column;">
          <div style="display: flex; flex-direction: row-reverse; justify-content: space-between; align-items: center;">
            <v-subheader class="sidebar-title">{{ username }}</v-subheader>

            <!-- أيقونة الجرس للإشعارات -->
            <v-menu transition="scale-transition" offset-y>
              <template v-slot:activator="{ props }">
                <v-btn icon color="primary" v-bind="props">
                  <v-icon>mdi-bell</v-icon>
                  <v-badge v-if="notifications.length > 0" color="red" :content="notifications.length" bordered />
                </v-btn>
              </template>

              <v-list>
                <v-list-item v-for="(notification, index) in notifications" :key="index">
                  <v-list-item-content>
                    <v-list-item-title>{{ notification.phase }}</v-list-item-title>
                    <v-list-item-subtitle>{{ notification.forword }}</v-list-item-subtitle>
                    <v-list-item-subtitle>{{ notification.fk_room.name }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>

                <!-- عند عدم وجود إشعارات -->
                <v-list-item v-if="notifications.length === 0">
                  <v-list-item-content>
                    <v-list-item-title>لا توجد إشعارات جديدة</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-menu>

            <!-- زر تسجيل الخروج -->
            <v-btn icon @click="logout">
              <v-icon>mdi-logout</v-icon>
            </v-btn>
          </div>
          <v-divider />
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
export default {
  props: {
    groups: Array,
    notifications: Array, // استقبال phase_contents من dashboard.vue
  },
  data() {
    return {
      username: '',
      activeTab: 0,
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
            websocket.close();
            console.log("WebSocket connection closed.");
          }
        });
        this.$root.activeWebsockets = {};
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
