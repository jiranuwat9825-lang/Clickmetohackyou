/* Independent room rules for the additional party games. Every action is validated
   against a revision and applied to a copy, so rejected moves leave no partial state. */
(function(root){
 'use strict';
 const GAMES={
  take6:{name:'6 nimmt!',min:2,max:10,mark:'Ⅵ',tag:'วางไพ่พร้อมกัน · เลี่ยงแต้มลบ',bots:true}
 };
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
  return true;
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
   next.arcade.mode==='take6'&&take6Move(next,id,type,value,rng);
  if(!valid)return false;
  next.arcade.revision++;
  Object.assign(r,next);return true;
 }
 function view(r,id){
  const a=r?.arcade;if(!a||!GAMES[a.mode])return null;
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
