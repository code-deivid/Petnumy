<!-- src/components/layout/AppNavbar.vue — Design v5 -->
<!-- ⚠️  SCRIPT SETUP: lógica 100% intacta — solo se adapta el template y el estilo -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'

const router    = useRouter()
const authStore = useAuthStore()

const isLoggedIn    = computed(() => authStore.isLoggedIn)
const nombreUsuario = computed(() => authStore.nombreUsuario)
const iniciales     = computed(() => {
  const n = authStore.usuario?.nombre    || ''
  const a = authStore.usuario?.apellidos || ''
  return ((n[0] || '') + (a[0] || '')).toUpperCase() || 'U'
})

const menuAbierto   = ref(false)
const notifAbiertas = ref(false)
const navRef        = ref(null)

function toggleMenu()  { menuAbierto.value = !menuAbierto.value; notifAbiertas.value = false }
function toggleNotif() { notifAbiertas.value = !notifAbiertas.value; menuAbierto.value = false }
function cerrarTodo()  { menuAbierto.value = false; notifAbiertas.value = false }

function handleClickOutside(e) {
  if (navRef.value && !navRef.value.contains(e.target)) cerrarTodo()
}
onMounted(()    => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

function handleLogout() {
  cerrarTodo()
  authStore.clearSession()
  router.push({ name: 'landing' })
}
function irA(name) { cerrarTodo(); router.push({ name }) }
</script>

<template>
  <header class="navbar" ref="navRef">
    <div class="nav-inner page-container">

      <!-- ── Logo ──────────────────────────────────────────── -->
      <RouterLink :to="{ name: 'home' }" class="nav-logo" @click="cerrarTodo">
        <!-- Icono perro — exacto del prototipo: fill #3C2E1F sólido -->
        <svg class="nav-logo-icon" viewBox="0 0 48 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 34c0-2 1-3.5 2.5-3.5h22c3.5 0 6.5 2 8.5 5l2 2.5v-4c0-1-.9-2-2-2H36v-6h-3v6H15v-6h-3v6h-2c-1 0-2-.9-2-2V22c0-2 1-3 2.5-3H38c2 0 3.5 1 3.5 3v12" fill="#3C2E1F"/>
          <rect x="32" y="16" width="12" height="10" rx="2" fill="#3C2E1F"/>
          <rect x="8" y="10" width="13" height="13" rx="3.5" fill="#3C2E1F"/>
          <rect x="4" y="7" width="9" height="11" rx="3.5" fill="#3C2E1F"/>
          <circle cx="8.5" cy="13" r="1.5" fill="#F5EFE3"/>
          <rect x="30" y="30" width="6" height="7" rx="2" fill="#3C2E1F"/>
          <rect x="18" y="30" width="6" height="7" rx="2" fill="#3C2E1F"/>
        </svg>
        <span class="nav-logo-text">Petnumy</span>
      </RouterLink>

      <!-- ── Nav links (centro) ─────────────────────────────── -->
      <nav class="nav-links">
        <RouterLink
          v-if="isLoggedIn"
          :to="{ name: 'home' }"
          class="nav-link"
          active-class="nav-link--active"
        >
          Home
        </RouterLink>
        <RouterLink
          v-if="isLoggedIn"
          :to="{ name: 'mis-mascotas' }"
          class="nav-link"
          active-class="nav-link--active"
        >
          Mis Mascotas
        </RouterLink>
        <RouterLink
          v-if="isLoggedIn"
          :to="{ name: 'mis-citas' }"
          class="nav-link"
          active-class="nav-link--active"
        >
          Mis Citas
        </RouterLink>
        <RouterLink
          v-if="isLoggedIn"
          :to="{ name: 'clinicas' }"
          class="nav-link"
          active-class="nav-link--active"
        >
          Veterinarios
        </RouterLink>
      </nav>

      <!-- ── Acciones derecha ───────────────────────────────── -->
      <div class="nav-actions">

        <!-- Sin sesión -->
        <template v-if="!isLoggedIn">
          <RouterLink :to="{ name: 'login' }"    class="btn btn-ghost btn-sm">Entrar</RouterLink>
          <RouterLink :to="{ name: 'registro' }" class="btn btn-primary btn-sm">Registrarse</RouterLink>
        </template>

        <!-- Con sesión: campana + engranaje -->
        <template v-else>

          <!-- Campana notificaciones -->
          <button
            class="nav-icon-btn"
            :class="{ 'nav-icon-btn--active': notifAbiertas }"
            @click.stop="toggleNotif"
            aria-label="Notificaciones"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span class="nav-notif-dot" />
          </button>

          <!-- Engranaje / menú usuario -->
          <button
            class="nav-icon-btn"
            :class="{ 'nav-icon-btn--active': menuAbierto }"
            @click.stop="toggleMenu"
            aria-label="Menú usuario"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>

          <!-- Dropdown notificaciones -->
          <Transition name="dropdown">
            <div v-if="notifAbiertas" class="nav-dropdown notif-dropdown">
              <p class="dropdown-section-label">Notificaciones</p>
              <div class="notif-empty-state">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                <span>Sin notificaciones</span>
              </div>
            </div>
          </Transition>

          <!-- Dropdown menú usuario -->
          <Transition name="dropdown">
            <div v-if="menuAbierto" class="nav-dropdown user-dropdown">

              <!-- Cabecera con fondo navbar (durazno del prototipo) -->
              <div class="udrop-header">
                <button class="udrop-close" @click="cerrarTodo" aria-label="Cerrar">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
                <div class="udrop-avatar">{{ iniciales }}</div>
                <p class="udrop-nombre">¡Hola, {{ nombreUsuario }}!</p>
              </div>

              <!-- Items de configuración -->
              <div class="udrop-body">
                <p class="dropdown-section-label">Configuración</p>

                <button class="udrop-item" @click="irA('home')">
                  <span class="udrop-item-icon udrop-item-icon--teal">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <span class="udrop-item-label">Perfil</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>

                <button class="udrop-item" @click="irA('mis-mascotas')">
                  <span class="udrop-item-icon udrop-item-icon--teal">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 1.844-2.5"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-1.844-2.5"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75z"/><path d="M4.42 11.247A13.152 13.152 0 0012 13c2.718 0 5.27-.794 7.58-2.253"/></svg>
                  </span>
                  <span class="udrop-item-label">Mis mascotas</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>

                <button class="udrop-item" @click="irA('mis-citas')">
                  <span class="udrop-item-icon udrop-item-icon--teal">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </span>
                  <span class="udrop-item-label">Mis citas</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>

                <div class="udrop-divider" />

                <button class="udrop-item udrop-item--danger" @click="handleLogout">
                  <span class="udrop-item-icon udrop-item-icon--danger">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </span>
                  <span class="udrop-item-label">Cerrar Sesión</span>
                </button>

              </div>
            </div>
          </Transition>

        </template>
      </div>

    </div>
  </header>
</template>

<style scoped>
/* ── Base navbar — durazno suave exacto del prototipo ────────── */
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: var(--navbar-height);        /* 90px — exacto del prototipo */
  background-color: var(--color-navbar);        /* #F2C8A7 */
  border-bottom: 2px solid var(--color-navbar-border); /* #E6B991 */
  box-shadow: 0 2px 8px rgba(60,46,31,0.10);
  z-index: 200;
}

