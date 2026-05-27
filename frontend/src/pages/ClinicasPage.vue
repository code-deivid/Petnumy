<!-- src/pages/ClinicasPage.vue -->
<!-- Clínicas veterinarias: mapa + listado + filtros + geolocalización -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useClinicas, SERVICIOS_META } from '@/composables/useClinicas.js'

const router = useRouter()
const { t } = useI18n()

const {
  clinicasFiltradas,
  cargando, error, clinicaActiva,
  ubicacion, buscandoUbicacion, errorUbicacion,
  filtros,
  cargar, usarUbicacionReal, buscarPorZona,
  limpiarUbicacion, toggleServicio, resetFiltros
} = useClinicas()

// ── Búsqueda manual ───────────────────────────────────────────
const inputBusqueda = ref('')
async function handleBusqueda() {
  if (!inputBusqueda.value.trim()) { limpiarUbicacion(); return }
  await buscarPorZona(inputBusqueda.value)
}

// ── Vista móvil ───────────────────────────────────────────────
const vistaMovil = ref('lista')   // 'lista' | 'mapa'

// ── Ordenación en UI ──────────────────────────────────────────
const OPCIONES_ORDEN = computed(() => [
  { val: 'relevancia', label: t('clinics.orderRelevance') },
  { val: 'distancia',  label: t('clinics.orderDistance')  },
  { val: 'valoracion', label: t('clinics.orderRating')    },
])

// ── Formatear distancia ───────────────────────────────────────
function fmtDistancia(km) {
  if (km == null) return null
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

// ── Estrellas ─────────────────────────────────────────────────
function estrellas(val) {
  if (!val) return '☆☆☆☆☆'
  const llenas = Math.floor(val)
  const media  = val - llenas >= 0.5 ? 1 : 0
  return '★'.repeat(llenas) + (media ? '½' : '') + '☆'.repeat(5 - llenas - media)
}

// ── Mapa Leaflet ─────────────────────────────────────────────
const mapaRef   = ref(null)   // div del mapa
let   leaflet   = null        // instancia del mapa
let   L         = null        // librería Leaflet
const markers   = ref({})     // id → marker

const CENTRO_VALENCIA = [39.4699, -0.3763]

async function initMapa() {
  // Carga dinámica de Leaflet (sin bundlear)
  if (!window.L) {
    await new Promise((resolve) => {
      const link = document.createElement('link')
      link.rel   = 'stylesheet'
      link.href  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      const script = document.createElement('script')
      script.src   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = resolve
      document.head.appendChild(script)
    })
  }
  L = window.L
  if (!mapaRef.value || leaflet) return

  leaflet = L.map(mapaRef.value, {
    center:  CENTRO_VALENCIA,
    zoom:    13,
    zoomControl: true
  })

  // Tiles OpenStreetMap — gratuito
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 19
  }).addTo(leaflet)

  actualizarMarkers()

  // Forzar recalculate por si el contenedor aún no tenía dimensiones pintadas
  setTimeout(() => { if (leaflet) leaflet.invalidateSize() }, 200)
}

// ── Icono personalizado Petnumy ───────────────────────────────
function crearIcono(activo = false) {
  if (!L) return null
  const color    = activo ? '#F08263' : '#7CCBC2'
  const colorBg  = activo ? '#FDE3D7' : '#E0F1EE'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="40" viewBox="0 0 34 40">
    <ellipse cx="17" cy="38" rx="7" ry="2.5" fill="rgba(0,0,0,0.15)"/>
    <path d="M17 0 C8 0 1 7 1 15.5 C1 25 17 38 17 38 C17 38 33 25 33 15.5 C33 7 26 0 17 0Z"
      fill="${colorBg}" stroke="${color}" stroke-width="2"/>
    <path d="M17 9 C14.5 9 12 11 12 13.5 A5 5 0 0 0 22 13.5 C22 11 19.5 9 17 9Z" fill="${color}"/>
    <path d="M9 14 C9 12 11 10 13 11 C11.5 12.5 12 14.5 13 15.5" fill="${color}"/>
    <path d="M25 14 C25 12 23 10 21 11 C22.5 12.5 22 14.5 21 15.5" fill="${color}"/>
    <ellipse cx="17" cy="18" rx="5.5" ry="4" fill="${color}"/>
    <path d="M14 20.5 C14 21.5 15 22.5 17 22.5 S20 21.5 20 20.5" fill="white"/>
  </svg>`

  return L.divIcon({
    html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25))">${svg}</div>`,
    iconSize:   [34, 40],
    iconAnchor: [17, 40],
    popupAnchor:[0, -42],
    className:  ''
  })
}

