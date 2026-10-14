/* Office Open XML exports: generate DOCX and XLSX with JSZip, without additional dependencies.
   Cells use inlineStr; PDF text is not executed as Excel formulas. */
const xml = s => String(s ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
async function extractedPages(pdf) {
  if(!pdfFontCache.has(pdf))pdfFontCache.set(pdf,pdf.getData().then(bytes=>metadataFromBytes(bytes)));
  const metadata=await pdfFontCache.get(pdf);
  const pages=[];
  for(let i=1;i<=pdf.numPages;i++){
    setBusyMsg(tr('Metin çıkarılıyor…')+` ${i}/${pdf.numPages}`);
    const p=await pdf.getPage(i),vp=p.getViewport({scale:1}),tc=await p.getTextContent();
    const underlineSegments=await underlineSegmentsFromPdfPage(p);
    let spans=tc.items.filter(it=>it.str?.trim()).map(it=>{
      const m=pdfjs.Util.transform(vp.transform,it.transform),size=Math.hypot(m[2],m[3])||12;
      const box={x:m[4],y:m[5]-size,w:it.width,h:size},baseline={x:m[4],y:m[5]},font=nearestFont(metadata[i-1]||[],box,baseline,it.str);
      return {text:it.str,x:m[4],y:m[5],w:it.width,h:size,bold:font?.weight==='bold'||/bold|black|heavy|semibold/i.test(font?.name||''),italic:font?.style==='italic'||/italic|oblique/i.test(font?.name||''),underline:isUnderlined({box,baseline,size},underlineSegments),fontName:font?.name?.replace(/^[A-Z]{6}\+/,''),size};
    }).sort((a,b)=>a.y-b.y||a.x-b.x);
    // Arabic shaping glyphs produce auxiliary control codes in some readers.
    // Read Arabic-layer Unicode text from MuPDF records using clean character mappings.
    if((spans.some(s=>/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s.text))||(metadata[i-1]||[]).some(l=>/[\u0600-\u08ff]/.test(l.text)&&!spans.some(s=>s.text===l.text)))&&(metadata[i-1]||[]).some(l=>/[\u0600-\u08ff]/.test(l.text)&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(l.text))){
      spans=(metadata[i-1]||[]).map(l=>{const size=l.font.size,box=l.bbox;return{text:l.text,x:l.x,y:l.y,w:box.w,h:size,size,bold:l.font.weight==='bold',italic:l.font.style==='italic',underline:isUnderlined({box,baseline:{x:l.x,y:l.y},size},underlineSegments),fontName:l.font.name.replace(/^[A-Z]{6}\+/,'')};}).sort((a,b)=>a.y-b.y||a.x-b.x);
    }
    const rows=[];
    for(const span of spans){
      const row=rows.find(r=>Math.abs(r.y-span.y)<Math.max(2,Math.min(r.size,span.size)*.35));
      if(row){row.spans.push(span);row.size=Math.max(row.size,span.size);}else rows.push({y:span.y,size:span.size,spans:[span]});
    }
    rows.sort((a,b)=>a.y-b.y);
    for(const row of rows){
      row.spans.sort((a,b)=>a.x-b.x);row.cells=[];
      let cell,prev;
      for(const span of row.spans){
        const gap=prev?span.x-(prev.x+prev.w):0;
        if(!cell||gap>Math.max(16,span.size*1.75)){cell={x:span.x,text:span.text,spans:[span]};row.cells.push(cell);}
        else{cell.text+=(gap>Math.max(1,span.size*.16)&&!/[\s]$/.test(cell.text)?' ':'')+span.text;cell.spans.push(span);}
        prev=span;
      }
      row.text=row.cells.map(c=>c.text).join('\t');
    }
    pages.push({width:vp.width,height:vp.height,rows,number:i});
  }
  return pages;
}
exportText=async function(){
  await busy(tr('Metin çıkarılıyor…'),()=>withBuiltDoc(async pdf=>{
    const pages=await extractedPages(pdf);
    if(!pages.some(p=>p.rows.length))throw new UserErr(tr('Çıkarılabilir metin yok. Önce OCR çalıştırın.'));
    const text=pages.map(p=>`--- ${tr('Sayfa')} ${p.number} ---\n`+p.rows.map(r=>r.text).join('\n')).join('\n\n');
    return saveFile(baseName(S.doc.name)+'.txt','\uFEFF'+text+'\n');
  }));
};
function docxRun(span){
  const name=span.fontName||'Arial',family=/Tinos|Times/i.test(name)?'Times New Roman':/Arimo|Arial|Helvetica/i.test(name)?'Arial':/Cousine|Courier/i.test(name)?'Courier New':name;
  const rtl=/[\u0600-\u08ff]/.test(span.text||'');
  return '<w:r><w:rPr><w:rFonts w:ascii="'+xml(family)+'" w:hAnsi="'+xml(family)+'" w:cs="'+xml(family)+'"/><w:sz w:val="'+Math.round(Math.min(96,Math.max(6,span.size))*2)+'"/>'+(span.bold?'<w:b/>':'')+(span.italic?'<w:i/>':'')+(span.underline?'<w:u w:val="single"/>':'')+(rtl?'<w:rtl/>':'')+'</w:rPr><w:t xml:space="preserve">'+xml(span.text)+'</w:t></w:r>';
}
async function exportDocx(mode='text'){
  await busy(tr('DOCX hazırlanıyor…'),()=>withBuiltDoc(async pdf=>{
    const zip=new JSZipLib(),relationships=[],body=[];
    const pages=mode==='text'?await extractedPages(pdf):[];
    if(mode==='text'&&!pages.some(p=>p.rows.length))throw new UserErr(tr('Çıkarılabilir metin yok. Önce OCR çalıştırın.'));
    let firstSize;
    for(let i=1;i<=pdf.numPages;i++){
      if(i>1&&mode==='text')body.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
      if(mode==='text'){
        const page=pages[i-1];firstSize=firstSize||page;
        for(const row of page.rows){
          const runs=[];let prev;
          for(const s of row.spans){
            if(prev&&s.x-prev.x-prev.w>Math.max(1,s.size*.16))runs.push(docxRun({text:' ',size:s.size}));
            runs.push(docxRun(s));prev=s;
          }
          body.push('<w:p><w:pPr><w:spacing w:after="60"/></w:pPr>'+runs.join('')+'</w:p>');
        }
        if(!page.rows.length)body.push('<w:p/>');
      }else{
        const page=await pdf.getPage(i);let vp=page.getViewport({scale:150/72});
        if(vp.width*vp.height>16e6)vp=page.getViewport({scale:150/72*Math.sqrt(16e6/(vp.width*vp.height))});
        const logical=page.getViewport({scale:1});firstSize=firstSize||logical;
        const canvas=h('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);
        await page.render({canvasContext:canvas.getContext('2d'),viewport:vp,background:'#fff'}).promise;
        const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',.94));canvas.width=canvas.height=0;
        zip.file(`word/media/page${i}.jpg`,blob);
        relationships.push(`<Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/page${i}.jpg"/>`);
        const maxW=Math.max(72,firstSize.width-56),maxH=Math.max(72,firstSize.height-72),factor=Math.min(maxW/logical.width,maxH/logical.height);
        const w=Math.round(logical.width*factor*12700),hh=Math.round(logical.height*factor*12700);
        body.push(`<w:p><w:pPr>${i>1?'<w:pageBreakBefore/>':''}<w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${w}" cy="${hh}"/><wp:docPr id="${i}" name="Page ${i}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${i}" name="Page ${i}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId${i}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${w}" cy="${hh}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`);
      }
    }
    const w=Math.round((firstSize?.width||595.28)*20),hh=Math.round((firstSize?.height||841.89)*20);
    const sect=`<w:sectPr><w:pgSz w:w="${w}" w:h="${hh}"/><w:pgMar w:top="560" w:right="560" w:bottom="560" w:left="560" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>`;
    zip.file('[Content_Types].xml',xmlHeader+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    zip.file('_rels/.rels',xmlHeader+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file('word/_rels/document.xml.rels',xmlHeader+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+relationships.join('')+'</Relationships>');
    zip.file('word/document.xml',xmlHeader+'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>'+body.join('')+sect+'</w:body></w:document>');
    return saveFile(baseName(S.doc.name)+'.docx',await zip.generateAsync({type:'blob',compression:'DEFLATE'}));
  }));
}
function excelColumn(n){let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
async function exportXlsx(){
  await busy(tr('XLSX hazırlanıyor…'),()=>withBuiltDoc(async pdf=>{
    const pages=await extractedPages(pdf),zip=new JSZipLib();
    if(!pages.some(p=>p.rows.length))throw new UserErr(tr('Çıkarılabilir metin yok. Önce OCR çalıştırın.'));
    const sheets=[],rels=[],types=[];
    for(const [index,page] of pages.entries()){
      const anchors=[];
      for(const row of page.rows)for(const c of row.cells){if(!anchors.some(x=>Math.abs(x-c.x)<12))anchors.push(c.x);}
      anchors.sort((a,b)=>a-b);
      if(anchors.length>16384||page.rows.length>1048576)throw new UserErr(tr('Excel sayfa sınırı aşıldı.'));
      const rows=page.rows.map((row,ri)=>{
        const cells=new Map();
        for(const c of row.cells){let col=0;for(let k=1;k<anchors.length;k++)if(Math.abs(anchors[k]-c.x)<Math.abs(anchors[col]-c.x))col=k;
          cells.set(col,(cells.has(col)?cells.get(col)+' ':'')+c.text);}
        return `<row r="${ri+1}">`+[...cells].sort((a,b)=>a[0]-b[0]).map(([ci,text])=>`<c r="${excelColumn(ci)}${ri+1}" t="inlineStr" s="1"><is><t xml:space="preserve">${xml(text)}</t></is></c>`).join('')+'</row>';
      });
      const cols=anchors.map((_,i)=>`<col min="${i+1}" max="${i+1}" width="28" customWidth="1"/>`).join('');
      zip.file(`xl/worksheets/sheet${index+1}.xml`,xmlHeader+'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>'+cols+'</cols><sheetData>'+rows.join('')+'</sheetData></worksheet>');
      sheets.push(`<sheet name="${xml(tr('Sayfa')+' '+(index+1))}" sheetId="${index+1}" r:id="rId${index+1}"/>`);
      rels.push(`<Relationship Id="rId${index+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index+1}.xml"/>`);
      types.push(`<Override PartName="/xl/worksheets/sheet${index+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
    }
    zip.file('xl/styles.xml',xmlHeader+'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
    rels.push(`<Relationship Id="rId${pages.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`);
    zip.file('xl/workbook.xml',xmlHeader+'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.join('')+'</sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels',xmlHeader+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+rels.join('')+'</Relationships>');
    zip.file('_rels/.rels',xmlHeader+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    zip.file('[Content_Types].xml',xmlHeader+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+types.join('')+'</Types>');
    return saveFile(baseName(S.doc.name)+'.xlsx',await zip.generateAsync({type:'blob',compression:'DEFLATE'}));
  }));
}
PANES.export=function(){
  const format=h('select',{class:'inp',id:'exportFormat','aria-label':tr('Biçim')},
    [['pdf','PDF'],['docx','Word (DOCX)'],['txt','Düz metin (TXT)'],['jpeg','Resim (JPEG)'],['png','Resim (PNG)'],['xlsx','Excel (XLSX)']].map(([v,l])=>h('option',{value:v},tr(l))));
  const dpi=h('select',{class:'inp'},[[72,'Ekran (72 dpi)'],[150,'Standart (150 dpi)'],[300,'Baskı (300 dpi)']].map(([v,l])=>h('option',{value:String(v)},tr(l))));dpi.value='150';
  const docx=h('select',{class:'inp'},h('option',{value:'text'},tr('Düzenlenebilir metin')),h('option',{value:'image'},tr('Sayfa görünümünü koru (görsel)')));
  const quality=h('input',{class:'inp',type:'number',min:'40',max:'100',step:'5',value:'92'});
  const df=h('div',{class:'field'},tr('Çözünürlük'),dpi),wf=h('div',{class:'field'},tr('Word çıktısı'),docx),qf=h('div',{class:'field'},tr('JPEG kalitesi (%)'),quality);
  const hint=h('p',{class:'hint'});
  function update(){
    df.hidden=!['png','jpeg'].includes(format.value);wf.hidden=format.value!=='docx';qf.hidden=format.value!=='jpeg';
    hint.textContent=tr(format.value==='pdf'?'PDF çıktısı tüm düzenlemeleri ve aranabilir OCR katmanını içerir.':format.value==='docx'?'Düzenlenebilir DOCX metni yeniden akıtır. Görsel modu görünümü korur ancak metin düzenlenemez.':format.value==='xlsx'?'Her PDF sayfası bir Excel sayfasına aktarılır. Sütunlar metin konumlarından tahmin edilir; sonuçları kontrol edin.':format.value==='txt'?'UTF-8 metin çıktısı, düzenlemeleri ve OCR metnini içerir.':'Birden çok sayfa resim olarak ZIP içinde indirilir.');
  }
  format.onchange=update;update();
  return h('div',null,h('div',{class:'field'},tr('Biçim'),format),df,wf,qf,
    h('button',{class:'btn primary wide',id:'exportButton',onclick:()=>guard(()=>{
      if(format.value==='pdf')return exportPDF();
      if(format.value==='docx')return exportDocx(docx.value);
      if(format.value==='txt')return exportText();if(format.value==='xlsx')return exportXlsx();
      return exportImages(+dpi.value,format.value,clamp(+quality.value||92,40,100)/100);
    })},I('file-down',18),tr('Dışa aktar')),hint,
    h('p',{class:'hint'},tr('Tarama sayfalarının metin çıktısı için önce OCR çalıştırın.')));
};

