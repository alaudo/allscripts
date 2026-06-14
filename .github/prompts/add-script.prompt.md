---
mode: agent
description: End-to-end guide for adding a new writing system to allScripts. Covers data files, schema, localization rules, and the conventions that learners depend on (especially the international-words principle).
---

# Add a new script to allScripts

You're adding a **new writing system** (e.g. Tibetan, Mongolian Bichig, Ge'ez, Tifinagh, …) to the **allScripts** app. The app is a pure static HTML/JS/CSS site that teaches scripts via flashcards (SRS), multiple-choice "Choose" drills, type-in-transcription / type-in-script exercises, and reference previews.

Everything you add is **data** (JSON). No JS or CSS changes are required for a new script unless it has a quirk like Hangul-style syllable composition (see §8).

---

## 0. Before you start — gather these inputs from the user

Ask if anything is missing:

1. **Script name** in English and Russian (e.g. "Tibetan" / "Тибетский").
2. **Native self-name** (e.g. `བོད་ཡིག`).
3. **A short `id`** in lowercase ASCII, used as the JSON key everywhere (`tibetan`, `mongolian_bichig`, `geez`). No spaces, no diacritics. Stable forever — don't change it later or you'll orphan saved progress.
4. **Primary language** ISO 639-1/639-3 code (`bo`, `mn`, `am`, …).
5. **Direction**: `"ltr"`, `"rtl"`, or `"ttb"` (top-to-bottom). The current renderer only really supports ltr and rtl; ttb falls back to ltr.
6. **Countries** where the script is used, each with a flag emoji and localized name.
7. **A short history blurb** and a **longer "how the script works" composition** — both in English **and** Russian (see §3).

If the user is unsure on any of these, propose a sensible default and proceed.

---

## 1. Files you will touch

| File | What you do |
|---|---|
| `data/manifest.json` | **Add** one entry to the `scripts[]` array. |
| `data/scripts/<id>.json` | **Create** — letters and curated example words for the script. |
| `data/phrases.json` | **Add** the script under `scripts.<id>.phrases` with the 20 canonical phrases (see §6). |
| `data/words-international.json` | **Add** a `forms.<id>` block under every existing `entries[*]` (29 of them — see §5). |

No JS or CSS is normally touched. Only edit `js/modes/preview-letters.js` if the script needs syllable decomposition for letter-to-word matching (Hangul-style — see §8).

---

## 2. `data/manifest.json` — script entry

Add an object to `scripts[]`. Schema:

```json
{
  "id": "<id>",
  "name": { "en": "<English name>", "ru": "<Russian name>" },
  "nativeName": "<native self-name>",
  "language": "<ISO code>",
  "direction": "ltr" | "rtl",
  "file": "scripts/<id>.json",
  "info": {
    "en": "<historical/cultural blurb, 2–3 sentences>",
    "ru": "<same in Russian>"
  },
  "composition": {
    "en": "<longer 'how it works' description, 4–6 sentences>",
    "ru": "<same in Russian>"
  },
  "countries": [
    { "flag": "🇨🇳", "name": { "en": "China", "ru": "Китай" } },
    ...
  ]
}
```

### 2.1 `info` (history blurb) — keep it tight

2–3 sentences: when/where the script appeared, who created or adapted it, what languages it serves. **Self-contained** — don't say "also descended from…" or "unlike X above…"; the user may not have read the others.

### 2.2 `composition` (how the script works) — the linguistics

4–6 sentences explaining the **mechanics** so a Latin/Cyrillic-trained reader knows what to expect. Cover whichever of these apply:

