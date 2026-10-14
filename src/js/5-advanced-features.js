
/* PDF Workshop: true text replacement, local OCR, encryption and links.
   MuPDF 1.26.4 (AGPL-3.0-or-later), Tesseract.js 7.0.0 (Apache-2.0).
   Engines are embedded; documents and passwords are not sent to a server. */
let mupdfPromise;
const assetBytes = name => b64ToBytes(ASSET_DATA[name]);
const assetText = name => new TextDecoder().decode(assetBytes(name));
const scriptUrl = code => URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
async function getMuPDF() {
  if (!mupdfPromise) mupdfPromise = (async () => {
    const glue = scriptUrl(assetText('mupdf/mupdf-wasm.js'));
    const module = scriptUrl(assetText('mupdf/mupdf.js').replace('"./mupdf-wasm.js"', JSON.stringify(glue)));
    globalThis.$libmupdf_wasm_Module = { wasmBinary: assetBytes('mupdf/mupdf-wasm.wasm'), locateFile: name => name };
    try { return await import(module); }
    finally { delete globalThis.$libmupdf_wasm_Module; URL.revokeObjectURL(glue); URL.revokeObjectURL(module); }
  })().catch(e => { mupdfPromise = null; throw new UserErr(tr('PDF motoru başlatılamadı. Güncel Chrome, Edge veya Firefox ile deneyin.') + ' ' + e.message); });
  return mupdfPromise;
}
async function muSave(bytes, options, fn) {
  const mu = await getMuPDF(), doc = mu.Document.openDocument(bytes, 'application/pdf');
  let buffer;
  try {
    if (fn) await fn(doc, mu);
    buffer = doc.saveToBuffer(options);
    return buffer.asUint8Array().slice();
  } finally { buffer?.destroy(); doc.destroy(); }
}
async function decryptSource(src) {
  if (src.clearBytes) return src.clearBytes;
  src.clearBytes = await muSave(src.bytes, 'decrypt,garbage=4,compress', doc => {
    if (doc.needsPassword() && !doc.authenticatePassword(src.password || '')) throw new UserErr(tr('PDF parolası doğrulanamadı.'));
  });
  return src.clearBytes;
}
async function copyErasedPage(out, page, sourceDoc) {
  const temp = await PL.PDFDocument.create(), [copied] = await temp.copyPages(sourceDoc, [page.index]);
  temp.addPage(copied);
  const bytes = await muSave(await temp.save(), 'garbage=4,compress', (doc, mu) => {
    const mp = doc.loadPage(0);
    try {
      // PDF.js and MuPDF share view coordinates: rotated CropBox, top-left origin.
      for (const imagePass of [false, true]) {
        const edits = page.items.filter(it => it.native && !!it.native.scan === imagePass);
        if (!edits.length) continue;
        for (const it of edits) {
          const b = it.native.box, a = mp.createAnnotation('Redact');
          const lineArt = it.native.fontInfo?.underline ? mu.PDFPage.REDACT_LINE_ART_REMOVE_IF_COVERED : mu.PDFPage.REDACT_LINE_ART_NONE;
          try { a.setRect([b.x, b.y, b.x + b.w, b.y + b.h]); a.applyRedaction(0, imagePass ? 2 : 0, lineArt, 0); }
          finally { a.destroy(); }
        }
      }
    } finally { mp.destroy(); }
  });
  const erased = await PL.PDFDocument.load(bytes, { updateMetadata: false });
  return (await out.copyPages(erased, [0]))[0];
}

TOOLS.splice(4, 0,
  { id: 'ocr', label: 'OCR · Metin tanıma', icon: 'scan-text', c: 'cobalt', desc: 'Taranmış sayfaları okuyun; aranabilir metin ekleyin.' },
  { id: 'links', label: 'Bağlantılar', icon: 'link', c: 'cobalt', desc: 'PDF bağlantılarını okuyun, ekleyin ve kaldırın.' });
