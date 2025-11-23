import { createApp } from 'vue'//引入createapp方法
import { createPinia } from 'pinia'
import App from './App.vue'//从APP.vue引入根组件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(ElementPlus)
app.use(pinia)
app.mount('#app');