function actualizarMarkers() {
  if (!leaflet || !L) return

  // Limpiar markers viejos
  Object.values(markers.value).forEach(m => m.remove())
  markers.value = {}

  clinicasFiltradas.value.forEach(c => {
    if (!c.latitud || !c.longitud) return

    const icono  = crearIcono(clinicaActiva.value === c.id)
    const marker = L.marker([c.latitud, c.longitud], { icon: icono })

    marker.bindPopup(`
      <div style="font-family:'Poppins',sans-serif;min-width:160px;padding:4px 2px">
        <p style="font-weight:700;margin:0 0 4px;color:#3C2E1F;font-size:.875rem">${c.nombre}</p>
        <p style="margin:0;color:#9B8A75;font-size:.75rem">${c.ciudad || ''}</p>
        ${c.abierto_24h ? '<span style="display:inline-block;margin-top:4px;background:#E0F1EE;color:#4AADA5;font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:9999px">24H</span>' : ''}
      </div>
    `, { closeButton: false, maxWidth: 200 })

    marker.on('click', () => {
      clinicaActiva.value = c.id
      scrollAClinica(c.id)
      actualizarMarkers()
    })
    marker.on('mouseover', () => marker.openPopup())

    marker.addTo(leaflet)
    markers.value[c.id] = marker
  })
}

// Centrar mapa en una clínica
function centrarEn(clinica) {
  if (!leaflet || !clinica.latitud) return
  leaflet.flyTo([clinica.latitud, clinica.longitud], 16, { duration: 0.8 })
  clinicaActiva.value = clinica.id
  actualizarMarkers()
  if (window.innerWidth < 768) vistaMovil.value = 'mapa'
}

// Scroll al card de la clínica
function scrollAClinica(id) {
  nextTick(() => {
    const el = document.getElementById(`clinica-card-${id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

// Actualizar markers cuando cambian los filtros
watch(clinicasFiltradas, () => nextTick(actualizarMarkers))

// Centrar mapa en ubicación del usuario
watch(ubicacion, (u) => {
  if (!leaflet || !u) return
  leaflet.flyTo([u.lat, u.lng], 14, { duration: 1 })
  // Marker de usuario
  if (markers.value['_usuario']) markers.value['_usuario'].remove()
  if (!L) return
  const icono = L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#F08263;border:3px solid white;box-shadow:0 2px 8px rgba(240,130,99,.5)"></div>`,
    iconSize:  [16, 16],
    iconAnchor:[8, 8],
    className: ''
  })
  markers.value['_usuario'] = L.marker([u.lat, u.lng], { icon: icono, zIndexOffset: 1000 })
    .addTo(leaflet)
    .bindPopup(`<b style="font-size:.8rem">📍 ${u.label}</b>`)
})

onMounted(async () => {
  await cargar()
  await nextTick()
  initMapa()
})

onBeforeUnmount(() => {
  if (leaflet) { leaflet.remove(); leaflet = null }
})
</script>

