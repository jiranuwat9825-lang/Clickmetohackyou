/* Cryptid Beta: original procedural map, pure rules and bot inference.
 * Beta uses the hub's existing shared RTDB room. Clues are UI-private only;
 * do not use this client-authoritative mode for competitive/untrusted play.
 */
(function(root){
 'use strict';
 const TERRAIN={forest:'ป่า',water:'น้ำ',mountain:'ภูเขา',swamp:'หนองบึง',desert:'ทะเลทราย'};
 const DEEP_TERRAIN={reef:'แนวปะการัง',kelp:'ป่าสาหร่าย',plain:'พื้นทรายใต้ทะเล',vent:'ปล่องน้ำร้อน',trench:'ร่องลึก'};
 const VOLCANO_TERRAIN={lava:'ลาวา',basalt:'ลานหินบะซอลต์',ash:'ทุ่งเถ้าถ่าน',crater:'ปากปล่อง',sulfur:'บ่อกำมะถัน'};
 // Distinct unordered eligible clue sets with one solution for the seeded layouts.
 // Counts cover 2–5 players; swapping the recipients does not add a pattern.
 const MAPS={
  random:{name:'สุ่มแผนที่',description:'สร้างผังใหม่ทุกเกม'},
  mistwood:{puzzleCounts:{2:8,"3":391,"4":10413,"5":107191},name:'ป่าหมอก',stage:1,seed:1847,theme:'forest',description:'ป่าเขียวสลับภูมิประเทศหลากหลาย'},
  highlands:{puzzleCounts:{2:11,"3":709,"4":14401,"5":134950},name:'หุบเขาหิน',stage:2,seed:9203,theme:'mountain',description:'แนวภูเขาและร่องรอยสัตว์ลึกลับ'},
  wetlands:{puzzleCounts:{2:10,"3":443,"4":9709,"5":96065},name:'ลุ่มน้ำลึกลับ',stage:3,seed:4171,theme:'water',description:'สายน้ำตัดผ่านพื้นที่สำรวจ'},
  sunlands:{puzzleCounts:{2:6,"3":305,"4":9924,"5":143253},name:'ทะเลทรายตะวัน',stage:4,seed:7341,theme:'desert',description:'ผืนทรายกว้างกับสิ่งปลูกสร้างปริศนา'},
  shadowfen:{puzzleCounts:{2:2,"3":253,"4":8491,"5":114443},name:'หนองเงียบ',stage:5,seed:6089,theme:'swamp',description:'พื้นที่ชุ่มน้ำและเขตสัตว์ซ่อนตัว'},
  crossroads:{puzzleCounts:{2:8,"3":416,"4":11131,"5":130997},name:'ดินแดนรอยต่อ',stage:6,seed:1207,description:'ภูมิประเทศทั้งห้าแบบผสมกัน'},
  island:{puzzleCounts:{2:7,3:351,4:10042,5:122511},name:'เกาะกลางน้ำ',stage:7,seed:7117,layout:'island',collection:'original',description:'ผืนน้ำล้อมป่าและพื้นที่บนเกาะ'},
  ridge:{puzzleCounts:{2:11,3:510,4:12259,5:135321},name:'แนวหินแบ่งแดน',stage:8,seed:8231,layout:'ridge',collection:'original',description:'แนวภูเขาพาดผ่านภูมิประเทศสองฝั่ง'},
  fenring:{puzzleCounts:{2:7,3:399,4:11937,5:145281},name:'วงแหวนหนองบึง',stage:9,seed:9349,layout:'fenring',collection:'original',description:'หนองบึงล้อมพื้นที่กลางแผนที่'},
  fivezones:{puzzleCounts:{2:7,3:270,4:5628,5:59986},name:'ห้าถิ่น',stage:10,seed:10513,layout:'fivezones',collection:'original',description:'ภูมิประเทศทั้งห้าเรียงเป็นเขต'},
  relictrail:{puzzleCounts:{2:8,3:372,4:10403,5:115171},name:'เส้นทางโบราณ',stage:11,seed:11621,layout:'relictrail',collection:'original',description:'เสาหินและกระท่อมเรียงตามแนวทาง'},
  abyss:{puzzleCounts:{2:4,3:387,4:13787,5:180497},name:'ใต้ทะเลลึก',stage:1,seed:12491,layout:'abyss',collection:'creative',description:'ปะการัง ป่าสาหร่าย ร่องลึก และซากเรือ'},
  searift:{puzzleCounts:{2:23,3:893,4:18787,5:205203},name:'รอยแยกก้นทะเล',stage:2,seed:13537,layout:'searift',collection:'creative',description:'ร่องลึกพาดกลางระหว่างปล่องน้ำร้อน'},
  wreckyard:{puzzleCounts:{2:17,3:644,4:15781,5:186259},name:'สุสานเรือจม',stage:3,seed:14621,layout:'wreckyard',collection:'creative',description:'ซากเรือกระจุกตัวบนพื้นทรายมืด'},
  coralcity:{puzzleCounts:{2:11,3:543,4:15532,5:205196},name:'เมืองปะการัง',stage:4,seed:15733,layout:'coralcity',collection:'creative',description:'แนวปะการังแบ่งเป็นเขตและทางเชื่อม'},
  kelpmaze:{puzzleCounts:{2:13,3:585,4:13491,5:151341},name:'เขาวงกตสาหร่าย',stage:5,seed:16811,layout:'kelpmaze',collection:'creative',description:'ทางสาหร่ายคดเคี้ยวซ่อนพื้นที่ลับ'},
  sinkhole:{puzzleCounts:{2:29,3:1058,4:21975,5:226780},name:'หลุมลึกกลางสมุทร',stage:6,seed:17903,layout:'sinkhole',collection:'creative',description:'ชั้นภูมิประเทศล้อมร่องลึกใจกลาง'},
  lavavalley:{puzzleCounts:{2:10,3:594,4:17033,5:200272},name:'หุบเขาลาวา',stage:1,seed:19013,layout:'lavavalley',collection:'volcano',description:'ธารลาวาตัดผ่านลานหินและเถ้าถ่าน'},
  craterring:{puzzleCounts:{2:13,3:753,4:17181,5:184858},name:'วงแหวนปากปล่อง',stage:2,seed:20117,layout:'craterring',collection:'volcano',description:'ภูมิประเทศเรียงเป็นวงรอบปากปล่อง'},
  ashentemple:{puzzleCounts:{2:5,3:394,4:14555,5:217471},name:'วิหารเถ้าถ่าน',stage:3,seed:21221,layout:'ashentemple',collection:'volcano',description:'วิหารร้างกลางทุ่งเถ้ากับทางลาวา'}
 };
 function seeded(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
 const COLORS=['#66d9ef','#ffbd69','#c4a1ff','#76e3a0','#ff8ea8'];
 const copy=v=>JSON.parse(JSON.stringify(v));
 const mix=(xs,rng=Math.random)=>{const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const distance=(a,b)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r));
 const coordinate=c=>String.fromCharCode(65+c.col)+(c.row+1);
 const isDeepSea=board=>board?.[0]?.biome==='deepsea';
 const isVolcano=board=>board?.[0]?.biome==='volcano';
 function deepTerrain(layout,col,row){
  if(layout==='searift'){
   const line=7-row-col*.45,gap=Math.abs(line);
   return gap<.65?'trench':gap<1.55?'vent':col<4?'reef':row<4?'kelp':'plain';
  }
  if(layout==='wreckyard')return row>=7?'trench':col>=10?'vent':row<=1?'kelp':(col<2||col>8)&&row<5?'reef':'plain';
  if(layout==='coralcity'){
   if(row===4||col===5||col===6)return 'plain';
   if(row>=7)return 'trench';if(col>=10)return 'vent';if(row<=1&&col>6)return 'kelp';return 'reef';
  }
  if(layout==='kelpmaze'){
   if(row===8)return 'trench';if(col===11)return 'vent';if((col+row*2)%7===0)return 'reef';
   return (col+Math.floor(row/2))%4<2?'kelp':'plain';
  }
  if(layout==='sinkhole'){
   const radius=Math.hypot((col-5.5)/5.7,(row-4)/4.5);
   return radius<.28?'trench':radius<.46?'vent':radius<.64?'plain':radius<.84?'kelp':'reef';
  }
  return row>=6?'trench':col<4?'reef':col>=9?'vent':row<=2?'kelp':'plain';
 }
 function makeAbyssBoard(rng,layout='abyss'){
  const board=[],types=Object.keys(DEEP_TERRAIN);
  for(let row=0;row<9;row++)for(let col=0;col<12;col++){
   const terrain=rng()<(layout==='abyss'?.1:.08)?types[Math.floor(rng()*types.length)]:deepTerrain(layout,col,row);
   board.push({id:'c'+board.length,col,row,q:col-Math.floor(row/2),r:row,terrain,biome:'deepsea'});
  }
  const centersByLayout={searift:[[1,2],[9,6]],wreckyard:[[2,6],[8,2]],coralcity:[[2,2],[9,6]],kelpmaze:[[3,5],[9,2]],sinkhole:[[1,4],[10,4]]};
  const centers=(centersByLayout[layout]||[[2,2],[9,6]]).map(([col,row])=>board[row*12+col]);
  board.forEach(c=>{const animal=centers.findIndex(p=>distance(c,p)<=1);if(animal>=0)c.animal=animal===0?'jelly':'squid';});
  const featuresByLayout={
   searift:[[1,1],[3,6],[5,2],[7,5],[9,1],[10,7]],wreckyard:[[3,3],[1,1],[5,4],[10,2],[7,5],[10,7]],
   coralcity:[[1,2],[5,1],[3,6],[6,5],[9,2],[10,7]],kelpmaze:[[1,6],[2,1],[5,3],[7,6],[9,1],[10,5]],
   sinkhole:[[1,1],[5,2],[2,7],[6,6],[10,1],[10,7]]
  };
  (featuresByLayout[layout]||[[1,4],[3,7],[5,1],[7,5],[9,2],[10,7]]).forEach(([col,row],i)=>{const c=board[row*12+col];c.structure=i%2===0?'wreck':'beacon';c.structureColor=['cyan','violet','amber'][Math.floor(i/2)];});
  return board;
 }
 function volcanoTerrain(layout,col,row){
  if(layout==='lavavalley'){
   const gap=Math.abs(row-(1+col*.55));
   if(gap<.7)return 'lava';if(gap<1.55)return 'basalt';
   return col<3&&row>4?'crater':col>8&&row<4?'sulfur':'ash';
  }
  if(layout==='craterring'){
   const radius=Math.hypot((col-5.5)/5.7,(row-4)/4.5);
   return radius<.25?'crater':radius<.44?'lava':radius<.62?'basalt':radius<.82?'sulfur':'ash';
  }
  if(row===4||col===5)return 'basalt';
  if(row>=6)return 'lava';if(col>=9)return 'sulfur';if(row<=1&&col<3)return 'crater';return 'ash';
 }
 function makeVolcanoBoard(rng,layout){
  const board=[],types=Object.keys(VOLCANO_TERRAIN);
  for(let row=0;row<9;row++)for(let col=0;col<12;col++){
   const terrain=rng()<.08?types[Math.floor(rng()*types.length)]:volcanoTerrain(layout,col,row);
   board.push({id:'c'+board.length,col,row,q:col-Math.floor(row/2),r:row,terrain,biome:'volcano'});
  }
  const centersByLayout={lavavalley:[[1,2],[10,6]],craterring:[[2,4],[9,4]],ashentemple:[[2,2],[9,6]]};
  centersByLayout[layout].map(([col,row])=>board[row*12+col]).forEach((center,i)=>board.forEach(c=>{if(distance(c,center)<=1)c.animal=i===0?'salamander':'phoenix';}));
  const featuresByLayout={
   lavavalley:[[1,6],[2,1],[4,5],[6,1],[8,6],[10,2]],craterring:[[1,1],[5,2],[2,7],[6,6],[10,1],[10,7]],
   ashentemple:[[3,3],[1,6],[5,4],[7,1],[8,5],[10,7]]
  };
  featuresByLayout[layout].forEach(([col,row],i)=>{const c=board[row*12+col];c.structure=i%2===0?'temple':'tower';c.structureColor=['ember','obsidian','gold'][Math.floor(i/2)];});
  return board;
 }
 function layoutTerrain(layout,col,row){
  if(layout==='island'){
   const edge=((col-5.5)/6.7)**2+((row-4)/5)**2;
   return edge>=.68?'water':col<4?'swamp':col>7?'mountain':row>=6?'desert':'forest';
  }
  if(layout==='ridge')return Math.abs(row-(1.5+col*.47))<=.85?'mountain':row<1.5+col*.47?(col<6?'forest':'swamp'):(col<6?'water':'desert');
  if(layout==='fenring'){
   const radius=Math.hypot((col-5.5)/5.8,(row-4)/4.8);
   return radius>.38&&radius<.72?'swamp':radius<=.38?'water':col<4?'forest':col>8?'mountain':row>5?'desert':'forest';
  }
  if(layout==='fivezones')return ['forest','water','mountain','desert','swamp'][Math.min(4,Math.floor((col+row*.7)/3.5))];
  if(layout==='relictrail')return row<3?'mountain':row>5?'swamp':col<4?'forest':col>7?'desert':'water';
  return null;
 }
 function makeBoard(rng,theme,layout){
  const types=[...Object.keys(TERRAIN),...(theme?[theme,theme]:[])],board=[];
  for(let row=0;row<9;row++)for(let col=0;col<12;col++){
   const previous=col>0?board[board.length-1]:null,above=row>0?board[(row-1)*12+col]:null;
   const terrain=layout?(rng()<.08?types[Math.floor(rng()*types.length)]:layoutTerrain(layout,col,row)):rng()<.38&&previous?previous.terrain:rng()<.32&&above?above.terrain:types[Math.floor(rng()*types.length)];
   board.push({id:'c'+board.length,col,row,q:col-Math.floor(row/2),r:row,terrain});
  }
  const centers=layout==='relictrail'?[board[7*12+2],board[1*12+9]]:mix(board,rng).slice(0,2);
  board.forEach(c=>{const animal=centers.findIndex(p=>distance(c,p)<=1);if(animal>=0)c.animal=animal===0?'bear':'cougar';});
  const structures=layout==='relictrail'?[[1,1],[3,2],[5,3],[6,5],[8,6],[10,7]].map(([col,row])=>board[row*12+col]):mix(board,rng).slice(0,6);
  structures.forEach((c,i)=>{c.structure=i%2===0?'stone':'shack';c.structureColor=['white','green','blue'][Math.floor(i/2)];});
  return board;
 }
 const catalogueCache=new WeakMap();
 function clueCatalogue(board,count=3){
  const key=count===2?2:3,cached=catalogueCache.get(board);if(cached?.[key])return cached[key];
  const deep=isDeepSea(board),volcano=isVolcano(board),terrainNames=volcano?VOLCANO_TERRAIN:deep?DEEP_TERRAIN:TERRAIN,out=[],types=Object.keys(terrainNames);
  const creatures=volcano?[['salamander','กิ้งก่าไฟ'],['phoenix','นกเพลิง']]:deep?[['jelly','แมงกะพรุน'],['squid','หมึกยักษ์']]:[['bear','หมี'],['cougar','เสือพูมา']];
  const structures=volcano?[['temple','วิหารร้าง'],['tower','หอสังเกตการณ์']]:deep?[['wreck','ซากเรือ'],['beacon','เสาสัญญาณ']]:[['stone','เสาหิน'],['shack','กระท่อม']];
  const colors=volcano?[['ember','แดงเพลิง'],['obsidian','ดำออบซิเดียน'],['gold','ทอง']]:deep?[['cyan','ฟ้า'],['violet','ม่วง'],['amber','ส้ม']]:[['white','ขาว'],['green','เขียว'],['blue','น้ำเงิน']];
  function add(id,text,fn,negative=false){out.push({id,text,negative,cells:board.filter(fn).map(c=>c.id)});}
  function pair(id,text,negativeText,fn){add(id,text,fn);add('not_'+id,negativeText,c=>!fn(c),true);}
  function near(filter,n){const targets=board.filter(filter);return c=>targets.some(p=>distance(c,p)<=n);}
  types.forEach(t=>add('not_terrain_'+t,'ไม่อยู่ใน'+terrainNames[t],c=>c.terrain!==t,true));
  if(count===2)types.forEach(t=>add('duo_terrain_'+t,'อยู่บน'+terrainNames[t],c=>c.terrain===t));
  for(let i=0;i<types.length;i++)for(let j=i+1;j<types.length;j++)pair('terrain_'+types[i]+'_'+types[j],'อยู่บน'+terrainNames[types[i]]+' หรือ'+terrainNames[types[j]],'ไม่อยู่ใน'+terrainNames[types[i]]+' และไม่อยู่ใน'+terrainNames[types[j]],c=>[types[i],types[j]].includes(c.terrain));
  types.forEach(t=>pair('near_'+t,'อยู่ห่างจาก'+terrainNames[t]+'ไม่เกิน 1 ช่อง','ไม่อยู่ในระยะ 1 ช่องจาก'+terrainNames[t]+' (ต้องห่างอย่างน้อย 2 ช่อง)',near(c=>c.terrain===t,1)));
  const creatureLabels=creatures.map(([,label])=>label);
  pair('animal_any','อยู่ห่างจากเขต'+creatureLabels.join('หรือ')+'ไม่เกิน 1 ช่อง','ไม่อยู่ในระยะ 1 ช่องจากเขต'+creatureLabels.join('และเขต')+' (ต้องห่างอย่างน้อย 2 ช่องจากทั้งสองเขต)',near(c=>!!c.animal,1));
  for(const [s,label] of structures)pair('structure_'+s,'อยู่ห่างจาก'+label+'ไม่เกิน 2 ช่อง (สีใดก็ได้)','ไม่อยู่ในระยะ 2 ช่องจาก'+label+'ทุกสี (ต้องห่างอย่างน้อย 3 ช่อง)',near(c=>c.structure===s,2));
  for(const [s,label] of creatures)pair('animal_'+s,'อยู่ห่างจากเขต'+label+'ไม่เกิน 2 ช่อง','ไม่อยู่ในระยะ 2 ช่องจากเขต'+label+' (ต้องห่างอย่างน้อย 3 ช่อง)',near(c=>c.animal===s,2));
  for(const [s,label] of colors)pair('color_'+s,'อยู่ห่างจากสิ่งปลูกสร้างสี'+label+'ไม่เกิน 3 ช่อง','ไม่อยู่ในระยะ 3 ช่องจากสิ่งปลูกสร้างสี'+label+' (ต้องห่างอย่างน้อย 4 ช่อง)',near(c=>c.structureColor===s,3));
  if(deep){
   pair('near_vent_two','อยู่ห่างจากปล่องน้ำร้อนไม่เกิน 2 ช่อง','อยู่ห่างจากปล่องน้ำร้อนอย่างน้อย 3 ช่อง',near(c=>c.terrain==='vent',2));
   pair('near_wreck_one','อยู่ห่างจากซากเรือไม่เกิน 1 ช่อง','อยู่ห่างจากซากเรืออย่างน้อย 2 ช่อง',near(c=>c.structure==='wreck',1));
  }
  if(volcano){
   pair('near_lava_two','อยู่ห่างจากลาวาไม่เกิน 2 ช่อง','อยู่ห่างจากลาวาอย่างน้อย 3 ช่อง',near(c=>c.terrain==='lava',2));
   pair('near_temple_one','อยู่ห่างจากวิหารร้างไม่เกิน 1 ช่อง','อยู่ห่างจากวิหารร้างอย่างน้อย 2 ช่อง',near(c=>c.structure==='temple',1));
  }
  catalogueCache.set(board,{...(cached||{}),[key]:out});return out;
 }
 function mapBoard(mapId){const map=MAPS[mapId];if(!map||mapId==='random')return null;const rng=seeded(map.seed);return map.collection==='creative'?makeAbyssBoard(rng,map.layout):map.collection==='volcano'?makeVolcanoBoard(rng,map.layout):makeBoard(rng,map.theme,map.layout);}
 function generate(count,rng=Math.random,mapId='random'){
  if(![2,3,4,5].includes(count))throw new Error('Cryptid รองรับ 2–5 คน');
  if(!MAPS[mapId])throw new Error('ไม่พบแผนที่ที่เลือก');
  const fixedBoard=mapBoard(mapId);
  for(let map=0;map<40;map++){
   const board=fixedBoard||makeBoard(rng),catalogue=clueCatalogue(board,count).filter(c=>c.cells.length>=6&&c.cells.length<=90);
   if(count===2){
    const pairs=[];for(let i=0;i<catalogue.length;i++)for(let j=i+1;j<catalogue.length;j++){const common=catalogue[i].cells.filter(cell=>catalogue[j].cells.includes(cell));if(common.length===1)pairs.push({clues:[catalogue[i],catalogue[j]],solution:common[0]});}
    if(pairs.length){const pair=pairs[Math.floor(rng()*pairs.length)];return {mapId,mapName:MAPS[mapId].name,board,clues:mix(pair.clues,rng).map(({id,text})=>({id,text})),solution:pair.solution};}continue;
   }
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
 function clueFor(a,id){return clueCatalogue(a.board,a.order?.length).find(c=>c.id===a.clues?.[id]?.id);}
 function allows(a,id,cell){return !!clueFor(a,id)?.cells.includes(cell);}
 function blocked(a,cell){return Object.values(a.markers?.[cell]||{}).includes('no');}
 function legalCells(a,id,yes){return a.board.filter(c=>!blocked(a,c.id)&&!a.markers?.[c.id]?.[id]&&allows(a,id,c.id)===yes).map(c=>c.id);}
 function log(a,type,data={}){a.eventNo=(a.eventNo||0)+1;a.history||={};a.history['e'+a.eventNo]={type,turn:a.turn||0,...data};}
 function mark(a,id,cell,yes){a.markers||={};a.markers[cell]||={};a.markers[cell][id]=yes?'yes':'no';}
 function setup(r,ids,puzzle,order=ids){
  if(!r||r.status!=='lobby'||r.gameMode!=='cryptid'||![2,3,4,5].includes(ids.length)||puzzle?.clues?.length!==ids.length||order.length!==ids.length||new Set(order).size!==ids.length||!order.every(id=>ids.includes(id)))return false;
  const cat=clueCatalogue(puzzle.board,ids.length),chosen=puzzle.clues.map(c=>cat.find(v=>v.id===c.id));
  if(chosen.some(c=>!c)||new Set(chosen.map(c=>c.id)).size!==ids.length)return false;
  const common=puzzle.board.filter(c=>chosen.every(clue=>clue.cells.includes(c.id)));
  if(common.length!==1||common[0].id!==puzzle.solution)return false;
  r.gamePlayers=copy(r.players);r.playerProfiles={...(r.playerProfiles||{}),...copy(r.players)};
  r.gamesPlayed=(Number(r.gamesPlayed)||0)+1;r.result=null;r.status='cryptid_playing';delete r.cryptidClueSet;
  r.cryptid={version:1,botDifficulty:r.cryptidBotDifficulty==='hard'?'hard':'normal',mapId:puzzle.mapId||'random',mapName:puzzle.mapName||'สุ่มแผนที่',board:copy(puzzle.board),clues:Object.fromEntries(order.map((id,i)=>[id,copy(puzzle.clues[i])])),solution:puzzle.solution,order:[...order],ready:{},phase:'ready',revision:0,initialIndex:0,turnIndex:0,turn:1,markers:{},history:{},eventNo:0};
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
  const cap=Number(r.cryptidCount||3);if(![2,3,4,5].includes(cap))return false;
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
  const a=view,cat=clueCatalogue(a.board,a.order.length),own=cat.find(c=>c.id===a.clues?.[id]?.id);if(!own)return null;
  if(a.botDifficulty==='hard')return hardBotMove(a,id,cat,own,rng);
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
 function hardBotMove(a,id,catalogue,own,rng){
  const cat=catalogue.filter(c=>c.cells.length>=6&&c.cells.length<=90),marks=Object.entries(a.markers||{}),sets=new Map(cat.map(c=>[c.id,new Set(c.cells)]));
  const matches=p=>cat.filter(c=>marks.every(([cell,m])=>!m[p]||sets.get(c.id).has(cell)===(m[p]==='yes')));
  const choose=xs=>xs[Math.floor(rng()*xs.length)];
  if(['initial','penalty','extra'].includes(a.phase)){
   const yes=a.phase==='extra',legal=legalCells(a,id,yes),possible=matches(id);let best=[],score=-1;
   for(const cell of legal){const remaining=possible.filter(c=>sets.get(c.id).has(cell)===yes).length;if(remaining>score){score=remaining;best=[cell];}else if(remaining===score)best.push(cell);}
   return best.length?{id,type:a.phase,value:choose(best)}:null;
  }
  if(a.phase!=='action')return null;
  const opponents=a.order.filter(p=>p!==id),options=Object.fromEntries(opponents.map(p=>[p,matches(p).filter(c=>c.id!==own.id)]));
  let cells=own.cells.filter(cell=>!blocked(a,cell)&&opponents.every(p=>options[p].some(c=>sets.get(c.id).has(cell))));
  if(!cells.length)cells=own.cells.filter(cell=>!blocked(a,cell));if(!cells.length)return null;
  const support=Object.fromEntries(opponents.map(p=>[p,cells.map(cell=>options[p].filter(c=>sets.get(c.id).has(cell)))]));
  let weights=cells.map((cell,i)=>opponents.reduce((w,p)=>w*(support[p][i].length/Math.max(1,options[p].length)),1));
  let total=weights.reduce((s,w)=>s+w,0);if(!total){weights=cells.map(()=>1);total=cells.length;}weights=weights.map(w=>w/total);
  const entropy=ws=>{const sum=ws.reduce((s,w)=>s+w,0);return sum?ws.reduce((h,w)=>w?h-w/sum*Math.log2(w/sum):h,0):0;};
  const bestWeight=Math.max(...weights),bestCells=cells.filter((_,i)=>Math.abs(weights[i]-bestWeight)<1e-10);
  if(cells.length===1||bestWeight>=.85)return {id,type:'search',value:choose(bestCells)};
  const prior=entropy(weights);let best=[],bestGain=0;
  for(const q of a.board.filter(c=>!blocked(a,c.id)))for(const target of opponents){
   if(a.markers?.[q.id]?.[target]||!options[target].length)continue;
   const yes=weights.map((w,i)=>{const clues=support[target][i];return w*(clues.length?clues.filter(c=>sets.get(c.id).has(q.id)).length/clues.length:0);});
   const no=weights.map((w,i)=>w-yes[i]),probYes=yes.reduce((s,w)=>s+w,0),gain=prior-probYes*entropy(yes)-(1-probYes)*entropy(no);
   if(gain>bestGain+1e-10){bestGain=gain;best=[{id,type:'question',value:{cell:q.id,target}}];}else if(gain>1e-10&&Math.abs(gain-bestGain)<1e-10)best.push({id,type:'question',value:{cell:q.id,target}});
  }
  return best.length?choose(best):{id,type:'search',value:choose(bestCells)};
 }
 function nextBotAction(r,rng=Math.random){
  if(r?.gameMode!=='cryptid'||r.status!=='cryptid_playing')return null;
  const a=r.cryptid,bot=p=>!!r.players?.[p]?.bot;
  if(a.phase==='search')return {id:r.hostId,type:'reveal'};
  if(a.phase==='ready'){const id=a.order.find(p=>bot(p)&&!a.ready?.[p]);return id?{id,type:'ready'}:null;}
  const id=actor(a);if(!bot(id))return null;
  const view={board:a.board,markers:a.markers||{},order:a.order,phase:a.phase,botDifficulty:a.botDifficulty||'normal',clues:{[id]:a.clues[id]}};
  return botMove(view,id,rng);
 }
 const api={TERRAIN,DEEP_TERRAIN,VOLCANO_TERRAIN,COLORS,MAPS,isDeepSea,isVolcano,mapBoard,distance,coordinate,clueCatalogue,generate,setup,apply,allows,blocked,legalCells,actor,manageBots,botMove,nextBotAction,mix};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CryptidEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
