/* Distinguish recorded PDF font data from visual font estimates on scans. */
const pdfFontCache=new WeakMap();
async function metadataFromBytes(bytes,password=''){
  const mu=await getMuPDF(),doc=mu.Document.openDocument(bytes,'application/pdf'),pages=[];
  try{
    if(doc.needsPassword()&&!doc.authenticatePassword(password))throw new UserErr(tr('PDF parolası doğrulanamadı.'));
    for(let i=0;i<doc.countPages();i++){
      const page=doc.loadPage(i);let text;
      try{text=page.toStructuredText('preserve-spans');pages.push(JSON.parse(text.asJSON()).blocks.filter(b=>b.type==='text').flatMap(b=>b.lines||[]));}
      finally{text?.destroy();page.destroy();}
    }
  }finally{doc.destroy();}return pages;
}
function nearestFontLine(lines,box,baseline,text){
  let best=null,distance=Infinity;
  for(const line of lines){
    const b=line.bbox,d=Math.abs((baseline?.x??box.x)-(line.x??b.x))+Math.abs((baseline?.y??box.y+box.h*.8)-(line.y??b.y+b.h*.8))*2+(line.text===text?-1000:line.text?.includes(text)?-300:0);
    if(d<distance){distance=d;best=line;}
  }return best;
}
function nearestFont(lines,box,baseline,text){return nearestFontLine(lines,box,baseline,text)?.font||null;}
function familyFromName(name='',fallback='sans-serif'){
  const n=name.replace(/^[A-Z]{6}\+/,'').toLowerCase();
  if(/arabic|naskh|kufi|amiri/.test(n))return'arabic';if(/inter/.test(n))return'inter';if(/arimo|arial|helvetica/.test(n))return'arimo';
  if(/tinos|times/.test(n))return'tinos';if(/cousine|courier/.test(n))return'cousine';if(/dejavu.*mono/.test(n))return'dejavumono';
  if(/dejavu.*sans/.test(n))return'dejavu';if(/dejavu.*serif/.test(n))return'dejavuserif';if(/dancing|script/.test(n))return'script';
  if(/noto/.test(n))return'noto';return fallback==='monospace'?'cousine':fallback==='serif'?'tinos':'noto';
}
async function pageUnderlineSegments(page){
  const source=S.doc?.sources.get(page.srcId);if(!source)return[];
  source.underlinePaths=source.underlinePaths||new Map();if(source.underlinePaths.has(page.index))return source.underlinePaths.get(page.index);
  const p=await source.pdf.getPage(page.index+1),result=await underlineSegmentsFromPdfPage(p,page.baseRot);
  source.underlinePaths.set(page.index,result);return result;
}
async function underlineSegmentsFromPdfPage(p,rotation=p.rotate){
  const vp=p.getViewport({scale:1,rotation}),ops=await p.getOperatorList();
  const result=[],stack=[];let matrix=[1,0,0,1,0,0],paths=[];
  for(let k=0;k<ops.fnArray.length;k++){
    const op=ops.fnArray[k],args=ops.argsArray[k];
    if(op===pdfjs.OPS.save)stack.push(matrix.slice());else if(op===pdfjs.OPS.restore)matrix=stack.pop()||[1,0,0,1,0,0];
    else if(op===pdfjs.OPS.transform)matrix=pdfjs.Util.transform(matrix,args);
    else if(op===pdfjs.OPS.constructPath){
      const types=args[0],values=args[1];let cursor=0,start=null,current=null;
      const point=()=>{const x=values[cursor++],y=values[cursor++],m=pdfjs.Util.transform(vp.transform,matrix);return{x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]};};
      for(const type of types){
        if(type===pdfjs.OPS.moveTo){current=point();start=current;}
        else if(type===pdfjs.OPS.lineTo){const end=point();if(current)paths.push({start:current,end});current=end;}
        else if(type===pdfjs.OPS.curveTo){cursor+=4;current=point();}
        else if(type===pdfjs.OPS.curveTo2||type===pdfjs.OPS.curveTo3){cursor+=2;current=point();}
        else if(type===pdfjs.OPS.rectangle){cursor+=4;current=null;}
        else if(type===pdfjs.OPS.closePath){if(current&&start)paths.push({start:current,end:start});current=start;}
      }
    }else if([pdfjs.OPS.stroke,pdfjs.OPS.closeStroke,pdfjs.OPS.fillStroke,pdfjs.OPS.eoFillStroke,pdfjs.OPS.closeFillStroke,pdfjs.OPS.closeEOFillStroke].includes(op)){result.push(...paths);paths=[];}
    else if([pdfjs.OPS.fill,pdfjs.OPS.eoFill,pdfjs.OPS.endPath].includes(op))paths=[];
  }
  return result;
}
function isUnderlined(candidate,segments){
  const b=candidate.box,fs=candidate.size||12;if(Math.abs(candidate.angle||0)>5)return false;
  const y=candidate.baseline?.y??b.y+b.h*.82;
  return segments.some(s=>Math.abs(s.start.y-s.end.y)<1.5&&Math.abs((s.start.y+s.end.y)/2-y-fs*.12)<fs*.19&&Math.min(Math.max(s.start.x,s.end.x),b.x+b.w)-Math.max(Math.min(s.start.x,s.end.x),b.x)>b.w*.65);
}
const v012NativeCandidates=nativeCandidates;
nativeCandidates=async function(page){
  const candidates=await v012NativeCandidates(page),source=S.doc?.sources.get(page.srcId);
  let metadata=[],segments=[];
  if(source&&candidates.some(c=>!c.scan)){
    if(!source.fontMetadata)source.fontMetadata=metadataFromBytes(source.bytes,source.password);
    metadata=(await source.fontMetadata)[page.index]||[];segments=await pageUnderlineSegments(page);
  }
  for(const c of candidates){
    if(c.scan){const line=page.ocr?.lines[+c.key.split(':')[1]];c.fontInfo=line?.format||{source:'estimate',fontName:tr('Belirlenemedi'),fontFamily:familyForText(c.text),size:c.size,bold:false,italic:false,underline:false,score:0};}
    else{const line=nearestFontLine(metadata,c.box,c.baseline,c.text),f=line?.font;if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(c.text)&&line?.text&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(line.text))c.text=line.text;
      c.fontInfo={source:'pdf',fontName:f?.name?.replace(/^[A-Z]{6}\+/,'')||tr('Belirlenemedi'),fontFamily:f?familyFromName(f.name,f.family):familyForText(c.text),size:c.size||f?.size,bold:f?.weight==='bold'||/bold|black|heavy|demi/i.test(f?.name||''),italic:f?.style==='italic'||/italic|oblique/i.test(f?.name||''),underline:isUnderlined(c,segments)};}
    c.size=c.fontInfo.size||c.size;
    if(c.fontInfo.underline){const b=c.box;c.eraseBox={x:b.x-2,y:b.y-2,w:b.w+4,h:b.h+4};}
  }return candidates;
};
function formatDescription(info){
  return `${info.fontName||familyById(info.fontFamily).name} · ${r2(info.size||0)} pt · `+[info.bold?tr('Kalın'):tr('Normal'),info.italic?tr('İtalik'):null,info.underline?tr('Altı çizili'):null].filter(Boolean).join(', ')+(info.source==='estimate'?' · '+tr('Tahmin')+(info.score!=null?` (${info.score}%)`:''):'');
}
function formatDetails(info){
  return h('div',{class:'format-report'},h('p',{class:'stat'},formatDescription(info)),h('p',{class:'hint'},tr(info.source==='pdf'?'Yazı tipi adı ve punto PDF kaydından okunur. Alt çizgi, çizim öğelerinden tespit edilir.':'Tarama tahmini, ekli yazı tipleriyle görsel karşılaştırmaya dayanır. Skor fontun kesin tanındığı anlamına gelmez.')));
}
async function inspectFontDialog(page,candidate){
  const info=candidate.fontInfo;
  const value=await dialog(tr('Yazı biçimi bilgisi'),h('div',null,h('p',{class:'font-sample',noI18n:true},candidate.text),formatDetails(info)),[
    {label:tr('Kapat'),value:null},{label:tr('Bu metni düzenle'),kind:'primary',value:'edit'}],{width:620});
  if(value==='edit')await editNativeText(page,candidate);
}
TOOLS.splice(4,0,{id:'fontinfo',label:'Yazı biçimini tanı',icon:'type',c:'cobalt',desc:'PDF font adını okuyun; tarama biçimini tahmin edin.'});
TOOL_SECTIONS[0].ids.splice(4,0,'fontinfo');MODE_HINT.fontinspect='Biçimini görmek istediğiniz metne tıklayın. Taramalar için önce OCR çalıştırın.';
PANES.fontinfo=function(){
  const list=h('div',{class:'font-report-list'}),page=S.doc.pages[S.cur];
  nativeCandidates(page).then(items=>{
    if(!list.isConnected)return;
    if(!items.length)list.append(h('p',{class:'hint'},tr('Metin bulunamadı. Taranmış sayfada önce OCR çalıştırın.')));
    for(const c of items.slice(0,80))list.append(h('button',{class:'font-report-row',type:'button',onclick:()=>guard(()=>inspectFontDialog(page,c))},h('span',{noI18n:true},c.text.slice(0,95)),h('small',{noI18n:true},formatDescription(c.fontInfo))));
  }).catch(showError);
  return h('div',null,modeBtn('fontinspect','type',tr('Sayfada biçim seç')),h('p',{class:'hint'},tr('PDF metninde kayıtlı font bilgisi okunur. Taramada, en yakın yerel font tahmini gösterilir.')),list);
};
editNativeText=async function(page,candidate){
  const original=candidate.fontInfo||{},input=h('textarea',{class:'inp',rows:'4','aria-label':tr('Yeni metin')});input.value=candidate.text;
  const values={fontFamily:original.fontFamily||familyForText(candidate.text),bold:!!original.bold,italic:!!original.italic,underline:!!original.underline,size:candidate.size,color:S.pref.textColor};
  const size=h('input',{class:'inp',type:'number',min:'4',max:'200',step:'.5',value:String(r2(values.size)),'aria-label':tr('Yazı boyutu')});
  const color=h('input',{type:'color',value:values.color,'aria-label':tr('Renk')});
  const family=fontFamilyControl(values.fontFamily,v=>values.fontFamily=v,'nativeFontFamily'),toggles=h('div');
  const rebuild=()=>toggles.replaceChildren(styleControls(values,(k,v)=>{values[k]=v;rebuild();}));rebuild();
  const body=h('div',null,formatDetails({...original,size:values.size}),h('p',{class:'hint'},tr('Eski metin kaldırılır; yeni metin seçtiğiniz fontla yazılır. Paragraflar otomatik yeniden akmaz.')),
    h('div',{class:'field'},tr('Yeni metin'),input),h('div',{class:'field'},tr('Yazı tipi'),family),h('div',{class:'field'},tr('Yazı boyutu'),size),toggles,h('div',{class:'field'},tr('Renk'),color));
  const result=await dialog(tr('Mevcut metni düzenle'),body,[{label:tr('Vazgeç'),value:null},{label:tr('Metni sil'),kind:'danger',onClick:close=>close('')},{label:tr('Uygula'),kind:'primary',onClick:close=>{
    if(!Number.isFinite(+size.value)||+size.value<4||+size.value>200){toast(tr('Yazı boyutu 4–200 arasında olmalıdır.'),'err');return false;}
    try{supportedText(input.value,values);}catch(e){toast(e.message,'err');return false;}close(input.value);
  }}],{width:620,onOpen:()=>{input.focus();input.select();}});
  if(result===null||!pageById(page.id))return;
  snapshot();values.size=+size.value;values.color=color.value;
  const a=(candidate.angle||0)*Math.PI/180,baseline=candidate.baseline||{x:candidate.box.x,y:candidate.box.y+candidate.box.h*.88},metrics=metricsFor({...values,text:result});
  const metric=(metrics.asc+(metrics.lh-metrics.asc-metrics.desc)/2)*values.size;
  const it={id:uid(),type:'text',text:result,...values,angle:candidate.angle||0,x:baseline.x+Math.sin(a)*metric,y:baseline.y-Math.cos(a)*metric,w:candidate.box.w,h:candidate.box.h,native:{key:candidate.key,box:{...(candidate.eraseBox||candidate.box)},scan:candidate.scan,fontInfo:original}};
  fitText(it);page.items.push(it);rememberStyle(it);markDirty();renderItems(page);select(page,it);renderPane();
};

