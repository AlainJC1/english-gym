// Plan content shared by the app screens.

export const CATS = [
  { id: 'listen', label: 'Listening', group: 'input' },
  { id: 'watch', label: 'Watching', group: 'input' },
  { id: 'read', label: 'Reading', group: 'input' },
  { id: 'pron', label: 'Pronunciation', group: 'output' },
  { id: 'speak', label: 'Speaking', group: 'output' },
  { id: 'tutor', label: 'Tutor', group: 'output' },
  { id: 'write', label: 'Writing', group: 'output' },
  { id: 'anki', label: 'Cards', group: 'study' },
  { id: 'grammar', label: 'Grammar', group: 'study' }
];

export const GROUPS = [
  { id: 'input', label: 'Input', color: 'var(--input)' },
  { id: 'output', label: 'Output', color: 'var(--accent)' },
  { id: 'study', label: 'Study', color: 'var(--study)' }
];

function P(cat, min, text, link) { return { cat, min, text, link: link || null }; }
const CARDS = 'Review your cards + 10 new';
export const PLAN_CAR = {
  1: [P('anki', 15, CARDS, 'cards/study'), P('pron', 15, 'Shadowing on the commute', 'pron'), P('speak', 45, 'AI chat on the commute + 8:30 pm chat with feedback', 'speak'), P('listen', 120, 'Podcasts on the commute')],
  2: [P('anki', 15, CARDS, 'cards/study'), P('pron', 15, 'Shadowing on the commute', 'pron'), P('speak', 15, 'AI chat on the commute', 'speak'), P('tutor', 45, 'Tutor class, 8:30 pm'), P('listen', 120, 'Podcasts on the commute')],
  3: [P('anki', 15, CARDS, 'cards/study'), P('pron', 25, 'Shadowing + sound pairs', 'pron'), P('speak', 35, 'AI chat on the commute + 4/3/2 at 8:30 pm', 'speak/432'), P('listen', 120, 'Podcasts on the commute')],
  4: [P('anki', 15, CARDS, 'cards/study'), P('pron', 15, 'Shadowing on the commute', 'pron'), P('speak', 45, 'AI chat + telehealth role-play', 'speak'), P('listen', 120, 'Podcasts on the commute')],
  5: [P('anki', 15, CARDS, 'cards/study'), P('pron', 15, 'Shadowing on the commute', 'pron'), P('speak', 15, 'AI chat on the commute', 'speak'), P('listen', 120, 'Podcasts on the commute; no evening block')],
  6: [P('anki', 15, CARDS, 'cards/study'), P('tutor', 60, 'Tutor class, 10:00 am'), P('write', 30, '250 words + AI correction', 'speak/write'), P('grammar', 20, 'Grammar lesson of the week', 'more/grammar'), P('watch', 90, 'A movie or 2 episodes, English subtitles')],
  0: [P('anki', 15, CARDS, 'cards/study'), P('speak', 10, 'Voice diary or monthly sample', 'speak'), P('pron', 30, 'Long shadowing or sound pairs', 'pron'), P('watch', 45, 'One episode (optional)')]
};
export const PLAN_TRANSIT = {
  1: [P('anki', 15, CARDS, 'cards/study'), P('pron', 15, 'Quiet shadowing on the commute', 'pron'), P('speak', 30, '8:30 pm chat with feedback', 'speak'), P('listen', 135, 'Podcasts with transcript on the commute')],
  2: [P('anki', 15, CARDS, 'cards/study'), P('pron', 15, 'Quiet shadowing on the commute', 'pron'), P('tutor', 45, 'Tutor class, 8:30 pm'), P('listen', 135, 'Podcasts with transcript on the commute')],
  3: [P('anki', 15, CARDS, 'cards/study'), P('pron', 25, 'Quiet shadowing + sound pairs', 'pron'), P('speak', 20, '4/3/2 at 8:30 pm', 'speak/432'), P('listen', 135, 'Podcasts with transcript on the commute')],
  4: [P('anki', 15, CARDS, 'cards/study'), P('pron', 15, 'Quiet shadowing on the commute', 'pron'), P('speak', 30, 'Telehealth role-play', 'speak'), P('listen', 135, 'Podcasts with transcript on the commute')],
  5: [P('anki', 15, CARDS, 'cards/study'), P('pron', 15, 'Quiet shadowing on the commute', 'pron'), P('listen', 135, 'Podcasts; no evening block')],
  6: PLAN_CAR[6],
  0: PLAN_CAR[0]
};

