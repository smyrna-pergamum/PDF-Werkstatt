
/* =========================================================================
   Page rendering (pdf.js) — cache and queue
   ========================================================================= */
const mainCache = new Map(), thumbCache = new Map();
function cacheGet(c, k) { const v = c.get(k); if (v) { c.delete(k); c.set(k, v); } return v; }
function cacheSet(c, k, v, max) { c.set(k, v); while (c.size > max) c.delete(c.keys().next().value); }
const RQ = { running: 0, q: [] };
function enqueue(fn, urgent) {
  return new Promise((res, rej) => { const job = { fn, res, rej }; urgent ? RQ.q.unshift(job) : RQ.q.push(job); pump(); });
}
function pump() {
  while (RQ.running < 2 && RQ.q.length) {
    const j = RQ.q.shift(); RQ.running++;
    j.fn().then(j.res, j.rej).finally(() => { RQ.running--; pump(); });
  }
}
async function renderOff(page, rotation, pxW, pxH, forms) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, pxW, pxH);
  if (!page.srcId || !S.doc) return c;
  const src = S.doc.sources.get(page.srcId); if (!src) return c;
  const p = await src.pdf.getPage(page.index + 1);
  const vp1 = p.getViewport({ scale: 1, rotation });
  const vp = p.getViewport({ scale: pxW / vp1.width, rotation });
  await p.render({ canvasContext: ctx, viewport: vp, annotationMode: forms ? pdfjs.AnnotationMode.ENABLE_FORMS : pdfjs.AnnotationMode.ENABLE }).promise;
  return c;
}
function blit(dst, src) { dst.width = src.width; dst.height = src.height; dst.getContext('2d').drawImage(src, 0, 0); }
async function paint(canvas, page, cssW, cssH, rotation, opts) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let pxW = Math.max(1, Math.round(cssW * dpr)), pxH = Math.max(1, Math.round(cssH * dpr));
  const maxPx = 14e6;
  if (pxW * pxH > maxPx) { const k = Math.sqrt(maxPx / (pxW * pxH)); pxW = Math.floor(pxW * k); pxH = Math.floor(pxH * k); }
  const key = `${page.srcId || 'blank'}:${page.index}:${rotation}:${pxW}x${pxH}:${opts.forms ? 1 : 0}`;
  if (canvas._key === key) return;
  const cache = opts.thumb ? thumbCache : mainCache;
  const hit = cacheGet(cache, key);
  if (hit) { blit(canvas, hit); canvas._key = key; return; }
  canvas._want = key;
  let off;
  try { off = await enqueue(() => canvas._want === key && canvas.isConnected ? renderOff(page, rotation, pxW, pxH, opts.forms) : Promise.resolve(null), !opts.thumb); }
  catch (e) { console.warn('render', e); return; }
  if (!off) return;
  cacheSet(cache, key, off, opts.thumb ? 400 : 24);
  if (canvas._want !== key) return;
  blit(canvas, off); canvas._key = key;
}

/* =========================================================================
   Document view
   ========================================================================= */
