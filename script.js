// Party Game Hub V7 — avatar picker, improved game UI, refreshed categories
const firebaseConfig={apiKey:"AIzaSyC3IuOTFTc200JcUmpVe1GEv13nCj1EM8",authDomain:"xo-game-e5fdd.firebaseapp.com",databaseURL:"https://xo-game-e5fdd-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"xo-game-e5fdd",storageBucket:"xo-game-e5fdd.appspot.com",messagingSenderId:"890496938682",appId:"1:890496938682:web:c99edd29e639415ac4883",measurementId:"G-4RHMNWP5ZJ"};
firebase.initializeApp(firebaseConfig);
const db=firebase.database(),$=id=>document.getElementById(id);
const MODES=['spyfall','whoami_time','whoami_rounds'],CATEGORIES_KEY='party_game_categories_v6',LEGACY_CATEGORIES_KEYS=['party_game_categories_v5','party_game_categories_v4','party_game_categories_v3'],IDLE_MS=600000,FINAL_MS=120000,TIMESTAMP=()=>firebase.database.ServerValue.TIMESTAMP;
const serverNow=()=>Date.now()+serverOffset,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modeTitle=m=>({spyfall:'Spyfall',whoami_time:'Who Am I · จับเวลา',whoami_rounds:'Who Am I · นับรอบ'}[m]||'Spyfall');
const random=a=>a[Math.floor(Math.random()*a.length)],shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const getRef=()=>db.ref(`rooms/${roomId}`),copyPack=v=>JSON.parse(JSON.stringify(v)),wordsOf=p=>[...new Set(Object.values(p?.groups||{}).flat().filter(x=>typeof x==='string'&&x.trim()))],norm=s=>String(s??'').trim().toLocaleLowerCase();
function gameParticipantIds(r){
 const snap=r?.gamePlayers||{},roles=r?.roles||{};
 return Object.keys(snap).length?Object.keys(snap):Object.keys(roles).length?Object.keys(roles):Object.keys(r?.players||{});
}
function gameParticipants(r){
 const ids=gameParticipantIds(r),all={...(r?.playerProfiles||{}),...(r?.gamePlayers||{}),...(r?.players||{})};
 return Object.fromEntries(ids.map(id=>[id,all[id]||{name:'ผู้เล่น',avatar:'fox'}]));
}
function everyoneWithScores(r){
 const ids=new Set([...Object.keys(r?.scores||{}),...Object.keys(r?.players||{})]);
 const known={...(r?.playerProfiles||{}),...(r?.gamePlayers||{}),...(r?.players||{})};
 return Object.fromEntries([...ids].map(id=>[id,known[id]||{name:'ผู้เล่นที่ออกจากห้อง',avatar:'fox'}]));
}
function firebaseSafePack(pack){
 const groups={},groupLabels={};
 Object.entries(pack?.groups||{}).forEach(([label,words],index)=>{
  const key=`group_${index+1}`;
  groups[key]=[...new Set((Array.isArray(words)?words:[]).map(w=>String(w).trim()).filter(Boolean))];
  groupLabels[key]=String(label);
 });
 return {name:String(pack?.name||'หมวดคำ'),enabledModes:[...(Array.isArray(pack?.enabledModes)?pack.enabledModes:MODES)],groups,groupLabels};
}
function groupLabel(pack,key){return pack?.groupLabels?.[key]||key||'—';}

function isAwareSpy(r){return r?.gameMode==='spyfall'&&r?.spyVariant==='aware';}
function spyVariantTitle(v){return v==='aware'?'Spy รู้ตัวตน':'คำลับต่างกัน';}
function normalSpyWord(r){return r?.spyCommonWord||Object.entries(r?.roles||{}).find(([id])=>id!==r?.spyId)?.[1]||'';}
function spyVotesComplete(r){
 const ids=Object.keys(r?.players||{});
 if(!isAwareSpy(r))return ids.length>0&&ids.every(id=>!!r.votes?.[id]);
 const normals=ids.filter(id=>id!==r.spyId);
 return normals.length>0&&normals.every(id=>!!r.votes?.[id])&&(!r.players?.[r.spyId]||!!r.spyGuess?.submitted);
}
function supportsMode(pack,mode){
 if(!pack?.groups||!MODES.includes(mode))return false;
 const groups=Object.values(pack.groups).filter(Array.isArray);
 if(mode==='spyfall')return groups.some(words=>new Set(words.filter(w=>typeof w==='string'&&w.trim()).map(norm)).size>=2);
 return new Set(wordsOf(pack).map(norm)).size>=2;
}
let serverOffset=0,roomState=null,roomId=sessionStorage.getItem('pg_room_v6')||'',myId=sessionStorage.getItem('pg_tab_id')||`u_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
let myName=localStorage.getItem('rov_spy_myname')||'',nameConfirmed=false,myAvatar=localStorage.getItem('party_game_avatar_v1')||'fox';
let selectedMode='',selectedCategory='',chosenVote='',chosenGuess='',chosenWord='',chosenSpyGuess='',selectedSpyVariant='secret',lastWhoTurnToken='';
let isHost=false,subscribedRef=null,roomCallback=null,leaving=false,sweepBusy=false,autoBusy=false,reconnectBusy=false,lastTouch=0,managerReturn='homeView',editKey=null,editNew=false,editDraft=null;
sessionStorage.setItem('pg_tab_id',myId);db.ref('.info/serverTimeOffset').on('value',s=>serverOffset=Number(s.val())||0);
const AVATARS=[
{id:"fox",name:"จิ้งจอก",emoji:"🦊",tone:"orange",group:"animals"},
{id:"cat",name:"แมว",emoji:"🐱",tone:"pink",group:"animals"},
{id:"panda",name:"แพนด้า",emoji:"🐼",tone:"mono",group:"animals"},
{id:"tiger",name:"เสือ",emoji:"🐯",tone:"gold",group:"animals"},
{id:"rabbit",name:"กระต่าย",emoji:"🐰",tone:"rose",group:"animals"},
{id:"frog",name:"กบเขียว",emoji:"🐸",tone:"green",group:"animals"},
{id:"koala",name:"โคอาลา",emoji:"🐨",tone:"gray",group:"animals"},
{id:"bear",name:"หมี",emoji:"🐻",tone:"brown",group:"animals"},
{id:"monkey",name:"ลิง",emoji:"🐵",tone:"yellow",group:"animals"},
{id:"penguin",name:"เพนกวิน",emoji:"🐧",tone:"blue",group:"animals"},
{id:"owl",name:"นกฮูก",emoji:"🦉",tone:"purple",group:"animals"},
{id:"unicorn",name:"ยูนิคอร์น",emoji:"🦄",tone:"rose",group:"fantasy"},
{id:"dragon",name:"มังกร",emoji:"🐲",tone:"green",group:"fantasy"},
{id:"alien",name:"เอเลี่ยนพิกเซล",emoji:"👾",tone:"violet",group:"cool"},
{id:"robot",name:"หุ่นยนต์",emoji:"🤖",tone:"blue",group:"cool"},
{id:"octopus",name:"หมึกยักษ์",emoji:"🐙",tone:"coral",group:"animals"},
{id:"shark",name:"ฉลาม",emoji:"🦈",tone:"cyan",group:"cool"},
{id:"chick",name:"ลูกเจี๊ยบ",emoji:"🐥",tone:"yellow",group:"animals"},
{id:"otter",name:"นากทะเล",emoji:"🦦",tone:"brown",group:"animals"},
{id:"seal",name:"แมวน้ำ",emoji:"🦭",tone:"gray",group:"animals"},
{id:"raccoon",name:"แร็กคูน",emoji:"🦝",tone:"gray",group:"animals"},
{id:"sloth",name:"สลอธ",emoji:"🦥",tone:"gold",group:"animals"},
{id:"hedgehog",name:"เม่นน้อย",emoji:"🦔",tone:"brown",group:"animals"},
{id:"beaver",name:"บีเวอร์",emoji:"🦫",tone:"brown",group:"animals"},
{id:"black_cat",name:"แมวดำ",emoji:"🐈‍⬛",tone:"violet",group:"animals"},
{id:"wolf",name:"หมาป่า",emoji:"🐺",tone:"gray",group:"cool"},
{id:"bat",name:"ค้างคาว",emoji:"🦇",tone:"purple",group:"cool"},
{id:"eagle",name:"อินทรี",emoji:"🦅",tone:"gold",group:"cool"},
{id:"crocodile",name:"จระเข้",emoji:"🐊",tone:"green",group:"cool"},
{id:"dino",name:"ไดโนเสาร์",emoji:"🦖",tone:"green",group:"cool"},
{id:"whale",name:"วาฬ",emoji:"🐳",tone:"cyan",group:"animals"},
{id:"flamingo",name:"ฟลามิงโก",emoji:"🦩",tone:"rose",group:"animals"},
{id:"butterfly",name:"ผีเสื้อ",emoji:"🦋",tone:"blue",group:"fantasy"},
{id:"ghost",name:"ผีน้อย",emoji:"👻",tone:"mono",group:"fantasy"},
{id:"pumpkin",name:"ฟักทองจอมซน",emoji:"🎃",tone:"orange",group:"fantasy"},
{id:"ninja",name:"นินจา",emoji:"🥷",tone:"gray",group:"cool"},
{id:"wizard",name:"พ่อมด",emoji:"🧙",tone:"purple",group:"fantasy"},
{id:"vampire",name:"แวมไพร์",emoji:"🧛",tone:"rose",group:"fantasy"},
{id:"space",name:"นักบินอวกาศ",emoji:"🧑‍🚀",tone:"blue",group:"cool"},
{id:"superhero",name:"ฮีโร่",emoji:"🦸",tone:"gold",group:"cool"},
{id:"fairy",name:"ภูตน้อย",emoji:"🧚",tone:"pink",group:"fantasy"},
{id:"zombie",name:"ซอมบี้",emoji:"🧟",tone:"green",group:"fantasy"},
{id:"alien2",name:"เอเลี่ยน",emoji:"👽",tone:"cyan",group:"cool"},
{id:"skull",name:"กะโหลก",emoji:"💀",tone:"mono",group:"cool"},
{id:"king",name:"ราชา",emoji:"🤴",tone:"gold",group:"fantasy"},
{id:"teddy",name:"ตุ๊กตาหมี",emoji:"🧸",tone:"brown",group:"fantasy"},
{id:"squid",name:"หมึกน้อย",emoji:"🦑",tone:"coral",group:"animals"},
{id:"dragon2",name:"มังกรบิน",emoji:"🐉",tone:"green",group:"fantasy"}
];
const avatarById=id=>AVATARS.find(a=>a.id===id)||AVATARS[0];
if(!AVATARS.some(a=>a.id===myAvatar)){myAvatar='fox';try{localStorage.setItem('party_game_avatar_v1',myAvatar);}catch(e){}}
const avatarMarkup=(player,cls='avatar-inline')=>{const a=avatarById(player?.avatar||'fox');return `<span class="avatar-token tone-${a.tone} ${cls}" title="${esc(a.name)}">${a.emoji}</span>`;};
const playerLabelHTML=(id,r,showYou=true)=>{const p=r?.players?.[id]||r?.gamePlayers?.[id]||r?.playerProfiles?.[id]||{};return `<span class="player-identity">${avatarMarkup(p)}<span>${esc(p.name||'ผู้เล่น')}${showYou&&id===myId?' (คุณ)':''}</span></span>`;};
function setGameAvatar(id,avatarId=myAvatar){const el=$(id);if(!el)return;const a=avatarById(avatarId);el.textContent=a.emoji;el.className=`game-avatar tone-${a.tone}`;}
let avatarFilter='all';
const AVATAR_FILTERS=[
 {id:'all',label:'ทั้งหมด'},
 {id:'animals',label:' สัตว์น่ารัก'},
 {id:'cool',label:' สายเท่'},
 {id:'fantasy',label:' แฟนตาซี'}
];
function renderAvatarPicker(){
 const grid=$('avatarPicker'),filters=$('avatarFilterBar');
 if(!grid||!filters)return;
 filters.replaceChildren();
 AVATAR_FILTERS.forEach(filter=>{
  const b=document.createElement('button');
  b.type='button';b.className=`avatar-filter ${avatarFilter===filter.id?'selected':''}`;
  b.textContent=filter.label;b.setAttribute('aria-pressed',String(avatarFilter===filter.id));
  b.onclick=()=>{avatarFilter=filter.id;renderAvatarPicker();};
  filters.append(b);
 });
 grid.replaceChildren();
 AVATARS.filter(a=>avatarFilter==='all'||a.group===avatarFilter).forEach(a=>{
  const b=document.createElement('button');b.type='button';
  b.className=`avatar-option ${myAvatar===a.id?'selected':''}`;
  b.dataset.avatar=a.id;b.setAttribute('aria-pressed',String(myAvatar===a.id));
  b.innerHTML=`<span class="avatar-token tone-${a.tone}">${a.emoji}</span><small>${esc(a.name)}</small>`;
  b.onclick=()=>{
   myAvatar=a.id;localStorage.setItem('party_game_avatar_v1',myAvatar);
   renderAvatarPicker();toast(`เลือกตัวละคร ${a.name} แล้ว`,'success');
   if(roomId&&roomState?.players?.[myId])getRef().child(`players/${myId}/avatar`).set(myAvatar).catch(error);
  };
  grid.append(b);
 });
 const chosen=avatarById(myAvatar);
 $('avatarPreview').textContent=chosen.emoji;$('avatarPreview').className=`avatar-preview tone-${chosen.tone}`;
 $('avatarSelectedLabel').textContent=`ตัวละครของคุณ: ${chosen.name} · เลือกได้ ${AVATARS.length} แบบ`;
 $('profileAvatar').textContent=chosen.emoji;$('profileAvatar').className=`panel-emoji avatar-profile tone-${chosen.tone}`;
}
const builtinCategories ={
  "rov": {
    "name": "ROV · ฮีโร่ 130 รายการ / แยกตามเลนหลัก",
    "groups": {
      "เลนดาร์กสเลเยอร์ / ออฟเลน": [
        "Dextra",
        "Max",
        "Tamyn",
        "Marja",
        "Roxie",
        "Volkath",
        "Bijan",
        "Veres",
        "Taara",
        "Mortos",
        "Qi",
        "Edras",
        "Ata",
        "Airi",
        "Biron",
        "Errol",
        "Ryoma",
        "Maloch",
        "Allain",
        "Lu Bu",
        "Omen",
        "Kil'Groth",
        "Bolt Baron",
        "Yena",
        "Skud",
        "Florentino",
        "Zuka",
        "Riktor",
        "Amily",
        "Charlotte",
        "Superman"
      ],
      "เลนกลาง": [
        "Evita",
        "Preyta",
        "Ilumia",
        "Azzen'Ka",
        "Zata",
        "Diao Chan",
        "Flowborn (เมจ)",
        "Kahlii",
        "Goverra",
        "Lorion",
        "Yue",
        "Liliana",
        "Bonnie",
        "Heino",
        "Iggy",
        "D'Arcy",
        "Dirak",
        "Aleister",
        "Veera",
        "Krixi",
        "Tulen",
        "Lauriel",
        "Ignis",
        "Jinna",
        "Ishar",
        "Raz",
        "Natalya",
        "Mganga"
      ],
      "ป่า": [
        "Astrid",
        "Sinestrea",
        "Rourke",
        "Zill",
        "Tachi",
        "Zanis",
        "Quillen",
        "Butterfly",
        "Enzo",
        "Eland'orr",
        "Nakroth",
        "Billow",
        "Fennik",
        "Bright",
        "Murad",
        "Kaine",
        "Zephys",
        "Yan",
        "Lindis",
        "Wonder Woman",
        "Aoi",
        "Wukong",
        "Paine",
        "Kriknak",
        "Keera",
        "The Flash"
      ],
      "เลนมังกร / แครี่": [
        "Yorn",
        "Flowborn (แครี่)",
        "Moren",
        "Laville",
        "Tel'Annas",
        "Wisp",
        "Thorne",
        "Erin",
        "Violet",
        "Slimz",
        "Celica",
        "Elsu",
        "Capheny",
        "Hayate",
        "Stuart",
        "Valhein",
        "Teeri"
      ],
      "โรมมิ่ง / ซัพพอร์ต": [
        "Omega",
        "Dyadia",
        "Wiro",
        "Lumburr",
        "Y'bneth",
        "Alice",
        "Helen",
        "Cresht",
        "TeeMee",
        "Dolia",
        "Xeniel",
        "Zip",
        "Toro",
        "Ormarr",
        "Thane",
        "Krizzix",
        "Annette",
        "Chaugnar",
        "Mina",
        "Sephera",
        "Grakk",
        "Aya",
        "Ming",
        "Arum",
        "Baldum",
        "Gildur",
        "Arduin",
        "Rouie"
      ]
    }
  },
  "valorant": {
    "name": "Valorant",
    "groups": {
      "Duelist": [
        "Hush",
        "Iso",
        "Jett",
        "Neon",
        "Phoenix",
        "Raze",
        "Reyna",
        "Waylay",
        "Yoru"
      ],
      "Controller": [
        "Astra",
        "Brimstone",
        "Clove",
        "Harbor",
        "Miks",
        "Omen",
        "Viper"
      ],
      "Initiator": [
        "Breach",
        "Fade",
        "Gekko",
        "KAY/O",
        "Skye",
        "Sova",
        "Tejo"
      ],
      "Sentinel": [
        "Chamber",
        "Cypher",
        "Deadlock",
        "Killjoy",
        "Sage",
        "Veto",
        "Vyse"
      ]
    }
  },
  "general_items": {
    "name": "สิ่งของทั่วไป",
    "groups": {
      "ของใช้ในบ้าน": [
        "ไม้กวาด",
        "ถังขยะ",
        "กระจก",
        "หมอน",
        "ผ้าห่ม",
        "ไม้แขวนเสื้อ",
        "แชมพู",
        "สบู่",
        "ยาสีฟัน",
        "แปรงสีฟัน",
        "ผ้าเช็ดตัว",
        "หวี",
        "กระดาษทิชชู่",
        "เตารีด",
        "ตะกร้าผ้า",
        "ไม้ถูพื้น"
      ],
      "เครื่องใช้ไฟฟ้าและไอที": [
        "โทรศัพท์",
        "คอมพิวเตอร์",
        "ทีวี",
        "ตู้เย็น",
        "พัดลม",
        "ไมโครเวฟ",
        "แอร์",
        "หูฟัง",
        "เมาส์",
        "คีย์บอร์ด",
        "กล้อง",
        "เครื่องซักผ้า",
        "ลำโพง",
        "พาวเวอร์แบงค์",
        "แท็บเล็ต",
        "เครื่องปริ้นเตอร์"
      ],
      "เครื่องครัว": [
        "จาน",
        "ชาม",
        "ช้อน",
        "ส้อม",
        "แก้วน้ำ",
        "หม้อ",
        "กระทะ",
        "มีด",
        "เขียง",
        "ตะหลิว",
        "ทัพพี",
        "กาน้ำร้อน",
        "ขวดน้ำ",
        "เครื่องปั่น",
        "หม้อหุงข้าว",
        "กล่องข้าว"
      ],
      "สิ่งของรอบตัว": [
        "ร่ม",
        "กุญแจ",
        "ไฟฉาย",
        "นาฬิกาปลุก",
        "เทียน",
        "เชือก",
        "กล่องพัสดุ",
        "ถุงผ้า",
        "ตะกร้า",
        "ค้อน",
        "ไขควง",
        "บันได",
        "สายชาร์จ",
        "ปลั๊กพ่วง",
        "รีโมต",
        "เครื่องคิดเลข"
      ]
    }
  },
  "animals": {
    "name": "สัตว์",
    "groups": {
      "สัตว์เลี้ยง": [
        "สุนัข",
        "แมว",
        "กระต่าย",
        "หนูแฮมสเตอร์",
        "หนูตะเภา",
        "ชินชิล่า",
        "เฟอร์เร็ต",
        "เม่นแคระ",
        "เต่าบก",
        "ปลาทอง",
        "ปลากัด",
        "นกแก้ว",
        "นกค็อกคาเทล",
        "หนูขาว"
      ],
      "สัตว์ป่า": [
        "ช้าง",
        "สิงโต",
        "เสือโคร่ง",
        "เสือดาว",
        "เสือชีตาห์",
        "ยีราฟ",
        "ม้าลาย",
        "ฮิปโปโปเตมัส",
        "แรด",
        "ลิง",
        "กอริลลา",
        "อุรังอุตัง",
        "แพนด้า",
        "หมีขั้วโลก",
        "หมีสีน้ำตาล",
        "หมาป่า",
        "สุนัขจิ้งจอก",
        "กวาง",
        "จิงโจ้",
        "โคอาลา",
        "อูฐ",
        "แรคคูน"
      ],
      "สัตว์น้ำ": [
        "ฉลาม",
        "วาฬ",
        "โลมา",
        "ปลาหมึกยักษ์",
        "ปลาหมึก",
        "ปู",
        "กุ้ง",
        "กุ้งมังกร",
        "ม้าน้ำ",
        "ปลาดาว",
        "แมงกะพรุน",
        "เต่าทะเล",
        "ปลากระเบน",
        "ปลาโลมาอิรวดี",
        "ปลาการ์ตูน",
        "ปลาทูน่า",
        "ปลาฉลามวาฬ",
        "หอยนางรม"
      ],
      "นก": [
        "นกอินทรี",
        "นกฮูก",
        "นกเพนกวิน",
        "นกฟลามิงโก",
        "นกยูง",
        "นกกระเรียน",
        "นกกระจอก",
        "นกพิราบ",
        "นกเงือก",
        "นกกระเต็น",
        "นกกระตั้ว",
        "นกทูแคน"
      ],
      "สัตว์เลื้อยคลานและสะเทินน้ำสะเทินบก": [
        "งูเห่า",
        "งูเหลือม",
        "จระเข้",
        "กิ้งก่า",
        "ตุ๊กแก",
        "อีกัวนา",
        "กิ้งก่าคาเมเลียน",
        "เต่า",
        "กบ",
        "คางคก",
        "ซาลาแมนเดอร์"
      ],
      "แมลงและสัตว์ตัวเล็ก": [
        "ผีเสื้อ",
        "ผึ้ง",
        "มด",
        "ยุง",
        "แมลงปอ",
        "เต่าทอง",
        "ด้วง",
        "แมงมุม",
        "ตั๊กแตน",
        "จิ้งหรีด",
        "หิ่งห้อย",
        "แมลงสาบ"
      ]
    }
  },
  "thai_songs": {
    "name": "เพลงไทยยอดฮิต",
    "groups": {
      "เพลงฮิต Spotify Thailand · 11 พ.ย. 2026": [
        "อย่ามากกว่าฉันก็พอ (Jealous)",
        "ได้แค่เดินมาส่ง (The Last Walk)",
        "เมื่อไหร่จะมี (มีใจให้กัน)",
        "เขียว เหลือง แดง (Get high)",
        "ขึ้นใจ (3am call)",
        "Airdrop",
        "รอ SIS (TER)",
        "Living Death",
        "Reborn",
        "ไม่ได้เลวขนาดนั้น",
        "มาเฟียบ้านนอก",
        "ไม่รักดีกว่า",
        "สายไป",
        "ดีใจที่ตรงนั้นไม่ใช่เรา",
        "กลัวว่าฉันจะไม่เสียใจ (Fear)",
        "รักให้เธอได้รู้ (Proof.)",
        "เมื่อถูกค้นพบ (Finally She Found.)",
        "อยากจะกอดเธอนาน ๆ (HAVE A GOOD TIME)",
        "ยิ้มอันตราย",
        "กลัวความเสียใจ"
      ]
    }
  },
  "places": {
    "name": "สถานที่",
    "groups": {
      "สถานที่ท่องเที่ยวในประเทศไทย": [
        "วัดพระแก้ว",
        "วัดอรุณราชวราราม",
        "พระบรมมหาราชวัง",
        "เยาวราช",
        "ถนนข้าวสาร",
        "สยามพารากอน",
        "ตลาดน้ำดำเนินสะดวก",
        "อยุธยา",
        "เชียงใหม่",
        "เชียงราย",
        "ภูเก็ต",
        "พัทยา",
        "หัวหิน",
        "กระบี่",
        "เกาะสมุย",
        "เกาะพีพี",
        "เกาะเสม็ด",
        "ดอยอินทนนท์",
        "ดอยสุเทพ",
        "เขาใหญ่",
        "น้ำตกเอราวัณ",
        "อุทยานแห่งชาติเขาสก",
        "สะพานข้ามแม่น้ำแคว",
        "สุโขทัย",
        "เกาะช้าง",
        "เกาะหลีเป๊ะ"
      ],
      "สถานที่สำคัญทั่วโลก": [
        "หอไอเฟล",
        "พิพิธภัณฑ์ลูฟวร์",
        "กำแพงเมืองจีน",
        "ทัชมาฮาล",
        "โคลอสเซียม",
        "เทพีเสรีภาพ",
        "บิ๊กเบน",
        "พีระมิดกีซา",
        "บุรจญ์เคาะลีฟะฮ์",
        "มาชูปิกชู",
        "นครเพตรา",
        "ซิดนีย์โอเปร่าเฮาส์",
        "ภูเขาไฟฟูจิ",
        "ดิสนีย์แลนด์",
        "ไทม์สแควร์",
        "หอเอนปิซา",
        "นครวัด",
        "มหาวิหารซากราดาฟามีเลีย",
        "พระราชวังแวร์ซาย",
        "แกรนด์แคนยอน",
        "เกาะซานโตรินี",
        "มัลดีฟส์",
        "หอคอยโตเกียว",
        "Universal Studios",
        "สวนสนุกเอเวอร์แลนด์"
      ]
    }
  },
  "countries": {
    "name": "ประเทศ",
    "groups": {
      "เอเชีย": [
        "ไทย",
        "ญี่ปุ่น",
        "เกาหลีใต้",
        "จีน",
        "ไต้หวัน",
        "ฮ่องกง",
        "อินเดีย",
        "อินโดนีเซีย",
        "มาเลเซีย",
        "สิงคโปร์",
        "เวียดนาม",
        "ฟิลิปปินส์",
        "กัมพูชา",
        "ลาว",
        "เมียนมา",
        "บรูไน",
        "เนปาล",
        "ศรีลังกา",
        "ปากีสถาน",
        "ซาอุดีอาระเบีย",
        "สหรัฐอาหรับเอมิเรตส์",
        "กาตาร์",
        "ตุรกี"
      ],
      "ยุโรป": [
        "สหราชอาณาจักร",
        "ฝรั่งเศส",
        "เยอรมนี",
        "อิตาลี",
        "สเปน",
        "โปรตุเกส",
        "เนเธอร์แลนด์",
        "เบลเยียม",
        "สวิตเซอร์แลนด์",
        "ออสเตรีย",
        "สวีเดน",
        "นอร์เวย์",
        "ฟินแลนด์",
        "เดนมาร์ก",
        "กรีซ",
        "โปแลนด์",
        "ยูเครน",
        "รัสเซีย",
        "ไอซ์แลนด์"
      ],
      "อเมริกาและโอเชียเนีย": [
        "สหรัฐอเมริกา",
        "แคนาดา",
        "เม็กซิโก",
        "บราซิล",
        "อาร์เจนตินา",
        "ชิลี",
        "เปรู",
        "ออสเตรเลีย",
        "นิวซีแลนด์"
      ],
      "แอฟริกา": [
        "อียิปต์",
        "แอฟริกาใต้",
        "โมร็อกโก",
        "เคนยา",
        "ไนจีเรีย",
        "เอธิโอเปีย",
        "แทนซาเนีย"
      ]
    }
  },
  "popular_apps": {
    "name": "แอปพลิเคชันยอดนิยม",
    "groups": {
      "โซเชียลและแชต": [
        "LINE",
        "Facebook",
        "Instagram",
        "TikTok",
        "X",
        "Threads",
        "Messenger",
        "Discord",
        "Telegram",
        "WhatsApp",
        "Snapchat",
        "Pinterest"
      ],
      "ดูหนัง ฟังเพลง และเกม": [
        "YouTube",
        "Netflix",
        "Spotify",
        "YouTube Music",
        "JOOX",
        "WeTV",
        "iQIYI",
        "Disney+",
        "Prime Video",
        "Viu",
        "Twitch",
        "Roblox",
        "Steam"
      ],
      "ช้อปปิ้งและสั่งอาหาร": [
        "Shopee",
        "Lazada",
        "TikTok Shop",
        "Grab",
        "LINE MAN",
        "foodpanda",
        "7-Eleven TH",
        "Lotus's",
        "Makro PRO"
      ],
      "ทำงาน เรียน และเดินทาง": [
        "Gmail",
        "Google Drive",
        "Google Maps",
        "Canva",
        "CapCut",
        "Notion",
        "Zoom",
        "Microsoft Teams",
        "Google Meet",
        "ChatGPT",
        "Google Classroom",
        "Microsoft Word"
      ]
    }
  },
  "food": {
    "name": "อาหาร",
    "groups": {
      "อาหารไทย": [
        "ข้าวผัด",
        "ข้าวมันไก่",
        "ก๋วยเตี๋ยว",
        "ต้มยำกุ้ง",
        "ส้มตำ",
        "ผัดไทย",
        "ข้าวขาหมู",
        "ข้าวคลุกกะปิ",
        "ผัดกะเพรา",
        "แกงเขียวหวาน",
        "แกงส้ม",
        "ต้มข่าไก่",
        "คอหมูย่าง",
        "ลาบหมู",
        "น้ำตกหมู",
        "หมูปิ้ง",
        "ขนมจีนน้ำยา",
        "ข้าวหมกไก่",
        "ข้าวหน้าเป็ด",
        "ผัดซีอิ๊ว"
      ],
      "อาหารนานาชาติ": [
        "พิซซ่า",
        "แฮมเบอร์เกอร์",
        "ซูชิ",
        "ราเมง",
        "พาสต้า",
        "สเต๊ก",
        "ทาโก้",
        "ไก่ทอด",
        "ฮอตดอก",
        "ลาซานญ่า",
        "เกี๊ยวซ่า",
        "บิบิมบับ",
        "เฝอ",
        "ฟิชแอนด์ชิปส์",
        "แกงกะหรี่",
        "เคบับ",
        "เบอร์ริโต",
        "ปาเอญ่า",
        "เทมปุระ",
        "ข้าวหน้าเนื้อ"
      ],
      "ขนมและของหวาน": [
        "ไอศกรีม",
        "เค้ก",
        "โดนัท",
        "คุกกี้",
        "บราวนี่",
        "แพนเค้ก",
        "วาฟเฟิล",
        "เครป",
        "โมจิ",
        "บิงซู",
        "ขนมปังปิ้ง",
        "ชูโรส",
        "พุดดิ้ง",
        "วุ้น",
        "สายไหม",
        "มาการอง",
        "ครัวซองต์",
        "ทาร์ตไข่",
        "ช็อกโกแลต",
        "ป๊อปคอร์น"
      ],
      "เครื่องดื่ม": [
        "ชาไทย",
        "กาแฟ",
        "โกโก้",
        "ชานมไข่มุก",
        "ชาเขียว",
        "น้ำมะนาว",
        "น้ำส้ม",
        "น้ำมะพร้าว",
        "สมูทตี้",
        "มัทฉะลาเต้",
        "นมสด",
        "น้ำอัดลม",
        "น้ำเปล่า",
        "น้ำแตงโม",
        "น้ำลำไย",
        "น้ำเก๊กฮวย",
        "น้ำกระเจี๊ยบ",
        "ชามะนาว",
        "นมชมพู",
        "น้ำผึ้งมะนาว"
      ]
    }
  }
};
const SONG_ARTISTS_V16={"อย่ามากกว่าฉันก็พอ (Jealous)":"GAVIN:D, Violette Wautier","ได้แค่เดินมาส่ง (The Last Walk)":"GAVIN:D, BLVCKHEART","เมื่อไหร่จะมี (มีใจให้กัน)":"BLVCKHEART","เขียว เหลือง แดง (Get high)":"PUN, THE TOYS","ขึ้นใจ (3am call)":"Mirrr, BLVCKHEART","Airdrop":"BLVCKHEART","รอ SIS (TER)":"DICEBLUE, DICE","Living Death":"PUN","Reborn":"Atom Chanakan","ไม่ได้เลวขนาดนั้น":"PORZAX","มาเฟียบ้านนอก":"บุ๊ค ศุภกาญจน์","ไม่รักดีกว่า":"Z9","สายไป":"9tokyo, BLVCKHEART","ดีใจที่ตรงนั้นไม่ใช่เรา":"Only Monday","กลัวว่าฉันจะไม่เสียใจ (Fear)":"PURPEECH","รักให้เธอได้รู้ (Proof.)":"PUN","เมื่อถูกค้นพบ (Finally She Found.)":"FREEHAND","อยากจะกอดเธอนาน ๆ (HAVE A GOOD TIME)":"BLVCKHEART","ยิ้มอันตราย":"PORZAX","กลัวความเสียใจ":"SARAN feat. Pearpilincys","ซ่อนกลิ่น":"PALMY","ถ้าเราเจอกันอีก":"Tilly Birds","วาฬเกยตื้น":"GUNGUN","แค่คุณ":"Musketeers","ข้างกัน":"Three Man Down feat. ออม TELEx TELEXs","เป็นทุกอย่าง":"Room39","ฤดูที่ฉันเหงา":"Flure","คู่ชีวิต":"COCKTAIL","ดึงดัน":"COCKTAIL, ตั๊ก ศิริพร","ทน":"SPRITE, GUYGEEGEE","ลาลาลอย":"THE TOYS","สลักจิต":"ป๊อบ ปองกูล feat. ดา เอ็นโดรฟิน","รักแรก":"NONT TANONT","ทรงอย่างแบด":"Paper Planes","ทิ้งไว้กลางทาง":"POTATO","ภาพจำ":"ป๊อบ ปองกูล","คนไม่จำเป็น":"Getsunova","ไม่บอกเธอ":"Bedroom Audio","คำยินดี":"KLEAR","ไกลแค่ไหนคือใกล้":"Getsunova","กะทันหัน":"ฟิล์ม บงกช, รุจ ศุภรุจ, LOWFAT","คุกเข่า":"COCKTAIL","เธอหมุนรอบฉัน ฉันหมุนรอบเธอ":"Scrubb","ฝนตกไหม":"Three Man Down","เพื่อนเล่น ไม่เล่นเพื่อน":"Tilly Birds feat. MILLI","ถ้าเธอรักฉันจริง":"Three Man Down","ลบไม่ได้ช่วยให้ลืม":"INK WARUNTORN","ขอใจเธอแลกเบอร์โทร":"หญิงลี ศรีจุมพล","ใจสั่งมา":"LOSO","แสงสุดท้าย":"Bodyslam","แอบดี":"STAMP","หมอกหรือควัน":"เบิร์ด ธงไชย","ภาวนา":"MEYOU","เจ็บจนพอ":"WANYAi","แพ้ทาง":"LABANOON","อยู่ต่อเลยได้ไหม":"สิงโต นำโชค"};
function creditSongTitles(categories){
 const groups=categories?.thai_songs?.groups;
 if(!groups)return categories;
 for(const [groupName,list] of Object.entries(groups)){
  if(!Array.isArray(list))continue;
  groups[groupName]=[...new Set(list.map(value=>{
   const title=String(value).trim();
   const artist=SONG_ARTISTS_V16[title];
   return artist?`${title} — ${artist}`:title;
  }))];
 }
 return categories;
}
const EXTRA_WORDS_V15={"thai_songs":{"เพลงไทยที่ร้องตามกันได้":"ซ่อนกลิ่น|ถ้าเราเจอกันอีก|วาฬเกยตื้น|แค่คุณ|ข้างกัน|เป็นทุกอย่าง|ฤดูที่ฉันเหงา|คู่ชีวิต|ดึงดัน|ทน|ลาลาลอย|สลักจิต|รักแรก|ทรงอย่างแบด|ทิ้งไว้กลางทาง|ภาพจำ|คนไม่จำเป็น|ไม่บอกเธอ|คำยินดี|ไกลแค่ไหนคือใกล้|กะทันหัน|คุกเข่า|เธอหมุนรอบฉัน ฉันหมุนรอบเธอ|ฝนตกไหม|เพื่อนเล่น ไม่เล่นเพื่อน|ถ้าเธอรักฉันจริง|ลบไม่ได้ช่วยให้ลืม|ขอใจเธอแลกเบอร์โทร|ใจสั่งมา|แสงสุดท้าย|แอบดี|หมอกหรือควัน|ภาวนา|เจ็บจนพอ|แพ้ทาง|อยู่ต่อเลยได้ไหม"},"general_items":{"ของใช้ในบ้าน":"โต๊ะ|เก้าอี้|โซฟา|เตียง|ตู้เสื้อผ้า|ชั้นวางของ|พรม|ผ้าม่าน|ถังน้ำ|กะละมัง|กระบอกน้ำ|กระเป๋าเดินทาง|รองเท้าแตะ|ไม้หนีบผ้า|นาฬิกาแขวน|เบาะรองนั่ง|กล่องเก็บของ","เครื่องใช้ไฟฟ้าและไอที":"สมาร์ตวอตช์|เครื่องดูดฝุ่น|เตาอบ|เครื่องทำน้ำอุ่น|เครื่องเป่าผม|เครื่องชาร์จ|ปลั๊กไฟ|ไฟตั้งโต๊ะ|เครื่องเล่นเกม|จอยเกม|ไมโครโฟน|สาย USB|ไวไฟเราเตอร์|แฟลชไดรฟ์","เครื่องครัว":"กระชอน|ตะเกียบ|ถาดอาหาร|กระติกน้ำ|กล่องใส่อาหาร|ช้อนชา|ที่เปิดขวด|แก้วกาแฟ|จานรอง|ผ้ากันเปื้อน|กระติกน้ำร้อน|เครื่องปิ้งขนมปัง","สิ่งของรอบตัว":"กระเป๋าเป้|หมวก|แว่นตา|แว่นกันแดด|หน้ากากอนามัย|ผ้าเช็ดหน้า|สมุด|ปากกา|ดินสอ|ยางลบ|ไม้บรรทัด|กรรไกร|เทปใส|กระดาษ|บัตรประชาชน|กระเป๋าสตางค์|เหรียญ|พวงกุญแจ"},"places":{"สถานที่ท่องเที่ยวในประเทศไทย":"หาดบางแสน|หาดป่าตอง|อ่าวมาหยา|เกาะล้าน|เขาค้อ|ภูทับเบิก|แม่กำปอง|ตลาดจตุจักร|ไอคอนสยาม|สนามหลวง|อนุสาวรีย์ชัยสมรภูมิ|สะพานพระราม 8|วัดโพธิ์|วัดร่องขุ่น|น้ำตกทีลอซู|เขื่อนเชี่ยวหลาน","สถานที่สำคัญทั่วโลก":"สวนสนุกดิสนีย์เวิลด์|ฮอลลีวูด|ทำเนียบขาว|ลาสเวกัส|เซ็นทรัลพาร์ก|สะพานโกลเดนเกต|ภูเขาเอเวอเรสต์|ทะเลเดดซี|หอคอยแห่งลอนดอน|สนามเวมบลีย์|กำแพงเบอร์ลิน","สถานที่ใกล้ตัว":"โรงเรียน|มหาวิทยาลัย|โรงพยาบาล|ร้านสะดวกซื้อ|ร้านอาหาร|ร้านกาแฟ|ตลาดสด|ห้างสรรพสินค้า|สวนสาธารณะ|สถานีรถไฟ|สถานีรถไฟฟ้า|สนามบิน|สถานีตำรวจ|สถานีดับเพลิง|ธนาคาร|ไปรษณีย์|ห้องสมุด|สนามฟุตบอล|สระว่ายน้ำ|โรงภาพยนตร์|โรงแรม|สวนสัตว์|สวนสนุก|ปั๊มน้ำมัน|ร้านตัดผม|ร้านขายยา|วัด|โบสถ์|ชายหาด|น้ำตก|ภูเขา"},"countries":{"เอเชีย":"เกาหลีเหนือ|อิสราเอล|อิหร่าน|อิรัก|มองโกเลีย|บังกลาเทศ|มัลดีฟส์","ยุโรป":"เช็ก|ฮังการี|โรมาเนีย|ไอร์แลนด์|เซอร์เบีย","อเมริกาและโอเชียเนีย":"โคลอมเบีย|คิวบา|จาเมกา|ปานามา|อุรุกวัย","แอฟริกา":"ซูดาน|ลิเบีย|กานา|แอลจีเรีย"},"food":{"อาหารไทย":"ข้าวไข่เจียว|ข้าวหมูแดง|ข้าวหน้าไก่|ข้าวซอย|ก๋วยเตี๋ยวเรือ|เย็นตาโฟ|ราดหน้า|สุกี้|หมูกระทะ|ชาบู|จิ้มจุ่ม|ไก่ย่าง|ไข่พะโล้|ทอดมันปลา|ผัดผักบุ้ง|หอยทอด|ข้าวต้ม|ข้าวเหนียวหมูทอด|แกงจืด","อาหารนานาชาติ":"สปาเกตตี|ออมเล็ต|เฟรนช์ฟรายส์|นักเก็ตไก่|แซนด์วิช|มักกะโรนี|ข้าวแกงกะหรี่ญี่ปุ่น|ข้าวปั้น|ซาชิมิ|อุด้ง|ไส้กรอก|บาร์บีคิว|กิมจิ|ข้าวผัดกิมจิ|ปิ้งย่างเกาหลี|ซาลาเปา|ติ่มซำ|ขนมจีบ","ขนมและของหวาน":"ข้าวเหนียวมะม่วง|ลอดช่อง|บัวลอย|ขนมครก|ขนมเบื้อง|กล้วยทอด|โรตี|ขนมถ้วย|ทองหยิบ|ฝอยทอง|ขนมชั้น|วุ้นมะพร้าว|เฉาก๊วย|เต้าฮวย|ข้าวเหนียวทุเรียน|ชีสเค้ก|พายแอปเปิล","เครื่องดื่ม":"ลาเต้|คาปูชิโน|เอสเพรสโซ|อเมริกาโน|น้ำมะม่วง|น้ำแอปเปิล|น้ำสับปะรด|น้ำองุ่น|น้ำอัดลมรสโคล่า|นมช็อกโกแลต|นมถั่วเหลือง|ชาเย็น"}};
function addFamiliarWords(categories){
 for(const [id,groups] of Object.entries(EXTRA_WORDS_V15)){
  const category=categories[id];if(!category?.groups)continue;
  for(const [name,csv] of Object.entries(groups)){
   category.groups[name]=[...new Set([...(Array.isArray(category.groups[name])?category.groups[name]:[]),...csv.split('|')])];
  }
 }
 return creditSongTitles(categories);
}
addFamiliarWords(builtinCategories);
// New popular categories (V25): shared by Spyfall and both Who Am I modes.
const NEW_PARTY_CATEGORIES_V25={
  "cartoon_characters": {
    "name": "ตัวละครการ์ตูนยอดฮิต",
    "groups": {
      "โดราเอมอน": [
        "โดราเอมอน",
        "โนบิตะ",
        "ชิซูกะ",
        "ไจแอนท์",
        "ซึเนโอะ",
        "โดเรมี",
        "เดคิสุงิ",
        "คุณแม่โนบิตะ",
        "คุณพ่อโนบิตะ",
        "คุณครูของโนบิตะ"
      ],
      "ชินจัง": [
        "ชินจัง",
        "ฮิมาวาริ",
        "มิเซะ",
        "ฮิโรชิ",
        "ชิโร่",
        "คาซามะ",
        "เนเน่",
        "โบจัง",
        "มาซาโอะ",
        "คุณครูโยชินางะ",
        "คุณครูมัตสึซากะ"
      ],
      "โปเกมอน": [
        "พิคาชู",
        "ซาโตชิ",
        "มุซาชิ",
        "โคจิโร่",
        "เนียส",
        "อีวุย",
        "ลิซาร์ดอน",
        "ฟุชิกิดาเนะ",
        "เซนิกาเมะ",
        "คาบิกอน",
        "มิวทู",
        "ลูคาริโอ",
        "เก็งกา",
        "โคดัก",
        "ปุริน",
        "โคอิคิง"
      ],
      "ดิสนีย์และพิกซาร์": [
        "มิกกี้เมาส์",
        "มินนี่เมาส์",
        "โดนัลด์ดั๊ก",
        "กู๊ฟฟี่",
        "วินนี่เดอะพูห์",
        "ทิกเกอร์",
        "สติทช์",
        "ลิโล",
        "เอลซ่า",
        "อันนา",
        "โอลาฟ",
        "ราพันเซล",
        "ซิมบ้า",
        "ทิมอน",
        "พุมบ้า",
        "วู้ดดี้",
        "บัซ ไลท์เยียร์",
        "นีโม่",
        "ดอรี่",
        "ไมค์ วาซาวสกี้",
        "ซัลลีย์"
      ],
      "วันพีซ": [
        "ลูฟี่",
        "โซโร",
        "นามิ",
        "ซันจิ",
        "อุซป",
        "ช็อปเปอร์",
        "โรบิน",
        "แฟรงกี้",
        "บรู๊ค",
        "จินเบ",
        "แชงคูส",
        "เอซ",
        "ซาโบ",
        "บากี้"
      ],
      "นารูโตะ": [
        "นารูโตะ",
        "ซาสึเกะ",
        "ซากุระ",
        "คาคาชิ",
        "ฮินาตะ",
        "อิทาจิ",
        "กาอาระ",
        "ชิกามารุ",
        "ร็อคลี",
        "จิไรยะ",
        "สึนาเดะ",
        "โอโรจิมารุ"
      ]
    }
  },
  "occupations": {
    "name": "อาชีพ",
    "groups": {
      "การแพทย์และสุขภาพ": [
        "หมอ",
        "พยาบาล",
        "ทันตแพทย์",
        "เภสัชกร",
        "สัตวแพทย์",
        "นักกายภาพบำบัด",
        "นักจิตวิทยา",
        "นักโภชนาการ",
        "เจ้าหน้าที่กู้ชีพ",
        "นักเทคนิคการแพทย์",
        "หมอนวด"
      ],
      "บริการสาธารณะ": [
        "ตำรวจ",
        "ทหาร",
        "นักดับเพลิง",
        "นักบิน",
        "พนักงานต้อนรับบนเครื่องบิน",
        "ไปรษณีย์",
        "พนักงานเก็บขยะ",
        "เจ้าหน้าที่รักษาความปลอดภัย",
        "เจ้าหน้าที่กู้ภัย",
        "นักการทูต",
        "นายกเทศมนตรี"
      ],
      "การศึกษาและวิทยาศาสตร์": [
        "ครู",
        "อาจารย์มหาวิทยาลัย",
        "ครูอนุบาล",
        "ติวเตอร์",
        "นักวิทยาศาสตร์",
        "นักวิจัย",
        "นักดาราศาสตร์",
        "วิศวกร",
        "โปรแกรมเมอร์",
        "สถาปนิก",
        "นักสำรวจ",
        "นักธรณีวิทยา"
      ],
      "อาหารและงานบริการ": [
        "เชฟ",
        "พ่อครัว",
        "แม่ครัว",
        "พนักงานเสิร์ฟ",
        "บาริสต้า",
        "คนขายกาแฟ",
        "พ่อค้า",
        "แม่ค้า",
        "ช่างตัดผม",
        "ช่างเสริมสวย",
        "ช่างแต่งหน้า",
        "พนักงานโรงแรม",
        "มัคคุเทศก์",
        "พนักงานแคชเชียร์",
        "คนขับแท็กซี่"
      ],
      "ศิลปะและสื่อ": [
        "นักร้อง",
        "นักแสดง",
        "นักเต้น",
        "นักเขียน",
        "นักวาดภาพ",
        "ช่างภาพ",
        "นักข่าว",
        "พิธีกร",
        "ดีเจ",
        "ยูทูบเบอร์",
        "สตรีมเมอร์",
        "อินฟลูเอนเซอร์",
        "นักออกแบบกราฟิก",
        "นักตัดต่อวิดีโอ",
        "นักพากย์"
      ],
      "ช่างและธุรกิจ": [
        "ช่างไฟฟ้า",
        "ช่างประปา",
        "ช่างยนต์",
        "ช่างไม้",
        "ช่างเชื่อม",
        "ชาวนา",
        "เกษตรกร",
        "ชาวประมง",
        "นักธุรกิจ",
        "นักบัญชี",
        "ทนายความ",
        "พนักงานธนาคาร",
        "พนักงานส่งอาหาร"
      ]
    }
  },
  "movies_series": {
    "name": "ภาพยนตร์และซีรีส์",
    "groups": {
      "หนังซูเปอร์ฮีโร่": [
        "Avengers: Endgame",
        "Avengers: Infinity War",
        "Iron Man",
        "Captain America: The First Avenger",
        "Thor: Ragnarok",
        "Spider-Man: No Way Home",
        "Black Panther",
        "Doctor Strange",
        "Ant-Man",
        "Guardians of the Galaxy",
        "Deadpool",
        "The Batman",
        "The Dark Knight",
        "Wonder Woman",
        "Aquaman"
      ],
      "หนังดิสนีย์และแอนิเมชัน": [
        "Frozen",
        "Frozen II",
        "Toy Story",
        "Finding Nemo",
        "Inside Out",
        "The Lion King",
        "Moana",
        "Zootopia",
        "Coco",
        "Encanto",
        "Tangled",
        "Big Hero 6",
        "Shrek",
        "Kung Fu Panda",
        "How to Train Your Dragon",
        "The Incredibles",
        "Up",
        "Ratatouille"
      ],
      "หนังดังต่างประเทศ": [
        "Harry Potter and the Philosopher's Stone",
        "Home Alone",
        "Titanic",
        "Avatar",
        "Jurassic Park",
        "Jumanji",
        "Fast & Furious",
        "Transformers",
        "The Hunger Games",
        "The Lord of the Rings",
        "Star Wars",
        "The Matrix",
        "John Wick",
        "Interstellar",
        "Barbie",
        "Oppenheimer"
      ],
      "ภาพยนตร์ไทย": [
        "พี่มาก..พระโขนง",
        "กวน มึน โฮ",
        "สิ่งเล็กเล็กที่เรียกว่า...รัก",
        "แฟนฉัน",
        "รถไฟฟ้า มาหานะเธอ",
        "ไอฟาย..แต๊งกิ้ว..เลิฟยู้",
        "ATM เออรัก..เออเร่อ",
        "บุปผาราตรี",
        "องค์บาก",
        "ต้มยำกุ้ง",
        "หลวงพี่เท่ง",
        "สัปเหร่อ",
        "ธี่หยด",
        "ฉลาดเกมส์โกง"
      ],
      "ซีรีส์เกาหลีที่คนรู้จัก": [
        "Squid Game",
        "Crash Landing on You",
        "True Beauty",
        "Vincenzo",
        "Descendants of the Sun",
        "Goblin",
        "All of Us Are Dead",
        "Extraordinary Attorney Woo",
        "The Glory",
        "Kingdom",
        "Business Proposal",
        "Itaewon Class"
      ],
      "ละครและซีรีส์ไทย": [
        "บุพเพสันนิวาส",
        "พรหมลิขิต",
        "ทองเอก หมอยา ท่าโฉลง",
        "กรงกรรม",
        "เมีย 2018",
        "ฮอร์โมนส์ วัยว้าวุ่น",
        "รักฉุดใจนายฉุกเฉิน",
        "เด็กใหม่",
        "เพราะเราคู่กัน",
        "คั่นกู",
        "รักแห่งสยาม",
        "บ้านนี้มีรัก"
      ]
    }
  },
  "popular_brands": {
    "name": "แบรนด์ยอดนิยม",
    "groups": {
      "เทคโนโลยีและมือถือ": [
        "Apple",
        "Samsung",
        "OPPO",
        "vivo",
        "Xiaomi",
        "Huawei",
        "Nokia",
        "Sony",
        "Microsoft",
        "Google",
        "ASUS",
        "Acer",
        "Lenovo",
        "Dell",
        "HP",
        "Nintendo"
      ],
      "ร้านอาหารและเครื่องดื่ม": [
        "KFC",
        "McDonald's",
        "Burger King",
        "Pizza Hut",
        "Domino's Pizza",
        "Starbucks",
        "Cafe Amazon",
        "ชาตรามือ",
        "สุกี้ตี๋น้อย",
        "MK",
        "Swensen's",
        "Dairy Queen",
        "After You",
        "The Pizza Company",
        "Bonchon"
      ],
      "เสื้อผ้าและรองเท้า": [
        "Nike",
        "Adidas",
        "Puma",
        "New Balance",
        "Converse",
        "Vans",
        "Crocs",
        "Skechers",
        "Uniqlo",
        "H&M",
        "Zara",
        "Levi's",
        "GUCCI",
        "Louis Vuitton",
        "The North Face",
        "Lacoste"
      ],
      "รถยนต์และมอเตอร์ไซค์": [
        "Toyota",
        "Honda",
        "Isuzu",
        "Ford",
        "Nissan",
        "Mazda",
        "Mitsubishi",
        "Suzuki",
        "BMW",
        "Mercedes-Benz",
        "Tesla",
        "BYD",
        "Volvo",
        "Yamaha",
        "Kawasaki",
        "Lamborghini"
      ],
      "ร้านค้าและซูเปอร์มาร์เก็ต": [
        "7-Eleven",
        "Lotus's",
        "Big C",
        "Tops",
        "Makro",
        "เซ็นทรัล",
        "โรบินสัน",
        "HomePro",
        "ไทวัสดุ",
        "IKEA",
        "มินิบิ๊กซี",
        "วัตสัน",
        "บู๊ทส์"
      ],
      "เครื่องสำอางและความงาม": [
        "Maybelline",
        "L'Oréal",
        "NIVEA",
        "Garnier",
        "Vaseline",
        "Olay",
        "Sunsilk",
        "Dove",
        "Mistine",
        "Cute Press",
        "Srichand",
        "Oriental Princess"
      ]
    }
  },
  "popular_games": {
    "name": "เกมยอดนิยม",
    "groups": {
      "เกมมือถือยอดนิยม": [
        "ROV",
        "Free Fire",
        "PUBG Mobile",
        "Mobile Legends",
        "Genshin Impact",
        "Honkai: Star Rail",
        "Cookie Run: Kingdom",
        "Pokémon GO",
        "Subway Surfers",
        "Temple Run",
        "Candy Crush Saga",
        "Clash of Clans",
        "Clash Royale",
        "Brawl Stars",
        "Among Us",
        "Hay Day"
      ],
      "เกม PC และออนไลน์": [
        "Minecraft",
        "Roblox",
        "Valorant",
        "Fortnite",
        "League of Legends",
        "Dota 2",
        "Counter-Strike 2",
        "GTA V",
        "The Sims 4",
        "Phasmophobia",
        "Dead by Daylight",
        "Apex Legends",
        "Fall Guys",
        "Rust",
        "Overwatch 2",
        "Rocket League"
      ],
      "เกมคอนโซลและผจญภัย": [
        "The Legend of Zelda",
        "Super Mario Odyssey",
        "Mario Kart",
        "Animal Crossing",
        "God of War",
        "Spider-Man",
        "Pokémon Scarlet",
        "Kirby",
        "Sonic the Hedgehog",
        "Red Dead Redemption 2",
        "Elden Ring",
        "Hogwarts Legacy",
        "It Takes Two",
        "Little Nightmares"
      ],
      "เกมเล่นกับเพื่อน": [
        "UNO!",
        "Human: Fall Flat",
        "Overcooked!",
        "Gang Beasts",
        "PICO PARK",
        "Goose Goose Duck",
        "Lethal Company",
        "Party Animals",
        "PlateUp!",
        "Moving Out",
        "Keep Talking and Nobody Explodes",
        "Jackbox Party Pack"
      ],
      "เกมคลาสสิก": [
        "Tetris",
        "Pac-Man",
        "Plants vs. Zombies",
        "Fruit Ninja",
        "Angry Birds",
        "Flappy Bird",
        "Snake",
        "Bomberman",
        "Street Fighter",
        "Tekken",
        "Mortal Kombat",
        "Contra",
        "Super Mario Bros."
      ],
      "เกมใน Roblox": [
        "Brookhaven RP",
        "Adopt Me!",
        "Blox Fruits",
        "Dress to Impress",
        "Tower of Hell",
        "Murder Mystery 2",
        "DOORS",
        "Fisch",
        "Pet Simulator"
      ]
    }
  },
  "vehicles": {
    "name": "ยานพาหนะ",
    "groups": {
      "รถส่วนตัวและยานพาหนะบนถนน": [
        "รถยนต์",
        "รถกระบะ",
        "รถเก๋ง",
        "รถ SUV",
        "รถสปอร์ต",
        "รถเปิดประทุน",
        "รถจักรยานยนต์",
        "มอเตอร์ไซค์บิ๊กไบค์",
        "จักรยาน",
        "จักรยานไฟฟ้า",
        "รถสามล้อ",
        "รถตุ๊กตุ๊ก",
        "สกูตเตอร์ไฟฟ้า",
        "รถบ้าน"
      ],
      "ขนส่งสาธารณะ": [
        "รถเมล์",
        "รถตู้",
        "รถแท็กซี่",
        "รถไฟ",
        "รถไฟฟ้า BTS",
        "รถไฟฟ้า MRT",
        "รถไฟความเร็วสูง",
        "รถสองแถว",
        "รถทัวร์",
        "รถมินิบัส",
        "รถรับส่งนักเรียน",
        "รถไฟใต้ดิน"
      ],
      "ยานพาหนะทางน้ำ": [
        "เรือพาย",
        "เรือหางยาว",
        "เรือสปีดโบ๊ต",
        "เรือสำราญ",
        "เรือเฟอร์รี่",
        "เรือดำน้ำ",
        "เรือยอชต์",
        "เจ็ตสกี",
        "เรือประมง",
        "เรือบรรทุกสินค้า",
        "เรือคายัก",
        "เรือแคนู",
        "แพยาง"
      ],
      "ยานพาหนะทางอากาศ": [
        "เครื่องบินโดยสาร",
        "เครื่องบินรบ",
        "เฮลิคอปเตอร์",
        "เครื่องบินส่วนตัว",
        "เครื่องบินกระดาษ",
        "โดรน",
        "บอลลูนลมร้อน",
        "เครื่องร่อน",
        "เครื่องบินใบพัด",
        "เครื่องบินขนส่ง",
        "ยานอวกาศ",
        "จรวด"
      ],
      "รถใช้งานเฉพาะทาง": [
        "รถพยาบาล",
        "รถดับเพลิง",
        "รถตำรวจ",
        "รถขยะ",
        "รถไถ",
        "รถเครน",
        "รถบรรทุก",
        "รถปูน",
        "รถขุดดิน",
        "รถตักดิน",
        "รถส่งพัสดุ",
        "รถขนเงิน",
        "รถกู้ภัย",
        "รถบรรทุกน้ำ"
      ]
    }
  },
  "childhood_snacks": {
    "name": "ขนมและของกินวัยเด็ก",
    "groups": {
      "ขนมซองและขนมกรุบกรอบ": [
        "เลย์",
        "เทสโต",
        "ปาร์ตี้",
        "ฮานามิ",
        "ตะวัน",
        "แจ็กซ์",
        "โดริโทส",
        "ทวิสตี้",
        "ชิโตส",
        "ข้าวเกรียบกุ้ง",
        "สาหร่ายเถ้าแก่น้อย",
        "ปลาหมึกเบนโตะ",
        "ขนมปังแท่งปีโป้",
        "ปาปริก้า"
      ],
      "คุกกี้และขนมอบ": [
        "โอรีโอ",
        "ป๊อกกี้",
        "โคอะลามาร์ช",
        "ฟันโอ",
        "โรลเลอร์โคสเตอร์",
        "ทิวลี่",
        "คิทแคท",
        "ช็อกโกพาย",
        "เวเฟอร์",
        "ขนมปังไส้สังขยา",
        "โดนัท",
        "คุกกี้เนย",
        "ขนมปังกรอบ",
        "ครัวซองต์"
      ],
      "ลูกอมและหมากฝรั่ง": [
        "เมนทอส",
        "ฮอลส์",
        "คลอเร็ท",
        "ลูกอมโอเล่",
        "จูปาจุ๊ปส์",
        "ไฮชิว",
        "สกิตเทิลส์",
        "เยลลี่ฮาริโบ",
        "เยลลี่รูปหมี",
        "ปีโป้",
        "หมากฝรั่งบิ๊กบลูม",
        "หมากฝรั่งซูกัส",
        "ลูกอมมะขาม",
        "ลูกอมรสนม"
      ],
      "ของกินหน้าโรงเรียน": [
        "ไส้กรอกแดงทอด",
        "ลูกชิ้นทอด",
        "ลูกชิ้นปิ้ง",
        "โตเกียว",
        "ขนมถังแตก",
        "ขนมครก",
        "วาฟเฟิล",
        "ขนมเบื้อง",
        "ขนมปังปิ้ง",
        "สายไหม",
        "น้ำแข็งไส",
        "เกล็ดหิมะ",
        "ลูกชิ้นระเบิด",
        "เฟรนช์ฟรายส์"
      ],
      "ไอศกรีมและของหวาน": [
        "ไอติมแท่ง",
        "ไอติมโคน",
        "ไอติมหลอด",
        "ไอติมกะทิ",
        "ไอศกรีมวอลล์",
        "ไอศกรีมแม็กนั่ม",
        "คอร์เนตโต",
        "ไอศกรีมแซนด์วิช",
        "น้ำแข็งกด",
        "เฉาก๊วย",
        "ลอดช่อง",
        "เต้าฮวย",
        "กล้วยบวชชี"
      ]
    }
  },
  "memes_slang": {
    "name": "มีมและคำฮิต",
    "groups": {
      "คำฮิตภาษาไทย": [
        "ตัวตึง",
        "ของแทร่",
        "ช็อตฟีล",
        "ใจฟู",
        "เอ็นดู",
        "มงลง",
        "ชีเสิร์ฟ",
        "ต๊าช",
        "จึ้ง",
        "ปังมาก",
        "ตัวแม่",
        "ขิง",
        "อ่อม",
        "บ้ง",
        "คอนเทนต์",
        "นัมเบอร์วัน",
        "ตุยเย่",
        "สวบ"
      ],
      "ภาษาชาวเน็ต": [
        "POV",
        "FOMO",
        "NPC",
        "สปอยล์",
        "มีม",
        "ไวรัล",
        "ติดเทรนด์",
        "อวย",
        "แซะ",
        "อวยยศ",
        "โดนแกง",
        "แกงหม้อใหญ่",
        "ลั่น",
        "มีพิรุธ",
        "คนละเรื่องเดียวกัน",
        "หยุมหัว",
        "หลุดขำ",
        "แอบส่อง"
      ],
      "ตัวละครและภาพมีม": [
        "Doge",
        "Cheems",
        "Grumpy Cat",
        "แมวร้องไห้",
        "แมวเต้น",
        "แมวส้ม",
        "ผู้ชายชี้ผีเสื้อ",
        "ผู้ชายหันไปมองสาว",
        "This Is Fine",
        "Distracted Boyfriend",
        "Pepe the Frog",
        "Trollface",
        "Wojak",
        "Skibidi Toilet",
        "GigaChad",
        "Pop Cat"
      ],
      "คำฮิตจากเกม": [
        "GG",
        "EZ",
        "AFK",
        "Noob",
        "Pro player",
        "Carry",
        "Nerf",
        "Buff",
        "Rank",
        "MVP",
        "One shot",
        "Clutch",
        "Sus",
        "Impostor",
        "Camp",
        "GGWP",
        "Meta",
        "Lag"
      ],
      "ประโยคมีมที่คุ้นเคย": [
        "เดี๋ยวคุยกับใครก่อน",
        "ก็ว่าอยู่",
        "อิหยังวะ",
        "อะไรก็เกิดขึ้นได้",
        "เอาเรื่อง",
        "สุดจัดปลัดบอก",
        "ไม่ไหวบอกไหว",
        "คิดแล้วคิดอีก",
        "โคตรจะตึง",
        "กลั้นขำไม่ไหว",
        "เก่งมากแม่",
        "เชื่อเขาเลย",
        "ฉันจะเป็นลม",
        "เรื่องนี้ต้องมีคนรับผิดชอบ"
      ]
    }
  },
  "famous_people": {
    "name": "คนดังและศิลปิน",
    "groups": {
      "นักร้องไทย": [
        "เบิร์ด ธงไชย",
        "ตูน Bodyslam",
        "ปาล์มมี่",
        "บิวกิ้น",
        "พีพี กฤษฏ์",
        "นนท์ ธนนท์",
        "ก้อง ห้วยไร่",
        "ลำไย ไหทองคำ",
        "หญิงลี ศรีจุมพล",
        "โจอี้ ภูวศิษฐ์",
        "อิ้งค์ วรันธร",
        "ป๊อบ ปองกูล",
        "โต๋ ศักดิ์สิทธิ์",
        "ป๊ายปาย โอริโอ้",
        "ตั๊กแตน ชลดา",
        "แสตมป์ อภิวัชร์",
        "เก่ง ธชย"
      ],
      "นักแสดงไทย": [
        "ณเดชน์ คูกิมิยะ",
        "ญาญ่า อุรัสยา",
        "มาริโอ้ เมาเร่อ",
        "ใหม่ ดาวิกา",
        "ใบเฟิร์น พิมพ์ชนก",
        "เจมส์ จิรายุ",
        "อั้ม พัชราภา",
        "ชมพู่ อารยา",
        "เบลล่า ราณี",
        "โป๊ป ธนวรรธน์",
        "นุ่น วรนุช",
        "พี่ติ๊ก เจษฎาภรณ์",
        "บอย ปกรณ์",
        "ต่อ ธนภพ",
        "ไบร์ท วชิรวิชญ์"
      ],
      "ศิลปินและนักร้องต่างประเทศ": [
        "Taylor Swift",
        "Ed Sheeran",
        "Ariana Grande",
        "Justin Bieber",
        "Bruno Mars",
        "Billie Eilish",
        "Beyoncé",
        "Rihanna",
        "Lady Gaga",
        "The Weeknd",
        "Adele",
        "Michael Jackson",
        "Elvis Presley",
        "Shakira",
        "Dua Lipa",
        "Lisa",
        "Jennie",
        "Jungkook",
        "Rosé"
      ],
      "ยูทูบเบอร์และครีเอเตอร์": [
        "MrBeast",
        "PewDiePie",
        "IShowSpeed",
        "Mark Rober",
        "Zach King",
        "9arm",
        "พี่เอก Heartrocker",
        "พี่อู๋จุน",
        "พี่เก๋ไก๋",
        "คิวเท โอปป้า",
        "My Mate Nate",
        "SPD",
        "ปอนด์ PONDPONDLIVE",
        "Bie The Ska",
        "อุ้มอิ้ม"
      ],
      "นักกีฬาชื่อดัง": [
        "Cristiano Ronaldo",
        "Lionel Messi",
        "Neymar",
        "Kylian Mbappé",
        "David Beckham",
        "Michael Jordan",
        "LeBron James",
        "Stephen Curry",
        "Roger Federer",
        "Rafael Nadal",
        "Novak Djokovic",
        "Serena Williams",
        "Usain Bolt",
        "บัวขาว บัญชาเมฆ",
        "ชนาธิป สรงกระสินธ์",
        "วิว กุลวุฒิ"
      ]
    }
  },
  "sports": {
    "name": "กีฬา",
    "groups": {
      "กีฬาประเภทลูกบอล": [
        "ฟุตบอล",
        "ฟุตซอล",
        "บาสเกตบอล",
        "วอลเลย์บอล",
        "วอลเลย์บอลชายหาด",
        "แฮนด์บอล",
        "เบสบอล",
        "ซอฟต์บอล",
        "รักบี้",
        "อเมริกันฟุตบอล",
        "ฮอกกี้",
        "โปโลน้ำ",
        "ดอดจ์บอล",
        "โบว์ลิ่ง",
        "กอล์ฟ"
      ],
      "กีฬาใช้ไม้และแร็กเกต": [
        "แบดมินตัน",
        "เทนนิส",
        "ปิงปอง",
        "สควอช",
        "พิกเคิลบอล",
        "เทนนิสชายหาด",
        "คริกเก็ต",
        "สนุกเกอร์",
        "บิลเลียด",
        "ปาเป้า",
        "เบสบอลตีลูก",
        "มินิกอล์ฟ"
      ],
      "กีฬาต่อสู้": [
        "มวยไทย",
        "มวยสากล",
        "เทควันโด",
        "คาราเต้",
        "ยูโด",
        "ไอคิโด",
        "มวยปล้ำ",
        "ฟันดาบ",
        "คิกบ็อกซิ่ง",
        "กังฟู",
        "MMA",
        "บราซิลเลียนยิวยิตสู"
      ],
      "กีฬาทางน้ำ": [
        "ว่ายน้ำ",
        "ดำน้ำ",
        "กระโดดน้ำ",
        "เซิร์ฟบอร์ด",
        "พายเรือคายัก",
        "พายเรือแคนู",
        "เรือใบ",
        "เจ็ตสกี",
        "สกีน้ำ",
        "วินด์เซิร์ฟ",
        "แพดเดิลบอร์ด",
        "กรรเชียงเรือ"
      ],
      "กรีฑาและกีฬากลางแจ้ง": [
        "วิ่ง 100 เมตร",
        "วิ่งมาราธอน",
        "วิ่งผลัด",
        "กระโดดสูง",
        "กระโดดไกล",
        "ขว้างจักร",
        "พุ่งแหลน",
        "ทุ่มน้ำหนัก",
        "ยิงธนู",
        "ยิงปืน",
        "ปีนหน้าผา",
        "ปั่นจักรยาน",
        "ไตรกีฬา",
        "ยิมนาสติก",
        "สเก็ตบอร์ด"
      ],
      "กีฬาฤดูหนาว": [
        "สกี",
        "สโนว์บอร์ด",
        "ฮอกกี้น้ำแข็ง",
        "สเก็ตน้ำแข็ง",
        "ฟิกเกอร์สเก็ต",
        "เคอร์ลิง",
        "สกีกระโดดไกล",
        "บอบสเลด"
      ]
    }
  }
};
Object.assign(builtinCategories,NEW_PARTY_CATEGORIES_V25);

// V25 Thai song extension: title and artist are stored together for clue/guess cards.
const ADDITIONAL_THAI_SONGS_V25={
  "เพลงฮิตช่วงปี 2024–2025": [
    "นครดารา — YOUNGOHM",
    "ที่คั่นหนังสือ (Sometimes) — BOWKYLION feat. NONT TANONT",
    "บทสรุปสุดท้าย — Z9",
    "เจิดจรัส — YOUNGOHM",
    "ซ่อน(ไม่)หา — Jeff Satur",
    "ไม่เปลี่ยนเลย (Best Luck) — fellow fellow",
    "ดาวหางฮัลเลย์ — fellow fellow",
    "รถไฟบนฟ้า — D Gerrard",
    "จำนน — NONT TANONT"
  ],
  "เพลงป๊อปไทยร้องตามได้": [
    "ลงใจ — BOWKYLION",
    "คิด(แต่ไม่)ถึง — Tilly Birds",
    "ฝันถึงแฟนเก่า — Three Man Down",
    "ดีใจด้วยนะ — INK WARUNTORN",
    "สายตาหลอกกันไม่ได้ (Eyes Don't Lie) — INK WARUNTORN",
    "ยินดีที่ไม่รู้จัก — 25hours",
    "ไม่เคย — 25hours",
    "ทำได้เพียง — 25hours",
    "มันคงเป็นความรัก — STAMP",
    "แค่เธอ — Jeff Satur",
    "ทะเลสีดำ — Lula feat. ต้าร์ Paradox",
    "คนมีเสน่ห์ — ป้าง นครินทร์",
    "ภูมิแพ้กรุงเทพ — ป้าง นครินทร์ feat. ตั๊กแตน ชลดา",
    "รักติดไซเรน — ไอซ์ พาริส, แพรวา ณิชาภัทร",
    "แค่ได้คิดถึง — ญารินดา",
    "ถ้าเขาจะรัก (ยืนเฉยๆเขาก็รัก) — First Anuwat"
  ],
  "เพลงร็อกไทยยอดนิยม": [
    "เชือกวิเศษ — LABANOON",
    "ผ่าน — Slot Machine",
    "เคลิ้ม — Slot Machine",
    "น้ำลาย — Silly Fools",
    "จิ๊จ๊ะ — Silly Fools",
    "ขี้หึง — Silly Fools",
    "อกหัก — Bodyslam",
    "ความเชื่อ — Bodyslam",
    "ยาพิษ — Bodyslam",
    "คิดฮอด — Bodyslam feat. ศิริพร อำไพพงษ์",
    "สักวันฉันจะดีพอ — Bodyslam",
    "เจ็บที่ต้องรู้ — The Mousses",
    "เธอ — COCKTAIL",
    "โปรดเถิดรัก — COCKTAIL",
    "รักเธอทั้งหมดของหัวใจ — Pause",
    "ขัดใจ — COLORPiTCH"
  ],
  "เพลงดังติดหูและไวรัล": [
    "ดวงเดือน — โจอี้ ภูวศิษฐ์",
    "ขวัญเอยขวัญมา — PALMY",
    "กล่องสุ่ม — Zom Marie",
    "คุกกี้เสี่ยงทาย — BNK48",
    "โดดดิด่ง — BNK48",
    "คำแพง — แซ็ค ชุมแพ",
    "รักต้องเปิด (แน่นอก) — 3.2.1 feat. ใบเตย อาร์สยาม",
    "วอน — THE TOYS",
    "ก่อนฤดูฝน — THE TOYS",
    "หน้าหนาวที่แล้ว — THE TOYS",
    "เล่าสู่กันฟัง — เบิร์ด ธงไชย",
    "คู่กัด — เบิร์ด ธงไชย",
    "รักแรกพบ — Tattoo Colour",
    "ฤดูร้อน — Paradox",
    "อ้าว — Atom Chanakan",
    "ตามตะวัน — NUM KALA feat. แอ๊ด คาราบาว",
    "ห้ามตั๋ว — มีนตรา อินทิรา feat. OG-ANIC"
  ]
};
function addThaiSongsV25(categories){
 const songPack=categories?.thai_songs;
 if(!songPack||!songPack.groups||typeof songPack.groups!=='object')return 0;
 const used=new Set(Object.values(songPack.groups).flatMap(a=>Array.isArray(a)?a:[]).map(s=>String(s).split(' — ')[0].trim().toLocaleLowerCase()));
 let added=0;
 for(const [group,list] of Object.entries(ADDITIONAL_THAI_SONGS_V25)){
  const values=Array.isArray(songPack.groups[group])?[...songPack.groups[group]]:[];
  for(const value of list){
   const title=value.split(' — ')[0].trim().toLocaleLowerCase();
   if(!title||used.has(title))continue;
   used.add(title);values.push(value);added++;
  }
  // Only add a new subgroup if it contains new entries or existed already.
  if(values.length)songPack.groups[group]=values;
 }
 return added;
}
addThaiSongsV25(builtinCategories);
function defaultCategories(){const c=copyPack(builtinCategories);Object.values(c).forEach(x=>x.enabledModes=[...MODES]);return c;}
function isRemovedCategory(key,value){
 const id=String(key||'').toLowerCase(),name=String(value?.name||'').toLowerCase();
 return id==='blue_lock'||id==='demon_slayer'||name.includes('blue lock')||name.includes('demon slayer');
}
let familiarWordsMigrationStarted=false;
function migrateSharedFamiliarWords(){
 if(familiarWordsMigrationStarted||!sharedCategoryReady)return;
 familiarWordsMigrationStarted=true;
 sharedCategoryRef.transaction(raw=>{
  if(typeof raw!=='string')return;
  let doc;try{doc=JSON.parse(raw);}catch{return;}
  if(!doc?.categories||doc.contentRevisions?.familiarV15)return;
  addFamiliarWords(doc.categories);
  creditSongTitles(doc.categories);
  doc.contentRevisions={...(doc.contentRevisions||{}),familiarV15:Date.now(),artistCreditsV16:Date.now()};
  doc.updatedAt=Date.now();
  return JSON.stringify(doc);
 },undefined,false).catch(err=>console.warn('Shared content expansion requires Firebase write permission',err));
}
let songArtistMigrationStarted=false;
function migrateSharedSongArtists(){
 if(songArtistMigrationStarted||!sharedCategoryReady)return;
 songArtistMigrationStarted=true;
 sharedCategoryRef.transaction(raw=>{
  if(typeof raw!=='string')return;
  let doc;try{doc=JSON.parse(raw);}catch{return;}
  if(!doc?.categories||doc.contentRevisions?.artistCreditsV16)return;
  creditSongTitles(doc.categories);
  doc.contentRevisions={...(doc.contentRevisions||{}),artistCreditsV16:Date.now()};
  doc.updatedAt=Date.now();
  return JSON.stringify(doc);
 },undefined,false).catch(err=>{
  console.warn('Song artist update could not sync; check Firebase write permissions',err);
 });
}
// V25 shared-library migration: add missing defaults; keep user modifications.
let partyContentV25Started=false,partyContentV25Finished=false;
function migrateNewPartyContentV25(){
 if(!sharedCategoryReady||partyContentV25Started||partyContentV25Finished)return;
 partyContentV25Started=true;
 sharedCategoryRef.transaction(raw=>{
  if(typeof raw!=='string')return;
  let doc;try{doc=JSON.parse(raw);}catch{return;}
  if(!doc?.categories||typeof doc.categories!=='object'||Array.isArray(doc.categories))return;
  const rev=doc.contentRevisions||{};
  const needCategories=!rev.newPartyCategoriesV25,needSongs=!rev.extraThaiSongsV25;
  if(!needCategories&&!needSongs)return;
  const categories={...doc.categories},history=Array.isArray(doc.history)?doc.history.slice():[],now=Date.now();
  if(needCategories){
   for(const [key,pack] of Object.entries(NEW_PARTY_CATEGORIES_V25)){
    if(Object.prototype.hasOwnProperty.call(categories,key))continue;
    categories[key]={name:pack.name,groups:copyPack(pack.groups),enabledModes:[...MODES]};
    history.push({id:'builtin_v25_'+key,at:now,by:'ระบบอัปเดตเกม',action:'create',
     categoryKey:key,categoryName:pack.name,
     details:[`เพิ่มหมวดเริ่มต้น ${Object.keys(pack.groups).length} กลุ่ม ${wordsOf(pack).length} คำ`]});
   }
  }
  if(needSongs&&categories.thai_songs?.groups){
   const songs={...categories.thai_songs,groups:copyPack(categories.thai_songs.groups)};
   const added=addThaiSongsV25({thai_songs:songs});
   if(added){
    categories.thai_songs=songs;
    history.push({id:'builtin_v25_songs',at:now,by:'ระบบอัปเดตเกม',action:'edit',
     categoryKey:'thai_songs',categoryName:songs.name,
     details:[`เพิ่มเพลงไทยพร้อมศิลปิน ${added} เพลง แบ่งเป็น 4 กลุ่มย่อย`]});
   }
  }
  return JSON.stringify({...doc,version:1,updatedAt:now,categories,history:history.slice(-100),
   contentRevisions:{...rev,...(needCategories?{newPartyCategoriesV25:now}:{}),...(needSongs?{extraThaiSongsV25:now}:{})}});
 },undefined,false).then(result=>{
  partyContentV25Finished=true;
  if(result.committed)console.info('V25 categories and Thai songs synced to Firebase');
 }).catch(err=>{
  console.error('V25 category sync failed',err);
  managerSyncStatus('อัปเดต 10 หมวดและเพลงใน Firebase ไม่สำเร็จ กรุณาตรวจสอบสิทธิ์เขียนข้อมูล','error');
 }).finally(()=>{partyContentV25Started=false;});
}
let library=defaultCategories();
let categoryHistory=[],sharedCategoryReady=false,sharedCategoryBootstrapping=false,managerDirty=false;
const sharedCategoryRef=db.ref('sharedCategoryLibraryV1');
function parseSharedCategoryDocument(raw){
 if(typeof raw!=='string')throw new Error('ข้อมูลหมวดส่วนกลางไม่ใช่ JSON string');
 const document=JSON.parse(raw);
 if(!document||typeof document!=='object'||!document.categories||typeof document.categories!=='object'||Array.isArray(document.categories))throw new Error('รูปแบบหมวดส่วนกลางไม่ถูกต้อง');
 const result={};
 for(const [key,pack] of Object.entries(document.categories)){
  if(!/^[a-zA-Z0-9_-]{1,65}$/.test(key)||!pack||typeof pack.name!=='string'||!pack.groups||typeof pack.groups!=='object')continue;
  const groups={};
  for(const [label,words] of Object.entries(pack.groups)){
   if(!label.trim()||!Array.isArray(words))continue;
   groups[label]=[...new Set(words.filter(w=>typeof w==='string'&&w.trim()).map(w=>w.trim()))];
  }
  result[key]={name:pack.name,groups,enabledModes:Array.isArray(pack.enabledModes)?pack.enabledModes.filter(m=>MODES.includes(m)):[...MODES]};
 }
 return result;
}
function managerSyncStatus(message,state='loading'){
 const el=$('managerSyncStatus');if(!el)return;
 el.textContent=message;el.dataset.state=state;
}
function applySharedCategoryDocument(raw){
 const incoming=parseSharedCategoryDocument(raw);
 library=incoming;sharedCategoryReady=true;
 try{
  const doc=JSON.parse(raw);
  categoryHistory=Array.isArray(doc.history)?doc.history.filter(x=>x&&typeof x==='object').slice(-100):[];
 }catch{categoryHistory=[];}
 if(!$('categoryHistoryOverlay').hidden)renderCategoryHistory();
 managerSyncStatus('● ซิงก์กับ Firebase แล้ว · การแก้ไขจะมีผลกับผู้เล่นทุกคน','ready');
 renderCategoryChoices();
 migrateSharedFamiliarWords();
 migrateSharedSongArtists();
 migrateNewPartyContentV25();
 const view=$('managerView');
 if(view&&!view.hidden){
  if(!managerDirty&&!editNew){
   if(editKey&&library[editKey])chooseCategory(editKey);
   else if(Object.keys(library).length)chooseCategory(Object.keys(library)[0]);
   else{editDraft=null;editKey=null;renderManager();}
  }
 }
 if(roomState?.status==='lobby')renderRoom(roomState);
}

function describeCategoryMutation(before,after){
 const previous=before?.groups||{},next=after?.groups||{};
 const oldWords=new Set(Object.values(previous).flat().filter(x=>typeof x==='string'));
 const newWords=new Set(Object.values(next).flat().filter(x=>typeof x==='string'));
 const added=[...newWords].filter(w=>!oldWords.has(w));
 const removed=[...oldWords].filter(w=>!newWords.has(w));
 const groupsAdded=Object.keys(next).filter(k=>!Object.prototype.hasOwnProperty.call(previous,k));
 const groupsRemoved=Object.keys(previous).filter(k=>!Object.prototype.hasOwnProperty.call(next,k));
 const info=[];
 if(!before){info.push(`สร้างหมวดใหม่ · ${newWords.size} คำ`);}
 else if(!after){info.push(`ลบหมวด · เคยมี ${oldWords.size} คำ`);}
 else{
  if(before.name!==after.name)info.push(`เปลี่ยนชื่อ: ${before.name} → ${after.name}`);
  if(JSON.stringify(before.enabledModes||[])!==JSON.stringify(after.enabledModes||[]))info.push('เปลี่ยนโหมดเกมที่รองรับ');
 }
 if(groupsAdded.length)info.push(`เพิ่มกลุ่ม: ${groupsAdded.slice(0,5).join(', ')}${groupsAdded.length>5?'…':''}`);
 if(groupsRemoved.length)info.push(`ลบกลุ่ม: ${groupsRemoved.slice(0,5).join(', ')}${groupsRemoved.length>5?'…':''}`);
 if(added.length)info.push(`เพิ่ม ${added.length} คำ: ${added.slice(0,7).join(', ')}${added.length>7?'…':''}`);
 if(removed.length)info.push(`ลบ ${removed.length} คำ: ${removed.slice(0,7).join(', ')}${removed.length>7?'…':''}`);
 if(!info.length)info.push('บันทึกหมวดโดยไม่มีการเปลี่ยนแปลงคำ');
 return info.map(t=>t.slice(0,280)).slice(0,10);
}
function renderCategoryHistory(){
 const container=$('categoryHistoryList'),picker=$('historyCategoryFilter'),oldChoice=picker.value;
 const distinct=new Map();
 categoryHistory.forEach(item=>{
  if(item.categoryKey)distinct.set(item.categoryKey,String(item.categoryName||item.categoryKey));
 });
 Object.entries(library).forEach(([id,cat])=>distinct.set(id,cat.name));
 picker.replaceChildren();
 const all=document.createElement('option');all.value='all';all.textContent='ทุกหมวดหมู่';picker.append(all);
 [...distinct.entries()].sort((a,b)=>a[1].localeCompare(b[1],'th')).forEach(([key,name])=>{
  const option=document.createElement('option');option.value=key;option.textContent=name;picker.append(option);
 });
 picker.value=[...picker.options].some(el=>el.value===oldChoice)?oldChoice:'all';
 const filter=picker.value,events=categoryHistory.filter(item=>filter==='all'||item.categoryKey===filter).slice().reverse();
 $('categoryHistoryCount').textContent=`แสดง ${events.length} รายการ`;
 container.replaceChildren();
 if(!events.length){
  const empty=document.createElement('p');empty.className='category-history-empty';
  empty.textContent='ยังไม่มีประวัติการแก้ไขหมวดนี้ · ระบบเริ่มเก็บรายการใหม่ตั้งแต่เวอร์ชัน V18 เป็นต้นไป';
  container.append(empty);return;
 }
 events.forEach(entry=>{
  const item=document.createElement('article');item.className='category-history-entry';
  const head=document.createElement('div');head.className='category-history-entry-head';
  const title=document.createElement('strong');
  const verbs={create:'เพิ่มหมวด',edit:'แก้ไขหมวด',delete:'ลบหมวด'};
  title.textContent=`${verbs[entry.action]||'บันทึกหมวด'} · ${String(entry.categoryName||entry.categoryKey||'—')}`;
  const at=document.createElement('time');
  const time=new Date(Number(entry.at)||0);
  at.textContent=Number.isFinite(time.getTime())?time.toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'}):'ไม่ทราบเวลา';
  head.append(title,at);item.append(head);
  const actor=document.createElement('p');actor.className='category-history-actor';
  actor.textContent=`ผู้บันทึก (ชื่อในเกม): ${String(entry.by||'ไม่ระบุ')}`;item.append(actor);
  const details=document.createElement('ul');details.className='category-history-details';
  (Array.isArray(entry.details)?entry.details:[]).forEach(message=>{
   const row=document.createElement('li');row.textContent=String(message);details.append(row);
  });
  item.append(details);container.append(item);
 });
}
$('openCategoryHistoryBtn').onclick=()=>{
 $('categoryHistoryOverlay').hidden=false;
 $('historyCategoryFilter').value='all';
 renderCategoryHistory();
 $('closeCategoryHistoryBtn').focus();
};
$('closeCategoryHistoryBtn').onclick=()=>{
 $('categoryHistoryOverlay').hidden=true;
 $('openCategoryHistoryBtn').focus();
};
$('historyCategoryFilter').onchange=renderCategoryHistory;
$('categoryHistoryOverlay').onclick=e=>{
 if(e.target===$('categoryHistoryOverlay'))$('closeCategoryHistoryBtn').click();
};
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!$('categoryHistoryOverlay').hidden)$('closeCategoryHistoryBtn').click();
});

async function mutateSharedCategory(key,pack,create=false){
 if(!sharedCategoryReady)throw new Error('ยังไม่ได้เชื่อมต่อข้อมูลหมวดส่วนกลาง');
 const recordedAt=Date.now(),actor=String(myName||'ไม่ระบุ').slice(0,30);
 const eventId=`edit_${recordedAt}_${Math.random().toString(36).slice(2,10)}`;
 const result=await sharedCategoryRef.transaction(raw=>{
  if(typeof raw!=='string')return;
  let document;
  try{document=JSON.parse(raw);}catch{return;}
  if(!document?.categories||typeof document.categories!=='object')return;
  const categories={...document.categories};
  if(create&&Object.keys(categories).length>=100)return;
  if(!create&&!Object.prototype.hasOwnProperty.call(categories,key))return;
  const previous=categories[key]||null;
  if(pack===null)delete categories[key];
  else categories[key]=pack;
  const entry={
   id:eventId,at:recordedAt,by:actor,action:pack===null?'delete':create?'create':'edit',
   categoryKey:key,categoryName:String(pack?.name||previous?.name||key).slice(0,55),
   details:describeCategoryMutation(previous,pack)
  };
  const history=[...(Array.isArray(document.history)?document.history:[]),entry].slice(-100);
  // Preserve previous metadata and content revisions instead of overwriting them.
  return JSON.stringify({...document,version:1,updatedAt:recordedAt,categories,history});
 },undefined,false);
 if(!result.committed)throw new Error('บันทึกไม่สำเร็จ ข้อมูลอาจถูกแก้ไขจากเครื่องอื่น กรุณาลองอีกครั้ง');
 applySharedCategoryDocument(result.snapshot.val());
 return result;
}
sharedCategoryRef.on('value',snap=>{
 const raw=snap.val();
 if(raw===null){
  sharedCategoryReady=false;
  managerSyncStatus('กำลังสร้างคลังหมวดคำส่วนกลางครั้งแรก…');
  if(!sharedCategoryBootstrapping){
   sharedCategoryBootstrapping=true;
   sharedCategoryRef.transaction(value=>{
    if(value!==null)return;
    return JSON.stringify({version:1,updatedAt:Date.now(),categories:defaultCategories()});
   },undefined,false).catch(err=>{
    console.error('Shared category bootstrap failed',err);
    managerSyncStatus('เชื่อมต่อไม่ได้: Firebase ยังไม่อนุญาตให้เขียน sharedCategoryLibraryV1','error');
   }).finally(()=>sharedCategoryBootstrapping=false);
  }
  return;
 }
 try{applySharedCategoryDocument(raw);}
 catch(err){console.error('Invalid shared categories',err);sharedCategoryReady=false;managerSyncStatus('ข้อมูลหมวดส่วนกลางอ่านไม่ได้ กรุณาตรวจสอบ Firebase','error');}
},err=>{
 sharedCategoryReady=false;
 console.error('Cannot subscribe to shared categories',err);
 managerSyncStatus('Firebase Rules ไม่อนุญาตให้อ่าน sharedCategoryLibraryV1 · ต้องเปิดสิทธิ์ส่วนนี้ก่อนใช้งาน','error');
});
const packFor=r=>{
 const candidates=[r?.categoryPack,library[r?.category],builtinCategories[r?.category]];
 return candidates.find(pack=>supportsMode(pack,r?.gameMode))||candidates.find(pack=>wordsOf(pack).length)||builtinCategories.rov;
},enabledFor=p=>Array.isArray(p?.enabledModes)&&p.enabledModes.length?p.enabledModes:MODES;
function showOnly(v){['homeView','createView','managerView','roomView'].forEach(id=>$(id).hidden=id!==v);}function showScreen(v){['lobbyScreen','spyScreen','whoScreen','voteScreen','resultsScreen','grandFinalScreen'].forEach(id=>$(id).hidden=id!==v);}
function toast(msg,type='info'){const el=document.createElement('div');el.className=`toast ${type}`;el.textContent=msg;$('toasts').prepend(el);setTimeout(()=>el.remove(),5000);}
function error(e){
 console.error('Party Game Firebase error:',e);
 const code=String(e?.code||'').toUpperCase(),message=String(e?.message||'');
 if(code.includes('PERMISSION_DENIED')||message.toLowerCase().includes('permission_denied')){
  toast('Firebase Rules ยังไม่อนุญาตให้เขียนข้อมูลใน /rooms กรุณาตรวจสอบสิทธิ์ Read/Write ของ Realtime Database','error');
 }else if(code.includes('NETWORK')||message.toLowerCase().includes('network')){
  toast('เชื่อมต่อ Firebase ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง','error');
 }else{
  toast(`ทำรายการไม่สำเร็จ${code?` (${code})`:''} · ${message||'กรุณาลองอีกครั้ง'}`,'error');
 }
}
function formatLeft(ts){const n=Math.max(0,Math.ceil((Number(ts||0)-serverNow())/1000));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
function renderGameStats(targetId,items){const target=$(targetId);if(!target)return;target.replaceChildren();items.forEach(item=>{const card=document.createElement('div');card.className='game-stat';const label=document.createElement('small');label.textContent=item.label;const value=document.createElement('strong');value.textContent=item.value;card.append(label,value);target.append(card);});}
function renderOrder(target,r,highlight=true){target.replaceChildren();(r.turnOrder||[]).forEach((id,i)=>{const chip=document.createElement('span');chip.className=`chip ${highlight&&i===(r.currentTurnIndex||0)?'current':''}`;chip.innerHTML=`<span class="turn-number">${i+1}</span>${playerLabelHTML(id,r)}`;target.append(chip);});}
let confirmResolver=null;function confirmBox(title,msg,yes='ยืนยัน'){if(confirmResolver)confirmResolver(false);$('dialogTitle').textContent=title;$('dialogMessage').textContent=msg;$('dialogYes').textContent=yes;$('dialog').hidden=false;$('dialogCancel').focus();return new Promise(resolve=>confirmResolver=resolve);}function dismissConfirm(ok){if(!confirmResolver)return;const r=confirmResolver;confirmResolver=null;$('dialog').hidden=true;r(ok);}
$('dialogCancel').onclick=()=>dismissConfirm(false);$('dialogYes').onclick=()=>dismissConfirm(true);$('dialog').onclick=e=>{if(e.target===$('dialog'))dismissConfirm(false);};document.addEventListener('keydown',e=>{if(e.key==='Escape')dismissConfirm(false);});

// Player name: localStorage changes ONLY after clicking the check button.
// On refresh, old saved name is prefilled and editable; it must be confirmed again.
function renderNameConfirmation(){const input=$('nameInput'),button=$('confirmNameBtn'),status=$('nameStatus');input.value=myName;input.disabled=nameConfirmed;button.disabled=nameConfirmed;input.classList.toggle('name-locked',nameConfirmed);button.classList.toggle('confirmed',nameConfirmed);status.classList.toggle('name-confirmed',nameConfirmed);button.textContent=nameConfirmed?'ยืนยันแล้ว':'ยืนยัน';button.title=nameConfirmed?'ยืนยันชื่อเรียบร้อยแล้ว':'กดยืนยันชื่อ';button.setAttribute('aria-label',button.title);status.textContent=nameConfirmed?`ยืนยันชื่อ ${myName} เรียบร้อยแล้ว`:myName?`พบชื่อเดิม "${myName}" แก้ไขได้ แล้วกดปุ่มยืนยันอีกครั้ง`:'กรอกชื่อแล้วกดปุ่มยืนยันเพื่อยืนยันชื่อ';}
$('nameInput').addEventListener('input',()=>{if(nameConfirmed)$('nameInput').value=myName;});
$('confirmNameBtn').addEventListener('click',()=>{if(nameConfirmed)return;const value=$('nameInput').value.trim();if(!value){toast('กรุณากรอกชื่อเล่นก่อนยืนยัน','error');$('nameInput').focus();return;}if(value.length>15){toast('ชื่อเล่นต้องไม่เกิน 15 ตัวอักษร','error');return;}myName=value;localStorage.setItem('rov_spy_myname',myName);nameConfirmed=true;renderNameConfirmation();toast(' ยืนยันชื่อเรียบร้อยแล้ว','success');if(roomId){showOnly('roomView');reconnect();}});
renderNameConfirmation();
renderAvatarPicker();
function ensureName(){if(!nameConfirmed||!myName){toast('กรุณากรอกชื่อและกดยืนยันชื่อก่อนเล่นเกม','error');if(!$('nameInput').value.trim())$('nameInput').focus();else $('confirmNameBtn').focus();return false;}return true;}

// ===== Room list and automatic cleanup =====
function inactive(r){const t=r?.lastActivityAt??r?.createdAt;return typeof t==='number'&&serverNow()-t>=IDLE_MS;}
db.ref('rooms').on('value',s=>renderRoomList(s.val()||{}),error);
function renderRoomList(rooms){const list=$('roomList');list.replaceChildren();const entries=Object.entries(rooms).filter(([,r])=>r&&!inactive(r));if(!entries.length){list.innerHTML='<p class="muted">ยังไม่มีห้อง ลองสร้างห้องใหม่เลย </p>';return;}entries.sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0));entries.forEach(([id,r])=>{const row=document.createElement('div');row.className='room-entry';const info=document.createElement('div'),title=document.createElement('strong'),sub=document.createElement('p');title.textContent=` ${r.roomName||id}`;sub.textContent=`เลขห้อง ${r.roomCode||id} · ${modeTitle(r.gameMode)} · ${Object.keys(r.players||{}).length} คน · ${r.status==='finished'?'จบเกมแล้ว':r.status==='lobby'?'รอผู้เล่น':'กำลังเล่น'}`;info.append(title,sub);const btn=document.createElement('button');btn.className='btn soft small';btn.textContent=r.status==='lobby'?'เข้าร่วม':'กำลังเล่น';btn.disabled=r.status!=='lobby';btn.onclick=()=>{if(ensureName())joinRoom(id);};row.append(info,btn);list.append(row);});}
async function removeInactive(id){await db.ref(`rooms/${id}`).transaction(r=>{if(r&&inactive(r))return null;},undefined,false);}
async function sweep(){if(sweepBusy)return;sweepBusy=true;try{const s=await db.ref('rooms').once('value');for(const [id,r] of Object.entries(s.val()||{}))if(inactive(r))await removeInactive(id);}catch(e){console.warn('Idle cleanup',e);}finally{sweepBusy=false;}}
setTimeout(sweep,1500);setInterval(sweep,30000);
function touch(){if(!roomId||leaving||serverNow()-lastTouch<45000)return;lastTouch=serverNow();getRef().child('lastActivityAt').set(TIMESTAMP()).catch(error);}
$('roomView').addEventListener('pointerdown',touch);$('roomView').addEventListener('keydown',touch);

// ===== Create room and category selection =====
$('openCreateBtn').onclick=()=>{if(!ensureName())return;selectedMode='';selectedCategory='';selectedSpyVariant='secret';$('durationInput').value=2;$('createDetails').hidden=true;renderModeChoices();showOnly('createView');};
$('createBackBtn').onclick=()=>showOnly('homeView');
function chooseMode(mode){
 selectedMode=mode;selectedCategory='';$('durationInput').value=mode==='whoami_time'?3:2;
 $('createDetails').hidden=false;
 $('durationLabel').textContent=mode==='whoami_time'?'นาทีต่อผู้เล่น':mode==='whoami_rounds'?'จำนวนรอบถาม':'จำนวนรอบพูด';
 $('durationHelp').textContent=mode==='whoami_time'?'เวลานับเฉพาะตอนถึงตาและหยุดเมื่อกดผ่านเทิร์น':mode==='whoami_rounds'?'จบรอบจะมีเวลา 2 นาทีให้คนที่ยังไม่ตอบ': 'ครบเทิร์นแล้วจะโหวต';
 renderModeChoices();
}
function renderModeChoices(){
 document.querySelectorAll('#modeOptions [data-mode]').forEach(b=>{const on=b.dataset.mode==='whoami'?selectedMode.startsWith('whoami'):selectedMode==='spyfall';b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});
 $('whoFormatSection').hidden=!selectedMode.startsWith('whoami');
 $('spyFormatSection').hidden=selectedMode!=='spyfall';
 document.querySelectorAll('[data-spy-format]').forEach(b=>{
  const active=b.dataset.spyFormat===selectedSpyVariant;
  b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));
 });
 document.querySelectorAll('[data-who-format]').forEach(b=>{const on=b.dataset.whoFormat===selectedMode;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});
 renderCategoryChoices();
}
$('modeOptions').onclick=e=>{const b=e.target.closest('[data-mode]');if(b)chooseMode(b.dataset.mode==='whoami'?'whoami_time':'spyfall');};
$('whoFormatSection').onclick=e=>{const b=e.target.closest('[data-who-format]');if(b)chooseMode(b.dataset.whoFormat);};
$('spyFormatSection').onclick=e=>{
 const b=e.target.closest('[data-spy-format]');if(!b)return;
 selectedSpyVariant=b.dataset.spyFormat==='aware'?'aware':'secret';renderModeChoices();
};
function renderCategoryChoices(){const target=$('categoryOptions');target.replaceChildren();const entries=Object.entries(library).filter(([,c])=>enabledFor(c).includes(selectedMode)&&supportsMode(c,selectedMode));if(!entries.some(([id])=>id===selectedCategory))selectedCategory='';entries.forEach(([key,c])=>{const b=document.createElement('button');b.className=`choice ${selectedCategory===key?'selected':''}`;b.type='button';b.innerHTML=`<strong>${esc(c.name)}</strong><small>${wordsOf(c).length} คำ</small>`;b.onclick=()=>{selectedCategory=key;renderCategoryChoices();};target.append(b);});if(!entries.length)target.innerHTML='<p class="muted">ไม่มีหมวดที่เปิดให้ใช้กับโหมดนี้</p>';$('createConfirmBtn').disabled=!selectedMode||!selectedCategory;}
$('minusBtn').onclick=()=>{$('durationInput').value=Math.max(1,Number($('durationInput').value||2)-1);};$('plusBtn').onclick=()=>{$('durationInput').value=Math.min(99,Number($('durationInput').value||2)+1);};

// ===== Shared Firebase category manager =====
$('openManagerBtn').onclick=()=>openManager('homeView');
$('managerBackBtn').onclick=()=>{showOnly(managerReturn);if(managerReturn==='createView')renderCategoryChoices();};
function openManager(from){
 managerReturn=from;showOnly('managerView');
 if(!editDraft&&Object.keys(library).length)chooseCategory(Object.keys(library)[0]);
 else renderManager();
 if(!sharedCategoryReady)managerSyncStatus('กำลังเชื่อมต่อ Firebase หรือยังไม่มีสิทธิ์เข้าถึงคลังส่วนกลาง','error');
}
function chooseCategory(key){
 if(!library[key])return;
 editKey=key;editNew=false;managerDirty=false;
 const p=copyPack(library[key]);
 editDraft={name:p.name,enabledModes:[...enabledFor(p)],groups:Object.entries(p.groups).map(([name,words])=>({name,words:[...words]}))};
 renderManager();
}
function renderManager(){
 const target=$('managerList');target.replaceChildren();
 Object.entries(library).forEach(([key,c])=>{
  const b=document.createElement('button');
  b.className=`manager-item ${!editNew&&key===editKey?'selected':''}`;
  b.textContent=c.name;
  const s=document.createElement('small');s.textContent=`${wordsOf(c).length} คำ`;
  b.append(s);b.onclick=()=>chooseCategory(key);target.append(b);
 });
 $('managerEditor').hidden=!editDraft;
 $('managerEmpty').hidden=!!editDraft;
 $('newCategoryBtn').disabled=!sharedCategoryReady;
 if(!editDraft)return;
 $('editCategoryName').value=editDraft.name;
 document.querySelectorAll('#enabledModes input').forEach(c=>c.checked=editDraft.enabledModes.includes(c.value));
 $('deleteCategoryBtn').disabled=editNew||!sharedCategoryReady;
 $('saveCategoryBtn').disabled=!sharedCategoryReady;
 renderGroups();
}
$('editCategoryName').oninput=()=>{if(editDraft){editDraft.name=$('editCategoryName').value;managerDirty=true;}};
$('enabledModes').onchange=()=>{if(editDraft){editDraft.enabledModes=[...document.querySelectorAll('#enabledModes input:checked')].map(x=>x.value);managerDirty=true;}};
function parseWords(t){return [...new Set(String(t).split(/[\n,，]+/).map(x=>x.trim()).filter(Boolean))];}
function renderGroups(){
 const target=$('groupEditors');target.replaceChildren();
 editDraft.groups.forEach((g,i)=>{
  const box=document.createElement('div');box.className='group-edit';
  const head=document.createElement('div');head.className='head';
  const name=document.createElement('input');name.value=g.name;name.placeholder='ชื่อกลุ่ม';name.maxLength=45;
  name.oninput=()=>{g.name=name.value;managerDirty=true;};
  const del=document.createElement('button');del.className='btn danger small';del.textContent='ลบ';
  del.onclick=()=>{editDraft.groups.splice(i,1);managerDirty=true;renderGroups();};
  head.append(name,del);
  const input=document.createElement('textarea');input.value=g.words.join('\n');input.placeholder='พิมพ์คำละ 1 บรรทัด';
  const count=document.createElement('small');count.textContent=`${g.words.length} คำ`;
  input.oninput=()=>{g.words=parseWords(input.value);count.textContent=`${g.words.length} คำ`;managerDirty=true;};
  box.append(head,input,count);target.append(box);
 });
}
$('newCategoryBtn').onclick=()=>{
 if(!sharedCategoryReady){toast('ยังไม่ได้เชื่อมต่อ Firebase ส่วนกลาง','error');return;}
 editKey=null;editNew=true;managerDirty=true;
 editDraft={name:'',enabledModes:[...MODES],groups:[{name:'กลุ่มแรก',words:[]}]};
 renderManager();$('editCategoryName').focus();
};
$('addGroupBtn').onclick=()=>{
 if(!editDraft)return;
 if(editDraft.groups.length>=20){toast('สูงสุด 20 กลุ่มต่อหมวด','error');return;}
 editDraft.groups.push({name:`กลุ่ม ${editDraft.groups.length+1}`,words:[]});
 managerDirty=true;renderGroups();
};
$('saveCategoryBtn').onclick=async()=>{
 if(!editDraft||!sharedCategoryReady){toast('ต้องเชื่อมต่อ Firebase ส่วนกลางก่อนบันทึก','error');return;}
 const name=editDraft.name.trim();
 if(name.length<2||name.length>40){toast('ชื่อหมวดต้องยาว 2–40 ตัว','error');return;}
 if(!editDraft.enabledModes.length){toast('เลือกโหมดเกมอย่างน้อย 1 โหมด','error');return;}
 const groups={};
 for(const g of editDraft.groups){
  const n=g.name.trim();
  if(!n||Object.prototype.hasOwnProperty.call(groups,n)||g.words.length>150||g.words.some(w=>w.length>60)){
   toast('ตรวจสอบชื่อกลุ่ม คำซ้ำ หรือจำนวนคำ','error');return;
  }
  if(g.words.length)groups[n]=[...new Set(g.words)];
 }
 if(!Object.keys(groups).length){toast('เพิ่มคำอย่างน้อยหนึ่งคำ','error');return;}
 if(editDraft.enabledModes.includes('spyfall')&&!Object.values(groups).some(g=>new Set(g.map(norm)).size>=2)){
  toast('Spyfall ต้องมีกลุ่มที่มีอย่างน้อยสองคำ','error');return;
 }
 const key=editNew?`custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`:editKey;
 const pack={name,groups,enabledModes:[...editDraft.enabledModes]},wasNew=editNew;
 const button=$('saveCategoryBtn');button.disabled=true;
 try{
  await mutateSharedCategory(key,pack,wasNew);
  managerDirty=false;chooseCategory(key);
  toast(' บันทึกหมวดลง Firebase แล้ว ทุกคนเห็นข้อมูลใหม่ทันที','success');
 }catch(e){
  console.error('Shared category save failed',e);
  toast(`บันทึกส่วนกลางไม่สำเร็จ: ${e.message||'ตรวจสอบ Firebase Rules'}`,'error');
 }finally{button.disabled=!sharedCategoryReady;}
};
$('deleteCategoryBtn').onclick=async()=>{
 if(!editKey||!sharedCategoryReady)return;
 if(!await confirmBox('ลบหมวดส่วนกลาง?',`ลบ “${library[editKey]?.name||editKey}” ออกจากทุกเครื่องที่ใช้เว็บไซต์นี้`,'ลบให้ทุกคน'))return;
 const key=editKey,button=$('deleteCategoryBtn');button.disabled=true;
 try{
  await mutateSharedCategory(key,null,false);
  editDraft=null;editKey=null;editNew=false;managerDirty=false;
  const first=Object.keys(library)[0];
  if(first)chooseCategory(first);else renderManager();
  toast('ลบหมวดจาก Firebase ส่วนกลางแล้ว','success');
 }catch(e){
  console.error('Shared category delete failed',e);
  toast(`ลบส่วนกลางไม่สำเร็จ: ${e.message||'ตรวจสอบ Firebase Rules'}`,'error');
 }finally{button.disabled=!sharedCategoryReady||editNew;}
};


// ===== Room lifecycle =====
function unsubscribe(){if(subscribedRef&&roomCallback)subscribedRef.off('value',roomCallback);subscribedRef=null;roomCallback=null;}
function goHome(msg=''){unsubscribe();roomId='';roomState=null;isHost=false;leaving=false;sessionStorage.removeItem('pg_room_v6');$('leaveBtn').hidden=true;showOnly('homeView');if(msg)toast(msg);}
function enterRoom(id){unsubscribe();roomId=id;leaving=false;lastTouch=serverNow();sessionStorage.setItem('pg_room_v6',id);$('roomTitle').textContent='กำลังโหลดห้อง…';$('roomCode').textContent=id;$('leaveBtn').hidden=false;showOnly('roomView');subscribe();}
function subscribe(){if(!roomId)return;unsubscribe();const id=roomId,ref=db.ref(`rooms/${id}`);const cb=s=>{if(id!==roomId||leaving)return;const r=s.val();if(!r){goHome('ห้องถูกปิดหรือหมดอายุแล้ว');return;}roomState=r;isHost=r.hostId===myId;const ps=r.players||{};if(Object.keys(ps).length&&!ps[r.hostId])ref.transaction(x=>{if(!x)return;const ids=Object.keys(x.players||{});if(ids.length&&!x.players[x.hostId]){x.hostId=ids[0];return x;}},undefined,false).catch(error);renderRoom(r);runAutomatic();};subscribedRef=ref;roomCallback=cb;ref.on('value',cb,error);}
async function reconnect(){if(!roomId||leaving||reconnectBusy)return;if(!nameConfirmed||!myName){showOnly('homeView');toast('กรุณายืนยันชื่อก่อนกลับเข้าห้อง','error');return;}reconnectBusy=true;const id=roomId,ref=db.ref(`rooms/${id}`);try{const s=await ref.once('value'),r=s.val();if(id!==roomId)return;if(!r||inactive(r)){if(r)await removeInactive(id);goHome('ห้องเดิมหมดอายุแล้ว');return;}if(r.status!=='lobby'&&r.status!=='finished'&&!r.roles?.[myId]){goHome('เกมเริ่มแล้ว ไม่สามารถเข้ากลางเกมได้');return;}await ref.child(`players/${myId}`).onDisconnect().remove();await ref.child(`players/${myId}`).set({name:myName,avatar:myAvatar});await ref.child(`playerProfiles/${myId}`).set({name:myName,avatar:myAvatar});if(!subscribedRef)subscribe();}catch(e){error(e);}finally{reconnectBusy=false;}}
db.ref('.info/connected').on('value',s=>{if(s.val()===true&&roomId&&!leaving&&nameConfirmed)reconnect();});

async function generateRoomCode(){
 const snap=await db.ref('rooms').once('value');
 const rooms=snap.val()||{};
 const used=new Set(Object.values(rooms).filter(Boolean).map(r=>String(r.roomCode||'')));
 for(let attempt=0;attempt<80;attempt++){
  const code=String(Math.floor(100000+Math.random()*900000));
  if(!used.has(code))return code;
 }
 throw new Error('ไม่สามารถสร้างเลขห้องที่ไม่ซ้ำได้ กรุณาลองอีกครั้ง');
}
$('createConfirmBtn').onclick=async()=>{
 if(!ensureName())return;
 const typedName=$('roomNameInput').value.trim(),n=Number($('durationInput').value),pack=library[selectedCategory];
 if(typedName&&!/^[\p{L}\p{N}_-]{1,20}$/u.test(typedName)){toast('ชื่อห้องใช้ตัวอักษร ตัวเลข - _ ไม่เกิน 20 ตัว','error');return;}
 if(!selectedMode||!pack||!enabledFor(pack).includes(selectedMode)){toast('เลือกโหมดและหมวดคำก่อน','error');return;}
 if(!supportsMode(pack,selectedMode)){toast('หมวดนี้ยังไม่มีคำที่พร้อมเล่นกับโหมดที่เลือก','error');return;}
 if(!Number.isInteger(n)||n<1||n>99){toast('จำนวนรอบ/นาทีต้องอยู่ระหว่าง 1–99','error');return;}
 if(selectedMode==='spyfall'&&!Object.values(pack.groups).some(g=>new Set(g.map(norm)).size>=2)){toast('หมวดนี้ต้องมีกลุ่มที่มีคำไม่ซ้ำอย่างน้อย 2 คำสำหรับ Spyfall','error');return;}
 if(!wordsOf(pack).length){toast('หมวดไม่มีคำ','error');return;}
 const button=$('createConfirmBtn');
 button.disabled=true;button.textContent='กำลังสร้างห้อง…';
 try{
  const roomCode=await generateRoomCode();
  const roomName=typedName||`room${roomCode}`;
  const ref=db.ref('rooms').push(),id=ref.key;
  if(!id)throw new Error('Firebase did not return a room key');
  const roomData={
   roomName,roomCode,hostId:myId,gameMode:selectedMode,category:selectedCategory,
   categoryPack:firebaseSafePack(pack),settingValue:n,spyVariant:selectedMode==='spyfall'?selectedSpyVariant:'secret',status:'lobby',
   players:{[myId]:{name:myName,avatar:myAvatar}},playerProfiles:{[myId]:{name:myName,avatar:myAvatar}},scores:{[myId]:0},
   createdAt:TIMESTAMP(),lastActivityAt:TIMESTAMP(),gamesPlayed:0
  };
  await ref.set(roomData);
  try{await ref.child(`players/${myId}`).onDisconnect().remove();}
  catch(disconnectError){console.warn('onDisconnect registration failed; room is still created',disconnectError);}
  enterRoom(id);toast(`สร้างห้อง ${roomName} · เลขห้อง ${roomCode} เรียบร้อย!`,'success');
 }catch(e){error(e);}
 finally{button.disabled=false;button.textContent='สร้างห้อง →';renderCategoryChoices();}
};
async function joinRoom(id){if(!ensureName())return;const ref=db.ref(`rooms/${id}`);try{await ref.child(`players/${myId}`).onDisconnect().remove();const res=await ref.transaction(r=>{if(!r||r.status!=='lobby'||inactive(r))return;r.players||={};r.players[myId]={name:myName,avatar:myAvatar};r.playerProfiles||={};r.playerProfiles[myId]={name:myName,avatar:myAvatar};r.scores||={};r.scores[myId]??=0;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);if(!res.committed){await ref.child(`players/${myId}`).onDisconnect().cancel();toast('ห้องนี้เข้าร่วมไม่ได้แล้ว','error');return;}enterRoom(id);toast('เข้าห้องแล้ว','success');}catch(e){error(e);}}
async function joinRoomByCode(){
 if(!ensureName())return;
 const code=$('joinRoomCodeInput').value.trim();
 if(!code){toast('กรอกเลขห้องก่อนเข้าร่วม','error');$('joinRoomCodeInput').focus();return;}
 const button=$('joinRoomCodeBtn');button.disabled=true;button.textContent='กำลังค้นหา…';
 try{
  const snap=await db.ref('rooms').once('value'),rooms=snap.val()||{};
  const match=Object.entries(rooms).find(([id,r])=>r&&!inactive(r)&&(
   String(r.roomCode||'')===code||id===code||String(r.roomName||'').toLocaleLowerCase()===code.toLocaleLowerCase()
  ));
  if(!match){toast('ไม่พบห้องนี้ ตรวจสอบเลขห้องแล้วลองอีกครั้ง','error');return;}
  await joinRoom(match[0]);
 }catch(e){error(e);}
 finally{button.disabled=false;button.textContent='เข้าร่วม →';}
}
$('joinRoomCodeBtn').onclick=joinRoomByCode;
$('joinRoomCodeInput').addEventListener('keydown',e=>{if(e.key==='Enter')joinRoomByCode();});

$('leaveBtn').onclick=async()=>{if(!roomId||!await confirmBox('ออกจากห้อง?','คุณจะออกจากเกมปัจจุบัน','ออกจากห้อง'))return;const ref=getRef();leaving=true;try{await ref.child(`players/${myId}`).onDisconnect().cancel();await ref.transaction(r=>{if(!r||!r.players?.[myId])return;delete r.players[myId];if(r.hostId===myId)r.hostId=Object.keys(r.players)[0]||null;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);goHome('ออกจากห้องแล้ว');}catch(e){leaving=false;error(e);}};
$('copyRoomBtn').onclick=async()=>{try{const code=roomState?.roomCode||roomId;await navigator.clipboard.writeText(code);toast(`คัดลอกเลขห้อง ${code} แล้ว`,'success');}catch{toast(`เลขห้องคือ ${roomState?.roomCode||roomId}`);}};
async function closeRoom(){if(!isHost||!roomId||!await confirmBox('ปิดห้อง?','ผู้เล่นทุกคนจะออกและคะแนนถูกลบ','ปิดห้อง'))return;try{await getRef().remove();goHome('ปิดห้องแล้ว');}catch(e){error(e);}}
$('deleteRoomBtn').onclick=closeRoom;$('closeAfterBtn').onclick=closeRoom;

// ===== Final match closing and cumulative results =====
function finalStandingsForRoom(r){
 const players=everyoneWithScores(r),scores=r.scores||{};
 const standings=Object.keys(players).map(id=>({
  id,name:String(players[id]?.name||'ผู้เล่น'),avatar:String(players[id]?.avatar||'fox'),
  score:Number(scores[id])||0
 })).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'th'));
 let previousScore=null,rank=0;
 standings.forEach((player,index)=>{
  if(previousScore!==player.score){rank=index+1;previousScore=player.score;}
  player.rank=rank;
 });
 const max=standings.length?standings[0].score:0;
 return {
  roundsPlayed:Number(r.gamesPlayed)||0,
  finishedAt:serverNow(),
  standings,winners:standings.filter(p=>p.score===max).map(p=>p.id)
 };
}
function renderGrandFinal(r){
 const data=r.finalSummary?.standings?.length?r.finalSummary:finalStandingsForRoom(r);
 const list=Array.isArray(data.standings)?data.standings:[];
 const winners=list.filter(player=>data.winners?.includes(player.id));
 const content=$('grandFinalContent');content.replaceChildren();
 const hero=document.createElement('section');hero.className='grand-final-hero';
 const kicker=document.createElement('p');kicker.className='grand-final-kicker';
 kicker.textContent=`เล่นทั้งหมด ${data.roundsPlayed||0} ตา · ${list.length} ผู้เล่น`;
 const heading=document.createElement('h2');
 heading.textContent=winners.length>1?' ผู้ชนะร่วมของการแข่งขัน':winners.length===1?' แชมป์การแข่งขัน':' เกมจบแล้ว';
 const champion=document.createElement('div');champion.className='grand-final-winners';
 if(winners.length)winners.forEach(player=>{
  const tile=document.createElement('div');tile.className='grand-final-champion';
  const label=document.createElement('div');label.className='grand-final-champion-label';
  label.innerHTML=`${avatarMarkup({avatar:player.avatar})}<strong>${esc(player.name)}</strong>`;
  const points=document.createElement('b');points.textContent=`${player.score} คะแนน`;
  tile.append(label,points);champion.append(tile);
 });else champion.textContent='ไม่มีผู้เล่นในสรุปการแข่งขัน';
 hero.append(kicker,heading,champion);content.append(hero);
 const section=document.createElement('section');section.className='result-section';
 const title=document.createElement('h3');title.textContent=' ตารางคะแนนสะสมสุดท้าย';
 const rows=document.createElement('div');rows.className='grand-final-standings';
 list.forEach(player=>{
  const row=document.createElement('div');row.className=`grand-final-rank-row ${player.rank===1?'champion':''}`;
  const identity=document.createElement('div');identity.className='grand-final-rank-identity';
  const rank=document.createElement('span');rank.className='grand-final-rank-badge';
  rank.textContent=String(player.rank);
  const name=document.createElement('div');name.className='grand-final-rank-name';
  name.innerHTML=`${avatarMarkup({avatar:player.avatar})}<span>${esc(player.name)}</span>`;
  identity.append(rank,name);
  const score=document.createElement('strong');score.textContent=`${player.score} คะแนน`;
  row.append(identity,score);rows.append(row);
 });
 section.append(title,rows);content.append(section);
 $('grandFinalCloseBtn').hidden=!isHost;
}
$('finishMatchBtn').onclick=async()=>{
 if(!roomId||!isHost||!roomState||roomState.status!=='lobby'||Number(roomState.gamesPlayed||0)<1)return;
 if(!await confirmBox('จบการแข่งขันทั้งหมด?', 'จะปิดการแข่งขันและแสดงคะแนนสะสมกับผู้ชนะให้ทุกคนในห้อง ไม่สามารถเริ่มตาใหม่ได้อีก', ' จบเกม'))return;
 const button=$('finishMatchBtn');button.disabled=true;
 try{
  const result=await getRef().transaction(r=>{
   if(!r||r.status!=='lobby'||r.hostId!==myId||Number(r.gamesPlayed||0)<1)return;
   r.finalSummary=finalStandingsForRoom(r);r.status='finished';r.lastActivityAt=TIMESTAMP();
   return r;
  },undefined,false);
  if(result.committed)toast(' เกมจบแล้ว! กำลังแสดงสรุปผู้ชนะทุกคน','success');
  else toast('ไม่สามารถจบเกมได้ กรุณาตรวจสอบสถานะห้อง','error');
 }catch(e){error(e);}finally{button.disabled=false;}
};
$('grandFinalLeaveBtn').onclick=()=>$('leaveBtn').click();
$('grandFinalCloseBtn').onclick=()=>closeRoom();

// ===== Game rendering =====
function renderLobbyCategory(r){
 const select=$('lobbyCategorySelect'),button=$('lobbyChangeCategoryBtn'),pack=library[r.category]||packFor(r),currentKey=String(r.category||'');
 const entries=Object.entries(library)
  .filter(([,candidate])=>enabledFor(candidate).includes(r.gameMode)&&supportsMode(candidate,r.gameMode))
  .sort((a,b)=>String(a[1].name||'').localeCompare(String(b[1].name||''),'th'));
 select.replaceChildren();
 const hasCurrent=entries.some(([key])=>key===currentKey);
 if(currentKey&&!hasCurrent){
  const option=document.createElement('option');option.value=currentKey;
  option.textContent=`${pack.name||'หมวดปัจจุบัน'} · ใช้อยู่ในห้อง`;select.append(option);
 }
 entries.forEach(([key,candidate])=>{
  const option=document.createElement('option');option.value=key;
  option.textContent=`${candidate.name} · ${wordsOf(candidate).length} คำ`;select.append(option);
 });
 if(currentKey&&[...select.options].some(option=>option.value===currentKey))select.value=currentKey;
 else if(select.options.length)select.selectedIndex=0;
 select.disabled=!isHost||entries.length===0;
 button.hidden=!isHost;button.disabled=!isHost||entries.length===0;
 $('lobbyCategoryCurrent').textContent=`หมวดปัจจุบัน: ${pack.name||'—'}`;
 $('lobbyCategoryHint').textContent=isHost?'เลือกหมวดใหม่แล้วกด “ใช้หมวดนี้” ได้จนกว่าจะเริ่มเกม':'ผู้เล่นทุกคนใช้หมวดนี้ · เปลี่ยนหมวดได้โดยหัวหน้าห้อง';
}
$('lobbyChangeCategoryBtn').onclick=async()=>{
 if(!roomId||!isHost||!ensureName())return;
 const key=$('lobbyCategorySelect').value,pack=library[key],button=$('lobbyChangeCategoryBtn');
 if(!pack||!roomState||!enabledFor(pack).includes(roomState.gameMode)||!supportsMode(pack,roomState.gameMode)){
  toast('หมวดนี้ใช้กับโหมดเกมที่เลือกไม่ได้','error');return;
 }
 const safePack=firebaseSafePack(pack);button.disabled=true;
 try{
  const res=await getRef().transaction(r=>{
   if(!r||r.status!=='lobby'||r.hostId!==myId||r.gameMode!==roomState.gameMode)return;
   if(!supportsMode(pack,r.gameMode)||!enabledFor(pack).includes(r.gameMode))return;
   r.category=key;r.categoryPack=safePack;r.currentGroup=null;r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
  if(res.committed)toast(`เปลี่ยนหมวดเป็น ${pack.name} แล้ว`,'success');
  else toast('เปลี่ยนหมวดไม่ได้ ห้องอาจเริ่มเกมไปแล้ว','error');
 }catch(e){error(e);}
 finally{button.disabled=false;}
};
function renderLobbySpyFormat(r){
 const panel=$('lobbySpyFormatPanel');panel.hidden=r.gameMode!=='spyfall';if(panel.hidden)return;
 const select=$('lobbySpyFormatSelect'),button=$('lobbySpyFormatSaveBtn');
 if(document.activeElement!==select)select.value=isAwareSpy(r)?'aware':'secret';
 select.disabled=!isHost;button.hidden=!isHost;
 $('lobbySpyFormatHint').textContent=`ปัจจุบัน: ${spyVariantTitle(r.spyVariant)} · ${isHost?'เปลี่ยนได้ก่อนเริ่มเกม':'หัวหน้าห้องเป็นผู้เลือก'}`;
}
$('lobbySpyFormatSaveBtn').onclick=async()=>{
 if(!roomId||!isHost)return;
 const variant=$('lobbySpyFormatSelect').value,button=$('lobbySpyFormatSaveBtn');
 if(!['secret','aware'].includes(variant))return;
 button.disabled=true;
 try{
  const res=await getRef().transaction(r=>{
   if(!r||r.status!=='lobby'||r.hostId!==myId||r.gameMode!=='spyfall')return;
   r.spyVariant=variant;r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
  toast(res.committed?`ใช้รูปแบบ ${spyVariantTitle(variant)} แล้ว`:'เปลี่ยนรูปแบบไม่ได้',res.committed?'success':'error');
 }catch(e){error(e);}finally{button.disabled=false;}
};
function renderLobbyFormat(r){
 const panel=$('lobbyFormatPanel');panel.hidden=r.gameMode==='spyfall';if(panel.hidden)return;
 const mode=$('lobbyFormatSelect'),setting=$('lobbySettingInput'),button=$('lobbyChangeFormatBtn');
 if(document.activeElement!==mode)mode.value=r.gameMode;
 if(document.activeElement!==setting)setting.value=r.settingValue||2;
 mode.disabled=!isHost;setting.disabled=!isHost;button.hidden=!isHost;
 $('lobbyFormatHint').textContent=`${modeTitle(r.gameMode)} · ${r.settingValue||2} ${r.gameMode==='whoami_time'?'นาทีต่อคน':'รอบ'}`;
}
$('lobbyChangeFormatBtn').onclick=async()=>{
 if(!roomId||!isHost)return;
 const mode=$('lobbyFormatSelect').value,n=Number($('lobbySettingInput').value),button=$('lobbyChangeFormatBtn');
 if(!['whoami_time','whoami_rounds'].includes(mode)||!Number.isInteger(n)||n<1||n>99){toast('ใส่ค่าระหว่าง 1–99','error');return;}
 button.disabled=true;
 try{
  const res=await getRef().transaction(r=>{
   if(!r||r.status!=='lobby'||r.hostId!==myId||r.gameMode==='spyfall')return;
   let key=r.category,pack=library[key];
   if(!pack||!enabledFor(pack).includes(mode)||!supportsMode(pack,mode)){
    const first=Object.entries(library).find(([,p])=>enabledFor(p).includes(mode)&&supportsMode(p,mode));
    if(!first)return;[key,pack]=first;
   }
   r.gameMode=mode;r.settingValue=n;r.category=key;r.categoryPack=firebaseSafePack(pack);r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
  toast(res.committed?'บันทึกรูปแบบการเล่นแล้ว':'ไม่สามารถเปลี่ยนรูปแบบได้',res.committed?'success':'error');
 }catch(e){error(e);}finally{button.disabled=false;}
};
// Who Am I personal notes: never written into Firebase, only retained in this browser tab.
let activeWhoNoteKey='';
function whoNoteKey(r){
 return `party_who_note_v18:${roomId}:${Number(r?.gamesPlayed)||0}:${myId}`;
}
function refreshWhoNoteCounter(){
 $('whoNoteCount').textContent=`${$('whoNoteInput').value.length} / 3000`;
}
function syncWhoNotes(r){
 if(!r||r.gameMode==='spyfall')return;
 const key=whoNoteKey(r),active=r.status==='playing'||r.status==='final_guess';
 if(!active){
  try{sessionStorage.removeItem(key);}catch{}
  $('whoNoteInput').value='';activeWhoNoteKey='';refreshWhoNoteCounter();
  return;
 }
 if(key===activeWhoNoteKey)return;
 activeWhoNoteKey=key;
 try{$('whoNoteInput').value=sessionStorage.getItem(key)||'';}catch{$('whoNoteInput').value='';}
 refreshWhoNoteCounter();
}
$('whoNoteInput').addEventListener('input',()=>{
 if(!activeWhoNoteKey||!roomState||roomState.gameMode==='spyfall')return;
 try{sessionStorage.setItem(activeWhoNoteKey,$('whoNoteInput').value);}catch(e){console.warn('Who Am I note could not be saved locally',e);}
 refreshWhoNoteCounter();
});
function renderRoom(r){const players=r.players||{},ids=Object.keys(players),status=r.status;syncWhoNotes(r);$('roomTitle').textContent=r.roomName||`ห้อง ${roomId}`;$('roomCode').textContent=r.roomCode||roomId;$('roomMeta').textContent=`${modeTitle(r.gameMode)} · ${(r.status==='lobby'?library[r.category]:null)?.name||packFor(r).name} · ${r.settingValue||2} ${r.gameMode==='whoami_time'?'นาทีต่อคน':'รอบ'}${r.gameMode==='spyfall'?' · '+spyVariantTitle(r.spyVariant):''}`;renderScores(r);$('deleteRoomBtn').hidden=!(isHost&&status==='lobby');showScreen(({lobby:'lobbyScreen',playing:r.gameMode==='spyfall'?'spyScreen':'whoScreen',final_guess:'whoScreen',voting:'voteScreen',results:'resultsScreen',finished:'grandFinalScreen'})[status]||'lobbyScreen');
 if(status==='lobby'){
  renderLobbyCategory(r);
  renderLobbyFormat(r);
  renderLobbySpyFormat(r);
  $('hostLine').innerHTML=` หัวหน้าห้อง: ${playerLabelHTML(r.hostId,r)} · ${ids.length} คน`;
  $('playerList').replaceChildren();
  ids.forEach((id,i)=>{const el=document.createElement('div');el.className='player-row';el.innerHTML=`<span class="player-rank">${i+1}</span>${playerLabelHTML(id,r)}${id===r.hostId?'<span class="host-tag"> HOST</span>':''}`;$('playerList').append(el);});
  const min=r.gameMode==='spyfall'?3:2;
   const startPack=library[r.category]||packFor(r);
   const availableDistinctWords=new Set(wordsOf(startPack).map(norm)).size;
   const missingRoleWords=r.gameMode!=='spyfall'&&availableDistinctWords<ids.length;
   $('startBtn').hidden=!isHost;
   $('startBtn').disabled=ids.length<min||missingRoleWords;
   $('startBtn').textContent=ids.length<min?`ต้องมีอย่างน้อย ${min} คน`:missingRoleWords?`หมวดมี ${availableDistinctWords} คำ ไม่พอสำหรับ ${ids.length} คน`:'เริ่มเกม';
  $('finishMatchPanel').hidden=!(isHost&&Number(r.gamesPlayed||0)>=1);
  $('deleteRoomBtn').hidden=!isHost;$('lobbyNotice').hidden=isHost;$('lobbyNotice').textContent=`รอ ${players[r.hostId]?.name||'Host'} เริ่มเกม…`;
 }else if(status==='playing'&&r.gameMode==='spyfall')renderSpy(r);
 else if(status==='playing'||status==='final_guess')renderWho(r);
 else if(status==='voting')renderVotes(r);
 else if(status==='results')renderResults(r);
 else if(status==='finished')renderGrandFinal(r);
}
function renderScores(r){
 const p=everyoneWithScores(r),scores=r.scores||{};
 $('scoreList').replaceChildren();
 Object.keys(p).sort((a,b)=>(scores[b]||0)-(scores[a]||0)).forEach((id,i)=>{
  const el=document.createElement('div');el.className='score-row';
  const offline=!r.players?.[id];
  if(offline)el.classList.add('score-offline');
  el.innerHTML=`<span class="score-identity"><span class="score-medal">${String(i+1)}</span>${playerLabelHTML(id,r)}${offline?'<small class="score-offline-label">ออกจากห้อง</small>':''}</span><b>${scores[id]||0} pts</b>`;
  $('scoreList').append(el);
 });
}
function renderSpy(r){
 const idx=r.currentTurnIndex||0,speaker=r.turnOrder?.[idx],players=r.players||{};
 const awareSpy=isAwareSpy(r)&&myId===r.spyId;
 setGameAvatar('spyMyAvatar');
 $('spyRoleCard').classList.toggle('spy-reveal',awareSpy);
 $('spyRoleLabel').textContent=awareSpy?'ตัวตนที่แท้จริง':'คำลับของคุณ';
 $('mySpyWord').textContent=awareSpy?'คุณเป็น SPY':r.roles?.[myId]||'—';
 $('spyRoleHint').textContent=awareSpy
  ?'คุณไม่มีคำลับ ฟังคำใบ้และทายคำของคนปกติในช่วงโหวตเพื่อรับโบนัส +1'
  :'จำคำเป็นความลับ แล้วพูดคุยจับพิรุธคนอื่น';
 $('spyRound').textContent=`รอบ ${r.currentRound||1} / ${r.totalRounds||2}`;
 $('spySpeaker').innerHTML=speaker===myId?
  `<span class="player-identity">${avatarMarkup({avatar:myAvatar})}<span>ถึงตาคุณพูดแล้ว</span></span>`:
  `<span class="player-identity">${avatarMarkup(players[speaker])}<span>กำลังรอ ${esc(players[speaker]?.name||'ผู้เล่น')} พูด</span></span>`;
 $('spyDoneBtn').hidden=speaker!==myId;$('skipSpyBtn').hidden=!isHost;
 renderOrder($('spyOrder'),r,true);
 renderGameStats('spyProgress',[
  {label:'รูปแบบ',value:spyVariantTitle(r.spyVariant)},
  {label:'รอบที่เล่น',value:`${r.currentRound||1} / ${r.totalRounds||2}`},
  {label:'ผู้เล่นในห้อง',value:`${Object.keys(players).length} คน`}
 ]);
 $('spyGroupName').hidden=awareSpy;$('spyWords').hidden=awareSpy;
 $('spyWords').replaceChildren();
 if(!awareSpy){
  $('spyGroupName').textContent=`หมวดคำ: ${groupLabel(packFor(r),r.currentGroup)}`;
  (packFor(r).groups?.[r.currentGroup]||[]).forEach(word=>{
   const el=document.createElement('div');el.className='word';el.textContent=word;$('spyWords').append(el);
  });
 }
}
function resetWhoGuessInput(){
 chosenGuess='';
 $('guessInput').value='';
 $('guessSelected').textContent='ยังไม่ได้เลือกคำตอบ';
 const suggestions=$('guessSuggestions');
 suggestions.replaceChildren();
 suggestions.hidden=true;
}
function renderWho(r){
 const final=r.status==='final_guess',timed=r.gameMode==='whoami_time',
  idx=r.currentTurnIndex||0,speaker=currentWhoSpeaker(r),players=r.players||{};
 const token=r.status==='playing'?`${roomId}:${r.gamesPlayed||0}:${r.currentRound||1}:${speaker||''}`:'';
 if(token!==lastWhoTurnToken){
  if(token)resetWhoGuessInput();
  lastWhoTurnToken=token;
 }
 setGameAvatar('whoMyAvatar');
 $('whoTurnBlock').hidden=final;
 $('whoTimerBlock').hidden=!timed&&!final;
 $('playerTimerPanel').hidden=!timed;
 $('whoTimerLabel').textContent=final?' ช่วงตอบสุดท้าย (2 นาที)':` เวลาที่เหลือของ ${players[speaker]?.name||'ผู้เล่น'}`;
 $('whoTimer').textContent=final?formatLeft(r.finalDeadline):msClock(remainingWhoMs(r,speaker));
 $('whoRound').textContent=timed?`รอบการถาม ${r.currentRound||1}`:`รอบ ${r.currentRound||1} / ${r.totalRounds||2}`;
 $('whoSpeaker').innerHTML=speaker===myId
  ?`<span class="player-identity">${avatarMarkup({avatar:myAvatar})}<span>ถึงตาคุณถามแล้ว</span></span>`
  :`<span class="player-identity">${avatarMarkup(players[speaker])}<span>ถึงตา ${esc(players[speaker]?.name||'ผู้เล่น')} ถาม</span></span>`;
 $('whoDoneBtn').hidden=final||speaker!==myId;
 $('whoDoneBtn').textContent=timed?' ผ่านเทิร์น · หยุดเวลาของฉัน':' ถามจบแล้ว · ต่อคนถัดไป';
 renderOrder($('whoOrder'),r,!final);
 const answered=Object.values(r.attempts||{}).filter(v=>v===0).length;
 renderGameStats('whoProgress',[
  {label:'รูปแบบ',value:final?'ตอบช่วงสุดท้าย':timed?'จับเวลาแยกคน':'เล่นเป็นรอบ'},
  {label:'ตอบแล้ว / หมดสิทธิ์',value:`${answered} / ${Object.keys(players).length} คน`},
  {label:timed?'กำลังถาม':final?'เวลาคงเหลือ':'ลำดับเทิร์น',value:timed?(players[speaker]?.name||'—'):final?formatLeft(r.finalDeadline):`${idx+1} / ${(r.turnOrder||[]).length}`}
 ]);
 const timerList=$('playerTimerList');
 timerList.replaceChildren();
 if(timed){
  Object.keys(players).forEach(id=>{
   const answeredPlayer=r.attempts?.[id]===0,active=id===speaker&&!answeredPlayer;
   const d=r.guessDetails?.[id]||{},card=document.createElement('article');
   card.className=`player-timer-card ${active?'active':''} ${answeredPlayer?'finished':''}`;
   const left=document.createElement('div');left.className='timer-player-name';
   left.innerHTML=`${playerLabelHTML(id,r,false)}<small>${d.timedOut?' หมดเวลา':answeredPlayer?(d.correct?' ตอบถูกแล้ว':' ตอบผิดแล้ว'):active?'● เวลากำลังเดิน':' เวลาหยุดอยู่'}</small>`;
   const counter=document.createElement('strong');counter.dataset.timerOf=id;
   counter.textContent=msClock(remainingWhoMs(r,id));
   card.append(left,counter);timerList.append(card);
  });
 }
 const others=$('otherWords');others.replaceChildren();
 // Render all players, not only those still in turnOrder.
 Object.keys(players).forEach(id=>{
  if(id===myId)return;
  const d=r.guessDetails?.[id]||{},answeredPlayer=r.attempts?.[id]===0;
  const el=document.createElement('article');
  el.className=`friend-card ${answeredPlayer?'done':''}`;
  el.innerHTML=`<div class="friend-name"><small>ชื่อผู้เล่น</small>${playerLabelHTML(id,r,false)}</div>
   <div class="friend-answer"><small>คำของเพื่อน</small><strong>${esc(r.roles?.[id]||'—')}</strong></div>
   <span class="friend-status">${answeredPlayer?(d.timedOut?' หมดเวลา':d.correct?' ตอบถูก':' ตอบผิด'):'● ยังมีสิทธิ์ทาย'}</span>`;
  others.append(el);
 });
 const mine=r.attempts?.[myId]===0,details=r.guessDetails?.[myId]||{};
 const myTimeOver=timed&&remainingWhoMs(r,myId)<=0;
 $('guessInputs').hidden=mine;
 $('guessBtn').disabled=mine||myTimeOver;
 $('guessHeading').textContent=mine?(details.timedOut?' เวลาของคุณหมดแล้ว':details.correct?' คุณตอบถูกแล้ว!':' คุณตอบผิดแล้ว'):(myTimeOver?'เวลาของคุณหมดแล้ว กำลังสรุปผล':final?'โอกาสสุดท้าย! ตอบภายใน 2 นาที':'ทายคำของคุณ (1 ครั้ง)');
 const reveal=$('answerReveal');
 reveal.hidden=!mine;
 reveal.innerHTML=mine?`<strong>${details.timedOut?' หมดเวลา':details.correct?' คำตอบถูกต้อง':' คำตอบไม่ถูกต้อง'}</strong>
  <span>คำที่ถูก: <b>${esc(details.correctAnswer||r.roles?.[myId]||'—')}</b></span>
  <span>คำที่คุณตอบ: <b>${esc(details.answer||'ไม่ได้ตอบ')}</b></span>`:'';
}
function renderVotes(r){
 const aware=isAwareSpy(r),youAreSpy=aware&&myId===r.spyId,players=gameParticipants(r);
 const mine=youAreSpy?r.spyGuess?.submitted:r.votes?.[myId];
 const eligible=Object.keys(r.players||{}).filter(id=>!aware||id!==r.spyId);
 const votesReceived=eligible.filter(id=>!!r.votes?.[id]).length;
 const total=eligible.length,choices=r.tieCandidates||gameParticipantIds(r);
 $('voteHeading').textContent=youAreSpy?' Spy ทายคำของคนปกติ':r.tieCandidates?' โหวตรอบตัดสิน':' ใครคือ Spy?';
 $('voteTimer').textContent=formatLeft(r.voteDeadline);
 $('voteNote').textContent=aware
  ?youAreSpy?'คุณไม่มีสิทธิ์โหวต ให้ทายคำของคนปกติแทน (โบนัส +1 ถ้าถูก)':`เลือกคนที่คิดว่าเป็น Spy · โหวตแล้ว ${votesReceived}/${total} คน`
  :mine?` คุณโหวตแล้ว · ${votesReceived}/${total} คน`:`โหวตและทายคำให้ทัน 2 นาที · ${votesReceived}/${total} คนโหวตแล้ว`;
 renderGameStats('voteProgress',[
  {label:'รูปแบบ',value:spyVariantTitle(r.spyVariant)},
  {label:'โหวตแล้ว',value:`${votesReceived} / ${total} คน`},
  {label:'เวลาที่เหลือ',value:formatLeft(r.voteDeadline)}
 ]);
 $('voteChoices').replaceChildren();
 $('voteAnswer').hidden=true;$('awareVoteSubmitBtn').hidden=true;
 $('spyGuessPanel').hidden=true;$('spyGuessSubmittedNotice').hidden=true;
 if(youAreSpy){
  if(mine){
   $('spyGuessSubmittedNotice').hidden=false;
  }else{
   $('spyGuessPanel').hidden=false;
   const selector=$('spyGuessWord');selector.replaceChildren();
   const blank=document.createElement('option');blank.value='';blank.textContent='— เลือกคำของคนปกติ —';selector.append(blank);
   const words=[...new Set(packFor(r).groups?.[r.currentGroup]||[])];
   words.forEach(word=>{const option=document.createElement('option');option.value=word;option.textContent=word;selector.append(option);});
   selector.value=words.includes(chosenSpyGuess)?chosenSpyGuess:'';
  }
  return;
 }
 if(mine){
  $('voteChoices').innerHTML='<p class="notice"> บันทึกโหวตแล้ว รอเพื่อนหรือหมดเวลา</p>';
  return;
 }
 if(!choices.includes(chosenVote))chosenVote='';
 choices.filter(id=>id!==myId&&players[id]).forEach(id=>{
  const button=document.createElement('button');
  button.className=`vote-choice ${id===chosenVote?'selected':''}`;
  button.innerHTML=`${playerLabelHTML(id,r)}${!r.players?.[id]?'<small class="vote-player-offline">ออกจากห้อง</small>':''}<b>${id===chosenVote?' เลือกแล้ว':'เลือก →'}</b>`;
  button.onclick=()=>{chosenVote=id;chosenWord='';renderVotes(r);};
  $('voteChoices').append(button);
 });
 if(aware){
  $('awareVoteSubmitBtn').hidden=!chosenVote;
  return;
 }
 $('voteAnswer').hidden=!chosenVote;
 if(chosenVote){
  $('voteWord').replaceChildren();
  const blank=document.createElement('option');blank.value='';blank.textContent='— ไม่ทายคำ —';$('voteWord').append(blank);
  [...new Set(packFor(r).groups?.[r.currentGroup]||[])].forEach(word=>{
   const option=document.createElement('option');option.value=word;option.textContent=word;$('voteWord').append(option);
  });
  $('voteWord').value=chosenWord;
 }
}
function addDetail(target,text){const el=document.createElement('p');el.className='result-details';el.textContent=text;target.append(el);}
function renderResults(r){
 const players=gameParticipants(r),scores=r.scores||{},ids=gameParticipantIds(r).sort((a,b)=>(scores[b]||0)-(scores[a]||0));
 const target=$('resultContent');target.replaceChildren();
 const spy=r.gameMode==='spyfall',res=r.result||{};
 const hero=document.createElement('section');hero.className='result-hero';
 hero.innerHTML=`<h2>${spy?(res.caught?' คนปกติจับสายลับได้!':' สายลับชนะ!'):' เกม Who Am I จบแล้ว!'}</h2>
 <p>${spy?`สายลับคือ ${esc(players[r.spyId]?.name||'—')} · ${isAwareSpy(r)?'Spy รู้ตัวตนและไม่ได้รับคำลับ':'คำลับสายลับ: '+esc(r.roles?.[r.spyId]||'—')}`:
 r.gameMode==='whoami_rounds'?'ตอบถูกในรอบเดียวกันได้คะแนนเท่ากัน':'คนตอบถูกก่อนจะได้คะแนนมากกว่า'}</p>`;
 target.append(hero);
 if(spy){
  const section=document.createElement('section');section.className='result-section';
  const other=Object.keys(r.roles||{}).find(id=>id!==r.spyId);
  section.innerHTML=`<h3> เฉลย Spyfall</h3>
   <div class="summary-grid">
   <div class="summary-fact"><small>หมวด / กลุ่มคำ</small><strong>${esc(res.groupLabel||groupLabel(packFor(r),r.currentGroup))}</strong></div>
   <div class="summary-fact"><small>คำของคนปกติ</small><strong>${esc(r.roles?.[other]||'—')}</strong></div>
   <div class="summary-fact"><small>สายลับ</small><strong>${esc(players[r.spyId]?.name||'—')}</strong></div>
   <div class="summary-fact"><small>ผลโหวต</small><strong>${res.tied?'เสมอ':esc(players[res.pickedId]?.name||'ไม่มีผู้ถูกเลือก')}</strong></div>
   </div>`;
  if(!isAwareSpy(r)){
   const extra=document.createElement('div');extra.className='spy-vote-summary';
   extra.innerHTML=`<div><small>คำที่ Spy ได้</small><strong>${esc(r.roles?.[r.spyId]||'—')}</strong></div>
    <div><small>คำที่คนปกติได้</small><strong>${esc(normalSpyWord(r)||'—')}</strong></div>
    <p>คำตอบของฝ่ายตรงข้ามที่ทายถูกได้โบนัสคนละ +1 แม้ไม่ได้โหวตถูก</p>`;
   section.append(extra);
  }
  if(isAwareSpy(r)){
   const summary=document.createElement('div');summary.className='spy-vote-summary';
   summary.innerHTML=`<div><small>คำที่ Spy ทาย</small><strong>${esc(res.spyGuess||'ไม่ได้ตอบ')}</strong></div>
    <div><small>คำที่คนปกติได้รับ</small><strong>${esc(res.correctWord||r.spyCommonWord||'—')}</strong></div>
    <p>${res.spyGuessCorrect?' Spy ทายถูก +1 คะแนน':' Spy ทายผิดหรือไม่ได้ทาย'} · ${res.caught?'คนปกติจับ Spy ได้ ทุกคนคนละ +1 คะแนน':'Spy รอดจากการโหวต +1 คะแนน'}</p>`;
   section.append(summary);
  }
  target.append(section);
  const history=res.votesByRound||{round_1:r.votes||{}};
  Object.entries(history).sort(([a],[b])=>a.localeCompare(b)).forEach(([name,votes])=>{
   const round=Number(String(name).replace(/\D/g,''))||1,counts={};
   Object.values(votes||{}).forEach(ballot=>{if(ballot?.targetId)counts[ballot.targetId]=(counts[ballot.targetId]||0)+1;});
   const group=document.createElement('section');group.className='result-section';
   group.innerHTML=`<h3> ผลโหวตรอบ ${round}</h3>`;
   const tally=document.createElement('div');tally.className='vote-tally-list';
   const ordered=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
   ordered.forEach(([id,n])=>{
    const row=document.createElement('div');row.className='vote-tally-row';
    row.innerHTML=`<span>${playerLabelHTML(id,r,false)}</span><b>${n} เสียง</b>`;tally.append(row);
   });
   if(!ordered.length)tally.innerHTML='<p class="muted">ไม่มีผู้ส่งโหวตในรอบนี้</p>';
   group.append(tally);
   const list=document.createElement('div');list.className='vote-records';
   Object.entries(votes||{}).forEach(([id,ballot])=>{
    const row=document.createElement('div');row.className='vote-record';
    row.innerHTML=`<strong>${esc(players[id]?.name||'ผู้เล่น')}</strong>
     <span>โหวต: ${esc(players[ballot.targetId]?.name||'—')}</span>
     <small>${isAwareSpy(r)?'โหมดนี้คนปกติไม่ต้องทายคำ':'ทายคำฝ่ายตรงข้าม: '+esc(ballot.guessWord||'ไม่ได้ทาย')}</small>`;
    list.append(row);
   });
   group.append(list);target.append(group);
  });
 }else{
  const section=document.createElement('section');section.className='result-section';
  section.innerHTML='<h3> เฉลยคำตอบของผู้เล่นทุกคน</h3>';
  const list=document.createElement('div');list.className='summary-answer-list';
  ids.forEach(id=>{
   const d=r.guessDetails?.[id]||{},correct=d.correctAnswer||r.roles?.[id]||'—';
   const answer=d.answer||(d.correct?'ข้อมูลคำตอบเดิม':'ไม่ได้ตอบ');
   const status=d.timedOut?' หมดเวลา':d.correct?' ตอบถูก':d.answer?' ตอบผิด':'— ไม่ได้ตอบ';
   const row=document.createElement('article');row.className=`summary-answer-card ${d.correct?'correct':''}`;
   row.innerHTML=`<div class="summary-answer-top">${playerLabelHTML(id,r,false)}<span class="summary-status">${status}</span></div>
    <div class="summary-answer-grid">
     <div><small>คำตอบที่ถูกต้อง</small><strong>${esc(correct)}</strong></div>
     <div><small>คำที่ผู้เล่นตอบ</small><strong>${esc(answer)}</strong></div>
    </div><div class="summary-answer-points">ได้ +${d.points||0} คะแนน${d.correct&&r.gameMode==='whoami_rounds'?` · รอบที่ ${d.round||1}`:''}</div>`;
   list.append(row);
  });
  section.append(list);target.append(section);
 }
 const board=document.createElement('section');board.className='result-section';
 board.innerHTML='<h3> ตารางคะแนนสะสมหลังจบเกม</h3>';
 ids.forEach((id,i)=>{
  const d=spy?res.awards?.[id]:r.guessDetails?.[id],points=spy?d?.total||0:d?.points||0;
  const row=document.createElement('div');row.className='result-row';
  row.innerHTML=`<div class="result-summary-player"><span class="score-medal">${String(i+1)}</span>${playerLabelHTML(id,r,false)}</div>
   <div class="result-summary-score"><b>+${points}</b><small>${spy?'ผลโหวต +'+(d?.base||0)+' · ทายคำ +'+(d?.bonus||0)+' · ':''}รวม ${scores[id]||0} คะแนน</small></div>`;
  board.append(row);
 });
 target.append(board);
 $('resultHostActions').hidden=!isHost;$('resultWaiting').hidden=isHost;
}

// ===== Game start, turns and final response windows =====
function toFinalGuess(r){
 const ids=Object.keys(r.players||{}),pending=ids.some(id=>r.attempts?.[id]!==0);
 if(!pending){r.status='results';r.finalDeadline=null;return;}
 r.status='final_guess';r.finalDeadline=serverNow()+FINAL_MS;
}
function toVoting(r){r.status='voting';r.votes={};r.voteHistory={};r.spyGuess=null;r.voteRound=1;r.tieCandidates=null;r.voteDeadline=serverNow()+FINAL_MS;}
function advanceRound(r){
 const order=r.turnOrder||[];
 if(!order.length){if(r.gameMode==='spyfall')toVoting(r);else toFinalGuess(r);return;}
 let i=r.currentTurnIndex||0,round=r.currentRound||1;
 for(let n=0;n<order.length;n++){
  i++;if(i>=order.length){i=0;round++;}
  if(round>(r.totalRounds||1)){if(r.gameMode==='spyfall')toVoting(r);else toFinalGuess(r);return;}
  if(r.players?.[order[i]]&&(r.gameMode==='spyfall'||r.attempts?.[order[i]]!==0)){
   r.currentTurnIndex=i;r.currentRound=round;return;
  }
 }
 if(r.gameMode==='spyfall')toVoting(r);else toFinalGuess(r);
}
function currentWhoSpeaker(r){return r.turnOrder?.[r.currentTurnIndex||0]||null;}
function remainingWhoMs(r,id,now=serverNow()){
 if(!id)return 0;
 const initial=Number(r.whoTimeRemaining?.[id]??((r.settingValue||3)*60000));
 if(r.gameMode==='whoami_time'&&r.status==='playing'&&currentWhoSpeaker(r)===id&&r.turnStartedAt){
  return Math.max(0,initial-Math.max(0,now-Number(r.turnStartedAt)));
 }
 return Math.max(0,initial);
}
function msClock(ms){
 const n=Math.max(0,Math.ceil(Number(ms||0)/1000));
 return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
}
function endTimedGame(r){r.status='results';r.turnStartedAt=null;r.playDeadline=null;}
function removeWhoAnsweredPlayer(r,id){
 if(r.status!=='playing'||r.gameMode==='spyfall')return;
 const order=Array.isArray(r.turnOrder)?r.turnOrder:[],removed=order.indexOf(id);
 if(removed<0)return;
 const index=Math.max(0,Math.min(Number(r.currentTurnIndex)||0,order.length-1));
 const current=order[index],next=order.filter(playerId=>playerId!==id);
 r.turnOrder=next;
 if(!next.length){r.currentTurnIndex=0;if(r.gameMode==='whoami_time')endTimedGame(r);else toFinalGuess(r);return;}
 if(current===id){
  if(removed>=next.length){r.currentTurnIndex=0;r.currentRound=(r.currentRound||1)+1;}
  else r.currentTurnIndex=removed;
  if(r.gameMode==='whoami_time')r.turnStartedAt=serverNow();
 }else{
  const keep=next.indexOf(current);
  r.currentTurnIndex=keep>=0?keep:Math.min(index,next.length-1);
  // Do not reset turnStartedAt while another player is actively speaking.
 }
 if(r.gameMode==='whoami_rounds'&&r.currentRound>(r.totalRounds||1))toFinalGuess(r);
}
function advanceTimedTurn(r){
 const order=r.turnOrder||[];
 if(!order.length){endTimedGame(r);return;}
 const start=r.currentTurnIndex||0;
 for(let offset=1;offset<=order.length;offset++){
  const raw=start+offset,pos=raw%order.length,id=order[pos];
  if(r.players?.[id]&&r.attempts?.[id]!==0&&Number(r.whoTimeRemaining?.[id]??((r.settingValue||3)*60000))>0){
   if(raw>=order.length)r.currentRound=(r.currentRound||1)+1;
   r.currentTurnIndex=pos;r.turnStartedAt=serverNow();return;
  }
 }
 endTimedGame(r);
}
function settleTimedSpeaker(r){
 if(r.gameMode!=='whoami_time'||r.status!=='playing')return false;
 const id=currentWhoSpeaker(r);if(!id)return false;
 const remaining=remainingWhoMs(r,id);
 r.whoTimeRemaining||={};r.whoTimeRemaining[id]=remaining;r.turnStartedAt=serverNow();
 if(remaining>0)return false;
 r.attempts||={};r.attempts[id]=0;
 r.guessedCorrectly||={};r.guessedCorrectly[id]=false;
 r.guessDetails||={};
 r.guessDetails[id]={correct:false,points:0,round:r.currentRound||1,answer:'',correctAnswer:r.roles?.[id]||'',timedOut:true};
 removeWhoAnsweredPlayer(r,id);
 return true;
}
$('startBtn').onclick=async()=>{
 if(!ensureName()||!isHost||!roomId)return;
 const minPlayers=roomState?.gameMode==='spyfall'?3:2;
 if(Object.keys(roomState?.players||{}).length<minPlayers){toast(`โหมดนี้ต้องมีผู้เล่นอย่างน้อย ${minPlayers} คนก่อนเริ่ม`,'error');return;}
 if(!supportsMode(packFor(roomState),roomState?.gameMode)){toast('หมวดคำนี้ไม่มีข้อมูลที่พร้อมเล่น กรุณาเลือกหมวดใหม่','error');return;}
 $('startBtn').disabled=true;
 let failMessage='เริ่มเกมไม่ได้ กรุณาตรวจสอบข้อมูลห้องแล้วลองอีกครั้ง';
 try{
  const res=await getRef().transaction(r=>{
   if(!r||r.status!=='lobby'||r.hostId!==myId)return;
   const ids=Object.keys(r.players||{}),min=r.gameMode==='spyfall'?3:2;
   if(ids.length<min){failMessage=`โหมดนี้ต้องมีผู้เล่นอย่างน้อย ${min} คน`;return;}
   const pack=library[r.category]||packFor(r);
   if(!supportsMode(pack,r.gameMode)||!enabledFor(pack).includes(r.gameMode)){failMessage='หมวดคำนี้ไม่มีข้อมูลที่พร้อมเล่น กรุณาเลือกหมวดใหม่';return;}
   r.categoryPack=firebaseSafePack(pack);
   const roles={},attempts={};let group='',spy=null;
   if(r.gameMode==='spyfall'){
    const eligibleGroups=Object.entries(r.categoryPack.groups||{}).filter(([,words])=>Array.isArray(words)&&new Set(words.filter(w=>typeof w==='string'&&w.trim()).map(norm)).size>=2);
    if(!eligibleGroups.length){failMessage='หมวดนี้ต้องมีกลุ่มที่มีคำไม่ซ้ำอย่างน้อย 2 คำ';return;}
    group=random(eligibleGroups.map(([name])=>name));
    const uniqueWords=[...new Map(r.categoryPack.groups[group].filter(w=>typeof w==='string'&&w.trim()).map(word=>[norm(word),word])).values()];
    const [a,b]=shuffle(uniqueWords);
    spy=random(ids);
    ids.forEach(id=>roles[id]=id===spy?(isAwareSpy(r)?'คุณเป็น SPY':a):b);
    r.spyCommonWord=isAwareSpy(r)?b:null;
   }else{
    const ws=shuffle([...new Map(wordsOf(pack).map(word=>[norm(word),word])).values()]);
    if(ws.length<ids.length){
     failMessage=`หมวดนี้มีเพียง ${ws.length} คำ แต่มีผู้เล่น ${ids.length} คน กรุณาเลือกหมวดที่มีคำมากกว่านี้`;
     return;
    }
    ids.forEach((id,i)=>{roles[id]=ws[i];attempts[id]=1;});
   }
   r.status='playing';r.gamePlayers=copyPack(r.players);r.playerProfiles={...(r.playerProfiles||{}),...copyPack(r.players)};r.turnOrder=shuffle(ids);r.currentTurnIndex=0;r.currentRound=1;
   r.totalRounds=r.settingValue||2;r.roles=roles;r.spyId=spy;r.currentGroup=group;
   r.attempts=attempts;r.guessedCorrectly={};r.correctOrder=[];r.guessDetails={};
   r.votes={};r.voteHistory={};r.spyGuess=null;r.voteRound=0;r.voteDeadline=null;r.tieCandidates=null;r.result=null;
   r.finalDeadline=null;r.playDeadline=null;r.whoTimeRemaining=r.gameMode==='whoami_time'?Object.fromEntries(ids.map(id=>[id,(Number(r.settingValue)||3)*60000])):{};r.turnStartedAt=r.gameMode==='whoami_time'?serverNow():null;
   r.gamesPlayed=(r.gamesPlayed||0)+1;r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
  if(res.committed){chosenGuess='';chosenVote='';chosenWord='';chosenSpyGuess='';$('guessInput').value='';toast('เริ่มเกมแล้ว!','success');}
  else toast(failMessage,'error');
 }catch(e){error(e);}
 finally{$('startBtn').disabled=false;}
};
async function endMyTurn(mode){
 if(!roomId)return;
 try{
  await getRef().transaction(r=>{
   if(!r||r.status!=='playing'||r.gameMode!==mode||currentWhoSpeaker(r)!==myId)return;
   if(mode==='whoami_time'){
    const expired=settleTimedSpeaker(r);
    if(!expired&&r.status==='playing')advanceTimedTurn(r);
   }else advanceRound(r);
   r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
 }catch(e){error(e);}
}
$('spyDoneBtn').onclick=()=>endMyTurn('spyfall');
$('whoDoneBtn').onclick=()=>endMyTurn(roomState?.gameMode==='whoami_time'?'whoami_time':'whoami_rounds');
$('skipSpyBtn').onclick=async()=>{
 if(!isHost||!await confirmBox('ข้ามไปโหวต?','เริ่มจับเวลาโหวต 2 นาทีทันที','เริ่มโหวต'))return;
 try{
  await getRef().transaction(r=>{
   if(!r||r.hostId!==myId||r.gameMode!=='spyfall'||r.status!=='playing')return;
   toVoting(r);r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
 }catch(e){error(e);}
};

// ===== Who Am I answer and scoring =====
$('guessInput').addEventListener('input',()=>{chosenGuess='';$('guessSelected').textContent='ยังไม่ได้เลือกคำตอบ';const box=$('guessSuggestions');box.replaceChildren();const q=norm($('guessInput').value),r=roomState;if(!q||!r||r.gameMode==='spyfall'){box.hidden=true;return;}wordsOf(packFor(r)).filter(w=>norm(w).includes(q)).slice(0,15).forEach(w=>{const b=document.createElement('button');b.textContent=w;b.onclick=()=>{chosenGuess=w;$('guessInput').value=w;$('guessSelected').textContent=` เลือก ${w}`;box.hidden=true;};box.append(b);});box.hidden=!box.children.length;});
$('guessBtn').onclick=async()=>{if(!roomId||!roomState||roomState.gameMode==='spyfall')return;const option=wordsOf(packFor(roomState)).find(w=>norm(w)===norm(chosenGuess||$('guessInput').value));if(!option){toast('เลือกคำตอบจากหมวดที่กำหนดก่อน','error');return;}if(!await confirmBox('ยืนยันคำตอบ?',`ตอบ “${option}” ได้เพียงครั้งเดียว`,'ส่งคำตอบ'))return;$('guessBtn').disabled=true;try{const res=await getRef().transaction(r=>{if(!r||!['playing','final_guess'].includes(r.status)||r.gameMode==='spyfall'||!r.players?.[myId]||r.attempts?.[myId]!==1)return;if(r.status==='final_guess'&&serverNow()>=r.finalDeadline)return;if(r.status==='playing'&&r.gameMode==='whoami_time'){
 if(remainingWhoMs(r,myId)<=0)return;
 if(currentWhoSpeaker(r)===myId){r.whoTimeRemaining||={};r.whoTimeRemaining[myId]=remainingWhoMs(r,myId);}
}const correct=norm(option)===norm(r.roles?.[myId]);r.attempts[myId]=0;r.guessedCorrectly||={};r.guessedCorrectly[myId]=correct;const round=r.status==='final_guess'?(r.totalRounds||1):(r.currentRound||1);let points=0;if(correct){r.correctOrder||=[];points=r.gameMode==='whoami_time'?Math.max(1,gameParticipantIds(r).length-r.correctOrder.length):Math.max(1,(r.totalRounds||1)-round+1);r.correctOrder.push(myId);r.scores||={};r.scores[myId]=(r.scores[myId]||0)+points;}if(r.status==='playing'&&(r.gameMode==='whoami_rounds'||r.gameMode==='whoami_time'))removeWhoAnsweredPlayer(r,myId);r.guessDetails||={};r.guessDetails[myId]={correct,points,round,answer:option,correctAnswer:r.roles?.[myId]||''};if(Object.keys(r.players).every(id=>r.attempts?.[id]===0))r.status='results';r.lastActivityAt=TIMESTAMP();return r;},undefined,false);if(!res.committed){toast('หมดเวลาหรือคุณส่งคำตอบไปแล้ว','error');return;}const info=res.snapshot.val(),d=info?.guessDetails?.[myId];toast(d?.correct?` ถูกต้อง +${d.points} คะแนน`:`ตอบผิด! คำที่ถูกคือ ${info?.roles?.[myId]||'—'}`,d?.correct?'success':'error');}catch(e){error(e);}finally{$('guessBtn').disabled=false;}};

// ===== Spyfall voting =====
$('voteWord').onchange=e=>chosenWord=e.target.value;
$('spyGuessWord').onchange=e=>chosenSpyGuess=e.target.value;
async function submitSpyVote(){
 if(!roomId||!roomState||!chosenVote)return;
 const target=chosenVote,aware=isAwareSpy(roomState);
 const word=aware?'':$('voteWord').value,button=aware?$('awareVoteSubmitBtn'):$('voteSubmitBtn');
 button.disabled=true;
 try{
  const res=await getRef().transaction(r=>{
   const allowed=r?.tieCandidates||gameParticipantIds(r);
   if(!r||r.status!=='voting'||serverNow()>=r.voteDeadline||!r.players?.[myId]||!r.roles?.[myId]||!r.roles?.[target]||target===myId||!allowed.includes(target)||r.votes?.[myId])return;
   if(isAwareSpy(r)&&myId===r.spyId)return;
   if(!isAwareSpy(r)&&word&&!new Set(packFor(r).groups?.[r.currentGroup]||[]).has(word))return;
   r.votes||={};r.votes[myId]={targetId:target,guessWord:isAwareSpy(r)?'':word};
   r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
  toast(res.committed?'ส่งโหวตแล้ว':'โหวตไม่ได้ หรือหมดเวลาแล้ว',res.committed?'success':'error');
 }catch(e){error(e);}finally{button.disabled=false;}
}
$('voteSubmitBtn').onclick=submitSpyVote;
$('awareVoteSubmitBtn').onclick=submitSpyVote;
$('spyGuessSubmitBtn').onclick=async()=>{
 if(!roomId||!roomState||!isAwareSpy(roomState)||myId!==roomState.spyId)return;
 const word=$('spyGuessWord').value;
 if(!word){toast('กรุณาเลือกคำที่ต้องการทายก่อน','error');return;}
 const button=$('spyGuessSubmitBtn');button.disabled=true;
 try{
  const res=await getRef().transaction(r=>{
   if(!isAwareSpy(r)||r.status!=='voting'||r.spyId!==myId||!r.players?.[myId]||serverNow()>=r.voteDeadline||r.spyGuess?.submitted)return;
   if(!new Set(packFor(r).groups?.[r.currentGroup]||[]).has(word))return;
   r.spyGuess={submitted:true,word};r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
  toast(res.committed?'ส่งคำทายแล้ว รอผลโหวต':'ส่งคำทายไม่ได้ หรือหมดเวลา',res.committed?'success':'error');
 }catch(e){error(e);}finally{button.disabled=false;}
};
function resolveVotes(r){
 const ids=gameParticipantIds(r),ballots=copyPack(r.votes||{}),roundNo=Number(r.voteRound)||1;
 r.voteHistory||={};r.voteHistory[`round_${roundNo}`]=ballots;
 const counts={};
 for(const [id,b] of Object.entries(ballots))if(r.roles?.[id]&&r.roles?.[b.targetId])counts[b.targetId]=(counts[b.targetId]||0)+1;
 const high=Math.max(0,...Object.values(counts)),top=Object.keys(counts).filter(id=>counts[id]===high);
 if(top.length>1&&roundNo===1){
  r.tieCandidates=top;r.voteRound=2;r.votes={};r.voteDeadline=serverNow()+FINAL_MS;return;
 }
 const tied=top.length!==1,pickedId=tied?null:top[0],caught=!tied&&pickedId===r.spyId,awards={};
 if(isAwareSpy(r)){
  const correctWord=normalSpyWord(r),guess=r.spyGuess?.word||'';
  const guessCorrect=!!guess&&norm(guess)===norm(correctWord);
  ids.forEach(id=>{
   const spy=id===r.spyId;
   const base=spy?(caught?0:1):(caught?1:0);
   const bonus=spy&&guessCorrect?1:0;
   awards[id]={base,bonus,total:base+bonus};
   r.scores||={};r.scores[id]=(r.scores[id]||0)+base+bonus;
  });
  r.result={pickedId,caught,tied,awards,votesByRound:copyPack(r.voteHistory),voteCounts:counts,
   groupLabel:groupLabel(packFor(r),r.currentGroup),correctWord,spyGuess:guess,spyGuessCorrect:guessCorrect};
 }else{
  const spyWord=r.roles?.[r.spyId]||'',commonWord=normalSpyWord(r);
  const latestGuesses={};
  Object.values(r.voteHistory).forEach(roundBallots=>{
   Object.entries(roundBallots||{}).forEach(([id,v])=>{
    if(v?.guessWord)latestGuesses[id]=v.guessWord;
   });
  });
  ids.forEach(id=>{
   const spy=id===r.spyId,guessWord=latestGuesses[id]||'';
   const correctOppositeWord=spy?commonWord:spyWord;
   const guessed=!!guessWord&&!!correctOppositeWord&&norm(guessWord)===norm(correctOppositeWord);
   const base=spy?(caught?0:2):(caught?1:0);
   const bonus=guessed?1:0;
   awards[id]={base,bonus,total:base+bonus,guessWord,correctOppositeWord};
   r.scores||={};r.scores[id]=(r.scores[id]||0)+base+bonus;
  });
  r.result={pickedId,caught,tied,awards,votesByRound:copyPack(r.voteHistory),
   voteCounts:counts,groupLabel:groupLabel(packFor(r),r.currentGroup)};
 }
 r.status='results';r.voteDeadline=null;
}

// ===== Automatic game transitions =====
async function runAutomatic(){
 if(autoBusy||!roomId||!roomState||leaving)return;
 const r=roomState,ids=Object.keys(r.players||{}),allAnswered=ids.length>0&&ids.every(id=>r.attempts?.[id]===0),allVoted=spyVotesComplete(r);
 const timed=r.status==='playing'&&r.gameMode==='whoami_time',speaker=currentWhoSpeaker(r);
 const timedDone=timed&&(allAnswered||!speaker||!r.players?.[speaker]||r.attempts?.[speaker]===0||remainingWhoMs(r,speaker)<=0);
 const missingSpeaker=r.status==='playing'&&!timed&&(!r.players?.[r.turnOrder?.[r.currentTurnIndex||0]]||(r.gameMode==='whoami_rounds'&&r.attempts?.[r.turnOrder?.[r.currentTurnIndex||0]]===0));
 const need=timedDone||missingSpeaker||(r.status==='final_guess'&&(serverNow()>=r.finalDeadline||allAnswered))||(r.status==='voting'&&(serverNow()>=r.voteDeadline||allVoted));
 if(!need)return;
 autoBusy=true;
 try{
  await getRef().transaction(x=>{
   if(!x)return;
   const ids=Object.keys(x.players||{}),done=ids.length>0&&ids.every(id=>x.attempts?.[id]===0);
   if(x.status==='playing'&&x.gameMode==='whoami_time'){
    if(done){endTimedGame(x);return x;}
    const active=currentWhoSpeaker(x);
    if(!active){endTimedGame(x);return x;}
    if(!x.players?.[active]){
     const remaining=remainingWhoMs(x,active);
     if(remaining<=0){settleTimedSpeaker(x);return x;}
     x.whoTimeRemaining||={};
     x.whoTimeRemaining[active]=remaining;
     // Retain their turn-order position for a possible reconnect.
     advanceTimedTurn(x);return x;
    }
    if(x.attempts?.[active]===0){
     removeWhoAnsweredPlayer(x,active);return x;
    }
    if(remainingWhoMs(x,active)<=0){settleTimedSpeaker(x);return x;}
    return;
   }
   if(x.status==='playing'&&x.gameMode!=='whoami_time'){
    const active=x.turnOrder?.[x.currentTurnIndex||0];
    if(!x.players?.[active]||(x.gameMode==='whoami_rounds'&&x.attempts?.[active]===0)){
     advanceRound(x);return x;
    }
   }
   if(x.status==='final_guess'&&(done||serverNow()>=x.finalDeadline)){x.status='results';return x;}
   if(x.status==='voting'&&(serverNow()>=x.voteDeadline||spyVotesComplete(x))){resolveVotes(x);return x;}
  },undefined,false);
 }catch(e){error(e);}finally{autoBusy=false;}
}
function refreshWhoClockDisplay(){
 if(!roomId||!roomState||$('whoScreen').hidden)return;
 const r=roomState;
 if(r.status==='final_guess')$('whoTimer').textContent=formatLeft(r.finalDeadline);
 if(r.status==='playing'&&r.gameMode==='whoami_time'){
  const active=currentWhoSpeaker(r);
  $('whoTimer').textContent=msClock(remainingWhoMs(r,active));
  document.querySelectorAll('#playerTimerList [data-timer-of]').forEach(el=>{
   el.textContent=msClock(remainingWhoMs(r,el.dataset.timerOf));
  });
  if(r.attempts?.[myId]!==0&&remainingWhoMs(r,myId)<=0)$('guessBtn').disabled=true;
 }
}
setInterval(()=>{
 if(!roomId||!roomState)return;
 const r=roomState;
 if(r.status==='voting')$('voteTimer').textContent=formatLeft(r.voteDeadline);
 refreshWhoClockDisplay();
 runAutomatic();
},1000);

// ===== Summary and return to lobby =====
$('nextGameBtn').onclick=async()=>{if(!isHost||!roomId||!await confirmBox('กลับล็อบบี้?','ทุกคนจะกลับไปรอเริ่มเกมรอบใหม่ และคะแนนสะสมยังอยู่','กลับล็อบบี้'))return;try{const res=await getRef().transaction(r=>{if(!r||r.hostId!==myId||r.status!=='results')return;r.status='lobby';r.gamePlayers=null;r.roles=null;r.spyId=null;r.spyCommonWord=null;r.spyGuess=null;r.currentGroup=null;r.turnOrder=[];r.currentRound=1;r.currentTurnIndex=0;r.attempts={};r.guessedCorrectly={};r.guessDetails={};r.correctOrder=[];r.playDeadline=null;r.finalDeadline=null;r.turnStartedAt=null;r.whoTimeRemaining={};r.voteDeadline=null;r.votes={};r.voteHistory={};r.voteRound=0;r.tieCandidates=null;r.result=null;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);if(res.committed){chosenGuess='';chosenWord='';chosenVote='';chosenSpyGuess='';$('guessInput').value='';toast('กลับล็อบบี้แล้ว','success');}}catch(e){error(e);}};

// Restore remembered room only after the player confirms the prefilled name.
if(roomId){$('roomCode').textContent=roomId;$('roomTitle').textContent=`ห้อง ${roomId}`;$('leaveBtn').hidden=false;showOnly('homeView');}else showOnly('homeView');
// Fullscreen entry cover; do not interrupt people reconnecting to an active room.
let landingTransitioning=false;
function closeLandingCover(){
 const splash=$('landingCover'),button=$('landingEnterBtn');
 if(!splash||splash.hidden||landingTransitioning)return;
 landingTransitioning=true;
 button.disabled=true;
 // Fade the full-screen cover out while the main page fades in underneath.
 document.body.classList.add('landing-transitioning');
 splash.classList.add('landing-leaving');
 document.body.classList.remove('landing-active');
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 window.setTimeout(()=>{
  splash.hidden=true;
  splash.classList.remove('landing-leaving');
  document.body.classList.remove('landing-transitioning');
  button.disabled=false;
  landingTransitioning=false;
 },reducedMotion?0:780);
}
$('landingEnterBtn').addEventListener('click',closeLandingCover);
if(roomId){
 $('landingCover').hidden=true;
}else{
 document.body.classList.add('landing-active');
}
