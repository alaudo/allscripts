// Minimal i18n: a `t(key, params)` function plus per-locale dictionaries.
// Strings missing in a locale fall back to English. Keys are dotted strings so
// modules can group their strings naturally (e.g. settings.theme.title).
//
// To add a new locale, drop another entry into DICTS with the same key set.
// Phrase / data content is *not* localized here — it's keyed by uiLanguage
// inside each phrase's `translations` map in the script JSON.

import { getSettings } from './storage.js';

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' }
];

const DICTS = {
  en: {
    'app.brand': 'Allscripts',
    'app.loading': 'Loading…',
    'app.footer': 'Open-source. Data lives in data/*.json. Add scripts by editing JSON.',
    'app.noscript': 'This game needs JavaScript enabled.',
    'app.not_found': 'Not found',
    'app.go_home': 'Go home',

    'nav.home': 'Home',
    'nav.settings': 'Settings',
    'nav.back_home': '← Home',

    'theme.auto.icon': '🌓',
    'theme.light.icon': '☀️',
    'theme.dark.icon': '🌙',
    'theme.auto.tooltip': 'Theme: match system (click to switch to Light)',
    'theme.light.tooltip': 'Theme: light (click to switch to Dark)',
    'theme.dark.tooltip': 'Theme: dark (click to switch to Auto)',
    'theme.aria': 'Toggle theme',

    'home.pick_script': 'Pick a script',
    'home.practise': 'Practise',
    'home.about': 'About',
    'home.about_aria': 'Where {name} is used',
    'home.stat.letters': 'letters learned',
    'home.stat.words': 'words practised',
    'home.config.transcription': 'Transcription',
    'home.config.input': 'Word input',
    'home.config.vocalised': 'vocalised',
    'home.config.fuzzy': 'fuzzy match',
    'home.config.change': 'change',

    'mode.flashcards.title': 'Flashcards',
    'mode.flashcards.blurb': 'Letter on the front, transcription and an example word on the back.',
    'mode.read.title': 'Read & transcribe',
    'mode.read.blurb': 'A word in the script — type its Latin, Cyrillic or IPA transcription.',
    'mode.spell.title': 'Spell in script',
    'mode.spell.blurb': 'A word in Latin/Cyrillic/IPA — type it in the target script.',
    'mode.phrases.title': 'Phrases',
    'mode.phrases.blurb': '20 useful phrases for the language — tap to reveal the translation.',

    'transcription.ipa': 'IPA',
    'transcription.english': 'English re-spelling',
    'transcription.russian': 'Russian re-spelling',
    'transcription.cycle_tooltip': 'Click to cycle transcription system (IPA → English → Russian)',

    'input.latin': 'Latin',
    'input.cyrillic': 'Cyrillic',
    'input.ipa': 'IPA',
    'input.cycle_tooltip': 'Click to change input system (Latin → Cyrillic → IPA)',
    'input.prompt_cycle_tooltip': 'Click to change prompt system (Latin → Cyrillic → IPA)',

    'flashcards.header': '{name} flashcards',
    'flashcards.again': 'Again',
    'flashcards.hard': 'Hard',
    'flashcards.good': 'Good',
    'flashcards.easy': 'Easy',
    'flashcards.previous': '← Previous',
    'flashcards.next': 'Next →',
    'flashcards.reshuffle': 'Reshuffle / rebuild deck',
    'flashcards.due_now': '{n} due now',
    'flashcards.no_due': 'no cards due — practicing full deck',
    'flashcards.all_caught_up': 'All caught up!',
    'flashcards.next_review': 'Next review: {interval}',

    'read.header': 'Read & transcribe — {name}',
    'read.placeholder': 'Type the {label} transcription…',
    'read.ipa_keyboard': 'IPA keyboard',
    'read.ipa_hint': 'Click symbols to insert them. Most cells are single characters; combining diacritics attach to the previous character.',
    'read.skip': 'Skip / Next →',
    'read.check': 'Check',
    'read.verdict_correct': '✓ Correct',
    'read.verdict_wrong': '✗ Not quite',
    'read.answer': 'Answer:',
    'read.vocalised_label': 'vocalised:',
    'read.vocalised_modifier': '· vocalised',
    'read.fuzzy_modifier': '· fuzzy',
    'read.vocalised_target': '· vocalised target',

    'spell.header': 'Spell in {name}',
    'spell.placeholder': 'Type the {name} word…',
    'spell.keyboard': '{name} keyboard',
    'spell.kbd_hint': 'Click letters to insert them, or just type if you have a {name} keyboard installed.',
    'spell.meaning': 'meaning: {meaning}',

    'phrases.header': '20 phrases — {name}',
    'phrases.tap_to_reveal': 'Tap to reveal',
    'phrases.tap_to_flip_back': 'Tap to flip back',
    'phrases.show_translation': 'Show translation',
    'phrases.show_native': 'Show native',
    'phrases.counter': '{idx} / {total}',
    'phrases.shuffle': 'Shuffle',
    'phrases.next': 'Next →',
    'phrases.previous': '← Previous',
    'phrases.none': 'No phrases available for this script yet.',

    'settings.appearance': 'Appearance',
    'settings.theme': 'Theme',
    'settings.theme.auto': 'Match system',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.theme.hint': '"Match system" follows your OS light/dark preference.',
    'settings.language': 'Interface language',
    'settings.language.hint': 'Affects menus, buttons, and the translations shown in Phrases mode.',
    'settings.transcription_input': 'Transcription & input',
    'settings.transcription': 'Transcription system',
    'settings.transcription.current': 'Currently: {label}',
    'settings.input': 'Read & transcribe — input system',
    'settings.input.hint': "Which keyboard / phonetic system you'll use when typing the transliteration.",
    'settings.vocalised': 'Show full vocalisation',
    'settings.vocalised.hint': 'For scripts with optional diacritics (Arabic harakat, Hebrew niqqud), display the fully-pointed form in word exercises.',
    'settings.fuzzy': 'Forgiving (fuzzy) matching',
    'settings.fuzzy.hint': 'Accept answers with small spelling slips — e.g. "t" instead of "th", one missing letter — in read & spell modes.',
    'settings.flashcards': 'Flashcards',
    'settings.timer': 'Auto-advance timer',
    'settings.timer.hint': "Auto-flips the card, then advances if you don't rate it in time. Off by default.",
    'settings.timer.off': 'Off',
    'settings.timer.5s': '5 seconds',
    'settings.timer.10s': '10 seconds',
    'settings.timer.15s': '15 seconds',
    'settings.timer.20s': '20 seconds',
    'settings.timer.30s': '30 seconds',
    'settings.timer.60s': '1 minute',
    'settings.srs.title': 'Spaced repetition intervals (minutes)',
    'settings.srs.hint': 'When you rate a card, it disappears from the deck and reappears after this many minutes.',
    'settings.srs.again.hint': 'shown after this interval when you press Again',
    'settings.srs.hard.hint': 'shown again after this many minutes for cards rated Hard',
    'settings.srs.good.hint': 'standard interval after a correct, normal response',
    'settings.srs.easy.hint': 'long interval for confident, easy cards',
    'settings.progress': 'Progress',
    'settings.progress.script': 'Script',
    'settings.progress.letters_known': 'Letters known',
    'settings.progress.words_correct': 'Words correct',
    'settings.progress.wrong_suffix': '({n} wrong)',
    'settings.progress.reset': 'Reset',
    'settings.progress.reset_script_confirm': 'Reset progress for {name}?',
    'settings.progress.reset_all': 'Reset all progress',
    'settings.progress.reset_all_confirm': 'Reset ALL settings and progress?',

    'input.ipa.full': 'IPA (with on-screen keyboard)',
    'input.latin.full': 'Latin (English keyboard)',
    'input.cyrillic.full': 'Cyrillic (Russian keyboard)',
    'transcription.russian_full': 'Russian re-spelling (Cyrillic)'
  },

  ru: {
    'app.brand': 'Allscripts',
    'app.loading': 'Загрузка…',
    'app.footer': 'Открытый код. Данные — в data/*.json. Добавляйте письменности, редактируя JSON.',
    'app.noscript': 'Игра требует включённого JavaScript.',
    'app.not_found': 'Не найдено',
    'app.go_home': 'На главную',

    'nav.home': 'Главная',
    'nav.settings': 'Настройки',
    'nav.back_home': '← Главная',

    'theme.auto.icon': '🌓',
    'theme.light.icon': '☀️',
    'theme.dark.icon': '🌙',
    'theme.auto.tooltip': 'Тема: как в системе (нажмите, чтобы выбрать Светлую)',
    'theme.light.tooltip': 'Тема: светлая (нажмите, чтобы выбрать Тёмную)',
    'theme.dark.tooltip': 'Тема: тёмная (нажмите, чтобы выбрать Авто)',
    'theme.aria': 'Переключить тему',

    'home.pick_script': 'Выберите письменность',
    'home.practise': 'Тренировка:',
    'home.about': 'О письменности',
    'home.about_aria': 'Где используется {name}',
    'home.stat.letters': 'выучено букв',
    'home.stat.words': 'отработано слов',
    'home.config.transcription': 'Транскрипция',
    'home.config.input': 'Ввод слов',
    'home.config.vocalised': 'с огласовками',
    'home.config.fuzzy': 'мягкая проверка',
    'home.config.change': 'изменить',

    'mode.flashcards.title': 'Карточки',
    'mode.flashcards.blurb': 'Буква на лицевой стороне, транскрипция и пример слова — на обратной.',
    'mode.read.title': 'Читать и транскрибировать',
    'mode.read.blurb': 'Слово в письменности — наберите его транскрипцию (латиница, кириллица или IPA).',
    'mode.spell.title': 'Писать в письменности',
    'mode.spell.blurb': 'Слово на латинице/кириллице/IPA — наберите его в целевой письменности.',
    'mode.phrases.title': 'Фразы',
    'mode.phrases.blurb': '20 полезных фраз языка — нажмите, чтобы увидеть перевод.',

    'transcription.ipa': 'IPA',
    'transcription.english': 'Английская транслитерация',
    'transcription.russian': 'Русская транслитерация',
    'transcription.cycle_tooltip': 'Нажмите, чтобы сменить транскрипцию (IPA → Английская → Русская)',

    'input.latin': 'Латиница',
    'input.cyrillic': 'Кириллица',
    'input.ipa': 'IPA',
    'input.cycle_tooltip': 'Нажмите, чтобы сменить систему ввода (Латиница → Кириллица → IPA)',
    'input.prompt_cycle_tooltip': 'Нажмите, чтобы сменить систему подсказки (Латиница → Кириллица → IPA)',

    'flashcards.header': 'Карточки — {name}',
    'flashcards.again': 'Заново',
    'flashcards.hard': 'Сложно',
    'flashcards.good': 'Хорошо',
    'flashcards.easy': 'Легко',
    'flashcards.previous': '← Назад',
    'flashcards.next': 'Дальше →',
    'flashcards.reshuffle': 'Перетасовать колоду',
    'flashcards.due_now': 'к повторению: {n}',
    'flashcards.no_due': 'к повторению пока нет — тренируем всю колоду',
    'flashcards.all_caught_up': 'Всё повторено!',
    'flashcards.next_review': 'Следующий показ: {interval}',

    'read.header': 'Чтение — {name}',
    'read.placeholder': 'Введите транскрипцию ({label})…',
    'read.ipa_keyboard': 'Клавиатура IPA',
    'read.ipa_hint': 'Нажимайте символы, чтобы их вставить. Большинство — одиночные знаки; диакритика присоединяется к предыдущему символу.',
    'read.skip': 'Пропустить / Дальше →',
    'read.check': 'Проверить',
    'read.verdict_correct': '✓ Верно',
    'read.verdict_wrong': '✗ Почти',
    'read.answer': 'Ответ:',
    'read.vocalised_label': 'с огласовками:',
    'read.vocalised_modifier': '· с огласовками',
    'read.fuzzy_modifier': '· мягкая',
    'read.vocalised_target': '· целевая с огласовками',

    'spell.header': 'Письмо — {name}',
    'spell.placeholder': 'Напишите слово ({name})…',
    'spell.keyboard': 'Клавиатура — {name}',
    'spell.kbd_hint': 'Нажимайте буквы, чтобы их вставить, или печатайте с физической клавиатуры, если у вас есть раскладка {name}.',
    'spell.meaning': 'значение: {meaning}',

    'phrases.header': '20 фраз — {name}',
    'phrases.tap_to_reveal': 'Нажмите, чтобы увидеть перевод',
    'phrases.tap_to_flip_back': 'Нажмите, чтобы перевернуть',
    'phrases.show_translation': 'Показать перевод',
    'phrases.show_native': 'Показать оригинал',
    'phrases.counter': '{idx} / {total}',
    'phrases.shuffle': 'Перемешать',
    'phrases.next': 'Дальше →',
    'phrases.previous': '← Назад',
    'phrases.none': 'Для этой письменности фразы ещё не добавлены.',

    'settings.appearance': 'Внешний вид',
    'settings.theme': 'Тема',
    'settings.theme.auto': 'Как в системе',
    'settings.theme.light': 'Светлая',
    'settings.theme.dark': 'Тёмная',
    'settings.theme.hint': '«Как в системе» следует за настройкой светлой/тёмной темы ОС.',
    'settings.language': 'Язык интерфейса',
    'settings.language.hint': 'Меняет меню, кнопки и переводы фраз в режиме «Фразы».',
    'settings.transcription_input': 'Транскрипция и ввод',
    'settings.transcription': 'Система транскрипции',
    'settings.transcription.current': 'Сейчас: {label}',
    'settings.input': 'Чтение — система ввода',
    'settings.input.hint': 'Какой клавиатурой или системой вы будете набирать транслитерацию.',
    'settings.vocalised': 'Показывать полные огласовки',
    'settings.vocalised.hint': 'Для письменностей с необязательной диакритикой (арабские харакат, ивритский никкуд) показывать полностью огласованную форму в упражнениях.',
    'settings.fuzzy': 'Мягкая (нестрогая) проверка',
    'settings.fuzzy.hint': 'Принимать ответы с мелкими опечатками — например «t» вместо «th», одна пропущенная буква — в режимах чтения и письма.',
    'settings.flashcards': 'Карточки',
    'settings.timer': 'Таймер автосмены',
    'settings.timer.hint': 'Сначала переворачивает карту, затем переходит к следующей, если вы не оцениваете её вовремя. По умолчанию выключен.',
    'settings.timer.off': 'Выкл.',
    'settings.timer.5s': '5 секунд',
    'settings.timer.10s': '10 секунд',
    'settings.timer.15s': '15 секунд',
    'settings.timer.20s': '20 секунд',
    'settings.timer.30s': '30 секунд',
    'settings.timer.60s': '1 минута',
    'settings.srs.title': 'Интервалы интервального повторения (минуты)',
    'settings.srs.hint': 'Когда вы оцениваете карту, она пропадает из колоды и возвращается через указанное число минут.',
    'settings.srs.again.hint': 'через сколько появится после нажатия «Заново»',
    'settings.srs.hard.hint': 'через сколько появится после оценки «Сложно»',
    'settings.srs.good.hint': 'стандартный интервал после нормального правильного ответа',
    'settings.srs.easy.hint': 'длинный интервал для уверенных, лёгких карт',
    'settings.progress': 'Прогресс',
    'settings.progress.script': 'Письменность',
    'settings.progress.letters_known': 'Букв выучено',
    'settings.progress.words_correct': 'Слов верно',
    'settings.progress.wrong_suffix': '(с ошибкой: {n})',
    'settings.progress.reset': 'Сбросить',
    'settings.progress.reset_script_confirm': 'Сбросить прогресс по «{name}»?',
    'settings.progress.reset_all': 'Сбросить весь прогресс',
    'settings.progress.reset_all_confirm': 'Сбросить ВСЕ настройки и прогресс?',

    'input.ipa.full': 'IPA (с экранной клавиатурой)',
    'input.latin.full': 'Латиница (английская клавиатура)',
    'input.cyrillic.full': 'Кириллица (русская клавиатура)',
    'transcription.russian_full': 'Русская транслитерация (кириллица)'
  }
};

