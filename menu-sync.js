/* Only menu links cross this bridge. Account notes and passwords never do. */
(() => {
 const button=document.createElement('button');button.type='button';button.className='secondary-button';button.id='pc-menu-connect';button.textContent='PC 연결';
 button.title='PC의 MY HUB 업무 바로가기를 실행한 뒤 연결하세요.';
 document.getElementById('refresh-folders').before(button);
 let enabled=read('momo.pcMenuSync',false)===true, busy=false, again=false;
 async function sync(manual=false){
  if(!enabled)return;if(busy){again=true;return;}busy=true;button.disabled=true;button.textContent='PC 연결 중…';
  try{
   const response=await fetch('http://127.0.0.1:5175/menus/sync',{method:'POST',headers:{'Content-Type':'application/json','X-MyHub-Menus':'1'},body:JSON.stringify({boards:custom.map(b=>({...b,name:nameOverrides[b.id]||b.name,category:folderAssignments[b.id]||b.category})),deleted:[...deletedMenus]}),signal:AbortSignal.timeout(6000)});
   if(!response.ok)throw Error('bridge');const state=await response.json();
   if(!Array.isArray(state.boards)||!Array.isArray(state.deleted))throw Error('format');
   const removed=new Set([...deletedMenus,...state.deleted]);
   // Include additions made while this request was running, and never resurrect a deletion.
   const combined=new Map(custom.map(b=>[b.id,b]));
   for(const b of state.boards)if(b&&typeof b.id==='string'&&typeof b.name==='string'&&safeURL(b.url)&&!combined.has(b.id))combined.set(b.id,{...b,custom:true});
   const next=[...combined.values()].filter(b=>!removed.has(b.id));
   const changed=JSON.stringify(custom)!==JSON.stringify(next)||JSON.stringify([...deletedMenus].sort())!==JSON.stringify([...removed].sort());
   custom=next;deletedMenus=removed;
   // Direct storage avoids an endless change-event feedback loop.
   localStorage.setItem('momo.boards',JSON.stringify(custom));localStorage.setItem('momo.deletedMenus',JSON.stringify([...deletedMenus]));
   if(changed)render();button.textContent='PC 연결됨';button.title='메뉴 추가·삭제를 PC 실행창과 자동으로 동기화하고 있습니다.';
   if(manual)toast('PC와 메뉴를 연결했습니다. 추가·삭제가 자동 반영됩니다.');
  }catch{
   button.textContent='PC 연결 대기';button.title='MY HUB 업무 바로가기를 실행한 후 클릭하세요. 브라우저의 로컬 네트워크 접근 요청이 나오면 허용해주세요.';
   if(manual)toast('PC 실행창을 켜고 다시 연결해주세요. 로컬 네트워크 접근 요청이 나오면 허용해주세요.');
  }finally{busy=false;button.disabled=false;if(again){again=false;setTimeout(()=>sync(),300);}}
 }
 button.addEventListener('click',()=>{enabled=true;save('momo.pcMenuSync',true);sync(true);});
 window.addEventListener('myhub-menus-changed',()=>sync());
 window.addEventListener('focus',()=>sync());
 setInterval(()=>{if(!document.hidden)sync();},10000);
 if(enabled)sync();
})();
