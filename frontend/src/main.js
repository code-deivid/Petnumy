// src/main.js
// ============================================================
//  Punto de entrada de Petnumy Frontend
// ============================================================

import { createApp }  from 'vue'
import { createPinia } from 'pinia'

import App    from './App.vue'
import router from './router/index.js'

// Estilos globales (orden importante)
import './assets/styles/main.css'
import './assets/styles/components.css'
import './assets/styles/animations.css'

const app   = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Restaurar sesión desde localStorage antes de montar
// (debe ir después de app.use(pinia))
import { useAuthStore } from './stores/auth.store.js'
const authStore = useAuthStore()
authStore.restoreSession()

app.mount('#app')
