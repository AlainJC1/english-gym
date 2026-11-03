// 16 grammar topics where Spanish speakers make the most mistakes.
// Exercise types: c = choice (o options, a index), g = gap (a accepted answers).
export const GRAMMAR = [
  { id: 'pres', title: 'Present simple vs continuous',
    es: 'Presente simple: hábitos, rutinas y verdades (I work from 9 to 6). Presente continuo: lo que pasa ahora o en estos días (I\'m working on a new video). En preguntas y negaciones del presente simple usa do / does: Where do you live? He doesn\'t smoke.',
    ex: ['I work in telemedicine.', 'Right now I\'m talking to a patient.', 'Does she drink coffee?', 'He doesn\'t smoke.'],
    q: [
      { t: 'c', q: 'Look! It ___ outside.', o: ['rains', 'is raining', 'rain'], a: 1, why: 'Pasa ahora mismo: presente continuo.' },
      { t: 'c', q: 'I usually ___ home at 7:30.', o: ['leave', 'am leaving', 'leaving'], a: 0, why: 'Rutina: presente simple.' },
      { t: 'g', q: '___ you speak English at work?', a: ['do'], why: 'Pregunta en presente simple con you: do.' },
      { t: 'g', q: 'She ___ spicy food. (not like)', a: ['doesn\'t like', 'does not like'], why: 'He / she / it en negativo: doesn\'t + verbo base.' },
      { t: 'c', q: 'This week I ___ a lot of night shifts.', o: ['do', 'am doing', 'does'], a: 1, why: 'Algo temporal de estos días: presente continuo.' },
      { t: 'c', q: 'Water ___ at 100 °C.', o: ['boils', 'is boiling', 'boil'], a: 0, why: 'Verdad general: presente simple.' }
    ] },
  { id: 'past', title: 'Past simple and -ed endings',
    es: 'Acciones terminadas en el pasado: I worked yesterday. Regulares en -ed; irregulares de memoria (go → went, see → saw). En preguntas y negaciones usa did + verbo base: Did you sleep well? I didn\'t go. La -ed suena /t/ después de k, p, s, sh, ch, f (worked); /ɪd/ después de t o d (needed); /d/ en los demás (played).',
    ex: ['Yesterday I worked until six.', 'Did you sleep well?', 'I didn\'t go to the gym.', 'She needed a break.'],
    q: [
      { t: 'g', q: 'Yesterday I ___ to the gym. (go)', a: ['went'], why: 'Go es irregular: went.' },
      { t: 'g', q: '___ you see the patient this morning?', a: ['did'], why: 'Pregunta en pasado: did.' },
      { t: 'c', q: 'I didn\'t ___ the email.', o: ['saw', 'see', 'seen'], a: 1, why: 'Después de didn\'t va el verbo base.' },
      { t: 'c', q: 'How does "worked" end?', o: ['/t/ (workt)', '/d/', '/ɪd/ (work-ed)'], a: 0, why: 'Después de k suena /t/.' },
      { t: 'c', q: 'How does "needed" end?', o: ['/t/', '/d/', '/ɪd/ (need-ed)'], a: 2, why: 'Después de t o d suena /ɪd/.' },
      { t: 'g', q: 'She ___ a new phone last week. (buy)', a: ['bought'], why: 'Buy es irregular: bought.' }
    ] },
  { id: 'presperf', title: 'Present perfect, for and since',
    es: 'Have / has + participio para experiencias (Have you ever been to Spain?) y para algo que empezó en el pasado y sigue (I\'ve lived here for 3 years). For + periodo (for two years); since + punto de inicio (since 2020). Con un momento terminado (yesterday, in 2020) usa pasado simple.',
    ex: ['I\'ve lived here since 2020.', 'Have you ever been to Spain?', 'She\'s worked here for two years.', 'I went to Madrid in 2024.'],
    q: [
      { t: 'c', q: 'I ___ here since 2020.', o: ['live', 'have lived', 'lived'], a: 1, why: 'Empezó en el pasado y sigue: present perfect.' },
      { t: 'g', q: 'I\'ve worked here ___ six months.', a: ['for'], why: 'Periodo de tiempo: for.' },
      { t: 'g', q: 'She\'s been a doctor ___ 2025.', a: ['since'], why: 'Punto de inicio: since.' },
      { t: 'c', q: '___ you ever been to Spain?', o: ['Did', 'Have', 'Were'], a: 1, why: 'Experiencia con ever: present perfect.' },
      { t: 'c', q: 'I ___ to Madrid in 2024.', o: ['have gone', 'went', 'have been'], a: 1, why: 'Fecha terminada: pasado simple.' },
      { t: 'g', q: 'He has ___ that movie three times. (see)', a: ['seen'], why: 'Participio de see: seen.' }
    ] },
  { id: 'articles', title: 'Articles and the subject "it"',
    es: 'Las profesiones llevan a / an: I\'m a doctor. Las ideas generales van sin the: Life is hard, Doctors work a lot. The = algo específico: the doctor who saw me. An antes de sonido vocal: an engineer. En inglés el sujeto nunca falta: It\'s important, It\'s raining, It\'s 5 o\'clock.',
    ex: ['I\'m a doctor.', 'Life is hard sometimes.', 'It\'s important to sleep well.', 'She\'s an engineer.'],
    q: [
      { t: 'c', q: 'I\'m ___ doctor.', o: ['(nothing)', 'a', 'the'], a: 1, why: 'Profesiones: a / an.' },
      { t: 'g', q: '___ is raining.', a: ['it'], why: 'El clima lleva sujeto it.' },
      { t: 'c', q: '___ life is hard sometimes.', o: ['The', '(nothing)', 'A'], a: 1, why: 'Idea general: sin artículo.' },
      { t: 'c', q: 'She\'s ___ engineer.', o: ['a', 'an', 'the'], a: 1, why: 'Sonido vocal: an.' },
      { t: 'g', q: '___\'s late. Let\'s go home.', a: ['it'], why: 'La hora lleva sujeto it.' },
      { t: 'c', q: 'I love ___ music of this movie.', o: ['(nothing)', 'the', 'a'], a: 1, why: 'Algo específico: the.' }
    ] },
  { id: 'count', title: 'Countable and uncountable nouns',
    es: 'Los incontables no tienen plural ni a / an: advice, information, research, news, equipment, furniture, homework, evidence. Usa some, a lot of o a piece of: some advice, a piece of information. Con incontables: much / less; con contables: many / fewer.',
    ex: ['Can you give me some advice?', 'I need more information.', 'How many patients did you see?', 'How much time do you have?'],
    q: [
      { t: 'c', q: 'Can you give me some ___?', o: ['advices', 'advice', 'an advice'], a: 1, why: 'Advice es incontable.' },
      { t: 'c', q: 'I need more ___ about the patient.', o: ['informations', 'information', 'an information'], a: 1, why: 'Information es incontable.' },
      { t: 'c', q: 'How ___ patients did you see today?', o: ['much', 'many'], a: 1, why: 'Patients es contable: many.' },
      { t: 'c', q: 'How ___ time do you have?', o: ['much', 'many'], a: 0, why: 'Time (tiempo) es incontable: much.' },
      { t: 'c', q: 'The news ___ good today.', o: ['is', 'are'], a: 0, why: 'News es singular.' },
      { t: 'g', q: 'That\'s a good piece of ___. (consejo)', a: ['advice'], why: 'A piece of advice = un consejo.' }
    ] },
  { id: 'future', title: 'The future: will, going to, present continuous',
    es: 'Will: decisiones del momento, promesas y predicciones (I\'ll call you). Going to: planes ya decididos y predicciones con evidencia (I\'m going to move to Spain; look at those clouds, it\'s going to rain). Presente continuo: citas y planes fijos (I\'m seeing a patient at 10).',
    ex: ['I\'ll call you later.', 'I\'m going to move to Spain.', 'I\'m meeting my tutor at 8:30.', 'It\'s going to rain.'],
    q: [
      { t: 'c', q: 'The phone\'s ringing. I ___ get it!', o: ['\'ll', '\'m going to', '(nothing)'], a: 0, why: 'Decisión del momento: will.' },
      { t: 'c', q: 'I\'ve decided. I ___ apply for jobs in Spain.', o: ['will', 'am going to'], a: 1, why: 'Plan ya decidido: going to.' },
      { t: 'c', q: 'I ___ my tutor tomorrow at 8:30. It\'s booked.', o: ['meet', 'am meeting', 'will meeting'], a: 1, why: 'Cita fija: presente continuo.' },
      { t: 'g', q: 'Don\'t worry, I ___ help you. (promesa)', a: ['will', '\'ll'], why: 'Promesa: will.' },
      { t: 'c', q: 'Look at those clouds. It ___ rain.', o: ['is going to', 'will to', 'going'], a: 0, why: 'Predicción con evidencia: going to.' },
      { t: 'c', q: 'What ___ this weekend?', o: ['are you doing', 'will you doing', 'do you do'], a: 0, why: 'Planes cercanos: presente continuo.' }
    ] },
  { id: 'compare', title: 'Comparatives and superlatives',
    es: 'Adjetivos cortos: -er / the -est (big → bigger → the biggest). Largos: more / the most (more expensive, the most important). Irregulares: good → better → the best; bad → worse → the worst. Para comparar usa than: Madrid is bigger than Valencia.',
    ex: ['Madrid is bigger than Valencia.', 'This is the most important thing.', 'Today I feel better.', 'He\'s the best doctor here.'],
    q: [
      { t: 'g', q: 'Madrid is ___ than Valencia. (big)', a: ['bigger'], why: 'Corto: -er (se duplica la g).' },
      { t: 'c', q: 'This is ___ important thing.', o: ['the more', 'the most', 'most'], a: 1, why: 'Superlativo largo: the most.' },
      { t: 'c', q: 'English is ___ than I thought.', o: ['more easy', 'easier', 'easyer'], a: 1, why: 'Easy termina en -y: easier.' },
      { t: 'g', q: 'Today I feel ___ than yesterday. (good)', a: ['better'], why: 'Good es irregular: better.' },
      { t: 'c', q: 'He\'s ___ doctor in the hospital.', o: ['the best', 'the better', 'best'], a: 0, why: 'Superlativo de good: the best.' },
      { t: 'c', q: 'My new job is ___ than my old one.', o: ['more interesting', 'interestinger', 'most interesting'], a: 0, why: 'Adjetivo largo: more.' }
    ] },
  { id: 'modals', title: 'Modals: should, must, have to, might',
    es: 'Después de un modal va el verbo base, sin to: You should rest, I must go, It might rain. Have to sí lleva to y cambia: I have to, she has to, I had to. Should = consejo; must / have to = obligación; might = posibilidad.',
    ex: ['You should rest.', 'I have to work tomorrow.', 'It might rain later.', 'You shouldn\'t smoke.'],
    q: [
      { t: 'c', q: 'You should ___ more water.', o: ['to drink', 'drink', 'drinking'], a: 1, why: 'Modal + verbo base, sin to.' },
      { t: 'c', q: 'I ___ work tomorrow. (obligación)', o: ['have to', 'must to', 'should to'], a: 0, why: 'Must y should nunca llevan to.' },
      { t: 'g', q: 'She ___ to wear a uniform at work. (have / has)', a: ['has'], why: 'She → has to.' },
      { t: 'c', q: 'Take an umbrella. It ___ rain.', o: ['might', 'must', 'has to'], a: 0, why: 'Posibilidad: might.' },
      { t: 'c', q: 'You ___ smoke. It\'s bad for you.', o: ['shouldn\'t', 'don\'t should', 'not should'], a: 0, why: 'Negativo de should: shouldn\'t.' },
      { t: 'g', q: 'Yesterday I ___ to stay late. (have to, pasado)', a: ['had'], why: 'Pasado de have to: had to.' }
    ] },
  { id: 'gerund', title: 'Gerund vs infinitive',
    es: 'Después de enjoy, finish, avoid, mind, keep y suggest va -ing: I enjoy reading. Después de want, need, decide, plan y hope va to + verbo: I want to learn. Después de una preposición siempre -ing: I\'m good at listening, I\'m used to working at night, I\'m looking forward to seeing you. Used to + verbo = solía.',
    ex: ['I enjoy listening to podcasts.', 'I want to speak fluently.', 'I\'m used to working at night.', 'I used to play soccer.'],
    q: [
      { t: 'c', q: 'I enjoy ___ podcasts.', o: ['to listen', 'listening to', 'listen'], a: 1, why: 'Enjoy + -ing.' },
      { t: 'c', q: 'I want ___ English fluently.', o: ['speaking', 'to speak', 'speak'], a: 1, why: 'Want + to.' },
      { t: 'c', q: 'I\'m used to ___ at night.', o: ['work', 'working', 'worked'], a: 1, why: 'Be used to + -ing (acostumbrado a).' },
      { t: 'g', q: 'I used to ___ soccer every weekend. (play)', a: ['play'], why: 'Used to + verbo base (solía).' },
      { t: 'c', q: 'Thanks for ___ me.', o: ['help', 'helping', 'to help'], a: 1, why: 'Después de preposición: -ing.' },
      { t: 'c', q: 'I\'m looking forward to ___ you.', o: ['see', 'seeing', 'saw'], a: 1, why: 'Look forward to + -ing.' }
    ] },
  { id: 'cond', title: 'Conditionals 0, 1 and 2',
    es: 'Cero, verdades: If you heat ice, it melts. Primero, algo posible: If + presente, will + verbo (If I have time, I\'ll call you); nunca will después de if. Segundo, situaciones imaginarias: If + pasado, would + verbo (If I lived in Spain, I would work there). If I were you… sirve para dar consejos.',
    ex: ['If I have time, I\'ll call you.', 'If I were you, I\'d see a doctor.', 'If you don\'t sleep, you get tired.', 'What would you do if you won the lottery?'],
    q: [
      { t: 'c', q: 'If I ___ time, I\'ll call you.', o: ['will have', 'have', 'had'], a: 1, why: 'Después de if no va will.' },
      { t: 'c', q: 'If I ___ you, I\'d see a doctor.', o: ['am', 'were', 'will be'], a: 1, why: 'Consejo: If I were you.' },
      { t: 'g', q: 'If it rains, I ___ stay home. (will)', a: ['will', '\'ll'], why: 'Primer condicional: will en la otra parte.' },
      { t: 'c', q: 'If I won the lottery, I ___ travel the world.', o: ['will', 'would', 'am'], a: 1, why: 'Imaginario: would.' },
      { t: 'c', q: 'If you don\'t sleep, you ___ tired.', o: ['get', 'got', 'would got'], a: 0, why: 'Verdad general: presente y presente.' },
      { t: 'g', q: 'What would you do if you ___ a millionaire? (be)', a: ['were', 'was'], why: 'Segundo condicional: were (también se oye was).' }
    ] },
  { id: 'preps', title: 'Prepositions',
    es: 'Muchas se aprenden en bloque: depend on, married to, arrive at (un lugar) / arrive in (ciudad o país), listen to, wait for, good at, interested in, worried about. Tiempo: in the morning, at night, on Monday, at 8.',
    ex: ['It depends on the patient.', 'She\'s married to a dentist.', 'I arrived at the hospital at eight.', 'I\'m interested in neurology.'],
    q: [
      { t: 'c', q: 'It depends ___ the patient.', o: ['of', 'on', 'in'], a: 1, why: 'Depend on.' },
      { t: 'c', q: 'She\'s married ___ a dentist.', o: ['with', 'to', 'of'], a: 1, why: 'Married to.' },
      { t: 'c', q: 'I arrived ___ the hospital at 8.', o: ['to', 'at', 'in'], a: 1, why: 'Arrive at + lugar; nunca arrive to.' },
      { t: 'c', q: 'I\'m interested ___ neurology.', o: ['in', 'on', 'for'], a: 0, why: 'Interested in.' },
      { t: 'g', q: 'I\'m waiting ___ the results.', a: ['for'], why: 'Wait for.' },
      { t: 'c', q: 'I have a class ___ Tuesday.', o: ['in', 'on', 'at'], a: 1, why: 'Días: on.' }
    ] },
  { id: 'questions', title: 'Questions and indirect questions',
    es: 'Las preguntas directas llevan auxiliar antes del sujeto: Where do you work? What did he say? En las preguntas indirectas el orden es normal y sin auxiliar: Can you tell me where the pharmacy is? Do you know what time it is?',
    ex: ['Where do you work?', 'What did he say?', 'Do you know where the pharmacy is?', 'Can you tell me what time it is?'],
    q: [
      { t: 'c', q: 'Where ___?', o: ['you work', 'do you work', 'you do work'], a: 1, why: 'Auxiliar antes del sujeto.' },
      { t: 'c', q: 'Do you know ___?', o: ['where is the pharmacy', 'where the pharmacy is'], a: 1, why: 'Indirecta: orden normal.' },
      { t: 'c', q: 'What ___ he say yesterday?', o: ['did', 'does', '(nothing)'], a: 0, why: 'Pregunta en pasado: did.' },
      { t: 'c', q: 'Can you tell me what time ___?', o: ['is it', 'it is'], a: 1, why: 'Indirecta: orden normal.' },
      { t: 'g', q: 'How long ___ you had this pain?', a: ['have'], why: 'Present perfect: have you had.' },
      { t: 'c', q: '___ she work here?', o: ['Do', 'Does', 'Is'], a: 1, why: 'She → does.' }
    ] },
  { id: 'makedo', title: 'Make / do, say / tell',
    es: 'Make = crear o producir: make a decision, make a mistake, make money, make an appointment. Do = tareas y actividades: do homework, do exercise, do your best, do a test. Tell + persona: Tell me the truth. Say + algo: He said it was fine.',
    ex: ['I need to make a decision.', 'I do exercise every day.', 'Tell me the truth.', 'He said it was fine.'],
    q: [
      { t: 'c', q: 'I need to ___ a decision.', o: ['do', 'make'], a: 1, why: 'Make a decision.' },
      { t: 'c', q: 'I ___ exercise every day.', o: ['make', 'do'], a: 1, why: 'Do exercise.' },
      { t: 'c', q: 'Can you ___ me your name?', o: ['say', 'tell'], a: 1, why: 'Tell + persona.' },
      { t: 'c', q: 'He ___ that the pain was worse.', o: ['said', 'told'], a: 0, why: 'Say + lo que se dice (sin persona).' },
      { t: 'c', q: 'I ___ a mistake in the report.', o: ['did', 'made'], a: 1, why: 'Make a mistake.' },
      { t: 'g', q: 'Please ___ an appointment with the specialist.', a: ['make'], why: 'Make an appointment.' }
    ] },
  { id: 'possess', title: 'His / her and adjectives',
    es: 'His = de él, her = de ella, its = de una cosa o animal: depende del dueño, no de la cosa. El adjetivo va antes del sustantivo y no lleva plural: important people, the red car, three new patients.',
    ex: ['My sister and her husband.', 'My brother lost his keys.', 'They are important people.', 'I bought a red car.'],
    q: [
      { t: 'c', q: 'My sister and ___ husband.', o: ['his', 'her'], a: 1, why: 'De ella: her.' },
      { t: 'c', q: 'My brother lost ___ keys.', o: ['his', 'her'], a: 0, why: 'De él: his.' },
      { t: 'c', q: 'They are ___.', o: ['importants people', 'important people', 'people importants'], a: 1, why: 'Adjetivo antes y sin plural.' },
      { t: 'c', q: 'I bought ___.', o: ['a car red', 'a red car'], a: 1, why: 'Adjetivo antes del sustantivo.' },
      { t: 'c', q: 'The dog hurt ___ leg.', o: ['its', 'it\'s', 'her'], a: 0, why: 'Its = de un animal o cosa (it\'s = it is).' },
      { t: 'c', q: 'We have three ___ patients today.', o: ['news', 'new'], a: 1, why: 'Adjetivo sin plural: new.' }
    ] },
  { id: 'behave', title: 'Be, not have: age, hungry, right',
    es: 'Estas sensaciones usan be: I\'m 24 (years old), I\'m hungry, I\'m thirsty, I\'m cold, I\'m hot, I\'m scared, I\'m sleepy. Tener razón: You\'re right.',
    ex: ['I\'m 24 years old.', 'I\'m hungry.', 'You\'re right.', 'She\'s afraid of needles.'],
    q: [
      { t: 'g', q: 'I ___ 24 years old.', a: ['am', '\'m'], why: 'La edad usa be.' },
      { t: 'c', q: 'I ___ hungry.', o: ['have', 'am'], a: 1, why: 'Be hungry.' },
      { t: 'c', q: 'You ___ right.', o: ['have', 'are'], a: 1, why: 'Be right.' },
      { t: 'c', q: 'Are you cold? Yes, I ___.', o: ['am', 'have'], a: 0, why: 'Be cold.' },
      { t: 'c', q: 'How old ___ you?', o: ['have', 'are'], a: 1, why: 'How old are you?' },
      { t: 'c', q: 'She ___ afraid of needles.', o: ['has', 'is'], a: 1, why: 'Be afraid of.' }
    ] },
  { id: 'passive', title: 'Passive voice (clinical English)',
    es: 'Be + participio cuando importa más la acción que quién la hace: The patient was admitted yesterday. The results will be sent tomorrow. Ojo: operate on → The patient was operated on (o mejor: had surgery).',
    ex: ['The patient was admitted last night.', 'The results will be sent tomorrow.', 'The tests were done yesterday.', 'This medicine must be taken with food.'],
    q: [
      { t: 'g', q: 'The patient ___ admitted last night. (was / were)', a: ['was'], why: 'Un paciente: was.' },
      { t: 'c', q: 'The results ___ sent tomorrow.', o: ['will be', 'will', 'are be'], a: 0, why: 'Futuro pasivo: will be + participio.' },
      { t: 'c', q: 'The tests ___ done yesterday.', o: ['was', 'were'], a: 1, why: 'Plural: were.' },
      { t: 'g', q: 'Antibiotics are ___ to treat infections. (use)', a: ['used'], why: 'Be + participio: used.' },
      { t: 'c', q: 'The patient ___ last week.', o: ['was operated', 'was operated on', 'operated'], a: 1, why: 'Operate on → was operated on.' },
      { t: 'c', q: 'This medicine must ___ with food.', o: ['take', 'be taken', 'taken'], a: 1, why: 'Modal pasivo: must be taken.' }
    ] }
];