<template>
  <div class="cl-page">

    <!-- ══ TOPBAR FIJO ══════════════════════════════════════ -->
    <div class="cl-topbar">

      <!-- Fila 1: búsqueda + título + ordenación -->
      <div class="cl-topbar-row1">
        <h1 class="cl-titulo">{{ t("clinics.availableTitle") }}
          <span v-if="!cargando" class="cl-titulo-count">({{ t("clinics.foundCount", { n: clinicasFiltradas.length }) }})</span>
        </h1>

        <!-- Búsqueda manual -->
        <div class="cl-search-wrap">
          <button type="button"
            class="cl-gps-btn"
            :class="{ 'cl-gps-btn--active': ubicacion }"
            :disabled="buscandoUbicacion"
            @click="usarUbicacionReal"
            :title="t('clinics.useMyLocation')"
          >
            <svg v-if="!buscandoUbicacion" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
              <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
            </svg>
            <div v-else class="spinner" style="width:13px;height:13px;border-width:2px"/>
          </button>
          <div class="cl-search-input-wrap">
            <svg class="cl-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              v-model="inputBusqueda"
              type="text"
              class="cl-search-input"
              :placeholder="t('clinics.searchPlaceholder')"
              @keyup.enter="handleBusqueda"
            />
            <button v-if="inputBusqueda" type="button" class="cl-search-clear" @click="inputBusqueda = ''; limpiarUbicacion()">✕</button>
          </div>
        </div>

        <!-- Zona activa -->
        <Transition name="fade">
          <div v-if="ubicacion" class="cl-zona-activa">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
            </svg>
            {{ ubicacion.label }}
            <button type="button" @click="limpiarUbicacion(); inputBusqueda = ''">✕</button>
          </div>
        </Transition>

        <!-- Ordenar por -->
        <div class="cl-orden-wrap">
          <span class="cl-orden-label">{{ t("clinics.orderBy") }}</span>
          <div class="cl-orden-btns">
            <button type="button"
              v-for="op in OPCIONES_ORDEN" :key="op.val"
              class="cl-orden-btn"
              :class="{ 'cl-orden-btn--on': filtros.orden === op.val }"
              :disabled="op.val === 'distancia' && !ubicacion"
              @click="filtros.orden = op.val"
            >{{ op.label }}</button>
          </div>
        </div>
      </div>

      <!-- Fila 2: chips de filtro -->
      <div class="cl-filtros-row">
        <button type="button"
          class="cl-chip"
          :class="{ 'cl-chip--on': filtros.abierto24h }"
          @click="filtros.abierto24h = !filtros.abierto24h"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {{ t("clinics.filterOpen24h") }}
        </button>
        <button type="button"
          v-for="(meta, key) in SERVICIOS_META" :key="key"
          class="cl-chip"
          :class="{ 'cl-chip--on': filtros.servicios.includes(key) }"
          @click="toggleServicio(key)"
        >
          <span>{{ meta.icon }}</span> {{ t(`clinics.services.${key}`) }}
        </button>
        <button type="button"
          v-if="filtros.servicios.length > 0 || filtros.abierto24h"
          class="cl-chip cl-chip--reset"
          @click="resetFiltros"
        >{{ t("clinics.clearFilters") }}</button>
      </div>

      <!-- Error ubicación -->
      <Transition name="fade">
        <p v-if="errorUbicacion" class="cl-error-ubic">{{ errorUbicacion }}</p>
      </Transition>

    </div>

    <!-- ══ CUERPO: MAPA IZQUIERDA + LISTA DERECHA ═══════════ -->
    <div class="cl-body">

      <!-- MAPA — izquierda, 55% -->
      <div class="cl-mapa-col" :class="{ 'cl-mapa-col--hidden': vistaMovil === 'lista' }">
        <div ref="mapaRef" class="cl-mapa" />
      </div>

      <!-- LISTADO — derecha, 45% -->
      <div class="cl-lista-col" :class="{ 'cl-lista-col--hidden': vistaMovil === 'mapa' }">

        <!-- Loading skeletons -->
        <div v-if="cargando" class="cl-skeletons">
          <div class="cl-ske" v-for="i in 3" :key="i" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="cl-empty">
          <p>{{ error }}</p>
          <button type="button" class="btn btn-outline" style="margin-top:1rem" @click="cargar">{{ t("common.retry") }}</button>
        </div>

        <!-- Sin resultados -->
        <div v-else-if="clinicasFiltradas.length === 0" class="cl-empty">
          <div class="cl-empty-icon">🏥</div>
          <p class="cl-empty-title">{{ t("clinics.noResults") }}</p>
          <p>{{ t("clinics.noResultsDesc") }}</p>
          <button type="button" class="btn btn-outline btn-sm" style="margin-top:1rem" @click="resetFiltros">
            {{ t("clinics.clearFilters") }}
          </button>
        </div>

        <!-- Cards -->
        <div v-else class="cl-lista">
          <div
            v-for="c in clinicasFiltradas"
            :key="c.id"
            :id="`clinica-card-${c.id}`"
            class="cl-card"
            :class="{ 'cl-card--activa': clinicaActiva === c.id }"
            @click="centrarEn(c)"
            @mouseenter="clinicaActiva = c.id; actualizarMarkers()"
            @mouseleave="clinicaActiva = null; actualizarMarkers()"
          >
            <!-- Imagen -->
            <div class="cl-card-img-wrap">
              <img v-if="c.imagen" :src="c.imagen" :alt="c.nombre" class="cl-card-img" loading="lazy" />
              <div v-else class="cl-card-img-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span v-if="c.abierto_24h" class="cl-badge-24h">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                24H
              </span>
            </div>

            <!-- Info -->
            <div class="cl-card-body">

              <!-- Fila nombre + distancia -->
              <div class="cl-card-header">
                <h3 class="cl-card-nombre">{{ c.nombre }}</h3>
                <span v-if="fmtDistancia(c.distancia)" class="cl-card-dist">
                  {{ fmtDistancia(c.distancia) }}
                </span>
              </div>

              <!-- Valoración -->
              <div class="cl-card-rating">
                <span class="cl-stars">
                  <span v-for="i in 5" :key="i" class="cl-star" :class="i <= Math.round(c.valoracion || 0) ? 'cl-star--on' : ''">★</span>
                </span>
                <span class="cl-rating-val">{{ c.valoracion?.toFixed(1) }}</span>
              </div>

              <!-- Dirección -->
              <p class="cl-card-dir">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {{ [c.direccion, c.ciudad].filter(Boolean).join(', ') }}
                <span v-if="fmtDistancia(c.distancia)" class="cl-dir-dist">• {{ fmtDistancia(c.distancia) }}</span>
              </p>

              <!-- Servicios + Reservar -->
              <div class="cl-card-footer">
                <div class="cl-card-chips">
                  <span
                    v-for="s in (c.servicios || []).slice(0, 3)"
                    :key="s"
                    class="cl-chip-mini"
                    :style="{ background: SERVICIOS_META[s]?.bg || '#F7F2EA', color: SERVICIOS_META[s]?.color || '#9B8A75' }"
                  >{{ t(`clinics.services.${s}`).toUpperCase() }}</span>
                </div>
                <button
                  type="button"
                  class="cl-reservar-btn"
                  @click.stop="router.push({ name: 'clinica-detalle', params: { id: c.id } })"
                >
                  {{ t("clinics.book").toUpperCase() }}
                </button>
              </div>

            </div>
          </div>

          <!-- Footer listado -->
          <p class="cl-lista-footer">{{ t("clinics.mapHint") }}</p>
        </div>
      </div>

    </div>

    <!-- Toggle móvil -->
    <div class="cl-toggle-movil">
      <button type="button" class="cl-vtoggle" :class="{ 'cl-vtoggle--on': vistaMovil === 'lista' }" @click="vistaMovil = 'lista'">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/></svg>
        {{ t("clinics.toggleList") }}
      </button>
      <button type="button" class="cl-vtoggle" :class="{ 'cl-vtoggle--on': vistaMovil === 'mapa' }" @click="vistaMovil = 'mapa'">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
        {{ t("clinics.toggleMap") }}
      </button>
    </div>

  </div>
