---
mode: agent
description: End-to-end guide for adding a new writing system to allScripts using the folder-per-script data architecture.
---

# Add a new script or language to allScripts

allScripts is a static HTML / CSS / JavaScript PWA for learning writing systems. Adding a normal script should be a **data-only** contribution:

1. Create one folder under `data/scripts/<id>/`.
2. Put all script-owned data in that folder.
3. Add one entry to `data/manifest.json`.
4. Open a PR with the new folder and validation notes.

Do not edit shared JavaScript for a typical new script. Only change code if the new script needs behavior the current data schema cannot express.

---

## 1. Current app features to support

New scripts should work across all current app surfaces:

| Surface | What the data powers |
|---|---|
| Home | Script tile, local SVG flag strip, localized script information, progress summaries. |
| Preview alphabet | Letter grid with IPA / Latin / Cyrillic transcription and word matches for clicked letters. |
| Preview syllables & forms | Intermediate layer between letters and words, plus matching words and phrases. |
| Preview words | Three source filters: **Specific**, **Signs**, **International**. |
| Preview phrases | Standardized tourist-survival phrase list. |
| Flashcards | Letters, syllables, words, and phrases with SRS ratings and optional countdown timer. |
| Choose drills | Letters, syllables, words, and phrases with 4/6/8 options, keyboard shortcuts, and optional countdown timer. |
| Typing drills | Read/transcribe and spell-in-script using word data and script keyboard data. |
| PWA cache | Service worker discovers script folders from `data/manifest.json` and caches their JSON files. |

The app UI is localized in English and Russian. All human-facing data notes and meanings must include both `en` and `ru`.

---

## 2. Inputs to gather

Before adding a script, identify:

1. English and Russian script names.
2. Native self-name.
3. Stable lowercase ASCII `id`, such as `tibetan`, `geez`, or `mongolian_bichig`.
4. Main language or language family shown in docs.
5. ISO-like language code for `meta.json`.
6. Direction: `ltr` or `rtl`. Top-to-bottom is not fully supported.
7. Local SVG flag strip and localized country names.
8. Whether the script has capitals/case, contextual shaping, positional forms, final forms, vowel marks, conjuncts, ligatures, tone marks, punctuation conventions, and native numbers.
9. Whether pronunciation is best represented by IPA, practical Latin respelling, Cyrillic respelling, or all three.

Keep `id` stable after release because saved progress is keyed by script ID and native forms.

---

## 3. Files to create

Create exactly this folder shape:

```text
data/scripts/<id>/
  meta.json
  flags.svg
  letters.json
  words.json
  syllables.json
  signs.json
  international.json
  phrases.json
```

Then add one entry to `data/manifest.json`:

```json
{
  "id": "<id>",
  "folder": "scripts/<id>"
}
```

No shared phrase, syllable, sign, international-word, or flag asset file should be edited; those concepts now live inside each script folder.

---

## 4. `meta.json`

`meta.json` drives the home tile, script information panel, country flag strip, countries, direction, and documentation-like explanations.

```json
{
  "id": "<id>",
  "name": { "en": "<English script name>", "ru": "<Russian script name>" },
  "nativeName": "<native self-name>",
  "language": "<language code>",
  "direction": "ltr",
  "flagsSvg": "flags.svg",
  "info": {
    "en": "<2-3 sentence history/culture blurb>",
    "ru": "<same in Russian>"
  },
  "composition": {
    "en": "<4-6 sentence explanation of how the script works>",
    "ru": "<same in Russian>"
  },
  "writingConventions": {
    "en": "<capitals/case, combinations, punctuation, numbers, and whether to drill them>",
    "ru": "<same in Russian>"
  },
  "countries": [
    { "name": { "en": "Greece", "ru": "Греция" } }
  ]
}
```

`composition` should explain the system clearly: alphabet, abjad, abugida, syllabary, logographic component, case, direction, cursivity, contextual forms, final forms, vowel marks, diacritics, tone marks, ligatures/conjuncts, syllable blocks, and sound-to-spelling consistency where relevant.

`writingConventions` should explicitly answer:

- Are there capitals or case distinctions?
- Are common digraphs, conjuncts, blocks, or positional forms important?
- What punctuation is normally used with the script?
- Are European digits, native digits, or both common?
- Should punctuation/numbers/capitals be drilled, or only documented?

Usually punctuation and numbers are reference notes unless they are script-specific and useful for beginners.

`flagsSvg` must point to an SVG file inside the same script folder. Use a single strip image when a script is used in multiple countries, and keep localized country names in `countries` for the image tooltip/alt text.

---

## 5. `letters.json`

Letters are the base learning inventory and keyboard source.

