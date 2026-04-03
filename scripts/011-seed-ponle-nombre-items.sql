-- =====================================================
-- Seed: "Ponle Nombre" Tool Items (20 items)
-- =====================================================

INSERT INTO public.tool_items (tool_code, item_code, domain, subdomain, difficulty, context_tag, prompt, options, correct_option, rationale_internal, is_anchor_item)
VALUES
-- PN1: Frustración por respuesta ambigua
('put_a_name_v1', 'PN1', 'understanding', 'emotional_labeling', 'medium', 'incertidumbre',
 'Llevabas días esperando una respuesta importante. Te contestan con un "ya lo veremos" muy frío y te quedas dándole vueltas.',
 '[{"key": "tristeza", "label": "Tristeza"}, {"key": "frustracion", "label": "Frustración"}, {"key": "orgullo", "label": "Orgullo"}, {"key": "alegria", "label": "Alegría"}]',
 'frustracion', 'La falta de resolución clara y el tono frío generan frustración, no tristeza pura.', true),

-- PN2: Vergüenza por error público
('put_a_name_v1', 'PN2', 'recognition', 'emotion_differentiation', 'medium', 'error_social',
 'Te equivocas delante de varias personas y sientes ganas de desaparecer.',
 '[{"key": "culpa", "label": "Culpa"}, {"key": "verguenza", "label": "Vergüenza"}, {"key": "alivio", "label": "Alivio"}, {"key": "ternura", "label": "Ternura"}]',
 'verguenza', 'El deseo de desaparecer es característico de la vergüenza, no de la culpa (que implica reparar).', true),

-- PN3: Culpa por olvido que afecta a otro
('put_a_name_v1', 'PN3', 'recognition', 'emotion_differentiation', 'medium', 'error_social',
 'Olvidas algo importante que afectaba a otra persona y sientes que has fallado.',
 '[{"key": "culpa", "label": "Culpa"}, {"key": "orgullo", "label": "Orgullo"}, {"key": "curiosidad", "label": "Curiosidad"}, {"key": "calma", "label": "Calma"}]',
 'culpa', 'El sentimiento de haber fallado a alguien es característico de la culpa.', true),

-- PN4: Ansiedad anticipatoria
('put_a_name_v1', 'PN4', 'recognition', 'emotional_labeling', 'easy', 'presion',
 'Antes de hablar en público, miras repetidamente la puerta, respiras más rápido y te notas inquieto.',
 '[{"key": "ansiedad", "label": "Ansiedad"}, {"key": "alivio", "label": "Alivio"}, {"key": "interes", "label": "Interés"}, {"key": "orgullo", "label": "Orgullo"}]',
 'ansiedad', 'Los síntomas físicos y la anticipación negativa son señales claras de ansiedad.', false),

-- PN5: Tristeza clara
('put_a_name_v1', 'PN5', 'recognition', 'emotional_labeling', 'easy', 'perdida',
 'Tras una mala noticia, una persona baja la mirada y parece sin energía.',
 '[{"key": "tristeza", "label": "Tristeza"}, {"key": "asco", "label": "Asco"}, {"key": "alegria", "label": "Alegría"}, {"key": "enfado", "label": "Enfado"}]',
 'tristeza', 'La baja energía y la mirada hacia abajo son señales universales de tristeza.', false),

-- PN6: Frustración acumulada
('put_a_name_v1', 'PN6', 'recognition', 'emotional_labeling', 'easy', 'trabajo',
 'El sistema vuelve a fallar por tercera vez mientras haces una tarea sencilla y notas irritación creciente.',
 '[{"key": "frustracion", "label": "Frustración"}, {"key": "ternura", "label": "Ternura"}, {"key": "satisfaccion", "label": "Satisfacción"}, {"key": "nostalgia", "label": "Nostalgia"}]',
 'frustracion', 'La irritación ante obstáculos repetidos es frustración típica.', false),

