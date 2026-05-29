<script setup>
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth.store.js";

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const year = new Date().getFullYear();
const loggedIn = computed(() => auth.isLoggedIn);
</script>

<template>
  <footer class="pf-footer">
    <!-- ── Noise / gradient overlay decorativo ────────────── -->
    <div class="pf-bg-deco" aria-hidden="true" />

    <!-- ══ CUERPO PRINCIPAL ══════════════════════════════════ -->
    <div class="page-container pf-body">
      <!-- ── Columna marca ──────────────────────────────────── -->
      <div class="pf-brand">
        <!-- Logo real -->
        <RouterLink
          :to="{ name: loggedIn ? 'home' : 'landing' }"
          class="pf-logo-link"
          aria-label="Petnumy"
        >
          <img
            src="@/assets/logo/Logo Petnumy.svg"
            alt="Petnumy"
            class="pf-logo-img"
          />
          <span class="pf-logo-text">Petnumy</span>
        </RouterLink>

        <!-- Descripción -->
        <p class="pf-desc">{{ t("footer.desc") }}</p>
      </div>

      <!-- ── Columna Plataforma ──────────────────────────────── -->
      <div class="pf-col">
        <h3 class="pf-col-title">{{ t("footer.platform") }}</h3>
        <nav class="pf-nav" aria-label="Plataforma">
          <RouterLink
            :to="{ name: loggedIn ? 'home' : 'landing' }"
            class="pf-link"
          >
            <Icon aria-hidden="true" :icon="$icons.home" width="13" height="13" />
            {{ t("footer.home") }}
          </RouterLink>
          <RouterLink :to="{ name: 'clinicas' }" class="pf-link">
            <Icon aria-hidden="true" :icon="$icons.location" width="13" height="13" />
            {{ t("footer.clinics") }}
          </RouterLink>
          <RouterLink :to="{ name: 'mis-mascotas' }" class="pf-link">
            <Icon aria-hidden="true" :icon="$icons.pets" width="13" height="13" />
            {{ t("footer.myPets") }}
          </RouterLink>
          <RouterLink :to="{ name: 'mis-citas' }" class="pf-link">
            <Icon aria-hidden="true" :icon="$icons.calendar" width="13" height="13" />
            {{ t("footer.myAppointments") }}
          </RouterLink>
        </nav>
      </div>

      <!-- ── Columna Cuenta ──────────────────────────────────── -->
      <div class="pf-col">
        <h3 class="pf-col-title">{{ t("footer.account") }}</h3>
        <nav class="pf-nav" aria-label="Cuenta">
          <RouterLink :to="{ name: 'login' }" class="pf-link">
            <Icon aria-hidden="true" :icon="$icons.login" width="13" height="13" />
            {{ t("footer.signIn") }}
          </RouterLink>
          <RouterLink :to="{ name: 'registro' }" class="pf-link">
            <Icon aria-hidden="true" :icon="$icons.addCircle" width="13" height="13" />
            {{ t("footer.signUp") }}
          </RouterLink>
          <RouterLink v-if="loggedIn" :to="{ name: 'perfil' }" class="pf-link">
            <Icon aria-hidden="true" :icon="$icons.user" width="13" height="13" />
            {{ t("footer.profile") }}
          </RouterLink>
        </nav>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* ════════════════════════════════════════════════════════════
   FOOTER PREMIUM — Petnumy v2
   ════════════════════════════════════════════════════════════ */

.pf-footer {
  position: relative;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  margin-top: auto;
  overflow: hidden;
}

/* ── Deco de fondo: gradiente muy suave ───────────────────── */
.pf-bg-deco {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse 80% 60% at 0% 100%,
      rgba(124, 203, 194, 0.06) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse 60% 40% at 100% 0%,
      rgba(240, 130, 99, 0.05) 0%,
      transparent 55%
    );
  pointer-events: none;
  z-index: 0;
}

/* ── Cuerpo grid ──────────────────────────────────────────── */
.pf-body {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.7fr 1fr 1fr 1fr;
  gap: 3rem 2.5rem;
  padding-top: 3.5rem;
  padding-bottom: 3rem;
  align-items: start;
}

/* ── Columna marca ────────────────────────────────────────── */
.pf-brand {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pf-logo-link {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  width: fit-content;
  transition: opacity 200ms ease;
}
.pf-logo-link:hover {
  opacity: 0.8;
}

.pf-logo-img {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  object-fit: contain;
}

.pf-logo-text {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.2rem;
  color: var(--color-text);
  letter-spacing: -0.3px;
}

.pf-desc {
  font-size: 0.845rem;
  color: var(--color-text-muted);
  line-height: 1.65;
  max-width: 240px;
  margin: 0;
}

/* Badge de tecnología */
.pf-tech-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.68rem;
  color: var(--color-text-muted);
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 0.28rem 0.75rem;
  width: fit-content;
  letter-spacing: 0.1px;
  transition:
    border-color 200ms ease,
    color 200ms ease;
}
.pf-tech-badge:hover {
  border-color: var(--color-teal-mid);
  color: var(--color-teal-dark);
}
.pf-tech-badge svg {
  flex-shrink: 0;
  color: var(--color-teal-dark);
}

/* ── Columnas nav ─────────────────────────────────────────── */
.pf-col {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.pf-col-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-text);
  margin: 0 0 1.1rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--color-border);
}

