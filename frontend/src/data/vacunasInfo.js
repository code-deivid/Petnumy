// src/data/vacunasInfo.js
// ============================================================
//  Catálogo informativo de vacunas.
//  Las CLAVES son subcadenas del nombre del CSV (minúsculas, sin tildes).
//  getVacunaInfo() hace match parcial → "Parvovirus canino" → clave "parvovirus"
//
//  Para añadir una vacuna:
//    1. Añadir entrada con clave = palabra clave del nombre en minúsculas
//    2. Opcional: añadirla al seed SQL si aún no está en la BD
// ============================================================

export const vacunasInfo = {

  // ── PERRO Y GATO (compartidas) ─────────────────────────────
  'rabia': {
    icon: '🧠',
    enfermedad: 'Rabia',
    descripcionCorta: 'Obligatoria · Anual o trienal',
    descripcionLarga: 'Enfermedad viral mortal que afecta al sistema nervioso de todos los mamíferos, incluidos los humanos. Es de notificación obligatoria y la vacunación es exigida por ley.',
    sintomas: 'Cambios de comportamiento, agresividad, parálisis, convulsiones, hidrofobia.',
    frecuencia: 'Anual o trienal según legislación local.',
    riesgo: 'alto',
  },

  // ── PERRO ──────────────────────────────────────────────────
  'moquillo': {
    icon: '🫁',
    enfermedad: 'Moquillo Canino (Distemper)',
    descripcionCorta: 'Polivalente · Refuerzo anual',
    descripcionLarga: 'Enfermedad viral sistémica altamente contagiosa que afecta al sistema respiratorio, digestivo y nervioso. Puede dejar secuelas neurológicas permanentes.',
    sintomas: 'Fiebre, secreción nasal, tos, vómitos, diarrea, convulsiones.',
    frecuencia: 'Serie en cachorros (6-8 sem.) + refuerzo anual o trienal.',
    riesgo: 'alto',
  },
  'parvovirus': {
    icon: '🧬',
    enfermedad: 'Parvovirus Canino',
    descripcionCorta: 'Polivalente · Refuerzo anual',
    descripcionLarga: 'Infección viral altamente contagiosa que ataca el tracto gastrointestinal. Especialmente letal en cachorros sin tratar.',
    sintomas: 'Vómitos, diarrea con sangre, letargo, pérdida de apetito, fiebre alta.',
    frecuencia: 'Serie en cachorros desde 6-8 sem. + refuerzo anual.',
    riesgo: 'alto',
  },
  'hepatitis': {
    icon: '🫀',
    enfermedad: 'Hepatitis Infecciosa Canina (Adenovirus tipo 1)',
    descripcionCorta: 'Polivalente · Refuerzo anual',
    descripcionLarga: 'Causada por el adenovirus canino tipo 1. Afecta principalmente al hígado, riñones y endotelio vascular. Se incluye en la vacuna polivalente.',
    sintomas: 'Fiebre, apatía, dolor abdominal, vómitos, ictericia, opacidad corneal.',
    frecuencia: 'Incluida en polivalente desde 6-8 sem. + refuerzo anual.',
    riesgo: 'alto',
  },
  'leptospirosis': {
    icon: '🌊',
    enfermedad: 'Leptospirosis',
    descripcionCorta: 'Anual · Zoonosis',
    descripcionLarga: 'Enfermedad bacteriana que puede transmitirse a los humanos (zoonosis). Frecuente en perros con acceso a agua estancada o roedores.',
    sintomas: 'Fiebre, vómitos, ictericia, insuficiencia renal, hemorragias.',
    frecuencia: 'Desde 8-9 sem. con refuerzo a las 3-4 sem. + anual.',
    riesgo: 'alto',
  },
  'parainfluenza': {
    icon: '💨',
    enfermedad: 'Parainfluenza Canina',
    descripcionCorta: 'Polivalente · Refuerzo anual',
    descripcionLarga: 'Una de las causas principales del complejo respiratorio conocido como "tos de las perreras". Muy contagiosa entre perros que conviven.',
    sintomas: 'Tos seca persistente, secreción nasal, fiebre leve.',
    frecuencia: 'Incluida en polivalente, refuerzo anual.',
    riesgo: 'medio',
  },
  'bordetella': {
    icon: '🐕',
    enfermedad: 'Tos de las Perreras (Bordetella)',
    descripcionCorta: 'Recomendada · 6-12 meses',
    descripcionLarga: 'Infección bacteriana del tracto respiratorio superior, muy contagiosa en parques, guarderías o residencias caninas.',
    sintomas: 'Tos seca persistente, estornudos, secreción nasal, fiebre leve.',
    frecuencia: 'Desde 8 sem. + refuerzo cada 6-12 meses.',
    riesgo: 'medio',
  },
  'coronavirus canino': {
    icon: '🦠',
    enfermedad: 'Coronavirus Entérico Canino',
    descripcionCorta: 'Opcional · Refuerzo anual',
    descripcionLarga: 'Provoca diarreas y problemas gastrointestinales en perros. Especialmente relevante en cachorros y perros de criadero.',
    sintomas: 'Diarrea, vómitos, deshidratación, letargo.',
    frecuencia: 'Desde 6-8 sem. + refuerzo según veterinario.',
    riesgo: 'medio',
  },
  'leishmaniosis': {
    icon: '🦟',
    enfermedad: 'Leishmaniosis',
    descripcionCorta: 'Recomendada en zonas mediterráneas',
    descripcionLarga: 'Enfermedad parasitaria transmitida por la picadura del flebótomo. Especialmente relevante en zonas mediterráneas y tropicales.',
    sintomas: 'Pérdida de peso, lesiones cutáneas, fallo renal, epistaxis, conjuntivitis.',
    frecuencia: 'Desde 6 meses + refuerzo anual.',
    riesgo: 'alto',
  },
  'lyme': {
    icon: '🕷️',
    enfermedad: 'Enfermedad de Lyme (Borrelia)',
    descripcionCorta: 'Recomendada · Garrapatas',
    descripcionLarga: 'Enfermedad transmitida por garrapatas que afecta a articulaciones, riñones y sistema nervioso.',
    sintomas: 'Cojera, fiebre, letargo, pérdida de apetito, inflamación articular.',
    frecuencia: 'Desde 9-12 sem. + segunda dosis + refuerzo anual.',
    riesgo: 'medio',
  },

  // ── GATO ───────────────────────────────────────────────────
  'panleucopenia': {
    icon: '🧫',
    enfermedad: 'Panleucopenia Felina (Parvovirus felino)',
    descripcionCorta: 'Obligatoria · Refuerzo anual',
    descripcionLarga: 'Destruye glóbulos blancos dejando al gato sin defensas. Muy contagiosa con alta mortalidad en gatitos.',
    sintomas: 'Vómitos, diarrea, fiebre alta, depresión extrema, muerte súbita.',
    frecuencia: 'Serie desde 6-8 sem. + refuerzo anual.',
    riesgo: 'alto',
  },
  'herpesvirus': {
    icon: '🤧',
    enfermedad: 'Rinotraqueitis Viral Felina (Herpesvirus felino)',
    descripcionCorta: 'Trivalente · Refuerzo anual',
    descripcionLarga: 'Infección del tracto respiratorio superior causada por el herpesvirus felino tipo 1. Muy común en colonias de gatos.',
    sintomas: 'Estornudos, secreción ocular y nasal, fiebre, conjuntivitis, úlceras corneales.',
    frecuencia: 'Serie desde 6-8 sem. + refuerzo anual.',
    riesgo: 'medio',
  },
  'calicivirus': {
    icon: '😿',
    enfermedad: 'Calicivirus Felino',
    descripcionCorta: 'Trivalente · Refuerzo anual',
    descripcionLarga: 'Infección viral del tracto respiratorio y cavidad oral. Puede causar úlceras dolorosas y cojera en casos graves.',
    sintomas: 'Úlceras en boca y lengua, cojera, fiebre, secreción nasal y ocular.',
    frecuencia: 'Serie desde 6-8 sem. + refuerzo anual.',
    riesgo: 'medio',
  },
  'leucemia felina': {
    icon: '🩸',
    enfermedad: 'Leucemia Felina (FeLV)',
    descripcionCorta: 'Recomendada para gatos con exterior',
    descripcionLarga: 'Retrovirus que suprime el sistema inmunológico y puede causar tumores. Se transmite por contacto directo entre gatos.',
    sintomas: 'Pérdida de peso, anemia, infecciones recurrentes, tumores, fiebre.',
    frecuencia: 'Desde 8 sem. + 2ª dosis a las 3-4 sem. + refuerzo anual.',
    riesgo: 'alto',
  },
  'clamidiosis': {
    icon: '👁️',
    enfermedad: 'Clamidiosis Felina',
    descripcionCorta: 'Recomendada en colonias',
    descripcionLarga: 'Causada por Chlamydia felis, provoca conjuntivitis persistente y problemas respiratorios. Especialmente relevante en gatos que conviven con muchos otros.',
    sintomas: 'Conjuntivitis crónica, estornudos, secreción ocular amarillenta.',
    frecuencia: 'Desde 8-9 sem. + refuerzo anual.',
    riesgo: 'bajo',
  },
  'peritonitis': {
    icon: '🏥',
    enfermedad: 'Peritonitis Infecciosa Felina (PIF)',
    descripcionCorta: 'Opcional · Criaderos',
    descripcionLarga: 'Causada por una mutación del coronavirus felino. Alta mortalidad, especialmente en gatitos. Su uso depende de recomendación veterinaria.',
    sintomas: 'Distensión abdominal, fiebre fluctuante, pérdida de peso, letargo.',
    frecuencia: 'Desde 16 sem. según criterio veterinario.',
    riesgo: 'alto',
  },
}

// ── Helper principal: nombre → info ──────────────────────────
// Busca primero coincidencia exacta (minúsculas), luego parcial.
// Así "Parvovirus canino" → clave "parvovirus"; "Moquillo canino" → "moquillo"
export function getVacunaInfo(nombre) {
  if (!nombre) return null
  const q = nombre.toLowerCase().trim()

  // 1. Exacta
  if (vacunasInfo[q]) return { ...vacunasInfo[q], nombre }

  // 2. La clave contiene la query o viceversa
  const key = Object.keys(vacunasInfo).find(k => q.includes(k) || k.includes(q))
  return key ? { ...vacunasInfo[key], nombre } : null
}

// ── Config de estados ─────────────────────────────────────────
export const estadoConfig = {
  puesta:    { label: 'Al día',   color: '#4AADA5', bg: '#E0F1EE' },
  pendiente: { label: 'Próxima',  color: '#B07D1A', bg: '#FEF6DC' },
  retrasada: { label: 'Atrasada', color: '#D95F5F', bg: '#FDEAEA' },
}
