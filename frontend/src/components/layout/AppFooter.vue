<!-- src/components/layout/AppFooter.vue -->

<script setup>
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="page-container footer-inner flex items-center justify-between">
      <span class="footer-brand">🐾 Petnumy</span>
      <span class="footer-copy">© {{ year }} — Proyecto TFG</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: var(--color-surface);
  border-top: 1.5px solid var(--color-border);
  padding: 1.25rem 0;
  margin-top: auto;
}

.footer-inner {
  gap: 1rem;
}

.footer-brand {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--color-primary);
  font-size: 0.95rem;
}

.footer-copy {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
