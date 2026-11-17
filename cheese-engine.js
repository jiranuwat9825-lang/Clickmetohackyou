/* Cheese Thief rules, adapted for the hub's timed online table.
 * Rulebook: https://ludopedia-anexos.nyc3.digitaloceanspaces.com/cheese_thief_rules_217050.pdf
 * Shared-room client authority has the same trust boundary as other hub modes.
 */
(function(root){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x));
 const mix=(xs,rng=Math.random)=>{const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 function setup(r,ids,now,rng=Math.random){
  if(r?.gameMode!=='cheese'||r.status!=='lobby'||ids.length<4||ids.length>8||ids.length!==Number(r.cheeseCount||4))return false;
  const order=mix(ids,rng),thief=order[0],fall=r.cheeseFall&&ids.length>=6?order[1]:null;
  r.roles=Object.fromEntries(ids.map(id=>[id,id===thief?'thief':id===fall?'fall':'sleepy']));
  r.gamePlayers=copy(r.players);r.playerProfiles={...(r.playerProfiles||{}),...copy(r.players)};r.result=null;r.gamesPlayed=(Number(r.gamesPlayed)||0)+1;
  const dice=Object.fromEntries(ids.map(id=>[id,Array.from({length:ids.length===4?2:1},()=>1+Math.floor(rng()*6))]));
  r.cheese={order,dice,thief,fall,phase:'prepare',revision:0,rolled:{},wake:{},ready:{},hour:0,stolenHour:0,followers:[],sightings:{},peeks:{},votes:{},deadline:null,discussSeconds:Math.max(60,Math.min(900,(Number(r.cheeseDiscussMinutes)||3)*60))};
  r.status='cheese_playing';return true;
 }
 function wakeHours(a,id){return id===a.thief?[...new Set(a.dice[id])]:a.wake?.[id]?[a.wake[id]]:a.order.length>4?[a.dice[id][0]]:[];}
 function awakeIds(a){return a.order.filter(id=>wakeHours(a,id).includes(a.hour));}
 function assignFollowers(a,ids){a.followers=[...ids];}
 function enterHour(a,now){
  a.sightings||={};a.phase='night';a.deadline=now+10000;const awake=awakeIds(a),present=!a.stolenHour,steals=awake.includes(a.thief)&&!a.stolenHour;
  if(steals)a.stolenHour=a.hour;
  for(const id of awake){a.sightings[id]||={};a.sightings[id]['h'+a.hour]={hour:a.hour,peers:awake.filter(p=>p!==id),cheeseBefore:present,cheeseAfter:!a.stolenHour,...(steals&&id!==a.thief?{witness:a.thief}:{})};}
  if(a.order.length===5&&steals){a.recruitEligible=awake.filter(p=>p!==a.thief);a.recruitCount=a.recruitEligible.length?1:0;if(a.recruitEligible.length===1)assignFollowers(a,a.recruitEligible);}
 }
 function finishNight(a,now){
  if(a.order.length>=6){a.phase='recruit';a.recruitEligible=a.order.filter(p=>p!==a.thief);a.recruitCount=a.order.length===6?1:2;a.deadline=now+15000;}
  else{a.phase='intel';a.deadline=now+10000;}
 }
 function finish(r){
  const a=r.cheese,followers=a.followers||[],counts={};for(const [id,target] of Object.entries(a.votes||{}))if(a.order.includes(id)&&a.order.includes(target)&&id!==target)counts[target]=(counts[target]||0)+1;
  const high=Math.max(0,...Object.values(counts)),top=Object.keys(counts).filter(id=>high>0&&counts[id]===high),fallWins=!!a.fall&&top.includes(a.fall),caught=top.includes(a.thief);
  const winners=!top.length?[]:fallWins?[a.fall]:a.order.filter(id=>id!==a.fall&&(caught?id!==a.thief&&!followers.includes(id):id===a.thief||followers.includes(id)));
  r.scores||={};for(const id of winners)r.scores[id]=(Number(r.scores[id])||0)+1;
  a.phase='finished';a.deadline=null;r.status='results';r.result={type:'cheese',winner:fallWins?'fall':caught?'sleepy':'thief',winners,top,counts,caught,aborted:!top.length};
 }
 function apply(r,id,action,value,now,revision){
  const a=r?.cheese;if(!a||r.gameMode!=='cheese'||r.status!=='cheese_playing'||!a.order.includes(id)||!r.players?.[id]||(revision!=null&&a.revision!==revision))return false;
  if(action==='abort'){
   if(id!==r.hostId)return false;r.status='results';a.phase='finished';a.deadline=null;r.result={type:'cheese',aborted:true,winners:[]};
  }else if(action==='roll'){
   if(a.phase!=='prepare'||a.rolled?.[id])return false;a.rolled||={};a.rolled[id]=true;
  }else if(action==='wake'){
   if(a.phase!=='prepare'||!a.rolled?.[id]||id===a.thief||!a.dice[id].includes(value)||a.ready?.[id])return false;
   a.wake||={};a.wake[id]=value;
  }else if(action==='ready'){
   if(a.phase!=='prepare'||!a.rolled?.[id]||a.ready?.[id]||(id!==a.thief&&a.order.length===4&&!a.wake?.[id]))return false;
   a.ready||={};a.ready[id]=true;a.wake||={};if(id!==a.thief&&a.order.length!==4)a.wake[id]=a.dice[id][0];
   if(a.order.every(p=>a.ready[p])){a.hour=1;enterHour(a,now);}
  }else if(action==='peek'){
   if(a.phase!=='night'||now>=a.deadline||a.order.length===4||id===a.thief||awakeIds(a).length!==1||!awakeIds(a).includes(id)||!a.order.includes(value)||value===id||a.peeks?.[id])return false;
   a.peeks||={};a.peeks[id]={target:value,value:a.dice[value][0],hour:a.hour};
  }else if(action==='followers'){
   if(id!==a.thief||!['night','recruit'].includes(a.phase)||now>=a.deadline||!a.recruitCount||a.followers?.length||!Array.isArray(value)||value.length!==a.recruitCount||new Set(value).size!==value.length||!value.every(p=>a.recruitEligible.includes(p)))return false;
   assignFollowers(a,value);if(a.phase==='recruit'){a.phase='intel';a.deadline=now+10000;}
  }else if(action==='call_vote'){
   if(a.phase!=='discuss'||id!==r.hostId)return false;a.phase='vote';a.votes={};a.deadline=now+120000;
  }else if(action==='vote'){
   if(a.phase!=='vote'||now>=a.deadline||!a.order.includes(value)||value===id||a.votes?.[id])return false;
   a.votes||={};a.votes[id]=value;if(a.order.every(p=>a.votes[p]))finish(r);
  }else if(action==='tick'){
   if(id!==r.hostId||!a.deadline||now<a.deadline)return false;
   if(a.phase==='night'){
    if(a.order.length===5&&a.recruitCount&&!a.followers?.length)assignFollowers(a,a.recruitEligible.slice(0,1));
    if(a.hour<6){a.hour++;enterHour(a,now);}else finishNight(a,now);
   }else if(a.phase==='recruit'){
    assignFollowers(a,a.recruitEligible.slice(0,a.recruitCount));a.phase='intel';a.deadline=now+10000;
   }else if(a.phase==='intel'){a.phase='discuss';a.deadline=now+a.discussSeconds*1000;}
   else if(a.phase==='discuss'){a.phase='vote';a.deadline=now+120000;}
   else if(a.phase==='vote')finish(r);else return false;
  }else return false;
  a.revision++;return true;
 }
 function intel(r,id){
  const a=r.cheese,role=r.roles?.[id],follower=a.followers?.includes(id),knowsThief=id===a.thief||follower&&a.order.length!==7;
  return {baseRole:role,role:follower?'follower':role,dice:a.rolled?.[id]?a.dice[id]:[],wake:wakeHours(a,id),ready:!!a.ready?.[id],awake:a.phase==='night'&&awakeIds(a).includes(id),sightings:Object.fromEntries(Object.entries(a.sightings?.[id]||{}).map(([key,s])=>[key,{...s,peers:s.peers||[]}])),peek:a.peeks?.[id]||null,knownThief:knowsThief?a.thief:null,knownFollowers:id===a.thief||follower?a.followers||[]:[],...(id===a.thief?{eligible:a.recruitEligible||[],recruitCount:a.recruitCount||0}:{})};
 }
 function nextBot(r,now,rng=Math.random){
  const a=r?.cheese;if(r?.status!=='cheese_playing'||!a)return null;
  const pick=xs=>xs[Math.floor(rng()*xs.length)],action=(id,type,value)=>({id,type,value});
  if(a.deadline&&now>=a.deadline)return action(r.hostId,'tick');
  for(const id of a.order){if(!r.players?.[id]?.bot)continue;const info=intel(r,id);
   if(a.phase==='prepare'){
    if(!a.rolled?.[id])return action(id,'roll');
    if(a.order.length===4&&id!==a.thief&&!a.wake?.[id])return action(id,'wake',pick(info.dice));
    if(!a.ready?.[id])return action(id,'ready');
   }
   if(['night','recruit'].includes(a.phase)&&info.eligible?.length&&info.recruitCount&&!a.followers?.length)return action(id,'followers',mix(info.eligible,rng).slice(0,info.recruitCount));
   if(a.phase==='night'&&info.awake&&info.role!=='thief'&&a.order.length>4&&!info.peek&&Object.values(info.sightings).some(s=>s.hour===a.hour&&!s.peers.length))return action(id,'peek',pick(a.order.filter(p=>p!==id)));
   if(a.phase==='vote'&&!a.votes?.[id]){
    const witness=Object.values(info.sightings).find(s=>s.witness)?.witness;
    const choices=a.order.filter(p=>p!==id&&(!['thief','follower'].includes(info.role)||p!==info.knownThief&&!info.knownFollowers.includes(p)));
    return action(id,'vote',info.role==='fall'?pick(a.order.filter(p=>p!==id)):!['thief','follower'].includes(info.role)&&witness?witness:pick(choices.length?choices:a.order.filter(p=>p!==id)));
   }
  }return null;
 }
 function bots(r,id,action){
  if(r?.gameMode!=='cheese'||r.status!=='lobby'||r.hostId!==id||!r.players?.[id]||r.players[id].bot)return false;
  const cap=Number(r.cheeseCount||4);if(cap<4||cap>8||!Number.isInteger(cap))return false;
  r.playerProfiles||={};r.scores||={};
  if(action==='remove'){const all=Object.keys(r.players).filter(p=>r.players[p].bot);if(!all.length)return false;for(const p of all){delete r.players[p];delete r.playerProfiles[p];delete r.scores[p];}}
  else if(['add','fill'].includes(action)){const count=Math.min(cap-Object.keys(r.players).length,action==='add'?1:cap);if(count<=0)return false;for(let j=0;j<count;j++){let i=1;while(r.players['cheese_bot_'+i])i++;const p='cheese_bot_'+i,bot={name:'Bot '+i,avatar:'robot',bot:true};r.players[p]=bot;r.playerProfiles[p]=bot;r.scores[p]??=0;}}
  else return false;return true;
 }
 const api={setup,apply,intel,nextBot,bots,wakeHours,awakeIds};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CheeseEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
