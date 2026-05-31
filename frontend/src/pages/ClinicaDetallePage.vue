<!-- Detalle de clínica + modal de reserva de cita con stepper de 4 pasos -->

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApi } from "@/composables/useApi.js";
import DatePicker from "@/components/ui/DatePicker.vue";
import { useI18n } from "vue-i18n";
import PetAvatar from "@/components/ui/PetAvatar.vue";

const route = useRoute();
const router = useRouter();
const { get, post } = useApi();
const { t, locale } = useI18n();

function normalizarServicio(servicio = "") {
  return String(servicio)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

function servicioLabel(servicio = "") {
  const key = normalizarServicio(servicio);
  const map = {
    urgencias: "services.urgencias",
    cirugia: "services.cirugia",
    hospitalizacion: "services.hospitalizacion",
    vacunas: "services.vacunas",
    exoticos: "services.exoticos",
    peluqueria: "services.peluqueria",
    abierto24h: "services.abierto24h",
    "24h": "services.abierto24h",
  };
  return map[key] ? t(map[key]) : servicio;
}

// ── Datos de la clínica ───────────────────────────────────────
const clinica = ref(null);
const veterinarios = ref([]);
const loading = ref(false);
const error = ref(null);

async function cargarDetalle() {
  loading.value = true;
  error.value = null;
  const id = route.params.id;

  const { ok: okC, data: dC } = await get(`/api/clinicas/${id}`);
  if (!okC) {
    error.value = dC.message || t("clinicDetail.notFound");
    loading.value = false;
    return;
  }
  clinica.value = dC.clinica;

  const { ok: okV, data: dV } = await get(`/api/clinicas/${id}/veterinarios`);
  if (okV) veterinarios.value = dV.veterinarios;

  loading.value = false;
}

onMounted(cargarDetalle);

// ── Colores de servicios ──────────────────────────────────────
const SERVICIOS_STYLE = {
  urgencias: { bg: "#FDEAEA", color: "#D95F5F", label: "Urgencias" },
  peluqueria: { bg: "#FCE8F0", color: "#A03A5A", label: "Peluquería" },
  vacunas: { bg: "#E0F1EE", color: "#4AADA5", label: "Vacunas" },
  cirugia: { bg: "#F7F0E8", color: "#6B4C38", label: "Cirugía" },
  hospitalizacion: {
    bg: "#E8F0FC",
    color: "#3A5FA0",
    label: "Hospitalización",
  },
  exoticos: { bg: "#F0ECF8", color: "#5A3A8A", label: "Exóticos" },
};

// ══════════════════════════════════════════════════════════════
// MODAL DE RESERVA
// ══════════════════════════════════════════════════════════════

const modalAbierto = ref(false);
const paso = ref(1); // 1: Mascota  2: Motivo  3: Fecha  4: Hora
const errorModal = ref(null);
const guardando = ref(false);
const exitoCita = ref(false);

const formReserva = ref({
  mascota: null,
  motivo: "",
  fecha: "", // 'YYYY-MM-DD'
  hora: "", // 'HH:MM'
});

const mascotas = ref([]);
const cargandoMascotas = ref(false);

// Motivos predefinidos
const MOTIVOS = computed(() => [
  {
    id: "revision",
    label: t("booking.motives.revision"),
    icon: "mdi:stethoscope",
  },
  { id: "vacuna", label: t("booking.motives.vacuna"), icon: "mdi:needle" },
  {
    id: "peluqueria",
    label: t("booking.motives.peluqueria"),
    icon: "mdi:content-cut",
  },
  {
    id: "cirugia",
    label: t("booking.motives.cirugia"),
    icon: "mdi:medical-bag",
  },
  {
    id: "urgencia",
    label: t("booking.motives.urgencia"),
    icon: "mdi:ambulance",
  },
  {
    id: "desparasitacion",
    label: t("booking.motives.desparasitacion"),
    icon: "mdi:bug-outline",
  },
  {
    id: "otro",
    label: t("booking.motives.otro"),
    icon: "mdi:clipboard-text-outline",
  },
]);

// Horas disponibles 9:00–19:00 cada 30 min
const horasDisponibles = computed(() => {
  const h = [];
  for (let i = 9; i < 20; i++) {
    h.push(`${String(i).padStart(2, "0")}:00`);
    if (i < 19) h.push(`${String(i).padStart(2, "0")}:30`);
  }
  return h;
});

// Fecha mínima: mañana
const fechaMin = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
});

