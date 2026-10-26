/* Common GitHub menu snapshot + optional PC publishing bridge. No account data. */
(() => {
 const button=document.createElement('button');button.type='button';button.className='secondary-button';button.id='pc-menu-connect';button.textContent='PC 연결';
 button.title='PC 실행창과 연결하면 추가·삭제한 메뉴가 공통 목록에 자동 게시됩니다.';
 document.getElementById('refresh-folders').before(button);
 const note=document.createElement('p');note.id='shared-menu-status';note.setAttribute('role','status');note.style.cssText='font-size:12px;color:#6f8199;margin:10px 0 0;line-height:1.7';
 document.querySelector('.board-toolbar').before(note);
 let enabled=read('momo.pcMenuSync',false)===true,busy=false,again=false,cloudBusy=false,cloud=null,publication=null;
 function pending(){
  if(!cloud)return custom.length>0||deletedMenus.size>0;
  const ids=new Set(cloud.boards.map(b=>b.id)),removed=new Set(cloud.deleted);
  return custom.some(b=>!ids.has(b.id)&&!removed.has(b.id))||[...deletedMenus].some(id=>!removed.has(id));
 }
 function showStatus(){
  if(!pending()){note.textContent=cloud?'공통 메뉴 최신 상태 · 다른 컴퓨터에서도 같은 목록을 볼 수 있습니다.':'공통 메뉴를 확인하는 중입니다…';return;}
  note.textContent=publication?.state==='published'?'공통 메뉴 게시 요청 완료 · 사이트 반영을 기다리고 있습니다.':publication?.state==='publishing'?'공통 메뉴를 GitHub에 게시하는 중입니다…':publication?.state==='error'?'이 PC에 저장됨 · 공통 게시 실패. 인터넷과 GitHub 로그인을 확인해주세요.':'이 기기에 저장됨 · 다른 컴퓨터에 반영하려면 PC 실행창을 켜고 PC 연결을 눌러주세요.';
 }
 function absorb(state){
  if(!state||!Array.isArray(state.boards)||!Array.isArray(state.deleted))throw Error('Invalid menu snapshot');
  if(state.boards.some(b=>!b||typeof b.id!=='string'||typeof b.name!=='string'||!safeURL(b.url))||state.deleted.some(id=>typeof id!=='string'))throw Error('Invalid menus');
  const combined=new Map(custom.map(b=>[b.id,b]));
  for(const b of state.boards)if(!combined.has(b.id))combined.set(b.id,{...b,custom:true});
  const next=MenuPersistence.write([...combined.values()],[...deletedMenus,...state.deleted]);
  const changed=JSON.stringify(custom)!==JSON.stringify(next.boards)||JSON.stringify([...deletedMenus].sort())!==JSON.stringify([...next.deleted].sort());
  custom=next.boards;deletedMenus=new Set(next.deleted);if(changed)render();
 }
 window.MenuSync={async commit(boards=[],deleted=[]){
  let response;
  try{response=await fetch('http://127.0.0.1:5175/menus/commit',{method:'POST',headers:{'Content-Type':'application/json','X-MyHub-Menus':'1'},body:JSON.stringify({boards,deleted}),signal:AbortSignal.timeout(180000)});}
  catch{throw Error('공통 저장을 확인하지 못했습니다. MY HUB PC 실행창을 켜고 로컬 네트워크 연결을 허용한 뒤 다시 시도해주세요. 입력 내용은 유지됩니다.');}
  if(response.status===404)throw Error('PC 실행창을 닫았다가 다시 열어주세요. 저장 기능 업데이트가 필요합니다.');
  const state=await response.json();
  if(!response.ok||state.committed!==true)throw Error(state.error||'공통 저장을 확인하지 못했습니다. 다시 시도해주세요.');
  if(boards.some(b=>!state.boards.some(saved=>saved.id===b.id))||deleted.some(id=>!state.deleted.includes(id)))throw Error('메뉴 저장 결과가 일치하지 않습니다. 입력 내용을 유지합니다.');
  enabled=true;save('momo.pcMenuSync',true);publication=state.publication;
  try{absorb(state);}catch{custom=state.boards;deletedMenus=new Set(state.deleted);render();}
  button.textContent='PC 연결됨';showStatus();return state;
 }};
 async function refreshShared(){
  if(cloudBusy)return;cloudBusy=true;
  try{
   const url=new URL('shared-menus.json',document.baseURI);url.searchParams.set('t',Date.now());
   const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('snapshot');
   const state=await response.json();if(state.version!==1)throw Error('version');absorb(state);cloud=state;showStatus();
  }catch{note.textContent='공통 메뉴를 불러오지 못했습니다. 저장된 메뉴는 유지됩니다. 잠시 후 다시 확인합니다.';}
  finally{cloudBusy=false;}
 }
 async function sync(manual=false){
  if(!enabled){showStatus();return;}if(busy){again=true;return;}busy=true;button.disabled=true;button.textContent='PC 연결 중…';
  try{
   const latest=MenuPersistence.snapshot(custom,[...deletedMenus]);custom=latest.boards;deletedMenus=new Set(latest.deleted);
   const response=await fetch('http://127.0.0.1:5175/menus/sync',{method:'POST',headers:{'Content-Type':'application/json','X-MyHub-Menus':'1'},body:JSON.stringify({boards:custom.map(b=>({...b,name:nameOverrides[b.id]||b.name,category:folderAssignments[b.id]||b.category})),deleted:[...deletedMenus]}),signal:AbortSignal.timeout(6000)});
   if(!response.ok)throw Error('bridge');const state=await response.json();absorb(state);publication=state.publication||null;
   button.textContent='PC 연결됨';button.title='메뉴 추가·삭제를 공통 목록에 자동 게시합니다.';showStatus();
   if(!state.publication)note.textContent='PC 실행창이 이전 버전입니다. 닫았다가 다시 열어야 공통 게시를 사용할 수 있습니다.';
   if(manual)toast('PC와 연결했습니다. 공통 게시 상태는 메뉴 목록 위에 표시됩니다.');
  }catch{
   button.textContent='PC 연결 대기';button.title='MY HUB 업무 바로가기를 켜고, 브라우저의 로컬 네트워크 접근을 허용해주세요.';showStatus();
   if(manual)toast('PC 실행창을 켜고 다시 연결해주세요. 로컬 네트워크 접근 요청은 허용해주세요.');
  }finally{busy=false;button.disabled=false;if(again){again=false;setTimeout(()=>sync(),300);}}
 }
 button.addEventListener('click',()=>{enabled=true;save('momo.pcMenuSync',true);sync(true);});
 window.addEventListener('myhub-menus-changed',()=>{showStatus();sync();});
 window.addEventListener('focus',()=>{refreshShared();sync();});
 document.getElementById('refresh-folders').addEventListener('click',()=>refreshShared());
 setInterval(()=>{if(!document.hidden){refreshShared();sync();}},15000);
 refreshShared().then(()=>{if(enabled)sync();});
})();
