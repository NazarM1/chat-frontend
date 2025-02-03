import { createApp } from "vue";
import App from "./App.vue";
import router from "./router"; // استيراد Vue Router
import vuetify from "./plugins/vuetify";
import axios from "@/utils/axios";
import "vuetify/styles";

//styles imports
import "bootstrap/dist/css/bootstrap.css";

const app = createApp(App)

app.config.globalProperties.axios = axios;

app.use(router) // إضافة Vue Router
  .use(vuetify) // إضافة vuetify
  .mount("#app");
