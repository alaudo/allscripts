import { getSettings, updateSettings, resetScript, resetAll, summary } from '../storage.js';
import { getManifest } from '../data.js';
import { applyTheme } from '../theme.js';
import { setLang, applyChromeStrings, t, transcriptionLabel, LANGUAGES, localized } from '../i18n.js';
import { el, escapeHtml } from './dom.js';

function transcriptionOptions() {
  return [
    { value: 'ipa',     label: t('transcription.ipa') },
    { value: 'english', label: t('transcription.english') },
    { value: 'russian', label: t('transcription.russian_full') }
  ];
}

function inputOptions() {
  return [
    { value: 'latin',    label: t('input.latin.full') },
    { value: 'cyrillic', label: t('input.cyrillic.full') },
    { value: 'ipa',      label: t('input.ipa.full') }
  ];
}

function themeOptions() {
  return [
    { value: 'auto',  label: t('settings.theme.auto') },
    { value: 'light', label: t('settings.theme.light') },
    { value: 'dark',  label: t('settings.theme.dark') }
  ];
}

function timerOptions() {
  return [
    { value: 0,  label: t('settings.timer.off') },
    { value: 5,  label: t('settings.timer.5s') },
    { value: 10, label: t('settings.timer.10s') },
    { value: 15, label: t('settings.timer.15s') },
    { value: 20, label: t('settings.timer.20s') },
    { value: 30, label: t('settings.timer.30s') },
    { value: 60, label: t('settings.timer.60s') }
  ];
}

const SRS_FIELDS = [
  { key: 'again', labelKey: 'flashcards.again', hintKey: 'settings.srs.again.hint' },
  { key: 'hard',  labelKey: 'flashcards.hard',  hintKey: 'settings.srs.hard.hint' },
  { key: 'good',  labelKey: 'flashcards.good',  hintKey: 'settings.srs.good.hint' },
  { key: 'easy',  labelKey: 'flashcards.easy',  hintKey: 'settings.srs.easy.hint' }
];

