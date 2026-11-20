/* Base Coup and classic Liar's Bar rules. Pure room transitions and redacted views. */
(function(root){
 'use strict';
 const GAMES={coup:{name:'Coup',min:2,max:6,mark:'♛',tag:'อำนาจอยู่ที่คำพูด'},liar_deck:{name:"Liar’s Deck",min:2,max:4,mark:'♠',tag:'ไพ่คว่ำ คำพูดลวง'},liar_dice:{name:"Liar’s Dice",min:2,max:4,mark:'⚄',tag:'ทอยลับ บลัฟทั้งโต๊ะ'}};
 const ROLES={duke:{name:'Duke',title:'ดยุก',symbol:'♛',action:'รับภาษี 3 เหรียญ',block:'ขวางเงินช่วยเหลือ'},assassin:{name:'Assassin',title:'นักฆ่า',symbol:'†',action:'จ่าย 3 เพื่อลอบสังหาร',block:''},captain:{name:'Captain',title:'กัปตัน',symbol:'⚓',action:'ขโมยสูงสุด 2 เหรียญ',block:'ขวางการขโมย'},ambassador:{name:'Ambassador',title:'ทูต',symbol:'⚜',action:'จั่ว 2 แล้วเลือกไพ่เก็บ',block:'ขวางการขโมย'},contessa:{name:'Contessa',title:'เคาน์เตส',symbol:'❖',action:'ใช้ป้องกันการลอบสังหาร',block:'ขวางการลอบสังหาร'}};
 const ACTIONS={income:{label:'รายได้',cost:0,amount:1},aid:{label:'เงินช่วยเหลือ',cost:0,amount:2},tax:{label:'เก็บภาษี',cost:0,role:'duke',amount:3},steal:{label:'ขโมย',cost:0,role:'captain',target:true},exchange:{label:'แลกไพ่',cost:0,role:'ambassador'},assassinate:{label:'ลอบสังหาร',cost:3,role:'assassin',target:true},coup:{label:'รัฐประหาร',cost:7,target:true}};
 const clone=v=>JSON.parse(JSON.stringify(v));
 const shuffle=(xs,rng=Math.random)=>{const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const pick=(xs,rng)=>xs[Math.floor(rng()*xs.length)];
 const living=a=>a.order.filter(id=>a.mode==='coup'?a.people[id].cards.some(c=>!c.revealed):!a.people[id].out);
 const nextAfter=(a,id,ids=living(a))=>{for(let n=1;n<=a.order.length;n++){const p=a.order[(a.order.indexOf(id)+n)%a.order.length];if(ids.includes(p))return p;}return null;};
 function event(a,type,data={}){a.eventNo++;a.history['e'+a.eventNo]={type,round:a.round,turn:a.turn,...data};}
 function finish(r){const a=r.tabletop,ids=living(a);if(ids.length!==1)return false;r.status='results';a.phase='finished';r.result={type:a.mode,winner:ids[0],points:1};r.tabletopLastWinner=ids[0];r.scores||={};r.scores[ids[0]]=(Number(r.scores[ids[0]])||0)+1;event(a,'win',{by:ids[0]});return true;}
 function setup(r,ids,rng=Math.random){
  const meta=GAMES[r?.gameMode];if(!meta||r.status!=='lobby'||ids.length<meta.min||ids.length>meta.max||new Set(ids).size!==ids.length||!ids.every(id=>r.players?.[id]))return false;
  const mode=r.gameMode,order=shuffle(ids,rng),a={mode,order,people:{},phase:'action',revision:0,round:0,turn:1,actor:order[0],history:{},eventNo:0};
  if(mode==='coup'&&order.includes(r.tabletopLastWinner)){const first=r.tabletopLastWinner;order.splice(order.indexOf(first),1);order.unshift(first);a.actor=first;}
  r.tabletop=a;r.gamePlayers=clone(r.players);r.playerProfiles={...(r.playerProfiles||{}),...clone(r.players)};r.gamesPlayed=(Number(r.gamesPlayed)||0)+1;r.status='tabletop_playing';r.result=null;
  if(mode==='coup'){
   a.deck=shuffle(Object.keys(ROLES).flatMap(role=>[role,role,role]),rng);a.bank=50;
   for(const id of order){const coins=ids.length===2&&id===order[0]?1:2;a.people[id]={coins,cards:[{role:a.deck.pop(),revealed:false},{role:a.deck.pop(),revealed:false}]};a.bank-=coins;}
   a.round=1;event(a,'start',{by:a.actor});
  }else{
   for(const id of order)a.people[id]=mode==='liar_deck'?{hand:[],pulls:0,trigger:1+Math.floor(rng()*6),out:false}:{dice:[],penalties:0,out:false};
   liarRound(a,rng,a.actor);
  }
  return true;
 }
 function gain(a,id,n){const amount=Math.min(n,a.bank);a.people[id].coins+=amount;a.bank-=amount;}
 function endTurn(r){const a=r.tabletop;if(finish(r))return;const previous=a.actor;a.actor=nextAfter(a,previous);a.turn++;a.phase='action';delete a.pending;delete a.loss;delete a.proof;delete a.exchange;}
 function resumeCoup(r,kind,rng){if(finish(r))return;const a=r.tabletop;if(kind==='claim')coupBlock(r);else if(kind==='execute')executeCoup(r,rng);else{if(kind==='refund'&&a.pending?.paid){a.people[a.pending.by].coins+=a.pending.paid;a.bank-=a.pending.paid;}endTurn(r);}}
 function loseInfluence(r,id,kind,rng){const a=r.tabletop;if(!living(a).includes(id)){resumeCoup(r,kind,rng);return;}a.loss={id,resume:kind};a.phase='loss';}
 function blockRoles(a,id){const p=a.pending;if(!p||id===p.by)return [];if(p.action==='aid')return ['duke'];if(id!==p.target)return [];return p.action==='steal'?['captain','ambassador']:p.action==='assassinate'?['contessa']:[];}
 function responders(a){if(a.phase==='claim')return living(a).filter(id=>id!==a.pending.by);if(a.phase==='block')return living(a).filter(id=>blockRoles(a,id).length);if(a.phase==='counter')return living(a).filter(id=>id!==a.pending.blocker);return [];}
 function coupBlock(r){const a=r.tabletop;a.pending.passed={};if(!living(a).includes(a.pending.by)){endTurn(r);return;}if(['aid','steal','assassinate'].includes(a.pending.action)&&responders({...a,phase:'block'}).length)a.phase='block';else executeCoup(r);}
 function executeCoup(r,rng=Math.random){
  const a=r.tabletop,p=a.pending;if(!p)return;if(!living(a).includes(p.by)){endTurn(r);return;}
  if(p.action==='income'||p.action==='aid'||p.action==='tax'){gain(a,p.by,ACTIONS[p.action].amount);endTurn(r);}
  else if(p.action==='steal'){if(living(a).includes(p.target)){const n=Math.min(2,a.people[p.target].coins);a.people[p.target].coins-=n;a.people[p.by].coins+=n;}endTurn(r);}
  else if(p.action==='assassinate'||p.action==='coup')loseInfluence(r,p.target,'end',rng);
  else if(p.action==='exchange'){
   const cards=a.people[p.by].cards.filter(c=>!c.revealed).map(c=>c.role),draw=a.deck.splice(-2);a.exchange={id:p.by,keep:cards.length,pool:[...cards,...draw]};a.phase='exchange';
  }
 }
 function coupApply(r,id,type,value,rng){
  const a=r.tabletop;
  if(type==='action'){
   const action=value?.action,rule=ACTIONS[action],target=value?.target;
   if(a.phase!=='action'||a.actor!==id||!rule||a.people[id].coins<rule.cost||(a.people[id].coins>=10&&action!=='coup')||(rule.target&&(!living(a).includes(target)||target===id)))return false;
   a.people[id].coins-=rule.cost;a.bank+=rule.cost;a.pending={by:id,action,target:rule.target?target:null,role:rule.role||null,paid:rule.cost,passed:{}};
   event(a,'action',{by:id,action,target:rule.target?target:null});if(rule.role)a.phase='claim';else if(action==='aid')coupBlock(r);else executeCoup(r,rng);return true;
  }
  if(type==='pass'){
   if(!responders(a).includes(id)||a.pending.passed?.[id])return false;a.pending.passed||={};a.pending.passed[id]=true;
   if(responders(a).every(p=>a.pending.passed[p])){if(a.phase==='claim')coupBlock(r);else if(a.phase==='block')executeCoup(r,rng);else endTurn(r);}return true;
  }
  if(type==='block'){
   if(a.phase!=='block'||!blockRoles(a,id).includes(value)||a.pending.passed?.[id])return false;
   a.pending.blocker=id;a.pending.blockRole=value;a.pending.passed={};a.phase='counter';event(a,'block',{by:id,role:value});return true;
  }
  if(type==='challenge'){
   if(!['claim','counter'].includes(a.phase)||!responders(a).includes(id)||a.pending.passed?.[id])return false;
   const counter=a.phase==='counter';a.proof={id:counter?a.pending.blocker:a.pending.by,role:counter?a.pending.blockRole:a.pending.role,challenger:id,counter};a.phase='proof';event(a,'challenge',{by:id,target:a.proof.id,role:a.proof.role});return true;
  }
  if(type==='prove'){
   if(a.phase!=='proof'||a.proof.id!==id)return false;const proof=a.proof,cards=a.people[id].cards;
   if(value===-1){event(a,'bluff',{by:id,role:proof.role});loseInfluence(r,id,proof.counter?'execute':'refund',rng);return true;}
   if(!Number.isInteger(value)||!cards[value]||cards[value].revealed||cards[value].role!==proof.role)return false;
   const role=cards[value].role;a.deck=shuffle([...a.deck,role],rng);cards[value].role=a.deck.pop();event(a,'proved',{by:id,role});loseInfluence(r,proof.challenger,proof.counter?'end':'claim',rng);return true;
  }
  if(type==='lose'){
   if(a.phase!=='loss'||a.loss.id!==id||!Number.isInteger(value)||!a.people[id].cards[value]||a.people[id].cards[value].revealed)return false;
   const card=a.people[id].cards[value];card.revealed=true;event(a,'lost',{by:id,role:card.role});
   if(!living(a).includes(id)){a.bank+=a.people[id].coins;a.people[id].coins=0;}
   const kind=a.loss.resume;delete a.loss;resumeCoup(r,kind,rng);return true;
  }
  if(type==='exchange'){
   const ex=a.exchange;if(a.phase!=='exchange'||ex.id!==id||!Array.isArray(value)||value.length!==ex.keep||new Set(value).size!==value.length||!value.every(n=>Number.isInteger(n)&&n>=0&&n<ex.pool.length))return false;
   const kept=value.map(n=>ex.pool[n]);a.people[id].cards.forEach(c=>{if(!c.revealed)c.role=kept.shift();});a.deck=shuffle([...a.deck,...ex.pool.filter((_,i)=>!value.includes(i))],rng);event(a,'exchanged',{by:id});endTurn(r);return true;
  }
  return false;
 }
 function liarRound(a,rng,starter){
  a.round++;a.phase='action';a.actor=living(a).includes(starter)?starter:nextAfter(a,starter);a.ready={};a.last=null;delete a.reveal;a.discard=[];
  if(a.mode==='liar_deck'){
   a.rank=pick(['A','K','Q'],rng);const deck=shuffle(['A','K','Q'].flatMap(rank=>Array(6).fill(rank)).concat(['J','J']),rng);
   for(const id of living(a))a.people[id].hand=deck.splice(-5);a.unused=deck;
  }else for(const id of living(a))a.people[id].dice=Array.from({length:5},()=>1+Math.floor(rng()*6));
  event(a,'round',{by:a.actor,rank:a.rank||null});
 }
 function validBid(a,bid){return Number.isInteger(bid?.count)&&bid.count>=1&&bid.count<=living(a).length*5&&Number.isInteger(bid.face)&&bid.face>=1&&bid.face<=6&&(!a.last||bid.count>a.last.count||(bid.count===a.last.count&&bid.face>a.last.face));}
 function liarApply(r,id,type,value,rng){
  const a=r.tabletop;
  if(type==='ready'){
   if(a.phase!=='reveal'||!living(a).includes(id)||a.ready?.[id])return false;a.ready||={};a.ready[id]=true;
   if(living(a).every(p=>a.ready[p]))liarRound(a,rng,a.reveal.loser);return true;
  }
  if(a.phase!=='action'||a.actor!==id)return false;
  if(type==='play'&&a.mode==='liar_deck'){
   const hand=a.people[id].hand;
   if(!Array.isArray(value)||value.length<1||value.length>3||new Set(value).size!==value.length||!value.every(n=>Number.isInteger(n)&&n>=0&&n<hand.length)||living(a).filter(p=>a.people[p].hand.length).length===1&&a.last)return false;
   if(a.last)a.discard.push(...a.last.cards);
   const cards=value.map(i=>hand[i]);a.people[id].hand=hand.filter((_,i)=>!value.includes(i));a.last={by:id,cards,count:cards.length};
   event(a,'play',{by:id,count:cards.length,rank:a.rank});a.actor=nextAfter(a,id,living(a).filter(p=>a.people[p].hand.length));return true;
  }
  if(type==='bid'&&a.mode==='liar_dice'){
   if(!validBid(a,value))return false;a.last={by:id,count:value.count,face:value.face};event(a,'bid',a.last);a.actor=nextAfter(a,id);return true;
  }
  if(type==='challenge'){
   if(!a.last||a.last.by===id)return false;const last=a.last;let truthful,actual=null;
   if(a.mode==='liar_deck')truthful=last.cards.every(c=>c===a.rank||c==='J');
   else{actual=living(a).reduce((n,p)=>n+a.people[p].dice.filter(x=>x===last.face).length,0);truthful=actual>=last.count;}
   const loser=truthful?id:last.by,p=a.people[loser];
   if(a.mode==='liar_deck'){p.pulls++;p.out=p.pulls===p.trigger;}else{p.penalties++;p.out=p.penalties>=2;}
   a.reveal={challenger:id,bidder:last.by,loser,truthful,actual,cards:a.mode==='liar_deck'?[...last.cards]:[],dice:a.mode==='liar_dice'?Object.fromEntries(living(a).concat(p.out?[loser]:[]).map(p=>[p,[...a.people[p].dice]])):{},out:p.out};
   event(a,'reveal',a.reveal);a.ready={};a.phase='reveal';finish(r);return true;
  }
  return false;
 }
 function apply(r,id,type,value,revision,rng=Math.random){
  if(!GAMES[r?.gameMode]||r.status!=='tabletop_playing'||!r.tabletop||!r.players?.[id]||!r.tabletop.order.includes(id)||revision!=null&&revision!==r.tabletop.revision)return false;
  const draft=clone(r),a=draft.tabletop;
  if(type==='abort'){
   if(id!==r.hostId)return false;draft.status='results';a.phase='finished';draft.result={type:a.mode,aborted:true,points:0};event(a,'abort',{by:id});
  }else if(a.mode==='coup'?!coupApply(draft,id,type,value,rng):!liarApply(draft,id,type,value,rng))return false;
  a.revision++;Object.assign(r,draft);return true;
 }
 function view(r,id){
  const a=r?.tabletop;if(!a||!GAMES[r.gameMode])return null;
  const pub={mode:a.mode,phase:a.phase,revision:a.revision,order:[...a.order],alive:living(a),actor:a.actor,round:a.round,turn:a.turn,history:clone(a.history),people:{},rank:a.rank||null,ready:clone(a.ready||{}),reveal:a.reveal?clone(a.reveal):null,pending:a.pending?clone(a.pending):null,loss:a.loss?clone(a.loss):null,proof:a.proof?clone(a.proof):null,bank:a.bank,deckCount:a.deck?.length||0,responders:a.mode==='coup'?responders(a):[]};
  if(a.mode==='coup')for(const p of a.order)pub.people[p]={coins:a.people[p].coins,cards:a.people[p].cards.map(c=>({revealed:c.revealed,role:c.revealed||p===id?c.role:null}))};
  else for(const p of a.order){const x=a.people[p];pub.people[p]={out:x.out,count:a.mode==='liar_deck'?x.hand.length:x.dice.length,pulls:x.pulls||0,penalties:x.penalties||0,...(p===id?(a.mode==='liar_deck'?{hand:[...x.hand]}:{dice:[...x.dice]}):{})};}
  pub.last=a.last?{by:a.last.by,count:a.last.count,...(a.mode==='liar_dice'?{face:a.last.face}:{})}:null;
  if(a.exchange?.id===id)pub.exchange=clone(a.exchange);
  if(a.mode==='coup')pub.blockRoles=blockRoles(a,id);
  return pub;
 }
 function botMove(v,id,rng=Math.random){
  const choose=xs=>pick(xs,rng);
  if(v.mode==='coup'){
   const own=v.people[id],roles=own.cards.filter(c=>!c.revealed).map(c=>c.role);
   if(v.phase==='loss'&&v.loss.id===id){const choices=own.cards.map((c,i)=>({c,i})).filter(x=>!x.c.revealed);return {id,type:'lose',value:choose(choices).i};}
   if(v.phase==='proof'&&v.proof.id===id){const index=own.cards.findIndex(c=>!c.revealed&&c.role===v.proof.role);return {id,type:'prove',value:index};}
   if(v.phase==='exchange'&&v.exchange){const rank={duke:4,assassin:3,captain:3,ambassador:1,contessa:2};const chosen=v.exchange.pool.map((role,i)=>({role,i,score:rank[role]+rng()})).sort((a,b)=>b.score-a.score).slice(0,v.exchange.keep).map(c=>c.i);return {id,type:'exchange',value:chosen};}
   if(v.responders.includes(id)&&!v.pending.passed?.[id]){
    if(v.phase==='block'){const role=v.blockRoles.find(r=>roles.includes(r));if(role||rng()<.15)return {id,type:'block',value:role||choose(v.blockRoles)};}
    else if(rng()<.12)return {id,type:'challenge'};
    return {id,type:'pass'};
   }
   if(v.phase!=='action'||v.actor!==id)return null;
   const enemies=v.alive.filter(p=>p!==id),target=choose(enemies),coins=own.coins;
   if(coins>=7)return {id,type:'action',value:{action:'coup',target}};
   if(coins>=3&&roles.includes('assassin')&&rng()<.65)return {id,type:'action',value:{action:'assassinate',target}};
   if(roles.includes('duke')||rng()<.35)return {id,type:'action',value:{action:'tax'}};
   if(roles.includes('captain')&&v.people[target].coins)return {id,type:'action',value:{action:'steal',target}};
   return {id,type:'action',value:{action:rng()<.55?'aid':'income'}};
  }
  if(v.phase==='reveal'&&v.alive.includes(id)&&!v.ready[id])return {id,type:'ready'};
  if(v.phase!=='action'||v.actor!==id)return null;
  if(v.mode==='liar_deck'){
   const hand=v.people[id].hand,remaining=v.alive.filter(p=>v.people[p].count>0);
   if(v.last&&(remaining.length===1||rng()<(v.last.count===3?.5:.25)))return {id,type:'challenge'};
   const real=hand.map((rank,i)=>({rank,i})).filter(c=>c.rank===v.rank||c.rank==='J').map(c=>c.i),bluff=hand.map((_,i)=>i).filter(i=>!real.includes(i));
   return {id,type:'play',value:shuffle(real.length&&rng()<.7?real:bluff.length?bluff:real,rng).slice(0,1+Math.floor(rng()*3))};
  }
  const dice=v.people[id].dice,total=v.alive.length*5,unknown=total-5;
  function probability(b){const have=dice.filter(n=>n===b.face).length,need=Math.max(0,b.count-have);if(need>unknown)return 0;let result=0;for(let k=need;k<=unknown;k++){let comb=1;for(let j=1;j<=k;j++)comb=comb*(unknown-j+1)/j;result+=comb*(1/6)**k*(5/6)**(unknown-k);}return result;}
  if(v.last&&probability(v.last)<.34)return {id,type:'challenge'};
  let best=null,score=-1;
  for(let count=v.last?.count||1;count<=total;count++)for(let face=1;face<=6;face++){
   const bid={count,face};if(v.last&&!(count>v.last.count||count===v.last.count&&face>v.last.face))continue;
   const p=probability(bid),s=p-.018*count+rng()*.04;if(s>score){score=s;best=bid;}
  }
  return best?{id,type:'bid',value:best}:v.last?{id,type:'challenge'}:null;
 }
 function nextBotAction(r,rng=Math.random){if(r?.status!=='tabletop_playing'||!r.tabletop)return null;const v=r.tabletop;for(const id of v.order){if(!r.players?.[id]?.bot)continue;const move=botMove(view(r,id),id,rng);if(move)return move;}return null;}
 function manageBots(r,host,action){
  const meta=GAMES[r?.gameMode];if(!meta||r.status!=='lobby'||host!==r.hostId||!r.players?.[host]||r.players[host].bot)return false;
  const count=Number(r.tabletopCount||meta.max);r.playerProfiles||={};r.scores||={};
  if(action==='remove'){const bots=Object.keys(r.players).filter(p=>r.players[p].bot);if(!bots.length)return false;for(const p of bots){delete r.players[p];delete r.playerProfiles[p];delete r.scores[p];}return true;}
  if(!['add','fill'].includes(action))return false;const n=Math.min(count-Object.keys(r.players).length,action==='add'?1:count);if(n<=0)return false;
  for(let i=0;i<n;i++){let index=1;while(r.players['table_bot_'+index])index++;const id='table_bot_'+index,p={name:'Bot '+index,avatar:'robot',bot:true};r.players[id]=p;r.playerProfiles[id]=p;r.scores[id]=0;if(r.kickedPlayers)delete r.kickedPlayers[id];}return true;
 }
 const api={GAMES,ROLES,ACTIONS,setup,apply,view,botMove,nextBotAction,manageBots,validBid,shuffle};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TabletopEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
