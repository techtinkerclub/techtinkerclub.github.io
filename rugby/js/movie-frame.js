// Never expose in-progress drawing to MediaRecorder. Both canvases have native output pixels.
export function createMovieFrame(width,height,makeCanvas=()=>document.createElement('canvas')){
 const canvas=makeCanvas(),stage=makeCanvas();
 canvas.width=stage.width=width;canvas.height=stage.height=height;
 const ctx=stage.getContext('2d',{alpha:false}),published=canvas.getContext('2d',{alpha:false});
 if(!ctx||!published)throw Error('Canvas is unavailable.');
 let busy=false,ready=false;
 async function present(paint){
  if(busy)throw Error('Overlapping movie frames.');
  busy=true;
  try{
   await paint(ctx);
   // One whole opaque surface, published synchronously. No clear, partial draws
   // or awaits on the captured canvas. A failed paint leaves the last frame intact.
   published.drawImage(stage,0,0);
   ready=true;
  }finally{busy=false}
 }
 return {canvas,ctx,present,get ready(){return ready}};
}
