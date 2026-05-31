<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAuth } from "@/composables/useAuth.js";

const { registro, loading, error } = useAuth();
const { t } = useI18n();
const nombre = ref("");
const apellidos = ref("");
const email = ref("");
const password = ref("");
const confirmar = ref("");
const formError = ref(null);

function validate() {
  if (!nombre.value.trim()) return t("auth.validation.nameRequired");
  if (!email.value.trim()) return t("auth.validation.emailRequired");
  if (!password.value) return t("auth.validation.passwordRequired");
  if (password.value.length < 6) return t("auth.validation.minPassword");
  if (password.value !== confirmar.value)
    return t("auth.validation.passwordMismatch");
  return null;
}
async function handleSubmit() {
  formError.value = validate();
  if (formError.value) return;
  await registro(
    nombre.value.trim(),
    apellidos.value.trim() || undefined,
    email.value.trim(),
    password.value,
  );
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card card">
      <div class="auth-head">
        <h1>{{ t("auth.register.title") }}</h1>
        <p>{{ t("auth.register.subtitle") }}</p>
      </div>

      <Transition name="fade">
        <div v-if="error" class="msg msg-error">{{ error }}</div>
      </Transition>

      <div class="auth-form">
        <div class="name-row">
          <div class="input-group">
            <label class="label" for="nombre"
              >{{ t("auth.register.name") }} *</label
            >
            <input
              id="nombre"
              v-model="nombre"
              type="text"
              :placeholder="t('auth.register.namePlaceholder')"
              class="input"
              autocomplete="given-name"
            />
          </div>
          <div class="input-group">
            <label class="label" for="apellidos">{{
              t("auth.register.lastName")
            }}</label>
            <input
              id="apellidos"
              v-model="apellidos"
              type="text"
              :placeholder="t('auth.register.lastNamePlaceholder')"
              class="input"
              autocomplete="family-name"
            />
          </div>
        </div>

        <div class="input-group">
          <label class="label" for="email"
            >{{ t("auth.register.email") }} *</label
          >
          <div class="input-wrapper">
            <Icon
              class="input-icon"
              :icon="$icons.mail"
              width="18"
              height="18"
            />
            <input
              id="email"
              v-model="email"
              type="email"
              :placeholder="t('auth.register.emailPlaceholder')"
              class="input"
              autocomplete="email"
            />
          </div>
        </div>

        <div class="input-group">
          <label class="label" for="password"
            >{{ t("auth.register.password") }} *</label
          >
          <div class="input-wrapper">
            <Icon
              class="input-icon"
              :icon="$icons.lock"
              width="18"
              height="18"
            />
            <input
              id="password"
              v-model="password"
              type="password"
              :placeholder="t('auth.register.passwordPlaceholder')"
              class="input"
              autocomplete="new-password"
            />
          </div>
        </div>

        <div class="input-group">
          <label class="label" for="confirmar"
            >{{ t("auth.register.confirmPassword") }} *</label
          >
          <div class="input-wrapper">
            <Icon
              class="input-icon"
              :icon="$icons.lock"
              width="18"
              height="18"
            />
            <input
              id="confirmar"
              v-model="confirmar"
              type="password"
              :placeholder="t('auth.newPassword.confirmPlaceholder')"
              class="input"
              :class="{ 'input-error': formError?.includes('contraseña') }"
              autocomplete="new-password"
              @keyup.enter="handleSubmit"
            />
          </div>
          <span v-if="formError" class="input-error-msg">{{ formError }}</span>
        </div>

        <button
          class="btn btn-primary btn-block"
          :disabled="loading"
          @click="handleSubmit"
        >
          <span
            v-if="loading"
            class="spinner"
            style="width: 16px; height: 16px; border-width: 2px"
          />
          <span v-else>{{ t("auth.register.submit") }}</span>
        </button>
      </div>

      <div class="divider-label">{{ t("auth.register.orWith") }}</div>

      <button class="btn-social" disabled>
        <Icon :icon="$icons.google" width="18" height="18" />
        Continuar con Google
      </button>

      <p class="auth-footer">
        {{ t("auth.register.hasAccount") }}
        <RouterLink :to="{ name: 'login' }" class="auth-footer-link">{{
          t("auth.register.loginLink")
        }}</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - var(--navbar-height));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem var(--page-padding);
}
.auth-card {
  width: 100%;
  max-width: 460px;
  padding: 2.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: var(--shadow-lg);
}
.auth-head {
  text-align: center;
}
.auth-head h1 {
  font-size: 1.65rem;
  margin-bottom: 0.3rem;
}
.auth-head p {
  font-size: 0.875rem;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.name-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.btn-social {
  width: 100%;
  padding: 0.7rem 1rem;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-soft);
  opacity: 0.6;
  cursor: not-allowed;
}
.auth-footer {
  text-align: center;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0;
}
.auth-footer-link {
  color: var(--color-primary);
  font-weight: 700;
}

@media (max-width: 400px) {
  .name-row {
    grid-template-columns: 1fr;
  }
  .auth-card {
    padding: 1.75rem 1.25rem;
  }
}
</style>