export async function renderSettings(_, mount) {
  const settings = getSettings();
  const manifest = await getManifest();

  mount.innerHTML = '';
  const root = el(`
    <section class="settings">
      <div class="card">
        <h2>${escapeHtml(t('settings.appearance'))}</h2>

        <label class="field">
          <span class="field-label">${escapeHtml(t('settings.language'))}</span>
          <select id="uiLanguage"></select>
          <small class="muted">${escapeHtml(t('settings.language.hint'))}</small>
        </label>

        <label class="field">
          <span class="field-label">${escapeHtml(t('settings.theme'))}</span>
          <select id="theme"></select>
          <small class="muted">${escapeHtml(t('settings.theme.hint'))}</small>
        </label>
      </div>

      <div class="card">
        <h2>${escapeHtml(t('settings.transcription_input'))}</h2>

        <label class="field">
          <span class="field-label">${escapeHtml(t('settings.transcription'))}</span>
          <select id="transcription"></select>
          <small class="muted">${escapeHtml(t('settings.transcription.current', { label: transcriptionLabel(settings.transcription) }))}</small>
        </label>

        <label class="field">
          <span class="field-label">${escapeHtml(t('settings.input'))}</span>
          <select id="inputSystem"></select>
          <small class="muted">${escapeHtml(t('settings.input.hint'))}</small>
        </label>

        <label class="field checkbox-field">
          <input type="checkbox" id="vocalised" ${settings.vocalised ? 'checked' : ''} />
          <span class="field-label">${escapeHtml(t('settings.vocalised'))}</span>
          <small class="muted">${escapeHtml(t('settings.vocalised.hint'))}</small>
        </label>

        <label class="field checkbox-field">
          <input type="checkbox" id="fuzzy" ${settings.fuzzy ? 'checked' : ''} />
          <span class="field-label">${escapeHtml(t('settings.fuzzy'))}</span>
          <small class="muted">${escapeHtml(t('settings.fuzzy.hint'))}</small>
        </label>
      </div>

      <div class="card">
        <h2>${escapeHtml(t('settings.flashcards'))}</h2>

        <label class="field">
          <span class="field-label">${escapeHtml(t('settings.timer'))}</span>
          <select id="flashcardTimer"></select>
          <small class="muted">${escapeHtml(t('settings.timer.hint'))}</small>
        </label>

        <fieldset class="field srs-field">
          <legend class="field-label">${escapeHtml(t('settings.srs.title'))}</legend>
          <small class="muted">${escapeHtml(t('settings.srs.hint'))}</small>
          <div class="srs-grid">
            ${SRS_FIELDS.map(f => `
              <label class="srs-cell">
                <span>${escapeHtml(t(f.labelKey))}</span>
                <input type="number" min="0" step="1" inputmode="numeric" data-srs="${f.key}" value="${settings.srsIntervals[f.key] ?? 0}" />
                <small class="muted">${escapeHtml(t(f.hintKey))}</small>
              </label>
            `).join('')}
          </div>
        </fieldset>
      </div>

      <div class="card">
        <h2>${escapeHtml(t('settings.flashcards.syllables'))}</h2>
        <small class="muted">${escapeHtml(t('settings.flashcards.syllables.hint'))}</small>

        <label class="field">
          <span class="field-label">${escapeHtml(t('settings.timer'))}</span>
          <select id="syllablesTimer"></select>
          <small class="muted">${escapeHtml(t('settings.timer.hint'))}</small>
        </label>

        <fieldset class="field srs-field">
          <legend class="field-label">${escapeHtml(t('settings.srs.title'))}</legend>
          <small class="muted">${escapeHtml(t('settings.srs.hint'))}</small>
          <div class="srs-grid">
            ${SRS_FIELDS.map(f => `
              <label class="srs-cell">
                <span>${escapeHtml(t(f.labelKey))}</span>
                <input type="number" min="0" step="1" inputmode="numeric" data-srs-syllables="${f.key}" value="${settings.syllablesSrsIntervals[f.key] ?? 0}" />
                <small class="muted">${escapeHtml(t(f.hintKey))}</small>
              </label>
            `).join('')}
          </div>
        </fieldset>
      </div>

      <div class="card">
        <h2>${escapeHtml(t('settings.flashcards.words'))}</h2>
        <small class="muted">${escapeHtml(t('settings.flashcards.words.hint'))}</small>

        <label class="field">
          <span class="field-label">${escapeHtml(t('settings.timer'))}</span>
          <select id="wordsTimer"></select>
          <small class="muted">${escapeHtml(t('settings.timer.hint'))}</small>
        </label>

        <fieldset class="field srs-field">
          <legend class="field-label">${escapeHtml(t('settings.srs.title'))}</legend>
          <small class="muted">${escapeHtml(t('settings.srs.hint'))}</small>
          <div class="srs-grid">
            ${SRS_FIELDS.map(f => `
              <label class="srs-cell">
                <span>${escapeHtml(t(f.labelKey))}</span>
                <input type="number" min="0" step="1" inputmode="numeric" data-srs-words="${f.key}" value="${settings.wordsSrsIntervals[f.key] ?? 0}" />
                <small class="muted">${escapeHtml(t(f.hintKey))}</small>
              </label>
            `).join('')}
          </div>
        </fieldset>
      </div>

      <div class="card">
        <h2>${escapeHtml(t('settings.flashcards.phrases'))}</h2>
        <small class="muted">${escapeHtml(t('settings.flashcards.phrases.hint'))}</small>

        <label class="field">
          <span class="field-label">${escapeHtml(t('settings.timer'))}</span>
          <select id="phrasesTimer"></select>
          <small class="muted">${escapeHtml(t('settings.timer.hint'))}</small>
        </label>

        <fieldset class="field srs-field">
          <legend class="field-label">${escapeHtml(t('settings.srs.title'))}</legend>
          <small class="muted">${escapeHtml(t('settings.srs.hint'))}</small>
          <div class="srs-grid">
            ${SRS_FIELDS.map(f => `
              <label class="srs-cell">
                <span>${escapeHtml(t(f.labelKey))}</span>
                <input type="number" min="0" step="1" inputmode="numeric" data-srs-phrases="${f.key}" value="${settings.phrasesSrsIntervals[f.key] ?? 0}" />
                <small class="muted">${escapeHtml(t(f.hintKey))}</small>
              </label>
            `).join('')}
          </div>
        </fieldset>
      </div>

      <div class="card">
        <h2>${escapeHtml(t('settings.progress'))}</h2>
        <div class="table-scroll">
          <table class="progress-table">
            <thead><tr>
              <th>${escapeHtml(t('settings.progress.script'))}</th>
              <th>${escapeHtml(t('settings.progress.letters_known'))}</th>
              <th>${escapeHtml(t('settings.progress.words_correct'))}</th>
              <th></th>
            </tr></thead>
            <tbody></tbody>
          </table>
        </div>
        <button class="btn-danger" id="reset-all">${escapeHtml(t('settings.progress.reset_all'))}</button>
      </div>
    </section>
  `);

  // UI Language
  const langSel = root.querySelector('#uiLanguage');
  for (const o of LANGUAGES) {
    const opt = document.createElement('option');
    opt.value = o.code; opt.textContent = o.name;
    if (o.code === settings.uiLanguage) opt.selected = true;
    langSel.appendChild(opt);
  }
  langSel.addEventListener('change', () => {
    updateSettings({ uiLanguage: langSel.value });
    setLang(langSel.value);
    applyChromeStrings();
    applyTheme(getSettings().theme); // refresh theme tooltip in new language
    renderSettings(_, mount);
  });

  // Theme
  const themeSel = root.querySelector('#theme');
  for (const o of themeOptions()) {
    const opt = document.createElement('option');
    opt.value = o.value; opt.textContent = o.label;
    if (o.value === settings.theme) opt.selected = true;
    themeSel.appendChild(opt);
  }
  themeSel.addEventListener('change', () => {
    updateSettings({ theme: themeSel.value });
    applyTheme(themeSel.value);
  });

  // Transcription
  const transcriptionSel = root.querySelector('#transcription');
  for (const o of transcriptionOptions()) {
    const opt = document.createElement('option');
    opt.value = o.value; opt.textContent = o.label;
    if (o.value === settings.transcription) opt.selected = true;
    transcriptionSel.appendChild(opt);
  }
  transcriptionSel.addEventListener('change', () => {
    updateSettings({ transcription: transcriptionSel.value });
    renderSettings(_, mount);
  });

  // Input system
  const inputSel = root.querySelector('#inputSystem');
  for (const o of inputOptions()) {
    const opt = document.createElement('option');
    opt.value = o.value; opt.textContent = o.label;
    if (o.value === settings.inputSystem) opt.selected = true;
    inputSel.appendChild(opt);
  }
  inputSel.addEventListener('change', () => {
    updateSettings({ inputSystem: inputSel.value });
  });

  // Vocalised / fuzzy
  root.querySelector('#vocalised').addEventListener('change', e => updateSettings({ vocalised: e.target.checked }));
  root.querySelector('#fuzzy').addEventListener('change', e => updateSettings({ fuzzy: e.target.checked }));

  // Flashcard timer (letters)
  const timerSel = root.querySelector('#flashcardTimer');
  for (const o of timerOptions()) {
    const opt = document.createElement('option');
    opt.value = String(o.value); opt.textContent = o.label;
    if (o.value === settings.flashcardTimerSec) opt.selected = true;
    timerSel.appendChild(opt);
  }
  timerSel.addEventListener('change', () => {
    updateSettings({ flashcardTimerSec: Number(timerSel.value) });
  });

  // Syllables timer
  const syllablesTimerSel = root.querySelector('#syllablesTimer');
  for (const o of timerOptions()) {
    const opt = document.createElement('option');
    opt.value = String(o.value); opt.textContent = o.label;
    if (o.value === settings.syllablesTimerSec) opt.selected = true;
    syllablesTimerSel.appendChild(opt);
  }
  syllablesTimerSel.addEventListener('change', () => {
    updateSettings({ syllablesTimerSec: Number(syllablesTimerSel.value) });
  });

  // Phrases timer
  const phrasesTimerSel = root.querySelector('#phrasesTimer');
  for (const o of timerOptions()) {
    const opt = document.createElement('option');
    opt.value = String(o.value); opt.textContent = o.label;
    if (o.value === settings.phrasesTimerSec) opt.selected = true;
    phrasesTimerSel.appendChild(opt);
  }
  phrasesTimerSel.addEventListener('change', () => {
    updateSettings({ phrasesTimerSec: Number(phrasesTimerSel.value) });
  });

  // Words timer
  const wordsTimerSel = root.querySelector('#wordsTimer');
  for (const o of timerOptions()) {
    const opt = document.createElement('option');
    opt.value = String(o.value); opt.textContent = o.label;
    if (o.value === settings.wordsTimerSec) opt.selected = true;
    wordsTimerSel.appendChild(opt);
  }
  wordsTimerSel.addEventListener('change', () => {
    updateSettings({ wordsTimerSec: Number(wordsTimerSel.value) });
  });

  // SRS intervals (letters)
  for (const input of root.querySelectorAll('input[data-srs]')) {
    input.addEventListener('change', () => {
      const key = input.getAttribute('data-srs');
      const val = Math.max(0, Math.round(Number(input.value) || 0));
      updateSettings({ srsIntervals: { ...getSettings().srsIntervals, [key]: val } });
    });
  }

  // SRS intervals (syllables)
  for (const input of root.querySelectorAll('input[data-srs-syllables]')) {
    input.addEventListener('change', () => {
      const key = input.getAttribute('data-srs-syllables');
      const val = Math.max(0, Math.round(Number(input.value) || 0));
      updateSettings({ syllablesSrsIntervals: { ...getSettings().syllablesSrsIntervals, [key]: val } });
    });
  }

  // SRS intervals (phrases)
  for (const input of root.querySelectorAll('input[data-srs-phrases]')) {
    input.addEventListener('change', () => {
      const key = input.getAttribute('data-srs-phrases');
      const val = Math.max(0, Math.round(Number(input.value) || 0));
      updateSettings({ phrasesSrsIntervals: { ...getSettings().phrasesSrsIntervals, [key]: val } });
    });
  }

  // SRS intervals (words)
  for (const input of root.querySelectorAll('input[data-srs-words]')) {
    input.addEventListener('change', () => {
      const key = input.getAttribute('data-srs-words');
      const val = Math.max(0, Math.round(Number(input.value) || 0));
      updateSettings({ wordsSrsIntervals: { ...getSettings().wordsSrsIntervals, [key]: val } });
    });
  }

  // Progress table
  const tbody = root.querySelector('tbody');
  for (const s of manifest.scripts) {
    const st = summary(s.id);
    const tr = el(`
      <tr>
        <td><strong>${escapeHtml(localized(s.name))}</strong> <span class="muted small" dir="${s.direction}">${escapeHtml(s.nativeName)}</span></td>
        <td>${st.lettersKnown}</td>
        <td>${st.wordsCorrect} <span class="muted small">${escapeHtml(t('settings.progress.wrong_suffix', { n: st.wordsWrong }))}</span></td>
        <td><button class="btn-link" data-reset="${escapeHtml(s.id)}">${escapeHtml(t('settings.progress.reset'))}</button></td>
      </tr>
    `);
    tr.querySelector('[data-reset]').addEventListener('click', () => {
      if (confirm(t('settings.progress.reset_script_confirm', { name: localized(s.name) }))) {
        resetScript(s.id);
        renderSettings(_, mount);
      }
    });
    tbody.appendChild(tr);
  }

  root.querySelector('#reset-all').addEventListener('click', () => {
    if (confirm(t('settings.progress.reset_all_confirm'))) {
      resetAll();
      setLang(getSettings().uiLanguage);
      applyChromeStrings();
      applyTheme(getSettings().theme);
      location.hash = '#/home';
    }
  });

  mount.appendChild(root);
}