- **Type**: alphabet / abjad (consonants only) / abugida (consonant + inherent vowel + matras) / syllabary / featural / logographic.
- **Case**: bicameral (upper/lower) or unicameral.
- **Direction & cursivity**: connected/cursive, contextual letter forms (initial/medial/final/isolated), non-joining letters.
- **Special positional forms**: final-only letters (Hebrew ך ם ן ף ץ, Greek ς).
- **Vowel handling**: marked with diacritics? Inherent? Matres lectionis?
- **Diacritics & tone marks**: when used, when optional (e.g. Arabic ḥarakāt, Hebrew niqqud, Thai tone marks, Greek tonos).
- **Composition into syllable blocks**: Hangul-style stacking, Devanagari ligatures + shirorekhā, Thai vowels around the consonant.
- **Phonemic consistency**: one letter / one sound, or many-to-one (e.g. Greek η ι υ ει οι all = /i/, Thai redundant consonants for tone).
- **Punctuation oddities** (Armenian ։ ՞ ՜ ; Georgian Mtavruli "caps"; Thai no word spaces).

**Self-contained** — must read sensibly even if no other script's composition has been viewed.

### 2.3 Localization

**Everything user-facing** in this entry must exist in both `en` and `ru`. That includes `name`, `info`, `composition`, and every `countries[*].name`. The renderer falls back to `en` if `ru` is missing, but adding both up front is mandatory.

---

## 3. `data/scripts/<id>.json` — letters and curated words

Create one file per script. Top-level shape:

```json
{
  "id": "<id>",
  "letters": [ ... ],
  "words":   [ ... ]
}
```

### 3.1 `letters[]` — every letter, in the conventional order of the script

```json
{
  "glyph":   "Α α",
  "ipa":     "a",
  "latin":   "a",
  "cyrillic": "а",
  "example": {
    "native":   "αγάπη",
    "ipa":      "aˈɣapi",
    "latin":    "agapi",
    "cyrillic": "агапи",
    "meaning":  { "en": "love", "ru": "любовь" }
  },
  "note": { "en": "<optional cultural/phonetic note>", "ru": "<same in Russian>" }
}
```

**Rules**:

- **`glyph`** — show **both cases together** for bicameral scripts (`"Α α"`, `"Б б"`). For unicameral scripts (Georgian, Arabic, Hebrew, Devanagari, Thai, …) just the single character. For abjads with positional forms, include the isolated form here; positional forms can be described in `note`.
- **`ipa`** — narrow IPA. Use the modern, standard pronunciation, not historical (e.g. Greek η → `i`, not `ɛː`).
- **`latin`** — a one- or two-letter ASCII transliteration ("Reader Latin"). Pick whatever a learner would type on an English keyboard, not a strict academic system. Examples: Greek `χ` → `ch`, Russian `щ` → `shch`, Arabic `ث` → `th`.
- **`cyrillic`** — a one- or two-letter Russian-keyboard re-spelling of the same sound. For Russian itself this just echoes the letter.
- **`example`** — one short native word that starts with or features this letter prominently. Provide all four fields (`native`, `ipa`, `latin`, `cyrillic`) plus a localized `meaning`. The example word reappears in flashcards.
- **`note`** — only when something genuinely surprises a learner: false friend, unusual phoneme, positional form (e.g. Greek `ς`), aspirate vs. unaspirate, hidden vowel, etc. **Must be `{en, ru}`** — never a bare string.
- **Order** matches the script's standard alphabetical / Unicode order (alpha → omega, alef → tav, ka → ha, …). Don't sort by frequency.
- **Marks and tone signs** can appear as their own letters (e.g. Hebrew niqqud, Arabic ḥarakāt, Thai tone marks). Use the standalone form. The preview's "Marks" filter category catches anything that's a combining mark in Unicode.

### 3.2 `words[]` — curated, script-specific words (10–20 is a good size)

Same fields as `example` above (minus the nested `meaning` schema is identical):

```json
{ "native": "καλημέρα", "ipa": "kaliˈmera", "latin": "kalimera", "cyrillic": "калимэра", "meaning": { "en": "good morning", "ru": "доброе утро" } }
```

These are **curated**: idiomatic, culturally specific words that show off the script (greetings, food, common verbs, place names). They are independent of the international-loanword pool from `words-international.json`.