.nav-inner {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 2rem;
}

/* ── Logo ───────────────────────────────────────────────────── */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
  text-decoration: none;
}

.nav-logo-icon {
  width: 38px;
  height: 30px;
}

.nav-logo-text {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--color-text);
  letter-spacing: -0.2px;
}

/* ── Nav links — centrados ───────────────────────────────────── */
.nav-links {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  flex: 1;
  justify-content: center;
}

.nav-link {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.875rem;
  color: rgba(60,46,31,0.65);
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-full);
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
  position: relative;
}

.nav-link:hover {
  background: rgba(255,255,255,0.45);
  color: var(--color-text);
}

/* Activo: color texto oscuro + punto indicador debajo */
.nav-link--active {
  color: var(--color-text);
  font-weight: 700;
}
.nav-link--active::after {
  content: '';
  position: absolute;
  bottom: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-primary);
}

/* ── Acciones derecha ────────────────────────────────────────── */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  position: relative;
}

/* Botones icono (campana + engranaje) — círculo blanco opaco del prototipo */
.nav-icon-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  position: relative;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast);
  box-shadow: 0 1px 4px rgba(60,46,31,0.10);
}

.nav-icon-btn:hover,
.nav-icon-btn--active {
  background: rgba(255,255,255,0.92);
  transform: scale(1.04);
}

/* Punto rojo notificación */
.nav-notif-dot {
  position: absolute;
  top: 9px; right: 9px;
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--color-danger);
  border: 1.5px solid var(--color-navbar);
}

/* ── Dropdown base ───────────────────────────────────────────── */
.nav-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: var(--color-surface);
  border-radius: var(--radius-lg);   /* 24px */
  box-shadow: var(--shadow-xl);
  z-index: 300;
  overflow: hidden;
  min-width: 260px;
}

.dropdown-section-label {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--color-text-muted);
  padding: 1rem 1.1rem 0.5rem;
  margin: 0;
}

/* Notif dropdown */
.notif-dropdown { right: 50px; min-width: 240px; }
.notif-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.75rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  font-family: var(--font-display);
}

/* ── User dropdown ───────────────────────────────────────────── */
.udrop-header {
  background-color: var(--color-navbar);   /* mismo durazno que la navbar */
  border-bottom: 1.5px solid var(--color-navbar-border);
  padding: 1.5rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  position: relative;
}

.udrop-close {
  position: absolute;
  top: 0.75rem; right: 0.75rem;
  width: 26px; height: 26px;
  border-radius: 50%;
  background: rgba(255,255,255,0.55);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text);
  transition: background var(--transition-fast);
}
.udrop-close:hover { background: rgba(255,255,255,0.85); }

.udrop-avatar {
  width: 58px; height: 58px;
  border-radius: 50%;
  background: rgba(255,255,255,0.55);
  border: 3px solid rgba(255,255,255,0.75);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.2rem;
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}

.udrop-nombre {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.udrop-body { padding: 0.6rem 0.6rem 0.75rem; }

.udrop-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.7rem;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}
.udrop-item:hover { background: var(--color-surface-alt); }

.udrop-item-icon {
  width: 28px; height: 28px;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.udrop-item-icon--teal   { background: var(--color-teal-light);    color: var(--color-teal-dark); }
.udrop-item-icon--danger { background: var(--color-primary-light);  color: var(--color-primary); }

.udrop-item-label {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
  flex: 1;
  text-align: left;
}
.udrop-item--danger .udrop-item-label { color: var(--color-primary); }
.udrop-item--danger:hover { background: var(--color-primary-light); }

.udrop-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.4rem 0;
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 900px) {
  .nav-links { gap: 0; }
  .nav-link  { padding: 0.4rem 0.6rem; font-size: 0.82rem; }
}

@media (max-width: 680px) {
  .nav-logo-text { display: none; }
}

@media (max-width: 540px) {
  .nav-links { display: none; }
  .nav-inner { gap: 0.75rem; }
}
</style>
