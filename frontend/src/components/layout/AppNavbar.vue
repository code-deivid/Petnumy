<!-- src/components/layout/AppNavbar.vue -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'
import SettingsModal from '@/components/layout/SettingsModal.vue'

const router    = useRouter()
const authStore = useAuthStore()

const isLoggedIn    = computed(() => authStore.isLoggedIn)
const nombreUsuario = computed(() => authStore.nombreUsuario)

// Estado de paneles
const notifAbiertas  = ref(false)
const settingsVisible = ref(false)
const mobileMenu     = ref(false)

const navRef = ref(null)

function toggleNotif() {
  notifAbiertas.value = !notifAbiertas.value
  settingsVisible.value = false
  mobileMenu.value = false
}

function toggleSettings() {
  settingsVisible.value = !settingsVisible.value
  notifAbiertas.value = false
  mobileMenu.value = false
}

function toggleMobile() {
  mobileMenu.value = !mobileMenu.value
  notifAbiertas.value = false
  settingsVisible.value = false
}

function cerrarTodo() {
  notifAbiertas.value  = false
  settingsVisible.value = false
  mobileMenu.value     = false
}

function handleClickOutside(e) {
  if (navRef.value && !navRef.value.contains(e.target)) {
    notifAbiertas.value = false
    mobileMenu.value    = false
    // No cerramos settingsVisible aquí — lo maneja el modal con @close
  }
}

