<!-- src/components/layout/SettingsModal.vue -->
<!-- Panel de configuración: perfil, dark mode, idioma, logout -->
<!-- Diseño basado exactamente en la imagen de referencia adjunta -->
<script setup>
import PetAvatar from '@/components/ui/PetAvatar.vue'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n/index.js'
import { useAuthStore } from '@/stores/auth.store.js'

const props = defineProps({
  visible: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

const router    = useRouter()
const authStore = useAuthStore()
const { t, locale } = useI18n()

const nombreUsuario = computed(() => authStore.nombreUsuario || 'Usuario')
const iniciales     = computed(() => {
  const n = authStore.usuario?.nombre    || ''
  const a = authStore.usuario?.apellidos || ''
  return ((n[0] || '') + (a[0] || '')).toUpperCase() || 'U'
})
const fotoUsuario = computed(() => authStore.usuario?.foto || null)

// ── Dark mode ─────────────────────────────────────────────────
const isDark = ref(document.documentElement.classList.contains('dark'))

function toggleDark() {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.setItem('petnumy_theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-theme')
    localStorage.setItem('petnumy_theme', 'light')
  }
}

// ── Idioma ────────────────────────────────────────────────────
const languages = [
  { code: 'es', label: 'Español',   flag: 'ES' },
  { code: 'en', label: 'English',   flag: 'EN' },
  { code: 'va', label: 'Valencià',  flag: 'VA' }
]

const langOpen = ref(false)

const currentLang = computed(() =>
  languages.find(l => l.code === locale.value) || languages[0]
)

function selectLang(code) {
  setLocale(code)
  langOpen.value = false
}

// ── Perfil ────────────────────────────────────────────────────
function irPerfil() {
  emit('close')
  // Si existe la ruta 'perfil', navegar; si no, ir a home
  try {
    router.push({ name: 'perfil' })
  } catch {
    router.push({ name: 'home' })
  }
}

// ── Logout ────────────────────────────────────────────────────
function logout() {
  emit('close')
  authStore.clearSession()
  router.push({ name: 'landing' })
}

// Cerrar con Escape
function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}
watch(() => props.visible, (v) => {
  if (v) {
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('keydown', onKeydown)
    langOpen.value = false
  }
})
</script>

<template>
  <Transition name="settings-modal">
    <div v-if="visible" class="sm-popover" role="dialog" aria-modal="true" :aria-label="t('settings.title')">

          <!-- ── Cabecera beige con avatar ───────────────── -->
          <div class="sm-header">
            <!-- Botón cerrar -->
            <button class="sm-close" @click="$emit('close')" :aria-label="t('settings.close')">
              <Icon :icon="$icons.close" width="14" height="14" />
            </button>

            <!-- Avatar circular -->
            <PetAvatar :foto="fotoUsuario" :nombre="nombreUsuario" tipo="usuario" size="xl" />

            <!-- Saludo -->
            <p class="sm-greeting">
              {{ t('settings.hello', { name: nombreUsuario.toUpperCase() }) }}
            </p>
          </div>

          <!-- ── Cuerpo ───────────────────────────────────── -->
          <div class="sm-body">
            <p class="sm-section-label">{{ t('settings.title').toUpperCase() }}</p>

            <!-- Perfil -->
            <button class="sm-item" @click="irPerfil">
              <div class="sm-item-icon sm-item-icon--teal">
                <Icon :icon="$icons.user" width="16" height="16" />
              </div>
              <span class="sm-item-label">{{ t('settings.profile') }}</span>
              <Icon class="sm-item-arrow" :icon="$icons.chevronRight" width="13" height="13" />
            </button>

            <!-- Apariencia / dark mode -->
            <div class="sm-item sm-item--noclick">
              <div class="sm-item-icon sm-item-icon--teal">
                <Icon :icon="$icons.light" width="16" height="16" />
              </div>
              <span class="sm-item-label">{{ t('settings.darkMode') }}</span>
              <!-- Toggle dark mode -->
              <div
                class="sm-toggle"
                :class="{ 'sm-toggle--on': isDark }"
                @click="toggleDark"
                role="switch"
                :aria-checked="isDark"
                tabindex="0"
                @keydown.enter="toggleDark"
                @keydown.space.prevent="toggleDark"
              >
                <div class="sm-toggle-thumb" />
              </div>
            </div>

            <!-- Idioma -->
            <div class="sm-item sm-item--noclick sm-lang-wrap">
              <div class="sm-item-icon sm-item-icon--teal">
                <Icon :icon="$icons.language" width="16" height="16" />
              </div>
              <span class="sm-item-label">{{ t('settings.language') }}</span>

              <!-- Selector idioma inline -->
              <div class="sm-lang-selector" @click.stop="langOpen = !langOpen">
                <span class="sm-lang-badge">{{ currentLang.flag }}</span>
                <Icon :style="{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }" :icon="$icons.chevronDown" width="11" height="11" />
              </div>

              <!-- Dropdown idiomas -->
              <Transition name="lang-drop">
                <div v-if="langOpen" class="sm-lang-dropdown">
                  <button
                    v-for="lang in languages"
                    :key="lang.code"
                    class="sm-lang-opt"
                    :class="{ 'sm-lang-opt--active': lang.code === locale }"
                    @click="selectLang(lang.code)"
                  >
                    <span class="sm-lang-opt-flag">{{ lang.flag }}</span>
                    <span class="sm-lang-opt-label">{{ lang.label }}</span>
                    <Icon v-if="lang.code === locale" :icon="$icons.check" width="12" height="12" />
                  </button>
                </div>
              </Transition>
            </div>

            <div class="sm-divider" />

            <!-- Cerrar sesión -->
            <button class="sm-item sm-item--logout" @click="logout">
              <div class="sm-item-icon sm-item-icon--danger">
                <Icon :icon="$icons.logout" width="16" height="16" />
              </div>
              <span class="sm-item-label sm-item-label--danger">{{ t('settings.logout') }}</span>
            </button>

          </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Popover anclado bajo el engranaje ───────────────────────── */
