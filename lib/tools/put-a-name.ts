// Herramienta: Ponle nombre
// Microactividad para entrenar y evaluar la capacidad de identificar emociones

export interface PutANameItem {
  id: string
  tool_code: "put_a_name_v1"
  domain: "recognition" | "understanding"
  subdomain: "emotional_labeling"
  difficulty: "easy" | "medium" | "hard"
  context_tag: string
  prompt: string
  options: string[]
  correct_option: string
  rationale_internal?: string
  is_anchor_item: boolean
  is_active: boolean
}

export interface ToolSession {
  id: string
  profile_id: string
  tool_code: string
  mode: "assessment" | "training"
  started_at: string
  completed_at?: string
  items_presented_count: number
  items_answered_count: number
  total_time_ms?: number
  accuracy_score_100?: number
  is_completed: boolean
}

export interface ToolAnswer {
  id: string
  session_id: string
  profile_id: string
  item_id: string
  tool_code: string
  domain: string
  subdomain: string
  context_tag: string
  difficulty: string
  selected_option: string
  correct_option: string
  is_correct: boolean
  raw_score: number // 1 o 0
  response_time_ms: number
  confidence_score?: number
  shown_at: string
  answered_at: string
  presented_order: number
}

// Banco de preguntas inicial - 20 ítems
export const PUT_A_NAME_ITEMS: PutANameItem[] = [
  {
    id: "PN1",
    tool_code: "put_a_name_v1",
    domain: "understanding",
    subdomain: "emotional_labeling",
    difficulty: "medium",
    context_tag: "incertidumbre",
    prompt: "Llevabas días esperando una respuesta importante. Te contestan con un \"ya lo veremos\" muy frío y te quedas dándole vueltas.",
    options: ["Tristeza", "Frustración", "Orgullo", "Alegría"],
    correct_option: "Frustración",
    is_anchor_item: true,
    is_active: true,
  },
  {
    id: "PN2",
    tool_code: "put_a_name_v1",
    domain: "recognition",
    subdomain: "emotional_labeling",
    difficulty: "medium",
    context_tag: "error_social",
    prompt: "Te equivocas delante de varias personas y sientes ganas de desaparecer.",
    options: ["Culpa", "Vergüenza", "Alivio", "Ternura"],
    correct_option: "Vergüenza",
    is_anchor_item: true,
    is_active: true,
  },
  {
    id: "PN3",
    tool_code: "put_a_name_v1",
    domain: "understanding",
    subdomain: "emotional_labeling",
    difficulty: "medium",
    context_tag: "error_social",
    prompt: "Olvidas algo importante que afectaba a otra persona y sientes que has fallado.",
    options: ["Culpa", "Orgullo", "Curiosidad", "Calma"],
    correct_option: "Culpa",
    is_anchor_item: true,
    is_active: true,
  },
  {
    id: "PN4",
    tool_code: "put_a_name_v1",
    domain: "recognition",
    subdomain: "emotional_labeling",
    difficulty: "easy",
    context_tag: "presion",
    prompt: "Antes de hablar en público, miras repetidamente la puerta, respiras más rápido y te notas inquieto.",
    options: ["Ansiedad", "Alivio", "Interés", "Orgullo"],
    correct_option: "Ansiedad",
    is_anchor_item: true,
    is_active: true,
  },
  {
    id: "PN5",
    tool_code: "put_a_name_v1",
    domain: "recognition",
    subdomain: "emotional_labeling",
    difficulty: "easy",
    context_tag: "rechazo",
    prompt: "Tras una mala noticia, una persona baja la mirada y parece sin energía.",
    options: ["Tristeza", "Asco", "Alegría", "Enfado"],
    correct_option: "Tristeza",
    is_anchor_item: false,
    is_active: true,
  },
  {
    id: "PN6",
    tool_code: "put_a_name_v1",
    domain: "understanding",
    subdomain: "emotional_labeling",
    difficulty: "medium",
    context_tag: "trabajo",
    prompt: "El sistema vuelve a fallar por tercera vez mientras haces una tarea sencilla y notas irritación creciente.",
    options: ["Frustración", "Ternura", "Satisfacción", "Nostalgia"],
    correct_option: "Frustración",
    is_anchor_item: false,
    is_active: true,
  },
  {
    id: "PN7",
    tool_code: "put_a_name_v1",
    domain: "recognition",
    subdomain: "emotional_labeling",
    difficulty: "easy",
    context_tag: "logro",
    prompt: "Tras meses de esfuerzo, consigues una meta importante y te notas erguido, sonriente y con energía.",
    options: ["Orgullo", "Miedo", "Resignación", "Culpa"],
    correct_option: "Orgullo",
    is_anchor_item: true,
    is_active: true,
  },
  {
    id: "PN8",
    tool_code: "put_a_name_v1",
    domain: "recognition",
    subdomain: "emotional_labeling",
    difficulty: "medium",
    context_tag: "incertidumbre",
    prompt: "Llevabas horas tenso por una posible mala noticia y finalmente el problema se resuelve sin consecuencias graves.",
    options: ["Alivio", "Vergüenza", "Aburrimiento", "Desprecio"],
    correct_option: "Alivio",
    is_anchor_item: false,
    is_active: true,
  },
  {
    id: "PN9",
    tool_code: "put_a_name_v1",
    domain: "recognition",
    subdomain: "emotional_labeling",
    difficulty: "easy",
    context_tag: "rechazo",
    prompt: "Al ver comida en mal estado, arrugas la nariz y apartas el cuerpo.",
    options: ["Asco", "Compasión", "Orgullo", "Gratitud"],
    correct_option: "Asco",
    is_anchor_item: false,
    is_active: true,
  },
  {
    id: "PN10",
    tool_code: "put_a_name_v1",
    domain: "recognition",
    subdomain: "emotional_labeling",
    difficulty: "medium",
    context_tag: "trabajo",
    prompt: "Escuchas una idea nueva y desafiante, te inclinas hacia delante y haces preguntas con energía.",
    options: ["Interés", "Miedo", "Culpa", "Tristeza"],
    correct_option: "Interés",
    is_anchor_item: false,
    is_active: true,
  },
  {
    id: "PN11",
    tool_code: "put_a_name_v1",
    domain: "understanding",
    subdomain: "emotional_labeling",
    difficulty: "hard",
    context_tag: "incertidumbre",
    prompt: "Te ofrecen una oportunidad muy deseada en otra ciudad. Sonríes, pero notas un nudo en el estómago.",
    options: ["Solo alegría", "Alegría con ansiedad", "Solo tristeza", "Indiferencia"],
    correct_option: "Alegría con ansiedad",
    is_anchor_item: true,
    is_active: true,
  },
  {
    id: "PN12",
    tool_code: "put_a_name_v1",
    domain: "understanding",
    subdomain: "emotional_labeling",
    difficulty: "hard",
    context_tag: "rechazo",
    prompt: "Sientes que alguien no ha estado a la altura de lo que esperabas y te notas apagado más que bloqueado.",
    options: ["Decepción", "Frustración", "Orgullo", "Asco"],
    correct_option: "Decepción",
    is_anchor_item: false,
    is_active: true,
  },
  {
    id: "PN13",
    tool_code: "put_a_name_v1",
    domain: "recognition",
    subdomain: "emotional_labeling",
    difficulty: "medium",
    context_tag: "pareja",
    prompt: "Te cruzas con alguien que te gusta mucho y de repente sientes activación, nervios y foco total en esa persona.",
    options: ["Interés", "Miedo", "Apatía", "Desprecio"],
    correct_option: "Interés",
    is_anchor_item: false,
    is_active: true,
  },
  {
    id: "PN14",
    tool_code: "put_a_name_v1",
    domain: "understanding",
    subdomain: "emotional_labeling",
    difficulty: "hard",
    context_tag: "trabajo",
    prompt: "Alguien recibe un reconocimiento que tú deseabas y notas malestar centrado en la comparación.",
    options: ["Envidia", "Gratitud", "Tristeza", "Alivio"],
    correct_option: "Envidia",
    is_anchor_item: false,
    is_active: true,
  },
  {
    id: "PN15",
    tool_code: "put_a_name_v1",
    domain: "recognition",
    subdomain: "emotional_labeling",
    difficulty: "easy",
    context_tag: "injusticia",
    prompt: "Percibes que te han tratado de manera injusta y evitable.",
    options: ["Enfado", "Ternura", "Orgullo", "Serenidad"],
    correct_option: "Enfado",
    is_anchor_item: false,
    is_active: true,
  },
  {
    id: "PN16",
    tool_code: "put_a_name_v1",
    domain: "understanding",
    subdomain: "emotional_labeling",
    difficulty: "medium",
    context_tag: "rechazo",
    prompt: "Pierdes una oportunidad importante y sientes que ya no podrás recuperarla.",
    options: ["Tristeza", "Curiosidad", "Euforia", "Asco"],
    correct_option: "Tristeza",
    is_anchor_item: false,
    is_active: true,
  },
  {
    id: "PN17",
    tool_code: "put_a_name_v1",
    domain: "understanding",
    subdomain: "emotional_labeling",
    difficulty: "medium",
    context_tag: "critica",
    prompt: "Alguien te hace una crítica pequeña pero repetida durante varios días y notas irritación acumulada.",
    options: ["Frustración", "Culpa", "Alegría", "Calma"],
    correct_option: "Frustración",
    is_anchor_item: false,
    is_active: true,
  },
  {
    id: "PN18",
    tool_code: "put_a_name_v1",
    domain: "recognition",
    subdomain: "emotional_labeling",
    difficulty: "easy",
    context_tag: "logro",
    prompt: "Recibes un elogio público inesperado por algo que te has trabajado mucho.",
    options: ["Orgullo", "Vergüenza", "Asco", "Miedo"],
    correct_option: "Orgullo",
    is_anchor_item: false,
    is_active: true,
  },
  {
    id: "PN19",
    tool_code: "put_a_name_v1",
    domain: "recognition",
    subdomain: "emotional_labeling",
    difficulty: "medium",
    context_tag: "presion",
    prompt: "Te piden hacer algo para lo que no te sientes preparado y anticipas que saldrá mal antes de empezar.",
    options: ["Ansiedad", "Alivio", "Gratitud", "Curiosidad"],
    correct_option: "Ansiedad",
    is_anchor_item: false,
    is_active: true,
  },
  {
    id: "PN20",
    tool_code: "put_a_name_v1",
    domain: "understanding",
    subdomain: "emotional_labeling",
    difficulty: "hard",
    context_tag: "error_social",
    prompt: "Te das cuenta de que has hablado mal de alguien y sientes necesidad de reparar.",
    options: ["Culpa", "Vergüenza", "Orgullo", "Aburrimiento"],
    correct_option: "Culpa",
    is_anchor_item: false,
    is_active: true,
  },
]