TOOLS.push({ id: 'protect', label: 'PDF’yi koru', icon: 'file-lock-2', c: 'coral', desc: 'PDF’yi AES-256 ile şifreleyin; izinleri seçin.' });
toolById('edit').desc = 'Mevcut metni seçip değiştirin; metin ve resim ekleyin.';
toolById('export').desc = 'DOCX, TXT, JPEG, PNG veya XLSX olarak kaydedin.';
TOOL_SECTIONS[0].ids.splice(4, 0, 'ocr', 'links');
TOOL_SECTIONS[3].ids.unshift('protect');
MODE_HINT.native = 'Değiştirmek istediğiniz mevcut metne tıklayın. Taramalar için önce OCR çalıştırın.';
MODE_HINT.link = 'Bağlantı alanını sayfa üzerinde sürükleyerek seçin.';
BOX_MODES.add('link');
TYPE_NAMES.link = 'Bağlantı';

const baseSetMode = setMode;
setMode = function(mode, arg) {
  baseSetMode(mode, arg);
  if (S.doc) for (const p of S.doc.pages) renderExtraLayers(p);
};
const baseOpenTool = openTool;
openTool = function(id) { baseOpenTool(id); if (S.doc) for (const p of S.doc.pages) renderExtraLayers(p); };
const basePaintSlot = paintSlot;
paintSlot = async function(slot) { await basePaintSlot(slot); const p = pageById(slot.dataset.id); if (p) renderExtraLayers(p); };
const baseRenderItems = renderItems;
renderItems = function(page, slot) {
  baseRenderItems(page, slot);
  slot = slot || slotEl(page.id); if (!slot) return;
  const ov = slot.querySelector('.ov');
  // The preview mask is UI-only. PDF output removes the original text.
  for (const it of [...page.items].reverse()) if (it.native) {
    const b = it.native.box, z = S.zoom;
    ov.prepend(h('div', { class: 'native-mask', style: { left: `${b.x * z}px`, top: `${b.y * z}px`, width: `${b.w * z}px`, height: `${b.h * z}px`, background: it.native.previewBg || '#fff' } }));
  }
  renderExtraLayers(page, slot);
};
const baseItemNode = itemNode;
itemNode = function(page, it, z) {
  const node = baseItemNode(page, it, z);
  if (it.type === 'link') {
    node.classList.add('it-link'); node.style.border = `${Math.max(1, z)}px dashed #1F4E9E`;
    node.title = it.url || tr('Yeni bağlantı');
    if (!it.url) queueMicrotask(() => { if (!it._asking && page.items.includes(it)) { it._asking = true; guard(() => editLink(page, it)); } });
  }
  if (it.bold) node.style.fontWeight = '600';
  if (it.angle) { node.style.transform = `rotate(${it.angle}deg)`; node.style.transformOrigin = '0 0'; }
  return node;
};
const baseSelBox = selBox;
selBox = function() {
  const box = baseSelBox();
  if (!box || !S.sel) return box;
  const p = pageById(S.sel.pageId), it = itemOf(p, S.sel.itemId);
  if (it?.type === 'text') {
    const bold = h('input', { type: 'checkbox' }); bold.checked = !!it.bold;
    bold.onchange = () => { snapshot(); it.bold = bold.checked; markDirty(); renderItems(p); };
    box.append(h('label', { class: 'check' }, bold, tr('Kalın')));
    if (it.native) box.append(h('button', { class: 'btn sm', onclick: () => { snapshot(); p.items = p.items.filter(x => x !== it); S.sel = null; markDirty(); renderItems(p); renderPane(); } }, tr('Orijinal metne dön')));
  }
  if (it?.type === 'link') box.append(h('p', { class: 'hint', noI18n: true }, it.url || ''),
    h('button', { class: 'btn sm', onclick: () => guard(() => editLink(p, it)) }, tr('Bağlantıyı düzenle')),
    h('button', { class: 'btn sm', onclick: () => openSafeLink(it.url) }, tr('Bağlantıyı aç')));
  return box;
};
const baseDeleteItem = deleteItem;
deleteItem = function(page, id) {
  const it = itemOf(page, id);
  if (it?.native) { snapshot(); it.text = ''; markDirty(); S.sel = null; renderItems(page); renderPane(); return; }
  baseDeleteItem(page, id);
};
const baseCommitEditing = commitEditing;
commitEditing = function() {
  if (editState?.it.native && !editState.ta.value.trim()) {
    const { page, it, ta } = editState; editState = null; S.editing = null;
    snapshot(); it.text = ''; ta.remove(); markDirty(); renderItems(page); renderPane(); return;
  }
  baseCommitEditing();
};
const baseDown = onPagesDown;
onPagesDown = function(ev) {
  if (ev.target.closest('.native-target, .pdf-link-target')) return;
  if (S.mode === 'native' && !ev.target.closest('.item, .ta')) return;
  baseDown(ev);
};

