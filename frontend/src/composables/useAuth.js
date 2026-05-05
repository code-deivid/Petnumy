// src/composables/useAuth.js
// ============================================================
//  Composable de autenticación
//  Encapsula login, registro y logout contra el backend Express.
//  Los componentes solo llaman a estas funciones y reaccionan
//  al estado (loading, error).
// ============================================================

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'
import { useAuthStore } from '@/stores/auth.store.js'

export function useAuth() {
  const api       = useApi()
  const router    = useRouter()
  const authStore = useAuthStore()

  const loading = ref(false)
  const error   = ref(null)

  // ── Login ──────────────────────────────────────────────────
  async function login(email, password) {
    loading.value = true
    error.value   = null

    const { ok, data } = await api.post('/api/auth/login', { email, password })

    loading.value = false

    if (!ok) {
      error.value = data.message || 'Error al iniciar sesión'
      return false
    }

    authStore.setSession(data)
    router.push({ name: 'clinicas' })
    return true
  }

  // ── Registro ───────────────────────────────────────────────
  async function registro(nombre, apellidos, email, password) {
    loading.value = true
    error.value   = null

    const { ok, data } = await api.post('/api/auth/registro', {
      nombre,
      apellidos,
      email,
      password
    })

    loading.value = false

    if (!ok) {
      error.value = data.message || 'Error al crear la cuenta'
      return false
    }

    // Tras registro, redirigimos a login con mensaje de éxito
    router.push({ name: 'login', query: { registered: 'true' } })
    return true
  }

  // ── Logout ─────────────────────────────────────────────────
  async function logout() {
    await api.post('/api/auth/logout', {})
    authStore.clearSession()
    router.push({ name: 'home' })
  }

  return { login, registro, logout, loading, error }
}
