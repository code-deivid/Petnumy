// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'

// ── Páginas ────────────────────────────────────────────────────
const LandingPage       = () => import('@/pages/LandingPage.vue')
const HomePage          = () => import('@/pages/HomePage.vue')
const LoginPage         = () => import('@/pages/LoginPage.vue')
const RegistroPage      = () => import('@/pages/RegistroPage.vue')
const ClinicasPage      = () => import('@/pages/ClinicasPage.vue')
const ClinicaDetallePage = () => import('@/pages/ClinicaDetallePage.vue')
const MisMascotasPage   = () => import('@/pages/MisMascotasPage.vue')
const NuevaMascotaPage  = () => import('@/pages/NuevaMascotaPage.vue')
const MisCitasPage      = () => import('@/pages/MisCitasPage.vue')
const NuevaCitaPage     = () => import('@/pages/NuevaCitaPage.vue')


const routes = [
  // ── Pública: landing de bienvenida ──────────────────────────
  {
    path: '/',
    name: 'landing',
    component: LandingPage,
    meta: { requiresAuth: false, redirectIfAuth: true }
    // Si ya hay sesión → redirige a /mis-mascotas
  },

  // ── Rutas de auth ────────────────────────────────────────────
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

  // ── Rutas privadas ───────────────────────────────────────────
  {
    path: '/home',
    name: 'home',
    component: HomePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/mis-mascotas',
    name: 'mis-mascotas',
    component: MisMascotasPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/nueva-mascota',
    name: 'nueva-mascota',
    component: NuevaMascotaPage,
    meta: { requiresAuth: true }
  },
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
  {
    path: '/mis-citas',
    name: 'mis-citas',
    component: MisCitasPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/nueva-cita',
    name: 'nueva-cita',
    component: NuevaCitaPage,
    meta: { requiresAuth: true }
  },

  // ── Fallback ─────────────────────────────────────────────────
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' })
})

// ── Guard global ─────────────────────────────────────────────────
router.beforeEach((to) => {
  const authStore = useAuthStore()

  // Ruta privada sin sesión → login
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Landing/login/registro con sesión activa → mis mascotas
  if (to.meta.redirectIfAuth && authStore.isLoggedIn) {
    return { name: 'mis-mascotas' }
  }
})

export default router
