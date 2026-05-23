<!-- src/App.vue -->
<script setup>
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<template>
  <div class="app-wrapper">
    <AppNavbar />

    <main class="app-main">
      <!--
        SIN mode="out-in": ese modo esperaba a que el componente saliente
        terminase su animación antes de montar el entrante, causando que
        onMounted se ejecutase tarde y la página apareciese vacía.

        Con mode por defecto (ambas animaciones corren en paralelo)
        el componente entrante se monta inmediatamente y sus peticiones
        async arrancan sin esperar a la transición de salida.
      -->
      <RouterView v-slot="{ Component, route }">
        <Transition name="page">
          <component :is="Component" :key="route.fullPath" />
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
