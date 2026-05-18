<!-- src/pages/MisCitasPage.vue -->

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'

const router      = useRouter()
const { get, patch } = useApi()

const citas    = ref([])
const loading  = ref(false)
const error    = ref(null)

// Separar próximas e historial
const proximas  = computed(() =>
  citas.value.filter(c => ['pendiente', 'confirmada'].includes(c.estado))
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
)
const historial = computed(() =>
  citas.value.filter(c => ['completada', 'cancelada'].includes(c.estado))
    .sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
)

async function cargarCitas() {
  loading.value = true
  error.value   = null
  const { ok, data } = await get('/api/citas')
  loading.value = false
  if (!ok) { error.value = data.message || 'Error al cargar las citas'; return }
  citas.value = data.citas
}

async function cancelar(cita) {
  if (!confirm(`¿Cancelar la cita del ${formatFecha(cita.fecha_hora)}?`)) return
  const { ok, data } = await patch(`/api/citas/${cita.id}/cancelar`, {})
  if (!ok) { alert(data.message || 'No se pudo cancelar'); return }
  // Actualizar en local sin recargar
  const idx = citas.value.findIndex(c => c.id === cita.id)
  if (idx !== -1) citas.value[idx] = data.cita
}

// Utilidades de formato
function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}
function formatHora(iso) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

const badgeClass = {
  pendiente:  'badge-orange',
  confirmada: 'badge-teal',
  completada: 'badge-green',
  cancelada:  'badge-red'
}
const badgeLabel = {
  pendiente:  'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada:  'Cancelada'
}

onMounted(cargarCitas)
</script>

<template>
  <div class="page-container page-section">

    <!-- Cabecera -->
    <div class="page-head flex items-start justify-between">
      <div>
        <h1>Mis citas</h1>
        <p>Consulta y gestiona tus reservas veterinarias</p>
      </div>
      <button class="btn btn-primary" @click="router.push({ name: 'nueva-cita' })">
        + Nueva cita
      </button>
    </div>

    <!-- Cargando -->
    <div v-if="loading" class="loading-center">
      <div class="spinner" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="empty-state">
      <p>{{ error }}</p>
      <button class="btn btn-outline" style="margin-top:1rem" @click="cargarCitas">Reintentar</button>
    </div>

    <template v-else>

      <!-- Sin citas -->
      <div v-if="citas.length === 0" class="empty-state card">
        <div class="card-body flex flex-col items-center gap-4">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <p class="empty-title">No tienes citas todavía</p>
            <p>Reserva una cita con tu veterinario de confianza</p>
          </div>
          <button class="btn btn-primary" @click="router.push({ name: 'nueva-cita' })">
            Reservar primera cita
          </button>
        </div>
      </div>

      <template v-else>

        <!-- Próximas citas -->
        <section v-if="proximas.length > 0" class="citas-section">
          <h2 class="section-title">Próximas</h2>
          <div class="citas-list">
            <div
              v-for="cita in proximas"
              :key="cita.id"
              class="card card-animate cita-card cita-card--proxima"
            >
              <div class="cita-card-inner">

                <!-- Fecha destacada -->
                <div class="cita-fecha-col">
                  <span class="cita-dia">{{ new Date(cita.fecha_hora).getDate() }}</span>
                  <span class="cita-mes">{{ new Date(cita.fecha_hora).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase() }}</span>
                  <span class="cita-hora">{{ formatHora(cita.fecha_hora) }}</span>
                </div>

                <!-- Información -->
                <div class="cita-info">
                  <div class="flex items-center gap-2" style="flex-wrap:wrap">
                    <span class="cita-mascota">{{ cita.mascota?.nombre }}</span>
                    <span :class="['badge', badgeClass[cita.estado]]">{{ badgeLabel[cita.estado] }}</span>
                  </div>
                  <p class="cita-servicio">{{ cita.servicio?.nombre }}</p>
                  <p class="cita-vet">
                    Dr. {{ cita.veterinario?.nombre }} {{ cita.veterinario?.apellidos }}
                    <span v-if="cita.veterinario?.clinica?.nombre"> · {{ cita.veterinario.clinica.nombre }}</span>
                  </p>
                  <p v-if="cita.notas_usuario" class="cita-nota">"{{ cita.notas_usuario }}"</p>
                </div>

                <!-- Acción -->
                <div class="cita-actions">
                  <button class="btn btn-ghost btn-sm cita-cancel-btn" @click="cancelar(cita)">
                    Cancelar
                  </button>
                </div>

              </div>
            </div>
          </div>
        </section>

        <!-- Historial -->
        <section v-if="historial.length > 0" class="citas-section">
          <h2 class="section-title">Historial</h2>
          <div class="citas-list">
            <div
              v-for="cita in historial"
              :key="cita.id"
              class="card card-animate cita-card cita-card--historial"
            >
              <div class="cita-card-inner">

                <div class="cita-fecha-col cita-fecha-col--muted">
                  <span class="cita-dia">{{ new Date(cita.fecha_hora).getDate() }}</span>
                  <span class="cita-mes">{{ new Date(cita.fecha_hora).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase() }}</span>
                  <span class="cita-hora">{{ formatHora(cita.fecha_hora) }}</span>
                </div>

                <div class="cita-info">
                  <div class="flex items-center gap-2" style="flex-wrap:wrap">
                    <span class="cita-mascota">{{ cita.mascota?.nombre }}</span>
                    <span :class="['badge', badgeClass[cita.estado]]">{{ badgeLabel[cita.estado] }}</span>
                  </div>
                  <p class="cita-servicio">{{ cita.servicio?.nombre }}</p>
                  <p class="cita-vet">
                    Dr. {{ cita.veterinario?.nombre }} {{ cita.veterinario?.apellidos }}
                    <span v-if="cita.veterinario?.clinica?.nombre"> · {{ cita.veterinario.clinica.nombre }}</span>
                  </p>
                </div>

              </div>
            </div>
          </div>
        </section>

      </template>
    </template>

  </div>
