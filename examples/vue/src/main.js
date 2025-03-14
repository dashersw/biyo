import { createApp } from 'vue'
import App from './App.vue'

// Create and mount Vue app to the given element
window.mountVueApp = element => {
  const app = createApp(App)
  app.mount(element)
  return app
}
