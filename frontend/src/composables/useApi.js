// src/composables/useApi.js
// ============================================================
//  Composable de fetch centralizado
//  Añade automáticamente la base URL y el token de autorización
//  a todas las peticiones al backend Express.
// ============================================================

import { useAuthStore } from '@/stores/auth.store.js'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function useApi() {
  const authStore = useAuthStore()

  async function request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    // Añadir token si hay sesión activa
    if (authStore.accessToken) {
      headers['Authorization'] = `Bearer ${authStore.accessToken}`
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    })

    const data = await response.json()

    // Si el servidor devuelve 401, limpiar sesión local
    if (response.status === 401) {
      authStore.clearSession()
    }

    return { ok: response.ok, status: response.status, data }
  }

  const get    = (endpoint, options = {}) =>
    request(endpoint, { ...options, method: 'GET' })

  const post   = (endpoint, body, options = {}) =>
    request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) })

  const patch  = (endpoint, body, options = {}) =>
    request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) })

  const remove = (endpoint, options = {}) =>
    request(endpoint, { ...options, method: 'DELETE' })

  return { get, post, patch, remove }
}