const PASOS = computed(() => [
  { num: 1, label: t("booking.step1") },
  { num: 2, label: t("booking.step2") },
  { num: 3, label: t("booking.step3") },
  { num: 4, label: t("booking.step4") },
]);

async function abrirModal() {
  paso.value = 1;
  errorModal.value = null;
  exitoCita.value = false;
  guardando.value = false;
  formReserva.value = { mascota: null, motivo: "", fecha: "", hora: "" };
  modalAbierto.value = true;

  if (mascotas.value.length === 0) {
    cargandoMascotas.value = true;
    const { ok, data } = await get("/api/mascotas");
    cargandoMascotas.value = false;
    if (ok) mascotas.value = data.mascotas;
  }
}

function cerrarModal() {
  modalAbierto.value = false;
}

// ── Navegación: cada paso valida solo SU campo ────────────────
function sigPaso() {
  errorModal.value = null;
  if (paso.value === 1) {
    if (!formReserva.value.mascota) {
      errorModal.value = t("booking.selectPet");
      return;
    }
    paso.value = 2;
    return;
  }
  if (paso.value === 2) {
    if (!formReserva.value.motivo) {
      errorModal.value = t("booking.selectReason");
      return;
    }
    paso.value = 3;
    return;
  }
  if (paso.value === 3) {
    if (!formReserva.value.fecha) {
      errorModal.value = t("booking.selectDate");
      return;
    }
    paso.value = 4;
    return;
  }
}

function antPaso() {
  errorModal.value = null;
  if (paso.value > 1) paso.value--;
}

// ── Confirmar cita ────────────────────────────────────────────
async function confirmarCita() {
  errorModal.value = null;
  if (!formReserva.value.hora) {
    errorModal.value = t("booking.selectTime");
    return;
  }

  guardando.value = true;

  const fechaHoraISO = new Date(
    `${formReserva.value.fecha}T${formReserva.value.hora}:00`,
  ).toISOString();

  const { ok, data } = await post("/api/citas/directa", {
    id_mascota: formReserva.value.mascota.id,
    id_clinica: clinica.value.id,
    motivo: formReserva.value.motivo,
    fecha_hora: fechaHoraISO,
  });

  guardando.value = false;

  if (!ok) {
    errorModal.value = data.message || t("booking.createError");
    return;
  }

  exitoCita.value = true;
}

function fmtFecha(iso) {
  if (!iso) return "";
  return new Date(iso + "T12:00:00").toLocaleDateString(
    locale.value === "en" ? "en-GB" : locale.value === "va" ? "ca-ES" : "es-ES",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    },
  );
}
</script>

