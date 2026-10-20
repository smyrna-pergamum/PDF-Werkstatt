
/* =========================================================================
   Organize pages (grid)
   ========================================================================= */
function openOrganize() {
  commitEditing(); S.mode = 'select'; select(null, null, true);
  S.organize = true;
  if (!S.orgSel.size && S.doc.pages[S.cur]) S.orgSel = new Set([S.doc.pages[S.cur].id]);
  rebuildDoc();
  $('#stage').scrollTop = 0;
}
function closeOrganize(keepTool) {
  S.organize = false;
  if (!keepTool && S.tool === 'organize') S.tool = null;
  rebuildDoc();
  goPage(S.cur);
}
let dragIds = null;
function renderOrganize() {
  const g = $('#organize'); g.replaceChildren();
  const pages = S.doc.pages;
  pages.forEach((p, i) => {
    const ds = dispSize(p), k = Math.min(150 / ds.w, 190 / ds.h);
    const c = h('canvas', { style: { width: `${Math.round(ds.w * k)}px`, height: `${Math.round(ds.h * k)}px` } });
    const card = h('div', { class: 'card' + (S.orgSel.has(p.id) ? ' on' : ''), draggable: 'true', 'data-id': p.id, tabindex: '0', role: 'option',
      'aria-selected': String(S.orgSel.has(p.id)), 'aria-label': `Sayfa ${i + 1}` },
      h('div', { class: 'cv' }, c), h('div', { class: 'cap' }, `${i + 1}`), p.rot ? h('span', { class: 'rotbadge' }, `${p.rot}°`) : null);
    card.addEventListener('click', e => orgClick(e, p.id, i));
    card.addEventListener('dblclick', () => { S.cur = i; closeOrganize(); });
    card.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); orgClick(e, p.id, i); } });
    card.addEventListener('dragstart', e => {
      dragIds = S.orgSel.has(p.id) ? new Set(S.orgSel) : new Set([p.id]);
      e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', p.id);
    });
    card.addEventListener('dragover', e => {
      if (!dragIds) return; e.preventDefault();
      const r = card.getBoundingClientRect(), after = e.clientX > r.left + r.width / 2;
      $$('#organize .card').forEach(cd => cd.classList.remove('drop-before', 'drop-after'));
      card.classList.add(after ? 'drop-after' : 'drop-before');
    });
    card.addEventListener('drop', e => {
      if (!dragIds) return; e.preventDefault();
      const after = card.classList.contains('drop-after');
      movePages(dragIds, p.id, after); dragIds = null;
    });
    card.addEventListener('dragend', () => { dragIds = null; $$('#organize .card').forEach(cd => cd.classList.remove('drop-before', 'drop-after')); });
    g.append(card);
    paint(c, p, parseFloat(c.style.width), parseFloat(c.style.height), totRot(p), { thumb: true });
  });
}
function orgClick(e, id, i) {
  const pages = S.doc.pages;
  if (e.shiftKey && S.orgAnchor != null) {
    const a = pages.findIndex(p => p.id === S.orgAnchor); const [lo, hi] = a < i ? [a, i] : [i, a];
    S.orgSel = new Set(pages.slice(lo, hi + 1).map(p => p.id));
  } else if (e.ctrlKey || e.metaKey) {
    S.orgSel.has(id) ? S.orgSel.delete(id) : S.orgSel.add(id); S.orgAnchor = id;
  } else { S.orgSel = new Set([id]); S.orgAnchor = id; }
  S.cur = i;
  $$('#organize .card').forEach(cd => { const on = S.orgSel.has(cd.dataset.id); cd.classList.toggle('on', on); cd.setAttribute('aria-selected', String(on)); });
  renderPane();
}
function selectedPages() { return S.doc.pages.filter(p => S.orgSel.has(p.id)); }
function movePages(ids, targetId, after) {
  if (ids.has(targetId)) return;
  snapshot();
  const moving = S.doc.pages.filter(p => ids.has(p.id)), rest = S.doc.pages.filter(p => !ids.has(p.id));
  let at = rest.findIndex(p => p.id === targetId); if (after) at++;
  rest.splice(at, 0, ...moving); S.doc.pages = rest;
  markDirty(); rebuildDoc();
}
function shiftPages(dir) {
  const pages = S.doc.pages, sel = S.orgSel; if (!sel.size) return;
  const idx = pages.map((p, i) => sel.has(p.id) ? i : -1).filter(i => i >= 0);
  if ((dir < 0 && idx[0] === 0) || (dir > 0 && idx[idx.length - 1] === pages.length - 1)) return;
  snapshot();
  const arr = pages.slice();
  if (dir < 0) for (const i of idx) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
  else for (const i of idx.reverse()) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
  S.doc.pages = arr; markDirty(); rebuildDoc();
}
function rotatePages(pages, d) {
  if (!pages.length) return;
  snapshot();
  for (const p of pages) p.rot = ((p.rot + d) % 360 + 360) % 360;
  markDirty(); rebuildDoc();
}
async function deletePages(pages) {
  if (!pages.length) return;
  if (pages.length >= S.doc.pages.length) { alertBox('Sayfa silinemedi', 'Belgede en az bir sayfa kalmalı.'); return; }
  snapshot();
  const ids = new Set(pages.map(p => p.id));
  S.doc.pages = S.doc.pages.filter(p => !ids.has(p.id));
  S.orgSel.clear(); S.cur = Math.min(S.cur, S.doc.pages.length - 1);
  markDirty(); rebuildDoc();
  toast(pages.length === 1 ? 'Sayfa silindi.' : `${pages.length} sayfa silindi.`);
}
function insertionIndex() {
  const idx = S.doc.pages.map((p, i) => S.orgSel.has(p.id) ? i : -1).filter(i => i >= 0);
  return idx.length ? idx[idx.length - 1] + 1 : S.doc.pages.length;
}
function insertBlank() {
  const at = insertionIndex(), ref = S.doc.pages[Math.max(0, at - 1)] || S.doc.pages[0], ds = dispSize(ref);
  snapshot();
  const p = blankPage(ds.w, ds.h);
  S.doc.pages.splice(at, 0, p); S.orgSel = new Set([p.id]);
  markDirty(); rebuildDoc();
}
async function insertFromFile() {
  const files = await pickFiles(ACCEPT_ALL);
  if (files.length) openFiles(files, { append: true, at: S.organize ? insertionIndex() : S.doc.pages.length });
}
async function extractPages(pages) {
  if (!pages.length) return;
  await guard(() => busy('Sayfalar ayıklanıyor…', async () => {
    const bytes = await buildPdf(pages);
    await saveFile(`${baseName(S.doc.name)}-page-${pages.map(p => S.doc.pages.indexOf(p) + 1).slice(0, 6).join('_')}${pages.length > 6 ? '_etc' : ''}.pdf`, bytes);
  }));
}