let cachedLang = null;

export function currentLang() {
  if (cachedLang) return cachedLang;
  const lang = (getSettings().uiLanguage || 'en');
  cachedLang = DICTS[lang] ? lang : 'en';
  return cachedLang;
}

export function setLang(lang) {
  cachedLang = DICTS[lang] ? lang : 'en';
}

export function t(key, params) {
  const lang = currentLang();
  const dict = DICTS[lang] || DICTS.en;
  let s = dict[key];
  if (s === undefined) s = DICTS.en[key];
  if (s === undefined) s = key;
  if (params) {
    for (const k of Object.keys(params)) {
      s = s.split('{' + k + '}').join(String(params[k]));
    }
  }
  return s;
}

// Convenience helpers — short labels used in several places.
export function transcriptionLabel(transcription) {
  if (transcription === 'english') return t('transcription.english');
  if (transcription === 'russian') return t('transcription.russian');
  return t('transcription.ipa');
}

export function inputSystemLabel(inputSystem) {
  if (inputSystem === 'cyrillic') return t('input.cyrillic');
  if (inputSystem === 'ipa') return t('input.ipa');
  return t('input.latin');
}

// Update DOM chrome (topbar text, footer, etc.) — called after language change.
export function applyChromeStrings() {
  const els = document.querySelectorAll('[data-i18n]');
  for (const el of els) {
    el.textContent = t(el.getAttribute('data-i18n'));
  }
  document.documentElement.lang = currentLang();
}
