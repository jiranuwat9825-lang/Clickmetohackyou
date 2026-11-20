'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../arcade-engine');
function room(mode='take6',count=2){
 const players=Object.fromEntries(Array.from({length:count},(_,i)=>['p'+i,{name:'Player '+i,bot:true}]));
 return {gameMode:mode,status:'lobby',hostId:'p0',arcadeCount:count,players,scores:{},gamesPlayed:0};
}
const copy=x=>JSON.parse(JSON.stringify(x));
test('6 nimmt deals unique numbered cards and hides opponents and pending picks',()=>{
 const r=room();assert.equal(E.setup(r,Object.keys(r.players),()=>.31),true);
 const a=r.arcade,all=[...a.rows.flat(),...a.order.flatMap(id=>a.people[id].hand)];
 assert.equal(all.length,24);assert.equal(new Set(all).size,24);assert.equal(a.people.p0.hand.length,10);
 const v=E.view(r,'p0');assert.deepEqual(v.people.p1.hand,undefined);
 const chosen=a.people.p0.hand[0];assert.equal(E.apply(r,'p0','pick',chosen,0),true);
 assert.equal(E.view(r,'p1').people.p0.chosen,true);
 assert.equal(JSON.stringify(E.view(r,'p1')).includes('"picks"'),false);
 assert.equal(JSON.stringify(E.view(r,'p1')).includes('"taken"'),false);
 assert.equal(E.apply(r,'p0','pick',chosen,1),false);
});
test('6 nimmt places nearest higher card, takes full rows and makes low cards choose a row',()=>{
 const r=room();E.setup(r,['p0','p1'],()=>.3);
 let a=r.arcade;
 a.rows=[[12,14,15,21,26],[37],[43],[58]];
 a.people.p0.hand=[30,70];a.people.p1.hand=[44,71];a.picks={};a.step=1;a.revision=0;
 assert.equal(E.apply(r,'p0','pick',30,0),true);
 assert.equal(E.apply(r,'p1','pick',44,1),true);
 a=r.arcade;assert.deepEqual(a.rows[0],[30]);assert.deepEqual(a.rows[2],[43,44]);
 assert.equal(a.people.p0.penalty,[12,14,15,21,26].reduce((s,n)=>s+E.bullheads(n),0));
 a.phase='choose';a.rows=[[12],[37],[43],[58]];a.people.p0.hand=[3];a.people.p1.hand=[44];a.picks={};a.revision=3;
 assert.equal(E.apply(r,'p0','pick',3,3),true);
 assert.equal(E.apply(r,'p1','pick',44,4),true);
 assert.equal(r.arcade.phase,'choose_row');assert.equal(r.arcade.waiting.id,'p0');
 assert.equal(E.apply(r,'p1','row',1,5),false);
 assert.equal(E.apply(r,'p0','row',1,5),true);assert.deepEqual(r.arcade.rows[1],[3]);assert.deepEqual(r.arcade.rows[2],[43,44]);
});
test('6 nimmt rejects stale or invalid actions atomically',()=>{
 const r=room();E.setup(r,['p0','p1']);
 const before=JSON.stringify(r);
 assert.equal(E.apply(r,'p0','pick',105,0),false);
 assert.equal(E.apply(r,'p0','row',0,0),false);
 assert.equal(E.apply(r,'p1','abort',null,0),false);
 assert.equal(E.apply(r,'p0','pick',r.arcade.people.p0.hand[0],9),false);
 assert.equal(JSON.stringify(r),before);
});
test('6 nimmt bots complete to 66 with a single award and JSON room state',()=>{
 for(const count of [2,4,8])for(let seed=1;seed<=4;seed++){
  let n=seed;const rng=()=>((n=(1664525*n+1013904223)>>>0)/4294967296);
  const r=room('take6',count);E.setup(r,Object.keys(r.players),rng);
  for(let i=0;i<2000&&r.status!=='results';i++){
   const move=E.nextBotAction(r,rng);assert.ok(move,'every bot phase must have an action');
   assert.equal(E.apply(r,move.id,move.type,move.value,r.arcade.revision,rng),true);
  }
  assert.equal(r.status,'results');assert.ok(r.result.winners.length>=1);
  for(const id of r.arcade.order)assert.equal(r.scores[id]||0,r.result.winners.includes(id)?1:0);
  assert.deepEqual(copy(r),r);
 }
});