// Función para seleccionar ítems según el modo
export function selectItems(
  mode: "training" | "assessment",
  previousItemIds: string[] = []
): PutANameItem[] {
  const activeItems = PUT_A_NAME_ITEMS.filter(item => item.is_active)
  
  if (mode === "training") {
    // Training: 5 ítems aleatorios, evitar repetir si es posible
    const availableItems = activeItems.filter(item => !previousItemIds.includes(item.id))
    const itemsToUse = availableItems.length >= 5 ? availableItems : activeItems
    
    // Balance por dificultad
    const easy = itemsToUse.filter(i => i.difficulty === "easy")
    const medium = itemsToUse.filter(i => i.difficulty === "medium")
    const hard = itemsToUse.filter(i => i.difficulty === "hard")
    
    const selected: PutANameItem[] = []
    
    // 1-2 fáciles, 2-3 medios, 0-1 difícil
    const shuffleAndPick = (arr: PutANameItem[], count: number) => {
      const shuffled = [...arr].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, count)
    }
    
    selected.push(...shuffleAndPick(easy, Math.min(2, easy.length)))
    selected.push(...shuffleAndPick(medium, Math.min(2, medium.length)))
    selected.push(...shuffleAndPick(hard, Math.min(1, hard.length)))
    
    // Completar hasta 5 si faltan
    while (selected.length < 5 && itemsToUse.length > selected.length) {
      const remaining = itemsToUse.filter(i => !selected.includes(i))
      if (remaining.length > 0) {
        selected.push(remaining[Math.floor(Math.random() * remaining.length)])
      } else {
        break
      }
    }
    
    // Aleatorizar orden final
    return selected.sort(() => Math.random() - 0.5)
  } else {
    // Assessment: 8-12 ítems, incluir 4-6 anchor items
    const anchorItems = activeItems.filter(item => item.is_anchor_item)
    const nonAnchorItems = activeItems.filter(item => !item.is_anchor_item)
    
    const selectedAnchors = anchorItems.sort(() => Math.random() - 0.5).slice(0, Math.min(6, anchorItems.length))
    const remainingCount = Math.min(6, 12 - selectedAnchors.length)
    const selectedNonAnchors = nonAnchorItems.sort(() => Math.random() - 0.5).slice(0, remainingCount)
    
    const allSelected = [...selectedAnchors, ...selectedNonAnchors]
    
    // Aleatorizar orden
    return allSelected.sort(() => Math.random() - 0.5)
  }
}

// Función para aleatorizar opciones de un ítem
export function randomizeOptions(item: PutANameItem): { options: string[], correctIndex: number } {
  const shuffled = [...item.options].sort(() => Math.random() - 0.5)
  const correctIndex = shuffled.indexOf(item.correct_option)
  return { options: shuffled, correctIndex }
}
