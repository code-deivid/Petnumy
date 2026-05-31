//  Composable de clínicas con geolocalización, filtros y distancia.
//  Arquitectura preparada para integrar APIs externas (Google Places,
//  Yelp, etc.) en el futuro sin cambiar los componentes.
// ============================================================

import { ref, computed } from "vue";
import { useApi } from "./useApi.js";

// ── Haversine: distancia entre dos coordenadas en km ─────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Coordenadas aproximadas por código postal / zona (Valencia) ─
// Preparado para ser reemplazado por una API de geocodificación
const GEOCODIGOS = {
  46001: { lat: 39.4753, lng: -0.3763, label: "Valencia Centro" },
  46002: { lat: 39.4696, lng: -0.3767, label: "Eixample Sur" },
  46003: { lat: 39.4745, lng: -0.3735, label: "El Carmen" },
  46004: { lat: 39.4728, lng: -0.381, label: "Extramurs" },
  46005: { lat: 39.4672, lng: -0.382, label: "Eixample Norte" },
  46006: { lat: 39.4614, lng: -0.3789, label: "Ruzafa" },
  46007: { lat: 39.4542, lng: -0.3742, label: "Jesús" },
  46010: { lat: 39.4826, lng: -0.3741, label: "Zaidía" },
  46015: { lat: 39.4792, lng: -0.4007, label: "Campanar" },
  46018: { lat: 39.4554, lng: -0.3991, label: "Patraix" },
  46020: { lat: 39.4827, lng: -0.3634, label: "Benimaclet" },
  46021: { lat: 39.4786, lng: -0.3574, label: "Algirós" },
  46022: { lat: 39.4901, lng: -0.3494, label: "Poblados Marítimos" },
  46023: { lat: 39.46, lng: -0.3351, label: "El Cabanyal" },
  46025: { lat: 39.4936, lng: -0.3876, label: "Benicalap" },
  46100: { lat: 39.5077, lng: -0.4101, label: "Burjassot" },
  46920: { lat: 39.4746, lng: -0.4148, label: "Mislata" },
  46980: { lat: 39.5046, lng: -0.4448, label: "Paterna" },
  // Barrios por nombre
  ruzafa: { lat: 39.4614, lng: -0.3789, label: "Ruzafa" },
  benimaclet: { lat: 39.4827, lng: -0.3634, label: "Benimaclet" },
  campanar: { lat: 39.4792, lng: -0.4007, label: "Campanar" },
  patraix: { lat: 39.4554, lng: -0.3991, label: "Patraix" },
  algiros: { lat: 39.4786, lng: -0.3574, label: "Algirós" },
  algirós: { lat: 39.4786, lng: -0.3574, label: "Algirós" },
  zaidia: { lat: 39.4826, lng: -0.3741, label: "Zaidía" },
  zaidía: { lat: 39.4826, lng: -0.3741, label: "Zaidía" },
  burjassot: { lat: 39.5077, lng: -0.4101, label: "Burjassot" },
  mislata: { lat: 39.4746, lng: -0.4148, label: "Mislata" },
  paterna: { lat: 39.5046, lng: -0.4448, label: "Paterna" },
  extramurs: { lat: 39.4728, lng: -0.381, label: "Extramurs" },
  jesus: { lat: 39.4542, lng: -0.3742, label: "Jesús" },
  jesús: { lat: 39.4542, lng: -0.3742, label: "Jesús" },
  "el carmen": { lat: 39.4745, lng: -0.3735, label: "El Carmen" },
  valencia: { lat: 39.4699, lng: -0.3763, label: "Valencia" },
};

function geocodificarZona(query) {
  const q = query.trim().toLowerCase();
  if (GEOCODIGOS[q]) return GEOCODIGOS[q];
  // Búsqueda parcial
  const key = Object.keys(GEOCODIGOS).find(
    (k) => k.includes(q) || q.includes(k),
  );
  return key ? GEOCODIGOS[key] : null;
}

// ── Servicio label/icon map ───────────────────────────────────
export const SERVICIOS_META = {
  urgencias: {
    label: "Urgencias",
    icon: "mdi:ambulance",
    color: "#D95F5F",
    bg: "#FDEAEA",
  },
  exoticos: {
    label: "Exóticos",
    icon: "mdi:snake",
    color: "#B07D1A",
    bg: "#FEF6DC",
  },
  peluqueria: {
    label: "Peluquería",
    icon: "mdi:content-cut",
    color: "#A03A5A",
    bg: "#FCE8F0",
  },
  vacunas: {
    label: "Vacunas",
    icon: "mdi:needle",
    color: "#4AADA5",
    bg: "#E0F1EE",
  },
  cirugia: {
    label: "Cirugía",
    icon: "mdi:medical-bag",
    color: "#6B4C38",
    bg: "#F7F0E8",
  },
  hospitalizacion: {
    label: "Hospitalización",
    icon: "mdi:hospital-box-outline",
    color: "#3A5FA0",
    bg: "#E8F0FC",
  },
};

// Solo estos servicios se exponen como filtros principales en la pantalla de clínicas.
// El resto se siguen mostrando como badges informativos en las tarjetas.
export const SERVICIOS_FILTRO_KEYS = ["urgencias", "peluqueria"];

