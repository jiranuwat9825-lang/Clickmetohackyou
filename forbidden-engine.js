/* Forbidden Word: one private forehead word per player, five minutes per game. */
(function(root){
 'use strict';
 const DURATION_MS=5*60*1000;
 const normalize=word=>String(word||'').trim().toLocaleLowerCase();
 const shuffle=(items,rng)=>{const list=[...items];for(let i=list.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;};
 const remaining=r=>r.forbidden.order.filter(id=>!r.forbidden.dead?.[id]);
 function setup(r,ids,pack,now,rng=Math.random){
  if(r?.gameMode!=='forbidden'||r.status!=='lobby'||!Number.isFinite(now)||ids.length<2||new Set(ids).size!==ids.length||!ids.every(id=>r.players?.[id]))return false;
  const words=[...new Map(Object.values(pack?.groups||{}).flat().filter(word=>typeof word==='string'&&word.trim()).map(word=>[normalize(word),word.trim()])).values()];
  if(words.length<ids.length)return false;
  const picked=shuffle(words,rng),order=shuffle(ids,rng),assigned={};order.forEach((id,i)=>assigned[id]=picked[i]);
  r.forbidden={order,words:assigned,dead:{},startedAt:now,deadline:now+DURATION_MS};
  r.status='playing';r.gamePlayers=JSON.parse(JSON.stringify(r.players));r.playerProfiles={...(r.playerProfiles||{}),...JSON.parse(JSON.stringify(r.players))};
  r.gamesPlayed=(Number(r.gamesPlayed)||0)+1;r.result=null;
  return true;
 }
 function finish(r,reason){
  const winners=remaining(r);r.status='results';r.result={type:'forbidden',reason,winners,points:1};
  r.scores||={};for(const id of winners)r.scores[id]=(Number(r.scores[id])||0)+1;
 }
 function tick(r,now){
  if(r?.gameMode!=='forbidden'||r.status!=='playing'||!r.forbidden||!Number.isFinite(now)||now<r.forbidden.deadline)return false;
  finish(r,'time');return true;
 }
 function eliminate(r,id,now){
  if(r?.gameMode!=='forbidden'||r.status!=='playing'||!r.forbidden||!Number.isFinite(now)||!r.forbidden.order.includes(id)||r.forbidden.dead?.[id])return false;
  if(tick(r,now))return true;
  (r.forbidden.dead??={})[id]=now;
  if(remaining(r).length===1)finish(r,'last');
  return true;
 }
 function view(r,id){
  if(r?.gameMode!=='forbidden'||!r.forbidden)return null;
  const a=r.forbidden,done=r.status==='results';
  return {order:[...a.order],words:Object.fromEntries(a.order.map(p=>[p,done||a.dead?.[id]||p!==id?a.words[p]:null])),dead:{...a.dead},deadline:a.deadline,result:r.result?.type==='forbidden'?{...r.result}:null};
 }
 const api={DURATION_MS,setup,tick,eliminate,view};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ForbiddenEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