let pageObserver, thumbObserver;
function rebuildDoc() {
  if (!S.doc) return;
  renderTabs(); renderToolbar(); renderModebar();
  renderThumbs(); renderPages();
  if (S.organize) renderOrganize();
  $('#pages').style.display = S.organize ? 'none' : '';
  $('#organize').classList.toggle('on', S.organize);
  $('#thumbs').classList.toggle('off', !S.showThumbs || S.organize);
  $('#pane').classList.toggle('off', !S.showPane);
  renderPane();
}
function tbBtn(icon, title, onclick, opts = {}) {
  return h('button', { class: 'btn ghost icon sm' + (opts.cls ? ' ' + opts.cls : ''), type: 'button', title, 'aria-label': title, onclick,
    disabled: opts.disabled, 'aria-pressed': opts.pressed == null ? null : String(!!opts.pressed) }, I(icon, 18));
}
function renderToolbar() {
  const d = S.doc, tb = $('#dtb'); if (!d) return;
  tb.replaceChildren();
  const n = d.pages.length;
  const zoomOpts = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
  const zsel = h('select', { class: 'zoomsel', 'aria-label': 'Yakınlaştırma', onchange: e => {
    const v = e.target.value; if (v === 'w') fitWidth(); else if (v === 'p') fitPage(); else setZoom(+v); } },
    h('option', { value: 'w' }, 'Genişliğe sığdır'), h('option', { value: 'p' }, 'Sayfaya sığdır'),
    zoomOpts.map(z => h('option', { value: String(z) }, `%${Math.round(z * 100)}`)),
    !zoomOpts.includes(S.zoom) && !S.fit ? h('option', { value: String(S.zoom) }, `%${Math.round(S.zoom * 100)}`) : null);
  zsel.value = S.fit === 'width' ? 'w' : S.fit === 'page' ? 'p' : String(S.zoom);
  const pin = h('input', { 'aria-label': 'Sayfa numarası', value: String(S.cur + 1), inputmode: 'numeric',
    onkeydown: e => { if (e.key === 'Enter') { const v = parseInt(e.target.value, 10); if (v >= 1 && v <= n) goPage(v - 1); else e.target.value = String(S.cur + 1); } } });
  const sq = h('input', { 'aria-label': 'Belgede ara', placeholder: 'Belgede ara', id: 'searchInp', value: S.search ? S.search.q : '',
    onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); runSearch(e.target.value, e.shiftKey ? -1 : 1); } else if (e.key === 'Escape') { e.target.value = ''; clearSearch(); } } });
  const cnt = h('span', { class: 'cnt', id: 'searchCnt' }, S.search && S.search.hits.length ? `${S.search.i + 1}/${S.search.hits.length}` : '');
  tb.append(
    h('div', { class: 'grp' },
      tbBtn('panel-left', 'Küçük resimler', () => { S.showThumbs = !S.showThumbs; $('#thumbs').classList.toggle('off', !S.showThumbs || S.organize); renderToolbar(); }, { pressed: S.showThumbs && !S.organize, disabled: S.organize })),
    h('div', { class: 'sep' }),
    h('div', { class: 'grp' },
      h('button', { class: 'btn primary sm', type: 'button', onclick: saveDoc, title: 'Kaydet (Ctrl+S)' }, I('save', 16), 'Kaydet'),
      tbBtn('undo-2', 'Geri al (Ctrl+Z)', undo, { disabled: !S.undo.length }),
      tbBtn('redo-2', 'Yinele (Ctrl+Y)', redo, { disabled: !S.redo.length })),
    h('div', { class: 'sep hide-sm' }),
    h('div', { class: 'grp hide-sm' },
      tbBtn('mouse-pointer-2', 'Seç ve taşı (Esc)', () => setMode('select'), { pressed: S.mode === 'select' && !S.organize }),
      tbBtn('type', 'Metin ekle', () => quickMode('edit', 'text'), { pressed: S.mode === 'text' }),
      tbBtn('highlighter', 'Vurgula', () => quickMode('comment', 'highlight'), { pressed: S.mode === 'highlight' }),
      tbBtn('pen-line', 'Kalemle çiz', () => quickMode('comment', 'ink'), { pressed: S.mode === 'ink' }),
      tbBtn('signature', 'İmza ekle', () => { openTool('fill'); signatureDialog(); }, { pressed: S.mode === 'sign' }),
      tbBtn('layout-grid', 'Sayfaları düzenle', () => S.organize ? closeOrganize() : openTool('organize'), { pressed: S.organize })),
    h('div', { class: 'flex' }),
    h('div', { class: 'grp' },
      tbBtn('chevron-up', 'Önceki sayfa', () => goPage(S.cur - 1), { disabled: S.cur <= 0 || S.organize }),
      h('div', { class: 'pageno' }, pin, h('span', null, `/ ${n}`)),
      tbBtn('chevron-down', 'Sonraki sayfa', () => goPage(S.cur + 1), { disabled: S.cur >= n - 1 || S.organize })),
    h('div', { class: 'sep' }),
    h('div', { class: 'grp' },
      tbBtn('zoom-out', 'Uzaklaştır', () => setZoom(S.zoom / 1.2)), zsel, tbBtn('zoom-in', 'Yakınlaştır', () => setZoom(S.zoom * 1.2))),
    h('div', { class: 'sep hide-sm' }),
    h('div', { class: 'search hide-sm' }, I('search', 15), sq, cnt,
      tbBtn('chevron-up', 'Önceki eşleşme', () => runSearch($('#searchInp').value, -1)),
      tbBtn('chevron-down', 'Sonraki eşleşme', () => runSearch($('#searchInp').value, 1))),
    h('div', { class: 'flex' }),
    h('div', { class: 'grp' },
      tbBtn('panel-right', 'Araç paneli', () => { S.showPane = !S.showPane; $('#pane').classList.toggle('off', !S.showPane); renderToolbar(); }, { pressed: S.showPane })));
}
const MODE_HINT = {
  text: 'Metin eklemek istediğiniz yere tıklayın.',
  note: 'Yapışkan notu koymak istediğiniz yere tıklayın.',
  date: 'Tarihi eklemek istediğiniz yere tıklayın.',
  whiteout: 'Örtmek istediğiniz alanı sürükleyerek seçin.',
  rect: 'Dikdörtgeni sürükleyerek çizin.',
  highlight: 'Vurgulamak istediğiniz alanı sürükleyerek seçin.',
  ink: 'Sayfanın üzerinde sürükleyerek çizin.',
  redact: 'Karartmak istediğiniz alanı sürükleyerek işaretleyin.',
  stamp: 'Damgayı basmak istediğiniz yere tıklayın.',
  sign: 'İmzanın yerini tıklayarak seçin.',
  image: 'Resmi koymak istediğiniz yere tıklayın.',
  check: 'Onay işaretini koymak istediğiniz yere tıklayın.',
  cross: 'Çarpı işaretini koymak istediğiniz yere tıklayın.',
};
function renderModebar() {
  const mb = $('#modebar'); mb.replaceChildren();
  const on = S.mode !== 'select' && !S.organize;
  mb.classList.toggle('on', on);
  if (on) mb.append(I('mouse-pointer-2', 16), h('span', null, MODE_HINT[S.mode] || ''),
    h('span', { style: { flex: '1' } }), h('button', { class: 'btn sm', type: 'button', onclick: () => setMode('select') }, 'Bitti (Esc)'));
  const stage = $('#stage');
  stage.classList.toggle('mode-select', S.mode === 'select');
  stage.classList.toggle('mode-text', ['text', 'note', 'date'].includes(S.mode));
  stage.classList.toggle('mode-placing', !['select', 'text', 'note', 'date'].includes(S.mode));
}
const BOX_MODES = new Set(['whiteout', 'rect', 'highlight', 'redact']);
const CLICK_MODES = new Set(['text', 'note', 'date', 'stamp', 'sign', 'image', 'check', 'cross']);
const STICKY_MODES = new Set(['whiteout', 'rect', 'highlight', 'redact', 'ink', 'check', 'cross']);
function setMode(mode, arg) {
  commitEditing();
  S.mode = mode; S.modeArg = arg == null ? null : arg;
  if (mode !== 'select') select(null, null, true);
  if (S.organize && mode !== 'select') closeOrganize(true);
  renderModebar(); renderToolbar(); renderPane();
}
function quickMode(tool, mode) { if (S.tool !== tool) openTool(tool); setMode(S.mode === mode ? 'select' : mode); }

