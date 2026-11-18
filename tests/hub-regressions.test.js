'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const loadHub=require('./hub-harness');
const plain=v=>JSON.parse(JSON.stringify(v));
function base(mode='whoami_time'){
 const players={a:{name:'A'},b:{name:'B'},c:{name:'C'}};
 return {gameMode:mode,status:'playing',hostId:'a',players,gamePlayers:structuredClone(players),playerProfiles:structuredClone(players),roles:{a:'แมว',b:'สุนัข',c:'ช้าง'},scores:{a:0,b:0,c:0},gamesPlayed:1,turnOrder:['a','b','c'],currentTurnIndex:0,currentRound:1,totalRounds:2,settingValue:1,attempts:{a:1,b:1,c:1},whoTimeRemaining:{a:60000,b:60000,c:60000},turnStartedAt:990000,lastActivityAt:1_000_000};
}
test('all game scripts initialize without a splash screen or missing element errors',()=>{const h=loadHub();assert.equal(h.run('typeof renderCryptid'), 'function');assert.deepEqual(h.errors,[]);});
test('connected rooms keep alive while players talk without pointer or keyboard input',async()=>{
 const h=loadHub(),r=base('spyfall');h.setRoom(r);h.now(1_050_000);
 for(const tick of h.intervals)await tick();
 assert.equal(h.getRoom().lastActivityAt,1_050_000,'heartbeat must update the active room');
});
test('timed Who Am I pauses the remaining offline player instead of finishing the game',async()=>{
 const h=loadHub(),r=base();r.players={b:r.players.b,c:r.players.c};r.attempts={a:1,b:0,c:0};r.turnOrder=['a'];h.setRoom(r,'b');
 await h.run('runAutomatic()');const saved=h.getRoom();assert.equal(saved.status,'playing');assert.equal(saved.whoTimeRemaining.a,50000);assert.equal(saved.turnStartedAt,null);
 const rev=JSON.stringify(saved);h.sync();h.now(1_100_000);await h.run('runAutomatic()');assert.equal(JSON.stringify(h.getRoom()),rev,'a paused room must not keep writing each second');
 saved.players.a={name:'A returned'};h.setRoom(saved,'a');await h.run('runAutomatic()');assert.equal(h.getRoom().turnStartedAt,1_100_000);assert.equal(h.getRoom().status,'playing');
});
test('answering while others are offline leaves their time and attempts available for reconnect',()=>{
 const h=loadHub(),r=base();r.players={a:r.players.a};r.turnOrder=['a','b'];r.attempts={a:1,b:1,c:0};h.setRoom(r);
 h.run('testRoom.attempts.a=0;removeWhoAnsweredPlayer(testRoom,"a");');const saved=h.run('testRoom');assert.equal(saved.status,'playing');assert.equal(saved.attempts.b,1);assert.equal(saved.whoTimeRemaining.b,60000);
});
test('a timeout marks the active player once and preserves the next player’s full time',()=>{
 const h=loadHub(),r=base();r.whoTimeRemaining.a=5000;h.setRoom(r);assert.equal(h.run('settleTimedSpeaker(testRoom)'),true);
 const saved=h.run('testRoom');assert.equal(saved.attempts.a,0);assert.equal(saved.guessDetails.a.timedOut,true);assert.equal(saved.turnOrder[0],'b');assert.equal(saved.currentTurnIndex,0);assert.equal(saved.whoTimeRemaining.b,60000);assert.equal(saved.turnStartedAt,1_000_000);
});
test('out-of-turn answers do not skip the current speaker or reset their running clock',()=>{
 const h=loadHub(),r=base();r.currentTurnIndex=1;h.setRoom(r);h.run('testRoom.attempts.a=0;removeWhoAnsweredPlayer(testRoom,"a");');
 const saved=h.run('testRoom');assert.equal(saved.turnOrder[saved.currentTurnIndex],'b');assert.equal(saved.turnStartedAt,990000);assert.equal(saved.currentRound,1);
});
test('round-based Who Am I reaches the final response window after exactly the configured rounds',()=>{
 const h=loadHub(),r=base('whoami_rounds');r.totalRounds=1;h.setRoom(r);
 h.run('advanceRound(testRoom);advanceRound(testRoom);advanceRound(testRoom);');assert.equal(h.run('testRoom.status'),'final_guess');assert.equal(h.run('testRoom.finalDeadline'),1_120_000);
});
test('custom answers reach their creator, can be reviewed once and keep the assigned score',async()=>{
 const h=loadHub(),r=base('whoami_custom');r.whoCustomAssignments={a:'b',b:'c',c:'a'};r.whoCustomPending={};r.whoCustomGuesses={};r.whoCustomReviews={};h.setRoom(r,'b');
 h.element('guessInput').value='สุนัข';h.run('confirmBox=async()=>true');await h.run('whoCustomGuess()');
 const saved=h.getRoom();assert.equal(saved.whoCustomPending.b.writerId,'a');assert.equal(saved.attempts.b,0);assert.equal(saved.whoCustomGuesses.b.length,1);
 h.setRoom(saved,'a');await h.run('whoCustomJudge(true)');const result=h.getRoom();assert.equal(result.scores.b,2);assert.equal(result.whoCustomPending.b,undefined);assert.equal(result.guessDetails.b.correct,true);
 h.setRoom(result,'a');await h.run('whoCustomJudge(true)');assert.equal(h.getRoom().scores.b,2);
});
test('custom preparation supplies missing words and each writer is assigned another player',()=>{
 const h=loadHub(),r=base('whoami_custom');r.status='lobby';h.setRoom(r);assert.equal(h.run('whoCustomSetup(testRoom,["a","b","c"])'),true);
 h.run('whoCustomBegin(testRoom)');const saved=h.run('testRoom');assert.equal(saved.status,'playing');assert.equal(new Set(Object.values(saved.roles)).size,3);for(const [writer,target] of Object.entries(saved.whoCustomAssignments))assert.notEqual(writer,target);
});
test('Spyfall rejects self and outsider ballots and awards caught-spy scores only once',()=>{
 const h=loadHub(),r=base('spyfall');r.status='voting';r.spyId='a';r.voteRound=1;r.spyVariant='secret';r.votes={a:{targetId:'b',round:1},b:{targetId:'a',round:1},c:{targetId:'a',round:1},outsider:{targetId:'b',round:1}};h.setRoom(r);
 h.run('resolveVotes(testRoom)');const saved=h.run('testRoom');assert.equal(saved.result.caught,true);assert.equal(saved.scores.b,1);assert.equal(saved.scores.c,1);assert.equal(saved.scores.a,0);
 h.run('resolveVotes(testRoom)');assert.equal(h.run('testRoom.scores.b'),1);
 r.votes.a={targetId:'a'};h.setRoom(r);assert.equal(h.run('Object.hasOwn(spyValidBallots(testRoom),"a")'),false);
});
test('aware Spyfall preserves the spy word guess across a tie-break vote',()=>{
 const h=loadHub(),r=base('spyfall');r.status='voting';r.spyVariant='aware';r.spyId='a';r.spyCommonWord='แมว';r.spyGuess={submitted:true,word:'แมว'};r.voteRound=1;r.votes={b:{targetId:'a',round:1},c:{targetId:'b',round:1}};h.setRoom(r);
 h.run('resolveVotes(testRoom)');assert.equal(h.run('testRoom.voteRound'),2);assert.equal(h.run('testRoom.spyGuess.word'),'แมว');h.run('testRoom.votes={b:{targetId:"a",round:2},c:{targetId:"a",round:2}};resolveVotes(testRoom)');assert.equal(h.run('testRoom.scores.a'),1);assert.equal(h.run('testRoom.scores.b'),1);
});
test('Insider ties award only the Insider, while a correct vote awards the other players once',()=>{
 for(const caught of [true,false]){const h=loadHub(),r=base('insider');r.status='insider_voting';r.insiderId='a';r.insiderMasterId='b';r.insiderAnswer='แมว';r.insiderVotes=caught?{a:'b',b:'a',c:'a'}:{a:'b',b:'c',c:'a'};h.setRoom(r);h.run('insiderResolveVotes(testRoom);insiderResolveVotes(testRoom)');assert.equal(h.run('testRoom.scores.a'),caught?0:2);assert.equal(h.run('testRoom.scores.b'),caught?1:0);}
});
test('Avalon 9/10 player games with and without Angel run through all phases to a valid result',()=>{
 for(const count of [9,10])for(const angel of [false,true])for(let attempt=0;attempt<5;attempt++){
  const h=loadHub();h.run(`testRoom={gameMode:'avalon',status:'lobby',hostId:'p0',avalonCount:${count},avalonAngel:${angel},players:Object.fromEntries(Array.from({length:${count}},(_,i)=>['p'+i,{name:'Bot '+i,bot:true}]))};avalonSetup(testRoom,Object.keys(testRoom.players));`);
  for(let i=0;i<500&&h.run('testRoom.status')!=='results';i++)assert.equal(h.run('(()=>{const next=avalonNextBotAction(testRoom);return !!next&&avalonApply(testRoom,next.id,next.type,next.value);})()'),true);
  assert.equal(h.run('testRoom.status'),'results');assert.ok(['red','blue'].includes(h.run('testRoom.result.winner')));
 }
});
test('Avalon never allows a blue player to fail a mission and handles the fourth-mission threshold',()=>{
 const h=loadHub();h.run(`testRoom={gameMode:'avalon',status:'avalon_quest',hostId:'a',players:{a:{},b:{}},roles:{a:'Merlin',b:'Assassin'},avalon:{order:['a','b'],mission:4,team:['a','b'],questVotes:{},history:{},proposals:{}}}`);
 assert.equal(h.run('avalonApply(testRoom,"a","quest",false)'),false);assert.equal(h.run('avalonApply(testRoom,"a","quest",true)'),true);assert.equal(h.run('avalonApply(testRoom,"b","quest",false)'),true);assert.equal(h.run('testRoom.avalon.history.m4.passed'),true);
});
test('lobby caps, kick/rejoin and final-score ties preserve earned points',()=>{
 const h=loadHub(),r=base('cryptid');r.status='lobby';r.cryptidCount=3;r.scores={a:2,b:2,c:0};h.setRoom(r);
 assert.equal(h.run('canRejoinRoom(testRoom,"new",true)'),false);assert.equal(h.run('applyLobbyKick(testRoom,"b","c")'),false);assert.equal(h.run('applyLobbyKick(testRoom,"a","b")'),true);assert.equal(h.run('testRoom.scores.b'),2);assert.equal(h.run('applyManualRoomJoin(testRoom,"b","B","fox")'),true);assert.equal(h.run('testRoom.scores.b'),2);
 const standings=plain(h.run('finalStandingsForRoom(testRoom)'));assert.deepEqual(standings.standings.map(p=>p.rank),[1,1,3]);
});