.pf-nav {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

/* Links de navegación */
.pf-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  margin: 0 -0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.845rem;
  color: var(--color-text-soft);
  text-decoration: none;
  transition:
    color 160ms ease,
    background 160ms ease,
    padding-left 160ms ease;
  width: calc(100% + 1rem);
  -webkit-tap-highlight-color: transparent;
}
.pf-link svg {
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: color 160ms ease;
}
.pf-link:hover {
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding-left: 0.75rem;
}
.pf-link:hover svg {
  color: var(--color-primary);
}

/* Links estáticos (no son RouterLink) */
.pf-link--static {
  cursor: default;
  pointer-events: none;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}
.pf-link--static svg {
  color: var(--color-teal-dark);
}

/* ── Separador ────────────────────────────────────────────── */
.pf-divider {
  position: relative;
  z-index: 1;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent 0%,
    var(--color-border) 15%,
    var(--color-border) 85%,
    transparent 100%
  );
  margin: 0 var(--page-padding);
}

/* ── Bottom bar ───────────────────────────────────────────── */
.pf-bottom {
  position: relative;
  z-index: 1;
  padding: 1rem 0;
}

.pf-bottom-inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
}

.pf-copy {
  font-size: 0.765rem;
  color: var(--color-text-muted);
  margin: 0;
  font-family: var(--font-display);
  font-weight: 600;
}

.pf-made {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.765rem;
  color: var(--color-text-muted);
  margin: 0;
  white-space: nowrap;
  font-family: var(--font-display);
  font-weight: 600;
  justify-content: center;
}

.pf-year {
  font-size: 0.765rem;
  color: var(--color-text-muted);
  margin: 0;
  text-align: right;
  font-family: var(--font-display);
  font-weight: 600;
  opacity: 0.6;
}

/* Corazón animado */
.pf-heart {
  color: var(--color-primary);
  flex-shrink: 0;
  animation: heartbeat 2.8s ease-in-out infinite;
}
@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.22);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.15);
  }
  56% {
    transform: scale(1);
  }
}

/* ════════════════════════════════════════════════════════════
   DARK MODE
   ════════════════════════════════════════════════════════════ */
:global(html.dark) .pf-footer,
:global(html[data-theme="dark"]) .pf-footer {
  background: #100f0d;
  border-top-color: rgba(255, 240, 220, 0.06);
}

:global(html.dark) .pf-bg-deco,
:global(html[data-theme="dark"]) .pf-bg-deco {
  background:
    radial-gradient(
      ellipse 80% 60% at 0% 100%,
      rgba(124, 203, 194, 0.05) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse 60% 40% at 100% 0%,
      rgba(240, 130, 99, 0.04) 0%,
      transparent 55%
    );
}

:global(html.dark) .pf-col-title,
:global(html[data-theme="dark"]) .pf-col-title {
  color: var(--color-text-soft);
  border-bottom-color: rgba(255, 240, 220, 0.08);
}

:global(html.dark) .pf-link:hover,
:global(html[data-theme="dark"]) .pf-link:hover {
  background: rgba(240, 130, 99, 0.1);
  color: #ff8a65;
}

:global(html.dark) .pf-tech-badge,
:global(html[data-theme="dark"]) .pf-tech-badge {
  background: rgba(255, 240, 220, 0.05);
  border-color: rgba(255, 240, 220, 0.09);
}

:global(html.dark) .pf-divider,
:global(html[data-theme="dark"]) .pf-divider {
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 240, 220, 0.08) 15%,
    rgba(255, 240, 220, 0.08) 85%,
    transparent 100%
  );
}

:global(html.dark) .pf-bottom,
:global(html[data-theme="dark"]) .pf-bottom {
  background: rgba(0, 0, 0, 0.15);
}

/* ════════════════════════════════════════════════════════════
   RESPONSIVE
   ════════════════════════════════════════════════════════════ */

/* Tablet: 3 columnas */
@media (max-width: 960px) {
  .pf-body {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 2rem 1.75rem;
    padding-top: 2.75rem;
    padding-bottom: 2.25rem;
  }
  .pf-brand {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem 2.5rem;
    align-items: flex-start;
  }
  .pf-desc {
    max-width: 320px;
  }
}

/* Mobile: stack limpio */
@media (max-width: 640px) {
  .pf-footer {
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

  .pf-body {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem 1.25rem;
    padding-top: 2rem;
    padding-bottom: 1.75rem;
  }
  .pf-brand {
    grid-column: 1 / -1;
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }
  .pf-desc {
    max-width: 100%;
  }
  .pf-tech-badge {
    display: none;
  } /* ocultar en móvil para no saturar */

  .pf-bottom-inner {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 0.35rem;
  }
  .pf-copy {
    order: 2;
  }
  .pf-made {
    order: 1;
    justify-content: center;
  }
  .pf-year {
    display: none;
  }

  .pf-divider {
    margin: 0 var(--page-padding);
  }
}

@media (max-width: 420px) {
  .pf-body {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  .pf-brand {
    align-items: center;
    text-align: center;
  }
  .pf-logo-link {
    align-self: center;
  }
  .pf-desc {
    max-width: 280px;
    text-align: center;
  }
  .pf-col {
    align-items: flex-start;
  }
}
</style>
