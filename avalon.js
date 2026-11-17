// Avalon game state machine. Shared room mutations use RTDB transactions.
const AVALON_SIZES=[3,4,4,5,5], AVALON_RED=new Set(['Mordred','Assassin','Morgana','Oberon']);
const avalonSide=role=>AVALON_RED.has(role)?'red':'blue';
const avalonDeck=n=>[9,10].includes(n)?['Merlin','Percival',...Array(4).fill('Loyal Servant of Arthur'),'Mordred','Assassin','Morgana',...(n===10?['Oberon']:[])]:[];
function avalonSetup(r,ids){
 const n=Number(r.avalonCount||9),deck=avalonDeck(n);
 if(r.gameMode!=='avalon'||r.status!=='lobby'||!deck.length||ids.length!==n)return false;
 r.gamePlayers=copyPack(r.players);r.playerProfiles={...(r.playerProfiles||{}),...copyPack(r.players)};
 r.roles={};r.result=null;r.gamesPlayed=(Number(r.gamesPlayed)||0)+1;
 r.avalon={order:shuffle(ids),deck:shuffle(deck),cards:{},ready:{},mission:1,king:0,rejections:0,history:{},proposals:{},proposalNo:0,angelChecks:{}};
 r.status='avalon_draft';r.lastActivityAt=TIMESTAMP();return true;
}
function avalonIntel(r,id){
 const role=r.roles?.[id],others=Object.entries(r.roles||{}).filter(([p])=>p!==id);
 let visible=()=>false;
 if(role==='Merlin')visible=v=>AVALON_RED.has(v)&&v!=='Mordred';
 if(role==='Percival')visible=v=>v==='Merlin'||v==='Morgana';
 if(AVALON_RED.has(role)&&role!=='Oberon')visible=v=>AVALON_RED.has(v)&&v!=='Oberon';
 return others.filter(([,v])=>visible(v)).map(([p])=>p);
}
// Inspection markers belong to the player who performed each check, not the current Angel.
function avalonInspectedSides(r,id){
 const sides=new Map();
 if(!r?.avalonAngel||!id)return sides;
 for(const check of Object.values(r.avalon?.angelChecks||{})){
  if(check?.by===id&&check.target&&['red','blue'].includes(check.side))sides.set(check.target,check.side);
 }
 return sides;
}
function avalonFinish(r,side,reason,target){
 r.status='results';r.result={type:'avalon',winner:side,reason,...(target?{assassinated:target}:{})};
}
function avalonRotate(r,newMission){
 const a=r.avalon,n=a.order.length;a.king=(a.king+1)%n;
 if(newMission&&r.avalonAngel)a.angel=(a.angel+1)%n;
 a.team=[];a.approvals={};a.questVotes={};r.status='avalon_team';
}
function avalonTeamApproved(r){
 const a=r.avalon,ids=a.order,yes=ids.filter(p=>a.approvals?.[p]===true).length;
 const record={mission:a.mission,king:a.order[a.king],team:[...a.team],votes:{...a.approvals},yes,no:ids.length-yes,approved:yes>ids.length/2};
 a.proposalNo=(Number(a.proposalNo)||0)+1;a.proposals||={};a.proposals['p'+a.proposalNo]=record;
 if(record.approved){a.rejections=0;a.questVotes={};r.status='avalon_quest';}
 else{a.rejections=(Number(a.rejections)||0)+1;if(a.rejections>=5)avalonFinish(r,'red','rejections');else avalonRotate(r,false);}
}
function avalonResolveQuest(r){
 const a=r.avalon,fail=a.team.filter(p=>a.questVotes?.[p]===false).length,success=a.team.length-fail,passed=fail<(a.mission===4?2:1);
 const approvedProposal=Object.entries(a.proposals||{}).sort(([x],[y])=>Number(y.slice(1))-Number(x.slice(1))).map(([,p])=>p).find(p=>p.mission===a.mission&&p.approved);
 const playerNames=Object.fromEntries(a.team.map(p=>[p,r.gamePlayers?.[p]?.name||r.playerProfiles?.[p]?.name||r.players?.[p]?.name||'ผู้เล่น']));
 a.history||={};a.history['m'+a.mission]={mission:a.mission,king:approvedProposal?.king||null,team:[...a.team],playerNames,votes:{...a.questVotes},success,fail,passed};
 a.questVotes={}; // Retain aggregate counts only after resolution.
 const results=Object.values(a.history),wins=results.filter(x=>x.passed).length,losses=results.length-wins;
 if(losses>=3)avalonFinish(r,'red','missions');
 else if(wins>=3)r.status='avalon_assassin';
 else{a.mission++;avalonRotate(r,true);}
}
function avalonApply(r,id,action,value){
 if(!r||r.gameMode!=='avalon'||!r.avalon||!r.players?.[id])return false;
 const a=r.avalon,ids=a.order;if(!ids.includes(id))return false;
 const cards=a.cards||{},picked=Object.keys(cards).length;
 if(action==='card'){
  if(r.status!=='avalon_draft'||ids[picked]!==id||Object.values(cards).includes(value)||!Number.isInteger(value)||value<0||value>=a.deck.length||Object.hasOwn(cards,id))return false;
  a.cards||={};a.cards[id]=value;r.roles||={};r.roles[id]=a.deck[value];
  if(picked+1===ids.length)r.status='avalon_ready';
 }else if(action==='ready'){
  if(r.status!=='avalon_ready'||!r.roles?.[id]||a.ready?.[id])return false;
  a.ready||={};a.ready[id]=true;
  if(ids.every(p=>a.ready[p]===true)){a.king=Math.floor(Math.random()*ids.length);if(r.avalonAngel)a.angel=(a.king+1)%ids.length;r.status='avalon_team';}
 }else if(action==='team'){
  if(r.status!=='avalon_team'||(r.avalonAngel&&!a.angelChecks?.['m'+a.mission])||ids[a.king]!==id||!Array.isArray(value)||value.length!==AVALON_SIZES[a.mission-1]||new Set(value).size!==value.length||!value.every(p=>ids.includes(p)))return false;
  a.team=[...value];a.approvals={};r.status='avalon_approve';
 }else if(action==='approve'){
  if(r.status!=='avalon_approve'||typeof value!=='boolean'||Object.hasOwn(a.approvals||{},id))return false;
  a.approvals||={};a.approvals[id]=value;
  if(ids.every(p=>Object.hasOwn(a.approvals,p)))avalonTeamApproved(r);
 }else if(action==='quest'){
  if(r.status!=='avalon_quest'||!a.team?.includes(id)||typeof value!=='boolean'||Object.hasOwn(a.questVotes||{},id)||(!value&&!AVALON_RED.has(r.roles?.[id])))return false;
  a.questVotes||={};a.questVotes[id]=value;
  if(a.team.every(p=>Object.hasOwn(a.questVotes,p)))avalonResolveQuest(r);
 }else if(action==='angel'){
  if(!r.avalonAngel||r.status!=='avalon_team'||ids[a.angel]!==id||!ids.includes(value)||value===id||a.angelChecks?.['m'+a.mission])return false;
  a.angelChecks||={};a.angelChecks['m'+a.mission]={by:id,target:value,side:avalonSide(r.roles[value])};
 }else if(action==='assassin'){
  if(r.status!=='avalon_assassin'||r.roles?.[id]!=='Assassin'||!ids.includes(value)||value===id)return false;
  const correct=r.roles?.[value]==='Merlin';avalonFinish(r,correct?'red':'blue',correct?'assassinated':'assassin_missed',value);
 }else return false;
 r.lastActivityAt=TIMESTAMP();return true;
}
let avalonSaveBusy=false,avalonBotLobbyBusy=false;
function avalonSettingsChanged(r){
 return r?.gameMode==='avalon'&&r.status==='lobby'&&(Number($('avalonLobbyCount').value)!==Number(r.avalonCount||9)||$('avalonLobbyAngel').checked!==!!r.avalonAngel);
}
function refreshAvalonSave(r=roomState){
 $('avalonLobbySave').disabled=!isHost||avalonSaveBusy||!avalonSettingsChanged(r);
}
for(const id of ['avalonLobbyCount','avalonLobbyAngel'])$(id).addEventListener('change',()=>refreshAvalonSave());
function avalonManageBots(r,host,action){
 if(!r||r.gameMode!=='avalon'||r.status!=='lobby'||r.hostId!==host||!r.players?.[host]||r.players[host].bot)return false;
 const players=r.players,cap=Number(r.avalonCount||9);if(![9,10].includes(cap))return false;
 r.playerProfiles||={};
 if(action==='remove'){
  const bots=Object.keys(players).filter(id=>players[id].bot);if(!bots.length)return false;
  bots.forEach(id=>{delete players[id];delete r.playerProfiles[id];if(r.scores)delete r.scores[id];});
 }else if(action==='add'||action==='fill'){
  const amount=Math.min(cap-Object.keys(players).length,action==='add'?1:cap);
  if(amount<=0)return false;
  for(let n=0;n<amount;n++){
   let i=1;while(players['avalon_bot_'+i])i++;
   const id='avalon_bot_'+i,p={name:'Bot '+i,avatar:'robot',bot:true};
   players[id]=p;r.playerProfiles[id]=p;if(r.kickedPlayers)delete r.kickedPlayers[id];
  }
 }else return false;
 r.lastActivityAt=TIMESTAMP();return true;
}
async function avalonBotLobbyAction(action){
 if(avalonBotLobbyBusy||!roomId||!isHost)return;
 avalonBotLobbyBusy=true;try{
  const res=await getRef().transaction(r=>avalonManageBots(r,myId,action)?r:undefined,undefined,false);
  if(!res.committed)toast('ไม่สามารถเปลี่ยนจำนวนบอทได้','error');
 }catch(e){error(e);}finally{avalonBotLobbyBusy=false;if(roomState?.gameMode==='avalon'&&roomState.status==='lobby')renderAvalonLobby(roomState);}
}
for(const [id,action] of [['avalonAddBot','add'],['avalonFillBots','fill'],['avalonRemoveBots','remove']])$(id).onclick=()=>avalonBotLobbyAction(action);
function renderAvalonLobby(r){
 const panel=$('avalonLobbySettings');panel.hidden=r.gameMode!=='avalon';if(panel.hidden)return;
 const count=$('avalonLobbyCount'),angel=$('avalonLobbyAngel');
 count.disabled=angel.disabled=!isHost;
 // Keep unsaved host settings on incoming snapshots until the saved values change.
 const key=roomId+':'+r.avalonCount+':'+!!r.avalonAngel;
 if(panel.dataset.settingsKey!==key){panel.dataset.settingsKey=key;count.value=String(r.avalonCount||9);angel.checked=!!r.avalonAngel;}
 $('avalonLobbySave').hidden=!isHost;refreshAvalonSave(r);
 const botCount=Object.values(r.players||{}).filter(p=>p.bot).length,full=Object.keys(r.players||{}).length>=Number(r.avalonCount||9);
 $('avalonBotTools').hidden=!isHost;$('avalonBotCount').textContent='บอท '+botCount+' ตัว · ผู้เล่นจริง '+(Object.keys(r.players||{}).length-botCount)+' คน';
 $('avalonAddBot').disabled=$('avalonFillBots').disabled=!isHost||full||avalonBotLobbyBusy;
 $('avalonRemoveBots').disabled=!isHost||!botCount||avalonBotLobbyBusy;
}
$('avalonLobbySave').onclick=async()=>{
 if(!roomId||!isHost||avalonSaveBusy||!avalonSettingsChanged(roomState))return;
 const count=Number($('avalonLobbyCount').value),angel=$('avalonLobbyAngel').checked;
 avalonSaveBusy=true;refreshAvalonSave();
 try{const res=await getRef().transaction(r=>{
  if(!r||r.gameMode!=='avalon'||r.status!=='lobby'||r.hostId!==myId||![9,10].includes(count)||Object.keys(r.players||{}).length>count)return;
  r.avalonCount=count;r.avalonAngel=angel;r.lastActivityAt=TIMESTAMP();return r;
 },undefined,false);toast(res.committed?'บันทึกการตั้งค่า Avalon แล้ว':'เปลี่ยนไม่ได้ จำนวนผู้เล่นอาจเกินที่เลือก',res.committed?'success':'error');}catch(e){error(e);}finally{avalonSaveBusy=false;refreshAvalonSave();}
};
let avalonUIKey='',avalonTeamSelection=new Set(),avalonBusy=false,avalonAngelSelection=null,avalonRevealPlayed=new Set();
function avalonPhaseKey(r){
 const a=r.avalon||{};return [roomId,r.gamesPlayed,r.status,a.mission,a.proposalNo,Object.keys(a.cards||{}).length,a.angelChecks?.['m'+a.mission]?.by||''].join(':');
}
async function avalonSend(action,value){
 if(avalonBusy||!roomId||roomState?.gameMode!=='avalon')return;
 const key=avalonPhaseKey(roomState),id=roomId;
 avalonBusy=true;try{
  const res=await getRef().transaction(r=>{
   if(id!==roomId||!r||avalonPhaseKey(r)!==key||!avalonApply(r,myId,action,value))return;
   return r;
  },undefined,false);
  if(!res.committed)toast('สถานะเกมเปลี่ยนไปแล้ว กรุณาลองอีกครั้ง','error');
 }catch(e){error(e);}finally{avalonBusy=false;if(roomId===id&&roomState?.gameMode==='avalon'&&roomState.status!=='lobby')renderAvalon(roomState);}
}
function renderAvalon(r){
 const a=r.avalon,root=$('avalonContent');root.replaceChildren();
 if(!a){root.textContent='ไม่พบข้อมูลเกม Avalon';return;}
 const key=avalonPhaseKey(r);if(key!==avalonUIKey){avalonUIKey=key;avalonTeamSelection=new Set();avalonAngelSelection=null;}
 const ids=a.order,players=gameParticipants(r),name=id=>esc(players[id]?.name||'ผู้เล่น');
 const myRole=r.roles?.[myId],mine=ids.includes(myId),draft=r.status==='avalon_draft',ready=r.status==='avalon_ready',done=r.status==='results';
 const sideLabel=side=>side==='red'?'ฝ่ายแดง':'ฝ่ายน้ำเงิน';
 function block(title,html,extraClass=''){const e=document.createElement('section');e.className='avalon-section'+(extraClass?' '+extraClass:'');e.innerHTML='<h3>'+title+'</h3>'+html;root.append(e);return e;}
 function voteModal(title,subtitle,king,team,buttons,waitText){
  const overlay=document.createElement('div');overlay.className='avalon-vote-overlay';
  const card=document.createElement('section');card.className='avalon-vote-dialog';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');
  const teamNames=team.map(name).join(' · ');
  card.innerHTML='<span class="avalon-vote-kicker">AVALON · '+subtitle+'</span><h2>'+title+'</h2><div class="avalon-vote-info"><small>ผู้จัดตั้งทีม · KING</small><strong>'+name(king)+'</strong></div><div class="avalon-vote-info"><small>ผู้เล่นในทีมภารกิจ</small><strong>'+teamNames+'</strong></div>';
  if(waitText){const p=document.createElement('p');p.className='avalon-vote-wait';p.textContent=waitText;card.append(p);}
  else{const actions=document.createElement('div');actions.className='avalon-vote-actions';buttons.forEach(item=>{const b=document.createElement('button');b.type='button';b.className=item.className;b.textContent=item.label;b.disabled=avalonBusy||!mine;b.onclick=()=>avalonSend(item.action,item.value);actions.append(b);});card.append(actions);}
  overlay.append(card);root.append(overlay);
 }
 function button(parent,label,action,value,disabled=false,cls='btn soft'){
  const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.disabled=disabled||avalonBusy||!mine;b.onclick=()=>avalonSend(action,value);parent.append(b);return b;
 }
 function choices(parent,ids,action){const grid=document.createElement('div');grid.className='avalon-buttons';parent.append(grid);ids.forEach(id=>button(grid,players[id]?.name||'ผู้เล่น',action,id));}
 if(myRole&&!done){
  const intel=!draft?avalonIntel(r,myId):[];
  const hint=myRole==='Percival'?'สองคนนี้คือ Merlin และ Morgana (ไม่ทราบว่าใครเป็นใคร)':myRole==='Merlin'?'ฝ่ายแดงที่คุณมองเห็น':AVALON_RED.has(myRole)&&myRole!=='Oberon'?'เพื่อนร่วมฝ่ายแดงที่คุณมองเห็น':'คุณไม่เห็นบทบาทของผู้อื่น';
  const angelResult=a.angelChecks?.['m'+a.mission],angelResultHtml=r.avalonAngel&&ids[a.angel]===myId&&angelResult?.by===myId?'<p class="avalon-angel-private-result">ผลตรวจส่วนตัว: '+name(angelResult.target)+' อยู่<strong>'+sideLabel(angelResult.side)+'</strong></p>':'';
  block('บทบาทของคุณ','<strong class="avalon-role '+avalonSide(myRole)+'">'+esc(myRole)+' · '+sideLabel(avalonSide(myRole))+'</strong>'+(!draft?'<p>'+hint+'</p>'+(intel.length?'<p>'+intel.map(name).join(' · ')+'</p>':'')+angelResultHtml:'<p>เก็บบทบาทของคุณเป็นความลับจนจบเกม</p>'));
 }
 if(draft){
  const count=Object.keys(a.cards||{}).length,turn=ids[count],used=new Set(Object.values(a.cards||{}));
  const panel=block('เลือกการ์ดบทบาท','<p>'+count+' / '+ids.length+' คน · '+(turn===myId?'ถึงตาคุณเลือก':'รอ '+name(turn)+' เลือก')+'</p>');
  const grid=document.createElement('div');grid.className='avalon-cards';panel.append(grid);
  a.deck.forEach((_,index)=>{const own=a.cards?.[myId]===index,locked=used.has(index);button(grid,own?myRole:locked?'ถูกเลือกแล้ว':'♜ การ์ด '+(index+1),'card',index,locked||turn!==myId,'avalon-card'+(own?' own '+avalonSide(myRole):'')+(locked?' taken':''));});
  block('ลำดับเลือกการ์ด',ids.map((p,i)=>'<p>'+(i+1)+'. '+name(p)+(Object.hasOwn(a.cards||{},p)?' ✓':'')+(!r.players?.[p]?' · หลุดการเชื่อมต่อ':'')+'</p>').join(''));return;
 }
 if(ready){const n=ids.filter(p=>a.ready?.[p]).length,panel=block('เตรียมพร้อม','<p>'+n+' / '+ids.length+' คนพร้อมแล้ว</p>');button(panel,a.ready?.[myId]?'พร้อมแล้ว':'เตรียมพร้อม','ready',true,!!a.ready?.[myId],'btn primary full');return;}
 const history=Object.values(a.history||{}).sort((x,y)=>x.mission-y.mission);
 const missionWins=history.filter(x=>x.passed).length,missionFails=history.filter(x=>!x.passed).length;
 block('ภารกิจ','<div class="avalon-missions">'+AVALON_SIZES.map((n,i)=>{const rec=a.history?.['m'+(i+1)];return '<div class="avalon-mission '+(rec?(rec.passed?'blue':'red'):a.mission===i+1?'current':'')+'"><small>รอบ '+(i+1)+'</small><strong>'+n+' คน</strong><small>'+(rec?(rec.passed?'สำเร็จ':'ล้มเหลว'):i===3?'Fail 2 ใบ':'Fail 1 ใบ')+'</small></div>';}).join('')+'</div><p>สำเร็จ '+missionWins+' / 3 · ภารกิจล้มเหลว '+missionFails+' · แต่งตั้งล้มเหลว '+(a.rejections||0)+'</p>');
 if(done){
  const result=r.result||{},reason={rejections:'แต่งตั้งทีมล้มเหลวครบ 5 ครั้ง',missions:'ภารกิจล้มเหลวครบ 3 ครั้ง',assassinated:'Assassin สังหาร Merlin ถูกต้อง',assassin_missed:'Assassin ทาย Merlin ผิด'}[result.reason]||'จบเกม';
  block(sideLabel(result.winner)+'ชนะ!', '<p>'+reason+'</p>'+(result.assassinated?'<p>Assassin เลือก '+name(result.assassinated)+'</p>':'')+'<div class="avalon-role-list">'+ids.map(p=>'<p>'+name(p)+' · <strong class="'+avalonSide(r.roles[p])+'">'+esc(r.roles[p])+'</strong></p>').join('')+'</div>');
 }else{
   if(history.length){
    const revealHtml=history.map(record=>{
     const revealKey=[roomId,r.gamesPlayed,record.mission].join(':');
     const animate=!avalonRevealPlayed.has(revealKey);if(animate)avalonRevealPlayed.add(revealKey);
     const cards=(record.team||[]).map((player,index)=>{
      const vote=record.votes?.[player];
      if(typeof vote!=='boolean')return '<div class="avalon-reveal-card is-unavailable"><div class="avalon-reveal-card-inner"><div class="avalon-reveal-card-back"><span>AVALON</span><b>?</b></div><div class="avalon-reveal-card-front"><strong>ไม่มีข้อมูล</strong><small>'+name(player)+'</small></div></div></div>';
      const resultClass=vote?'success':'fail',resultLabel=vote?'PASS':'FAIL',voter=esc(record.playerNames?.[player]||players[player]?.name||'ผู้เล่น');
      return '<div class="avalon-reveal-card '+(animate?'is-revealing':'is-revealed')+'" style="--reveal-delay:'+(index*560)+'ms"><div class="avalon-reveal-card-inner"><div class="avalon-reveal-card-back"><span>AVALON</span><b>?</b><small>MISSION '+record.mission+'</small></div><div class="avalon-reveal-card-front '+resultClass+'"><span class="avalon-reveal-result">'+resultLabel+'</span><strong class="avalon-reveal-player-name">ผู้ลงผล: '+voter+'</strong></div></div></div>';
     }).join('');
     return '<article class="avalon-mission-reveal '+(record.passed?'passed':'failed')+'"><div class="avalon-mission-reveal-head"><strong>ภารกิจที่ '+record.mission+'</strong><b>'+(record.passed?'✓ ภารกิจสำเร็จ':'✕ ภารกิจล้มเหลว')+'</b></div><p>ทีมภารกิจ · '+(record.team||[]).map(name).join(' · ')+'</p><div class="avalon-reveal-grid">'+cards+'</div><small class="avalon-reveal-summary">PASS '+record.success+' ใบ · FAIL '+record.fail+' ใบ</small></article>';
    }).join('');
    block('เฉลยผลภารกิจ · เปิดการ์ดทีละใบ',revealHtml,'avalon-reveal-section');
   }
  const king=ids[a.king],angel=r.avalonAngel?ids[a.angel]:null,isAngel=angel===myId;
   const proposalEntries=Object.entries(a.proposals||{}).sort(([x],[y])=>Number(x.slice(1))-Number(y.slice(1)));
   const latestProposal=proposalEntries.length?proposalEntries[proposalEntries.length-1][1]:null;
   if(r.status==='avalon_approve'){
    const votes=a.approvals||{},yes=ids.filter(p=>votes[p]===true).length,no=ids.filter(p=>votes[p]===false).length,pending=ids.length-yes-no;
    const yesPct=ids.length?yes/ids.length*100:0,noPct=ids.length?no/ids.length*100:0;
    block('ผลรวมโหวตแต่งตั้งทีม · รอบ '+a.mission,'<div class="avalon-proposal-live-team"><small>ผู้จัดตั้งทีม · KING</small><strong>'+name(king)+'</strong><small>ทีมที่เสนอ</small><strong>'+a.team.map(name).join(' · ')+'</strong></div><div class="avalon-proposal-live-tally"><span class="yes">✓ ยินยอม <b>'+yes+'</b></span><span class="no">✕ ไม่ยินยอม <b>'+no+'</b></span><span class="pending">รอโหวต <b>'+pending+'</b></span></div><div class="avalon-proposal-live-track"><i class="yes" style="width:'+yesPct+'%"></i><i class="no" style="width:'+noPct+'%"></i></div><small class="avalon-proposal-live-count">ลงคะแนนแล้ว '+(yes+no)+' / '+ids.length+' คน</small>','avalon-proposal-live');
   }else if(latestProposal&&latestProposal.mission===a.mission&&(r.status==='avalon_quest'||r.status==='avalon_team')){
    block('ผลรวมโหวตแต่งตั้งทีม · รอบ '+a.mission,'<div class="avalon-proposal-live-team"><small>ผู้จัดตั้งทีม · KING</small><strong>'+name(latestProposal.king)+'</strong><small>ทีมที่เสนอ</small><strong>'+latestProposal.team.map(name).join(' · ')+'</strong></div><div class="avalon-proposal-live-tally"><span class="yes">✓ ยินยอม <b>'+latestProposal.yes+'</b></span><span class="no">✕ ไม่ยินยอม <b>'+latestProposal.no+'</b></span><span class="pending">รอโหวต <b>0</b></span></div><div class="avalon-proposal-live-track"><i class="yes" style="width:'+(latestProposal.yes/ids.length*100)+'%"></i><i class="no" style="width:'+(latestProposal.no/ids.length*100)+'%"></i></div><small class="avalon-proposal-live-count">'+(latestProposal.approved?'✓ ทีมได้รับการอนุมัติ':'✕ ทีมไม่ได้รับการอนุมัติ')+' · ลงคะแนนครบ '+ids.length+' คน</small>','avalon-proposal-live '+(latestProposal.approved?'approved':'rejected'));
   }
   const knownRedIds=new Set(avalonIntel(r,myId));if(AVALON_RED.has(myRole))knownRedIds.add(myId);
  const inspectedSides=avalonInspectedSides(r,myId);
  const order=block('ลำดับผู้เล่น','');
  const list=document.createElement('div');list.className='avalon-role-list';
  list.innerHTML=ids.map((p,i)=>{
   const role=r.roles?.[p],redKnown=knownRedIds.has(p),percivalKnown=myRole==='Percival'&&(role==='Merlin'||role==='Morgana');
   const cls=percivalKnown?'avalon-player-percival':redKnown?'avalon-player-known-red':'';
   const approval=Object.hasOwn(a.approvals||{},p)?(a.approvals[p]?'<small class="avalon-player-vote yes">✓ ยินยอม</small>':'<small class="avalon-player-vote no">✕ ไม่ยินยอม</small>'):'';
   const checkedSide=inspectedSides.get(p);
   const checkedMark=checkedSide?'<span class="avalon-inspected-side '+checkedSide+'" role="img" aria-label="ผลตรวจ Angel: '+sideLabel(checkedSide)+'" title="ผลตรวจ Angel: '+sideLabel(checkedSide)+'"></span>':'';
   return '<p class="'+cls+'">'+(i+1)+'. '+name(p)+checkedMark+(p===king?' <b class="avalon-king">♛ KING</b>':'')+(p===angel?' <b class="avalon-angel">✦ ANGEL</b>':'')+approval+(!r.players?.[p]?' <small>หลุดการเชื่อมต่อ</small>':'')+'</p>';
  }).join('');order.append(list);
  if(r.avalonAngel&&isAngel&&r.status==='avalon_team'){
   const inspection=a.angelChecks?.['m'+a.mission];
   if(!inspection){const p=block('Angel · ตรวจฝ่าย 1 คน','<p>เลือกผู้เล่นหนึ่งคน แล้วกดยืนยันเพื่อเปิดผลตรวจฝ่าย ซึ่งเห็นได้เฉพาะคุณ</p>');
    const grid=document.createElement('div');grid.className='avalon-buttons';p.append(grid);
    ids.filter(x=>x!==myId).forEach(id=>{const b=document.createElement('button');b.type='button';b.className='btn soft'+(avalonAngelSelection===id?' avalon-selected':'');b.textContent=players[id]?.name||'ผู้เล่น';b.setAttribute('aria-pressed',String(avalonAngelSelection===id));b.onclick=()=>{avalonAngelSelection=id;renderAvalon(r);};grid.append(b);});
    const actions=document.createElement('div');actions.className='avalon-vote-actions';const confirm=document.createElement('button');confirm.type='button';confirm.className='btn primary';confirm.textContent=avalonBusy?'กำลังตรวจสอบ…':'ยืนยันการตรวจฝ่าย';confirm.disabled=avalonBusy||!avalonAngelSelection;confirm.onclick=()=>avalonSend('angel',avalonAngelSelection);actions.append(confirm);
    const cancel=document.createElement('button');cancel.type='button';cancel.className='btn outline';cancel.textContent='ล้างการเลือก';cancel.disabled=avalonBusy||!avalonAngelSelection;cancel.onclick=()=>{avalonAngelSelection=null;renderAvalon(r);};actions.append(cancel);p.append(actions);
   }
  }
  if(r.status==='avalon_team'){
   const inspection=a.angelChecks?.['m'+a.mission];
   if(r.avalonAngel&&!inspection){
    if(!isAngel)block('รอ Angel ตรวจสอบฝ่าย','<p>ต้องรอให้ Angel ตรวจสอบผู้เล่นหนึ่งคนก่อน King จึงจะจัดตั้งทีมภารกิจได้</p>');
   }else{
    const size=AVALON_SIZES[a.mission-1],panel=block('รอบ '+a.mission+' · แต่งตั้งทีม '+size+' คน','<p>'+(king===myId?'เลือกผู้เล่น '+size+' คน (เลือกตัวเองได้)':'รอ King '+name(king)+' เลือกทีม')+'</p>');
    if(king===myId){
     const grid=document.createElement('div');grid.className='avalon-buttons';panel.append(grid);
     const confirm=document.createElement('button');confirm.type='button';confirm.className='btn primary full';confirm.textContent='ยืนยันจัดตั้งทีม '+avalonTeamSelection.size+'/'+size;confirm.disabled=avalonBusy||avalonTeamSelection.size!==size;confirm.onclick=()=>avalonSend('team',[...avalonTeamSelection]);
     ids.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='btn soft'+(avalonTeamSelection.has(p)?' avalon-selected':'');b.textContent=players[p]?.name||'ผู้เล่น';b.disabled=avalonBusy;b.onclick=()=>{if(avalonTeamSelection.has(p))avalonTeamSelection.delete(p);else if(avalonTeamSelection.size<size)avalonTeamSelection.add(p);renderAvalon(r);};grid.append(b);});panel.append(confirm);
    }
   }
  }else if(r.status==='avalon_approve'){
   const voted=Object.hasOwn(a.approvals||{},myId),count=Object.keys(a.approvals||{}).length;
   if(voted)block('ส่งผลโหวตแล้ว','<p>คุณลงคะแนนเรียบร้อย · รอผู้เล่นอื่น ('+count+'/'+ids.length+')</p>');
   else voteModal('อนุมัติทีมภารกิจ?','TEAM APPROVAL',king,a.team,[{label:'ยินยอม',action:'approve',value:true,className:'btn primary avalon-vote-yes'},{label:'ไม่ยินยอม',action:'approve',value:false,className:'btn danger avalon-vote-no'}],null);
  }else if(r.status==='avalon_quest'){
   const member=a.team.includes(myId),voted=Object.hasOwn(a.questVotes||{},myId),count=Object.keys(a.questVotes||{}).length;
   if(member){
    if(voted)block('ส่งผลภารกิจแล้ว','<p>คุณส่งผลเรียบร้อย · รอสมาชิกทีมที่เหลือ ('+count+'/'+a.team.length+')</p>');
    else voteModal('ผลภารกิจรอบ '+a.mission,'MISSION VOTE',king,a.team,[{label:'ผ่าน · Success',action:'quest',value:true,className:'btn primary avalon-vote-yes'},...(AVALON_RED.has(myRole)?[{label:'ไม่ผ่าน · Fail',action:'quest',value:false,className:'btn danger avalon-vote-no'}]:[])],null);
   }else block('กำลังดำเนินภารกิจ','<p>ทีมที่ได้รับเลือกกำลังส่งผลภารกิจ ('+count+'/'+a.team.length+')</p>');
  }else if(r.status==='avalon_assassin'){
   const panel=block('Assassin · ตามหา Merlin','<p>ฝ่ายน้ำเงินทำภารกิจสำเร็จ 3 ครั้งแล้ว หาก Assassin ทาย Merlin ถูก ฝ่ายแดงชนะ</p>');
   if(myRole==='Assassin'){const grid=document.createElement('div');grid.className='avalon-buttons';panel.append(grid);ids.filter(p=>p!==myId).forEach(p=>{const b=button(grid,players[p]?.name||'ผู้เล่น','assassin',p);b.onclick=async()=>{if(await confirmBox('ยืนยันเป้าหมาย Assassin?','เลือก '+(players[p]?.name||'ผู้เล่น')+' ได้เพียงครั้งเดียว','ยืนยัน'))avalonSend('assassin',p);};});}
  }
 }


}

