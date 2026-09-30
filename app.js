const $ = s => document.querySelector(s);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 home:'<path d="m3 10 9-7 9 7v10H15v-7H9v7H3z"/>',star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',folder:'<path d="M3 7V5a1 1 0 0 1 1-1h6l2 3h8a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',shield:'<path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6z"/><path d="m8 12 3 3 5-6"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',plus:'<path d="M12 4v16M4 12h16"/>',refresh:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.7 7a7 7 0 0 1 12-1L20 9M4 15l2.3 3a7 7 0 0 0 12-1"/>',list:'<path d="M8 5h13M8 12h13M8 19h13M3 5h.1M3 12h.1M3 19h.1"/>',arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',back:'<path d="M20 12H5m6-6-6 6 6 6"/>',external:'<path d="M14 3h7v7m0-7L10 14M10 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',chart:'<path d="M4 20h17M6 16v-5m6 5V7m6 9V3"/>',document:'<path d="M14 3H5v18h14V8zm0 0v5h5M8 12h8M8 16h6"/>',tasks:'<path d="m3 6 2 2 3-4m3 2h10M3 13l2 2 3-4m3 2h10M3 20l2 2 3-4m3 2h10"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18M7 15h3m4 0h3m-10 3h3"/>',table:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',truck:'<path d="M2 5h12v12H2zm12 5h5l3 4v3h-8"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>'
};
function icon(name) { return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.folder}</svg>`; }
function hydrate(root=document) { root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon)); }
function read(key,fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function save(key,value) { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch { toast('저장 공간을 사용할 수 없어 이번 화면에서만 유지됩니다.'); return false; } }
function safeURL(value) { try { return ['https:','http:'].includes(new URL(value).protocol); } catch { return false; } }
let imported = Array.isArray(window.DASHBOARD_CATALOG) ? window.DASHBOARD_CATALOG : [];
const savedBoards = read('momo.boards',[]);
let custom = (Array.isArray(savedBoards)?savedBoards:[]).filter(b=>b && typeof b.id==='string' && typeof b.name==='string' && safeURL(b.url)).map(b=>({...b,kind:'external',category:'내 링크',color:'slate',art:'document',custom:true}));
let boards = [...imported,...custom];
const savedFavorites=read('momo.favorites',[]), savedRecent=read('momo.recent',[]);
let favorites=new Set(Array.isArray(savedFavorites)?savedFavorites:[]);
let recent=Array.isArray(savedRecent)?savedRecent.filter(id=>typeof id==='string'):[];
let currentView='all', category='all', layout=read('momo.layout','grid')==='list'?'list':'grid';
let lastOpener=null, toastTimer, greetingIndex=0;
const categoryNames=()=>[...new Set(boards.map(b=>b.category))];
function toast(message) { $('#toast').textContent=message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3500); }
function art(b) {
 const type=b.art||'document'; const content=type==='chart'?'<div class="preview-bars">'+ '<i></i>'.repeat(5)+'</div><span class="preview-chart"></span>': type==='calendar'||type==='table'?'<div class="preview-calendar">'+'<i></i>'.repeat(15)+'</div>':type==='tasks'?'<div class="preview-task">'+'<i></i>'.repeat(3)+'</div>':'<div class="preview-document">'+'<i></i>'.repeat(3)+'</div>';
 const color=['blue','slate','teal','indigo'].includes(b.color)?b.color:'blue';
 return `<div class="card-art ${color}" aria-hidden="true"><div class="preview-window"><div class="preview-toolbar"><i></i><i></i><i></i></div>${content}</div><span class="art-icon">${icon(type)}</span></div>`;
}
function card(b) {
 const opening=b.kind==='local'?`<button class="card-open" data-open="${esc(b.id)}" aria-label="${esc(b.name)} 열기">`:`<a class="card-open" data-open="${esc(b.id)}" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(b.name)} 새 탭에서 열기">`;
 return `<article class="board-card"><button class="favorite ${favorites.has(b.id)?'selected':''}" data-favorite="${esc(b.id)}" aria-label="${esc(b.name)} 즐겨찾기" aria-pressed="${favorites.has(b.id)}">${icon('star')}</button>${opening}${art(b)}<div class="card-content"><h3>${esc(b.name)}</h3><p>${esc(b.description||'필요한 업무 화면으로 바로 이동하세요.')}</p><div class="card-bottom"><span class="card-tag">${icon('folder')}${esc(b.category)}</span><span class="open-label">${b.kind==='local'?'살펴보기':'새 탭'}${icon(b.kind==='local'?'arrow':'external')}</span></div></div>${b.kind==='local'?'</button>':'</a>'}${b.custom?`<button class="custom-delete" data-delete="${esc(b.id)}" aria-label="${esc(b.name)} 링크 삭제">${icon('trash')}</button>`:''}</article>`;
}
function renderCategories() {
 const categories=categoryNames();
 $('#folder-nav').innerHTML=categories.map(c=>`<button class="nav-item folder-item ${category===c?'active':''}" data-category="${esc(c)}" aria-pressed="${category===c}">${icon('folder')}${esc(c)}<span class="folder-count">${boards.filter(b=>b.category===c).length}</span></button>`).join('');
 $('#category-filters').innerHTML=['all',...categories].map(c=>`<button class="filter-chip ${category===c?'active':''}" data-category="${esc(c)}" aria-pressed="${category===c}">${c==='all'?'전체':esc(c)}</button>`).join('');
}
function render() {
 if(category!=='all'&&!categoryNames().includes(category)) category='all';
 let shown=currentView==='recent'?recent.map(id=>boards.find(b=>b.id===id)).filter(Boolean):boards.filter(b=>currentView!=='favorites'||favorites.has(b.id));
 if(category!=='all') shown=shown.filter(b=>b.category===category);
 const query=$('#search').value.trim().toLocaleLowerCase();
 shown=shown.filter(b=>`${b.name} ${b.category} ${b.description||''} ${b.folder||''}`.toLocaleLowerCase().includes(query));
 $('#nav-count').textContent=boards.length; $('#total-count').textContent=boards.length; $('#folder-count').textContent=new Set(imported.map(b=>b.folder)).size; $('#board-count').textContent=shown.length;
 const title=category!=='all'?category:({all:'내 대시보드',favorites:'즐겨찾기',recent:'최근 본 대시보드'})[currentView];
 $('#boards-title').textContent=title; $('#breadcrumb').textContent=category!=='all'?category:currentView==='all'?'대시보드 홈':title;
 document.querySelectorAll('[data-view]').forEach(b=>{const selected=b.dataset.view===currentView&&category==='all';b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
 renderCategories();
 $('#board-grid').classList.toggle('list',layout==='list');
 ['grid','list'].forEach(mode=>{$(`#${mode}-view`).classList.toggle('active',layout===mode);$(`#${mode}-view`).setAttribute('aria-pressed',String(layout===mode));});
 $('#board-grid').innerHTML=shown.map(card).join('');
 if(!shown.length) $('#board-grid').innerHTML=`<div class="empty"><span>${icon(query?'search':currentView==='favorites'?'star':'clock')}</span><strong>${query?'검색 결과가 없습니다.':currentView==='favorites'?'즐겨찾는 보드를 모아보세요.':currentView==='recent'?'아직 열어본 대시보드가 없습니다.':'등록된 대시보드가 없습니다.'}</strong>${query?'다른 이름이나 업무 폴더로 검색해보세요.':currentView==='favorites'?'카드의 별을 누르면 이곳에서 바로 찾을 수 있어요.':currentView==='recent'?'대시보드를 열면 최근 순서대로 표시됩니다.':'폴더에 HTML 또는 바로가기를 추가하고 다시 읽어주세요.'}</div>`;
 if(currentView==='all'&&category==='all'&&!query) $('#board-grid').insertAdjacentHTML('beforeend',`<button class="add-card" id="add-card"><span class="add-circle">${icon('plus')}</span><strong>대시보드 추가</strong><p>흩어져 있던 업무 링크를<br>나만의 공간에 모아보세요.</p></button>`);
 const latest=recent.map(id=>boards.find(b=>b.id===id)).filter(Boolean).slice(0,3);
 $('#recent-section').hidden=currentView!=='all'||category!=='all'||!!query||!latest.length;
 $('#recent-grid').innerHTML=latest.map(b=>{ const tag=b.kind==='local'?'button':'a';return `<${tag} class="recent-card" data-open="${esc(b.id)}" ${tag==='a'?`href="${esc(b.url)}" target="_blank" rel="noopener noreferrer"`:''} aria-label="${esc(b.name)} ${tag==='a'?'새 탭에서 ':''}열기"><span class="recent-icon">${icon(b.art)}</span><div><strong>${esc(b.name)}</strong><small>${esc(b.category)}</small></div>${icon('arrow')}</${tag}>`;}).join('');
}
function markRecent(id) { recent=[id,...recent.filter(x=>x!==id)].slice(0,50); save('momo.recent',recent); }
function closeViewer() { if($('#viewer').hidden) return; $('#viewer').hidden=true;$('#dashboard-frame').removeAttribute('src');$('#home-content').inert=false;document.body.style.overflow='';if(lastOpener&&document.contains(lastOpener))lastOpener.focus(); }
function openBoard(id,opener) {
 const b=boards.find(b=>b.id===id);if(!b)return;markRecent(id);
 if(b.kind!=='local'){setTimeout(render,0);return;}
 lastOpener=opener;$('#viewer-title').textContent=b.name;$('#dashboard-frame').title=b.name;$('#external-link').href=b.url;$('#dashboard-frame').src=b.url;$('#viewer').hidden=false;$('#home-content').inert=true;document.body.style.overflow='hidden';$('#close-viewer').focus();
}
function setView(view) {closeViewer();currentView=view;category='all';$('#search').value='';render();}
function showAdd() {$('#add-dialog').showModal();$('#add-form input[name="name"]').focus();}
// Native links keep Ctrl/Cmd-click and browser pop-up behavior intact.
function handleOpen(event) { const opener=event.target.closest('[data-open]');if(!opener)return;const b=boards.find(b=>b.id===opener.dataset.open);if(b?.kind==='local')event.preventDefault();openBoard(opener.dataset.open,opener); }
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
for(const selector of ['#folder-nav','#category-filters']) $(selector).addEventListener('click',event=>{const b=event.target.closest('[data-category]');if(!b)return;closeViewer();category=b.dataset.category;currentView='all';$('#search').value='';render();const focusTarget=[...document.querySelectorAll(`${selector} [data-category]`)].find(x=>x.dataset.category===category);focusTarget?.focus();});
$('#board-grid').addEventListener('click',event=>{
 const fav=event.target.closest('[data-favorite]');if(fav){const id=fav.dataset.favorite;favorites.has(id)?favorites.delete(id):favorites.add(id);const ok=save('momo.favorites',[...favorites]);render();([...document.querySelectorAll('[data-favorite]')].find(x=>x.dataset.favorite===id)||$('#boards-title')).focus();if(ok)toast(favorites.has(id)?'즐겨찾기에 추가했습니다.':'즐겨찾기에서 해제했습니다.');return;}
 const del=event.target.closest('[data-delete]');if(del){const id=del.dataset.delete;custom=custom.filter(b=>b.id!==id);boards=[...imported,...custom];const ok=save('momo.boards',custom);favorites.delete(id);save('momo.favorites',[...favorites]);recent=recent.filter(x=>x!==id);save('momo.recent',recent);render();$('#add-button').focus();if(ok)toast('추가한 링크를 삭제했습니다.');return;}
 if(event.target.closest('#add-card')){showAdd();return;}handleOpen(event);
});
$('#recent-grid').addEventListener('click',handleOpen);
$('#search').addEventListener('input',render);
$('#add-button').addEventListener('click',showAdd);
$('#close-dialog').addEventListener('click',()=>$('#add-dialog').close());
$('#add-dialog').addEventListener('click',event=>{if(event.target!==event.currentTarget)return;const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();});
$('#add-form').addEventListener('submit',event=>{event.preventDefault();const form=new FormData(event.target),name=form.get('name').trim(),url=form.get('url').trim();if(!name||!safeURL(url)){toast('이름과 http 또는 https 주소를 확인해주세요.');return;}custom.push({id:`board-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name,url,description:form.get('description').trim(),kind:'external',category:'내 링크',color:'slate',art:'document',custom:true});boards=[...imported,...custom];const ok=save('momo.boards',custom);setView('all');$('#add-dialog').close();event.target.reset();if(ok)toast('새 대시보드를 추가했습니다.');});
$('#close-viewer').addEventListener('click',()=>{closeViewer();render();$('#search').focus();});
for(const mode of ['grid','list']) $(`#${mode}-view`).addEventListener('click',()=>{layout=mode;save('momo.layout',mode);render();});
async function refreshCatalog(notify=false){
 if(location.protocol==='file:'){if(notify)toast('폴더를 다시 읽으려면 ‘네이비 데스크 시작.cmd’로 실행해주세요.');return;}
 $('#refresh-folders').disabled=true;
 try{const localServer=false;const endpoint=localServer?'/api/catalog':new URL('catalog.json',document.baseURI).href;const response=await fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(5000)});if(!response.ok)throw new Error('catalog');const next=await response.json();if(!Array.isArray(next))throw new Error('catalog');imported=next;boards=[...imported,...custom];render();if(notify)toast(`${imported.length}개의 대시보드 목록을 불러왔습니다.`);}catch{if(notify)toast('목록을 새로 읽지 못했습니다. 잠시 후 다시 시도해주세요.');}finally{$('#refresh-folders').disabled=false;}
}
$('#refresh-folders').addEventListener('click',()=>refreshCatalog(true));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#add-dialog').open)closeViewer();if(event.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!$('#add-dialog').open&&$('#viewer').hidden){event.preventDefault();$('#search').focus();}});
const greetings=['필요한 보드부터 차근차근 살펴보세요.','자주 쓰는 보드는 별표로 챙겨둘 수 있어요.','잠깐 어깨를 펴고, 다시 시작해볼까요?','모모는 여기서 기다리고 있을게요.'];
$('#momo').addEventListener('click',()=>{const message=greetings[greetingIndex++%greetings.length];$('#speech').textContent=message;if(matchMedia('(max-width:680px)').matches)toast(message);$('#momo').classList.remove('hello');void $('#momo').offsetWidth;$('#momo').classList.add('hello');});
$('#today').textContent=new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'long'}).format(new Date());
if(!['localhost','127.0.0.1',''].includes(location.hostname)){const refresh=$('#refresh-folders');refresh.title='목록 새로고침';refresh.setAttribute('aria-label','목록 새로고침');}
hydrate();render();refreshCatalog();
