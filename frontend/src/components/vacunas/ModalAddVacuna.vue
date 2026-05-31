<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useApi } from "@/composables/useApi.js";
import { getVacunaInfo } from "@/data/vacunasInfo.js";
import DatePicker from "@/components/ui/DatePicker.vue";

const props = defineProps({
  visible: { type: Boolean, default: false },
  mascota: { type: Object, default: null },
  mascotaId: { type: String, default: "" },
  // Modo edición: pasar el objeto vacuna_mascota completo
  vacunaEditar: { type: Object, default: null },
});
const emit = defineEmits(["close", "added"]);

const { get, post, patch } = useApi();
const { t, locale } = useI18n();
const dateLocale = computed(() =>
  locale.value === "en" ? "en-US" : locale.value === "va" ? "ca-ES" : "es-ES",
);

// ── Estado ─────────────────────────────────────────────────────
const catalogo = ref([]);
const loadingCat = ref(false);
const guardando = ref(false);
const errorMsg = ref(null);
const vacunaSeleccionada = ref(null);
const paso = ref(1); // 1: elegir vacuna  2: rellenar datos

const form = ref({
  estado: "puesta",
  fecha_aplicacion: "",
  proxima_aplicacion: "",
});

const modoEdicion = computed(() => !!props.vacunaEditar);

// ── Info enriquecida de la vacuna seleccionada ──────────────────
const infoVacuna = computed(() =>
  vacunaSeleccionada.value
    ? getVacunaInfo(vacunaSeleccionada.value.nombre, locale.value)
    : null,
);

// ── Próxima dosis automática ────────────────────────────────────
// Calcula la fecha sugerida según la frecuencia de la vacuna
const proximaAutoSugerida = computed(() => {
  if (!form.value.fecha_aplicacion || form.value.proxima_aplicacion)
    return null;
  if (!infoVacuna.value?.frecuencia) return null;

  const base = new Date(form.value.fecha_aplicacion + "T12:00:00");
  const frec = infoVacuna.value.frecuencia.toLowerCase();

  if (frec.includes("anual") || frec.includes("año")) {
    base.setFullYear(base.getFullYear() + 1);
  } else if (
    frec.includes("trienal") ||
    frec.includes("3 año") ||
    frec.includes("3 años")
  ) {
    base.setFullYear(base.getFullYear() + 3);
  } else if (frec.includes("semestral") || frec.includes("6 mes")) {
    base.setMonth(base.getMonth() + 6);
  } else if (frec.includes("mensual")) {
    base.setMonth(base.getMonth() + 1);
  } else {
    return null;
  }

  return base.toISOString().split("T")[0];
});

const proximaAutoTexto = computed(() => {
  if (!proximaAutoSugerida.value) return null;
  return new Date(proximaAutoSugerida.value + "T12:00:00").toLocaleDateString(
    dateLocale.value,
    { day: "numeric", month: "long", year: "numeric" },
  );
});

// ── Especie ─────────────────────────────────────────────────────
const idEspecie = computed(() => props.mascota?.raza?.especie?.id || null);

// Catálogo enriquecido
const catalogoEnriquecido = computed(() =>
  catalogo.value.map((v) => ({
    ...v,
    info: getVacunaInfo(v.nombre, locale.value),
  })),
);

// ── Cargar catálogo ─────────────────────────────────────────────
async function cargarCatalogo() {
  if (!idEspecie.value) return;
  loadingCat.value = true;
  const { ok, data } = await get(`/api/vacunas?id_especie=${idEspecie.value}`);
  loadingCat.value = false;
  if (ok && data.vacunas) catalogo.value = data.vacunas;
}

