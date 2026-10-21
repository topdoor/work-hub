/* Merge browser tabs without losing additions. Explicit deletions always win. */
(function(root){
 function merge(lists,deleted=[]){
  const removed=new Set(deleted),items=new Map();
  for(const list of lists)for(const b of Array.isArray(list)?list:[])if(b&&typeof b.id==='string'&&typeof b.name==='string'&&typeof b.url==='string'&&!removed.has(b.id))items.set(b.id,b);
  return [...items.values()];
 }
 function read(key,fallback=[]){try{const v=JSON.parse(localStorage.getItem(key));return Array.isArray(v)?v:fallback;}catch{return fallback;}}
 function snapshot(incoming=[],deleted=[]){const removed=[...new Set([...read('momo.deletedMenus'),...deleted])];return {deleted:removed,boards:merge([read('momo.boards.backup'),read('momo.boards'),incoming],removed)};}
 function write(incoming=[],deleted=[]){
  const state=snapshot(incoming,deleted);
  localStorage.setItem('momo.boards.backup',JSON.stringify(state.boards));
  localStorage.setItem('momo.deletedMenus',JSON.stringify(state.deleted));
  localStorage.setItem('momo.boards',JSON.stringify(state.boards));
  return state;
 }
 root.MenuPersistence={merge,snapshot,write};
 if(typeof module!=='undefined')module.exports={merge};
})(typeof window!=='undefined'?window:globalThis);