/* ---------- thumbnails ---------- */
function renderThumbs() {
  const box = $('#thumbs'); box.replaceChildren();
  if (thumbObserver) thumbObserver.disconnect();
  thumbObserver = new IntersectionObserver(ents => { for (const en of ents) if (en.isIntersecting) paintThumb(en.target); }, { root: box, rootMargin: '300px' });
  S.doc.pages.forEach((p, i) => {
    const ds = dispSize(p), k = Math.min(110 / ds.w, 140 / ds.h);
    const c = h('canvas', { style: { width: `${Math.round(ds.w * k)}px`, height: `${Math.round(ds.h * k)}px` } });
    const b = h('button', { class: 'th' + (i === S.cur ? ' cur' : ''), type: 'button', 'data-id': p.id, 'aria-label': `Sayfa ${i + 1}`, onclick: () => goPage(i) },
      h('div', { class: 'tw' }, c), h('span', null, String(i + 1)));
    box.append(b); thumbObserver.observe(b);
  });
}
function paintThumb(btn) {
  const p = pageById(btn.dataset.id); if (!p) return;
  const c = btn.querySelector('canvas');
  paint(c, p, parseFloat(c.style.width), parseFloat(c.style.height), totRot(p), { thumb: true });
}
function markCurrentThumb() {
  $$('#thumbs .th').forEach((b, i) => b.classList.toggle('cur', i === S.cur));
  const cur = $$('#thumbs .th')[S.cur];
  if (cur && S.showThumbs) {
    const box = $('#thumbs'), r = cur.getBoundingClientRect(), br = box.getBoundingClientRect();
    if (r.top < br.top || r.bottom > br.bottom) box.scrollTop += r.top - br.top - 40;
  }
}

/* ---------- pages ---------- */
function slotEl(id) { return $(`#pages .slot[data-id="${id}"]`); }
function renderPages() {
  const box = $('#pages'); box.replaceChildren();
  if (pageObserver) pageObserver.disconnect();
  pageObserver = new IntersectionObserver(ents => { for (const en of ents) if (en.isIntersecting) paintSlot(en.target); }, { root: $('#stage'), rootMargin: '700px 0px' });
  S.doc.pages.forEach((p, i) => { const s = buildSlot(p, i); box.append(s); pageObserver.observe(s); });
}
function buildSlot(p, i) {
  const z = S.zoom, ds = dispSize(p), bs = baseSize(p);
  const slot = h('div', { class: 'slot', 'data-id': p.id, style: { width: `${ds.w * z}px`, height: `${ds.h * z}px` } });
  const inner = h('div', { class: 'inner', style: { width: `${bs.w * z}px`, height: `${bs.h * z}px`, transform: `translate(-50%,-50%) rotate(${p.rot}deg)` } },
    h('canvas', { class: 'pc' }), h('div', { class: 'forms' }), h('div', { class: 'ov' }));
  slot.append(inner, h('div', { class: 'deco' }), h('div', { class: 'plabel' }, `${i + 1}`));
  renderItems(p, slot); renderDeco(p, slot, i);
  return slot;
}
function relayoutSlot(p) {
  const slot = slotEl(p.id); if (!slot) return;
  const z = S.zoom, ds = dispSize(p), bs = baseSize(p);
  slot.style.width = `${ds.w * z}px`; slot.style.height = `${ds.h * z}px`;
  const inner = slot.querySelector('.inner');
  inner.style.width = `${bs.w * z}px`; inner.style.height = `${bs.h * z}px`; inner.style.transform = `translate(-50%,-50%) rotate(${p.rot}deg)`;
  renderItems(p, slot); renderDeco(p, slot, S.doc.pages.indexOf(p));
  slot._formsZoom = null;
  if (slot._painted) paintSlot(slot);
}
async function paintSlot(slot) {
  const p = pageById(slot.dataset.id); if (!p) return;
  slot._painted = true;
  const bs = baseSize(p), z = S.zoom;
  const widgets = await formWidgets(p);
  if (!slot.isConnected) return;
  if (widgets.length && slot._formsZoom !== z) { slot._formsZoom = z; renderForms(p, slot, widgets); }
  paint(slot.querySelector('canvas.pc'), p, bs.w * z, bs.h * z, p.baseRot, { forms: widgets.length > 0 });
}

