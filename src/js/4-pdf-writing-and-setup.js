
/* =========================================================================
   PDF generation (pdf-lib)
   ========================================================================= */
function cmFor(R, x0, y0, W, H) {
  switch (R) {
    case 90: return [0, 1, -1, 0, x0 + W, y0];
    case 180: return [-1, 0, 0, -1, x0 + W, y0 + H];
    case 270: return [0, -1, 1, 0, x0, y0 + H];
    default: return [1, 0, 0, 1, x0, y0];
  }
}
function withCm(pg, m, fn) {
  pg.pushOperators(PL.pushGraphicsState(), PL.concatTransformationMatrix(...m));
  try { fn(); } finally { pg.pushOperators(PL.popGraphicsState()); }
}
const isEncErr = e => /encrypt/i.test((e && (e.name + ' ' + e.message)) || '');
function applyFieldValue(f, v) {
  if (f instanceof PL.PDFTextField) { const s = String(v == null ? '' : v); const ml = f.getMaxLength(); f.setText(ml ? s.slice(0, ml) : s); }
  else if (f instanceof PL.PDFCheckBox) { v ? f.check() : f.uncheck(); }
  else if (f instanceof PL.PDFRadioGroup) {
    if (v == null || v === '') return;
    const opts = f.getOptions(), sv = String(v);
    if (opts.includes(sv)) f.select(sv);
    else if (/^\d+$/.test(sv) && opts[+sv] != null) f.select(opts[+sv]);
  }
  else if (f instanceof PL.PDFDropdown || f instanceof PL.PDFOptionList) {
    if (v == null || v === '') { f.clear(); return; }
    try { f.select(String(v)); } catch (e) { /* value not present in the list */ }
  }
}
async function prepSources(ids) {
  const map = new Map();
  for (const id of ids) {
    const src = S.doc.sources.get(id);
    let d;
    try { d = await PL.PDFDocument.load(src.protected ? await decryptSource(src) : src.bytes, { updateMetadata: false }); }
    catch (e) {
      if (isEncErr(e) || src.protected) throw new UserErr(`“${src.name}” şifreli bir PDF. Şifreli dosyalar görüntülenebilir ama değişiklikleri kaydedilemez. Dosyanın şifresiz bir kopyasıyla deneyin.`);
      throw new UserErr(`“${src.name}” kaydedilmek üzere işlenemedi: ${e.message}`);
    }
    const vals = S.doc.formValues[id] || {};
    const touched = Object.keys(vals).length > 0;
    let hasFields = false;
    try { hasFields = d.getForm().getFields().length > 0; } catch (e) { /* no form */ }
    if (hasFields && (touched || S.doc.flatten)) {
      d.registerFontkit(FK);
      const form = d.getForm();
      for (const [name, v] of Object.entries(vals)) {
        try { applyFieldValue(form.getField(name), v); } catch (e) { console.warn('alan', name, e); }
      }
      try { const font = await d.embedFont(FONT.reg, { subset: true }); form.updateFieldAppearances(font); } catch (e) { console.warn('görünüm', e); }
      if (S.doc.flatten) { try { form.flatten({ updateFieldAppearances: false }); pruneDanglingAnnots(d); } catch (e) { console.warn('düzleştirme', e); } }
      d = await PL.PDFDocument.load(await d.save(), { updateMetadata: false });
    }
    map.set(id, d);
  }
  return map;
}
function pruneDanglingAnnots(doc) {
  for (const pg of doc.getPages()) {
    const annots = pg.node.Annots(); if (!annots) continue;
    for (let i = annots.size() - 1; i >= 0; i--) { const r = annots.get(i); if (r instanceof PL.PDFRef && !doc.context.lookup(r)) annots.remove(i); }
    if (annots.size() === 0) pg.node.delete(PL.PDFName.of('Annots'));
  }
}
function rebuildAcroForm(out) {
  try {
    const ctx = out.context, roots = new Map();
    for (const pg of out.getPages()) {
      const annots = pg.node.Annots(); if (!annots) continue;
      for (let i = 0; i < annots.size(); i++) {
        let ref = annots.get(i); if (!(ref instanceof PL.PDFRef)) continue;
        let dict = ctx.lookup(ref); if (!(dict instanceof PL.PDFDict)) continue;
        const sub = dict.get(PL.PDFName.of('Subtype')); if (!sub || sub.toString() !== '/Widget') continue;
        for (let g = 0; g < 32; g++) {
          const par = dict.get(PL.PDFName.of('Parent'));
          if (!(par instanceof PL.PDFRef)) break;
          const pd = ctx.lookup(par); if (!(pd instanceof PL.PDFDict)) break;
          ref = par; dict = pd;
        }
        if (dict.get(PL.PDFName.of('T'))) roots.set(ref.toString(), ref);
      }
    }
    if (!roots.size) return;
    const af = out.getForm().acroForm;
    for (const r of roots.values()) af.addField(r);
  } catch (e) { console.warn('acroform', e); }
}
async function rasterizeForRedaction(page) {
  const bs = baseSize(page), scale = Math.min(2.5, Math.sqrt(16e6 / (bs.w * bs.h)));
  const c = h('canvas'); c.width = Math.round(bs.w * scale); c.height = Math.round(bs.h * scale);
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  const clean = { ...page, items: page.items.filter(it => it.type !== 'redact') };
  const bytes = await buildPdf([clean], false);
  const pdf = await pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise;
  try {
    const p = await pdf.getPage(1), vp1 = p.getViewport({ scale: 1, rotation: page.baseRot });
    const vp = p.getViewport({ scale: c.width / vp1.width, rotation: page.baseRot });
    await p.render({ canvasContext: ctx, viewport: vp, annotationMode: pdfjs.AnnotationMode.ENABLE }).promise;
  } finally { await pdf.destroy(); }
  for (const it of page.items) if (it.type === 'redact') {
    const rect = [Math.floor(it.x * scale) - 1, Math.floor(it.y * scale) - 1, Math.ceil(it.w * scale) + 2, Math.ceil(it.h * scale) + 2];
    ctx.fillStyle = '#fff'; ctx.fillRect(...rect); // Önce alttaki piksel içeriği kaldırılır.
    ctx.fillStyle = `rgba(0,0,0,${clamp(it.opacity ?? 1, 0, 1)})`; ctx.fillRect(...rect);
  }
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92));
  return new Uint8Array(await blob.arrayBuffer());
}
function roundRectPath(w, hh, r) {
  r = Math.min(r, w / 2, hh / 2);
  return `M${r} 0 L${w - r} 0 Q${w} 0 ${w} ${r} L${w} ${hh - r} Q${w} ${hh} ${w - r} ${hh} L${r} ${hh} Q0 ${hh} 0 ${hh - r} L0 ${r} Q0 0 ${r} 0 Z`;
}
function drawItems(pg, page, Hd, fonts, imgs) {
  for (const it of page.items) {
    const yb = Hd - it.y - it.h;
    switch (it.type) {
      case 'text': {
        if (it.bg) pg.drawRectangle({ x: it.x, y: yb, width: it.w, height: it.h, color: hexToRgb(it.bg) });
        const metrics = metricsFor(it), pad = it.pad || 0, lh = metrics.lh * it.size, half = (lh - (metrics.asc + metrics.desc) * it.size) / 2;
        it.text.split('\n').forEach((ln, i) => {
          if (!ln) return;
          const base = it.y + pad + i * lh + half + metrics.asc * it.size;
          const angle = (it.angle || 0) * Math.PI / 180, offset = base - it.y;
          const font = fonts.get(it), x = it.x + pad * Math.cos(angle) - offset * Math.sin(angle), y = Hd - it.y - pad * Math.sin(angle) - offset * Math.cos(angle);
          const raster = imgs.get(`rtl:${it.id}:${i}`);
          if (raster) {
            withCm(pg, [Math.cos(angle), -Math.sin(angle), Math.sin(angle), Math.cos(angle), it.x, Hd - it.y], () => {
              pg.drawImage(raster.image, { x: pad - raster.margin, y: -(pad + i * lh + raster.height + raster.margin), width: raster.width + 2 * raster.margin, height: raster.height + 2 * raster.margin });
              pg.pushOperators(PL.pushGraphicsState(), PL.setTextRenderingMode(PL.TextRenderingMode.Invisible), PL.setCharacterSqueeze(raster.width / Math.max(1, font.widthOfTextAtSize(ln, it.size)) * 100));
              pg.drawText(ln, { x: pad, y: -(pad + i * lh + half + metrics.asc * it.size), size: it.size, font });pg.pushOperators(PL.popGraphicsState());
              if (it.underline) pg.drawLine({ start: { x: pad, y: -(pad + i * lh + half + metrics.asc * it.size + it.size * .12) }, end: { x: pad + raster.width, y: -(pad + i * lh + half + metrics.asc * it.size + it.size * .12) }, thickness: Math.max(.6, it.size * .055), color: hexToRgb(it.color) });
            });
            return;
          }
          const family = resolvedFamily(it), syntheticItalic = it.italic && !family.variants[it.bold ? 'boldItalic' : 'italic'], syntheticBold = it.bold && !family.variants.bold;
          if (syntheticBold) pg.pushOperators(PL.pushGraphicsState(), PL.setTextRenderingMode(PL.TextRenderingMode.FillAndOutline), PL.setStrokingRgbColor(hexToRgb(it.color).red, hexToRgb(it.color).green, hexToRgb(it.color).blue), PL.setLineWidth(it.size * .025));
          pg.drawText(ln, { x, y, size: it.size, font, color: hexToRgb(it.color), rotate: PL.degrees(-(it.angle || 0)), xSkew: PL.degrees(syntheticItalic ? 12 : 0) });
          if (syntheticBold) pg.pushOperators(PL.popGraphicsState());
          if (it.underline) {
            const width = font.widthOfTextAtSize(ln, it.size), offset = it.size * .12;
            pg.drawLine({ start: { x: x - Math.sin(angle) * offset, y: y - Math.cos(angle) * offset }, end: { x: x + Math.cos(angle) * width - Math.sin(angle) * offset, y: y - Math.sin(angle) * width - Math.cos(angle) * offset }, thickness: Math.max(.6, it.size * .055), color: hexToRgb(it.color) });
          }
        });
        break;
      }
      case 'image': case 'sign': { const im = imgs.get(it.img); if (im) pg.drawImage(im, { x: it.x, y: yb, width: it.w, height: it.h }); break; }
      case 'whiteout': pg.drawRectangle({ x: it.x, y: yb, width: it.w, height: it.h, color: PL.rgb(1, 1, 1) }); break;
      case 'rect': { const bw = it.width || 1.5; pg.drawRectangle({ x: it.x + bw / 2, y: yb + bw / 2, width: Math.max(0, it.w - bw), height: Math.max(0, it.h - bw), borderColor: hexToRgb(it.color), borderWidth: bw }); break; }
      case 'highlight': pg.drawRectangle({ x: it.x, y: yb, width: it.w, height: it.h, color: hexToRgb(it.color), opacity: 0.4, blendMode: PL.BlendMode.Multiply }); break;
      case 'ink': pg.drawSvgPath(inkPath(it.pts), { x: it.x, y: Hd - it.y, borderColor: hexToRgb(it.color), borderWidth: it.width, borderLineCap: PL.LineCapStyle.Round }); break;
      case 'check': case 'cross':
        pg.drawSvgPath(it.type === 'check' ? CHECK_D : CROSS_D, { x: it.x, y: Hd - it.y, scale: it.w / 24, borderColor: hexToRgb(it.color), borderWidth: 2.6, borderLineCap: PL.LineCapStyle.Round });
        break;
      case 'stamp': {
        const col = hexToRgb(it.color), bw = Math.max(1.5, it.size * 0.11);
        pg.drawSvgPath(roundRectPath(it.w - bw, it.h - bw, it.h * 0.18), { x: it.x + bw / 2, y: Hd - it.y - bw / 2, color: col, opacity: 0.06, borderColor: col, borderWidth: bw, borderOpacity: 1 });
        const tw = fonts.semi.widthOfTextAtSize(it.text, it.size);
        pg.drawText(it.text, { x: it.x + (it.w - tw) / 2, y: Hd - (it.y + it.h / 2 + M.cap * it.size / 2), size: it.size, font: fonts.semi, color: col });
        break;
      }
      default: break;
    }
  }
}
function drawDecor(pg, i, total, Wd, Hd, fonts) {
  const st = S.doc.settings;
  if (st.wm.on && st.wm.text.trim()) {
    const s = st.wm.size, t = st.wm.text, tw = fonts.semi.widthOfTextAtSize(t, s), th = M.cap * s, a = st.wm.angle * Math.PI / 180;
    const x = Wd / 2 - (tw / 2) * Math.cos(a) + (th / 2) * Math.sin(a), y = Hd / 2 - (tw / 2) * Math.sin(a) - (th / 2) * Math.cos(a);
    pg.drawText(t, { x, y, size: s, font: fonts.semi, color: hexToRgb(st.wm.color), opacity: st.wm.opacity, rotate: PL.degrees(st.wm.angle) });
  }
  if (st.pn.on) {
    const label = pnLabel(i, total), s = st.pn.size, tw = fonts.reg.widthOfTextAtSize(label, s), m = 28;
    const x = st.pn.pos.endsWith('c') ? (Wd - tw) / 2 : st.pn.pos.endsWith('r') ? Wd - m - tw : m;
    const yDown = st.pn.pos.startsWith('b') ? Hd - m * 0.75 : m * 0.75 + M.cap * s;
    pg.drawText(label, { x, y: Hd - yDown, size: s, font: fonts.reg, color: hexToRgb('#1B2433') });
  }
}
/** Generate a new PDF from the supplied pages, applying all edits. */
async function buildPdf(pages = S.doc.pages, includeDecor = true) {
  commitEditing();
  const needRaster = p => p.items.some(i => i.type === 'redact');
  const srcIds = [...new Set(pages.filter(p => p.srcId && !needRaster(p)).map(p => p.srcId))];
  const prepared = await prepSources(srcIds);
  const out = await PL.PDFDocument.create();
  out.registerFontkit(FK);
  const fonts = await embedDocumentFonts(out, pages);
  const imgs = new Map();
  await embedRtlTextImages(out, pages, imgs);
  for (const p of pages) for (const it of p.items) {
    if ((it.type === 'image' || it.type === 'sign') && !imgs.has(it.img)) {
      const im = S.images.get(it.img); if (!im) continue;
      imgs.set(it.img, im.kind === 'jpg' ? await out.embedJpg(im.bytes) : await out.embedPng(im.bytes));
    }
  }
  // copy pages once per source
  const copied = new Map();
  for (const id of srcIds) {
    const list = pages.filter(p => p.srcId === id && !needRaster(p));
    const cps = await out.copyPages(prepared.get(id), list.map(p => p.index));
    list.forEach((p, k) => copied.set(p.id, cps[k]));
  }
  const decorOn = includeDecor && (S.doc.settings.wm.on || S.doc.settings.pn.on);
  for (const [i, page] of pages.entries()) {
    if (pages.length > 8 && i % 4 === 0) setBusyMsg(`Sayfa ${i + 1}/${pages.length} işleniyor…`);
    let pg, vb;
    if (needRaster(page)) {
      const bs = baseSize(page);
      const jpg = await out.embedJpg(await rasterizeForRedaction(page));
      pg = out.addPage([bs.w, bs.h]);
      pg.drawImage(jpg, { x: 0, y: 0, width: bs.w, height: bs.h });
      pg.setRotation(PL.degrees(page.rot));
      const flat = { ...page, baseRot: 0, view: [0, 0, bs.w, bs.h] };
      // rasterizeForRedaction has already applied visible edits before redaction.
      vb = { x0: 0, y0: 0, W: bs.w, H: bs.h, R: page.rot };
    } else if (!page.srcId) {
      const { W, H } = vbox(page);
      pg = out.addPage([W, H]); pg.setRotation(PL.degrees(page.rot));
      if (page.items.length) drawItems(pg, page, H, fonts, imgs);
      vb = { x0: 0, y0: 0, W, H, R: page.rot };
    } else {
      pg = page.items.some(it => it.native) ? await copyErasedPage(out, page, prepared.get(page.srcId)) : copied.get(page.id); out.addPage(pg);
      pg.setRotation(PL.degrees(totRot(page)));
      const { x0, y0, W, H } = vbox(page), bs = baseSize(page);
      if (page.items.length) withCm(pg, cmFor(page.baseRot, x0, y0, W, H), () => drawItems(pg, page, bs.h, fonts, imgs));
      vb = { x0, y0, W, H, R: totRot(page) };
    }
    if (page.ocr?.lines?.length) {
      const bs = baseSize(page);
      withCm(pg, cmFor(needRaster(page) ? 0 : page.baseRot, vb.x0, vb.y0, vb.W, vb.H), () => drawOcrLayer(pg, page, bs.h, fonts));
    }
    if (decorOn) {
      const d = dispSize(page);
      withCm(pg, cmFor(vb.R, vb.x0, vb.y0, vb.W, vb.H), () => drawDecor(pg, i, pages.length, d.w, d.h, fonts));
    }
  }
  await writeLinks(out, pages);
  if (!S.doc.flatten) rebuildAcroForm(out);
  const pr = S.doc.props, now = new Date();
  if (pr.title) out.setTitle(pr.title, { showInWindowTitleBar: true });
  if (pr.author) out.setAuthor(pr.author);
  if (pr.subject) out.setSubject(pr.subject);
  if (pr.keywords) out.setKeywords(pr.keywords.split(',').map(s => s.trim()).filter(Boolean));
  out.setProducer('PDF Werkstatt'); out.setCreator('PDF Werkstatt');
  if (!pr.clean) { out.setCreationDate(now); out.setModificationDate(now); }
  else { out.setCreationDate(now); out.setModificationDate(now); }
  return out.save({ useObjectStreams: true });
}
async function saveDoc() {
  if (!S.doc) return;
  commitEditing();
  await guard(async () => {
    const bytes = await busy('PDF hazırlanıyor…', () => buildPdf());
    const name = /\.pdf$/i.test(S.doc.name) ? S.doc.name : baseName(S.doc.name) + '.pdf';
    const ok = await saveFile(name, bytes);
    if (ok) { S.doc.dirty = false; renderTabs(); }
  });
}
async function withBuiltDoc(fn) {
  const bytes = await buildPdf();
  const pdf = await pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise;
  try { return await fn(pdf); } finally { pdf.destroy(); }
}
async function exportImages(dpi, format = 'png', quality = 0.92) {
  await busy('Sayfalar resme çevriliyor…', () => withBuiltDoc(async pdf => {
    const base = baseName(S.doc.name), files = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      setBusyMsg(`Sayfa ${i}/${pdf.numPages} çiziliyor…`);
      const p = await pdf.getPage(i); let vp = p.getViewport({ scale: dpi / 72 });
      const px = vp.width * vp.height; if (px > 40e6) vp = p.getViewport({ scale: dpi / 72 * Math.sqrt(40e6 / px) });
      const c = h('canvas'); c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      await p.render({ canvasContext: ctx, viewport: vp }).promise;
      files.push({ name: `${base}-page-${String(i).padStart(3, '0')}.${format === 'jpeg' ? 'jpg' : 'png'}`, blob: await new Promise(r => c.toBlob(r, format === 'jpeg' ? 'image/jpeg' : 'image/png', quality)) });
      c.width = c.height = 0;
    }
    if (files.length === 1) return saveFile(files[0].name, files[0].blob);
    const zip = new JSZipLib(); for (const f of files) zip.file(f.name, f.blob);
    setBusyMsg('ZIP dosyası hazırlanıyor…');
    return saveFile(`${base}-pages.zip`, await zip.generateAsync({ type: 'blob' }));
  }));
}
async function exportText() {
  await busy('Metin çıkarılıyor…', () => withBuiltDoc(async pdf => {
    let out = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const tc = await (await pdf.getPage(i)).getTextContent();
      let s = ''; for (const it of tc.items) { s += it.str || ''; if (it.hasEOL) s += '\n'; }
      out += (i > 1 ? '\n\n' : '') + `--- Sayfa ${i} ---\n` + s.trim();
    }
    if (!out.replace(/--- Sayfa \d+ ---/g, '').trim()) toast('Belgede çıkarılabilir metin bulunamadı. Taranmış bir belge olabilir.');
    return saveFile(`${baseName(S.doc.name)}.txt`, '\uFEFF' + out + '\n');
  }));
}