function renderAvalonResults(r){
 const root=$('avalonResultsContent');root.replaceChildren();
 const a=r.avalon;if(!a){root.textContent='ไม่พบข้อมูลสรุปเกม Avalon';return;}
 const ids=a.order||Object.keys(r.gamePlayers||r.players||{}),players=gameParticipants(r),name=id=>esc(players[id]?.name||r.gamePlayers?.[id]?.name||r.playerProfiles?.[id]?.name||r.players?.[id]?.name||'ผู้เล่น');
 const history=Object.values(a.history||{}).sort((x,y)=>x.mission-y.mission),proposals=Object.entries(a.proposals||{}).sort(([x],[y])=>Number(x.slice(1))-Number(y.slice(1))).map(([,p])=>p);
 const result=r.result||{},sideLabel=side=>side==='red'?'ฝ่ายแดง':'ฝ่ายน้ำเงิน';
 const reason={rejections:'แต่งตั้งทีมล้มเหลวครบ 5 ครั้ง',missions:'ภารกิจล้มเหลวครบ 3 ครั้ง',assassinated:'Assassin ทาย Merlin ถูกต้อง',assassin_missed:'Assassin ทาย Merlin ผิด'}[result.reason]||'จบเกม';
 function section(title,html,cls=''){const e=document.createElement('section');e.className='avalon-section avalon-summary-section'+(cls?' '+cls:'');e.innerHTML='<h3>'+title+'</h3>'+html;root.append(e);return e;}
 const proposalForMission=record=>[...proposals].reverse().find(p=>p.mission===record.mission&&p.approved);
 const playerName=(record,id)=>esc(record.playerNames?.[id]||players[id]?.name||r.gamePlayers?.[id]?.name||r.playerProfiles?.[id]?.name||r.players?.[id]?.name||'ผู้เล่น');
 section('ผลการแข่งขัน','<div class="avalon-summary-winner '+(result.winner==='red'?'red':'blue')+'">'+sideLabel(result.winner)+'ชนะ</div><p>'+reason+'</p><div class="avalon-summary-stats"><span>ภารกิจสำเร็จ <b>'+history.filter(x=>x.passed).length+'</b></span><span>ภารกิจล้มเหลว <b>'+history.filter(x=>!x.passed).length+'</b></span><span>แต่งตั้งล้มเหลว <b>'+(a.rejections||0)+'</b></span></div>','avalon-summary-hero');
 if(result.reason==='assassinated'||result.reason==='assassin_missed'){
  const assassin=ids.find(p=>r.roles?.[p]==='Assassin'),target=result.assassinated,hit=result.reason==='assassinated';
  section('การลอบสังหารของ Assassin','<div class="avalon-assassin-summary '+(hit?'hit':'miss')+'"><p>Assassin: <strong>'+name(assassin)+'</strong></p><p>เป้าหมายที่เลือก: <strong>'+name(target)+'</strong></p><p>บทบาทจริงของเป้าหมาย: <strong>'+esc(r.roles?.[target]||'ไม่ทราบ')+'</strong></p><strong class="avalon-assassin-verdict">'+(hit?'Assassin สังหาร Merlin สำเร็จ · ฝ่ายแดงชนะ':'Assassin ทายผิด · ฝ่ายน้ำเงินชนะ')+'</strong></div>');
 }else section('การลอบสังหารของ Assassin','<p>เกมจบก่อนถึงขั้นตอนการลอบสังหารของ Assassin</p>');
 if(history.length){
  const latest=history[history.length-1],latestProposal=proposalForMission(latest),latestKing=latest.king||latestProposal?.king;
  section('ผลภารกิจล่าสุด · รอบ '+latest.mission,'<div class="avalon-latest-mission-team"><p><small>ผู้เลือกทีม · KING</small><strong>'+name(latestKing)+'</strong></p><p><small>ผู้เล่นที่ถูกเลือกไปทำภารกิจ</small><strong>'+(latest.team||[]).map(p=>playerName(latest,p)).join(' · ')+'</strong></p><div class="avalon-summary-stats"><span>PASS <b>'+(latest.success??0)+'</b></span><span>FAIL <b>'+(latest.fail??0)+'</b></span></div></div>','avalon-latest-mission');
 }
 const missionSummaryHtml=history.map(record=>{
  const revealKey=[roomId,r.gamesPlayed,record.mission].join(':');
  const animate=!avalonRevealPlayed.has(revealKey);if(animate)avalonRevealPlayed.add(revealKey);
  const proposal=proposalForMission(record),king=record.king||proposal?.king;
  const cards=(record.team||[]).map((player,index)=>{
   const vote=record.votes?.[player],voter=playerName(record,player);
   if(typeof vote!=='boolean')return '<div class="avalon-reveal-card is-unavailable"><div class="avalon-reveal-card-inner"><div class="avalon-reveal-card-back"><span>AVALON</span><b>?</b><small>MISSION '+record.mission+'</small></div><div class="avalon-reveal-card-front"><strong>ไม่มีข้อมูล</strong><small>'+voter+'</small></div></div></div>';
   const resultClass=vote?'success':'fail',resultLabel=vote?'PASS':'FAIL';
   return '<div class="avalon-reveal-card '+(animate?'is-revealing':'is-revealed')+'" style="--reveal-delay:'+(index*560)+'ms"><div class="avalon-reveal-card-inner"><div class="avalon-reveal-card-back"><span>AVALON</span><b>?</b><small>MISSION '+record.mission+'</small></div><div class="avalon-reveal-card-front '+resultClass+'"><span class="avalon-reveal-result">'+resultLabel+'</span><strong class="avalon-reveal-player-name">ผู้ลงผล: '+voter+'</strong></div></div></div>';
  }).join('');
  return '<article class="avalon-summary-mission '+(record.passed?'passed':'failed')+'"><div class="avalon-summary-mission-head"><strong>ภารกิจที่ '+record.mission+'</strong><b>'+(record.passed?'✓ สำเร็จ':'✕ ล้มเหลว')+'</b></div><p>ผู้เลือกทีม · KING: <strong>'+name(king)+'</strong></p><p>ผู้เล่นที่ถูกเลือกไปทำภารกิจ: <strong>'+(record.team||[]).map(p=>playerName(record,p)).join(' · ')+'</strong></p><div class="avalon-reveal-grid">'+cards+'</div><div class="avalon-summary-stats"><span>Success <b>'+(record.success??0)+'</b></span><span>Fail <b>'+(record.fail??0)+'</b></span></div></article>';
 }).join('');
 section('ผลการเล่นแต่ละภารกิจ',history.length?missionSummaryHtml:'<p>ไม่มีภารกิจที่ได้รับการตัดสินผล</p>');
 section('บทบาทของผู้เล่นทุกคน','<div class="avalon-role-list avalon-summary-roles">'+ids.map((p,i)=>{const role=r.roles?.[p]||'ไม่ทราบบทบาท',side=avalonSide(role);return '<p class="avalon-summary-role '+side+'"><span>'+(i+1)+'. '+name(p)+'</span><strong>'+esc(role)+'</strong><small>'+sideLabel(side)+'</small></p>';}).join('')+'</div>');
 if(proposals.length)section('ประวัติการแต่งตั้งทีม',proposals.map((p,i)=>'<article class="avalon-summary-proposal '+(p.approved?'approved':'rejected')+'"><div class="avalon-summary-mission-head"><strong>ครั้งที่ '+(i+1)+' · ภารกิจ '+p.mission+'</strong><b>'+(p.approved?'อนุมัติ':'ไม่อนุมัติ')+'</b></div><p>King: '+name(p.king)+'</p><p>ทีม: '+(p.team||[]).map(name).join(' · ')+'</p><p>ยินยอม '+p.yes+' · ไม่ยินยอม '+p.no+'</p></article>').join(''));
 const bottom=section('กลับสู่ Lobby','<p>'+(isHost?'เมื่อกลับ Lobby สามารถเริ่มเกม Avalon รอบใหม่ได้':'รอหัวหน้าห้องกลับสู่ Lobby')+'</p>','avalon-summary-return');
 if(isHost){const b=document.createElement('button');b.type='button';b.className='btn primary full';b.textContent='กลับไป Lobby';b.onclick=async()=>{const id=roomId,game=r.gamesPlayed;if(!await confirmBox('กลับไป Lobby?','สรุปผลเกมนี้จะยังคงแสดงจนกว่าจะกลับ Lobby','กลับไป Lobby')||id!==roomId)return;try{await getRef().transaction(x=>{if(x?.gameMode!=='avalon'||x.status!=='results'||x.hostId!==myId||x.gamesPlayed!==game)return;x.status='lobby';x.avalon=null;x.roles=null;x.gamePlayers=null;x.result=null;x.lastActivityAt=TIMESTAMP();return x;},undefined,false);}catch(e){error(e);}};bottom.append(b);}
}

