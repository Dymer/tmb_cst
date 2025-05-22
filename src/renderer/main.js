import Vue from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia, PiniaVuePlugin } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import vuetify from './plugins/vuetify.js'

import 'vuetify/dist/vuetify.min.css'
import Toast from "vue-toastification";
// Import the CSS or use your own!
import "vue-toastification/dist/index.css";

const options = {
    // You can set your default options here
};


Vue.use(Toast, options);


Vue.use(PiniaVuePlugin)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
Vue.use(pinia)

export const TheApp = new Vue({
    router,
    vuetify,
    pinia,
    render: h => h(App)
}).$mount('#app')
