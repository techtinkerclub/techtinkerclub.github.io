// First frame is a stationary setup hold. Legacy zero-second drills are unchanged.
export function setupSeconds(d){const n=Number(d?.frames?.[0]?.seconds);return Number.isFinite(n)?Math.max(0,Math.min(30,n)):0}
export function stepEndSeconds(d,i){return (d?.frames||[]).slice(0,i+1).reduce((t,f,k)=>t+(k===0?setupSeconds(d):Math.max(0,Number(f.seconds)||0)),0)}
export function drillSeconds(d){return stepEndSeconds(d,(d?.frames?.length||0)-1)}
export function stepStartSeconds(d,i){return i<=0?0:stepEndSeconds(d,i-1)}
export function stepLocation(d,t){const frames=d?.frames||[];if(!frames.length)return {i:0,p:1};const hold=setupSeconds(d);if(t<=0||t<hold)return {i:0,p:hold?Math.max(0,t)/hold:1};if(frames.length===1)return {i:0,p:1};let start=hold;for(let i=1;i<frames.length;i++){const length=Math.max(0,Number(frames[i].seconds)||0),end=start+length;if(t<=end||i===frames.length-1)return {i,p:length?Math.max(0,Math.min(1,(t-start)/length)):1};start=end}return {i:frames.length-1,p:1}}
