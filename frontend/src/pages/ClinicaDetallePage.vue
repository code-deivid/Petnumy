<!-- src/pages/ClinicaDetallePage.vue -->

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'

const route  = useRoute()
const router = useRouter()
const { get } = useApi()

const clinica      = ref(null)
const veterinarios = ref([])
const loading      = ref(false)
const error        = ref(null)

async function cargarDetalle() {
  loading.value = true
  error.value   = null

  const id = route.params.id

  // Llamada 1: detalle de la clínica
  const { ok: okClinica, data: dataClinica } = await get(`/api/clinicas/${id}`)

  if (!okClinica) {
    error.value   = dataClinica.message || 'No se encontró la clínica'
    loading.value = false
    return
  }

  clinica.value = dataClinica.clinica

  // Llamada 2: veterinarios de la clínica
  const { ok: okVets, data: dataVets } = await get(`/api/clinicas/${id}/veterinarios`)

  if (okVets) {
    veterinarios.value = dataVets.veterinarios
  }

  loading.value = false
}

onMounted(cargarDetalle)
</script>

<template>
  <div class="page-container page-section">

    <!-- Volver atrás -->
    <button class="btn btn-ghost btn-sm back-btn" @click="router.back()">
      ← Volver
    </button>

    <!-- Estado: cargando -->
    <div v-if="loading" class="flex justify-center items-center" style="padding: 4rem 0">
      <div class="spinner" />
    </div>

    <!-- Estado: error -->
    <div v-else-if="error" class="detalle-error empty-state">
      <p>{{ error }}</p>
      <button class="btn btn-outline" style="margin-top: 1rem" @click="cargarDetalle">
        Reintentar
      </button>
    </div>

    <!-- Contenido -->
    <div v-else-if="clinica" class="flex flex-col gap-8">

      <!-- Info de la clínica -->
      <div class="card detalle-card">
        <div class="card-body flex flex-col gap-3">
          <h1 class="detalle-nombre">{{ clinica.nombre }}</h1>

          <div class="flex flex-col gap-1">
            <span v-if="clinica.ciudad"    class="detalle-dato">📍 {{ clinica.ciudad }}</span>
            <span v-if="clinica.direccion" class="detalle-dato">🏠 {{ clinica.direccion }}</span>
            <span v-if="clinica.telefono"  class="detalle-dato">📞 {{ clinica.telefono }}</span>
            <span v-if="clinica.email"     class="detalle-dato">✉️ {{ clinica.email }}</span>
          </div>
        </div>
      </div>

      <!-- Veterinarios -->
      <div class="flex flex-col gap-4">
        <h2>Veterinarios</h2>

        <!-- Sin veterinarios -->
        <div v-if="veterinarios.length === 0" class="empty-state">
          <p>🩺 Esta clínica no tiene veterinarios registrados aún</p>
        </div>

        <!-- Lista de veterinarios -->
        <div v-else class="vets-grid">
          <div
            v-for="vet in veterinarios"
            :key="vet.id"
            class="card card-animate vet-card"
          >
            <div class="card-body flex items-center gap-3">
              <div class="vet-avatar">🩺</div>
              <div class="flex flex-col gap-1">
                <span class="vet-nombre">{{ vet.nombre }}</span>
                <span v-if="vet.especialidad" class="badge badge-green">
                  {{ vet.especialidad }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
.back-btn {
  margin-bottom: 1.5rem;
  padding-left: 0;
  color: var(--color-text-soft);
}

/* Card de detalle de clínica */
.detalle-card {
  border-left: 4px solid var(--color-primary);
}

.detalle-nombre {
  font-size: 1.6rem;
  color: var(--color-text);
}

.detalle-dato {
  font-size: 0.9rem;
  color: var(--color-text-soft);
}

/* Grid de veterinarios */
.vets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.vet-card {
  transition: transform var(--transition-normal),
              box-shadow var(--transition-normal);
}

.vet-avatar {
  font-size: 1.75rem;
  line-height: 1;
  flex-shrink: 0;
}

.vet-nombre {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-text);
}

/* Error */
.detalle-error {
  color: var(--color-danger);
}

/* Responsive */
@media (max-width: 480px) {
  .vets-grid {
    grid-template-columns: 1fr;
  }
}
</style>
