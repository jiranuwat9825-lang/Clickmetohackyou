/* Forbidden Word room controls and local word covers. */
let forbiddenBusy=false,forbiddenRoundKey='',forbiddenHidden=new Set();
function forbiddenClock(){
 const timer=$('forbiddenTimer');
 if(timer&&!$('forbiddenScreen').hidden&&roomState?.gameMode==='forbidden'&&roomState.forbidden)timer.textContent=formatLeft(roomState.forbidden.deadline);
}
async function forbiddenStart(){
 if(!roomId||!isHost||forbiddenBusy||roomState?.gameMode!=='forbidden')return;
 const room=roomId,game=Number(roomState.gamesPlayed)||0;forbiddenBusy=true;
 try{
  const result=await getRef().transaction(r=>{
   if(room!==roomId||!r||r.hostId!==myId||r.gameMode!=='forbidden'||r.status!=='lobby'||(Number(r.gamesPlayed)||0)!==game)return;
   const pack=library[r.category]||packFor(r),ids=Object.keys(r.players||{});
   if(!enabledFor(pack).includes('forbidden')||!supportsMode(pack,'forbidden'))return;
   r.categoryPack=firebaseSafePack(pack);
   if(!ForbiddenEngine.setup(r,ids,r.categoryPack,serverNow()))return;
   r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
  if(!result.committed)toast('เริ่มไม่ได้ กรุณาตรวจสอบหมวดคำและจำนวนผู้เล่น','error');
 }catch(e){error(e);}finally{forbiddenBusy=false;}
}
async function forbiddenDie(){
 if(forbiddenBusy||!roomId||roomState?.gameMode!=='forbidden'||roomState.status!=='playing')return;
 const room=roomId,game=roomState.gamesPlayed;forbiddenBusy=true;$('forbiddenDieBtn').disabled=true;
 try{
  const result=await getRef().transaction(r=>{
   if(room!==roomId||!r||r.gamesPlayed!==game||!r.players?.[myId]||!ForbiddenEngine.eliminate(r,myId,serverNow()))return;
   r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
  if(!result.committed)toast('สถานะเกมเปลี่ยนไปแล้ว','error');
 }catch(e){error(e);}finally{forbiddenBusy=false;if(roomState?.gameMode==='forbidden')renderForbidden(roomState);}
}
async function forbiddenAuto(){
 if(autoBusy||!roomId||roomState?.gameMode!=='forbidden'||roomState.status!=='playing'||serverNow()<Number(roomState.forbidden?.deadline))return;
 const room=roomId,game=roomState.gamesPlayed;autoBusy=true;
 try{await getRef().transaction(r=>{
  if(room!==roomId||!r||r.gamesPlayed!==game||!ForbiddenEngine.tick(r,serverNow()))return;
  r.lastActivityAt=TIMESTAMP();return r;
 },undefined,false);}catch(e){error(e);}finally{autoBusy=false;}
}
function renderForbidden(r){
 const v=ForbiddenEngine.view(r,myId),root=$('forbiddenContent');if(!v){root.textContent='กำลังโหลดเกม…';return;}
 const key=roomId+':'+r.gamesPlayed;if(forbiddenRoundKey!==key){forbiddenRoundKey=key;forbiddenHidden=new Set();}
 const done=r.status==='results',alive=v.order.filter(id=>!v.dead[id]);
 root.innerHTML='<div class="forbidden-head"><div><span class="forbidden-kicker">พูดคุย · ล่อให้เพื่อนหลุดคำ</span><h2>คำต้องห้าม</h2><p>คุณจะไม่เห็นคำของตัวเอง · ซ่อนคำของเพื่อนบนหน้าจอนี้ได้ทีละคน</p></div><div class="forbidden-clock"><small>เวลาที่เหลือ</small><strong id="forbiddenTimer">05:00</strong></div></div><div id="forbiddenMessage" class="forbidden-message" role="status"></div><div id="forbiddenCards" class="forbidden-cards"></div><div id="forbiddenActions" class="forbidden-actions"></div>';
 const message=$('forbiddenMessage');
 if(done)message.textContent=v.result?.reason==='time'?'หมดเวลา · ผู้ที่ยังอยู่ชนะร่วมกัน':'เหลือผู้รอดคนสุดท้าย · ชนะ!';
 else message.textContent=v.dead[myId]?'คุณตายแล้ว · ช่วยฟังเพื่อนต่อได้':`เหลือ ${alive.length} คน · เมื่อพูดคำของตัวเอง ให้กด “ตาย”`;
 const cards=$('forbiddenCards');cards.replaceChildren();
 for(const id of v.order){
  const card=document.createElement('article');card.className='forbidden-card'+(v.dead[id]?' is-dead':'')+(id===myId?' is-mine':'');
  const header=document.createElement('div');header.className='forbidden-card-head';
  const label=document.createElement('strong');label.textContent=(r.gamePlayers?.[id]||r.players?.[id])?.name||'ผู้เล่น';
  const state=document.createElement('span');state.textContent=v.dead[id]?'ตายแล้ว':id===myId?'คุณ':'ยังอยู่';header.append(label,state);
  const word=document.createElement('div');word.className='forbidden-word';
  const covered=!done&&(id===myId&&!v.dead[id]||id!==myId&&forbiddenHidden.has(id));word.textContent=covered?(id===myId?'คำของคุณถูกซ่อน':'••••••'):v.words[id]||'—';
  card.append(header,word);
  if(!done&&id!==myId){const toggle=document.createElement('button');toggle.type='button';toggle.className='btn outline small';toggle.textContent=forbiddenHidden.has(id)?'แสดงคำ':'ซ่อนคำ';toggle.setAttribute('aria-label',toggle.textContent+'ของ '+label.textContent);toggle.onclick=()=>{if(forbiddenHidden.has(id))forbiddenHidden.delete(id);else forbiddenHidden.add(id);renderForbidden(roomState);};card.append(toggle);}
  cards.append(card);
 }
 const actions=$('forbiddenActions');actions.replaceChildren();
 if(done){
  const winners=document.createElement('p');winners.className='forbidden-winners';winners.textContent='ผู้ชนะ: '+(v.result?.winners||[]).map(id=>(r.gamePlayers?.[id]||r.players?.[id])?.name||'ผู้เล่น').join(', ')+' · คนละ +1 คะแนน';actions.append(winners);
  if(isHost){const next=document.createElement('button');next.type='button';next.className='btn primary';next.textContent='กลับล็อบบี้';next.onclick=()=>$('nextGameBtn').click();actions.append(next);}
 }else if(!v.dead[myId]&&v.order.includes(myId)){
  const die=document.createElement('button');die.id='forbiddenDieBtn';die.type='button';die.className='btn danger';die.textContent='ตาย · ฉันพูดคำต้องห้ามแล้ว';die.disabled=forbiddenBusy;die.onclick=forbiddenDie;actions.append(die);
 }
 forbiddenClock();
}