-- PN7: Orgullo por logro
('put_a_name_v1', 'PN7', 'recognition', 'emotional_labeling', 'easy', 'logro',
 'Tras meses de esfuerzo, consigues una meta importante y te notas erguido, sonriente y con energía.',
 '[{"key": "orgullo", "label": "Orgullo"}, {"key": "miedo", "label": "Miedo"}, {"key": "resignacion", "label": "Resignación"}, {"key": "culpa", "label": "Culpa"}]',
 'orgullo', 'La postura erguida y la energía tras un logro son señales de orgullo.', false),

-- PN8: Alivio tras resolución
('put_a_name_v1', 'PN8', 'recognition', 'emotional_labeling', 'easy', 'incertidumbre',
 'Llevabas horas tenso por una posible mala noticia y finalmente el problema se resuelve sin consecuencias graves.',
 '[{"key": "alivio", "label": "Alivio"}, {"key": "verguenza", "label": "Vergüenza"}, {"key": "aburrimiento", "label": "Aburrimiento"}, {"key": "desprecio", "label": "Desprecio"}]',
 'alivio', 'La liberación de tensión tras una resolución positiva es alivio.', false),

-- PN9: Asco físico
('put_a_name_v1', 'PN9', 'recognition', 'emotional_labeling', 'easy', 'entorno',
 'Al ver comida en mal estado, arrugas la nariz y apartas el cuerpo.',
 '[{"key": "asco", "label": "Asco"}, {"key": "compasion", "label": "Compasión"}, {"key": "orgullo", "label": "Orgullo"}, {"key": "gratitud", "label": "Gratitud"}]',
 'asco', 'La reacción facial y de alejamiento ante algo desagradable es asco.', false),

-- PN10: Interés/curiosidad
('put_a_name_v1', 'PN10', 'recognition', 'emotional_labeling', 'easy', 'aprendizaje',
 'Escuchas una idea nueva y desafiante, te inclinas hacia delante y haces preguntas con energía.',
 '[{"key": "interes", "label": "Interés"}, {"key": "miedo", "label": "Miedo"}, {"key": "culpa", "label": "Culpa"}, {"key": "tristeza", "label": "Tristeza"}]',
 'interes', 'La aproximación física y las preguntas activas indican interés.', false),

-- PN11: Emoción mixta (alegría con ansiedad)
('put_a_name_v1', 'PN11', 'understanding', 'emotion_differentiation', 'hard', 'cambio',
 'Te ofrecen una oportunidad muy deseada en otra ciudad. Sonríes, pero notas un nudo en el estómago.',
 '[{"key": "solo_alegria", "label": "Solo alegría"}, {"key": "alegria_ansiedad", "label": "Alegría con ansiedad"}, {"key": "solo_tristeza", "label": "Solo tristeza"}, {"key": "indiferencia", "label": "Indiferencia"}]',
 'alegria_ansiedad', 'La sonrisa indica alegría, pero el nudo en el estómago indica ansiedad. Es una emoción mixta.', true),

-- PN12: Decepción vs frustración
('put_a_name_v1', 'PN12', 'understanding', 'emotion_differentiation', 'hard', 'relaciones',
 'Sientes que alguien no ha estado a la altura de lo que esperabas y te notas apagado más que bloqueado.',
 '[{"key": "decepcion", "label": "Decepción"}, {"key": "frustracion", "label": "Frustración"}, {"key": "orgullo", "label": "Orgullo"}, {"key": "asco", "label": "Asco"}]',
 'decepcion', 'La sensación de "apagado" es más típica de decepción; la frustración implica bloqueo e irritación.', true),

-- PN13: Interés romántico/atracción
('put_a_name_v1', 'PN13', 'recognition', 'emotional_labeling', 'medium', 'relaciones',
 'Te cruzas con alguien que te gusta mucho y de repente sientes activación, nervios y foco total en esa persona.',
 '[{"key": "interes", "label": "Interés"}, {"key": "miedo", "label": "Miedo"}, {"key": "apatia", "label": "Apatía"}, {"key": "desprecio", "label": "Desprecio"}]',
 'interes', 'La activación y el foco en alguien atractivo es interés/atracción.', false),

