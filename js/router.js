// Very small hash router. Each route is registered with a render function that
// receives a parsed route { name, params } and the mount element.

const routes = new Map();
let mount = null;
let fallback = null;

export function registerRoute(name, render) {
  routes.set(name, render);
}

export function setFallback(render) {
  fallback = render;
}

function parseHash() {
  const raw = (location.hash || '#/home').replace(/^#\/?/, '');
  const [name, ...rest] = raw.split('/');
  const params = {};
  for (let i = 0; i < rest.length; i += 2) {
    if (rest[i]) params[rest[i]] = decodeURIComponent(rest[i + 1] || '');
  }
  return { name: name || 'home', params };
}

async function dispatch() {
  if (!mount) return;
  const route = parseHash();
  const render = routes.get(route.name) || fallback;
  mount.innerHTML = '';
  try {
    await render(route, mount);
  } catch (err) {
    mount.innerHTML = `<div class="card error">Failed to render route: ${escapeHtml(err.message)}</div>`;
    console.error(err);
  }
  updateNavHighlight(route.name);
}

function updateNavHighlight(name) {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.classList.toggle('active', el.dataset.nav === name);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function startRouter(mountEl) {
  mount = mountEl;
  window.addEventListener('hashchange', dispatch);
  return dispatch();
}

export function navigate(hash) {
  if (location.hash === hash) {
    return dispatch();
  }
  location.hash = hash;
}
