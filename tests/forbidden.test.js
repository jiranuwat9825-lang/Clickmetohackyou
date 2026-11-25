'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../forbidden-engine'),loadHub=require('./hub-harness');
function room(n=3){const players=Object.fromEntries(Array.from({length:n},(_,i)=>['p'+i,{name:'Player '+i}]));return {gameMode:'forbidden',status:'lobby',hostId:'p0',players,scores:{}};}
const pack={groups:{easy:['จริง','ถาม','จริง','ข้าว','ไป','มา','ดู','กิน']}};
test('deals a different word to every player, hides only the viewer’s word, and freezes a five-minute deadline',()=>{
 const r=room(3);assert.equal(E.setup(r,Object.keys(r.players),pack,1000,()=>.3),true);
 assert.equal(r.forbidden.deadline,301000);assert.equal(r.status,'playing');
 assert.equal(new Set(Object.values(r.forbidden.words)).size,3);
 const own=E.view(r,'p0');assert.equal(own.words.p0,null);assert.equal(own.words.p1,r.forbidden.words.p1);
 assert.equal(E.view(r,'p1').words.p0,r.forbidden.words.p0);
});
test('only living players can die; the last survivor wins and gets one point exactly once',()=>{
 const r=room();assert.equal(E.setup(r,Object.keys(r.players),pack,1000),true);
 assert.equal(E.eliminate(r,'stranger',2000),false);
 delete r.forbidden.dead; // Firebase drops empty objects when the room is saved.
 assert.equal(E.eliminate(r,'p1',2000),true);assert.equal(r.status,'playing');assert.equal(E.view(r,'p1').words.p1,r.forbidden.words.p1);
 assert.equal(E.eliminate(r,'p1',3000),false);assert.equal(E.eliminate(r,'p2',3000),true);
 assert.equal(r.status,'results');assert.deepEqual(r.result.winners,['p0']);assert.equal(r.scores.p0,1);
 assert.equal(E.tick(r,301001),false);assert.equal(E.eliminate(r,'p0',301001),false);assert.equal(r.scores.p0,1);
});
test('on the deadline every survivor wins together; late death cannot change the result',()=>{
 const r=room(4);assert.equal(E.setup(r,Object.keys(r.players),pack,1000),true);
 E.eliminate(r,'p2',300000);assert.equal(E.eliminate(r,'p0',301000),true);
 assert.equal(r.status,'results');assert.equal(r.result.reason,'time');assert.deepEqual([...r.result.winners].sort(),['p0','p1','p3']);
 for(const id of r.result.winners)assert.equal(r.scores[id],1);
 assert.equal(r.scores.p2,undefined);assert.equal(E.tick(r,302000),false);
});
test('room controls select a new word category, start, hide words independently, and time out',async()=>{
 const h=loadHub();h.run('nameConfirmed=true;myName="A";chooseMode("forbidden");selectedCategory="forbidden_everyday";renderCategoryChoices()');
 assert.equal(h.element('categoryCreateSection').hidden,false);assert.equal(h.element('durationCreateSection').hidden,true);
 assert.equal(h.element('createConfirmBtn').disabled,false);
 h.run('generateRoomCode=async()=>"1234"');await h.element('createConfirmBtn').onclick();
 let r=h.getRoom();assert.equal(r.gameMode,'forbidden');assert.equal(r.category,'forbidden_everyday');
 r.players.p1={name:'B'};r.players.p2={name:'C'};h.setRoom(r,r.hostId);await h.element('startBtn').onclick();r=h.getRoom();
 assert.equal(r.status,'playing');assert.equal(r.forbidden.deadline,1_300_000);assert.equal(new Set(Object.values(r.forbidden.words)).size,3);
 h.setRoom(r,r.hostId);h.run('renderRoom(roomState)');assert.equal(h.element('forbiddenScreen').hidden,false);
 assert.equal(h.element('roomMeta').textContent.startsWith('Forbidden Word · คำติดปาก'),true);
 const first=h.element('forbiddenCards').children.find(c=>c.children[2]);assert.ok(first);const other=h.element('forbiddenCards').children.find(c=>c!==first&&c.children[2]);
 const visible=other.children[1].textContent;first.children[2].onclick();
 assert.equal(h.element('forbiddenCards').children.find(c=>c.children[0].children[0].textContent===first.children[0].children[0].textContent).children[1].textContent,'••••••');
 assert.equal(h.element('forbiddenCards').children.find(c=>c.children[0].children[0].textContent===other.children[0].children[0].textContent).children[1].textContent,visible);
 h.now(1_300_000);await h.run('forbiddenAuto()');assert.equal(h.getRoom().status,'results');assert.equal(h.getRoom().result.winners.length,3);
});