### 3.3 Validation checklist for `scripts/<id>.json`

- File is valid JSON (`node -e "JSON.parse(require('fs').readFileSync('data/scripts/<id>.json','utf8'))"`).
- Every letter has `glyph`, `ipa`, `latin`, `cyrillic`, `example`.
- Every `example.meaning` is `{en, ru}`.
- Every `note`, if present, is `{en, ru}`.
- Every `words[].meaning` is `{en, ru}`.
- No empty strings in required fields.

---

## 4. Transcription fields — consistency rules

Three transcription systems coexist on every letter, example, word, and phrase. The user toggles between them.

| Field | Purpose | Audience |
|---|---|---|
| `ipa` | Narrow phonetic transcription | Linguists, language learners |
| `latin` | Practical English-keyboard re-spelling | English speakers |
| `cyrillic` | Practical Russian-keyboard re-spelling | Russian speakers |

**Be consistent within the script**: if you romanize Arabic `ج` as `j` in the letter row, romanize it as `j` everywhere it appears in `example`, `words` and `phrases`. Same for `cyrillic`.

For `latin` and `cyrillic`, **prefer readability over academic accuracy**. Use ASCII-only for `latin` (no `š`, `ž`, no IPA), and use plain Russian letters for `cyrillic` (no Old Cyrillic or extended chars unless the script genuinely needs them).

---

## 5. `data/words-international.json` — the international loanword pool

This file holds **29 universal concepts** (taxi, metro, coffee, hospital, computer, …) that exist as loanwords across most languages. The user toggles between curated and international pools in the Preview Words and Choose Word screens, so **every script should provide a `forms.<id>` block for every entry**.

### 5.1 The principle of "international words" — read this twice

The whole point of these entries is **letter-recognition practice with familiar words**. A Russian-speaking learner of Greek who sees `τηλέφωνο` recognizes "телефон" and only has to decode the spelling — they already know the word.

**Therefore: prefer loanwords / transliterations / neologisms over indigenous synonyms.**

Examples of what to do and what NOT to do:

| Concept | ✅ Pick the loanword | ❌ Don't pick the indigenous word |
|---|---|---|
| `hospital` (Russian) | `госпиталь` | `больница` |
| `university` (Greek) | `πανεπιστήμιο` (international Greek-built compound, still recognisable) | a purely native paraphrase |
| `doctor` (Hebrew) | `דוקטור` | `רופא` |
| `bank` (Hangul) | `은행` is conventional but `뱅크` exists too — prefer whichever is more **loan-like** and recognisable, here `은행` is fine because the loanword `뱅크` is too rare. **Use editorial judgment.** | — |
| `mama` (Georgian) | `დედა` is intentionally kept native — see exception below | (false-friend exception) |

**Exceptions where indigenous beats loan**:

- **Hiragana**: Japanese real-life convention writes loanwords in katakana, but this app uses hiragana for everything; spell loans in hiragana with the long-vowel mark `ー` (e.g. `たくしー`, `こーひー`, `らじお`). Stay consistent.
- **Georgian mama / papa**: `მამა` (mama) in Georgian means **father**, and `დედა` (deda) means mother. We keep these indigenous to highlight the false-friend lesson — the entry's `note` explains it.
- **Devanagari `अस्पताल` (hospital), `कॉफ़ी` (coffee)**: already loanwords (Persian/Arabic/English origins respectively); keep them.

### 5.2 What to add for a new script

For every existing entry in `entries[]`, add a `forms.<id>` block:

```json
"forms": {
  "...existing scripts...": { ... },
  "<id>": {
    "native":   "<word in your new script>",
    "ipa":      "<narrow IPA>",
    "latin":    "<English-keyboard transliteration>",
    "cyrillic": "<Russian-keyboard transliteration>"
  }
}
```

There are **29 entries**, so 29 form blocks to add. The current concept list:

