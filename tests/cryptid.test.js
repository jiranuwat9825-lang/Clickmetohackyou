'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../cryptid-engine');
function seeded(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
function room(n=3,seed=1){const ids=Array.from({length:n},(_,i)=>'p'+i),r={gameMode:'cryptid',cryptidCount:n,status:'lobby',hostId:'p0',gamesPlayed:0,players:Object.fromEntries(ids.map(id=>[id,{name:id}])),scores:{p0:4}};assert.equal(E.setup(r,ids,E.generate(n,seeded(seed))),true);return r;}
function act(r,id,type,value){assert.equal(E.apply(r,id,type,value,r.cryptid.revision),true,type);}
function ready(r){for(const p of r.cryptid.order)act(r,p,'ready');}
function initial(r){ready(r);while(r.cryptid.phase==='initial'){const id=E.actor(r.cryptid);act(r,id,'initial',E.legalCells(r.cryptid,id,false)[0]);}}
function validMarkers(r){for(const [cell,marks] of Object.entries(r.cryptid.markers||{})){assert.ok(Object.values(marks).filter(m=>m==='no').length<=1);for(const [p,mark] of Object.entries(marks))assert.equal(E.allows(r.cryptid,p,cell),mark==='yes');}}
test('generated boards for 3–5 players have exactly one solution, distinct nontrivial clues and valid hex coordinates',()=>{
 for(const n of [3,4,5])for(let seed=1;seed<=80;seed++){
  const p=E.generate(n,seeded(seed)),cat=E.clueCatalogue(p.board),clues=p.clues.map(c=>cat.find(x=>x.id===c.id));
  assert.equal(p.board.length,108);assert.equal(new Set(p.board.map(c=>c.id)).size,108);assert.equal(new Set(clues.map(c=>c.id)).size,n);
  assert.deepEqual(p.board.filter(c=>clues.every(clue=>clue.cells.includes(c.id))).map(c=>c.id),[p.solution]);
  clues.forEach(c=>assert.ok(c.cells.length>=6&&c.cells.length<=90));assert.equal(p.board.filter(c=>c.structure).length,6);
  assert.equal(E.distance(p.board[0],p.board[1]),1);assert.equal(E.distance(p.board[0],p.board[12]),1);
 }
});
test('initial placement is clockwise twice, validates clue, and does not allow out-of-turn moves',()=>{
 const r=room();ready(r);const a=r.cryptid,valid=E.legalCells(a,'p0',false)[0],wrong=a.solution,before=JSON.stringify(r);
 assert.equal(E.apply(r,'p1','initial',valid),false);assert.equal(E.apply(r,'p0','initial',wrong),false);assert.equal(JSON.stringify(r),before);
 for(let i=0;i<6;i++){const id=E.actor(a);assert.equal(id,'p'+i%3);act(r,id,'initial',E.legalCells(a,id,false)[0]);}
 assert.equal(a.phase,'action');assert.equal(E.actor(a),'p0');assert.equal(Object.keys(a.markers).length,6);validMarkers(r);
});
test('a negative answer requires the asker to reveal a negative cell before advancing',()=>{
 const r=room();initial(r);const a=r.cryptid,target='p1',cell=E.legalCells(a,target,false)[0];
 act(r,'p0','question',{cell,target});assert.equal(a.phase,'penalty');assert.equal(a.markers[cell][target],'no');
 const before=JSON.stringify(r);assert.equal(E.apply(r,'p0','search',a.solution),false);assert.equal(E.apply(r,'p1','penalty',cell),false);assert.equal(JSON.stringify(r),before);
 act(r,'p0','penalty',E.legalCells(a,'p0',false)[0]);assert.equal(a.phase,'action');assert.equal(E.actor(a),'p1');assert.equal(a.turn,2);
});
test('blocked cells and repeated answers are rejected without changing state',()=>{
 const r=room();initial(r);const a=r.cryptid,blocked=Object.keys(a.markers)[0],snapshot=JSON.stringify(r);
 assert.equal(E.apply(r,'p0','question',{cell:blocked,target:'p1'}),false);assert.equal(E.apply(r,'p0','search',blocked),false);assert.equal(JSON.stringify(r),snapshot);
 a.markers[a.solution]={p1:'yes'};const before=JSON.stringify(r);assert.equal(E.apply(r,'p0','question',{cell:a.solution,target:'p1'}),false);assert.equal(JSON.stringify(r),before);
});
test('questioning can use a cell excluded by the asker’s own clue',()=>{
 const r=room();initial(r);const cell=E.legalCells(r.cryptid,'p0',false)[0];act(r,'p0','question',{cell,target:'p1'});validMarkers(r);
});
test('search stops at the first no, hiding later players’ answers',()=>{
 const r=room(5,14);initial(r);const a=r.cryptid,cell=a.board.find(c=>!E.blocked(a,c.id)&&E.allows(a,'p0',c.id)&&!E.allows(a,'p1',c.id));assert.ok(cell);
 act(r,'p0','search',cell.id);assert.equal(a.phase,'search');assert.equal(E.apply(r,'p1','reveal'),false);
 act(r,'p0','reveal');assert.equal(a.phase,'penalty');assert.equal(a.markers[cell.id].p1,'no');
 for(const id of ['p2','p3','p4'])assert.equal(a.markers[cell.id][id],undefined);
 assert.equal(r.status,'cryptid_playing');assert.equal(E.apply(r,'p0','reveal'),false);validMarkers(r);
});
test('search on an existing own disc requires another disc, skips known yes and scores once',()=>{
 const r=room();initial(r);const a=r.cryptid;a.markers[a.solution]={p0:'yes',p1:'yes'};
 act(r,'p0','search',a.solution);assert.equal(a.phase,'extra');const extra=E.legalCells(a,'p0',true)[0];assert.ok(extra);
 assert.equal(E.apply(r,'p0','extra',a.solution),false);act(r,'p0','extra',extra);assert.equal(a.markers[extra].p0,'yes');
 act(r,'p0','reveal');assert.equal(r.status,'results');assert.equal(r.scores.p0,5);assert.equal(r.result.cell,a.solution);
 assert.equal(Object.values(a.history).filter(e=>e.type==='response').length,1);
 const before=JSON.stringify(r);assert.equal(E.apply(r,'p0','reveal'),false);assert.equal(JSON.stringify(r),before);
});
test('stale revisions, absent participants and invalid cells cannot mutate a game',()=>{
 const r=room();initial(r);const a=r.cryptid,before=JSON.stringify(r);
 assert.equal(E.apply(r,'p0','search',a.solution,a.revision-1),false);assert.equal(E.apply(r,'unknown','ready'),false);
 assert.equal(E.apply(r,'p0','question',{cell:'bad',target:'p1'}),false);assert.equal(E.apply(r,'p0','search','bad'),false);assert.equal(JSON.stringify(r),before);
 delete r.players.p0;assert.equal(E.apply(r,'p0','search',a.solution),false);r.players.p0={name:'reconnected'};act(r,'p0','search',a.solution);
});
test('host may abort without awarding points; other players cannot abort',()=>{
 const r=room();assert.equal(E.apply(r,'p1','abort'),false);act(r,'p0','abort');assert.equal(r.status,'results');assert.equal(r.result.aborted,true);assert.equal(r.scores.p0,4);
});
test('bot tools are host-only, lobby-only and respect the selected cap',()=>{
 const r={gameMode:'cryptid',cryptidCount:5,status:'lobby',hostId:'human',players:{human:{name:'Human'}},scores:{human:2}};
 assert.equal(E.manageBots(r,'stranger','fill'),false);assert.equal(E.manageBots(r,'human','add'),true);assert.equal(Object.keys(r.players).length,2);
 assert.equal(E.manageBots(r,'human','fill'),true);assert.equal(Object.keys(r.players).length,5);assert.equal(E.manageBots(r,'human','add'),false);
 r.status='cryptid_playing';assert.equal(E.manageBots(r,'human','remove'),false);r.status='lobby';assert.equal(E.manageBots(r,'human','remove'),true);assert.deepEqual(Object.keys(r.players),['human']);assert.equal(r.scores.human,2);
});
test('bot inference works with only the bot’s own clue and public observations',()=>{
 const r=room();initial(r);const a=r.cryptid,view={board:a.board,markers:a.markers,order:a.order,phase:'action',clues:{p0:a.clues.p0}};
 const action=E.botMove(view,'p0',seeded(41));assert.ok(action);assert.equal(action.id,'p0');assert.equal(E.apply(r,action.id,action.type,action.value),true);
});
test('90 complete simulated games preserve honest permanent markers and all reach the unique solution',()=>{
 for(const n of [3,4,5])for(let seed=1;seed<=30;seed++){
  const r=room(n,seed),rng=seeded(seed+1000);Object.values(r.players).forEach(p=>p.bot=true);
  let previous={};for(let step=0;step<1800&&r.status!=='results';step++){
   const next=E.nextBotAction(r,rng);assert.ok(next,`${n}/${seed}/${r.cryptid.phase}`);act(r,next.id,next.type,next.value);validMarkers(r);
   for(const [c,marks] of Object.entries(previous))for(const [p,m] of Object.entries(marks))assert.equal(r.cryptid.markers[c][p],m);
   previous=structuredClone(r.cryptid.markers||{});
   // Exercise the JSON serialization used for RTDB snapshots between turns.
   if(step%7===0){const snapshot=JSON.parse(JSON.stringify(r));Object.assign(r,snapshot);}
  }
  assert.equal(r.status,'results');assert.equal(r.result.cell,r.cryptid.solution);assert.equal(r.result.points,1);
 }
});

test('selected maps keep their exact layout while clues and solutions remain valid for 3–5 players',()=>{
 for(const mapId of Object.keys(E.MAPS).filter(id=>id!=='random'))for(const count of [3,4,5])for(let seed=1;seed<=15;seed++){
  const p=E.generate(count,seeded(seed),mapId);assert.equal(p.mapId,mapId);assert.deepEqual(p.board,E.mapBoard(mapId));
  const catalogue=E.clueCatalogue(p.board),selected=p.clues.map(c=>catalogue.find(x=>x.id===c.id));assert.deepEqual(p.board.filter(c=>selected.every(clue=>clue.cells.includes(c.id))).map(c=>c.id),[p.solution]);
 }
 const a=E.generate(3,seeded(1),'random'),b=E.generate(3,seeded(2),'random');assert.notDeepEqual(a.board,b.board);
});
