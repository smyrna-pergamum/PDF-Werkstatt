/* v0.1.3: OCR PDF, Save as and local browser printing. */
const hasOcrText = doc => !!doc?.pages.some(p=>p.ocr?.lines?.some(line=>line.text?.trim()));
const pdfStateJSON=()=>JSON.stringify({document:stateJSON(),forms:S.doc.formValues,flatten:S.doc.flatten});
function ocrPdfControls(){
  const ready=hasOcrText(S.doc);
  return h('section',{class:'ocr-pdf-output'},h('h4',null,tr('OCR sonucunu PDF olarak kaydet')),
    h('p',{class:'hint'},tr('Sayfa görünümü, görseller ve yerleşim korunur. Tanınan metin PDF’de aranabilir ve seçilebilir olur. Tüm belge kaydedilir.')),
    h('button',{class:'btn primary wide',id:'saveOcrPdfBtn',disabled:!ready||ocrRunning,onclick:()=>guard(saveOcrPdf)},I('file-down',18),tr('Düzeni koruyarak PDF kaydet')),
    ready?null:h('p',{class:'hint'},tr('Bu düğme, OCR ile metin tanındığında etkinleşir.')));
}
async function saveOcrPdf(){
  if(!S.doc)return false;
  if(ocrRunning)throw new UserErr(tr('OCR işleminin bitmesini bekleyin.'));
  if(!hasOcrText(S.doc))throw new UserErr(tr('Önce OCR ile metin tanıyın.'));
  commitEditing();const doc=S.doc,state=pdfStateJSON(),name=baseName(doc.name).replace(/-OCR$/i,'')+'-OCR.pdf';
  // Copy the original pages and add recognized text as an invisible layer;
  // do not reconstruct or recompress the scan appearance.
  const bytes=await busy(tr('Düzeni koruyan OCR PDF hazırlanıyor…'),()=>buildPdf());
  const saved=await saveFile(name,bytes);
  if(saved&&S.doc===doc&&pdfStateJSON()===state){doc.dirty=false;renderTabs();}
  return saved;
}
function pdfFilename(value){
  const name=String(value||'').trim();
  if(!name||/[<>:"/\\|?*\u0000-\u001f]/.test(name))throw new UserErr(tr('Geçerli bir dosya adı yazın.'));
  return /\.pdf$/i.test(name)?name:name+'.pdf';
}
async function savePdfAs(){
  if(!S.doc)return false;
  commitEditing();const doc=S.doc;
  const input=h('input',{class:'inp',id:'saveAsFilename',value:baseName(doc.name)+'-copy.pdf','aria-label':tr('Dosya adı')});
  const choice=await dialog(tr('Farklı kaydet'),h('div',null,h('div',{class:'field'},tr('Dosya adı'),input),
    h('p',{class:'hint'},tr('Yeni bir PDF adı seçin. Tarayıcı destekliyorsa kaydedilecek konumu da seçebilirsiniz; diğer tarayıcılarda dosya bu adla indirilir.'))),[
    {label:tr('Vazgeç'),value:null},
    {label:tr('Farklı kaydet'),kind:'primary',onClick:async(close,button)=>{
      let filename;try{filename=pdfFilename(input.value);}catch(e){toast(e.message,'err');return false;}
      button.disabled=true;
      try{
        let handle=null;
        if(window.isSecureContext&&typeof window.showSaveFilePicker==='function'){
          try{
            // Choose the location before PDF generation while user activation is available.
            handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:tr('PDF belgesi'),accept:{'application/pdf':['.pdf']}}],excludeAcceptAllOption:true});
            if(!/\.pdf$/i.test(handle.name)){toast(tr('PDF uzantılı bir dosya seçin.'),'err');return false;}
          }catch(e){
            if(e.name==='AbortError')return false;
            if(!['SecurityError','NotAllowedError','NotSupportedError'].includes(e.name))throw e;
          }
        }
        close({filename:handle?.name||filename,handle});
      }catch(e){toast(tr('Dosya konumu seçilemedi.')+' '+e.message,'err');return false;}
      finally{button.disabled=false;}
    }}
  ],{width:580,onOpen:()=>{input.focus();input.select();}});
  if(!choice||S.doc!==doc)return false;
  const state=pdfStateJSON(),bytes=await busy(tr('PDF hazırlanıyor…'),()=>buildPdf());let saved;
  if(choice.handle){
    let stream;
    try{stream=await choice.handle.createWritable();await stream.write(bytes);await stream.close();saved=true;toast(tr('PDF kaydedildi.'));}
    catch(e){if(stream)try{await stream.abort();}catch{}throw e;}
  }else saved=await saveFile(choice.filename,bytes);
  if(saved&&S.doc===doc){doc.name=choice.filename;if(pdfStateJSON()===state)doc.dirty=false;renderTabs();renderPane();}
  return !!saved;
}

