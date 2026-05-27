<!-- src/pages/AuthCallbackPage.vue -->
<!-- Maneja el redirect de Supabase OAuth (Google) -->
<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth.store.js'
import { useApi } from '@/composables/useApi.js'

const router    = useRouter()
const authStore = useAuthStore()
const { get }   = useApi()

onMounted(async () => {
  // Supabase escribe la sesión en la URL hash tras OAuth — getSession() la extrae.
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    // Algo falló: redirigir al login con aviso
    router.replace({ name: 'login', query: { error: 'oauth' } })
    return
  }

  // Guardar tokens y datos básicos de sesión
  // El store espera el formato { usuario, session: { access_token, refresh_token } }
  // Con OAuth, el usuario en public.usuario puede no existir aún.
  // Intentamos obtenerlo de nuestra API.
  authStore.accessToken  = session.access_token
  authStore.refreshToken = session.refresh_token

  // Persistir manualmente por si setSession no aplica directamente
  localStorage.setItem('petnumy_token',   session.access_token)
  localStorage.setItem('petnumy_refresh', session.refresh_token)

  // Intentar cargar el perfil de usuario desde nuestra API
  try {
    const { ok, data } = await get('/api/auth/me')
    if (ok && data.usuario) {
      authStore.setUsuario(data.usuario)
      localStorage.setItem('petnumy_usuario', JSON.stringify(data.usuario))
    } else {
      // Perfil mínimo desde los datos de Supabase session
      const userData = {
        id:       session.user.id,
        email:    session.user.email,
        nombre:   session.user.user_metadata?.full_name?.split(' ')[0] || session.user.email,
        apellidos:session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        foto:     session.user.user_metadata?.avatar_url || null,
      }
      authStore.setUsuario(userData)
      localStorage.setItem('petnumy_usuario', JSON.stringify(userData))
    }
  } catch {
    // Si falla la carga del perfil, usamos datos mínimos
    const userData = {
      id:    session.user.id,
      email: session.user.email,
      nombre: session.user.email,
    }
    authStore.setUsuario(userData)
    localStorage.setItem('petnumy_usuario', JSON.stringify(userData))
  }

  router.replace({ name: 'mis-mascotas' })
})
</script>

<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem">
    <div class="spinner" style="width:36px;height:36px;border-width:3px" />
    <p style="color:var(--color-text-muted);font-family:var(--font-display);font-weight:600;font-size:0.9rem">
      Iniciando sesión…
    </p>
  </div>
</template>
