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



export const vacunasInfoI18n = {
  en: {
    rabia: { enfermedad: 'Rabies', descripcionCorta: 'Mandatory · Annual or every 3 years', descripcionLarga: 'A fatal viral disease that affects the nervous system of all mammals, including humans. It is notifiable and vaccination may be required by law.', sintomas: 'Behaviour changes, aggression, paralysis, seizures, hydrophobia.', frecuencia: 'Annual or every 3 years depending on local regulations.', riesgo: 'alto' },
    moquillo: { enfermedad: 'Canine distemper', descripcionCorta: 'Core vaccine · Annual booster', descripcionLarga: 'A highly contagious systemic viral disease that affects the respiratory, digestive and nervous systems. It can leave permanent neurological damage.', sintomas: 'Fever, nasal discharge, coughing, vomiting, diarrhoea, seizures.', frecuencia: 'Puppy series from 6–8 weeks + annual or triennial booster.', riesgo: 'alto' },
    parvovirus: { enfermedad: 'Canine parvovirus', descripcionCorta: 'Core vaccine · Annual booster', descripcionLarga: 'A highly contagious viral infection that attacks the gastrointestinal tract. It is especially dangerous in untreated puppies.', sintomas: 'Vomiting, bloody diarrhoea, lethargy, loss of appetite, high fever.', frecuencia: 'Puppy series from 6–8 weeks + annual booster.', riesgo: 'alto' },
    hepatitis: { enfermedad: 'Infectious canine hepatitis (Adenovirus type 1)', descripcionCorta: 'Core vaccine · Annual booster', descripcionLarga: 'Caused by canine adenovirus type 1. It mainly affects the liver, kidneys and vascular endothelium. It is included in the core combination vaccine.', sintomas: 'Fever, apathy, abdominal pain, vomiting, jaundice, corneal opacity.', frecuencia: 'Included in the combination vaccine from 6–8 weeks + annual booster.', riesgo: 'alto' },
    leptospirosis: { enfermedad: 'Leptospirosis', descripcionCorta: 'Annual · Zoonosis', descripcionLarga: 'A bacterial disease that can be transmitted to humans. It is more common in dogs exposed to stagnant water or rodents.', sintomas: 'Fever, vomiting, jaundice, kidney failure, bleeding.', frecuencia: 'From 8–9 weeks, booster after 3–4 weeks + annual booster.', riesgo: 'alto' },
    parainfluenza: { enfermedad: 'Canine parainfluenza', descripcionCorta: 'Core vaccine · Annual booster', descripcionLarga: 'One of the main causes of the respiratory complex known as kennel cough. Very contagious among dogs living together.', sintomas: 'Persistent dry cough, nasal discharge, mild fever.', frecuencia: 'Included in the combination vaccine, annual booster.', riesgo: 'medio' },
    bordetella: { enfermedad: 'Kennel cough (Bordetella)', descripcionCorta: 'Recommended · Every 6–12 months', descripcionLarga: 'A bacterial infection of the upper respiratory tract, highly contagious in parks, daycares and kennels.', sintomas: 'Persistent dry cough, sneezing, nasal discharge, mild fever.', frecuencia: 'From 8 weeks + booster every 6–12 months.', riesgo: 'medio' },
    'coronavirus canino': { enfermedad: 'Canine enteric coronavirus', descripcionCorta: 'Optional · Annual booster', descripcionLarga: 'Causes diarrhoea and gastrointestinal issues in dogs, especially puppies and breeding dogs.', sintomas: 'Diarrhoea, vomiting, dehydration, lethargy.', frecuencia: 'From 6–8 weeks + booster according to veterinary advice.', riesgo: 'medio' },
    leishmaniosis: { enfermedad: 'Leishmaniasis', descripcionCorta: 'Recommended in Mediterranean areas', descripcionLarga: 'A parasitic disease transmitted by sandfly bites. Especially relevant in Mediterranean and tropical areas.', sintomas: 'Weight loss, skin lesions, kidney failure, nosebleeds, conjunctivitis.', frecuencia: 'From 6 months + annual booster.', riesgo: 'alto' },
    lyme: { enfermedad: 'Lyme disease (Borrelia)', descripcionCorta: 'Recommended · Ticks', descripcionLarga: 'A tick-borne disease that can affect joints, kidneys and the nervous system.', sintomas: 'Lameness, fever, lethargy, loss of appetite, joint swelling.', frecuencia: 'From 9–12 weeks + second dose + annual booster.', riesgo: 'medio' },
    panleucopenia: { enfermedad: 'Feline panleukopenia', descripcionCorta: 'Mandatory · Annual booster', descripcionLarga: 'Destroys white blood cells, leaving cats without defences. Highly contagious and often fatal in kittens.', sintomas: 'Vomiting, diarrhoea, high fever, severe depression, sudden death.', frecuencia: 'Series from 6–8 weeks + annual booster.', riesgo: 'alto' },
    herpesvirus: { enfermedad: 'Feline viral rhinotracheitis (Herpesvirus)', descripcionCorta: 'Core vaccine · Annual booster', descripcionLarga: 'An upper respiratory tract infection caused by feline herpesvirus type 1. Very common in cat colonies.', sintomas: 'Sneezing, eye and nasal discharge, fever, conjunctivitis, corneal ulcers.', frecuencia: 'Series from 6–8 weeks + annual booster.', riesgo: 'medio' },
    calicivirus: { enfermedad: 'Feline calicivirus', descripcionCorta: 'Core vaccine · Annual booster', descripcionLarga: 'A viral infection of the respiratory tract and mouth. It can cause painful ulcers and lameness in severe cases.', sintomas: 'Mouth and tongue ulcers, lameness, fever, nasal and eye discharge.', frecuencia: 'Series from 6–8 weeks + annual booster.', riesgo: 'medio' },
    'leucemia felina': { enfermedad: 'Feline leukaemia (FeLV)', descripcionCorta: 'Recommended for outdoor cats', descripcionLarga: 'A retrovirus that suppresses the immune system and can cause tumours. It spreads through direct contact between cats.', sintomas: 'Weight loss, anaemia, recurring infections, tumours, fever.', frecuencia: 'From 8 weeks + second dose after 3–4 weeks + annual booster.', riesgo: 'alto' },
    clamidiosis: { enfermedad: 'Feline chlamydiosis', descripcionCorta: 'Recommended in colonies', descripcionLarga: 'Caused by Chlamydia felis, it causes persistent conjunctivitis and respiratory issues, especially in cats living with many others.', sintomas: 'Chronic conjunctivitis, sneezing, yellowish eye discharge.', frecuencia: 'From 8–9 weeks + annual booster.', riesgo: 'bajo' },
    peritonitis: { enfermedad: 'Feline infectious peritonitis (FIP)', descripcionCorta: 'Optional · Breeders', descripcionLarga: 'Caused by a mutation of feline coronavirus. High mortality, especially in kittens. Use depends on veterinary recommendation.', sintomas: 'Abdominal swelling, fluctuating fever, weight loss, lethargy.', frecuencia: 'From 16 weeks according to veterinary advice.', riesgo: 'alto' }
  },
  va: {
    rabia: { enfermedad: 'Ràbia', descripcionCorta: 'Obligatòria · Anual o triennal', descripcionLarga: 'Malaltia vírica mortal que afecta el sistema nerviós de tots els mamífers, inclosos els humans. És de notificació obligatòria i la vacunació pot ser exigida per llei.', sintomas: 'Canvis de comportament, agressivitat, paràlisi, convulsions, hidrofòbia.', frecuencia: 'Anual o triennal segons la legislació local.', riesgo: 'alto' },
    moquillo: { enfermedad: 'Brom caní', descripcionCorta: 'Polivalent · Reforç anual', descripcionLarga: 'Malaltia vírica sistèmica molt contagiosa que afecta els sistemes respiratori, digestiu i nerviós. Pot deixar seqüeles neurològiques permanents.', sintomas: 'Febra, secreció nasal, tos, vòmits, diarrea, convulsions.', frecuencia: 'Sèrie en cadells des de 6–8 setmanes + reforç anual o triennal.', riesgo: 'alto' },
    parvovirus: { enfermedad: 'Parvovirus caní', descripcionCorta: 'Polivalent · Reforç anual', descripcionLarga: 'Infecció vírica molt contagiosa que ataca el tracte gastrointestinal. És especialment greu en cadells sense tractament.', sintomas: 'Vòmits, diarrea amb sang, letargia, pèrdua de gana, febra alta.', frecuencia: 'Sèrie en cadells des de 6–8 setmanes + reforç anual.', riesgo: 'alto' },
    hepatitis: { enfermedad: 'Hepatitis infecciosa canina (Adenovirus tipus 1)', descripcionCorta: 'Polivalent · Reforç anual', descripcionLarga: 'Causada per l’adenovirus caní tipus 1. Afecta principalment el fetge, els renyons i l’endoteli vascular. S’inclou en la vacuna polivalent.', sintomas: 'Febra, apatia, dolor abdominal, vòmits, icterícia, opacitat corneal.', frecuencia: 'Inclosa en la polivalent des de 6–8 setmanes + reforç anual.', riesgo: 'alto' },
    leptospirosis: { enfermedad: 'Leptospirosi', descripcionCorta: 'Anual · Zoonosi', descripcionLarga: 'Malaltia bacteriana que pot transmetre’s als humans. És freqüent en gossos amb accés a aigua estancada o rosegadors.', sintomas: 'Febra, vòmits, icterícia, insuficiència renal, hemorràgies.', frecuencia: 'Des de 8–9 setmanes amb reforç a les 3–4 setmanes + anual.', riesgo: 'alto' },
    parainfluenza: { enfermedad: 'Parainfluença canina', descripcionCorta: 'Polivalent · Reforç anual', descripcionLarga: 'Una de les causes principals del complex respiratori conegut com a tos de les gosseres. Molt contagiosa entre gossos que conviuen.', sintomas: 'Tos seca persistent, secreció nasal, febra lleu.', frecuencia: 'Inclosa en la polivalent, reforç anual.', riesgo: 'medio' },
    bordetella: { enfermedad: 'Tos de les gosseres (Bordetella)', descripcionCorta: 'Recomanada · 6-12 mesos', descripcionLarga: 'Infecció bacteriana del tracte respiratori superior, molt contagiosa en parcs, guarderies o residències canines.', sintomas: 'Tos seca persistent, esternuts, secreció nasal, febra lleu.', frecuencia: 'Des de 8 setmanes + reforç cada 6-12 mesos.', riesgo: 'medio' },
    'coronavirus canino': { enfermedad: 'Coronavirus entèric caní', descripcionCorta: 'Opcional · Reforç anual', descripcionLarga: 'Provoca diarrees i problemes gastrointestinals en gossos, especialment en cadells i gossos de criador.', sintomas: 'Diarrea, vòmits, deshidratació, letargia.', frecuencia: 'Des de 6–8 setmanes + reforç segons criteri veterinari.', riesgo: 'medio' },
    leishmaniosis: { enfermedad: 'Leishmaniosi', descripcionCorta: 'Recomanada en zones mediterrànies', descripcionLarga: 'Malaltia parasitària transmesa per la picada del flebòtom. Especialment rellevant en zones mediterrànies i tropicals.', sintomas: 'Pèrdua de pes, lesions cutànies, fallada renal, epistaxi, conjuntivitis.', frecuencia: 'Des de 6 mesos + reforç anual.', riesgo: 'alto' },
    lyme: { enfermedad: 'Malaltia de Lyme (Borrelia)', descripcionCorta: 'Recomanada · Paparres', descripcionLarga: 'Malaltia transmesa per paparres que pot afectar articulacions, renyons i sistema nerviós.', sintomas: 'Coixesa, febra, letargia, pèrdua de gana, inflamació articular.', frecuencia: 'Des de 9–12 setmanes + segona dosi + reforç anual.', riesgo: 'medio' },
    panleucopenia: { enfermedad: 'Panleucopènia felina', descripcionCorta: 'Obligatòria · Reforç anual', descripcionLarga: 'Destrueix glòbuls blancs i deixa el gat sense defenses. Molt contagiosa i amb alta mortalitat en gatets.', sintomas: 'Vòmits, diarrea, febra alta, depressió extrema, mort sobtada.', frecuencia: 'Sèrie des de 6–8 setmanes + reforç anual.', riesgo: 'alto' },
    herpesvirus: { enfermedad: 'Rinotraqueïtis viral felina (Herpesvirus)', descripcionCorta: 'Trivalent · Reforç anual', descripcionLarga: 'Infecció del tracte respiratori superior causada per l’herpesvirus felí tipus 1. Molt comuna en colònies de gats.', sintomas: 'Esternuts, secreció ocular i nasal, febra, conjuntivitis, úlceres corneals.', frecuencia: 'Sèrie des de 6–8 setmanes + reforç anual.', riesgo: 'medio' },
    calicivirus: { enfermedad: 'Calicivirus felí', descripcionCorta: 'Trivalent · Reforç anual', descripcionLarga: 'Infecció vírica del tracte respiratori i la cavitat oral. Pot causar úlceres doloroses i coixesa en casos greus.', sintomas: 'Úlceres en boca i llengua, coixesa, febra, secreció nasal i ocular.', frecuencia: 'Sèrie des de 6–8 setmanes + reforç anual.', riesgo: 'medio' },
    'leucemia felina': { enfermedad: 'Leucèmia felina (FeLV)', descripcionCorta: 'Recomanada per a gats amb exterior', descripcionLarga: 'Retrovirus que suprimeix el sistema immunitari i pot causar tumors. Es transmet per contacte directe entre gats.', sintomas: 'Pèrdua de pes, anèmia, infeccions recurrents, tumors, febra.', frecuencia: 'Des de 8 setmanes + 2a dosi a les 3–4 setmanes + reforç anual.', riesgo: 'alto' },
    clamidiosis: { enfermedad: 'Clamidiosi felina', descripcionCorta: 'Recomanada en colònies', descripcionLarga: 'Causada per Chlamydia felis, provoca conjuntivitis persistent i problemes respiratoris, especialment en gats que conviuen amb molts altres.', sintomas: 'Conjuntivitis crònica, esternuts, secreció ocular groguenca.', frecuencia: 'Des de 8–9 setmanes + reforç anual.', riesgo: 'bajo' },
    peritonitis: { enfermedad: 'Peritonitis infecciosa felina (PIF)', descripcionCorta: 'Opcional · Criadors', descripcionLarga: 'Causada per una mutació del coronavirus felí. Alta mortalitat, especialment en gatets. L’ús depén del criteri veterinari.', sintomas: 'Distensió abdominal, febra fluctuant, pèrdua de pes, letargia.', frecuencia: 'Des de 16 setmanes segons criteri veterinari.', riesgo: 'alto' }
  }
}

// ── Helper principal: nombre → info ──────────────────────────
// Busca primero coincidencia exacta (minúsculas), luego parcial.
// Así "Parvovirus canino" → clave "parvovirus"; "Moquillo canino" → "moquillo"
export function getVacunaInfo(nombre, locale = 'es') {
  if (!nombre) return null
  const q = nombre.toLowerCase().trim()
  const lang = String(locale || 'es').split('-')[0]

  let key = null
  if (vacunasInfo[q]) key = q
  else key = Object.keys(vacunasInfo).find(k => q.includes(k) || k.includes(q))

  if (!key) return null
  const base = vacunasInfo[key]
  const localized = vacunasInfoI18n[lang]?.[key] || {}
  return { ...base, ...localized, nombre }
}

// ── Config de estados ─────────────────────────────────────────
export const estadoConfig = {
  puesta:    { label: 'Al día',   color: '#4AADA5', bg: '#E0F1EE' },
  pendiente: { label: 'Próxima',  color: '#B07D1A', bg: '#FEF6DC' },
  retrasada: { label: 'Atrasada', color: '#D95F5F', bg: '#FDEAEA' },
}
