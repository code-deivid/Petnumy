// src/router/index.js
// ============================================================
//  Router de Petnumy
//
//  Rutas públicas  → accesibles sin sesión
//  Rutas privadas  → redirigen a /login si no hay sesión
//  Rutas de auth   → redirigen a /home si ya hay sesión
//    (para que un usuario logado no vea Login ni Registro)
// ============================================================

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'

// Carga diferida (lazy load) de páginas para mejor rendimiento
const HomePage            = () => import('@/pages/HomePage.vue')
const LoginPage           = () => import('@/pages/LoginPage.vue')
const RegistroPage        = () => import('@/pages/RegistroPage.vue')
const ClinicasPage        = () => import('@/pages/ClinicasPage.vue')
const ClinicaDetallePage  = () => import('@/pages/ClinicaDetallePage.vue')

const routes = [
  // ── Rutas públicas ───────────────────────────────────────
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: { requiresAuth: false }
  },

  // ── Rutas de autenticación (redirigen si ya hay sesión) ──
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { requiresAuth: false, redirectIfAuth: true }
  },
  {
    path: '/registro',
    name: 'registro',
    component: RegistroPage,
    meta: { requiresAuth: false, redirectIfAuth: true }
  },

  // ── Rutas privadas ───────────────────────────────────────
  {
    path: '/clinicas',
    name: 'clinicas',
    component: ClinicasPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/clinicas/:id',
    name: 'clinica-detalle',
    component: ClinicaDetallePage,
    meta: { requiresAuth: true }
  },

  // ── Fallback 404 → redirige a home ───────────────────────
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // Scroll al inicio en cada navegación
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' })
})

// ── Guard global de navegación ───────────────────────────────
router.beforeEach((to) => {
  const authStore = useAuthStore()

  // Ruta privada y no hay sesión → redirige a login
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Ruta de auth y ya hay sesión → redirige a clínicas
  if (to.meta.redirectIfAuth && authStore.isLoggedIn) {
    return { name: 'clinicas' }
  }
})

export default router