async function nativeCandidates(page) {
  const result = [];
  for (const [i, item] of (await textItems(page)).entries()) {
    if (!item.str?.trim()) continue;
    const key = `pdf:${i}`;
    if (page.items.some(it => it.native?.key === key)) continue;
    const box = await hitBox(page, item, 0, item.str.length);
    const source = S.doc.sources.get(page.srcId), pdfPage = await source.pdf.getPage(page.index + 1);
    const matrix = pdfjs.Util.transform(pdfPage.getViewport({ scale: 1, rotation: page.baseRot }).transform, item.transform);
    const angle = Math.atan2(matrix[1], matrix[0]) * 180 / Math.PI;
    const size = Math.hypot(item.transform[2], item.transform[3]) || item.height || 12;
    result.push({ key, text: item.str, box, size, textWidth: item.width, scan: false, angle, baseline: { x: matrix[4], y: matrix[5] } });
  }
  for (const [i, line] of (page.ocr?.lines || []).entries()) {
    if (!line.addLayer || page.items.some(it => it.native?.key === `ocr:${i}`)) continue;
    result.push({ key: `ocr:${i}`, text: line.text, box: line.box, size: line.box.h * 0.85, scan: true });
  }
  return result;
}
async function renderExtraLayers(page, slot) {
  slot = slot || slotEl(page.id); if (!slot?.isConnected) return;
  const inner = slot.querySelector('.inner');
  let layer = inner.querySelector('.native-layer');
  if (!layer) { layer = h('div', { class: 'native-layer' }); inner.append(layer); }
  const token = (slot._extraToken || 0) + 1; slot._extraToken = token;
  layer.replaceChildren();
  if (S.mode === 'native' || S.mode === 'fontinspect') {
    const targets = await nativeCandidates(page);
    if (!slot.isConnected || slot._extraToken !== token || !['native', 'fontinspect'].includes(S.mode)) return;
    const z = S.zoom;
    for (const c of targets) layer.append(h('button', { class: 'native-target', type: 'button', title: c.text, noI18n: true,
      'aria-label': tr('Metni düzenle') + ': ' + c.text, style: { left: `${c.box.x*z}px`, top: `${c.box.y*z}px`, width: `${Math.max(c.box.w, 3)*z}px`, height: `${Math.max(c.box.h, 3)*z}px` },
      onpointerdown: e => { e.preventDefault(); e.stopPropagation(); }, onclick: () => guard(() => S.mode === 'fontinspect' ? inspectFontDialog(page, c) : editNativeText(page, c)) }));
  } else if (S.tool === 'links') {
    const links = await pageLinks(page);
    if (!slot.isConnected || slot._extraToken !== token || S.tool !== 'links') return;
    const z = S.zoom;
    for (const link of links) if (!link.added && !(page.removedLinks || []).includes(link.annotIndex)) layer.append(h('button', {
      class: 'pdf-link-target', type: 'button', title: link.url || tr('Sayfa') + ' ' + (link.destIndex + 1),
      style: { left: `${link.box.x*z}px`, top: `${link.box.y*z}px`, width: `${Math.max(link.box.w,4)*z}px`, height: `${Math.max(link.box.h,4)*z}px` },
      onpointerdown: e => { e.preventDefault(); e.stopPropagation(); }, onclick: () => activateLink(link) }, I('link',12)));
  }
}
function supportedText(value) {
  const font = FK.create(FONT.reg);
  const missing = [...new Set([...value].filter(c => !/\s/.test(c) && !font.hasGlyphForCodePoint(c.codePointAt(0))))];
  if (missing.length) throw new UserErr(tr('Yazı tipinde bulunmayan karakterler:') + ' ' + missing.join(' '));
}
async function editNativeText(page, candidate) {
  const input = h('textarea', { class: 'inp', rows: '4', 'aria-label': tr('Yeni metin') }); input.value = candidate.text;
  const size = h('input', { class: 'inp', type: 'number', min: '4', max: '200', step: '0.5', value: String(r2(candidate.size)) });
  const color = h('input', { type: 'color', value: S.pref.textColor, 'aria-label': tr('Renk') });
  const bold = h('input', { type: 'checkbox' });
  const body = h('div', null, h('p', { class: 'hint' }, tr('Eski metin PDF’den kaldırılır; yerine yeni metin yazılır. Yazı tipi Inter olarak yenilenir. Satır akışı otomatik yeniden kurulmaz.')),
    h('div', { class: 'field' }, tr('Yeni metin'), input), h('div', { class: 'field' }, tr('Yazı boyutu'), size),
    h('div', { class: 'field' }, tr('Renk'), color), h('label', { class: 'check' }, bold, tr('Kalın')));
  const result = await dialog(tr('Mevcut metni düzenle'), body, [
    { label: tr('Vazgeç'), value: null },
    { label: tr('Metni sil'), kind: 'danger', onClick: close => close({ text: '', size: candidate.size }) },
    { label: tr('Uygula'), kind: 'primary', onClick: close => {
      const fs = +size.value;
      if (!Number.isFinite(fs) || fs < 4 || fs > 200) { toast(tr('Yazı boyutu 4–200 arasında olmalıdır.'), 'err'); return false; }
      try { supportedText(input.value); } catch (e) { toast(e.message,'err'); return false; }
      close({ text: input.value, size: fs });
    } } ], { onOpen: () => { input.focus(); input.select(); } });
  if (!result || !pageById(page.id)) return;
  snapshot();
  const a = (candidate.angle || 0) * Math.PI / 180, baseline = candidate.baseline || { x: candidate.box.x, y: candidate.box.y + candidate.box.h * .88 };
  const metric = (M.asc + (M.lh - M.asc - M.desc) / 2) * result.size;
  const it = { id: uid(), type: 'text', text: result.text, size: result.size, color: color.value, bold: bold.checked, angle: candidate.angle || 0,
    x: baseline.x + Math.sin(a) * metric, y: baseline.y - Math.cos(a) * metric, w: candidate.box.w, h: candidate.box.h,
    native: { key: candidate.key, box: { ...candidate.box }, scan: candidate.scan } };
  fitText(it); page.items.push(it); markDirty(); renderItems(page); select(page,it); renderPane();
}

