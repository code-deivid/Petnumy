<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuth } from "@/composables/useAuth.js";
import { supabase } from "@/lib/supabase.js";

const route = useRoute();
const { t } = useI18n();
const { login, loading, error } = useAuth();

const email = ref("");
const password = ref("");
const formError = ref(null);

const successMessage = computed(() =>
  route.query.registered === "true" ? t("auth.register.success") : null,
);

function validate() {
  if (!email.value.trim()) return t("auth.validation.emailRequired");
  if (!password.value.trim()) return t("auth.validation.passwordRequired");
  return null;
}
async function handleSubmit() {
  formError.value = validate();
  if (formError.value) return;
  await login(email.value.trim(), password.value);
}

// ── Google OAuth ───────────────────────────────────────────────
const loadingGoogle = ref(false);
const googleError = ref(null);

async function handleGoogle() {
  loadingGoogle.value = true;
  googleError.value = null;
  const { error: err } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (err) {
    // Traducir el error de Supabase a español
    const msg = err.message?.toLowerCase() || "";
    if (
      msg.includes("not enabled") ||
      msg.includes("unsupported provider") ||
      msg.includes("provider is not enabled")
    ) {
      googleError.value = t("auth.login.googleNotConfigured");
    } else {
      googleError.value = t("auth.login.googleError");
    }
    loadingGoogle.value = false;
  }
  // Si no hay error, Supabase redirige automáticamente.
}

// ── Modal Olvidé Contraseña ────────────────────────────────────
const modalReset = ref(false);
const resetEmail = ref("");
const resetLoading = ref(false);
const resetError = ref(null);
const resetOk = ref(false);

function abrirReset() {
  resetEmail.value = "";
  resetError.value = null;
  resetOk.value = false;
  modalReset.value = true;
}
function cerrarReset() {
  modalReset.value = false;
}