test('the main lobby can render before optional mode scripts finish loading',async()=>{
 const h=loadHub({addons:false}),r=base('spyfall');r.status='lobby';h.setRoom(r);h.run('renderRoom(roomState)');assert.deepEqual(h.errors,[]);
 h.setRoom(base('insider'));await h.run('runAutomatic()');assert.deepEqual(h.errors,[]);
});
test('confirming a stale leave or next-game dialog cannot affect a different room',async()=>{
 for(const control of ['leaveBtn','nextGameBtn','skipSpyBtn','finishMatchBtn']){
  const h=loadHub(),r=base('spyfall');r.status=control==='nextGameBtn'?'results':control==='finishMatchBtn'?'lobby':'playing';h.setRoom(r);
  h.run('confirmBox=async()=>{roomId="other";return true}');
  await h.element(control).onclick();assert.equal(h.run('roomId'),'other',control+' must leave the current room untouched');
 }
});
test('creating a room snapshots the chosen mode across asynchronous room-code lookup',async()=>{
 const h=loadHub(),r=base('cryptid');r.status='lobby';h.setRoom(r);h.element('durationInput').value='2';h.element('cryptidCreateCount').value='3';h.element('cryptidCreateMap').value='random';
 h.run('selectedMode="cryptid";selectedCategory="";generateRoomCode=async()=>{selectedMode="insider";return "123456"}');
 await h.element('createConfirmBtn').onclick();assert.equal(h.getRoom().gameMode,'cryptid');
});

