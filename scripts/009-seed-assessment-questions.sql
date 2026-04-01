-- Seed script: Insert all 36 questions for initial_quiz_v1
-- Run this AFTER 008-assessment-system.sql

DO $$
DECLARE
  v_definition_id uuid;
  v_question_id uuid;
BEGIN
  -- Get the assessment definition ID
  SELECT id INTO v_definition_id FROM assessment_definitions WHERE slug = 'initial_quiz_v1';
  
  IF v_definition_id IS NULL THEN
    RAISE EXCEPTION 'Assessment definition initial_quiz_v1 not found';
  END IF;

  -- ============================================
  -- DOMAIN 1: RECOGNITION (R1-R12)
  -- ============================================

  -- R1
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'R1', 'recognition', 'single_choice', 
    'Una persona frunce el ceño, aprieta la mandíbula y habla con tono seco tras ver que alguien ha incumplido un acuerdo.', 1)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Alegría', 1, false, 0),
    (v_question_id, 'B', 'Enfado', 2, true, 1),
    (v_question_id, 'C', 'Vergüenza', 3, false, 0),
    (v_question_id, 'D', 'Alivio', 4, false, 0);

  -- R2
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'R2', 'recognition', 'single_choice', 
    'Una persona mira repetidamente la puerta, respira más rápido y se frota las manos antes de exponer en público.', 2)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Ansiedad', 1, true, 1),
    (v_question_id, 'B', 'Orgullo', 2, false, 0),
    (v_question_id, 'C', 'Ternura', 3, false, 0),
    (v_question_id, 'D', 'Calma', 4, false, 0);

  -- R3
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'R3', 'recognition', 'single_choice', 
    'Tras recibir una mala noticia, una persona baja la mirada, habla poco y parece sin energía.', 3)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Sorpresa', 1, false, 0),
    (v_question_id, 'B', 'Tristeza', 2, true, 1),
    (v_question_id, 'C', 'Ira', 3, false, 0),
    (v_question_id, 'D', 'Interés', 4, false, 0);

  -- R4
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'R4', 'recognition', 'single_choice', 
    'Abre un correo pensando que será neutro y descubre que le han aceptado en un programa que deseaba.', 4)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Asco', 1, false, 0),
    (v_question_id, 'B', 'Sorpresa', 2, true, 1),
    (v_question_id, 'C', 'Culpa', 3, false, 0),
    (v_question_id, 'D', 'Frialdad', 4, false, 0);

  -- R5
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'R5', 'recognition', 'single_choice', 
    'Se equivoca delante de varias personas y siente ganas de desaparecer y evitar miradas.', 5)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Culpa', 1, false, 0),
    (v_question_id, 'B', 'Vergüenza', 2, true, 1),
    (v_question_id, 'C', 'Serenidad', 3, false, 0),
    (v_question_id, 'D', 'Gratitud', 4, false, 0);

  -- R6
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'R6', 'recognition', 'single_choice', 
    'Después de meses de esfuerzo, le comunican que ha conseguido una meta importante y se muestra erguido, sonriente y con energía.', 6)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Orgullo', 1, true, 1),
    (v_question_id, 'B', 'Miedo', 2, false, 0),
    (v_question_id, 'C', 'Resignación', 3, false, 0),
    (v_question_id, 'D', 'Celos', 4, false, 0);

  -- R7
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'R7', 'recognition', 'single_choice', 
    'Llevaba horas muy tenso por una posible mala noticia y finalmente el problema se resuelve sin consecuencias graves.', 7)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Envidia', 1, false, 0),
    (v_question_id, 'B', 'Alivio', 2, true, 1),
    (v_question_id, 'C', 'Desprecio', 3, false, 0),
    (v_question_id, 'D', 'Aburrimiento', 4, false, 0);

  -- R8
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'R8', 'recognition', 'single_choice', 
    'Olvida hacer algo importante que afectaba a otra persona y siente que ha fallado.', 8)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Culpa', 1, true, 1),
    (v_question_id, 'B', 'Euforia', 2, false, 0),
    (v_question_id, 'C', 'Curiosidad', 3, false, 0),
    (v_question_id, 'D', 'Nostalgia', 4, false, 0);

  -- R9
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'R9', 'recognition', 'single_choice', 
    'El sistema vuelve a fallar por tercera vez, interrumpe una tarea sencilla y nota irritación creciente.', 9)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Frustración', 1, true, 1),
    (v_question_id, 'B', 'Éxtasis', 2, false, 0),
    (v_question_id, 'C', 'Ternura', 3, false, 0),
    (v_question_id, 'D', 'Satisfacción', 4, false, 0);

  -- R10
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'R10', 'recognition', 'single_choice', 
    'Al ver comida en mal estado, arruga la nariz y aparta el cuerpo.', 10)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Asco', 1, true, 1),
    (v_question_id, 'B', 'Compasión', 2, false, 0),
    (v_question_id, 'C', 'Vergüenza', 3, false, 0),
    (v_question_id, 'D', 'Orgullo', 4, false, 0);

  -- R11
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'R11', 'recognition', 'single_choice', 
    'Escucha una idea nueva y desafiante, se inclina hacia delante y hace preguntas con energía.', 11)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Interés', 1, true, 1),
    (v_question_id, 'B', 'Tristeza', 2, false, 0),
    (v_question_id, 'C', 'Miedo', 3, false, 0),
    (v_question_id, 'D', 'Culpa', 4, false, 0);

  -- R12
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'R12', 'recognition', 'single_choice', 
    'Le ofrecen una oportunidad muy deseada en otra ciudad. Sonríe, pero también nota un nudo en el estómago.', 12)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Solo alegría', 1, false, 0),
    (v_question_id, 'B', 'Alegría con ansiedad', 2, true, 1),
    (v_question_id, 'C', 'Solo tristeza', 3, false, 0),
    (v_question_id, 'D', 'Indiferencia', 4, false, 0);

  -- ============================================
  -- DOMAIN 2: UNDERSTANDING (C1-C12)
  -- ============================================

  -- C1
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'C1', 'understanding', 'single_choice', 
    'Una persona ha trabajado mucho en algo importante. Depende de la respuesta de otro y recibe un mensaje ambiguo: "ya lo veremos". ¿Qué emoción es más probable?', 13)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Frustración', 1, true, 1),
    (v_question_id, 'B', 'Orgullo', 2, false, 0),
    (v_question_id, 'C', 'Gratitud', 3, false, 0),
    (v_question_id, 'D', 'Asco', 4, false, 0);

  -- C2
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'C2', 'understanding', 'single_choice', 
    '¿Cuál de estas situaciones encaja mejor con vergüenza y no con culpa?', 14)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'He roto algo de otra persona y debo repararlo', 1, false, 0),
    (v_question_id, 'B', 'He hablado mal de alguien y me arrepiento', 2, false, 0),
    (v_question_id, 'C', 'He quedado en ridículo delante de otros', 3, true, 1),
    (v_question_id, 'D', 'He llegado tarde a propósito', 4, false, 0);

  -- C3
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'C3', 'understanding', 'single_choice', 
    '¿Cuál es la diferencia más ajustada entre ansiedad y miedo?', 15)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'El miedo suele aparecer sin objeto claro y la ansiedad ante peligro inmediato', 1, false, 0),
    (v_question_id, 'B', 'La ansiedad suele ser más anticipatoria y difusa; el miedo más inmediato y focalizado', 2, true, 1),
    (v_question_id, 'C', 'Son exactamente lo mismo', 3, false, 0),
    (v_question_id, 'D', 'El miedo siempre es menos intenso que la ansiedad', 4, false, 0);

  -- C4 (ranking)
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'C4', 'understanding', 'ranking', 
    'Ordena la secuencia más probable cuando algo importante empieza a salir mal de forma progresiva.', 16)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Irritación', 1, false, 0),
    (v_question_id, 'B', 'Frustración', 2, false, 0),
    (v_question_id, 'C', 'Enfado', 3, false, 0),
    (v_question_id, 'D', 'Resignación', 4, false, 0);
  INSERT INTO assessment_question_metadata (question_id, correct_order_json)
  VALUES (v_question_id, '["A", "B", "C", "D"]');

  -- C5
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'C5', 'understanding', 'single_choice', 
    'Si una persona percibe trato injusto y además cree que podría haberse evitado, ¿qué emoción es más probable?', 17)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Enfado', 1, true, 1),
    (v_question_id, 'B', 'Alivio', 2, false, 0),
    (v_question_id, 'C', 'Ternura', 3, false, 0),
    (v_question_id, 'D', 'Orgullo', 4, false, 0);

  -- C6
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'C6', 'understanding', 'single_choice', 
    'Si alguien pierde una oportunidad importante y siente que ya no puede recuperarla, ¿qué emoción es más probable?', 18)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Tristeza', 1, true, 1),
    (v_question_id, 'B', 'Curiosidad', 2, false, 0),
    (v_question_id, 'C', 'Asco', 3, false, 0),
    (v_question_id, 'D', 'Euforia', 4, false, 0);

  -- C7
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'C7', 'understanding', 'single_choice', 
    '¿Qué define mejor la decepción frente a la frustración?', 19)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'La decepción suele implicar que algo o alguien no estuvo a la altura de lo esperado', 1, true, 1),
    (v_question_id, 'B', 'La decepción siempre es más intensa', 2, false, 0),
    (v_question_id, 'C', 'La frustración siempre incluye vergüenza', 3, false, 0),
    (v_question_id, 'D', 'Son equivalentes', 4, false, 0);

  -- C8
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'C8', 'understanding', 'single_choice', 
    'Alguien da mucho de sí para ayudar a otra persona, pero esa ayuda es ignorada o minimizada. ¿Qué emoción encaja mejor?', 20)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Frustración', 1, true, 1),
    (v_question_id, 'B', 'Alegría', 2, false, 0),
    (v_question_id, 'C', 'Serenidad', 3, false, 0),
    (v_question_id, 'D', 'Asco', 4, false, 0);

  -- C9
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'C9', 'understanding', 'single_choice', 
    '¿Qué evento es más probable que genere alivio?', 21)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Me halagan delante de todos', 1, false, 0),
    (v_question_id, 'B', 'Se resuelve un problema que llevaba anticipando con tensión', 2, true, 1),
    (v_question_id, 'C', 'Veo una película divertida', 3, false, 0),
    (v_question_id, 'D', 'Descubro que alguien mintió', 4, false, 0);

  -- C10 (ranking)
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'C10', 'understanding', 'ranking', 
    'Ordena de menor a mayor amenaza para la autoimagen pública.', 22)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Incomodidad', 1, false, 0),
    (v_question_id, 'B', 'Bochorno', 2, false, 0),
    (v_question_id, 'C', 'Vergüenza', 3, false, 0),
    (v_question_id, 'D', 'Humillación', 4, false, 0);
  INSERT INTO assessment_question_metadata (question_id, correct_order_json)
  VALUES (v_question_id, '["A", "B", "C", "D"]');

  -- C11
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'C11', 'understanding', 'single_choice', 
    '¿Cuál de estas combinaciones emocionales es más plausible?', 23)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Orgullo + miedo antes de un gran reto', 1, true, 1),
    (v_question_id, 'B', 'Asco + gratitud ante un abrazo', 2, false, 0),
    (v_question_id, 'C', 'Calma + pánico en el mismo segundo sin contexto', 3, false, 0),
    (v_question_id, 'D', 'Vergüenza + euforia tras dormirse', 4, false, 0);

  -- C12
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'C12', 'understanding', 'single_choice', 
    'Tras un mensaje frío y ambiguo, una persona empieza a darle vueltas durante horas. ¿Qué efecto emocional es más probable si sigue rumiando?', 24)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Reducción automática de la activación', 1, false, 0),
    (v_question_id, 'B', 'Mantenimiento o aumento de ansiedad/frustración', 2, true, 1),
    (v_question_id, 'C', 'Conversión inmediata en alegría', 3, false, 0),
    (v_question_id, 'D', 'Desaparición total de dudas', 4, false, 0);

  -- ============================================
  -- DOMAIN 3: MANAGEMENT (M1-M12)
  -- ============================================

  -- M1
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'M1', 'management', 'single_choice', 
    'En una reunión alguien cuestiona tu trabajo delante de otros. ¿Qué respuesta sería más eficaz?', 25)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', '"Eso es mentira."', 1, false, 0),
    (v_question_id, 'B', 'Quedarte callado y rumiar', 2, false, 0),
    (v_question_id, 'C', '"¿Puedes decirme qué parte concreta ves mejorable?"', 3, true, 1),
    (v_question_id, 'D', 'Salir de la sala enfadado', 4, false, 0);

  -- M2
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'M2', 'management', 'single_choice', 
    'Notas que estás muy activado y con ganas de responder impulsivamente. ¿Qué paso inicial es más útil?', 26)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Escribir y enviar lo primero que piensas', 1, false, 0),
    (v_question_id, 'B', 'Hacer una pausa breve para bajar activación antes de responder', 2, true, 1),
    (v_question_id, 'C', 'Ignorarlo durante días', 3, false, 0),
    (v_question_id, 'D', 'Buscar culpables de inmediato', 4, false, 0);

  -- M3
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'M3', 'management', 'single_choice', 
    'Envías un mensaje importante y pasan horas sin contestarte. ¿Qué haría una respuesta emocionalmente más eficaz?', 27)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Mandar cuatro mensajes seguidos', 1, false, 0),
    (v_question_id, 'B', 'Asumir automáticamente rechazo', 2, false, 0),
    (v_question_id, 'C', 'Esperar un margen razonable y revisar interpretaciones antes de actuar', 3, true, 1),
    (v_question_id, 'D', 'Cortar la relación', 4, false, 0);

  -- M4 (ranking)
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'M4', 'management', 'ranking', 
    'Tu pareja te dice: "te noto distante". Ordena estas respuestas de peor a mejor.', 28)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', '"No empieces."', 1, false, 0),
    (v_question_id, 'B', '"Da igual."', 2, false, 0),
    (v_question_id, 'C', '"Luego hablamos, ahora no puedo."', 3, false, 0),
    (v_question_id, 'D', '"No sé bien qué me pasa, pero creo que estoy saturado."', 4, false, 0);
  INSERT INTO assessment_question_metadata (question_id, correct_order_json)
  VALUES (v_question_id, '["A", "B", "C", "D"]');

  -- M5
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'M5', 'management', 'single_choice', 
    'Antes de una exposición importante, una persona nota ansiedad. ¿Qué estrategia inmediata es más útil?', 29)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Repetirse "no siento nada"', 1, false, 0),
    (v_question_id, 'B', 'Respiración lenta + centrar la atención en una acción concreta siguiente', 2, true, 1),
    (v_question_id, 'C', 'Imaginar el peor escenario durante más tiempo', 3, false, 0),
    (v_question_id, 'D', 'Cancelar sin valorar opciones', 4, false, 0);

  -- M6
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'M6', 'management', 'single_choice', 
    'Has olvidado algo importante que afectó a otra persona y te sientes culpable. ¿Qué respuesta es más eficaz?', 30)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Justificarte de inmediato', 1, false, 0),
    (v_question_id, 'B', 'Fingir que no pasó', 2, false, 0),
    (v_question_id, 'C', 'Reconocer el error y reparar en lo posible', 3, true, 1),
    (v_question_id, 'D', 'Criticar a la otra persona', 4, false, 0);

  -- M7
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'M7', 'management', 'single_choice', 
    'Pensamiento automático: "Si hoy me sale mal, significa que no valgo". ¿Cuál es la alternativa más equilibrada?', 31)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', '"Todo me saldrá perfecto"', 1, false, 0),
    (v_question_id, 'B', '"Que hoy me cueste no define mi valor"', 2, true, 1),
    (v_question_id, 'C', '"Nunca me sale nada"', 3, false, 0),
    (v_question_id, 'D', '"Da igual todo"', 4, false, 0);

  -- M8
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'M8', 'management', 'single_choice', 
    'Te enteras de una decisión que consideras injusta. ¿Qué respuesta inicial suele ser más eficaz?', 32)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Explotar para liberar tensión', 1, false, 0),
    (v_question_id, 'B', 'Identificar el problema concreto y preparar una respuesta firme pero regulada', 2, true, 1),
    (v_question_id, 'C', 'Guardarlo para siempre', 3, false, 0),
    (v_question_id, 'D', 'Despreciar a todos los implicados', 4, false, 0);

  -- M9
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'M9', 'management', 'single_choice', 
    'Tras equivocarte delante de otros, sientes vergüenza intensa. ¿Qué estrategia es más útil?', 33)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Autoinsultarte para "aprender"', 1, false, 0),
    (v_question_id, 'B', 'Reconocer el error con brevedad y volver a la tarea', 2, true, 1),
    (v_question_id, 'C', 'Huir sin explicación siempre', 3, false, 0),
    (v_question_id, 'D', 'Negar lo evidente', 4, false, 0);

  -- M10
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'M10', 'management', 'single_choice', 
    'Un amigo está claramente triste por una pérdida. ¿Qué respuesta suele ser más útil?', 34)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Cambiar de tema enseguida', 1, false, 0),
    (v_question_id, 'B', 'Decirle que no debería sentirse así', 2, false, 0),
    (v_question_id, 'C', 'Validar su emoción y ofrecer presencia o ayuda concreta', 3, true, 1),
    (v_question_id, 'D', 'Compararlo con algo peor', 4, false, 0);

  -- M11 (ranking)
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'M11', 'management', 'ranking', 
    'Llevas una hora dándole vueltas a un comentario ambiguo. Ordena estas acciones de peor a mejor.', 35)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Revisar el comentario una y otra vez', 1, false, 0),
    (v_question_id, 'B', 'Respirar / pausar 1 minuto', 2, false, 0),
    (v_question_id, 'C', 'Escribir una interpretación alternativa y esperar', 3, false, 0),
    (v_question_id, 'D', 'Pedir aclaración cuando sea oportuno', 4, false, 0);
  INSERT INTO assessment_question_metadata (question_id, correct_order_json)
  VALUES (v_question_id, '["A", "B", "C", "D"]');

  -- M12
  INSERT INTO assessment_questions (assessment_definition_id, code, domain, question_type, prompt, order_index)
  VALUES (v_definition_id, 'M12', 'management', 'single_choice', 
    'Alguien cercano está muy alterado y habla rápido. ¿Qué respuesta suele ser más eficaz al principio?', 36)
  RETURNING id INTO v_question_id;
  INSERT INTO assessment_options (question_id, option_key, label, display_order, is_correct, weight) VALUES
    (v_question_id, 'A', 'Corregir todos sus errores de inmediato', 1, false, 0),
    (v_question_id, 'B', 'Subir tu tono para imponerte', 2, false, 0),
    (v_question_id, 'C', 'Bajar tu intensidad, escuchar y ayudar a concretar lo que necesita', 3, true, 1),
    (v_question_id, 'D', 'Ignorarle hasta que se calle', 4, false, 0);

  RAISE NOTICE 'Successfully inserted all 36 questions for initial_quiz_v1';
END $$;