// ── Watch visible ───────────────────────────────────────────────
watch(
  () => props.visible,
  (v) => {
    if (!v) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    reset();
    if (modoEdicion.value) {
      // Precargar datos de la vacuna a editar
      const ve = props.vacunaEditar;
      // Buscar en el catálogo la vacuna correspondiente
      cargarCatalogo().then(() => {
        const encontrada = catalogo.value.find((c) => c.id === ve.vacuna?.id);
        if (encontrada) {
          vacunaSeleccionada.value = {
            ...encontrada,
            info: getVacunaInfo(encontrada.nombre, locale.value),
          };
        } else {
          // Crear objeto mínimo con los datos del registro
          vacunaSeleccionada.value = {
            id: ve.vacuna?.id,
            nombre: ve.vacuna?.nombre || "",
            info: getVacunaInfo(ve.vacuna?.nombre, locale.value),
          };
        }
        form.value.estado = ve.estado || "puesta";
        form.value.fecha_aplicacion = ve.fecha_aplicacion || "";
        form.value.proxima_aplicacion = ve.proxima_aplicacion || "";
        paso.value = 2;
      });
    } else {
      cargarCatalogo();
    }
  },
);

function reset() {
  paso.value = 1;
  vacunaSeleccionada.value = null;
  errorMsg.value = null;
  form.value = {
    estado: "puesta",
    fecha_aplicacion: "",
    proxima_aplicacion: "",
  };
}

function seleccionar(v) {
  vacunaSeleccionada.value = v;
  if (form.value.estado === "puesta" && !form.value.fecha_aplicacion) {
    form.value.fecha_aplicacion = new Date().toISOString().split("T")[0];
  }
  paso.value = 2;
}

function volver() {
  if (modoEdicion.value) {
    emit("close");
    return;
  }
  paso.value = 1;
  errorMsg.value = null;
}

// ── Guardar ─────────────────────────────────────────────────────
async function guardar() {
  if (!vacunaSeleccionada.value) return;
  errorMsg.value = null;

  if (form.value.estado === "puesta" && !form.value.fecha_aplicacion) {
    errorMsg.value = t("vaccines.errorDateRequired");
    return;
  }

  // Usar fecha auto si el usuario dejó próxima dosis vacía
  const proximaFinal =
    form.value.proxima_aplicacion || proximaAutoSugerida.value || null;

  guardando.value = true;

  let ok, data;
  if (modoEdicion.value) {
    // PATCH
    ({ ok, data } = await patch(
      `/api/mascotas/${props.mascotaId}/vacunas/${props.vacunaEditar.id}`,
      {
        estado: form.value.estado,
        fecha_aplicacion: form.value.fecha_aplicacion || null,
        proxima_aplicacion: proximaFinal,
      },
    ));
  } else {
    // POST
    ({ ok, data } = await post(`/api/mascotas/${props.mascotaId}/vacunas`, {
      id_vacuna: vacunaSeleccionada.value.id,
      estado: form.value.estado,
      fecha_aplicacion: form.value.fecha_aplicacion || null,
      proxima_aplicacion: proximaFinal,
    }));
  }

  guardando.value = false;

  if (!ok) {
    errorMsg.value = data.message || t("vaccines.errorSave");
    return;
  }

  emit("added");
  emit("close");
}

