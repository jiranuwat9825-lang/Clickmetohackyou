/* Room controls and compact, responsive views for the additional party games. */
const AG=ArcadeEngine;
let arcadeBusy=false,arcadeRenderKey='',arcadeAutoAt=0;
const arcadeKey=r=>[roomId,r.gameMode,r.gamesPlayed,r.arcade?.revision].join(':');
const arcadeName=(r,id)=>(r.players?.[id]||r.gamePlayers?.[id]||r.playerProfiles?.[id])?.name||'ผู้เล่น';
function arcadeSelect(prefix,mode,value){
 const select=$(prefix+'Count'),meta=AG.GAMES[mode];if(!meta)return;
 if(select.dataset.mode!==mode){select.replaceChildren();for(let n=meta.min;n<=meta.max;n++){const o=document.createElement('option');o.value=String(n);o.textContent=n+' คน';select.append(o);}select.dataset.mode=mode;}
 select.value=String(value);
}
function arcadeCreateSettings(mode){
 const meta=AG.GAMES[mode],count=Math.max(meta.min,Math.min(meta.max,meta.defaultCount||4));
 arcadeSelect('arcadeCreate',mode,count);$('arcadeCreateTitle').textContent='ตั้งค่า '+meta.name;$('arcadeCreateSummary').textContent=meta.help||meta.tag;
}
function renderArcadeLobby(r){
 const meta=AG.GAMES[r.gameMode],panel=$('arcadeLobbySettings'),count=Number(r.arcadeCount||meta.defaultCount||meta.min);
 panel.hidden=false;
 const key=[roomId,r.gameMode,count].join(':');if(panel.dataset.savedKey!==key){arcadeSelect('arcadeLobby',r.gameMode,count);panel.dataset.savedKey=key;}
 $('arcadeLobbyTitle').textContent='ตั้งค่า '+meta.name;
 $('arcadeLobbyCount').disabled=!isHost||arcadeBusy;$('arcadeLobbySave').hidden=!isHost;
 $('arcadeLobbySave').disabled=arcadeBusy||Number($('arcadeLobbyCount').value)===count;
 $('arcadeLobbyHint').textContent=meta.help||meta.tag;
 $('arcadeBotTools').hidden=!isHost||!meta.bots;
 const players=Object.values(r.players||{}),bots=players.filter(p=>p.bot).length;
 $('arcadeBotCount').textContent=`ผู้เล่น ${players.length-bots} คน · บอท ${bots} ตัว · ${players.length}/${count}`;
 $('arcadeAddBot').disabled=$('arcadeFillBots').disabled=arcadeBusy||players.length>=count;
 $('arcadeRemoveBots').disabled=arcadeBusy||!bots;
}
$('arcadeLobbyCount').onchange=()=>renderArcadeLobby(roomState);
$('arcadeLobbySave').onclick=async()=>{
 if(!roomId||!isHost||arcadeBusy)return;
 const id=roomId,count=Number($('arcadeLobbyCount').value);arcadeBusy=true;
 try{const result=await getRef().transaction(r=>{const meta=AG.GAMES[r?.gameMode];if(id!==roomId||!meta||r.hostId!==myId||r.status!=='lobby'||!Number.isInteger(count)||count<meta.min||count>meta.max||Object.keys(r.players||{}).length>count)return;r.arcadeCount=count;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);toast(result.committed?'บันทึกแล้ว':'ตรวจสอบจำนวนผู้เล่น',result.committed?'success':'error');}
 catch(e){error(e);}finally{arcadeBusy=false;if(id===roomId&&roomState)renderArcadeRoom(roomState);}
};
async function arcadeBots(action){
 if(!isHost||!roomId||arcadeBusy)return;const id=roomId;arcadeBusy=true;
 try{await getRef().transaction(r=>{if(id!==roomId||!AG.manageBots(r,myId,action))return;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);}
 catch(e){error(e);}finally{arcadeBusy=false;if(id===roomId&&roomState)renderArcadeRoom(roomState);}
}
for(const [id,action] of [['arcadeAddBot','add'],['arcadeFillBots','fill'],['arcadeRemoveBots','remove']])$(id).onclick=()=>arcadeBots(action);
async function arcadeStart(){
 if(!roomId||!isHost||arcadeBusy)return;
 const r=roomState,id=roomId,round=r.gamesPlayed||0,ids=Object.keys(r.players||{}),count=Number(r.arcadeCount||AG.GAMES[r.gameMode].min);
 if(Number($('arcadeLobbyCount').value)!==count){toast('บันทึกจำนวนผู้เล่นก่อนเริ่มเกม','error');return;}
 const prepared=copyPack(r);if(!AG.setup(prepared,ids))return;
 arcadeBusy=true;
 try{await getRef().transaction(x=>{if(id!==roomId||!x||x.status!=='lobby'||x.hostId!==myId||x.gameMode!==r.gameMode||(x.gamesPlayed||0)!==round||Number(x.arcadeCount||AG.GAMES[x.gameMode]?.min)!==count||Object.keys(x.players||{}).length!==ids.length||!ids.every(p=>x.players[p]))return;for(const key of ['arcade','gamePlayers','playerProfiles','result','gamesPlayed','status'])x[key]=prepared[key];x.lastActivityAt=TIMESTAMP();return x;},undefined,false);}
 catch(e){error(e);}finally{arcadeBusy=false;if(id===roomId&&roomState)renderArcadeRoom(roomState);}
}
async function arcadeSend(type,value){
 if(!roomId||arcadeBusy||!isArcadeMode(roomState?.gameMode))return;
 const id=roomId,key=arcadeKey(roomState),rev=roomState.arcade?.revision;arcadeBusy=true;
 try{const result=await getRef().transaction(r=>{if(id!==roomId||!r||arcadeKey(r)!==key||!AG.apply(r,myId,type,value,rev))return;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);if(!result.committed)toast('สถานะเกมเปลี่ยนแล้ว ลองใหม่อีกครั้ง','error');}
 catch(e){error(e);}finally{arcadeBusy=false;if(id===roomId&&roomState)renderArcade(roomState);}
}
async function arcadeAuto(){
 if(autoBusy||arcadeBusy||!isHost||!roomId||roomState?.status!=='arcade_playing'||Date.now()-arcadeAutoAt<700)return;
 const id=roomId,key=arcadeKey(roomState),move=AG.nextBotAction(roomState);if(!move)return;
 autoBusy=true;arcadeAutoAt=Date.now();
 try{await getRef().transaction(r=>{if(id!==roomId||r?.hostId!==myId||arcadeKey(r)!==key||!r.players?.[move.id]?.bot||!AG.apply(r,move.id,move.type,move.value,r.arcade.revision))return;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);}
 catch(e){error(e);}finally{autoBusy=false;}
}
async function arcadeReturn(){
 if(!isHost||!roomId||arcadeBusy)return;const id=roomId,key=arcadeKey(roomState);arcadeBusy=true;
 try{await getRef().transaction(r=>{if(id!==roomId||!r||r.hostId!==myId||r.status!=='results'||arcadeKey(r)!==key)return;r.status='lobby';r.arcade=null;r.gamePlayers=null;r.result=null;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);}
 catch(e){error(e);}finally{arcadeBusy=false;}
}
function renderArcadeRoom(r){
 const meta=AG.GAMES[r.gameMode];if(!meta)return;
 $('roomTitle').textContent=r.roomName||'ห้อง '+roomId;$('roomCode').textContent=r.roomCode||roomId;
 $('roomMeta').textContent=meta.name+' · '+(r.arcadeCount||meta.min)+' คน · '+meta.tag;
 $('roomScoreboard').hidden=true;$('roomScoreboard').parentElement.classList.add('avalon-layout');
 $('deleteRoomBtn').hidden=!(isHost&&r.status==='lobby');
 if(r.status==='finished'){showScreen('grandFinalScreen');renderGrandFinal(r);return;}
 showScreen(r.status==='lobby'?'lobbyScreen':'arcadeScreen');
 if(r.status!=='lobby'){renderArcade(r);return;}
 renderLobbySettingsToggle();renderArcadeLobby(r);
 for(const id of ['tabletopLobbySettings','cheeseLobbySettings','cryptidLobbySettings','avalonLobbySettings','insiderLobbySettings','whoCustomLobbySettings','lobbyCategoryPanel','lobbyFormatPanel','lobbySpyFormatPanel'])$(id).hidden=true;
 const ids=Object.keys(r.players||{});$('playerList').replaceChildren();
 ids.forEach((id,i)=>{const el=document.createElement('div');el.className='player-row';el.innerHTML='<span class="player-rank">'+(i+1)+'</span>'+playerLabelHTML(id,r)+(id===r.hostId?'<span class="host-tag">HOST</span>':'');if(isHost&&id!==myId){const b=document.createElement('button');b.type='button';b.className='lobby-kick-btn';b.textContent='เตะออก';b.onclick=()=>kickLobbyPlayer(id);el.append(b);}$('playerList').append(el);});
 const count=Number(r.arcadeCount||meta.min);
 $('startBtn').hidden=!isHost;$('startBtn').disabled=arcadeBusy||ids.length!==count;
 $('startBtn').textContent=ids.length===count?'เริ่มเกม':`ต้องมีผู้เล่น ${count} คน (${ids.length}/${count})`;
 $('finishMatchPanel').hidden=!(isHost&&Number(r.gamesPlayed||0)>0);
 $('lobbyNotice').hidden=isHost;$('lobbyNotice').textContent='รอ Host เริ่มเกม';
}
function arcadeLog(e,r){
 const name=id=>arcadeName(r,id);
 switch(e.type){
  case 'deal':return 'เริ่มยก '+e.round;
  case 'reveal':return 'เปิดไพ่ '+e.cards.join(', ');
  case 'place':return name(e.by)+' วาง '+e.card+' แถว '+(e.row+1);
  case 'take':return name(e.by)+' เก็บแถว '+(e.row+1)+' · +'+e.penalty+' แต้มลบ';
  case 'end':return e.winners.map(name).join(', ')+' ชนะ';
  case 'abort':return 'ยุติเกม';
  default:return '';
 }
}
function renderArcade(r){
 const v=AG.view(r,myId),root=$('arcadeContent');if(!v){root.textContent='กำลังโหลดเกม…';return;}
 const key=arcadeKey(r)+':'+arcadeBusy;if(arcadeRenderKey===key)return;arcadeRenderKey=key;
 const meta=AG.GAMES[v.mode],done=r.status==='results',own=v.people[myId];
 root.className='ag-game';root.replaceChildren();
 const header=document.createElement('header');header.className='ag-heading';header.innerHTML='<div><span class="ag-kicker">'+meta.tag+'</span><h2>'+meta.name+'</h2></div><span class="ag-badge">ยก '+v.round+' · ใบ '+v.step+'/10</span>';root.append(header);
 const status=document.createElement('div');status.className='ag-status';status.setAttribute('role','status');
 status.textContent=done?r.result?.aborted?'ยุติเกมแล้ว':r.result?.winners?.map(id=>arcadeName(r,id)).join(', ')+' ชนะ':v.phase==='choose_row'?'ต้องเลือกแถวเพื่อเก็บ':'ทุกคนเลือกไพ่หนึ่งใบ';root.append(status);
 const stats=document.createElement('div');stats.className='ag-players';
 for(const id of v.order){const p=v.people[id],el=document.createElement('div');el.className='ag-player'+(id===myId?' is-self':'');el.innerHTML='<strong>'+esc(arcadeName(r,id))+(id===myId?' · คุณ':'')+'</strong><span>แต้มลบ '+p.penalty+' · ไพ่ '+p.count+' ใบ'+(p.chosen?' · เลือกแล้ว':'')+'</span>';stats.append(el);}root.append(stats);
 const layout=document.createElement('div');layout.className='ag-layout';root.append(layout);
 const board=document.createElement('section');board.className='ag-board';board.innerHTML='<h3>แถวไพ่ <small>ใบที่ 6 ต้องเก็บแถว</small></h3>';layout.append(board);
 v.rows.forEach((row,i)=>{const line=document.createElement('div');line.className='ag-row';line.innerHTML='<span class="ag-row-label">'+(i+1)+'</span><div class="ag-cards">'+row.map(n=>'<span class="ag-card"><b>'+n+'</b><small>● '+AG.bullheads(n)+'</small></span>').join('')+'</div>';if(v.phase==='choose_row'&&v.waiting?.id===myId){const b=document.createElement('button');b.type='button';b.className='btn soft small';b.textContent='เก็บแถวนี้';b.disabled=arcadeBusy;b.onclick=()=>arcadeSend('row',i);line.append(b);}board.append(line);});
 const side=document.createElement('aside');side.className='ag-side';layout.append(side);
 if(v.phase==='choose_row'){const p=document.createElement('p');p.textContent=arcadeName(r,v.waiting.id)+' วางไพ่ '+v.waiting.card+' ต่ำกว่าทุกแถว ต้องเลือกแถวเก็บ';side.append(p);}
 else if(own){const h=document.createElement('h3');h.textContent='ไพ่ของคุณ';side.append(h);const hint=document.createElement('p');hint.className='muted';hint.textContent=own.chosen?'เลือกไพ่แล้ว รอทุกคนเปิดพร้อมกัน':'เลือกหนึ่งใบเพื่อคว่ำไว้';side.append(hint);
  const hand=document.createElement('div');hand.className='ag-hand';side.append(hand);
  for(const n of own.hand||[]){const b=document.createElement('button');b.type='button';b.className='ag-card ag-card-button';b.innerHTML='<b>'+n+'</b><small>● '+AG.bullheads(n)+'</small>';b.disabled=arcadeBusy||done||v.phase!=='choose'||own.chosen;b.setAttribute('aria-label','เลือกไพ่ '+n);b.onclick=()=>arcadeSend('pick',n);hand.append(b);}
 }
 const details=document.createElement('details');details.className='ag-details';details.innerHTML='<summary>วิธีเล่นสั้น ๆ</summary><p>เลือกไพ่พร้อมกันทุกตา ระบบวางไพ่เลขน้อยก่อน ไปต่อท้ายแถวที่เลขต่ำกว่าและใกล้ที่สุด หากเป็นใบที่ 6 ต้องเก็บห้าใบเดิมเป็นแต้มลบ ไพ่ต่ำกว่าทุกแถวเลือกแถวที่จะเก็บเอง</p><p>แจก 10 ใบต่อยก เล่นจนมีคนแต้มลบ 66 ขึ้นไป คนที่มีแต้มลบน้อยที่สุดชนะ</p>';root.append(details);
 const history=document.createElement('details');history.className='ag-details';history.innerHTML='<summary>ประวัติการเล่น</summary><ol>'+v.history.slice().reverse().map(e=>'<li>'+esc(arcadeLog(e,r))+'</li>').join('')+'</ol>';root.append(history);
 if(isHost){const tools=document.createElement('div');tools.className='ag-host';root.append(tools);const b=document.createElement('button');b.type='button';b.className='btn '+(done?'primary':'outline small');b.textContent=done?'กลับล็อบบี้':'ยุติเกม · ไม่คิดคะแนน';b.onclick=done?arcadeReturn:async()=>{const id=roomId,key=arcadeKey(roomState);if(await confirmBox('ยุติเกมนี้?','รอบนี้จะไม่คิดคะแนน')&&id===roomId&&key===arcadeKey(roomState))await arcadeSend('abort');};tools.append(b);}
}