<template>
  <div class="page-container page-section">
    <button
      type="button"
      class="btn btn-ghost btn-sm back-btn"
      @click="router.back()"
    >
      <Icon :icon="$icons.back" width="18" height="18" />
      <span>{{ t("common.back") }}</span>
    </button>

    <div
      v-if="loading"
      style="display: flex; justify-content: center; padding: 4rem 0"
    >
      <div class="spinner" />
    </div>

    <div v-else-if="error" class="msg msg-error" style="margin-top: 2rem">
      <p>{{ error }}</p>
      <button
        type="button"
        class="btn btn-outline"
        style="margin-top: 1rem"
        @click="cargarDetalle"
      >
        {{ t("common.retry") }}
      </button>
    </div>

    <div v-else-if="clinica" class="det-layout">
      <!-- ── Hero ──────────────────────────────────────────── -->
      <div class="card det-hero">
        <div class="card-body det-hero-body">
          <div v-if="clinica.imagen" class="det-hero-img-wrap">
            <img
              :src="clinica.imagen"
              :alt="clinica.nombre"
              class="det-hero-img"
            />
          </div>
          <div v-else class="det-hero-img-placeholder">
            <Icon :icon="$icons.home" width="48" height="48" />
          </div>

          <div class="det-hero-info">
            <div
              style="
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-wrap: wrap;
              "
            >
              <span v-if="clinica.abierto_24h" class="badge-24h">
                <Icon :icon="$icons.clock" width="10" height="10" />
                24H
              </span>
            </div>
            <h1 class="det-nombre">{{ clinica.nombre }}</h1>

            <div class="det-datos">
              <span v-if="clinica.ciudad || clinica.direccion" class="det-dato">
                <Icon :icon="$icons.location" width="13" height="13" />
                {{
                  [clinica.direccion, clinica.ciudad].filter(Boolean).join(", ")
                }}
              </span>
              <span v-if="clinica.telefono" class="det-dato">
                <Icon :icon="$icons.phone" width="13" height="13" />
                {{ clinica.telefono }}
              </span>
            </div>

            <div v-if="clinica.servicios?.length" class="det-chips">
              <span
                v-for="s in clinica.servicios"
                :key="s"
                class="det-chip"
                :style="{
                  background: SERVICIOS_STYLE[s]?.bg || '#F7F2EA',
                  color: SERVICIOS_STYLE[s]?.color || '#9B8A75',
                }"
              >
                {{ servicioLabel(s).toUpperCase() }}
              </span>
            </div>

            <button
              type="button"
              class="btn btn-primary"
              style="margin-top: 1rem; align-self: flex-start"
              @click="abrirModal"
            >
              <Icon :icon="$icons.calendar" width="17" height="17" />
              {{ t("clinicDetail.book") }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Veterinarios ────────────────────────────────── -->
      <div v-if="veterinarios.length > 0">
        <h2
          style="
            font-family: var(--font-display);
            font-weight: 800;
            font-size: 1.1rem;
            color: var(--color-text);
            margin-bottom: 1rem;
          "
        >
          {{ t("clinicDetail.vetsTitle") }}
        </h2>
        <div class="vets-grid">
          <div
            v-for="vet in veterinarios"
            :key="vet.id"
            class="card card-animate vet-card"
          >
            <div
              class="card-body"
              style="display: flex; align-items: center; gap: 0.85rem"
            >
              <PetAvatar
                :foto="vet.foto"
                :nombre="(vet.nombre || '') + ' ' + (vet.apellidos || '')"
                tipo="usuario"
                size="sm"
              />
              <div>
                <p class="vet-nombre">{{ vet.nombre }} {{ vet.apellidos }}</p>
                <span v-if="vet.especialidad" class="vet-esp">{{
                  vet.especialidad
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- MODAL DE RESERVA                                        -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-slide">
        <div v-if="modalAbierto" class="cita-overlay" @click.self="cerrarModal">
          <div class="cita-modal">
            <!-- ── Header ──────────────────────────────────── -->
            <div class="cita-header">
              <div class="cita-header-left">
                <div class="cita-header-chip">
                  <Icon :icon="$icons.calendar" width="16" height="16" />
                </div>
                <div>
                  <p class="cita-header-titulo">{{ t("booking.title") }}</p>
                  <p class="cita-header-sub">{{ clinica?.nombre }}</p>
                </div>
              </div>
              <button type="button" class="cita-close" @click="cerrarModal">
                <Icon :icon="$icons.close" width="15" height="15" />
              </button>
            </div>

            <!-- ── Stepper ─────────────────────────────────── -->
            <div v-if="!exitoCita" class="cita-stepper">
              <template v-for="(p, i) in PASOS" :key="p.num">
                <div class="stepper-item">
                  <div
                    class="stepper-dot"
                    :class="{
                      'stepper-dot--active': paso === p.num,
                      'stepper-dot--done': paso > p.num,
                    }"
                  >
                    <Icon
                      v-if="paso > p.num"
                      :icon="$icons.check"
                      width="18"
                      height="18"
                    />
                    <span v-if="paso <= p.num">{{ p.num }}</span>
                  </div>
                  <span
                    class="stepper-label"
                    :class="{
                      'stepper-label--active': paso === p.num,
                      'stepper-label--done': paso > p.num,
                    }"
                  >
                    {{ p.label }}
                  </span>
                </div>
                <!-- Línea entre pasos — div separado, NO ::after -->
                <div
                  v-if="i < PASOS.length - 1"
                  class="stepper-line"
                  :class="{ 'stepper-line--done': paso > p.num }"
                />
              </template>
            </div>

            <!-- ── Cuerpo ──────────────────────────────────── -->
            <div class="cita-body">
              <Transition name="fade">
                <div
                  v-if="errorModal"
                  class="msg msg-error"
                  style="margin-bottom: 1rem"
                >
                  {{ errorModal }}
                </div>
              </Transition>

              <!-- ÉXITO -->
              <div v-if="exitoCita" class="cita-exito">
                <div class="exito-emoji">
                  <Icon :icon="$icons.checkCircle" width="30" height="30" />
                </div>
                <h3 class="exito-titulo">{{ t("booking.successTitle") }}</h3>
                <p class="exito-desc">
                  {{
                    t("booking.successDesc", {
                      clinic: clinica?.nombre,
                      date: fmtFecha(formReserva.fecha),
                      time: formReserva.hora,
                    })
                  }}
                </p>
                <div
                  style="
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 1.5rem;
                    flex-wrap: wrap;
                    justify-content: center;
                  "
                >
                  <button
                    type="button"
                    class="btn btn-primary"
                    @click="router.push({ name: 'mis-citas' })"
                  >
                    {{ t("booking.viewAppointments") }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost"
                    @click="cerrarModal"
                  >
                    {{ t("common.close") }}
                  </button>
                </div>
              </div>

              <!-- PASO 1: Mascota -->
              <template v-else-if="paso === 1">
                <p class="paso-titulo">{{ t("booking.step1Question") }}</p>
                <div
                  v-if="cargandoMascotas"
                  style="text-align: center; padding: 1.5rem"
                >
                  <div class="spinner" />
                </div>
                <div v-else-if="mascotas.length === 0" class="msg msg-error">
                  {{ t("booking.noPets") }}
                  <RouterLink
                    :to="{ name: 'nueva-mascota' }"
                    style="
                      font-weight: 700;
                      color: var(--color-primary);
                      margin-left: 0.3rem;
                    "
                    >{{ t("booking.addPetLink") }}</RouterLink
                  >
                </div>
                <div v-else class="mascota-list">
                  <div
                    v-for="m in mascotas"
                    :key="m.id"
                    class="mascota-item"
                    :class="{
                      'mascota-item--sel': formReserva.mascota?.id === m.id,
                    }"
                    @click="formReserva.mascota = m"
                  >
                    <PetAvatar
                      :foto="m.foto"
                      :nombre="m.nombre"
                      :genero="m.genero"
                      tipo="mascota"
                      size="sm"
                    />
                    <div class="mascota-info">
                      <p class="mascota-nombre">{{ m.nombre }}</p>
                      <p class="mascota-raza">{{ m.raza?.nombre || "" }}</p>
                    </div>
                    <Icon
                      v-if="formReserva.mascota?.id === m.id"
                      style="flex-shrink: 0"
                      :icon="$icons.check"
                      width="18"
                      height="18"
                    />
                  </div>
                </div>
              </template>

              <!-- PASO 2: Motivo -->
              <template v-else-if="paso === 2">
                <p class="paso-titulo">{{ t("booking.step2Question") }}</p>
                <div class="motivo-grid">
                  <button
                    v-for="m in MOTIVOS"
                    :key="m.id"
                    type="button"
                    class="motivo-btn"
                    :class="{
                      'motivo-btn--sel': formReserva.motivo === m.label,
                    }"
                    @click="formReserva.motivo = m.label"
                  >
                    <span class="motivo-icon"
                      ><Icon :icon="m.icon" width="20" height="20"
                    /></span>
                    <span class="motivo-label">{{ m.label }}</span>
                  </button>
                </div>
              </template>

              <!-- PASO 3: Fecha con DatePicker custom -->
              <template v-else-if="paso === 3">
                <p class="paso-titulo">{{ t("booking.step3Question") }}</p>
                <div class="input-group">
                  <label class="label">{{ t("booking.dateLabel") }}</label>
                  <DatePicker
                    v-model="formReserva.fecha"
                    :placeholder="t('booking.datePlaceholder')"
                    :min-date="fechaMin"
                  />
                  <span
                    v-if="formReserva.fecha"
                    class="input-hint"
                    style="margin-top: 0.35rem"
                  >
                    <Icon :icon="$icons.calendar" width="14" height="14" />
                    {{ fmtFecha(formReserva.fecha) }}
                  </span>
                </div>
              </template>

              <!-- PASO 4: Hora -->
              <template v-else-if="paso === 4">
                <p class="paso-titulo">{{ t("booking.step4Question") }}</p>
                <div class="horas-grid">
                  <button
                    v-for="h in horasDisponibles"
                    :key="h"
                    type="button"
                    class="hora-btn"
                    :class="{ 'hora-btn--sel': formReserva.hora === h }"
                    @click="formReserva.hora = h"
                  >
                    {{ h }}
                  </button>
                </div>

                <!-- Resumen -->
                <div v-if="formReserva.hora" class="cita-resumen">
                  <div class="resumen-fila">
                    <span class="resumen-k">{{ t("booking.summaryPet") }}</span
                    ><span class="resumen-v">{{
                      formReserva.mascota?.nombre
                    }}</span>
                  </div>
                  <div class="resumen-fila">
                    <span class="resumen-k">{{
                      t("booking.summaryReason")
                    }}</span
                    ><span class="resumen-v">{{ formReserva.motivo }}</span>
                  </div>
                  <div class="resumen-fila">
                    <span class="resumen-k">{{ t("booking.summaryDate") }}</span
                    ><span class="resumen-v">{{
                      fmtFecha(formReserva.fecha)
                    }}</span>
                  </div>
                  <div class="resumen-fila">
                    <span class="resumen-k">{{ t("booking.summaryTime") }}</span
                    ><span class="resumen-v">{{ formReserva.hora }}</span>
                  </div>
                </div>
              </template>
            </div>
            <!-- /cita-body -->

            <!-- ── Footer ──────────────────────────────────── -->
            <div v-if="!exitoCita" class="cita-footer">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                @click="paso === 1 ? cerrarModal() : antPaso()"
              >
                {{ paso === 1 ? t("common.cancel") : t("common.previous") }}
              </button>
              <button
                v-if="paso < 4"
                type="button"
                class="btn btn-teal"
                @click="sigPaso"
              >
                {{ t("common.next") }}
              </button>
              <button
                v-else
                type="button"
                class="btn btn-primary"
                :disabled="guardando || !formReserva.hora"
                @click="confirmarCita"
              >
                <span
                  v-if="guardando"
                  class="spinner"
                  style="width: 14px; height: 14px; border-width: 2px"
                />
                <span v-else>{{ t("booking.confirm") }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: fit-content;
  min-height: 42px;
  margin-bottom: 1.5rem;
  padding: 0.55rem 0.85rem;
  border-radius: var(--radius-full);
  color: var(--color-text-soft);
  background: rgba(255, 255, 255, 0.36);
  border: 1px solid rgba(107, 76, 56, 0.08);
}
.back-btn:hover {
  color: var(--color-text);
  background: var(--color-surface);
}
.det-layout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ── Hero ──────────────────────────────────────────────────── */
.det-hero-body {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  flex-wrap: wrap;
}
.det-hero-img-wrap {
  width: 160px;
  height: 140px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
}
.det-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.det-hero-img-placeholder {
  width: 160px;
  height: 140px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--color-teal-light),
    var(--color-primary-light)
  );
  color: var(--color-teal-dark);
}
.det-hero-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}
.badge-24h {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #f08263;
  color: #fff;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.62rem;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
.det-nombre {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.5rem;
  color: var(--color-text);
  margin: 0;
}
.det-datos {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.det-dato {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.83rem;
  color: var(--color-text-soft);
}
.det-dato svg {
  flex-shrink: 0;
  color: var(--color-text-muted);
}
.det-chips {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}
.det-chip {
  display: inline-flex;
  padding: 0.18rem 0.6rem;
  border-radius: var(--radius-full);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.6rem;
  letter-spacing: 0.4px;
}

/* ── Veterinarios ────────────────────────────────────────────── */
.vets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.vet-card {
  transition:
    transform var(--transition-normal),
    box-shadow var(--transition-normal);
}
.vet-avatar {
  /* Solo contenedor — PetAvatar provee el color */
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vet-nombre {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text);
  margin: 0;
}
.vet-esp {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.65rem;
  letter-spacing: 0.3px;
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
  padding: 0.18rem 0.55rem;
  border-radius: var(--radius-full);
  display: inline-block;
  margin-top: 0.25rem;
}

/* ══ OVERLAY Y MODAL ══════════════════════════════════════════ */
.cita-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30, 20, 14, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.cita-modal {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header del modal ────────────────────────────────────────── */
.cita-header {
  background: var(--color-navbar);
  border-bottom: 1px solid var(--color-navbar-border);
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;
}
.cita-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.cita-header-chip {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cita-header-titulo {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--color-text);
  margin: 0;
  line-height: 1.2;
}
.cita-header-sub {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  margin: 0.1rem 0 0;
}
.cita-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-soft);
  flex-shrink: 0;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}
.cita-close:hover {
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text);
}

