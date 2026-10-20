(() => {
'use strict';

/* =========================================================================
   PDF Werkstatt — a local browser-based PDF editor
   Rendering: pdf.js · Writing: pdf-lib (+fontkit) · ZIP: JSZip
   ========================================================================= */

const pdfjs = window.pdfjsLib, PL = window.PDFLib, FK = window.fontkit, JSZipLib = window.JSZip;

/* ---------- small helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false || k === 'noI18n') continue;
    if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'value') e.value = v;
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, ['title', 'aria-label', 'placeholder'].includes(k) ? tr(v) : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    e.append(c.nodeType ? c : document.createTextNode(props && props.noI18n ? String(c) : tr(String(c))));
  }
  return e;
}
function svgIcon(name, size = 18, sw = 1.75) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}
const I = (name, size = 18, sw) => h('span', { class: 'ic', html: svgIcon(name, size, sw) });
const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const r2 = n => Math.round(n * 100) / 100;
function b64ToBytes(s) { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
function bytesToB64(u) { let s = ''; const CH = 0x8000; for (let i = 0; i < u.length; i += CH) s += String.fromCharCode.apply(null, u.subarray(i, i + CH)); return btoa(s); }
function hexToRgb(hex) { const m = /^#?([0-9a-f]{6})$/i.exec(hex || '') ; const n = m ? parseInt(m[1], 16) : 0; return PL.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); }
const trLower = s => s.toLocaleLowerCase(uiLang);
const baseName = n => (n || 'document').replace(/\.[^.]+$/, '');
const fmtDate = d => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
class UserErr extends Error {}

/* ---------- fonts ---------- */
const FONT = { reg: b64ToBytes(FONT_DATA.reg), semi: b64ToBytes(FONT_DATA.semi), script: b64ToBytes(FONT_DATA.script) };
// Inter metrics (2048 units/em): ascent 1984, descent 494, capital height 1490
const M = { asc: 1984 / 2048, desc: 494 / 2048, cap: 1490 / 2048, lh: 1.25 };
const fontsReady = (async () => {
  const o = { ascentOverride: '96.875%', descentOverride: '24.121%', lineGapOverride: '0%' };
  const faces = [
    new FontFace('WorkshopInter', FONT.reg.slice().buffer, { ...o, weight: '400' }),
    new FontFace('WorkshopInter', FONT.semi.slice().buffer, { ...o, weight: '600' }),
    new FontFace('WorkshopScript', FONT.script.slice().buffer),
  ];
  for (const f of faces) { try { document.fonts.add(f); await f.load(); } catch (e) { console.warn('font', e); } }
})();
const mctx = document.createElement('canvas').getContext('2d');
function textW(str, size, weight = 400) { mctx.font = `${weight} ${size}px WorkshopInter`; return mctx.measureText(str).width; }

/* ---------- state ---------- */
const S = {
  view: 'home',
  doc: null,
  zoom: 1, fit: 'width',
  mode: 'select', modeArg: null,
  sel: null,            // { pageId, itemId }
  editing: null,
  tool: null,
  organize: false,
  orgSel: new Set(), orgAnchor: null,
  undo: [], redo: [],
  images: new Map(),    // id -> { bytes, kind, url, w, h }
  search: null,
  cur: 0,
  showThumbs: window.innerWidth > 920,
  showPane: window.innerWidth > 920,
  pref: {
    textSize: 14, textColor: '#1B2433',
    inkColor: '#1F4E9E', inkWidth: 2,
    hlColor: '#FFD43B', rectColor: '#B3392C',
    stamp: { text: 'ONAYLANDI', color: '#2A7046' },
  },
};
const COLORS = ['#1B2433', '#1F4E9E', '#0D7A70', '#2A7046', '#B3392C', '#9E680A', '#653A8A', '#FFFFFF'];
const HL_COLORS = ['#FFD43B', '#8CE99A', '#FFA8C5', '#91C5FF'];
const STAMPS = [
  { text: 'ONAYLANDI', color: '#2A7046' }, { text: 'REDDEDİLDİ', color: '#B3392C' },
  { text: 'TASLAK', color: '#1F4E9E' }, { text: 'GİZLİ', color: '#B3392C' },
  { text: 'ALINDI', color: '#0D7A70' }, { text: 'KOPYA', color: '#556073' },
];

/* ---------- tool catalog (adapted from the PdfCraft "All tools" layout) ---------- */
const TOOLS = [
  { id: 'create', label: 'PDF oluştur', icon: 'file-plus-2', c: 'cobalt', desc: 'Fotoğraf ve görsellerden PDF yapın.', noDoc: true },
  { id: 'combine', label: 'Dosyaları birleştir', icon: 'files', c: 'cobalt', desc: "PDF'leri ve görselleri tek dosyada toplayın.", noDoc: true },
  { id: 'organize', label: 'Sayfaları düzenle', icon: 'layout-grid', c: 'cobalt', desc: 'Döndürün, silin, sıralayın, sayfa ekleyin.' },
  { id: 'edit', label: "PDF'i düzenle", icon: 'file-pen-line', c: 'cobalt', desc: 'Metin ve resim ekleyin, alanları beyazla örtün.' },
  { id: 'export', label: "PDF'i dışa aktar", icon: 'file-output', c: 'cobalt', desc: 'Sayfaları PNG resme ya da düz metne çevirin.' },
  { id: 'split', label: 'Belgeyi böl', icon: 'scissors', c: 'cobalt', desc: 'Sayfa aralıklarına göre ayrı dosyalara ayırın.' },
  { id: 'comment', label: 'Yorum ekle', icon: 'message-square-text', c: 'saffron', desc: 'Vurgulayın, çizin, yapışkan not bırakın.' },
  { id: 'stamp', label: 'Damga', icon: 'stamp', c: 'saffron', desc: 'Onaylandı, Taslak gibi damgalar basın.' },
  { id: 'decor', label: 'Filigran ve sayfa numarası', icon: 'layers', c: 'saffron', desc: 'Tüm sayfalara filigran ve numara ekleyin.' },
  { id: 'fill', label: 'Doldur ve İmzala', icon: 'signature', c: 'plum', desc: 'Form alanlarını doldurun, imzanızı ekleyin.' },
  { id: 'redact', label: 'Karart', icon: 'eye-off', c: 'coral', desc: 'Gizli bilgileri belgeden kalıcı olarak silin.' },
  { id: 'props', label: 'Belge özellikleri', icon: 'tag', c: 'coral', desc: 'Başlık, yazar ve meta verileri düzenleyin.' },
];
const TOOL_SECTIONS = [
  { title: 'Oluştur ve düzenle', ids: ['create', 'combine', 'organize', 'edit', 'export', 'split'] },
  { title: 'İncele ve işaretle', ids: ['comment', 'stamp', 'decor'] },
  { title: 'Formlar ve imzalar', ids: ['fill'] },
  { title: 'Koru', ids: ['redact', 'props'] },
];
const toolById = id => TOOLS.find(t => t.id === id);

/* ---------- notifications, busy indicator and dialogs ---------- */
function toast(msg, kind) {
  const t = h('div', { class: 'toast' + (kind === 'err' ? ' err' : '') }, msg);
  $('#toasts').append(t);
  setTimeout(() => t.remove(), kind === 'err' ? 6000 : 3200);
}
let busyDepth = 0;
async function busy(msg, fn) {
  busyDepth++; $('#busyMsg').textContent = tr(msg); $('#busy').classList.add('on');
  await new Promise(r => setTimeout(r, 30));
  try { return await fn(); }
  finally { if (--busyDepth === 0) $('#busy').classList.remove('on'); }
}
function setBusyMsg(msg) { $('#busyMsg').textContent = tr(msg); }

/** Generic dialog. buttons: [{label, kind, value, onClick?(close) }] */
function dialog(title, body, buttons, opts = {}) {
  return new Promise(resolve => {
    const dlg = h('dialog', { 'aria-label': title, style: opts.width ? { width: `min(${opts.width}px, calc(100vw - 24px))` } : null });
    let done = false;
    const close = v => { if (done) return; done = true; dlg.close(); dlg.remove(); resolve(v); };
    const foot = h('div', { class: 'dlg-f' });
    for (const b of buttons) {
      const btn = h('button', { class: 'btn ' + (b.kind || ''), type: 'button' }, b.label);
      if (b.id) btn.id = b.id;
      if (b.disabled) btn.disabled = true;
      btn.addEventListener('click', async () => {
        if (b.onClick) { const r = await b.onClick(close, btn); if (r === false) return; }
        else close(b.value);
      });
      foot.append(btn);
    }
    dlg.append(h('div', { class: 'dlg' },
      h('div', { class: 'dlg-h' }, h('h2', null, title),
        h('button', { class: 'btn ghost icon sm', type: 'button', 'aria-label': 'Kapat', onclick: () => close(null) }, I('x', 18))),
      h('div', { class: 'dlg-b' }, body), foot));
    dlg.addEventListener('cancel', e => { e.preventDefault(); close(null); });
    document.body.append(dlg);
    dlg.showModal();
    if (opts.onOpen) opts.onOpen(dlg, close);
  });
}
const alertBox = (title, msg) => dialog(title, h('p', null, msg), [{ label: 'Tamam', kind: 'primary', value: true }]);
const confirmBox = (title, msg, ok = 'Devam et', danger) => dialog(title, h('p', null, msg),
  [{ label: 'Vazgeç', value: false }, { label: ok, kind: danger ? 'primary danger' : 'primary', value: true }]);
function showError(e) {
  console.error(e);
  const msg = e instanceof UserErr ? e.message : `Beklenmeyen bir hata oluştu: ${e && e.message ? e.message : e}`;
  alertBox('İşlem tamamlanamadı', msg);
}
async function guard(fn) { try { return await fn(); } catch (e) { showError(e); } }

/* ---------- file selection and downloading ---------- */
function pickFiles(accept, multiple = true) {
  return new Promise(resolve => {
    const inp = $('#filePick');
    inp.accept = accept || '';
    inp.multiple = multiple;
    inp.value = '';
    let settled = false;
    inp.onchange = () => { settled = true; resolve(Array.from(inp.files || [])); };
    inp.oncancel = () => { if (!settled) resolve([]); };
    inp.click();
  });
}
const ACCEPT_ALL = 'application/pdf,.pdf,image/png,image/jpeg,image/webp,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.bmp';
const ACCEPT_IMG = 'image/png,image/jpeg,image/webp,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.bmp';
const ACCEPT_PDF = 'application/pdf,.pdf';

let dlNs;
function downloadsNs() {
  if (dlNs !== undefined) return dlNs;
  if (!window.claude || typeof window.claude.use !== 'function') { dlNs = Promise.resolve(null); return dlNs; }
  dlNs = window.claude.use('downloads').catch(() => null);
  return dlNs;
}
const MIME = { pdf: 'application/pdf', zip: 'application/zip', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', txt: 'text/plain;charset=utf-8', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
async function saveFile(filename, data) {
  const ext = filename.split('.').pop().toLowerCase();
  const blob = data instanceof Blob ? data : new Blob([data], { type: MIME[ext] || 'application/octet-stream' });
  const ns = await downloadsNs();
  if (ns) {
    try { await ns.save({ filename, data: blob }); toast(`Kaydedildi: ${filename}`); return true; }
    catch (e) {
      const code = e && e.code;
      if (code === 'declined') { toast('Kaydetme iptal edildi.'); return false; }
      if (code === 'rate_limited') { toast('Önceki kaydetme onayı hâlâ açık.'); return false; }
      if (code === 'too_large') { toast('Dosya bu görünümde kaydedilemeyecek kadar büyük.', 'err'); return false; }
      console.warn('downloads', e);
    }
  }
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename, style: { display: 'none' } });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  toast(`İndirildi: ${filename}`);
  return true;
}

/* ---------- converting files to source documents ---------- */
const isPdfBytes = b => { const n = Math.min(b.length, 1024); for (let i = 0; i < n - 4; i++) if (b[i] === 0x25 && b[i + 1] === 0x50 && b[i + 2] === 0x44 && b[i + 3] === 0x46) return true; return false; };
const isJpeg = b => b[0] === 0xFF && b[1] === 0xD8;
const isPng = b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
const isImageName = f => /^image\//.test(f.type) || /\.(png|jpe?g|webp|gif|bmp)$/i.test(f.name);

function jpegOrientation(b) {
  // Read EXIF orientation (1 = normal); return 1 for invalid data.
  try {
    let i = 2;
    while (i + 4 < b.length) {
      if (b[i] !== 0xFF) return 1;
      const marker = b[i + 1], len = (b[i + 2] << 8) | b[i + 3];
      if (marker === 0xE1 && b[i + 4] === 0x45 && b[i + 5] === 0x78 && b[i + 6] === 0x69 && b[i + 7] === 0x66) {
        const t = i + 10, le = b[t] === 0x49;
        const u16 = o => le ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1];
        const u32 = o => le ? (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0 : ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
        const ifd = t + u32(t + 4), n = u16(ifd);
        for (let k = 0; k < n && k < 64; k++) { const e = ifd + 2 + k * 12; if (u16(e) === 0x0112) return u16(e + 8) || 1; }
        return 1;
      }
      if (marker === 0xDA) return 1;
      i += 2 + len;
    }
  } catch (e) { /* ignore */ }
  return 1;
}
async function rasterToBytes(bytes, mime, preferJpeg) {
  const bmp = await createImageBitmap(new Blob([bytes], { type: mime || 'image/png' }));
  let w = bmp.width, hh = bmp.height; const k = Math.min(1, 4000 / Math.max(w, hh)); w = Math.round(w * k); hh = Math.round(hh * k);
  const c = h('canvas'); c.width = w; c.height = hh; const ctx = c.getContext('2d');
  if (preferJpeg) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, hh); }
  ctx.drawImage(bmp, 0, 0, w, hh); bmp.close && bmp.close();
  const blob = await new Promise(r => c.toBlob(r, preferJpeg ? 'image/jpeg' : 'image/png', 0.92));
  return { bytes: new Uint8Array(await blob.arrayBuffer()), kind: preferJpeg ? 'jpg' : 'png', w, h: hh };
}
/** Prepare an image for PDF embedding, correcting JPEG orientation. */
async function normalizeImage(bytes, mime) {
  if (isJpeg(bytes) && jpegOrientation(bytes) === 1) {
    const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }));
    const r = { bytes, kind: 'jpg', w: bmp.width, h: bmp.height }; bmp.close && bmp.close(); return r;
  }
  if (isJpeg(bytes)) return rasterToBytes(bytes, 'image/jpeg', true);
  if (isPng(bytes)) {
    const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const r = { bytes, kind: 'png', w: bmp.width, h: bmp.height }; bmp.close && bmp.close();
    if (Math.max(r.w, r.h) > 6000) return rasterToBytes(bytes, 'image/png', false);
    return r;
  }
  return rasterToBytes(bytes, mime, false);
}
async function imageToPdfBytes(bytes, mime, fit) {
  const img = await normalizeImage(bytes, mime);
  const doc = await PL.PDFDocument.create();
  const emb = img.kind === 'jpg' ? await doc.embedJpg(img.bytes) : await doc.embedPng(img.bytes);
  let w = img.w * 0.75, hh = img.h * 0.75;
  if (fit === 'a4') {
    const land = w > hh, pw = land ? 841.89 : 595.28, ph = land ? 595.28 : 841.89, m = 28;
    const s = Math.min((pw - 2 * m) / w, (ph - 2 * m) / hh);
    const page = doc.addPage([pw, ph]);
    page.drawImage(emb, { x: (pw - w * s) / 2, y: (ph - hh * s) / 2, width: w * s, height: hh * s });
  } else {
    const s = Math.min(1, 5000 / Math.max(w, hh));
    const page = doc.addPage([w * s, hh * s]);
    page.drawImage(emb, { x: 0, y: 0, width: w * s, height: hh * s });
  }
  doc.setProducer('PDF Werkstatt'); doc.setCreator('PDF Werkstatt');
  return doc.save();
}
function askPassword(name, wrong) {
  const inp = h('input', { class: 'inp', type: 'password', autocomplete: 'off', 'aria-label': 'Parola' });
  const body = h('div', null,
    h('p', null, wrong ? `Parola yanlış. “${name}” için parolayı yeniden girin.` : `“${name}” parola korumalı. Açmak için parolayı girin.`),
    inp);
  return dialog('Parola gerekli', body, [
    { label: 'Vazgeç', value: null },
    { label: 'Aç', kind: 'primary', onClick: close => close(inp.value) },
  ], { onOpen: (dlg, close) => { inp.focus(); inp.addEventListener('keydown', e => { if (e.key === 'Enter') close(inp.value); }); } });
}
async function makeSource(name, bytes, extra = {}) {
  const task = pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false, enableXfa: false, fontExtraProperties: false });
  let protectedDoc = false, cancelled = false, password = '';
  task.onPassword = (update, reason) => {
    protectedDoc = true;
    askPassword(name, reason === pdfjs.PasswordResponses.INCORRECT_PASSWORD).then(pw => {
      if (pw == null) { cancelled = true; task.destroy(); } else { password = pw; update(pw); }
    });
  };
  let pdf;
  try { pdf = await task.promise; }
  catch (e) {
    if (cancelled) throw new UserErr(`“${name}” için parola girilmediği için dosya açılmadı.`);
    throw new UserErr(`“${name}” okunamadı. Dosya bozuk ya da PDF değil.`);
  }
  return { id: uid(), name, bytes, pdf, protected: protectedDoc, password, annots: new Map(), text: new Map(), ...extra };
}
async function fileToSource(file, fit) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (isPdfBytes(bytes)) return makeSource(file.name, bytes);
  if (isImageName(file) || isJpeg(bytes) || isPng(bytes)) {
    let pdfBytes;
    try { pdfBytes = await imageToPdfBytes(bytes, file.type, fit); }
    catch (e) { throw new UserErr(`“${file.name}” görseli okunamadı.`); }
    return makeSource(file.name, pdfBytes, { fromImage: true });
  }
  throw new UserErr(`“${file.name}” açılamadı. Yalnızca PDF ve görsel dosyaları (JPG, PNG, WebP, GIF, BMP) desteklenir.`);
}
async function pagesOf(src) {
  const out = [];
  for (let i = 0; i < src.pdf.numPages; i++) {
    const p = await src.pdf.getPage(i + 1);
    out.push({ id: uid(), srcId: src.id, index: i, baseRot: ((p.rotate % 360) + 360) % 360, view: Array.from(p.view), rot: 0, items: [] });
  }
  return out;
}
function blankPage(w = 595.28, hh = 841.89) {
  return { id: uid(), srcId: null, index: -1, baseRot: 0, view: [0, 0, w, hh], rot: 0, items: [] };
}

