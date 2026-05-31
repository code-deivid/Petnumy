<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n/index.js'
import { useAuthStore } from '@/stores/auth.store.js'
import SettingsModal from '@/components/layout/SettingsModal.vue'
import PetAvatar from '@/components/ui/PetAvatar.vue'
import { useRecordatorios } from '@/composables/useRecordatorios.js'

const router    = useRouter()
const authStore = useAuthStore()
const { locale, t } = useI18n()

const isLoggedIn = computed(() => authStore.isLoggedIn)

// ── Notificaciones — recordatorios reales desde backend ───────
const { recordatorios, hasRecordatorios, cargar: cargarRecordatorios } = useRecordatorios()

// Compatibilidad con el resto del template
const notifications    = recordatorios
const hasNotifications = hasRecordatorios

// ── Estado de paneles ─────────────────────────────────────────
const notifAbiertas   = ref(false)
const settingsVisible = ref(false)
const mobileMenu      = ref(false)
const mobileMenuView  = ref('nav')
const mobileSettingsOpen = ref(false) // 'nav' | 'settings'
const langOpenMobile  = ref(false)
const langPillRef     = ref(null)
const langDropPos     = ref({ top: '0px', right: '0px' })

function toggleLangMobile() {
  langOpenMobile.value = !langOpenMobile.value
  if (langOpenMobile.value && langPillRef.value) {
    const rect = langPillRef.value.getBoundingClientRect()
    langDropPos.value = {
      top: (rect.bottom + 4) + 'px',
      right: (window.innerWidth - rect.right) + 'px',
    }
  }
}
const navRef          = ref(null)

const usuarioActual = computed(() => authStore.usuario || {})
const nombrePerfil = computed(() => authStore.nombreUsuario || t('profile.userFallback'))
const fotoPerfil = computed(() => usuarioActual.value?.foto || null)
const inicialesPerfil = computed(() => {
  const n = usuarioActual.value?.nombre || ''
  const a = usuarioActual.value?.apellidos || ''
  return ((n[0] || '') + (a[0] || '')).toUpperCase() || 'U'
})

const isDarkMobile = ref(localStorage.getItem('petnumy_theme') === 'dark' || document.documentElement.classList.contains('dark'))
function toggleDarkMobile() {
  isDarkMobile.value = !isDarkMobile.value
  if (isDarkMobile.value) {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.setItem('petnumy_theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-theme')
    localStorage.setItem('petnumy_theme', 'light')
  }
}

const mobileLanguages = [
  { code: 'es', label: 'Español', flag: 'ES' },
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'va', label: 'Valencià', flag: 'VA' }
]
const currentMobileLang = computed(() => mobileLanguages.find(l => l.code === locale.value) || mobileLanguages[0])
function selectMobileLang(code) {
  setLocale(code)
  langOpenMobile.value = false
}

function toggleNotif() {
  notifAbiertas.value   = !notifAbiertas.value
  settingsVisible.value = false
  mobileMenu.value      = false
  mobileMenuView.value  = 'nav'
  mobileSettingsOpen.value = false
  langOpenMobile.value  = false
  mobileSettingsOpen.value = false
}

function toggleSettings() {
  settingsVisible.value = !settingsVisible.value
  notifAbiertas.value   = false
  mobileMenu.value      = false
}

function toggleMobile() {
  mobileMenu.value      = !mobileMenu.value
  notifAbiertas.value   = false
  settingsVisible.value = false
  if (mobileMenu.value) {
    mobileMenuView.value = 'nav'
    langOpenMobile.value = false
    mobileSettingsOpen.value = false
  }
}

function abrirSettingsMobile() {
  // En móvil queremos una subpantalla interna por encima del menú, no otro panel externo.
  mobileSettingsOpen.value = true
  notifAbiertas.value   = false
  settingsVisible.value = false
  langOpenMobile.value  = false
}

function volverMenuMobile() {
  mobileSettingsOpen.value = false
  mobileMenuView.value = 'nav'
  langOpenMobile.value = false
}

// Recargar notificaciones al detectar login
watch(isLoggedIn, (v) => { if (v) cargarRecordatorios(true) })

function cerrarTodo() {
  notifAbiertas.value   = false
  settingsVisible.value = false
  mobileMenu.value      = false
  mobileMenuView.value  = 'nav'
  langOpenMobile.value  = false
}