/* ── Stepper ─────────────────────────────────────────────────── */
.cita-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.25rem 0;
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.cita-stepper::-webkit-scrollbar {
  display: none;
}

.stepper-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
}

/* La línea ES un div, no ::after — así no tача los labels */
.stepper-line {
  width: 24px;
  height: 2px;
  background: var(--color-border);
  border-radius: 2px;
  flex-shrink: 0;
  transition: background var(--transition-normal);
}
.stepper-line--done {
  background: var(--color-teal);
}

.stepper-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.72rem;
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  transition: all var(--transition-normal);
}
.stepper-dot--active {
  border-color: var(--color-teal);
  background: var(--color-teal);
  color: #fff;
  box-shadow: 0 0 0 3px rgba(124, 203, 194, 0.2);
}
.stepper-dot--done {
  border-color: var(--color-teal);
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
}

.stepper-label {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  transition: color var(--transition-fast);
}
.stepper-label--active {
  color: var(--color-teal-dark);
  font-weight: 700;
}

/* ── Cuerpo scrollable ───────────────────────────────────────── */
.cita-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.1rem 1.25rem;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}
.cita-body::-webkit-scrollbar {
  width: 4px;
}
.cita-body::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 2px;
}

.paso-titulo {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--color-text);
  margin: 0 0 0.85rem;
}

