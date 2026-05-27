<!-- src/pages/LandingPage.vue -->
<!-- Página pública de bienvenida. Visible SOLO cuando no hay sesión. -->
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <div class="landing">
    <!-- ── Hero principal ──────────────────────────────────── -->
    <section class="hero">
      <div class="page-container hero-inner">
        <!-- Columna izquierda: texto -->
        <div class="hero-text">
          <div class="hero-brand">
            <span>{{ t("landing.brand") }}</span>
          </div>

          <h1 class="hero-title" v-html="t('landing.title')"></h1>
          <p class="hero-desc">{{ t("landing.desc") }}</p>

          <div class="hero-stats">
            <div class="hero-stat">
              <span class="stat-val">12k</span>
              <span class="stat-lbl">{{ t("landing.families") }}</span>
            </div>
            <div class="hero-stat">
              <span class="stat-val">380+</span>
              <span class="stat-lbl">{{ t("landing.clinics") }}</span>
            </div>
            <div class="hero-stat">
              <span class="stat-val">4.9</span>
              <span class="stat-lbl">{{ t("landing.rating") }}</span>
            </div>
          </div>
        </div>

        <!-- Columna derecha: CTAs -->
        <div class="hero-cta-col">
          <div class="hero-cta-card card">
            <div class="card-body">
              <h2 class="cta-title">{{ t("landing.ctaTitle") }}</h2>
              <p class="cta-desc">{{ t("landing.ctaDesc") }}</p>
              <div class="cta-btns">
                <RouterLink
                  :to="{ name: 'registro' }"
                  class="btn btn-primary btn-block btn-lg"
                >
                  {{ t("landing.createAccount") }}
                </RouterLink>
                <RouterLink
                  :to="{ name: 'login' }"
                  class="btn btn-outline btn-block btn-lg"
                >
                  {{ t("landing.alreadyAccount") }}
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Features ────────────────────────────────────────── -->
    <section class="features page-container page-section">
      <div class="features-grid">
        <div class="feature-item card card-animate">
          <div class="card-body">
            <div class="feature-icon feature-icon--primary">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                />
              </svg>
            </div>
            <h3>{{ t("landing.featurePetsTitle") }}</h3>
            <p>{{ t("landing.featurePetsDesc") }}</p>
          </div>
        </div>

        <div class="feature-item card card-animate">
          <div class="card-body">
            <div class="feature-icon feature-icon--teal">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h3>{{ t("landing.featureClinicsTitle") }}</h3>
            <p>{{ t("landing.featureClinicsDesc") }}</p>
          </div>
        </div>

        <div class="feature-item card card-animate">
          <div class="card-body">
            <div class="feature-icon feature-icon--teal">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3>{{ t("landing.featureAppointmentsTitle") }}</h3>
            <p>{{ t("landing.featureAppointmentsDesc") }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing {
  min-height: calc(100vh - var(--navbar-height));
}

/* ── Hero ───────────────────────────────────────────────────── */
.hero {
  padding: 3.5rem 0 2.5rem;
}

.hero-inner {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 3rem;
  align-items: center;
}

/* Texto izquierda */
.hero-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--color-text);
  margin-bottom: 1.5rem;

  
}

.hero-title {
  font-size: clamp(2.25rem, 5vw, 3.25rem);
  line-height: 1.1;
  letter-spacing: -0.8px;
  color: var(--color-text);
  margin-bottom: 1rem;
}

.hero-desc {
  font-size: 0.9375rem;
  color: var(--color-text-soft);
  max-width: 420px;
  line-height: 1.65;
  margin-bottom: 2rem;
}

.hero-stats {
  display: flex;
  gap: 2rem;
}

.hero-stat {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.stat-val {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.6rem;
  color: var(--color-primary);
  line-height: 1;
}

.stat-lbl {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--color-text-muted);
}

/* CTA card derecha */
.hero-cta-col {
  width: 340px;
  flex-shrink: 0;
}

.hero-cta-card {
  box-shadow: var(--shadow-lg);
}

.cta-title {
  font-size: 1.35rem;
  margin-bottom: 0.4rem;
}

.cta-desc {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.cta-btns {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ── Features ───────────────────────────────────────────────── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--card-gap);
}

.feature-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}
.feature-icon--primary {
  background: var(--color-primary-light);
  color: var(--color-primary);
}
.feature-icon--teal {
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
}

.feature-item h3 {
  margin-bottom: 0.4rem;
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 900px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .hero-cta-col {
    width: 100%;
    max-width: 420px;
  }
  .features-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 580px) {
  .hero {
    padding: 2rem 0 1.5rem;
  }
  .hero-title {
    font-size: 2rem;
  }
  .hero-stats {
    gap: 1.5rem;
  }
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