// Click fuera cierra notif y menú móvil.
// SettingsModal tiene su propio manejo de click fuera.
function handleClickOutside(e) {
  if (navRef.value && !navRef.value.contains(e.target)) {
    notifAbiertas.value   = false
    settingsVisible.value = false
    mobileMenu.value      = false
    mobileMenuView.value  = 'nav'
    mobileSettingsOpen.value = false
    langOpenMobile.value  = false
    mobileSettingsOpen.value = false
  }
}
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // Cargar recordatorios si hay sesión activa
  if (isLoggedIn.value) cargarRecordatorios()
})
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

function logoutMobile() {
  cerrarTodo()
  authStore.clearSession()
  router.push({ name: 'landing' })
}

function irA(name) {
  cerrarTodo()
  router.push({ name })
}
</script>

<template>
  <header class="navbar" ref="navRef">
    <div class="nav-inner page-container">

      <!-- Logo -->
      <RouterLink
        :to="{ name: isLoggedIn ? 'home' : 'landing' }"
        class="nav-logo"
        @click="cerrarTodo"
      >
        <img
          src="@/assets/logo/Logo Petnumy.svg"
          alt="Petnumy"
          class="nav-logo-svg"
        />
        <span class="nav-logo-text">Petnumy</span>
      </RouterLink>

      <!-- Nav links — desktop -->
      <nav class="nav-links">
        <RouterLink v-if="isLoggedIn" :to="{ name: 'home' }"         class="nav-link" active-class="nav-link--active">{{ t("nav.home") }}</RouterLink>
        <RouterLink v-if="isLoggedIn" :to="{ name: 'mis-mascotas' }" class="nav-link" active-class="nav-link--active">{{ t("nav.myPets") }}</RouterLink>
        <RouterLink v-if="isLoggedIn" :to="{ name: 'mis-citas' }"    class="nav-link" active-class="nav-link--active">{{ t("nav.myAppointments") }}</RouterLink>
        <RouterLink v-if="isLoggedIn" :to="{ name: 'clinicas' }"     class="nav-link" active-class="nav-link--active">{{ t("nav.vets") }}</RouterLink>
      </nav>

      <!-- Zona derecha -->
      <div class="nav-actions">

        <!-- Sin sesión -->
        <template v-if="!isLoggedIn">
          <RouterLink :to="{ name: 'login' }"    class="btn btn-ghost btn-sm nav-auth-ghost">{{ t("nav.enter") }}</RouterLink>
          <RouterLink :to="{ name: 'registro' }" class="btn btn-primary btn-sm">{{ t("nav.register") }}</RouterLink>
        </template>

        <!-- Con sesión -->
        <template v-else>
          <!--
            nav-icons-wrap tiene position: relative.
            Todos los dropdowns (notif, settings) se anclan aquí
            con position: absolute desde su esquina top-right.
          -->
          <div class="nav-icons-wrap">

            <!-- Campana -->
            <button
              class="nav-icon-btn"
              :class="{ 'nav-icon-btn--active': notifAbiertas }"
              @click.stop="toggleNotif"
              :aria-label="t('reminders.title')"
            >
              <Icon :icon="$icons.bell" width="17" height="17" />
              <!-- Punto rojo SOLO si hay notificaciones -->
              <span v-if="hasNotifications" class="notif-dot" />
            </button>

            <!-- Engranaje -->
            <button
              class="nav-icon-btn"
              :class="{ 'nav-icon-btn--active': settingsVisible }"
              @click.stop="toggleSettings"
              :aria-label="t('settings.title')"
            >
              <Icon :icon="$icons.settings" width="17" height="17" />
            </button>

            <!-- Dropdown notificaciones — anclado al nav-icons-wrap -->
            <Transition name="dropdown">
              <div v-if="notifAbiertas" class="nav-dropdown notif-panel">
                <div class="notif-header">
                  <p class="dp-label" style="padding:0;margin:0">{{ t("reminders.title") }}</p>
                  <span v-if="hasNotifications" class="notif-count">{{ notifications.length }}</span>
                </div>
                <!-- Lista de recordatorios -->
                <div v-if="hasNotifications" class="notif-list">
                  <div
                    v-for="rec in notifications"
                    :key="rec.id"
                    class="notif-item"
                  >
                    <div class="notif-item-icon">
                      <Icon :icon="$icons.health" width="13" height="13" />
                    </div>
                    <div class="notif-item-text">
                      <p class="notif-item-title">
                        {{ rec.vacuna_mascota?.mascota?.nombre }} —
                        {{ rec.vacuna_mascota?.vacuna?.nombre }}
                      </p>
                      <p class="notif-item-sub">
                        {{ t('reminders.next') }}: {{ rec.vacuna_mascota?.proxima_aplicacion
                          ? new Date(rec.vacuna_mascota.proxima_aplicacion).toLocaleDateString(locale === 'en' ? 'en-GB' : locale === 'va' ? 'ca-ES' : 'es-ES',{day:'2-digit',month:'short'})
                          : '—' }}
                        · {{ t('reminders.notice') }}: {{ new Date(rec.fecha_recordatorio).toLocaleDateString(locale === 'en' ? 'en-GB' : locale === 'va' ? 'ca-ES' : 'es-ES',{day:'2-digit',month:'short'}) }}
                      </p>
                    </div>
                  </div>
                </div>
                <div v-else class="notif-empty">
                  <Icon :icon="$icons.bell" width="26" height="26" />
                  <span>{{ t("reminders.none") }}</span>
                </div>
              </div>
            </Transition>

            <!-- Settings popover — anclado al nav-icons-wrap (position:relative) -->
            <SettingsModal
              :visible="settingsVisible"
              @close="settingsVisible = false"
            />

          </div>
        </template>

        <!-- Hamburguesa — solo móvil -->
        <button
          v-if="isLoggedIn"
          class="hamburger"
          :class="{ 'hamburger--open': mobileMenu }"
          @click.stop="toggleMobile"
          :aria-label="t('mobile.menu')"
        >
          <span class="ham-line" />
          <span class="ham-line" />
          <span class="ham-line" />
        </button>

      </div>
    </div>

    <!-- Menú móvil integrado: navegación + subventana configuración móvil -->
    <Transition name="mobile-menu">
      <div v-if="mobileMenu" class="mobile-nav" :class="{ 'mobile-nav--settings': mobileMenuView === 'settings' }" role="dialog" aria-label="Menú de navegación">
        <div class="mobile-nav-header">
          <button
            v-if="mobileMenuView === 'settings'"
            class="mobile-back-btn"
            type="button"
            @click="volverMenuMobile"
            :aria-label="t('common.back')"
          >
            <Icon :icon="$icons.back" width="18" height="18" />
          </button>

          <PetAvatar :foto="fotoPerfil" :nombre="nombrePerfil" tipo="usuario" size="lg" />
          <p class="mobile-menu-kicker">Petnumy</p>
          <h2 class="mobile-menu-title">{{ t("mobile.hello", { name: nombrePerfil }) }}</h2>
          <p class="mobile-menu-subtitle">
            {{ mobileMenuView === 'settings' ? t('mobile.experience') : t('mobile.where') }}
          </p>
        </div>

        <div class="mobile-nav-body">
          <template v-if="mobileMenuView === 'nav'">
            <template v-if="isLoggedIn">
              <p class="mobile-section-label">{{ t("mobile.navigation") }}</p>

              <RouterLink :to="{ name: 'home' }" class="mobile-link" active-class="mobile-link--active" @click="cerrarTodo">
                <span class="mobile-link-icon">
                  <Icon :icon="$icons.home" width="18" height="18" />
                </span>
                <span>{{ t("nav.home") }}</span>
              </RouterLink>

              <RouterLink :to="{ name: 'mis-mascotas' }" class="mobile-link" active-class="mobile-link--active" @click="cerrarTodo">
                <span class="mobile-link-icon">
                  <Icon :icon="$icons.pets" width="18" height="18" />
                </span>
                <span>{{ t("nav.myPets") }}</span>
              </RouterLink>

              <RouterLink :to="{ name: 'mis-citas' }" class="mobile-link" active-class="mobile-link--active" @click="cerrarTodo">
                <span class="mobile-link-icon">
                  <Icon :icon="$icons.calendar" width="18" height="18" />
                </span>
                <span>{{ t("nav.myAppointments") }}</span>
              </RouterLink>

              <RouterLink :to="{ name: 'clinicas' }" class="mobile-link" active-class="mobile-link--active" @click="cerrarTodo">
                <span class="mobile-link-icon">
                  <Icon :icon="$icons.clinic" width="18" height="18" />
                </span>
                <span>{{ t("nav.vets") }}</span>
              </RouterLink>

              <div class="mobile-divider" />

              <button class="mobile-link mobile-link--settings" type="button" @click.stop.prevent="abrirSettingsMobile">
                <span class="mobile-link-icon mobile-link-icon--settings">
                  <Icon :icon="$icons.settings" width="18" height="18" />
                </span>
                <span>{{ t("settings.title") }}</span>
                <Icon class="mobile-link-arrow" :icon="$icons.chevronRight" width="14" height="14" />
              </button>
            </template>

            <template v-else>
              <p class="mobile-section-label">{{ t("mobile.access") }}</p>
              <RouterLink :to="{ name: 'landing' }" class="mobile-link" @click="cerrarTodo"><span class="mobile-link-icon"><Icon :icon="$icons.home" width="18" height="18" /></span><span>{{ t("nav.home") }}</span></RouterLink>
              <RouterLink :to="{ name: 'login' }" class="mobile-link" @click="cerrarTodo"><span class="mobile-link-icon"><Icon :icon="$icons.login" width="18" height="18" /></span><span>{{ t("nav.enter") }}</span></RouterLink>
              <RouterLink :to="{ name: 'registro' }" class="mobile-link mobile-link--settings" @click="cerrarTodo"><span class="mobile-link-icon mobile-link-icon--settings"><Icon :icon="$icons.addCircle" width="18" height="18" /></span><span>{{ t("nav.register") }}</span></RouterLink>
            </template>
          </template>

          <template v-else>
            <div class="mobile-settings-topbar">
              <button class="mobile-settings-back" type="button" @click.stop.prevent="volverMenuMobile">
                <Icon :icon="$icons.back" width="18" height="18" />
                <span>{{ t('common.back') }}</span>
              </button>
            </div>
            <p class="mobile-section-label">{{ t("settings.title") }}</p>

            <button class="mobile-link" type="button" @click="irA('perfil')">
              <span class="mobile-link-icon">
                <Icon :icon="$icons.user" width="18" height="18" />
              </span>
              <span>{{ t("settings.profile") }}</span>
              <Icon class="mobile-link-arrow" :icon="$icons.chevronRight" width="14" height="14" />
            </button>

            <div class="mobile-link mobile-link--control">
              <span class="mobile-link-icon">
                <Icon :icon="$icons.light" width="18" height="18" />
              </span>
              <span>{{ t("settings.darkMode") }}</span>
              <button
                class="mobile-toggle"
                :class="{ 'mobile-toggle--on': isDarkMobile }"
                type="button"
                role="switch"
                :aria-checked="isDarkMobile"
                @click.stop="toggleDarkMobile"
              >
                <span />
              </button>
            </div>

            <div class="mobile-link mobile-link--control mobile-lang-control">
              <span class="mobile-link-icon">
                <Icon :icon="$icons.language" width="18" height="18" />
              </span>
              <span>{{ t("settings.language") }}</span>
              <button class="mobile-lang-pill" type="button" ref="langPillRef" @click.stop="toggleLangMobile">
                {{ currentMobileLang.flag }}
                <Icon :style="{ transform: langOpenMobile ? 'rotate(180deg)' : 'none' }" :icon="$icons.chevronDown" width="12" height="12" />
              </button>
              <Teleport to="body">
                <!-- Overlay para cerrar al tocar fuera -->
                <div
                  v-if="langOpenMobile"
                  class="mobile-lang-backdrop"
                  @click.stop="langOpenMobile = false"
                />
                <Transition name="lang-drop">
                  <div
                    v-if="langOpenMobile"
                    class="mobile-lang-dropdown mobile-lang-dropdown--teleport"
                    :style="{ top: langDropPos.top, right: langDropPos.right }"
                  >
                    <button
                      v-for="lang in mobileLanguages"
                      :key="lang.code"
                      class="mobile-lang-option"
                      :class="{ 'mobile-lang-option--active': lang.code === locale }"
                      type="button"
                      @click.stop="selectMobileLang(lang.code)"
                    >
                      <span>{{ lang.flag }}</span>
                      <strong>{{ lang.label }}</strong>
                    </button>
                  </div>
                </Transition>
              </Teleport>
            </div>

            <div class="mobile-divider" />

            <button class="mobile-link mobile-link--logout" type="button" @click="logoutMobile">
              <span class="mobile-link-icon mobile-link-icon--settings">
                <Icon :icon="$icons.logout" width="18" height="18" />
              </span>
              <span>{{ t("settings.logout") }}</span>
            </button>
          </template>
        </div>

        <Transition name="mobile-settings-slide">
          <div v-if="mobileSettingsOpen" class="mobile-settings-overlay" @click.stop>
            <div class="mobile-settings-overlay-head">
              <button class="mobile-settings-back" type="button" @click.stop.prevent="volverMenuMobile">
                <Icon :icon="$icons.back" width="18" height="18" />
                <span>{{ t('common.back') }}</span>
              </button>
              <button class="mobile-settings-close" type="button" @click.stop.prevent="cerrarTodo" :aria-label="t('common.close')">
                <Icon :icon="$icons.close" width="20" height="20" />
              </button>
            </div>

            <p class="mobile-section-label">{{ t("settings.title") }}</p>

            <button class="mobile-link" type="button" @click="irA('perfil')">
              <span class="mobile-link-icon">
                <Icon :icon="$icons.user" width="18" height="18" />
              </span>
              <span>{{ t("settings.profile") }}</span>
              <Icon class="mobile-link-arrow" :icon="$icons.chevronRight" width="14" height="14" />
            </button>

            <div class="mobile-link mobile-link--control">
              <span class="mobile-link-icon">
                <Icon :icon="$icons.light" width="18" height="18" />
              </span>
              <span>{{ t("settings.darkMode") }}</span>
              <button
                class="mobile-toggle"
                :class="{ 'mobile-toggle--on': isDarkMobile }"
                type="button"
                role="switch"
                :aria-checked="isDarkMobile"
                @click.stop="toggleDarkMobile"
              >
                <span />
              </button>
            </div>

            <div class="mobile-link mobile-link--control mobile-lang-control">
              <span class="mobile-link-icon">
                <Icon :icon="$icons.language" width="18" height="18" />
              </span>
              <span>{{ t("settings.language") }}</span>
              <button class="mobile-lang-pill" type="button" ref="langPillRef" @click.stop="toggleLangMobile">
                {{ currentMobileLang.flag }}
                <Icon :style="{ transform: langOpenMobile ? 'rotate(180deg)' : 'none' }" :icon="$icons.chevronDown" width="12" height="12" />
              </button>
            </div>

            <div v-if="langOpenMobile" class="mobile-lang-dropdown mobile-lang-dropdown--inside">
              <button
                v-for="lang in mobileLanguages"
                :key="lang.code"
                class="mobile-lang-option"
                :class="{ 'mobile-lang-option--active': lang.code === locale }"
                type="button"
                @click.stop="selectMobileLang(lang.code)"
              >
                <span>{{ lang.flag }}</span>
                <strong>{{ lang.label }}</strong>
              </button>
            </div>

            <div class="mobile-divider" />

            <button class="mobile-link mobile-link--logout" type="button" @click="logoutMobile">
              <span class="mobile-link-icon mobile-link-icon--settings">
                <Icon :icon="$icons.logout" width="18" height="18" />
              </span>
              <span>{{ t("settings.logout") }}</span>
            </button>
          </div>
        </Transition>

      </div>
    </Transition>


  </header>