test('Insider custom settings control all deadlines and are frozen for an active round',()=>{
 const h=loadHub(),r=base('insider');r.status='lobby';r.players.d={name:'D'};r.insiderSettings={prepSeconds:90,guessSeconds:420,voteSeconds:45,maxGuesses:2};h.setRoom(r);
 assert.equal(h.run('insiderSetup(testRoom,Object.keys(testRoom.players))'),true);assert.equal(h.run('testRoom.insiderDeadline'),1_090_000);
 h.run('testRoom.insiderSettings.guessSeconds=60;testRoom.insiderAnswer="แมว";insiderStartGuessing(testRoom)');assert.equal(h.run('testRoom.insiderGuessDeadline'),1_420_000);
 h.run('insiderStartVoting(testRoom,"a")');assert.equal(h.run('testRoom.insiderDeadline'),1_045_000);assert.equal(h.run('insiderConfig(testRoom).maxGuesses'),2);
});
test('Insider validates settings and rejects guesses beyond the configured limit',async()=>{
 const h=loadHub(),r=base('insider');r.players.d={name:'D'};r.roles={a:'common',b:'master',c:'insider',d:'common'};r.insiderSettings={prepSeconds:60,guessSeconds:300,voteSeconds:120,maxGuesses:2};r.insiderAnswer='แมว';r.insiderGuessDeadline=1_300_000;h.setRoom(r);
 for(let i=0;i<3;i++){h.element('insiderGuessInput').value='ไม่ใช่';await h.element('insiderGuessSubmit').onclick();h.sync();}
 assert.equal(h.getRoom().insiderAttempts.a,2);assert.equal(h.getRoom().insiderGuessFeed.length,2);
 assert.equal(h.run('insiderSettingsValid({prepSeconds:0,guessSeconds:30,voteSeconds:0,maxGuesses:0})'),false);
});
test('Cryptid wheel zoom stays anchored at the cursor, clamps scale and left drag does not select a cell',()=>{
 const h=loadHub(),viewport=h.element('cryptidMapViewport'),svg=h.element('cryptidMap');
 viewport.clientWidth=400;viewport.clientHeight=300;viewport.scrollLeft=100;viewport.scrollTop=60;viewport.getBoundingClientRect=()=>({left:50,top:30,width:400,height:300});
 svg.style.width='800px';svg.getBoundingClientRect=()=>({left:50-viewport.scrollLeft,top:30-viewport.scrollTop,width:parseFloat(svg.style.width),height:parseFloat(svg.style.width)*430/660});
 viewport.setPointerCapture=()=>{};viewport.hasPointerCapture=()=>false;h.run('cryptidUI.zoom=1;cryptidUI.baseWidth=800;cryptidSetupMapNavigation($("cryptidMapViewport"));');
 const x=250,y=180,oldRx=(viewport.scrollLeft+x-50)/800;let prevented=false;
 viewport.events.wheel({deltaY:-100,deltaMode:0,clientX:x,clientY:y,preventDefault(){prevented=true;}});
 const width=parseFloat(svg.style.width);assert.ok(width>800);assert.ok(prevented);assert.ok(Math.abs((viewport.scrollLeft+x-50)/width-oldRx)<.000001);
 const before=viewport.scrollLeft;viewport.events.pointerdown({button:0,pointerType:'mouse',pointerId:1,clientX:200,clientY:150});viewport.events.pointermove({pointerId:1,clientX:150,clientY:130,preventDefault(){}});viewport.events.pointerup({pointerId:1});assert.equal(viewport.scrollLeft,before+50);
 let suppressed=false;viewport.events.click({preventDefault(){},stopImmediatePropagation(){suppressed=true;}});assert.ok(suppressed);
 viewport.events.wheel({deltaY:-100000,deltaMode:0,clientX:x,clientY:y,preventDefault(){}});assert.equal(h.run('cryptidUI.zoom'),3);
});

