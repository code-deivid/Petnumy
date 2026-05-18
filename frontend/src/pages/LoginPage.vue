<!-- src/pages/LoginPage.vue — Design v5 -->
<!-- ⚠️  SCRIPT SETUP: 100% intacto — sin cambios de lógica -->
<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'

const route = useRoute()
const { login, loading, error } = useAuth()

const email     = ref('')
const password  = ref('')
const formError = ref(null)

const successMessage = computed(() =>
  route.query.registered === 'true' ? '¡Cuenta creada! Ya puedes iniciar sesión.' : null
)

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
  <div class="login-page">

    <!-- ── Panel izquierdo — solo desktop ─────────────────── -->
    <div class="login-left" aria-hidden="true">
      <!-- Logo + nombre -->
      <div class="left-brand">
        <svg class="left-logo" viewBox="0 0 48 38" fill="none">
          <path d="M10 34c0-2 1-3.5 2.5-3.5h22c3.5 0 6.5 2 8.5 5l2 2.5v-4c0-1-.9-2-2-2H36v-6h-3v6H15v-6h-3v6h-2c-1 0-2-.9-2-2V22c0-2 1-3 2.5-3H38c2 0 3.5 1 3.5 3v12" fill="#3C2E1F"/>
          <rect x="32" y="16" width="12" height="10" rx="2" fill="#3C2E1F"/>
          <rect x="8" y="10" width="13" height="13" rx="3.5" fill="#3C2E1F"/>
          <rect x="4" y="7" width="9" height="11" rx="3.5" fill="#3C2E1F"/>
          <circle cx="8.5" cy="13" r="1.5" fill="#F5EFE3"/>
          <rect x="30" y="30" width="6" height="7" rx="2" fill="#3C2E1F"/>
          <rect x="18" y="30" width="6" height="7" rx="2" fill="#3C2E1F"/>
        </svg>
        <span class="left-brand-name">Petnumy</span>
      </div>

      <!-- Tagline -->
      <div class="left-content">
        <h1 class="left-title">Su salud,<br>tu tranquilidad.</h1>
        <p class="left-desc">
          Cuidar de tu mascota, más fácil que nunca. Vacunas,
          citas, historial y consejos — todo en un solo lugar acogedor.
        </p>
        <!-- Stats del prototipo -->
        <div class="left-stats">
          <div class="stat">
            <span class="stat-value">12k</span>
            <span class="stat-label">Familias</span>
          </div>
          <div class="stat">
            <span class="stat-value">380+</span>
            <span class="stat-label">Clínicas</span>
          </div>
          <div class="stat">
            <span class="stat-value">4.9</span>
            <span class="stat-label">Valoración</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Panel derecho — formulario ────────────────────── -->
    <div class="login-right">
      <div class="login-card card">

        <!-- Cabecera -->
        <div class="form-head">
          <h2 class="form-title">Iniciar Sesión</h2>
          <p class="form-subtitle">Su salud, tu tranquilidad</p>
        </div>

        <!-- Mensajes -->
        <Transition name="fade">
          <div v-if="successMessage" class="msg msg-success">{{ successMessage }}</div>
        </Transition>
        <Transition name="fade">
          <div v-if="error" class="msg msg-error">{{ error }}</div>
        </Transition>

        <!-- Formulario -->
        <div class="auth-form">

          <div class="input-group">
            <label class="label" for="login-email">Correo Electrónico</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                id="login-email"
                v-model="email"
                type="email"
                placeholder="ej: tucorreo@gmail.com"
                class="input"
                :class="{ 'input-error': formError && !email }"
                autocomplete="email"
                @keyup.enter="handleSubmit"
              />
            </div>
          </div>

          <div class="input-group">
            <label class="label" for="login-password">Contraseña</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input
                id="login-password"
                v-model="password"
                type="password"
                placeholder="••••••••"
                class="input"
                :class="{ 'input-error': formError && !password }"
                autocomplete="current-password"
                @keyup.enter="handleSubmit"
              />
            </div>
            <span v-if="formError" class="input-error-msg">{{ formError }}</span>
          </div>

          <!-- Enlace olvidé contraseña -->
          <div class="forgot-row">
            <span class="forgot-link">¿Olvidaste tu contraseña?</span>
          </div>

          <button
            class="btn btn-primary btn-block btn-submit"
            :disabled="loading"
            @click="handleSubmit"
          >
            <span v-if="loading" class="spinner" style="width:16px;height:16px;border-width:2px"/>
            <span v-else>Inicia Sesión</span>
          </button>

        </div>

        <!-- Separador -->
        <div class="divider-label">O inicia sesión con</div>

        <!-- Botón Google -->
        <button class="btn-social" disabled>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Inicia Sesión con Google
        </button>

        <!-- Footer -->
        <p class="auth-footer">
          ¿Aún no tienes cuenta?
          <RouterLink :to="{ name: 'registro' }" class="auth-footer-link">Regístrate</RouterLink>
        </p>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── Página completa ─────────────────────────────────────────── */
