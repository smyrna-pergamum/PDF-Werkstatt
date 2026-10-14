const OCR_LANGUAGES=[['tur','Türkçe'],['eng','İngilizce'],['deu','Almanca'],['fra','Fransızca'],['spa','İspanyolca'],['ita','İtalyanca'],['por','Portekizce'],['nld','Felemenkçe'],['pol','Lehçe'],['rus','Rusça'],['ukr','Ukraynaca'],['ell','Yunanca'],['ara','Arapça'],['fas','Farsça']];
async function exportPDF(){if(!S.doc)return;const bytes=await busy(tr('PDF hazırlanıyor…'),()=>buildPdf());return saveFile(baseName(S.doc.name)+'.pdf',bytes);}
async function openUrlInTabFlow(){
  const input=h('input',{class:'inp',type:'url',placeholder:'https://example.com/document.pdf','aria-label':tr('PDF bağlantısı')});
  const url=await dialog(tr('URL’den PDF aç'),h('div',null,h('p',null,tr('Bağlantı yeni tarayıcı sekmesinde açılır. PDF’yi oradan indirip bu programa dosya olarak ekleyin.')),input),[
    {label:tr('Vazgeç'),value:null},{label:tr('Yeni sekmede aç'),kind:'primary',onClick:close=>{
      try{const link=safeURL(input.value,true);window.open(link,'_blank','noopener,noreferrer');close(link);}catch(e){toast(e.message,'err');return false;}
    }}],{onOpen:()=>input.focus()});
  if(!url)return;
  const link=h('a',{href:url,target:'_blank',rel:'noopener noreferrer',class:'btn'},tr('Bağlantıyı yeniden aç'));
  const files=await dialog(tr('İndirilen PDF’yi aktar'),h('div',null,h('ol',{class:'usage-steps'},
    h('li',null,tr('Yeni sekmede PDF’yi açın ve indirin.')),h('li',null,tr('PDF Atölyesi sekmesine dönün.')),h('li',null,tr('Aşağıdaki düğmeyle indirdiğiniz PDF’yi seçin.'))),link,
    h('p',{class:'hint'},tr('Tarayıcı indirme klasörünüzü otomatik okuyamaz. Aktarılacak dosyayı siz seçersiniz.'))),[
      {label:tr('Kapat'),value:null},{label:tr('İndirilen PDF’yi seç'),kind:'primary',onClick:async close=>{const files=await pickFiles(ACCEPT_PDF,false);if(files.length)close(files);else return false;}}
    ],{width:600});
  if(files?.length)await openFiles(files);
}
PANES.ocr=function(){
  const language=h('select',{class:'inp',id:'ocrLanguage','aria-label':tr('OCR dili')},h('option',{value:'tur+eng+deu'},'Türkçe + English + Deutsch'),OCR_LANGUAGES.map(([v,l])=>h('option',{value:v},tr(l))),h('option',{value:'multi'},tr('Birden fazla dil seç')));
  language.value=S.pref.ocrLanguage||'eng';
  const chosen=new Set((S.pref.ocrCustom||'eng').split('+')),multi=h('div',{class:'ocr-language-grid'});
  for(const[code,label]of OCR_LANGUAGES){const checkbox=h('input',{type:'checkbox',value:code});checkbox.checked=chosen.has(code);multi.append(h('label',{class:'check'},checkbox,tr(label)));}
  multi.hidden=language.value!=='multi';language.onchange=()=>{S.pref.ocrLanguage=language.value;multi.hidden=language.value!=='multi';};
  const scope=h('select',{class:'inp','aria-label':tr('Sayfalar')},[['all','Tüm sayfalar'],['current','Geçerli sayfa'],['selected','Seçili sayfalar']].map(([v,l])=>h('option',{value:v},tr(l))));
  scope.value=S.pref.ocrScope||'all';scope.onchange=()=>S.pref.ocrScope=scope.value;
  const skip=h('input',{type:'checkbox'});skip.checked=true;
  const autoSave=h('input',{type:'checkbox',id:'ocrAutoSave',onchange:e=>S.pref.ocrAutoSave=e.target.checked});autoSave.checked=!!S.pref.ocrAutoSave;
  const page=S.doc.pages[S.cur],data=page?.ocr,output=h('textarea',{class:'inp',rows:'7',readonly:true,'aria-label':tr('OCR sonucu')});
  output.value=data?.lines?.map((line,i)=>page.items.find(it=>it.native?.key===`ocr:${i}`)?.text??line.text).join('\n')||'';
  const styles=data?h('details',{class:'ocr-format-details'},h('summary',null,tr('Tanınan yazı biçimleri')),h('div',null,data.lines.slice(0,60).map((line,i)=>h('button',{class:'font-report-row',type:'button',onclick:()=>guard(async()=>{
    const candidate=(await nativeCandidates(page)).find(c=>c.key===`ocr:${i}`);
    if(candidate)await inspectFontDialog(page,candidate);else dialog(tr('Yazı biçimi bilgisi'),formatDetails(line.format),[{label:tr('Kapat'),value:null}]);
  })},h('span',{noI18n:true},line.text.slice(0,75)),h('small',{noI18n:true},formatDescription(line.format||{})))))):null;
  return h('div',null,h('p',{class:'hint'},tr('14 OCR dili cihazınıza gömülüdür. İnternet gerekmez. Aynı anda yalnızca belgedeki dilleri seçmek doğruluğu ve hızı artırır.')),
    h('div',{class:'field'},tr('OCR dili'),language),multi,h('div',{class:'field'},tr('Sayfalar'),scope),h('label',{class:'check'},skip,tr('Metin katmanı olan sayfaları atla')),
    h('label',{class:'check'},autoSave,tr('OCR tamamlanınca PDF olarak kaydet')),
    h('button',{class:'btn primary wide',disabled:ocrRunning,onclick:()=>guard(async()=>{
      const saveAfter=autoSave.checked;
      const selected=language.value==='multi'?$$('input:checked',multi).map(e=>e.value).join('+'):language.value;
      if(!selected)throw new UserErr(tr('En az bir OCR dili seçin.'));S.pref.ocrCustom=selected;
      const pages=scope.value==='current'?[S.doc.pages[S.cur]]:scope.value==='selected'?selectedPages():S.doc.pages;
      if(!pages.length)throw new UserErr(tr('Önce sayfaları düzenle aracında sayfa seçin.'));
      const result=await runOCR(pages,selected,skip.checked);
      if(saveAfter&&result?.completed&&!result.cancelled&&S.doc===result.document&&hasOcrText(S.doc))await saveOcrPdf();
    })},I('scan-text',18),tr('OCR çalıştır')),
    ocrPdfControls(),
    data?h('div',null,h('h4',null,tr('Geçerli sayfanın sonucu')),h('p',{class:'stat'},tr('Güven oranı')+`: ${Math.round(data.confidence||0)}%`),output,styles,
      h('button',{class:'btn wide',onclick:()=>{openTool('edit');setMode('native');}},tr('Tanınan metni düzenle'))):null,
    h('p',{class:'hint'},tr('Font adı taramada kesin bilinemez. Font tahmini, kalın/italik/alt çizgi ve yaklaşık punto ayrıca gösterilir.')));
};
const v012CommentPane=PANES.comment;
PANES.comment=function(){
  const pane=v012CommentPane(),input=h('textarea',{class:'inp',rows:'4',placeholder:tr('Yorumunuzu klavyeden yazın…'),'aria-label':tr('Yorum metni')});
  const area=h('div',{class:'comment-compose'},h('h4',null,tr('Klavyeden yorum yaz')),input,h('button',{class:'btn primary wide',onclick:()=>{
    const text=input.value.trim();if(!text){toast(tr('Önce yorum metnini yazın.'),'err');return;}
    const values={text,...preferencesStyle()};try{supportedText(text,values);}catch(e){toast(e.message,'err');return;}
    setMode('typedComment',values);
  }},I('message-square-text',17),tr('Yorumu sayfaya yerleştir')),h('p',{class:'hint'},tr('Metni yazın, düğmeye basın ve sayfada konum seçin. Yorumu sonradan metin biçimi panelinden düzenleyebilirsiniz.')));
  pane.prepend(area);return pane;
};
CLICK_MODES.add('typedComment');CLICK_MODES.add('pngstamp');MODE_HINT.typedComment='Yorumun yerini sayfaya tıklayarak seçin.';MODE_HINT.pngstamp='PNG damganın yerini sayfaya tıklayarak seçin.';
const v012StampPane=PANES.stamp;
async function pngStampFlow(){
  const files=await pickFiles('image/png,.png',false);if(!files.length)return;
  const bytes=new Uint8Array(await files[0].arrayBuffer());if(!isPng(bytes))throw new UserErr(tr('PNG biçiminde bir damga seçin.'));
  const id=await registerImage(bytes,'image/png');S.pref.pngStamp=id;setMode('pngstamp',id);
}
PANES.stamp=function(){
  const pane=v012StampPane(),id=S.pref.pngStamp,image=S.images.get(id);
  pane.prepend(h('div',{class:'png-stamp-panel'},h('button',{class:'btn primary wide',onclick:()=>guard(pngStampFlow)},I('image-plus',18),tr('PNG damga yükle')),
    h('p',{class:'hint'},tr('Şeffaf arka planlı PNG desteklenir. Yükledikten sonra sayfaya tıklayın; damgayı taşıyıp boyutlandırabilirsiniz.')),
    image?h('button',{class:'stamp-image-preview',onclick:()=>setMode('pngstamp',id),title:tr('Bu damgayı bas')},h('img',{src:image.url,alt:tr('PNG damga')})):null));
  return pane;
};
function opacityControl(value,onUpdate,id){
  const input=h('input',{id,type:'range',min:'0',max:'100',step:'5',value:String(Math.round(value*100)),'aria-label':tr('Karartma opaklığı')}),label=h('output',{'for':id},Math.round(value*100)+'%');
  input.onchange=()=>onUpdate(+input.value/100);input.oninput=()=>label.textContent=input.value+'%';
  return h('div',{class:'field'},tr('Karartma opaklığı'),h('div',{class:'opacity-control'},input,label));
}
const v012RedactPane=PANES.redact;
PANES.redact=function(){const pane=v012RedactPane();pane.prepend(opacityControl(S.pref.redactOpacity,v=>{S.pref.redactOpacity=v;},'newRedactOpacity'),h('p',{class:'hint'},tr('Opaklık yalnızca dolgunun koyuluğunu değiştirir. Alttaki metin ve görüntü kaydedilen PDF’den kalıcı olarak kaldırılır.')));return pane;};
const v012Pane=renderPane;
renderPane=function(){v012Pane();if(S.doc&&S.sel){const it=itemOf(pageById(S.sel.pageId),S.sel.itemId);if(it?.role==='pngstamp')$('#pane .selbox .t').firstChild.textContent=tr('PNG damga');}};
async function usageGuideDialog(){
  const body=h('div',{class:'usage-guide'},h('p',{class:'lead'},tr('PDF Atölyesi v0.1.3: belgeler cihazınızda işlenir. İhtiyaç duyduğunuz aracı seçerek başlayın.')));
  const sections=[
    ['Dosya ve bağlantı açma','Bilgisayarınızdaki PDF’yi Dosya seç düğmesiyle veya sürükleyerek açın. URL bağlantısı yeni sekmede açılır; indirilen dosyayı programa seçerek aktarın.'],
    ['Metin düzenleme ve biçim','PDF’i düzenle → Mevcut metni düzenle seçin, yazıya tıklayın. Font, kalın, italik, alt çizgi, punto ve renk seçebilirsiniz. Kaydetme eski metni kaldırır. Seçili metnin biçimini sağ panelden sonradan değiştirebilirsiniz.'],
    ['Yazı biçimini tanıma','Yazı biçimini tanı aracı PDF’deki font adını ve boyutunu gösterir. Taramalarda önce OCR çalıştırın. OCR font bilgisi, ekli fontlar arasında bir görsel tahmindir; özgün fontu kesin olarak doğrulamaz.'],
    ['OCR ve diller','OCR aracında dili ve sayfaları seçip tanımayı başlatın. Sonrasında Düzeni koruyarak PDF kaydet düğmesini kullanın. Sayfaların görünümü korunur; tanınan yazılar PDF’de aranabilir ve seçilebilir olur. OCR tamamlanınca PDF olarak kaydet seçeneği otomatik indirmeyi açar. Tüm belge kaydedilir. Sonuçları kontrol edin.'],
    ['Yorumlar ve PNG damgalar','Yorum ekle panelinde klavyeden metin yazıp sayfaya yerleştirin. Damga panelinde PNG damga yükleyin; şeffaflık korunur. Damgayı sürükleyebilir ve köşesinden boyutlandırabilirsiniz.'],
    ['Karartma ve opaklık','Alanı çizip opaklığı ayarlayın. Kaydedilen PDF’de o alanın alttaki içeriği kaldırılır; opaklık dolgunun koyuluğunu belirler. Karartılan sayfalar resme dönüştürülür.'],
    ['Kaydetme ve dışa aktarma','Kaydet, PDF dışa aktar veya Farklı kaydet ile PDF oluşturun. Farklı kaydet yeni dosya adı seçmenizi sağlar; desteklenen tarayıcılarda konumu da seçebilirsiniz. DOCX, TXT, XLSX, JPEG ve PNG çıktıları da kullanılabilir. Karmaşık tabloları kontrol edin.'],
    ['Yazıcıdan yazdırma','Üst çubuktaki Yazdır düğmesini veya Ctrl+P kullanın. Tarayıcının yazdırma penceresinde yazıcıyı, kâğıdı, sayfa aralığını ve ölçeği seçin. Mevcut düzenlemeler çıktıya uygulanır. Fiziksel yazıcının kenar boşlukları ve kâğıt boyutu görünümü etkileyebilir.'],
    ['Parola ile koruma','PDF’yi koru aracında açılış parolasını iki kez girin. İzinleri seçip korumalı PDF indirin. Bu işlem AES-256 şifreleme kullanır. Parolayı saklayın; program parolayı kalıcı olarak tutmaz.'],
    ['Yerel çalışma ve güvenlik','Çevrimdışı HTML gerekli motorları, fontları ve dil modellerini içerir. Belge işleme sunucuya yükleme gerektirmez. Dış bağlantı açma için internet gerekir. Tema, arayüz dili ve özellikle hatırlanması seçilen imzalar tarayıcıda tutulabilir.'],
    ['Kısayollar','Ctrl+O: aç · Ctrl+S: kaydet · Ctrl+Shift+S: farklı kaydet · Ctrl+P: yazdır · Ctrl+Z: geri al · Ctrl+Y: yinele · Ctrl+F: ara · Delete: seçileni sil · Esc: aracı bırak. Uzun metinlerde satır taşmasını kontrol edin.'],
  ];
  for(const [title,text]of sections)body.append(h('details',null,h('summary',null,tr(title)),h('p',null,tr(text))));
  body.append(h('details',null,h('summary',null,tr('Açık kaynak ve lisanslar')),h('p',null,'PDF.js · pdf-lib · fontkit · JSZip · Tesseract.js · MuPDF (AGPL-3.0-or-later) · Inter · Arimo · Tinos · Cousine · Noto · DejaVu · Dancing Script.'),h('p',null,tr('Kaynak kod, bileşen lisansları ve sürüm notları ZIP paketindeki README dosyasındadır.'))));
  return dialog(tr('Kullanım rehberi'),body,[{label:tr('Kapat'),kind:'primary',value:true}],{width:800});
}

