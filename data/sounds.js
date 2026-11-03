// Sound training data. Pair games use many voices (high variability training).
export const CONTRASTS = [
  { id: 'iy-ih', title: 'sheep vs ship', labels: ['/iː/ long', '/ɪ/ short'], tip: '/iː/ is long with a smile. /ɪ/ is short and relaxed, closer to Spanish "e" than "i".',
    items: [['sheep', 'ship'], ['leave', 'live'], ['feel', 'fill'], ['seat', 'sit'], ['beat', 'bit'], ['heat', 'hit'], ['eat', 'it'], ['sleep', 'slip'], ['cheap', 'chip'], ['peak', 'pick'], ['green', 'grin'], ['wheel', 'will'], ['bean', 'bin'], ['deep', 'dip'], ['feet', 'fit'], ['meal', 'mill'], ['heel', 'hill'], ['least', 'list'], ['leak', 'lick'], ['seek', 'sick'], ['steal', 'still']] },
  { id: 'ae-ah-aa', title: 'cat, cut, cot', labels: ['/æ/ cat', '/ʌ/ cut', '/ɑ/ cot'], tip: '/æ/: open your mouth wide and smile. /ʌ/: short and relaxed, like a quick "a". /ɑ/: open and back, like a doctor saying "say ahh".',
    items: [['cat', 'cut', 'cot'], ['cap', 'cup', 'cop'], ['hat', 'hut', 'hot'], ['lack', 'luck', 'lock'], ['sack', 'suck', 'sock'], ['bat', 'but', 'bot'], ['cab', 'cub', 'cob'], ['fan', 'fun'], ['match', 'much'], ['track', 'truck'], ['bad', 'bud'], ['ran', 'run'], ['duck', 'dock'], ['nut', 'not'], ['shut', 'shot']] },
  { id: 'b-v', title: 'berry vs very', labels: ['/b/ lips', '/v/ teeth'], tip: '/b/: both lips. /v/: top teeth on your bottom lip, and let it vibrate.',
    items: [['berry', 'very'], ['best', 'vest'], ['boat', 'vote'], ['ban', 'van'], ['bet', 'vet'], ['base', 'vase'], ['bent', 'vent'], ['curb', 'curve'], ['bat', 'vat'], ['bolt', 'volt']] },
  { id: 's-z', title: 'price vs prize', labels: ['/s/ hiss', '/z/ buzz'], tip: '/s/ is air only, like a snake. /z/ buzzes like a bee: your throat vibrates.',
    items: [['sip', 'zip'], ['sue', 'zoo'], ['bus', 'buzz'], ['price', 'prize'], ['place', 'plays'], ['rice', 'rise'], ['ice', 'eyes'], ['loose', 'lose'], ['peace', 'peas'], ['face', 'phase'], ['racer', 'razor']] },
  { id: 'sh-ch', title: 'ship vs chip', labels: ['/ʃ/ shh', '/tʃ/ ch'], tip: '/ʃ/ is a soft continuous "shh". /tʃ/ starts with a stop, like Spanish "ch".',
    items: [['ship', 'chip'], ['shoes', 'choose'], ['share', 'chair'], ['wash', 'watch'], ['cash', 'catch'], ['sheep', 'cheap'], ['shop', 'chop'], ['wish', 'witch'], ['sheet', 'cheat']] },
  { id: 'j-y', title: 'jet vs yet', labels: ['/dʒ/ job', '/j/ yes'], tip: '/dʒ/ like "dy" with a stop (job). /j/ is soft, like Spanish "i" in "hielo" (yes).',
    items: [['jet', 'yet'], ['jam', 'yam'], ['jail', 'Yale'], ['joke', 'yolk'], ['jello', 'yellow'], ['Jess', 'yes'], ['jaw', 'yaw']] },
  { id: 'th-t', title: 'three vs tree', labels: ['/θ/ th', '/t/ t'], tip: '/θ/: tongue between your teeth and blow air. /t/: tongue behind your top teeth.',
    items: [['three', 'tree'], ['thin', 'tin'], ['thank', 'tank'], ['thought', 'taught'], ['bath', 'bat'], ['both', 'boat'], ['path', 'pat'], ['math', 'mat'], ['tenth', 'tent'], ['through', 'true'], ['theme', 'team'], ['thick', 'tick']] },
  { id: 'th-d', title: 'they vs day', labels: ['/ð/ th', '/d/ d'], tip: '/ð/: tongue between your teeth and let it vibrate. /d/: tongue behind your top teeth.',
    items: [['they', 'day'], ['then', 'den'], ['those', 'doze'], ['there', 'dare'], ['though', 'dough'], ['breathe', 'breed'], ['worthy', 'wordy'], ['than', 'Dan']] },
  { id: 'p-b', title: 'pin vs bin', labels: ['/p/ puff', '/b/ no puff'], tip: 'English p, t and k at the start of a word have a puff of air. Without it, people hear b, d and g.',
    items: [['pin', 'bin'], ['pear', 'bear'], ['park', 'bark'], ['pie', 'buy'], ['pat', 'bat'], ['peach', 'beach'], ['pull', 'bull'], ['pig', 'big'], ['pack', 'back']] },
  { id: 'h-none', title: 'hair vs air', labels: ['with /h/', 'no /h/'], tip: 'English h is just soft air, never a strong Spanish "j". Don\'t drop it either.',
    items: [['hair', 'air'], ['heat', 'eat'], ['hold', 'old'], ['high', 'eye'], ['heart', 'art'], ['hate', 'eight'], ['hear', 'ear'], ['hand', 'and'], ['harm', 'arm']] }
];