/* ---------- zoom and navigation ---------- */
function stageWidth() { const st = $('#stage'); return Math.max(200, (st.clientWidth || window.innerWidth) - 56); }
function fitWidth(silent) {
  if (!S.doc) return;
  const maxW = Math.max(...S.doc.pages.map(p => dispSize(p).w));
  S.fit = 'width'; applyZoom(clamp(stageWidth() / maxW, 0.2, 2.2), silent);
}
function fitPage() {
  if (!S.doc) return;
  const p = S.doc.pages[S.cur] || S.doc.pages[0], ds = dispSize(p), st = $('#stage');
  S.fit = 'page'; applyZoom(clamp(Math.min(stageWidth() / ds.w, ((st.clientHeight || 600) - 60) / ds.h), 0.15, 3));
}
function setZoom(z) { S.fit = null; applyZoom(clamp(z, 0.15, 5)); }
function applyZoom(z, silent) {
  const st = $('#stage');
  const p = S.doc.pages[S.cur]; const slot = p && slotEl(p.id);
  const rel = slot ? (st.scrollTop - slot.offsetTop) / Math.max(1, slot.offsetHeight) : 0;
  S.zoom = z;
  if (silent) return;
  commitEditing();
  for (const pg of S.doc.pages) relayoutSlot(pg);
  if (slot) st.scrollTop = slot.offsetTop + rel * slot.offsetHeight;
  renderToolbar();
}
function goPage(i) {
  if (!S.doc) return;
  i = clamp(i, 0, S.doc.pages.length - 1);
  const p = S.doc.pages[i], slot = slotEl(p.id); if (!slot) return;
  $('#stage').scrollTop = slot.offsetTop - 14;
  S.cur = i; renderToolbar(); markCurrentThumb();
}
function trackCurrent() {
  if (!S.doc || S.organize) return;
  const st = $('#stage'), mid = st.scrollTop + st.clientHeight * 0.35;
  const slots = $$('#pages .slot'); let cur = 0;
  for (let i = 0; i < slots.length; i++) { if (slots[i].offsetTop <= mid) cur = i; else break; }
  if (cur !== S.cur) {
    S.cur = cur; markCurrentThumb();
    const pin = $('.pageno input'); if (pin && document.activeElement !== pin) pin.value = String(cur + 1);
    $$('#dtb .grp button').filter(b => b.title === tr('Önceki sayfa')).forEach(b => b.disabled = cur <= 0);
    $$('#dtb .grp button').filter(b => b.title === tr('Sonraki sayfa')).forEach(b => b.disabled = cur >= S.doc.pages.length - 1);
  }
}

/* =========================================================================
   Items on the page
   ========================================================================= */
const CHECK_D = 'M4.5 12.5l4.8 4.8L19.5 7';
const CROSS_D = 'M6 6l12 12M18 6L6 18';
function inkPath(pts) {
  if (!pts.length) return '';
  const f = r2;
  if (pts.length === 1) { const [x, y] = pts[0]; return `M${f(x)} ${f(y)} L${f(x + 0.01)} ${f(y + 0.01)}`; }
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    d += ` Q${f(x1)} ${f(y1)} ${f((x1 + x2) / 2)} ${f((y1 + y2) / 2)}`;
  }
  const l = pts[pts.length - 1]; d += ` L${f(l[0])} ${f(l[1])}`;
  return d;
}
function fitText(it) {
  const lines = (it.text || ' ').split('\n');
  const pad = it.pad || 0;
  it.w = Math.max(...lines.map(l => textW(l || ' ', it.size))) + 2 * pad + 1;
  it.h = lines.length * M.lh * it.size + 2 * pad;
}
function fitStamp(it) {
  it.w = textW(it.text, it.size, 600) + 1.4 * it.size;
  it.h = it.size * 1.7;
}
function itemNode(page, it, z) {
  let e;
  const st = { left: `${it.x * z}px`, top: `${it.y * z}px`, width: `${it.w * z}px`, height: `${it.h * z}px` };
  switch (it.type) {
    case 'text':
      e = h('div', { class: 'item it-text', style: { ...st, fontSize: `${it.size * z}px`, color: it.color, padding: `${(it.pad || 0) * z}px`, background: it.bg || 'transparent',
        boxShadow: it.bg ? '0 1px 3px rgba(0,0,0,.18)' : '' } });
      e.textContent = it.text; break;
    case 'image': case 'sign': {
      const img = S.images.get(it.img);
      e = h('div', { class: 'item it-img', style: st }, img ? h('img', { src: img.url, alt: '', draggable: 'false' }) : null); break;
    }
    case 'whiteout': e = h('div', { class: 'item it-whiteout', style: st }); break;
    case 'redact': e = h('div', { class: 'item it-redact', style: st, title: 'Kaydederken bu alan kalıcı olarak karartılır' }); break;
    case 'rect': e = h('div', { class: 'item it-rect', style: { ...st, borderColor: it.color, borderWidth: `${(it.width || 1.5) * z}px` } }); break;
    case 'highlight': e = h('div', { class: 'item it-highlight', style: { ...st, background: it.color } }); break;
    case 'ink': {
      e = h('div', { class: 'item it-ink', style: st });
      e.innerHTML = `<svg width="${Math.max(it.w, 1) * z}" height="${Math.max(it.h, 1) * z}" viewBox="0 0 ${Math.max(it.w, 1)} ${Math.max(it.h, 1)}"><path d="${inkPath(it.pts)}" fill="none" stroke="${it.color}" stroke-width="${it.width}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      break;
    }
    case 'check': case 'cross': {
      e = h('div', { class: 'item it-mark', style: st });
      e.innerHTML = `<svg width="${it.w * z}" height="${it.h * z}" viewBox="0 0 24 24"><path d="${it.type === 'check' ? CHECK_D : CROSS_D}" fill="none" stroke="${it.color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      break;
    }
    case 'stamp': {
      const bw = Math.max(1.5, it.size * 0.11);
      e = h('div', { class: 'item it-stamp', style: { ...st, color: it.color, borderColor: it.color, borderWidth: `${bw * z}px`, borderRadius: `${it.h * 0.18 * z}px`,
        fontSize: `${it.size * z}px`, background: `color-mix(in srgb, ${it.color} 6%, transparent)` } });
      e.textContent = it.text; break;
    }
    default: e = h('div', { class: 'item', style: st });
  }
  e.dataset.id = it.id;
  if (S.sel && S.sel.itemId === it.id) {
    e.classList.add('sel');
    if (!['text', 'ink'].includes(it.type)) e.append(h('div', { class: 'hdl', title: 'Boyutlandır' }));
    e.append(h('button', { class: 'xdel', type: 'button', title: 'Sil (Delete)', 'aria-label': 'Öğeyi sil', html: svgIcon('trash-2', 13, 2) }));
  }
  return e;
}
function renderItems(page, slot) {
  slot = slot || slotEl(page.id); if (!slot) return;
  const ov = slot.querySelector('.ov'); ov.replaceChildren();
  const z = S.zoom;
  for (const it of page.items) ov.append(itemNode(page, it, z));
  if (S.search && S.search.hits.length) {
    S.search.hits.forEach((hit, k) => {
      if (hit.pageId !== page.id || !hit.box) return;
      ov.append(h('div', { class: 'hit' + (k === S.search.i ? ' cur' : ''), style: { left: `${hit.box.x * z}px`, top: `${hit.box.y * z}px`, width: `${hit.box.w * z}px`, height: `${hit.box.h * z}px` } }));
    });
  }
}
function placeNode(it) {
  const n = $(`#pages .item[data-id="${it.id}"]`); if (!n) return;
  const z = S.zoom;
  n.style.left = `${it.x * z}px`; n.style.top = `${it.y * z}px`;
}
function select(page, it, silent) {
  const prev = S.sel;
  S.sel = page && it ? { pageId: page.id, itemId: it.id } : null;
  if (prev && (!S.sel || prev.itemId !== S.sel.itemId)) { const pp = pageById(prev.pageId); if (pp) renderItems(pp); }
  if (S.sel) renderItems(page);
  if (!silent || prev) renderPane();
}
function addItem(page, it) { it.id = it.id || uid(); page.items.push(it); markDirty(); renderItems(page); return it; }
function deleteItem(page, id) {
  const idx = page.items.findIndex(i => i.id === id); if (idx < 0) return;
  snapshot(); page.items.splice(idx, 1);
  if (S.sel && S.sel.itemId === id) S.sel = null;
  markDirty(); renderItems(page); renderPane();
}
function deleteSelected() { if (!S.sel) return; deleteItem(pageById(S.sel.pageId), S.sel.itemId); }

