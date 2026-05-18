<!-- src/pages/RegistroPage.vue -->
<script setup>
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth.js'

const { registro, loading, error } = useAuth()
const nombre    = ref('')
const apellidos = ref('')
const email     = ref('')
const password  = ref('')
const confirmar = ref('')
const formError = ref(null)

function validate() {
  if (!nombre.value.trim())     return 'El nombre es obligatorio'
  if (!email.value.trim())      return 'El email es obligatorio'
  if (!password.value)          return 'La contraseña es obligatoria'
  if (password.value.length < 6) return 'Mínimo 6 caracteres'
  if (password.value !== confirmar.value) return 'Las contraseñas no coinciden'
  return null
}
async function handleSubmit() {
  formError.value = validate()
  if (formError.value) return
  await registro(nombre.value.trim(), apellidos.value.trim() || undefined, email.value.trim(), password.value)
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card card">

      <div class="auth-head">
        <h1>Crear cuenta</h1>
        <p>Únete y gestiona la salud de tus mascotas</p>
      </div>

      <Transition name="fade">
        <div v-if="error" class="msg msg-error">{{ error }}</div>
      </Transition>

      <div class="auth-form">

        <div class="name-row">
          <div class="input-group">
            <label class="label" for="nombre">Nombre *</label>
            <input id="nombre" v-model="nombre" type="text" placeholder="María" class="input" autocomplete="given-name"/>
          </div>
          <div class="input-group">
            <label class="label" for="apellidos">Apellidos</label>
            <input id="apellidos" v-model="apellidos" type="text" placeholder="García" class="input" autocomplete="family-name"/>
          </div>
        </div>

        <div class="input-group">
          <label class="label" for="email">Correo electrónico *</label>
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <input id="email" v-model="email" type="email" placeholder="tu@email.com" class="input" autocomplete="email"/>
          </div>
        </div>

        <div class="input-group">
          <label class="label" for="password">Contraseña *</label>
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <input id="password" v-model="password" type="password" placeholder="Mínimo 6 caracteres" class="input" autocomplete="new-password"/>
          </div>
        </div>

        <div class="input-group">
          <label class="label" for="confirmar">Confirmar contraseña *</label>
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <input id="confirmar" v-model="confirmar" type="password" placeholder="Repite la contraseña" class="input" :class="{ 'input-error': formError?.includes('contraseña') }" autocomplete="new-password" @keyup.enter="handleSubmit"/>
          </div>
          <span v-if="formError" class="input-error-msg">{{ formError }}</span>
        </div>

        <button class="btn btn-primary btn-block" :disabled="loading" @click="handleSubmit">
          <span v-if="loading" class="spinner" style="width:16px;height:16px;border-width:2px"/>
          <span v-else>Crear cuenta</span>
        </button>

      </div>

      <div class="divider-label">o regístrate con</div>

      <button class="btn-social" disabled>
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Continuar con Google
      </button>

      <p class="auth-footer">
        ¿Ya tienes cuenta?
        <RouterLink :to="{ name: 'login' }" class="auth-footer-link">Iniciar sesión</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - var(--navbar-height));
  display: flex; align-items: center; justify-content: center;
  padding: 2rem var(--page-padding);
}
.auth-card {
  width: 100%; max-width: 460px; padding: 2.25rem;
  display: flex; flex-direction: column; gap: 1.25rem;
  box-shadow: var(--shadow-lg);
}
.auth-head { text-align: center; }
.auth-head h1 { font-size: 1.65rem; margin-bottom: 0.3rem; }
.auth-head p  { font-size: 0.875rem; margin: 0; }

.auth-form { display: flex; flex-direction: column; gap: 1rem; }

.name-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

.btn-social {
  width: 100%; padding: 0.7rem 1rem; border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border); background: var(--color-surface);
  display: flex; align-items: center; justify-content: center; gap: 0.6rem;
  font-family: var(--font-display); font-weight: 600; font-size: 0.875rem;
  color: var(--color-text-soft); opacity: 0.6; cursor: not-allowed;
}
.auth-footer { text-align: center; font-size: 0.85rem; color: var(--color-text-muted); margin: 0; }
.auth-footer-link { color: var(--color-primary); font-weight: 700; }

@media (max-width: 400px) {
  .name-row { grid-template-columns: 1fr; }
  .auth-card { padding: 1.75rem 1.25rem; }
}
</style>
