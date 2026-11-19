/* Cryptid integration with the existing Party Game Hub room lifecycle. */
const CE=CryptidEngine;
let cryptidBusy=false,cryptidLobbyBusy=false,cryptidLastAuto=0;
let cryptidUI={game:'',revision:'',cell:null,target:'',zoom:1,clueOpen:false};

function cryptidCountChoices(prefix,count=3,disabled=false){
 const root=$(prefix+'CountChoices'),input=$(prefix+'Count');if(!root||!input)return;input.value=String(count);
 if(!root.children.length)for(const n of [3,4,5]){
  const button=document.createElement('button');button.type='button';button.className='choice cryptid-count-choice';button.dataset.count=String(n);button.innerHTML='<strong>'+n+' คน</strong>';
  button.onclick=()=>{if(button.disabled)return;input.value=String(n);if(prefix==='cryptidLobby')renderCryptidLobby(roomState);else cryptidCountChoices(prefix,n);};root.append(button);
 }
 for(const button of root.children){const selected=Number(button.dataset.count)===Number(count);button.disabled=disabled;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));}
 cryptidMapCounts(prefix,count);
}
function cryptidOpenClues(){
 const r=roomState;if(r?.gameMode!=='cryptid'||!r.cryptid||!['cryptid_playing','results'].includes(r.status))return;
 const clues=CE.clueCatalogue(r.cryptid.board);
 $('cryptidClueSummary').textContent='เบาะแสทั้งหมด '+clues.length+' ชนิด';
 $('cryptidClueList').innerHTML='<ol class="cryptid-clue-catalogue">'+clues.map(c=>'<li>'+esc(c.text)+'</li>').join('')+'</ol>';
 const dialog=$('cryptidClueDialog');if(!dialog.open)dialog.showModal();
}
$('cryptidCloseClues').onclick=()=>$('cryptidClueDialog').close();
function cryptidMapLabel(mapId){const map=CE.MAPS[mapId];return map?(map.stage?'ด่าน '+map.stage+' · ':'')+map.name:'สุ่มแผนที่';}
function cryptidMapThumbnail(mapId){
 const board=CE.mapBoard(mapId);if(!board)return '<span class="cryptid-random-thumbnail" aria-hidden="true">🎲</span>';
 const colors={forest:'#3b8867',water:'#4294c0',mountain:'#9c96b9',swamp:'#8d9c52',desert:'#d9a16a'};
 return '<svg viewBox="0 0 250 165" aria-hidden="true">'+board.map(c=>'<rect x="'+(c.col*19+(c.row%2)*9)+'" y="'+(c.row*18)+'" width="17" height="16" rx="4" fill="'+colors[c.terrain]+'"/>').join('')+'</svg>';
}
function cryptidMapChoices(prefix,mapId,disabled=false){
 const root=$(prefix+'MapChoices');if(!root)return;
 if(!root.children.length){
  root.setAttribute('role','group');root.setAttribute('aria-label','เลือกด่าน Cryptid หรือสุ่มแผนที่');
  for(const [id,map] of Object.entries(CE.MAPS)){
   const button=document.createElement('button');button.type='button';button.className='cryptid-map-choice';button.dataset.mapId=id;
   button.innerHTML='<span class="cryptid-map-count"></span>'+cryptidMapThumbnail(id)+'<strong>'+esc(cryptidMapLabel(id))+'</strong><small>'+esc(map.description)+'</small>';
   button.onclick=()=>{if(button.disabled)return;$(prefix+'Map').value=id;$(prefix+'Map').onchange();};root.append(button);
  }
 }
 for(const button of root.children){const selected=button.dataset.mapId===mapId;button.disabled=disabled;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));}
 cryptidMapCounts(prefix,Number($(prefix+'Count').value)||3);
}
function cryptidMapCounts(prefix,count){
 const root=$(prefix+'MapChoices');if(!root)return;
 for(const button of root.children){
  const badge=button.querySelector('.cryptid-map-count');
  const total=CE.MAPS[button.dataset.mapId].puzzleCounts?.[count];
  badge.textContent=total==null?'ตามแผนที่สุ่ม':total.toLocaleString('en-US')+' แบบ';
  badge.title=total==null?'จำนวนรูปแบบขึ้นกับผังที่สุ่มได้':'ชุดเบาะแส '+count+' ใบที่ให้คำตอบเดียว ไม่นับการสลับผู้เล่น';
 }
}
function cryptidName(r,id){return (r.players?.[id]||r.gamePlayers?.[id]||r.playerProfiles?.[id])?.name||'ผู้เล่น';}
function cryptidToken(r,id){const i=r.cryptid?.order.indexOf(id)||0;return '<span class="cryptid-token" style="--token-color:'+CE.COLORS[i]+'">'+(i+1)+'</span>';}
function renderCryptidLobby(r){
 const panel=$('cryptidLobbySettings');panel.hidden=r.gameMode!=='cryptid';if(panel.hidden)return;
 const select=$('cryptidLobbyCount'),mapSelect=$('cryptidLobbyMap'),key=roomId+':'+r.gamesPlayed+':'+r.cryptidCount+':'+(r.cryptidMap||'random')+':'+isHost;
 if(panel.dataset.savedKey!==key){select.value=String(r.cryptidCount||3);mapSelect.value=r.cryptidMap||'random';panel.dataset.savedKey=key;}
 select.disabled=mapSelect.disabled=!isHost||cryptidLobbyBusy;cryptidMapChoices('cryptidLobby',mapSelect.value,mapSelect.disabled);$('cryptidLobbySave').hidden=!isHost;
 cryptidCountChoices('cryptidLobby',Number(select.value),!isHost||cryptidLobbyBusy);
 $('cryptidLobbySave').disabled=cryptidLobbyBusy||(Number(select.value)===Number(r.cryptidCount||3)&&mapSelect.value===(r.cryptidMap||'random'));
 $('cryptidLobbyMapStatus').textContent=!isHost?'Host เป็นผู้เลือกด่านให้ทั้งห้อง':cryptidLobbyBusy?'กำลังบันทึก…':$('cryptidLobbySave').disabled?'ด่านที่บันทึก: '+cryptidMapLabel(r.cryptidMap||'random'):'เปลี่ยนแล้ว · กดบันทึกการตั้งค่าก่อนเริ่มเกม';
 const players=Object.values(r.players||{}),bots=players.filter(p=>p.bot).length,full=players.length>=Number(r.cryptidCount||3);
 $('cryptidBotTools').hidden=!isHost;$('cryptidBotCount').textContent=`ผู้เล่นจริง ${players.length-bots} คน · บอท ${bots} ตัว · ${players.length}/${r.cryptidCount||3}`;
 $('cryptidAddBot').disabled=$('cryptidFillBots').disabled=cryptidLobbyBusy||full;
 $('cryptidRemoveBots').disabled=cryptidLobbyBusy||!bots;
}
$('cryptidLobbyCount').onchange=$('cryptidLobbyMap').onchange=()=>renderCryptidLobby(roomState);
$('cryptidCreateMap').onchange=()=>cryptidMapChoices('cryptidCreate',$('cryptidCreateMap').value);
$('cryptidCreateMap').value='random';
cryptidMapChoices('cryptidCreate','random');
cryptidCountChoices('cryptidCreate',3);
$('cryptidLobbySave').onclick=async()=>{
 if(!isHost||cryptidLobbyBusy||!roomId)return;
 const count=Number($('cryptidLobbyCount').value),mapId=$('cryptidLobbyMap').value,id=roomId;cryptidLobbyBusy=true;renderCryptidLobby(roomState);
 try{const result=await getRef().transaction(r=>{
  if(id!==roomId||!r||r.gameMode!=='cryptid'||r.status!=='lobby'||r.hostId!==myId||![3,4,5].includes(count)||!CE.MAPS[mapId]||Object.keys(r.players||{}).length>count)return;
  r.cryptidCount=count;r.cryptidMap=mapId;delete r.cryptidClueSet;r.lastActivityAt=TIMESTAMP();return r;
 },undefined,false);toast(result.committed?'บันทึกการตั้งค่า Cryptid แล้ว':'บันทึกไม่ได้ ตรวจสอบจำนวนผู้เล่นและสถานะห้อง',result.committed?'success':'error');}
 catch(e){error(e);}finally{cryptidLobbyBusy=false;if(id===roomId&&roomState)renderCryptidLobby(roomState);}
};
async function cryptidBots(action){
 if(cryptidLobbyBusy||!roomId||!isHost)return;const id=roomId;cryptidLobbyBusy=true;renderCryptidLobby(roomState);
 try{const result=await getRef().transaction(r=>{if(id!==roomId||!CE.manageBots(r,myId,action))return;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);
  if(!result.committed)toast('เปลี่ยนจำนวนบอทไม่ได้ กรุณาตรวจสอบสถานะห้อง','error');
 }catch(e){error(e);}finally{cryptidLobbyBusy=false;if(id===roomId&&roomState)renderCryptidLobby(roomState);}
}
for(const [id,action] of [['cryptidAddBot','add'],['cryptidFillBots','fill'],['cryptidRemoveBots','remove']])$(id).onclick=()=>cryptidBots(action);
async function cryptidStart(){
 if(cryptidBusy||roomState?.status!=='lobby')return;
 if(cryptidLobbyBusy||$('cryptidLobbyMap').value!==(roomState.cryptidMap||'random')||Number($('cryptidLobbyCount').value)!==Number(roomState.cryptidCount||3)){toast('บันทึกการตั้งค่า Cryptid ก่อนเริ่มเกม','error');return;}
 const id=roomId,count=Number(roomState.cryptidCount||3),mapId=roomState.cryptidMap||'random',ids=Object.keys(roomState.players||{}),game=Number(roomState.gamesPlayed)||0;
 if(![3,4,5].includes(count)||ids.length!==count){toast(`ต้องมีผู้เล่นรวมบอท ${count} คนก่อนเริ่ม`,'error');return;}
 cryptidBusy=true;$('startBtn').disabled=true;$('startBtn').textContent='กำลังสร้างปริศนา…';
 try{
  // Generate once, outside the RTDB retry callback, so retries use the same puzzle.
  await new Promise(resolve=>setTimeout(resolve,0));const puzzle=CE.generate(count,Math.random,mapId),order=CE.mix(ids);
  const result=await getRef().transaction(r=>{
   if(id!==roomId||!r||r.gameMode!=='cryptid'||r.hostId!==myId||Number(r.cryptidCount||3)!==count||(r.cryptidMap||'random')!==mapId||(Number(r.gamesPlayed)||0)!==game)return;
   const current=Object.keys(r.players||{});if(current.length!==ids.length||!current.every(p=>ids.includes(p))||!CE.setup(r,ids,puzzle,order))return;
   r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
  toast(result.committed?'เริ่ม Cryptid แล้ว':'ห้องเปลี่ยนไป กรุณากดเริ่มใหม่',result.committed?'success':'error');
 }catch(e){error(e);}finally{cryptidBusy=false;if(id===roomId&&roomState)renderRoom(roomState);}
}
async function cryptidSend(action,value){
 if(cryptidBusy||!roomId||roomState?.gameMode!=='cryptid')return;
 const id=roomId,rev=roomState.cryptid?.revision,game=roomState.gamesPlayed;cryptidBusy=true;cryptidControls(roomState);
 try{const result=await getRef().transaction(r=>{
  if(id!==roomId||!r||r.gamesPlayed!==game||!CE.apply(r,myId,action,value,rev))return;
  r.lastActivityAt=TIMESTAMP();return r;
 },undefined,false);if(!result.committed)toast('ตาหรือสถานะเปลี่ยนแล้ว กรุณาเลือกใหม่','error');}
 catch(e){error(e);}finally{cryptidBusy=false;if(id===roomId&&roomState?.gameMode==='cryptid')renderCryptid(roomState);}
}
async function cryptidAuto(){
 if(autoBusy||!roomId||leaving||!isHost||roomState?.gameMode!=='cryptid'||roomState.status!=='cryptid_playing'||Date.now()-cryptidLastAuto<850)return;
 const id=roomId,r=roomState,rev=r.cryptid.revision,game=r.gamesPlayed,next=CE.nextBotAction(r);if(!next)return;
 cryptidLastAuto=Date.now();autoBusy=true;
 try{await getRef().transaction(x=>{
  if(id!==roomId||!x||x.hostId!==myId||x.gamesPlayed!==game||x.players?.[myId]?.bot||!x.players?.[myId]||!CE.apply(x,next.id,next.type,next.value,rev))return;
  x.lastActivityAt=TIMESTAMP();return x;
 },undefined,false);}catch(e){error(e);}finally{autoBusy=false;}
}
async function cryptidReturn(){
 if(!roomId||!isHost||cryptidBusy)return;const id=roomId;cryptidBusy=true;
 try{await getRef().transaction(r=>{
  if(id!==roomId||!r||r.gameMode!=='cryptid'||r.hostId!==myId||r.status!=='results')return;
  r.status='lobby';r.cryptid=null;r.result=null;r.gamePlayers=null;r.lastActivityAt=TIMESTAMP();return r;
 },undefined,false);}catch(e){error(e);}finally{cryptidBusy=false;}
}
function cryptidBuild(r){
 $('cryptidClueDialog').close?.();
 const root=$('cryptidContent');root.innerHTML=`
 <div class="cryptid-heading"><div><small class="eyebrow">THE HIDDEN HABITAT</small><h2>Cryptid</h2></div><span class="cryptid-round">เกมที่ ${r.gamesPlayed} · ${esc(r.cryptid.mapName||'สุ่มแผนที่')}</span></div>
 <div id="cryptidResult" hidden></div>
 <div id="cryptidPlayers" class="cryptid-players"></div>
 <p id="cryptidStatus" class="cryptid-status" role="status" aria-live="polite"></p>
 <div id="cryptidLastMove" class="cryptid-last-move" aria-live="polite" hidden></div>
 <div class="cryptid-workspace"><div class="cryptid-map-panel">
  <div class="cryptid-map-toolbar"><span>แผนที่สำรวจ</span><div class="cryptid-buttons"><button type="button" class="btn outline small" id="cryptidZoomOut" aria-label="ย่อแผนที่">−</button><button type="button" class="btn outline small" id="cryptidZoomReset">100%</button><button type="button" class="btn outline small" id="cryptidZoomIn" aria-label="ขยายแผนที่">＋</button></div></div>
  <div id="cryptidMapViewport" class="cryptid-map-viewport" tabindex="0" aria-label="แผนที่ หมุนลูกกลิ้งเพื่อซูม กดเมาส์ซ้ายค้างเพื่อลาก"><svg id="cryptidMap" viewBox="0 0 660 430" role="group" aria-label="แผนที่ Cryptid เลือกช่องเพื่อดูรายละเอียด"></svg></div>
  <section class="cryptid-legend" aria-label="ความหมายของสัญลักษณ์">
   <h3>หมากที่ผู้เล่นวาง</h3>
   <div class="cryptid-marker-key"><article><b class="cryptid-key-shape no">■</b><div><strong>สี่เหลี่ยม = อยู่ที่นี่ไม่ได้</strong><p>ไม่ตรงกับเบาะแสของคนวาง · ช่องนี้ถูกตัดทิ้ง</p></div></article><article><b class="cryptid-key-shape yes">●</b><div><strong>วงกลม = ยังเป็นไปได้</strong><p>ตรงกับเบาะแสของคนวาง · ยังไม่ใช่การยืนยันคำตอบ</p></div></article></div>
   <p class="cryptid-color-help">สีและเลขบนหมากบอกว่าเป็นของผู้เล่นคนไหน</p>
   <h3>สัญลักษณ์ที่มีอยู่บนแผนที่</h3>
   <div class="cryptid-symbol-key"><span><b>▲</b>สามเหลี่ยม = ภูเขา</span><span><b>◆</b>สี่เหลี่ยมข้าวหลามตัด = เสาหิน</span><span><b>⌂</b>รูปบ้าน = กระท่อม</span><span><b>🌲</b>ต้นไม้ = ป่า</span><span><b>≈</b>คลื่น = น้ำ</span><span><b>♧</b>กอพืช = หนองบึง</span><span><b>☀</b>ดวงอาทิตย์ = ทะเลทราย</span><span><b>🐻</b>เขตหมี</span><span><b>🐾</b>เขตเสือพูมา</span></div>
  </section>
 </div><aside class="cryptid-sidebar">
  <section class="cryptid-card"><div class="cryptid-card-title"><h3>เบาะแสของฉัน</h3><button type="button" class="btn outline small" id="cryptidToggleClue" aria-expanded="false">เปิดดู</button></div><p id="cryptidClue" class="cryptid-clue" hidden></p><p id="cryptidClueMeaning" class="cryptid-clue-meaning" hidden></p><p class="muted hint">เบาะแสของคุณเป็นเพียงส่วนหนึ่งของคำตอบ</p></section>
  <section id="cryptidControls" class="cryptid-card"></section>
  <details class="cryptid-card"><summary>โน้ตส่วนตัว</summary><label for="cryptidNotes" class="muted hint">บันทึกข้อสังเกตของคุณ</label><textarea id="cryptidNotes" rows="5" maxlength="4000" placeholder="เช่น ผู้เล่น 2 น่าจะเกี่ยวกับเสาหิน…"></textarea></details>
 </aside></div>
 <button type="button" id="cryptidOpenClues" class="btn outline full cryptid-open-clues" aria-haspopup="dialog" aria-controls="cryptidClueDialog">ดูชนิดเบาะแสทั้งหมด</button>
 <section class="cryptid-history"><h3>ประวัติการสำรวจ</h3><div id="cryptidHistory"></div></section>
 <div id="cryptidHostTools" class="cryptid-host-tools"></div>`;
 const noteKey=`party_cryptid_note_v1:${roomId}:${r.gamesPlayed}:${myId}`;
 try{$('cryptidNotes').value=sessionStorage.getItem(noteKey)||'';}catch(e){}
 $('cryptidNotes').oninput=()=>{try{sessionStorage.setItem(noteKey,$('cryptidNotes').value);}catch(e){}};
 $('cryptidToggleClue').onclick=()=>{cryptidUI.clueOpen=!cryptidUI.clueOpen;cryptidUpdateClue(roomState);};
 const zoom=delta=>cryptidSetZoom(cryptidUI.zoom+delta);
 $('cryptidZoomOut').onclick=()=>zoom(-.25);$('cryptidZoomIn').onclick=()=>zoom(.25);
 $('cryptidZoomReset').onclick=()=>cryptidSetZoom(1);
 cryptidSetupMapNavigation($('cryptidMapViewport'));
 function select(cell){if(!cell)return;cryptidUI.cell=cell;cryptidHighlight();cryptidControls(roomState);}
 $('cryptidMap').onclick=e=>select(e.target.closest('[data-cell]')?.dataset.cell);
 $('cryptidMap').onkeydown=e=>{
  const el=e.target.closest('[data-cell]');if(!el)return;
  if(e.key==='Enter'||e.key===' '){e.preventDefault();select(el.dataset.cell);return;}
  const cell=roomState.cryptid.board.find(c=>c.id===el.dataset.cell),delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
  if(delta){e.preventDefault();const next=roomState.cryptid.board.find(c=>c.col===cell.col+delta[0]&&c.row===cell.row+delta[1]);if(next){select(next.id);$('cryptidMap').querySelector('[data-cell="'+next.id+'"]').focus();}}
 };
 $('cryptidOpenClues').onclick=cryptidOpenClues;
}
function cryptidZoom(){
 const svg=$('cryptidMap'),viewport=$('cryptidMapViewport');if(!svg||!viewport)return;
 cryptidUI.baseWidth||=Math.max(740,viewport.clientWidth||0);
 svg.style.width=(cryptidUI.baseWidth*cryptidUI.zoom)+'px';
 $('cryptidZoomReset').textContent=Math.round(cryptidUI.zoom*100)+'%';
}
function cryptidSetZoom(value,anchor){
 const svg=$('cryptidMap'),viewport=$('cryptidMapViewport');if(!svg||!viewport)return;
 const rect=viewport.getBoundingClientRect(),before=svg.getBoundingClientRect();
 const x=anchor?.x??rect.left+viewport.clientWidth/2,y=anchor?.y??rect.top+viewport.clientHeight/2;
 const rx=before.width?(x-before.left)/before.width:0,ry=before.height?(y-before.top)/before.height:0;
 cryptidUI.zoom=Math.max(.75,Math.min(3,value));cryptidZoom();
 const after=svg.getBoundingClientRect();
 viewport.scrollLeft+=after.left+rx*after.width-x;viewport.scrollTop+=after.top+ry*after.height-y;
}
function cryptidSetupMapNavigation(viewport){
 let drag=null,suppressClick=false;
 viewport.addEventListener('wheel',e=>{
  if(!e.deltaY)return;e.preventDefault();
  const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientHeight:1);
  cryptidSetZoom(cryptidUI.zoom*Math.exp(-pixels*.0015),{x:e.clientX,y:e.clientY});
 },{passive:false});
 viewport.addEventListener('pointerdown',e=>{
  suppressClick=false;if(e.button!==0||e.pointerType==='touch')return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,moved:false};
 });
 viewport.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)>5){drag.moved=true;viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-dragging');}
  if(drag.moved){e.preventDefault();viewport.scrollLeft=drag.left-dx;viewport.scrollTop=drag.top-dy;}
 });
 const stop=e=>{if(!drag||e.pointerId!==drag.id)return;suppressClick=drag.moved;drag=null;viewport.classList.remove('is-dragging');if(viewport.hasPointerCapture?.(e.pointerId))viewport.releasePointerCapture(e.pointerId);};
 viewport.addEventListener('pointerup',stop);viewport.addEventListener('pointercancel',stop);viewport.addEventListener('lostpointercapture',stop);
 viewport.addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
}
function cryptidUpdateClue(r){
 if(!r?.cryptid||!$('cryptidClue'))return;
 const clue=r.cryptid.clues?.[myId],negative=clue?.id.startsWith('not_');
 $('cryptidClue').textContent=clue?.text||'คุณไม่ได้เข้าร่วมเกมนี้';$('cryptidClue').hidden=!cryptidUI.clueOpen;$('cryptidClue').classList.toggle('is-negative',!!negative);
 $('cryptidClueMeaning').hidden=!cryptidUI.clueOpen||!negative;$('cryptidClueMeaning').textContent='เบาะแสแบบตัดออก · ตัดพื้นที่ที่ระบุออก ถ้ามีระยะ ให้ใช้ระยะขั้นต่ำที่เขียนในวงเล็บ';
 $('cryptidToggleClue').textContent=cryptidUI.clueOpen?'ซ่อน':'เปิดดู';$('cryptidToggleClue').setAttribute('aria-expanded',String(cryptidUI.clueOpen));
}
function cryptidDrawBoard(r){
 const a=r.cryptid,terrainFill={forest:'#244d41',water:'#234e73',mountain:'#50536e',swamp:'#4c4d30',desert:'#765738'},icons={forest:'🌲',water:'≈',mountain:'▲',swamp:'♧',desert:'☀'};
 $('cryptidMap').innerHTML=a.board.map(c=>{
  const x=32+c.col*50+(c.row%2)*25,y=32+c.row*44,marks=a.markers?.[c.id]||{},entries=a.order.filter(p=>marks[p]),isSolution=r.status==='results'&&c.id===a.solution;
  const points=Array.from({length:6},(_,i)=>{const rad=(i*60-30)*Math.PI/180;return (x+28*Math.cos(rad)).toFixed(1)+','+(y+28*Math.sin(rad)).toFixed(1);}).join(' ');
  const structure=c.structure?`<text x="${x+11}" y="${y-3}" class="cryptid-structure" fill="${{white:'#fff',green:'#9dff8d',blue:'#8bcfff'}[c.structureColor]}">${c.structure==='stone'?'◆':'⌂'}</text>`:'';
  const tokens=entries.map((p,i)=>{
   const row=Math.floor(i/3),rowCount=Math.min(3,entries.length-row*3),tx=x+(i%3-(rowCount-1)/2)*13,ty=y+10+row*12,color=CE.COLORS[a.order.indexOf(p)],number=a.order.indexOf(p)+1;
   const shape=marks[p]==='no'?`<rect x="${tx-5.5}" y="${ty-5.5}" width="11" height="11" rx="1" fill="${color}" stroke="#06101d" stroke-width="1.3"/>`:`<circle cx="${tx}" cy="${ty}" r="5.5" fill="${color}" stroke="#06101d" stroke-width="1.3"/>`;
   return shape+`<text x="${tx}" y="${ty+.5}" class="cryptid-marker-number">${number}</text>`;
  }).join('');
  const label=CE.coordinate(c)+' '+CE.TERRAIN[c.terrain]+(c.animal?' เขต'+(c.animal==='bear'?'หมี':'เสือพูมา'):'')+(c.structure?' '+(c.structure==='stone'?'เสาหิน':'กระท่อม'):'')+entries.map(p=>' '+cryptidName(r,p)+':'+(marks[p]==='yes'?'เป็นไปได้':'เป็นไปไม่ได้')).join('');
  return `<g class="cryptid-hex${CE.blocked(a,c.id)?' is-blocked':''}${isSolution?' is-solution':''}" data-cell="${c.id}" role="button" tabindex="${c.id===(cryptidUI.cell||a.board[0].id)?0:-1}" aria-label="${esc(label)}" aria-pressed="false"><title>${esc(label)}</title><polygon points="${points}" fill="${terrainFill[c.terrain]}"/><text x="${x}" y="${y-14}" class="cryptid-coordinate">${CE.coordinate(c)}</text><text x="${x-4}" y="${y+3}" class="cryptid-land-icon">${icons[c.terrain]}</text>${structure}${c.animal?`<text x="${x-13}" y="${y+6}" class="cryptid-animal">${c.animal==='bear'?'🐻':'🐾'}</text>`:''}${tokens}<g class="cryptid-placement-ghost" aria-hidden="true"><rect class="ghost-no" x="${x+8}" y="${y+10}" width="13" height="13" rx="1"/><circle class="ghost-yes" cx="${x+14.5}" cy="${y+16.5}" r="6.5"/></g>${isSolution?`<text x="${x}" y="${y+6}" class="cryptid-solution-star">★</text>`:''}</g>`;
 }).join('');cryptidHighlight();cryptidZoom();
}
function cryptidHighlight(){
 const a=roomState?.cryptid,placing=a&&CE.actor(a)===myId&&['initial','penalty','extra'].includes(a.phase),piece=a?.phase==='extra'?'yes':'no';
 const legal=placing?CE.legalCells(a,myId,piece==='yes'):[];
 document.querySelectorAll('#cryptidMap [data-cell]').forEach(el=>{
  const on=el.dataset.cell===cryptidUI.cell;el.classList.toggle('is-selected',on);el.setAttribute('aria-pressed',String(on));el.setAttribute('tabindex',on||!cryptidUI.cell&&el.dataset.cell==='c0'?'0':'-1');
  el.dataset.preview=on&&placing&&legal.includes(el.dataset.cell)?piece:'';
 });
}
function cryptidControls(r){
 const root=$('cryptidControls');if(!root||!r?.cryptid)return;
 const a=r.cryptid,cell=a.board.find(c=>c.id===cryptidUI.cell),active=CE.actor(a),mine=active===myId,done=r.status==='results';
 root.innerHTML=cell?'<h3 class="cryptid-cell-heading"><span>ช่องที่เลือก</span><strong>'+CE.coordinate(cell)+'</strong></h3>':'<h3>เลือกช่องบนแผนที่</h3>';
 if(cell){
  root.innerHTML+='<p class="cryptid-cell-detail"><span class="cryptid-terrain" data-terrain="'+esc(cell.terrain)+'">'+esc(CE.TERRAIN[cell.terrain])+'</span>'+(cell.animal?' · เขต'+(cell.animal==='bear'?'หมี':'เสือพูมา'):'')+(cell.structure?' · '+(cell.structure==='stone'?'เสาหิน':'กระท่อม')+'สี'+({white:'ขาว',green:'เขียว',blue:'น้ำเงิน'}[cell.structureColor]):'')+'</p>';
  root.innerHTML+=a.order.filter(p=>a.markers?.[cell.id]?.[p]).map(p=>'<div class="cryptid-cell-mark">'+cryptidToken(r,p)+esc(cryptidName(r,p))+' <b>'+ (a.markers[cell.id][p]==='yes'?'● วงกลม · ยังเป็นไปได้':'■ สี่เหลี่ยม · อยู่ที่นี่ไม่ได้')+'</b></div>').join('');
 }
 function button(text,action,value,disabled){const b=document.createElement('button');b.type='button';b.className='btn primary full';b.textContent=text;b.disabled=cryptidBusy||disabled;b.onclick=()=>cryptidSend(action,value);root.append(b);}
 if(done)return;
 if(a.phase==='ready'){
  button(a.ready?.[myId]?'คุณพร้อมแล้ว':'อ่านเบาะแสแล้ว · พร้อมเล่น','ready',null,!!a.ready?.[myId]);
  return;
 }
 if(CE.blocked(a,cell?.id))root.innerHTML+='<p class="muted hint">ช่องนี้มี ■ แล้ว ใช้ถาม ค้นหา หรือวางหมากเพิ่มไม่ได้</p>';
 if(!mine||a.phase==='search'){root.innerHTML+='<p class="muted hint">'+(a.phase==='search'?'กำลังเปิดผลค้นหาตามลำดับ…':'รอ '+esc(cryptidName(r,active))+' ทำรายการ')+'</p>';return;}
 if(['initial','penalty','extra'].includes(a.phase)){
  const yes=a.phase==='extra',legal=cell&&CE.legalCells(a,myId,yes).includes(cell.id);
  root.innerHTML+='<div class="cryptid-placement-guide '+(yes?'yes':'no')+'"><span>'+(yes?'●':'■')+'</span><div><strong>'+(yes?'กำลังวางวงกลม':'กำลังวางสี่เหลี่ยม')+'</strong><p>'+(yes?'ช่องนี้ยังเป็นไปได้ตามเบาะแสของคุณ':'ช่องนี้อยู่ไม่ได้ตามเบาะแสของคุณ')+'</p></div></div><p class="cryptid-action-hint">'+(yes?'เลือกช่องอื่นที่ตรงกับเบาะแส เพื่อเปิดข้อมูลเพิ่ม':'เลือกช่องที่ไม่ตรงกับเบาะแสของคุณ')+'</p>';
  if(cell&&!legal&&!CE.blocked(a,cell.id))root.innerHTML+='<p class="cryptid-invalid-placement">'+(a.markers?.[cell.id]?.[myId]?'คุณมีหมากในช่องนี้แล้ว':'ช่องนี้ไม่ตรงกับหมากที่ต้องวาง กรุณาเลือกช่องอื่น')+'</p>';
  button(cell?'ยืนยันวาง '+(yes?'●':'■')+' ที่ '+CE.coordinate(cell):'เลือกช่องที่จะวาง '+(yes?'●':'■'),a.phase,cell?.id,!legal);return;
 }
 if(a.phase==='action'){
  const options=a.order.filter(p=>p!==myId&&!a.markers?.[cell?.id]?.[p]);
  if(!options.includes(cryptidUI.target))cryptidUI.target=options[0]||'';
  const label=document.createElement('label');label.htmlFor='cryptidQuestionTarget';label.textContent='ถามใคร?';root.append(label);
  const select=document.createElement('select');select.id='cryptidQuestionTarget';select.disabled=!cell||CE.blocked(a,cell.id)||cryptidBusy;
  for(const p of options){const o=document.createElement('option');o.value=p;o.textContent=(a.order.indexOf(p)+1)+'. '+cryptidName(r,p);select.append(o);}select.value=cryptidUI.target;
  select.onchange=()=>{cryptidUI.target=select.value;cryptidControls(r);};root.append(select);
  button('ถามผู้เล่น','question',{cell:cell?.id,target:cryptidUI.target},!cell||CE.blocked(a,cell.id)||!cryptidUI.target);
  const search=document.createElement('button');search.type='button';search.className='btn soft full';search.textContent='⌖ ค้นหาช่องนี้';search.disabled=cryptidBusy||!cell||CE.blocked(a,cell.id)||!CE.allows(a,myId,cell.id);
  search.onclick=async()=>{
   const id=roomId,rev=a.revision,game=r.gamesPlayed;
   if(await confirmBox('ค้นหาช่อง '+CE.coordinate(cell)+'?', 'จะเปิดผลตามลำดับ ถ้ามีคนตอบว่าเป็นไปไม่ได้ คุณต้องวาง ■ เพิ่ม', 'เริ่มค้นหา')){
    if(id===roomId&&roomState?.gamesPlayed===game&&roomState?.cryptid?.revision===rev)cryptidSend('search',cell.id);
   }
  };root.append(search);
 }
}
function cryptidHistoryText(r,e){
 const a=r.cryptid,cell=a.board.find(c=>c.id===e.cell),pos=cell?CE.coordinate(cell):'',who=esc(cryptidName(r,e.by));
 const descriptions={initial:`${who} วาง ■ เริ่มต้นที่ ${pos}`,penalty:`${who} วาง ■ เพิ่มที่ ${pos}`,extra:`${who} วาง ● เพิ่มที่ ${pos}`,question:`${who} ถาม ${esc(cryptidName(r,e.target))} ที่ ${pos} → ${e.yes?'● เป็นไปได้':'■ เป็นไปไม่ได้'}`,search:`${who} ค้นหาที่ ${pos}`,response:`${who} ตอบผลค้นหาที่ ${pos} → ${e.yes?'● เป็นไปได้':'■ เป็นไปไม่ได้'}`,win:`${who} ค้นพบ Cryptid ที่ ${pos} · +1 คะแนน`,abort:`${who} ยุติเกม · ไม่คิดคะแนน`,exhausted:`${who} ไม่มีช่องถูกกติกาเหลือให้วาง ${e.piece==='yes'?'●':'■'} เพิ่ม · ข้ามขั้นตอนนี้`};return descriptions[e.type]||'';
}
function renderCryptid(r){
 const a=r.cryptid;if(!a){$('cryptidContent').textContent='ไม่พบข้อมูล Cryptid กรุณากลับเข้าห้องใหม่';return;}
 const game=roomId+':'+r.gamesPlayed;
 if(cryptidUI.game!==game){cryptidUI={game,revision:'',cell:null,target:'',zoom:1,clueOpen:false};cryptidBuild(r);}
 const revision=[a.revision,r.status,Object.keys(r.players||{}).join(','),r.hostId].join(':');
 const active=CE.actor(a),done=r.status==='results';
 $('cryptidPlayers').innerHTML=a.order.map(p=>'<div class="cryptid-player'+(!done&&p===active&&a.phase!=='ready'?' is-current':'')+'">'+cryptidToken(r,p)+'<span>'+esc(cryptidName(r,p))+(p===myId?' (คุณ)':'')+(r.gamePlayers?.[p]?.bot?' 🤖':'')+(!r.players?.[p]?' · ออฟไลน์':'')+'</span><b>'+(Number(r.scores?.[p])||0)+'</b></div>').join('');
 const phase={ready:`อ่านเบาะแสและกดพร้อม · ${a.order.filter(p=>a.ready?.[p]).length}/${a.order.length}`,initial:`เปิดข้อมูลเริ่มต้น ${(a.initialIndex||0)+1}/${a.order.length*2} · ${cryptidName(r,active)} วาง ■`,action:`ตาที่ ${a.turn} · ${cryptidName(r,active)} เลือกถามหรือค้นหา`,penalty:`${cryptidName(r,active)} ต้องวาง ■ เพิ่มก่อนจบตา`,extra:`${cryptidName(r,active)} ต้องวาง ● ที่ช่องอื่นก่อนค้นหา`,search:'กำลังตรวจผลค้นหาตามลำดับ…',finished:r.result?.aborted?'ยุติเกมแล้ว · ไม่คิดคะแนน':'ค้นพบสัตว์ลึกลับแล้ว!'};
 $('cryptidStatus').textContent=phase[a.phase]||'กำลังโหลด…';
 const missing=a.order.filter(p=>!r.players?.[p]);
 if(missing.length&&!done&&['initial','action','penalty','extra'].includes(a.phase)&&!r.players?.[active])$('cryptidStatus').textContent=`รอ ${cryptidName(r,active)} กลับเข้าห้อง · Host สามารถยุติเกมโดยไม่คิดคะแนน`;
 cryptidUpdateClue(r);cryptidControls(r);cryptidHighlight();
 if(cryptidUI.revision!==revision){
  cryptidUI.revision=revision;cryptidDrawBoard(r);
  const events=Object.entries(a.history||{}).sort(([x],[y])=>Number(y.slice(1))-Number(x.slice(1))).map(([,event])=>event);$('cryptidLastMove').hidden=!events.length;if(events.length)$('cryptidLastMove').innerHTML='<strong>เหตุการณ์ล่าสุด</strong><span>'+cryptidHistoryText(r,events[0])+'</span>';$('cryptidHistory').innerHTML=events.length?events.map(e=>'<p><small>ตา '+e.turn+'</small>'+cryptidHistoryText(r,e)+'</p>').join(''):'<p class="muted">ประวัติการถามและวางหมากจะแสดงที่นี่</p>';
 }
 $('cryptidResult').hidden=!done;
 if(done){
  const result=r.result||{},c=a.board.find(c=>c.id===a.solution);
  $('cryptidResult').innerHTML='<div class="cryptid-result-hero"><small>'+ (result.aborted?'เกมยุติแล้ว':'ผู้ค้นพบสัตว์ลึกลับ')+'</small><h2>'+esc(result.aborted?'ไม่มีการคิดคะแนน':cryptidName(r,result.winner))+'</h2><p>เฉลยตำแหน่ง '+CE.coordinate(c)+(result.aborted?'':' · +1 คะแนน')+'</p></div><div class="cryptid-revealed-clues">'+a.order.map(p=>'<p>'+cryptidToken(r,p)+'<strong>'+esc(cryptidName(r,p))+'</strong><span>'+esc(a.clues[p].text)+'</span></p>').join('')+'</div>';
 }
 const host=$('cryptidHostTools');host.replaceChildren();
 if(isHost){const b=document.createElement('button');b.type='button';b.className='btn '+(done?'primary':'outline')+' full';b.textContent=done?'กลับล็อบบี้ · เล่นแผนที่ใหม่':'ยุติเกมนี้ · ไม่คิดคะแนน';b.disabled=cryptidBusy;
  b.onclick=done?cryptidReturn:async()=>{const id=roomId,game=r.gamesPlayed;if(await confirmBox('ยุติเกมนี้?', 'ทุกคนจะเห็นเฉลยและไม่มีการคิดคะแนนสำหรับเกมนี้', 'ยุติเกม'))if(id===roomId&&roomState?.gamesPlayed===game)cryptidSend('abort');};host.append(b);
 }else if(done)host.textContent='รอ Host กลับล็อบบี้เพื่อเล่นเกมใหม่';
}

// Resume rendering if the initial room snapshot arrived before this script loaded.
if(roomState?.gameMode==='cryptid'){renderRoom(roomState);runAutomatic();}