</template>

<style scoped>
/* ── Base ───────────────────────────────────────────────────── */
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: var(--navbar-height);
  background-color: var(--color-navbar);
  border-bottom: 2px solid var(--color-navbar-border);
  box-shadow: 0 2px 8px rgba(60,46,31,0.10);
  z-index: 200;
}

.nav-inner {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

/* Logo */
.nav-logo { display: flex; align-items: center; gap: 0.55rem; flex-shrink: 0; text-decoration: none; }
.nav-logo-svg  { width: 38px; height: 38px; flex-shrink: 0; }
.nav-logo-text { font-family: var(--font-display); font-weight: 800; font-size: 1.1rem; color: var(--color-text); letter-spacing: -0.2px; }

/* Nav links */
.nav-links { display: flex; align-items: center; gap: 0.1rem; flex: 1; justify-content: center; }

.nav-link {
  font-family: var(--font-display); font-weight: 600; font-size: 0.875rem;
  color: rgba(60,46,31,0.65);
  padding: 0.38rem 0.85rem;
  border-radius: var(--radius-full);
  transition: background var(--transition-fast), color var(--transition-fast);
  position: relative; white-space: nowrap;
}
.nav-link:hover { background: rgba(255,255,255,0.45); color: var(--color-text); }
.nav-link--active { color: var(--color-text); font-weight: 700; }
.nav-link--active::after {
  content: ''; position: absolute; bottom: 2px; left: 50%;
  transform: translateX(-50%); width: 5px; height: 5px;
  border-radius: 50%; background: var(--color-primary);
}

/* Acciones */
.nav-actions { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; margin-left: auto; }
.nav-auth-ghost { color: rgba(60,46,31,0.65); }
.nav-auth-ghost:hover { background: rgba(255,255,255,0.45); color: var(--color-text); }

/*
  nav-icons-wrap: position relative es la clave.
  Todos los dropdowns hijos usan position: absolute desde aquí.
*/
.nav-icons-wrap {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  position: relative;   /* ancla todos los dropdowns */
}

.nav-icon-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,255,255,0.5);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text); position: relative;
  transition: background var(--transition-fast), transform var(--transition-fast);
  box-shadow: 0 1px 4px rgba(60,46,31,0.10);
}
.nav-icon-btn:hover,
.nav-icon-btn--active { background: rgba(255,255,255,0.85); transform: scale(1.04); }