/* ---------- transform: screen -> page (base view) coordinates ---------- */
function toBase(page, slot, cx, cy) {
  const r = slot.getBoundingClientRect(), mx = r.left + r.width / 2, my = r.top + r.height / 2;
  const dx = (cx - mx) / S.zoom, dy = (cy - my) / S.zoom, a = -page.rot * Math.PI / 180;
  const rx = dx * Math.cos(a) - dy * Math.sin(a), ry = dx * Math.sin(a) + dy * Math.cos(a);
  const b = baseSize(page);
  return { x: rx + b.w / 2, y: ry + b.h / 2 };
}
function onPagesDown(ev) {
  if (ev.button !== 0 || !S.doc) return;
  if (ev.target.closest('.ta, .ff, .ffchk')) return;
  const slot = ev.target.closest('.slot');
  if (!slot) { if (S.mode === 'select') { commitEditing(); select(null); } return; }
  const page = pageById(slot.dataset.id); if (!page) return;
  const node = ev.target.closest('.item');
  if (ev.target.closest('.xdel') && node) { ev.preventDefault(); deleteItem(page, node.dataset.id); return; }
  commitEditing();
  const p = toBase(page, slot, ev.clientX, ev.clientY);
  if (ev.target.closest('.hdl') && node) return startResize(ev, page, slot, itemOf(page, node.dataset.id));
  if (BOX_MODES.has(S.mode)) return startBox(ev, page, slot, p);
  if (S.mode === 'ink') return startInk(ev, page, slot, p);
  if (node) { const it = itemOf(page, node.dataset.id); select(page, it); return startMove(ev, page, slot, it); }
  if (CLICK_MODES.has(S.mode)) { ev.preventDefault(); return placeAt(page, p); }
  select(null);
}
function trackPointer(ev, move, up) {
  const mv = e => move(e);
  const end = e => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); up(e); };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
}
function startMove(ev, page, slot, it) {
  ev.preventDefault();
  const p0 = toBase(page, slot, ev.clientX, ev.clientY), o = { x: it.x, y: it.y }, b = baseSize(page);
  let moved = false;
  trackPointer(ev, e => {
    const p = toBase(page, slot, e.clientX, e.clientY), dx = p.x - p0.x, dy = p.y - p0.y;
    if (!moved && Math.hypot(dx, dy) * S.zoom < 3) return;
    if (!moved) { snapshot(); moved = true; }
    it.x = clamp(o.x + dx, -it.w * 0.6, b.w - it.w * 0.4); it.y = clamp(o.y + dy, -it.h * 0.6, b.h - it.h * 0.4);
    placeNode(it);
  }, () => { if (moved) markDirty(); });
}
function startResize(ev, page, slot, it) {
  ev.preventDefault(); ev.stopPropagation();
  const p0 = toBase(page, slot, ev.clientX, ev.clientY), o = { w: it.w, h: it.h, size: it.size };
  const aspect = ['image', 'sign', 'stamp', 'check', 'cross'].includes(it.type), ratio = o.h / Math.max(o.w, 0.01);
  let moved = false;
  trackPointer(ev, e => {
    const p = toBase(page, slot, e.clientX, e.clientY);
    if (!moved) { snapshot(); moved = true; }
    let w = Math.max(6, o.w + p.x - p0.x), hh = Math.max(4, o.h + p.y - p0.y);
    if (aspect) { const k = Math.max(w / o.w, hh / o.h); w = Math.max(8, o.w * k); hh = w * ratio; }
    if (it.type === 'stamp') { it.size = clamp(o.size * w / o.w, 6, 120); fitStamp(it); }
    else { it.w = w; it.h = hh; }
    renderItems(page, slot);
  }, () => { if (moved) markDirty(); });
}
function startBox(ev, page, slot, p0) {
  ev.preventDefault();
  snapshot();
  const it = { id: uid(), type: S.mode, x: p0.x, y: p0.y, w: 0, h: 0 };
  if (it.type === 'highlight') it.color = S.pref.hlColor;
  if (it.type === 'rect') { it.color = S.pref.rectColor; it.width = 1.5; }
  if (it.type === 'redact') it.opacity = S.pref.redactOpacity ?? 1;
  page.items.push(it);
  renderItems(page, slot);
  trackPointer(ev, e => {
    const p = toBase(page, slot, e.clientX, e.clientY), b = baseSize(page);
    const x1 = clamp(p.x, 0, b.w), y1 = clamp(p.y, 0, b.h);
    it.x = Math.min(p0.x, x1); it.y = Math.min(p0.y, y1); it.w = Math.abs(x1 - p0.x); it.h = Math.abs(y1 - p0.y);
    const n = $(`#pages .item[data-id="${it.id}"]`), z = S.zoom;
    if (n) Object.assign(n.style, { left: `${it.x * z}px`, top: `${it.y * z}px`, width: `${it.w * z}px`, height: `${it.h * z}px` });
  }, () => {
    if (it.w * S.zoom < 4 || it.h * S.zoom < 4) { page.items = page.items.filter(i => i !== it); S.undo.pop(); renderItems(page, slot); renderToolbar(); return; }
    markDirty(); renderItems(page, slot); renderPane();
  });
}
function startInk(ev, page, slot, p0) {
  ev.preventDefault();
  snapshot();
  const it = { id: uid(), type: 'ink', x: p0.x, y: p0.y, w: 1, h: 1, pts: [[0, 0]], color: S.pref.inkColor, width: S.pref.inkWidth };
  page.items.push(it); renderItems(page, slot);
  let node = $(`#pages .item[data-id="${it.id}"]`), path = node && node.querySelector('path'), svg = node && node.querySelector('svg');
  if (svg) { svg.setAttribute('width', S.zoom); svg.setAttribute('height', S.zoom); svg.setAttribute('viewBox', '0 0 1 1'); }
  trackPointer(ev, e => {
    const p = toBase(page, slot, e.clientX, e.clientY), l = it.pts[it.pts.length - 1];
    const q = [p.x - it.x, p.y - it.y];
    if (Math.hypot(q[0] - l[0], q[1] - l[1]) < 0.8) return;
    it.pts.push(q); if (path) path.setAttribute('d', inkPath(it.pts));
  }, () => {
    const xs = it.pts.map(q => q[0]), ys = it.pts.map(q => q[1]);
    const mnx = Math.min(...xs), mny = Math.min(...ys), mxx = Math.max(...xs), mxy = Math.max(...ys);
    it.pts = it.pts.map(([x, y]) => [r2(x - mnx), r2(y - mny)]);
    it.x += mnx; it.y += mny; it.w = Math.max(mxx - mnx, 1); it.h = Math.max(mxy - mny, 1);
    markDirty(); renderItems(page, slot);
  });
}
function placeAt(page, p) {
  const m = S.mode, b = baseSize(page);
  snapshot();
  let it;
  if (m === 'text' || m === 'note' || m === 'date') {
    const size = S.pref.textSize;
    it = { type: 'text', x: p.x, y: p.y - size * 0.62, text: m === 'date' ? fmtDate(new Date()) : '', size, color: S.pref.textColor };
    if (m === 'note') { it.bg = '#FFF1A6'; it.pad = Math.round(size * 0.5); it.color = '#1B2433'; it.y = p.y - it.pad; }
    fitText(it);
  } else if (m === 'stamp') {
    it = { type: 'stamp', text: S.pref.stamp.text, color: S.pref.stamp.color, size: 18 }; fitStamp(it);
    it.x = p.x - it.w / 2; it.y = p.y - it.h / 2;
  } else if (m === 'sign' || m === 'image') {
    const img = S.images.get(S.modeArg); if (!img) { S.undo.pop(); return; }
    const w = Math.min(m === 'sign' ? 150 : 240, b.w * 0.6), hh = w * img.h / img.w;
    it = { type: m, img: S.modeArg, x: p.x - w / 2, y: p.y - hh / 2, w, h: hh };
  } else if (m === 'check' || m === 'cross') {
    it = { type: m, x: p.x - 7, y: p.y - 7, w: 14, h: 14, color: m === 'check' ? '#1F4E9E' : '#B3392C' };
  }
  if (!it) { S.undo.pop(); return; }
  addItem(page, it);
  if (!STICKY_MODES.has(m)) { S.mode = 'select'; S.modeArg = null; renderModebar(); renderToolbar(); }
  select(page, it);
  if (it.type === 'text' && m !== 'date') startEdit(page, it, true);
}