</template>

<style scoped>
/* ══ Contenedor raíz ══════════════════════════════════════════ */
.cl-page {
  /* Ocupa todo el viewport menos la navbar, SIN page-container */
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--navbar-height));
  overflow: hidden;
  background: var(--color-bg);
}

/* ══ TOPBAR ═══════════════════════════════════════════════════ */
.cl-topbar {
  flex-shrink: 0;
  background: var(--color-surface);
  border-bottom: 1.5px solid var(--color-border);
  padding: 0.75rem 1.25rem 0;
  box-shadow: 0 2px 8px rgba(60,46,31,.06);
  z-index: 100;
}

/* Fila 1 */
.cl-topbar-row1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-bottom: 0.6rem;
}

.cl-titulo {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text);
  white-space: nowrap;
  margin: 0;
  flex-shrink: 0;
}
.cl-titulo-count {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-teal-dark);
  margin-left: 0.35rem;
}

/* Búsqueda */
.cl-search-wrap {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex: 1;
  min-width: 180px;
  max-width: 320px;
}
.cl-gps-btn {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--color-surface-alt); border: 1.5px solid var(--color-border);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  color: var(--color-text-soft); cursor: pointer;
  transition: all var(--transition-fast);
}
.cl-gps-btn:hover       { border-color: var(--color-teal); color: var(--color-teal-dark); background: var(--color-teal-light); }
.cl-gps-btn--active     { border-color: var(--color-primary); background: var(--color-primary-light); color: var(--color-primary); }
.cl-gps-btn:disabled    { opacity: 0.5; }