> taxi · metro · coffee · tea · telephone · radio · music · theater · cinema · museum · university · mathematics · doctor · hospital · bank · computer · internet · kilometer · dollar · salad · chocolate · pizza · piano · hotel · restaurant · park · police · mama · papa

If a concept genuinely doesn't exist as a loanword in the target language *and* there's no recognisable transliteration available (rare), you may skip that one entry — the pool just gets smaller for that script. Document the reason in a code comment or PR description.

### 5.3 Validation

`node -e "const j = JSON.parse(require('fs').readFileSync('data/words-international.json','utf8')); for (const e of j.entries) { if (!e.forms['<id>']) console.log('MISSING:', e.concept); }"`

Should print nothing. Also confirm all four sub-fields (`native`, `ipa`, `latin`, `cyrillic`) exist in every form you add.

---

## 6. `data/phrases.json` — the 20-phrase deck

Add a key under `scripts.<id>.phrases` with the **same 20 phrases as every other script** (in the same order, so the SRS state lines up across scripts):

> Hello (informal) · Good morning · Good evening · Good night · Goodbye · Thank you · Please / You're welcome · Yes · No · Excuse me / Sorry · How are you? · Fine, thank you · What's your name? · My name is… · I don't understand · Do you speak English? · How much is it? · Where is the toilet? · Help! · I love you

Each phrase:

```json
{
  "native":   "<phrase in script>",
  "ipa":      "<IPA>",
  "latin":    "<English-keyboard transliteration>",
  "cyrillic": "<Russian-keyboard transliteration>",
  "translations": {
    "en": "<English translation>",
    "ru": "<Russian translation>"
  }
}
```

**All four transcription fields (`ipa`, `latin`, `cyrillic`) are required.** The UI lets users cycle between them and falls back to `latin` → `ipa` if one is missing, but you should provide all three.

For colloquial registers (Hello, How are you), use the form a tourist would actually need (informal singular). Match capitalization conventions of the script.

---

## 7. Localization audit — everything user-facing in `{en, ru}`

The UI runs in English or Russian. Every learner-visible string must be a `{ "en": ..., "ru": ... }` object, never a bare string. Specifically, audit:

- `manifest.json` → `name`, `info`, `composition`, every `countries[*].name`.
- `scripts/<id>.json` → every `note`, every `example.meaning`, every `words[*].meaning`.
- `phrases.json` → every `translations.{en, ru}` (already enforced by schema).
- `words-international.json` → entry-level `meaning` and `note` (you don't add new entries here, but **be sure your form block doesn't accidentally embed a meaning** — meanings live at the entry level).

The renderer's `localized(value)` helper accepts both bare strings (legacy) and `{en, ru}` objects, but **never rely on the bare-string fallback for new content**.

---

## 8. Special case — syllabic scripts that need decomposition

If your script encodes syllables as composed Unicode codepoints whose individual jamo / consonants / vowels live in a *different* Unicode block (the Hangul pattern), the letter-to-word matching in **`js/modes/preview-letters.js`** won't find words containing a given letter out of the box.

**Symptoms**: clicking a letter card in the preview shows "No training words contain this letter yet" even though words clearly do.

**Fix**: add a decomposition helper alongside the existing `decomposeHangul()` in `js/modes/preview-letters.js`. The Hangul code (around lines 30–70 — search for `HANGUL_INITIAL_TO_COMPAT`) is the reference pattern:

1. Detect codepoints in the precomposed range.
2. Decompose into the elementary letters (jamo / aksharas / …).
3. Map them back into the same Unicode block the alphabet uses (e.g. Hangul Compatibility Jamo for the alphabet rows but Hangul Syllables for words).
4. Make the helper a no-op for codepoints outside its block, so it can be applied universally without breaking other scripts.

If your script is a clean abugida (Devanagari, Thai) or alphabet (Greek, Cyrillic), you do **not** need this — the existing per-codepoint match already works.

---

## 9. Validation — work through the checklists in order

