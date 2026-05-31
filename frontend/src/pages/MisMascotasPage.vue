<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import PetAvatar from "@/components/ui/PetAvatar.vue";
import { useRouter } from "vue-router";
import { useApi } from "@/composables/useApi.js";

const router = useRouter();
const { t } = useI18n();
const { get, remove } = useApi();

const mascotas = ref([]);
const loading = ref(false);
const error = ref(null);

// ── Modal de confirmación de borrado ──────────────────────────
const confirmModal = ref({ visible: false, mascota: null, eliminando: false });

function pedirConfirmacion(e, mascota) {
  e.stopPropagation();
  confirmModal.value = { visible: true, mascota, eliminando: false };
}
function cancelarEliminar() {
  confirmModal.value = { visible: false, mascota: null, eliminando: false };
}
async function confirmarEliminar() {
  const { mascota } = confirmModal.value;
  if (!mascota) return;
  confirmModal.value.eliminando = true;
  const { ok, data } = await remove(`/api/mascotas/${mascota.id}`);
  confirmModal.value = { visible: false, mascota: null, eliminando: false };
  if (!ok) {
    error.value = data.message || "No se pudo eliminar";
    return;
  }
  cargarMascotas();
}

async function cargarMascotas() {
  loading.value = true;
  error.value = null;
  const { ok, data } = await get("/api/mascotas");
  loading.value = false;
  if (!ok) {
    error.value = data.message || "No se pudieron cargar las mascotas";
    return;
  }
  mascotas.value = data.mascotas;
}
onMounted(cargarMascotas);

function verDetalle(id) {
  router.push({ name: "mascota-detalle", params: { id } });
}
function editarMascota(e, mascota) {
  e.stopPropagation();
  router.push({ name: "nueva-mascota", query: { editar: mascota.id } });
}

function calcEdad(nacimiento) {
  if (!nacimiento) return null;
  const meses = Math.floor(
    (Date.now() - new Date(nacimiento)) / (1000 * 60 * 60 * 24 * 30.44),
  );
  if (meses < 1) return t("pets.lessThanOneMonth");
  if (meses < 12)
    return `${meses} ${meses === 1 ? t("common.month") : t("common.months")}`;
  const años = Math.floor(meses / 12);
  return `${años} ${años === 1 ? t("common.year") : t("common.years")}`;
}
function iniciales(n) {
  return (n?.[0] || "").toUpperCase();
}

function normalizarValor(v) {
  return String(v || "")
    .trim()
    .toLowerCase();
}
function displaySpecies(especie) {
  const v = normalizarValor(especie);
  if (v === "perro" || v === "dog" || v === "gos") return t("common.dog");
  if (v === "gato" || v === "cat" || v === "gat") return t("common.cat");
  return especie || "";
}
function displayGender(genero) {
  const v = normalizarValor(genero);
  if (v === "macho" || v === "male" || v === "mascle") return t("common.male");
  if (v === "hembra" || v === "female" || v === "femella")
    return t("common.female");
  return genero || "";
}

const paleta = [
  "#C4A898",
  "#8EC8C4",
  "#E8A898",
  "#9EC89A",
  "#D4B896",
  "#B8A8C4",
];
function colorAv(i) {
  return paleta[i % paleta.length];
}

// FIX 3: fondo sólido pastel, no degradado que se pierde
function bgCard(genero) {
  if (genero === "macho") return "card-bg--macho";
  if (genero === "hembra") return "card-bg--hembra";
  return "";
}

const consejoHoy = computed(() => {
  const consejos = [
    t("pets.tipText"),
    t("petDetail.tipReminder"),
    t("petDetail.tipPreventive"),
    t("petDetail.tipReminder"),
  ];
  return consejos[new Date().getDate() % consejos.length];
});
</script>