/* ── Paso 1: mascotas ────────────────────────────────────────── */
.mascota-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.mascota-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem 0.9rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: var(--color-surface);
  transition: all var(--transition-fast);
}
.mascota-item:hover {
  border-color: var(--color-teal);
  background: var(--color-teal-light);
}
.mascota-item--sel {
  border-color: var(--color-teal);
  background: var(--color-teal-light);
}
/* .mascota-avatar — reemplazado por PetAvatar */
.mascota-inicial {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1rem;
  color: var(--color-primary);
}
.mascota-info {
  flex: 1;
  min-width: 0;
}
.mascota-nombre {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--color-text);
  margin: 0;
}
.mascota-raza {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  margin: 0.1rem 0 0;
}

/* ── Paso 2: motivos ─────────────────────────────────────────── */
.motivo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.motivo-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.8rem 0.5rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  text-align: center;
  transition: all var(--transition-fast);
}
.motivo-btn:hover {
  border-color: var(--color-teal);
  background: var(--color-teal-light);
}
.motivo-btn--sel {
  border-color: var(--color-teal);
  background: var(--color-teal-light);
  box-shadow: 0 0 0 2px rgba(124, 203, 194, 0.2);
}
.motivo-icon {
  font-size: 1.3rem;
}
.motivo-label {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.7rem;
  color: var(--color-text);
}