// Category game: which -ed ending do you hear?
export const ED_GAME = {
  id: 'ed', title: '-ed endings', labels: ['/t/', '/d/', '/ɪd/'], tip: '/t/ after k, p, s, sh, ch, f (worked). /ɪd/ after t or d (needed). /d/ after everything else (played).',
  words: [['worked', 0], ['stopped', 0], ['washed', 0], ['watched', 0], ['laughed', 0], ['missed', 0], ['helped', 0], ['asked', 0], ['played', 1], ['called', 1], ['lived', 1], ['cleaned', 1], ['opened', 1], ['smiled', 1], ['changed', 1], ['studied', 1], ['needed', 2], ['wanted', 2], ['started', 2], ['decided', 2], ['waited', 2], ['visited', 2], ['added', 2], ['treated', 2]]
};

export const STRESS = [
  ['photograph', ['pho', 'to', 'graph'], 0], ['photography', ['pho', 'to', 'gra', 'phy'], 1], ['photographer', ['pho', 'to', 'gra', 'pher'], 1],
  ['comfortable', ['comf', 'ta', 'ble'], 0], ['develop', ['de', 'vel', 'op'], 1], ['vegetable', ['veg', 'ta', 'ble'], 0],
  ['interesting', ['in', 'trest', 'ing'], 0], ['hotel', ['ho', 'tel'], 1], ['important', ['im', 'por', 'tant'], 1],
  ['economy', ['e', 'con', 'o', 'my'], 1], ['economic', ['e', 'co', 'nom', 'ic'], 2], ['hospital', ['hos', 'pi', 'tal'], 0],
  ['pharmacy', ['phar', 'ma', 'cy'], 0], ['medicine', ['med', 'i', 'cine'], 0], ['diagnosis', ['di', 'ag', 'no', 'sis'], 2],
  ['prescription', ['pre', 'scrip', 'tion'], 1], ['appointment', ['ap', 'point', 'ment'], 1], ['emergency', ['e', 'mer', 'gen', 'cy'], 1],
  ['allergic', ['al', 'ler', 'gic'], 1], ['allergy', ['al', 'ler', 'gy'], 0], ['symptom', ['symp', 'tom'], 0],
  ['banana', ['ba', 'na', 'na'], 1], ['computer', ['com', 'pu', 'ter'], 1], ['information', ['in', 'for', 'ma', 'tion'], 2],
  ['available', ['a', 'vail', 'a', 'ble'], 1], ['hamburger', ['ham', 'bur', 'ger'], 0], ['Canada', ['Can', 'a', 'da'], 0],
  ['Canadian', ['Ca', 'na', 'di', 'an'], 1], ['Mexico', ['Mex', 'i', 'co'], 0], ['Japanese', ['Jap', 'a', 'nese'], 2],
  ['document', ['doc', 'u', 'ment'], 0], ['analysis', ['a', 'nal', 'y', 'sis'], 1], ['analyze', ['an', 'a', 'lyze'], 0],
  ['success', ['suc', 'cess'], 1], ['percent', ['per', 'cent'], 1], ['problem', ['prob', 'lem'], 0],
  ['chocolate', ['choc', 'o', 'late'], 0], ['family', ['fam', 'i', 'ly'], 0], ['career', ['ca', 'reer'], 1],
  ['idea', ['i', 'de', 'a'], 1], ['opportunity', ['op', 'por', 'tu', 'ni', 'ty'], 2], ['patient', ['pa', 'tient'], 0]
];

// "Say it" drills: say the word; the iPhone dictation shows what it heard.
export const SAY_SETS = [
  { id: 's-start', title: 'No "e" before s', tip: 'Start with a long "sss", never "es": ssschool, not eschool.',
    words: ['school', 'Spain', 'study', 'speak', 'student', 'street', 'special', 'stress', 'sport', 'skin', 'stomach', 'smile', 'small', 'snack', 'sleep', 'stop', 'space', 'Spanish'] },
  { id: 'th-say', title: 'th sounds', tip: 'Put your tongue between your teeth.',
    words: ['three', 'think', 'thank you', 'Thursday', 'birthday', 'healthy', 'month', 'they', 'mother', 'weather', 'together', 'breathe'] },
  { id: 'v-say', title: 'v sound', tip: 'Top teeth on your bottom lip.',
    words: ['very', 'voice', 'video', 'visit', 'never', 'every', 'heavy', 'travel', 'vitamin', 'vomit', 'cover', 'seven'] },
  { id: 'vowels-say', title: 'Long vs short vowels', tip: 'Make long vowels really long, and short ones short and relaxed.',
    words: ['sheep', 'ship', 'feel', 'fill', 'leave', 'live', 'cat', 'cut', 'hot', 'full', 'fool', 'beach'] },
  { id: 'medical-say', title: 'Medical words', tip: 'Check the stress first in Word stress.',
    words: ['appointment', 'prescription', 'allergic', 'symptoms', 'pharmacy', 'diagnosis', 'emergency room', 'blood pressure', 'shortness of breath', 'throat', 'stomach ache', 'fever'] }
];
