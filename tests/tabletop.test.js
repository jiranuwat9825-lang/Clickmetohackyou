'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../tabletop-engine');
const seeded=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
function room(mode='coup',n=3,seed=1){const players=Object.fromEntries(Array.from({length:n},(_,i)=>['p'+i,{name:'Player '+i,bot:true}])),r={gameMode:mode,status:'lobby',hostId:'p0',players,scores:{}};assert.ok(E.setup(r,Object.keys(players),seeded(seed)));return r;}
function act(r,id,type,value,rng=seeded(10)){assert.ok(E.apply(r,id,type,value,r.tabletop.revision,rng),`${type} ${id} in ${r.tabletop.phase}`);}
function passes(r){for(let i=0;i<10;i++){const a=r.tabletop;if(!['claim','block','counter'].includes(a.phase))break;const v=E.view(r,a.actor),id=v.responders.find(p=>!v.pending.passed?.[p]);if(!id)break;act(r,id,'pass');}}
function roles(r,id,values){r.tabletop.people[id].cards=values.map(role=>({role,revealed:false}));}
test('Coup base setup uses 15 cards, 50 total coins, and the two-player first coin rule',()=>{
 for(const n of [2,3,4,5,6]){const r=room('coup',n),a=r.tabletop,counts={};for(const role of [...a.deck,...Object.values(a.people).flatMap(p=>p.cards.map(c=>c.role))])counts[role]=(counts[role]||0)+1;assert.deepEqual(counts,{duke:3,assassin:3,captain:3,ambassador:3,contessa:3});assert.equal(a.bank+Object.values(a.people).reduce((s,p)=>s+p.coins,0),50);assert.equal(a.people[a.actor].coins,n===2?1:2);}
});
test('Coup income, mandatory ten-coin coup, stale and wrong actors are validated atomically',()=>{
 const r=room(),a=r.tabletop,id=a.actor,other=a.order[1],before=JSON.stringify(r);assert.equal(E.apply(r,other,'action',{action:'income'}),false);assert.equal(JSON.stringify(r),before);
 act(r,id,'action',{action:'income'});assert.equal(r.tabletop.people[id].coins,3);r.tabletop.actor=id;r.tabletop.people[id].coins=10;
 const snap=JSON.stringify(r);assert.equal(E.apply(r,id,'action',{action:'tax'}),false);assert.equal(E.apply(r,id,'action',{action:'coup',target:id}),false);assert.equal(JSON.stringify(r),snap);
 act(r,id,'action',{action:'coup',target:other});assert.equal(r.tabletop.people[id].coins,3);assert.equal(r.tabletop.phase,'loss');assert.equal(E.apply(r,other,'lose',0,r.tabletop.revision-1),false);act(r,other,'lose',0);assert.ok(r.tabletop.people[other].cards[0].revealed);
});
test('Coup truthful claims replace proof and make challenger choose lost influence',()=>{
 const r=room(),id=r.tabletop.actor,other=r.tabletop.order[1];roles(r,id,['duke','captain']);act(r,id,'action',{action:'tax'});act(r,other,'challenge');assert.equal(r.tabletop.phase,'proof');
 act(r,id,'prove',0);assert.equal(r.tabletop.loss.id,other);act(r,other,'lose',1);assert.equal(r.tabletop.people[id].coins,5);assert.equal(r.tabletop.phase,'action');
});
test('Coup caught assassin claim cancels action and refunds its fee; blocks keep the fee spent',()=>{
 for(const blocked of [false,true]){const r=room(),a=r.tabletop,id=a.actor,target=a.order[1],challenger=a.order[2];a.people[id].coins=5;roles(r,id,blocked?['assassin','duke']:['captain','duke']);roles(r,target,['contessa','duke']);act(r,id,'action',{action:'assassinate',target});
  if(!blocked){act(r,challenger,'challenge');act(r,id,'prove',-1);act(r,id,'lose',0);assert.equal(r.tabletop.people[id].coins,5);assert.equal(r.tabletop.people[target].cards.filter(c=>!c.revealed).length,2);}
  else{passesUntilBlock(r);act(r,target,'block','contessa');passes(r);assert.equal(r.tabletop.people[id].coins,2);assert.equal(r.tabletop.phase,'action');}
 }
});
function passesUntilBlock(r){while(r.tabletop.phase==='claim'){const v=E.view(r,r.tabletop.actor),id=v.responders.find(p=>!v.pending.passed?.[p]);act(r,id,'pass');}}
test('Coup assassination can cost target two influence after a failed challenge or bluff block',()=>{
 for(const bluffBlock of [false,true]){const r=room(),a=r.tabletop,id=a.actor,target=a.order[1];a.people[id].coins=3;roles(r,id,['assassin','duke']);roles(r,target,['captain','duke']);act(r,id,'action',{action:'assassinate',target});
  if(bluffBlock){passesUntilBlock(r);act(r,target,'block','contessa');act(r,id,'challenge');act(r,target,'prove',-1);}
  else{act(r,target,'challenge');act(r,id,'prove',0);}
  act(r,target,'lose',0);if(r.tabletop.phase==='block')act(r,target,'pass');assert.equal(r.tabletop.loss.id,target);act(r,target,'lose',1);assert.equal(r.tabletop.people[target].coins,0);assert.ok(r.tabletop.people[target].cards.every(c=>c.revealed));
 }
});
test('Coup only targets can block steal and assassination, any opponent can block aid, and exchange keeps exact hand size',()=>{
 const r=room(),a=r.tabletop,id=a.actor,target=a.order[1],outsider=a.order[2];act(r,id,'action',{action:'steal',target});passesUntilBlock(r);assert.equal(E.apply(r,outsider,'block','captain'),false);act(r,target,'pass');assert.equal(r.tabletop.people[id].coins,4);
 r.tabletop.actor=id;act(r,id,'action',{action:'aid'});act(r,outsider,'block','duke');passes(r);assert.equal(r.tabletop.people[id].coins,4);
 r.tabletop.actor=id;act(r,id,'action',{action:'exchange'});passes(r);assert.equal(r.tabletop.exchange.pool.length,4);const before=JSON.stringify(r);assert.equal(E.apply(r,id,'exchange',[0,0]),false);assert.equal(JSON.stringify(r),before);act(r,id,'exchange',[2,3]);assert.equal(r.tabletop.people[id].cards.length,2);
});
test('Liar Deck deals the classic deck, skips empty hands, forces last holder to challenge and reveals only latest cards',()=>{
 const r=room('liar_deck',4),a=r.tabletop;assert.equal(Object.values(a.people).reduce((n,p)=>n+p.hand.length,0),20);const flat=Object.values(a.people).flatMap(p=>p.hand);for(const rank of ['A','K','Q'])assert.equal(flat.filter(c=>c===rank).length,6);assert.equal(flat.filter(c=>c==='J').length,2);
 const id=a.actor,target=a.order[1];for(const p of a.order)a.people[p].hand=[];a.people[id].hand=['J'];a.people[target].hand=['A','K'];act(r,id,'play',[0]);assert.equal(r.tabletop.actor,target);assert.equal(E.apply(r,target,'play',[0]),false);act(r,target,'challenge');assert.equal(r.tabletop.reveal.truthful,true);assert.equal(r.tabletop.reveal.loser,target);assert.deepEqual(r.tabletop.reveal.cards,['J']);
});
test('Liar Deck fixed chamber risk persists across rounds and penalty eliminates at the saved position',()=>{
 const r=room('liar_deck',2),a=r.tabletop,id=a.actor,target=a.order[1];a.people[id].trigger=2;a.people[id].pulls=1;a.rank='A';a.people[id].hand=['K'];act(r,id,'play',[0]);act(r,target,'challenge');assert.equal(r.status,'results');assert.equal(r.result.winner,target);assert.equal(r.tabletop.people[id].pulls,2);assert.equal(r.scores[target],1);assert.equal(E.apply(r,target,'challenge'),false);assert.equal(r.scores[target],1);
});
test('Liar Dice bids escalate quantity or same quantity higher face, ones are not wild and equality punishes challenger',()=>{
 for(const truthful of [false,true]){const r=room('liar_dice',2),a=r.tabletop,id=a.actor,target=a.order[1];a.people[id].dice=[1,1,2,3,4];a.people[target].dice=[1,1,2,3,4];act(r,id,'bid',{count:truthful?2:3,face:4});const before=JSON.stringify(r);assert.equal(E.apply(r,target,'bid',{count:a.last?.count||r.tabletop.last.count,face:3}),false);assert.equal(JSON.stringify(r),before);act(r,target,'challenge');assert.equal(r.tabletop.reveal.actual,2);assert.equal(r.tabletop.reveal.loser,truthful?target:id);assert.equal(r.tabletop.people[truthful?target:id].penalties,1);const dice=structuredClone(r.tabletop.reveal.dice);for(const p of r.tabletop.order)act(r,p,'ready');assert.equal(r.tabletop.round,2);assert.equal(r.tabletop.last,null);assert.equal(Object.keys(dice).length,2);}
});
test('private views never expose opponent hands, dice, deck order or hidden chamber positions to UI or bot',()=>{
 for(const mode of Object.keys(E.GAMES)){const r=room(mode),a=r.tabletop,id=a.actor,v=E.view(r,id);assert.equal(v.deck,undefined);assert.equal(v.unused,undefined);for(const p of a.order){assert.equal(v.people[p].trigger,undefined);if(p===id)continue;assert.equal(v.people[p].hand,undefined);assert.equal(v.people[p].dice,undefined);if(mode==='coup')assert.ok(v.people[p].cards.every(c=>c.role===null));}if(mode==='liar_deck'){act(r,id,'play',[0]);const publicView=E.view(r,a.order[1]);assert.equal(publicView.last.cards,undefined);}}
});
test('every new game completes full bot matches, serializes to RTDB JSON and awards exactly once',()=>{
 for(const mode of Object.keys(E.GAMES))for(const n of [2,4])for(let seed=1;seed<=12;seed++){
  const r=room(mode,n,seed),rng=seeded(seed+500);for(let step=0;step<1400&&r.status!=='results';step++){const move=E.nextBotAction(r,rng);assert.ok(move,`${mode}/${seed}/${r.tabletop.phase}`);act(r,move.id,move.type,move.value,rng);if(step%7===0)Object.assign(r,JSON.parse(JSON.stringify(r)));}
  assert.equal(r.status,'results',mode);assert.equal(r.result.points,1);assert.equal(Object.values(r.scores).reduce((s,n)=>s+n,0),1);
 }
});