const originalEditPane = PANES.edit;
PANES.edit = function() {
  const box = originalEditPane();
  const hints = box.querySelectorAll('.hint'); if (hints[0]) hints[0].remove();
  box.prepend(h('button', { class: 'btn primary wide', onclick: () => setMode(S.mode === 'native' ? 'select' : 'native') }, I('file-pen-line',18), tr('Mevcut metni düzenle')),
    h('p', { class: 'hint' }, tr('Yazıyı seçip değiştirin. Taranmış sayfalarda önce OCR çalıştırın.')));
  return box;
};

let ocrWorker = null, ocrLanguage = '', ocrURLs = [], ocrCancel = false, ocrRunning = false;
async function getOcrWorker(language) {
  if (ocrWorker && ocrLanguage === language) return ocrWorker;
  if (ocrWorker) await ocrWorker.terminate(); ocrWorker = null;
  for (const u of ocrURLs) URL.revokeObjectURL(u); ocrURLs = [];
  // Embedding in the same worker avoids cross-blob imports for file:// and offline use.
  const initLanguages = "self.addEventListener('message', event => { const job = event.data; if (job?.action === 'initialize' && Array.isArray(job.payload?.langs)) job.payload.langs = job.payload.langs.map(l => typeof l === 'string' ? l : l.code); });\n";
  const workerURL = scriptUrl(initLanguages + assetText('ocr/tesseract-core-lstm.wasm.js') + '\n' + assetText('ocr/worker.min.js'));
  ocrURLs.push(workerURL);
  const languages = language.split('+').map(code => ({ code, data: assetBytes(`ocr/${code}.traineddata.gz`) }));
  ocrWorker = await window.Tesseract.createWorker(languages, 1, {
    workerPath: workerURL, workerBlobURL: false, corePath: 'embedded-core.js', cacheMethod: 'none',
    logger: m => { if (m.status === 'recognizing text') setBusyMsg(tr('Metin tanınıyor…') + ` ${Math.round((m.progress || 0)*100)}%`); }
  });
  ocrLanguage = language; return ocrWorker;
}
function overlap(a,b) {
  const w = Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
  const hh = Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  return w*hh / Math.max(1,a.w*a.h);
}
async function runOCR(pages, language = 'eng', skipText = true) {
  if (!pages.length || ocrRunning) return;
  commitEditing(); ocrRunning = true; ocrCancel = false;
  const doc = S.doc; let complete = 0, skipped = 0, changed = false;
  const cancel = h('button', { class: 'btn sm', id: 'ocrCancelBtn', onclick: () => { ocrCancel = true; cancel.disabled = true; cancel.textContent = tr('Durduruluyor…'); } }, tr('Durdur'));
  $('#busy .b').append(cancel);
  try {
    await busy(tr('OCR hazırlanıyor…'), async () => {
      const worker = await getOcrWorker(language);
      await worker.setParameters({ tessedit_pageseg_mode: '3', preserve_interword_spaces: '1', user_defined_dpi: '200' });
      for (const [index,page] of pages.entries()) {
        if (ocrCancel || S.doc !== doc) break;
        const existing = await textItems(page);
        if (skipText && existing.some(i => i.str?.trim())) { skipped++; continue; }
        setBusyMsg(tr('OCR sayfası') + ` ${index+1}/${pages.length}`);
        const bytes = await buildPdf([page]);
        const pdf = await pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise;
        let c;
        try {
          const p = await pdf.getPage(1), bs = baseSize(page);
          const rotation = page.items.some(i=>i.type==='redact') ? 0 : page.baseRot;
          const vp0 = p.getViewport({ scale: 1, rotation });
          const scale = Math.min(200/72, Math.sqrt(16e6 / (vp0.width*vp0.height)));
          const vp = p.getViewport({ scale, rotation });
          c = h('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
          const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,c.width,c.height);
          await p.render({ canvasContext: ctx, viewport: vp }).promise;
          const { data } = await worker.recognize(c, {}, { text: true, blocks: true });
          const lines = (data.blocks || []).flatMap(b => (b.paragraphs || []).flatMap(p => p.lines || []));
          if (!lines.length && data.text?.trim()) throw new UserErr(tr('OCR metin konumlarını döndürmedi. Yeniden deneyin.'));
          const boxes = [];
          for (const it of existing) boxes.push(await hitBox(page,it,0,it.str.length));
          const editedBoxes = page.items.filter(it=>it.type==='text').map(it=>({x:it.x,y:it.y,w:it.w,h:it.h}));
          const out = lines.filter(l=>l.text?.trim() || l.words?.length).map(l => {
            const box = { x:l.bbox.x0/c.width*bs.w, y:l.bbox.y0/c.height*bs.h,
              w:(l.bbox.x1-l.bbox.x0)/c.width*bs.w, h:(l.bbox.y1-l.bbox.y0)/c.height*bs.h };
            const text = (l.text || l.words.map(w=>w.text).join(' ')).trim();
            return { text, box, confidence:l.confidence ?? data.confidence, addLayer: !boxes.concat(editedBoxes).some(b=>overlap(box,b)>.15) };
          });
          if (!changed) { snapshot(); changed = true; }
          await addOcrFontEstimates(out, c, bs);
          page.ocr = { lines: out, text: data.text || '', confidence: data.confidence, language, at: Date.now() };
          markDirty(); renderExtraLayers(page); complete++;
        } finally { if (c) c.width=c.height=0; await pdf.destroy(); }
      }
    });
    toast(tr('OCR tamamlandı.') + ` ${complete} / ${pages.length}` + (skipped ? ' · ' + skipped + ' ' + tr('metinli sayfa atlandı.') : ''));
    return { document: doc, completed: complete, skipped, cancelled: ocrCancel };
  } finally { ocrRunning = false; cancel.remove(); renderPane(); }
}
function drawOcrLayer(pg, page, height, fonts) {
  if (!fonts.reg) return;
  for (const [i,line] of (page.ocr?.lines || []).entries()) {
    if (!line.addLayer || !line.text || page.items.some(it=>it.native?.key===`ocr:${i}`)) continue;
    if (page.items.some(it=>it.type==='redact' && overlap(line.box,it)>0)) continue;
    // Searchable layer: retain the visible scan and embed invisible text.
    const box=line.box, size=Math.max(1,box.h*.82), width=fonts.reg.widthOfTextAtSize(line.text,size);
    pg.pushOperators(PL.pushGraphicsState(), PL.setTextRenderingMode(PL.TextRenderingMode.Invisible), PL.setCharacterSpacing(0), PL.setWordSpacing(0), PL.setCharacterSqueeze(width ? Math.min(500,box.w/width*100) : 100));
    pg.drawText(line.text,{x:box.x,y:height-box.y-box.h*.88,size,font:fonts.reg});
    pg.pushOperators(PL.popGraphicsState());
  }
}
PANES.ocr = function() {
  const language=h('select',{class:'inp','aria-label':tr('OCR dili')},
    [['tur+eng+deu','Türkçe + English + Deutsch'],['tur','Türkçe'],['eng','English'],['deu','Deutsch']].map(([v,l])=>h('option',{value:v},l)));
  const scope=h('select',{class:'inp'},[['all','Tüm sayfalar'],['current','Geçerli sayfa'],['selected','Seçili sayfalar']].map(([v,l])=>h('option',{value:v},tr(l))));
  const skip=h('input',{type:'checkbox'});skip.checked=true;
  const p=S.doc.pages[S.cur], data=p?.ocr;
  const output=h('textarea',{class:'inp',rows:'7',readonly:true,'aria-label':tr('OCR sonucu')});output.value=data?.lines?.map((line,i)=>p.items.find(it=>it.native?.key===`ocr:${i}`)?.text??line.text).join('\n')||'';
  return h('div',null,h('p',{class:'hint'},tr('OCR cihazınızda çalışır. İnternet gerekmez. Sonuçları kontrol edin; özellikle tablolar ve düşük kaliteli taramalarda hata olabilir.')),
    h('div',{class:'field'},tr('OCR dili'),language),h('div',{class:'field'},tr('Sayfalar'),scope),
    h('label',{class:'check'},skip,tr('Metin katmanı olan sayfaları atla')),
    h('button',{class:'btn primary wide',disabled:ocrRunning,onclick:()=>guard(async()=>{
      const pages=scope.value==='current'?[S.doc.pages[S.cur]]:scope.value==='selected'?selectedPages():S.doc.pages;
      if(!pages.length)throw new UserErr(tr('Önce sayfaları düzenle aracında sayfa seçin.'));
      await runOCR(pages,language.value,skip.checked);
    })},I('scan-text',18),tr('OCR çalıştır')),
    data?h('div',null,h('h4',null,tr('Geçerli sayfanın sonucu')),h('p',{class:'stat'},tr('Güven oranı')+`: ${Math.round(data.confidence||0)}%`),output,
      h('button',{class:'btn wide',onclick:()=>{openTool('edit');setMode('native');}},tr('Tanınan metni düzenle'))):null,
    h('p',{class:'hint'},tr('Kaydedilen PDF aranabilir olur. OCR metni DOCX, TXT ve XLSX çıktısına da eklenir.')));
};

