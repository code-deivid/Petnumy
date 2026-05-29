<!-- src/pages/HomePage.vue -->
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store.js'

const { t } = useI18n()
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
          <h1 v-if="isLoggedIn">{{ t("home.helloUser", { name: nombre }) }}</h1>
          <h1 v-else>{{ t("home.helloGuest") }}<br>{{ t("home.helloGuestSub") }}</h1>
          <p v-if="isLoggedIn">{{ t("home.welcomeMsg", { brand: "Petnumy" }) }}</p>
          <p v-else>{{ t("home.guestMsg") }}</p>
          <div v-if="!isLoggedIn" class="hero-cta flex gap-3">
            <RouterLink :to="{ name: 'registro' }" class="btn btn-primary btn-lg">{{ t("home.startFree") }}</RouterLink>
            <RouterLink :to="{ name: 'login' }"    class="btn btn-outline btn-lg">{{ t("home.signIn") }}</RouterLink>
          </div>
          <div v-else class="hero-cta flex gap-3">
            <RouterLink :to="{ name: 'clinicas' }"    class="btn btn-primary">{{ t("home.viewClinics") }}</RouterLink>
            <RouterLink :to="{ name: 'mis-mascotas' }" class="btn btn-teal">{{ t("home.myPets") }}</RouterLink>
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
              <Icon :icon="$icons.heart" width="22" height="22" />
            </div>
            <h3>{{ t("home.feature1Title") }}</h3>
            <p>{{ t("home.feature1Desc") }}</p>
          </div>
        </div>

        <div class="card card-hover card-animate">
          <div class="card-body flex flex-col gap-3">
            <div class="feature-icon feature-icon--teal">
              <Icon :icon="$icons.home" width="22" height="22" />
            </div>
            <h3>{{ t("home.feature2Title") }}</h3>
            <p>{{ t("home.feature2Desc") }}</p>
          </div>
        </div>

        <div class="card card-hover card-animate">
          <div class="card-body flex flex-col gap-3">
            <div class="feature-icon feature-icon--teal">
              <Icon :icon="$icons.calendar" width="22" height="22" />
            </div>
            <h3>{{ t("home.feature3Title") }}</h3>
            <p>{{ t("home.feature3Desc") }}</p>
          </div>
        </div>

      </div>
    </section>

    <!-- CTA final -->
    <section v-if="!isLoggedIn" class="cta-section">
      <div class="page-container flex flex-col items-center gap-4">
        <h2>{{ t("home.ctaTitle") }}</h2>
        <p style="text-align:center; max-width:380px">{{ t("home.ctaDesc") }}</p>
        <RouterLink :to="{ name: 'registro' }" class="btn btn-primary btn-lg">{{ t("home.createFree") }}</RouterLink>
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
