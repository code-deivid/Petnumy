<!-- src/pages/MascotaDetallePage.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'

const route  = useRoute()
const router = useRouter()
const { get } = useApi()

const mascota        = ref(null)
const vacunas        = ref([])
const loading        = ref(true)
const loadingVacunas = ref(false)
const error          = ref(null)
// cargarDatos extrae el id de route.params en cada llamada,
// así funciona tanto en onMounted como en watch
async function cargarDatos() {
  const id = route.params.id
  if (!id) return

  loading.value = true
  error.value   = null
  mascota.value = null
  vacunas.value = []

  const { ok, data } = await get(`/api/mascotas/${id}`)
  loading.value = false
  if (!ok) { error.value = data.message || 'No se encontró la mascota'; return }
  mascota.value = data.mascota

  // Vacunas en paralelo, no bloquea el hero
  loadingVacunas.value = true
  const { ok: okV, data: dV } = await get(`/api/mascotas/${id}/vacunas`)
  loadingVacunas.value = false
  if (okV && dV.vacunas) vacunas.value = dV.vacunas
}

// Ejecutar al montar Y al cambiar de mascota (navegación SPA entre mascotas)
onMounted(cargarDatos)
watch(() => route.params.id, (newId) => {
  if (newId) cargarDatos()
})

// Computados
const iniciales = computed(() => (mascota.value?.nombre?.[0] || '').toUpperCase())

const edad = computed(() => {
  if (!mascota.value?.nacimiento) return null
  const m = Math.floor((Date.now() - new Date(mascota.value.nacimiento)) / (1000*60*60*24*30.44))
  if (m < 1)  return 'Menos de 1 mes'
  if (m < 12) return `${m} ${m===1?'mes':'meses'}`
  const a = Math.floor(m/12)
  return `${a} ${a===1?'año':'años'}`
})

const fechaNac = computed(() => {
  if (!mascota.value?.nacimiento) return null
  return new Date(mascota.value.nacimiento).toLocaleDateString('es-ES', {
    day:'numeric', month:'long', year:'numeric'
  })
})

// Próxima vacuna pendiente
const proximaVacuna = computed(() =>
  [...vacunas.value]
    .filter(v => v.estado === 'pendiente' || v.estado === 'retrasada')
    .sort((a,b) => new Date(a.proxima_aplicacion) - new Date(b.proxima_aplicacion))[0] || null
)

// Estado vacunas
const badgeClass = { puesta:'bv--puesta', pendiente:'bv--pendiente', retrasada:'bv--retrasada' }
const badgeLabel = { puesta:'Completada', pendiente:'Pendiente', retrasada:'Retrasada' }

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})
}

async function compartir() {
  if (navigator.share) {
    try { await navigator.share({ title:`Ficha de ${mascota.value.nombre}`, url: window.location.href }) } catch {}
  } else {
    await navigator.clipboard?.writeText(window.location.href).catch(()=>{})
    alert('Enlace copiado al portapapeles')
  }
}
</script>