.sm-popover {
  /*
    position: absolute anclado al nav-icons-wrap (position: relative).
    Se coloca justo debajo del engranaje, alineado a la derecha.
    El contenedor padre (nav-icons-wrap) tiene position: relative.
  */
  position: absolute;
  top: calc(100% + 12px);   /* 12px bajo los botones del navbar */
  right: 0;                  /* alineado al borde derecho del nav-icons-wrap */
  width: 360px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  overflow: visible;         /* permite que el dropdown de idiomas salga */
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-border);
  z-index: 400;
}

/* ── Cabecera beige ──────────────────────────────────────────── */
.sm-header {
  background-color: var(--color-navbar);
  padding: 2rem 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.sm-close {
  position: absolute;
  top: 0.9rem;
  right: 0.9rem;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  transition: background var(--transition-fast), transform var(--transition-fast);
  box-shadow: 0 1px 4px rgba(60, 46, 31, 0.15);
}
.sm-close:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(1.05);
}

/* Avatar */
.sm-avatar {
  /* Ring decorativo blanco alrededor del PetAvatar — sin fondo propio */
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 3px 12px rgba(60, 46, 31, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.sm-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sm-avatar-initials {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.6rem;
  color: var(--color-text-soft);
}

.sm-greeting {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--color-text);
  letter-spacing: 0.3px;
  margin: 0;
  text-align: center;
}

/* ── Cuerpo ──────────────────────────────────────────────────── */
.sm-body {
  padding: 0.75rem 0.9rem 1rem;
}

.sm-section-label {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.67rem;
  letter-spacing: 0.9px;
  color: var(--color-text-muted);
  padding: 0.5rem 0.5rem 0.4rem;
  margin: 0;
}

/* ── Items ───────────────────────────────────────────────────── */
.sm-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 0.75rem;
  border-radius: var(--radius-md);
  width: 100%;
  background: var(--color-surface-alt);
  border: none;
  cursor: pointer;
  margin-bottom: 0.5rem;
  transition: background var(--transition-fast), transform var(--transition-fast);
  position: relative;
}
.sm-item:not(.sm-item--noclick):hover {
  background: var(--color-surface-warm);
  transform: translateX(2px);
}
.sm-item--noclick { cursor: default; }

/* Icono circular */
.sm-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sm-item-icon--teal   { background: var(--color-teal-light);    color: var(--color-teal-dark); }
.sm-item-icon--danger { background: var(--color-primary-light);  color: var(--color-primary); }