/* ---------- text editing ---------- */
let editState = null;
function startEdit(page, it, isNew) {
  commitEditing();
  const slot = slotEl(page.id); if (!slot) return;
  const node = slot.querySelector(`.item[data-id="${it.id}"]`); if (node) node.style.visibility = 'hidden';
  const z = S.zoom, pad = (it.pad || 0) * z;
  const ta = h('textarea', { class: 'ta', spellcheck: 'true', 'aria-label': 'Metin', style: {
    left: `${it.x * z}px`, top: `${it.y * z}px`, fontSize: `${it.size * z}px`, ...textCSS(it), transform: `rotate(${it.angle || 0}deg)`, transformOrigin: '0 0', color: it.color, padding: `${pad}px`, background: it.bg || 'rgba(255,255,255,.65)' } });
  ta.value = it.text;
  const resize = () => { const tmp = { ...it, text: ta.value || ' ' }; fitText(tmp); ta.style.width = `${tmp.w * z + 6}px`; ta.style.height = `${tmp.h * z + 2}px`; };
  ta.addEventListener('input', resize);
  ta.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); commitEditing(); } });
  ta.addEventListener('blur', () => setTimeout(() => { if (editState && editState.ta === ta) commitEditing(); }, 0));
  slot.querySelector('.ov').append(ta);
  resize(); ta.focus();
  S.editing = it.id;
  editState = { page, it, ta, isNew };
}
function commitEditing() {
  if (!editState) return;
  const { page, it, ta, isNew } = editState; editState = null; S.editing = null;
  const v = ta.value.replace(/\s+$/, '');
  ta.remove();
  if (!v.trim()) {
    page.items = page.items.filter(i => i !== it);
    if (isNew) S.undo.pop(); else { /* remove text when emptied */ }
    if (S.sel && S.sel.itemId === it.id) S.sel = null;
    renderItems(page); renderPane(); renderToolbar(); return;
  }
  if (v !== it.text) { if (!isNew) snapshot(); it.text = v; fitText(it); markDirty(); }
  renderItems(page); renderPane();
}