const hoy = new Date().toISOString().split("T")[0];
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="visible" class="mav-overlay" @click.self="$emit('close')">
      <Transition name="modal-slide">
        <div v-if="visible" class="mav-modal card">
          <!-- Cabecera -->
          <div class="mav-header">
            <div class="mav-header-left">
              <div class="mav-header-icon">
                <Icon :icon="$icons.health" width="16" height="16" />
              </div>
              <div>
                <h3 class="mav-title">
                  {{
                    modoEdicion
                      ? t("vaccines.editTitle")
                      : t("vaccines.addTitle")
                  }}
                </h3>
                <p class="mav-sub">
                  {{
                    paso === 1
                      ? t("vaccines.forPet", {
                          species:
                            mascota?.raza?.especie?.especie || t("pets.pet"),
                        })
                      : vacunaSeleccionada?.nombre || ""
                  }}
                </p>
              </div>
            </div>
            <button type="button" class="mav-close" @click="$emit('close')">
              <Icon :icon="$icons.close" width="14" height="14" />
            </button>
          </div>

          <!-- Paso 1: seleccionar vacuna -->
          <div v-if="paso === 1" class="mav-body">
            <div v-if="loadingCat" class="mav-loading">
              <div class="mav-ske" v-for="i in 5" :key="i" />
            </div>
            <div v-else-if="catalogo.length === 0" class="mav-empty">
              <p>{{ t("vaccines.noAvailable") }}</p>
            </div>
            <div v-else class="mav-grid">
              <button
                type="button"
                v-for="v in catalogoEnriquecido"
                :key="v.id"
                class="mav-card"
                :class="{ 'mav-card--sel': vacunaSeleccionada?.id === v.id }"
                @click="seleccionar(v)"
              >
                <div class="mav-card-icon">
                  <Icon
                    class="mav-card-emoji"
                    :icon="v.info?.icon || $icons.vaccine"
                    width="20"
                    height="20"
                  />
                </div>
                <div class="mav-card-info">
                  <span class="mav-card-nombre">{{ v.nombre }}</span>
                  <span class="mav-card-desc">{{
                    v.info?.descripcionCorta || v.descripcion || ""
                  }}</span>
                </div>
                <Icon
                  v-if="vacunaSeleccionada?.id === v.id"
                  class="mav-card-check"
                  :icon="$icons.check"
                  width="16"
                  height="16"
                />
              </button>
            </div>
          </div>

          <!-- Paso 2: rellenar datos -->
          <div v-else-if="paso === 2" class="mav-body mav-body--datepickers">
            <!-- Vacuna elegida -->
            <div class="mav-elegida">
              <Icon
                class="mav-elegida-emoji"
                :icon="infoVacuna?.icon || $icons.vaccine"
                width="22"
                height="22"
              />
              <div>
                <p class="mav-elegida-nombre">
                  {{ vacunaSeleccionada?.nombre }}
                </p>
                <p class="mav-elegida-desc">
                  {{
                    infoVacuna?.descripcionCorta ||
                    vacunaSeleccionada?.descripcion
                  }}
                </p>
              </div>
            </div>

            <Transition name="fade">
              <div v-if="errorMsg" class="msg msg-error">{{ errorMsg }}</div>
            </Transition>

            <!-- Estado -->
            <div class="input-group">
              <label class="label">{{ t("vaccines.status") }} *</label>
              <div class="mav-estado-btns">
                <button
                  type="button"
                  v-for="e in [
                    {
                      val: 'puesta',
                      label: 'Puesta / Completada',
                      color: 'teal',
                    },
                    { val: 'pendiente', label: 'Pendiente', color: 'yellow' },
                    { val: 'retrasada', label: 'Atrasada', color: 'red' },
                  ]"
                  :key="e.val"
                  :class="[
                    'mav-estado-btn',
                    `mav-estado-btn--${e.color}`,
                    { 'mav-estado-btn--on': form.estado === e.val },
                  ]"
                  @click="form.estado = e.val"
                >
                  {{ e.label }}
                </button>
              </div>
            </div>

            <!-- Fecha administrada — DatePicker custom (Teleport, no se corta) -->
            <div class="input-group">
              <label class="label">
                {{ t("vaccines.adminDate")
                }}{{ form.estado === "puesta" ? " *" : "" }}
              </label>
              <DatePicker
                v-model="form.fecha_aplicacion"
                :placeholder="t('vaccines.administeredDate')"
                :max-date="hoy"
              />
            </div>

            <!-- Próxima dosis — DatePicker custom -->
            <div class="input-group">
              <label class="label">{{ t("vaccines.nextDose") }}</label>
              <DatePicker
                v-model="form.proxima_aplicacion"
                :placeholder="t('vaccines.nextDoseOptional')"
              />
              <!-- Sugerencia automática -->
              <Transition name="fade">
                <span v-if="proximaAutoTexto" class="input-hint mav-hint-auto">
                  Si lo dejas vacío, se calculará automáticamente:
                  <strong>{{ proximaAutoTexto }}</strong>
                </span>
                <span v-else class="input-hint">
                  Deja en blanco si no aplica o no sabes la fecha.
                </span>
              </Transition>
            </div>
          </div>

          <!-- Footer -->
          <div class="mav-footer">
            <button
              type="button"
              class="btn btn-ghost"
              @click="paso === 1 ? $emit('close') : volver()"
            >
              {{
                paso === 1
                  ? t("common.cancel")
                  : modoEdicion
                    ? t("common.cancel")
                    : t("common.previous")
              }}
            </button>
            <button
              type="button"
              v-if="paso === 2"
              class="btn btn-teal"
              :disabled="guardando"
              @click="guardar"
            >
              <span
                v-if="guardando"
                class="spinner"
                style="width: 14px; height: 14px; border-width: 2px"
              />
              <span v-else>{{
                modoEdicion ? t("pets.saveChanges") : t("vaccines.save")
              }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.mav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30, 20, 14, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.mav-modal {
  width: 100%;
  max-width: 520px;
  /* Sin overflow:hidden para no cortar los DatePicker */
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  max-height: 90vh;
}
.mav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  gap: 1rem;
  flex-shrink: 0;
}
.mav-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.mav-header-icon {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mav-title {
  font-size: 1rem;
  margin: 0;
}
.mav-sub {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  margin: 0;
}
.mav-close {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--color-surface-alt);
  color: var(--color-text-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}
.mav-close:hover {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

/* Body scrollable */
.mav-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
/* El body con datepickers NO tiene overflow hidden para que el Teleport funcione */
.mav-body--datepickers {
  overflow: visible;
  /* Pero necesitamos scroll: usamos scroll en el modal completo */
  overflow-y: auto;
}

.mav-loading {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.mav-ske {
  height: 60px;
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  animation: _pulse 1.5s ease-in-out infinite;
}
@keyframes _pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

.mav-empty {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.mav-grid {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.mav-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.8rem 1rem;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    transform var(--transition-fast);
}
.mav-card:hover {
  border-color: var(--color-teal);
  background: var(--color-teal-light);
  transform: translateX(3px);
}
.mav-card--sel {
  border-color: var(--color-teal);
  background: var(--color-teal-light);
}
.mav-card-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.2rem;
}
.mav-card-emoji {
  font-size: 1.05rem;
}
.mav-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}
.mav-card-nombre {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--color-text);
}
.mav-card-desc {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}
.mav-card-check {
  color: var(--color-teal-dark);
  flex-shrink: 0;
}

.mav-elegida {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: var(--color-teal-light);
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-teal-mid);
}
.mav-elegida-emoji {
  font-size: 1.4rem;
  flex-shrink: 0;
}
.mav-elegida-nombre {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text);
  margin: 0 0 0.1rem;
}
.mav-elegida-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0;
}