// ── Composable principal ──────────────────────────────────────
export function useClinicas() {
  const { get } = useApi();

  const clinicas = ref([]);
  const cargando = ref(false);
  const error = ref(null);
  const clinicaActiva = ref(null); // id de la clínica con hover/selección

  // Ubicación del usuario
  const ubicacion = ref(null); // { lat, lng, label }
  const buscandoUbicacion = ref(false);
  const errorUbicacion = ref(null);

  // Filtros
  const filtros = ref({
    servicios: [], // array de claves de servicio activos
    abierto24h: false,
    orden: "relevancia", // 'relevancia' | 'distancia' | 'valoracion'
    busqueda: "",
  });

  // ── Clínicas con distancia calculada ─────────────────────────
  const clinicasConDistancia = computed(() =>
    clinicas.value.map((c) => ({
      ...c,
      distancia:
        ubicacion.value && c.latitud && c.longitud
          ? haversine(
              ubicacion.value.lat,
              ubicacion.value.lng,
              c.latitud,
              c.longitud,
            )
          : null,
    })),
  );

  // ── Clínicas filtradas y ordenadas ───────────────────────────
  const clinicasFiltradas = computed(() => {
    let lista = [...clinicasConDistancia.value];

    // Filtro búsqueda libre
    if (filtros.value.busqueda.trim()) {
      const q = filtros.value.busqueda.toLowerCase();
      lista = lista.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.ciudad?.toLowerCase().includes(q) ||
          c.direccion?.toLowerCase().includes(q),
      );
    }

    // Filtro 24h
    if (filtros.value.abierto24h) {
      lista = lista.filter((c) => c.abierto_24h);
    }

    // Filtro servicios (AND: debe tener TODOS los seleccionados)
    if (filtros.value.servicios.length > 0) {
      lista = lista.filter((c) =>
        filtros.value.servicios.every((s) => c.servicios?.includes(s)),
      );
    }

    // Ordenación
    if (filtros.value.orden === "distancia" && ubicacion.value) {
      lista.sort((a, b) => (a.distancia ?? 999) - (b.distancia ?? 999));
    } else if (filtros.value.orden === "valoracion") {
      lista.sort((a, b) => (b.valoracion ?? 0) - (a.valoracion ?? 0));
    }
    // 'relevancia' mantiene el orden del backend (valoracion desc)

    return lista;
  });

  // ── Cargar desde backend ──────────────────────────────────────
  async function cargar() {
    cargando.value = true;
    error.value = null;
    const { ok, data } = await get("/api/clinicas");
    cargando.value = false;
    if (!ok) {
      error.value = data.message || "Error cargando clínicas";
      return;
    }
    clinicas.value = data.clinicas;
  }

  // ── Geolocalización real ─────────────────────────────────────
  async function usarUbicacionReal() {
    if (!("geolocation" in navigator)) {
      errorUbicacion.value = "Tu navegador no soporta geolocalización";
      return;
    }
    buscandoUbicacion.value = true;
    errorUbicacion.value = null;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        ubicacion.value = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Mi ubicación",
        };
        filtros.value.orden = "distancia";
        buscandoUbicacion.value = false;
      },
      (err) => {
        errorUbicacion.value =
          "No se pudo obtener tu ubicación. Usa la búsqueda manual.";
        buscandoUbicacion.value = false;
      },
      { timeout: 8000, maximumAge: 300000 },
    );
  }

  // ── Búsqueda manual por zona/código postal ───────────────────
  async function buscarPorZona(query) {
    errorUbicacion.value = null;
    if (!query?.trim()) {
      ubicacion.value = null;
      return;
    }

    const resultado = geocodificarZona(query.trim());
    if (resultado) {
      ubicacion.value = {
        lat: resultado.lat,
        lng: resultado.lng,
        label: resultado.label,
      };
      filtros.value.orden = "distancia";
      return true;
    }

    // Si no está en el diccionario local, intentar Nominatim (OpenStreetMap, gratuito)
    try {
      buscandoUbicacion.value = true;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", Valencia, España")}&format=json&limit=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "es" } });
      const data = await res.json();
      if (data.length > 0) {
        ubicacion.value = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          label: data[0].display_name.split(",")[0],
        };
        filtros.value.orden = "distancia";
        buscandoUbicacion.value = false;
        return true;
      }
    } catch {}

    buscandoUbicacion.value = false;
    errorUbicacion.value = `No se encontró "${query}". Prueba con un código postal.`;
    return false;
  }

  function limpiarUbicacion() {
    ubicacion.value = null;
    errorUbicacion.value = null;
    filtros.value.orden = "relevancia";
  }

  function toggleServicio(s) {
    const idx = filtros.value.servicios.indexOf(s);
    if (idx === -1) filtros.value.servicios.push(s);
    else filtros.value.servicios.splice(idx, 1);
  }

  function resetFiltros() {
    filtros.value = {
      servicios: [],
      abierto24h: false,
      orden: "relevancia",
      busqueda: "",
    };
  }

  return {
    // Estado
    clinicas,
    clinicasFiltradas,
    cargando,
    error,
    clinicaActiva,
    ubicacion,
    buscandoUbicacion,
    errorUbicacion,
    filtros,
    // Acciones
    cargar,
    usarUbicacionReal,
    buscarPorZona,
    limpiarUbicacion,
    toggleServicio,
    resetFiltros,
    // Helper
    haversine,
  };
}
