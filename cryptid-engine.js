/* Cryptid Beta: original procedural map, pure rules and bot inference.
 * Beta uses the hub's existing shared RTDB room. Clues are UI-private only;
 * do not use this client-authoritative mode for competitive/untrusted play.
 */
(function(root){
 'use strict';
 const TERRAIN={forest:'ป่า',water:'น้ำ',mountain:'ภูเขา',swamp:'หนองบึง',desert:'ทะเลทราย'};
 const MAPS={
  random:{name:'สุ่มแผนที่',description:'สร้างผังใหม่ทุกเกม'},
  mistwood:{name:'ป่าหมอก',stage:1,seed:1847,theme:'forest',description:'ป่าเขียวสลับภูมิประเทศหลากหลาย'},
  highlands:{name:'หุบเขาหิน',stage:2,seed:9203,theme:'mountain',description:'แนวภูเขาและร่องรอยสัตว์ลึกลับ'},
  wetlands:{name:'ลุ่มน้ำลึกลับ',stage:3,seed:4171,theme:'water',description:'สายน้ำตัดผ่านพื้นที่สำรวจ'},
  sunlands:{name:'ทะเลทรายตะวัน',stage:4,seed:7341,theme:'desert',description:'ผืนทรายกว้างกับสิ่งปลูกสร้างปริศนา'},
  shadowfen:{name:'หนองเงียบ',stage:5,seed:6089,theme:'swamp',description:'พื้นที่ชุ่มน้ำและเขตสัตว์ซ่อนตัว'},
  crossroads:{name:'ดินแดนรอยต่อ',stage:6,seed:1207,description:'ภูมิประเทศทั้งห้าแบบผสมกัน'}
 };
 function seeded(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
 const COLORS=['#66d9ef','#ffbd69','#c4a1ff','#76e3a0','#ff8ea8'];
 const copy=v=>JSON.parse(JSON.stringify(v));
 const mix=(xs,rng=Math.random)=>{const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const distance=(a,b)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r));
 const coordinate=c=>String.fromCharCode(65+c.col)+(c.row+1);
 function makeBoard(rng,theme){
  const types=[...Object.keys(TERRAIN),...(theme?[theme,theme]:[])],board=[];
  for(let row=0;row<9;row++)for(let col=0;col<12;col++){
   const previous=col>0?board[board.length-1]:null,above=row>0?board[(row-1)*12+col]:null;
   const terrain=rng()<.38&&previous?previous.terrain:rng()<.32&&above?above.terrain:types[Math.floor(rng()*types.length)];
   board.push({id:'c'+board.length,col,row,q:col-Math.floor(row/2),r:row,terrain});
  }
  const centers=mix(board,rng).slice(0,2);
  board.forEach(c=>{const animal=centers.findIndex(p=>distance(c,p)<=1);if(animal>=0)c.animal=animal===0?'bear':'cougar';});
  mix(board,rng).slice(0,6).forEach((c,i)=>{c.structure=i%2===0?'stone':'shack';c.structureColor=['white','green','blue'][Math.floor(i/2)];});
  return board;
 }
 const catalogueCache=new WeakMap();
 function clueCatalogue(board){
  if(catalogueCache.has(board))return catalogueCache.get(board);
  const out=[],types=Object.keys(TERRAIN);
  function add(id,text,fn,negative=false){out.push({id,text,negative,cells:board.filter(fn).map(c=>c.id)});}
  function pair(id,text,negativeText,fn){add(id,text,fn);add('not_'+id,negativeText,c=>!fn(c),true);}
  function near(filter,n){const targets=board.filter(filter);return c=>targets.some(p=>distance(c,p)<=n);}
  types.forEach(t=>add('not_terrain_'+t,'ไม่อยู่ใน'+TERRAIN[t],c=>c.terrain!==t,true));
  for(let i=0;i<types.length;i++)for(let j=i+1;j<types.length;j++)pair('terrain_'+types[i]+'_'+types[j],'อยู่บน'+TERRAIN[types[i]]+' หรือ'+TERRAIN[types[j]],'ไม่อยู่ใน'+TERRAIN[types[i]]+' และไม่อยู่ใน'+TERRAIN[types[j]],c=>[types[i],types[j]].includes(c.terrain));
  types.forEach(t=>pair('near_'+t,'อยู่ห่างจาก'+TERRAIN[t]+'ไม่เกิน 1 ช่อง','ไม่อยู่ในระยะ 1 ช่องจาก'+TERRAIN[t]+' (ต้องห่างอย่างน้อย 2 ช่อง)',near(c=>c.terrain===t,1)));
  pair('animal_any','อยู่ห่างจากเขตหมีหรือเสือพูมาไม่เกิน 1 ช่อง','ไม่อยู่ในระยะ 1 ช่องจากเขตหมีและเขตเสือพูมา (ต้องห่างอย่างน้อย 2 ช่องจากทั้งสองเขต)',near(c=>!!c.animal,1));
  for(const [s,label] of [['stone','เสาหิน'],['shack','กระท่อม']])pair('structure_'+s,'อยู่ห่างจาก'+label+'ไม่เกิน 2 ช่อง (สีใดก็ได้)','ไม่อยู่ในระยะ 2 ช่องจาก'+label+'ทุกสี (ต้องห่างอย่างน้อย 3 ช่อง)',near(c=>c.structure===s,2));
  for(const [s,label] of [['bear','หมี'],['cougar','เสือพูมา']])pair('animal_'+s,'อยู่ห่างจากเขต'+label+'ไม่เกิน 2 ช่อง','ไม่อยู่ในระยะ 2 ช่องจากเขต'+label+' (ต้องห่างอย่างน้อย 3 ช่อง)',near(c=>c.animal===s,2));
  for(const [s,label] of [['white','ขาว'],['green','เขียว'],['blue','น้ำเงิน']])pair('color_'+s,'อยู่ห่างจากสิ่งปลูกสร้างสี'+label+'ไม่เกิน 3 ช่อง','ไม่อยู่ในระยะ 3 ช่องจากสิ่งปลูกสร้างสี'+label+' (ต้องห่างอย่างน้อย 4 ช่อง)',near(c=>c.structureColor===s,3));
  catalogueCache.set(board,out);return out;
 }
 function mapBoard(mapId){const map=MAPS[mapId];if(!map||mapId==='random')return null;return makeBoard(seeded(map.seed),map.theme);}
 function generate(count,rng=Math.random,mapId='random'){
  if(![3,4,5].includes(count))throw new Error('Cryptid รองรับ 3–5 คน');
  if(!MAPS[mapId])throw new Error('ไม่พบแผนที่ที่เลือก');
  const fixedBoard=mapBoard(mapId);
  for(let map=0;map<40;map++){
   const board=fixedBoard||makeBoard(rng),catalogue=clueCatalogue(board).filter(c=>c.cells.length>=6&&c.cells.length<=90);
   for(let attempt=0;attempt<180;attempt++){
    const target=board[Math.floor(rng()*board.length)].id;
    const eligible=mix(catalogue.filter(c=>c.cells.includes(target)),rng);if(eligible.length<count)continue;
    const clues=eligible.slice(0,count),intersection=board.filter(c=>clues.every(clue=>clue.cells.includes(c.id)));
    if(intersection.length!==1)continue;
    return {mapId,mapName:MAPS[mapId].name,board,clues:clues.map(({id,text})=>({id,text})),solution:intersection[0].id};
   }
  }
  throw new Error('สร้างปริศนาไม่สำเร็จ กรุณากดเริ่มใหม่');
 }
 function clueFor(a,id){return clueCatalogue(a.board).find(c=>c.id===a.clues?.[id]?.id);}
 function allows(a,id,cell){return !!clueFor(a,id)?.cells.includes(cell);}
 function blocked(a,cell){return Object.values(a.markers?.[cell]||{}).includes('no');}
 function legalCells(a,id,yes){return a.board.filter(c=>!blocked(a,c.id)&&!a.markers?.[c.id]?.[id]&&allows(a,id,c.id)===yes).map(c=>c.id);}
 function log(a,type,data={}){a.eventNo=(a.eventNo||0)+1;a.history||={};a.history['e'+a.eventNo]={type,turn:a.turn||0,...data};}
 function mark(a,id,cell,yes){a.markers||={};a.markers[cell]||={};a.markers[cell][id]=yes?'yes':'no';}
 function setup(r,ids,puzzle,order=ids){
  if(!r||r.status!=='lobby'||r.gameMode!=='cryptid'||![3,4,5].includes(ids.length)||puzzle?.clues?.length!==ids.length||order.length!==ids.length||new Set(order).size!==ids.length||!order.every(id=>ids.includes(id)))return false;
  const cat=clueCatalogue(puzzle.board),chosen=puzzle.clues.map(c=>cat.find(v=>v.id===c.id));
  if(chosen.some(c=>!c)||new Set(chosen.map(c=>c.id)).size!==ids.length)return false;
  const common=puzzle.board.filter(c=>chosen.every(clue=>clue.cells.includes(c.id)));
  if(common.length!==1||common[0].id!==puzzle.solution)return false;
  r.gamePlayers=copy(r.players);r.playerProfiles={...(r.playerProfiles||{}),...copy(r.players)};
  r.gamesPlayed=(Number(r.gamesPlayed)||0)+1;r.result=null;r.status='cryptid_playing';
  r.cryptid={version:1,mapId:puzzle.mapId||'random',mapName:puzzle.mapName||'สุ่มแผนที่',board:copy(puzzle.board),clues:Object.fromEntries(order.map((id,i)=>[id,copy(puzzle.clues[i])])),solution:puzzle.solution,order:[...order],ready:{},phase:'ready',revision:0,initialIndex:0,turnIndex:0,turn:1,markers:{},history:{},eventNo:0};
  return true;
 }
 function actor(a){return a.phase==='initial'?a.order[(a.initialIndex||0)%a.order.length]:a.order[a.turnIndex||0];}
 function nextTurn(a){a.turnIndex=((a.turnIndex||0)+1)%a.order.length;a.turn=(a.turn||1)+1;a.phase='action';delete a.search;}
 function penalty(a,id){
  if(legalCells(a,id,false).length)a.phase='penalty';
  else{log(a,'exhausted',{by:id,piece:'no'});nextTurn(a);}
 }
 function finish(r,id,cell){
  const a=r.cryptid;if(r.status==='results')return;
  r.status='results';a.phase='finished';r.result={type:'cryptid',winner:id,cell,points:1};
  r.scores||={};r.scores[id]=(Number(r.scores[id])||0)+1;log(a,'win',{by:id,cell});
 }
 function beginSearch(r){
  const a=r.cryptid,s=a.search,id=a.order[a.turnIndex];
  if(!a.markers?.[s.cell]?.[id])mark(a,id,s.cell,true);
  a.phase='search';s.index=1;log(a,'search',{by:id,cell:s.cell});
 }
 function apply(r,id,action,value,revision){
  if(!r||r.gameMode!=='cryptid'||!r.cryptid||!r.players?.[id]||!r.cryptid.order.includes(id))return false;
  const a=r.cryptid;if(revision!=null&&a.revision!==revision)return false;
  if(action==='abort'){
   if(r.hostId!==id||r.status!=='cryptid_playing')return false;
   r.status='results';a.phase='finished';r.result={type:'cryptid',aborted:true,points:0};log(a,'abort',{by:id});
  }else if(r.status!=='cryptid_playing')return false;
  else if(action==='ready'){
   if(a.phase!=='ready'||a.ready?.[id])return false;
   a.ready||={};a.ready[id]=true;
   if(a.order.every(p=>a.ready[p]))a.phase='initial';
  }else if(action==='initial'||action==='penalty'||action==='extra'){
   const expected={initial:'initial',penalty:'penalty',extra:'extra'}[action];
   if(a.phase!==expected||actor(a)!==id||!legalCells(a,id,action==='extra').includes(value))return false;
   mark(a,id,value,action==='extra');log(a,action,{by:id,cell:value});
   if(action==='initial'){a.initialIndex=(a.initialIndex||0)+1;if(a.initialIndex>=a.order.length*2)a.phase='action';}
   else if(action==='extra')beginSearch(r);
   else nextTurn(a);
  }else if(action==='question'){
   const cell=value?.cell,target=value?.target;
   if(a.phase!=='action'||actor(a)!==id||!a.board.some(c=>c.id===cell)||blocked(a,cell)||target===id||!a.order.includes(target)||a.markers?.[cell]?.[target])return false;
   const yes=allows(a,target,cell);mark(a,target,cell,yes);log(a,'question',{by:id,target,cell,yes});
   if(yes)nextTurn(a);else penalty(a,id);
  }else if(action==='search'){
   if(a.phase!=='action'||actor(a)!==id||!a.board.some(c=>c.id===value)||blocked(a,value)||!allows(a,id,value))return false;
   a.search={cell:value,index:0};
   if(a.markers?.[value]?.[id]&&legalCells(a,id,true).length)a.phase='extra';
   else{if(a.markers?.[value]?.[id])log(a,'exhausted',{by:id,piece:'yes'});beginSearch(r);}
  }else if(action==='reveal'){
   if(a.phase!=='search'||id!==r.hostId||!a.search)return false;
   const s=a.search,searcher=actor(a);
   // Skip existing discs without publishing any additional private clue data.
   while(s.index<a.order.length&&a.markers?.[s.cell]?.[a.order[(a.turnIndex+s.index)%a.order.length]]==='yes')s.index++;
   if(s.index>=a.order.length)finish(r,searcher,s.cell);
   else{
    const target=a.order[(a.turnIndex+s.index)%a.order.length],yes=allows(a,target,s.cell);
    mark(a,target,s.cell,yes);log(a,'response',{by:target,cell:s.cell,yes});s.index++;
    if(!yes)penalty(a,searcher);
    else if(s.index>=a.order.length)finish(r,searcher,s.cell);
   }
  }else return false;
  a.revision=(a.revision||0)+1;return true;
 }
 function manageBots(r,host,action){
  if(!r||r.gameMode!=='cryptid'||r.status!=='lobby'||r.hostId!==host||!r.players?.[host]||r.players[host].bot)return false;
  const cap=Number(r.cryptidCount||3);if(![3,4,5].includes(cap))return false;
  r.playerProfiles||={};r.scores||={};
  if(action==='remove'){
   const bots=Object.keys(r.players).filter(p=>r.players[p].bot);if(!bots.length)return false;
   for(const p of bots){delete r.players[p];delete r.playerProfiles[p];delete r.scores[p];}
  }else if(action==='add'||action==='fill'){
   const count=Math.min(cap-Object.keys(r.players).length,action==='add'?1:cap);if(count<=0)return false;
   for(let j=0;j<count;j++){let n=1;while(r.players['cryptid_bot_'+n])n++;
    const id='cryptid_bot_'+n,p={name:'Bot '+n,avatar:'robot',bot:true};r.players[id]=p;r.playerProfiles[id]=p;r.scores[id]??=0;if(r.kickedPlayers)delete r.kickedPlayers[id];
   }
  }else return false;
  return true;
 }
 // The bot receives its own clue plus the public board/markers, never the solution
 // or another player's actual clue. Infer each opponent's possible clues from marks.
 function botMove(view,id,rng=Math.random){
  const a=view,cat=clueCatalogue(a.board),own=cat.find(c=>c.id===a.clues?.[id]?.id);if(!own)return null;
  const pick=xs=>xs.length?xs[Math.floor(rng()*xs.length)]:null;
  if(['initial','penalty','extra'].includes(a.phase)){
   const cell=pick(legalCells(a,id,a.phase==='extra'));return cell?{id,type:a.phase==='extra'?'extra':a.phase,value:cell}:null;
  }
  if(a.phase!=='action')return null;
  const options={};
  for(const p of a.order.filter(p=>p!==id))options[p]=cat.filter(clue=>Object.entries(a.markers||{}).every(([cell,m])=>!m[p]||(clue.cells.includes(cell)===(m[p]==='yes'))));
  const candidates=own.cells.filter(cell=>!blocked(a,cell)&&Object.values(options).every(cs=>cs.some(c=>c.cells.includes(cell))));
  const possible=candidates.length?candidates:own.cells.filter(cell=>!blocked(a,cell));
  if(!possible.length)return null;
  if(possible.length<=2||rng()<.15)return {id,type:'search',value:pick(possible)};
  let best=null,bestScore=-1;
  for(const cell of mix(possible,rng))for(const [target,clues] of Object.entries(options)){
   if(a.markers?.[cell]?.[target]||!clues.length)continue;
   const yes=clues.filter(c=>c.cells.includes(cell)).length/clues.length,score=yes*(1-yes);
   if(score>bestScore){bestScore=score;best={id,type:'question',value:{cell,target}};}
  }
  return bestScore>0?best:{id,type:'search',value:pick(possible)};
 }
 function nextBotAction(r,rng=Math.random){
  if(r?.gameMode!=='cryptid'||r.status!=='cryptid_playing')return null;
  const a=r.cryptid,bot=p=>!!r.players?.[p]?.bot;
  if(a.phase==='search')return {id:r.hostId,type:'reveal'};
  if(a.phase==='ready'){const id=a.order.find(p=>bot(p)&&!a.ready?.[p]);return id?{id,type:'ready'}:null;}
  const id=actor(a);if(!bot(id))return null;
  const view={board:a.board,markers:a.markers||{},order:a.order,phase:a.phase,clues:{[id]:a.clues[id]}};
  return botMove(view,id,rng);
 }
 const api={TERRAIN,COLORS,MAPS,mapBoard,distance,coordinate,clueCatalogue,generate,setup,apply,allows,blocked,legalCells,actor,manageBots,botMove,nextBotAction,mix};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CryptidEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