// Passwords are used only for this call and are not written to history or local storage.
async function protectBytes(bytes, userPassword, ownerPassword, permissions) {
  if (!userPassword) throw new UserErr(tr('Açılış parolası girin.'));
  // Safe character set for MuPDF 1.26 option strings. Never silently alter a password.
  if (/[,\u0000-\u001f]/.test(userPassword+ownerPassword)) throw new UserErr(tr('Parolada virgül veya kontrol karakteri kullanmayın.'));
  const owner=ownerPassword||Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,'0')).join('');
  return muSave(bytes,`garbage=4,compress,encrypt=aes-256,user-password=${userPassword},owner-password=${owner},permissions=${permissions}`);
}
PANES.protect = function() {
  const pass=h('input',{class:'inp',type:'password',autocomplete:'new-password','aria-label':tr('Açılış parolası')});
  const confirm=h('input',{class:'inp',type:'password',autocomplete:'new-password','aria-label':tr('Parolayı tekrar girin')});
  const owner=h('input',{class:'inp',type:'password',autocomplete:'new-password',placeholder:tr('İsteğe bağlı')});
  const print=h('input',{type:'checkbox'}), copy=h('input',{type:'checkbox'}), edit=h('input',{type:'checkbox'});
  print.checked=true;copy.checked=false;edit.checked=false;
  return h('div',null,h('p',{class:'hint'},tr('PDF, açılış parolasıyla AES-256 olarak şifrelenir. Parolayı güvenli bir yerde saklayın.')),
    h('div',{class:'field'},tr('Açılış parolası'),pass),h('div',{class:'field'},tr('Parolayı tekrar girin'),confirm),
    h('div',{class:'field'},tr('Sahip parolası'),owner),h('p',{class:'hint'},tr('Sahip parolası boşsa rastgele oluşturulur. İzinler okuyucunun desteğine bağlıdır; açılış parolası şifreleme sağlar.')),
    h('h4',null,tr('İzinler')),h('label',{class:'check'},print,tr('Yazdırmaya izin ver')),h('label',{class:'check'},copy,tr('Metin kopyalamaya izin ver')),h('label',{class:'check'},edit,tr('Düzenlemeye izin ver')),
    h('button',{class:'btn primary wide',onclick:()=>guard(async()=>{
      if(!pass.value)throw new UserErr(tr('Açılış parolası girin.'));
      if(pass.value!==confirm.value)throw new UserErr(tr('Parolalar eşleşmiyor.'));
      if(owner.value&&owner.value===pass.value)throw new UserErr(tr('Sahip parolası açılış parolasından farklı olmalıdır.'));
      const perms=0xfffff0c0|512|(print.checked?(4|2048):0)|(copy.checked?16:0)|(edit.checked?(8|32|256|1024):0);
      const bytes=await busy(tr('PDF şifreleniyor…'),async()=>protectBytes(await buildPdf(),pass.value,owner.value,perms|0));
      await saveFile(baseName(S.doc.name)+'-protected.pdf',bytes);pass.value='';confirm.value='';owner.value='';
    })},I('file-lock-2',18),tr('Korumalı PDF indir')));
};