onMounted(()    => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

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
        <svg class="nav-logo-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M54 18 A26 26 0 1 1 50 51" fill="none" stroke="#F08263" stroke-width="3.5" stroke-linecap="round"/>
          <ellipse cx="24" cy="17" rx="4.5" ry="6"   fill="#2E3150"/>
          <ellipse cx="40" cy="17" rx="4.5" ry="6"   fill="#2E3150"/>
          <ellipse cx="15" cy="27" rx="4"   ry="5.5" fill="#2E3150"/>
          <ellipse cx="49" cy="27" rx="4"   ry="5.5" fill="#2E3150"/>
          <path d="M32 23c-9.5 0-17 7-17 13.5 0 5 4 8.5 8.5 8.5 3 0 5.5-1.5 8.5-1.5s5.5 1.5 8.5 1.5c4.5 0 8.5-3.5 8.5-8.5C49 30 41.5 23 32 23z" fill="#2E3150"/>
          <path d="M42 34 Q50 40 43 50 Q37 55 32 46 Q38 51 43 47 Q50 41 42 34z" fill="#F5EFE3" opacity="0.65"/>
          <path d="M32 31c-1.1 0-3 1.1-3 3 0 .9.3 1.7.9 2.2L32 38.5l2.1-2.3c.6-.5.9-1.3.9-2.2 0-1.9-1.9-3-3-3z" fill="white"/>
        </svg>
        <span class="nav-logo-text">Petnumy</span>
      </RouterLink>

      <!-- Nav links — desktop -->
      <nav class="nav-links">
        <RouterLink
          v-if="isLoggedIn"
          :to="{ name: 'home' }"
          class="nav-link"
          active-class="nav-link--active"
        >Home</RouterLink>

        <RouterLink
          v-if="isLoggedIn"
          :to="{ name: 'mis-mascotas' }"
          class="nav-link"
          active-class="nav-link--active"
        >Mis Mascotas</RouterLink>

        <RouterLink
          v-if="isLoggedIn"
          :to="{ name: 'mis-citas' }"
          class="nav-link"
          active-class="nav-link--active"
        >Mis Citas</RouterLink>

        <RouterLink
          v-if="isLoggedIn"
          :to="{ name: 'clinicas' }"
          class="nav-link"
          active-class="nav-link--active"
        >Veterinarios</RouterLink>
      </nav>

      <!-- Zona derecha -->
      <div class="nav-actions">

        <!-- Sin sesión -->
        <template v-if="!isLoggedIn">
          <RouterLink :to="{ name: 'login' }"    class="btn btn-ghost btn-sm nav-auth-ghost">Entrar</RouterLink>
          <RouterLink :to="{ name: 'registro' }" class="btn btn-primary btn-sm">Registrarse</RouterLink>
        </template>

        <!-- Con sesión -->
        <template v-else>
          <div class="nav-icons-wrap">

            <!-- Campana notificaciones -->
            <button
              class="nav-icon-btn"
              :class="{ 'nav-icon-btn--active': notifAbiertas }"
              @click.stop="toggleNotif"
              aria-label="Notificaciones"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <span class="notif-dot" />
            </button>

            <!-- Engranaje — abre SettingsModal -->
            <button
              class="nav-icon-btn"
              :class="{ 'nav-icon-btn--active': settingsVisible }"
              @click.stop="toggleSettings"
              aria-label="Configuración"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </button>

            <!-- Dropdown notificaciones -->
            <Transition name="dropdown">
              <div v-if="notifAbiertas" class="nav-dropdown notif-panel">
                <p class="dp-section-label">Notificaciones</p>
                <div class="notif-empty">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 01-3.46 0"/>
                  </svg>
                  <span>Sin notificaciones</span>
                </div>
              </div>
            </Transition>

          </div>
        </template>

        <!-- Hamburguesa — solo móvil -->
        <button
          class="hamburger"
          :class="{ 'hamburger--open': mobileMenu }"
          @click.stop="toggleMobile"
          aria-label="Menú"
        >
          <span class="ham-line" />
          <span class="ham-line" />
          <span class="ham-line" />
        </button>

      </div>
    </div>

    <!-- Menú móvil -->
    <Transition name="mobile-menu">
      <div v-if="mobileMenu" class="mobile-nav">
        <template v-if="isLoggedIn">
          <RouterLink :to="{ name: 'home' }"         class="mobile-link" active-class="mobile-link--active" @click="cerrarTodo">Home</RouterLink>
          <RouterLink :to="{ name: 'mis-mascotas' }" class="mobile-link" active-class="mobile-link--active" @click="cerrarTodo">Mis Mascotas</RouterLink>
          <RouterLink :to="{ name: 'mis-citas' }"    class="mobile-link" active-class="mobile-link--active" @click="cerrarTodo">Mis Citas</RouterLink>
          <RouterLink :to="{ name: 'clinicas' }"     class="mobile-link" active-class="mobile-link--active" @click="cerrarTodo">Veterinarios</RouterLink>
          <div class="mobile-divider" />
          <button class="mobile-link mobile-link--settings" @click="cerrarTodo; settingsVisible = true">
            Configuración
          </button>
        </template>
        <template v-else>
          <RouterLink :to="{ name: 'landing' }" class="mobile-link" @click="cerrarTodo">Inicio</RouterLink>
          <RouterLink :to="{ name: 'login' }"   class="mobile-link" @click="cerrarTodo">Iniciar sesión</RouterLink>
          <RouterLink :to="{ name: 'registro' }" class="mobile-link" @click="cerrarTodo">
            <div class="mobile-cta">Registrarse</div>
          </RouterLink>
        </template>
      </div>
    </Transition>

  </header>

  <!-- SettingsModal — fuera del header para evitar z-index issues -->
  <SettingsModal
    :visible="settingsVisible"
    @close="settingsVisible = false"
  />
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

/* ── Logo ───────────────────────────────────────────────────── */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-shrink: 0;
  text-decoration: none;
}

.nav-logo-svg {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
}

.nav-logo-text {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--color-text);
  letter-spacing: -0.2px;
}

/* ── Nav links ──────────────────────────────────────────────── */
.nav-links {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  flex: 1;
  justify-content: center;
}

