<!-- src/pages/MisMascotasPage.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi.js'

const router          = useRouter()
const { get, remove } = useApi()

const mascotas = ref([])
const loading  = ref(false)
const error    = ref(null)

async function cargarMascotas() {
  loading.value = true
  error.value   = null
  const { ok, data } = await get('/api/mascotas')
  loading.value = false
  if (!ok) { error.value = data.message || 'No se pudieron cargar las mascotas'; return }
  mascotas.value = data.mascotas
}
onMounted(cargarMascotas)

// Navegación al detalle — stopPropagation en acciones
function verDetalle(id) {
  router.push({ name: 'mascota-detalle', params: { id } })
}
function editarMascota(e, mascota) {
  e.stopPropagation()
  router.push({ name: 'nueva-mascota', query: { editar: mascota.id } })
}
async function eliminarMascota(e, mascota) {
  e.stopPropagation()
  if (!confirm(`¿Eliminar a ${mascota.nombre}? Esta acción no se puede deshacer.`)) return
  const { ok, data } = await remove(`/api/mascotas/${mascota.id}`)
  if (!ok) { alert(data.message || 'No se pudo eliminar'); return }
  cargarMascotas()
}

// Utilidades
function calcEdad(nacimiento) {
  if (!nacimiento) return null
  const meses = Math.floor((Date.now() - new Date(nacimiento)) / (1000 * 60 * 60 * 24 * 30.44))
  if (meses < 1)  return 'Menos de 1 mes'
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`
  const años = Math.floor(meses / 12)
  return `${años} ${años === 1 ? 'año' : 'años'}`
}
function iniciales(n) { return (n?.[0] || '').toUpperCase() }

const paleta = ['#C4A898','#8EC8C4','#E8A898','#9EC89A','#D4B896','#B8A8C4']
function colorAv(i) { return paleta[i % paleta.length] }

function bgCard(genero) {
  if (genero === 'macho')  return 'card-bg--macho'
  if (genero === 'hembra') return 'card-bg--hembra'
  return ''
}

const consejos = [
  'Recuerda desparasitar a tus mascotas cada 3 meses.',
  'El ejercicio diario mejora la salud mental y física de tu mascota.',
  'Una revisión veterinaria anual puede detectar problemas a tiempo.',
  'Los dientes también necesitan cuidado: cepilla a tu mascota semanalmente.',
]
const consejoHoy = computed(() => consejos[new Date().getDate() % consejos.length])
</script>

<template>
  <div class="mm-page page-container">

    <!-- Header -->
    <div class="mm-header">
      <div>
        <h1 class="mm-title">Mis Mascotas</h1>
        <p class="mm-sub">
          <template v-if="mascotas.length > 0">
            {{ mascotas.length }} compañero{{ mascotas.length !== 1 ? 's' : '' }} bajo tu cuidado
          </template>
          <template v-else>Gestiona a tus compañeros peludos</template>
        </p>
      </div>
      <button class="btn btn-primary" @click="router.push({ name: 'nueva-mascota' })">
        + Añadir mascota
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-center"><div class="spinner spinner-dark"/></div>

    <!-- Error -->
    <div v-else-if="error" class="card">
      <div class="card-body" style="text-align:center;padding:2.5rem">
        <p>{{ error }}</p>
        <button class="btn btn-outline" style="margin-top:1rem" @click="cargarMascotas">Reintentar</button>
      </div>
    </div>

    <template v-else>

      <!-- ── Sin mascotas ──────────────────────────────────── -->
      <div v-if="mascotas.length === 0" class="mm-empty-wrap">
        <div class="card mm-empty-card">
          <div class="card-body mm-empty-body">
            <div class="mm-empty-paw">
              <svg width="52" height="52" viewBox="0 0 60 60" fill="none">
                <ellipse cx="14" cy="24" rx="6" ry="8" fill="#E0D0C0"/>
                <ellipse cx="46" cy="24" rx="6" ry="8" fill="#E0D0C0"/>
                <ellipse cx="24" cy="14" rx="5.5" ry="7.5" fill="#E0D0C0"/>
                <ellipse cx="36" cy="14" rx="5.5" ry="7.5" fill="#E0D0C0"/>
                <path d="M30 28c-10 0-18 8-18 15 0 5 4 9 9 9 3.5 0 5.5-1.5 9-1.5s5.5 1.5 9 1.5c5 0 9-4 9-9 0-7-8-15-18-15z" fill="#E0D0C0"/>
              </svg>
            </div>
            <h3>Aún no tienes mascotas</h3>
            <p>Añade a tu primer compañero para empezar a gestionar su salud, vacunas y citas.</p>
            <button class="btn btn-primary" style="margin-top:1.25rem" @click="router.push({ name: 'nueva-mascota' })">
              Añadir mi primera mascota
            </button>
          </div>
        </div>
        <div class="card card-mint mm-tip">
          <div class="card-body mm-tip-body">
            <div class="mm-tip-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <div>
              <p class="mm-tip-label">Consejo del día</p>
              <p class="mm-tip-text">{{ consejoHoy }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Con mascotas ──────────────────────────────────── -->
      <template v-else>

        <!-- Fila resumen + consejo -->
        <div class="mm-top-row">

          <!-- Resumen familia -->
          <div class="card mm-fam-card">
            <div class="card-body mm-fam-body">
              <div class="mm-fam-avatars">
                <div
                  v-for="(m, i) in mascotas.slice(0,4)"
                  :key="m.id"
                  class="mm-fam-av"
                  :style="{ background: colorAv(i), marginLeft: i > 0 ? '-8px' : '0', zIndex: 10 - i }"
                >
                  <img v-if="m.foto" :src="m.foto" :alt="m.nombre" class="mm-fam-av-img"/>
                  <span v-else>{{ iniciales(m.nombre) }}</span>
                </div>
                <div v-if="mascotas.length > 4" class="mm-fam-av mm-fam-av--more">+{{ mascotas.length - 4 }}</div>
              </div>
              <div class="mm-fam-count">
                <span class="mm-fam-num">{{ mascotas.length }}</span>
                <span class="mm-fam-lbl">{{ mascotas.length === 1 ? 'mascota' : 'mascotas' }}</span>
              </div>
            </div>
          </div>

          <!-- Consejo -->
          <div class="card card-mint mm-tip">
            <div class="card-body mm-tip-body">
              <div class="mm-tip-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </div>
              <div>
                <p class="mm-tip-label">Consejo del día</p>
                <p class="mm-tip-text">{{ consejoHoy }}</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Sección grid -->
        <div>
          <p class="mm-section-label">Tus compañeros</p>
          <div class="mm-grid">

            <!-- Card de cada mascota -->
            <div
              v-for="(mascota, idx) in mascotas"
              :key="mascota.id"
              class="mm-card card"
              :class="bgCard(mascota.genero)"
              @click="verDetalle(mascota.id)"
              tabindex="0"
              role="button"
              @keydown.enter="verDetalle(mascota.id)"
            >
              <!-- Botones editar/borrar -->
              <div class="mm-card-btns">
                <button class="mm-btn mm-btn--edit" @click="editarMascota($event, mascota)" title="Editar">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="mm-btn mm-btn--del" @click="eliminarMascota($event, mascota)" title="Eliminar">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                  </svg>
                </button>
              </div>

              <!-- Foto -->
              <div class="mm-card-foto-wrap">
                <div class="mm-card-foto">
                  <img v-if="mascota.foto" :src="mascota.foto" :alt="mascota.nombre" class="mm-card-foto-img"/>
                  <div v-else class="mm-card-av" :style="{ background: colorAv(idx) }">{{ iniciales(mascota.nombre) }}</div>
                </div>
              </div>

              <!-- Info -->
              <div class="mm-card-info">
                <h3 class="mm-card-nombre">{{ mascota.nombre.toUpperCase() }}</h3>
                <p class="mm-card-raza">{{ mascota.raza?.nombre || '—' }}</p>
                <div class="mm-card-tags">
                  <span v-if="mascota.raza?.especie?.especie" class="mm-tag">{{ mascota.raza.especie.especie }}</span>
                  <span v-if="mascota.genero" :class="['mm-tag', mascota.genero === 'macho' ? 'mm-tag--macho' : 'mm-tag--hembra']">
                    {{ mascota.genero === 'macho' ? '♂' : '♀' }} {{ mascota.genero }}
                  </span>
                </div>
              </div>

              <!-- Pie -->
              <div class="mm-card-footer">
                <div v-if="mascota.nacimiento" class="mm-card-dato">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {{ calcEdad(mascota.nacimiento) }}
                </div>
                <div v-if="mascota.peso" class="mm-card-dato">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/></svg>
                  {{ mascota.peso }} kg
                </div>
              </div>

              <!-- Hover CTA -->
              <div class="mm-card-cta">Ver ficha →</div>

            </div>

            <!-- Card añadir -->
            <div
              class="mm-add card"
              @click="router.push({ name: 'nueva-mascota' })"
              tabindex="0"
              role="button"
              @keydown.enter="router.push({ name: 'nueva-mascota' })"
            >
              <div class="mm-add-inner">
                <div class="mm-add-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
                <p class="mm-add-title">Añadir mascota</p>
                <p class="mm-add-sub">Crea su ficha en un minuto</p>
              </div>
            </div>

          </div>
        </div>

      </template>
    </template>

  </div>
</template>

<style scoped>
.mm-page {
  padding-top: var(--page-padding-y);
  padding-bottom: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* Header */
.mm-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.mm-title   { margin-bottom: 0.2rem; }
.mm-sub     { font-size: 0.875rem; margin: 0; }

/* Fila top resumen + consejo */
.mm-top-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: stretch;
}

/* Familia */
.mm-fam-card { box-shadow: var(--shadow-sm); }
.mm-fam-body { display: flex; align-items: center; gap: 1rem; padding: 0.9rem 1.4rem; white-space: nowrap; }
.mm-fam-avatars { display: flex; align-items: center; }
.mm-fam-av {
  width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 800; font-size: 0.78rem; color: #fff;
  border: 2px solid var(--color-surface); position: relative;
}
.mm-fam-av-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.mm-fam-av--more { background: var(--color-surface-alt); color: var(--color-text-muted); font-size: 0.65rem; }
.mm-fam-count { display: flex; flex-direction: column; }
.mm-fam-num { font-family: var(--font-display); font-weight: 800; font-size: 1.5rem; color: var(--color-primary); line-height: 1; }
.mm-fam-lbl { font-family: var(--font-display); font-weight: 600; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); }

/* Consejo */
.mm-tip        { border: 1.5px solid var(--color-teal-light); }
.mm-tip-body   { display: flex; align-items: center; gap: 0.85rem; padding: 0.9rem 1.25rem; }
.mm-tip-icon   { width: 34px; height: 34px; border-radius: 50%; background: var(--color-teal-light); color: var(--color-teal-dark); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mm-tip-label  { font-family: var(--font-display); font-weight: 800; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-teal-dark); margin-bottom: 0.15rem; }
.mm-tip-text   { font-size: 0.82rem; color: var(--color-text-soft); margin: 0; line-height: 1.4; }

/* Label sección */
.mm-section-label {
  font-family: var(--font-display); font-weight: 700; font-size: 0.7rem;
  text-transform: uppercase; letter-spacing: 0.7px; color: var(--color-text-muted);
  margin-bottom: 0.9rem;
}

/* Grid */
.mm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(188px, 1fr));
  gap: var(--card-gap);
}

/* Card mascota */
.mm-card {
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  outline: none;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}
.mm-card:hover  { transform: translateY(-5px); box-shadow: var(--shadow-md); }
.mm-card:focus  { box-shadow: 0 0 0 3px rgba(124,203,194,0.3); }

.card-bg--macho  { background: linear-gradient(160deg, #ECF2FC 0%, #FFFFFF 55%); }
.card-bg--hembra { background: linear-gradient(160deg, #FCF0F5 0%, #FFFFFF 55%); }

/* Botones acción */
.mm-card-btns {
  position: absolute; top: 0.55rem; right: 0.55rem;
  display: flex; gap: 0.25rem;
  opacity: 0; transition: opacity var(--transition-fast); z-index: 2;
}
.mm-card:hover .mm-card-btns { opacity: 1; }

.mm-btn {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}
.mm-btn:hover { transform: scale(1.12); }
.mm-btn--edit { background: var(--color-teal-light); color: var(--color-teal-dark); }
.mm-btn--edit:hover { background: var(--color-teal); color: #fff; }
.mm-btn--del  { background: var(--color-surface-alt); color: var(--color-text-muted); }
.mm-btn--del:hover  { background: var(--color-danger-light); color: var(--color-danger); }

/* Foto */
.mm-card-foto-wrap { padding: 1.4rem 1.4rem 0; display: flex; justify-content: center; }
.mm-card-foto {
  width: 80px; height: 80px; border-radius: 50%; overflow: hidden;
  box-shadow: 0 3px 10px rgba(60,46,31,0.14); flex-shrink: 0;
}
.mm-card-foto-img { width: 100%; height: 100%; object-fit: cover; }
.mm-card-av {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 800; font-size: 1.65rem; color: #fff;
}

/* Info */
.mm-card-info { padding: 0.7rem 1.1rem 0; text-align: center; flex: 1; }
.mm-card-nombre { font-size: 0.88rem; letter-spacing: 0.3px; margin-bottom: 0.1rem; }
.mm-card-raza   { font-size: 0.73rem; color: var(--color-text-muted); margin: 0 0 0.45rem; }
.mm-card-tags   { display: flex; gap: 0.3rem; justify-content: center; flex-wrap: wrap; }
.mm-tag { display: inline-flex; align-items: center; padding: 0.18rem 0.55rem; border-radius: var(--radius-full); font-family: var(--font-display); font-weight: 700; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.3px; background: var(--color-surface-alt); color: var(--color-text-muted); }
.mm-tag--macho  { background: #E8F0FC; color: #3A5FA0; }
.mm-tag--hembra { background: #FCE8F0; color: #A03A5A; }

/* Pie */
.mm-card-footer {
  display: flex; justify-content: space-around;
  padding: 0.6rem 1rem;
  border-top: 1px solid var(--color-border);
  margin-top: 0.6rem;
}
.mm-card-dato { display: flex; align-items: center; gap: 0.3rem; font-size: 0.71rem; color: var(--color-text-muted); }

/* CTA hover */
.mm-card-cta {
  text-align: center; padding: 0.45rem;
  font-family: var(--font-display); font-weight: 700; font-size: 0.7rem;
  color: var(--color-primary); opacity: 0;
  transition: opacity var(--transition-fast);
  background: var(--color-primary-light);
}
.mm-card:hover .mm-card-cta { opacity: 1; }

/* Card añadir */
.mm-add {
  cursor: pointer; border: 2px dashed var(--color-border);
  background: transparent; box-shadow: none; outline: none;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}
.mm-add:hover, .mm-add:focus { border-color: var(--color-primary); background: var(--color-primary-light); }
.mm-add-inner { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem; min-height: 198px; padding: 1.5rem; text-align: center; }
.mm-add-icon  { width: 42px; height: 42px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; transition: background var(--transition-fast); }
.mm-add:hover .mm-add-icon { background: rgba(240,130,99,0.22); }
.mm-add-title { font-family: var(--font-display); font-weight: 700; font-size: 0.88rem; color: var(--color-text-soft); margin: 0; }
.mm-add-sub   { font-size: 0.73rem; color: var(--color-text-muted); margin: 0; }

/* Empty */
.mm-empty-wrap { display: flex; flex-direction: column; gap: 1.25rem; }
.mm-empty-body { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 3rem 2rem; gap: 0.6rem; }
.mm-empty-paw  { width: 72px; height: 72px; border-radius: 50%; background: var(--color-surface-alt); display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }

/* Responsive */
@media (max-width: 640px) {
  .mm-header { flex-direction: column; }
  .mm-header .btn { width: 100%; }
  .mm-top-row { grid-template-columns: 1fr; }
  .mm-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 380px) {
  .mm-grid { grid-template-columns: 1fr; }
}
</style>