/* ---------- page geometry ---------- */
function vbox(p) { const [a, b, c, d] = p.view; return { x0: Math.min(a, c), y0: Math.min(b, d), W: Math.abs(c - a), H: Math.abs(d - b) }; }
function baseSize(p) { const { W, H } = vbox(p); return p.baseRot % 180 ? { w: H, h: W } : { w: W, h: H }; }
const totRot = p => (p.baseRot + p.rot) % 360;
function dispSize(p) { const { W, H } = vbox(p); return totRot(p) % 180 ? { w: H, h: W } : { w: W, h: H }; }
const pageById = id => S.doc && S.doc.pages.find(p => p.id === id);
const itemOf = (page, id) => page && page.items.find(i => i.id === id);

/* ---------- document ---------- */
function newDoc(name) {
  return {
    name, sources: new Map(), pages: [], dirty: false,
    settings: {
      wm: { on: false, text: 'TASLAK', size: 64, opacity: 0.14, color: '#B3392C', angle: 45 },
      pn: { on: false, fmt: 'Sayfa {n} / {N}', pos: 'bc', size: 10, start: 1 },
    },
    props: { title: '', author: '', subject: '', keywords: '', clean: false },
    formValues: {}, flatten: false,
  };
}
async function readInfo(doc, src) {
  try {
    const md = await src.pdf.getMetadata();
    const inf = (md && md.info) || {};
    doc.props.title = inf.Title || ''; doc.props.author = inf.Author || '';
    doc.props.subject = inf.Subject || ''; doc.props.keywords = inf.Keywords || '';
  } catch (e) { /* ignore */ }
}
async function openFiles(files, opts = {}) {
  files = Array.from(files || []);
  if (!files.length) return;
  if (S.doc && S.doc.dirty && !opts.append) {
    const ok = await confirmBox('Kaydedilmemiş değişiklikler', `“${S.doc.name}” belgesinde kaydedilmemiş değişiklikler var. Yeni dosyayı açarsanız bu değişiklikler kaybolur.`, 'Yine de aç', true);
    if (!ok) return;
  }
  await guard(() => busy('Dosyalar açılıyor…', async () => {
    const sources = [];
    for (const [i, f] of files.entries()) { setBusyMsg(`Açılıyor (${i + 1}/${files.length}): ${f.name}`); sources.push(await fileToSource(f, opts.fit)); }
    if (opts.append && S.doc) {
      snapshot();
      const added = [];
      for (const s of sources) { S.doc.sources.set(s.id, s); added.push(...await pagesOf(s)); }
      const at = opts.at == null ? S.doc.pages.length : opts.at;
      S.doc.pages.splice(at, 0, ...added);
      if (S.organize) { S.orgSel = new Set(added.map(p => p.id)); }
      markDirty(); rebuildDoc();
      toast(`${added.length} sayfa eklendi.`);
      return;
    }
    let name = files.length === 1 ? files[0].name : 'merged-document.pdf';
    if (opts.name) name = opts.name;
    if (!/\.pdf$/i.test(name)) name = baseName(name) + '.pdf';
    const doc = newDoc(name);
    for (const s of sources) { doc.sources.set(s.id, s); doc.pages.push(...await pagesOf(s)); }
    if (sources.length === 1 && !sources[0].fromImage) await readInfo(doc, sources[0]);
    doc.dirty = files.length > 1 || sources.some(s => s.fromImage);
    setDoc(doc);
  }));
  if (opts.tool && S.doc) openTool(opts.tool);
}
function setDoc(doc) {
  if (S.doc) for (const s of S.doc.sources.values()) { try { s.pdf.destroy(); } catch (e) { /* ignore */ } }
  mainCache.clear(); thumbCache.clear();
  S.doc = doc; S.undo = []; S.redo = []; S.sel = null; S.editing = null; S.mode = 'select'; S.modeArg = null;
  S.tool = null; S.organize = false; S.orgSel.clear(); S.search = null; S.cur = 0; S.fit = 'width';
  show('doc');
  fitWidth(true);
  rebuildDoc();
  $('#stage').scrollTop = 0;
}
async function closeDoc() {
  if (!S.doc) return;
  if (S.doc.dirty) {
    const ok = await confirmBox('Belgeyi kapat', `“${S.doc.name}” belgesindeki kaydedilmemiş değişiklikler kaybolacak.`, 'Kaydetmeden kapat', true);
    if (!ok) return;
  }
  for (const s of S.doc.sources.values()) { try { s.pdf.destroy(); } catch (e) { /* ignore */ } }
  S.doc = null; mainCache.clear(); thumbCache.clear();
  show('home');
}
function markDirty() { if (S.doc) { S.doc.dirty = true; renderTabs(); } }

