# Allscripts

A small static web game for learning non-Latin writing systems. No backend,
no build step — open it in a browser and you're done.

**Supported scripts (v2):**

- Greek (Ελληνικά)
- Cyrillic (Кириллица — Russian)
- Devanagari (देवनागरी — Hindi/Sanskrit)
- Armenian (Հայերեն)
- Georgian (ქართული)
- Hiragana (ひらがな — Japanese)
- Arabic (العربية)
- Hebrew (עברית)
- Hangul (한글 — Korean)
- Thai (ไทย)

## Modes

1. **Flashcards** — letter on the front, transcription and an example word on
   the back. Click the transcription system label in the header to cycle
   between IPA / English re-spelling / Russian re-spelling on the fly.
2. **Read & transcribe** — a word in the target script; you type its
   transliteration (Latin, Cyrillic, or **IPA** — choose in Settings). IPA
   mode shows an on-screen IPA keyboard with vowels, consonants and
   suprasegmentals.
3. **Spell in script** — a word in Latin/Cyrillic/IPA; you spell it in the
   target script using an on-screen keyboard (or your hardware keyboard).

For scripts with optional diacritics (**Arabic harakat**, **Hebrew niqqud**)
turn on **"Show full vocalisation"** in Settings. Then the prompts in
modes 2 & 3 show the fully-pointed form and the spell check requires the
vocalised answer. Off, the bare consonantal form is shown and either form
is accepted.

The home page tile for each script shows `learned/total` letters and
`learned/total` words, so you can see your coverage at a glance.

## Running locally

The app uses `fetch()` for its JSON data and ES modules, so it must be served
over HTTP — opening `index.html` with `file://` will fail.

```bash
# from the repo root
python -m http.server 8000
# then open http://localhost:8000
```

Any other static server works too (`npx serve .`, `php -S localhost:8000`,
VS Code Live Server, etc.).

## Deploying to GitHub Pages

A workflow under `.github/workflows/pages.yml` deploys the site on every
push to `main`. Once after creating the repo:

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main`. The site will appear at
   `https://<user>.github.io/<repo>/`.

## Extending the data

All content is plain JSON under `data/` — no code changes needed to add or
edit content.

- **Add a new script:** drop a `data/scripts/<id>.json` file (see existing
  files for the schema) and add one entry to `data/manifest.json`.
- **Add letters or example words:** edit the script's JSON.
- **Add international words:** add an entry to
  `data/words-international.json`. Only the scripts you provide `forms` for
  will show that word in modes 2/3.

The per-script schema is:

```jsonc
{
  "id": "greek",
  "letters": [{
    "glyph": "Δ",
    "ipa": "ð",
    "latin": "d",
    "cyrillic": "д",
    "example": { "native": "δέντρο", "ipa": "ˈðendro", "latin": "dendro", "cyrillic": "дэндро", "meaning": "tree" },
    "note": "optional"
  }],
  "words": [{ "native": "καλημέρα", "ipa": "kaliˈmera", "latin": "kalimera", "cyrillic": "калимэра", "meaning": "good morning" }],
  "keyboardRows": [["ς","ε","ρ","τ","υ","θ","ι","ο","π"], ["α","σ","δ","φ","γ","η","ξ","κ","λ"], ["ζ","χ","ψ","ω","β","ν","μ"]]
}
```

## Storage

Settings and progress are kept in `localStorage` under the single key
`scriptgame:v1`. There's a "Reset all progress" button in Settings.

## Scope notes

- Letter coverage is intentionally bounded to the most common glyphs in each
  script. Combining forms, ligatures, conjuncts, and contextual variants
  are out of scope for v1 and noted in flashcard `note` fields where useful.
- Mode 2 accepts loose matches (case- and diacritic-insensitive) on the
  transliteration. Mode 3 requires an exact native match.
- A few international "loanwords" are spelled idiomatically differently in
  some languages — these are flagged in the word's `note` field (e.g. the
  Georgian false-friend "მამა" = *father*, not mother).
