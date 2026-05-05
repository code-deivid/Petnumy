<!-- src/pages/HomePage.vue -->

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store.js'

const authStore  = useAuthStore()
const isLoggedIn = computed(() => authStore.isLoggedIn)
</script>

<template>
  <div class="home">

    <!-- ── Hero ─────────────────────────────────────────────── -->
    <section class="hero">
      <div class="page-container hero-inner flex flex-col items-center gap-6">
        <div class="hero-emoji-row flex gap-3">
          <span class="hero-emoji">🐶</span>
          <span class="hero-emoji">🐱</span>
          <span class="hero-emoji">🐰</span>
        </div>

        <div class="flex flex-col items-center gap-3">
          <h1 class="hero-title">Tu veterinario, a un clic</h1>
          <p class="hero-subtitle">
            Gestiona la salud de tus mascotas, consulta clínicas y reserva citas
            sin complicaciones.
          </p>
        </div>

        <!-- CTA según sesión -->
        <div class="flex gap-3 flex-wrap items-center justify-center">
          <template v-if="isLoggedIn">
            <RouterLink :to="{ name: 'clinicas' }" class="btn btn-primary">
              Ver clínicas 🏥
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink :to="{ name: 'registro' }" class="btn btn-primary">
              Empieza gratis 🌱
            </RouterLink>
            <RouterLink :to="{ name: 'login' }" class="btn btn-outline">
              Iniciar sesión
            </RouterLink>
          </template>
        </div>
      </div>
    </section>

    <!-- ── Features ──────────────────────────────────────────── -->
    <section class="features page-container page-section">
      <div class="features-grid">

        <div class="feature-card card card-animate">
          <div class="card-body flex flex-col gap-2">
            <span class="feature-icon">🐾</span>
            <h3>Tus mascotas</h3>
            <p>Registra a tus compañeros y lleva un seguimiento de su salud y vacunas en un solo lugar.</p>
          </div>
        </div>

        <div class="feature-card card card-animate">
          <div class="card-body flex flex-col gap-2">
            <span class="feature-icon">🏥</span>
            <h3>Clínicas cercanas</h3>
            <p>Consulta clínicas veterinarias, conoce a su equipo y elige la que mejor se adapta a ti.</p>
          </div>
        </div>

        <div class="feature-card card card-animate">
          <div class="card-body flex flex-col gap-2">
            <span class="feature-icon">💉</span>
            <h3>Control de vacunas</h3>
            <p>Mantén el calendario de vacunación al día y recibe avisos cuando toque la próxima dosis.</p>
          </div>
        </div>

      </div>
    </section>

    <!-- ── CTA final (solo si no hay sesión) ─────────────────── -->
    <section v-if="!isLoggedIn" class="cta-section">
      <div class="page-container flex flex-col items-center gap-4">
        <h2 class="cta-title">¿Listo para empezar?</h2>
        <p class="cta-subtitle">Únete a Petnumy y cuida a tus mascotas como se merecen 🐾</p>
        <RouterLink :to="{ name: 'registro' }" class="btn btn-primary">
          Crear cuenta gratis
        </RouterLink>
      </div>
    </section>

  </div>
</template>

<style scoped>
/* ── Hero ───────────────────────────────────────────────────── */
.hero {
  background-color: var(--color-surface);
  border-bottom: 1.5px solid var(--color-border);
  padding: 5rem 0 4rem;
  text-align: center;
}

.hero-emoji-row {
  font-size: 2.75rem;
  line-height: 1;
}

.hero-emoji {
  display: inline-block;
  animation: pawBounce 2.5s ease-in-out infinite;
}

.hero-emoji:nth-child(2) { animation-delay: 0.3s; }
.hero-emoji:nth-child(3) { animation-delay: 0.6s; }

.hero-title {
  font-size: 2.5rem;
  color: var(--color-text);
  max-width: 520px;
}

.hero-subtitle {
  font-size: 1.05rem;
  max-width: 460px;
  color: var(--color-text-soft);
  margin: 0;
}

/* ── Features ───────────────────────────────────────────────── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
}

.feature-card {
  border-top: 3px solid var(--color-primary);
}

.feature-icon {
  font-size: 2rem;
  line-height: 1;
}

/* ── CTA final ──────────────────────────────────────────────── */
.cta-section {
  background-color: var(--color-surface);
  border-top: 1.5px solid var(--color-border);
  padding: 4rem 0;
  text-align: center;
}

.cta-title {
  font-size: 1.75rem;
  color: var(--color-text);
}

.cta-subtitle {
  font-size: 1rem;
  max-width: 400px;
  margin: 0;
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 600px) {
  .hero {
    padding: 3.5rem 0 3rem;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .hero-emoji-row {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
