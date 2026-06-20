// logic.js — hot-reloaded by app.js. Holds data + 16 selectable card LAYOUTS.

// ── themes (Color) ───────────────────────────────────────────────────────────────
const THEMES = {
  midnight: { bg: '#0e1525', up: '#22c55e', slow: '#f59e0b', down: '#ef4444', track: '#070c18', text: '#f1f5f9', muted: '#aab8cc' },
  carbon:   { bg: '#0a0a0a', up: '#34d399', slow: '#fbbf24', down: '#f87171', track: '#161616', text: '#f5f5f5', muted: '#b3b3b3' },
  ocean:    { bg: '#011627', up: '#2ec4b6', slow: '#ff9f1c', down: '#e71d36', track: '#001019', text: '#cde7f0', muted: '#86a3b2' },
  grape:    { bg: '#1a1030', up: '#a78bfa', slow: '#fb923c', down: '#fb7185', track: '#120a22', text: '#ede9fe', muted: '#b3a6cc' },
  slate:    { bg: '#0f172a', up: '#10b981', slow: '#f97316', down: '#ef4444', track: '#070d1a', text: '#f8fafc', muted: '#9aa8bd' },
  mono:     { bg: '#000000', up: '#ffffff', slow: '#bbbbbb', down: '#ff4d4d', track: '#141414', text: '#ffffff', muted: '#b3b3b3' },
  paper:    { bg: '#f5f7fa', up: '#16a34a', slow: '#ea580c', down: '#dc2626', track: '#e7ebf1', text: '#0f172a', muted: '#5a6678' },
  snow:     { bg: '#ffffff', up: '#15803d', slow: '#b45309', down: '#b91c1c', track: '#eef0f3', text: '#111827', muted: '#5b6371' },
  daylight: { bg: '#eef4ff', up: '#0284c7', slow: '#d97706', down: '#dc2626', track: '#dfe9fb', text: '#0b1e33', muted: '#516079' },
  sand:     { bg: '#fbf6ec', up: '#2f855a', slow: '#c05621', down: '#c53030', track: '#f1ebdc', text: '#3b2f1e', muted: '#7a6a4f' }
};
const PERIOD_MS = { '1h': 3600e3, '24h': 86400e3, '7d': 604800e3, '30d': 2592000e3 };
export const LAYOUT_KEYS = ['chips','header','ring','split','minimal','line','bars','dual','statusHero','rows','progress','dots','grid','nameHero','sidebar','gauge'];

// ── helpers ────────────────────────────────────────────────────────────────────
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function fmtDur(ms) { if (ms == null) return '···'; if (ms >= 1000) return (ms / 1000).toFixed(ms < 10000 ? 1 : 0) + 's'; return Math.round(ms) + 'ms'; }
function durOf(e) { const s = e.startedAt ? Date.parse(e.startedAt) : 0; const st = e.stoppedAt ? Date.parse(e.stoppedAt) : s; return Math.max(0, st - s); }
async function n8nFetch(base, apiKey, pathStr, timeoutMs = 8000) {
  const url = base.replace(/\/+$/, '') + '/api/v1' + pathStr;
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try { const res = await fetch(url, { headers: { 'X-N8N-API-KEY': apiKey, 'Accept': 'application/json' }, signal: ctrl.signal }); if (!res.ok) throw new Error('HTTP ' + res.status); return await res.json(); }
  finally { clearTimeout(timer); }
}

