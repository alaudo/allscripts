export function countdownBadgeHtml() {
  return '<span class="countdown-badge timer-countdown" hidden aria-live="off"></span>';
}

export function updateCountdownBadges(badges, remainingMs) {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  for (const badge of badges) {
    badge.textContent = `${seconds}s`;
    badge.hidden = false;
  }
}

export function hideCountdownBadges(badges) {
  for (const badge of badges) {
    badge.textContent = '';
    badge.hidden = true;
  }
}
