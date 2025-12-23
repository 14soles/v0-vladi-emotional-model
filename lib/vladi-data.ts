// VLADI V26.6 - Emotion matrices and descriptions

export const EMOTION_MATRICES = {
  green: [
    ["Soñoliento", "Complaciente", "Sosegado", "Acogido", "Sereno"],
    ["Apacible", "Reflexivo", "Pacífico", "Cómodo", "Despreocupado"],
    ["Relajado", "Tranquilo", "Repuesto", "Afortunado", "Equilibrado"],
    ["Calmado", "Seguro", "Satisfecho", "Agradecido", "Conmovido"],
    ["A gusto", "Desenfadado", "Contento", "Afectuoso", "Realizado"],
  ],
  yellow: [
    ["Agradable", "Jubiloso", "Esperanzado", "Juguetón", "Dichoso"],
    ["Complacido", "Centrado", "Feliz", "Orgulloso", "Encantado"],
    ["Enérgico", "Vivaz", "Emocionado", "Optimista", "Entusiasta"],
    ["Hiperactivo", "Alegre", "Motivado", "Inspirado", "Exaltado"],
    ["Sorprendido", "Animado", "Festivo", "Eufórico", "Extasiado"],
  ],
  red: [
    ["Asqueado", "Intranquilo", "Alarmado", "Incómodo", "Fastidiado"],
    ["Ansioso", "Temeroso", "Preocupado", "Irritado", "Molesto"],
    ["Hirviendo de rabia", "Asustado", "Enfadado", "Nervioso", "Inquieto"],
    ["Rabioso", "Furioso", "Frustrado", "Tenso", "Desconcertado"],
    ["Enfurecido", "Aterrorizado", "Estresado", "Alterado", "Impactado"],
  ],
  blue: [
    ["Desesperado", "Sin esperanza", "Desolado", "Fundido", "Sin energía"],
    ["Abatido", "Deprimido", "Huraño", "Agotado", "Fatigado"],
    ["Aislado", "Miserable", "Solitario", "Descorazonado", "Cansado"],
    ["Pesimista", "Sombrío", "Desanimado", "Triste", "Aburrido"],
    ["Disgustado", "Apagado", "Decepcionado", "Decaído", "Apático"],
  ],
} as const