.cl-search-input-wrap   { position: relative; flex: 1; display: flex; align-items: center; }
.cl-search-icon         { position: absolute; left: 0.7rem; color: var(--color-text-muted); pointer-events: none; flex-shrink: 0; }
.cl-search-input {
  width: 100%; padding: 0.55rem 2rem 0.55rem 2.1rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface-alt);
  font-size: 0.82rem; color: var(--color-text);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.cl-search-input:focus  { border-color: var(--color-teal); box-shadow: 0 0 0 3px rgba(124,203,194,.15); background: #fff; outline: none; }
.cl-search-clear        { position: absolute; right: 0.6rem; font-size: 0.75rem; color: var(--color-text-muted); }

/* Zona activa */
.cl-zona-activa {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.72rem; font-family: var(--font-display); font-weight: 700;
  color: var(--color-teal-dark); background: var(--color-teal-light);
  padding: 0.22rem 0.65rem; border-radius: var(--radius-full);
  white-space: nowrap; flex-shrink: 0;
}
.cl-zona-activa button { font-size: 0.65rem; color: var(--color-teal-dark); }

/* Ordenar por */
.cl-orden-wrap  { display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0; margin-left: auto; }
.cl-orden-label { font-size: 0.72rem; color: var(--color-text-muted); white-space: nowrap; font-family: var(--font-display); font-weight: 600; }
.cl-orden-btns  { display: flex; gap: 0.2rem; }
.cl-orden-btn {
  padding: 0.32rem 0.75rem; border-radius: var(--radius-full);
  font-family: var(--font-display); font-weight: 600; font-size: 0.72rem;
  border: 1.5px solid var(--color-border); background: var(--color-surface-alt);
  color: var(--color-text-muted); cursor: pointer; transition: all var(--transition-fast);
}
.cl-orden-btn:hover:not(:disabled)  { border-color: var(--color-teal); color: var(--color-teal-dark); }
.cl-orden-btn--on                   { border-color: var(--color-teal); background: var(--color-teal-light); color: var(--color-teal-dark); font-weight: 700; }
.cl-orden-btn:disabled              { opacity: 0.4; cursor: not-allowed; }

/* Chips filtro */
.cl-filtros-row {
  display: flex; gap: 0.4rem; flex-wrap: nowrap;
  padding: 0 0 0.65rem;
  overflow-x: auto;
  /* Scroll sin barra visible */
  scrollbar-width: none;
}
.cl-filtros-row::-webkit-scrollbar { display: none; }

.cl-chip {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.38rem 1rem; border-radius: var(--radius-full);
  font-family: var(--font-display); font-weight: 700; font-size: 0.75rem;
  border: 1.5px solid var(--color-border); background: var(--color-surface);
  color: var(--color-text-soft); cursor: pointer; white-space: nowrap;
  transition: all var(--transition-fast);
}
.cl-chip:hover  { border-color: var(--color-teal); color: var(--color-text); background: var(--color-teal-light); }
.cl-chip--on    { border-color: var(--color-teal); background: var(--color-teal); color: #fff; box-shadow: 0 2px 8px rgba(124,203,194,.35); }
.cl-chip--reset { border-color: transparent; color: var(--color-text-muted); background: var(--color-surface-alt); }
.cl-chip--reset:hover { background: var(--color-danger-light); color: var(--color-danger); border-color: var(--color-danger); }

.cl-error-ubic { font-size: 0.72rem; color: var(--color-danger); padding: 0 0 0.4rem; margin: 0; }

/* ══ CUERPO: MAPA + LISTA ════════════════════════════════════ */
.cl-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  /* Sin padding, sin max-width — ocupa TODO el viewport */
}

/* MAPA — izquierda, 55% */
.cl-mapa-col {
  flex: 0 0 55%;
  position: relative;
  overflow: hidden;
}
.cl-mapa {
  width: 100%;
  height: 100%;
}
/* Filtro pastel sobre los tiles para coherencia con el diseño Petnumy */
.cl-mapa :deep(.leaflet-tile-pane) {
  filter: saturate(0.75) sepia(0.08) brightness(1.03);
}

/* LISTADO — derecha, 45% */
.cl-lista-col {
  flex: 0 0 45%;
  overflow-y: auto;
  padding: 0.75rem 1.25rem 1.25rem;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: 0;
  /* Scrollbar custom */
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}
.cl-lista-col::-webkit-scrollbar       { width: 4px; }
.cl-lista-col::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }

/* Skeletons */
.cl-skeletons { display: flex; flex-direction: column; gap: 0.75rem; padding-top: 0.5rem; }
.cl-ske {
  height: 140px; border-radius: var(--radius-lg);
  background: var(--color-surface-alt);
  animation: _pulse 1.5s ease-in-out infinite;
}
@keyframes _pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

/* Empty */
.cl-empty { text-align: center; padding: 3rem 1.5rem; color: var(--color-text-muted); }
.cl-empty-icon  { font-size: 2.5rem; margin-bottom: 0.5rem; }
.cl-empty-title { font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; color: var(--color-text); margin: 0 0 0.3rem; }

/* Lista de cards */
.cl-lista { display: flex; flex-direction: column; gap: 0.65rem; padding-top: 0.25rem; }

/* ══ CARD CLÍNICA ════════════════════════════════════════════ */
.cl-card {
  display: flex;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1.5px solid var(--color-border);
  cursor: pointer;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-fast);
  box-shadow: var(--shadow-card);
}
.cl-card:hover   { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--color-teal-mid); }
.cl-card--activa { border-color: var(--color-primary); box-shadow: 0 0 0 2.5px rgba(240,130,99,.2), var(--shadow-md); }

/* Imagen lado izquierdo */
.cl-card-img-wrap {
  width: 120px; min-height: 120px;
  flex-shrink: 0; position: relative; overflow: hidden;
}
.cl-card-img            { width: 100%; height: 100%; object-fit: cover; display: block; }
.cl-card-img-placeholder {
  width: 100%; height: 100%; min-height: 120px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--color-teal-light), var(--color-primary-light));
  color: var(--color-teal-dark);
}

/* Badge 24H */
.cl-badge-24h {
  position: absolute; top: 7px; right: 7px;
  display: inline-flex; align-items: center; gap: 0.25rem;
  background: #F08263; color: #fff;
  font-family: var(--font-display); font-weight: 800; font-size: 0.6rem; letter-spacing: 0.5px;
  padding: 2px 7px; border-radius: var(--radius-full);
  box-shadow: 0 1px 4px rgba(240,130,99,.4);
}

/* Body de la card */
.cl-card-body {
  flex: 1; padding: 0.85rem 1rem;
  display: flex; flex-direction: column; gap: 0.3rem;
  min-width: 0;
}
.cl-card-header {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 0.5rem;
}
.cl-card-nombre {
  font-family: var(--font-display); font-weight: 800;
  font-size: 0.9rem; color: var(--color-text); margin: 0; line-height: 1.25;
}
.cl-card-dist {
  font-family: var(--font-display); font-weight: 700; font-size: 0.7rem;
  color: var(--color-text-muted); white-space: nowrap; flex-shrink: 0;
}