<template>
  <div class="md-page page-container">

    <!-- Volver -->
    <button class="btn btn-ghost btn-sm md-back" @click="router.push({ name: 'mis-mascotas' })">
      ← Mis mascotas
    </button>

    <!-- Loading -->
    <div v-if="loading" class="loading-center"><div class="spinner spinner-dark"/></div>

    <!-- Error -->
    <div v-else-if="error" class="card">
      <div class="card-body" style="text-align:center;padding:2.5rem">
        <p>{{ error }}</p>
        <button class="btn btn-primary" style="margin-top:1rem" @click="router.push({ name: 'mis-mascotas' })">Volver al listado</button>
      </div>
    </div>

    <template v-else-if="mascota">

      <!-- ══ HERO ══════════════════════════════════════════ -->
      <div class="card md-hero">
        <div class="card-body md-hero-inner">

          <!-- Columna foto -->
          <div class="md-foto-col">
            <div class="md-foto-ring">
              <img v-if="mascota.foto" :src="mascota.foto" :alt="mascota.nombre" class="md-foto-img"/>
              <span v-else class="md-foto-initials">{{ iniciales }}</span>
            </div>
            <!-- Género badge sobre la foto -->
            <div
              v-if="mascota.genero"
              class="md-genero"
              :class="mascota.genero === 'macho' ? 'md-genero--m' : 'md-genero--f'"
              title="Género"
            >
              <iconify-icon
                :icon="mascota.genero === 'macho' ? 'mdi:gender-male' : 'mdi:gender-female'"
                width="13" height="13"
              />
            </div>
            <!-- Nombre + raza bajo la foto (visible en móvil también) -->
            <div class="md-foto-name">
              <span v-if="mascota.raza?.especie?.especie" class="md-especie-pill">
                {{ mascota.raza.especie.especie.toUpperCase() }}
              </span>
              <h1 class="md-nombre">{{ mascota.nombre }}</h1>
              <p class="md-raza-lbl">
              {{ mascota.raza?.nombre || '—' }}
              <template v-if="mascota.es_mestizo && mascota.raza_secundaria">
                <span style="color: var(--color-text-muted); font-weight:400"> + </span>{{ mascota.raza_secundaria.nombre }}
              </template>
            </p>
            </div>
          </div>

          <!-- Columna datos -->
          <div class="md-datos-col">

            <!-- Grid de datos -->
            <div class="md-datos-grid">

              <div v-if="fechaNac" class="md-dato">
                <span class="md-dato-icon md-dato-icon--teal">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </span>
                <div>
                  <span class="md-dato-key">Fecha de nacimiento</span>
                  <span class="md-dato-val">{{ fechaNac }}</span>
                </div>
              </div>

              <div v-if="mascota.genero" class="md-dato">
                <span class="md-dato-icon md-dato-icon--teal">
                  <iconify-icon
                    :icon="mascota.genero === 'macho' ? 'mdi:gender-male' : 'mdi:gender-female'"
                    width="14" height="14"
                  />
                </span>
                <div>
                  <span class="md-dato-key">Género</span>
                  <span class="md-dato-val">{{ mascota.genero === 'macho' ? 'Macho' : 'Hembra' }}</span>
                </div>
              </div>

              <div v-if="mascota.peso" class="md-dato">
                <span class="md-dato-icon md-dato-icon--teal">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2h12l1 8H5L6 2z"/><path d="M5 10l-2 10h18L19 10"/></svg>
                </span>
                <div>
                  <span class="md-dato-key">Peso</span>
                  <span class="md-dato-val">{{ mascota.peso }} kg</span>
                </div>
              </div>

              <div v-if="mascota.microchip" class="md-dato">
                <span class="md-dato-icon md-dato-icon--teal">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M7 9H5M7 12H5M7 15H5M17 9h2M17 12h2M17 15h2M9 7V5M12 7V5M15 7V5M9 17v2M12 17v2M15 17v2"/></svg>
                </span>
                <div>
                  <span class="md-dato-key">ID de Microchip</span>
                  <span class="md-dato-val md-dato-val--mono">{{ mascota.microchip }}</span>
                </div>
              </div>

              <!-- Edad si hay nacimiento -->
              <div v-if="edad" class="md-dato">
                <span class="md-dato-icon md-dato-icon--teal">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </span>
                <div>
                  <span class="md-dato-key">Edad</span>
                  <span class="md-dato-val">{{ edad }}</span>
                </div>
              </div>

            </div>

            <!-- Botones acción -->
            <div class="md-hero-btns">
              <button class="btn btn-teal" @click="router.push({ name: 'nueva-mascota', query: { editar: mascota.id } })">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editar Perfil
              </button>
              <button class="btn btn-outline" @click="compartir">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Compartir Ficha
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- ══ HISTORIAL DE VACUNAS ══════════════════════════ -->
      <section class="md-section">
        <div class="md-section-head">
          <div class="md-section-title-row">
            <div class="md-section-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <h2 class="md-section-h2">Historial de Vacunas</h2>
          </div>
          <button class="btn btn-primary btn-sm" @click="router.push({ name: 'mis-mascotas' })">
            + Añadir Vacuna
          </button>
        </div>

        <!-- Cargando -->
        <div v-if="loadingVacunas" class="loading-center" style="padding:2rem 0">
          <div class="spinner spinner-dark"/>
        </div>

        <!-- Sin vacunas -->
        <div v-else-if="vacunas.length === 0" class="card md-vac-empty">
          <div class="card-body md-vac-empty-body">
            <div class="md-vac-empty-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <p class="md-vac-empty-title">Todavía no hay vacunas registradas</p>
            <p class="md-vac-empty-sub">Añade la primera vacuna para llevar el control de la salud de <strong>{{ mascota.nombre }}</strong></p>
          </div>
        </div>

        <!-- Tabla de vacunas -->
        <div v-else class="card md-vac-table">
          <!-- Cabecera -->
          <div class="md-vac-thead">
            <span>Nombre de vacuna</span>
            <span>Administrada</span>
            <span>Próxima dosis</span>
            <span>Estado</span>
          </div>
          <!-- Filas -->
          <div
            v-for="vac in vacunas"
            :key="vac.id"
            class="md-vac-row"
          >
            <div class="md-vac-name-col">
              <span class="md-vac-name">{{ vac.vacuna?.nombre || '—' }}</span>
              <span v-if="vac.vacuna?.descripcion" class="md-vac-desc">{{ vac.vacuna.descripcion }}</span>
            </div>
            <span class="md-vac-fecha">{{ fmt(vac.fecha_aplicacion) }}</span>
            <span class="md-vac-fecha" :class="{ 'md-vac-fecha--alert': vac.estado === 'retrasada' }">
              {{ fmt(vac.proxima_aplicacion) }}
            </span>
            <span :class="['bv', badgeClass[vac.estado] || 'bv--pendiente']">
              {{ badgeLabel[vac.estado] || vac.estado }}
            </span>
          </div>
        </div>
      </section>

      <!-- ══ RECORDATORIOS ══════════════════════════════════ -->
      <div class="md-tips-row">

        <!-- Próxima vacuna pendiente -->
        <div v-if="proximaVacuna" class="card md-tip md-tip--coral">
          <div class="card-body md-tip-body">
            <div class="md-tip-icon md-tip-icon--coral">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </div>
            <div>
              <p class="md-tip-label">¡Recordatorio!</p>
              <p class="md-tip-text">
                La próxima vacuna de <strong>{{ mascota.nombre }}</strong> es
                <strong>{{ proximaVacuna.vacuna?.nombre }}</strong>.
                Fecha prevista: {{ fmt(proximaVacuna.proxima_aplicacion) }}.
              </p>
            </div>
          </div>
        </div>

        <!-- Consejo preventivo -->
        <div class="card md-tip md-tip--teal">
          <div class="card-body md-tip-body">
            <div class="md-tip-icon md-tip-icon--teal">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <p class="md-tip-label">Check-up Preventivo</p>
              <p class="md-tip-text">
                Una revisión veterinaria anual puede detectar problemas a tiempo.
                Mantén a <strong>{{ mascota.nombre }}</strong> siempre al día.
              </p>
            </div>
          </div>
        </div>

      </div>

    </template>
  </div>
