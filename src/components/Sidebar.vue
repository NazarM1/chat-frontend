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
                    <v-list-item-subtitle v-if="notification.fk_room.name">{{ notification.fk_room.name
                      }}</v-list-item-subtitle>
                    <v-list-item-subtitle v-else>{{ notification.fk_room }}</v-list-item-subtitle>
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

    <!-- زر لإضافة PhaseContent -->
    <v-btn color="primary" @click="openAddPhaseContentDialog" class="add-phase-content-btn">
      <v-icon>mdi-plus</v-icon> إضافة PhaseContent
    </v-btn>

    <!-- نافذة منبثقة لإضافة PhaseContent -->
    <v-dialog v-model="addPhaseContentDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">إضافة PhaseContent</span>
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="addPhaseContent">
            <v-text-field v-model="phase" label="Phase" required></v-text-field>
            <v-select v-model="forword" :items="rollChoices" item-title="text" label="Forword" required></v-select>
            <v-select v-model="fk_room" :items="rooms" item-title="name" item-value="id" label="Room"
              required></v-select>
            <v-btn type="submit" color="primary">إضافة</v-btn>
            <v-btn @click="closeAddPhaseContentDialog" color="secondary">إلغاء</v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
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
      websocket: null, // WebSocket connection
      addPhaseContentDialog: false, // حالة النافذة المنبثقة
      phase: "",
      forword: "",
      fk_room: null,
      rollChoices: [
        { text: "Administration", value: "administration" },
        { text: "Section", value: "section" },
        { text: "Supervisor", value: "supervisor" },
        { text: "Student", value: "student" },
        { text: "All", value: "all" },
      ],
      rooms: [],
      // notifications: [], // قائمة الإشعارات
    };
  },
  methods: {
    async logout() {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log("Logging out user...");
          await this.axios.post('/api/token/logout/', { refresh: refreshToken });
        }
      } catch (error) {
        console.error("Error during logout API call:", error);
      } finally {
        const username = localStorage.getItem('username');
        if (username) {
          try {
            console.log("Updating user status to offline...");
            await this.axios.post('/api/user/status/', { username: username, status: 'offline' });
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
    connectWebSocket() {
      const token = localStorage.getItem("accessToken");

      this.websocket = new WebSocket(`ws://localhost:3456/ws/notifications/?token=${token}`);
      this.websocket.onopen = () => {
        console.log("WebSocket connected for notifications");
      };
      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
                const notification = data.notification;
                this.notifications.unshift(notification); // إضافة الإشعار الجديد إلى القائمة
            }
      };

      this.websocket.onclose = () => {
        console.log("WebSocket connection closed for notifications");
      };
    },
    openAddPhaseContentDialog() {
      this.addPhaseContentDialog = true;
      this.fetchRooms(); // جلب الغرف عند فتح النافذة
    },
    closeAddPhaseContentDialog() {
      this.addPhaseContentDialog = false;
      this.resetForm(); // إعادة تعيين النموذج عند الإغلاق
    },
    async fetchRooms() {
      try {
        const response = await this.axios.get("/api/rooms/");
        this.rooms = response.data.rooms;
        // console.log(this.rooms);

      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    },
    async addPhaseContent() {
      try {
        const response = await this.axios.post("/api/phase-content/", {
          phase: this.phase,
          forword: this.forword,
          fk_room: this.fk_room,
        });
        this.closeAddPhaseContentDialog();
        this.$emit("refreshNotifications"); // إعادة تحميل الإشعارات
      } catch (error) {
        console.error("Error adding phase content:", error);
      }
    },
    resetForm() {
      this.phase = "";
      this.forword = "";
      this.fk_room = null;
    },
  },
  mounted() {
    this.username = localStorage.getItem("username") || "Guest";
    this.connectWebSocket(); // الاتصال بـ WebSocket
  },
  beforeDestroy() {
    if (this.websocket) {
      this.websocket.close(); // إغلاق الاتصال عند تدمير المكون
    }
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

.add-phase-content-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
}
</style>