/* Visual matching estimates a font from a limited catalog and cannot verify the original font. */
function inkSignature(canvas){
  const width=canvas.width,height=canvas.height,rgba=canvas.getContext('2d').getImageData(0,0,width,height).data;
  let x0=width,y0=height,x1=-1,y1=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=(y*width+x)*4,ink=(1-(rgba[p]+rgba[p+1]+rgba[p+2])/765)*(rgba[p+3]/255);if(ink>.23){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
  if(x1<x0)return null;
  const normalized=h('canvas');normalized.width=160;normalized.height=40;const ctx=normalized.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,160,40);ctx.drawImage(canvas,x0,y0,x1-x0+1,y1-y0+1,0,0,160,40);
  const pixels=ctx.getImageData(0,0,160,40).data,result=new Float32Array(6400);
  for(let i=0;i<result.length;i++)result[i]=1-(pixels[i*4]+pixels[i*4+1]+pixels[i*4+2])/765;
  return{pixels:result,ratio:(x1-x0+1)/(y1-y0+1),height:y1-y0+1};
}
function signatureDistance(a,b){
  let best=Infinity;
  for(const dx of[-1,0,1]){let sum=0;for(let y=1;y<39;y++)for(let x=2;x<158;x++){const d=a.pixels[y*160+x]-b.pixels[y*160+x+dx];sum+=d*d;}best=Math.min(best,sum/(38*156));}
  return best+Math.min(.15,Math.abs(Math.log(a.ratio/b.ratio))*.06);
}
async function addOcrFontEstimates(lines,canvas,size){
  await extraFontsReady;
  setBusyMsg(tr('Yazı biçimleri tahmin ediliyor…'));
  for(const line of lines){
    const b=line.box,crop=h('canvas');crop.width=Math.max(1,Math.ceil(b.w/size.w*canvas.width));crop.height=Math.max(1,Math.ceil(b.h/size.h*canvas.height));
    const ctx=crop.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,crop.width,crop.height);ctx.drawImage(canvas,b.x/size.w*canvas.width,b.y/size.h*canvas.height,crop.width,crop.height,0,0,crop.width,crop.height);
    const target=inkSignature(crop);let best={distance:Infinity,fontFamily:familyForText(line.text),bold:false,italic:false};
    if(target&&line.text.length>=4&&line.text.length<=160){
      for(const f of FAMILIES){if(!canWrite(f.variants.regular,line.text))continue;
        for(const [style,key]of Object.entries(f.variants)){
          const textCanvas=h('canvas'),textCtx=textCanvas.getContext('2d'),bold=style==='bold'||style==='boldItalic',italic=style==='italic'||style==='boldItalic';
          const css=`${italic?'italic':'normal'} ${bold?'700':'400'} 54px "${f.css}"`;textCtx.font=css;textCanvas.width=Math.min(10000,Math.ceil(textCtx.measureText(line.text).width)+12);textCanvas.height=125;
          textCtx.font=css;textCtx.fillStyle='#fff';textCtx.fillRect(0,0,textCanvas.width,125);textCtx.fillStyle='#000';textCtx.fillText(line.text,5,85);
          const comparison=inkSignature(textCanvas);if(comparison){const distance=signatureDistance(target,comparison);if(distance<best.distance)best={distance,fontFamily:f.id,bold,italic};}
          textCanvas.width=textCanvas.height=0;
        }
      }
    }
    const family=familyById(best.fontFamily),font=fontObject(family.variants[best.bold?(best.italic?'boldItalic':'bold'):(best.italic?'italic':'regular')]||family.variants.regular);
    const capital=nonSpaces(line.text).some(c=>/[A-Z\u0410-\u042f]/.test(c)),ratio=(capital?(font.capHeight||font.ascent*.75):(font.xHeight||font.ascent*.55))/(font.unitsPerEm||1000);
    const estimatedSize=clamp(b.h/Math.max(.4,ratio),4,200);
    const pixels=crop.getContext('2d').getImageData(0,0,crop.width,crop.height).data;let underline=false;
    for(let y=Math.floor(crop.height*.83);y<crop.height;y++){let dark=0;for(let x=0;x<crop.width;x++){const p=(y*crop.width+x)*4;if((pixels[p]+pixels[p+1]+pixels[p+2])/3<100)dark++;}if(dark/crop.width>.65)underline=true;}
    line.format={source:'estimate',fontFamily:best.fontFamily,fontName:family.name,size:r2(estimatedSize),bold:best.bold,italic:best.italic,underline,score:Number.isFinite(best.distance)?Math.round(clamp(100*(1-best.distance*2.5),0,99)):0};
    crop.width=crop.height=0;
  }
}

