<!-- src/pages/MisMascotasPage.vue — cards premium con foto, fondo por género, editar -->
<script setup>
import { ref, onMounted } from 'vue'
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

async function eliminarMascota(mascota) {
  if (!confirm(`¿Eliminar a ${mascota.nombre}? Esta acción no se puede deshacer.`)) return
  const { ok, data } = await remove(`/api/mascotas/${mascota.id}`)
  if (!ok) { alert(data.message || 'No se pudo eliminar'); return }
  cargarMascotas()
}

function editarMascota(mascota) {
  router.push({ name: 'nueva-mascota', query: { editar: mascota.id } })
}

// Calcular edad legible
function calcEdad(nacimiento) {
  if (!nacimiento) return null
  const d = new Date(nacimiento)
  const meses = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`
  const años = Math.floor(meses / 12)
  return `${años} ${años === 1 ? 'año' : 'años'}`
}

// Iniciales
function iniciales(nombre) {
  return (nombre?.[0] || '').toUpperCase()
}

// Color de fondo de la card según género
function bgCard(genero) {
  if (genero === 'macho')  return 'card-bg--macho'
  if (genero === 'hembra') return 'card-bg--hembra'
  return ''
}

// Color del avatar según índice
const avatarPaleta = ['#B8A898','#8EC8C4','#E8A090','#9EC89A','#D4B896','#C4A8B8']
function colorAvatar(idx) { return avatarPaleta[idx % avatarPaleta.length] }
</script>

<template>
  <div class="page-container page-section">

    <!-- Cabecera -->
    <div class="mm-head">
      <div>
        <h1>Mis Mascotas</h1>
        <p class="mm-sub">
          {{ mascotas.length > 0
            ? `${mascotas.length} compañero${mascotas.length !== 1 ? 's' : ''} bajo tu cuidado`
            : 'Gestiona a tus compañeros peludos' }}
        </p>
      </div>
      <button class="btn btn-primary" @click="router.push({ name: 'nueva-mascota' })">
        + Añadir mascota
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-center">
      <div class="spinner spinner-dark" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="empty-state">
      <p>{{ error }}</p>
      <button class="btn btn-outline" style="margin-top:1rem" @click="cargarMascotas">Reintentar</button>
    </div>

    <!-- Sin mascotas -->
    <div v-else-if="mascotas.length === 0" class="card empty-card">
      <div class="card-body empty-body">
        <div class="empty-paw">
          <svg width="38" height="38" viewBox="0 0 60 60" fill="none">
            <ellipse cx="14" cy="24" rx="6"   ry="8"   fill="#D4C4B0"/>
            <ellipse cx="46" cy="24" rx="6"   ry="8"   fill="#D4C4B0"/>
            <ellipse cx="24" cy="14" rx="5.5" ry="7.5" fill="#D4C4B0"/>
            <ellipse cx="36" cy="14" rx="5.5" ry="7.5" fill="#D4C4B0"/>
            <path d="M30 28c-10 0-18 8-18 15 0 5 4 9 9 9 3.5 0 5.5-1.5 9-1.5s5.5 1.5 9 1.5c5 0 9-4 9-9 0-7-8-15-18-15z" fill="#D4C4B0"/>
          </svg>
        </div>
        <p class="empty-title">Aún no tienes mascotas</p>
        <p>Añade a tu primer compañero para empezar a gestionar su salud</p>
        <button class="btn btn-primary" style="margin-top:1.25rem" @click="router.push({ name: 'nueva-mascota' })">
          Añadir mi primera mascota
        </button>
      </div>
    </div>

    <!-- Grid de mascotas -->
    <div v-else class="mm-grid">

      <div
        v-for="(mascota, idx) in mascotas"
        :key="mascota.id"
        class="card card-animate mm-card"
        :class="bgCard(mascota.genero)"
      >
        <!-- Botones flotantes -->
        <div class="mm-card-actions">
          <button class="mm-action-btn mm-action-btn--edit" @click.stop="editarMascota(mascota)" title="Editar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="mm-action-btn mm-action-btn--del" @click.stop="eliminarMascota(mascota)" title="Eliminar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </button>
        </div>

        <div class="mm-card-body">
          <!-- Zona foto / avatar -->
          <div class="mm-avatar-wrap">
            <img
              v-if="mascota.foto"
              :src="mascota.foto"
              :alt="mascota.nombre"
              class="mm-foto"
            />
            <div
              v-else
              class="mm-avatar"
              :style="{ background: colorAvatar(idx) }"
            >
              {{ iniciales(mascota.nombre) }}
            </div>
          </div>

          <!-- Info -->
          <div class="mm-info">
            <h3 class="mm-nombre">{{ mascota.nombre.toUpperCase() }}</h3>
            <p class="mm-raza">{{ mascota.raza?.nombre || '—' }}</p>

            <!-- Tags especie + género -->
            <div class="mm-tags">
              <span v-if="mascota.raza?.especie?.especie" class="tag">
                {{ mascota.raza.especie.especie.toUpperCase() }}
              </span>
              <span
                v-if="mascota.genero"
                :class="['tag', mascota.genero === 'macho' ? 'tag--macho' : 'tag--hembra']"
              >
                {{ mascota.genero === 'macho' ? '♂' : '♀' }} {{ mascota.genero.toUpperCase() }}
              </span>
            </div>
          </div>

          <!-- Pie con edad y peso -->
          <div class="mm-footer">
            <div v-if="mascota.nacimiento" class="mm-dato">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ calcEdad(mascota.nacimiento) }}
            </div>
            <div v-if="mascota.peso" class="mm-dato">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/></svg>
              {{ mascota.peso }} kg
            </div>
          </div>
        </div>
      </div>

      <!-- Card añadir -->
      <div class="card mm-add card-animate" @click="router.push({ name: 'nueva-mascota' })">
        <div class="mm-add-body">
          <div class="mm-add-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <p class="mm-add-label">Añadir mascota</p>
          <p class="mm-add-sub">Crea su ficha en un minuto</p>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Cabecera */
.mm-head {
  display: flex; align-items: flex-start;
  justify-content: space-between;
  gap: 1rem; margin-bottom: 2rem;
}
.mm-sub { font-size: 0.875rem; margin: 0.2rem 0 0; }

/* Grid */
.mm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--card-gap);
}

/* ── Card mascota ─────────────────────────────────────────── */
.mm-card {
  position: relative;
  overflow: visible;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}
.mm-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

/* Fondo sutil por género — degradado muy suave */
.card-bg--macho  { background: linear-gradient(160deg, #EEF4FB 0%, #FFFFFF 55%); }
.card-bg--hembra { background: linear-gradient(160deg, #FCEEF3 0%, #FFFFFF 55%); }

/* Botones flotantes — aparecen al hover */
.mm-card-actions {
  position: absolute;
  top: 0.6rem; right: 0.6rem;
  display: flex;
  gap: 0.3rem;
  opacity: 0;
  transition: opacity var(--transition-fast);
  z-index: 2;
}
.mm-card:hover .mm-card-actions { opacity: 1; }

.mm-action-btn {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}
.mm-action-btn:hover { transform: scale(1.1); }

.mm-action-btn--edit {
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
}
.mm-action-btn--edit:hover { background: var(--color-teal); color: #fff; }

.mm-action-btn--del {
  background: var(--color-surface-alt);
  color: var(--color-text-muted);
}
.mm-action-btn--del:hover { background: var(--color-danger-light); color: var(--color-danger); }

/* Body */
.mm-card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  padding: 1.75rem 1.25rem 1.25rem;
  text-align: center;
}

/* Avatar / foto */
.mm-avatar-wrap {
  width: 76px; height: 76px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 3px 12px rgba(60,46,31,0.14);
}

.mm-foto {
  width: 100%; height: 100%;
  object-fit: cover;
}

.mm-avatar {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.65rem;
  color: #fff;
}

/* Info */
.mm-nombre { font-size: 0.95rem; letter-spacing: 0.3px; }
.mm-raza   { font-size: 0.78rem; color: var(--color-text-muted); margin: 0; }

.mm-tags {
  display: flex; gap: 0.35rem;
  flex-wrap: wrap; justify-content: center;
  margin-top: 0.2rem;
}

/* Tags género con color */
.tag--macho  { background: #E8F0FC; color: #3A5FA0; }
.tag--hembra { background: #FCE8F0; color: #A03A5A; }

/* Footer */
.mm-footer {
  display: flex; justify-content: space-between;
  width: 100%;
  padding-top: 0.6rem;
  border-top: 1px solid var(--color-border);
  margin-top: 0.2rem;
  gap: 0.5rem;
}

.mm-dato {
  display: flex; align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* Card añadir */
.mm-add {
  cursor: pointer;
  border: 2px dashed var(--color-border);
  box-shadow: none;
  background: transparent;
  transition: border-color var(--transition-fast), background var(--transition-fast);
  border-radius: var(--radius-lg);
}
.mm-add:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.mm-add-body {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 0.4rem;
  min-height: 185px;
  padding: 1.5rem;
  text-align: center;
}

.mm-add-icon {
  width: 42px; height: 42px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  transition: background var(--transition-fast);
}
.mm-add:hover .mm-add-icon { background: rgba(240,130,99,0.22); }

.mm-add-label { font-family: var(--font-display); font-weight: 700; font-size: 0.875rem; color: var(--color-text-soft); margin: 0; }
.mm-add-sub   { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }

/* Empty */
.empty-card .empty-body {
  display: flex; flex-direction: column;
  align-items: center; text-align: center;
  padding: 3rem 2rem; gap: 0.5rem;
}
.empty-paw {
  width: 70px; height: 70px;
  border-radius: 50%;
  background: var(--color-surface-alt);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 0.5rem;
}
.empty-title { font-family: var(--font-display); font-weight: 700; font-size: 1rem; color: var(--color-text); margin: 0; }

/* Responsive */
@media (max-width: 540px) {
  .mm-head { flex-direction: column; }
  .mm-head .btn { width: 100%; }
  .mm-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 360px) {
  .mm-grid { grid-template-columns: 1fr; }
}
</style>