/* =========================================================================
   Help and theme
   ========================================================================= */
function aboutDialog() {
  const k = (a, b) => [h('div', null, ...a.split(' + ').flatMap((x, i) => i ? [' + ', h('kbd', null, x)] : [h('kbd', null, x)])), h('div', null, b)];
  dialog('PDF Werkstatt hakkında', h('div', null,
    h('p', null, 'PDF Werkstatt, tarayıcıda çalışan bir PDF düzenleyicidir. Dosyalarınız hiçbir sunucuya yüklenmez.'),
    h('h4', { style: { margin: '14px 0 6px' } }, 'Klavye kısayolları'),
    h('div', { class: 'kbd' },
      k('Ctrl + O', 'Dosya aç'), k('Ctrl + S', 'Kaydet'), k('Ctrl + Z', 'Geri al'), k('Ctrl + Y', 'Yinele'),
      k('Delete', 'Seçili öğeyi ya da sayfaları sil'), k('Esc', 'Aracı bırak, seçimi kaldır'), k('Ok tuşları', 'Seçili öğeyi kaydır (Shift ile 10 pt)'),
      k('Ctrl + +', 'Yakınlaştır'), k('Ctrl + -', 'Uzaklaştır'), k('Ctrl + 0', 'Genişliğe sığdır')),
    h('h4', { style: { margin: '14px 0 6px' } }, 'Bilinen sınırlar'),
    h('ul', { class: 'credits' },
      h('li', null, 'Belgedeki mevcut yazı doğrudan değiştirilemez; beyaz kutuyla örtüp yeni metin ekleyebilirsiniz.'),
      h('li', null, 'Şifreli PDF’ler açılır ama kaydedilemez. Kaydederken yer imleri (bookmark) korunmaz.'),
      h('li', null, 'Word/Excel’den PDF oluşturma ve Word’e dışa aktarma yoktur.')),
    h('h4', { style: { margin: '14px 0 6px' } }, 'Açık kaynak bileşenler'),
    h('ul', { class: 'credits' },
      h('li', null, 'pdf.js (Apache-2.0): görüntüleme'), h('li', null, 'pdf-lib ve @pdf-lib/fontkit (MIT): PDF yazma'),
      h('li', null, 'JSZip (MIT): ZIP dosyaları'), h('li', null, 'Inter ve Dancing Script yazı tipleri (SIL Open Font License 1.1)'),
      h('li', null, 'Lucide simgeleri (ISC, © Lucide Icons and Contributors)'),
      h('li', null, 'Araç düzeni ve Türkçe terimler PdfCraft (MIT / Apache-2.0) referans alınarak hazırlandı.'))),
    [{ label: 'Kapat', kind: 'primary', value: true }], { width: 560 });
}
const THEME_KEY = 'pdf-workshop.theme';
function applyTheme(t) {
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
  const dark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  $('#themeBtn').innerHTML = svgIcon(dark ? 'sun' : 'moon', 18);
}
function toggleTheme() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const t = dark ? 'light' : 'dark';
  try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* ignore */ }
  applyTheme(t);
}