// Phase 1, week by week. soundRoute/grammarId point into the app.
export const WEEKS = [
  { sound: 'Long and short i: sheep vs ship', soundRoute: 'pron/pairs/iy-ih', grammar: 'Present simple vs continuous', grammarId: 'pres', topic: 'Introduce yourself and describe your job' },
  { sound: 'Word stress and the schwa', soundRoute: 'pron/stress', grammar: 'Past simple and -ed endings', grammarId: 'past', topic: 'Your day yesterday' },
  { sound: 'cat, cut, cot', soundRoute: 'pron/pairs/ae-ah-aa', grammar: 'Present perfect, for and since', grammarId: 'presperf', topic: 'Experiences: "Have you ever...?"' },
  { sound: 'No "e" before s: school, Spain', soundRoute: 'pron/say/s-start', grammar: 'Articles and the subject "it"', grammarId: 'articles', topic: 'Describe Mexico City to a tourist' },
  { sound: 'b vs v, and s vs z', soundRoute: 'pron/pairs/b-v', grammar: 'Countable and uncountable nouns', grammarId: 'count', topic: 'Give someone recommendations' },
  { sound: 'she, cheese, job, yes', soundRoute: 'pron/pairs/sh-ch', grammar: 'The future: will, going to, present continuous', grammarId: 'future', topic: 'Your plans: Spain, the MIR, your channels' },
  { sound: 'th: think, this', soundRoute: 'pron/pairs/th-t', grammar: 'Comparatives and superlatives', grammarId: 'compare', topic: 'Compare two options in your life or work' },
  { sound: 'Sentence stress', soundRoute: 'pron/shadow/workday', grammar: 'Modals: should, must, have to, might', grammarId: 'modals', topic: 'Health advice for a patient' },
  { sound: 'Weak forms and linking', soundRoute: 'pron/shadow/connected', grammar: 'Gerund vs infinitive', grammarId: 'gerund', topic: 'Your habits and the things you like' },
  { sound: 'American T and reductions (gonna)', soundRoute: 'pron/shadow/connected', grammar: 'Conditionals 0, 1 and 2', grammarId: 'cond', topic: '"What would you do if...?"' },
  { sound: 'Intonation: questions, lists, emphasis', soundRoute: 'pron/shadow/smalltalk', grammar: 'Prepositions', grammarId: 'preps', topic: 'Tell a long story with 4/3/2' },
  { sound: 'Review all sounds', soundRoute: 'pron', grammar: 'Review: your 5 most frequent mistakes', grammarId: null, topic: 'Repeat your baseline recording and compare' }
];

export const MONTH_FOCUS = {
  2: 'Top phrasal verbs in context; tell 3 to 5 minute stories',
  3: 'Connected speech and discourse markers (actually, the thing is, on the other hand)',
  4: 'Speed: daily 4/3/2 and native podcasts at 1x; month 6 checkpoint',
  5: 'Advanced collocations; clinical English with patients',
  6: 'Formal register: emails, presentations, passive voice, mixed conditionals',
  7: 'Fossilized mistakes from your log; British and Australian accents; month 9 checkpoint',
  8: 'English-only weekends; series without subtitles',
  9: 'Humor and culture: stand-up and late-night shows; long debates',
  10: 'Mock exam, month 12 checkpoint and your C1 to C2 plan',
  11: 'Keep the routine; plan your C1 to C2 year',
  12: 'Keep the routine; plan your C1 to C2 year',
  1: 'Keep the routine; review your mistake log'
};

export const EXTRA_TOPICS = [
  'The best and worst parts of telemedicine',
  'A patient case you learned from (no names)',
  'How social media changed your life',
  'Should AI replace some doctors?',
  'Your dream day in Spain',
  'A mistake that taught you something',
  'How to stay healthy with a busy job',
  'The story of one of your videos',
  'Mexican food explained to a foreigner',
  'What makes a good doctor?',
  'Your favorite series and why',
  'Living alone vs living with family'
];

export const CHECKS = [
  { off: -6, label: 'Baseline', goal: 'EF SET + baseline recording' },
  { off: 83, label: 'Month 3', goal: 'B1 speaking · EF SET +5' },
  { off: 172, label: 'Month 6', goal: 'B2 speaking · EF SET 61+' },
  { off: 264, label: 'Month 9', goal: 'B2+ speaking · EF SET 66+' },
  { off: 356, label: 'Month 12', goal: 'C1 speaking · EF SET 70+' }
];

