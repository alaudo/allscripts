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

## 9. Final validation

Run all of these before opening the PR / asking for review:

```powershell
# JSON parses
node -e "JSON.parse(require('fs').readFileSync('data/manifest.json','utf8')); console.log('manifest OK')"
node -e "JSON.parse(require('fs').readFileSync('data/scripts/<id>.json','utf8')); console.log('<id> OK')"
node -e "JSON.parse(require('fs').readFileSync('data/phrases.json','utf8')); console.log('phrases OK')"
node -e "JSON.parse(require('fs').readFileSync('data/words-international.json','utf8')); console.log('intl OK')"

# Coverage checks
node -e "const j=require('./data/manifest.json'); const s=j.scripts.find(x=>x.id==='<id>'); console.log({hasInfo: !!(s.info&&s.info.en&&s.info.ru), hasComp: !!(s.composition&&s.composition.en&&s.composition.ru), countries: s.countries?.length||0});"
node -e "const j=require('./data/words-international.json'); const miss=j.entries.filter(e=>!e.forms['<id>']).map(e=>e.concept); console.log(miss.length?('MISSING: '+miss.join(', ')):'all 29 forms present');"
node -e "const j=require('./data/phrases.json'); console.log('phrases:', j.scripts['<id>']?.phrases?.length, 'should be 20');"
```

Then **smoke-test in the browser** (serve with `python -m http.server 8000`):

- [ ] Script tile appears on the home grid with the correct name in both EN and RU (toggle the header lang switch).
- [ ] "About" card shows both the history blurb and the "How the script works" section.
- [ ] Letter flashcards walk through the alphabet; example word and meaning render.
- [ ] Choose-the-letter / word / phrase drills work with 4, 6, 8 options.
- [ ] Read & Transcribe and Spell modes accept reasonable input.
- [ ] Preview Alphabet renders every glyph. Click one and confirm the word inlay lists words that contain that letter (if not, see §8).
- [ ] Preview Words shows curated + international entries. Filter by "International" and verify all 29 concepts show your new forms.
- [ ] Preview Phrases lists 20 phrases with their translations.

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