Treat each checklist as a hard gate. **Do not move to the next stage until every box in the current stage is checked.** If you're an LLM, write the box explicitly (`[x]` / `[ ]`) in your response as you go, so the human reviewer can audit.

### 9.1 Pre-flight (before writing any JSON)

- [ ] `id` is short, lowercase ASCII, no spaces / hyphens / diacritics, and doesn't collide with a route keyword (`home`, `settings`, `flashcards`, `flashcards-words`, `phrases`, `read`, `spell`, `choose-letters`, `choose-words`, `choose-phrases`, `preview-letters`, `preview-words`, `preview-phrases`).
- [ ] `id` doesn't collide with any existing script: `node -e "console.log(require('./data/manifest.json').scripts.some(s=>s.id==='<id>')?'COLLISION':'ok')"` → `ok`.
- [ ] You have the script's **English name**, **Russian name**, **native self-name**, **language code**, and **direction** (`ltr` / `rtl`).
- [ ] You have a list of countries (flag emoji + EN + RU names) where the script is used.
- [ ] You've drafted the `info` blurb (2–3 sentences) in both EN and RU.
- [ ] You've drafted the `composition` description (4–6 sentences) in both EN and RU, and re-read it to confirm it does **not** reference any other script by name (no "also an abjad like Arabic", no "unlike Cyrillic above"). Comparisons to Latin or Cyrillic as a baseline are OK; "like X further down the page" is not.
- [ ] You can name the script's writing-system **type** (alphabet / abjad / abugida / syllabary / featural / mixed) and have at least one sentence in `composition` that calls it out explicitly.

### 9.2 After editing `data/manifest.json`

Run these — every command must print what's expected:

```powershell
# Parses
node -e "JSON.parse(require('fs').readFileSync('data/manifest.json','utf8')); console.log('manifest OK')"

# Entry exists and has the right shape
node -e "const j=require('./data/manifest.json'); const s=j.scripts.find(x=>x.id==='<id>'); if(!s){console.log('NOT FOUND');process.exit(1)} const r={id:s.id,name_en:!!s.name?.en,name_ru:!!s.name?.ru,nativeName:!!s.nativeName,language:!!s.language,direction:s.direction,file:s.file,info_en:!!s.info?.en,info_ru:!!s.info?.ru,comp_en:!!s.composition?.en,comp_ru:!!s.composition?.ru,countries:Array.isArray(s.countries)?s.countries.length:'MISSING'};console.log(r);if(Object.values(r).some(v=>v===false||v==='MISSING')){console.log('FAIL');process.exit(1)}console.log('OK')"

# Every country has flag + localized name
node -e "const j=require('./data/manifest.json'); const s=j.scripts.find(x=>x.id==='<id>'); const bad=s.countries.filter(c=>!c.flag||!c.name?.en||!c.name?.ru); console.log(bad.length?bad:'all countries OK')"

# Direction is valid
node -e "const j=require('./data/manifest.json'); const s=j.scripts.find(x=>x.id==='<id>'); console.log(['ltr','rtl'].includes(s.direction)?'direction OK':'BAD direction: '+s.direction)"
```

Checklist:

- [ ] All four commands print `OK` / valid results, no `FAIL` / `MISSING` / `BAD`.
- [ ] `info.en` and `info.ru` are between roughly **80 and 400 characters** each (sanity bounds).
- [ ] `composition.en` and `composition.ru` are between roughly **400 and 1500 characters** each.
- [ ] `composition` does not contain the names of other scripts in the manifest (Greek, Cyrillic, Devanagari, Armenian, Georgian, Hiragana, Arabic, Hebrew, Hangul, Thai). Check:
  ```powershell
  node -e "const j=require('./data/manifest.json'); const s=j.scripts.find(x=>x.id==='<id>'); const names=j.scripts.filter(x=>x.id!==s.id).flatMap(x=>[x.name.en,x.name.ru,x.nativeName]); for(const lang of ['en','ru']){for(const n of names){if(s.composition[lang].includes(n))console.log('LEAK in composition.'+lang+': '+n)}} console.log('done')"
  ```
  → only `done` printed, no `LEAK in …` lines.