/* Punto rojo — solo renderizado con v-if cuando hay notificaciones */
.notif-dot {
  position: absolute; top: 9px; right: 9px;
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--color-danger);
  border: 1.5px solid var(--color-navbar);
}

/* Dropdown notificaciones */
.nav-dropdown {
  position: absolute;
  top: calc(100% + 12px);   /* 12px bajo los botones */
  right: 44px;               /* alineado con la campana */
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 400;
  overflow: hidden;
  min-width: 230px;
  border: 1px solid var(--color-border);
}

.dp-label {
  font-family: var(--font-display); font-weight: 700;
  font-size: 0.67rem; text-transform: uppercase; letter-spacing: 0.8px;
  color: var(--color-text-muted); padding: 0.9rem 1rem 0.4rem; margin: 0;
}

.notif-empty {
  display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
  padding: 1.5rem 1rem; color: var(--color-text-muted);
  font-size: 0.8rem; font-family: var(--font-display);
}

.notif-item {
  padding: 0.7rem 1rem; font-size: 0.875rem; color: var(--color-text-soft);
  border-bottom: 1px solid var(--color-border);
}
.notif-item:last-child { border-bottom: none; }

/* Hamburguesa */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: rgba(255,255,255,0.72);
  border: 1px solid rgba(230,185,145,0.55);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
  box-shadow: 0 8px 18px rgba(60,46,31,0.10);
}
.hamburger:hover { background: rgba(255,255,255,0.94); transform: translateY(-1px); }
.ham-line {
  display: block;
  width: 20px;
  height: 2px;
  border-radius: 999px;
  background: var(--color-text);
  transition: transform var(--transition-normal), opacity var(--transition-normal);
  transform-origin: center;
}
.hamburger--open {
  background: rgba(255,255,255,0.96);
  box-shadow: 0 10px 24px rgba(60,46,31,0.16);
}
.hamburger--open .ham-line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger--open .ham-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
.hamburger--open .ham-line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* Menú móvil — mismo lenguaje visual que SettingsModal */
.mobile-nav {
  position: fixed;
  top: calc(var(--navbar-height) + 12px);
  right: 12px;
  width: min(372px, calc(100vw - 24px));
  /* Usar dvh para respetar safe areas en iOS */
  max-height: calc(100dvh - var(--navbar-height) - 24px);
  background: var(--color-surface);
  border: 1px solid rgba(230,185,145,0.70);
  border-radius: 30px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 28px 80px rgba(60,46,31,0.26);
  z-index: 350;
  /* overflow hidden en el contenedor principal para el border-radius */
  overflow: hidden;
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}
.mobile-nav::before {
  content: '';
  position: absolute;
  top: -7px;
  right: 22px;
  width: 14px;
  height: 14px;
  background: var(--color-navbar);
  border-left: 1px solid rgba(230,185,145,0.70);
  border-top: 1px solid rgba(230,185,145,0.70);
  transform: rotate(45deg);
}
.mobile-nav-header {
  background: var(--color-navbar);
  padding: 1.35rem 1.25rem 1.45rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.22rem;
  position: relative;
  flex: 0 0 auto;
}
.mobile-menu-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgba(255,255,255,0.55);
  border: 3.5px solid rgba(255,255,255,0.85);
  box-shadow: 0 8px 22px rgba(60,46,31,0.13);
  display: flex;
  align-items: center;
  justify-content: center;
}
.mobile-menu-avatar svg { width: 46px; height: 46px; }
.mobile-menu-kicker {
  margin: 0.38rem 0 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.74rem;
  color: rgba(60,46,31,0.62);
  letter-spacing: 0.04em;
}
.mobile-menu-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.32rem;
  font-weight: 900;
  color: var(--color-text);
  letter-spacing: -0.02em;
}
.mobile-nav-body {
  padding: 0.85rem 0.95rem;
  /* padding-bottom extra para safe area en notch/home indicator de iPhone */
  padding-bottom: max(1.25rem, env(safe-area-inset-bottom, 1.25rem));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-height: 0;
  flex: 1; /* Ocupa todo el espacio disponible */
}
.mobile-section-label {
  margin: 0.25rem 0.45rem 0.05rem;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
}
.mobile-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-height: 62px;
  padding: 0.75rem 0.9rem;
  border-radius: 22px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1rem;
  color: var(--color-text);
  transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
  text-align: left;
  width: 100%;
  background: var(--color-surface-alt);
  border: 1px solid rgba(230,185,145,0.18);
  cursor: pointer;
  overflow: hidden;
}
.mobile-link-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
  font-size: 1rem;
  box-shadow: 0 6px 16px rgba(60,46,31,0.08);
}
.mobile-link-icon--settings {
  color: var(--color-primary);
  background: var(--color-primary-light);
}
.mobile-link:hover {
  background: var(--color-surface-warm);
  color: var(--color-text);
  transform: translateX(-3px);
  box-shadow: 0 10px 24px rgba(60,46,31,0.10);
}
.mobile-link--active {
  color: var(--color-primary);
  background: linear-gradient(135deg, rgba(255,238,231,0.98), rgba(255,250,244,0.96));
  border-color: rgba(240,130,99,0.35);
}
.mobile-link--active .mobile-link-icon {
  background: var(--color-primary);
  color: #fff;
}
.mobile-link--active::after {
  content: '';
  position: absolute;
  right: 1rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 0 7px rgba(240,130,99,0.12);
}
.mobile-link--settings {
  background: var(--color-teal-light);
  border-color: rgba(124,203,194,0.22);
}
.mobile-link--settings:hover { background: var(--color-teal-mid); }
.mobile-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.22rem 0.45rem 0.05rem;
}
.mobile-cta {
  width: 100%;
  margin: 0;
  padding: 0.82rem 1rem;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.92rem;
  text-align: center;
  box-shadow: 0 10px 22px rgba(240,130,99,0.30);
}