let printJob=null,printPreparing=false;
function clearPrintJob(){
  if(!printJob)return;const job=printJob;printJob=null;
  job.frame.remove();for(const url of job.urls)URL.revokeObjectURL(url);
}
async function printDoc(){
  if(!S.doc)return false;
  if(printPreparing)return false;
  if(busyDepth)throw new UserErr(tr('Devam eden işlemin bitmesini bekleyin.'));
  printPreparing=true;
  commitEditing();clearPrintJob();
  const frame=h('iframe',{id:'printFrame',title:tr('Yazdırılacak PDF'),'aria-hidden':'true',style:{position:'fixed',left:'-10000px',top:'0',width:'1px',height:'1px',border:'0'}});
  const job={frame,urls:[]};printJob=job;
  const loaded=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=()=>reject(new UserErr(tr('Yazdırma görünümü açılamadı.')));});
  frame.srcdoc='<!doctype html><html><head><meta charset="utf-8"><title></title></head><body></body></html>';
  document.body.append(frame);
  try{
    await loaded;const target=frame.contentDocument;target.title=baseName(S.doc.name);target.documentElement.lang=uiLang;
    const style=target.createElement('style');target.head.append(style);
    style.textContent='@page{margin:0}html,body{margin:0;padding:0;background:white}*{box-sizing:border-box}.print-page{margin:0;padding:0;break-after:page;break-inside:avoid;overflow:hidden;display:grid;place-items:center}.print-page:last-child{break-after:auto}.print-page img{display:block;max-width:100%;max-height:100%;object-fit:contain}@media print{html,body{margin:0;padding:0}body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}';
    const namedPages=frame.contentWindow.CSS.supports('page','pdfpage');let defaultSize;
    await busy(tr('Yazdırma hazırlanıyor…'),async()=>{
      const pdf=await pdfjs.getDocument({data:await buildPdf(),isEvalSupported:false}).promise;
      try{
        for(let index=1;index<=pdf.numPages;index++){
          if(printJob!==job||!frame.isConnected)throw new UserErr(tr('Yazdırma iptal edildi.'));
          setBusyMsg(tr('Yazdırma hazırlanıyor…')+` ${index}/${pdf.numPages}`);
          const page=await pdf.getPage(index),natural=page.getViewport({scale:1}),scale=Math.min(200/72,Math.sqrt(16e6/(natural.width*natural.height))),viewport=page.getViewport({scale});
          const canvas=h('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
          const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
          let blob;
          try{await page.render({canvasContext:context,viewport,intent:'print',annotationMode:pdfjs.AnnotationMode.ENABLE}).promise;blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));}
          finally{canvas.width=canvas.height=0;}
          const url=URL.createObjectURL(blob);job.urls.push(url);
          const name='pdfpage'+index;
          if(!defaultSize){defaultSize=natural;style.textContent+=`@page{size:${natural.width}pt ${natural.height}pt;margin:0}`;}
          style.textContent+=`@page ${name}{size:${natural.width}pt ${natural.height}pt;margin:0}`;
          const sheet=namedPages?natural:defaultSize;
          const section=target.createElement('section');section.className='print-page';if(namedPages)section.style.setProperty('page',name);section.style.width=sheet.width+'pt';section.style.height=`calc(${sheet.height}pt - 0.1pt)`;
          const image=target.createElement('img');image.alt='';const ready=new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new UserErr(tr('Yazdırılacak sayfa hazırlanamadı.')));});
          image.style.width=natural.width+'pt';image.style.height=natural.height+'pt';
          image.src=url;section.append(image);target.body.append(section);await ready;
        }
      }finally{await pdf.destroy();}
    });
    // The local HTML print view does not depend on the browser's built-in PDF viewer.
    frame.contentWindow.addEventListener('afterprint',()=>setTimeout(()=>{if(printJob===job)clearPrintJob();},100),{once:true});
    frame.contentWindow.focus();frame.contentWindow.print();return true;
  }catch(e){if(printJob===job)clearPrintJob();throw e;}
  finally{printPreparing=false;}
}
const v013RenderToolbar=renderToolbar;
renderToolbar=function(){
  v013RenderToolbar();if(!S.doc)return;const save=$('#dtb .btn.primary');if(!save)return;
  save.after(h('button',{class:'btn sm',id:'saveAsBtn',type:'button',title:tr('Farklı kaydet (Ctrl+Shift+S)'),onclick:()=>guard(savePdfAs)},I('file-down',16),tr('Farklı kaydet')),
    h('button',{class:'btn sm',id:'printDocBtn',type:'button',title:tr('Yazdır (Ctrl+P)'),onclick:()=>guard(printDoc)},I('printer',16),tr('Yazdır')));
};
const v013OnKey=onKey;
onKey=function(event){
  const mod=event.ctrlKey||event.metaKey,key=event.key.toLowerCase();
  if(mod&&S.doc&&S.view==='doc'&&!document.querySelector('dialog[open]')&&(key==='p'||key==='s'&&event.shiftKey)){
    event.preventDefault();if(busyDepth)return;
    guard(key==='p'?printDoc:savePdfAs);return;
  }return v013OnKey(event);
};
const v013ExportPane=PANES.export;
PANES.export=function(){const pane=v013ExportPane();pane.append(h('div',{class:'document-output-actions'},
  h('button',{class:'btn wide',onclick:()=>guard(savePdfAs)},I('file-down',18),tr('Farklı kaydet')),
  h('button',{class:'btn wide',onclick:()=>guard(printDoc)},I('printer',18),tr('Yazdır')),
  h('p',{class:'hint'},tr('Yazıcı ve sayfa seçeneklerini tarayıcının yazdırma penceresinden seçin.'))));return pane;};