export const MILESTONES = [10, 25, 50, 100, 250, 500, 750, 1000, 1500, 2000, 3000];

export const SAMPLE_QUESTIONS = [
  'Introduce yourself and describe a normal workday. (1 min)',
  'Tell me about a memorable patient or trip, without names. (1 min)',
  'Should doctors use AI in consultations? Why or why not? (1 min)'
];

export const DIARY_PROMPTS = [
  'What did you do today, from the morning until now?',
  'What was the best and the worst part of your day?',
  'Tell me about a patient problem you solved today (no names).',
  'What are you going to do tomorrow?',
  'What did you learn this week?',
  'Describe something you watched or listened to today.'
];

// Block the app reads back when you paste an AI answer.
const SAVE_BLOCK = `At the very end of your feedback, add a block I can copy into my app, exactly in this format (one item per line, no extra text inside the block):
===SAVE===
MISTAKE: what I said | correct version | short rule
PHRASE: useful English phrase | Spanish translation
===END===`;

const BASE = `I'm Alain, a 24-year-old Mexican doctor (general practitioner doing telemedicine). My English is A2–B1: I understand much more than I can say, and my goal is to speak fluently and naturally.
Use natural, everyday American English, slightly above my level. Keep your turns short (1–3 sentences) and usually end with a question, so I speak much more than you.
Do NOT correct me during the conversation. If you don't understand me, ask me to rephrase.
When I say "feedback", stop and give me: (1) my 5 most important mistakes with the corrected version, (2) 3 things I said correctly but unnaturally, and how a native speaker would say them, (3) 5 useful phrases from our conversation with their Spanish translation.
${SAVE_BLOCK}`;

export const AI_SCENARIOS = [
  { id: 'daily', title: 'Daily chat', desc: 'A friendly chat about your day and plans.',
    prompt: `${BASE}\n\nLet's chat like friends about my day, my plans or anything I bring up. Start now with a short greeting and one question.` },
  { id: 'topic', title: 'Topic of the week', desc: 'Conversation about this week\'s topic.', usesTopic: true,
    prompt: `${BASE}\n\nTopic: {TOPIC}. Start now with one question about the topic.` },
  { id: 'patient', title: 'Telehealth patient', desc: 'You take the history; the AI is the patient.',
    prompt: `Let's role-play a telemedicine consultation. You are an English-speaking patient, an American tourist in Mexico City. Choose a common problem (for example: sore throat, urinary symptoms, traveler's diarrhea, low back pain, a rash) but don't tell me the diagnosis. I'm the doctor and I'll take your history in English. I'm a Mexican doctor with A2–B1 English.
Answer like a real patient: everyday words, no medical terms, sometimes vague or worried. Keep answers short. If I use a word a patient wouldn't understand, act confused.
When I say "feedback": tell me (1) my English mistakes, (2) questions I asked unnaturally and the natural way to ask them, (3) patient-friendly phrases I should learn, with Spanish translation.
${SAVE_BLOCK}

Start now: greet me as the patient and say why you're calling.` },
  { id: 'explain', title: 'Explain a diagnosis', desc: 'Practice explaining in plain English.',
    prompt: `I'm a Mexican doctor (A2–B1 English) and I'm going to explain diagnoses to a patient in plain English. Pretend you're a patient with no medical background. After each explanation, tell me which words were too technical, what you didn't understand, and give me the simpler words a native-speaking doctor would use. Keep it short.
When I say "feedback", summarize my mistakes and the best patient-friendly phrases with Spanish translation.
${SAVE_BLOCK}

Start now: tell me your main symptom and ask me what's wrong.` },
  { id: 'debate', title: 'Friendly debate', desc: 'Defend your opinion (from phase 2).', usesTopic: true,
    prompt: `${BASE}\n\nLet's have a friendly debate about: {TOPIC}. You take the opposite side. Challenge my arguments with follow-up questions and ask me for examples. Use discourse markers I can copy, like "That's a fair point, but...". Start now with your position in two sentences and a question.` },
  { id: 'interview', title: 'Job interview', desc: 'Interview for a doctor job at an international clinic.',
    prompt: `${BASE}\n\nYou are a hiring manager at an international clinic in Spain that treats English-speaking patients, interviewing me for a general practitioner position. Ask one realistic interview question at a time and react naturally to my answers. Start now.` },
  { id: '432', title: '4/3/2 coach', desc: 'Same story in 4, 3 and 2 minutes.', usesTopic: true,
    prompt: `I'm going to practice the 4/3/2 technique. I'll tell you the same story three times: in 4 minutes, then 3, then 2. The topic is: {TOPIC}. Don't interrupt me; after each version just say "Next". After the third one, compare the versions: did I get more fluent? Which mistakes did I repeat? Give me 3 better ways to say the parts where I hesitated.
${SAVE_BLOCK}` }
];