/* Transiciones */
.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  transform-origin: top right;
}
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: scale(0.96) translateY(-6px); }

.mobile-menu-enter-active, .mobile-menu-leave-active {
  transition: opacity 260ms ease, transform 320ms cubic-bezier(.22, 1, .36, 1);
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.mobile-menu-enter-to,
.mobile-menu-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* Responsive */
@media (max-width: 900px) {
  .nav-links { gap: 0; }
  .nav-link  { padding: 0.35rem 0.6rem; font-size: 0.82rem; }
}
@media (max-width: 768px) {
  .nav-inner { justify-content: space-between; }
  .nav-links      { display: none; }
  .nav-icons-wrap { display: none; }
  .nav-actions    { margin-left: auto; }
  .hamburger      { display: flex; }
  .nav-auth-ghost { display: none; }
  .nav-actions .btn-primary { display: none; }
}
@media (max-width: 380px) {
  .nav-logo-text { display: none; }
}

/* ── Panel notificaciones — recordatorios ────────────────── */
.notif-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.9rem 1rem 0.4rem;
}
.notif-count {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--color-primary); color: #fff;
  font-family: var(--font-display); font-weight: 700; font-size: 0.65rem;
}

.notif-list { padding: 0.25rem 0.5rem 0.5rem; display: flex; flex-direction: column; gap: 0.2rem; }

