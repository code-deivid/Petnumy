<!-- src/pages/HomePage.vue -->
<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store.js'

const authStore  = useAuthStore()
const isLoggedIn = computed(() => authStore.isLoggedIn)
const nombre     = computed(() => authStore.nombreUsuario)
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="hero">
      <div class="page-container hero-content">
        <div class="hero-text">
          <h1 v-if="isLoggedIn">¡Hola, {{ nombre }}!</h1>
          <h1 v-else>Tu veterinario,<br>a un clic</h1>
          <p v-if="isLoggedIn">Bienvenido a <strong>Petnumy</strong>. ¿En qué te podemos ayudar hoy?</p>
          <p v-else>Gestiona la salud de tus mascotas, consulta clínicas y reserva citas sin complicaciones.</p>
          <div v-if="!isLoggedIn" class="hero-cta flex gap-3">
            <RouterLink :to="{ name: 'registro' }" class="btn btn-primary btn-lg">Empieza gratis</RouterLink>
            <RouterLink :to="{ name: 'login' }"    class="btn btn-outline btn-lg">Iniciar sesión</RouterLink>
          </div>
          <div v-else class="hero-cta flex gap-3">
            <RouterLink :to="{ name: 'clinicas' }"    class="btn btn-primary">Ver clínicas</RouterLink>
            <RouterLink :to="{ name: 'mis-mascotas' }" class="btn btn-teal">Mis mascotas</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="page-container page-section">
      <div class="features-grid">

        <div class="card card-hover card-animate">
          <div class="card-body flex flex-col gap-3">
            <div class="feature-icon feature-icon--primary">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            </div>
            <h3>Tus mascotas</h3>
            <p>Registra a tus compañeros y lleva un seguimiento de su salud y vacunas en un solo lugar.</p>
          </div>
        </div>

        <div class="card card-hover card-animate">
          <div class="card-body flex flex-col gap-3">
            <div class="feature-icon feature-icon--teal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <h3>Clínicas cercanas</h3>
            <p>Consulta clínicas veterinarias, conoce a su equipo y encuentra la que mejor se adapta a ti.</p>
          </div>
        </div>

        <div class="card card-hover card-animate">
          <div class="card-body flex flex-col gap-3">
            <div class="feature-icon feature-icon--teal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <h3>Control de vacunas</h3>
            <p>Mantén el calendario de vacunación al día y recibe avisos cuando toque la próxima dosis.</p>
          </div>
        </div>

      </div>
    </section>

    <!-- CTA final -->
    <section v-if="!isLoggedIn" class="cta-section">
      <div class="page-container flex flex-col items-center gap-4">
        <h2>¿Listo para empezar?</h2>
        <p style="text-align:center; max-width:380px">Únete a Petnumy y cuida a tus mascotas como se merecen.</p>
        <RouterLink :to="{ name: 'registro' }" class="btn btn-primary btn-lg">Crear cuenta gratis</RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 4.5rem 0 3.5rem;
}
.hero-content { max-width: 580px; }
.hero-text h1 { margin-bottom: 0.75rem; }
.hero-text p   { margin-bottom: 1.75rem; font-size: 1.05rem; }
.hero-text strong { color: var(--color-text); font-weight: 800; }

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}

.feature-icon {
  width: 46px; height: 46px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
}
.feature-icon--primary { background: var(--color-primary-light); color: var(--color-primary); }
.feature-icon--teal    { background: var(--color-teal-light);    color: var(--color-teal-dark); }

.cta-section {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 4rem 0;
  text-align: center;
}

@media (max-width: 600px) {
  .hero { padding: 3rem 0 2.5rem; }
  .hero-cta { flex-direction: column; align-items: flex-start; }
  .features-grid { grid-template-columns: 1fr; }
}
</style>
