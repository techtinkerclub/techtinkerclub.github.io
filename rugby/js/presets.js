// Suggested coaching areas, not mandatory match dimensions. Coordinates are fractional.
const corners=[[0,0],[1,0],[0,1],[1,1]];
const sides=(n)=>Array.from({length:n+1},(_,i)=>[[0,i/n],[1,i/n]]).flat();
export const PRESETS=[
 {id:'grid5',name:'5 × 5 m · small grid',length:5,width:5,points:corners},
 {id:'grid10',name:'10 × 10 m · square grid',length:10,width:10,points:corners},
 {id:'grid15',name:'15 × 15 m · square grid',length:15,width:15,points:corners},
 {id:'channel',name:'20 × 5 m · narrow channel',length:20,width:5,points:sides(4)},
 {id:'widechannel',name:'20 × 10 m · running channel',length:20,width:10,points:sides(4)},
 {id:'gates',name:'20 × 15 m · gates',length:20,width:15,points:[...corners,...[.25,.5,.75].flatMap(y=>[[.4,y],[.6,y]])]},
 {id:'lanes',name:'20 × 15 m · three channels',length:20,width:15,points:[0,1/3,2/3,1].flatMap(x=>[0,.5,1].map(y=>[x,y]))},
 {id:'game',name:'30 × 20 m · small-sided area',length:30,width:20,points:sides(3)},
 {id:'u10',name:'60 × 35 m · U10 playing area',length:60,width:35,points:corners}
];
export function presetPositions(preset){return preset.points.map(([x,y])=>({x:42+x*816,y:37+y*466,rot:0}))}