-- PN14: Envidia
('put_a_name_v1', 'PN14', 'understanding', 'emotional_labeling', 'hard', 'comparacion',
 'Alguien recibe un reconocimiento que tú deseabas y notas malestar centrado en la comparación.',
 '[{"key": "envidia", "label": "Envidia"}, {"key": "gratitud", "label": "Gratitud"}, {"key": "tristeza", "label": "Tristeza"}, {"key": "alivio", "label": "Alivio"}]',
 'envidia', 'El malestar por comparación social cuando otro obtiene lo deseado es envidia.', true),

-- PN15: Enfado por injusticia
('put_a_name_v1', 'PN15', 'recognition', 'emotional_labeling', 'medium', 'injusticia',
 'Percibes que te han tratado de manera injusta y evitable.',
 '[{"key": "enfado", "label": "Enfado"}, {"key": "ternura", "label": "Ternura"}, {"key": "orgullo", "label": "Orgullo"}, {"key": "serenidad", "label": "Serenidad"}]',
 'enfado', 'La percepción de injusticia evitable desencadena enfado típicamente.', false),

-- PN16: Tristeza por pérdida irrecuperable
('put_a_name_v1', 'PN16', 'understanding', 'emotional_labeling', 'medium', 'perdida',
 'Pierdes una oportunidad importante y sientes que ya no podrás recuperarla.',
 '[{"key": "tristeza", "label": "Tristeza"}, {"key": "curiosidad", "label": "Curiosidad"}, {"key": "euforia", "label": "Euforia"}, {"key": "asco", "label": "Asco"}]',
 'tristeza', 'La pérdida irreversible genera tristeza, no frustración (que implica obstáculo superable).', false),

-- PN17: Frustración por crítica repetida
('put_a_name_v1', 'PN17', 'understanding', 'emotion_differentiation', 'medium', 'trabajo',
 'Alguien te hace una crítica pequeña pero repetida durante varios días y notas irritación acumulada.',
 '[{"key": "frustracion", "label": "Frustración"}, {"key": "culpa", "label": "Culpa"}, {"key": "alegria", "label": "Alegría"}, {"key": "calma", "label": "Calma"}]',
 'frustracion', 'La irritación acumulada por obstáculos repetidos (críticas) es frustración.', false),

-- PN18: Orgullo por elogio merecido
('put_a_name_v1', 'PN18', 'recognition', 'emotional_labeling', 'easy', 'logro',
 'Recibes un elogio público inesperado por algo que te has trabajado mucho.',
 '[{"key": "orgullo", "label": "Orgullo"}, {"key": "verguenza", "label": "Vergüenza"}, {"key": "asco", "label": "Asco"}, {"key": "miedo", "label": "Miedo"}]',
 'orgullo', 'El reconocimiento de un esfuerzo propio genera orgullo.', false),

-- PN19: Ansiedad por incompetencia percibida
('put_a_name_v1', 'PN19', 'understanding', 'emotional_labeling', 'medium', 'presion',
 'Te piden hacer algo para lo que no te sientes preparado y anticipas que saldrá mal antes de empezar.',
 '[{"key": "ansiedad", "label": "Ansiedad"}, {"key": "alivio", "label": "Alivio"}, {"key": "gratitud", "label": "Gratitud"}, {"key": "curiosidad", "label": "Curiosidad"}]',
 'ansiedad', 'La anticipación negativa sobre el propio desempeño es ansiedad.', true),

-- PN20: Culpa por hablar mal de alguien
('put_a_name_v1', 'PN20', 'recognition', 'emotion_differentiation', 'medium', 'relaciones',
 'Te das cuenta de que has hablado mal de alguien y sientes necesidad de reparar.',
 '[{"key": "culpa", "label": "Culpa"}, {"key": "verguenza", "label": "Vergüenza"}, {"key": "orgullo", "label": "Orgullo"}, {"key": "aburrimiento", "label": "Aburrimiento"}]',
 'culpa', 'La necesidad de reparar el daño es característica de la culpa, no de la vergüenza.', true)

ON CONFLICT (item_code) DO UPDATE SET
  prompt = EXCLUDED.prompt,
  options = EXCLUDED.options,
  correct_option = EXCLUDED.correct_option,
  rationale_internal = EXCLUDED.rationale_internal,
  is_anchor_item = EXCLUDED.is_anchor_item,
  is_active = true;