<template>
  <div class="mm-page page-container">
    <!-- Header -->
    <div class="mm-header">
      <div>
        <h1 class="mm-title">{{ t("pets.title") }}</h1>
        <p class="mm-sub">
          <template v-if="mascotas.length > 0">
            {{ t("pets.companionsUnderCare", { count: mascotas.length }) }}
          </template>
          <template v-else>{{ t("pets.subtitle") }}</template>
        </p>
      </div>
      <button
        class="btn btn-primary"
        @click="router.push({ name: 'nueva-mascota' })"
      >
        + {{ t("pets.addPet") }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-center">
      <div class="spinner spinner-dark" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card">
      <div class="card-body" style="text-align: center; padding: 2.5rem">
        <p>{{ error }}</p>
        <button
          class="btn btn-outline"
          style="margin-top: 1rem"
          @click="cargarMascotas"
        >
          Reintentar
        </button>
      </div>
    </div>

    <template v-else>
      <!-- Sin mascotas -->
      <div v-if="mascotas.length === 0" class="mm-empty-wrap">
        <div class="card mm-empty-card">
          <div class="card-body mm-empty-body">
            <div class="mm-empty-paw">
              <Icon :icon="$icons.pets" width="52" height="52" />
            </div>
            <h3>{{ t("pets.empty") }}</h3>
            <p>{{ t("pets.emptyDesc") }}, vacunas y citas.</p>
            <button
              class="btn btn-primary"
              style="margin-top: 1.25rem"
              @click="router.push({ name: 'nueva-mascota' })"
            >
              {{ t("pets.addFirst") }}
            </button>
          </div>
        </div>
        <div class="card card-mint mm-tip">
          <div class="card-body mm-tip-body">
            <div class="mm-tip-icon">
              <Icon :icon="$icons.info" width="16" height="16" />
            </div>
            <div>
              <p class="mm-tip-label">{{ t("pets.tip") }}</p>
              <p class="mm-tip-text">{{ consejoHoy }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Con mascotas -->
      <template v-else>
        <div class="mm-top-row">
          <div class="card mm-fam-card">
            <div class="card-body mm-fam-body">
              <div class="mm-fam-avatars">
                <div
                  v-for="(m, i) in mascotas.slice(0, 4)"
                  :key="m.id"
                  class="mm-fam-av"
                  :style="{ marginLeft: i > 0 ? '-8px' : '0', zIndex: 10 - i }"
                >
                  <PetAvatar
                    :foto="m.foto"
                    :nombre="m.nombre"
                    :genero="m.genero"
                    tipo="mascota"
                    size="sm"
                  />
                </div>
                <div
                  v-if="mascotas.length > 4"
                  class="mm-fam-av mm-fam-av--more"
                >
                  +{{ mascotas.length - 4 }}
                </div>
              </div>
              <div class="mm-fam-count">
                <span class="mm-fam-num">{{ mascotas.length }}</span>
                <span class="mm-fam-lbl">{{
                  mascotas.length === 1
                    ? t("pets.petSingular")
                    : t("pets.petPlural")
                }}</span>
              </div>
            </div>
          </div>
          <div class="card card-mint mm-tip">
            <div class="card-body mm-tip-body">
              <div class="mm-tip-icon">
                <Icon :icon="$icons.info" width="16" height="16" />
              </div>
              <div>
                <p class="mm-tip-label">{{ t("pets.tip") }}</p>
                <p class="mm-tip-text">{{ consejoHoy }}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p class="mm-section-label">{{ t("pets.yourCompanions") }}</p>
          <div class="mm-grid">
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
              <!-- Botones editar/borrar — no propagan clic -->
              <div class="mm-card-btns">
                <button
                  class="mm-btn mm-btn--edit"
                  @click="editarMascota($event, mascota)"
                  :title="t('common.edit')"
                >
                  <Icon :icon="$icons.edit" width="11" height="11" />
                </button>
                <!-- FIX 1: abre modal propio en vez de window.confirm -->
                <button
                  class="mm-btn mm-btn--del"
                  @click="pedirConfirmacion($event, mascota)"
                  :title="t('common.delete')"
                >
                  <Icon :icon="$icons.delete" width="11" height="11" />
                </button>
              </div>

              <!-- Foto -->
              <div class="mm-card-foto-wrap">
                <div class="mm-card-foto">
                  <PetAvatar
                    :foto="mascota.foto"
                    :nombre="mascota.nombre"
                    :genero="mascota.genero"
                    tipo="mascota"
                    size="lg"
                  />
                </div>
              </div>

              <!-- Info — FIX 2: nombre limpio, icono dentro del chip -->
              <div class="mm-card-info">
                <h3 class="mm-card-nombre">
                  {{ mascota.nombre.toUpperCase() }}
                </h3>
                <p class="mm-card-raza">
                  {{ mascota.raza?.nombre || "—"
                  }}<template
                    v-if="mascota.es_mestizo && mascota.raza_secundaria"
                    ><span style="opacity: 0.6"> + </span
                    >{{ mascota.raza_secundaria.nombre }}</template
                  >
                </p>
                <div class="mm-card-tags">
                  <span v-if="mascota.raza?.especie?.especie" class="mm-tag">
                    {{ displaySpecies(mascota.raza.especie.especie) }}
                  </span>
                  <!-- Icono DENTRO del chip, no flotando sobre el nombre -->
                  <span
                    v-if="mascota.genero"
                    :class="[
                      'mm-tag mm-tag-genero',
                      mascota.genero === 'macho'
                        ? 'mm-tag--macho'
                        : 'mm-tag--hembra',
                    ]"
                  >
                    <Icon
                      style="flex-shrink: 0"
                      :icon="$icons.male"
                      width="11"
                      height="11"
                    />
                    {{ displayGender(mascota.genero) }}
                  </span>
                </div>
              </div>

              <!-- Pie -->
              <div class="mm-card-footer">
                <div v-if="mascota.nacimiento" class="mm-card-dato">
                  <Icon :icon="$icons.calendar" width="11" height="11" />
                  {{ calcEdad(mascota.nacimiento) }}
                </div>
                <div v-if="mascota.peso" class="mm-card-dato">
                  <Icon :icon="$icons.weight" width="11" height="11" />
                  {{ mascota.peso }} {{ t("common.kg") }}
                </div>
              </div>

              <div class="mm-card-cta">{{ t("pets.viewProfile") }}</div>
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
                  <Icon :icon="$icons.add" width="20" height="20" />
                </div>
                <p class="mm-add-title">{{ t("pets.addPet") }}</p>
                <p class="mm-add-sub">{{ t("pets.addPetCardDesc") }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>

  <!-- ── FIX 1: Modal confirmación borrado — Petnumy style ─── -->
  <Transition name="confirm-modal">
    <div
      v-if="confirmModal.visible"
      class="confirm-overlay"
      @click.self="cancelarEliminar"
    >
      <div class="confirm-card card">
        <!-- Icono alerta -->
        <div class="confirm-icon">
          <Icon :icon="$icons.delete" width="22" height="22" />
        </div>

        <!-- Texto -->
        <div class="confirm-text">
          <h3 class="confirm-title">
            ¿Eliminar a
            <span class="confirm-nombre">{{
              confirmModal.mascota?.nombre
            }}</span
            >?
          </h3>
          <p class="confirm-desc">Esta acción no se puede deshacer.</p>
        </div>

        <!-- Botones -->
        <div class="confirm-btns">
          <button
            class="btn btn-ghost"
            :disabled="confirmModal.eliminando"
            @click="cancelarEliminar"
          >
            {{ t("common.cancel") }}
          </button>
          <button
            class="btn btn-eliminar"
            :disabled="confirmModal.eliminando"
            @click="confirmarEliminar"
          >
            <span
              v-if="confirmModal.eliminando"
              class="spinner"
              style="width: 14px; height: 14px; border-width: 2px"
            />
            <span v-else>{{ t("common.delete") }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
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
.mm-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.mm-title {
  margin-bottom: 0.2rem;
}
.mm-sub {
  font-size: 0.875rem;
  margin: 0;
}

/* Top row */
.mm-top-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: stretch;
}

/* Familia */
.mm-fam-card {
  box-shadow: var(--shadow-sm);
}
.mm-fam-body {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.4rem;
  white-space: nowrap;
}
.mm-fam-avatars {
  display: flex;
  align-items: center;
}
.mm-fam-av {
  /* Solo ring de separación — el fondo lo da PetAvatar */
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid var(--color-surface);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mm-fam-av-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.mm-fam-av--more {
  background: var(--color-surface-alt);
  color: var(--color-text-muted);
  font-size: 0.65rem;
}
.mm-fam-count {
  display: flex;
  flex-direction: column;
}
.mm-fam-num {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.5rem;
  color: var(--color-primary);
  line-height: 1;
}
.mm-fam-lbl {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
}

/* Consejo */
.mm-tip {
  border: 1.5px solid var(--color-teal-light);
}
.mm-tip-body {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 1.25rem;
}
.mm-tip-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mm-tip-label {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-teal-dark);
  margin-bottom: 0.15rem;
}
.mm-tip-text {
  font-size: 0.82rem;
  color: var(--color-text-soft);
  margin: 0;
  line-height: 1.4;
}

/* Sección */
.mm-section-label {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: var(--color-text-muted);
  margin-bottom: 0.9rem;
}

/* Grid */
.mm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(188px, 1fr));
  gap: var(--card-gap);
}