```json
{
  "version": 1,
  "letters": [
    {
      "glyph": "Α α",
      "ipa": "a",
      "latin": "a",
      "cyrillic": "а",
      "type": "vowel",
      "example": {
        "native": "αγάπη",
        "ipa": "aˈɣapi",
        "latin": "agapi",
        "cyrillic": "агапи",
        "meaning": { "en": "love", "ru": "любовь" }
      },
      "note": {
        "en": "Optional useful note.",
        "ru": "Та же заметка по-русски."
      }
    }
  ]
}
```

Rules:

- Use both cases in `glyph` for bicameral scripts, for example `Α α` or `Б б`.
- Use isolated/base forms for scripts with contextual shaping.
- Put positional forms, final forms, conjuncts, and common blocks in `syllables.json`.
- `ipa`, `latin`, and `cyrillic` should be present wherever possible.
- `latin` means practical English-keyboard respelling, not necessarily strict romanization.
- `cyrillic` means practical Russian-keyboard respelling.
- `type` should support preview filters when useful: `consonant`, `vowel`, `mark`, or similar existing categories.
- Every `meaning` and `note` must be localized as `{ "en": "...", "ru": "..." }`.

---

## 6. `syllables.json`

This is the intermediate layer between letters and words. It powers Preview syllables, Syllable flashcards, and Choose the syllable.

```json
{
  "version": 1,
  "items": [
    {
      "native": "κα",
      "ipa": "ka",
      "latin": "ka",
      "cyrillic": "ка",
      "category": "common",
      "note": {
        "en": "Common syllable.",
        "ru": "Частый слог."
      },
      "match": ["κα"]
    }
  ]
}
```

Include enough entries to make the preview and drills useful:

- common syllables/chunks for every script;
- contextual/positional forms for Arabic-like scripts;
- final forms for Hebrew-like scripts;
- conjuncts and ligatures for Devanagari-like scripts;
- common Hangul syllable blocks;
- kana combinations or long-vowel patterns where useful;
- Thai/abugida clusters or vowel-sign combinations where useful.

Recommended size: about 20-30 items for most scripts. Use more if a script has many essential forms.

`category` is used for labels. Existing useful values include:

- `common`
- `form`
- `final`
- `conjunct`
- `block`

`match` is optional. Use it when the displayed form contains placeholders or when matching words/phrases requires one or more canonical substrings. For dotted placeholder forms like `◌ا`, include clean match strings without the dotted circle.

---

## 7. `words.json`

These are script-specific words. They power word previews, word flashcards, choose-word drills, and typing drills.

```json
{
  "version": 1,
  "words": [
    {
      "native": "καλημέρα",
      "ipa": "kaliˈmera",
      "latin": "kalimera",
      "cyrillic": "калимэра",
      "meaning": { "en": "good morning", "ru": "доброе утро" },
      "note": {
        "en": "Optional note.",
        "ru": "Необязательная заметка."
      }
    }
  ]
}
```

Guidelines:

- Aim for about 30 useful words.
- Choose words that demonstrate common letters, syllables, and script behavior.
- Prefer practical beginner vocabulary and culturally useful words.
- Keep native forms stable; progress is keyed by native string.
- Add `nativeVoweled` where the script can show optional full vocalization.
- Localize `meaning` and `note`.

---

## 8. `signs.json`

These are common signs and signboards. They appear in Preview words under **Signs** and in word practice.

```json
{
  "version": 1,
  "category": {
    "id": "signs",
    "label": { "en": "Signs and signboards", "ru": "Вывески и указатели" }
  },
  "entries": [
    {
      "concept": "entrance",
      "meaning": { "en": "Entrance", "ru": "Вход" },
      "native": "Είσοδος",
      "ipa": "ˈisoðos",
      "latin": "eisodos",
      "cyrillic": "исодос"
    }
  ]
}
```

Use common visible text a traveler may see. Recommended 10+ concepts:

- entrance
- exit
- toilets
- information
- open
- closed
- stop
- no entry
- parking
- pharmacy

Add more if the script/language has common high-value signs such as tickets, platform, customs, arrivals, departures, police, emergency, or cash desk.

---

## 9. `international.json`

International words are familiar concepts used for recognition practice across scripts.

```json
{
  "version": 1,
  "entries": [
    {
      "concept": "taxi",
      "meaning": { "en": "taxi", "ru": "такси" },
      "note": {
        "en": "International loanword.",
        "ru": "Интернациональное слово."
      },
      "native": "ταξί",
      "ipa": "taˈksi",
      "latin": "taxi",
      "cyrillic": "такси"
    }
  ]
}
```

Current shared concept set:

```text
taxi, metro, coffee, tea, telephone, radio, music, theater, cinema,
museum, university, mathematics, doctor, hospital, bank, computer,
internet, kilometer, dollar, salad, chocolate, pizza, piano, hotel,
restaurant, park, police, mama, papa
```

Principles:

