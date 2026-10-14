// When selecting searchable scan layers or shaped Arabic bitmap text,
// replace both the invisible layer and its corresponding image pixels.
async function invisibleTextRuns(page){
  const source=S.doc?.sources.get(page.srcId);if(!source)return[];
  source.invisibleRuns=source.invisibleRuns||new Map();if(source.invisibleRuns.has(page.index))return source.invisibleRuns.get(page.index);
  const p=await source.pdf.getPage(page.index+1),ops=await p.getOperatorList(),vp=p.getViewport({scale:1,rotation:page.baseRot});
  let matrix=[1,0,0,1,0,0],textMatrix=[1,0,0,1,0,0],mode=0;const stack=[],runs=[];
  for(let i=0;i<ops.fnArray.length;i++){
    const op=ops.fnArray[i],args=ops.argsArray[i];
    if(op===pdfjs.OPS.save)stack.push({matrix:matrix.slice(),mode});
    else if(op===pdfjs.OPS.restore){const state=stack.pop();if(state){matrix=state.matrix;mode=state.mode;}}
    else if(op===pdfjs.OPS.transform)matrix=pdfjs.Util.transform(matrix,args);
    else if(op===pdfjs.OPS.setTextMatrix)textMatrix=args.slice();
    else if(op===pdfjs.OPS.moveText){textMatrix[4]+=args[0];textMatrix[5]+=args[1];}
    else if(op===pdfjs.OPS.setTextRenderingMode)mode=args[0];
    else if(op===pdfjs.OPS.showText&&mode===3){
      const text=args[0].map(g=>typeof g==='object'&&g?g.unicode||'':'').join('');const m=pdfjs.Util.transform(vp.transform,pdfjs.Util.transform(matrix,textMatrix));
      runs.push({text,x:m[4],y:m[5]});
    }
  }
  source.invisibleRuns.set(page.index,runs);return runs;
}
const visibleNativeCandidates=nativeCandidates;
nativeCandidates=async function(page){
  const candidates=await visibleNativeCandidates(page),runs=await invisibleTextRuns(page);
  for(const c of candidates)if(!c.scan){const a=(c.angle||0)*Math.PI/180,b=c.baseline||{x:c.box.x,y:c.box.y+c.box.h*.82};
    if(runs.some(r=>Math.hypot(r.x-b.x,r.y-b.y)<Math.max(3,c.size*.4)&&(r.text.trim()===c.text.trim()||[...r.text.trim()].reverse().join('')===c.text.trim()))){
      c.scan=true;
      if(/[\u0600-\u08ff]/.test(c.text)){
        // An invisible Latin-style glyph box may not cover the shaped Arabic image's
        // overhanging italic strokes and accents.
        const metrics=metricsFor({...c.fontInfo,text:c.text}),half=(metrics.lh-metrics.asc-metrics.desc)/2,margin=Math.ceil(c.size*.22)+2;
        const width=c.textWidth||c.box.w,top=-(metrics.asc+half)*c.size-margin,bottom=(metrics.desc+half)*c.size+margin;
        const corners=[[-margin,top],[width+margin,top],[width+margin,bottom],[-margin,bottom]].map(([x,y])=>({x:b.x+x*Math.cos(a)-y*Math.sin(a),y:b.y+x*Math.sin(a)+y*Math.cos(a)}));
        const x=Math.min(c.box.x,...corners.map(p=>p.x)),y=Math.min(c.box.y,...corners.map(p=>p.y));
        c.eraseBox={x,y,w:Math.max(c.box.x+c.box.w,...corners.map(p=>p.x))-x,h:Math.max(c.box.y+c.box.h,...corners.map(p=>p.y))-y};
      }
    }
  }return candidates;
};