/* ---------- form fields ---------- */
async function formWidgets(page) {
  if (!page.srcId || !S.doc) return [];
  const src = S.doc.sources.get(page.srcId); if (!src) return [];
  if (src.annots.has(page.index)) return src.annots.get(page.index);
  let list = [];
  try {
    const p = await src.pdf.getPage(page.index + 1);
    const anns = await p.getAnnotations({ intent: 'display' });
    list = anns.filter(a => a.subtype === 'Widget' && ['Tx', 'Btn', 'Ch'].includes(a.fieldType) && !a.pushButton && a.fieldName);
  } catch (e) { console.warn('annots', e); }
  src.annots.set(page.index, list);
  return list;
}
function formVal(srcId, name) { const fv = S.doc.formValues[srcId]; return fv && Object.prototype.hasOwnProperty.call(fv, name) ? fv[name] : undefined; }
function setFormVal(srcId, name, v) {
  (S.doc.formValues[srcId] = S.doc.formValues[srcId] || {})[name] = v; markDirty();
}
async function renderForms(page, slot, widgets) {
  const box = slot.querySelector('.forms'); box.replaceChildren();
  const src = S.doc.sources.get(page.srcId); if (!src) return;
  const p = await src.pdf.getPage(page.index + 1);
  const vp = p.getViewport({ scale: 1, rotation: page.baseRot }), z = S.zoom;
  for (const a of widgets) {
    const [x1, y1, x2, y2] = vp.convertToViewportRectangle(a.rect);
    const x = Math.min(x1, x2), y = Math.min(y1, y2), w = Math.abs(x2 - x1), hh = Math.abs(y2 - y1);
    const st = { left: `${x * z}px`, top: `${y * z}px`, width: `${w * z}px`, height: `${hh * z}px` };
    const key = a.fieldName, cur = formVal(src.id, key);
    const fs = `${clamp((a.multiLine ? 11 : hh * 0.62), 6, 14) * z}px`;
    let el;
    if (a.fieldType === 'Tx') {
      el = a.multiLine ? h('textarea', { class: 'ff', style: { ...st, fontSize: fs } }) : h('input', { class: 'ff', type: a.password ? 'password' : 'text', style: { ...st, fontSize: fs } });
      el.value = cur !== undefined ? cur : (a.fieldValue || '');
      if (a.maxLen) el.maxLength = a.maxLen;
      if (a.textAlignment === 1) el.style.textAlign = 'center'; else if (a.textAlignment === 2) el.style.textAlign = 'right';
      el.addEventListener('input', () => { setFormVal(src.id, key, el.value); syncField(src.id, key, el); });
    } else if (a.fieldType === 'Btn' && a.checkBox) {
      const on = cur !== undefined ? !!cur : (a.fieldValue && a.fieldValue !== 'Off' && (!a.exportValue || a.fieldValue === a.exportValue));
      const inp = h('input', { type: 'checkbox', 'aria-label': key }); inp.checked = !!on;
      inp.addEventListener('change', () => { setFormVal(src.id, key, inp.checked); syncField(src.id, key, inp); });
      el = h('label', { class: 'ffchk', style: st }, inp);
    } else if (a.fieldType === 'Btn' && a.radioButton) {
      const on = cur !== undefined ? cur === a.buttonValue : a.fieldValue === a.buttonValue;
      const inp = h('input', { type: 'radio', name: `${src.id}:${key}`, value: a.buttonValue, 'aria-label': `${key} ${a.buttonValue}` }); inp.checked = !!on;
      inp.addEventListener('change', () => { if (inp.checked) { setFormVal(src.id, key, a.buttonValue); syncField(src.id, key, inp); } });
      el = h('label', { class: 'ffchk', style: st }, inp);
    } else if (a.fieldType === 'Ch') {
      el = h('select', { class: 'ff', style: { ...st, fontSize: fs } }, h('option', { value: '' }, ''),
        (a.options || []).map(o => h('option', { value: o.exportValue }, o.displayValue || o.exportValue)));
      const fv = Array.isArray(a.fieldValue) ? a.fieldValue[0] : a.fieldValue;
      const v = cur !== undefined ? cur : fv;
      const opt = v != null ? (a.options || []).find(o => o.exportValue === v || o.displayValue === v) : null;
      el.value = opt ? opt.exportValue : '';
      el.addEventListener('change', () => { setFormVal(src.id, key, el.value); syncField(src.id, key, el); });
    }
    if (!el) continue;
    if (a.readOnly) { (el.querySelector('input') || el).disabled = true; }
    el.dataset.field = `${src.id}::${key}`;
    el.title = a.alternativeText || key;
    box.append(el);
  }
}
function syncField(srcId, key, from) {
  for (const el of $$(`#pages [data-field="${CSS.escape(srcId + '::' + key)}"]`)) {
    if (el === from || el.contains(from)) continue;
    const inp = el.matches('label') ? el.querySelector('input') : el;
    if (inp.type === 'checkbox') inp.checked = !!formVal(srcId, key);
    else if (inp.type === 'radio') inp.checked = formVal(srcId, key) === inp.value;
    else inp.value = formVal(srcId, key) ?? '';
  }
}

