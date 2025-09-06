import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './styles/index.scss'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(store)
app.use(router)
app.use(ElementPlus)

app.mount('#app')

// Global error reporting (development aid)
// Captures unhandled promise rejections and uncaught errors and POSTs to backend for inspection
;(function setupGlobalErrorReporting(){
  const reportUrl = '/api/v1/system/client-error'; // assumes dev proxy maps /api to backend

  function sendReport(body){
    try{
      navigator.sendBeacon && typeof navigator.sendBeacon === 'function'
        ? navigator.sendBeacon(reportUrl, JSON.stringify(body))
        : fetch(reportUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(()=>{});
    }catch(e){ /* swallow */ }
  }

  window.addEventListener('unhandledrejection', (ev) => {
    try{
      const reason = ev && ev.reason ? (ev.reason.stack || ev.reason.message || String(ev.reason)) : 'unknown';
      sendReport({
        type: 'unhandledrejection',
        message: reason,
        stack: ev && ev.reason && ev.reason.stack ? ev.reason.stack : null,
        url: location.href,
        extra: { event: ev }
      });
    }catch(e){/* ignore */}
  });

  window.addEventListener('error', (ev) => {
    try{
      sendReport({
        type: 'error',
        message: ev && ev.message ? ev.message : String(ev),
        stack: ev && ev.error && ev.error.stack ? ev.error.stack : null,
        url: location.href,
        extra: { filename: ev && ev.filename, lineno: ev && ev.lineno, colno: ev && ev.colno }
      });
    }catch(e){/* ignore */}
  });
})();