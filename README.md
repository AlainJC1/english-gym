# English Gym

Alain's offline English training app (PWA): spaced-repetition cards, shadowing, sound and stress games, dictation checks, 4/3/2, voice diary, monthly samples, phrase inbox, mistake log, grammar, plan and progress.

All data is stored on the device (IndexedDB). Nothing is sent anywhere. AI practice opens Claude or Gemini with a ready prompt, and the answer can be pasted back to save mistakes and phrases.

## Install on iPhone
1. Open the site in Safari.
2. Tap Share, then **Add to Home Screen**.
3. Open it once from the Home Screen while online. After that it works offline.

## Deploy
Run `python3 build-sw.py` after any change so the offline cache updates, then push to the `main` branch (GitHub Pages serves the repository root).