/* ── Paso 4: horas ───────────────────────────────────────────── */
.horas-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.9rem;
}
.hora-btn {
  padding: 0.5rem 0.2rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.76rem;
  color: var(--color-text-soft);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.hora-btn:hover {
  border-color: var(--color-teal);
  background: var(--color-teal-light);
}
.hora-btn--sel {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(240, 130, 99, 0.15);
}

/* ── Resumen final ───────────────────────────────────────────── */
.cita-resumen {
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  padding: 0.8rem 1rem;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.resumen-fila {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
.resumen-k {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-family: var(--font-display);
  font-weight: 600;
}
.resumen-v {
  font-size: 0.75rem;
  color: var(--color-text);
  font-weight: 600;
  text-align: right;
}

/* ── Éxito ───────────────────────────────────────────────────── */
.cita-exito {
  text-align: center;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.exito-emoji {
  font-size: 3rem;
}
.exito-titulo {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.2rem;
  color: var(--color-text);
  margin: 0;
}
.exito-desc {
  color: var(--color-text-soft);
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

/* ── Footer ──────────────────────────────────────────────────── */
.cita-footer {
  flex-shrink: 0;
  padding: 0.85rem 1.25rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: var(--color-surface);
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 600px) {
  .det-hero-body {
    flex-direction: column;
  }
  .det-hero-img-wrap,
  .det-hero-img-placeholder {
    width: 100%;
    height: 180px;
  }
  .vets-grid {
    grid-template-columns: 1fr;
  }
  .horas-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  /* Modal CENTRADO en móvil — no bottom sheet */
  .cita-overlay {
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .cita-modal {
    max-height: 88dvh;
    /* Conservar border-radius completo — no sheet */
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 100%;
  }
}

/* Transición — siempre scale, no slide up */
.modal-slide-enter-active,
.modal-slide-leave-active {
  transition:
    opacity 220ms ease,
    transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
}
.modal-slide-enter-from,
.modal-slide-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(12px);
}

/* ── Mejoras móvil adicionales ───────────────────────────── */
@media (max-width: 480px) {
  /* Horas en 3 columnas en pantallas pequeñas */
  .horas-grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }
  /* Motivos 1 col en pantallas muy pequeñas */
  .motivo-grid {
    grid-template-columns: 1fr 1fr;
  }
  /* Resumen de cita */
  .cita-resumen {
    font-size: 0.8rem;
  }
  .resumen-v {
    max-width: 55%;
    text-align: right;
    word-break: break-word;
  }
  /* Header del modal */
  .cita-header {
    padding: 0.9rem 1rem;
  }
  .cita-header-titulo {
    font-size: 0.88rem;
  }
  /* Footer más cómodo */
  .cita-footer {
    padding: 0.75rem 1rem;
  }
  .btn-hero,
  .btn {
    min-height: 46px;
  }
}
</style>
