/* Independent room rules for the additional party games. Every action is validated
   against a revision and applied to a copy, so rejected moves leave no partial state. */
(function(root){
 'use strict';
 const GAMES={
  take6:{name:'6 nimmt!',min:2,max:10,mark:'Ⅵ',tag:'วางไพ่พร้อมกัน · เลี่ยงแต้มลบ',bots:true},
  just_one:{name:'Just One',min:3,max:7,defaultCount:4,mark:'✎',tag:'ใบ้คำร่วมกัน · คำซ้ำถูกตัด',bots:false,help:'ผู้ทายเลือกเลข 1–5 คนอื่นใบ้หนึ่งคำ · 3–4 คนใบ้คนละสองคำ'}
 };
 const JUST_WORDS='ช้าง,รถไฟ,กาแฟ,ดวงจันทร์,ร่ม,ภูเขา,แมว,ทะเล,นาฬิกา,หุ่นยนต์,จักรยาน,โรงเรียน,ขนมปัง,นักบิน,สะพาน,มะม่วง,กล้อง,พายุ,กระเป๋า,ดอกไม้,คอมพิวเตอร์,ปลาโลมา,หนังสือ,ตู้เย็น,ฟุตบอล,ดวงดาว,เกาะ,ตลาด,เครื่องบิน,ป่า,ผีเสื้อ,น้ำตก,หมวก,เต่า,ช็อกโกแลต,วาฬ,ปราสาท,ลิฟต์,รถเมล์,พิซซ่า,โคมไฟ,สนามบิน,ไอศกรีม,หมาป่า,กีตาร์,สวนสัตว์,ส้ม,เต็นท์,ฝน,หมอน,พัดลม,แม่น้ำ,นักสืบ,เค้ก,มังกร,แมงมุม,โรงหนัง,ลูกโป่ง,โต๊ะ,คีย์บอร์ด,เรือ,รองเท้า,ดินสอ,สายรุ้ง,ปลาหมึก,เสือ,สิงโต,ปรอท,หมากรุก,กล้วย,ท้องฟ้า,รถถัง,ไวโอลิน,โทรศัพท์,น้ำแข็ง,สับปะรด,นักดนตรี,ลูกเต๋า,ประตู,เพชร,กระต่าย,ดาวอังคาร,เรือดำน้ำ,พีระมิด,กังหัน,พรม,อูฐ,หิมะ,สนามเด็กเล่น,เก้าอี้,ปลาวาฬ,แบตเตอรี่,มะเขือเทศ,รถแข่ง,พิพิธภัณฑ์'.split(',');
 const norm=s=>String(s||'').normalize('NFC').trim().toLocaleLowerCase().replace(/\s+/g,' ');
 const clone=x=>JSON.parse(JSON.stringify(x));
 const shuffle=(xs,rng=Math.random)=>{const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const bullheads=n=>n===55?7:n%11===0?5:n%10===0?3:n%5===0?2:1;
 const log=(a,type,data={})=>{a.eventNo++;a.history['e'+a.eventNo]={type,...data};};
 function finish(r,winners){
  const a=r.arcade;r.status='results';a.phase='finished';r.scores||={};
  r.result={type:a.mode,winners:[...winners],points:1};
  for(const id of winners)r.scores[id]=(Number(r.scores[id])||0)+1;
  log(a,'end',{winners:[...winners]});
 }
 function dealTake6(a,rng){
  const deck=shuffle(Array.from({length:104},(_,i)=>i+1),rng);
  for(const id of a.order)a.people[id].hand=deck.splice(0,10).sort((x,y)=>x-y);
  a.rows=deck.splice(0,4).map(n=>[n]);a.step=1;a.picks={};a.queue=[];a.phase='choose';
  log(a,'deal',{round:a.round});
 }
 function setup(r,ids,rng=Math.random){
  const meta=GAMES[r?.gameMode],count=Number(r?.arcadeCount||meta?.max);
  if(!meta||r.status!=='lobby'||ids.length!==count||count<meta.min||count>meta.max||new Set(ids).size!==ids.length||!ids.every(id=>r.players?.[id]))return false;
  const a={mode:r.gameMode,order:shuffle(ids,rng),people:{},round:1,revision:0,phase:'choose',history:{},eventNo:0};
  r.arcade=a;r.gamePlayers=clone(r.players);r.playerProfiles={...(r.playerProfiles||{}),...clone(r.players)};
  r.gamesPlayed=(Number(r.gamesPlayed)||0)+1;r.status='arcade_playing';r.result=null;
  for(const id of a.order)a.people[id]={hand:[],penalty:0,taken:[]};
  if(a.mode==='take6')dealTake6(a,rng);
  if(a.mode==='just_one'){
   const words=shuffle(JUST_WORDS,rng).slice(0,65);
   a.cards=Array.from({length:13},(_,i)=>words.slice(i*5,i*5+5));
   a.cardIndex=0;a.turn=0;a.won=0;a.discarded=0;a.phase='choose_word';a.picked=null;a.clues={};a.removed=[];
  }
  return true;
 }
 function nextJust(r){
  const a=r.arcade;
  if(a.cardIndex>=13){
   if(a.won>=9)finish(r,a.order);
   else {r.status='results';a.phase='finished';r.result={type:'just_one',winners:[],points:0,won:a.won};log(a,'end',{winners:[]});}
   return;
  }
  a.phase='choose_word';a.picked=null;a.clues={};a.removed=[];
 }
 function justMove(r,id,type,value){
  const a=r.arcade,guesser=a.order[a.turn%a.order.length],card=a.cards[a.cardIndex];
  if(a.phase==='choose_word'&&type==='choose_word'&&id===guesser&&Number.isInteger(value)&&value>=0&&value<5){
   a.picked=value;a.phase='clue';log(a,'choose_word',{by:id,number:value+1});return true;
  }
  if(a.phase==='clue'&&type==='clue'&&id!==guesser&&!Object.hasOwn(a.clues,id)&&Array.isArray(value)&&value.length===(a.order.length<=4?2:1)&&value.every(s=>typeof s==='string'&&norm(s).length>=1&&norm(s).length<=30&&!/\s/.test(norm(s))&&norm(s)!==norm(card[a.picked]))){
   a.clues[id]=value.map(s=>s.trim());log(a,'clue',{by:id});
   if(Object.keys(a.clues).length===a.order.length-1){
    const all=Object.entries(a.clues).flatMap(([p,list])=>list.map((s,i)=>({key:p+':'+i,word:norm(s)})));
    a.removed=all.filter(x=>all.some(y=>x.key!==y.key&&x.word===y.word)).map(x=>x.key);
    a.phase='review';
   }
   return true;
  }
  const reviewer=a.order.find(p=>p!==guesser);
  if(a.phase==='review'&&id===reviewer&&type==='cancel'&&typeof value==='string'&&Object.entries(a.clues).some(([p,list])=>list.some((_,i)=>value===p+':'+i))){
   a.removed.includes(value)?a.removed.splice(a.removed.indexOf(value),1):a.removed.push(value);return true;
  }
  if(a.phase==='review'&&id===reviewer&&type==='show'){
   const all=Object.entries(a.clues).flatMap(([p,list])=>list.map((s,i)=>({key:p+':'+i,word:norm(s)})));
   a.removed=[...new Set([...a.removed,...all.filter(x=>all.some(y=>x.key!==y.key&&x.word===y.word)).map(x=>x.key)])];
   a.phase='guess';log(a,'show',{clues:all.length-a.removed.length});return true;
  }
  if(a.phase==='guess'&&id===guesser&&(type==='answer'||type==='pass')&&(type==='pass'||typeof value==='string'&&norm(value).length>0&&norm(value).length<=80)){
   const answer=card[a.picked],correct=type==='answer'&&norm(value)===norm(answer);
   a.last={answer,correct,guess:type==='pass'?'ข้าม':value};
   if(correct)a.won++;
   else {a.discarded++;if(type==='answer'){
    if(a.cardIndex<12){a.cardIndex++;a.discarded++;}
    else if(a.won){a.won--;a.discarded++;}
   }}
   log(a,'answer',{by:id,answer,correct,guess:a.last.guess});a.cardIndex++;a.turn++;nextJust(r);return true;
  }
  return false;
 }
 function advanceTake6(r,rng){
  const a=r.arcade;
  while(a.queue.length){
   const move=a.queue.shift(),n=move.card;
   const candidates=a.rows.map((row,i)=>({i,d:n-row.at(-1)})).filter(x=>x.d>0).sort((x,y)=>x.d-y.d);
   if(!candidates.length){a.waiting=move;a.phase='choose_row';return;}
   const row=a.rows[candidates[0].i];
   if(row.length===5){
    const penalty=row.reduce((sum,card)=>sum+bullheads(card),0);
    a.people[move.id].penalty+=penalty;a.people[move.id].taken.push(...row);
    log(a,'take',{by:move.id,row:candidates[0].i,penalty});
    a.rows[candidates[0].i]=[n];
   }else row.push(n);
   log(a,'place',{by:move.id,card:n,row:candidates[0].i});
  }
  a.waiting=null;
  if(a.step<10){a.step++;a.picks={};a.phase='choose';return;}
  if(a.order.some(id=>a.people[id].penalty>=66)){
   const best=Math.min(...a.order.map(id=>a.people[id].penalty));
   finish(r,a.order.filter(id=>a.people[id].penalty===best));return;
  }
  a.round++;dealTake6(a,rng);
 }
 function take6Move(r,id,type,value,rng){
  const a=r.arcade;
  if(type==='pick'){
   const hand=a.people[id]?.hand;
   if(a.phase!=='choose'||!hand||Object.hasOwn(a.picks,id)||!Number.isInteger(value)||!hand.includes(value))return false;
   a.picks[id]=value;
   if(Object.keys(a.picks).length===a.order.length){
    a.queue=Object.entries(a.picks).map(([player,card])=>({id:player,card})).sort((x,y)=>x.card-y.card);
    for(const move of a.queue){const cards=a.people[move.id].hand;cards.splice(cards.indexOf(move.card),1);}
    log(a,'reveal',{cards:a.queue.map(x=>x.card)});
    advanceTake6(r,rng);
   }
   return true;
  }
  if(type==='row'){
   if(a.phase!=='choose_row'||a.waiting?.id!==id||!Number.isInteger(value)||value<0||value>3)return false;
   const row=a.rows[value],penalty=row.reduce((sum,card)=>sum+bullheads(card),0);
   a.people[id].penalty+=penalty;a.people[id].taken.push(...row);
   a.rows[value]=[a.waiting.card];
   log(a,'take',{by:id,row:value,penalty});log(a,'place',{by:id,card:a.waiting.card,row:value});
   a.waiting=null;a.phase='resolve';advanceTake6(r,rng);return true;
  }
  return false;
 }
 function apply(r,id,type,value,revision,rng=Math.random){
  if(!GAMES[r?.gameMode]||!r.arcade||r.status!=='arcade_playing'||r.arcade.revision!==revision)return false;
  if(type!=='abort'&&!r.arcade.order.includes(id))return false;
  if(type==='abort'&&id!==r.hostId)return false;
  const next=clone(r);
  const valid=type==='abort'?(next.status='results',next.arcade.phase='finished',next.result={type:r.gameMode,aborted:true,points:0},log(next.arcade,'abort'),true):
   (next.arcade.mode==='take6'&&take6Move(next,id,type,value,rng)||next.arcade.mode==='just_one'&&justMove(next,id,type,value));
  if(!valid)return false;
  next.arcade.revision++;
  Object.assign(r,next);return true;
 }
 function view(r,id){
  const a=r?.arcade;if(!a||!GAMES[a.mode])return null;
  if(a.mode==='just_one'){
   const guesser=a.order[a.turn%a.order.length],reviewer=a.order.find(p=>p!==guesser),isGuesser=id===guesser,allClues=Object.entries(a.clues).flatMap(([p,list])=>list.map((word,i)=>({key:p+':'+i,by:p,word,removed:a.removed.includes(p+':'+i)})));
   return {mode:a.mode,phase:a.phase,revision:a.revision,order:[...a.order],guesser,reviewer,number:a.picked===null?null:a.picked+1,word:!isGuesser||r.status==='results'?a.cards[a.cardIndex]?.[a.picked]:undefined,
    card:a.phase==='choose_word'&&isGuesser?['1','2','3','4','5']:undefined,clues:a.phase==='review'&&!isGuesser||a.phase==='guess'||r.status==='results'?allClues.map(c=>({...c,word:a.phase==='review'&&!isGuesser||!c.removed?c.word:'คำถูกตัด'})):[],
    ownSubmitted:Object.hasOwn(a.clues,id),submissions:Object.keys(a.clues).length,required:a.order.length-1,won:a.won,discarded:a.discarded,remaining:13-a.cardIndex,last:a.last||null,result:r.result?clone(r.result):null};
  }
  return {mode:a.mode,phase:a.phase,revision:a.revision,round:a.round,step:a.step,order:[...a.order],
   people:Object.fromEntries(a.order.map(p=>[p,{penalty:a.people[p].penalty,count:a.people[p].hand.length,hand:p===id?[...a.people[p].hand]:undefined,chosen:Object.hasOwn(a.picks,p)}])),
   rows:a.rows.map(row=>[...row]),waiting:a.waiting?{id:a.waiting.id,card:a.waiting.card}:null,
   history:Object.values(a.history).slice(-14),result:r.result?clone(r.result):null};
 }
 function botMove(v,id,rng=Math.random){
  if(!v||!v.people[id])return null;
  if(v.phase==='choose_row'&&v.waiting?.id===id){
   const penalties=v.rows.map(row=>row.reduce((sum,n)=>sum+bullheads(n),0));
   return {id,type:'row',value:penalties.indexOf(Math.min(...penalties))};
  }
  if(v.phase!=='choose'||v.people[id].chosen)return null;
  const hand=v.people[id].hand;
  const scored=hand.map(n=>{
   const ends=v.rows.map(row=>row.at(-1)).filter(end=>end<n);
   if(!ends.length)return {n,cost:10+Math.min(...v.rows.map(row=>row.reduce((sum,c)=>sum+bullheads(c),0)))};
   const row=v.rows.find(row=>row.at(-1)===Math.max(...ends));
   return {n,cost:row.length===5?row.reduce((sum,c)=>sum+bullheads(c),0)+8:row.length*1.4+(n-row.at(-1))/30};
  }).sort((x,y)=>x.cost-y.cost||rng()-.5);
  return {id,type:'pick',value:scored[0].n};
 }
 function nextBotAction(r,rng=Math.random){
  if(r?.status!=='arcade_playing'||!r.arcade)return null;
  for(const id of r.arcade.order){if(!r.players?.[id]?.bot)continue;const move=botMove(view(r,id),id,rng);if(move)return move;}
  return null;
 }
 function manageBots(r,host,action){
  const meta=GAMES[r?.gameMode];if(!meta?.bots||r.status!=='lobby'||r.hostId!==host||!r.players?.[host]||r.players[host].bot)return false;
  const count=Number(r.arcadeCount||meta.max);r.playerProfiles||={};r.scores||={};
  if(action==='remove'){const ids=Object.keys(r.players).filter(p=>r.players[p].bot);if(!ids.length)return false;for(const id of ids){delete r.players[id];delete r.playerProfiles[id];delete r.scores[id];}return true;}
  if(!['add','fill'].includes(action))return false;
  const n=Math.min(count-Object.keys(r.players).length,action==='add'?1:count);
  if(n<=0)return false;
  for(let i=0;i<n;i++){let k=1;while(r.players['arcade_bot_'+k])k++;const id='arcade_bot_'+k,p={name:'Bot '+k,avatar:'robot',bot:true};r.players[id]=p;r.playerProfiles[id]=p;r.scores[id]=0;}
  return true;
 }
 const api={GAMES,setup,apply,view,botMove,nextBotAction,manageBots,bullheads,shuffle};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ArcadeEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
