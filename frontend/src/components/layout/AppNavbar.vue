<!-- src/components/layout/AppNavbar.vue -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const isLoggedIn    = computed(() => authStore.isLoggedIn)
const nombreUsuario = computed(() => authStore.nombreUsuario)
const iniciales     = computed(() => {
  const n = authStore.usuario?.nombre || ''
  const a = authStore.usuario?.apellidos || ''
  return ((n[0] || '') + (a[0] || '')).toUpperCase() || 'U'
})

const menuAbierto  = ref(false)
const notifAbiertas = ref(false)
const menuRef      = ref(null)

function toggleMenu() {
  menuAbierto.value  = !menuAbierto.value
  notifAbiertas.value = false
}
function toggleNotif() {
  notifAbiertas.value = !notifAbiertas.value
  menuAbierto.value   = false
}
function cerrarTodo() {
  menuAbierto.value   = false
  notifAbiertas.value = false
}

function handleClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) cerrarTodo()
}

onMounted(()    => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

function handleLogout() {
  cerrarTodo()
  authStore.clearSession()
  router.push({ name: 'home' })
}

function irA(name) {
  cerrarTodo()
  router.push({ name })
}
</script>

<template>
  <header class="navbar">
    <div class="page-container navbar-inner">

      <!-- Logo -->
      <RouterLink :to="{ name: 'home' }" class="navbar-logo" @click="cerrarTodo">
        <svg class="navbar-logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#F4845F" opacity="0.15"/>
          <path d="M10 20 Q16 10 22 20" stroke="#F4845F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <circle cx="11" cy="13" r="2" fill="#F4845F"/>
          <circle cx="21" cy="13" r="2" fill="#F4845F"/>
          <circle cx="16" cy="18" r="1.5" fill="#5CC8C0"/>
        </svg>
        <span class="navbar-logo-text">Petnumy</span>
      </RouterLink>

      <!-- Nav links -->
      <nav class="navbar-nav">
        <RouterLink :to="{ name: 'home' }"       class="nav-link" active-class="nav-link--active">Inicio</RouterLink>
        <RouterLink v-if="isLoggedIn" :to="{ name: 'clinicas' }"     class="nav-link" active-class="nav-link--active">Clínicas</RouterLink>
        <RouterLink v-if="isLoggedIn" :to="{ name: 'mis-mascotas' }" class="nav-link" active-class="nav-link--active">Mis Mascotas</RouterLink>
        <RouterLink v-if="isLoggedIn" :to="{ name: 'mis-citas' }"    class="nav-link" active-class="nav-link--active">Mis Citas</RouterLink>
        <template v-if="!isLoggedIn">
          <RouterLink :to="{ name: 'login' }"   class="btn btn-ghost btn-sm">Entrar</RouterLink>
          <RouterLink :to="{ name: 'registro' }" class="btn btn-primary btn-sm">Registrarse</RouterLink>
        </template>
      </nav>

      <!-- Zona derecha (solo logueado) -->
      <div v-if="isLoggedIn" class="navbar-right" ref="menuRef">

        <!-- Campana notificaciones -->
        <button class="navbar-icon-btn" :class="{ active: notifAbiertas }" @click.stop="toggleNotif" aria-label="Notificaciones">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span class="notif-dot" />
        </button>

        <!-- Dropdown notificaciones -->
        <Transition name="dropdown">
          <div v-if="notifAbiertas" class="dropdown notif-dropdown">
            <p class="dropdown-title">Notificaciones</p>
            <div class="notif-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              <span>Sin notificaciones</span>
            </div>
          </div>
        </Transition>

        <!-- Avatar -->
        <button class="navbar-avatar" :class="{ active: menuAbierto }" @click.stop="toggleMenu" aria-label="Menú de usuario">
          <span class="avatar-iniciales">{{ iniciales }}</span>
        </button>

        <!-- Dropdown usuario (igual que la referencia) -->
        <Transition name="dropdown">
          <div v-if="menuAbierto" class="dropdown user-dropdown">

            <!-- Cabecera beige con avatar grande -->
            <div class="udrop-header">
              <div class="udrop-avatar-lg">
                <span>{{ iniciales }}</span>
              </div>
              <p class="udrop-saludo">¡Hola, {{ nombreUsuario }}!</p>
            </div>

            <!-- Sección configuración -->
            <div class="udrop-body">
              <p class="udrop-section-label">Configuración</p>

              <button class="udrop-item" @click="irA('home')">
                <span class="udrop-item-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <span class="udrop-item-label">Perfil</span>
                <svg class="udrop-item-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>

              <button class="udrop-item" @click="irA('mis-mascotas')">
                <span class="udrop-item-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 1.844-2.5"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-1.844-2.5"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75z"/><path d="M4.42 11.247A13.152 13.152 0 0012 13c2.718 0 5.27-.794 7.58-2.253"/></svg>
                </span>
                <span class="udrop-item-label">Mis mascotas</span>
                <svg class="udrop-item-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>

              <div class="udrop-divider" />

              <!-- Cerrar sesión -->
              <button class="udrop-item udrop-item--danger" @click="handleLogout">
                <span class="udrop-item-icon udrop-item-icon--danger">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </span>
                <span class="udrop-item-label">Cerrar Sesión</span>
              </button>
            </div>

          </div>
        </Transition>

      </div>
      <!-- Botones auth en móvil si no logueado -->
      <div v-else class="navbar-auth-mobile">
        <RouterLink :to="{ name: 'login' }"    class="btn btn-ghost btn-sm">Entrar</RouterLink>
        <RouterLink :to="{ name: 'registro' }" class="btn btn-primary btn-sm">Registrarse</RouterLink>
      </div>

    </div>
  </header>
</template>

<style scoped>
/* ── Base navbar ────────────────────────────────────────────── */
.navbar {
  position: fixed; top: 0; left: 0; right: 0;
  height: var(--navbar-height);
  background-color: var(--color-navbar);
  background-image: repeating-linear-gradient(
    90deg, transparent, transparent 30px,
    rgba(160,130,90,0.18) 30px, rgba(160,130,90,0.18) 32px
  );
  box-shadow: 0 2px 10px rgba(61,43,31,0.13);
  z-index: 200;
}

.navbar-inner {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 2rem;
}

/* Logo */
.navbar-logo { display: flex; align-items: center; gap: 0.55rem; flex-shrink: 0; }
.navbar-logo-icon { width: 34px; height: 34px; }
.navbar-logo-text {
  font-family: var(--font-display); font-weight: 800; font-size: 1.15rem;
  color: var(--color-text); letter-spacing: -0.2px;
}

/* Nav links */
.navbar-nav {
  display: flex; align-items: center; gap: 0.25rem;
  flex: 1;
}

.nav-link {
  font-family: var(--font-display); font-weight: 600; font-size: 0.9rem;
  color: var(--color-text-soft);
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-full);
  transition: background var(--transition-fast), color var(--transition-fast);
}
.nav-link:hover      { background: rgba(255,255,255,0.45); color: var(--color-text); }
.nav-link--active    { color: var(--color-primary); background: rgba(244,132,95,0.12); }