### 9.3 After creating `data/scripts/<id>.json`

```powershell
# Parses
node -e "JSON.parse(require('fs').readFileSync('data/scripts/<id>.json','utf8')); console.log('script OK')"

# Every letter has the four required fields + a complete example
node -e "const j=require('./data/scripts/<id>.json'); const bad=j.letters.map((l,i)=>{const miss=['glyph','ipa','latin','cyrillic','example'].filter(k=>l[k]==null||l[k]===''); const ex=l.example||{}; const emiss=['native','ipa','latin','cyrillic','meaning'].filter(k=>ex[k]==null||ex[k]===''); const mloc=ex.meaning&&typeof ex.meaning==='object'&&ex.meaning.en&&ex.meaning.ru; return {i, glyph:l.glyph, miss, exMiss:emiss, meaningLocalized:!!mloc}}).filter(x=>x.miss.length||x.exMiss.length||!x.meaningLocalized); console.log(bad.length?bad:'all letters complete')"

# Every note (if present) is {en, ru}
node -e "const j=require('./data/scripts/<id>.json'); const bad=j.letters.filter(l=>l.note&&(typeof l.note!=='object'||!l.note.en||!l.note.ru)); console.log(bad.length?bad.map(l=>l.glyph):'all letter notes localized')"

# Every word has the four transcription fields + localized meaning
node -e "const j=require('./data/scripts/<id>.json'); const bad=j.words.map((w,i)=>{const miss=['native','ipa','latin','cyrillic','meaning'].filter(k=>w[k]==null||w[k]===''); const mloc=w.meaning&&typeof w.meaning==='object'&&w.meaning.en&&w.meaning.ru; return {i,native:w.native,miss,meaningLocalized:!!mloc}}).filter(x=>x.miss.length||!x.meaningLocalized); console.log(bad.length?bad:'all words complete')"

# Word counts (sanity — not enforced, but flag if it's far off)
node -e "const j=require('./data/scripts/<id>.json'); console.log({letters:j.letters.length,words:j.words.length})"
```

Checklist:

- [ ] All five commands print clean results — no `bad` arrays, no `MISSING` flags.
- [ ] `letters.length` matches what you'd expect for the script (e.g. Greek 24, Cyrillic 33, Hebrew 22, Arabic ~28, Devanagari ~46, Hangul ~24, Thai ~44+marks). Way off → something is missing or duplicated.
- [ ] `words.length` is between **10 and 30**.
- [ ] Spot-check 3 random letters by eye: native glyph displays correctly (not a `?` or tofu), example word actually starts with or features that letter, `ipa` matches the segment in the example.
- [ ] For bicameral scripts: `glyph` shows **both cases** (e.g. `"Α α"`, `"Б б"`). For unicameral: just the one form.
- [ ] For scripts with **positional / final forms** (Hebrew ך ם ן ף ץ, Arabic isolated/initial/medial/final, Greek ς): mention the positional form in `note`.

### 9.4 After editing `data/phrases.json`

```powershell
# Parses
node -e "JSON.parse(require('fs').readFileSync('data/phrases.json','utf8')); console.log('phrases OK')"

# Exactly 20 phrases for the new script
node -e "const j=require('./data/phrases.json'); const n=j.scripts['<id>']?.phrases?.length; console.log(n===20?'count OK':'WRONG count: '+n)"

# Every phrase has all four transcription fields + en + ru
node -e "const j=require('./data/phrases.json'); const ps=j.scripts['<id>'].phrases; const bad=ps.map((p,i)=>{const miss=['native','ipa','latin','cyrillic'].filter(k=>!p[k]); const tmiss=['en','ru'].filter(k=>!p.translations?.[k]); return {i,native:p.native,miss,tmiss}}).filter(x=>x.miss.length||x.tmiss.length); console.log(bad.length?bad:'all phrases complete')"

# Phrase order matches the canonical English deck (so SRS state lines up across scripts)
node -e "const j=require('./data/phrases.json'); const ref=j.scripts.greek.phrases.map(p=>p.translations.en); const mine=j.scripts['<id>'].phrases.map(p=>p.translations.en); const mismatch=ref.map((r,i)=>r===mine[i]?null:{i,expected:r,got:mine[i]}).filter(Boolean); console.log(mismatch.length?mismatch:'phrase order matches reference')"
```

