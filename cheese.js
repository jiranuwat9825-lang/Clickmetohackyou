/* Steal Cheese — online table for Cheese Thief (4–8 players). */
const CH=CheeseEngine;
let cheeseBusy=false,cheeseLastAuto=0,cheeseSelection=new Set(),cheeseViewKey='';
let cheeseRollAnimation=null;
const cheeseRoundKey=r=>[roomId,r.gamesPlayed,myId].join(':');
function cheeseDiceHTML(values=[],rolling=false,count=1){
 const dice=rolling?Array.from({length:count},()=>0):values;
 return '<div class="cheese-dice-tray" role="img" aria-label="'+(rolling?'กำลังทอยลูกเต๋า':dice.length?'ลูกเต๋าแต้ม '+dice.join(' และ '):'ยังไม่ได้ทอยลูกเต๋า')+'">'+(dice.length?dice.map(n=>'<span class="cheese-die'+(rolling?' is-rolling':'')+'" data-value="'+n+'" aria-hidden="true">'+Array.from({length:9},(_,i)=>'<i class="pip pip-'+(i+1)+'"></i>').join('')+'</span>').join(''):'<span class="cheese-die is-unrolled" aria-hidden="true">?</span>')+'</div>';
}
async function cheeseRoll(){
 const r=roomState;if(cheeseBusy||!roomId||r?.gameMode!=='cheese'||r.status!=='cheese_playing'||r.cheese?.phase!=='prepare'||r.cheese.rolled?.[myId]||cheeseRollAnimation?.key===cheeseRoundKey(r))return;
 const animation={key:cheeseRoundKey(r),started:Date.now()};cheeseRollAnimation=animation;renderCheese(r);
 try{await cheeseSend('roll');}finally{
  const duration=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?100:1100;
  setTimeout(()=>{if(cheeseRollAnimation!==animation)return;cheeseRollAnimation=null;if(roomState?.gameMode==='cheese'&&cheeseRoundKey(roomState)===animation.key)renderCheese(roomState);},Math.max(0,duration-(Date.now()-animation.started)));
 }
}
function cheeseNightTimeline(a,info){
 return '<ol class="cheese-night-timeline" aria-label="ชั่วโมงกลางคืนของคุณ">'+Array.from({length:6},(_,i)=>{const hour=i+1,mine=info.wake.includes(hour),current=hour===a.hour;return '<li class="'+(current?'is-now ':'')+(hour<a.hour?'is-past ':'')+(mine?'is-my-hour':'')+'"'+(current?' aria-current="step"':'')+'><span>ตี '+hour+'</span><small>'+(mine?'เวลาตื่นของคุณ':'หลับ')+'</small></li>';}).join('')+'</ol>';
}
const cheeseName=(r,id)=>gameParticipants(r)[id]?.name||'ผู้เล่น';
const cheeseKey=r=>[roomId,r.gamesPlayed,r.cheese?.revision].join(':');
const cheeseRoleLabel=(r,id)=>r.cheese?.followers?.includes(id)?(r.roles?.[id]==='fall'?'หนูแพะ · ถูกเลือกเป็นผู้ช่วย':'ผู้ช่วยขโมย'):({thief:'หนูขโมยชีส',sleepy:'หนูขี้เซา',fall:'หนูแพะ'}[r.roles?.[id]]||'—');
function cheeseSettings(prefix){return {count:Number($(prefix+'Count').value),minutes:Number($(prefix+'Discuss').value),fall:$(prefix+'Fall').checked};}
function cheeseSettingsValid(s){return Number.isInteger(s.count)&&s.count>=4&&s.count<=8&&Number.isInteger(s.minutes)&&s.minutes>=1&&s.minutes<=15&&(!s.fall||s.count>=6);}
function renderCheeseLobby(r){
 const panel=$('cheeseLobbySettings');panel.hidden=r.gameMode!=='cheese';if(panel.hidden)return;
 const key=roomId+':'+[r.cheeseCount||4,r.cheeseDiscussMinutes||3,!!r.cheeseFall].join(':');
 if(panel.dataset.savedKey!==key){panel.dataset.savedKey=key;$('cheeseLobbyCount').value=String(r.cheeseCount||4);$('cheeseLobbyDiscuss').value=String(r.cheeseDiscussMinutes||3);$('cheeseLobbyFall').checked=!!r.cheeseFall;}
 for(const field of ['Count','Discuss','Fall'])$('cheeseLobby'+field).disabled=!isHost||cheeseBusy;
 $('cheeseLobbySave').hidden=!isHost;$('cheeseBotTools').hidden=!isHost;
 $('cheeseLobbySave').disabled=cheeseBusy||JSON.stringify(cheeseSettings('cheeseLobby'))===JSON.stringify({count:Number(r.cheeseCount||4),minutes:Number(r.cheeseDiscussMinutes||3),fall:!!r.cheeseFall});
 const bots=Object.values(r.players||{}).filter(p=>p.bot).length,full=Object.keys(r.players||{}).length>=Number(r.cheeseCount||4);
 $('cheeseAddBot').disabled=$('cheeseFillBots').disabled=cheeseBusy||full;$('cheeseRemoveBots').disabled=cheeseBusy||!bots;
}
for(const field of ['Count','Discuss','Fall'])$('cheeseLobby'+field).onchange=()=>renderCheeseLobby(roomState);
$('cheeseLobbySave').onclick=async()=>{
 if(!roomId||!isHost||cheeseBusy)return;const settings=cheeseSettings('cheeseLobby'),id=roomId;
 if(!cheeseSettingsValid(settings)){toast('เลือก 4–8 คน เวลา 1–15 นาที และหนูแพะใช้ได้ตั้งแต่ 6 คน','error');return;}
 cheeseBusy=true;renderCheeseLobby(roomState);
 try{const result=await getRef().transaction(r=>{if(id!==roomId||!r||r.gameMode!=='cheese'||r.status!=='lobby'||r.hostId!==myId||Object.keys(r.players||{}).length>settings.count)return;r.cheeseCount=settings.count;r.cheeseDiscussMinutes=settings.minutes;r.cheeseFall=settings.fall;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);toast(result.committed?'บันทึกการตั้งค่าแล้ว':'ลบบอทก่อนลดจำนวนผู้เล่น หรือห้องเริ่มเกมแล้ว',result.committed?'success':'error');}catch(e){error(e);}finally{cheeseBusy=false;if(id===roomId&&roomState)renderCheeseLobby(roomState);}
};
async function cheeseBots(action){if(!isHost||!roomId||cheeseBusy)return;const id=roomId;cheeseBusy=true;try{await getRef().transaction(r=>{if(id!==roomId||!CH.bots(r,myId,action))return;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);}catch(e){error(e);}finally{cheeseBusy=false;if(id===roomId&&roomState)renderCheeseLobby(roomState);}}
for(const [id,action] of [['cheeseAddBot','add'],['cheeseFillBots','fill'],['cheeseRemoveBots','remove']])$(id).onclick=()=>cheeseBots(action);
async function cheeseStart(){
 if(cheeseBusy||!roomId||!isHost)return;const id=roomId,ids=Object.keys(roomState.players||{}),game=Number(roomState.gamesPlayed)||0;
 if(ids.length!==Number(roomState.cheeseCount||4)){toast('จำนวนผู้เล่นยังไม่ครบตามที่ตั้งไว้','error');return;}
 const prepared=copyPack(roomState);if(!CH.setup(prepared,ids,serverNow()))return;cheeseBusy=true;
 try{await getRef().transaction(r=>{if(id!==roomId||!r||r.status!=='lobby'||r.gameMode!=='cheese'||r.hostId!==myId||(Number(r.gamesPlayed)||0)!==game||Number(r.cheeseCount||4)!==ids.length||Object.keys(r.players||{}).length!==ids.length||!ids.every(p=>r.players[p]))return;
  if(!!r.cheeseFall!==!!prepared.cheeseFall||Number(r.cheeseDiscussMinutes||3)!==Number(prepared.cheeseDiscussMinutes||3))return;
  for(const k of ['roles','gamePlayers','playerProfiles','result','gamesPlayed','cheese','status'])r[k]=prepared[k];r.lastActivityAt=TIMESTAMP();return r;
 },undefined,false);}catch(e){error(e);}finally{cheeseBusy=false;if(id===roomId&&roomState)renderRoom(roomState);}
}
async function cheeseSend(type,value){
 if(cheeseBusy||!roomId||roomState?.gameMode!=='cheese')return;const id=roomId,key=cheeseKey(roomState);cheeseBusy=true;
 try{const result=await getRef().transaction(r=>{if(id!==roomId||!r||cheeseKey(r)!==key||!CH.apply(r,myId,type,value,serverNow(),r.cheese.revision))return;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);if(!result.committed)toast('สถานะเปลี่ยนไปแล้ว กรุณาลองใหม่','error');}catch(e){error(e);}finally{cheeseBusy=false;if(id===roomId&&roomState?.gameMode==='cheese')renderCheese(roomState);}
}
async function cheeseAuto(){
 if(autoBusy||!isHost||!roomId||leaving||roomState?.status!=='cheese_playing'||Date.now()-cheeseLastAuto<600)return;
 const id=roomId,r=roomState,key=cheeseKey(r),next=CH.nextBot(r,serverNow());if(!next)return;cheeseLastAuto=Date.now();autoBusy=true;
 try{await getRef().transaction(x=>{if(id!==roomId||!x||x.hostId!==myId||cheeseKey(x)!==key||!CH.apply(x,next.id,next.type,next.value,serverNow(),x.cheese.revision))return;x.lastActivityAt=TIMESTAMP();return x;},undefined,false);}catch(e){error(e);}finally{autoBusy=false;}
}
async function cheeseReturn(){if(!roomId||!isHost||cheeseBusy)return;const id=roomId,game=roomState.gamesPlayed;cheeseBusy=true;try{await getRef().transaction(r=>{if(id!==roomId||!r||r.gameMode!=='cheese'||r.status!=='results'||r.hostId!==myId||r.gamesPlayed!==game)return;r.status='lobby';r.cheese=null;r.roles=null;r.gamePlayers=null;r.result=null;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);}catch(e){error(e);}finally{cheeseBusy=false;}}
function cheeseRules(){return '<details class="cheese-rules"><summary>วิธีเล่น Steal Cheese · หนูขโมยชีส</summary><ol><li>รับบทลับและทอยลูกเต๋า จากนั้นตื่นเฉพาะชั่วโมงที่ลูกเต๋ากำหนด ตั้งแต่ตี 1 ถึงตี 6</li><li>ขโมยต้องหยิบชีสเมื่อตื่น หนูขี้เซาที่ตื่นคนเดียวส่องลูกเต๋าคนอื่นได้หนึ่งคน ถ้าตื่นพร้อมใครให้ดูว่าใครตื่นด้วยและชีสยังอยู่หรือไม่</li><li>4 คน: ลูกเต๋าคนละสองลูก หนูขี้เซาเลือกตื่นหนึ่งเวลา ขโมยตื่นได้ทั้งสองเวลา ห้ามส่องลูกเต๋าและไม่มีผู้ช่วย</li><li>5 คน: ขโมยเลือกผู้ช่วยหนึ่งคนจากคนที่เห็นขโมย ถ้าไม่มีใครเห็น จะไม่มีผู้ช่วย</li><li>6 คน: ขโมยเลือกผู้ช่วยหนึ่งคน ทั้งสองรู้จักกัน</li><li>7 คน: ขโมยเลือกผู้ช่วยสองคน ผู้ช่วยรู้จักกัน แต่ไม่รู้ตัวขโมยจากการเป็นผู้ช่วย</li><li>8 คน: ขโมยเลือกผู้ช่วยสองคน ทั้งสามรู้จักกัน</li><li>คุยกันแล้วโหวตลับพร้อมกัน ห้ามเลือกตัวเอง คนคะแนนสูงสุดทั้งหมดจะถูกเปิดเผย ถ้ามีขโมยอยู่ด้วย ฝ่ายหนูขี้เซาชนะ มิฉะนั้นขโมยกับผู้ช่วยชนะ</li><li>เปิดหนูแพะได้ในเกม 6–8 คน ถ้าหนูแพะได้คะแนนโหวตสูงสุด จะชนะคนเดียว แม้เสมอกับขโมย</li></ol><p>การเล่นบนเว็บ: ช่วงกลางคืนชั่วโมงละ 10 วินาที ระบบหยิบชีสให้อัตโนมัติ หากขโมยไม่เลือกผู้ช่วยภายในเวลา ระบบเลือกให้จากรายชื่อที่ถูกกติกา ช่วงโหวตมี 2 นาที หมดเวลาให้นับเฉพาะโหวตที่ส่งแล้ว ผู้ชนะได้คนละ +1 คะแนน</p><a href="https://ludopedia-anexos.nyc3.digitaloceanspaces.com/cheese_thief_rules_217050.pdf" target="_blank" rel="noopener">คู่มือบอร์ดเกมต้นฉบับ</a><p>ข้อมูลลับยังใช้ระบบห้องร่วมกันของเว็บ ควรเล่นกับเพื่อนที่ไว้ใจ</p></details>';}
function renderCheese(r){
 const a=r.cheese,root=$('cheeseContent');if(!a){root.textContent='กำลังโหลดเกม…';return;}
 const key=cheeseKey(r);if(cheeseViewKey!==key){cheeseViewKey=key;cheeseSelection=new Set();}
 if(cheeseRollAnimation&&cheeseRollAnimation.key!==cheeseRoundKey(r))cheeseRollAnimation=null;
 const rolling=!!cheeseRollAnimation&&a.phase==='prepare';
 const info=CH.intel(r,myId),done=r.status==='results',name=id=>esc(cheeseName(r,id));
 const labels={prepare:'เตรียมตัว · รับบทและทอยลูกเต๋า',night:'กลางคืน · ตี '+a.hour,recruit:'ขโมยกำลังเลือกผู้ช่วย',intel:'รับข้อมูลฝ่ายของคุณ',discuss:'เช้าแล้ว · ใครขโมยชีส?',vote:'โหวตหาหนูขโมยชีส',finished:'สรุปผล'};
 root.innerHTML='<div class="section-head"><div><small>STEAL CHEESE</small><h2>🐭 หนูขโมยชีส 🧀</h2></div><span>'+a.order.length+' คน</span></div><p class="cheese-phase"><span>'+labels[a.phase]+'</span><strong id="cheeseTimer" aria-label="เวลาที่เหลือ">'+(a.deadline?formatLeft(a.deadline):'')+'</strong></p>'+(a.phase==='night'?cheeseNightTimeline(a,info):'')+'<div id="cheeseBody"></div>'+cheeseRules()+'<div id="cheeseHostActions"></div>';
 const body=$('cheeseBody');
 function block(title,html,cls=''){const section=document.createElement('section');section.className='cheese-card '+cls;section.innerHTML='<h3>'+title+'</h3>'+html;body.append(section);return section;}
 function button(parent,text,action,value,disabled=false){const b=document.createElement('button');b.type='button';b.className='btn primary';b.textContent=text;b.disabled=cheeseBusy||disabled;b.onclick=()=>cheeseSend(action,value);parent.append(b);return b;}
 if(done){
  const res=r.result||{},winners=res.winners||[];block(res.aborted?'เกมยุติ · ไม่คิดคะแนน':res.winner==='fall'?'หนูแพะชนะคนเดียว':res.caught?'จับขโมยได้แล้ว!':'ขโมยหนีไปพร้อมชีส!',res.aborted?'':winners.map(name).join(' · ')+'<p>ผู้ชนะได้คนละ +1 คะแนน</p>','cheese-winner');
  block('เฉลยทุกบทบาท',a.order.map(id=>'<div class="cheese-result-row"><span>'+playerLabelHTML(id,r)+'</span><strong>'+esc(cheeseRoleLabel(r,id))+'</strong><span>🎲 '+a.dice[id].join(' / ')+'</span><span>'+Number(res.counts?.[id]||0)+' โหวต</span></div>').join(''));
  block('ผลโหวต',a.order.map(id=>'<p>'+name(id)+' → '+(a.votes?.[id]?name(a.votes[id]):'ไม่ได้ส่งโหวต')+'</p>').join(''));
 }else{
  const roleInfo=info.role==='thief'?'ตื่นตามลูกเต๋าเพื่อขโมยชีส แล้วหลบการจับให้ได้':info.baseRole==='fall'?'พยายามให้ตัวเองถูกโหวตมากที่สุด เพื่อชนะคนเดียว':info.role==='follower'?'คุณอยู่ฝ่ายขโมย ต้องช่วยไม่ให้ตัวขโมยถูกจับ':'ใช้สิ่งที่เห็นตอนกลางคืนเพื่อหาตัวขโมย';
  const roleHTML='<strong class="cheese-my-role">'+esc(cheeseRoleLabel(r,myId))+'</strong><p>'+roleInfo+'</p>';
  if(a.phase!=='night')block('บทบาทส่วนตัวของคุณ',roleHTML+(a.phase!=='prepare'?cheeseDiceHTML(info.dice)+'<p>เวลาตื่นของคุณ: ตี '+info.wake.join(' และตี ')+'</p>':''));
  if(a.phase==='prepare'){
   const panel=block(rolling?'กำลังทอยลูกเต๋า…':!info.dice.length?'1 · ทอยลูกเต๋าของคุณ':a.ready?.[myId]?'พร้อมเข้านอนแล้ว':'2 · ตรวจเวลาตื่นและยืนยัน',cheeseDiceHTML(info.dice,rolling,a.order.length===4?2:1)+'<p class="cheese-roll-result" role="status" aria-live="polite">'+(rolling?'รอสักครู่…':info.dice.length?'ได้แต้ม '+info.dice.join(' และ '):'กดทอยเพื่อกำหนดเวลาตื่นของคุณ')+'</p>','cheese-prepare');
   if(!a.rolled?.[myId]||rolling){const b=button(panel,rolling?'กำลังทอย…':'🎲 ทอยลูกเต๋า','roll',null,rolling);b.onclick=cheeseRoll;}
   else{
    if(a.order.length===4&&info.baseRole!=='thief'){panel.innerHTML+='<p>เลือกลูกเต๋าหนึ่งลูกเป็นเวลาตื่นของคุณ</p>';for(const hour of [...new Set(info.dice)])button(panel,(a.wake?.[myId]===hour?'✓ ':'')+'ตื่นตี '+hour,'wake',hour,!!a.ready?.[myId]);}
    else panel.innerHTML+='<p>คุณจะตื่นตี '+info.wake.join(' และ ')+'</p>';
    button(panel,a.ready?.[myId]?'พร้อมแล้ว':'ยืนยัน · พร้อมเข้านอน','ready',null,!!a.ready?.[myId]||(a.order.length===4&&info.baseRole!=='thief'&&!a.wake?.[myId]));
   }
   block('รอทุกคนพร้อม','<p class="cheese-ready-count">'+a.order.filter(p=>a.ready?.[p]).length+' / '+a.order.length+' คนพร้อมแล้ว</p><div class="cheese-ready-list">'+a.order.map(id=>'<span>'+name(id)+' · '+(a.ready?.[id]?'✓ พร้อม':a.rolled?.[id]?'กำลังเตรียมตัว':'รอทอย')+'</span>').join('')+'</div>');
  }
  if(a.phase==='night'){
   const sight=info.sightings['h'+a.hour];
   if(!info.awake){
    const next=info.wake.filter(h=>h>a.hour).sort((x,y)=>x-y)[0];
    block('🌙 คุณกำลังหลับ','<div class="cheese-sleep-symbol" aria-hidden="true">☾<small>z z z</small></div><p class="cheese-next-action">'+(next?'คุณจะตื่นตอนตี '+next:'คืนนี้คุณตื่นครบแล้ว รอเช้าเพื่อพูดคุย')+'</p><p>ตอนนี้ไม่ต้องกดอะไร · รอเวลาเปลี่ยนอัตโนมัติ</p><p class="muted">คุณจะเห็นเหตุการณ์เฉพาะชั่วโมงที่ตัวเองตื่น</p>','cheese-night-state cheese-asleep');
   }
   else{
    const peers=sight?.peers||[],canPeek=info.baseRole!=='thief'&&a.order.length>4&&!peers.length&&!info.peek;
    const panel=block('☀ คุณตื่นแล้ว · ตี '+a.hour,'<p class="cheese-next-action">'+(info.baseRole==='thief'?'ระบบหยิบชีสให้แล้ว · จำสิ่งที่เห็นไว้':canPeek?'คุณตื่นคนเดียว · เลือกส่องลูกเต๋าได้ 1 คน':'จำคนที่ตื่นพร้อมคุณและสถานะของชีส')+'</p><div class="cheese-observation-grid"><div><small>คนที่ตื่นพร้อมคุณ</small><strong>'+ (peers.length?peers.map(name).join(' · '):'ไม่มี · คุณตื่นคนเดียว')+'</strong></div><div><small>สถานะชีสเมื่อตื่น</small><strong>'+(sight?.cheeseBefore?'🧀 ยังอยู่':'ชีสหายไปแล้ว')+'</strong><span>'+(sight?.cheeseBefore&&!sight.cheeseAfter?'ถูกหยิบไปในชั่วโมงนี้':sight?.cheeseAfter?'ยังอยู่หลังจบเหตุการณ์':'')+'</span></div></div>'+(sight?.witness?'<p class="cheese-witness">คุณเห็น <strong>'+name(sight.witness)+'</strong> หยิบชีส!</p>':''),'cheese-night-state cheese-awake');
    if(canPeek){const grid=document.createElement('div');grid.className='cheese-choices cheese-peek-choices';panel.append(grid);for(const id of a.order.filter(p=>p!==myId))button(grid,'ส่อง '+cheeseName(r,id),'peek',id);}
    else if(!info.peek)panel.innerHTML+='<p class="muted">'+(a.order.length===4?'เกม 4 คนไม่มีการส่องลูกเต๋า':peers.length?'ตื่นพร้อมคนอื่น จึงส่องลูกเต๋าไม่ได้':'รอเวลาเปลี่ยนอัตโนมัติ')+'</p>';
    if(info.peek)panel.innerHTML+='<div class="cheese-peek-result"><strong>ส่อง '+name(info.peek.target)+' · ได้แต้ม '+info.peek.value+'</strong>'+cheeseDiceHTML([info.peek.value])+'<span>ส่องครบแล้ว · จำข้อมูลไว้ใช้ตอนเช้า</span></div>';
   }
   block('ข้อมูลส่วนตัว','<details><summary>เปิดดูบทบาทและลูกเต๋าของคุณ</summary>'+roleHTML+cheeseDiceHTML(info.dice)+'</details>','cheese-private-info');
  }
  if(['night','recruit'].includes(a.phase)&&info.role==='thief'&&info.recruitCount&&!a.followers?.length){
   const panel=block('เลือกผู้ช่วยขโมย '+info.recruitCount+' คน','<p>เลือกจากรายชื่อที่ถูกกติกา แล้วกดยืนยัน</p>'),grid=document.createElement('div');grid.className='cheese-choices';panel.append(grid);
   for(const id of info.eligible){const b=button(grid,cheeseName(r,id),'followers',[]);b.className='btn outline';b.onclick=()=>{if(cheeseSelection.has(id))cheeseSelection.delete(id);else if(cheeseSelection.size<info.recruitCount)cheeseSelection.add(id);for(const [p,el] of Object.entries(grid._choices))el.classList.toggle('selected',cheeseSelection.has(p));confirm.disabled=cheeseSelection.size!==info.recruitCount||cheeseBusy;};grid._choices||={};grid._choices[id]=b;}
   const confirm=button(panel,'ยืนยันผู้ช่วย','followers',[],true);confirm.onclick=()=>cheeseSend('followers',[...cheeseSelection]);
  }
  if(['intel','discuss','vote'].includes(a.phase)){
   if(info.knownThief||info.knownFollowers.length)block('ข้อมูลฝ่ายของคุณ',(info.knownThief?'<p>ตัวขโมย: '+name(info.knownThief)+'</p>':'<p>กติกา 7 คน: คุณไม่ได้รับการเปิดเผยตัวขโมย</p>')+'<p>ผู้ช่วยที่คุณรู้จัก: '+(info.knownFollowers.filter(p=>p!==myId).map(name).join(' · ')||'ไม่มีคนอื่น')+'</p>');
   const sightings=Object.values(info.sightings);block('สิ่งที่คุณเห็นเมื่อคืน',sightings.map(s=>'<p>ตี '+s.hour+' · ตื่นพร้อม '+(s.peers.map(name).join(' · ')||'ไม่มีใคร')+' · ชีส'+(s.cheeseAfter?'ยังอยู่':'หายแล้ว')+(s.witness?' · เห็น '+name(s.witness)+' หยิบชีส':'')+'</p>').join('')+(info.peek?'<p>ส่อง '+name(info.peek.target)+' ได้แต้ม '+info.peek.value+'</p>':''));
  }
  if(a.phase==='discuss')block('พูดคุยเพื่อหาตัวขโมย','<p>คุยกันได้เต็มที่ แต่ห้ามแสดงการ์ดบทบาทหรือลูกเต๋าของตัวเอง Host เริ่มโหวตก่อนหมดเวลาได้</p>');
  if(a.phase==='vote'){
   const panel=block('เลือกคนที่คิดว่าเป็นขโมย','<p>โหวตแล้ว '+a.order.filter(p=>a.votes?.[p]).length+' / '+a.order.length+' คน · ผลจะเปิดพร้อมกัน</p>');
   if(a.votes?.[myId])panel.innerHTML+='<p>ส่งโหวตแล้ว รอทุกคน</p>';
   else{const grid=document.createElement('div');grid.className='cheese-choices';panel.append(grid);for(const id of a.order.filter(p=>p!==myId)){const b=button(grid,cheeseName(r,id),'vote',id);b.onclick=async()=>{const room=roomId,gameNo=r.gamesPlayed;if(await confirmBox('โหวต '+cheeseName(r,id)+'?', 'โหวตได้คนละหนึ่งครั้ง', 'ยืนยันโหวต')&&room===roomId&&roomState&&roomState.gamesPlayed===gameNo&&roomState.cheese?.phase==='vote')cheeseSend('vote',id);};}}
  }
 }
 const tools=$('cheeseHostActions');if(isHost){
  if(done){const b=button(tools,'กลับล็อบบี้ · เล่นรอบใหม่','',null);b.onclick=cheeseReturn;}
  else{
   if(a.phase==='discuss')button(tools,'เริ่มโหวตตอนนี้','call_vote');
   const b=button(tools,'ยุติเกม · ไม่คิดคะแนน','abort');b.className='btn outline';b.onclick=async()=>{const room=roomId,gameNo=r.gamesPlayed;if(await confirmBox('ยุติเกมนี้?', 'เปิดเฉลยและไม่คิดคะแนน', 'ยุติเกม')&&room===roomId&&roomState?.gamesPlayed===gameNo)cheeseSend('abort');};
  }
 }else if(done)tools.textContent='รอ Host กลับล็อบบี้';
}
setInterval(()=>{if(roomState?.gameMode==='cheese'&&roomState.status==='cheese_playing'){$('cheeseTimer').textContent=roomState.cheese?.deadline?formatLeft(roomState.cheese.deadline):'';cheeseAuto();}},1000);
if(roomState?.gameMode==='cheese'){renderRoom(roomState);runAutomatic();}