/* ---------- undo / redo ---------- */
const stateJSON = () => JSON.stringify({ pages: S.doc.pages, settings: S.doc.settings, props: S.doc.props });
function snapshot() { if (!S.doc) return; S.undo.push(stateJSON()); if (S.undo.length > 120) S.undo.shift(); S.redo.length = 0; renderToolbar(); }
function restoreState(json) {
  const o = JSON.parse(json);
  S.doc.pages = o.pages; S.doc.settings = o.settings; S.doc.props = o.props;
  S.sel = null; S.editing = null;
  const ids = new Set(S.doc.pages.map(p => p.id));
  S.orgSel = new Set([...S.orgSel].filter(id => ids.has(id)));
  markDirty(); rebuildDoc();
}
function undo() { if (!S.doc || !S.undo.length) return; commitEditing(); S.redo.push(stateJSON()); restoreState(S.undo.pop()); }
function redo() { if (!S.doc || !S.redo.length) return; commitEditing(); S.undo.push(stateJSON()); restoreState(S.redo.pop()); }

/* ---------- toolbar and views ---------- */
function show(view) {
  S.view = view;
  for (const v of ['home', 'tools', 'doc']) $('#view-' + v).classList.toggle('on', v === view);
  renderTabs();
  if (view === 'home') renderHome();
  if (view === 'tools') renderTools();
}
function renderTabs() {
  const t = $('#tabs'); t.replaceChildren();
  const tab = (id, label, icon) => h('button', { class: 'tab', role: 'tab', 'aria-selected': String(S.view === id), 'aria-label': label, title: label, onclick: () => show(id) }, I(icon, 17), h('span', { class: 'lbl' }, label));
  t.append(tab('home', 'Ana sayfa', 'house'), tab('tools', 'Araçlar', 'wrench'));
  if (S.doc) {
    const d = h('div', { class: 'tab doc', role: 'tab', 'aria-selected': String(S.view === 'doc'), tabindex: 0, title: S.doc.name,
      onclick: e => { if (!e.target.closest('.cls')) show('doc'); },
      onkeydown: e => { if (e.key === 'Enter') show('doc'); } },
      I('file-text', 16), S.doc.dirty ? h('span', { class: 'dot', title: 'Kaydedilmemiş değişiklikler' }) : null,
      h('span', { class: 'nm' }, S.doc.name),
      h('button', { class: 'cls', 'aria-label': 'Belgeyi kapat', title: 'Kapat', onclick: e => { e.stopPropagation(); closeDoc(); } }, I('x', 15)));
    t.append(d);
  }
}
function tileEl(tool, onclick) {
  return h('button', { class: `tile c-${tool.c}`, type: 'button', onclick },
    h('span', { class: 'cini' }, I(tool.icon, 22, 1.7)),
    h('span', { class: 't' }, tool.label),
    h('span', { class: 'd' }, tool.desc));
}
function launchTool(id) {
  const t = toolById(id);
  if (id === 'combine') return combineDialog('combine');
  if (id === 'create') return combineDialog('create');
  if (S.doc) { show('doc'); openTool(id); return; }
  pickFiles(ACCEPT_ALL, false).then(files => { if (files.length) openFiles(files, { tool: t.id }); });
}
function renderHome() {
  const v = $('#view-home'); v.replaceChildren();
  const drop = h('div', { class: 'drop', id: 'homeDrop' },
    h('div', { class: 'tilestack' },
      h('span', { class: 'cini c-cobalt' }, I('file-text', 22)),
      h('span', { class: 'cini c-plum' }, I('signature', 22)),
      h('span', { class: 'cini c-saffron' }, I('stamp', 22))),
    h('div', { class: 'big' }, 'PDF dosyanızı buraya bırakın'),
    h('div', { class: 'small' }, 'Birden çok dosya bırakırsanız tek belgede birleştirilir. Görseller PDF sayfasına dönüşür.'),
    h('button', { class: 'btn primary', type: 'button', style: { marginTop: '8px' }, onclick: () => pickFiles(ACCEPT_ALL).then(openFiles) }, I('folder-open', 17), 'Dosya seç'));
  const quick = ['edit', 'ocr', 'export', 'links', 'protect', 'fill'].map(toolById);
  v.append(h('div', { class: 'wrap' },
    h('div', { class: 'hero' },
      h('div', null,
        h('h1', null, 'PDF Werkstatt'),
        h('p', { class: 'lead' }, 'PDF metinlerini düzenleyin, taramaları okuyun, dosyaları dönüştürüp koruyun. Açık kaynak bileşenlerle yerel çalışma: dosyalarınız cihazınızda kalır.'),
        h('div', { class: 'acts' },
          h('button', { class: 'btn primary', type: 'button', onclick: () => pickFiles(ACCEPT_ALL).then(openFiles) }, I('folder-open', 18), 'PDF aç'),
          h('button', { class: 'btn', type: 'button', onclick: () => show('tools') }, I('wrench', 18), 'Tüm araçlar'),
          S.doc ? h('button', { class: 'btn', type: 'button', onclick: () => show('doc') }, I('file-text', 18), 'Açık belgeye dön') : null),
        h('div', { class: 'privacy' }, I('shield-check' in ICONS ? 'shield-check' : 'file-lock-2', 18),
          h('span', null, 'Dosyalarınız hiçbir sunucuya gönderilmez. Bütün işlemler bu sayfanın içinde, kendi cihazınızda yapılır.'))),
      drop),
    h('div', { class: 'section-h' }, h('h2', null, 'Sık kullanılanlar'),
      h('button', { class: 'link', type: 'button', onclick: () => show('tools') }, 'Tüm araçları göster')),
    h('div', { class: 'tiles' }, quick.map(t => tileEl(t, () => launchTool(t.id))))));
  wireDropZone(drop, files => openFiles(files));
}
function renderTools() {
  const v = $('#view-tools'); v.replaceChildren();
  const w = h('div', { class: 'wrap tools-page' },
    h('h1', null, 'Tüm araçlar'),
    h('p', { class: 'sub' }, S.doc ? `Araçlar açık belgeye uygulanır: ${S.doc.name}` : 'Bir araç seçin. Belge gerektiren araçlar önce dosya seçmenizi ister.'));
  for (const sec of TOOL_SECTIONS) {
    w.append(h('div', { class: 'section-h' }, h('h2', null, sec.title)),
      h('div', { class: 'tiles' }, sec.ids.map(id => tileEl(toolById(id), () => launchTool(id)))));
  }
  v.append(w);
}
function wireDropZone(zone, onFiles) {
  zone.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); zone.classList.add('over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); e.stopPropagation(); zone.classList.remove('over'); $('#dragcover').classList.remove('on');
    const files = Array.from(e.dataTransfer.files || []); if (files.length) onFiles(files);
  });
}