.notif-item {
  display: flex; align-items: flex-start; gap: 0.6rem;
  padding: 0.6rem 0.65rem;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}
.notif-item:hover { background: var(--color-surface-alt); }

.notif-item-icon {
  width: 26px; height: 26px; border-radius: var(--radius-xs);
  background: var(--color-teal-light); color: var(--color-teal-dark);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.notif-item-text { display: flex; flex-direction: column; gap: 0.1rem; flex: 1; min-width: 0; }
.notif-item-title {
  font-family: var(--font-display); font-weight: 700; font-size: 0.78rem;
  color: var(--color-text); margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.notif-item-sub { font-size: 0.68rem; color: var(--color-text-muted); margin: 0; }


/* ── Ajuste nuevo menú móvil con subventana configuración ───── */
.mobile-profile-avatar {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: rgba(255,255,255,0.58);
  border: 3.5px solid rgba(255,255,255,0.88);
  box-shadow: 0 10px 28px rgba(60,46,31,0.16);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.5rem;
  color: var(--color-text-soft);
}
.mobile-profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.mobile-menu-subtitle {
  margin: 0.12rem 0 0;
  color: rgba(60,46,31,0.62);
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 600;
}
.mobile-back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255,255,255,0.65);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(60,46,31,0.12);
}
.mobile-link-arrow {
  margin-left: auto;
  color: var(--color-text-muted);
  flex-shrink: 0;
}
.mobile-link--control {
  cursor: default;
}
.mobile-link--control:hover {
  transform: none;
}
.mobile-toggle {
  margin-left: auto;
  width: 52px;
  height: 30px;
  border-radius: 999px;
  background: var(--color-border);
  padding: 3px;
  box-shadow: inset 0 2px 5px rgba(60,46,31,0.12);
}
.mobile-toggle span {
  display: block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(60,46,31,0.2);
  transition: transform var(--transition-normal);
}
.mobile-toggle--on {
  background: var(--color-teal);
}
.mobile-toggle--on span {
  transform: translateX(22px);
}
.mobile-lang-control {
  overflow: visible;
  position: relative;
}
.mobile-lang-pill {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0.42rem 0.7rem;
  border-radius: 999px;
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 0.78rem;
}
.mobile-lang-pill svg {
  transition: transform var(--transition-fast);
}
.mobile-lang-dropdown {
  position: absolute;
  right: 0.75rem;
  top: calc(100% + 6px);
  width: 170px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  z-index: 20;
}
.mobile-lang-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.72rem 0.85rem;
  color: var(--color-text-soft);
  background: transparent;
  font-family: var(--font-display);
  text-align: left;
}
.mobile-lang-option:hover,
.mobile-lang-option--active {
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
}
.mobile-lang-option span {
  font-weight: 900;
  font-size: 0.72rem;
}
.mobile-link--logout {
  background: var(--color-primary-light);
  color: var(--color-primary);
}
.mobile-link--logout .mobile-link-icon {
  background: rgba(255,255,255,0.55);
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .sm-popover {
    max-height: calc(100dvh - var(--navbar-height) - 18px);
    overflow-y: auto;
  }
  .mobile-nav {
    /* En móvil ocupa casi toda la pantalla de forma cómoda */
    top: calc(var(--navbar-height) + 8px);
    right: 10px;
    left: 10px;
    width: auto;
    max-height: calc(100dvh - var(--navbar-height) - 18px);
    border-radius: 26px;
  }
  /* Quitar la flecha del popover en móvil (no hay dónde anclarla) */
  .mobile-nav::before { display: none; }
}