/* Auth buttons en nav */
.navbar-nav .btn { margin-left: auto; }
.navbar-nav .btn + .btn { margin-left: 0.5rem; }

/* Zona derecha */
.navbar-right {
  display: flex; align-items: center; gap: 0.5rem;
  position: relative; flex-shrink: 0;
}

/* Botón icono campana */
.navbar-icon-btn {
  width: 38px; height: 38px; border-radius: 50%;
  background: rgba(255,255,255,0.5);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-soft); position: relative;
  transition: background var(--transition-fast), transform var(--transition-fast);
  box-shadow: var(--shadow-xs);
}
.navbar-icon-btn:hover, .navbar-icon-btn.active {
  background: rgba(255,255,255,0.85); color: var(--color-text);
  transform: scale(1.05);
}

.notif-dot {
  position: absolute; top: 7px; right: 7px;
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid var(--color-navbar);
}

/* Avatar */
.navbar-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--color-teal);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(92,200,192,0.4);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.navbar-avatar:hover, .navbar-avatar.active {
  transform: scale(1.07);
  box-shadow: 0 4px 14px rgba(92,200,192,0.55);
}
.avatar-iniciales {
  font-family: var(--font-display); font-weight: 800; font-size: 0.8rem; color: #fff;
}

/* ── Dropdown base ──────────────────────────────────────────── */
.dropdown {
  position: absolute; top: calc(100% + 10px); right: 0;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 240px; z-index: 300;
  overflow: hidden;
}