// ── config ───────────────────────────────────────────────────────────────────────
export const CONFIG_DEFAULTS = {
  n8nUrl: '', apiKey: '', workflowId: '',
  intervalSec: 30, warnMs: 5000, warnErrors: 1, critErrors: 5,
  theme: 'midnight', layout: 'chips', metric: 'runs', period: '24h', textScale: '4', pressAction: 'workflow', nameMode: 'left', titleScale: '4', lang: 'en', notify: false
};
export function applyConfig(config, p) {
  const idBefore = `${config.workflowId}|${config.n8nUrl}|${config.apiKey}`;
  if (p.n8nUrl != null) config.n8nUrl = String(p.n8nUrl).trim();
  if (p.apiKey != null) config.apiKey = String(p.apiKey).trim();
  if (p.workflowId != null) config.workflowId = String(p.workflowId).trim();
  if (p.intervalSec != null) config.intervalSec = Math.max(5, parseInt(p.intervalSec) || 30);
  if (p.warnMs != null) config.warnMs = Math.max(100, parseInt(p.warnMs) || 5000);
  if (p.warnErrors != null) config.warnErrors = Math.max(0, parseInt(p.warnErrors) || 1);
  if (p.critErrors != null) config.critErrors = Math.max(1, parseInt(p.critErrors) || 5);
  if (p.theme != null) config.theme = p.theme;
  if (p.layout != null && LAYOUT_KEYS.includes(p.layout)) config.layout = p.layout;
  if (p.metric != null) config.metric = p.metric;
  if (p.period != null && PERIOD_MS[p.period]) config.period = p.period;
  if (p.textScale != null && (/^([1-9]|10)$/.test(String(p.textScale)) || ['s', 'm', 'l', 'xl'].includes(p.textScale))) config.textScale = String(p.textScale);
  if (p.pressAction != null && ['workflow', 'executions'].includes(p.pressAction)) config.pressAction = p.pressAction;
  if (p.nameMode != null && ['paginate', 'scroll', 'fit', 'left'].includes(p.nameMode)) config.nameMode = p.nameMode;
  if (p.titleScale != null && /^([1-9]|10)$/.test(String(p.titleScale))) config.titleScale = String(p.titleScale);
  if (p.lang != null) config.lang = String(p.lang);
  if (p.notify != null) config.notify = (p.notify === true || p.notify === 'true' || p.notify === 1 || p.notify === '1');
  return `${config.workflowId}|${config.n8nUrl}|${config.apiKey}` !== idBefore;
}
export function freshState() { return { name: '—', runs: null, errors: 0, successPct: null, avgMs: null, lastMs: null, history: [], capped: false, status: 'checking', _nameLoaded: false }; }

// ── data ─────────────────────────────────────────────────────────────────────────
export async function computeStats(config, prev) {
  const s = { ...prev };
  if (!config.workflowId || !config.apiKey) { s.status = 'checking'; s.name = 'set workflow…'; return s; }
  try {
    if (!s._nameLoaded) { try { const wf = await n8nFetch(config.n8nUrl, config.apiKey, `/workflows/${config.workflowId}`); s.name = wf.name || config.workflowId.slice(0, 10); s._nameLoaded = true; } catch (e) {} }
    const data = await n8nFetch(config.n8nUrl, config.apiKey, `/executions?workflowId=${encodeURIComponent(config.workflowId)}&limit=250`);
    const execs = data.data || [];
    const since = Date.now() - (PERIOD_MS[config.period] || PERIOD_MS['24h']);
    const win = execs.filter(e => e.startedAt && Date.parse(e.startedAt) >= since);
    s.runs = win.length;
    s.errors = win.filter(e => e.status === 'error').length;
    const ok = win.filter(e => e.status === 'success').length;
    s.successPct = s.runs ? Math.round((ok / s.runs) * 100) : null;
    const durs = win.map(durOf).filter(d => d > 0);
    s.avgMs = durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : null;
    s.history = win.slice(0, 32).reverse().map(e => ({ ok: e.status !== 'error', ms: durOf(e) || 1 }));
    const lastE = win[0] || execs[0];
    s.lastMs = lastE ? durOf(lastE) : null;
    s.capped = execs.length >= 250 && win.length === execs.length && (config.period === '7d' || config.period === '30d');
    if (s.errors >= config.critErrors) s.status = 'down';
    else if (s.errors >= config.warnErrors || (s.lastMs != null && s.lastMs > config.warnMs)) s.status = 'slow';
    else s.status = 'up';
  } catch (e) { s.status = 'down'; if (!s._nameLoaded) s.name = 'API ERROR'; }
  return s;
}

