<!-- src/pages/ClinicasPage.vue -->

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'

const router = useRouter()
const { get } = useApi()

const clinicas = ref([])
const loading  = ref(false)
const error    = ref(null)

async function cargarClinicas() {
  loading.value = true
  error.value   = null

  const { ok, data } = await get('/api/clinicas')

  loading.value = false

  if (!ok) {
    error.value = data.message || 'No se pudieron cargar las clínicas'
    return
  }

  clinicas.value = data.clinicas
}

function verDetalle(id) {
  router.push({ name: 'clinica-detalle', params: { id } })
}

onMounted(cargarClinicas)
</script>

<template>
  <div class="page-container page-section">

    <!-- Cabecera -->
    <div class="clinicas-header flex flex-col gap-2">
      <h1>Clínicas veterinarias 🏥</h1>
      <p>Encuentra la clínica más cercana para tu mascota</p>
    </div>

    <!-- Estado: cargando -->
    <div v-if="loading" class="flex justify-center items-center" style="padding: 4rem 0">
      <div class="spinner" />
    </div>

    <!-- Estado: error -->
    <div v-else-if="error" class="clinicas-error">
      <p>{{ error }}</p>
      <button class="btn btn-outline" style="margin-top: 1rem" @click="cargarClinicas">
        Reintentar
      </button>
    </div>

    <!-- Estado: sin resultados -->
    <div v-else-if="clinicas.length === 0" class="empty-state">
      <p>🏥 No hay clínicas disponibles por el momento</p>
    </div>

    <!-- Lista de clínicas -->
    <div v-else class="clinicas-grid">
      <div
        v-for="clinica in clinicas"
        :key="clinica.id"
        class="card card-animate clinica-card"
        @click="verDetalle(clinica.id)"
      >
        <div class="card-body flex flex-col gap-2">
          <h3 class="clinica-nombre">{{ clinica.nombre }}</h3>
          <span class="clinica-ciudad">📍 {{ clinica.ciudad }}</span>
          <span class="clinicas-cta">Ver detalle →</span>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.clinicas-header {
  margin-bottom: 2rem;
}

.clinicas-header p {
  font-size: 1rem;
}

/* Grid de cards */
.clinicas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}

/* Card individual */
.clinica-card {
  cursor: pointer;
}

.clinica-nombre {
  font-size: 1.1rem;
  color: var(--color-text);
}

.clinica-ciudad {
  font-size: 0.875rem;
  color: var(--color-text-soft);
}

.clinicas-cta {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-primary);
  margin-top: 0.25rem;
  transition: letter-spacing var(--transition-fast);
}

.clinica-card:hover .clinicas-cta {
  letter-spacing: 0.3px;
}

/* Error */
.clinicas-error {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-danger);
}

/* Responsive */
@media (max-width: 480px) {
  .clinicas-grid {
    grid-template-columns: 1fr;
  }
}
</style>