/* Estrellas */
.cl-card-rating { display: flex; align-items: center; gap: 0.3rem; }
.cl-stars       { display: flex; gap: 1px; }
.cl-star        { font-size: 0.82rem; color: #E2D0C0; }
.cl-star--on    { color: #F08263; }
.cl-rating-val  { font-family: var(--font-display); font-weight: 700; font-size: 0.75rem; color: var(--color-text-muted); }

/* Dirección */
.cl-card-dir {
  display: flex; align-items: flex-start; gap: 0.3rem;
  font-size: 0.73rem; color: var(--color-text-muted); margin: 0; line-height: 1.4;
}
.cl-card-dir svg { flex-shrink: 0; margin-top: 2px; }
.cl-dir-dist    { color: var(--color-teal-dark); font-weight: 600; margin-left: 0.2rem; }

/* Footer: servicios + botón */
.cl-card-footer {
  display: flex; align-items: center;
  justify-content: space-between; gap: 0.5rem;
  margin-top: 0.2rem; flex-wrap: wrap;
}
.cl-card-chips  { display: flex; gap: 0.3rem; flex-wrap: wrap; flex: 1; }
.cl-chip-mini {
  display: inline-flex; align-items: center;
  padding: 0.15rem 0.55rem; border-radius: var(--radius-full);
  font-family: var(--font-display); font-weight: 700;
  font-size: 0.58rem; letter-spacing: 0.4px; white-space: nowrap;
}

/* Botón Reservar */
.cl-reservar-btn {
  background: var(--color-teal);
  color: #fff;
  font-family: var(--font-display); font-weight: 800; font-size: 0.72rem; letter-spacing: 0.5px;
  padding: 0.4rem 1rem; border-radius: var(--radius-full);
  border: none; cursor: pointer; flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(124,203,194,.35);
  transition: background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
}
.cl-reservar-btn:hover { background: var(--color-teal-dark); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(124,203,194,.45); }

/* Footer de lista */
.cl-lista-footer {
  text-align: center; font-size: 0.75rem; color: var(--color-text-muted);
  font-style: italic; margin: 0.75rem 0 0; padding: 0.75rem 0;
  border-top: 1px dashed var(--color-border);
}

/* ══ TOGGLE MÓVIL ════════════════════════════════════════════ */
.cl-toggle-movil {
  display: none;
  position: fixed; bottom: 1.25rem; left: 50%; transform: translateX(-50%);
  background: var(--color-surface); border-radius: var(--radius-full);
  box-shadow: var(--shadow-lg); padding: 0.3rem;
  gap: 0.2rem; z-index: 200;
  border: 1px solid var(--color-border);
}
.cl-vtoggle {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.5rem 1.25rem; border-radius: var(--radius-full);
  font-family: var(--font-display); font-weight: 700; font-size: 0.82rem;
  color: var(--color-text-soft); background: transparent; border: none; cursor: pointer;
  transition: all var(--transition-fast);
}
.cl-vtoggle--on { background: var(--color-primary); color: #fff; box-shadow: 0 2px 8px rgba(240,130,99,.3); }

/* ══ RESPONSIVE ══════════════════════════════════════════════ */
@media (max-width: 900px) {
  .cl-mapa-col { flex: 0 0 50%; }
  .cl-lista-col { flex: 0 0 50%; }
}

@media (max-width: 768px) {
  .cl-page { height: auto; min-height: calc(100vh - var(--navbar-height)); overflow: visible; }
  .cl-body { flex-direction: column; overflow: visible; height: auto; }

  .cl-mapa-col { flex: none; width: 100%; height: 55vw; min-height: 250px; max-height: 360px; }
  .cl-mapa-col--hidden { display: none; }

  .cl-lista-col { flex: none; width: 100%; overflow: visible; padding: 0.75rem 1rem 5rem; }
  .cl-lista-col--hidden { display: none; }

  .cl-toggle-movil { display: flex; }

  .cl-topbar-row1 { gap: 0.5rem; }
  .cl-orden-wrap  { margin-left: 0; width: 100%; }
  .cl-orden-btns  .cl-orden-btn { flex: 1; text-align: center; }
  .cl-card-img-wrap { width: 90px; min-height: 100px; }
}

@media (max-width: 480px) {
  .cl-search-wrap { max-width: 100%; }
  .cl-card-nombre { font-size: 0.82rem; }
}
</style>