@media (max-width: 430px) {
  .mobile-nav {
    top: calc(var(--navbar-height) + 6px);
    right: 8px;
    left: 8px;
    max-height: calc(100dvh - var(--navbar-height) - 14px);
    border-radius: 22px;
  }
  .mobile-link {
    min-height: 56px;
    padding: 0.65rem 0.85rem;
    font-size: 0.95rem;
  }
  .mobile-link-icon {
    width: 40px;
    height: 40px;
    border-radius: 14px;
  }
}


/* Submenú móvil de configuración: aparece como una pantalla interna por encima del menú */
.mobile-nav--settings .mobile-nav-header {
  display: none;
}
.mobile-nav--settings .mobile-nav-body {
  padding-top: 1.15rem;
}
.mobile-settings-topbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: 0 0.25rem 0.25rem;
}
.mobile-settings-back {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 42px;
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  background: var(--color-surface-alt);
  color: var(--color-text-soft);
  border: 1px solid rgba(230,185,145,0.22);
  font-family: var(--font-display);
  font-size: 0.86rem;
  font-weight: 800;
  box-shadow: 0 6px 16px rgba(60,46,31,0.06);
}
.mobile-settings-back:hover {
  background: var(--color-surface-warm);
  color: var(--color-text);
}
html.dark .mobile-settings-back,
html[data-theme="dark"] .mobile-settings-back {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.78);
}
html.dark .mobile-settings-back:hover,
html[data-theme="dark"] .mobile-settings-back:hover {
  background: rgba(255,255,255,0.10);
  color: #fff;
}