.login-page {
  min-height: calc(100vh - var(--navbar-height));
  display: flex;
  align-items: stretch;
}

/* ── Panel izquierdo — visible solo en desktop ───────────────── */
.login-left {
  display: none;   /* oculto en móvil */
  flex: 1;
  padding: 3.5rem var(--page-padding) 3.5rem 2.5rem;
  flex-direction: column;
  justify-content: center;
  gap: 2.5rem;
}

.left-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.left-logo {
  width: 40px;
  height: 32px;
}

.left-brand-name {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.2rem;
  color: var(--color-text);
}

.left-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.left-title {
  font-size: clamp(2rem, 3.5vw, 2.75rem);
  line-height: 1.15;
  color: var(--color-text);
  letter-spacing: -0.5px;
}

.left-desc {
  font-size: 0.9rem;
  max-width: 400px;
  color: var(--color-text-soft);
  line-height: 1.65;
  margin: 0;
}

.left-stats {
  display: flex;
  gap: 2rem;
  padding-top: 0.5rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.stat-value {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.5rem;
  color: var(--color-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.72rem;
  font-family: var(--font-display);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--color-text-muted);
}

/* ── Panel derecho — formulario ──────────────────────────────── */
.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem var(--page-padding);
  flex: 0 0 auto;
}

/* En móvil ocupa todo el ancho */
.login-card {
  width: 100%;
  max-width: 420px;
  padding: 2.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  box-shadow: var(--shadow-lg);
}

/* ── Formulario ──────────────────────────────────────────────── */
.form-head { text-align: center; }

.form-title {
  font-size: 1.75rem;
  font-family: var(--font-display);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text);
  margin-bottom: 0.3rem;
}

.form-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.forgot-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -0.25rem;
}

.forgot-link {
  font-size: 0.8rem;
  color: var(--color-primary);
  font-family: var(--font-display);
  font-weight: 600;
  cursor: pointer;
  transition: color var(--transition-fast);
}
.forgot-link:hover { color: var(--color-primary-dark); }

.btn-submit {
  margin-top: 0.35rem;
  font-size: 0.9375rem;
  letter-spacing: 0.4px;
}

.auth-footer {
  text-align: center;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0;
}

.auth-footer-link {
  color: var(--color-primary);
  font-family: var(--font-display);
  font-weight: 700;
  transition: color var(--transition-fast);
}
.auth-footer-link:hover { color: var(--color-primary-dark); }

/* ── Desktop: layout split ───────────────────────────────────── */
@media (min-width: 900px) {
  .login-left {
    display: flex;
    max-width: 520px;
  }
  .login-right {
    flex: 0 0 460px;
    padding: 2rem 2rem 2rem 0;
    justify-content: center;
    align-items: center;
  }
  .login-card {
    max-width: 100%;
  }
  /* Ajuste: los dos paneles más juntos, centrados verticalmente */
  .login-page {
    justify-content: center;
    align-items: center;
    padding: 2rem var(--page-padding);
  }
}

/* ── Móvil ───────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .login-right {
    align-items: flex-start;
    padding-top: 1.5rem;
  }
  .login-card {
    padding: 1.75rem 1.25rem;
  }
}
</style>
