<!-- src/components/layout/AppNavbar.vue — con logo real + hamburguesa móvil -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store.js";

const router = useRouter();
const authStore = useAuthStore();

const isLoggedIn = computed(() => authStore.isLoggedIn);
const nombreUsuario = computed(() => authStore.nombreUsuario);
const iniciales = computed(() => {
  const n = authStore.usuario?.nombre || "";
  const a = authStore.usuario?.apellidos || "";
  return ((n[0] || "") + (a[0] || "")).toUpperCase() || "U";
});

// Dropdowns desktop
const menuAbierto = ref(false);
const notifAbiertas = ref(false);
// Menú móvil
const mobileMenu = ref(false);

const navRef = ref(null);

function toggleMenu() {
  menuAbierto.value = !menuAbierto.value;
  notifAbiertas.value = false;
}
function toggleNotif() {
  notifAbiertas.value = !notifAbiertas.value;
  menuAbierto.value = false;
}
function toggleMobile() {
  mobileMenu.value = !mobileMenu.value;
  menuAbierto.value = false;
  notifAbiertas.value = false;
}
function cerrarTodo() {
  menuAbierto.value = false;
  notifAbiertas.value = false;
  mobileMenu.value = false;
}

function handleClickOutside(e) {
  if (navRef.value && !navRef.value.contains(e.target)) cerrarTodo();
}
onMounted(() => document.addEventListener("click", handleClickOutside));
onBeforeUnmount(() =>
  document.removeEventListener("click", handleClickOutside),
);

function handleLogout() {
  cerrarTodo();
  authStore.clearSession();
  router.push({ name: "landing" });
}
function irA(name) {
  cerrarTodo();
  router.push({ name });
}
</script>