test('Steal Cheese renders every phase and results from RTDB-shaped snapshots',()=>{
 const h=loadHub();h.run(`testRoom={gameMode:'cheese',status:'lobby',hostId:'a',cheeseCount:8,cheeseFall:true,players:Object.fromEntries(['a','b','c','d','e','f','g','h'].map(p=>[p,{name:p,bot:true}]))};CheeseEngine.setup(testRoom,Object.keys(testRoom.players),1000);`);
 let r=plain(h.run('testRoom')),now=1000;const phases=new Set();
 for(let step=0;step<300;step++){
  h.setRoom(r);h.now(now);h.run('renderRoom(roomState)');assert.deepEqual(h.errors,[]);phases.add(r.cheese.phase);if(r.status==='results')break;
  const engine=require('../cheese-engine'),next=engine.nextBot(r,now,()=>.25);if(next)assert.ok(engine.apply(r,next.id,next.type,next.value,now,r.cheese.revision));else now=r.cheese.deadline;
 }
 for(const phase of ['prepare','night','recruit','intel','discuss','vote','finished'])assert.ok(phases.has(phase),phase);
});

test('Steal Cheese rolls once, keeps the animation across snapshots and reveals the saved dice afterwards',async()=>{
 const h=loadHub(),engine=require('../cheese-engine'),r={gameMode:'cheese',status:'lobby',hostId:'a',cheeseCount:4,players:Object.fromEntries(['a','b','c','d'].map(p=>[p,{name:p}]))};
 engine.setup(r,Object.keys(r.players),1000,()=>.25);r.cheese.dice.a=[2,6];h.setRoom(r);h.run('testTimeouts=[];setTimeout=(fn,ms)=>testTimeouts.push({fn,ms})');
 await h.run('cheeseRoll()');assert.equal(h.getRoom().cheese.rolled.a,true);assert.equal(h.getRoom().cheese.revision,1);
 h.sync();h.element('cheeseBody').children=[];h.run('renderCheese(roomState)');let html=h.element('cheeseBody').children.map(e=>e.innerHTML).join('');
 assert.match(html,/is-rolling/);assert.doesNotMatch(html,/ได้แต้ม 2 และ 6/);
 await h.run('cheeseRoll()');assert.equal(h.getRoom().cheese.revision,1,'double click must not roll twice');
 h.element('cheeseBody').children=[];h.run('testTimeouts[0].fn()');html=h.element('cheeseBody').children.map(e=>e.innerHTML).join('');
 assert.doesNotMatch(html,/is-rolling/);assert.match(html,/ได้แต้ม 2 และ 6/);assert.match(html,/data-value="6"/);
});
test('Steal Cheese sleeping view shows only personal waking hours and hides current witnesses and cheese',()=>{
 const h=loadHub(),engine=require('../cheese-engine'),r={gameMode:'cheese',status:'lobby',hostId:'a',cheeseCount:5,players:Object.fromEntries(['a','b','c','d','e'].map(p=>[p,{name:'NAME_'+p}]))};
 engine.setup(r,Object.keys(r.players),1000,()=>.25);const a=r.cheese;a.thief='a';r.roles.a='thief';r.roles.b='sleepy';a.dice={a:[2],b:[4],c:[2],d:[5],e:[6]};a.rolled=Object.fromEntries(a.order.map(p=>[p,true]));a.wake={b:4,c:2,d:5,e:6};a.phase='night';a.hour=2;a.deadline=11000;a.stolenHour=2;a.sightings={a:{h2:{hour:2,peers:['c'],cheeseBefore:true,cheeseAfter:false}},c:{h2:{hour:2,peers:['a'],cheeseBefore:true,cheeseAfter:false,witness:'a'}}};
 h.setRoom(r,'b');h.run('renderCheese(roomState)');let html=h.element('cheeseBody').children.map(e=>e.innerHTML).join('');
 assert.match(html,/คุณกำลังหลับ/);assert.match(html,/คุณจะตื่นตอนตี 4/);assert.doesNotMatch(html,/NAME_a|NAME_c|สถานะชีส|คุณเห็น/);
 h.setRoom(r,'c');h.element('cheeseBody').children=[];h.run('renderCheese(roomState)');html=h.element('cheeseBody').children.map(e=>e.innerHTML).join('');
 assert.match(html,/คุณตื่นแล้ว · ตี 2/);assert.match(html,/NAME_a/);assert.match(html,/หยิบชีส/);
});