Checklist:

- [ ] All four commands print clean results.
- [ ] No accidental "Hello (formal)" where the canonical deck uses "Hello (informal)" — order and tone must match every other script.

### 9.5 After editing `data/words-international.json`

```powershell
# Parses
node -e "JSON.parse(require('fs').readFileSync('data/words-international.json','utf8')); console.log('intl OK')"

# Every one of the 29 entries now has forms.<id>
node -e "const j=require('./data/words-international.json'); const miss=j.entries.filter(e=>!e.forms['<id>']).map(e=>e.concept); console.log(miss.length?('MISSING in '+miss.length+' entries: '+miss.join(', ')):'all 29 forms present')"

# Each new form has all four sub-fields
node -e "const j=require('./data/words-international.json'); const bad=j.entries.map(e=>{const f=e.forms['<id>']; if(!f) return null; const miss=['native','ipa','latin','cyrillic'].filter(k=>!f[k]); return miss.length?{concept:e.concept,miss}:null}).filter(Boolean); console.log(bad.length?bad:'all forms complete')"
```

Checklist:

- [ ] Both coverage commands print clean results.
- [ ] You've **explicitly reviewed each of the 29 concepts** and asked: *"Is there a recognisable international form (loanword, transliteration, neologism) in this language? If yes I'm using it; if no I have a documented reason."* Do not rubber-stamp this — it is the most-frequently-violated rule in this codebase.
- [ ] You've cross-checked **at least 5 high-risk concepts** against the indigenous-word trap: `hospital`, `university`, `doctor`, `restaurant`, `police`. If the native word is the same as in `data/scripts/<id>.json` `words[]` and clearly indigenous, you've considered the loanword variant.
- [ ] Where you intentionally kept an indigenous word (false-friend lesson, no loan exists), you've left a one-line note in the PR description explaining why.

### 9.6 Browser smoke test (serve and click through)

Start a static server from the repo root and open the result in a browser:

```powershell
python -m http.server 8000
# then http://localhost:8000
```

Go through every checkbox — do **not** skip any:

- [ ] **Home (EN)**: new script tile is on the grid, name displays in English, `📝 0/<letters>` and `💬 0/<words>` counters show with the right totals.
- [ ] **Home (RU)**: toggle the header language switch. The tile's name now shows the Russian translation; the counters and tile labels are in Russian.
- [ ] **Select the script → About card**: short `info` blurb is visible in the active UI language. Below it, the longer "How the script works" / "Как устроено письмо" section shows the full `composition` text in the active language.
- [ ] **About card → countries**: flag emojis render, country names are in the active UI language.
- [ ] **Practice tiles** appear in this order: 🃏 Letter flashcards → 🃏 Word flashcards → 🃏 Phrase flashcards → 🎯 Choose letter → 🎯 Choose word → 🎯 Choose phrase → ✍️ Read & transcribe → ⌨️ Spell in script. All eight tiles are clickable.
- [ ] **Letter flashcards**: cycle through 3+ cards. Card flips with a 3D animation. Example word + meaning render in the active UI language. SRS *Again / Hard / Good / Easy* buttons work.
- [ ] **Word flashcards**: cycle through 3+ cards in both the curated and international pools. Meanings render in the active UI language.
- [ ] **Phrase flashcards**: 3+ cards cycle, translations are in the active UI language.
- [ ] **Choose letter / word / phrase**: each drill runs, toggling between *recognize* and *recall* works, the 4 / 6 / 8 option switch works, correct answer highlights green.
- [ ] **Read & transcribe**: 2+ prompts answer correctly; the input-system pill (IPA / Latin / Cyrillic) in the header swaps the expected answer system.
- [ ] **Spell in script**: 2+ prompts answer correctly using the on-screen keyboard.
- [ ] **Preview Alphabet**: every glyph renders (no `?` / tofu). Click a letter — the inlay shows the words containing that letter. **If no words show up** even though clearly some exist (Hangul-style composition issue), see §8.
- [ ] **Preview Words** → "Specific" filter: all `words[]` entries from `scripts/<id>.json` show with localized meanings.
- [ ] **Preview Words** → "International" filter: all 29 international forms appear with the localized concept meanings.
- [ ] **Preview Phrases**: all 20 phrases listed, translations in the active UI language.
- [ ] **Cultural notes**: where you added `note` fields, click the small **ⓘ** icon — note text shows in the active UI language (no English bleeding into Russian mode).
- [ ] **RTL scripts only**: native glyphs render right-to-left in cards, previews, and inputs; Latin/Cyrillic transcription beneath them stays left-to-right.
- [ ] **Vocalised scripts only** (Arabic, Hebrew, anything you flag): Settings → "Show full vocalisation" toggles between pointed and unpointed forms, both in prompts and in accepted answers.

