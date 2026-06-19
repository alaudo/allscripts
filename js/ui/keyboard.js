import { el, escapeHtml } from './dom.js';

// Renders an on-screen keyboard. Calls onInput(char) for each tap on a key,
// onBackspace() for the backspace key, and onSubmit() for the enter key. The
// keyboard is purely cosmetic for hardware-keyboard users — they can still
// type directly into the input.
export function renderKeyboard(container, rows, handlers, { direction = 'ltr' } = {}) {
  container.classList.add('keyboard');
  if (direction === 'rtl') container.classList.add('rtl');
  container.innerHTML = '';
  for (const row of rows) {
    const r = el('<div class="keyboard-row"></div>');
    for (const key of row) {
      const label = typeof key === 'object' ? key.label : key;
      const value = typeof key === 'object' ? key.value : String(label).replace(/\u25cc/g, '');
      const b = el(`<button type="button" class="keyboard-key" data-key="${escapeHtml(value)}">${escapeHtml(label)}</button>`);
      b.addEventListener('click', () => handlers.onInput && handlers.onInput(value));
      r.appendChild(b);
    }
    container.appendChild(r);
  }
  const utilRow = el('<div class="keyboard-row keyboard-utils"></div>');
  const back = el('<button type="button" class="keyboard-key keyboard-util">⌫ Back</button>');
  back.addEventListener('click', () => handlers.onBackspace && handlers.onBackspace());
  const enter = el('<button type="button" class="keyboard-key keyboard-util">Enter ⏎</button>');
  enter.addEventListener('click', () => handlers.onSubmit && handlers.onSubmit());
  utilRow.appendChild(back);
  utilRow.appendChild(enter);
  container.appendChild(utilRow);
}
