'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const loadHub=require('./hub-harness');
const plain=v=>JSON.parse(JSON.stringify(v));
function databaseShape(value){
 if(value==null)return undefined;
 if(Array.isArray(value)){const list=value.map(databaseShape);return list.length?list:undefined;}
 if(typeof value==='object'){
  const entries=Object.entries(value).map(([k,v])=>[k,databaseShape(v)]).filter(([,v])=>v!==undefined);
  return entries.length?Object.fromEntries(entries):undefined;
 }
 return value;
}
function base(mode='whoami_time'){
 const players={a:{name:'A'},b:{name:'B'},c:{name:'C'}};
 return {gameMode:mode,status:'playing',hostId:'a',players,gamePlayers:structuredClone(players),playerProfiles:structuredClone(players),roles:{a:'แมว',b:'สุนัข',c:'ช้าง'},scores:{a:0,b:0,c:0},gamesPlayed:1,turnOrder:['a','b','c'],currentTurnIndex:0,currentRound:1,totalRounds:2,settingValue:1,attempts:{a:1,b:1,c:1},whoTimeRemaining:{a:60000,b:60000,c:60000},turnStartedAt:990000,lastActivityAt:1_000_000};
}
test('all game scripts initialize without a splash screen or missing element errors',()=>{const h=loadHub();assert.equal(h.run('typeof renderCryptid'), 'function');assert.deepEqual(h.errors,[]);});
test('confirming a name leaves a remembered room until the player joins it manually',async()=>{
 const h=loadHub({addons:false,session:{pg_room_v6:'test',pg_tab_id:'a'}});
 assert.equal(h.run('roomId'),'');
 assert.equal(h.run("sessionStorage.getItem('pg_room_v6')"),null);
 assert.equal(h.element('homeView').hidden,false);
 h.element('nameInput').value='A';h.element('confirmNameBtn').events.click();
 assert.equal(h.run('nameConfirmed'),true);
 assert.equal(h.run('roomId'),'');
 assert.equal(h.element('roomView').hidden,true);
 const room=base('spyfall');room.status='lobby';h.setRoom(room);
 h.run("roomId='';roomState=null;renderRoomList({test:testRoom})");
 const join=h.element('roomList').children[0].children[1];
 assert.equal(join.textContent,'เข้าร่วม');
 await join.onclick();
 assert.equal(h.run('roomId'),'test');
 assert.equal(h.element('roomView').hidden,false);
 assert.equal(h.run("sessionStorage.getItem('pg_room_v6')"),'test');
});
test('theme switch follows the active theme and keeps the saved preference',()=>{
 const h=loadHub({addons:false}),switcher=h.element('themeToggle');
 assert.equal(switcher['aria-checked'],'false');
 switcher.events.click();
 assert.equal(switcher['aria-checked'],'true');
 assert.equal(h.run('document.documentElement.dataset.theme'),'dark');
 assert.equal(h.run("localStorage.getItem('party_game_theme_v1')"),'dark');
 switcher.events.click();
 assert.equal(switcher['aria-checked'],'false');
 assert.equal(h.run('document.documentElement.dataset.theme'),'light');
});
test('Admin avatar requires a PIN, alone reveals category management and expires after one hour',async()=>{
 const h=loadHub({addons:false}),dialog=h.element('adminAvatarDialog');
 dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.events.close?.();};
 assert.equal(h.element('openManagerBtn').hidden,true);
 const admin=h.element('avatarPicker').children.find(button=>button.dataset.avatar==='admin');
 assert.ok(admin);admin.onclick();assert.equal(dialog.open,true);
 h.element('adminAvatarPin').value='0000';h.element('adminAvatarForm').onsubmit({preventDefault(){}});
 assert.equal(h.run('myAvatar'),'fox');assert.equal(h.element('openManagerBtn').hidden,true);
 h.element('adminAvatarPin').value='1011';h.element('adminAvatarForm').onsubmit({preventDefault(){}});
 assert.equal(h.run('myAvatar'),'admin');assert.equal(h.element('openManagerBtn').hidden,false);
 h.element('openManagerBtn').onclick();assert.equal(h.element('managerView').hidden,false);
 h.now(4_600_001);for(const tick of h.intervals)await tick();
 assert.equal(h.run('myAvatar'),'fox');assert.equal(h.element('openManagerBtn').hidden,true);assert.equal(h.element('managerView').hidden,true);
 h.run("openManager('homeView')");assert.equal(h.element('managerView').hidden,true);
 await assert.rejects(h.run("mutateSharedCategory('x',null)"),/Admin/);
});
test('all five arcade screens render after Firebase drops empty children',()=>{
 for(const [mode,count] of [['take6',4],['just_one',3],['wavelength',2],['codenames',4],['fake_artist',4]]){
  const h=loadHub(),r=base(mode);r.status='lobby';r.arcadeCount=count;
  r.players=Object.fromEntries(Array.from({length:count},(_,i)=>[String.fromCharCode(97+i),{name:'Player '+i}]));
  h.setRoom(r);assert.equal(h.run('ArcadeEngine.setup(testRoom,Object.keys(testRoom.players))'),true);
  h.setRoom(databaseShape(plain(h.run('testRoom'))));
  h.run('renderArcadeRoom(roomState)');
  assert.equal(h.element('arcadeScreen').hidden,false,mode);
  assert.ok(h.element('arcadeContent').children.length>0,mode);
  assert.deepEqual(h.errors,[],mode);
 }
});
test('room browser names all new games before optional game scripts load',()=>{
 const h=loadHub({addons:false});
 for(const [mode,title] of [['take6','6 nimmt!'],['just_one','Just One'],['wavelength','Wavelength'],['codenames','Codenames'],['fake_artist','A Fake Artist Goes to New York']])assert.equal(h.run(`modeTitle(${JSON.stringify(mode)})`),title);
});
test('a shared category library awaiting migration still offers the bundled Forbidden Word packs',()=>{
 const h=loadHub();h.element('categoryHistoryOverlay').hidden=true;
 h.run('applySharedCategoryDocument(JSON.stringify({categories:{sample:{name:"Sample",groups:{words:["one","two"]},enabledModes:["whoami_time"]}}}))');
 assert.equal(h.run('Object.keys(library).filter(key=>key.startsWith("forbidden_")).length'),4);
 h.run('chooseMode("forbidden")');
 assert.equal(h.element('categoryOptions').children.length,4);
});
test('Liar’s Deck and Dice expose the player’s hand at the start of each round',()=>{
 for(const mode of ['liar_deck','liar_dice']){
  const h=loadHub(),r=base(mode);r.status='lobby';r.tabletopCount=4;r.players.d={name:'D'};
  h.setRoom(r);assert.equal(h.run('TabletopEngine.setup(testRoom,Object.keys(testRoom.players))'),true);
  h.setRoom(plain(h.run('testRoom')));h.run('renderTabletopRoom(roomState)');
  assert.equal(h.run('tabletopUI.show'),true,mode);
  assert.equal(h.element('tabletopScreen').hidden,false,mode);
 }
});
test('the home game guide opens room creation with its game selected',()=>{
 const elements=new Map(),selected=[];
 const element=id=>{if(!elements.has(id))elements.set(id,{hidden:id==='createView',open:false,children:[],append(child){this.children.push(child);},replaceChildren(...children){this.children=children;},showModal(){this.open=true;},close(){this.open=false;},click(){this.hidden=false;element('createView').hidden=false;}});return elements.get(id);};
 const context=vm.createContext({$:element,chooseMode:mode=>selected.push(mode),document:{createElement:()=>({children:[],firstElementChild:{cloneNode:()=>({})},append(child){this.children.push(child);},setAttribute(){}}),querySelector:()=>({prepend(){}})}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../game-desk.js'),'utf8'),context);
 vm.runInContext('showGuide("forbidden")',context);
 assert.equal(element('gameGuide').open,true);
 element('guideBody').children.at(-1).onclick();
 assert.deepEqual(selected,['forbidden']);assert.equal(element('createView').hidden,false);assert.equal(element('gameGuide').open,false);
});
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
test('Avalon 8/9/10 player games with and without Angel run through all phases to a valid result',()=>{
 for(const count of [8,9,10])for(const angel of [false,true])for(let attempt=0;attempt<5;attempt++){
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
 await h.element('createConfirmBtn').onclick();assert.equal(h.getRoom().gameMode,'cryptid');assert.equal(h.getRoom().cryptidClueSet,undefined);
});

test('new room codes use four digits and skip an existing code',async()=>{
 const h=loadHub(),r=base('spyfall');r.roomCode='1000';h.setRoom(r);
 h.run('Math=Object.create(Math);Math.random=()=>0');
 assert.equal(await h.run('generateRoomCode()'),'1001');
 h.run('testRoom.roomCode="123456"');h.setRoom(h.run('testRoom'));
 assert.equal(await h.run('generateRoomCode()'),'1000','an older six-digit room does not block four-digit codes');
});
test('6 nimmt creates a room without categories, fills bots and starts from lobby controls',async()=>{
 const h=loadHub(),r=base('take6');r.status='lobby';r.players={a:r.players.a};r.arcadeCount=2;h.setRoom(r);
 h.run('chooseMode("take6")');h.element('arcadeCreateCount').value='2';h.element('durationInput').value='2';h.run('generateRoomCode=async()=>"4231"');
 await h.element('createConfirmBtn').onclick();assert.equal(h.getRoom().gameMode,'take6');assert.equal(h.getRoom().categoryPack,null);assert.equal(h.getRoom().arcadeCount,2);
 h.sync();await h.element('arcadeFillBots').onclick();h.sync();h.run('renderArcadeRoom(roomState)');
 await h.element('startBtn').onclick();assert.equal(h.getRoom().status,'arcade_playing');assert.equal(h.getRoom().arcade.order.length,2);
 h.sync();h.run('renderArcadeRoom(roomState)');assert.deepEqual(h.errors,[]);
});
test('Just One creates a human room and renders its private word phases',async()=>{
 const h=loadHub(),r=base('just_one');r.status='lobby';r.players={a:r.players.a};h.setRoom(r);h.run('chooseMode("just_one")');h.element('arcadeCreateCount').value='3';h.run('generateRoomCode=async()=>"4232"');
 await h.element('createConfirmBtn').onclick();assert.equal(h.getRoom().gameMode,'just_one');assert.equal(h.getRoom().arcadeCount,3);
 h.sync();h.run('renderArcadeRoom(roomState)');assert.equal(h.element('arcadeBotTools').hidden,true);
 const filled=h.getRoom();filled.players.b={name:'B'};filled.players.c={name:'C'};h.setRoom(filled);h.run('renderArcadeRoom(roomState)');
 await h.element('startBtn').onclick();assert.equal(h.getRoom().status,'arcade_playing');
 h.sync();h.run('renderArcadeRoom(roomState)');assert.deepEqual(h.errors,[]);
});
test('Wavelength starts in a human room and renders the private dial',()=>{
 const h=loadHub(),r=base('wavelength');r.status='lobby';r.arcadeCount=3;h.setRoom(r);
 assert.equal(h.run('ArcadeEngine.setup(testRoom,Object.keys(testRoom.players))'),true);
 h.run('roomState=testRoom;renderArcadeRoom(roomState)');assert.equal(h.element('arcadeScreen').hidden,false);assert.deepEqual(h.errors,[]);
});
test('Codenames renders a team board without exposing other modes',()=>{
 const h=loadHub(),r=base('codenames');r.status='lobby';r.players.d={name:'D'};r.arcadeCount=4;h.setRoom(r);
 assert.equal(h.run('ArcadeEngine.setup(testRoom,Object.keys(testRoom.players))'),true);
 h.run('roomState=testRoom;renderArcadeRoom(roomState)');assert.equal(h.element('arcadeScreen').hidden,false);assert.deepEqual(h.errors,[]);
});
test('Fake Artist starts a four-person human room and renders topic and drawing safely',async()=>{
 const h=loadHub(),r=base('fake_artist');r.status='lobby';r.players.d={name:'D'};r.arcadeCount=4;h.setRoom(r);
 h.run('chooseMode("fake_artist")');assert.equal(h.element('arcadeCreateCount').value,'4');
 h.run('renderArcadeRoom(roomState)');assert.equal(h.element('startBtn').disabled,false);
 await h.element('startBtn').onclick();h.sync();assert.equal(h.getRoom().status,'arcade_playing');
 h.run('roomState=testRoom;renderArcadeRoom(roomState)');assert.deepEqual(h.errors,[]);
 h.run('ArcadeEngine.apply(testRoom,testRoom.arcade.master,"topic",{category:"สัตว์",secret:"วาฬ"},testRoom.arcade.revision);roomState=testRoom;renderArcadeRoom(roomState)');
 assert.equal(h.element('arcadeScreen').hidden,false);assert.deepEqual(h.errors,[]);
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
test('Cryptid stage cards save the selected map, start on that exact layout and are read-only for guests',async()=>{
 const h=loadHub(),r=base('cryptid');r.status='lobby';r.cryptidCount=3;r.cryptidMap='random';h.setRoom(r);h.run('renderCryptidLobby(roomState)');
 const cards=h.element('cryptidLobbyMapChoices').children;assert.equal(cards.length,Object.keys(require('../cryptid-engine').MAPS).length);
 cards.find(e=>e.dataset.mapId==='sunlands').onclick();assert.equal(h.element('cryptidLobbyMap').value,'sunlands');assert.equal(h.element('cryptidLobbySave').disabled,false);
 assert.match(h.element('cryptidLobbyMapStatus').textContent,/กดบันทึก/);
 h.run('setTimeout=fn=>fn()');await h.run('cryptidStart()');assert.equal(h.getRoom().status,'lobby','unsaved choices must not start on the old map');
 await h.element('cryptidLobbySave').onclick();assert.equal(h.getRoom().cryptidMap,'sunlands');h.sync();h.run('renderCryptidLobby(roomState)');await h.run('cryptidStart()');
 const saved=h.getRoom();assert.equal(saved.cryptid.mapId,'sunlands');assert.deepEqual(plain(saved.cryptid.board),require('../cryptid-engine').mapBoard('sunlands'));
 r.cryptidMap='shadowfen';h.setRoom(r,'b');h.run('renderCryptidLobby(roomState)');for(const card of cards)assert.equal(card.disabled,true);
 cards.find(e=>e.dataset.mapId==='sunlands').onclick();assert.equal(h.element('cryptidLobbyMap').value,'shadowfen');
});
test('Cryptid Deep Sea shows all six undersea maps and switching tabs remembers each map',()=>{
 const h=loadHub(),root=h.element('cryptidCreateMapChoices'),tabs=h.element('cryptidCreateCollectionChoices').children;
 assert.deepEqual(tabs.map(b=>b.dataset.collection),['original','creative','volcano']);
 assert.deepEqual(tabs.map(b=>b.textContent),['Original','Deep Sea','Volcano']);
 assert.equal(root.children.length,Object.keys(require('../cryptid-engine').MAPS).length);
 assert.equal(root.children.filter(card=>!card.hidden).length,12);
 tabs[1].onclick();assert.equal(h.element('cryptidCreateCollection').value,'creative');
 assert.deepEqual(root.children.filter(card=>!card.hidden).map(card=>card.dataset.mapId),['abyss','searift','wreckyard','coralcity','kelpmaze','sinkhole']);
 assert.equal(h.element('cryptidCreateMap').value,'abyss');
 assert.equal(h.element('cryptidCreateCollectionEmpty').hidden,true);
 h.run('selectedMode="cryptid";renderCategoryChoices()');assert.equal(h.element('createConfirmBtn').disabled,false);
 tabs[0].onclick();assert.equal(h.element('cryptidCreateMap').value,'random');assert.equal(root.children.filter(card=>!card.hidden).length,12);
 assert.equal(h.element('cryptidCreateCollectionEmpty').hidden,true);
 tabs[2].onclick();assert.equal(h.element('cryptidCreateCollection').value,'volcano');
 assert.deepEqual(root.children.filter(card=>!card.hidden).map(card=>card.dataset.mapId),['lavavalley','craterring','ashentemple']);
 assert.equal(h.element('cryptidCreateMap').value,'lavavalley');tabs[0].onclick();
 const r=base('cryptid');r.status='lobby';r.cryptidCount=3;r.cryptidMap='wetlands';h.setRoom(r);h.run('renderCryptidLobby(roomState)');
 const lobby=h.element('cryptidLobbyCollectionChoices').children;lobby[1].onclick();
 assert.equal(h.element('cryptidLobbyMap').value,'abyss');assert.equal(h.element('cryptidLobbySave').disabled,false);
 assert.equal(h.element('cryptidLobbyCollectionEmpty').hidden,true);
 h.run('renderCryptidLobby(roomState)');assert.equal(h.element('cryptidLobbyCollection').value,'creative','room refresh should preserve the browsing tab');
 lobby[0].onclick();assert.equal(h.element('cryptidLobbyMap').value,'wetlands');
 assert.equal(h.element('cryptidLobbyMapChoices').children.find(card=>card.dataset.mapId==='wetlands').getAttribute('aria-pressed'),'true');
});
test('Cryptid requires saving the Deep Sea stage before starting on the selected layout',async()=>{
 const h=loadHub(),r=base('cryptid');r.status='lobby';r.cryptidCount=3;r.cryptidMap='mistwood';h.setRoom(r);h.run('renderCryptidLobby(roomState)');
 h.run('setTimeout=fn=>fn()');h.element('cryptidLobbyCollectionChoices').children[1].onclick();await h.run('cryptidStart()');assert.equal(h.getRoom().status,'lobby');
 await h.element('cryptidLobbySave').onclick();assert.equal(h.getRoom().cryptidMap,'abyss');
 h.sync();h.run('renderCryptidLobby(roomState)');await h.run('cryptidStart()');
 assert.equal(h.getRoom().status,'cryptid_playing');assert.equal(h.getRoom().cryptid.mapId,'abyss');
 assert.ok(h.getRoom().cryptid.board.every(cell=>cell.biome==='deepsea'));
});
test('Cryptid saves and starts the selected Volcano stage with volcanic board data',async()=>{
 const h=loadHub(),r=base('cryptid');r.status='lobby';r.cryptidCount=3;r.cryptidMap='mistwood';h.setRoom(r);h.run('renderCryptidLobby(roomState);setTimeout=fn=>fn()');
 h.element('cryptidLobbyCollectionChoices').children[2].onclick();
 const cards=h.element('cryptidLobbyMapChoices').children,temple=cards.find(card=>card.dataset.mapId==='ashentemple');temple.onclick();
 assert.equal(h.element('cryptidLobbyMap').value,'ashentemple');await h.element('cryptidLobbySave').onclick();h.sync();h.run('renderCryptidLobby(roomState)');
 await h.run('cryptidStart()');assert.equal(h.getRoom().cryptid.mapId,'ashentemple');assert.ok(h.getRoom().cryptid.board.every(cell=>cell.biome==='volcano'));
});
test('Cryptid starts legacy Standard rooms with all clue types and has no map dropdown or clue-set selector',async()=>{
 const h=loadHub(),r=base('cryptid');r.status='lobby';r.cryptidCount=3;r.cryptidMap='mistwood';r.cryptidClueSet='standard';h.setRoom(r);h.run('renderCryptidLobby(roomState);setTimeout=fn=>fn()');
 const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
 assert.doesNotMatch(html,/<select id="cryptid(?:Create|Lobby)(?:Count|Map)"|cryptid(?:Create|Lobby)ClueSet/);
 await h.run('cryptidStart()');assert.equal(h.getRoom().status,'cryptid_playing');assert.equal(h.getRoom().cryptidClueSet,undefined);assert.equal(h.getRoom().cryptid.clueSet,undefined);
});
test('Cryptid catalogue button always lists all 51 clues, ignores legacy set metadata and has no old help text',()=>{
 const engine=require('../cryptid-engine');
 for(const clueSet of ['standard','mixed']){
  const h=loadHub(),r=base('cryptid');r.status='lobby';r.cryptidClueSet=clueSet;assert.ok(engine.setup(r,Object.keys(r.players),engine.generate(3,Math.random,'mistwood')));
  r.cryptid.clueSet=clueSet;h.setRoom(r);
  const dialog=h.element('cryptidClueDialog');dialog.close=()=>{dialog.open=false;};dialog.showModal=()=>{dialog.open=true;};h.run('renderCryptid(roomState)');
  const content=h.element('cryptidContent').innerHTML;assert.match(content,/ดูชนิดเบาะแสทั้งหมด/);assert.doesNotMatch(content,/วิธีเล่นและชนิดเบาะแส|ลูกกลิ้ง = ซูม|cryptidGuide/);
  h.element('cryptidOpenClues').onclick();assert.equal(dialog.open,true);const list=h.element('cryptidClueList').innerHTML,pool=engine.clueCatalogue(r.cryptid.board);
  assert.equal((list.match(/<li>/g)||[]).length,51);for(const clue of pool)assert.ok(list.includes(clue.text));assert.doesNotMatch(list,/ผู้เล่น|winner|solution/);
  h.element('cryptidCloseClues').onclick();assert.equal(dialog.open,false);h.run('cryptidOpenClues();showScreen("lobbyScreen")');assert.equal(dialog.open,false);
  h.run('cryptidOpenClues();showOnly("homeView")');assert.equal(dialog.open,false);
 }
});
test('Cryptid player-count cards change creation and saved lobby counts and are host-only',async()=>{
 const h=loadHub(),create=h.element('cryptidCreateCountChoices').children;assert.equal(create.length,4);assert.deepEqual(create.map(b=>b.dataset.count),['2','3','4','5']);
 create[3].onclick();assert.equal(h.element('cryptidCreateCount').value,'5');h.run('nameConfirmed=true;myName="Test"');h.element('openCreateBtn').onclick();assert.equal(h.element('cryptidCreateCount').value,'3');
 const r=base('cryptid');r.status='lobby';r.cryptidCount=3;h.setRoom(r);h.run('renderCryptidLobby(roomState)');const buttons=h.element('cryptidLobbyCountChoices').children;
 buttons[3].onclick();assert.equal(h.element('cryptidLobbyCount').value,'5');assert.equal(h.element('cryptidLobbySave').disabled,false);await h.element('cryptidLobbySave').onclick();assert.equal(h.getRoom().cryptidCount,5);
 h.setRoom(r,'b');h.run('renderCryptidLobby(roomState)');for(const b of buttons)assert.equal(b.disabled,true);buttons[3].onclick();assert.equal(h.element('cryptidLobbyCount').value,'3');
});
test('Cryptid difficulty is saved by host, applied to two-player games and read-only for guests',async()=>{
 const h=loadHub(),r=base('cryptid');r.status='lobby';delete r.players.c;r.cryptidCount=2;r.cryptidMap='fenring';h.setRoom(r);h.run('renderCryptidLobby(roomState);setTimeout=fn=>fn()');
 const choices=h.element('cryptidLobbyBotDifficultyChoices').children;assert.equal(h.element('cryptidLobbyBotDifficulty').value,'normal');choices[1].onclick();assert.equal(h.element('cryptidLobbySave').disabled,false);await h.element('cryptidLobbySave').onclick();assert.equal(h.getRoom().cryptidBotDifficulty,'hard');h.sync();h.run('renderCryptidLobby(roomState)');await h.run('cryptidStart()');assert.equal(h.getRoom().cryptid.order.length,2);assert.equal(h.getRoom().cryptid.botDifficulty,'hard');
 h.setRoom(r,'b');h.run('renderCryptidLobby(roomState)');assert.ok(choices.every(c=>c.disabled));choices[1].onclick();assert.equal(h.element('cryptidLobbyBotDifficulty').value,'normal');
});
test('three new games create rooms without categories, save counts, fill bots and start from real UI handlers',async()=>{
 for(const mode of ['coup','liar_deck','liar_dice']){
  const h=loadHub(),r=base(mode);r.status='lobby';h.setRoom(r);h.run('chooseMode("'+mode+'")');h.element('tabletopCreateCount').value='2';h.element('durationInput').value='2';h.run('generateRoomCode=async()=>"123456"');await h.element('createConfirmBtn').onclick();assert.equal(h.getRoom().gameMode,mode);assert.equal(h.getRoom().tabletopCount,2);assert.equal(h.getRoom().categoryPack,null);
  const lobby=h.getRoom();h.setRoom(lobby);h.run('renderRoom(roomState)');h.element('tabletopLobbyCount').value='3';await h.element('tabletopLobbySave').onclick();assert.equal(h.getRoom().tabletopCount,3);h.sync();await h.element('tabletopFillBots').onclick();assert.equal(Object.keys(h.getRoom().players).length,3);h.sync();h.run('renderRoom(roomState)');await h.element('startBtn').onclick();assert.equal(h.getRoom().status,'tabletop_playing');assert.equal(h.getRoom().tabletop.order.length,3);assert.deepEqual(h.errors,[]);
 }
});

test('custom settings determine preparation time and attempts, freeze per game and default for legacy rooms',()=>{
 const h=loadHub(),r=base('whoami_custom');r.status='lobby';r.whoCustomSettings={prepSeconds:90,maxGuesses:3};h.setRoom(r);
 assert.equal(h.run('whoCustomSetup(testRoom,Object.keys(testRoom.players))'),true);
 assert.equal(h.run('testRoom.whoCustomDeadline'),1_090_000);
 h.run('testRoom.whoCustomSettings={prepSeconds:15,maxGuesses:20};whoCustomBegin(testRoom)');
 assert.deepEqual(plain(h.run('testRoom.attempts')),{a:3,b:3,c:3});
 const legacy=base('whoami_custom');legacy.status='lobby';h.setRoom(legacy);h.run('whoCustomSetup(testRoom,Object.keys(testRoom.players));whoCustomBegin(testRoom)');
 assert.deepEqual(plain(h.run('testRoom.attempts')),{a:1,b:1,c:1});
 for(const settings of [{prepSeconds:14,maxGuesses:1},{prepSeconds:301,maxGuesses:1},{prepSeconds:60,maxGuesses:0},{prepSeconds:60,maxGuesses:21},{prepSeconds:60.5,maxGuesses:1}]){
  h.run('invalidSettings='+JSON.stringify(settings));assert.equal(h.run('whoCustomSettingsValid(invalidSettings)'),false);
 }
});
test('custom retries preserve all reviews, wait for the writer and award points only on the correct guess',async()=>{
 const h=loadHub(),r=base('whoami_custom');r.whoCustomAssignments={a:'b',b:'c',c:'a'};r.whoCustomRoundSettings={prepSeconds:90,maxGuesses:3};r.attempts.b=3;
 h.run('confirmBox=async()=>true');
 for(let attempt=1;attempt<=3;attempt++){
  h.setRoom(attempt===1?r:h.getRoom(),'b');h.element('guessInput').value='คำตอบ '+attempt;
  await Promise.all([h.run('whoCustomGuess()'),h.run('whoCustomGuess()')]);
  let saved=h.getRoom();
  assert.equal(saved.attempts.b,3-attempt);assert.equal(saved.whoCustomGuesses.b.length,attempt);
  assert.equal(saved.whoCustomPending.b.attempt,attempt);
  h.setRoom(saved,'b');h.run('renderWho(roomState)');assert.equal(h.element('guessInputs').hidden,true);
  h.setRoom(saved,'a');await h.run('whoCustomJudge('+(attempt===3)+')');await h.run('whoCustomJudge(true)');
  saved=h.getRoom();assert.equal(saved.whoCustomPending.b,undefined);
  assert.equal(saved.scores.b,attempt===3?2:0);
  assert.equal(saved.whoCustomGuesses.b.length,attempt);
  assert.equal(saved.whoCustomGuesses.b[attempt-1].correct,attempt===3);
  if(attempt<3){
   assert.ok(saved.turnOrder.includes('b'));
   h.setRoom(saved,'b');h.run('renderWho(roomState)');assert.equal(h.element('answerReveal').hidden,true);assert.equal(h.element('guessInputs').hidden,false);
  }else assert.ok(!saved.turnOrder.includes('b'));
 }
 assert.deepEqual(h.getRoom().whoCustomGuesses.b.map(g=>g.correct),[false,false,true]);
});
test('custom final deadline closes unused attempts but still allows a submitted answer to be judged',async()=>{
 const h=loadHub(),r=base('whoami_custom');r.status='final_guess';r.finalDeadline=1_010_000;r.whoCustomAssignments={a:'b',b:'c',c:'a'};
 r.whoCustomRoundSettings={prepSeconds:60,maxGuesses:3};r.attempts={a:0,b:3,c:0};h.setRoom(r,'b');
 h.run('confirmBox=async()=>true');h.element('guessInput').value='สุนัข';await h.run('whoCustomGuess()');
 const pending=h.getRoom();h.setRoom(pending,'a');h.now(1_011_000);
 h.run('markWhoFinalTimeouts(testRoom);whoCustomCompleteIfReady(testRoom)');
 const timedOut=plain(h.run('testRoom'));assert.equal(timedOut.status,'whoami_review');assert.equal(timedOut.attempts.b,0);
 h.setRoom(timedOut,'a');await h.run('whoCustomJudge(true)');
 assert.equal(h.getRoom().status,'results');assert.equal(h.getRoom().scores.b,1);assert.equal(h.getRoom().whoCustomGuesses.b[0].correct,true);
});
test('only the host can save custom lobby settings, and saved changes do not alter an active game',async()=>{
 const h=loadHub(),r=base('whoami_custom');r.status='lobby';h.setRoom(r,'a');h.run('renderWhoCustomLobby(roomState)');
 h.element('whoCustomLobbyPrep').value='120';h.element('whoCustomLobbyAttempts').value='4';h.run('renderWhoCustomLobby(roomState)');
 assert.equal(h.element('whoCustomLobbySave').disabled,false);
 await h.element('whoCustomLobbySave').onclick();assert.deepEqual(plain(h.getRoom().whoCustomSettings),{prepSeconds:120,maxGuesses:4});
 h.setRoom(h.getRoom(),'b');h.run('renderWhoCustomLobby(roomState)');assert.equal(h.element('whoCustomLobbyPrep').disabled,true);
 h.element('whoCustomLobbyPrep').value='30';await h.element('whoCustomLobbySave').onclick();assert.equal(h.getRoom().whoCustomSettings.prepSeconds,120);
 const active=h.getRoom();active.status='playing';h.setRoom(active,'a');h.element('whoCustomLobbyPrep').value='60';
 await h.element('whoCustomLobbySave').onclick();assert.equal(h.getRoom().whoCustomSettings.prepSeconds,120);
});
test('Avalon 8 players removes one Loyal Servant, caps bots at eight and requires exactly eight to start',()=>{
 const h=loadHub();assert.deepEqual(plain(h.run('avalonDeck(8).filter(role=>role==="Loyal Servant of Arthur")')).length,3);
 assert.equal(h.run('avalonDeck(8).filter(role=>avalonSide(role)==="blue").length'),5);
 assert.equal(h.run('avalonDeck(8).filter(role=>avalonSide(role)==="red").length'),3);
 const r=base('avalon');r.status='lobby';r.avalonCount=8;h.setRoom(r);
 assert.equal(h.run('avalonManageBots(testRoom,"a","fill")'),true);assert.equal(h.run('Object.keys(testRoom.players).length'),8);
 assert.equal(h.run('avalonManageBots(testRoom,"a","add")'),false);
 assert.equal(h.run('avalonSetup(testRoom,Object.keys(testRoom.players).slice(0,7))'),false);
 assert.equal(h.run('avalonSetup(testRoom,Object.keys(testRoom.players))'),true);
});
test('custom settings persist through the create and start buttons, and dirty lobby edits block starting',async()=>{
 const h=loadHub(),r=base('whoami_custom');r.status='lobby';h.setRoom(r);
 h.run('selectedMode="whoami_custom";selectedCategory="";generateRoomCode=async()=>"123456"');
 h.element('durationInput').value='2';h.element('whoCustomCreatePrep').value='150';h.element('whoCustomCreateAttempts').value='4';
 await h.element('createConfirmBtn').onclick();const saved=h.getRoom();
 assert.deepEqual(plain(saved.whoCustomSettings),{prepSeconds:150,maxGuesses:4});
 h.setRoom(saved);h.run('renderRoom(roomState)');
 h.element('whoCustomLobbyAttempts').value='5';await h.element('startBtn').onclick();assert.equal(h.getRoom().status,'lobby');
 h.element('whoCustomLobbyAttempts').value='4';h.element('startBtn').disabled=false;
 // Add a second real participant so the ordinary minimum-player guard is met.
 const ready=h.getRoom();ready.players.b={name:'B'};h.setRoom(ready);h.run('renderRoom(roomState)');
 await h.element('startBtn').onclick();assert.equal(h.getRoom().status,'whoami_prepare');
 assert.equal(h.getRoom().whoCustomDeadline,1_150_000);assert.equal(h.getRoom().whoCustomRoundSettings.maxGuesses,4);
});