async function enviarReset() {
  resetError.value = null;
  if (!resetEmail.value.trim()) {
    resetError.value = t("auth.reset.emailRequired");
    return;
  }
  resetLoading.value = true;
  const { error: err } = await supabase.auth.resetPasswordForEmail(
    resetEmail.value.trim(),
    { redirectTo: `${window.location.origin}/reset-password` },
  );
  resetLoading.value = false;
  if (err) {
    resetError.value =
      "No se pudo enviar el correo. Verifica que el email sea correcto.";
  } else {
    resetOk.value = true;
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
        <h1 class="left-title" v-html="t('landing.title')"></h1>
        <p class="left-desc">
          Cuidar de tu mascota, más fácil que nunca. Vacunas, citas, historial y
          consejos — todo en un solo lugar acogedor.
        </p>
        <div class="left-stats">
          <div class="stat">
            <span class="stat-value">12k</span>
            <span class="stat-label">{{ t("landing.families") }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">380+</span>
            <span class="stat-label">{{ t("landing.clinics") }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">4.9</span>
            <span class="stat-label">{{ t("landing.rating") }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Panel derecho — formulario ────────────────────── -->
    <div class="login-right">
      <div class="login-card card">
        <!-- Cabecera -->
        <div class="form-head">
          <h2 class="form-title">{{ t("auth.login.title") }}</h2>
          <p class="form-subtitle">{{ t("auth.login.subtitle") }}</p>
        </div>

        <!-- Mensajes -->
        <Transition name="fade">
          <div v-if="successMessage" class="msg msg-success">
            {{ successMessage }}
          </div>
        </Transition>
        <Transition name="fade">
          <div v-if="error || googleError" class="msg msg-error">
            {{ error || googleError }}
          </div>
        </Transition>

        <!-- Formulario -->
        <div class="auth-form">
          <div class="input-group">
            <label class="label" for="login-email">{{ t("auth.email") }}</label>
            <div class="input-wrapper">
              <Icon
                class="input-icon"
                :icon="$icons.mail"
                width="18"
                height="18"
              />
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
            <label class="label" for="login-password">{{
              t("auth.password")
            }}</label>
            <div class="input-wrapper">
              <Icon
                class="input-icon"
                :icon="$icons.lock"
                width="18"
                height="18"
              />
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
            <span v-if="formError" class="input-error-msg">{{
              formError
            }}</span>
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
            <span
              v-if="loading"
              class="spinner"
              style="width: 16px; height: 16px; border-width: 2px"
            />
            <span v-else>{{ t("auth.login.submit") }}</span>
          </button>
        </div>

        <!-- Separador -->
        <div class="divider-label">{{ t("auth.login.orWith") }}</div>

        <!-- Botón Google -->
        <button
          type="button"
          class="btn-social"
          :disabled="loadingGoogle"
          @click="handleGoogle"
        >
          <span
            v-if="loadingGoogle"
            class="spinner"
            style="
              width: 16px;
              height: 16px;
              border-width: 2px;
              border-top-color: var(--color-teal);
            "
          />
          <template v-else>
            <Icon :icon="$icons.google" width="18" height="18" />
            Inicia Sesión con Google
          </template>
        </button>

        <!-- Footer -->
        <p class="auth-footer">
          {{ t("auth.login.noAccount") }}
          <RouterLink :to="{ name: 'registro' }" class="auth-footer-link">{{
            t("auth.login.registerLink")
          }}</RouterLink>
        </p>
      </div>
    </div>

    <!-- ══ MODAL OLVIDÉ CONTRASEÑA ══════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-slide">
        <div v-if="modalReset" class="reset-overlay" @click.self="cerrarReset">
          <div class="modal-card card" style="max-width: 420px; width: 92%">
            <!-- Header -->
            <div class="modal-header">
              <div style="display: flex; align-items: center; gap: 0.5rem">
                <Icon :icon="$icons.lock" width="18" height="18" />
                <span
                  style="
                    font-family: var(--font-display);
                    font-weight: 700;
                    font-size: 0.95rem;
                  "
                >
                  {{ t("auth.reset.title") }}
                </span>
              </div>
              <button
                type="button"
                class="modal-close-btn"
                @click="cerrarReset"
              >
                <Icon :icon="$icons.close" width="16" height="16" />
              </button>
            </div>

            <!-- Body -->
            <div class="modal-body" style="padding: 1.5rem">
              <!-- Éxito -->
              <div
                v-if="resetOk"
                class="msg msg-success"
                style="margin-bottom: 0"
              >
                ✅ {{ t("auth.reset.successMsg") }}
              </div>

              <!-- Formulario -->
              <template v-else>
                <p
                  style="
                    color: var(--color-text-soft);
                    font-size: 0.875rem;
                    margin-bottom: 1.25rem;
                    line-height: 1.6;
                  "
                >
                  {{ t("auth.reset.desc") }}
                </p>

                <div
                  v-if="resetError"
                  class="msg msg-error"
                  style="margin-bottom: 1rem"
                >
                  {{ resetError }}
                </div>

                <div class="input-group">
                  <label class="label" for="reset-email">{{
                    t("auth.email")
                  }}</label>
                  <div class="input-wrapper">
                    <Icon
                      class="input-icon"
                      :icon="$icons.mail"
                      width="18"
                      height="18"
                    />
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
            <div
              class="modal-footer"
              style="
                padding: 1rem 1.5rem;
                display: flex;
                justify-content: flex-end;
                gap: 0.75rem;
              "
            >
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                @click="cerrarReset"
              >
                {{ resetOk ? t("common.close") : t("common.cancel") }}
              </button>
              <button
                v-if="!resetOk"
                type="button"
                class="btn btn-primary btn-sm"
                :disabled="resetLoading"
                @click="enviarReset"
              >
                <span
                  v-if="resetLoading"
                  class="spinner"
                  style="width: 13px; height: 13px; border-width: 2px"
                />
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
.left-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
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

/* ── Panel derecho ───────────────────────────────────────────── */
.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem var(--page-padding);
  flex: 0 0 auto;
}
.login-card {
  width: 100%;
  max-width: 420px;
  padding: 2.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  box-shadow: var(--shadow-lg);
}

/* Formulario */
.form-head {
  text-align: center;
}
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
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--color-primary);
  font-family: var(--font-display);
  font-weight: 600;
  transition: color var(--transition-fast);
}
.forgot-link:hover {
  color: var(--color-primary-dark);
}

.btn-submit {
  margin-top: 0.35rem;
  font-size: 0.9375rem;
  letter-spacing: 0.4px;
}

/* Separador */
.divider-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
.divider-label::before,
.divider-label::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

/* Botón Google */
.btn-social {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text-soft);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn-social:hover:not(:disabled) {
  border-color: var(--color-teal);
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
}
.btn-social:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Footer */
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
.auth-footer-link:hover {
  color: var(--color-primary-dark);
}

/* Modal */
.modal-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.3rem;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  transition: color var(--transition-fast);
}
.modal-close-btn:hover {
  color: var(--color-text);
}

/* Desktop */
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
  .login-page {
    justify-content: center;
    align-items: center;
    padding: 2rem var(--page-padding);
  }
}

/* Móvil */
@media (max-width: 480px) {
  .login-right {
    align-items: flex-start;
    padding-top: 1.5rem;
  }
  .login-card {
    padding: 1.75rem 1.25rem;
  }
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