.mav-estado-btns {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.mav-estado-btn {
  padding: 0.45rem 1rem;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--color-border);
  background: var(--color-surface-alt);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--color-text-soft);
}
.mav-estado-btn--teal.mav-estado-btn--on {
  border-color: var(--color-teal);
  background: var(--color-teal-light);
  color: var(--color-teal-dark);
}
.mav-estado-btn--yellow.mav-estado-btn--on {
  border-color: #d4a017;
  background: #fef9e7;
  color: #9a6a10;
}
.mav-estado-btn--red.mav-estado-btn--on {
  border-color: var(--color-danger);
  background: var(--color-danger-light);
  color: var(--color-danger);
}

/* Hint de fecha automática */
.mav-hint-auto {
  color: var(--color-teal-dark) !important;
}
.mav-hint-auto strong {
  color: var(--color-teal-dark);
}

.mav-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

/* Animaciones */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity var(--transition-normal);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-slide-enter-active,
.modal-slide-leave-active {
  transition:
    opacity var(--transition-normal),
    transform var(--transition-normal);
}
.modal-slide-enter-from,
.modal-slide-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(12px);
}

@media (max-width: 540px) {
  .mav-modal {
    max-height: 92vh;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }
  .mav-overlay {
    align-items: flex-end;
    padding: 0;
  }
  .mav-estado-btns {
    flex-direction: column;
  }
}
</style>