/* ── FIX 3: Card con fondo sólido pastel (no degradado) ────── */
.mm-card {
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  outline: none;
  transition:
    transform var(--transition-normal),
    box-shadow var(--transition-normal);
  /* Sin fondo especial de base — los modificadores lo ponen */
}
.mm-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
}
.mm-card:focus {
  box-shadow: 0 0 0 3px rgba(124, 203, 194, 0.3);
}

/* Fondos sólidos pasteles visibles */
.card-bg--macho {
  background-color: #eaf4ff; /* azul pastel claro */
  border: 1.5px solid #c8deff; /* borde sutil azul */
}
.card-bg--hembra {
  background-color: #fff0f7; /* rosa pastel claro */
  border: 1.5px solid #ffd6ec; /* borde sutil rosa */
}
/* Hover: la card sin género tiene borde estándar */
.mm-card:not(.card-bg--macho):not(.card-bg--hembra) {
  border: 1.5px solid var(--color-border);
}

/* Botones acción */
.mm-card-btns {
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity var(--transition-fast);
  z-index: 2;
}
.mm-card:hover .mm-card-btns {
  opacity: 1;
}
.mm-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    transform var(--transition-fast);
}
.mm-btn:hover {
  transform: scale(1.12);
}
.mm-btn--edit {
  background: rgba(255, 255, 255, 0.75);
  color: var(--color-teal-dark);
}
.mm-btn--edit:hover {
  background: var(--color-teal);
  color: #fff;
}
.mm-btn--del {
  background: rgba(255, 255, 255, 0.75);
  color: var(--color-text-muted);
}
.mm-btn--del:hover {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

/* Foto */
.mm-card-foto-wrap {
  padding: 1.4rem 1.4rem 0;
  display: flex;
  justify-content: center;
}
.mm-card-foto {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mm-card-foto-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.mm-card-av {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.65rem;
  color: #fff;
}

/* ── FIX 2: Info — nombre limpio, icono solo dentro del chip ─ */
.mm-card-info {
  padding: 0.7rem 1.1rem 0;
  text-align: center;
  flex: 1;
}
.mm-card-nombre {
  font-size: 0.88rem;
  letter-spacing: 0.3px;
  margin-bottom: 0.1rem;
}
.mm-card-raza {
  font-size: 0.73rem;
  color: var(--color-text-muted);
  margin: 0 0 0.45rem;
}
.mm-card-tags {
  display: flex;
  gap: 0.3rem;
  justify-content: center;
  flex-wrap: wrap;
}

.mm-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.18rem 0.55rem;
  border-radius: var(--radius-full);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--color-text-muted);
}
/* En cards de color, el fondo blanco semitransparente queda bien */
.mm-tag--macho {
  background: rgba(255, 255, 255, 0.8);
  color: #3a5fa0;
}
.mm-tag--hembra {
  background: rgba(255, 255, 255, 0.8);
  color: #a03a5a;
}

