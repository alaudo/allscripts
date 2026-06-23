# allScripts

> A static installable web app for learning non-Latin writing systems.
> No backend and no build step: serve the folder over HTTP and open it in a browser.
>
> Статическое устанавливаемое веб-приложение для изучения нелатинских систем письма.
> Без бэкенда и без сборки: отдайте папку по HTTP и откройте её в браузере.

🇬🇧 [English](#english) · 🇷🇺 [Русский](#русский) · 📜 [Adding a new script](.github/prompts/add-script.prompt.md)

---

## English

### What it is

allScripts is a single-page HTML / CSS / JavaScript app for learning unfamiliar writing systems from scratch. It covers letters, intermediate syllables/forms, practical vocabulary, street signs, international loanwords, and standardized tourist-survival phrases through previews, flashcards, multiple-choice drills, and typing exercises. The UI is localized in English and Russian.

### Supported scripts

| Script | Native name | Main language |
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

Each script is stored in its own folder and includes metadata, a local flag SVG strip, letters, syllables/forms, curated words, signboard words, international words, and phrases.

### Current learning content

Each script currently provides:

| Layer | Purpose |
|---|---|
| **Letters** | Alphabet or base character inventory, with IPA, Latin, Cyrillic transcription, example word, and optional cultural/phonetic notes. |
| **Syllables & forms** | The layer between letters and words: common syllables/chunks for every script, plus script-specific cases such as Arabic contextual forms, Hebrew final forms, Devanagari conjuncts, and common Hangul blocks. |
| **Words: Specific** | Curated vocabulary chosen for the script/language. |
| **Words: Signs** | Common text visible on streets and signs, such as entrance, exit, toilets, information, open/closed, stop, parking, pharmacy. |
| **Words: International** | A shared 29-concept recognition pool using familiar loanwords where possible: taxi, metro, coffee, telephone, hospital, computer, internet, hotel, restaurant, police, etc. |
| **Phrases** | A standardized deck of 30 tourist-survival phrases focused on travel, navigation, help, payment, food, transport, and bundled opposites such as yes/no, open/closed, entrance/exit, left/right/straight. |

### Features

#### Home, navigation, and script information

- **Home grid** of script tiles with live progress.
- **Learn and practice sections** grouped by activity type, with learning previews shown before drills.
- **Decks page** for downloading Anki-importable decks by category or as combined exports.
- **Language switcher** in the header for English and Russian UI.
- **Theme switcher** for system, light, and dark themes.
- **Script information panel** at the bottom of the home page for the selected script.
- Localized script notes covering history, how the script works, capitals/case, digraphs or combinations, contextual forms, punctuation, and numbers.

#### Learn previews

- **Preview alphabet**: browse letters with IPA / Latin / Cyrillic transcription. Filter by consonants, vowels, and marks. Click a letter to see words that contain it.
- **Preview syllables & forms**: browse common syllables, forms, blocks, conjuncts, and positional variants. Click an item to see matching words and phrases.
- **Preview words**: browse the full word pool with exactly three source filters: **Specific**, **Signs**, and **International**. A length filter helps narrow the list.
- **Preview phrases**: browse all 30 tourist phrases with native script, transcription, and translation.

#### Practice modes

- **Flashcards: letters, syllables, words, phrases**
  - Front shows only the prompt.
  - Back shows pronunciation/transcription and meaning/translation.
  - Word and syllable pronunciation is emphasized with larger bold text.
  - Spaced repetition ratings: **Again**, **Hard**, **Good**, **Easy**.
  - Rating buttons show their numeric keyboard shortcuts and next-review intervals.
  - Optional auto-advance timers show a countdown in the card's upper-right corner.
  - Keyboard shortcuts: `Esc` home, `Space` flip, `Enter` skip, arrow keys previous/next, `1`-`4` rate.

- **Choose drills: letters, syllables, words, phrases**
  - Multiple-choice practice with 4, 6, or 8 options.
  - Prompts use a shuffled review bag so every item appears before the same item repeats.
  - Number badges on options match keyboard shortcuts.
  - `Esc` returns home, `Space` skips or continues, number keys pick answers.
  - If the matching auto-advance timer is enabled, a countdown appears in the pick card and reveal/advance happens automatically.
  - Choose drills mark letters, syllables, words, and phrases learned after the configurable number of correct answers in a row.
  - The learned threshold is selected in Settings from preset button options: 1, 2, 3, 4, 5, 7, or 10.
  - Word modes: **Native -> meaning**, **Native -> pronunciation**, **Meaning -> native**, **Pronunciation -> native**.
  - Letter, syllable, and phrase drills support recognition/recall directions.

- **Typing drills**
  - **Read & transcribe**: see a word in the target script and type the transliteration.
  - **Spell in script**: see a transliteration and spell it using the on-screen script keyboard.
  - Input systems: Latin, Cyrillic, and IPA, including an IPA keyboard.
  - Spell keyboards can switch between the alphabetic layout and a classic keyboard layout for the active script.
  - Optional mobile keyboard suppression keeps the phone keyboard closed when an in-app keyboard is available.
  - Optional fuzzy matching accepts small transliteration mistakes.

#### Transcription systems

Letters, syllables, words, and phrases can carry:

- **IPA**: phonetic transcription.
- **Latin**: practical English-keyboard respelling.
- **Cyrillic**: practical Russian-keyboard respelling.

The transcription pill cycles between systems without leaving the current screen.

#### Script-specific display options

- RTL scripts are rendered in the correct direction.
- Arabic/Hebrew-style optional vocalization can be toggled where data includes pointed/voweled forms.
- Hangul matching handles syllable blocks and decomposition where needed.
- Notes explain when capitals, punctuation, and numbers are reference-only rather than separate drills.

#### PWA / installability

The app includes:

- `manifest.webmanifest`
- service worker caching
- install icons, including maskable icon
- offline cache for the app shell and script data after first load

Browsers can offer **Install app / Add to Home Screen** when the app is served over HTTPS or localhost.

#### Anki deck exports

The **Decks** page generates Anki import files on demand from the same JSON data used by the app. This is preferable to checking in prebuilt deck files because exports stay current whenever letters, syllables, words, or phrases change. Downloads are UTF-8 `.txt` files with Anki 2.1.54+ headers for tab separation, HTML fields, **Basic** note type, target deck, **Front / Back / Tags** columns, and tag-column mapping.

### Running locally

The app uses `fetch()` for JSON and ES modules, so `file://` will not work. Serve the repository root over HTTP:

```bash
python -m http.server 8000
# open http://localhost:8000
```

Any static server is fine: `npx serve .`, `php -S localhost:8000`, VS Code Live Server, etc.

### Deploying to GitHub Pages

A workflow under `.github/workflows/pages.yml` deploys on every push to `main`. One-time setup:

1. Open **Settings -> Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main`. The site appears at `https://<user>.github.io/<repo>/`.

### Adding a new script or language

Adding a normal script should be a data-only change:

1. Create `data/scripts/<id>/`.
2. Add seven JSON files plus a local `flags.svg`: `meta.json`, `letters.json`, `words.json`, `syllables.json`, `signs.json`, `international.json`, `phrases.json`, `flags.svg`.
3. Add one entry to `data/manifest.json`:

```json
{ "id": "<id>", "folder": "scripts/<id>" }
```

For exact schemas, conventions, phrase requirements, validation commands, and PR checklist, see:

➡ **[.github/prompts/add-script.prompt.md](.github/prompts/add-script.prompt.md)**

### Opening a PR to add a language

1. Fork the repository or create a branch in your clone.
2. Add the script folder and update `data/manifest.json`.
3. Validate JSON and run a local smoke test over HTTP.
4. Commit only the relevant data/docs changes.
5. Open a pull request with:
   - script/language name in the title;
   - what folder was added;
   - confirmation that previews, flashcards, choose drills, typing drills, and PWA data loading were checked;
   - notes for any intentional exceptions, such as non-loanword international entries or missing IPA.

### Storage

Settings and progress are kept in `localStorage` under `scriptgame:v1`. The Settings screen includes reset controls.

### Scope notes

- Letter coverage is intentionally practical, not exhaustive Unicode coverage.
- Contextual forms, conjuncts, syllable blocks, and common chunks belong in `syllables.json`.
- Punctuation, capitals, and numbers should be documented in `meta.json`; only add them as drills if they are genuinely part of learning the script.
- International words should prefer familiar local loanwords/transliterations, but idiomatic exceptions are allowed when documented in `note`.
- Phrase decks should be useful for tourists and standardized across scripts where possible.

### Contact

Alexander Galkin · Telegram: @alaudo

---

## Русский

### Что это

allScripts — одностраничное приложение на HTML / CSS / JavaScript для изучения незнакомых систем письма с нуля. Оно покрывает буквы, промежуточный слой слогов и форм, практические слова, вывески, международные заимствования и стандартизированные туристические фразы через справочные просмотры, карточки, тесты с выбором ответа и упражнения на ввод. Интерфейс локализован на английский и русский.

### Поддерживаемые письменности

| Письменность | Самоназвание | Основной язык |
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

Каждая письменность хранится в отдельной папке и содержит метаданные, локальный SVG с флагами, буквы, слоги/формы, отобранные слова, слова с вывесок, международные слова и фразы.

### Текущий учебный контент

| Слой | Назначение |
|---|---|
| **Буквы** | Алфавит или базовый набор символов с IPA, латинской и кириллической транскрипцией, примером слова и необязательными заметками. |
| **Слоги и формы** | Промежуточный слой между буквами и словами: частые слоги/куски для каждой письменности и особые случаи вроде арабских позиционных форм, конечных форм иврита, конъюнктов деванагари и частых блоков хангыля. |
| **Слова: Specific** | Слова, выбранные специально для языка/письменности. |
| **Слова: Signs** | Частые надписи на улице и вывесках: вход, выход, туалеты, информация, открыто/закрыто, стоп, парковка, аптека. |
| **Слова: International** | Общий пул из 29 знакомых заимствований: такси, метро, кофе, телефон, госпиталь, компьютер, интернет, отель, ресторан, полиция и т. д. |
| **Фразы** | Стандартизированная колода из 30 туристических фраз про поездки, навигацию, помощь, оплату, еду, транспорт и пары вроде да/нет, открыто/закрыто, вход/выход, налево/направо/прямо. |

### Возможности

#### Главная, навигация и информация о письменности

- **Сетка письменностей** с живым прогрессом.
- **Секции учёбы и тренировки**, сгруппированные по типу действия: справочные просмотры идут перед упражнениями.
- **Страница колод** для скачивания Anki-совместимых колод по категориям или одним объединённым экспортом.
- **Переключатель языка** в шапке: английский и русский.
- **Тема оформления**: системная, светлая, тёмная.
- **Информационная панель** о выбранной письменности внизу главной страницы.
- Локализованные объяснения истории, устройства письма, регистра, сочетаний букв, позиционных форм, пунктуации и чисел.

#### Учебные просмотры

- **Просмотр алфавита**: буквы с IPA / латиницей / кириллицей. Фильтры по согласным, гласным и знакам. Клик по букве показывает слова, где она встречается.
- **Просмотр слогов и форм**: частые слоги, формы, блоки, конъюнкты и позиционные варианты. Клик показывает подходящие слова и фразы.
- **Просмотр слов**: весь словарь с тремя фильтрами источника: **Specific**, **Signs**, **International**, плюс фильтр по длине.
- **Просмотр фраз**: 30 туристических фраз с родным написанием, транскрипцией и переводом.

#### Тренировки

- **Карточки: буквы, слоги, слова, фразы**
  - На лицевой стороне только задание.
  - На обратной стороне транскрипция/произношение и значение/перевод.
  - Произношение слов и слогов выделено крупным жирным шрифтом.
  - Интервальные оценки: **Снова**, **Сложно**, **Хорошо**, **Легко**.
  - На кнопках оценок показаны цифровые клавиши и интервалы до следующего повтора.
  - Если включён таймер автоперехода, обратный отсчёт показывается в правом верхнем углу карточки.
  - Клавиши: `Esc` домой, `Space` перевернуть, `Enter` пропустить, стрелки назад/вперёд, `1`-`4` оценить.

- **Выбор ответа: буквы, слоги, слова, фразы**
  - Тесты с 4, 6 или 8 вариантами.
  - Задания берутся из перемешанной очереди, поэтому каждый элемент появляется до повторения того же элемента.
  - Цифровые бейджи на вариантах соответствуют клавишам.
  - `Esc` домой, `Space` пропустить или продолжить, цифры выбирают ответ.
  - Если включён соответствующий таймер автоперехода, отсчёт показывается на карточке выбора; по истечении времени ответ раскрывается и затем происходит переход дальше.
  - Режимы выбора помечают буквы, слоги, слова и фразы выученными после настраиваемого числа правильных ответов подряд.
  - Порог выучивания выбирается в Settings готовыми кнопками: 1, 2, 3, 4, 5, 7 или 10.
  - Режимы слов: **исходное -> значение**, **исходное -> произношение**, **значение -> исходное**, **произношение -> исходное**.
  - Буквы, слоги и фразы поддерживают направления распознавания и вспоминания.

- **Ввод с клавиатуры**
  - **Прочитай и запиши**: слово в целевой письменности -> введите транслитерацию.
  - **Запиши в письме**: увидьте транслитерацию и наберите слово экранной клавиатурой письменности.
  - Системы ввода: латиница, кириллица и IPA, включая экранную IPA-клавиатуру.
  - Клавиатуры режима письма переключаются между алфавитной раскладкой и классической раскладкой активной письменности.
  - На телефоне можно не открывать системную клавиатуру, если доступна экранная клавиатура приложения.
  - Нечёткое совпадение может принимать небольшие ошибки в транслитерации.

#### Системы транскрипции

Буквы, слоги, слова и фразы могут иметь:

- **IPA**: фонетическая транскрипция.
- **Латиницу**: практичную запись для английской клавиатуры.
- **Кириллицу**: практичную запись для русской клавиатуры.

Пилюля транскрипции переключает системы без ухода с текущего экрана.

#### Особенности отображения

- RTL-письменности отображаются в правильном направлении.
- Для арабского/иврита можно включать огласовки, если они есть в данных.
- Для хангыля учитываются блоки слогов и декомпозиция там, где это нужно.
- Заметки объясняют, когда регистр, пунктуация и числа являются справкой, а не отдельными упражнениями.

#### PWA / установка

В приложение добавлены:

- `manifest.webmanifest`
- service worker
- иконки для установки, включая maskable-иконку
- офлайн-кэш оболочки приложения и данных после первой загрузки

Браузеры могут предлагать **установить приложение / добавить на главный экран**, если сайт открыт по HTTPS или localhost.

#### Экспорт колод Anki

Страница **Колоды** создаёт файлы для импорта в Anki на лету из тех же JSON-данных, которые использует приложение. Это лучше, чем хранить заранее собранные файлы колод: экспорт всегда соответствует текущим буквам, слогам, словам и фразам. Скачиваются UTF-8 `.txt` файлы с заголовками Anki 2.1.54+: таб-разделитель, HTML-поля, тип заметок **Basic**, целевая колода, колонки **Front / Back / Tags** и назначение колонки тегов.

### Запуск локально

Приложение загружает JSON через `fetch()` и использует ES-модули, поэтому `file://` не работает. Отдайте корень репозитория по HTTP:

```bash
python -m http.server 8000
# откройте http://localhost:8000
```

Подойдёт любой статический сервер: `npx serve .`, `php -S localhost:8000`, VS Code Live Server и т. д.

### Развёртывание на GitHub Pages

Воркфлоу `.github/workflows/pages.yml` публикует сайт при каждом пуше в `main`. Однократная настройка:

1. Откройте **Settings -> Pages**.
2. Выберите **Source -> GitHub Actions**.
3. Запушьте в `main`. Сайт появится по адресу `https://<user>.github.io/<repo>/`.

### Добавление новой письменности или языка

Обычная новая письменность должна добавляться только данными:

1. Создайте `data/scripts/<id>/`.
2. Добавьте семь JSON-файлов и локальный `flags.svg`: `meta.json`, `letters.json`, `words.json`, `syllables.json`, `signs.json`, `international.json`, `phrases.json`, `flags.svg`.
3. Добавьте одну запись в `data/manifest.json`:

```json
{ "id": "<id>", "folder": "scripts/<id>" }
```

Точные схемы, соглашения, требования к фразам, команды проверки и чек-лист PR:

➡ **[.github/prompts/add-script.prompt.md](.github/prompts/add-script.prompt.md)**

### Как открыть PR с новой письменностью

1. Сделайте fork репозитория или создайте ветку в своём клоне.
2. Добавьте папку письменности и обновите `data/manifest.json`.
3. Проверьте JSON и сделайте локальный smoke test по HTTP.
4. Закоммитьте только относящиеся к задаче данные/документацию.
5. Откройте pull request и укажите:
   - название письменности/языка в заголовке;
   - какую папку добавили;
   - что проверены просмотры, карточки, выбор ответа, ввод и загрузка данных для PWA;
   - намеренные исключения: например, не-заимствованные international-слова или отсутствующий IPA.

### Хранение данных

Настройки и прогресс хранятся в `localStorage` под ключом `scriptgame:v1`. На экране Settings есть кнопки сброса.

### Заметки об охвате

- Набор букв практический, а не полный охват Unicode.
- Контекстные формы, конъюнкты, слоговые блоки и частые куски относятся к `syllables.json`.
- Пунктуацию, регистр и числа нужно описывать в `meta.json`; добавляйте их как упражнения только если они действительно нужны для изучения письменности.
- Международные слова должны по возможности использовать знакомые местные заимствования/транслитерации, но идиоматические исключения допустимы, если описаны в `note`.
- Фразы должны быть полезны туристу и по возможности стандартизированы между письменностями.

### Контакты

Alexander Galkin · Telegram: @alaudo
