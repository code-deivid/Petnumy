// src/composables/useAuth.js

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'
import { useAuthStore } from '@/stores/auth.store.js'

// ── Helper: traducir mensajes de error de Supabase Auth ───────
// Centraliza todas las traducciones en un solo lugar.
// Recibe el mensaje en inglés que devuelve Supabase/backend
// y devuelve el equivalente en español para el usuario.
function traducirErrorAuth(mensaje) {
  if (!mensaje) return 'Ha ocurrido un error. Inténtalo de nuevo.'

  const m = mensaje.toLowerCase()

  if (m.includes('already been registered') || m.includes('already registered') || m.includes('already exists') || m.includes('user already')) {
    return 'Ya existe una cuenta registrada con este correo electrónico.'
  }
  if (m.includes('invalid login credentials') || m.includes('invalid credentials') || m.includes('wrong password') || m.includes('incorrect')) {
    return 'Correo electrónico o contraseña incorrectos.'
  }
  if (m.includes('email not confirmed') || m.includes('not confirmed')) {
    return 'Debes confirmar tu correo electrónico antes de iniciar sesión.'
  }
  if (m.includes('email') && (m.includes('invalid') || m.includes('format'))) {
    return 'El formato del correo electrónico no es válido.'
  }
  if (m.includes('password') && m.includes('weak')) {
    return 'La contraseña es demasiado débil. Usa al menos 6 caracteres.'
  }
  if (m.includes('password') && m.includes('short')) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.'
  }
  if (m.includes('network') || m.includes('fetch') || m.includes('connection')) {
    return 'Error de conexión. Comprueba tu internet e inténtalo de nuevo.'
  }

  // Fallback genérico
  return 'Ha ocurrido un error. Inténtalo de nuevo.'
}

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

    if (!ok) {
      loading.value = false
      error.value = traducirErrorAuth(data.message)
      return false
    }

    authStore.setSession(data)

    // Post-login: consultar mascotas para decidir destino
    try {
      const { ok: okM, data: dataM } = await api.get('/api/mascotas')
      loading.value = false

      if (okM && dataM.total === 0) {
        router.push({ name: 'nueva-mascota' })
      } else {
        router.push({ name: 'mis-mascotas' })
      }
    } catch {
      loading.value = false
      router.push({ name: 'mis-mascotas' })
    }

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
      error.value = traducirErrorAuth(data.message)
      return false
    }

    router.push({ name: 'login', query: { registered: 'true' } })
    return true
  }

  // ── Logout ─────────────────────────────────────────────────
  async function logout() {
    await api.post('/api/auth/logout', {})
    authStore.clearSession()
    router.push({ name: 'landing' })
  }

  return { login, registro, logout, loading, error }
}
