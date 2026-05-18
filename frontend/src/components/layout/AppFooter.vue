<!-- src/components/layout/AppFooter.vue -->
<script setup>
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="page-container footer-inner">

      <!-- Columna marca -->
      <div class="footer-brand-col">
        <div class="footer-logo">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="#F4845F" opacity="0.15"/>
            <path d="M10 20 Q16 10 22 20" stroke="#F4845F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <circle cx="11" cy="13" r="2" fill="#F4845F"/>
            <circle cx="21" cy="13" r="2" fill="#F4845F"/>
            <circle cx="16" cy="18" r="1.5" fill="#5CC8C0"/>
          </svg>
          <span class="footer-logo-text">Petnumy</span>
        </div>
        <p class="footer-tagline">La salud de tu mascota, en un solo lugar.</p>
      </div>

      <!-- Columna navegación -->
      <div class="footer-nav-col">
        <p class="footer-col-title">Plataforma</p>
        <RouterLink :to="{ name: 'home' }"        class="footer-link">Inicio</RouterLink>
        <RouterLink :to="{ name: 'clinicas' }"    class="footer-link">Clínicas</RouterLink>
        <RouterLink :to="{ name: 'mis-mascotas' }" class="footer-link">Mis Mascotas</RouterLink>
      </div>

      <!-- Columna cuenta -->
      <div class="footer-nav-col">
        <p class="footer-col-title">Cuenta</p>
        <RouterLink :to="{ name: 'login' }"    class="footer-link">Iniciar sesión</RouterLink>
        <RouterLink :to="{ name: 'registro' }" class="footer-link">Registrarse</RouterLink>
      </div>

    </div>

    <!-- Bottom bar -->
    <div class="footer-bottom">
      <div class="page-container footer-bottom-inner">
        <span>© {{ year }} Petnumy — Proyecto TFG</span>
        <span>Hecho con cariño por y para mascotas</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  margin-top: auto;
}

.footer-inner {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: 2.5rem;
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
}

/* Marca */
.footer-logo {
  display: flex; align-items: center; gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.footer-logo-text {
  font-family: var(--font-display); font-weight: 800;
  font-size: 1.1rem; color: var(--color-text);
}
.footer-tagline {
  font-size: 0.85rem; color: var(--color-text-muted);
  line-height: 1.5; margin: 0; max-width: 220px;
}

/* Columnas nav */
.footer-col-title {
  font-family: var(--font-display); font-weight: 700;
  font-size: 0.75rem; text-transform: uppercase;
  letter-spacing: 0.6px; color: var(--color-text-muted);
  margin-bottom: 0.9rem;
}
.footer-nav-col {
  display: flex; flex-direction: column; gap: 0.5rem;
}
.footer-link {
  font-size: 0.875rem; color: var(--color-text-soft);
  transition: color var(--transition-fast);
  width: fit-content;
}
.footer-link:hover { color: var(--color-primary); }

/* Bottom bar */
.footer-bottom {
  border-top: 1px solid var(--color-border);
  padding: 0.9rem 0;
}
.footer-bottom-inner {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 0.78rem; color: var(--color-text-muted);
}

/* Responsive */
@media (max-width: 640px) {
  .footer-inner {
    grid-template-columns: 1fr 1fr;
    gap: 1.75rem;
  }
  .footer-brand-col { grid-column: 1 / -1; }
  .footer-bottom-inner span:last-child { display: none; }
}
@media (max-width: 400px) {
  .footer-inner { grid-template-columns: 1fr; }
}
</style>