/* Subpantalla real de configuración móvil: se superpone al menú y siempre recibe clicks */
.mobile-settings-overlay {
  position: absolute;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem 0.95rem max(1.25rem, env(safe-area-inset-bottom, 1.25rem));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: var(--color-surface);
  border-radius: inherit;
}
.mobile-settings-overlay::before {
  content: '';
  position: sticky;
  top: -1rem;
  height: 0;
}
.mobile-settings-overlay-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0 0.15rem 0.2rem;
}
.mobile-settings-close {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  background: rgba(255,255,255,0.72);
  color: var(--color-text);
  border: 1px solid rgba(230,185,145,0.28);
  box-shadow: 0 8px 18px rgba(60,46,31,0.10);
}
.mobile-lang-dropdown--inside {
  position: static;
  width: 100%;
  margin: -0.15rem 0 0.25rem;
  border-radius: 20px;
}
.mobile-settings-slide-enter-active,
.mobile-settings-slide-leave-active {
  transition: opacity 220ms ease, transform 260ms cubic-bezier(.22, 1, .36, 1);
}
.mobile-settings-slide-enter-from,
.mobile-settings-slide-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
html.dark .mobile-settings-overlay,
html[data-theme="dark"] .mobile-settings-overlay {
  background: var(--color-surface);
}

</style>