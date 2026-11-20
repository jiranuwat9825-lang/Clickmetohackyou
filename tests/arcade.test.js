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
test('Just One protects the word, removes duplicate clues and allows one answer',()=>{
 const r=room('just_one',3);assert.equal(E.setup(r,Object.keys(r.players),()=>.53),true);
 const guesser=r.arcade.order[0],helpers=r.arcade.order.slice(1),answer=r.arcade.cards[0][0];
 assert.equal(E.apply(r,guesser,'choose_word',0,0),true);
 assert.equal(E.view(r,guesser).word,undefined);assert.equal(E.view(r,helpers[0]).word,answer);
 assert.equal(E.apply(r,helpers[0],'clue',['ฟ้า','สี'],1),true);
 assert.equal(E.view(r,guesser).clues.length,0);
 assert.equal(E.apply(r,helpers[1],'clue',['ฟ้า','ธรรมชาติ'],2),true);
 assert.equal(r.arcade.phase,'review');
 assert.equal(E.apply(r,guesser,'show',null,3),false);
 const reviewer=helpers[0];assert.equal(E.apply(r,reviewer,'show',null,3),true);
 assert.deepEqual(E.view(r,guesser).clues.filter(c=>!c.removed).map(c=>c.word),['สี','ธรรมชาติ']);
 assert.equal(E.apply(r,guesser,'answer',answer,4),true);
 assert.equal(r.arcade.won,1);assert.equal(r.arcade.cardIndex,1);assert.equal(E.apply(r,guesser,'answer',answer,5),false);
});
test('Just One wrong guesses discard two cards, and thirteen cards finish once',()=>{
 const r=room('just_one',5);E.setup(r,Object.keys(r.players),()=>.27);
 let turns=0;
 while(r.status!=='results'&&turns++<15){
  const a=r.arcade,guesser=a.order[a.turn%a.order.length],helpers=a.order.filter(p=>p!==guesser),answer=a.cards[a.cardIndex][0];
  assert.equal(E.apply(r,guesser,'choose_word',0,a.revision),true);
  for(const id of helpers)assert.equal(E.apply(r,id,'clue',['ใบ้'+id],r.arcade.revision),true);
  assert.equal(E.apply(r,helpers[0],'show',null,r.arcade.revision),true);
  assert.equal(E.apply(r,guesser,'answer',turns===1?'ผิด':answer,r.arcade.revision),true);
 }
 assert.equal(r.status,'results');assert.equal(r.arcade.won,11);assert.equal(r.arcade.discarded,2);
 assert.equal(r.result.winners.length,5);assert.equal(Object.values(r.scores).reduce((s,n)=>s+n,0),5);
});
test('Wavelength keeps target private, lets teammates set dial and reveals once',()=>{
 const r=room('wavelength',4);E.setup(r,Object.keys(r.players),()=>.4);
 const a=r.arcade,psychic=a.order[0],setter=a.order[1],other=a.order[2],target=a.targets[0];
 assert.equal(E.view(r,other).target,undefined);assert.equal(E.view(r,psychic).target,target);
 assert.equal(E.apply(r,other,'clue','คำ',0),false);
 assert.equal(E.apply(r,psychic,'clue','สวนสาธารณะ',0),true);
 assert.equal(E.apply(r,psychic,'dial',target,1),false);
 assert.equal(E.apply(r,other,'dial',target,1),true);
 assert.equal(E.apply(r,other,'reveal',null,2),false);
 assert.equal(E.apply(r,setter,'reveal',null,2),true);
 assert.equal(E.view(r,other).target,target);assert.equal(r.arcade.total,4);
 assert.equal(E.apply(r,setter,'reveal',null,3),false);
 assert.equal(E.apply(r,setter,'next',null,3),true);assert.equal(r.arcade.round,2);
});
test('Wavelength eight rounds produce a single shared award',()=>{
 const r=room('wavelength',2);E.setup(r,Object.keys(r.players),()=>.2);
 for(let n=1;n<=8;n++){
  const a=r.arcade,psychic=a.order[(n-1)%2],setter=a.order[n%2];
  assert.equal(E.apply(r,psychic,'clue','คำใบ้',a.revision),true);
  assert.equal(E.apply(r,setter,'dial',a.targets[n-1],r.arcade.revision),true);
  assert.equal(E.apply(r,setter,'reveal',null,r.arcade.revision),true);
  assert.equal(E.apply(r,setter,'next',null,r.arcade.revision),true);
 }
 assert.equal(r.status,'results');assert.equal(r.arcade.total,32);assert.deepEqual(r.result.winners,r.arcade.order);
 assert.equal(r.scores.p0,1);assert.equal(r.scores.p1,1);
});
test('Codenames has a balanced secret board and restricts who may clue and guess',()=>{
 const r=room('codenames',4);E.setup(r,Object.keys(r.players),()=>.37);
 const a=r.arcade,master=a.spymasters.red,guesser=a.teams.red.find(id=>id!==master),blue=a.teams.blue.find(id=>id!==a.spymasters.blue);
 assert.equal(a.words.length,25);assert.equal(new Set(a.words).size,25);
 assert.deepEqual(Object.values(a.keys).reduce((o,k)=>(o[k]=(o[k]||0)+1,o),{}),{red:9,blue:8,neutral:7,assassin:1});
 assert.equal(E.view(r,master).cells.every(x=>x.key),true);assert.equal(E.view(r,guesser).cells.every(x=>!x.key),true);
 assert.equal(E.apply(r,blue,'code_clue',{word:'สัตว์',number:2},0),false);
 assert.equal(E.apply(r,master,'code_clue',{word:a.words[0],number:2},0),false);
 assert.equal(E.apply(r,master,'code_clue',{word:'สัตว์',number:2},0),true);
 assert.equal(E.apply(r,master,'code_guess',0,1),false);
 const own=a.keys.findIndex(k=>k==='red');assert.equal(E.apply(r,guesser,'code_guess',own,1),true);
 assert.equal(E.view(r,blue).cells[own].key,'red');
 assert.equal(E.apply(r,guesser,'code_guess',own,2),false);
 assert.equal(E.apply(r,guesser,'end_turn',null,2),true);assert.equal(r.arcade.turn,'blue');
});
test('Codenames assassin ends immediately and awards only the opposing team',()=>{
 const r=room('codenames',6);E.setup(r,Object.keys(r.players),()=>.17);
 const a=r.arcade,master=a.spymasters.red,guesser=a.teams.red.find(id=>id!==master),assassin=a.keys.indexOf('assassin');
 assert.equal(E.apply(r,master,'code_clue',{word:'รหัส',number:1},0),true);
 assert.equal(E.apply(r,guesser,'code_guess',assassin,1),true);
 assert.equal(r.status,'results');assert.deepEqual(r.result.winners,a.teams.blue);
 for(const id of a.order)assert.equal(r.scores[id]||0,a.teams.blue.includes(id)?1:0);
 assert.equal(E.apply(r,guesser,'code_guess',0,2),false);
});
