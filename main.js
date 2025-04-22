
import './utils/convertjs.js'
// #ifndef VUE3
import Vue from 'vue'
import App from './App'

// 确保 TextDecoder 被引用
if (typeof TextDecoder !== 'undefined') {
  console.log('TextDecoder is available');
}


Vue.config.productionTip = false

App.mpType = 'app'

const app = new Vue({
    ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import App from './App.vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif