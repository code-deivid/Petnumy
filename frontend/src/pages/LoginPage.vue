<!-- src/pages/LoginPage.vue — Design v5 -->
<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth.js'
import { supabase } from '@/lib/supabase.js'

const route = useRoute()
const { t } = useI18n()
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

// ── Google OAuth ───────────────────────────────────────────────
const loadingGoogle = ref(false)
const googleError   = ref(null)

async function handleGoogle() {
  loadingGoogle.value = true
  googleError.value   = null
  const { error: err } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  if (err) {
    // Traducir el error de Supabase a español
    const msg = err.message?.toLowerCase() || ''
    if (msg.includes('not enabled') || msg.includes('unsupported provider') || msg.includes('provider is not enabled')) {
      googleError.value = t('auth.login.googleNotConfigured')
    } else {
      googleError.value = t('auth.login.googleError')
    }
    loadingGoogle.value = false
  }
  // Si no hay error, Supabase redirige automáticamente.
}

// ── Modal Olvidé Contraseña ────────────────────────────────────
const modalReset   = ref(false)
const resetEmail   = ref('')
const resetLoading = ref(false)
const resetError   = ref(null)
const resetOk      = ref(false)

function abrirReset() {
  resetEmail.value   = ''
  resetError.value   = null
  resetOk.value      = false
  modalReset.value   = true
}
function cerrarReset() {
  modalReset.value = false
}

async function enviarReset() {
  resetError.value = null
  if (!resetEmail.value.trim()) {
    resetError.value = t('auth.reset.emailRequired')
    return
  }
  resetLoading.value = true
  const { error: err } = await supabase.auth.resetPasswordForEmail(
    resetEmail.value.trim(),
    { redirectTo: `${window.location.origin}/reset-password` }
  )
  resetLoading.value = false
  if (err) {
    resetError.value = 'No se pudo enviar el correo. Verifica que el email sea correcto.'
  } else {
    resetOk.value = true
  }
}
</script>

<template>
  <div class="login-page">

    <!-- ── Panel izquierdo — solo desktop ─────────────────── -->
    <div class="login-left" aria-hidden="true">
      <div class="left-brand">
        <span class="left-brand-name">Petnumy</span>
      </div>
      <div class="left-content">
        <h1 class="left-title">Su salud,<br>tu tranquilidad.</h1>
        <p class="left-desc">
          Cuidar de tu mascota, más fácil que nunca. Vacunas,
          citas, historial y consejos — todo en un solo lugar acogedor.
        </p>
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
          <p class="form-subtitle">{{ t("auth.login.subtitle") }}</p>
        </div>

        <!-- Mensajes -->
        <Transition name="fade">
          <div v-if="successMessage" class="msg msg-success">{{ successMessage }}</div>
        </Transition>
        <Transition name="fade">
          <div v-if="error || googleError" class="msg msg-error">{{ error || googleError }}</div>
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
                :placeholder="t('auth.login.emailPlaceholder')"
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
            <button type="button" class="forgot-link" @click="abrirReset">
              {{ t("auth.login.forgotPassword") }}
            </button>
          </div>

          <button
            type="button"
            class="btn btn-primary btn-block btn-submit"
            :disabled="loading"
            @click="handleSubmit"
          >
            <span v-if="loading" class="spinner" style="width:16px;height:16px;border-width:2px"/>
            <span v-else>{{ t("auth.login.submit") }}</span>
          </button>

        </div>

        <!-- Separador -->
        <div class="divider-label">{{ t("auth.login.orWith") }}</div>

        <!-- Botón Google -->
        <button type="button" class="btn-social" :disabled="loadingGoogle" @click="handleGoogle">
          <span v-if="loadingGoogle" class="spinner" style="width:16px;height:16px;border-width:2px;border-top-color:var(--color-teal)"/>
          <template v-else>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Inicia Sesión con Google
          </template>
        </button>

        <!-- Footer -->
        <p class="auth-footer">
          {{ t("auth.login.noAccount") }}
          <RouterLink :to="{ name: 'registro' }" class="auth-footer-link">{{ t("auth.login.registerLink") }}</RouterLink>
        </p>

      </div>
    </div>

    <!-- ══ MODAL OLVIDÉ CONTRASEÑA ══════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-slide">
        <div v-if="modalReset" class="reset-overlay" @click.self="cerrarReset">
          <div class="modal-card card" style="max-width:420px;width:92%">

            <!-- Header -->
            <div class="modal-header">
              <div style="display:flex;align-items:center;gap:0.5rem">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <span style="font-family:var(--font-display);font-weight:700;font-size:0.95rem">
                  {{ t("auth.reset.title") }}
                </span>
              </div>
              <button type="button" class="modal-close-btn" @click="cerrarReset">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="modal-body" style="padding:1.5rem">

              <!-- Éxito -->
              <div v-if="resetOk" class="msg msg-success" style="margin-bottom:0">
                ✅ {{ t("auth.reset.successMsg") }}
              </div>

              <!-- Formulario -->
              <template v-else>
                <p style="color:var(--color-text-soft);font-size:0.875rem;margin-bottom:1.25rem;line-height:1.6">
                  {{ t("auth.reset.desc") }}
                </p>

                <div v-if="resetError" class="msg msg-error" style="margin-bottom:1rem">{{ resetError }}</div>

                <div class="input-group">
                  <label class="label" for="reset-email">Correo Electrónico</label>
                  <div class="input-wrapper">
                    <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <input
                      id="reset-email"
                      v-model="resetEmail"
                      type="email"
                      class="input"
                      :placeholder="t('auth.reset.email')"
                      @keyup.enter="enviarReset"
                    />
                  </div>
                </div>
              </template>
            </div>

            <!-- Footer -->
            <div class="modal-footer" style="padding:1rem 1.5rem;display:flex;justify-content:flex-end;gap:0.75rem">
              <button type="button" class="btn btn-ghost btn-sm" @click="cerrarReset">
                {{ resetOk ? 'Cerrar' : 'Cancelar' }}
              </button>
              <button
                v-if="!resetOk"
                type="button"
                class="btn btn-primary btn-sm"
                :disabled="resetLoading"
                @click="enviarReset"
              >
                <span v-if="resetLoading" class="spinner" style="width:13px;height:13px;border-width:2px"/>
                <span v-else>{{ t("auth.reset.send") }}</span>
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* ── Página completa ─────────────────────────────────────────── */
.login-page {
  min-height: calc(100vh - var(--navbar-height));
  display: flex;
  align-items: stretch;
}