// ── view model (shared by every layout) ──────────────────────────────────────────
function view(o) {
  const t = THEMES[o.theme] || THEMES.midnight;
  const sc = o.status === 'down' ? t.down : o.status === 'slow' ? t.slow : o.status === 'up' ? t.up : t.muted;
  const flash = o.status === 'down' && o.blinkOn;
  const af = o.animFrame || 0;
  const period = o.period || '24h', metric = o.metric || 'runs';
  let hero, sub;
  if (o.status === 'checking' && o.runs == null) { hero = '···'; sub = ''; }
  else if (metric === 'avg') { hero = fmtDur(o.avgMs); sub = `avg · ${period}`; }
  else if (metric === 'success') { hero = (o.successPct != null ? o.successPct + '%' : '—'); sub = `success · ${period}`; }
  else if (metric === 'errors') { hero = String(o.errors || 0); sub = `errors · ${period}`; }
  else { hero = String(o.runs || 0) + (o.capped ? '+' : ''); sub = `runs · ${period}`; }
  return {
    t, sc, flash, af, status: o.status, anim: o.status === 'up' || o.status === 'slow',
    slowPulse: o.status === 'slow' ? (0.65 + 0.35 * ((Math.sin(af * 0.25) + 1) / 2)) : 1,
    statusText: o.status === 'down' ? 'ERR' : o.status === 'slow' ? 'WARN' : o.status === 'up' ? 'OK' : 'CHECK',
    bg: flash ? t.down : t.bg, fg: flash ? t.bg : t.text, accent: flash ? t.bg : sc, muted: flash ? t.bg : t.muted,
    name: esc(o.name || '—'), hero, sub, period, metric,
    runs: o.runs || 0, errors: o.errors || 0, successPct: o.successPct, history: o.history || [],
    successStr: (o.successPct != null ? o.successPct + '%' : '—'), errStr: String(o.errors || 0),
    errCol: flash ? t.bg : ((o.errors || 0) > 0 ? t.slow : t.muted), avgStr: fmtDur(o.avgMs)
  };
}

