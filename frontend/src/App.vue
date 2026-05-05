<!-- src/App.vue -->
<!-- ============================================================
  Componente raíz de Petnumy.
  Monta el layout global: Navbar + contenido + Footer.
  Las transiciones de página se aplican aquí.
  ============================================================ -->

<script setup>
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<template>
  <div class="app-wrapper">
    <AppNavbar />

    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <AppFooter />
  </div>
</template>

<style>
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  padding-top: var(--navbar-height);
}
</style>