- Prefer a local loanword/transliteration when it is natural.
- Do not force a loanword if the language strongly uses another standard form.
- Document exceptions in `note`.
- Keep the `concept` IDs stable and in English.

---

## 10. `phrases.json`

Phrases are standardized tourist-survival content. They power phrase preview, phrase flashcards, and choose-phrase drills.

```json
{
  "version": 3,
  "language": "<Language name>",
  "phrases": [
    {
      "native": "Γεια σας. Ευχαριστώ.",
      "ipa": "optional IPA if available",
      "latin": "Yia sas. Efcharistó.",
      "cyrillic": "я сас. эфхаристо",
      "translations": {
        "en": "Hello. Thank you.",
        "ru": "Здравствуйте. Спасибо."
      }
    }
  ]
}
```

Use 30 practical phrases where possible. Cover:

1. hello / thank you
2. goodbye
3. yes / no
4. please / excuse me
5. I do not understand
6. Do you speak English?
7. help / emergency
8. where is ...?
9. toilet
10. hotel
11. station / metro
12. airport
13. taxi
14. restaurant / cafe
15. water
16. bill / check
17. how much?
18. card / cash
19. open / closed
20. entrance / exit
21. left / right / straight
22. today / tomorrow
23. ticket
24. I need a doctor
25. pharmacy
26. police
27. Wi-Fi / internet
28. one / two / three if useful for travel
29. address / map
30. a polite fallback phrase such as "Can you write it down?"

Bundling related opposites in one phrase is encouraged because it makes phrase flashcards more useful.

If IPA is not available for phrases, include at least `latin` and `cyrillic`.

---

## 11. Validation

Run JSON checks before opening a PR. PowerShell examples:

```powershell
node -e "JSON.parse(require('fs').readFileSync('data/manifest.json','utf8')); console.log('manifest OK')"
node -e "for (const f of ['meta','letters','words','syllables','signs','international','phrases']) JSON.parse(require('fs').readFileSync(`data/scripts/<id>/${f}.json`,'utf8')); require('fs').accessSync('data/scripts/<id>/flags.svg'); console.log('folder OK')"
node --check .\js\data.js
node --check .\service-worker.js
```

Recommended local smoke test:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/?v=<id>-smoke#/home` and check:

1. Home shows the new script tile and script info panel.
2. Preview alphabet loads and letter inlays show matching words.
3. Preview syllables loads and selected syllables/forms show matching words and phrases.
4. Preview words shows **Specific**, **Signs**, and **International** filters.
5. Preview phrases shows the full phrase deck.
6. Flashcards work for letters, syllables, words, and phrases.
7. Choose drills work for letters, syllables, words, and phrases.
8. Read & transcribe and Spell in script work for word data.
9. Transcription toggles do not produce blank prompts unless intentionally unavailable.
10. RTL rendering, vocalization, and script-specific notes behave correctly where applicable.

---

## 12. PR workflow for adding a language

Use this flow:

1. Fork the repository or create a feature branch.
2. Add `data/scripts/<id>/` with all seven JSON files and `flags.svg`.
3. Add one manifest entry in `data/manifest.json`.
4. Update README only if you are adding a major new supported script to the public list or documenting a new app behavior.
5. Run the validation commands and local smoke test.
6. Commit with a clear message, for example `Add Tibetan script data`.
7. Open a pull request.

PR title:

```text
Add <Script/Language> support
```

PR description should include:

- script/language added;
- folder path, for example `data/scripts/tibetan/`;
- whether the script is `ltr` or `rtl`;
- content counts: letters, syllables/forms, words, signs, international entries, phrases;
- validation commands run;
- smoke-tested screens;
- known limitations or intentional exceptions.

Suggested checklist:

```markdown
- [ ] Added `data/scripts/<id>/meta.json`
- [ ] Added `flags.svg`
- [ ] Added `letters.json`, `syllables.json`, `words.json`, `signs.json`, `international.json`, `phrases.json`
- [ ] Added one entry to `data/manifest.json`
- [ ] Included English and Russian meanings/notes/translations
- [ ] Included IPA, Latin, and Cyrillic transcription where practical
- [ ] Checked Preview alphabet, syllables, words, and phrases
- [ ] Checked flashcards and choose drills for all supported layers
- [ ] Checked typing drills
- [ ] Ran JSON validation
- [ ] Documented any intentional exceptions
```

---

## 13. Quality bar

Before submitting:

- Prefer correctness over volume. Fewer accurate entries are better than many uncertain ones.
- Keep entries useful for beginners and travelers.
- Avoid copyright-protected phrasebook content; write your own practical phrases.
- Do not add secrets, API keys, analytics identifiers, or external service dependencies.
- Preserve the data-only architecture for normal new scripts.
- Keep all JSON valid and consistently formatted.
