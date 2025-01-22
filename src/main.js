import { createApp } from 'vue';
import App from './App.vue';
import router from './router';  // استيراد Vue Router
import vuetify from './plugins/vuetify';    // استيراد Vuex
import 'vuetify/styles';

//styles imports
import 'bootstrap/dist/css/bootstrap.css';

createApp(App)
  .use(router)   // إضافة Vue Router
  .use(vuetify)    // إضافة vuetify
  .mount('#app');
