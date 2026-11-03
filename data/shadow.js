// Shadowing texts written for Alain's level and life. Users can add their own.
export const SHADOW = [
  { id: 'about', level: 'A2', title: 'About me',
    text: 'Hi, my name is Alain. I\'m a doctor from Mexico City. I work in telemedicine, so I see my patients online. I\'m learning English because I want to speak with confidence. In my free time, I make videos and go to the gym. One day, I want to work in Spain.' },
  { id: 'workday', level: 'A2', title: 'My workday',
    text: 'I leave home at seven thirty. The traffic is usually heavy, so I listen to podcasts in the car. I start work at nine. Most of my patients have colds, stomach problems or back pain. I have lunch at one thirty. I finish at six and get home at about seven thirty.' },
  { id: 'restaurant', level: 'A2', title: 'At a restaurant',
    text: 'Hi, can I get a table for two, please? Could we see the menu? I\'d like the chicken salad and a glass of water. Can I have the dressing on the side? Thank you. Excuse me, could we get the check, please?' },
  { id: 'patient', level: 'B1', title: 'A patient calls',
    text: 'Hi, doctor. I\'ve had a sore throat for three days. It started on Sunday night. Now I also have a runny nose and a mild fever. I took some ibuprofen yesterday, and it helped a little. I\'m not allergic to any medications. Do you think I need antibiotics?' },
  { id: 'explain', level: 'B1', title: 'Explaining a diagnosis',
    text: 'From what you\'re telling me, it sounds like a viral infection. The good news is that it usually gets better on its own in about a week. You don\'t need antibiotics right now. Drink plenty of fluids and get some rest. If the fever gets worse or you have trouble breathing, please go to the ER.' },
  { id: 'smalltalk', level: 'B1', title: 'Small talk',
    text: 'How was your weekend? Mine was pretty quiet, actually. I stayed home on Saturday and finally caught up on some sleep. On Sunday, I went out for tacos with my family. What about you? Did you do anything fun?' },
  { id: 'trip', level: 'B1', title: 'A trip to Oaxaca',
    text: 'Last year I traveled to Oaxaca with two friends. We took a night bus, and I couldn\'t sleep at all. When we arrived, the city looked amazing. We tried mole, walked around the market and visited Monte Albán. It was one of the best trips of my life.' },
  { id: 'spain', level: 'B1', title: 'Moving to Spain',
    text: 'Next year I\'m going to move to Spain. I\'ve already had my degree recognized, so now I\'m looking for a job. I\'m a little nervous, but I\'m also excited. I think living abroad will help me grow as a doctor and as a person. If everything goes well, I\'ll take the MIR exam in 2028.' },
  { id: 'connected', level: 'B2', title: 'Connected speech',
    text: 'What are you gonna do this weekend? I don\'t know yet. I wanna go out, but I\'ve gotta finish a video first. Let me think about it and I\'ll text you later, okay? Sounds good. Talk to you soon.' },
  { id: 'ai', level: 'B2', title: 'AI in medicine',
    text: 'I think artificial intelligence can be really useful in medicine. It helps doctors find information faster and notice details they might miss. However, it can make mistakes, so a doctor should always check its suggestions. In the end, the patient needs a person who listens and takes responsibility.' },
  { id: 'twisters', level: 'B1', title: 'Sound twisters',
    text: 'The sheep is on the ship. Cheap chips are not cheap ships. I think these three trees are thirty feet tall. Very good vegetables are very valuable. She sells seashells by the seashore. The cat cut the cot.' }
];

export function splitSentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'“¿¡])/)
    .map(s => s.trim())
    .filter(Boolean);
}
