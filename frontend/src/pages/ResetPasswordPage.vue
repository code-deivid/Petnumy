<!-- src/pages/ResetPasswordPage.vue -->
<!-- Vista para crear nueva contraseña tras clicar el link del email -->
<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase.js'

const router = useRouter()
const { t } = useI18n()

const password        = ref('')
const passwordConfirm = ref('')
const loading         = ref(false)
const error           = ref(null)
const exito           = ref(false)
const tokenOk         = ref(false) // El link del email es válido

onMounted(async () => {
  // Supabase incluye el token en el hash de la URL.
  // getSession() lo procesa automáticamente.
  const { data: { session } } = await supabase.auth.getSession()
  tokenOk.value = !!session
})

function validar() {
  if (!password.value || password.value.length < 6)
    return 'La contraseña debe tener al menos 6 caracteres.'
  if (password.value !== passwordConfirm.value)
    return 'Las contraseñas no coinciden.'
  return null
}

async function handleReset() {
  error.value = validar()
  if (error.value) return

  loading.value = true
  const { error: err } = await supabase.auth.updateUser({ password: password.value })
  loading.value = false

  if (err) {
    error.value = 'No se pudo actualizar la contraseña. El enlace puede haber expirado.'
  } else {
    exito.value = true
    setTimeout(() => router.replace({ name: 'login' }), 2500)
  }
}
</script>

<template>
  <div class="rp-page">
    <div class="rp-card card">

      <!-- Icono -->
      <div class="rp-icon-wrap">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      </div>

      <h1 class="rp-title">{{ t("auth.newPassword.title") }}</h1>
      <p class="rp-sub">{{ t("auth.newPassword.subtitle") }}</p>

      <!-- Link inválido o expirado -->
      <div v-if="!tokenOk" class="msg msg-error">
        El enlace no es válido o ha expirado.
        <RouterLink :to="{ name: 'login' }" style="color:var(--color-primary);font-weight:700;margin-left:0.3rem">
          {{ t('auth.newPassword.backToLogin') }}
        </RouterLink>
      </div>

      <!-- Éxito -->
      <div v-else-if="exito" class="msg msg-success">
        ✅ Contraseña actualizada correctamente. Redirigiendo al login…
      </div>

      <!-- Formulario -->
      <template v-else>
        <div v-if="error" class="msg msg-error">{{ error }}</div>

        <div class="rp-form">
          <div class="input-group">
            <label class="label" for="rp-pass">{{ t("auth.newPassword.password") }}</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input
                id="rp-pass"
                v-model="password"
                type="password"
                class="input"
                :placeholder="t('auth.newPassword.passwordPlaceholder')"
                @keyup.enter="handleReset"
              />
            </div>
          </div>

          <div class="input-group">
            <label class="label" for="rp-pass2">{{ t("auth.newPassword.confirm") }}</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input
                id="rp-pass2"
                v-model="passwordConfirm"
                type="password"
                class="input"
                :placeholder="t('auth.newPassword.confirmPlaceholder')"
                @keyup.enter="handleReset"
              />
            </div>
          </div>

          <button
            type="button"
            class="btn btn-primary btn-block"
            :disabled="loading"
            @click="handleReset"
            style="margin-top:0.5rem"
          >
            <span v-if="loading" class="spinner" style="width:16px;height:16px;border-width:2px"/>
            <span v-else>{{ t("auth.newPassword.save") }}</span>
          </button>

          <p class="rp-back">
            <RouterLink :to="{ name: 'login' }" style="color:var(--color-primary);font-weight:700">
              {{ t('auth.newPassword.backToLogin') }}
            </RouterLink>
          </p>
        </div>
      </template>

    </div>
  </div>
</template>

<style scoped>
.rp-page {
  min-height: calc(100vh - var(--navbar-height));
  display: flex; align-items: center; justify-content: center;
  padding: 2rem 1rem;
}
.rp-card {
  width: 100%; max-width: 420px;
  padding: 2.5rem 2rem;
  display: flex; flex-direction: column; gap: 1.1rem;
  box-shadow: var(--shadow-lg);
  align-items: center; text-align: center;
}
.rp-icon-wrap {
  width: 60px; height: 60px; border-radius: 50%;
  background: var(--color-primary-light);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 0.25rem;
}
.rp-title {
  font-family: var(--font-display); font-weight: 800;
  font-size: 1.5rem; color: var(--color-text); margin: 0;
}
.rp-sub { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }
.rp-form { width: 100%; display: flex; flex-direction: column; gap: 0.9rem; text-align: left; }
.rp-back { text-align: center; font-size: 0.85rem; margin: 0; }
</style>
