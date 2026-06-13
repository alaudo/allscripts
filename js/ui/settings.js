import { getSettings, updateSettings, resetScript, resetAll, summary } from '../storage.js';
import { getManifest } from '../data.js';
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

export async function renderSettings(_, mount) {
  const settings = getSettings();
  const manifest = await getManifest();

  mount.innerHTML = '';
  const root = el(`
    <section class="settings">
      <div class="card">
        <h2>Settings</h2>

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

  const vocalisedEl = root.querySelector('#vocalised');
  vocalisedEl.addEventListener('change', () => {
    updateSettings({ vocalised: vocalisedEl.checked });
  });

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
      location.hash = '#/home';
    }
  });

  mount.appendChild(root);
}
