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
  if (!nombre.value.trim())
    return 'El nombre es obligatorio'
  if (!email.value.trim())
    return 'El email es obligatorio'
  if (!password.value)
    return 'La contraseña es obligatoria'
  if (password.value.length < 6)
    return 'La contraseña debe tener al menos 6 caracteres'
  if (password.value !== confirmar.value)
    return 'Las contraseñas no coinciden'
  return null
}

async function handleSubmit() {
  formError.value = validate()
  if (formError.value) return
  await registro(
    nombre.value.trim(),
    apellidos.value.trim() || undefined,
    email.value.trim(),
    password.value
  )
}
</script>

<template>
  <div class="auth-page flex items-center justify-center">
    <div class="auth-card card">

      <!-- Cabecera -->
      <div class="auth-header flex flex-col items-center gap-2">
        <span class="auth-icon">🌱</span>
        <h1 class="auth-title">Crea tu cuenta</h1>
        <p class="auth-subtitle">Únete y gestiona la salud de tus mascotas</p>
      </div>

      <!-- Error del servidor -->
      <Transition name="fade">
        <div v-if="error" class="auth-error">
          {{ error }}
        </div>
      </Transition>

      <!-- Formulario -->
      <div class="auth-form flex flex-col gap-4">

        <!-- Nombre y apellidos en fila -->
        <div class="flex gap-3">
          <div class="flex flex-col gap-1" style="flex: 1">
            <label class="label" for="nombre">Nombre *</label>
            <input
              id="nombre"
              v-model="nombre"
              type="text"
              placeholder="María"
              class="input"
              autocomplete="given-name"
            />
          </div>
          <div class="flex flex-col gap-1" style="flex: 1">
            <label class="label" for="apellidos">Apellidos</label>
            <input
              id="apellidos"
              v-model="apellidos"
              type="text"
              placeholder="García"
              class="input"
              autocomplete="family-name"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="label" for="email">Email *</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="tu@email.com"
            class="input"
            autocomplete="email"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="label" for="password">Contraseña *</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            class="input"
            autocomplete="new-password"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="label" for="confirmar">Confirmar contraseña *</label>
          <input
            id="confirmar"
            v-model="confirmar"
            type="password"
            placeholder="Repite la contraseña"
            class="input"
            :class="{ 'input-error': formError?.includes('contraseña') }"
            autocomplete="new-password"
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
          <span v-else>Crear cuenta</span>
        </button>

      </div>

      <!-- Footer -->
      <p class="auth-footer-text">
        ¿Ya tienes cuenta?
        <RouterLink :to="{ name: 'login' }" class="auth-link">
          Inicia sesión
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
  max-width: 460px;
  padding: 2.25rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

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

/* Responsive: apilar nombre/apellidos en móvil */
@media (max-width: 480px) {
  .auth-card {
    padding: 1.75rem 1.25rem;
  }

  .flex.gap-3 {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
