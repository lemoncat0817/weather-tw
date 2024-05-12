// 引入vue
import { createApp } from 'vue'
// 引入根組件
import App from './App.vue'
// 創建vue
const app = createApp(App)

// 引入路由
import router from './router'
// 掛載路由
app.use(router)

// 重置scss的樣式
import '@/styles/reset.scss'

// pinia
// 引入pinia倉庫
import { createPinia } from 'pinia'
// pinia持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
// 創建pinia
const pinia = createPinia()
// 使用pinia持久化插件
pinia.use(piniaPluginPersistedstate)
// 掛載pinia
app.use(pinia)

// element-plus
// 引入element-plus
import ElementPlus from 'element-plus'
// 引入element-plus的中文語系
import zhTw from 'element-plus/es/locale/lang/zh-tw'
// 引入element-plus的樣式
import 'element-plus/dist/index.css'
// 引入element-plus icon
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 引入element-plus的暗黑模式
import 'element-plus/theme-chalk/dark/css-vars.css'
// 全域註冊element-plus
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
// 掛載element-plus
app.use(ElementPlus, {
  locale: zhTw
})

app.mount('#app')