function safeURL(value, pdfOnly=false) {
  value=String(value||'').trim();
  if (/^[\w.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(value))value='https://'+value;
  let url;try{url=new URL(value);}catch{throw new UserErr(tr('Geçerli bir bağlantı girin.'));}
  if(!(pdfOnly?['https:','http:']:['https:','http:','mailto:','tel:']).includes(url.protocol))throw new UserErr(tr('Yalnızca http, https, mailto ve tel bağlantıları desteklenir.'));
  return url.href;
}
function openSafeLink(value) { try { const url=safeURL(value);window.open(url,'_blank','noopener,noreferrer'); }catch(e){showError(e);} }
function activateLink(link) {
  if(link.url)return openSafeLink(link.url);
  if(link.destIndex!=null){const i=S.doc.pages.findIndex(p=>p.srcId===link.srcId&&p.index===link.destIndex);if(i>=0)goPage(i);else toast(tr('Hedef sayfa belgede bulunamadı.'),'err');}
}
async function pageLinks(page) {
  const result=[],src=page.srcId&&S.doc.sources.get(page.srcId);
  if(src){
    const p=await src.pdf.getPage(page.index+1),vp=p.getViewport({scale:1,rotation:page.baseRot});
    const annots=await p.getAnnotations({intent:'display'});
    for(const [index,a] of annots.entries()){
      if(a.subtype!=='Link')continue;
      let destIndex;
      if(a.dest){try{const dest=typeof a.dest==='string'?await src.pdf.getDestination(a.dest):a.dest;
        if(dest?.[0]!=null)destIndex=typeof dest[0]==='number'?dest[0]:await src.pdf.getPageIndex(dest[0]);}catch{}}
      const rect=vp.convertToViewportRectangle(a.rect);
      result.push({annotIndex:index,id:a.id,url:a.url||a.unsafeUrl||'',destIndex,srcId:page.srcId,
        box:{x:Math.min(rect[0],rect[2]),y:Math.min(rect[1],rect[3]),w:Math.abs(rect[2]-rect[0]),h:Math.abs(rect[3]-rect[1])}});
    }
  }
  for(const it of page.items)if(it.type==='link')result.push({added:true,item:it,url:it.url||'',box:it});
  return result;
}
async function editLink(page,it) {
  const input=h('input',{class:'inp',type:'url',placeholder:'https://example.com','aria-label':tr('Bağlantı adresi')});input.value=it.url||'';
  const value=await dialog(tr('Bağlantıyı düzenle'),h('div',null,h('p',{class:'hint'},tr('Seçili alan tıklanabilir bağlantı olarak PDF’ye eklenir.')),input),[
    {label:tr('Vazgeç'),value:null},{label:tr('Uygula'),kind:'primary',onClick:close=>{try{close(safeURL(input.value));}catch(e){toast(e.message,'err');return false;}}}],{onOpen:()=>input.focus()});
  delete it._asking;
  if(value){snapshot();it.url=value;markDirty();renderItems(page);renderPane();}
  else if(!it.url){page.items=page.items.filter(x=>x!==it);renderItems(page);}
}
async function writeLinks(out,pages) {
  const outPages=out.getPages(),name=PL.PDFName.of;
  for(const [index,page] of pages.entries()){
    const pg=outPages[index],annots=pg.node.Annots(),links=await pageLinks(page);
    // Link IDs use nR in PDF.js and n 0 R in pdf-lib. Preserve the copy order.
    if(annots){
      for(const link of links.filter(l=>!l.added).reverse()){
        const idx=link.annotIndex;if(idx>=annots.size())continue;
        const a=out.context.lookup(annots.get(idx));if(!(a instanceof PL.PDFDict)||a.get(name('Subtype'))?.toString()!=='/Link')continue;
        if((page.removedLinks||[]).includes(idx)){annots.remove(idx);continue;}
        if(link.destIndex!=null){
          const target=pages.findIndex(p=>p.srcId===page.srcId&&p.index===link.destIndex);
          if(target>=0){a.delete(name('A'));a.set(name('Dest'),out.context.obj([outPages[target].ref,name('Fit')]));}
          else annots.remove(idx);
        }
      }
    }
    for(const it of page.items.filter(it=>it.type==='link'&&it.url)){
      const vb=vbox(page),bs=baseSize(page),m=cmFor(page.baseRot,vb.x0,vb.y0,vb.W,vb.H);
      const points=[[it.x,bs.h-it.y-it.h],[it.x+it.w,bs.h-it.y]].map(([x,y])=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]);
      const rect=[Math.min(points[0][0],points[1][0]),Math.min(points[0][1],points[1][1]),Math.max(points[0][0],points[1][0]),Math.max(points[0][1],points[1][1])];
      const a=out.context.obj({Type:'Annot',Subtype:'Link',Rect:rect,Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PL.PDFString.of(safeURL(it.url))}});
      pg.node.addAnnot(out.context.register(a));
    }
  }
}
PANES.links=function(){
  const list=h('div',{class:'link-list'}),p=S.doc.pages[S.cur];
  pageLinks(p).then(links=>{
    if(!list.isConnected)return;
    const active=links.filter(l=>l.added||!(p.removedLinks||[]).includes(l.annotIndex));
    if(!active.length)list.append(h('p',{class:'hint'},tr('Bu sayfada PDF bağlantısı yok.')));
    for(const l of active)list.append(h('div',{class:'link-card'},
      h('div',{class:'hint',noI18n:true},l.url||tr('Sayfa')+' '+(l.destIndex==null?'?':l.destIndex+1)),
      h('div',{class:'acts'},h('button',{class:'btn sm',onclick:()=>activateLink(l)},tr('Aç')),
        l.added?h('button',{class:'btn sm',onclick:()=>guard(()=>editLink(p,l.item))},tr('Düzenle')):null,
        h('button',{class:'btn sm danger',onclick:()=>{snapshot();if(l.added)p.items=p.items.filter(i=>i!==l.item);else{p.removedLinks=p.removedLinks||[];p.removedLinks.push(l.annotIndex);}markDirty();renderItems(p);renderPane();}},tr('Kaldır')))));
  }).catch(showError);
  return h('div',null,modeBtn('link','link',tr('Bağlantı ekle')),h('p',{class:'hint'},tr('Önce bağlantı alanını çizip adresi girin. Mevcut bağlantılar aşağıda listelenir.')),
    h('h4',null,tr('Geçerli sayfanın bağlantıları')),list,
    h('button',{class:'btn wide',onclick:()=>guard(openUrlDialog)},I('folder-open',16),tr('URL’den PDF aç')),
    h('p',{class:'hint'},tr('URL bağlantısı yeni sekmede açılır. PDF’yi indirip dosya seçerek programa aktarın.')));
};
async function openUrlDialog(){ return openUrlInTabFlow(); }
