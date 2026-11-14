// Who Am I — Customize By Player: one random recipient per writer, 60s setup, two guesses.
const WHO_CUSTOM_PREP_MS=60000;
const WHO_CUSTOM_FALLBACK=['แตงโม','มะม่วง','ช้าง','แมว','สุนัข','ดวงจันทร์','สายรุ้ง','รถไฟ','พิซซ่า','แพนด้า','ไดโนเสาร์','จักรยาน','ต้นไม้','นาฬิกา','ดาวเสาร์','หุ่นยนต์','กระต่าย','น้ำตก','กีตาร์','ช็อกโกแลต','ดอกทานตะวัน','สนามบิน','ปลาวาฬ','ฉลาม','หิ่งห้อย','ปราสาท','เครื่องบิน','ซูชิ','ภูเขา','สมาร์ตโฟน','ห้องสมุด','รองเท้า','นักบินอวกาศ','ประภาคาร','เรือใบ','แมงกะพรุน','ฟักทอง','ดาวอังคาร','เมฆ','สายฟ้า','ผีเสื้อ','ม้าลาย','กุญแจ','โดนัท','เครื่องซักผ้า','แว่นตา','โรงภาพยนตร์','ต้นกระบองเพชร','ลูกโป่ง','นกเพนกวิน','ไข่ดาว'];
let activeWhoCustomKey='';
function whoCustomSetup(r,ids){
 if(r.gameMode!=='whoami_custom'||r.status!=='lobby'||ids.length<2)return false;
 const order=shuffle(ids);
 r.whoCustomAssignments=Object.fromEntries(order.map((id,i)=>[id,order[(i+1)%order.length]]));
 r.whoCustomSubmitted={};r.whoCustomWords={};r.whoCustomGuesses={};r.whoCustomAutoWords={};
 r.whoCustomDeadline=serverNow()+WHO_CUSTOM_PREP_MS;
 // The placeholder role allows the original reconnect routine to recognise players during setup.
 r.roles=Object.fromEntries(ids.map(id=>[id,'__pending__']));
 r.gamePlayers=copyPack(r.players);
 r.playerProfiles={...(r.playerProfiles||{}),...copyPack(r.players)};
 r.status='whoami_prepare';r.gamesPlayed=(Number(r.gamesPlayed)||0)+1;
 r.result=null;r.lastActivityAt=TIMESTAMP();return true;
}
function whoCustomEveryoneConfirmed(r){
 const writers=Object.keys(r.whoCustomAssignments||{});
 return writers.length>=2&&writers.every(id=>r.whoCustomSubmitted?.[id]===true);
}
function whoCustomBegin(r){
 if(r.gameMode!=='whoami_custom'||r.status!=='whoami_prepare')return false;
 const assignments=r.whoCustomAssignments||{},ids=Object.keys(assignments);
 if(ids.length<2)return false;
 const words={...r.whoCustomWords},used=new Set(Object.values(words).map(norm));
 const automated={};
 for(const [i,id] of ids.entries()){
  if(String(words[id]||'').trim())continue;
  let fallback=WHO_CUSTOM_FALLBACK.find(w=>!used.has(norm(w)));
  if(!fallback)fallback='คำปริศนา '+(i+1);
  words[id]=fallback;used.add(norm(fallback));automated[id]=true;
 }
 r.roles=words;r.whoCustomAutoWords=automated;
 r.whoCustomDeadline=null;r.status='playing';
 r.attempts=Object.fromEntries(ids.map(id=>[id,2]));
 r.guessDetails={};r.guessedCorrectly={};r.correctOrder=[];r.whoCustomGuesses={};
 r.turnOrder=shuffle(ids);r.currentTurnIndex=0;r.currentRound=1;r.totalRounds=Number(r.settingValue)||2;
 r.turnStartedAt=null;r.playDeadline=null;r.finalDeadline=null;r.whoTimeRemaining={};
 r.lastActivityAt=TIMESTAMP();return true;
}
function whoCustomClock(r){
 if($('whoCustomScreen').hidden)return;
 $('whoCustomTimer').textContent=formatLeft(r.whoCustomDeadline);
 $('whoCustomSubmitBtn').disabled=!!r.whoCustomSubmitted?.[myId]||serverNow()>=Number(r.whoCustomDeadline||0);
}
function renderWhoCustomPrepare(r){
 const assignments=r.whoCustomAssignments||{},targetId=assignments[myId];
 const players=gameParticipants(r),ids=Object.keys(assignments),count=ids.filter(id=>r.whoCustomSubmitted?.[id]).length;
 const key=roomId+':'+(r.gamesPlayed||0)+':'+myId;
 if(key!==activeWhoCustomKey){activeWhoCustomKey=key;$('whoCustomWordInput').value='';}
 $('whoCustomTarget').textContent=players[targetId]?.name||'ผู้เล่น';
 $('whoCustomConfirmCount').textContent='ยืนยันแล้ว '+count+' / '+ids.length+' คน';
 $('whoCustomSubmittedNote').hidden=!r.whoCustomSubmitted?.[myId];
 $('whoCustomEntry').hidden=!!r.whoCustomSubmitted?.[myId];
 $('whoCustomWordInput').disabled=!!r.whoCustomSubmitted?.[myId];
 $('whoCustomTimer').textContent=formatLeft(r.whoCustomDeadline);
 $('whoCustomSubmitBtn').disabled=!!r.whoCustomSubmitted?.[myId]||serverNow()>=Number(r.whoCustomDeadline||0);
 renderGameStats('whoCustomProgress',[
  {label:'รูปแบบ',value:'Customize By Player'},
  {label:'ยืนยันโจทย์แล้ว',value:count+' / '+ids.length},
  {label:'เวลาคิด',value:formatLeft(r.whoCustomDeadline)}
 ]);
}
function renderWhoCustomGuessHistory(r){
 const box=$('whoCustomGuessHistory');box.replaceChildren();box.hidden=r.gameMode!=='whoami_custom';
 if(r.gameMode!=='whoami_custom')return;
 const guesses=r.whoCustomGuesses?.[myId]||[];
 if(!guesses.length)return;
 guesses.forEach((g,i)=>{
  const line=document.createElement('div');line.className='who-custom-guess-item '+(g.correct?'correct':'incorrect');
  const answer=document.createElement('span');answer.textContent='ครั้งที่ '+(i+1)+': '+g.answer;
  const verdict=document.createElement('b');verdict.textContent=g.correct?'✓ ถูกต้อง':'✕ ไม่ถูกต้อง';
  line.append(answer,verdict);box.append(line);
 });
}
$('whoCustomSubmitBtn').onclick=async()=>{
 if(roomState?.gameMode!=='whoami_custom'||roomState.status!=='whoami_prepare'||!roomId)return;
 const word=$('whoCustomWordInput').value.trim().replace(/\s+/g,' ');
 if(!word||word.length>100){toast('กรุณาตั้งคำตอบยาว 1–100 ตัวอักษร','error');return;}
 const button=$('whoCustomSubmitBtn');button.disabled=true;
 try{
  const res=await getRef().transaction(r=>{
   const target=r?.whoCustomAssignments?.[myId];
   if(!r||r.gameMode!=='whoami_custom'||r.status!=='whoami_prepare'||!target||
     !r.players?.[myId]||r.whoCustomSubmitted?.[myId]||serverNow()>=Number(r.whoCustomDeadline||0))return;
   r.whoCustomWords||={};r.whoCustomSubmitted||={};
   r.whoCustomWords[target]=word;r.whoCustomSubmitted[myId]=true;
   if(whoCustomEveryoneConfirmed(r))whoCustomBegin(r);
   r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
  toast(res.committed?'ยืนยันคำให้เพื่อนแล้ว':'หมดเวลาหรือเคยยืนยันแล้ว',res.committed?'success':'error');
 }catch(e){error(e);}finally{button.disabled=false;}
};
$('whoCustomWordInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing)$('whoCustomSubmitBtn').click()});
async function whoCustomGuess(){
 if(roomState?.gameMode!=='whoami_custom'||!roomId)return;
 const answer=$('guessInput').value.trim().replace(/\s+/g,' ');
 if(!answer||answer.length>100){toast('พิมพ์คำตอบ 1–100 ตัวอักษรก่อน','error');return;}
 const remaining=Number(roomState.attempts?.[myId]||0);
 if(!remaining){toast('คุณใช้โอกาสตอบครบแล้ว','error');return;}
 if(!await confirmBox('ยืนยันคำตอบ?', 'ทาย “'+answer+'” · เหลือ '+remaining+' ครั้ง', 'ยืนยันคำตอบ'))return;
 const button=$('guessBtn');button.disabled=true;
 try{
  const res=await getRef().transaction(r=>{
   if(!r||r.gameMode!=='whoami_custom'||!['playing','final_guess'].includes(r.status)||
    !r.players?.[myId]||Number(r.attempts?.[myId]||0)<=0||
    (r.status==='final_guess'&&serverNow()>=Number(r.finalDeadline||0)))return;
   const correct=norm(answer)===norm(r.roles?.[myId]);
   r.whoCustomGuesses||={};
   const history=r.whoCustomGuesses[myId]||[];
   if(history.length>=2)return;
   r.whoCustomGuesses[myId]=[...history,{answer,correct,round:r.currentRound||1}];
   r.attempts[myId]=correct?0:Number(r.attempts[myId])-1;
   r.guessedCorrectly||={};r.guessedCorrectly[myId]=correct;
   const exhausted=Number(r.attempts[myId])===0;
   const round=r.status==='final_guess'?(r.totalRounds||1):(r.currentRound||1);
   let points=0;
   if(correct){
    r.correctOrder||=[];
    points=Math.max(1,Number(r.totalRounds||2)-round+1);
    r.correctOrder.push(myId);r.scores||={};r.scores[myId]=(Number(r.scores[myId])||0)+points;
   }
   if(exhausted){
    r.guessDetails||={};
    r.guessDetails[myId]={correct,points,round,answer,correctAnswer:r.roles?.[myId]||'',attempts:r.whoCustomGuesses[myId].length};
    if(r.status==='playing')removeWhoAnsweredPlayer(r,myId);
   }
   if(Object.keys(r.players||{}).length&&Object.keys(r.players).every(id=>Number(r.attempts?.[id]||0)===0)){
    r.status='results';r.finalDeadline=null;
   }
   r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
  if(!res.committed){toast('หมดเวลาหรือคุณใช้โอกาสหมดแล้ว','error');return;}
  const state=res.snapshot.val(),correct=!!state.whoCustomGuesses?.[myId]?.at(-1)?.correct;
  const left=Number(state.attempts?.[myId]||0);
  $('guessInput').value='';
  toast(correct?'ตอบถูก! +'+(state.guessDetails?.[myId]?.points||0)+' คะแนน':left?'ตอบไม่ถูก · เหลือ '+left+' ครั้ง':'ตอบไม่ถูก · หมดโอกาสแล้ว',correct?'success':'error');
 }catch(e){error(e);}finally{button.disabled=false;}
}
async function whoCustomAuto(){
 if(autoBusy||!roomId||leaving||roomState?.gameMode!=='whoami_custom'||roomState.status!=='whoami_prepare')return;
 if(serverNow()<Number(roomState.whoCustomDeadline||0)&&!whoCustomEveryoneConfirmed(roomState))return;
 autoBusy=true;
 try{
  await getRef().transaction(r=>{
   if(!r||r.gameMode!=='whoami_custom'||r.status!=='whoami_prepare')return;
   if(serverNow()<Number(r.whoCustomDeadline||0)&&!whoCustomEveryoneConfirmed(r))return;
   if(whoCustomBegin(r))return r;
  },undefined,false);
 }catch(e){error(e);}finally{autoBusy=false;}
}
setInterval(()=>{
 if(roomState?.gameMode==='whoami_custom'&&roomState.status==='whoami_prepare'){
  whoCustomClock(roomState);whoCustomAuto();
 }
},1000);
