let savedLanguage='en';try{savedLanguage=localStorage.getItem('pdf-workshop.language')||'en';}catch{}
uiLang=['tr','en','de'].includes(savedLanguage)?savedLanguage:'en';
aboutDialog=usageGuideDialog;
S.pref.stamp.text=tr('ONAYLANDI');
init();
if($('#languageSelect')){
  applyLanguage(uiLang);
  $('#languageSelect').addEventListener('change',e=>applyLanguage(e.target.value));
  Object.assign(window.__pdfWorkshop,{runOCR,exportDocx,exportXlsx,exportText,exportImages,exportPDF,saveOcrPdf,savePdfAs,printDoc,closeDoc,nativeCandidates,editNativeText,pageLinks,protectBytes,getMuPDF,applyLanguage,tr,extractedPages,addItem,snapshot,undo,redo,runSearch,writeLinks,extraFontsReady,FAMILIES,OCR_LANGUAGES,openUrlDialog,placeAt,pngStampFlow,metricsFor,fontBytes,metadataFromBytes,usageGuideDialog});
  const oldRenderHome=renderHome;
  renderHome=function(){oldRenderHome();const actions=$('#view-home .acts');if(actions)actions.append(h('button',{class:'btn',onclick:()=>guard(openUrlDialog)},I('link',18),tr('URL’den PDF aç')));};
  renderHome();
}
})();