### 9.7 Definition of done

The script is shippable only when **all** of 9.1–9.6 are checked **and**:

- [ ] `git status` is clean except for the four expected files (`data/manifest.json`, `data/scripts/<id>.json`, `data/phrases.json`, `data/words-international.json`) plus, if §8 applies, `js/modes/preview-letters.js`.
- [ ] Commit message names the script and lists what was added (letters / words / phrases / intl-forms counts).
- [ ] PR description calls out any intentional deviations (e.g. an indigenous word kept for a false-friend reason, a concept with no loanword equivalent, a custom decomposition).

---

## 10. Common pitfalls

- **Forgetting Russian translations** — schema accepts bare strings but the Russian UI will fall back to English, breaking the locale promise.
- **Picking indigenous words for the international pool** — defeats the recognition-practice purpose. Re-read §5.1.
- **IPA inconsistencies between letter row and example word** — easy to drift; double-check that the letter's IPA matches the segment in the example.
- **Wrong direction** — Arabic/Hebrew need `"direction": "rtl"` or the cards render mirrored.
- **`id` collisions with route keywords** — don't use `home`, `settings`, `flashcards`, `phrases`, `read`, `spell`, `choose-letters`, `choose-words`, `choose-phrases`, `flashcards-words`, `preview-letters`, `preview-words`, `preview-phrases`, or anything starting with `mode.` / `home.` / etc. Pick a script-name id.
- **Reusing a previous script's id for a related script** — give Iranian Pahlavi vs. Avestan their own ids even if they share a manifest line; saved learner progress is keyed on `id` so reuse silently inherits old SRS state.
- **Skipping the composition field** — it now drives the prominent "How the script works" section on the home screen; an empty one leaves a noticeable hole.

---

## TL;DR — minimum diff for a brand-new script

1. Add 1 object to `data/manifest.json` → `scripts[]` (with `info` + `composition` + `countries`, all `{en, ru}`).
2. Create `data/scripts/<id>.json` with `letters[]` (every letter, all four transcription fields, localized examples) and `words[]` (10–20 curated entries, localized meanings).
3. Append `scripts.<id>` block to `data/phrases.json` with the 20 canonical phrases.
4. Add a `forms.<id>` block to every one of the 29 entries in `data/words-international.json`, **preferring loanwords / transliterations** over indigenous synonyms.
5. (Optional) Patch `js/modes/preview-letters.js` if your script needs Hangul-style syllable decomposition.
6. Validate JSON, smoke-test the browser, commit.

That's it — no JS, no CSS, no i18n changes required for a typical alphabet, abjad, abugida, or syllabary.