export const EMOTION_DESCRIPTIONS: Record<string, Record<string, string>> = {
  green: {
    "A gusto": "Te sientes cómodo y en un entorno que no te exige esfuerzo; todo fluye de forma natural.",
    Desenfadado: "Estás relajado y con una actitud ligera, sin darle demasiadas vueltas a nada.",
    Contento: "Experimentas una alegría suave y estable, como una satisfacción tranquila.",
    Afectuoso: "Te nace el cariño hacia alguien; estás abierto a dar y recibir cercanía emocional.",
    Realizado: "Sientes que avanzas hacia lo que deseas y que tus esfuerzos tienen sentido.",
    Calmado: "Tu cuerpo y tu mente están en reposo, sin tensión ni agitación interna.",
    Seguro: "Confías en ti y en lo que te rodea; no percibes amenazas ni dudas.",
    Satisfecho: "Te sientes pleno con lo que has logrado o con cómo ha ocurrido algo en tu día.",
    Agradecido: "Reconoces el valor de lo que tienes o lo que alguien hace por ti.",
    Conmovido: "Algo te toca emocionalmente y despierta ternura o sensibilidad profunda.",
    Relajado: "Tu cuerpo está suelto y tu mente clara, sin cargas ni presión.",
    Tranquilo: "Todo está en orden dentro de ti; nada te altera y vas a tu ritmo.",
    Repuesto: "Has recuperado energía o equilibrio después de un cansancio o tensión.",
    Afortunado: "Sientes que la vida te sonríe y reconoces pequeñas o grandes cosas buenas.",
    Equilibrado: "Tu mundo interno está estable; emoción, mente y cuerpo van alineados.",
    Apacible: "Vives un estado de paz profunda, sin ruido mental ni preocupaciones urgentes.",
    Reflexivo: "Estás en calma y con mirada hacia dentro, pensando con claridad y profundidad.",
    Pacífico: "Te sientes en armonía contigo y con los demás, sin necesidad de defenderte.",
    Cómodo: "Tu cuerpo y mente están bien situados: sin resistencias, sin incomodidades.",
    Despreocupado: "Hay ligereza mental; nada pesa ni genera inquietud.",
    Soñoliento: "Tu cuerpo pide descanso; baja tu atención y se acerca el sueño.",
    Complaciente: "Tienes disposición amable hacia otros y ganas de agradar o colaborar.",
    Sosegado: "Estás calmado de un modo profundo y prolongado, como si nada pudiera perturbarte.",
    Acogido: "Te sientes envuelto en cuidado, protegido y emocionalmente sostenido.",
    Sereno: "Una calma plena, estable y luminosa: tranquilidad con claridad interior.",
  },
  yellow: {
    Sorprendido: "Algo inesperado te descoloca un momento y despierta tu curiosidad de forma positiva.",
    Animado: "Tienes buen ánimo y ganas de hacer cosas; sientes que el día 'acompaña'.",
    Festivo: "Estás con espíritu de celebración, te apetece compartir, reír y disfrutar con otros.",
    Eufórico: "Sientes una alegría muy intensa, casi desbordante, como si todo fuera emocionante.",
    Extasiado: "Estás tan feliz o conmovido que casi te quedas sin palabras; la emoción te llena por completo.",
    Hiperactivo: "Notas mucha energía en el cuerpo y la mente, te cuesta parar o bajar el ritmo.",
    Alegre: "Te sientes ligero, positivo y con una sonrisa fácil; ves el lado bueno de las cosas.",
    Motivado: "Tienes una razón clara para actuar y sientes impulso interno para ponerte en marcha.",
    Inspirado: "Algo te enciende la creatividad o el sentido; te llegan ideas o ganas de mejorar.",
    Exaltado: "La emoción te lleva muy arriba: hablas, gesticulas o reaccionas con mucha intensidad.",
    Enérgico: "Tu cuerpo responde con fuerza y vitalidad; sientes que tienes 'pilas' para rato.",
    Vivaz: "Te notas despierto, atento y ágil, como si todo a tu alrededor estuviera lleno de vida.",
    Emocionado: "Algo importante para ti está ocurriendo o por ocurrir y lo vives con ilusión intensa.",
    Optimista: "Confías en que las cosas saldrán bien y miras al futuro con esperanza y buena disposición.",
    Entusiasta: "Te implicas con ganas en lo que haces, contagias energía y hablas con pasión del tema.",
    Complacido: "Estás contento con un resultado o con cómo ha salido algo que valoras.",
    Centrado: "Tienes foco y claridad; tu energía está dirigida a lo que importa, sin dispersión.",
    Feliz: "Sientes bienestar profundo y estable, como si tu vida tuviera sentido en ese momento.",
    Orgulloso: "Reconoces tu esfuerzo o el de alguien cercano y te sientes bien por lo logrado.",
    Encantado: "Te gusta tanto algo o alguien que lo disfrutas al máximo y te resulta casi perfecto.",
    Agradable: "Lo que vives te resulta cómodo y placentero; no hay fricción ni malestar.",
    Jubiloso: "Tu alegría es expansiva y celebrativa, como si quisieras compartirla con todo el mundo.",
    Esperanzado: "Ves una posibilidad buena en el futuro y eso te da calma y energía a la vez.",
    Juguetón: "Te apetece bromear, probar, jugar y tomar la vida con humor y ligereza.",
    Dichoso: "Sientes una felicidad serena y profunda, como si fueras consciente de lo afortunado que eres.",
  },
  red: {
    Enfurecido: "Sientes una rabia extrema, tan intensa que te cuesta pensar con claridad y controlar tus impulsos.",
    Aterrorizado:
      "Vives un miedo muy fuerte, como si hubiera un peligro inmediato y tu cuerpo quisiera huir o esconderse.",
    Estresado:
      "Percibes demasiadas demandas y pocos recursos; tu mente va acelerada y tu cuerpo está en alerta constante.",
    Alterado: "Estás muy activado por dentro, nervioso e inquieto, como si algo te hubiera descolocado de golpe.",
    Impactado: "Algo te ha sorprendido bruscamente y te deja en shock, sin terminar de asimilar lo que ha pasado.",
    Rabioso: "Sientes un enfado muy intenso, casi visceral, como si la situación fuera profundamente injusta.",
    Furioso: "Estás tan enfadado que te cuesta contenerte; sientes deseo de gritar, discutir o descargar esa energía.",
    Frustrado:
      "Quieres lograr algo, pero hay obstáculos que te lo impiden y eso te genera mezcla de enfado e impotencia.",
    Tenso: "Tu cuerpo está rígido y en guardia, preparado para reaccionar, como si esperara un problema.",
    Desconcertado: "Lo que ha ocurrido no encaja con lo que esperabas y te quedas confundido y molesto a la vez.",
    "Hirviendo de rabia":
      "La ira te quema por dentro, sientes calor, presión y ganas de explotar o decir algo muy fuerte.",
    Asustado: "Percibes un posible daño o peligro y tu cuerpo reacciona con sobresalto, alerta y temor.",
    Enfadado: "Algo ha cruzado un límite para ti y te molesta claramente; quieres marcar tu posición o defenderte.",
    Nervioso: "Notas mariposas en el estómago, inquietud en el cuerpo y pensamientos que se aceleran.",
    Inquieto: "Te cuesta quedarte quieto o concentrarte; sientes desasosiego, como si algo no estuviera bien.",
    Ansioso:
      "Anticipas que algo malo puede pasar y tu mente se llena de preocupaciones acompañadas de síntomas físicos.",
    Temeroso: "Sientes miedo ante una situación concreta que podría salir mal o hacerte daño.",
    Preocupado: "Tu cabeza le da vueltas una y otra vez a un problema y te cuesta soltarlo o relajarte.",
    Irritado: "Estás especialmente sensible; cosas pequeñas te molestan mucho más de lo habitual.",
    Molesto: "Algo o alguien te incomoda o te disgusta, aunque la intensidad no sea muy alta.",
    Asqueado: "Algo te provoca un fuerte rechazo físico o moral y quieres alejarte cuanto antes de ello.",
    Intranquilo: "No encuentras paz interior; tienes una sensación difusa de que algo puede ir mal.",
    Alarmado: "Una señal o noticia te pone en máxima alerta, como si necesitaras reaccionar rápido ante un riesgo.",
    Incómodo: "No estás a gusto en la situación: tu cuerpo o tu mente sienten que algo 'no encaja' o no es seguro.",
    Fastidiado: "Algo te ha salido mal o te ha supuesto un contratiempo y te deja con un enfado suave pero constante.",
  },
  blue: {
    Disgustado: "Algo te provoca rechazo profundo y te hace sentir mal contigo mismo, con otros o con la situación.",
    Apagado: "Sientes tu ánimo bajo, sin brillo ni ganas de relacionarte o hacer mucho.",
    Decepcionado: "Algo no ha salido como esperabas y eso te duele, perdiendo ilusión o confianza.",
    Decaído: "Notas una bajada general de ánimo y energía, como si todo pesara un poco más.",
    Apático: "Te da casi igual lo que pase; te cuesta encontrar interés o motivación por las cosas.",
    Pesimista: "Tiendes a imaginar que las cosas saldrán mal y te cuesta ver opciones positivas.",
    Sombrío: "Ves el mundo con un tono más oscuro; tus pensamientos se llenan de negatividad o preocupación.",
    Desanimado: "Has perdido las ganas de seguir intentando algo que antes te importaba.",
    Triste: "Sientes una pena suave o intensa, a menudo relacionada con una pérdida o algo que echas de menos.",
    Aburrido: "Nada te llama la atención y el tiempo parece pasar muy lento; no encuentras estímulos que te llenen.",
    Aislado: "Te sientes separado de los demás, como si no formaras parte del grupo o de lo que ocurre.",
    Miserable: "Sientes que estás muy mal por dentro, como si casi nada tuviera sentido o alivio.",
    Solitario: "Te falta compañía emocional o conexión real, incluso aunque haya gente alrededor.",
    Descorazonado: "Algo ha golpeado tu ilusión y te cuesta volver a confiar o entusiasmarte.",
    Cansado: "Tu cuerpo y tu mente están gastados; necesitas parar y descansar.",
    Abatido: "Una sucesión de golpes o dificultades ha hundido tu ánimo y te cuesta levantarte.",
    Deprimido: "Vives una tristeza profunda y prolongada, con poca energía e interés por lo que antes te importaba.",
    Huraño: "Estás cerrado/a y poco accesible; te cuesta dejar que otros se acerquen o te hablen.",
    "Sin esperanza": "No ves salida o mejora posible, y eso hace que tu mirada hacia el futuro se oscurezca.",
    Desesperado: "Sientes que has perdido casi todas las opciones y la angustia te llena por dentro.",
    Desolado: "Te sientes solo ante la vida, como si el entorno estuviera vacío de apoyo o consuelo.",
    Fundido: "Has consumido toda tu batería emocional y física, como si te hubieras sobrepasado.",
    "Sin energía": "Estás vacío/a por dentro, con la sensación de no tener fuerzas para casi nada.",
    Agotado: "Has llegado al límite de tu energía; seguir adelante se siente extremadamente pesado.",
    Fatigado: "Notas un cansancio acumulado, físico o mental, que no se quita fácilmente.",
  },
}