.sm-item-label {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text);
  flex: 1;
  text-align: left;
}
.sm-item-label--danger { color: var(--color-primary); }

.sm-item-arrow { color: var(--color-text-muted); flex-shrink: 0; }

/* Item logout */
.sm-item--logout { background: var(--color-primary-light); }
.sm-item--logout:hover { background: #fad4c4; transform: translateX(2px); }

/* ── Toggle dark mode ────────────────────────────────────────── */
.sm-toggle {
  width: 44px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--color-border);
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  transition: background var(--transition-normal);
  box-shadow: inset 0 1px 3px rgba(60, 46, 31, 0.12);
}
.sm-toggle--on {
  background: var(--color-teal);
  box-shadow: inset 0 1px 3px rgba(124, 203, 194, 0.3), 0 0 0 3px rgba(124, 203, 194, 0.15);
}
.sm-toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(60, 46, 31, 0.2);
  transition: transform var(--transition-normal);
}
.sm-toggle--on .sm-toggle-thumb { transform: translateX(20px); }

/* ── Selector de idioma ──────────────────────────────────────── */
.sm-lang-wrap { flex-wrap: wrap; }

.sm-lang-selector {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-full);
  background: var(--color-teal-light);
  cursor: pointer;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}
.sm-lang-selector:hover { background: var(--color-teal-mid); }

.sm-lang-badge {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.72rem;
  color: var(--color-teal-dark);
  letter-spacing: 0.5px;
}

/* Dropdown idiomas */
.sm-lang-dropdown {
  position: absolute;
  right: 0.75rem;
  top: calc(100% + 4px);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
  z-index: 10;
  min-width: 150px;
}

.sm-lang-opt {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 0.85rem;
  transition: background var(--transition-fast);
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-text-soft);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}
.sm-lang-opt:hover { background: var(--color-surface-alt); color: var(--color-text); }
.sm-lang-opt--active { background: var(--color-teal-light); color: var(--color-teal-dark); font-weight: 700; }

.sm-lang-opt-flag {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.72rem;
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-xs);
}
.sm-lang-opt-label { flex: 1; }

/* ── Divider ─────────────────────────────────────────────────── */
.sm-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.25rem 0.5rem 0.5rem;
}

/* ── Animación popover: aparece desde arriba-derecha ─────────── */
.settings-modal-enter-active,
.settings-modal-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  transform-origin: top right;
}
.settings-modal-enter-from,
.settings-modal-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-6px);
}

.lang-drop-enter-active,
.lang-drop-leave-active { transition: opacity var(--transition-fast), transform var(--transition-fast); }
.lang-drop-enter-from,
.lang-drop-leave-to     { opacity: 0; transform: translateY(-6px) scale(0.97); }

/* ── Responsive móvil ───────────────────────────────────────── */
/*
  En móvil el navbar oculta nav-icons-wrap, así que SettingsModal
  se abre desde el botón del menú móvil. En ese caso no tiene
  ancla visual — lo posicionamos fijo respecto al viewport.
*/
@media (max-width: 768px) {
  .sm-popover {
    position: fixed;
    top: calc(var(--navbar-height) + 10px);
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: calc(100% - 2rem);
    max-width: 390px;
    max-height: calc(100dvh - var(--navbar-height) - 20px);
    overflow-y: auto;
    overflow-x: visible;
    border-radius: 30px;
    z-index: 500;
    -webkit-overflow-scrolling: touch;
  }
  .settings-modal-enter-from,
  .settings-modal-leave-to {
    opacity: 0;
    transform: translateX(-50%) scale(0.96) translateY(-8px);
  }
  .sm-header { padding: 1.5rem 1.25rem 1.35rem; }
  .sm-avatar { width: 70px; height: 70px; }
  .sm-body { padding: 0.8rem 0.9rem 0.95rem; }
  .sm-item { min-height: 58px; }
}

@media (max-width: 380px) {
  .sm-popover {
    width: calc(100% - 1rem);
    top: calc(var(--navbar-height) + 6px);
    max-height: calc(100dvh - var(--navbar-height) - 12px);
  }
  .sm-header { padding: 1.25rem 1rem 1.15rem; }
  .sm-avatar { width: 62px; height: 62px; }
  .sm-body { padding: 0.65rem; }
}
</style>