/* =========================================================================
   Keyboard, drag-and-drop and initialization
   ========================================================================= */
function onKey(e) {
  const tag = e.target.tagName, typing = /INPUT|TEXTAREA|SELECT/.test(tag) || e.target.isContentEditable;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (document.querySelector('dialog[open]')) return;
  if (mod && k === 's') { e.preventDefault(); if (S.doc) saveDoc(); return; }
  if (mod && k === 'o') { e.preventDefault(); pickFiles(ACCEPT_ALL).then(openFiles); return; }
  if (typing || !S.doc || S.view !== 'doc') return;
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && k === 'y') { e.preventDefault(); redo(); return; }
  if (mod && k === 'f') { const s = $('#searchInp'); if (s) { e.preventDefault(); s.focus(); s.select(); } return; }
  if (mod && (k === '+' || k === '=')) { e.preventDefault(); setZoom(S.zoom * 1.2); return; }
  if (mod && k === '-') { e.preventDefault(); setZoom(S.zoom / 1.2); return; }
  if (mod && k === '0') { e.preventDefault(); fitWidth(); return; }
  if (e.key === 'Escape') { if (S.mode !== 'select') setMode('select'); else if (S.sel) select(null); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (S.organize && S.orgSel.size) { e.preventDefault(); deletePages(selectedPages()); }
    else if (S.sel) { e.preventDefault(); deleteSelected(); }
    return;
  }
  if (S.sel && e.key.startsWith('Arrow')) {
    e.preventDefault();
    const page = pageById(S.sel.pageId), it = itemOf(page, S.sel.itemId); if (!it) return;
    const d = e.shiftKey ? 10 : 1;
    if (!e.repeat) snapshot();
    if (e.key === 'ArrowLeft') it.x -= d; if (e.key === 'ArrowRight') it.x += d; if (e.key === 'ArrowUp') it.y -= d; if (e.key === 'ArrowDown') it.y += d;
    markDirty(); renderItems(page); return;
  }
  if (!S.organize && (e.key === 'PageDown' || e.key === 'PageUp')) { e.preventDefault(); goPage(S.cur + (e.key === 'PageDown' ? 1 : -1)); }
}
function init() {
  if (!pdfjs || !PL || !FK) {
    document.body.replaceChildren(h('div', { class: 'libwarn' }, h('h2', null, 'PDF Werkstatt yüklenemedi'),
      h('p', null, 'Gerekli kütüphaneler indirilemedi. İnternet bağlantınızı kontrol edip sayfayı yenileyin.')));
    return;
  }
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  let t = null; try { t = localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }
  applyTheme(t);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { let tt = null; try { tt = localStorage.getItem(THEME_KEY); } catch (e) { /* */ } applyTheme(tt); });
  $('#themeBtn').addEventListener('click', toggleTheme);
  $('#aboutBtn').innerHTML = svgIcon('circle-help', 18);
  $('#aboutBtn').addEventListener('click', aboutDialog);
  $('#brand').addEventListener('click', () => show('home'));
  $('#pages').addEventListener('pointerdown', onPagesDown);
  $('#pages').addEventListener('dblclick', e => {
    const n = e.target.closest('.item.it-text'); if (!n || S.mode !== 'select') return;
    const page = pageById(n.closest('.slot').dataset.id), it = itemOf(page, n.dataset.id); if (it) startEdit(page, it, false);
  });
  $('#organize').addEventListener('click', e => { if (e.target === e.currentTarget) { S.orgSel.clear(); $$('#organize .card').forEach(c => c.classList.remove('on')); renderPane(); } });
  let raf = 0;
  $('#stage').addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; trackCurrent(); }); });
  $('#stage').addEventListener('wheel', e => { if (e.ctrlKey && S.doc && !S.organize) { e.preventDefault(); setZoom(S.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); } }, { passive: false });
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (S.doc && S.fit === 'width') fitWidth(); else if (S.doc && S.fit === 'page') fitPage(); }, 150); });
  document.addEventListener('keydown', onKey);
  // drop files anywhere in the window
  let dragDepth = 0;
  const hasFiles = e => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
  window.addEventListener('dragenter', e => { if (!hasFiles(e)) return; dragDepth++; if (!document.querySelector('dialog[open]')) $('#dragcover').classList.add('on'); });
  window.addEventListener('dragleave', e => { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('#dragcover').classList.remove('on'); });
  window.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', e => {
    if (!hasFiles(e)) return; e.preventDefault(); dragDepth = 0; $('#dragcover').classList.remove('on');
    if (document.querySelector('dialog[open]')) return;
    const files = Array.from(e.dataTransfer.files || []); if (!files.length) return;
    if (S.doc && S.view === 'doc') {
      dialog('Dosyaları ne yapalım?', h('p', null, `${files.length} dosya bıraktınız. Açık belgeye mi eklensin, yoksa yeni belge olarak mı açılsın?`), [
        { label: 'Vazgeç', value: null }, { label: 'Yeni belge olarak aç', value: 'new' }, { label: 'Belgeye ekle', kind: 'primary', value: 'add' }])
        .then(v => { if (v === 'add') openFiles(files, { append: true }); else if (v === 'new') openFiles(files); });
    } else openFiles(files);
  });
  window.addEventListener('beforeunload', e => { if (S.doc && S.doc.dirty) { e.preventDefault(); e.returnValue = ''; } });
  downloadsNs();
  show('home');
  window.__pdfWorkshop = { S, buildPdf, openFiles, openTool, setMode, saveDoc, fontsReady };
}
// Startup runs in 9-start.js after the feature and language modules have loaded.