/* Dropdown notificaciones */
.notif-dropdown { right: 42px; }
.dropdown-title {
  font-family: var(--font-display); font-weight: 700; font-size: 0.85rem;
  color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px;
  padding: 1rem 1.1rem 0.5rem;
}
.notif-empty {
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  padding: 1.5rem; color: var(--color-text-muted); font-size: 0.85rem;
}

/* ── User dropdown ──────────────────────────────────────────── */
/* Cabecera beige */
.udrop-header {
  background-color: var(--color-navbar);
  background-image: repeating-linear-gradient(
    90deg, transparent, transparent 30px,
    rgba(160,130,90,0.15) 30px, rgba(160,130,90,0.15) 32px
  );
  padding: 1.5rem 1.25rem 1.25rem;
  display: flex; flex-direction: column; align-items: center; gap: 0.65rem;
}

.udrop-avatar-lg {
  width: 64px; height: 64px; border-radius: 50%;
  background: rgba(255,255,255,0.6);
  border: 3px solid rgba(255,255,255,0.8);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(61,43,31,0.12);
}
.udrop-avatar-lg span {
  font-family: var(--font-display); font-weight: 800;
  font-size: 1.3rem; color: var(--color-text-soft);
}

.udrop-saludo {
  font-family: var(--font-display); font-weight: 800;
  font-size: 1.05rem; color: var(--color-text);
  text-transform: uppercase; letter-spacing: 0.5px;
  margin: 0;
}

/* Body */
.udrop-body { padding: 0.75rem 0.75rem 0.75rem; }

.udrop-section-label {
  font-family: var(--font-display); font-weight: 700;
  font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.6px;
  color: var(--color-text-muted); padding: 0 0.5rem 0.5rem; margin: 0;
}

.udrop-item {
  width: 100%; display: flex; align-items: center; gap: 0.75rem;
  padding: 0.7rem 0.75rem; border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}
.udrop-item:hover { background: var(--color-surface-alt); }

.udrop-item-icon {
  width: 32px; height: 32px; border-radius: var(--radius-sm);
  background: var(--color-teal-light);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-teal); flex-shrink: 0;
}
.udrop-item-icon--danger { background: var(--color-primary-light); color: var(--color-primary); }

.udrop-item-label {
  font-family: var(--font-display); font-weight: 600;
  font-size: 0.9rem; color: var(--color-text); flex: 1; text-align: left;
}
.udrop-item--danger .udrop-item-label { color: var(--color-primary); }
.udrop-item--danger:hover { background: var(--color-primary-light); }

.udrop-item-arrow { color: var(--color-text-muted); flex-shrink: 0; }

.udrop-divider { height: 1px; background: var(--color-border); margin: 0.5rem 0; }

/* Auth móvil */
.navbar-auth-mobile { display: flex; align-items: center; gap: 0.5rem; margin-left: auto; }

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 640px) {
  .navbar-logo-text { display: none; }
  .navbar-nav { gap: 0; }
  .nav-link { padding: 0.4rem 0.5rem; font-size: 0.82rem; }
}
@media (max-width: 480px) {
  .navbar-nav .btn { display: none; }
}
</style>
