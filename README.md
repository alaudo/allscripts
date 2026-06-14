# allScripts

> A static web app for learning non-Latin writing systems.
> No backend, no build step — open it in a browser and you're done.
>
> Статическое веб-приложение для изучения нелатинских систем письма.
> Без бэкенда и без сборки — просто откройте его в браузере.

🇬🇧 [English](#english) · 🇷🇺 [Русский](#русский) · 📜 [Adding a new script](.github/prompts/add-script.prompt.md)

---

## English

### What it is

allScripts is a single-page, pure HTML / JS / CSS web app that helps you learn an unfamiliar writing system from scratch — letters, vocabulary, and survival phrases — using spaced-repetition flashcards, multiple-choice drills, and typing exercises. The UI runs in English and Russian.

### Supported scripts

| Script | Native name | Language family |
|---|---|---|
| Greek | Ελληνικά | Modern Greek |
| Cyrillic | Кириллица | Russian |
| Devanagari | देवनागरी | Hindi / Sanskrit |
| Armenian | Հայերեն | Armenian |
| Georgian | ქართული | Georgian |
| Hiragana | ひらがな | Japanese |
| Arabic | العربية | Arabic |
| Hebrew | עברית | Hebrew |
| Hangul | 한글 | Korean |
| Thai | ไทย | Thai |

Each script comes with its full alphabet, 10–25 curated words, the 29-concept international-loanword pool (so familiar words like *taxi*, *metro*, *hospital* are practised in every script), and a deck of 20 survival phrases.

### Features at a glance

#### Home & navigation

- **Home grid** of script tiles, each showing live progress: `📝 letters learned/total · 💬 words learned/total`.
- **Language switch in the header** — toggle English ↔ Russian on every screen, including phrase translations and cultural notes.
- **About card** for each script with a short **history blurb** *and* a longer **"How the script works"** section explaining the mechanics (alphabet / abjad / abugida / syllabary, contextual forms, vowel marks, etc.). Both sections are localized into the active UI language.
- **Country flags** for each script.

#### Review (read-only previews)

These are reference views, not exercises — they live in their own section on the script home.

- **Preview alphabet** — every letter at a glance with its IPA / Latin / Cyrillic transcription. Filter by **Consonants / Vowels / Marks**. **Click a letter** to expand an inlay showing every training word that contains it (works correctly for syllabic scripts like Hangul via Unicode decomposition).
- **Preview words** — the full word pool as a grid, filterable by **Specific** (curated for the script) vs **International** (the 29-concept loanword pool) and by length via a dual-handle slider. Meanings render in the active UI language.
- **Preview phrases** — all 20 survival phrases with native script, romanisation, and translation.

#### Practice modes

The Practice section is grouped in three clusters, in this order:

1. **Flashcards (🃏)** — Letters · Words · Phrases. Front shows the prompt, back shows the answer; a proper CSS 3D Y-axis **card-flip animation** plays on every flip. Spaced repetition: rate each card *Again / Hard / Good / Easy* and it vanishes from the deck for the configured interval. **Separate SRS settings per deck** (letters, words, phrases) so you can pace each independently. Optional per-card timer auto-flips and advances if you stall.
2. **Choose (🎯)** — Letter · Word · Phrase. Multiple-choice drill: pick the right answer from **4, 6, or 8 options**. Toggle between *recognize* (native → translation) and *recall* (translation → native) directions. Feeds the same progress buckets as flashcards.
3. **Type-in modes** —
   - **✍️ Read & transcribe**: word in the target script → you type the transliteration. Choose Latin, Cyrillic, or **IPA** (with an on-screen IPA keyboard) via the header pill or in Settings.
   - **⌨️ Spell in script**: word in Latin / Cyrillic / IPA → you spell it back in the target script using an on-screen keyboard (or your hardware keyboard if it has the layout).

#### Transcription systems

Every letter, word, and phrase carries three transcriptions:

- **IPA** — narrow phonetic.
- **Latin** — practical English-keyboard re-spelling.
- **Cyrillic** — practical Russian-keyboard re-spelling.

The header pill cycles between them on the fly — no settings round-trip required.

#### International words

A pool of 29 concepts — *taxi, metro, coffee, telephone, hospital, computer, internet, …* — that exist as loanwords across most languages. Wherever possible the app uses the **loanword / transliterated form** (e.g. Russian `госпиталь` rather than `больница`) so learners can spend their attention decoding the **spelling** of a word they already know.

A few intentional exceptions are documented in their cultural notes — for example, the Georgian false-friend `მამა` ("mama") which actually means *father*.

#### Cultural notes (ⓘ)

Letters and words can carry a small **ⓘ** info icon with a cultural / phonetic / etymology note (false friends, loanword origins, alphabet history quirks). Notes are localized into English and Russian.

#### Fuzzy matching

Turn **fuzzy match** on in Settings to accept answers with small spelling slips — `t` for `th`, `c` for `k`, a missing single character. Tolerance scales with word length so short words still need to be (near-)exact.

#### Vocalisation

For scripts with optional diacritics — **Arabic ḥarakāt**, **Hebrew niqqud** — turn on **"Show full vocalisation"** in Settings. Prompts then show the fully-pointed form and the spell check requires the vocalised answer. Off, the bare consonantal form is shown and either form is accepted.

#### Theme

System / Light / Dark via the Settings picker.

#### Mobile

44-pixel tap targets, on-screen keyboards sized for thumbs, native numeric keypads for SRS interval inputs, horizontally scrollable progress tables on narrow screens. Inputs are sized so iOS won't auto-zoom when they're focused.

### Running locally

The app uses `fetch()` for its JSON data and ES modules, so it must be served over HTTP — `file://` won't work.

```bash
# from the repo root
python -m http.server 8000
# then open http://localhost:8000
```

Any other static server works too: `npx serve .`, `php -S localhost:8000`, VS Code Live Server, etc.

### Deploying to GitHub Pages

A workflow under `.github/workflows/pages.yml` deploys on every push to `main`. One-time setup:

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main`. The site appears at `https://<user>.github.io/<repo>/`.

### Adding a new script

All content is plain JSON under `data/` — no code changes needed for typical scripts. For full step-by-step instructions, schemas, validation checklists, and the conventions you need to follow (especially the international-words principle and the localization rules):

➡ **See [.github/prompts/add-script.prompt.md](.github/prompts/add-script.prompt.md)**

The short version: add an entry to `data/manifest.json`, create `data/scripts/<id>.json`, append a 20-phrase deck to `data/phrases.json`, and add a `forms.<id>` block to every entry in `data/words-international.json`.

### Storage

Settings and progress are kept in `localStorage` under the single key `scriptgame:v1`. A **"Reset all progress"** button lives in Settings.

### Scope notes

- Letter coverage is intentionally bounded to the most common glyphs in each script. Combining forms, ligatures, conjuncts, and contextual variants are noted in `note` fields where useful.
- Read & transcribe accepts loose matches (case- and diacritic-insensitive) on the transliteration. Spell in script requires an exact native match (or a fuzzy match if enabled).
- A few international "loanwords" are spelled idiomatically differently in some languages — these are flagged in the word's `note` field.

---

## Русский

### Что это

allScripts — одностраничное веб-приложение на чистом HTML / JS / CSS, помогающее изучить незнакомую систему письма с нуля: буквы, словарь и базовые фразы. В арсенале — карточки с интервальными повторениями, тесты с выбором ответа и упражнения на ввод. Интерфейс работает на английском и русском.

### Поддерживаемые письменности

| Письменность | Самоназвание | Язык |
|---|---|---|
| Греческая | Ελληνικά | Современный греческий |
| Кириллица | Кириллица | Русский |
| Деванагари | देवनागरी | Хинди / санскрит |
| Армянская | Հայերեն | Армянский |
| Грузинская | ქართული | Грузинский |
| Хирагана | ひらがな | Японский |
| Арабская | العربية | Арабский |
| Иврит | עברית | Иврит |
| Хангыль | 한글 | Корейский |
| Тайская | ไทย | Тайский |

В каждой письменности есть полный алфавит, 10–25 отобранных слов, общий пул из 29 международных заимствований (так что знакомые слова вроде *такси*, *метро*, *госпиталь* отрабатываются во всех письменностях) и колода из 20 базовых фраз.

### Возможности

#### Главная и навигация

- **Сетка плиток** письменностей с актуальным прогрессом: `📝 буквы выучены/всего · 💬 слова выучены/всего`.
- **Переключатель языка прямо в шапке** — мгновенный переход с английского на русский и обратно на любом экране, включая переводы фраз и культурные заметки.
- **Карточка «О письменности»** с краткой **исторической справкой** и более развёрнутым разделом **«Как устроено письмо»**, объясняющим механику (алфавит / абджад / абугида / силлабарий, позиционные формы, огласовки и т. д.). Оба раздела локализованы.
- **Флаги стран**, где письменность используется.

#### Просмотр (справочные режимы)

Это справочные экраны, а не упражнения, — они вынесены в отдельную секцию на главной письменности.

- **Просмотр алфавита** — все буквы сразу, с транскрипцией IPA / латиница / кириллица. Фильтры: **согласные / гласные / знаки**. **Клик по букве** раскрывает врезку со всеми тренировочными словами, содержащими её (для слоговых письменностей вроде хангыля работает через декомпозицию Unicode).
- **Просмотр слов** — весь пул слов в виде сетки; фильтры **«своё»** (отобрано для письменности) и **«международные»** (пул из 29 заимствований), а также фильтр по длине слова. Переводы — на текущем языке интерфейса.
- **Просмотр фраз** — все 20 базовых фраз с родным написанием, транслитерацией и переводом.

#### Тренировки

Секция «Тренировки» сгруппирована в три кластера, в таком порядке:

1. **Карточки (🃏)** — буквы · слова · фразы. На лицевой стороне — задание, на обратной — ответ; при перевороте играет правильная **3D-анимация переворота карточки** по оси Y. Интервальные повторения: оцените карточку *Снова / Сложно / Хорошо / Легко*, и она пропадает из колоды на заданный интервал. **Отдельные настройки SRS для каждой колоды** (буквы, слова, фразы) — можно задать свой темп каждой. Опциональный таймер автоматически переворачивает и сдвигает карточку, если вы зависли.
2. **Выбор (🎯)** — буква · слово · фраза. Тесты с множественным выбором: выберите правильный ответ из **4, 6 или 8 вариантов**. Переключайте направления *распознавание* (исходное → перевод) и *вспоминание* (перевод → исходное). Прогресс пишется в те же ячейки, что и у карточек.
3. **Ввод с клавиатуры** —
   - **✍️ Прочитай и запиши**: слово в целевой письменности → вы вводите транслитерацию. Латиница, кириллица или **IPA** (с экранной IPA-клавиатурой) — выбор через пилюлю в шапке или в настройках.
   - **⌨️ Запиши в письме**: слово на латинице / кириллице / IPA → вы записываете его в целевой письменности через экранную клавиатуру (или физическую, если на ней есть нужная раскладка).

#### Системы транскрипции

У каждой буквы, слова и фразы — три транскрипции:

- **IPA** — узкая фонетическая.
- **Латиница** — практичная запись «как набрать на английской клавиатуре».
- **Кириллица** — практичная запись «как набрать на русской клавиатуре».

Пилюля в шапке переключает их на лету — без захода в настройки.

#### Международные слова

Пул из 29 концептов — *такси, метро, кофе, телефон, госпиталь, компьютер, интернет, …* — существующих как заимствования в большинстве языков. По возможности используется именно **заимствованная / транслитерированная форма** (например, русское `госпиталь` вместо `больница`), чтобы учащийся тратил внимание на расшифровку **написания** уже знакомого слова.

Несколько намеренных исключений описаны в культурных заметках — например, грузинский «ложный друг» `მამა` («мама»), который на самом деле значит *папа*.

#### Культурные заметки (ⓘ)

У букв и слов может быть маленькая иконка **ⓘ** с культурной / фонетической / этимологической заметкой (ложные друзья, происхождение заимствований, особенности истории алфавита). Заметки локализованы на английский и русский.

#### Нечёткое сопоставление

Включите **«нечёткое совпадение»** в настройках, чтобы принимать ответы с мелкими опечатками — `t` вместо `th`, `c` вместо `k`, пропуск одного символа. Допуск масштабируется с длиной слова, так что короткие слова всё равно должны быть (почти) точными.

#### Огласовка

Для письменностей с опциональными диакритиками — **арабские хараки**, **еврейские некудот** — включите **«Показывать огласовки»** в настройках. Тогда задания показываются полностью огласованной формой и проверка требует огласованного ответа. Если выключено — отображается «голый» консонантный костяк, и принимается любая форма.

#### Тема оформления

Системная / светлая / тёмная — переключаются в настройках.

#### Мобильные устройства

Цели касания 44 пикселя, экранные клавиатуры под большие пальцы, цифровые клавиатуры iOS для SRS-интервалов, горизонтальная прокрутка таблиц прогресса на узких экранах. Поля ввода подобраны так, чтобы iOS не «зумился» при фокусе.

### Запуск локально

Приложение использует `fetch()` для загрузки JSON и ES-модули, поэтому его нужно подавать по HTTP — открытие `index.html` через `file://` не сработает.

```bash
# из корня репозитория
python -m http.server 8000
# затем откройте http://localhost:8000
```

Подойдёт любой статический сервер: `npx serve .`, `php -S localhost:8000`, VS Code Live Server и так далее.

### Развёртывание на GitHub Pages

Воркфлоу в `.github/workflows/pages.yml` развёртывает сайт при каждом пуше в `main`. Однократная настройка:

1. Откройте **Settings → Pages**.
2. Выберите **Source** → **GitHub Actions**.
3. Запушьте в `main`. Сайт появится по адресу `https://<user>.github.io/<repo>/`.

### Добавление новой письменности

Весь контент — обычный JSON в каталоге `data/`, для типовых письменностей правки кода не нужны. Полные пошаговые инструкции, схемы, чек-листы валидации и обязательные соглашения (особенно принцип международных слов и правила локализации) — в отдельном гайде:

➡ **См. [.github/prompts/add-script.prompt.md](.github/prompts/add-script.prompt.md)**

Кратко: добавьте запись в `data/manifest.json`, создайте `data/scripts/<id>.json`, добавьте колоду из 20 фраз в `data/phrases.json`, и добавьте блок `forms.<id>` в каждую запись `data/words-international.json`.

### Хранение данных

Настройки и прогресс хранятся в `localStorage` под единым ключом `scriptgame:v1`. Кнопка **«Сбросить весь прогресс»** доступна в настройках.

### Заметки об охвате

- Охват букв намеренно ограничен наиболее частыми глифами каждой письменности. Слитные формы, лигатуры, конъюнкты и контекстные варианты упоминаются в полях `note`, где это уместно.
- «Прочитай и запиши» принимает мягкие совпадения транслитерации (без учёта регистра и диакритики). «Запиши в письме» требует точного совпадения в родной письменности (или нечёткого, если включено).
- Несколько международных «заимствований» в отдельных языках пишутся идиоматически иначе — это помечено в поле `note` слова.
