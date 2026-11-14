// Insider add-on for Party Game Hub. Loaded after script.js.
const INSIDER_PREP_MS=60000,INSIDER_GUESS_MS=300000,INSIDER_VOTE_MS=120000,INSIDER_MAX_GUESSES=5;
let insiderVoteChoice='',activeInsiderNoteKey='';
const insiderRole=(r,id=myId)=>r?.roles?.[id]||'common';
const insiderIds=r=>gameParticipantIds(r).filter(id=>r?.roles?.[id]);
const insiderKey=r=>'insider_note:'+roomId+':'+Number(r?.gamesPlayed||0)+':'+myId;
function insiderSyncNotes(r){
 if(r?.gameMode!=='insider')return;
 const active=['insider_prepare','playing','insider_voting'].includes(r.status),key=insiderKey(r),el=$('insiderNoteInput');
 if(!active){if(activeInsiderNoteKey)try{sessionStorage.removeItem(activeInsiderNoteKey)}catch{};activeInsiderNoteKey='';el.value='';return;}
 if(key!==activeInsiderNoteKey){activeInsiderNoteKey=key;try{el.value=sessionStorage.getItem(key)||''}catch{el.value=''}}
 $('insiderNoteCount').textContent=el.value.length+' / 3000';
}
$('insiderNoteInput').addEventListener('input',()=>{
 if(!activeInsiderNoteKey)return;
 try{sessionStorage.setItem(activeInsiderNoteKey,$('insiderNoteInput').value)}catch{}
 $('insiderNoteCount').textContent=$('insiderNoteInput').value.length+' / 3000';
});
function insiderStartGuessing(r){
 if(r.gameMode!=='insider'||r.status!=='insider_prepare'||!String(r.insiderAnswer||'').trim())return false;
 r.status='playing';r.insiderDeadline=null;r.insiderGuessDeadline=serverNow()+INSIDER_GUESS_MS;return true;
}
function insiderNoWinner(r,reason){
 r.status='results';r.insiderResolved=true;r.insiderDeadline=null;r.insiderGuessDeadline=null;
 r.result={type:'insider',reason,found:false,answer:r.insiderAnswer||null,masterId:r.insiderMasterId,insiderId:r.insiderId,awards:{}};
}
function insiderStartVoting(r,winner){
 r.status='insider_voting';r.insiderWinner=winner;r.insiderDeadline=serverNow()+INSIDER_VOTE_MS;
 r.insiderGuessDeadline=null;r.insiderVotes={};
}
function insiderVotingComplete(r){
 const ids=Object.keys(r.players||{}).filter(id=>r.roles?.[id]);
 return ids.length>0&&ids.every(id=>!!r.insiderVotes?.[id]);
}
function insiderResolveVotes(r){
 if(r.status!=='insider_voting'||r.insiderResolved)return;
 const ids=insiderIds(r),counts={};
 for(const [id,v] of Object.entries(r.insiderVotes||{})){
  if(ids.includes(id)&&ids.includes(v)&&id!==v)counts[v]=(counts[v]||0)+1;
 }
 const max=Math.max(0,...Object.values(counts)),leaders=Object.keys(counts).filter(id=>max>0&&counts[id]===max);
 const pickedId=leaders.length===1?leaders[0]:null,caught=pickedId===r.insiderId,awards={};
 ids.forEach(id=>{const points=caught?(id!==r.insiderId?1:0):(id===r.insiderId?2:0);
  awards[id]=points;r.scores||={};r.scores[id]=(Number(r.scores[id])||0)+points;});
 r.result={type:'insider',found:true,answer:r.insiderAnswer,masterId:r.insiderMasterId,insiderId:r.insiderId,
  winner:r.insiderWinner,caught,pickedId,awards,voteCounts:counts,votes:copyPack(r.insiderVotes||{})};
 r.insiderResolved=true;r.status='results';r.insiderDeadline=null;
}
function insiderClock(r){
 if($('insiderScreen').hidden)return;
 const prep=r.status==='insider_prepare',play=r.status==='playing',vote=r.status==='insider_voting';
 $('insiderTimer').textContent=formatLeft(play?r.insiderGuessDeadline:r.insiderDeadline);
 if(prep&&myId===r.insiderMasterId)$('insiderMasterSubmit').disabled=serverNow()>=Number(r.insiderDeadline||0);
 if(play)$('insiderGuessSubmit').disabled=insiderRole(r)==='master'||Number(r.insiderAttempts?.[myId]||0)>=5||serverNow()>=Number(r.insiderGuessDeadline||0);
 if(vote)$('insiderVoteSubmit').disabled=!!r.insiderVotes?.[myId]||!insiderVoteChoice||serverNow()>=Number(r.insiderDeadline||0);
}
function renderInsider(r){
 insiderSyncNotes(r);
 const role=insiderRole(r),master=role==='master',spy=role==='insider',prep=r.status==='insider_prepare',play=r.status==='playing',vote=r.status==='insider_voting';
 const used=Number(r.insiderAttempts?.[myId]||0),remaining=Math.max(0,5-used),ids=insiderIds(r);
 setGameAvatar('insiderAvatar');
 $('insiderMyRole').textContent=role.toUpperCase();
 $('insiderRoleHint').textContent=master?'คุณตั้งคำและตอบคำถามด้วยความจริง โดยไม่พูดคำตอบ':spy?'คุณรู้คำตอบ จงทำตัวให้กลมกลืนและไม่ให้ถูกจับได้':'คุณต้องพยายามทายคำลับและหาคนที่รู้คำตอบ';
 $('insiderTimerLabel').textContent=prep?'เวลาตั้งคำ':play?'เวลาทายคำ':'เวลาลงคะแนน';
 $('insiderTimer').textContent=formatLeft(play?r.insiderGuessDeadline:r.insiderDeadline);
 $('insiderMasterPanel').hidden=!prep||!master;
 $('insiderKnownPanel').hidden=!spy||!r.insiderAnswer||prep;
 $('insiderKnownWord').textContent=spy&&!prep?r.insiderAnswer||'':'';
 $('insiderGuessPanel').hidden=!play||master||remaining===0;
 $('insiderVotePanel').hidden=!vote;
 $('insiderRemaining').textContent='โอกาสทายคงเหลือ '+remaining+' / 5 ครั้ง';
 const guesses=$('insiderGuessHistory');guesses.replaceChildren();
 (r.insiderGuesses?.[myId]||[]).forEach((word,i)=>{const p=document.createElement('p');p.className='insider-attempt';p.textContent='ครั้งที่ '+(i+1)+': '+word;guesses.append(p)});
 const voters=Object.keys(r.players||{}).filter(id=>r.roles?.[id]);
 $('insiderStatus').textContent=prep?(master?'กรอกคำตอบภายใน 1 นาที ถ้าไม่ทันจะยกเลิกรอบ':'รอ Master ตั้งคำ ถ้าคิดเสร็จก่อนจะเริ่มเวลา 5 นาทีทันที'):
  play?(master?'ตอบคำถามให้ผู้เล่นทุกคนตามจริง':'ถาม Master และพิมพ์คำตอบได้สูงสุดคนละ 5 ครั้ง'):
  'ตอบถูกแล้ว! โหวตว่าใครเป็น Insider · ลงคะแนนแล้ว '+Object.keys(r.insiderVotes||{}).length+'/'+voters.length;
 renderGameStats('insiderProgress',[{label:'บทบาท',value:role.toUpperCase()},{label:'ผู้เล่น',value:ids.length+' คน'},{label:'โอกาสที่เหลือ',value:master?'—':remaining+' / 5'}]);
 if(vote){
  const box=$('insiderVoteChoices');box.replaceChildren();
  ids.filter(id=>id!==myId).forEach(id=>{
   const b=document.createElement('button');b.type='button';b.className='vote-choice'+(insiderVoteChoice===id?' selected':'');
   b.innerHTML=playerLabelHTML(id,r);b.disabled=!!r.insiderVotes?.[myId];
   b.onclick=()=>{insiderVoteChoice=id;renderInsider(roomState)};box.append(b);
  });
  $('insiderVoteProgress').textContent=r.insiderVotes?.[myId]?'โหวตแล้ว รอคนอื่น':'เสียงข้างมากระบุตัว Insider (เสมอ = Insider ชนะ)';
 }
 insiderClock(r);
}
function renderInsiderResults(r,target,players){
 const res=r.result||{},found=!!res.found;
 const hero=document.createElement('section');hero.className='result-hero';
 const h=document.createElement('h2');h.textContent=!found?'รอบจบโดยไม่มีคนทายถูก':res.caught?'จับ Insider ได้แล้ว!':'Insider ชนะ!';
 const p=document.createElement('p');p.textContent=!found?'ไม่มีคะแนนรอบนี้':res.caught?'ทุกคนยกเว้น Insider ได้ 1 คะแนน':'Insider ได้ 2 คะแนน';
 hero.append(h,p);target.append(hero);
 const section=document.createElement('section');section.className='result-section',heading=document.createElement('h3');heading.textContent='เฉลย Insider';section.append(heading);
 for(const [label,value] of [['Master',players[r.insiderMasterId]?.name||'—'],['Insider',players[r.insiderId]?.name||'—'],
 ['คำตอบ',res.answer||'ไม่ได้ตั้งคำ'],['ผู้ตอบถูก',players[res.winner]?.name||'ไม่มี'],
 ['ผลโหวต',!found?'ไม่มีโหวต':res.pickedId?players[res.pickedId]?.name||'—':'เสมอ / ไม่มีคะแนนเสียง']]){
  const row=document.createElement('div');row.className='result-row';const l=document.createElement('span'),v=document.createElement('strong');
  l.textContent=label;v.textContent=value;row.append(l,v);section.append(row);
 }
 insiderIds(r).forEach(id=>{const row=document.createElement('div');row.className='result-row';row.innerHTML='<span>'+playerLabelHTML(id,r)+'</span><b>+'+Number(res.awards?.[id]||0)+' คะแนน</b>';section.append(row)});
 target.append(section);
}
$('insiderMasterSubmit').onclick=async()=>{
 if(!roomId||roomState?.gameMode!=='insider'||myId!==roomState.insiderMasterId)return;
 const answer=$('insiderMasterWord').value.trim().replace(/\s+/g,' ');
 if(!answer||answer.length>100){toast('คำตอบต้องยาว 1–100 ตัวอักษร','error');return;}
 const b=$('insiderMasterSubmit');b.disabled=true;
 try{const res=await getRef().transaction(r=>{
  if(!r||r.gameMode!=='insider'||r.status!=='insider_prepare'||r.insiderMasterId!==myId||serverNow()>=r.insiderDeadline)return;
  r.insiderAnswer=answer;insiderStartGuessing(r);r.lastActivityAt=TIMESTAMP();return r;
 },undefined,false);
 if(res.committed){$('insiderMasterWord').value='';toast('ยืนยันคำแล้ว เริ่ม 5 นาที','success')}else toast('หมดเวลาตั้งคำแล้ว','error');
 }catch(e){error(e)}finally{b.disabled=false}
};
$('insiderGuessSubmit').onclick=async()=>{
 if(!roomId||roomState?.gameMode!=='insider'||insiderRole(roomState)==='master')return;
 const answer=$('insiderGuessInput').value.trim().replace(/\s+/g,' ');
 if(!answer||answer.length>100){toast('กรอกคำตอบ 1–100 ตัวอักษร','error');return;}
 const b=$('insiderGuessSubmit');b.disabled=true;
 try{const res=await getRef().transaction(r=>{
  if(!r||r.gameMode!=='insider'||r.status!=='playing'||!r.players?.[myId]||
   r.roles?.[myId]==='master'||!r.insiderAnswer||serverNow()>=r.insiderGuessDeadline||
   Number(r.insiderAttempts?.[myId]||0)>=5)return;
  r.insiderAttempts||={};r.insiderAttempts[myId]=Number(r.insiderAttempts[myId]||0)+1;
  r.insiderGuesses||={};r.insiderGuesses[myId]=[...(r.insiderGuesses[myId]||[]),answer];
  if(norm(answer)===norm(r.insiderAnswer))insiderStartVoting(r,myId);
  r.lastActivityAt=TIMESTAMP();return r;
 },undefined,false);
 if(res.committed){$('insiderGuessInput').value='';const ok=res.snapshot.val()?.insiderWinner===myId;toast(ok?'ตอบถูก! เริ่มโหวต Insider':'บันทึกคำตอบแล้ว',ok?'success':'error')}
 else toast('หมดเวลาหรือใช้สิทธิ์ทายครบแล้ว','error');
 }catch(e){error(e)}finally{b.disabled=false}
};
$('insiderGuessInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing)$('insiderGuessSubmit').click()});
$('insiderVoteSubmit').onclick=async()=>{
 if(!insiderVoteChoice||!roomId)return;
 const picked=insiderVoteChoice,b=$('insiderVoteSubmit');b.disabled=true;
 try{const res=await getRef().transaction(r=>{
  if(!r||r.gameMode!=='insider'||r.status!=='insider_voting'||serverNow()>=r.insiderDeadline||
   !r.players?.[myId]||!r.roles?.[picked]||picked===myId||r.insiderVotes?.[myId])return;
  r.insiderVotes||={};r.insiderVotes[myId]=picked;r.lastActivityAt=TIMESTAMP();return r;
 },undefined,false);
 if(res.committed){insiderVoteChoice='';toast('ส่งโหวตแล้ว','success')}else toast('ส่งโหวตไม่ได้','error');
 }catch(e){error(e)}finally{b.disabled=false}
};
async function insiderAuto(){
 if(autoBusy||!roomId||roomState?.gameMode!=='insider'||leaving)return;
 const r=roomState,prep=r.status==='insider_prepare',playing=r.status==='playing',voting=r.status==='insider_voting';
 if(!(prep&&serverNow()>=Number(r.insiderDeadline||0)||playing&&serverNow()>=Number(r.insiderGuessDeadline||0)||voting&&(serverNow()>=Number(r.insiderDeadline||0)||insiderVotingComplete(r))))return;
 autoBusy=true;
 try{await getRef().transaction(x=>{
  if(!x||x.gameMode!=='insider')return;
  if(x.status==='insider_prepare'&&serverNow()>=x.insiderDeadline){if(!insiderStartGuessing(x))insiderNoWinner(x,'master_timeout');return x}
  if(x.status==='playing'&&serverNow()>=x.insiderGuessDeadline){insiderNoWinner(x,'guess_timeout');return x}
  if(x.status==='insider_voting'&&(serverNow()>=x.insiderDeadline||insiderVotingComplete(x))){insiderResolveVotes(x);return x}
 },undefined,false)}catch(e){error(e)}finally{autoBusy=false}
}
setInterval(()=>{if(roomState?.gameMode==='insider'&&['insider_prepare','playing','insider_voting'].includes(roomState.status)){insiderClock(roomState);insiderAuto()}},1000);