/* ---------- watermark and page-number preview ---------- */
function pnLabel(i, total) {
  const st = S.doc.settings.pn, n = i + st.start, N = total + st.start - 1;
  return st.fmt.replace('{n}', String(n)).replace('{N}', String(N));
}
function renderDeco(p, slot, i) {
  const box = slot.querySelector('.deco'); box.replaceChildren();
  const st = S.doc.settings, z = S.zoom, ds = dispSize(p);
  if (st.wm.on && st.wm.text.trim()) {
    box.append(h('div', { class: 'wm', style: { fontSize: `${st.wm.size * z}px`, color: st.wm.color, opacity: String(st.wm.opacity),
      transform: `translate(-50%,-50%) rotate(${-st.wm.angle}deg)` } }, st.wm.text));
  }
  if (st.pn.on) {
    const label = pnLabel(i, S.doc.pages.length), s = st.pn.size, tw = textW(label, s), m = 28;
    const x = st.pn.pos.endsWith('c') ? (ds.w - tw) / 2 : st.pn.pos.endsWith('r') ? ds.w - m - tw : m;
    const base = st.pn.pos.startsWith('b') ? ds.h - m * 0.75 : m * 0.75 + M.cap * s;
    const top = base - (0.5 + (M.asc - M.desc) / 2) * s;
    box.append(h('div', { class: 'pn', style: { left: `${x * z}px`, top: `${top * z}px`, fontSize: `${s * z}px` } }, label));
  }
}
function refreshDeco() { S.doc.pages.forEach((p, i) => { const s = slotEl(p.id); if (s) renderDeco(p, s, i); }); }

/* ---------- search ---------- */
async function textItems(page) {
  const src = S.doc.sources.get(page.srcId); if (!src) return [];
  if (src.text.has(page.index)) return src.text.get(page.index);
  let items = [];
  try { const p = await src.pdf.getPage(page.index + 1); const tc = await p.getTextContent(); items = tc.items.filter(t => t.str); }
  catch (e) { console.warn(e); }
  src.text.set(page.index, items); return items;
}
async function hitBox(page, item, start, len) {
  const src = S.doc.sources.get(page.srcId); const p = await src.pdf.getPage(page.index + 1);
  const vp = p.getViewport({ scale: 1, rotation: page.baseRot });
  const [a, b, c, d, e, f] = item.transform, fs = Math.hypot(c, d) || Math.hypot(a, b) || 10;
  const L = Math.max(item.str.length, 1), wid = item.width || fs * L * 0.5;
  const ang = Math.atan2(b, a), ux = Math.cos(ang), uy = Math.sin(ang);
  const s0 = wid * start / L, s1 = wid * (start + len) / L;
  const pts = [[s0, -0.22 * fs], [s1, -0.22 * fs], [s1, 0.9 * fs], [s0, 0.9 * fs]].map(([u, v]) => vp.convertToViewportPoint(e + u * ux - v * uy, f + u * uy + v * ux));
  const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}
async function runSearch(q, dir) {
  if (!S.doc) return;
  q = (q || '').trim();
  if (!q) { clearSearch(); return; }
  if (!S.search || S.search.q !== q) {
    const nq = trLower(q), hits = [];
    await busy('Aranıyor…', async () => {
      for (const page of S.doc.pages) {
        if (!page.srcId) continue;
        for (const it of await textItems(page)) {
          const s = trLower(it.str); let k = s.indexOf(nq);
          while (k >= 0 && hits.length < 2000) { hits.push({ pageId: page.id, item: it, start: k, len: nq.length }); k = s.indexOf(nq, k + 1); }
        }
      }
      for (const hit of hits) hit.box = await hitBox(pageById(hit.pageId), hit.item, hit.start, hit.len);
    });
    const curIdx = S.cur;
    const firstAfter = hits.findIndex(hh => S.doc.pages.findIndex(p => p.id === hh.pageId) >= curIdx);
    S.search = { q, hits, i: hits.length ? (firstAfter >= 0 ? firstAfter : 0) - (dir > 0 ? 1 : 0) : -1 };
    if (S.search.i < -1) S.search.i = -1;
    for (const p of S.doc.pages) renderItems(p);
  }
  const s = S.search, n = s.hits.length;
  if (!n) { $('#searchCnt').textContent = '0'; toast(`“${q}” bulunamadı.`); return; }
  s.i = ((s.i + dir) % n + n) % n;
  const hit = s.hits[s.i], page = pageById(hit.pageId);
  for (const p of S.doc.pages) renderItems(p);
  const slot = slotEl(page.id);
  if (slot && hit.box) {
    const st = $('#stage'), z = S.zoom, ds = dispSize(page), bs = baseSize(page);
    // transform the base position to the rotated view
    const cx = hit.box.x + hit.box.w / 2 - bs.w / 2, cy = hit.box.y + hit.box.h / 2 - bs.h / 2, a = page.rot * Math.PI / 180;
    const ry = cx * Math.sin(a) + cy * Math.cos(a) + ds.h / 2;
    st.scrollTop = slot.offsetTop + ry * z - st.clientHeight / 2;
  }
  $('#searchCnt').textContent = `${s.i + 1}/${n}`;
}
function clearSearch() { if (!S.search) return; S.search = null; if (S.doc) for (const p of S.doc.pages) renderItems(p); const c = $('#searchCnt'); if (c) c.textContent = ''; }