/* Pie */
.mm-card-footer {
  display: flex;
  justify-content: space-around;
  padding: 0.6rem 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: 0.6rem;
}
.mm-card-dato {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.71rem;
  color: var(--color-text-muted);
}

/* CTA hover */
.mm-card-cta {
  text-align: center;
  padding: 0.45rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.7rem;
  color: var(--color-primary);
  opacity: 0;
  transition: opacity var(--transition-fast);
  background: rgba(240, 130, 99, 0.1);
}
.mm-card:hover .mm-card-cta {
  opacity: 1;
}

/* Card añadir */
.mm-add {
  cursor: pointer;
  border: 2px dashed var(--color-border);
  background: transparent;
  box-shadow: none;
  outline: none;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast);
}
.mm-add:hover,
.mm-add:focus {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}
.mm-add-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 198px;
  padding: 1.5rem;
  text-align: center;
}
.mm-add-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}
.mm-add:hover .mm-add-icon {
  background: rgba(240, 130, 99, 0.22);
}
.mm-add-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--color-text-soft);
  margin: 0;
}
.mm-add-sub {
  font-size: 0.73rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* Empty */
.mm-empty-wrap {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.mm-empty-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 2rem;
  gap: 0.6rem;
}
.mm-empty-paw {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--color-surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

/* ── FIX 1: Modal confirmación borrado ────────────────────── */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30, 20, 14, 0.45);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  z-index: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.confirm-card {
  width: 100%;
  max-width: 380px;
  padding: 2rem 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  box-shadow: var(--shadow-xl);
}

.confirm-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-danger-light);
  color: var(--color-danger);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.confirm-text {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.confirm-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text);
  margin: 0;
}
.confirm-nombre {
  color: var(--color-primary);
}
.confirm-desc {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0;
}

