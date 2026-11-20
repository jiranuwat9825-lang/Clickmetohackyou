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
 if(v.mode==='just_one'){renderArcadeJust(r,v,root);return;}
 if(v.mode==='wavelength'){renderArcadeWave(r,v,root);return;}
 if(v.mode==='codenames'){renderArcadeCode(r,v,root);return;}
 renderArcadeTake6(r,v,root);
}
function arcadeBase(root,title,kicker,progress){
 root.className='ag-game';root.replaceChildren();
 const header=document.createElement('header');header.className='ag-heading';header.innerHTML='<div><span class="ag-kicker">'+esc(kicker)+'</span><h2>'+esc(title)+'</h2></div><span class="ag-badge">'+esc(progress)+'</span>';root.append(header);
 const panel=document.createElement('section');panel.className='ag-panel';root.append(panel);return panel;
}
function arcadeButton(parent,label,action,soft=false){const b=document.createElement('button');b.type='button';b.className='btn '+(soft?'soft':'primary');b.textContent=label;b.disabled=arcadeBusy;b.onclick=action;parent.append(b);return b;}
function arcadeInput(parent,label,placeholder=''){
 const l=document.createElement('label');l.className='ag-field';l.textContent=label;
 const input=document.createElement('input');input.type='text';input.maxLength=80;input.placeholder=placeholder;l.append(input);parent.append(l);return input;
}
function renderArcadeJust(r,v,root){
 const done=r.status==='results',mine=v.guesser===myId,p=arcadeBase(root,'Just One','ใบ้คำร่วมกัน · คำซ้ำถูกตัด',`ได้ ${v.won} · เหลือ ${v.remaining} ใบ`);
 const who=document.createElement('p');who.className='ag-status';who.textContent=done?(v.result?.aborted?'ยุติเกมแล้ว':`จบเกม · ทายถูก ${v.won} ใบ`):`ผู้ทาย: ${arcadeName(r,v.guesser)}${mine?' (คุณ)':''}`;p.append(who);
 if(v.last){const x=document.createElement('p');x.className='muted';x.textContent=`ใบก่อน: ${v.last.answer} · ${v.last.correct?'ทายถูก':v.last.guess==='ข้าม'?'ข้าม':'ทายผิด'}`;p.append(x);}
 if(!done&&v.phase==='choose_word'){
  const x=document.createElement('p');x.textContent=mine?'เลือกเลขหนึ่งช่อง โดยยังไม่เห็นคำ':'รอผู้ทายเลือกเลข 1–5';p.append(x);
  if(mine){const row=document.createElement('div');row.className='ag-actions';p.append(row);for(let n=1;n<=5;n++)arcadeButton(row,String(n),()=>arcadeSend('choose_word',n-1),true);}
 }
 if(!done&&v.phase==='clue'){
  const x=document.createElement('p');x.textContent=mine?`คุณเลือกช่อง ${v.number} · รอคำใบ้ ${v.submissions}/${v.required} คน`:`คำที่ ${v.number}: ${v.word} · เขียนคำใบ้ ${v.order.length<=4?'2 คำ':'1 คำ'} โดยไม่ให้ผู้ทายเห็น`;p.append(x);
  if(!mine&&!v.ownSubmitted){const first=arcadeInput(p,'คำใบ้ที่ 1','หนึ่งคำ');let second;if(v.order.length<=4)second=arcadeInput(p,'คำใบ้ที่ 2','หนึ่งคำ');arcadeButton(p,'ส่งคำใบ้',()=>arcadeSend('clue',second?[first.value,second.value]:[first.value]));}
 }
 if(!done&&v.phase==='review'){
  const x=document.createElement('p');x.textContent=mine?'กำลังตัดคำใบ้ที่ซ้ำหรือผิดกติกา':'ตรวจคำใบ้ที่ซ้ำ คล้ายกัน หรือผิดกติกา ก่อนให้ผู้ทายดู';p.append(x);
  if(!mine){const list=document.createElement('div');list.className='ag-clue-list';p.append(list);
   for(const c of v.clues){const line=document.createElement('div');line.className='ag-clue'+(c.removed?' is-cut':'');line.textContent=c.word+' · '+arcadeName(r,c.by)+(c.removed?' · ตัดแล้ว':'');if(v.reviewer===myId)arcadeButton(line,c.removed?'คืนคำ':'ตัดคำ',()=>arcadeSend('cancel',c.key),true);list.append(line);}
   if(v.reviewer===myId)arcadeButton(p,'ให้ผู้ทายดู',()=>arcadeSend('show'));
  }
 }
 if(!done&&v.phase==='guess'){
  const x=document.createElement('p');x.textContent=mine?'คำใบ้ที่ใช้ได้':'ผู้ทายกำลังตอบ';p.append(x);
  if(mine){const list=document.createElement('div');list.className='ag-clue-list';for(const c of v.clues.filter(c=>!c.removed)){const t=document.createElement('span');t.className='ag-clue';t.textContent=c.word;list.append(t);}if(!list.children.length)list.textContent='ไม่มีคำใบ้เหลือ';p.append(list);
   const input=arcadeInput(p,'คำตอบ','พิมพ์คำที่ทาย');const actions=document.createElement('div');actions.className='ag-actions';p.append(actions);arcadeButton(actions,'ตอบ',()=>arcadeSend('answer',input.value));arcadeButton(actions,'ข้าม',()=>arcadeSend('pass'),true);
  }else {const t=document.createElement('p');t.className='muted';t.textContent=`คำเฉลย: ${v.word}`;p.append(t);}
 }
 const help=document.createElement('details');help.className='ag-details';help.innerHTML='<summary>กติกาสั้น ๆ</summary><p>ผู้ทายเลือกเลข 1–5 โดยไม่เห็นคำ คนอื่นเขียนคำใบ้ลับ คำที่ซ้ำหรือคล้ายกันต้องตัดก่อนเปิดให้ผู้ทายดู ทายถูกเก็บ 1 ใบ ข้ามทิ้ง 1 ใบ ทายผิดทิ้ง 2 ใบ</p><p>มี 13 ใบ · ถ้าทายถูกอย่างน้อย 9 ใบ ทุกคนได้ 1 แต้ม</p>';root.append(help);
 arcadeHostControls(root,r,done);
}
function renderArcadeWave(r,v,root){
 const done=r.status==='results',psychic=v.psychic===myId,setter=v.setter===myId;
 const p=arcadeBase(root,'Wavelength','หาจุดบนสเกลด้วยคำใบ้',`รอบ ${v.round}/8 · ${v.total} แต้ม`);
 const info=document.createElement('p');info.className='ag-status';info.textContent=done?`จบเกม · รวม ${v.total} แต้ม`:v.phase==='clue'?`คนใบ้: ${arcadeName(r,v.psychic)}`:v.phase==='dial'?`คนยืนยันหน้าปัด: ${arcadeName(r,v.setter)}`:`เปิดเป้าหมายแล้ว · รอบนี้ +${v.last?.points||0} แต้ม`;p.append(info);
 const spectrum=document.createElement('div');spectrum.className='ag-spectrum';const left=document.createElement('strong');left.textContent=v.spectrum[0];const right=document.createElement('strong');right.textContent=v.spectrum[1];spectrum.append(left,right);p.append(spectrum);
 const meter=document.createElement('div');meter.className='ag-meter';p.append(meter);
 if(v.target!==undefined){const mark=document.createElement('span');mark.className='ag-marker is-target';mark.style.left=v.target+'%';mark.title='เป้าหมาย '+v.target;meter.append(mark);}
 if(v.dial!==null){const mark=document.createElement('span');mark.className='ag-marker is-dial';mark.style.left=v.dial+'%';mark.title='หน้าปัด '+v.dial;meter.append(mark);}
 if(!done&&v.phase==='clue'){
  const t=document.createElement('p');t.textContent=psychic?`เป้าหมายของคุณ: ${v.target}/100 · ยกตัวอย่างสิ่งที่อยู่ตรงตำแหน่งนี้`:'รอคนใบ้ดูตำแหน่งลับและส่งคำใบ้';p.append(t);
  if(psychic){const input=arcadeInput(p,'คำใบ้หนึ่งคำหรือวลี','เช่น รถไฟเหาะ');arcadeButton(p,'ส่งคำใบ้',()=>arcadeSend('clue',input.value));}
 }
 if(!done&&v.phase==='dial'){
  const t=document.createElement('p');t.textContent=`คำใบ้: ${v.clue}`;t.className='ag-wave-clue';p.append(t);
  if(psychic){const msg=document.createElement('p');msg.className='muted';msg.textContent='ให้คนอื่นคุยกันแล้วปรับหน้าปัด คุณเป็นคนใบ้ในรอบนี้';p.append(msg);}
  else {const wrap=document.createElement('label');wrap.className='ag-field';wrap.textContent='ตำแหน่งหน้าปัด';const range=document.createElement('input');range.type='range';range.min='0';range.max='100';range.value=String(v.dial??50);const output=document.createElement('strong');output.textContent=range.value+' / 100';range.oninput=()=>output.textContent=range.value+' / 100';wrap.append(range,output);p.append(wrap);arcadeButton(p,'วางหน้าปัด',()=>arcadeSend('dial',Number(range.value)),true);}
  if(setter&&v.dial!==null)arcadeButton(p,'เปิดเป้าหมาย',()=>arcadeSend('reveal'));
 }
 if(!done&&v.phase==='reveal'){
  const t=document.createElement('p');t.textContent=`เป้าหมาย ${v.last.target} · หน้าปัด ${v.last.dial} · ได้ ${v.last.points} แต้ม`;p.append(t);
  if(setter)arcadeButton(p,v.round===8?'ดูผลเกม':'รอบถัดไป',()=>arcadeSend('next'));
 }
 const help=document.createElement('details');help.className='ag-details';help.innerHTML='<summary>กติกาสั้น ๆ</summary><p>คนใบ้เห็นตำแหน่งลับระหว่างสองขั้ว แล้วให้คำใบ้ คนอื่นหารือกันและปรับหน้าปัด คนยืนยันเปิดเฉลย</p><p>โหมดร่วมมือ 8 รอบ ใกล้เป้าหมายได้ 1–4 แต้ม รวมอย่างน้อย 16 แต้ม ทุกคนได้ +1 คะแนนในห้อง</p>';root.append(help);
 arcadeHostControls(root,r,done);
}
function renderArcadeCode(r,v,root){
 const done=r.status==='results',team=v.teams.red.includes(myId)?'red':'blue',master=v.spymasters[team]===myId,active=v.turn===team;
 const p=arcadeBase(root,'Codenames','สองทีม · หนึ่งคำใบ้',`แดง ${v.remaining.red} · น้ำเงิน ${v.remaining.blue}`);
 const status=document.createElement('p');status.className='ag-status';status.textContent=done?v.result?.aborted?'ยุติเกมแล้ว':`ทีม${v.teams.red.includes(v.result?.winners?.[0])?'แดง':'น้ำเงิน'}ชนะ`:`ตาทีม${v.turn==='red'?'แดง':'น้ำเงิน'} · คุณอยู่ทีม${team==='red'?'แดง':'น้ำเงิน'}${master?' (หัวหน้าสายลับ)':' (ผู้ทาย)'}`;p.append(status);
 const roles=document.createElement('div');roles.className='ag-teams';p.append(roles);
 for(const color of ['red','blue']){const t=document.createElement('div');t.className='ag-team ag-'+color;t.textContent=`ทีม${color==='red'?'แดง':'น้ำเงิน'} · หัวหน้า ${arcadeName(r,v.spymasters[color])} · ${v.teams[color].map(id=>arcadeName(r,id)).join(', ')}`;roles.append(t);}
 if(!done&&v.phase==='clue'){
  const t=document.createElement('p');t.textContent=active&&master?'ดูสีของคำบนกระดานแล้วใบ้หนึ่งคำกับจำนวน':`รอหัวหน้าสายลับทีม${v.turn==='red'?'แดง':'น้ำเงิน'}ให้คำใบ้`;p.append(t);
  if(active&&master){const word=arcadeInput(p,'คำใบ้หนึ่งคำ','ห้ามใช้คำบนกระดาน');word.maxLength=35;const num=document.createElement('label');num.className='ag-field';num.textContent='จำนวนคำที่เกี่ยวข้อง';const count=document.createElement('select');for(let n=1;n<=9;n++){const opt=document.createElement('option');opt.value=n;opt.textContent=n;count.append(opt);}num.append(count);p.append(num);arcadeButton(p,'ส่งคำใบ้',()=>arcadeSend('code_clue',{word:word.value,number:Number(count.value)}));}
 }
 if(!done&&v.phase==='guess'){
  const t=document.createElement('p');t.className='ag-wave-clue';t.textContent=`คำใบ้: ${v.clue.word} · ${v.clue.number}`;p.append(t);
  if(active&&!master)arcadeButton(p,'จบตา',()=>arcadeSend('end_turn'),true);
 }
 const board=document.createElement('div');board.className='ag-code-grid';root.append(board);
 v.cells.forEach((cell,i)=>{const b=document.createElement('button');b.type='button';b.className='ag-code-cell'+(cell.key?' is-'+cell.key:'')+(cell.revealed?' is-open':'');b.textContent=cell.word;b.disabled=arcadeBusy||done||v.phase!=='guess'||!active||master||cell.revealed;b.title=cell.key&&master?'ทีม '+cell.key:'';b.onclick=()=>arcadeSend('code_guess',i);board.append(b);});
 const help=document.createElement('details');help.className='ag-details';help.innerHTML='<summary>กติกาสั้น ๆ</summary><p>หัวหน้าสายลับเห็นสีคำทั้งหมด ให้คำใบ้หนึ่งคำพร้อมตัวเลข ผู้ทายเปิดได้ไม่เกินตัวเลข+1 ใบ และหยุดเองได้</p><p>เปิดคำทีมตัวเองให้ครบก่อนชนะ คำกลางหรือคำทีมตรงข้ามจบตา เปิดมือสังหารแพ้ทันที</p>';root.append(help);
 arcadeHostControls(root,r,done);
}
function arcadeHostControls(root,r,done){
 if(!isHost)return;const tools=document.createElement('div');tools.className='ag-host';root.append(tools);
 const b=arcadeButton(tools,done?'กลับล็อบบี้':'ยุติเกม · ไม่คิดคะแนน',done?arcadeReturn:async()=>{const id=roomId,key=arcadeKey(roomState);if(await confirmBox('ยุติเกมนี้?','รอบนี้จะไม่คิดคะแนน')&&id===roomId&&key===arcadeKey(roomState))await arcadeSend('abort');},!done);b.classList.toggle('small',!done);
}
function renderArcadeTake6(r,v,root){
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
 arcadeHostControls(root,r,done);
}
