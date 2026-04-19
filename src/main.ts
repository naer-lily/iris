import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from './locales'
import App from './App.vue'
import './style.css'

createApp(App).use(createPinia()).use(i18n).mount('#app')