// Host drives one simulated player action per tick. Human actions are never automated.
function avalonNextBotAction(r,rand=Math.random){
 if(r?.gameMode!=='avalon'||!r.avalon)return null;
 const a=r.avalon,ids=a.order,bot=id=>!!r.players?.[id]?.bot;
 const pick=list=>list.length?list[Math.floor(rand()*list.length)]:null;
 const mix=list=>{const v=[...list];for(let i=v.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[v[i],v[j]]=[v[j],v[i]];}return v;};
 const action=(id,type,value)=>({id,type,value});
 if(r.status==='avalon_draft'){
  const id=ids[Object.keys(a.cards||{}).length];if(!bot(id))return null;
  const available=a.deck.map((_,i)=>i).filter(i=>!Object.values(a.cards||{}).includes(i));
  return available.length?action(id,'card',pick(available)):null;
 }
 if(r.status==='avalon_ready'){
  const id=ids.find(p=>bot(p)&&!a.ready?.[p]);return id?action(id,'ready',true):null;
 }
 if(r.avalonAngel&&r.status==='avalon_team'&&bot(ids[a.angel])&&!a.angelChecks?.['m'+a.mission]){
  const id=ids[a.angel];return action(id,'angel',pick(ids.filter(p=>p!==id)));
 }
 if(r.status==='avalon_team'){
  const id=ids[a.king];if(!bot(id))return null;
  const size=AVALON_SIZES[a.mission-1],team=[id,...mix(ids.filter(p=>p!==id)).slice(0,size-1)];
  return action(id,'team',team);
 }
 if(r.status==='avalon_approve'){
  const id=ids.find(p=>bot(p)&&!Object.hasOwn(a.approvals||{},p));
  return id?action(id,'approve',a.rejections>=4||a.team.includes(id)||rand()<.8):null;
 }
 if(r.status==='avalon_quest'){
  const id=a.team.find(p=>bot(p)&&!Object.hasOwn(a.questVotes||{},p));
  return id?action(id,'quest',!AVALON_RED.has(r.roles?.[id])||rand()<.35):null;
 }
 if(r.status==='avalon_assassin'){
  const id=ids.find(p=>bot(p)&&r.roles?.[p]==='Assassin');if(!id)return null;
  const known=new Set(avalonIntel(r,id));return action(id,'assassin',pick(ids.filter(p=>p!==id&&!known.has(p))));
 }
 return null;
}
let avalonLastBotTick=0;
async function avalonBotTick(){
 if(autoBusy||!roomId||leaving||!isHost||roomState?.gameMode!=='avalon'||!Object.values(roomState.players||{}).some(p=>p.bot))return;
 if(Date.now()-avalonLastBotTick<650)return;
 const r=roomState,id=roomId,key=avalonPhaseKey(r),next=avalonNextBotAction(r);if(!next)return;
 avalonLastBotTick=Date.now();autoBusy=true;
 try{await getRef().transaction(x=>{
  if(id!==roomId||!x||x.hostId!==myId||x.players?.[myId]?.bot||avalonPhaseKey(x)!==key||!x.players?.[next.id]?.bot)return;
  if(avalonApply(x,next.id,next.type,next.value))return x;
 },undefined,false);}catch(e){error(e);}finally{autoBusy=false;}
}
