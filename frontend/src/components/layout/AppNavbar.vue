<!-- src/components/layout/AppNavbar.vue -->

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'

const router    = useRouter()
const authStore = useAuthStore()

const isLoggedIn    = computed(() => authStore.isLoggedIn)
const nombreUsuario = computed(() => authStore.nombreUsuario)

async function handleLogout() {
  authStore.clearSession()
  router.push({ name: 'home' })
}
</script>

<template>
  <header class="navbar">
    <div class="page-container navbar-inner flex items-center justify-between">

      <!-- Logo -->
      <RouterLink :to="{ name: 'home' }" class="navbar-logo">
        <span class="navbar-logo-icon">🐾</span>
        <span class="navbar-logo-text">Petnumy</span>
      </RouterLink>

      <!-- Navegación -->
      <nav class="navbar-nav flex items-center gap-6">
        <RouterLink
          v-if="isLoggedIn"
          :to="{ name: 'clinicas' }"
          class="navbar-link"
          active-class="navbar-link--active"
        >
          Clínicas
        </RouterLink>
      </nav>

      <!-- Acciones de usuario -->
      <div class="navbar-actions flex items-center gap-3">
        <template v-if="isLoggedIn">
          <span class="navbar-greeting">Hola, {{ nombreUsuario }} 👋</span>
          <button class="btn btn-ghost btn-sm" @click="handleLogout">
            Salir
          </button>
        </template>
        <template v-else>
          <RouterLink :to="{ name: 'login' }" class="btn btn-ghost btn-sm">
            Entrar
          </RouterLink>
          <RouterLink :to="{ name: 'registro' }" class="btn btn-primary btn-sm">
            Registrarse
          </RouterLink>
        </template>
      </div>

    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--navbar-height);
  background-color: var(--color-surface);
  border-bottom: 1.5px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  z-index: 100;
}

.navbar-inner {
  height: 100%;
}

/* Logo */
.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.navbar-logo-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.navbar-logo-text {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--color-primary);
  letter-spacing: -0.3px;
}

/* Links de navegación */
.navbar-link {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text-soft);
  padding: 0.3rem 0;
  border-bottom: 2px solid transparent;
  transition: color var(--transition-fast),
              border-color var(--transition-fast);
}

.navbar-link:hover,
.navbar-link--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

/* Saludo */
.navbar-greeting {
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-soft);
}

/* Responsive — ocultar saludo en móvil */
@media (max-width: 640px) {
  .navbar-greeting {
    display: none;
  }

  .navbar-nav {
    display: none;
  }
}
</style>
