/* PDF Werkstatt v0.1.3 — local fonts and editable text formats. */
const APP_VERSION = '0.1.3';
const FAMILIES = FONT_META;
const fontObjects = new Map(), fontMetrics = new Map();
const familyById = id => FAMILIES.find(f=>f.id===id)||FAMILIES[0];
function fontBytes(key) { if (!FONT[key]) FONT[key] = b64ToBytes(FONT_DATA[key]); return FONT[key]; }
function fontObject(key) { if (!fontObjects.has(key)) fontObjects.set(key,FK.create(fontBytes(key))); return fontObjects.get(key); }
function requestedFontKey(it) {
  const f=familyById(it.fontFamily||'inter'), style=it.bold?(it.italic?'boldItalic':'bold'):(it.italic?'italic':'regular');
  return f.variants[style]||f.variants[it.bold?'bold':'regular']||f.variants.regular;
}
const nonSpaces = text => [...String(text||'')].filter(c=>!/[\s\u200c\u200d]/.test(c));
function canWrite(key,text) { const font=fontObject(key); return nonSpaces(text).every(c=>font.hasGlyphForCodePoint(c.codePointAt(0))); }
function familyForText(text) { return /[\u0600-\u08ff\ufb50-\ufeff]/.test(text||'')?'arabic':/[\u0370-\u052f]/.test(text||'')?'noto':'inter'; }
function resolvedFontKey(it) {
  const key=requestedFontKey(it);if(canWrite(key,it.text))return key;
  const fallback={...it,fontFamily:familyForText(it.text)}, alt=requestedFontKey(fallback);
  if(canWrite(alt,it.text))return alt;
  for(const family of FAMILIES){const candidate=requestedFontKey({...it,fontFamily:family.id});if(canWrite(candidate,it.text))return candidate;}
  return key;
}
function resolvedFamily(it) { const key=resolvedFontKey(it);return FAMILIES.find(f=>Object.values(f.variants).includes(key))||familyById(it.fontFamily); }
function metricsFor(it) {
  const key=resolvedFontKey(it);if(!fontMetrics.has(key)){
    const font=fontObject(key),em=font.unitsPerEm||1000,asc=(font.ascent||em*.9)/em,desc=Math.abs(font.descent||-em*.25)/em;
    fontMetrics.set(key,{asc,desc,cap:(font.capHeight||em*.72)/em,lh:Math.max(1.25,asc+desc)});
  }return fontMetrics.get(key);
}
function textCSS(it) {
  const f=resolvedFamily(it);return {fontFamily:`"${f.css}"`,fontWeight:it.bold?'700':'400',fontStyle:it.italic?'italic':'normal',textDecoration:it.underline?'underline':'none',lineHeight:String(metricsFor(it).lh)};
}
const extraFontsReady=(async()=>{
  for(const f of FAMILIES)for(const [style,key]of Object.entries(f.variants)){
    const metrics=metricsFor({fontFamily:f.id,bold:style==='bold'||style==='boldItalic',italic:style==='italic'||style==='boldItalic'});
    const face=new FontFace(f.css,fontBytes(key).slice().buffer,{weight:style==='bold'||style==='boldItalic'?'700':'400',style:style==='italic'||style==='boldItalic'?'italic':'normal',ascentOverride:(metrics.asc*100)+'%',descentOverride:(metrics.desc*100)+'%',lineGapOverride:'0%'});
    document.fonts.add(face);await face.load();
  }
})();
S.pref.textFamily='inter';S.pref.textBold=false;S.pref.textItalic=false;S.pref.textUnderline=false;S.pref.redactOpacity=1;
supportedText=function(value,style={}){
  const key=resolvedFontKey({...style,text:value}),missing=nonSpaces(value).filter(c=>!fontObject(key).hasGlyphForCodePoint(c.codePointAt(0)));
  if(missing.length)throw new UserErr(tr('Yazı tipinde bulunmayan karakterler:')+' '+[...new Set(missing)].join(' '));
};
fitText=function(it){
  const metrics=metricsFor(it),css=textCSS(it),pad=it.pad||0;
  mctx.font=`${css.fontStyle} ${css.fontWeight} ${it.size}px ${css.fontFamily}`;
  it.w=Math.max(1,...String(it.text||' ').split('\n').map(l=>mctx.measureText(l||' ').width))+pad*2+1;
  it.h=String(it.text||' ').split('\n').length*metrics.lh*it.size+pad*2;
};
async function embedDocumentFonts(out,pages){
  const keys=new Set();
  if(pages.some(p=>p.items.some(it=>it.type==='stamp'))||S.doc.settings.wm.on)keys.add('semi');
  if(S.doc.settings.pn.on)keys.add('reg');
  for(const p of pages){
    for(const it of p.items)if(it.type==='text'){supportedText(it.text,it);keys.add(resolvedFontKey(it)+(/[\u0600-\u08ff]/.test(it.text)?'@ocr':''));}
    for(const line of p.ocr?.lines||[]){const it={text:line.text,fontFamily:line.format?.fontFamily||familyForText(line.text),bold:line.format?.bold,italic:line.format?.italic};keys.add(resolvedFontKey(it)+(/[\u0600-\u08ff]/.test(line.text)?'@ocr':''));}
  }
  const directFeatures={liga:false,rlig:false,init:false,medi:false,fina:false,isol:false,ccmp:false,calt:false,locl:false,mark:false,mkmk:false};
  const embedded=new Map();for(const key of keys)embedded.set(key,await out.embedFont(fontBytes(key.replace('@ocr','')),{subset:true,...(key.endsWith('@ocr')?{features:directFeatures}:{})}));
  return {reg:embedded.get('reg')||null,semi:embedded.get('semi')||null,get:it=>embedded.get(resolvedFontKey(it)+(/[\u0600-\u08ff]/.test(it.text)?'@ocr':'')),ocr:it=>embedded.get(resolvedFontKey(it)+(/[\u0600-\u08ff]/.test(it.text)?'@ocr':''))};
}
async function embedRtlTextImages(out,pages,images){
  await extraFontsReady;
  for(const page of pages)for(const it of page.items)if(it.type==='text')for(const [index,text]of it.text.split('\n').entries()){
    if(!/[\u0600-\u08ff]/.test(text))continue;
    const css=textCSS(it),metrics=metricsFor(it),margin=Math.ceil(it.size*.22)+2,canvas=h('canvas'),ctx=canvas.getContext('2d');
    ctx.font=`${css.fontStyle} ${css.fontWeight} ${it.size}px ${css.fontFamily}`;const width=ctx.measureText(text).width,height=metrics.lh*it.size,scale=Math.min(4,12000/(width+2*margin),Math.sqrt(16e6/((width+2*margin)*(height+2*margin))));
    canvas.width=Math.max(1,Math.ceil((width+2*margin)*scale));canvas.height=Math.max(1,Math.ceil((height+2*margin)*scale));ctx.scale(scale,scale);
    ctx.font=`${css.fontStyle} ${css.fontWeight} ${it.size}px ${css.fontFamily}`;ctx.fillStyle=it.color;ctx.textAlign='left';
    const first=text.match(/[A-Za-z\u0370-\u052f\u0600-\u08ff]/)?.[0];ctx.direction=first&&/[\u0600-\u08ff]/.test(first)?'rtl':'ltr';
    const baseline=(metrics.asc+(metrics.lh-metrics.asc-metrics.desc)/2)*it.size;ctx.fillText(text,margin,margin+baseline);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));const image=await out.embedPng(new Uint8Array(await blob.arrayBuffer()));
    images.set(`rtl:${it.id}:${index}`,{image,width,height,margin});canvas.width=canvas.height=0;
  }
}
drawOcrLayer=function(pg,page,height,fonts){
  for(const [i,line]of(page.ocr?.lines||[]).entries()){
    if(!line.addLayer||!line.text||page.items.some(it=>it.native?.key===`ocr:${i}`)||page.items.some(it=>it.type==='redact'&&overlap(line.box,it)>0))continue;
    const box=line.box,size=Math.max(1,line.format?.size||box.h*.82),it={text:line.text,fontFamily:line.format?.fontFamily||familyForText(line.text),bold:line.format?.bold,italic:line.format?.italic},font=fonts.ocr(it);
    const width=font.widthOfTextAtSize(line.text,size);
    pg.pushOperators(PL.pushGraphicsState(),PL.setTextRenderingMode(PL.TextRenderingMode.Invisible),PL.setCharacterSpacing(0),PL.setWordSpacing(0),PL.setCharacterSqueeze(width?Math.min(500,box.w/width*100):100));
    pg.drawText(line.text,{x:box.x,y:height-box.y-box.h*.88,size,font});pg.pushOperators(PL.popGraphicsState());
  }
};
const v012ItemNode=itemNode;
itemNode=function(page,it,z){const node=v012ItemNode(page,it,z);if(it.type==='text')Object.assign(node.style,textCSS(it));
  if(it.type==='redact'){node.style.opacity='1';node.style.background=`linear-gradient(rgba(0,0,0,${clamp(it.opacity??1,0,1)}),rgba(0,0,0,${clamp(it.opacity??1,0,1)})),#fff`;}
  return node;
};
function fontFamilyControl(value,onChange,id){const select=h('select',{class:'inp',id,'aria-label':tr('Yazı tipi'),onchange:e=>onChange(e.target.value)},FAMILIES.map(f=>h('option',{value:f.id},f.name)));select.value=value||'inter';return select;}
function styleControls(style,onUpdate){
  const row=h('div',{class:'style-buttons'});
  for(const [key,label,symbol]of[['bold','Kalın','B'],['italic','İtalik','I'],['underline','Altı çizili','U']])row.append(h('button',{class:'btn sm',type:'button','aria-label':tr(label),title:tr(label),'aria-pressed':String(!!style[key]),onclick:()=>onUpdate(key,!style[key])},h(key==='bold'?'strong':key==='italic'?'em':'u',null,symbol)));
  return row;
}
function preferencesStyle(){return{fontFamily:S.pref.textFamily,bold:S.pref.textBold,italic:S.pref.textItalic,underline:S.pref.textUnderline,size:S.pref.textSize,color:S.pref.textColor};}
function rememberStyle(it){S.pref.textFamily=it.fontFamily||'inter';S.pref.textBold=!!it.bold;S.pref.textItalic=!!it.italic;S.pref.textUnderline=!!it.underline;S.pref.textSize=it.size;}
const v012SelBox=selBox;
selBox=function(){
  const box=v012SelBox();if(!box||!S.sel)return box;const p=pageById(S.sel.pageId),it=itemOf(p,S.sel.itemId);if(!it)return box;
  if(it.type==='text'){
    // Replace the previous standalone Bold checkbox with shared style buttons.
    for(const label of box.querySelectorAll('label.check'))if(label.textContent===tr('Kalın'))label.remove();
    const update=(key,value)=>{commitEditing();snapshot();it[key]=value;fitText(it);rememberStyle(it);markDirty();renderItems(p);renderPane();};
    box.append(h('div',{class:'field'},tr('Yazı tipi'),fontFamilyControl(it.fontFamily,v=>update('fontFamily',v),'selectedFontFamily')),styleControls(it,update));
    const actual=resolvedFamily(it);if(actual.id!==(it.fontFamily||'inter'))box.append(h('p',{class:'hint'},tr('Karakter desteği için kullanılan:')+' '+actual.name));
    if(it.native?.fontInfo)box.append(h('p',{class:'hint'},tr('Orijinal biçim:')+' '+formatDescription(it.native.fontInfo)));
  }
  if(it.type==='redact')box.append(opacityControl(it.opacity??1,v=>{snapshot();it.opacity=v;markDirty();renderItems(p);},'selectedRedactOpacity'));
  return box;
};
function preferenceControls(){
  return h('div',{class:'font-preferences'},h('div',{class:'field'},tr('Yazı tipi'),fontFamilyControl(S.pref.textFamily,v=>{S.pref.textFamily=v;},'newFontFamily')),styleControls(preferencesStyle(),(key,value)=>{S.pref['text'+key[0].toUpperCase()+key.slice(1)]=value;renderPane();}));
}
const v012EditPane=PANES.edit;
PANES.edit=function(){const pane=v012EditPane();pane.append(h('h4',null,tr('Yeni metnin biçimi')),preferenceControls(),h('button',{class:'btn wide',onclick:()=>{openTool('fontinfo');setMode('fontinspect');}},I('type',17),tr('Yazı biçimini tanı')));return pane;};
const v012PlaceAt=placeAt;
placeAt=function(page,point){
  const mode=S.mode;
  if(mode==='typedComment'){
    const values=S.modeArg;if(!values?.text)return;snapshot();const it={id:uid(),type:'text',role:'comment',...values,x:point.x,y:point.y,bg:'#FFF1A6',pad:7};fitText(it);addItem(page,it);setMode('select');select(page,it);return;
  }
  if(mode==='pngstamp'){
    const id=S.modeArg,img=S.images.get(id);if(!img)return;snapshot();const w=Math.min(160,baseSize(page).w*.6),it={id:uid(),type:'image',role:'pngstamp',img:id,x:point.x-w/2,y:point.y-w*img.h/img.w/2,w,h:w*img.h/img.w};addItem(page,it);setMode('select');select(page,it);return;
  }
  if(['text','note','date'].includes(mode)){
    snapshot();const it={id:uid(),type:'text',x:point.x,y:point.y-S.pref.textSize*.62,text:mode==='date'?fmtDate(new Date()):'',...preferencesStyle()};
    if(mode==='note'){it.bg='#FFF1A6';it.pad=Math.round(it.size*.5);it.role='comment';}
    fitText(it);addItem(page,it);S.mode='select';S.modeArg=null;renderModebar();renderToolbar();select(page,it);if(mode!=='date')startEdit(page,it,true);return;
  }
  return v012PlaceAt(page,point);
};