</template>

<style scoped>
.md-page {
  padding-top: var(--page-padding-y);
  padding-bottom: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.md-back { align-self: flex-start; padding-left: 0; color: var(--color-text-muted); margin-bottom: -0.5rem; }

/* ══ HERO ══════════════════════════════════════════════════ */
.md-hero { box-shadow: var(--shadow-md); }

.md-hero-inner {
  display: grid;
  grid-template-columns: 210px 1fr;
  gap: 2.5rem;
  align-items: start;
  padding: 2rem 2.25rem;
}

/* Columna foto */
.md-foto-col { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; position: relative; }

.md-foto-ring {
  width: 155px; height: 155px; border-radius: 50%; overflow: hidden;
  border: 4px solid var(--color-surface);
  box-shadow: 0 4px 18px rgba(60,46,31,0.16);
  background: var(--color-surface-alt);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.md-foto-img      { width: 100%; height: 100%; object-fit: cover; }
.md-foto-initials { font-family: var(--font-display); font-weight: 800; font-size: 3rem; color: var(--color-primary-dark); }

/* Badge género superpuesto */
.md-genero {
  position: absolute;
  bottom: 62px; right: 14px;
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--color-surface);
  box-shadow: 0 2px 6px rgba(60,46,31,0.14);
}
.md-genero--m { background: #EEF4FB; color: #3A5FA0; }
.md-genero--f { background: #FCF0F5; color: #A03A5A; }

/* Nombre bajo foto */
.md-foto-name { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
.md-especie-pill {
  font-family: var(--font-display); font-weight: 800; font-size: 0.66rem; letter-spacing: 0.8px;
  background: var(--color-teal-light); color: var(--color-teal-dark);
  padding: 0.18rem 0.6rem; border-radius: var(--radius-full); display: inline-block;
}
.md-nombre    { font-size: clamp(1.6rem, 4vw, 2.25rem); letter-spacing: -0.4px; margin: 0; line-height: 1.1; }
.md-raza-lbl  { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }

/* Columna datos */
.md-datos-col { display: flex; flex-direction: column; gap: 1.25rem; }

.md-datos-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.md-dato {
  display: flex; align-items: flex-start; gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
}
.md-dato-icon {
  width: 26px; height: 26px; border-radius: var(--radius-xs);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.md-dato-icon--teal { background: var(--color-teal-light); color: var(--color-teal-dark); }
.md-dato-key  { display: block; font-family: var(--font-display); font-weight: 700; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); margin-bottom: 0.08rem; }
.md-dato-val  { display: block; font-size: 0.875rem; color: var(--color-text); font-weight: 600; }
.md-dato-val--mono { font-family: monospace; font-size: 0.78rem; letter-spacing: 0.5px; }

.md-hero-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; }

/* ══ SECCIÓN ═════════════════════════════════════════════ */
.md-section { display: flex; flex-direction: column; gap: 1rem; }
.md-section-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.md-section-title-row { display: flex; align-items: center; gap: 0.6rem; }
.md-section-icon { width: 30px; height: 30px; border-radius: var(--radius-sm); background: var(--color-teal-light); color: var(--color-teal-dark); display: flex; align-items: center; justify-content: center; }
.md-section-h2   { font-size: 1.1rem; margin: 0; }

/* Estado vacío vacunas */
.md-vac-empty { box-shadow: var(--shadow-sm); }
.md-vac-empty-body { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 2.5rem 2rem; gap: 0.5rem; }
.md-vac-empty-icon { width: 56px; height: 56px; border-radius: 50%; background: var(--color-surface-alt); color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; margin-bottom: 0.4rem; }
.md-vac-empty-title { font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; color: var(--color-text); margin: 0; }
.md-vac-empty-sub   { font-size: 0.84rem; color: var(--color-text-muted); max-width: 300px; margin: 0; }

/* Tabla vacunas */
.md-vac-table  { overflow: hidden; }
.md-vac-thead  {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem; padding: 0.7rem 1.5rem;
  background: var(--color-surface-alt);
  border-bottom: 1px solid var(--color-border);
  font-family: var(--font-display); font-weight: 700; font-size: 0.62rem;
  text-transform: uppercase; letter-spacing: 0.7px; color: var(--color-teal-dark);
}
.md-vac-row {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem; padding: 0.95rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  align-items: center; transition: background var(--transition-fast);
}
.md-vac-row:last-child { border-bottom: none; }
.md-vac-row:hover      { background: var(--color-surface-alt); }

.md-vac-name-col { display: flex; flex-direction: column; gap: 0.12rem; }
.md-vac-name { font-family: var(--font-display); font-weight: 700; font-size: 0.875rem; color: var(--color-text); }
.md-vac-desc { font-size: 0.73rem; color: var(--color-text-muted); }
.md-vac-fecha { font-size: 0.82rem; color: var(--color-text-soft); }
.md-vac-fecha--alert { color: var(--color-primary); font-weight: 700; }

/* Badges vacunas */
.bv {
  display: inline-flex; align-items: center;
  padding: 0.25rem 0.7rem; border-radius: var(--radius-full);
  font-family: var(--font-display); font-weight: 700;
  font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;
}
.bv--puesta    { background: var(--color-teal-light);    color: var(--color-teal-dark); }
.bv--pendiente { background: var(--color-primary-light); color: var(--color-primary-dark); }
.bv--retrasada { background: var(--color-danger-light);  color: var(--color-danger); }

/* ══ RECORDATORIOS ═══════════════════════════════════════ */
.md-tips-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.md-tip--coral { border: 1.5px solid var(--color-primary-light); }
.md-tip--teal  { border: 1.5px solid var(--color-teal-light); }

.md-tip-body  { display: flex; align-items: flex-start; gap: 1rem; padding: 1.2rem 1.4rem; }
.md-tip-icon  { width: 42px; height: 42px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.md-tip-icon--coral { background: var(--color-primary-light); color: var(--color-primary); }
.md-tip-icon--teal  { background: var(--color-teal-light);    color: var(--color-teal-dark); }
.md-tip-label { font-family: var(--font-display); font-weight: 800; font-size: 0.85rem; color: var(--color-text); margin-bottom: 0.3rem; }
.md-tip-text  { font-size: 0.84rem; color: var(--color-text-soft); line-height: 1.5; margin: 0; }

/* ══ RESPONSIVE ══════════════════════════════════════════ */
@media (max-width: 760px) {
  .md-hero-inner {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1.5rem;
  }
  .md-foto-ring { width: 120px; height: 120px; }
  .md-datos-grid { grid-template-columns: 1fr 1fr; }
  .md-vac-thead  { display: none; }
  .md-vac-row    { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; gap: 0.4rem; padding: 0.85rem 1rem; }
  .md-vac-name-col { grid-column: 1 / -1; }
  .md-tips-row { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .md-datos-grid { grid-template-columns: 1fr; }
  .md-hero-btns  { flex-direction: column; }
  .md-hero-btns .btn { width: 100%; }
  .md-foto-ring  { width: 100px; height: 100px; }
}
</style>