export const WRITE_PROMPT = `Correct my text. I'm a Mexican doctor learning English (A2–B1). First, show my text with corrections marked like this: [wrong → right]. Then list the 3 patterns behind my mistakes, each with a short explanation in simple English and one extra example. Don't change my ideas or my style, and don't rewrite the whole text. Finally, give me a more natural version of my two weakest sentences.
${SAVE_BLOCK}

My text:
{TEXT}`;

export const SAMPLE_PROMPT = `This is the transcript of my monthly English speaking sample (I'm a Mexican doctor, A2–B1, learning to speak fluently). It lasted {SECONDS} seconds. The dictation software may have misheard some words: words that look wrong may be pronunciation problems.
Please give me: (1) words per minute, (2) Spanish words or long pauses you can detect, (3) my 5 most important grammar or vocabulary mistakes with corrections, (4) words that were probably mispronounced, (5) an estimate of my speaking level (CEFR) with one sentence of reasoning, (6) 3 things to focus on next month.
${SAVE_BLOCK}

Transcript:
{TEXT}`;

export const TRANSLATE_PROMPT = `Translate these English phrases into natural Mexican Spanish. Answer ONLY with this block, one line per phrase, keeping my English exactly as written:
===SAVE===
PHRASE: English phrase | Spanish translation
===END===

Phrases:
{TEXT}`;

export const GUIDE = [
  { title: 'The goal', body: 'Solid C1 speaking by October 31, 2027: fluent, professional English with a clear accent. Four phases of three months, with a checkpoint at the end of each one.' },
  { title: 'The 4 engines, every day', body: '1. Input: listen and read a lot of content you almost fully understand (commute, gym).\n2. Output: speak every day with AI, plus 2–3 tutor classes a week.\n3. Pronunciation: 15–20 minutes of shadowing and sound training.\n4. Memory: 15 minutes of cards and your mistake log.\nCommute time is 100% input. Home time is mostly for speaking. If you can only do one thing, speak.' },
  { title: 'Phases', body: 'Phase 1 · Unlock (Nov–Jan): core pronunciation, key phrases, core grammar, speaking every day.\nPhase 2 · Fluency (Feb–Apr): speak longer and faster, phrasal verbs, connected speech.\nPhase 3 · Accuracy (May–Jul): remove fossilized mistakes, collocations, formal register, clinical English.\nPhase 4 · Immersion (Aug–Oct): think in English, English-only days, no subtitles.' },
  { title: 'Shadowing', body: 'Listen once without text. Listen while reading. Speak over the audio half a second behind, copying rhythm and intonation. Repeat 3–5 times without text. Record yourself once and pick one thing to fix tomorrow. Use the same text for 3–5 days.' },
  { title: '4/3/2', body: 'Tell the same story three times in a row: in 4, 3 and 2 minutes. Repeating the talk with less time builds fluency that lasts.' },
  { title: 'Tutor classes', body: 'You speak 80% of the time. Ask the tutor to write your mistakes in the chat. At the end, ask for your 3 most frequent mistakes and put them in your mistake log.\nMessage for your tutor: "I\'m a B1 speaker. I want to speak 80% of the time. Please write my mistakes in the chat while I speak, and interrupt me only if you can\'t understand me. At the end, tell me my three most frequent mistakes."' },
  { title: 'Golden rules', body: 'Never two days in a row at zero: the minimum day is 15 minutes.\nSubtitles in English, never in Spanish.\nEvery correction becomes a card.\nPhrases, not single words.\nIf you get bored, change the material, not the method.\nProtect the MIR: English uses dead time, not study hours.' }
];

export const PLAN_DOC_URL = 'https://claude.ai/artifact/FEAEXpLBvKynQ7x76TY8S4';
