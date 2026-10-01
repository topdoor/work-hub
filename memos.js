(() => {
 'use strict';
 const local = ['127.0.0.1','localhost'].includes(location.hostname) && location.port==='5173';
 const dialog=document.createElement('dialog');
 dialog.id='memo-dialog'; dialog.setAttribute('aria-labelledby','memo-title');
 dialog.innerHTML=`<div class="dialog-header"><span class="dialog-icon" data-icon="shield"></span><button type="button" class="icon-button" id="memo-close" aria-label="계정 메모 닫기">×</button></div><h2 id="memo-title">나의 계정 메모</h2><p id="memo-caption">비밀번호로 여는 개인 보관함</p><form id="memo-unlock"><label>보관함 비밀번호<input id="memo-password" type="password" required minlength="16" maxlength="1024" autocomplete="off" placeholder="16자 이상의 긴 비밀번호"></label><label id="memo-confirm-label" hidden>첫 설정 시 비밀번호 확인<input id="memo-confirm" type="password" autocomplete="off"></label><p class="memo-help" id="memo-help"></p><button class="primary-button submit-button" type="submit">보관함 열기</button></form><section id="memo-content" hidden><div class="memo-layout"><nav id="memo-files" aria-label="계정 메모 파일"></nav><div><h3 id="memo-file-title"></h3><label class="sr-only" for="memo-text">메모 내용</label><textarea id="memo-text" spellcheck="false" autocomplete="off"></textarea></div></div><div class="memo-actions"><button type="button" class="secondary-button" id="memo-lock">잠그기</button><button type="button" class="primary-button" id="memo-save">업데이트</button></div><p class="memo-help" id="memo-save-help"></p></section><p id="memo-status" role="status" aria-live="polite"></p>`;
 document.body.append(dialog); hydrate(dialog);
 const el=id=>document.getElementById(id);
 const profile=document.querySelector('.profile');
 profile.setAttribute('role','button'); profile.setAttribute('tabindex','0'); profile.setAttribute('aria-label','계정 메모 열기');
 profile.querySelector('small').textContent='계정 메모 · 잠금 보관함';
 let docs=[], selected=null, password='', busy=false, timer, configured=true, generation=0;
 const status=text=>{el('memo-status').textContent=text;};
 function clear(){generation++;clearTimeout(timer);docs=[];selected=null;password='';el('memo-password').value='';el('memo-confirm').value='';el('memo-text').value='';el('memo-files').replaceChildren();el('memo-file-title').textContent='';el('memo-content').hidden=true;el('memo-unlock').hidden=false;status('');}
 const dirty=()=>selected&&el('memo-text').value.replace(/\r\n/g,'\n')!==selected.text.replace(/\r\n/g,'\n');
 function canLeave(){return !dirty()||confirm('저장하지 않은 변경사항을 버릴까요?');}
 function close(){if(busy||!canLeave())return;dialog.close();}
 function arm(){clearTimeout(timer);timer=setTimeout(()=>{clear();status('10분 동안 사용하지 않아 잠갔습니다. 저장하지 않은 수정 내용은 지워졌습니다.');},600000);}
 ['input','click','keydown'].forEach(type=>dialog.addEventListener(type,()=>{if(password)arm();}));
 async function api(action,payload){const r=await fetch('/api/memos/'+action,{method:'POST',headers:{'Content-Type':'application/json','X-Memo-Request':'1'},body:JSON.stringify(payload),cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(data.error||'요청을 처리하지 못했습니다.');return data;}
 function choose(doc){selected=doc;el('memo-file-title').textContent=doc.name;el('memo-text').value=doc.text;for(const b of el('memo-files').children)b.setAttribute('aria-pressed',String(b.dataset.id===doc.id));}
 function show(){el('memo-unlock').hidden=true;el('memo-content').hidden=false;el('memo-text').readOnly=!local;el('memo-save').hidden=!local;el('memo-save-help').textContent=local?'업데이트하면 원본 메모장과 암호화 파일이 저장됩니다. 웹에 반영하려면 폴더의 ‘계정 메모 게시.cmd’를 실행하세요.':'수정은 내 PC의 ‘네이비 데스크 시작.cmd’에서 할 수 있습니다.';el('memo-files').replaceChildren();for(const doc of docs){const b=document.createElement('button');b.type='button';b.dataset.id=doc.id;b.textContent=doc.folder+' / '+doc.name;b.addEventListener('click',()=>{if(!busy&&canLeave())choose(doc);});el('memo-files').append(b);}choose(docs[0]);arm();}
 async function open(){clear();dialog.showModal();el('memo-help').textContent=local?'처음 사용하면 16자 이상의 새 비밀번호를 입력하고 아래 확인란에도 입력하세요. 기존 보관함은 기존 비밀번호로 여세요. 비밀번호를 잊으면 공개 보관함은 복구할 수 없습니다.':'비밀번호는 저장되지 않습니다. 화면을 닫으면 다시 잠깁니다.';el('memo-confirm-label').hidden=!local;el('memo-password').focus();}
 profile.addEventListener('click',open);profile.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
 el('memo-close').addEventListener('click',close);el('memo-lock').addEventListener('click',()=>{if(!busy&&canLeave()){clear();el('memo-password').focus();}});
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('close',clear);
 addEventListener('pagehide',clear);addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
 el('memo-unlock').addEventListener('submit',async e=>{
  e.preventDefault();if(busy)return;busy=true;const version=generation;status('보관함을 여는 중입니다…');const input=el('memo-password').value;
  try{
   let next;
   if(local){const data=await api('open',{password:input});configured=data.configured;if(!configured&&input!==el('memo-confirm').value)throw Error('첫 설정 비밀번호와 확인란을 같게 입력해주세요.');next=data.documents;}
   else{
    const response=await fetch(new URL('vault.json',document.baseURI),{cache:'no-store'});if(response.status===404)throw Error('아직 계정 메모가 게시되지 않았습니다. 내 PC에서 비밀번호를 설정하고 게시해주세요.');if(!response.ok)throw Error('보관함을 불러오지 못했습니다.');
    const v=await response.json();if(v.version!==1||v.iterations!==600000)throw Error('지원하지 않는 보관함 형식입니다.');
    const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
    const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(input),'PBKDF2',false,['deriveKey']);
    const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(v.salt),iterations:v.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
    let plain;try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(v.nonce),additionalData:new TextEncoder().encode('MY-HUB-ACCOUNTS-v1')},key,bytes(v.ciphertext));}catch{throw Error('비밀번호가 일치하지 않거나 암호화 파일이 손상되었습니다.');}
    next=JSON.parse(new TextDecoder().decode(plain)).documents;
   }
   if(version!==generation)return;if(!Array.isArray(next)||!next.length)throw Error('표시할 메모가 없습니다.');docs=next;password=local?input:'unlocked';el('memo-password').value='';el('memo-confirm').value='';show();status(local&&!configured?'첫 설정입니다. 업데이트를 눌러 암호화 보관함을 저장해주세요.':'보관함을 열었습니다.');
  }catch(error){if(version===generation)status(error.message);}finally{busy=false;}
 });
 el('memo-save').addEventListener('click',async()=>{
  if(busy||!selected)return;busy=true;el('memo-save').disabled=true;status('원본과 암호화 파일을 저장하는 중입니다…');const version=generation;
  try{const id=selected.id;const result=await api('save',{password,id,text:el('memo-text').value,revision:selected.revision});if(version!==generation)return;docs=result.documents;configured=true;show();choose(docs.find(d=>d.id===id));status('업데이트 완료. 원본 메모장과 암호화 파일을 저장했습니다. 웹 게시를 실행하면 공유 화면에도 반영됩니다.');}catch(error){if(version===generation)status(error.message);}finally{busy=false;el('memo-save').disabled=false;}
 });
})();
