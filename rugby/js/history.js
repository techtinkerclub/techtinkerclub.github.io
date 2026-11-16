// Snapshot history: one entry per edit gesture; no change to persistent drill format.
export function createHistory(limit=50){
 let past=[],future=[];
 return {
 reset(value){past=[JSON.stringify(value)];future=[]},
 record(value){const s=JSON.stringify(value);if(past.at(-1)===s)return;past.push(s);if(past.length>limit)past.shift();future=[]},
 undo(){if(past.length<2)return null;future.push(past.pop());return JSON.parse(past.at(-1))},
 redo(){if(!future.length)return null;const s=future.pop();past.push(s);return JSON.parse(s)},
 get canUndo(){return past.length>1},get canRedo(){return future.length>0}
 };
}
