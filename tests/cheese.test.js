'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../cheese-engine');
function seeded(s){return ()=>{s=(Math.imul(1664525,s)+1013904223)|0;return (s>>>0)/4294967296;};}
function room(n=5,fall=false){const ids=Array.from({length:n},(_,i)=>String.fromCharCode(97+i)),players=Object.fromEntries(ids.map(id=>[id,{name:id}])),r={gameMode:'cheese',status:'lobby',hostId:'a',cheeseCount:n,cheeseFall:fall,players,scores:{a:2}};assert.ok(E.setup(r,ids,1000,seeded(n)));return r;}
function action(r,id,type,value,t=1000){assert.equal(E.apply(r,id,type,value,t,r.cheese.revision),true,`${r.cheese.phase} ${type}`);}
function prepare(r,t=1000){for(const p of r.cheese.order){action(r,p,'roll',null,t);if(r.cheese.order.length===4&&p!==r.cheese.thief)action(r,p,'wake',r.cheese.dice[p][0],t);action(r,p,'ready',null,t);}}
function toHour(r,h){while(r.cheese.hour<h)action(r,r.hostId,'tick',null,r.cheese.deadline);}
function nightDone(r){while(r.cheese.phase==='night')action(r,r.hostId,'tick',null,r.cheese.deadline);}
function fixture(n=5){const r=room(n);r.cheese.order=Object.keys(r.players);r.cheese.thief='a';r.roles=Object.fromEntries(r.cheese.order.map(id=>[id,id==='a'?'thief':'sleepy']));r.cheese.fall=null;for(const [i,id] of r.cheese.order.entries())r.cheese.dice[id]=[i===0?2:i===1?2:Math.min(6,i+2)];return r;}
function prune(v){if(v==null)return undefined;if(Array.isArray(v)){if(!v.length)return undefined;return v.map(prune);}if(typeof v==='object'){const out={};for(const [k,value] of Object.entries(v)){const clean=prune(value);if(clean!==undefined)out[k]=clean;}return Object.keys(out).length?out:undefined;}return v;}
test('4-player preparation gives two dice, requires a sleepyhead wake choice and lets the thief wake twice',()=>{const r=room(4),a=r.cheese,p=a.order.find(id=>id!==a.thief);a.dice[a.thief]=[2,5];action(r,p,'roll');assert.equal(E.apply(r,p,'ready',null,1000),false);assert.equal(E.apply(r,p,'wake',9,1000),false);action(r,p,'wake',a.dice[p][0]);action(r,p,'ready');assert.deepEqual(E.wakeHours(a,a.thief),[2,5]);assert.deepEqual(E.wakeHours(a,p),[a.dice[p][0]]);});
test('a lone sleepyhead may peek at exactly one die, while witnesses and four-player mice may not peek',()=>{
 const r=fixture(5);prepare(r);toHour(r,4);const lone=E.awakeIds(r.cheese);assert.equal(lone.length,1);action(r,lone[0],'peek','a',r.cheese.deadline-1);assert.equal(r.cheese.peeks[lone[0]].value,2);assert.equal(E.apply(r,lone[0],'peek','b',r.cheese.deadline-1),false);
 const four=room(4);prepare(four);assert.equal(E.apply(four,four.cheese.order[0],'peek',four.cheese.order[1],1001),false);
});
test('cheese is stolen at the thief’s first wake hour and only awake witnesses learn who took it',()=>{
 const r=fixture(5);prepare(r);toHour(r,2);assert.equal(r.cheese.stolenHour,2);assert.equal(E.intel(r,'b').sightings.h2.witness,'a');assert.equal(E.intel(r,'c').sightings.h2,undefined);assert.deepEqual(r.cheese.followers,['b']);
});
test('5 players: choose one visible witness as follower, never all witnesses or a sleeping mouse',()=>{
 const r=fixture(5);r.cheese.dice.c=[2];prepare(r);toHour(r,2);assert.equal(r.cheese.recruitCount,1);assert.equal(E.apply(r,'a','followers',['d'],r.cheese.deadline-1),false);assert.equal(E.apply(r,'a','followers',['b','c'],r.cheese.deadline-1),false);action(r,'a','followers',['c'],r.cheese.deadline-1);assert.deepEqual(r.cheese.followers,['c']);
});
test('6/7/8-player follower counts and private team visibility match the rulebook',()=>{
 for(const n of [6,7,8]){const r=fixture(n);prepare(r);nightDone(r);assert.equal(r.cheese.phase,'recruit');const selected=r.cheese.recruitEligible.slice(0,n===6?1:2);action(r,'a','followers',selected,r.cheese.deadline-1);assert.equal(r.cheese.phase,'intel');assert.deepEqual(r.cheese.followers,selected);const info=E.intel(r,selected[0]);assert.equal(info.knownThief,n===7?null:'a');assert.deepEqual(info.knownFollowers,selected);assert.equal(E.intel(r,'a').knownFollowers.length,n===6?1:2);}
});
test('a tie that includes the thief catches them; the Fall Mouse overrides a tied thief win',()=>{
 for(const fall of [false,true]){const r=fixture(6);r.cheese.phase='vote';r.cheese.deadline=10000;r.cheese.followers=['f'];r.cheese.fall=fall?'b':null;r.roles.b=fall?'fall':'sleepy';for(const [id,target] of Object.entries({a:'b',b:'a',c:'a',d:'b',e:'a',f:'b'}))action(r,id,'vote',target,1001);assert.equal(r.status,'results');assert.equal(r.result.caught,true);assert.deepEqual(r.result.winners,fall?['b']:['a','b','c','d','e','f'].filter(p=>p!=='a'&&p!=='f'));assert.equal(r.result.winner,fall?'fall':'sleepy');const before=JSON.stringify(r);assert.equal(E.apply(r,'a','vote','b',1002),false);assert.equal(JSON.stringify(r),before);}
});
test('invalid actors, self votes, stale revisions and early ticks do not mutate a game',()=>{
 const r=fixture();prepare(r);const before=JSON.stringify(r);assert.equal(E.apply(r,'intruder','tick',null,99999),false);assert.equal(E.apply(r,'b','tick',null,99999),false);assert.equal(E.apply(r,'a','tick',null,1001),false);assert.equal(E.apply(r,'a','tick',null,99999,r.cheese.revision-1),false);assert.equal(JSON.stringify(r),before);
 r.cheese.phase='vote';r.cheese.deadline=99999;assert.equal(E.apply(r,'a','vote','a',1001),false);
});
test('4–8 players and optional Fall Mouse complete 80 bot simulations, including RTDB empty-object pruning',()=>{
 for(const n of [4,5,6,7,8])for(const fall of [false,true])for(let seed=1;seed<=8;seed++){
  let r=room(n,fall&&n>=6),time=1000,rng=seeded(seed);Object.values(r.players).forEach(p=>p.bot=true);
  for(let step=0;step<400&&r.status!=='results';step++){
   const next=E.nextBot(r,time,rng);if(next)action(r,next.id,next.type,next.value,time);else if(r.cheese.deadline)time=r.cheese.deadline;else assert.fail('no progress '+r.cheese.phase);
   r=prune(r);
  }
  assert.equal(r.status,'results');assert.ok(r.result.winners.length);assert.equal((r.cheese.followers||[]).length,n===4?0:n===5?(r.cheese.recruitCount||0):n===6?1:2);
 }
});
