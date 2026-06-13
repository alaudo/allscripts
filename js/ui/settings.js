import { getSettings, updateSettings, resetScript, resetAll, summary } from '../storage.js';
import { getManifest } from '../data.js';
import { applyTheme } from '../theme.js';
import { el, escapeHtml, transcriptionLabel } from './dom.js';

const TRANSCRIPTION_OPTIONS = [
  { value: 'ipa',     label: 'IPA' },
  { value: 'english', label: 'English re-spelling' },
  { value: 'russian', label: 'Russian re-spelling (Cyrillic)' }
];

const INPUT_OPTIONS = [
  { value: 'latin',    label: 'Latin (English keyboard)' },
  { value: 'cyrillic', label: 'Cyrillic (Russian keyboard)' },
  { value: 'ipa',      label: 'IPA (with on-screen keyboard)' }
];

const THEME_OPTIONS = [
  { value: 'auto',  label: 'Match system' },
  { value: 'light', label: 'Light' },
  { value: 'dark',  label: 'Dark' }
];

const TIMER_OPTIONS = [
  { value: 0,  label: 'Off' },
  { value: 5,  label: '5 seconds' },
  { value: 10, label: '10 seconds' },
  { value: 15, label: '15 seconds' },
  { value: 20, label: '20 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' }
];

const SRS_FIELDS = [
  { key: 'again', label: 'Again',  hint: 'shown after this interval when you press Again' },
  { key: 'hard',  label: 'Hard',   hint: 'shown again after this many minutes for cards rated Hard' },
  { key: 'good',  label: 'Good',   hint: 'standard interval after a correct, normal response' },
  { key: 'easy',  label: 'Easy',   hint: 'long interval for confident, easy cards' }
];

export async function renderSettings(_, mount) {
  const settings = getSettings();
  const manifest = await getManifest();

  mount.innerHTML = '';
  const root = el(`
    <section class="settings">
      <div class="card">
        <h2>Appearance</h2>

        <label class="field">
          <span class="field-label">Theme</span>
          <select id="theme"></select>
          <small class="muted">"Match system" follows your OS light/dark preference.</small>
        </label>
      </div>

      <div class="card">
        <h2>Transcription &amp; input</h2>

        <label class="field">
          <span class="field-label">Transcription system</span>
          <select id="transcription"></select>
          <small class="muted">Currently: ${escapeHtml(transcriptionLabel(settings.transcription))}</small>
        </label>

        <label class="field">
          <span class="field-label">Read &amp; transcribe — input system</span>
          <select id="inputSystem"></select>
          <small class="muted">Which keyboard / phonetic system you'll use when typing the transliteration.</small>
        </label>

        <label class="field checkbox-field">
          <input type="checkbox" id="vocalised" ${settings.vocalised ? 'checked' : ''} />
          <span class="field-label">Show full vocalisation</span>
          <small class="muted">For scripts with optional diacritics (Arabic harakat, Hebrew niqqud), display the fully-pointed form in word exercises.</small>
        </label>

        <label class="field checkbox-field">
          <input type="checkbox" id="fuzzy" ${settings.fuzzy ? 'checked' : ''} />
          <span class="field-label">Forgiving (fuzzy) matching</span>
          <small class="muted">Accept answers with small spelling slips — e.g. "t" instead of "th", one missing letter — in read &amp; spell modes.</small>
        </label>
      </div>

      <div class="card">
        <h2>Flashcards</h2>

        <label class="field">
          <span class="field-label">Auto-advance timer</span>
          <select id="flashcardTimer"></select>
          <small class="muted">Auto-flips the card, then advances if you don't rate it in time. Off by default.</small>
        </label>

        <fieldset class="field srs-field">
          <legend class="field-label">Spaced repetition intervals (minutes)</legend>
          <small class="muted">When you rate a card, it disappears from the deck and reappears after this many minutes.</small>
          <div class="srs-grid">
            ${SRS_FIELDS.map(f => `
              <label class="srs-cell">
                <span>${escapeHtml(f.label)}</span>
                <input type="number" min="0" step="1" data-srs="${f.key}" value="${settings.srsIntervals[f.key] ?? 0}" />
                <small class="muted">${escapeHtml(f.hint)}</small>
              </label>
            `).join('')}
          </div>
        </fieldset>
      </div>

      <div class="card">
        <h2>Progress</h2>
        <table class="progress-table">
          <thead><tr><th>Script</th><th>Letters known</th><th>Words correct</th><th></th></tr></thead>
          <tbody></tbody>
        </table>
        <button class="btn-danger" id="reset-all">Reset all progress</button>
      </div>
    </section>
  `);

  // Theme
  const themeSel = root.querySelector('#theme');
  for (const o of THEME_OPTIONS) {
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
  for (const o of TRANSCRIPTION_OPTIONS) {
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
  for (const o of INPUT_OPTIONS) {
    const opt = document.createElement('option');
    opt.value = o.value; opt.textContent = o.label;
    if (o.value === settings.inputSystem) opt.selected = true;
    inputSel.appendChild(opt);
  }
  inputSel.addEventListener('change', () => {
    updateSettings({ inputSystem: inputSel.value });
  });

  // Vocalised
  const vocalisedEl = root.querySelector('#vocalised');
  vocalisedEl.addEventListener('change', () => {
    updateSettings({ vocalised: vocalisedEl.checked });
  });

  // Fuzzy
  const fuzzyEl = root.querySelector('#fuzzy');
  fuzzyEl.addEventListener('change', () => {
    updateSettings({ fuzzy: fuzzyEl.checked });
  });

  // Flashcard timer
  const timerSel = root.querySelector('#flashcardTimer');
  for (const o of TIMER_OPTIONS) {
    const opt = document.createElement('option');
    opt.value = String(o.value); opt.textContent = o.label;
    if (o.value === settings.flashcardTimerSec) opt.selected = true;
    timerSel.appendChild(opt);
  }
  timerSel.addEventListener('change', () => {
    updateSettings({ flashcardTimerSec: Number(timerSel.value) });
  });

  // SRS intervals
  for (const input of root.querySelectorAll('input[data-srs]')) {
    input.addEventListener('change', () => {
      const key = input.getAttribute('data-srs');
      const val = Math.max(0, Math.round(Number(input.value) || 0));
      updateSettings({ srsIntervals: { ...getSettings().srsIntervals, [key]: val } });
    });
  }

  const tbody = root.querySelector('tbody');
  for (const s of manifest.scripts) {
    const st = summary(s.id);
    const tr = el(`
      <tr>
        <td><strong>${escapeHtml(s.name)}</strong> <span class="muted small" dir="${s.direction}">${escapeHtml(s.nativeName)}</span></td>
        <td>${st.lettersKnown}</td>
        <td>${st.wordsCorrect} <span class="muted small">(${st.wordsWrong} wrong)</span></td>
        <td><button class="btn-link" data-reset="${escapeHtml(s.id)}">Reset</button></td>
      </tr>
    `);
    tr.querySelector('[data-reset]').addEventListener('click', () => {
      if (confirm(`Reset progress for ${s.name}?`)) {
        resetScript(s.id);
        renderSettings(_, mount);
      }
    });
    tbody.appendChild(tr);
  }

  root.querySelector('#reset-all').addEventListener('click', () => {
    if (confirm('Reset ALL settings and progress?')) {
      resetAll();
      applyTheme(getSettings().theme);
      location.hash = '#/home';
    }
  });

  mount.appendChild(root);
}
