<!-- src/pages/LoginPage.vue -->

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'

const route = useRoute()
const { login, loading, error } = useAuth()

const email    = ref('')
const password = ref('')

// Mensaje de éxito si viene de registro
const successMessage = computed(() =>
  route.query.registered === 'true'
    ? '¡Cuenta creada! Ya puedes iniciar sesión 🎉'
    : null
)

// Validación local básica
const formError = ref(null)

function validate() {
  if (!email.value.trim())    return 'El email es obligatorio'
  if (!password.value.trim()) return 'La contraseña es obligatoria'
  return null
}

async function handleSubmit() {
  formError.value = validate()
  if (formError.value) return
  await login(email.value.trim(), password.value)
}
</script>

<template>
  <div class="auth-page flex items-center justify-center">
    <div class="auth-card card">

      <!-- Cabecera -->
      <div class="auth-header flex flex-col items-center gap-2">
        <span class="auth-icon">🐾</span>
        <h1 class="auth-title">¡Bienvenido de nuevo!</h1>
        <p class="auth-subtitle">Inicia sesión para gestionar a tus mascotas</p>
      </div>

      <!-- Mensaje de registro exitoso -->
      <Transition name="fade">
        <div v-if="successMessage" class="auth-success">
          {{ successMessage }}
        </div>
      </Transition>

      <!-- Error del servidor -->
      <Transition name="fade">
        <div v-if="error" class="auth-error">
          {{ error }}
        </div>
      </Transition>

      <!-- Formulario -->
      <div class="auth-form flex flex-col gap-4">

        <div class="flex flex-col gap-1">
          <label class="label" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="tu@email.com"
            class="input"
            :class="{ 'input-error': formError && !email }"
            autocomplete="email"
            @keyup.enter="handleSubmit"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="label" for="password">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="input"
            :class="{ 'input-error': formError && !password }"
            autocomplete="current-password"
            @keyup.enter="handleSubmit"
          />
          <span v-if="formError" class="input-message-error">
            {{ formError }}
          </span>
        </div>

        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="handleSubmit"
        >
          <span v-if="loading" class="spinner" style="width:18px;height:18px;border-width:2px" />
          <span v-else>Entrar</span>
        </button>

      </div>

      <!-- Footer del formulario -->
      <p class="auth-footer-text">
        ¿Aún no tienes cuenta?
        <RouterLink :to="{ name: 'registro' }" class="auth-link">
          Regístrate aquí
        </RouterLink>
      </p>

    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - var(--navbar-height));
  padding: 2rem var(--page-padding);
  background-color: var(--color-bg);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 2.25rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Cabecera */
.auth-header {
  text-align: center;
}

.auth-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.auth-title {
  font-size: 1.5rem;
  color: var(--color-text);
}

.auth-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* Mensajes */
.auth-success {
  background-color: #E8F7EC;
  color: #3A8A51;
  border: 1.5px solid #B6DFC0;
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-family: var(--font-display);
  font-weight: 600;
  text-align: center;
}

.auth-error {
  background-color: #FDEAEA;
  color: #B04040;
  border: 1.5px solid #F0BABA;
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-family: var(--font-display);
  font-weight: 600;
  text-align: center;
}

/* Footer */
.auth-footer-text {
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

.auth-link {
  color: var(--color-primary);
  font-family: var(--font-display);
  font-weight: 700;
  transition: color var(--transition-fast);
}

.auth-link:hover {
  color: var(--color-primary-dark);
}
</style>