</template>

<style scoped>
.page-head { margin-bottom: 2rem; gap: 1rem; align-items: flex-start; }
.page-head p { margin: 0.25rem 0 0; font-size: 0.9rem; }

.loading-center { display: flex; justify-content: center; padding: 4rem 0; }

/* Empty state */
.empty-state .card-body { text-align: center; padding: 3rem 2rem; }
.empty-icon {
  width: 72px; height: 72px; border-radius: 50%;
  background: var(--color-surface-alt);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted);
}
.empty-title { font-family: var(--font-display); font-weight: 700; font-size: 1.05rem; color: var(--color-text); margin-bottom: 0.25rem; }

/* Secciones */
.citas-section { margin-bottom: 2.5rem; }
.section-title { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.6px; color: var(--color-text-muted); margin-bottom: 1rem; }

/* Lista */
.citas-list { display: flex; flex-direction: column; gap: 0.75rem; }

/* Card cita */
.cita-card { transition: transform var(--transition-normal), box-shadow var(--transition-normal); }
.cita-card--proxima { border-left: 3.5px solid var(--color-primary); }
.cita-card--historial { opacity: 0.75; }
.cita-card--historial:hover { opacity: 1; }

.cita-card-inner {
  display: flex; align-items: center; gap: 1.25rem;
  padding: 1.25rem 1.5rem;
}

/* Columna fecha */
.cita-fecha-col {
  display: flex; flex-direction: column; align-items: center;
  min-width: 52px; flex-shrink: 0;
  background: var(--color-primary-light);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.5rem;
}
.cita-fecha-col--muted { background: var(--color-surface-alt); }

.cita-dia  { font-family: var(--font-display); font-weight: 800; font-size: 1.4rem; line-height: 1; color: var(--color-primary); }
.cita-mes  { font-family: var(--font-display); font-weight: 700; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); }
.cita-hora { font-family: var(--font-display); font-weight: 600; font-size: 0.75rem; color: var(--color-text-soft); margin-top: 0.2rem; }
.cita-fecha-col--muted .cita-dia { color: var(--color-text-muted); }

/* Info cita */
.cita-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
.cita-mascota { font-family: var(--font-display); font-weight: 700; font-size: 1rem; color: var(--color-text); }
.cita-servicio { font-size: 0.875rem; color: var(--color-text-soft); margin: 0; }
.cita-vet { font-size: 0.8rem; color: var(--color-text-muted); margin: 0; }
.cita-nota { font-size: 0.8rem; color: var(--color-text-muted); font-style: italic; margin: 0.15rem 0 0; }

/* Acción cancelar */
.cita-actions { flex-shrink: 0; }
.cita-cancel-btn { color: var(--color-danger); opacity: 0.7; }
.cita-cancel-btn:hover { opacity: 1; background: var(--color-danger-light); color: var(--color-danger); }

/* Responsive */
@media (max-width: 540px) {
  .page-head { flex-direction: column; }
  .page-head .btn { width: 100%; justify-content: center; }
  .cita-card-inner { gap: 0.9rem; padding: 1rem; }
  .cita-actions { display: none; }
  .cita-card--proxima::after {
    content: 'Toca para cancelar';
    display: none;
  }
}
</style>
