<template>
  <v-col cols="3" class="sidebar">
    <v-divider />

    <!-- Content based on selected tab -->
    <v-list dense>
      <template v-if="activeTab === 0">
        <div style="display: flex; flex-direction: column;" >
        <div style="display: flex; flex-direction:row-reverse;justify-content: space-between;align-items: center;">
        <v-subheader class="sidebar-title">{{ username }}</v-subheader>
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
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        // console.log('dddddddddddddddddddddddddddddddd');
        await axios.post("/api/token/logout/", { refresh: refreshToken });
      }
      // إزالة التوكن من التخزين المحلي
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("username");
      // إغلاق جميع اتصالات WebSocket
      // Object.values(this.activeWebsockets).forEach((websocket) => websocket.close());

      // إعادة التوجيه إلى صفحة تسجيل الدخول
      this.$router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      // alert("فشل تسجيل الخروج. حاول مرة أخرى.");
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
  /* display: flex; */
  /* justify-content: end; */
}

.groups-name {
  display: flex;
  justify-content: end;
}
</style>