<template>
  <header class="navbar" ref="navRef">
    <div class="nav-inner page-container">
      <!-- ── Logo ──────────────────────────────────────────── -->
      <RouterLink
        :to="{ name: isLoggedIn ? 'home' : 'landing' }"
        class="nav-logo"
        @click="cerrarTodo"
      >
        <!-- Logo SVG: pata con corazón + círculo coral abierto -->
        <img src="@/assets/logo/Logo Petnumy.png" alt="" />
        <span class="nav-logo-text">Petnumy</span>
      </RouterLink>

      <!-- ── Nav links desktop ──────────────────────────────── -->
      <nav class="nav-links">
        <RouterLink
          v-if="isLoggedIn"
          :to="{ name: 'home' }"
          class="nav-link"
          active-class="nav-link--active"
          >Home</RouterLink
        >
        <RouterLink
          v-if="isLoggedIn"
          :to="{ name: 'mis-mascotas' }"
          class="nav-link"
          active-class="nav-link--active"
          >Mis Mascotas</RouterLink
        >
        <RouterLink
          v-if="isLoggedIn"
          :to="{ name: 'mis-citas' }"
          class="nav-link"
          active-class="nav-link--active"
          >Mis Citas</RouterLink
        >
        <RouterLink
          v-if="isLoggedIn"
          :to="{ name: 'clinicas' }"
          class="nav-link"
          active-class="nav-link--active"
          >Veterinarios</RouterLink
        >
      </nav>

      <!-- ── Acciones derecha ───────────────────────────────── -->
      <div class="nav-actions">
        <!-- Sin sesión — desktop -->
        <template v-if="!isLoggedIn">
          <RouterLink
            :to="{ name: 'login' }"
            class="btn btn-ghost btn-sm nav-auth-ghost"
            >Entrar</RouterLink
          >
          <RouterLink :to="{ name: 'registro' }" class="btn btn-primary btn-sm"
            >Registrarse</RouterLink
          >
        </template>

        <!-- Con sesión — desktop -->
        <template v-else>
          <div class="nav-icons-wrap">
            <!-- Campana -->
            <button
              class="nav-icon-btn"
              :class="{ 'nav-icon-btn--active': notifAbiertas }"
              @click.stop="toggleNotif"
              aria-label="Notificaciones"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <span class="notif-dot" />
            </button>

            <!-- Engranaje -->
            <button
              class="nav-icon-btn"
              :class="{ 'nav-icon-btn--active': menuAbierto }"
              @click.stop="toggleMenu"
              aria-label="Configuración"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path
                  d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                />
              </svg>
            </button>

            <!-- Dropdown notificaciones -->
            <Transition name="dropdown">
              <div v-if="notifAbiertas" class="nav-dropdown notif-panel">
                <p class="dp-section-label">Notificaciones</p>
                <div class="notif-empty">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                  <span>Sin notificaciones</span>
                </div>
              </div>
            </Transition>

            <!-- Dropdown menú usuario -->
            <Transition name="dropdown">
              <div v-if="menuAbierto" class="nav-dropdown user-panel">
                <div class="upanel-header">
                  <button class="upanel-close" @click="cerrarTodo">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                  <div class="upanel-avatar">{{ iniciales }}</div>
                  <p class="upanel-nombre">¡Hola, {{ nombreUsuario }}!</p>
                </div>
                <div class="upanel-body">
                  <p class="dp-section-label">Configuración</p>
                  <button class="upanel-item" @click="irA('mis-mascotas')">
                    <span class="upanel-icon upanel-icon--teal">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path
                          d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 1.844-2.5"
                        />
                        <path
                          d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-1.844-2.5"
                        />
                        <path d="M8 14v.5" />
                        <path d="M16 14v.5" />
                        <path d="M11.25 16.25h1.5L12 17l-.75-.75z" />
                        <path
                          d="M4.42 11.247A13.152 13.152 0 0012 13c2.718 0 5.27-.794 7.58-2.253"
                        />
                      </svg>
                    </span>
                    <span class="upanel-label">Mis mascotas</span>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                  <button class="upanel-item" @click="irA('mis-citas')">
                    <span class="upanel-icon upanel-icon--teal">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </span>
                    <span class="upanel-label">Mis citas</span>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                  <div class="upanel-divider" />
                  <button
                    class="upanel-item upanel-item--danger"
                    @click="handleLogout"
                  >
                    <span class="upanel-icon upanel-icon--danger">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      >
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </span>
                    <span class="upanel-label">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </template>

        <!-- ── Hamburguesa — solo móvil ─────────────────────── -->
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

    <!-- ── Menú móvil desplegable ─────────────────────────────── -->
    <Transition name="mobile-menu">
      <div v-if="mobileMenu" class="mobile-nav">
        <template v-if="isLoggedIn">
          <RouterLink
            :to="{ name: 'home' }"
            class="mobile-link"
            active-class="mobile-link--active"
            @click="cerrarTodo"
            >Home</RouterLink
          >
          <RouterLink
            :to="{ name: 'mis-mascotas' }"
            class="mobile-link"
            active-class="mobile-link--active"
            @click="cerrarTodo"
            >Mis Mascotas</RouterLink
          >
          <RouterLink
            :to="{ name: 'mis-citas' }"
            class="mobile-link"
            active-class="mobile-link--active"
            @click="cerrarTodo"
            >Mis Citas</RouterLink
          >
          <RouterLink
            :to="{ name: 'clinicas' }"
            class="mobile-link"
            active-class="mobile-link--active"
            @click="cerrarTodo"
            >Veterinarios</RouterLink
          >
          <div class="mobile-divider" />
          <button class="mobile-link mobile-link--danger" @click="handleLogout">
            Cerrar Sesión
          </button>
        </template>

        <template v-else>
          <RouterLink
            :to="{ name: 'landing' }"
            class="mobile-link"
            @click="cerrarTodo"
            >Inicio</RouterLink
          >
          <RouterLink
            :to="{ name: 'login' }"
            class="mobile-link"
            @click="cerrarTodo"
            >Iniciar sesión</RouterLink
          >
          <RouterLink :to="{ name: 'registro' }" @click="cerrarTodo">
            <div class="mobile-cta">Registrarse</div>
          </RouterLink>
        </template>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
/* ── Navbar base ─────────────────────────────────────────────── */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--navbar-height);
  background-color: var(--color-navbar);
  border-bottom: 2px solid var(--color-navbar-border);
  box-shadow: 0 2px 8px rgba(60, 46, 31, 0.1);
  z-index: 200;
}

.nav-inner {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 1.5rem;

  img {
    width: 100%;
    max-width: 50px;
  }
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

/* ── Nav links desktop ───────────────────────────────────────── */
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
  color: rgba(60, 46, 31, 0.65);
  padding: 0.38rem 0.85rem;
  border-radius: var(--radius-full);
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
  position: relative;
  white-space: nowrap;
}
.nav-link:hover {
  background: rgba(255, 255, 255, 0.45);
  color: var(--color-text);
}
.nav-link--active {
  color: var(--color-text);
  font-weight: 700;
}
.nav-link--active::after {
  content: "";
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-primary);
}

/* ── Acciones ────────────────────────────────────────────────── */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.nav-auth-ghost {
  color: rgba(60, 46, 31, 0.65);
}
.nav-auth-ghost:hover {
  background: rgba(255, 255, 255, 0.45);
  color: var(--color-text);
}