.nav-link {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.875rem;
  color: rgba(60,46,31,0.65);
  padding: 0.38rem 0.85rem;
  border-radius: var(--radius-full);
  transition: background var(--transition-fast), color var(--transition-fast);
  position: relative;
  white-space: nowrap;
}
.nav-link:hover { background: rgba(255,255,255,0.45); color: var(--color-text); }
.nav-link--active { color: var(--color-text); font-weight: 700; }
.nav-link--active::after {
  content: '';
  position: absolute;
  bottom: 2px; left: 50%;
  transform: translateX(-50%);
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--color-primary);
}

/* ── Acciones ───────────────────────────────────────────────── */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.nav-auth-ghost {
  color: rgba(60,46,31,0.65);
}
.nav-auth-ghost:hover {
  background: rgba(255,255,255,0.45);
  color: var(--color-text);
}

/* Iconos campana y engranaje */
.nav-icons-wrap {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  position: relative;
}

.nav-icon-btn {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text);
  position: relative;
  transition: background var(--transition-fast), transform var(--transition-fast);
  box-shadow: 0 1px 4px rgba(60,46,31,0.10);
}
.nav-icon-btn:hover,
.nav-icon-btn--active {
  background: rgba(255,255,255,0.85);
  transform: scale(1.04);
}

.notif-dot {
  position: absolute;
  top: 9px; right: 9px;
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--color-danger);
  border: 1.5px solid var(--color-navbar);
}

/* Dropdown notificaciones */
.nav-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 300;
  overflow: hidden;
  min-width: 230px;
  border: 1px solid var(--color-border);
}

.notif-panel { right: 44px; }

.dp-section-label {
  font-family: var(--font-display); font-weight: 700;
  font-size: 0.67rem; text-transform: uppercase; letter-spacing: 0.8px;
  color: var(--color-text-muted);
  padding: 0.9rem 1rem 0.4rem; margin: 0;
}

.notif-empty {
  display: flex; flex-direction: column;
  align-items: center; gap: 0.4rem;
  padding: 1.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-family: var(--font-display);
}

/* ── Hamburguesa ────────────────────────────────────────────── */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 40px; height: 40px;
  border-radius: var(--radius-sm);
  background: rgba(255,255,255,0.5);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}
.hamburger:hover { background: rgba(255,255,255,0.8); }

.ham-line {
  display: block;
  width: 18px; height: 2px;
  border-radius: 2px;
  background: var(--color-text);
  transition: transform var(--transition-normal), opacity var(--transition-normal);
  transform-origin: center;
}
.hamburger--open .ham-line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger--open .ham-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
.hamburger--open .ham-line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ── Menú móvil ─────────────────────────────────────────────── */
.mobile-nav {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 0.5rem 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  box-shadow: 0 8px 24px rgba(60,46,31,0.12);
}

.mobile-link {
  display: block;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text-soft);
  transition: background var(--transition-fast), color var(--transition-fast);
  text-align: left;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
}
.mobile-link:hover { background: var(--color-surface-alt); color: var(--color-text); }
.mobile-link--active { color: var(--color-primary); font-weight: 700; }
.mobile-link--settings { color: var(--color-text-soft); }
.mobile-link--settings:hover { background: var(--color-surface-alt); }

.mobile-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.35rem 0.5rem;
}

.mobile-cta {
  margin: 0.25rem 0;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  text-align: center;
  box-shadow: 0 3px 10px rgba(240,130,99,0.35);
}

/* ── Transiciones ───────────────────────────────────────────── */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  transform-origin: top right;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-6px);
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 900px) {
  .nav-links { gap: 0; }
  .nav-link  { padding: 0.35rem 0.6rem; font-size: 0.82rem; }
}

@media (max-width: 768px) {
  .nav-links      { display: none; }
  .nav-icons-wrap { display: none; }
  .hamburger      { display: flex; }
  .nav-auth-ghost { display: none; }
  .nav-actions .btn-primary { display: none; }
}

@media (max-width: 380px) {
  .nav-logo-text { display: none; }
}
</style>