.confirm-btns {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  justify-content: center;
}

/* Botón eliminar — coral/rojo suave */
.btn-eliminar {
  background: var(--color-danger);
  color: #fff;
  padding: 0.7rem 1.5rem;
  border-radius: var(--radius-full);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
  box-shadow: 0 3px 10px rgba(217, 95, 95, 0.3);
}
.btn-eliminar:hover:not(:disabled) {
  background: #be4b4b;
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(217, 95, 95, 0.4);
}
.btn-eliminar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Animación modal */
.confirm-modal-enter-active,
.confirm-modal-leave-active {
  transition:
    opacity var(--transition-normal),
    transform var(--transition-normal);
}
.confirm-modal-enter-from,
.confirm-modal-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}

/* Responsive */
@media (max-width: 640px) {
  .mm-header {
    flex-direction: column;
  }
  .mm-header .btn {
    width: 100%;
  }
  .mm-top-row {
    grid-template-columns: 1fr;
  }
  .mm-grid {
    grid-template-columns: 1fr 1fr;
  }
  .confirm-btns {
    flex-direction: column;
  }
  .confirm-btns .btn,
  .confirm-btns .btn-eliminar {
    width: 100%;
    justify-content: center;
  }
}
@media (max-width: 380px) {
  .mm-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Mobile improvements ────────────────────────────────── */
@media (max-width: 600px) {
  /* 2 columnas en móvil, no 1 — mejor uso del espacio */
  .mm-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  /* Ajustar card para 2 col */
  .mm-card {
    min-width: 0;
  }
  .mm-card-nombre {
    font-size: 1rem;
  }
  .mm-card-raza {
    font-size: 0.72rem;
  }
}
@media (max-width: 360px) {
  .mm-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Botón añadir mascota siempre accesible ─────────────── */
@media (max-width: 600px) {
  .mm-page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  /* El botón de añadir ocupa todo el ancho */
  .mm-add-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Dark mode — género con contraste premium */
:global(html.dark) .card-bg--macho,
:global(html[data-theme="dark"]) .card-bg--macho {
  background-color: #14223a !important;
  border-color: rgba(96, 165, 250, 0.32) !important;
}
:global(html.dark) .card-bg--hembra,
:global(html[data-theme="dark"]) .card-bg--hembra {
  background-color: #2b1526 !important;
  border-color: rgba(244, 114, 182, 0.32) !important;
}
:global(html.dark) .mm-tag--macho,
:global(html[data-theme="dark"]) .mm-tag--macho {
  background: rgba(96, 165, 250, 0.18) !important;
  color: #bfdbfe !important;
  border: 1px solid rgba(147, 197, 253, 0.24);
}
:global(html.dark) .mm-tag--hembra,
:global(html[data-theme="dark"]) .mm-tag--hembra {
  background: rgba(244, 114, 182, 0.18) !important;
  color: #fbcfe8 !important;
  border: 1px solid rgba(249, 168, 212, 0.24);
}
</style>
