<template>
  <v-container>
    <v-form @submit.prevent="handleLogin">
      <v-text-field label="Username" v-model="username" required />
      <v-text-field label="Password" v-model="password" type="password" required />
      <v-btn type="submit" color="primary">Login</v-btn>
    </v-form>
  </v-container>
</template>

<script>
import axios from "../utils/axios";

export default {
  data() {
    return {
      username: "",
      password: "",
    };
  },
  methods: {

    async handleLogin() {
      localStorage.setItem("username", this.username);
    const username = localStorage.getItem("username");
    console.log(username);
      localStorage.setItem("username", this.username);
      try {
        const response = await axios.post("/api/token/", {
          username: this.username,
          password: this.password,
        });
        const accessToken = response.data.access;
        const refreshToken = response.data.refresh;

      // طباعة الـ Tokens في Console المتصفح
        // console.log("Access Token:", accessToken);
        // console.log("Refresh Token:", refreshToken);

        // حفظ الـ Tokens في localStorage
        localStorage.setItem("accessToken", response.data.access);
        localStorage.setItem("refreshToken", response.data.refresh);
         // يجب أن يطبع القيمة


        // الانتقال إلى صفحة Dashboard
        this.$router.push({
          path:"/dashboard",
          // query: { username: this.username },
        });
      } catch (error) {
        console.error("Login failed:", error);
      }
    },
  },
};
</script>