/* =========================================================================
   Side panel
   ========================================================================= */
function openTool(id) {
  if (!S.doc) return;
  commitEditing();
  if (id === 'combine') { combineDialog('append'); return; }
  if (id === 'create') { combineDialog('create'); return; }
  S.tool = id; S.showPane = true;
  if (S.mode !== 'select') { S.mode = 'select'; S.modeArg = null; }
  if (id === 'organize') { openOrganize(); return; }
  if (S.organize) { S.organize = false; rebuildDoc(); goPage(S.cur); return; }
  $('#pane').classList.remove('off');
  renderModebar(); renderToolbar(); renderPane();
}
function renderPane() {
  const pane = $('#pane'); if (!pane || !S.doc) return;
  pane.replaceChildren();
  if (S.sel) { const sb = selBox(); if (sb) pane.append(sb); }
  if (!S.tool) {
    pane.append(h('h3', null, 'Tüm araçlar'), h('div', { class: 'tlist' }, TOOLS.map(t =>
      h('button', { class: `titem c-${t.c}`, type: 'button', onclick: () => openTool(t.id) }, h('span', { class: 'cini sm' }, I(t.icon, 16)), t.label))));
    return;
  }
  const t = toolById(S.tool);
  pane.append(h('div', { class: 'phead' },
    h('button', { class: 'btn ghost icon sm', type: 'button', title: 'Tüm araçlar', 'aria-label': 'Tüm araçlara dön', onclick: () => { if (S.organize) closeOrganize(); S.tool = null; setMode('select'); } }, I('chevron-left', 18)),
    h('span', { class: `cini sm c-${t.c}` }, I(t.icon, 16)), h('span', { class: 'ttl' }, t.label)));
  const fn = PANES[t.id]; if (fn) pane.append(fn());
}
function modeBtn(mode, icon, label, arg) {
  return h('button', { class: 'btn', type: 'button', 'aria-pressed': String(S.mode === mode), onclick: () => setMode(S.mode === mode ? 'select' : mode, arg) }, I(icon, 20), label);
}
function swatchRow(colors, cur, onPick) {
  return h('div', { class: 'swatches' }, colors.map(c => h('button', { class: 'sw', type: 'button', style: { background: c }, 'aria-label': `Renk ${c}`, 'aria-pressed': String(c.toLowerCase() === (cur || '').toLowerCase()), onclick: () => onPick(c) })));
}
function sizeSelect(cur, onPick, list = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 60, 72]) {
  const s = h('select', { class: 'inp', onchange: e => onPick(+e.target.value) }, list.map(v => h('option', { value: String(v) }, `${v} pt`)));
  if (!list.includes(cur)) s.append(h('option', { value: String(cur) }, `${r2(cur)} pt`));
  s.value = String(cur); return s;
}
const TYPE_NAMES = { text: 'Metin', image: 'Resim', sign: 'İmza', whiteout: 'Beyaz kutu', redact: 'Karartma alanı', rect: 'Dikdörtgen', highlight: 'Vurgu', ink: 'Çizim', stamp: 'Damga', check: 'Onay işareti', cross: 'Çarpı işareti' };
function selBox() {
  const page = pageById(S.sel.pageId), it = itemOf(page, S.sel.itemId); if (!it) return null;
  const upd = (fn, refit) => { snapshot(); fn(); if (refit) refit(it); markDirty(); renderItems(page); renderPane(); };
  const box = h('div', { class: 'selbox' }, h('div', { class: 't' }, it.type === 'text' && it.bg ? 'Yapışkan not' : TYPE_NAMES[it.type] || 'Öğe',
    h('button', { class: 'btn ghost sm danger', type: 'button', onclick: deleteSelected }, I('trash-2', 15), 'Sil')));
  if (it.type === 'text') {
    box.append(h('div', { class: 'field' }, h('span', null, 'Yazı boyutu'), sizeSelect(it.size, v => upd(() => { it.size = v; if (it.bg) it.pad = Math.round(v * 0.5); S.pref.textSize = v; }, fitText))),
      h('div', { class: 'field' }, h('span', null, 'Renk'), swatchRow(COLORS, it.color, c => upd(() => { it.color = c; S.pref.textColor = c; }))),
      h('button', { class: 'btn sm', type: 'button', onclick: () => startEdit(page, it, false) }, I('type', 15), 'Metni düzenle'));
  } else if (it.type === 'ink') {
    box.append(h('div', { class: 'field' }, h('span', null, 'Renk'), swatchRow(COLORS, it.color, c => upd(() => { it.color = c; S.pref.inkColor = c; }))),
      h('div', { class: 'field' }, h('span', null, 'Kalınlık'), sizeSelect(it.width, v => upd(() => { it.width = v; S.pref.inkWidth = v; }), [1, 1.5, 2, 3, 4, 6, 8])));
  } else if (it.type === 'highlight') {
    box.append(h('div', { class: 'field' }, h('span', null, 'Renk'), swatchRow(HL_COLORS, it.color, c => upd(() => { it.color = c; S.pref.hlColor = c; }))));
  } else if (['rect', 'stamp', 'check', 'cross'].includes(it.type)) {
    box.append(h('div', { class: 'field' }, h('span', null, 'Renk'), swatchRow(COLORS.slice(0, 7), it.color, c => upd(() => { it.color = c; if (it.type === 'rect') S.pref.rectColor = c; }))));
  }
  return box;
}
const PANES = {
  edit() {
    return h('div', null,
      h('div', { class: 'bgrid' },
        modeBtn('text', 'type', 'Metin ekle'),
        h('button', { class: 'btn', type: 'button', onclick: addImageFlow }, I('image-plus', 20), 'Resim ekle'),
        modeBtn('whiteout', 'eraser', 'Beyaz kutuyla ört'),
        modeBtn('rect', 'rectangle-horizontal', 'Dikdörtgen')),
      h('h4', null, 'Yeni metin'),
      h('div', { class: 'field' }, h('span', null, 'Yazı boyutu'), sizeSelect(S.pref.textSize, v => { S.pref.textSize = v; })),
      h('div', { class: 'field' }, h('span', null, 'Renk'), swatchRow(COLORS, S.pref.textColor, c => { S.pref.textColor = c; renderPane(); })),
      h('p', { class: 'hint' }, 'Belgedeki mevcut bir yazıyı değiştirmek için önce “Beyaz kutuyla ört” ile eski yazıyı kapatın, sonra üzerine yeni metin ekleyin. Türkçe karakterler (ğ, ş, ı, İ) sorunsuz yazılır.'),
      h('p', { class: 'hint' }, 'Eklediğiniz öğeyi taşımak için sürükleyin, metni değiştirmek için çift tıklayın, silmek için Delete tuşuna basın.'));
  },
  comment() {
    return h('div', null,
      h('div', { class: 'bgrid' },
        modeBtn('highlight', 'highlighter', 'Vurgula'),
        modeBtn('ink', 'pen-line', 'Kalemle çiz'),
        modeBtn('note', 'sticky-note', 'Yapışkan not'),
        modeBtn('rect', 'rectangle-horizontal', 'Dikdörtgen')),
      h('h4', null, 'Vurgu rengi'), swatchRow(HL_COLORS, S.pref.hlColor, c => { S.pref.hlColor = c; renderPane(); }),
      h('h4', null, 'Kalem'),
      h('div', { class: 'field' }, h('span', null, 'Renk'), swatchRow(COLORS.slice(0, 7), S.pref.inkColor, c => { S.pref.inkColor = c; renderPane(); })),
      h('div', { class: 'field' }, h('span', null, 'Kalınlık'), sizeSelect(S.pref.inkWidth, v => { S.pref.inkWidth = v; }, [1, 1.5, 2, 3, 4, 6, 8])),
      h('p', { class: 'hint' }, 'Yorumlar kaydederken sayfanın bir parçası olarak işlenir; her PDF okuyucuda aynı görünür.'));
  },
  fill() {
    const sigs = loadSignatures();
    const formInfo = h('p', { class: 'stat' }, 'Form alanları aranıyor…');
    countFields().then(n => {
      formInfo.textContent = tr(n ? `Bu belgede ${n} form alanı var. Alanların içine tıklayıp doğrudan yazabilirsiniz.` : 'Bu belgede doldurulabilir form alanı yok. Metin, tarih ve işaretleri istediğiniz yere ekleyebilirsiniz.');
    });
    const flat = h('input', { type: 'checkbox' }); flat.checked = !!S.doc.flatten;
    flat.addEventListener('change', () => { S.doc.flatten = flat.checked; markDirty(); });
    return h('div', null,
      h('button', { class: 'btn primary wide', type: 'button', style: { marginBottom: '12px' }, onclick: signatureDialog }, I('signature', 18), 'İmza oluştur'),
      sigs.length ? h('div', null, h('h4', null, 'Kayıtlı imzalar'), h('div', { class: 'sigs' }, sigs.map((url, k) =>
        h('button', { type: 'button', title: 'Bu imzayı yerleştir', onclick: e => { if (e.target.closest('.rm')) return; useSignatureUrl(url); } },
          h('img', { src: url, alt: 'Kayıtlı imza' }),
          h('span', { class: 'rm', role: 'button', tabindex: '0', title: 'İmzayı unut', 'aria-label': 'İmzayı unut', onclick: e => { e.stopPropagation(); forgetSignature(k); } }, I('x', 12)))))) : null,
      h('h4', null, 'Ekle'),
      h('div', { class: 'bgrid' },
        modeBtn('text', 'type', 'Metin'),
        modeBtn('date', 'clock', 'Bugünün tarihi'),
        modeBtn('check', 'check', 'Onay işareti'),
        modeBtn('cross', 'x', 'Çarpı işareti')),
      h('h4', null, 'Form alanları'), formInfo,
      h('label', { class: 'check' }, flat, h('span', null, 'Kaydederken formu düzleştir', h('br'), h('small', { style: { color: 'var(--ink-2)' } }, 'Alanlar düz yazıya dönüşür, sonradan değiştirilemez.'))));
  },
  stamp() {
    const custom = h('input', { class: 'inp', placeholder: 'Örn. ÖDENDİ', maxlength: '40' });
    return h('div', null,
      h('div', { class: 'stamps' }, STAMPS.map(s => h('button', { class: 'stampbtn', type: 'button', style: { color: s.color }, 'aria-pressed': String(S.mode === 'stamp' && S.pref.stamp.text === s.text),
        onclick: () => { S.pref.stamp = { ...s }; setMode('stamp'); } }, s.text))),
      h('h4', null, 'Kendi damganız'),
      h('div', { class: 'field' }, custom),
      h('div', { class: 'field' }, h('span', null, 'Renk'), swatchRow(COLORS.slice(0, 7), S.pref.stamp.color, c => { S.pref.stamp.color = c; renderPane(); })),
      h('button', { class: 'btn wide', type: 'button', onclick: () => {
        const t = custom.value.trim(); if (!t) { custom.focus(); return; }
        S.pref.stamp = { text: t.toLocaleUpperCase('tr'), color: S.pref.stamp.color }; setMode('stamp'); } }, I('stamp', 18), 'Bu damgayı bas'),
      h('p', { class: 'hint' }, 'Damgayı seçtikten sonra sayfada istediğiniz yere tıklayın. Köşesinden sürükleyerek büyütebilirsiniz.'));
  },
  organize() {
    const sel = selectedPages(), n = sel.length;
    const dis = !n;
    return h('div', null,
      h('p', { class: 'stat' }, n ? `${n} sayfa seçili` : 'Sayfa seçmek için üzerine tıklayın. Ctrl ile birden çok, Shift ile aralık seçin.'),
      h('div', { class: 'bgrid' },
        h('button', { class: 'btn', type: 'button', disabled: dis, onclick: () => rotatePages(selectedPages(), -90) }, I('rotate-ccw', 20), 'Sola döndür'),
        h('button', { class: 'btn', type: 'button', disabled: dis, onclick: () => rotatePages(selectedPages(), 90) }, I('rotate-cw', 20), 'Sağa döndür'),
        h('button', { class: 'btn', type: 'button', disabled: dis, onclick: () => shiftPages(-1) }, I('chevron-left', 20), 'Öne taşı'),
        h('button', { class: 'btn', type: 'button', disabled: dis, onclick: () => shiftPages(1) }, I('chevron-right', 20), 'Sona taşı'),
        h('button', { class: 'btn', type: 'button', onclick: insertBlank }, I('plus', 20), 'Boş sayfa ekle'),
        h('button', { class: 'btn', type: 'button', onclick: insertFromFile }, I('file-input', 20), 'Dosyadan sayfa ekle'),
        h('button', { class: 'btn', type: 'button', disabled: dis, onclick: () => extractPages(selectedPages()) }, I('file-output', 20), 'Seçilenleri ayıkla'),
        h('button', { class: 'btn danger', type: 'button', disabled: dis, onclick: () => deletePages(selectedPages()) }, I('trash-2', 20), 'Sil')),
      h('button', { class: 'btn wide', type: 'button', onclick: () => { S.orgSel = new Set(S.doc.pages.map(p => p.id)); renderOrganize(); renderPane(); } }, I('list-checks', 18), 'Tümünü seç'),
      h('p', { class: 'hint' }, 'Sırayı değiştirmek için sayfaları sürükleyip bırakın. Bir sayfayı açmak için çift tıklayın.'),
      h('button', { class: 'btn primary wide', type: 'button', onclick: () => closeOrganize() }, I('check', 18), 'Bitti'));
  },
  decor() {
    const st = S.doc.settings;
    const live = (fn) => () => { fn(); markDirty(); refreshDeco(); };
    const snapOnFocus = el => { el.addEventListener('focus', () => snapshot(), { once: true }); return el; };
    const wmOn = h('input', { type: 'checkbox' }); wmOn.checked = st.wm.on;
    wmOn.addEventListener('change', () => { snapshot(); st.wm.on = wmOn.checked; markDirty(); refreshDeco(); });
    const wmText = snapOnFocus(h('input', { class: 'inp', value: st.wm.text, maxlength: '60' }));
    wmText.addEventListener('input', live(() => { st.wm.text = wmText.value; }));
    const wmSize = h('input', { type: 'range', min: '20', max: '140', value: String(st.wm.size), style: { width: '100%' } });
    wmSize.addEventListener('input', live(() => { st.wm.size = +wmSize.value; }));
    const wmOp = h('input', { type: 'range', min: '5', max: '60', value: String(Math.round(st.wm.opacity * 100)), style: { width: '100%' } });
    wmOp.addEventListener('input', live(() => { st.wm.opacity = +wmOp.value / 100; }));
    const wmAng = h('select', { class: 'inp' }, [[0, 'Yatay'], [45, 'Çapraz (45°)'], [90, 'Dikey']].map(([v, l]) => h('option', { value: String(v) }, l)));
    wmAng.value = String(st.wm.angle); wmAng.addEventListener('change', () => { snapshot(); st.wm.angle = +wmAng.value; markDirty(); refreshDeco(); });
    const pnOn = h('input', { type: 'checkbox' }); pnOn.checked = st.pn.on;
    pnOn.addEventListener('change', () => { snapshot(); st.pn.on = pnOn.checked; markDirty(); refreshDeco(); });
    const formats = [...new Set(['{n}', tr('Sayfa {n}'), tr('Sayfa {n} / {N}'), '{n} / {N}', '- {n} -', st.pn.fmt])];
    const pnFmt = h('select', { class: 'inp' }, formats.map(f => h('option', { value: f }, f.replace('{n}', '3').replace('{N}', '12'))));
    pnFmt.value = st.pn.fmt; pnFmt.addEventListener('change', () => { snapshot(); st.pn.fmt = pnFmt.value; markDirty(); refreshDeco(); });
    const pnPos = h('select', { class: 'inp' }, [['bc', 'Alt orta'], ['br', 'Alt sağ'], ['bl', 'Alt sol'], ['tc', 'Üst orta'], ['tr', 'Üst sağ'], ['tl', 'Üst sol']].map(([v, l]) => h('option', { value: v }, l)));
    pnPos.value = st.pn.pos; pnPos.addEventListener('change', () => { snapshot(); st.pn.pos = pnPos.value; markDirty(); refreshDeco(); });
    const pnStart = h('input', { class: 'inp', type: 'number', min: '0', max: '9999', value: String(st.pn.start) });
    pnStart.addEventListener('change', () => { snapshot(); st.pn.start = clamp(parseInt(pnStart.value, 10) || 1, 0, 9999); markDirty(); refreshDeco(); });
    return h('div', null,
      h('label', { class: 'check' }, wmOn, h('strong', null, 'Filigran ekle')),
      h('div', { class: 'field' }, h('span', null, 'Filigran metni'), wmText),
      h('div', { class: 'field' }, h('span', null, 'Boyut'), wmSize),
      h('div', { class: 'field' }, h('span', null, 'Saydamlık'), wmOp),
      h('div', { class: 'field' }, h('span', null, 'Yön'), wmAng),
      h('div', { class: 'field' }, h('span', null, 'Renk'), swatchRow(COLORS.slice(0, 7), st.wm.color, c => { snapshot(); st.wm.color = c; markDirty(); refreshDeco(); renderPane(); })),
      h('h4', { style: { marginTop: '24px' } }, ''),
      h('label', { class: 'check' }, pnOn, h('strong', null, 'Sayfa numarası ekle')),
      h('div', { class: 'field' }, h('span', null, 'Biçim'), pnFmt),
      h('div', { class: 'field' }, h('span', null, 'Konum'), pnPos),
      h('div', { class: 'field' }, h('span', null, 'İlk numara'), pnStart),
      h('p', { class: 'hint' }, 'Önizleme sayfaların üzerinde görünür; kaydettiğinizde tüm sayfalara uygulanır.'));
  },
  redact() {
    const n = S.doc.pages.reduce((a, p) => a + p.items.filter(i => i.type === 'redact').length, 0);
    return h('div', null,
      h('div', { class: 'bgrid' }, modeBtn('redact', 'eye-off', 'Karartılacak alanı seç'),
        h('button', { class: 'btn', type: 'button', disabled: !n, onclick: () => { snapshot(); for (const p of S.doc.pages) { p.items = p.items.filter(i => i.type !== 'redact'); renderItems(p); } S.sel = null; markDirty(); renderPane(); } }, I('circle-x' in ICONS ? 'circle-x' : 'x', 20), 'İşaretleri kaldır')),
      h('p', { class: 'stat' }, n ? `${n} alan karartma için işaretli.` : 'Henüz karartma için işaretli alan yok.'),
      h('p', { class: 'hint' }, 'Kaydettiğinizde işaretli alanların altındaki yazı ve görüntü kalıcı olarak silinir. Karartma yapılan sayfalar yüksek çözünürlüklü resme dönüştürülür; bu sayfalardaki metin artık seçilemez ve aranamaz.'),
      h('p', { class: 'hint' }, 'Kaydetmeden önce işaretli alanları taşıyabilir, büyütebilir ya da silebilirsiniz.'));
  },
  split() {
    const mode = h('select', { class: 'inp' }, h('option', { value: 'every' }, 'Her N sayfada bir'), h('option', { value: 'ranges' }, 'Sayfa aralıklarına göre'));
    const every = h('input', { class: 'inp', type: 'number', min: '1', value: '1' });
    const ranges = h('input', { class: 'inp', placeholder: 'Örn. 1-3, 4-6, 7' });
    const fEvery = h('div', { class: 'field' }, h('span', null, 'Kaç sayfada bir bölünsün?'), every);
    const fRanges = h('div', { class: 'field', style: { display: 'none' } }, h('span', null, 'Sayfa aralıkları (her biri ayrı dosya olur)'), ranges);
    const info = h('p', { class: 'stat' });
    const upd = () => {
      fEvery.style.display = mode.value === 'every' ? '' : 'none'; fRanges.style.display = mode.value === 'ranges' ? '' : 'none';
      try { const g = splitGroups(mode.value, every.value, ranges.value); info.textContent = tr(`${S.doc.pages.length} sayfadan ${g.length} dosya oluşur.`); info.classList.remove('warn'); }
      catch (e) { info.textContent = e.message; }
    };
    mode.addEventListener('change', upd); every.addEventListener('input', upd); ranges.addEventListener('input', upd); upd();
    return h('div', null,
      h('div', { class: 'field' }, h('span', null, 'Bölme yöntemi'), mode), fEvery, fRanges, info,
      h('button', { class: 'btn primary wide', type: 'button', onclick: () => guard(async () => {
        const groups = splitGroups(mode.value, every.value, ranges.value);
        await busy('Belge bölünüyor…', async () => {
          const zip = new JSZipLib(), base = baseName(S.doc.name);
          for (const [k, g] of groups.entries()) { setBusyMsg(`Bölüm ${k + 1}/${groups.length} hazırlanıyor…`); zip.file(`${base}-part-${String(k + 1).padStart(2, '0')}.pdf`, await buildPdf(g)); }
          await saveFile(`${base}-parts.zip`, await zip.generateAsync({ type: 'blob' }));
        });
      }) }, I('scissors', 18), 'Böl ve ZIP olarak kaydet'));
  },
  export() {
    const fmt = h('select', { class: 'inp' }, h('option', { value: 'png' }, 'Resim (PNG)'), h('option', { value: 'txt' }, 'Düz metin (TXT)'));
    const dpi = h('select', { class: 'inp' }, [[72, 'Ekran (72 dpi)'], [150, 'Standart (150 dpi)'], [300, 'Baskı (300 dpi)']].map(([v, l]) => h('option', { value: String(v) }, l)));
    dpi.value = '150';
    const fd = h('div', { class: 'field' }, h('span', null, 'Çözünürlük'), dpi);
    fmt.addEventListener('change', () => { fd.style.display = fmt.value === 'png' ? '' : 'none'; });
    return h('div', null,
      h('div', { class: 'field' }, h('span', null, 'Biçim'), fmt), fd,
      h('button', { class: 'btn primary wide', type: 'button', onclick: () => guard(() => fmt.value === 'png' ? exportImages(+dpi.value) : exportText()) }, I('file-down', 18), 'Dışa aktar'),
      h('p', { class: 'hint' }, 'Dışa aktarma yaptığınız düzenlemeleri de içerir. Birden çok sayfa ZIP dosyası olarak kaydedilir. Taranmış (resim) sayfalardaki yazılar metin olarak çıkmaz.'),
      h('p', { class: 'hint' }, 'Word (DOCX) dışa aktarma bu sürümde yok.'));
  },
  props() {
    const pr = S.doc.props;
    const fld = (label, key, ph) => {
      const inp = h('input', { class: 'inp', value: pr[key] || '', placeholder: ph || '' });
      inp.addEventListener('focus', () => snapshot(), { once: true });
      inp.addEventListener('input', () => { pr[key] = inp.value; markDirty(); });
      return h('div', { class: 'field' }, h('span', null, label), inp);
    };
    const clean = h('input', { type: 'checkbox' }); clean.checked = !!pr.clean;
    clean.addEventListener('change', () => { snapshot(); pr.clean = clean.checked; markDirty(); });
    return h('div', null,
      fld('Başlık', 'title'), fld('Yazar', 'author'), fld('Konu', 'subject'), fld('Anahtar sözcükler', 'keywords', 'virgülle ayırın'),
      h('label', { class: 'check' }, clean, h('span', null, 'Kaydederken yukarıdakiler dışındaki tüm meta verileri temizle')),
      h('p', { class: 'hint' }, `Dosya adı: ${S.doc.name}. Kaydedilen dosyada oluşturucu olarak “PDF Werkstatt” yazar.`));
  },
};
async function countFields() {
  const names = new Set();
  for (const p of S.doc.pages) for (const a of await formWidgets(p)) names.add(p.srcId + '::' + a.fieldName);
  return names.size;
}
function splitGroups(mode, every, ranges) {
  const pages = S.doc.pages, N = pages.length;
  if (mode === 'every') {
    const n = parseInt(every, 10); if (!(n >= 1)) throw new UserErr('Geçerli bir sayfa sayısı girin.');
    const g = []; for (let i = 0; i < N; i += n) g.push(pages.slice(i, i + n)); return g;
  }
  const parts = String(ranges || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  if (!parts.length) throw new UserErr('En az bir sayfa aralığı girin (örn. 1-3, 4-6).');
  return parts.map(part => {
    const m = /^(\d*)\s*[-–]\s*(\d*)$/.exec(part) || /^(\d+)$/.exec(part);
    if (!m) throw new UserErr(`“${part}” anlaşılamadı. Aralıkları 1-3 ya da 5 biçiminde yazın.`);
    let a = m[1] ? parseInt(m[1], 10) : 1, b = m.length > 2 ? (m[2] ? parseInt(m[2], 10) : N) : a;
    if (a < 1 || b > N || a > b) throw new UserErr(`“${part}” aralığı geçersiz. Belgede ${N} sayfa var.`);
    return pages.slice(a - 1, b);
  });
}

/* =========================================================================
   Dialogs: merge / create, image and signature
   ========================================================================= */
async function combineDialog(kind) {
  const create = kind === 'create', append = kind === 'append';
  const list = [];
  const rows = h('div', { class: 'flist' });
  const fitSel = h('select', { class: 'inp' }, h('option', { value: 'a4' }, 'A4 sayfaya sığdır'), h('option', { value: 'img' }, 'Görselin kendi boyutu'));
  const go = { btn: null };
  const accept = create ? ACCEPT_IMG : ACCEPT_ALL;
  const add = files => {
    for (const f of files) {
      const img = isImageName(f);
      if (create && !img) { toast(`“${f.name}” görsel değil, atlandı.`); continue; }
      list.push({ f, img });
    }
    draw();
  };
  const draw = () => {
    rows.replaceChildren(...list.map((e, i) => h('div', { class: 'frow' },
      I(e.img ? 'image' : 'file-text', 18), h('span', { class: 'n', title: e.f.name }, e.f.name), h('span', { class: 'k' }, e.img ? 'Görsel' : 'PDF'),
      h('button', { class: 'btn ghost icon sm', type: 'button', title: 'Yukarı taşı', 'aria-label': 'Yukarı taşı', disabled: i === 0, onclick: () => { [list[i - 1], list[i]] = [list[i], list[i - 1]]; draw(); } }, I('chevron-up', 16)),
      h('button', { class: 'btn ghost icon sm', type: 'button', title: 'Aşağı taşı', 'aria-label': 'Aşağı taşı', disabled: i === list.length - 1, onclick: () => { [list[i + 1], list[i]] = [list[i], list[i + 1]]; draw(); } }, I('chevron-down', 16)),
      h('button', { class: 'btn ghost icon sm', type: 'button', title: 'Listeden çıkar', 'aria-label': 'Listeden çıkar', onclick: () => { list.splice(i, 1); draw(); } }, I('x', 16)))));
    if (go.btn) go.btn.disabled = !list.length || (kind === 'combine' && list.length < 1);
  };
  const dz = h('div', { class: 'dz' }, create ? 'Görselleri buraya bırakın ya da ' : 'PDF ve görselleri buraya bırakın ya da ',
    h('button', { class: 'btn sm', type: 'button', onclick: () => pickFiles(accept).then(add) }, I('plus', 15), 'Dosya ekle'));
  wireDropZone(dz, add);
  const body = h('div', null,
    h('p', null, create ? 'Her görsel bir sayfa olur. Sırayı oklarla değiştirebilirsiniz.' : append ? 'Seçtiğiniz dosyaların sayfaları açık belgenin sonuna eklenir.' : 'Dosyalar listedeki sırayla tek PDF belgesinde birleştirilir.'),
    dz, rows,
    h('div', { class: 'field' }, h('span', null, 'Görseller için sayfa boyutu'), fitSel));
  const title = create ? 'Görsellerden PDF oluştur' : append ? 'Belgeye dosya ekle' : 'Dosyaları birleştir';
  const label = create ? 'PDF oluştur' : append ? 'Ekle' : 'Birleştir';
  const res = await dialog(title, body, [
    { label: 'Vazgeç', value: null },
    { label, kind: 'primary', id: 'combineGo', disabled: true, onClick: close => close(true) },
  ], { width: 600, onOpen: dlg => { go.btn = dlg.querySelector('#combineGo'); pickFiles(accept).then(add); } });
  if (!res || !list.length) return;
  const files = list.map(e => e.f);
  if (append && S.doc) return openFiles(files, { append: true, fit: fitSel.value });
  await openFiles(files, { fit: fitSel.value, name: create ? (files.length === 1 ? baseName(files[0].name) + '.pdf' : 'images.pdf') : (files.length === 1 ? files[0].name : 'merged-document.pdf') });
}
async function registerImage(bytes, mime) {
  const img = await normalizeImage(bytes, mime);
  const id = uid();
  img.url = `data:${img.kind === 'jpg' ? 'image/jpeg' : 'image/png'};base64,${bytesToB64(img.bytes)}`;
  S.images.set(id, img);
  return id;
}
async function addImageFlow() {
  const [f] = await pickFiles(ACCEPT_IMG, false); if (!f) return;
  await guard(async () => {
    const id = await registerImage(new Uint8Array(await f.arrayBuffer()), f.type);
    setMode('image', id);
    toast('Resmi koymak istediğiniz yere tıklayın.');
  });
}
const SIG_KEY = 'pdf-workshop.signatures';
function loadSignatures() { try { const v = JSON.parse(localStorage.getItem(SIG_KEY) || '[]'); return Array.isArray(v) ? v.filter(s => typeof s === 'string' && s.startsWith('data:image/png')).slice(0, 4) : []; } catch (e) { return []; } }
function storeSignature(url) { try { const l = loadSignatures().filter(s => s !== url); l.unshift(url); localStorage.setItem(SIG_KEY, JSON.stringify(l.slice(0, 4))); } catch (e) { /* storage unavailable */ } }
function forgetSignature(k) { try { const l = loadSignatures(); l.splice(k, 1); localStorage.setItem(SIG_KEY, JSON.stringify(l)); } catch (e) { /* ignore */ } renderPane(); }
async function useSignatureUrl(url) {
  const bytes = b64ToBytes(url.split(',')[1]);
  const id = await registerImage(bytes, 'image/png');
  setMode('sign', id);
}
function trimCanvas(c, pad = 6) {
  const ctx = c.getContext('2d'), { width: w, height: hh } = c, d = ctx.getImageData(0, 0, w, hh).data;
  let x0 = w, y0 = hh, x1 = -1, y1 = -1;
  for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(hh - 1, y1 + pad);
  const o = h('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
  o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  return o;
}
async function signatureDialog() {
  await fontsReady;
  const SIG_COLORS = [['#14181F', 'Siyah'], ['#1E3A8A', 'Lacivert'], ['#1D5FD1', 'Mavi']];
  let tab = 'draw', color = SIG_COLORS[0][0], uploaded = null, drawn = false;
  const segs = h('div', { class: 'segs', role: 'tablist' });
  const pad = h('canvas', { class: 'sigpad', 'aria-label': 'İmza çizim alanı' });
  const typed = h('input', { class: 'inp', placeholder: 'Adınızı ve soyadınızı yazın', maxlength: '60' });
  const prev = h('div', { class: 'sigprev' }, '');
  const upPrev = h('div', { class: 'sigimg' }, h('span', { class: 'hint' }, 'Henüz görsel seçilmedi'));
  const removeBg = h('input', { type: 'checkbox' }); removeBg.checked = true;
  const remember = h('input', { type: 'checkbox' }); remember.checked = true;
  const colorRow = h('div', { class: 'row', style: { margin: '12px 0' } }, h('span', { class: 'hint', style: { margin: '0 6px 0 0' } }, 'Renk'),
    ...SIG_COLORS.map(([c, n]) => h('button', { class: 'sw', type: 'button', style: { background: c }, title: n, 'aria-label': n, 'aria-pressed': String(c === color), onclick: e => {
      color = c; colorRow.querySelectorAll('.sw').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); prev.style.color = c; recolorPad(); } })));
  prev.style.color = color;
  typed.addEventListener('input', () => { prev.textContent = typed.value; });
  const panes = {
    draw: h('div', null, pad, h('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '8px' } },
      h('span', { class: 'hint', style: { margin: 0 } }, 'Fareyle, kalemle ya da parmağınızla imzalayın.'),
      h('button', { class: 'btn sm', type: 'button', onclick: () => { strokes.length = 0; redrawPad(); } }, 'Temizle'))),
    type: h('div', null, typed, h('div', { style: { height: '10px' } }), prev),
    upload: h('div', null, upPrev, h('div', { class: 'row', style: { marginTop: '10px' } },
      h('button', { class: 'btn sm', type: 'button', onclick: async () => {
        const [f] = await pickFiles(ACCEPT_IMG, false); if (!f) return;
        const ub = new Uint8Array(await f.arrayBuffer()); uploaded = await createImageBitmap(new Blob([ub], { type: f.type || 'image/png' })); upPrev.replaceChildren(h('img', { src: `data:${f.type || 'image/png'};base64,${bytesToB64(ub)}`, alt: 'Yüklenen imza' }));
      } }, I('image-plus', 15), 'Görsel seç')),
      h('label', { class: 'check', style: { marginTop: '10px' } }, removeBg, h('span', null, 'Beyaz arka planı kaldır'))),
  };
  const holder = h('div');
  const setTab = t => { tab = t; segs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === t))); holder.replaceChildren(panes[t]); colorRow.style.display = t === 'upload' ? 'none' : ''; if (t === 'draw') sizePad(); };
  for (const [t, l] of [['draw', 'Çiz'], ['type', 'Yaz'], ['upload', 'Görsel yükle']]) segs.append(h('button', { type: 'button', role: 'tab', 'data-t': t, onclick: () => setTab(t) }, l));
  // drawing area
  const strokes = []; let cur = null;
  const pctx = () => pad.getContext('2d');
  function sizePad() { requestAnimationFrame(() => { const r = pad.getBoundingClientRect(); if (!r.width) return; const dpr = window.devicePixelRatio || 1; pad.width = Math.round(r.width * dpr); pad.height = Math.round(r.height * dpr); redrawPad(); }); }
  function redrawPad() {
    const ctx = pctx(), dpr = pad.width / Math.max(1, pad.getBoundingClientRect().width || pad.width);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, pad.width, pad.height);
    ctx.strokeStyle = 'rgba(27,36,51,.18)'; ctx.lineWidth = 1 * dpr; ctx.setLineDash([4 * dpr, 4 * dpr]);
    ctx.beginPath(); ctx.moveTo(20 * dpr, pad.height * 0.72); ctx.lineTo(pad.width - 20 * dpr, pad.height * 0.72); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 2.6 * dpr;
    for (const s of strokes) { ctx.beginPath(); s.forEach(([x, y], i) => i ? ctx.lineTo(x * dpr, y * dpr) : ctx.moveTo(x * dpr, y * dpr)); if (s.length === 1) ctx.lineTo(s[0][0] * dpr + 0.1, s[0][1] * dpr); ctx.stroke(); }
    drawn = strokes.length > 0;
  }
  function recolorPad() { redrawPad(); }
  pad.addEventListener('pointerdown', e => { e.preventDefault(); pad.setPointerCapture(e.pointerId); const r = pad.getBoundingClientRect(); cur = [[e.clientX - r.left, e.clientY - r.top]]; strokes.push(cur); redrawPad(); });
  pad.addEventListener('pointermove', e => { if (!cur) return; const r = pad.getBoundingClientRect(); cur.push([e.clientX - r.left, e.clientY - r.top]); redrawPad(); });
  pad.addEventListener('pointerup', () => { cur = null; });
  pad.addEventListener('pointercancel', () => { cur = null; });
  const body = h('div', null, segs, holder, colorRow,
    h('label', { class: 'check' }, remember, h('span', null, 'Bu imzayı bu tarayıcıda hatırla')));
  setTab('draw');
  const out = await dialog('İmza oluştur', body, [
    { label: 'Vazgeç', value: null },
    { label: 'İmzayı yerleştir', kind: 'primary', onClick: close => {
      let c = null;
      if (tab === 'draw') {
        if (!drawn) { toast('Önce imzanızı çizin.'); return false; }
        const off = h('canvas'); const r = pad.getBoundingClientRect(); const k = 3; off.width = Math.round(r.width * k); off.height = Math.round(r.height * k);
        const ctx = off.getContext('2d'); ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 2.6 * k;
        for (const s of strokes) { ctx.beginPath(); s.forEach(([x, y], i) => i ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k)); if (s.length === 1) ctx.lineTo(s[0][0] * k + 0.3, s[0][1] * k); ctx.stroke(); }
        c = trimCanvas(off, 8);
      } else if (tab === 'type') {
        const t = typed.value.trim(); if (!t) { toast('Önce adınızı yazın.'); typed.focus(); return false; }
        const size = 120, off = h('canvas'), ctx0 = off.getContext('2d'); ctx0.font = `${size}px WorkshopScript`;
        off.width = Math.ceil(ctx0.measureText(t).width + size); off.height = Math.ceil(size * 1.8);
        const ctx = off.getContext('2d'); ctx.font = `${size}px WorkshopScript`; ctx.fillStyle = color; ctx.textBaseline = 'alphabetic'; ctx.fillText(t, size * 0.4, size * 1.25);
        c = trimCanvas(off, 10);
      } else {
        if (!uploaded) { toast('Önce bir görsel seçin.'); return false; }
        const k = Math.min(1, 1600 / Math.max(uploaded.width, uploaded.height));
        const off = h('canvas'); off.width = Math.round(uploaded.width * k); off.height = Math.round(uploaded.height * k);
        const ctx = off.getContext('2d', { willReadFrequently: true }); ctx.drawImage(uploaded, 0, 0, off.width, off.height);
        if (removeBg.checked) { const d = ctx.getImageData(0, 0, off.width, off.height); const a = d.data; for (let i = 0; i < a.length; i += 4) { const l = (a[i] + a[i + 1] + a[i + 2]) / 3; if (l > 225) a[i + 3] = 0; else if (l > 180) a[i + 3] = Math.round(a[i + 3] * (225 - l) / 45); } ctx.putImageData(d, 0, 0); }
        c = trimCanvas(off, 6);
      }
      if (!c) { toast('İmza boş görünüyor.'); return false; }
      close(c.toDataURL('image/png'));
    } },
  ], { width: 600 });
  if (!out) return;
  if (remember.checked) storeSignature(out);
  if (S.tool !== 'fill') openTool('fill');
  await useSignatureUrl(out);
  renderPane();
}