// ── render fragments ──────────────────────────────────────────────────────────────
const BG = v => `<rect width="256" height="256" rx="36" fill="${v.bg}"/>`;
const dot = (cx, cy, r, c, anim) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}">${anim ? `<animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite"/>` : ''}</circle>`;
function nameC(v, y, size, col) {
  const tf = TEXT_SCALE[v.titleScale] || 1.3;   // title has its OWN size slider (titleScale), default ~level 4
  const fs = (size * tf).toFixed(1);            // DECIMAL font-size → escapes the global text-scale regex (title sized ONLY by titleScale)
  const charW = size * tf * 0.56, band = 216;
  const w = v.name.length * charW;
  if (w <= band) return `<text x="128" y="${y}" text-anchor="middle" fill="${col}" font-size="${fs}">${v.name}</text>`;
  const mode = v.nameMode || 'left';
  if (mode === 'left') return `<text x="20" y="${y}" fill="${col}" font-size="${fs}">${v.name}</text>`;   // left-aligned, clips at the key edge — static (default, zero load)
  if (mode === 'fit') {   // edge-to-edge: largest size that fits the FULL key width (~240px, small margins)
    const ff = Math.max(9, size * tf * 240 / w).toFixed(1);
    return `<text x="128" y="${y}" text-anchor="middle" fill="${col}" font-size="${ff}">${v.name}</text>`;
  }
  if (mode === 'scroll') {   // continuous marquee — smooth with few keys, choppy with many on the slow screen
    const p = w + 52, off = (((v.animMs || 0) / 1000 * 18) % p).toFixed(1);
    return `<text x="${(20 - off).toFixed(1)}" y="${y}" fill="${col}" font-size="${fs}">${v.name}</text><text x="${(20 - off + p).toFixed(1)}" y="${y}" fill="${col}" font-size="${fs}">${v.name}</text>`;
  }
  // paginate: show the name in fitting pages, flip every ~2.2s → ~0.5 push/s, smooth at ANY key count
  const perPage = Math.max(1, Math.floor(band / charW));
  const pages = Math.ceil(v.name.length / perPage);
  const pi = Math.floor((v.animMs || 0) / 2200) % pages;
  return `<text x="128" y="${y}" text-anchor="middle" fill="${col}" font-size="${fs}">${v.name.slice(pi * perPage, (pi + 1) * perPage)}</text>`;
}
const hero = (v, y, size) => `<text x="128" y="${y}" text-anchor="middle" fill="${v.fg}" font-size="${v.hero.length >= 4 ? Math.round(size * 0.82) : size}" font-weight="bold">${v.hero}</text>`;
const statusW = (v, x, y, size) => `<text x="${x}" y="${y}" fill="${v.accent}" font-size="${size}" font-weight="bold" letter-spacing="1" opacity="${v.slowPulse.toFixed(2)}">${v.statusText}</text>`;
function chips(v, y) {
  const py = y - 28, lab = v.flash ? v.t.bg : v.t.muted;
  return `<rect x="12" y="${py}" width="232" height="58" rx="16" fill="${v.flash ? v.t.down : v.t.track}"/>`
    + `<text x="52" y="${y}" text-anchor="middle" fill="${v.flash ? v.t.bg : v.t.up}" font-size="27" font-weight="bold">${v.successStr}</text><text x="52" y="${y + 22}" text-anchor="middle" fill="${lab}" font-size="18">success</text>`
    + `<text x="128" y="${y}" text-anchor="middle" fill="${v.errCol}" font-size="27" font-weight="bold">${v.errStr}</text><text x="128" y="${y + 22}" text-anchor="middle" fill="${lab}" font-size="18">errors</text>`
    + `<text x="204" y="${y}" text-anchor="middle" fill="${v.flash ? v.t.bg : v.t.text}" font-size="27" font-weight="bold">${v.avgStr}</text><text x="204" y="${y + 22}" text-anchor="middle" fill="${lab}" font-size="18">avg</text>`;
}
function ringEl(cx, cy, r, pct, col, track, sw) {
  const c = 2 * Math.PI * r, on = c * Math.min(100, Math.max(0, pct || 0)) / 100;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${track}" stroke-width="${sw}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${on.toFixed(1)} ${(c - on).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`;
}
function lineG(v, x0, y0, x1, y1) {
  const h = v.history; if (!h.length) return `<text x="128" y="${((y0 + y1) / 2 + 4).toFixed(0)}" text-anchor="middle" fill="${v.muted}" font-size="14">waiting…</text>`;
  const max = Math.max(150, ...h.map(p => p.ms)); const n = h.length, step = n > 1 ? (x1 - x0) / (n - 1) : 0;
  const pts = h.map((p, i) => `${(x0 + i * step).toFixed(1)},${(y1 - (p.ms / max) * (y1 - y0)).toFixed(1)}`).join(' ');
  return `<polyline points="${pts}" fill="none" stroke="${v.flash ? v.t.bg : v.sc}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
}
function barG(v, x0, y0, x1, y1) {
  const h = v.history; if (!h.length) return `<text x="128" y="${((y0 + y1) / 2 + 4).toFixed(0)}" text-anchor="middle" fill="${v.muted}" font-size="14">waiting…</text>`;
  const max = Math.max(150, ...h.filter(p => p.ok).map(p => p.ms), 1); const n = h.length, bw = (x1 - x0) / n;
  return h.map((p, i) => { const x = (x0 + i * bw).toFixed(1), w = Math.max(1.5, bw - 1.5).toFixed(1); if (!p.ok) return `<rect x="${x}" y="${y0}" width="${w}" height="${y1 - y0}" rx="1" fill="${v.t.down}"/>`; const bh = Math.max(2, (p.ms / max) * (y1 - y0)); return `<rect x="${x}" y="${(y1 - bh).toFixed(1)}" width="${w}" height="${bh.toFixed(1)}" rx="1" fill="${v.flash ? v.t.bg : v.sc}"/>`; }).join('');
}
function dotsRow(v, y) {
  const h = v.history.slice(-9); if (!h.length) return `<text x="128" y="${y + 4}" text-anchor="middle" fill="${v.muted}" font-size="14">waiting…</text>`;
  const n = h.length, step = 216 / Math.max(1, n - 1);
  return h.map((p, i) => `<circle cx="${(22 + i * step).toFixed(1)}" cy="${y}" r="8" fill="${p.ok ? v.sc : v.t.down}"/>`).join('');
}

// ── 16 LAYOUTS ────────────────────────────────────────────────────────────────────
const LAYOUTS = {
  chips: v => BG(v) + dot(28, 33, 8, v.accent, v.anim) + statusW(v, 44, 42, 27) + nameC(v, 66, 27, v.muted) + hero(v, 136, 66) + `<text x="128" y="162" text-anchor="middle" fill="${v.muted}" font-size="18">${v.sub}</text>` + chips(v, 214),

  header: v => BG(v) + `<path d="M0 36 A36 36 0 0 1 36 0 H220 A36 36 0 0 1 256 36 V58 H0 Z" fill="${v.flash ? v.t.bg : v.sc}"/>` + `<text x="128" y="40" text-anchor="middle" fill="${v.bg}" font-size="26" font-weight="bold" letter-spacing="1">${v.statusText}</text>` + nameC(v, 92, 24, v.muted) + hero(v, 166, 66) + `<text x="128" y="194" text-anchor="middle" fill="${v.muted}" font-size="18">${v.sub}</text>` + `<text x="128" y="228" text-anchor="middle" fill="${v.muted}" font-size="19">${v.successStr} ok · ${v.errStr} err</text>`,

  ring: v => BG(v) + nameC(v, 42, 22, v.muted) + ringEl(128, 138, 62, v.successPct, v.flash ? v.t.bg : v.sc, v.t.track, 13) + `<text x="128" y="146" text-anchor="middle" fill="${v.fg}" font-size="${v.hero.length >= 4 ? 44 : 52}" font-weight="bold">${v.hero}</text>` + `<text x="128" y="172" text-anchor="middle" fill="${v.muted}" font-size="16">${v.sub.split(' · ')[0]}</text>` + `<text x="128" y="230" text-anchor="middle" fill="${v.muted}" font-size="18">${v.successStr} success</text>`,

  split: v => BG(v) + dot(20, 26, 6, v.accent, v.anim) + statusW(v, 32, 32, 18) + `<text x="74" y="124" text-anchor="middle" fill="${(v.status === 'up' || v.status === 'checking') ? v.fg : v.accent}" font-size="${v.hero.length >= 4 ? 48 : 58}" font-weight="bold">${v.hero}</text>` + `<text x="74" y="150" text-anchor="middle" fill="${v.muted}" font-size="15">${v.sub}</text>` + `<line x1="146" y1="56" x2="146" y2="208" stroke="${v.t.track}" stroke-width="2"/>` + `<text x="202" y="96" text-anchor="middle" fill="${v.flash ? v.t.bg : v.t.up}" font-size="24" font-weight="bold">${v.successStr}</text><text x="202" y="114" text-anchor="middle" fill="${v.muted}" font-size="13">success</text>` + `<text x="202" y="154" text-anchor="middle" fill="${v.errors > 0 ? v.accent : v.muted}" font-size="24" font-weight="bold">${v.errStr}</text><text x="202" y="172" text-anchor="middle" fill="${v.muted}" font-size="13">errors</text>` + `<text x="202" y="208" text-anchor="middle" fill="${v.fg}" font-size="22" font-weight="bold">${v.avgStr}</text><text x="202" y="226" text-anchor="middle" fill="${v.muted}" font-size="13">avg</text>`,

  minimal: v => BG(v) + nameC(v, 46, 20, v.muted) + `<text x="128" y="158" text-anchor="middle" fill="${(v.status === 'up' || v.status === 'checking') ? v.fg : v.accent}" font-size="${v.hero.length >= 4 ? 92 : 116}" font-weight="bold">${v.hero}</text>` + `<text x="128" y="198" text-anchor="middle" fill="${v.accent}" font-size="20">${v.sub}</text>`,

  line: v => BG(v) + dot(22, 28, 6, v.accent, v.anim) + statusW(v, 34, 34, 18) + nameC(v, 58, 16, v.muted) + hero(v, 110, 56) + `<text x="128" y="134" text-anchor="middle" fill="${v.muted}" font-size="15">${v.sub}</text>` + lineG(v, 22, 156, 234, 210) + `<text x="22" y="240" fill="${v.muted}" font-size="16">success</text><text x="234" y="240" text-anchor="end" fill="${v.flash ? v.t.bg : v.t.up}" font-size="18" font-weight="bold">${v.successStr}</text>`,

  bars: v => BG(v) + dot(22, 28, 6, v.accent, v.anim) + statusW(v, 34, 34, 18) + nameC(v, 58, 16, v.muted) + hero(v, 110, 56) + `<text x="128" y="134" text-anchor="middle" fill="${v.muted}" font-size="15">${v.sub}</text>` + barG(v, 22, 156, 234, 210) + `<text x="234" y="240" text-anchor="end" fill="${v.flash ? v.t.bg : v.t.up}" font-size="17" font-weight="bold">${v.successStr} ok</text>`,

  dual: v => BG(v) + nameC(v, 44, 22, v.muted) + `<text x="74" y="144" text-anchor="middle" fill="${v.fg}" font-size="56" font-weight="bold">${String(v.runs)}</text><text x="74" y="170" text-anchor="middle" fill="${v.muted}" font-size="16">runs</text>` + `<text x="184" y="144" text-anchor="middle" fill="${v.errors > 0 ? v.sc : v.t.up}" font-size="56" font-weight="bold">${v.errStr}</text><text x="184" y="170" text-anchor="middle" fill="${v.muted}" font-size="16">errors</text>` + `<text x="128" y="220" text-anchor="middle" fill="${v.muted}" font-size="18">${v.successStr} ok · ${v.avgStr} avg</text>`,

  statusHero: v => BG(v) + nameC(v, 58, 20, v.muted) + `<text x="128" y="128" text-anchor="middle" fill="${v.accent}" font-size="76" font-weight="bold" opacity="${v.slowPulse.toFixed(2)}">${v.statusText}</text>` + `<text x="128" y="178" text-anchor="middle" fill="${v.fg}" font-size="22">${v.runs} runs · ${v.successStr}</text>` + `<text x="128" y="212" text-anchor="middle" fill="${v.muted}" font-size="18">${v.errStr} err · ${v.avgStr} avg</text>`,

  rows: v => { const r = (y, l, val, c) => `<text x="26" y="${y}" fill="${v.muted}" font-size="19">${l}</text><text x="230" y="${y}" text-anchor="end" fill="${c}" font-size="23" font-weight="bold">${val}</text>`; return BG(v) + nameC(v, 42, 22, v.muted) + r(92, 'Runs', String(v.runs), v.fg) + (v.status === 'down' ? `<rect x="16" y="${132 - Math.round(23 * (v.tk || 1)) + 4}" width="224" height="${Math.round(23 * (v.tk || 1)) + 13}" rx="13" fill="${v.t.down}"/><text x="26" y="132" fill="#ffffff" font-size="19">Errors</text><text x="230" y="132" text-anchor="end" fill="#ffffff" font-size="23" font-weight="bold">${v.errStr}</text>` : r(132, 'Errors', v.errStr, v.errCol)) + r(172, 'Success', v.successStr, v.flash ? v.t.bg : v.t.up) + r(212, 'Avg', v.avgStr, v.fg); },

  progress: v => { const pct = Math.min(100, Math.max(0, v.successPct || 0)); return BG(v) + dot(22, 28, 6, v.accent, v.anim) + statusW(v, 34, 34, 18) + nameC(v, 58, 16, v.muted) + hero(v, 130, 64) + `<text x="128" y="156" text-anchor="middle" fill="${v.muted}" font-size="16">${v.sub}</text>` + `<text x="22" y="198" fill="${v.muted}" font-size="16">success ${v.successStr}</text>` + `<rect x="22" y="208" width="212" height="18" rx="9" fill="${v.t.track}"/><rect x="22" y="208" width="${(212 * pct / 100).toFixed(0)}" height="18" rx="9" fill="${v.flash ? v.t.bg : v.sc}"/>`; },

  dots: v => BG(v) + dot(22, 28, 6, v.accent, v.anim) + statusW(v, 34, 34, 18) + nameC(v, 58, 16, v.muted) + hero(v, 120, 62) + `<text x="128" y="146" text-anchor="middle" fill="${v.muted}" font-size="15">${v.sub}</text>` + dotsRow(v, 192) + `<text x="234" y="236" text-anchor="end" fill="${v.flash ? v.t.bg : v.t.up}" font-size="17" font-weight="bold">${v.successStr}</text>`,

  grid: v => { const cell = (cx, cy, big, small, c) => `<text x="${cx}" y="${cy}" text-anchor="middle" fill="${c}" font-size="34" font-weight="bold">${big}</text><text x="${cx}" y="${cy + 20}" text-anchor="middle" fill="${v.muted}" font-size="13">${small}</text>`; return BG(v) + nameC(v, 42, 22, v.muted) + `<line x1="128" y1="58" x2="128" y2="240" stroke="${v.t.track}" stroke-width="2"/><line x1="20" y1="150" x2="236" y2="150" stroke="${v.t.track}" stroke-width="2"/>` + cell(74, 104, String(v.runs), 'runs', v.fg) + (v.status === 'down' ? `<rect x="140" y="72" width="84" height="62" rx="15" fill="${v.t.down}"/><text x="182" y="105" text-anchor="middle" fill="#ffffff" font-size="34" font-weight="bold">${v.errStr}</text><text x="182" y="125" text-anchor="middle" fill="#ffffff" font-size="13" opacity="0.85">errors</text>` : cell(182, 104, v.errStr, 'errors', v.errCol)) + cell(74, 200, v.successStr, 'success', v.flash ? v.t.bg : v.t.up) + cell(182, 200, v.avgStr, 'avg', v.fg); },

  nameHero: v => BG(v) + dot(98, 56, 8, v.accent, v.anim) + `<text x="116" y="62" fill="${v.accent}" font-size="20" font-weight="bold">${v.statusText}</text>` + `<text x="128" y="142" text-anchor="middle" fill="${(v.status === 'up' || v.status === 'checking') ? v.fg : v.accent}" font-size="${v.name.length > 9 ? 32 : 42}" font-weight="bold">${v.name.slice(0, 14)}</text>` + `<text x="128" y="182" text-anchor="middle" fill="${v.muted}" font-size="18">${v.runs} runs · ${v.successStr} ok</text>` + `<text x="128" y="212" text-anchor="middle" fill="${v.muted}" font-size="17">${v.errStr} err · ${v.avgStr} avg</text>`,

  sidebar: v => BG(v) + `<rect x="14" y="20" width="10" height="216" rx="5" fill="${v.accent}"/>` + statusW(v, 40, 44, 24) + `<text x="40" y="76" fill="${v.muted}" font-size="20">${v.name.slice(0, 13)}</text>` + `<text x="140" y="150" text-anchor="middle" fill="${v.fg}" font-size="${v.hero.length >= 4 ? 52 : 64}" font-weight="bold">${v.hero}</text>` + `<text x="140" y="176" text-anchor="middle" fill="${v.muted}" font-size="16">${v.sub}</text>` + `<text x="40" y="220" fill="${v.muted}" font-size="17">${v.successStr} · ${v.errStr} err · ${v.avgStr}</text>`,

  gauge: v => { const pct = Math.min(100, Math.max(0, v.successPct || 0)); const a = Math.PI * (1 - pct / 100); const ex = (128 + 84 * Math.cos(a)).toFixed(1), ey = (178 - 84 * Math.sin(a)).toFixed(1); return BG(v) + nameC(v, 44, 22, v.muted) + `<path d="M44 178 A84 84 0 0 1 212 178" fill="none" stroke="${v.t.track}" stroke-width="14" stroke-linecap="round"/>` + `<path d="M44 178 A84 84 0 0 1 ${ex} ${ey}" fill="none" stroke="${v.flash ? v.t.bg : v.sc}" stroke-width="14" stroke-linecap="round"/>` + `<text x="128" y="160" text-anchor="middle" fill="${v.fg}" font-size="${v.hero.length >= 4 ? 36 : 44}" font-weight="bold">${v.hero}</text>` + `<text x="128" y="184" text-anchor="middle" fill="${v.muted}" font-size="15">${v.sub.split(' · ')[0]}</text>` + `<text x="128" y="226" text-anchor="middle" fill="${v.muted}" font-size="17">${v.successStr} · ${v.errStr} err</text>`; }
};

const TEXT_SCALE = { s: 0.88, m: 1, l: 1.16, xl: 1.32, '1': 0.85, '2': 1.0, '3': 1.15, '4': 1.3, '5': 1.45, '6': 1.6, '7': 1.75, '8': 1.9, '9': 2.05, '10': 2.2 };
export function generateSVG(o) {
  const k = TEXT_SCALE[o.textScale] || 1;
  const v = view(o);
  v.tk = k;   // expose scale → marquee width matches the post-scaled font (copies won't collide)
  v.animMs = o.animMs || 0;   // wall-clock ms → time-based, jitter-free marquee scroll
  v.nameMode = o.nameMode || 'left';   // long-name display: left / fit / paginate / scroll
  v.titleScale = o.titleScale;   // independent title size — nameC renders a DECIMAL fs to dodge the global regex
  const key = (o.layout && LAYOUTS[o.layout]) ? o.layout : 'chips';
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" font-family="Arial, Helvetica, sans-serif">${LAYOUTS[key](v)}</svg>`;
  // global text scale: bumps SECONDARY text (≤32px) in ANY layout; hero (>32px) stays
  if (k !== 1) svg = svg.replace(/font-size="(\d+)"/g, (m, n) => { const s = +n; return s <= 32 ? `font-size="${Math.round(s * k)}"` : m; });
  return svg;
}