/* Iconos campana + engranaje */
.nav-icons-wrap {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  position: relative;
}

.nav-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  position: relative;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast);
  box-shadow: 0 1px 4px rgba(60, 46, 31, 0.1);
}
.nav-icon-btn:hover,
.nav-icon-btn--active {
  background: rgba(255, 255, 255, 0.85);
  transform: scale(1.04);
}

.notif-dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-danger);
  border: 1.5px solid var(--color-navbar);
}

/* ── Dropdowns ───────────────────────────────────────────────── */
.nav-dropdown {
  position: absolute;
  top: calc(var(--navbar-height) + 4px);
  right: 0;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 300;
  overflow: hidden;
  min-width: 255px;
  border: 1px solid var(--color-border);
}

.notif-panel {
  right: 44px;
  min-width: 230px;
}

.dp-section-label {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.67rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--color-text-muted);
  padding: 0.9rem 1rem 0.4rem;
  margin: 0;
}

.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-family: var(--font-display);
}

/* User panel */
.upanel-header {
  background: var(--color-navbar);
  border-bottom: 1.5px solid var(--color-navbar-border);
  padding: 1.35rem 1.1rem 1.1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  position: relative;
}
.upanel-close {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  transition: background var(--transition-fast);
}
.upanel-close:hover {
  background: rgba(255, 255, 255, 0.85);
}

.upanel-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  border: 2.5px solid rgba(255, 255, 255, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.15rem;
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}
.upanel-nombre {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin: 0;
}
.upanel-body {
  padding: 0.5rem 0.55rem 0.6rem;
}
.upanel-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.6rem;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}
.upanel-item:hover {
  background: var(--color-surface-alt);
}
.upanel-icon {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.upanel-icon--teal {
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
}
.upanel-icon--danger {
  background: var(--color-primary-light);
  color: var(--color-primary);
}
.upanel-label {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--color-text);
  flex: 1;
  text-align: left;
}
.upanel-item--danger .upanel-label {
  color: var(--color-primary);
}
.upanel-item--danger:hover {
  background: var(--color-primary-light);
}
.upanel-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.35rem 0;
}

/* ── Hamburguesa — oculto en desktop ─────────────────────────── */
.hamburger {
  display: none; /* visible solo en móvil vía media query */
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}
.hamburger:hover {
  background: rgba(255, 255, 255, 0.8);
}

.ham-line {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: var(--color-text);
  transition:
    transform var(--transition-normal),
    opacity var(--transition-normal),
    width var(--transition-normal);
  transform-origin: center;
}

/* Líneas cuando abierto → X */
.hamburger--open .ham-line:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.hamburger--open .ham-line:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}
.hamburger--open .ham-line:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* ── Menú móvil desplegable ──────────────────────────────────── */
.mobile-nav {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 0.5rem 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  box-shadow: 0 8px 24px rgba(60, 46, 31, 0.12);
}

.mobile-link {
  display: block;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text-soft);
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
  text-align: left;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
}
.mobile-link:hover {
  background: var(--color-surface-alt);
  color: var(--color-text);
}
.mobile-link--active {
  color: var(--color-primary);
  font-weight: 700;
}
.mobile-link--danger {
  color: var(--color-primary);
}
.mobile-link--danger:hover {
  background: var(--color-primary-light);
}

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
  box-shadow: 0 3px 10px rgba(240, 130, 99, 0.35);
}

/* ── Animaciones ─────────────────────────────────────────────── */
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
  transform-origin: top right;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-6px);
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition:
    opacity var(--transition-normal),
    transform var(--transition-normal);
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ── Responsive ──────────────────────────────────────────────── */
/* Tablet: comprimir links */
@media (max-width: 900px) {
  .nav-links {
    gap: 0;
  }
  .nav-link {
    padding: 0.35rem 0.6rem;
    font-size: 0.82rem;
  }
}

/* ≤ 768px: ocultar nav-links, mostrar hamburguesa */
@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  .nav-icons-wrap {
    display: none;
  } /* campana/engranaje se acceden por menú móvil */
  .hamburger {
    display: flex;
  }
  .nav-auth-ghost {
    display: none;
  } /* "Entrar" solo en móvil vía menú */

  /* En móvil sin sesión: solo mostrar Registrarse y hamburguesa */
  .nav-actions .btn-primary {
    display: none;
  } /* se accede por menú */
}

/* Muy pequeño: ocultar texto del logo */
@media (max-width: 380px) {
  .nav-logo-text {
    display: none;
  }
}
</style>