/* ── Panel izquierdo ─────────────────────────────────────────── */
.login-left {
  display: none;
  flex: 1;
  padding: 3.5rem var(--page-padding) 3.5rem 2.5rem;
  flex-direction: column;
  justify-content: center;
  gap: 2.5rem;
}
.left-brand { display: flex; align-items: center; gap: 0.6rem; }
.left-brand-name { font-family: var(--font-display); font-weight: 800; font-size: 1.2rem; color: var(--color-text); }
.left-content { display: flex; flex-direction: column; gap: 1.25rem; }
.left-title { font-size: clamp(2rem, 3.5vw, 2.75rem); line-height: 1.15; color: var(--color-text); letter-spacing: -0.5px; }
.left-desc { font-size: 0.9rem; max-width: 400px; color: var(--color-text-soft); line-height: 1.65; margin: 0; }
.left-stats { display: flex; gap: 2rem; padding-top: 0.5rem; }
.stat { display: flex; flex-direction: column; gap: 0.15rem; }
.stat-value { font-family: var(--font-display); font-weight: 800; font-size: 1.5rem; color: var(--color-primary); line-height: 1; }
.stat-label { font-size: 0.72rem; font-family: var(--font-display); font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: var(--color-text-muted); }

/* ── Panel derecho ───────────────────────────────────────────── */
.login-right {
  display: flex; align-items: center; justify-content: center;
  padding: 2rem var(--page-padding); flex: 0 0 auto;
}
.login-card {
  width: 100%; max-width: 420px; padding: 2.25rem;
  display: flex; flex-direction: column; gap: 1.2rem;
  box-shadow: var(--shadow-lg);
}

/* Formulario */
.form-head { text-align: center; }
.form-title { font-size: 1.75rem; font-family: var(--font-display); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text); margin-bottom: 0.3rem; }
.form-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }
.auth-form { display: flex; flex-direction: column; gap: 0.9rem; }

.forgot-row { display: flex; justify-content: flex-end; margin-top: -0.25rem; }
.forgot-link {
  background: none; border: none; padding: 0; cursor: pointer;
  font-size: 0.8rem; color: var(--color-primary);
  font-family: var(--font-display); font-weight: 600;
  transition: color var(--transition-fast);
}
.forgot-link:hover { color: var(--color-primary-dark); }

.btn-submit { margin-top: 0.35rem; font-size: 0.9375rem; letter-spacing: 0.4px; }

/* Separador */
.divider-label {
  display: flex; align-items: center; gap: 0.75rem;
  font-size: 0.8rem; color: var(--color-text-muted);
}
.divider-label::before, .divider-label::after {
  content: ''; flex: 1; height: 1px; background: var(--color-border);
}

/* Botón Google */
.btn-social {
  display: flex; align-items: center; justify-content: center; gap: 0.6rem;
  width: 100%; padding: 0.75rem 1.5rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  font-family: var(--font-display); font-weight: 700; font-size: 0.9rem;
  color: var(--color-text-soft); cursor: pointer;
  transition: all var(--transition-fast);
}
.btn-social:hover:not(:disabled) {
  border-color: var(--color-teal);
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
}
.btn-social:disabled { opacity: 0.6; cursor: not-allowed; }

/* Footer */
.auth-footer { text-align: center; font-size: 0.85rem; color: var(--color-text-muted); margin: 0; }
.auth-footer-link { color: var(--color-primary); font-family: var(--font-display); font-weight: 700; transition: color var(--transition-fast); }
.auth-footer-link:hover { color: var(--color-primary-dark); }

/* Modal */
.modal-close-btn {
  background: none; border: none; cursor: pointer; padding: 0.3rem;
  color: var(--color-text-muted); border-radius: var(--radius-sm);
  display: flex; align-items: center; transition: color var(--transition-fast);
}
.modal-close-btn:hover { color: var(--color-text); }

/* Desktop */
@media (min-width: 900px) {
  .login-left { display: flex; max-width: 520px; }
  .login-right { flex: 0 0 460px; padding: 2rem 2rem 2rem 0; justify-content: center; align-items: center; }
  .login-card { max-width: 100%; }
  .login-page { justify-content: center; align-items: center; padding: 2rem var(--page-padding); }
}

/* Móvil */
@media (max-width: 480px) {
  .login-right { align-items: flex-start; padding-top: 1.5rem; }
  .login-card { padding: 1.75rem 1.25rem; }
}

/* ── Overlay modal recuperar contraseña ── */
.reset-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30, 20, 14, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
</style>