export const QUADRANT_STATES = [
  { id: "yellow", text: "Con energía", color: "#E6B04F" },
  { id: "green", text: "En calma", color: "#94B22E" },
  { id: "red", text: "En tensión", color: "#E6584F" },
  { id: "blue", text: "Sin ánimo", color: "#466D91" },
] as const

export type QuadrantId = "green" | "yellow" | "red" | "blue"

export const DEFAULT_ACTIVITIES = [
  "Trabajando",
  "Descansando",
  "Haciendo ejercicio",
  "Comiendo",
  "Socializando",
  "Estudiando",
  "De ocio",
  "En casa",
]

export const DEFAULT_COMPANY = ["Solo/a", "Familia", "Amigos", "Pareja", "Compañeros", "Desconocidos"]

export const INFO_CONTENT: Record<string, { title: string; text: string }> = {
  status: {
    title: "Estado Actual",
    text: "Tu puntuación emocional en este momento, calculada en base a la valencia (positivo/negativo) y la intensidad de tu último registro.",
  },
  evolution: {
    title: "Evolución",
    text: "Cómo ha variado tu estado emocional a lo largo del tiempo. La línea muestra la tendencia de tu bienestar.",
  },
  climate: {
    title: "Clima Emocional",
    text: "Distribución de tus registros por cuadrante (calma, energía, tensión, desánimo) en el período seleccionado.",
  },
  patterns: {
    title: "Patrones Horarios",
    text: "Identifica a qué horas tiendes a sentirte mejor o peor. Útil para planificar actividades importantes.",
  },
  inertia: {
    title: "Inercia Emocional",
    text: "Tiempo medio que tardas en recuperarte de estados negativos intensos. Menor es mejor.",
  },
  adaptability: {
    title: "Adaptabilidad",
    text: "Capacidad de reducir la intensidad emocional usando intervenciones. Mayor puntuación indica mejor autorregulación.",
  },
  granularity: {
    title: "Granularidad Emocional",
    text: "Variedad de emociones que identificas. Mayor granularidad se asocia con mejor inteligencia emocional.",
  },
  contexts: {
    title: "Focos de Tensión",
    text: "Contextos o situaciones donde más frecuentemente registras emociones negativas.",
  },
  adherence: {
    title: "Adherencia",
    text: "Porcentaje de días en los que has registrado al menos una emoción en el período.",
  },
  records: {
    title: "Registros",
    text: "Número total de check-ins emocionales realizados en el período seleccionado.",
  },
}
