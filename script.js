// Party Game Hub V7 — avatar picker, improved game UI, refreshed categories
const firebaseConfig={apiKey:"AIzaSyC3IuOTFTc200JcUmpVe1GEv13nCj1EM8",authDomain:"xo-game-e5fdd.firebaseapp.com",databaseURL:"https://xo-game-e5fdd-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"xo-game-e5fdd",storageBucket:"xo-game-e5fdd.appspot.com",messagingSenderId:"890496938682",appId:"1:890496938682:web:c99edd29e639415ac4883",measurementId:"G-4RHMNWP5ZJ"};
firebase.initializeApp(firebaseConfig);
const db=firebase.database(),$=id=>document.getElementById(id);
const MODES=['spyfall','whoami_time','whoami_rounds'],CATEGORIES_KEY='party_game_categories_v6',LEGACY_CATEGORIES_KEYS=['party_game_categories_v5','party_game_categories_v4','party_game_categories_v3'],IDLE_MS=600000,FINAL_MS=120000,TIMESTAMP=()=>firebase.database.ServerValue.TIMESTAMP;
const serverNow=()=>Date.now()+serverOffset,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modeTitle=m=>({spyfall:'Spyfall',whoami_time:'Who Am I · จับเวลา',whoami_rounds:'Who Am I · นับรอบ'}[m]||'Spyfall');
const random=a=>a[Math.floor(Math.random()*a.length)],shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const getRef=()=>db.ref(`rooms/${roomId}`),copyPack=v=>JSON.parse(JSON.stringify(v)),wordsOf=p=>[...new Set(Object.values(p?.groups||{}).flat().filter(x=>typeof x==='string'&&x.trim()))],norm=s=>String(s??'').trim().toLocaleLowerCase();
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

function supportsMode(pack,mode){
 if(!pack?.groups||!MODES.includes(mode))return false;
 const groups=Object.values(pack.groups).filter(Array.isArray);
 if(mode==='spyfall')return groups.some(words=>new Set(words.filter(w=>typeof w==='string'&&w.trim())).size>=2);
 return groups.some(words=>words.some(w=>typeof w==='string'&&w.trim()));
}
let serverOffset=0,roomState=null,roomId=sessionStorage.getItem('pg_room_v6')||'',myId=sessionStorage.getItem('pg_tab_id')||`u_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
let myName=localStorage.getItem('rov_spy_myname')||'',nameConfirmed=false,myAvatar=localStorage.getItem('party_game_avatar_v1')||'fox';
let selectedMode='',selectedCategory='',chosenVote='',chosenGuess='',chosenWord='',lastWhoTurnToken='';
let isHost=false,subscribedRef=null,roomCallback=null,leaving=false,sweepBusy=false,autoBusy=false,reconnectBusy=false,lastTouch=0,managerReturn='homeView',editKey=null,editNew=false,editDraft=null;
sessionStorage.setItem('pg_tab_id',myId);db.ref('.info/serverTimeOffset').on('value',s=>serverOffset=Number(s.val())||0);
const AVATARS=[
{id:'fox',name:'จิ้งจอก',emoji:'🦊',tone:'orange'},{id:'cat',name:'แมว',emoji:'🐱',tone:'pink'},{id:'panda',name:'แพนด้า',emoji:'🐼',tone:'mono'},{id:'tiger',name:'เสือ',emoji:'🐯',tone:'gold'},{id:'rabbit',name:'กระต่าย',emoji:'🐰',tone:'rose'},{id:'frog',name:'กบ',emoji:'🐸',tone:'green'},{id:'koala',name:'โคอาลา',emoji:'🐨',tone:'gray'},{id:'bear',name:'หมี',emoji:'🐻',tone:'brown'},{id:'monkey',name:'ลิง',emoji:'🐵',tone:'yellow'},{id:'penguin',name:'เพนกวิน',emoji:'🐧',tone:'blue'},{id:'owl',name:'นกฮูก',emoji:'🦉',tone:'purple'},{id:'unicorn',name:'ยูนิคอร์น',emoji:'🦄',tone:'rose'},{id:'dragon',name:'มังกร',emoji:'🐲',tone:'green'},{id:'alien',name:'เอเลียน',emoji:'👾',tone:'violet'},{id:'robot',name:'หุ่นยนต์',emoji:'🤖',tone:'blue'},{id:'octopus',name:'หมึกยักษ์',emoji:'🐙',tone:'coral'},{id:'shark',name:'ฉลาม',emoji:'🦈',tone:'cyan'},{id:'chick',name:'ลูกเจี๊ยบ',emoji:'🐥',tone:'yellow'}];
const avatarById=id=>AVATARS.find(a=>a.id===id)||AVATARS[0];
if(!AVATARS.some(a=>a.id===myAvatar)){myAvatar='fox';try{localStorage.setItem('party_game_avatar_v1',myAvatar);}catch(e){}}
const avatarMarkup=(player,cls='avatar-inline')=>{const a=avatarById(player?.avatar||'fox');return `<span class="avatar-token tone-${a.tone} ${cls}" title="${esc(a.name)}">${a.emoji}</span>`;};
const playerLabelHTML=(id,r,showYou=true)=>{const p=r?.players?.[id]||{};return `<span class="player-identity">${avatarMarkup(p)}<span>${esc(p.name||'ผู้เล่น')}${showYou&&id===myId?' (คุณ)':''}</span></span>`;};
function setGameAvatar(id,avatarId=myAvatar){const el=$(id);if(!el)return;const a=avatarById(avatarId);el.textContent=a.emoji;el.className=`game-avatar tone-${a.tone}`;}
function renderAvatarPicker(){if(!$('avatarPicker'))return;const grid=$('avatarPicker');grid.replaceChildren();AVATARS.forEach(a=>{const b=document.createElement('button');b.type='button';b.className=`avatar-option ${myAvatar===a.id?'selected':''}`;b.dataset.avatar=a.id;b.setAttribute('aria-pressed',String(myAvatar===a.id));b.innerHTML=`<span class="avatar-token tone-${a.tone}">${a.emoji}</span><small>${esc(a.name)}</small>`;b.onclick=()=>{myAvatar=a.id;localStorage.setItem('party_game_avatar_v1',myAvatar);renderAvatarPicker();toast(`เลือกตัวละคร ${a.name} แล้ว`,'success');};grid.append(b);});const a=avatarById(myAvatar);$('avatarPreview').textContent=a.emoji;$('avatarPreview').className=`avatar-preview tone-${a.tone}`;$('avatarSelectedLabel').textContent=`ตัวละครของคุณ: ${a.name}`;$('profileAvatar').textContent=a.emoji;$('profileAvatar').className=`panel-emoji avatar-profile tone-${a.tone}`;}
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
function defaultCategories(){const c=copyPack(builtinCategories);Object.values(c).forEach(x=>x.enabledModes=[...MODES]);return c;}
function isRemovedCategory(key,value){
 const id=String(key||'').toLowerCase(),name=String(value?.name||'').toLowerCase();
 return id==='blue_lock'||id==='demon_slayer'||name.includes('blue lock')||name.includes('demon slayer');
}
let deletedCategoryKeys = new Set();
function loadCategories(){
 const base=defaultCategories();
 const sources=[];
 const storageKeys=[...LEGACY_CATEGORIES_KEYS,CATEGORIES_KEY];
 for(const storageKey of storageKeys){
  try{
   const raw=localStorage.getItem(storageKey);
   if(!raw)continue;
   const parsed=JSON.parse(raw);
   const categories=parsed?.categories&&typeof parsed.categories==='object'?parsed.categories:parsed;
   if(categories&&typeof categories==='object'&&!Array.isArray(categories)){
    sources.push({categories,deleted:Array.isArray(parsed?.deleted)?parsed.deleted.map(String):[]});
   }
  }catch(e){console.warn('Category migration',storageKey,e);}
 }
 for(const source of sources){
  Object.entries(source.categories).forEach(([key,value])=>{
   if(!/^[\w-]{1,50}$/.test(key)||!value||typeof value.name!=='string'||!value.groups||typeof value.groups!=='object'||isRemovedCategory(key,value))return;
   const groups={};
   Object.entries(value.groups).forEach(([groupName,words])=>{
    if(!Array.isArray(words))return;
    const n=String(groupName).trim().toLowerCase();
    if(key==='general_items'&&(n==='อาหาร'||n==='สัตว์'||n==='animals'||n==='animal'||n.includes('food')))return;
    const cleaned=[...new Set(words.map(w=>String(w).trim()).filter(Boolean))];
    if(cleaned.length)groups[groupName]=cleaned;
   });
   if(!Object.keys(groups).length)return;
   const validModes=Array.isArray(value.enabledModes)
    ? value.enabledModes.filter(mode=>MODES.includes(mode))
    : [...MODES];
   // Legacy packs can contain obsolete mode IDs or an empty mode list.
   const enabledModes=validModes.length?validModes:[...MODES];
   base[key]={...value,name:value.name.trim(),groups,enabledModes};
   deletedCategoryKeys.delete(key);
  });
  // Deletions in newer storage versions override older category copies.
  source.deleted.forEach(key=>deletedCategoryKeys.add(key));
 }
 Object.entries(base).forEach(([key,value])=>{if(isRemovedCategory(key,value))delete base[key];});
 deletedCategoryKeys.forEach(key=>delete base[key]);
 // Keep ROV and VALORANT ready to play after importing old browser data.
 ['rov','valorant'].forEach(key=>{
  const fallback=builtinCategories[key];
  let pack=base[key];
  if(!pack||!pack.groups||!Object.keys(pack.groups).length)pack=copyPack(fallback);
  if(!supportsMode(pack,'spyfall'))pack.groups=copyPack(fallback.groups);
  pack.enabledModes=[...MODES];
  base[key]=pack;
  deletedCategoryKeys.delete(key);
 });
 if(base.general_items){
  base.general_items.groups=Object.fromEntries(Object.entries(base.general_items.groups||{}).filter(([groupName])=>{
   const n=String(groupName).trim().toLowerCase();
   return n!=='อาหาร'&&n!=='สัตว์'&&n!=='animals'&&n!=='animal'&&!n.includes('food');
  }));
 }
 try{
  const payload=JSON.stringify({version:6,categories:base,deleted:[...deletedCategoryKeys]});
  localStorage.setItem(CATEGORIES_KEY,payload);
  if(localStorage.getItem(CATEGORIES_KEY)!==payload)throw new Error('ตรวจสอบข้อมูลหลังบันทึกไม่ผ่าน');
 }catch(e){console.warn('Category migration save failed',e);}
 return base;
}
let library=loadCategories();
const saveCategories=()=>{
 const payload=JSON.stringify({version:6,categories:library,deleted:[...deletedCategoryKeys]});
 localStorage.setItem(CATEGORIES_KEY,payload);
 const saved=localStorage.getItem(CATEGORIES_KEY);
 if(saved!==payload)throw new Error('เบราว์เซอร์ไม่สามารถยืนยันการบันทึกหมวดหมู่ได้');
 const verified=JSON.parse(saved);
 if(!verified?.categories||!Array.isArray(verified.deleted))throw new Error('รูปแบบข้อมูลที่บันทึกไม่ถูกต้อง');
 return true;
};
const packFor=r=>{
 const candidates=[r?.categoryPack,library[r?.category],builtinCategories[r?.category]];
 return candidates.find(pack=>supportsMode(pack,r?.gameMode))||candidates.find(pack=>wordsOf(pack).length)||builtinCategories.rov;
},enabledFor=p=>Array.isArray(p?.enabledModes)&&p.enabledModes.length?p.enabledModes:MODES;
function showOnly(v){['homeView','createView','managerView','roomView'].forEach(id=>$(id).hidden=id!==v);}function showScreen(v){['lobbyScreen','spyScreen','whoScreen','voteScreen','resultsScreen'].forEach(id=>$(id).hidden=id!==v);}
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
function renderNameConfirmation(){const input=$('nameInput'),button=$('confirmNameBtn'),status=$('nameStatus');input.value=myName;input.disabled=nameConfirmed;button.disabled=nameConfirmed;input.classList.toggle('name-locked',nameConfirmed);button.classList.toggle('confirmed',nameConfirmed);status.classList.toggle('name-confirmed',nameConfirmed);button.textContent='✓';button.title=nameConfirmed?'ยืนยันชื่อเรียบร้อยแล้ว':'กดยืนยันชื่อ';button.setAttribute('aria-label',button.title);status.textContent=nameConfirmed?`✓ ยืนยันชื่อ ${myName} เรียบร้อยแล้ว`:myName?`พบชื่อเดิม "${myName}" แก้ไขได้ แล้วกด ✓ เพื่อยืนยัน`:'กรอกชื่อแล้วกดปุ่ม ✓ เพื่อยืนยันชื่อ';}
$('nameInput').addEventListener('input',()=>{if(nameConfirmed)$('nameInput').value=myName;});
$('confirmNameBtn').addEventListener('click',()=>{if(nameConfirmed)return;const value=$('nameInput').value.trim();if(!value){toast('กรุณากรอกชื่อเล่นก่อนยืนยัน','error');$('nameInput').focus();return;}if(value.length>15){toast('ชื่อเล่นต้องไม่เกิน 15 ตัวอักษร','error');return;}myName=value;localStorage.setItem('rov_spy_myname',myName);nameConfirmed=true;renderNameConfirmation();toast('✓ ยืนยันชื่อเรียบร้อยแล้ว','success');if(roomId){showOnly('roomView');reconnect();}});
renderNameConfirmation();
renderAvatarPicker();
function ensureName(){if(!nameConfirmed||!myName){toast('กรุณากรอกชื่อและกด ✓ ยืนยันชื่อก่อนเล่นเกม','error');if(!$('nameInput').value.trim())$('nameInput').focus();else $('confirmNameBtn').focus();return false;}return true;}

// ===== Room list and automatic cleanup =====
function inactive(r){const t=r?.lastActivityAt??r?.createdAt;return typeof t==='number'&&serverNow()-t>=IDLE_MS;}
db.ref('rooms').on('value',s=>renderRoomList(s.val()||{}),error);
function renderRoomList(rooms){const list=$('roomList');list.replaceChildren();const entries=Object.entries(rooms).filter(([,r])=>r&&!inactive(r));if(!entries.length){list.innerHTML='<p class="muted">ยังไม่มีห้อง ลองสร้างห้องใหม่เลย ✨</p>';return;}entries.sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0));entries.forEach(([id,r])=>{const row=document.createElement('div');row.className='room-entry';const info=document.createElement('div'),title=document.createElement('strong'),sub=document.createElement('p');title.textContent=`🏠 ${r.roomName||id}`;sub.textContent=`เลขห้อง ${r.roomCode||id} · ${modeTitle(r.gameMode)} · ${Object.keys(r.players||{}).length} คน · ${r.status==='lobby'?'รอผู้เล่น':'กำลังเล่น'}`;info.append(title,sub);const btn=document.createElement('button');btn.className='btn soft small';btn.textContent=r.status==='lobby'?'เข้าร่วม':'กำลังเล่น';btn.disabled=r.status!=='lobby';btn.onclick=()=>{if(ensureName())joinRoom(id);};row.append(info,btn);list.append(row);});}
async function removeInactive(id){await db.ref(`rooms/${id}`).transaction(r=>{if(r&&inactive(r))return null;},undefined,false);}
async function sweep(){if(sweepBusy)return;sweepBusy=true;try{const s=await db.ref('rooms').once('value');for(const [id,r] of Object.entries(s.val()||{}))if(inactive(r))await removeInactive(id);}catch(e){console.warn('Idle cleanup',e);}finally{sweepBusy=false;}}
setTimeout(sweep,1500);setInterval(sweep,30000);
function touch(){if(!roomId||leaving||serverNow()-lastTouch<45000)return;lastTouch=serverNow();getRef().child('lastActivityAt').set(TIMESTAMP()).catch(error);}
$('roomView').addEventListener('pointerdown',touch);$('roomView').addEventListener('keydown',touch);

// ===== Create room and category selection =====
$('openCreateBtn').onclick=()=>{if(!ensureName())return;selectedMode='';selectedCategory='';$('durationInput').value=2;$('createDetails').hidden=true;renderModeChoices();showOnly('createView');};
$('createBackBtn').onclick=()=>showOnly('homeView');
function renderModeChoices(){document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('selected',b.dataset.mode===selectedMode);b.setAttribute('aria-pressed',String(b.dataset.mode===selectedMode));});renderCategoryChoices();}
$('modeOptions').onclick=e=>{const b=e.target.closest('[data-mode]');if(!b)return;selectedMode=b.dataset.mode;selectedCategory='';$('durationInput').value=selectedMode==='whoami_time'?3:2;$('createDetails').hidden=false;$('durationLabel').textContent=selectedMode==='whoami_time'?'เวลาเล่น (นาที)':'จำนวนรอบพูด';$('durationHelp').textContent=selectedMode==='whoami_time'?'ครบเวลาจะมีช่วงทายสุดท้าย 2 นาที':'ครบเทิร์นสุดท้ายจะมีช่วงตอบ 2 นาที';renderModeChoices();};
function renderCategoryChoices(){const target=$('categoryOptions');target.replaceChildren();const entries=Object.entries(library).filter(([,c])=>enabledFor(c).includes(selectedMode)&&supportsMode(c,selectedMode));if(!entries.some(([id])=>id===selectedCategory))selectedCategory='';entries.forEach(([key,c])=>{const b=document.createElement('button');b.className=`choice ${selectedCategory===key?'selected':''}`;b.type='button';b.innerHTML=`<strong>${esc(c.name)}</strong><small>${wordsOf(c).length} คำ</small>`;b.onclick=()=>{selectedCategory=key;renderCategoryChoices();};target.append(b);});if(!entries.length)target.innerHTML='<p class="muted">ไม่มีหมวดที่เปิดให้ใช้กับโหมดนี้</p>';$('createConfirmBtn').disabled=!selectedMode||!selectedCategory;}
$('minusBtn').onclick=()=>{$('durationInput').value=Math.max(1,Number($('durationInput').value||2)-1);};$('plusBtn').onclick=()=>{$('durationInput').value=Math.min(99,Number($('durationInput').value||2)+1);};

// ===== Category manager (saved locally in this browser) =====
$('openManagerBtn').onclick=()=>openManager('homeView');$('managerBackBtn').onclick=()=>{showOnly(managerReturn);if(managerReturn==='createView')renderCategoryChoices();};
function openManager(from){managerReturn=from;showOnly('managerView');if(!editDraft&&Object.keys(library).length)chooseCategory(Object.keys(library)[0]);renderManager();}
function chooseCategory(key){if(!library[key])return;editKey=key;editNew=false;const p=copyPack(library[key]);editDraft={name:p.name,enabledModes:[...enabledFor(p)],groups:Object.entries(p.groups).map(([name,words])=>({name,words:[...words]}))};renderManager();}
function renderManager(){const target=$('managerList');target.replaceChildren();Object.entries(library).forEach(([key,c])=>{const b=document.createElement('button');b.className=`manager-item ${!editNew&&key===editKey?'selected':''}`;b.textContent=c.name;const s=document.createElement('small');s.textContent=`${wordsOf(c).length} คำ`;b.append(s);b.onclick=()=>chooseCategory(key);target.append(b);});$('managerEditor').hidden=!editDraft;$('managerEmpty').hidden=!!editDraft;if(!editDraft)return;$('editCategoryName').value=editDraft.name;document.querySelectorAll('#enabledModes input').forEach(c=>c.checked=editDraft.enabledModes.includes(c.value));$('deleteCategoryBtn').disabled=editNew;renderGroups();}
$('editCategoryName').oninput=()=>{if(editDraft)editDraft.name=$('editCategoryName').value;};$('enabledModes').onchange=()=>{if(editDraft)editDraft.enabledModes=[...document.querySelectorAll('#enabledModes input:checked')].map(x=>x.value);};
function parseWords(t){return [...new Set(String(t).split(/[\n,，]+/).map(x=>x.trim()).filter(Boolean))];}
function renderGroups(){const target=$('groupEditors');target.replaceChildren();editDraft.groups.forEach((g,i)=>{const box=document.createElement('div');box.className='group-edit';const head=document.createElement('div');head.className='head';const name=document.createElement('input');name.value=g.name;name.placeholder='ชื่อกลุ่ม';name.maxLength=45;name.oninput=()=>g.name=name.value;const del=document.createElement('button');del.className='btn danger small';del.textContent='ลบ';del.onclick=()=>{editDraft.groups.splice(i,1);renderGroups();};head.append(name,del);const input=document.createElement('textarea');input.value=g.words.join('\n');input.placeholder='พิมพ์คำละ 1 บรรทัด';const count=document.createElement('small');count.textContent=`${g.words.length} คำ`;input.oninput=()=>{g.words=parseWords(input.value);count.textContent=`${g.words.length} คำ`;};box.append(head,input,count);target.append(box);});}
$('newCategoryBtn').onclick=()=>{editKey=null;editNew=true;editDraft={name:'',enabledModes:[...MODES],groups:[{name:'กลุ่มแรก',words:[]}]};renderManager();$('editCategoryName').focus();};
$('addGroupBtn').onclick=()=>{if(!editDraft)return;if(editDraft.groups.length>=20){toast('สูงสุด 20 กลุ่มต่อหมวด','error');return;}editDraft.groups.push({name:`กลุ่ม ${editDraft.groups.length+1}`,words:[]});renderGroups();};
$('saveCategoryBtn').onclick=()=>{if(!editDraft)return;const name=editDraft.name.trim();if(name.length<2||name.length>40){toast('ชื่อหมวดต้องยาว 2–40 ตัว','error');return;}if(!editDraft.enabledModes.length){toast('เลือกโหมดเกมอย่างน้อย 1 โหมด','error');return;}const groups={};for(const g of editDraft.groups){const n=g.name.trim();if(!n||groups[n]||g.words.length>150||g.words.some(w=>w.length>60)){toast('ตรวจสอบชื่อกลุ่ม คำซ้ำ หรือจำนวนคำ','error');return;}if(g.words.length)groups[n]=[...new Set(g.words)];}if(!Object.keys(groups).length){toast('เพิ่มคำอย่างน้อยหนึ่งคำ','error');return;}if(editDraft.enabledModes.includes('spyfall')&&!Object.values(groups).some(g=>g.length>=2)){toast('Spyfall ต้องมีกลุ่มที่มีอย่างน้อยสองคำ','error');return;}if(editNew&&Object.keys(library).length>=100){toast('สูงสุด 100 หมวด','error');return;}const key=editNew?`custom_${Date.now().toString(36)}`:editKey;library[key]={name,groups,enabledModes:[...editDraft.enabledModes]};deletedCategoryKeys.delete(key);try{saveCategories();chooseCategory(key);renderCategoryChoices();toast('บันทึกหมวดลงเบราว์เซอร์แล้ว รีเฟรชก็ยังอยู่','success');}catch(e){toast(`บันทึกหมวดไม่สำเร็จ: ${e.message||'พื้นที่จัดเก็บไม่พร้อม'}`,'error');console.error(e);}};
$('deleteCategoryBtn').onclick=async()=>{if(!editKey||!await confirmBox('ลบหมวดนี้?',`ลบ ${library[editKey].name} และบันทึกการลบไว้ แม้รีเฟรชหน้าเว็บ`,'ลบ'))return;const removedKey=editKey;delete library[removedKey];deletedCategoryKeys.add(removedKey);try{saveCategories();editDraft=null;editKey=null;const first=Object.keys(library)[0];if(first)chooseCategory(first);else renderManager();renderCategoryChoices();toast('ลบหมวดและบันทึกแล้ว','success');}catch(e){toast(`บันทึกการลบไม่สำเร็จ: ${e.message||''}`,'error');console.error(e);}};


// ===== Room lifecycle =====
function unsubscribe(){if(subscribedRef&&roomCallback)subscribedRef.off('value',roomCallback);subscribedRef=null;roomCallback=null;}
function goHome(msg=''){unsubscribe();roomId='';roomState=null;isHost=false;leaving=false;sessionStorage.removeItem('pg_room_v6');$('leaveBtn').hidden=true;showOnly('homeView');if(msg)toast(msg);}
function enterRoom(id){unsubscribe();roomId=id;leaving=false;lastTouch=serverNow();sessionStorage.setItem('pg_room_v6',id);$('roomTitle').textContent='กำลังโหลดห้อง…';$('roomCode').textContent=id;$('leaveBtn').hidden=false;showOnly('roomView');subscribe();}
function subscribe(){if(!roomId)return;unsubscribe();const id=roomId,ref=db.ref(`rooms/${id}`);const cb=s=>{if(id!==roomId||leaving)return;const r=s.val();if(!r){goHome('ห้องถูกปิดหรือหมดอายุแล้ว');return;}roomState=r;isHost=r.hostId===myId;const ps=r.players||{};if(Object.keys(ps).length&&!ps[r.hostId])ref.transaction(x=>{if(!x)return;const ids=Object.keys(x.players||{});if(ids.length&&!x.players[x.hostId]){x.hostId=ids[0];return x;}},undefined,false).catch(error);renderRoom(r);runAutomatic();};subscribedRef=ref;roomCallback=cb;ref.on('value',cb,error);}
async function reconnect(){if(!roomId||leaving||reconnectBusy)return;if(!nameConfirmed||!myName){showOnly('homeView');toast('กรุณายืนยันชื่อก่อนกลับเข้าห้อง','error');return;}reconnectBusy=true;const id=roomId,ref=db.ref(`rooms/${id}`);try{const s=await ref.once('value'),r=s.val();if(id!==roomId)return;if(!r||inactive(r)){if(r)await removeInactive(id);goHome('ห้องเดิมหมดอายุแล้ว');return;}if(r.status!=='lobby'&&!r.roles?.[myId]){goHome('เกมเริ่มแล้ว ไม่สามารถเข้ากลางเกมได้');return;}await ref.child(`players/${myId}`).onDisconnect().remove();await ref.child(`players/${myId}`).set({name:myName,avatar:myAvatar});if(!subscribedRef)subscribe();}catch(e){error(e);}finally{reconnectBusy=false;}}
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
 if(selectedMode==='spyfall'&&!Object.values(pack.groups).some(g=>new Set(g).size>=2)){toast('หมวดนี้ต้องมีกลุ่มที่มีคำไม่ซ้ำอย่างน้อย 2 คำสำหรับ Spyfall','error');return;}
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
   categoryPack:firebaseSafePack(pack),settingValue:n,status:'lobby',
   players:{[myId]:{name:myName,avatar:myAvatar}},scores:{[myId]:0},
   createdAt:TIMESTAMP(),lastActivityAt:TIMESTAMP(),gamesPlayed:0
  };
  await ref.set(roomData);
  try{await ref.child(`players/${myId}`).onDisconnect().remove();}
  catch(disconnectError){console.warn('onDisconnect registration failed; room is still created',disconnectError);}
  enterRoom(id);toast(`สร้างห้อง ${roomName} · เลขห้อง ${roomCode} เรียบร้อย!`,'success');
 }catch(e){error(e);}
 finally{button.disabled=false;button.textContent='สร้างห้อง →';renderCategoryChoices();}
};
async function joinRoom(id){if(!ensureName())return;const ref=db.ref(`rooms/${id}`);try{await ref.child(`players/${myId}`).onDisconnect().remove();const res=await ref.transaction(r=>{if(!r||r.status!=='lobby'||inactive(r))return;r.players||={};r.players[myId]={name:myName,avatar:myAvatar};r.scores||={};r.scores[myId]??=0;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);if(!res.committed){await ref.child(`players/${myId}`).onDisconnect().cancel();toast('ห้องนี้เข้าร่วมไม่ได้แล้ว','error');return;}enterRoom(id);toast('เข้าห้องแล้ว','success');}catch(e){error(e);}}
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

// ===== Game rendering =====
function renderLobbyCategory(r){
 const select=$('lobbyCategorySelect'),button=$('lobbyChangeCategoryBtn'),pack=packFor(r),currentKey=String(r.category||'');
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
function renderRoom(r){const players=r.players||{},ids=Object.keys(players),status=r.status;$('roomTitle').textContent=r.roomName||`ห้อง ${roomId}`;$('roomCode').textContent=r.roomCode||roomId;$('roomMeta').textContent=`${modeTitle(r.gameMode)} · ${packFor(r).name} · ${r.settingValue||2} ${r.gameMode==='whoami_time'?'นาที':'รอบ'}`;renderScores(r);showScreen(({lobby:'lobbyScreen',playing:r.gameMode==='spyfall'?'spyScreen':'whoScreen',final_guess:'whoScreen',voting:'voteScreen',results:'resultsScreen'})[status]||'lobbyScreen');
 if(status==='lobby'){
  renderLobbyCategory(r);
  $('hostLine').innerHTML=`👑 หัวหน้าห้อง: ${playerLabelHTML(r.hostId,r)} · ${ids.length} คน`;
  $('playerList').replaceChildren();
  ids.forEach((id,i)=>{const el=document.createElement('div');el.className='player-row';el.innerHTML=`<span class="player-rank">${i+1}</span>${playerLabelHTML(id,r)}${id===r.hostId?'<span class="host-tag">👑 HOST</span>':''}`;$('playerList').append(el);});
  const min=r.gameMode==='spyfall'?3:2;$('startBtn').hidden=!isHost;$('startBtn').disabled=ids.length<min;$('startBtn').textContent=ids.length<min?`ต้องมีอย่างน้อย ${min} คน`:'▶ เริ่มเกม';
  $('deleteRoomBtn').hidden=!isHost;$('lobbyNotice').hidden=isHost;$('lobbyNotice').textContent=`รอ ${players[r.hostId]?.name||'Host'} เริ่มเกม…`;
 }else if(status==='playing'&&r.gameMode==='spyfall')renderSpy(r);
 else if(status==='playing'||status==='final_guess')renderWho(r);
 else if(status==='voting')renderVotes(r);
 else if(status==='results')renderResults(r);
}
function renderScores(r){const p=r.players||{},scores=r.scores||{};$('scoreList').replaceChildren();Object.keys(p).sort((a,b)=>(scores[b]||0)-(scores[a]||0)).forEach((id,i)=>{const el=document.createElement('div');el.className='score-row';el.innerHTML=`<span class="score-identity"><span class="score-medal">${['🥇','🥈','🥉'][i]||i+1}</span>${playerLabelHTML(id,r)}</span><b>${scores[id]||0} pts</b>`;$('scoreList').append(el);});}
function renderSpy(r){const idx=r.currentTurnIndex||0,speaker=r.turnOrder?.[idx],players=r.players||{};setGameAvatar('spyMyAvatar');$('mySpyWord').textContent=r.roles?.[myId]||'—';$('spyRound').textContent=`รอบ ${r.currentRound||1} / ${r.totalRounds||2}`;$('spySpeaker').innerHTML=speaker===myId?`<span class="player-identity">${avatarMarkup({avatar:myAvatar})}<span>ถึงตาคุณพูดแล้ว</span></span>`:`<span class="player-identity">${avatarMarkup(players[speaker])}<span>กำลังรอ ${esc(players[speaker]?.name||'ผู้เล่น')} พูด</span></span>`;$('spyDoneBtn').hidden=speaker!==myId;$('skipSpyBtn').hidden=!isHost;renderOrder($('spyOrder'),r,true);renderGameStats('spyProgress',[{label:'รอบที่เล่น',value:`${r.currentRound||1} / ${r.totalRounds||2}`},{label:'ลำดับเทิร์น',value:`${idx+1} / ${(r.turnOrder||[]).length}`},{label:'ผู้เล่นในห้อง',value:`${Object.keys(players).length} คน`}]);$('spyGroupName').textContent=`หมวดคำ: ${groupLabel(packFor(r),r.currentGroup)}`;$('spyWords').replaceChildren();(packFor(r).groups?.[r.currentGroup]||[]).forEach(w=>{const el=document.createElement('div');el.className='word';el.textContent=w;$('spyWords').append(el);});}
function resetWhoGuessInput(){
 chosenGuess='';
 $('guessInput').value='';
 $('guessSelected').textContent='ยังไม่ได้เลือกคำตอบ';
 const suggestions=$('guessSuggestions');
 suggestions.replaceChildren();
 suggestions.hidden=true;
}
function renderWho(r){
 const final=r.status==='final_guess',timed=r.gameMode==='whoami_time',idx=r.currentTurnIndex||0,speaker=r.turnOrder?.[idx],players=r.players||{};
 const turnToken=r.gameMode==='whoami_rounds'&&r.status==='playing'? `${roomId}:${r.gamesPlayed||0}:${r.currentRound||1}:${speaker||''}`:'';
 if(turnToken!==lastWhoTurnToken){
  if(turnToken)resetWhoGuessInput();
  lastWhoTurnToken=turnToken;
 }
 setGameAvatar('whoMyAvatar');$('whoTurnBlock').hidden=timed||final;$('whoTimerBlock').hidden=!timed&&!final;$('whoTimerLabel').textContent=final?'⏳ ช่วงตอบสุดท้าย (2 นาที)':'⏱️ เวลาเล่น';$('whoTimer').textContent=formatLeft(final?r.finalDeadline:r.playDeadline);$('whoRound').textContent=`รอบ ${r.currentRound||1} / ${r.totalRounds||2}`;$('whoSpeaker').innerHTML=speaker===myId?`<span class="player-identity">${avatarMarkup({avatar:myAvatar})}<span>ตาคุณถามแล้ว</span></span>`:`<span class="player-identity">${avatarMarkup(players[speaker])}<span>กำลังรอ ${esc(players[speaker]?.name||'ผู้เล่น')} ถาม</span></span>`;$('whoDoneBtn').hidden=timed||final||speaker!==myId;renderOrder($('whoOrder'),r,!timed&&!final);const answeredCount=Object.values(r.attempts||{}).filter(v=>v===0).length;const progressValue=final||timed?formatLeft(final?r.finalDeadline:r.playDeadline):`${idx+1} / ${(r.turnOrder||[]).length} เทิร์น`;renderGameStats('whoProgress',[{label:'รูปแบบ',value:final?'ช่วงตอบสุดท้าย':timed?'จับเวลา':'นับรอบ'},{label:final?'ตอบแล้ว':'ความคืบหน้า',value:`${answeredCount} / ${Object.keys(players).length} คน`},{label:final||timed?'เวลาที่เหลือ':'เทิร์นปัจจุบัน',value:progressValue}]);$('otherWords').replaceChildren();(r.turnOrder||[]).forEach(id=>{if(id===myId||!players[id])return;const el=document.createElement('div');el.className=`word ${r.attempts?.[id]===0?'done':''}`;el.innerHTML=`${playerLabelHTML(id,r,false)}<span class="word-secret">${esc(r.roles?.[id]||'—')}</span>${r.attempts?.[id]===0?`<small>${r.guessedCorrectly?.[id]?'✓ ตอบถูก':'✕ ตอบผิด'}</small>`:''}`;$('otherWords').append(el);});const answered=r.attempts?.[myId]===0;$('guessInputs').hidden=answered;const myGuess=r.guessDetails?.[myId]||{};$('guessHeading').textContent=answered?(r.guessedCorrectly?.[myId]?'🎉 คุณตอบถูกแล้ว!':'✕ คุณตอบผิด เฉลยแล้ว'):(final?'🎯 โอกาสสุดท้าย! ทายภายใน 2 นาที':'🎯 ทายคำของคุณ (1 ครั้ง)');const reveal=$('answerReveal');if(reveal){reveal.hidden=!answered;reveal.innerHTML=answered?`<strong>${r.guessedCorrectly?.[myId]?'✓ คำตอบถูกต้อง':'✕ คำตอบไม่ถูกต้อง'}</strong><span>คำตอบที่ถูก: <b>${esc(myGuess.correctAnswer||r.roles?.[myId]||'—')}</b></span><span>คำตอบของคุณ: <b>${esc(myGuess.answer||'ไม่พบข้อมูลคำตอบ')}</b></span>`:'';}$('skipWhoBtn').hidden=!isHost||final;}
function renderVotes(r){const players=r.players||{},mine=r.votes?.[myId],choices=r.tieCandidates||Object.keys(players),voteCount=Object.keys(r.votes||{}).length,total=Object.keys(players).length;$('voteHeading').textContent=r.tieCandidates?'🗳️ โหวตรอบตัดสิน':'🗳️ ใครคือ Spy?';$('voteTimer').textContent=formatLeft(r.voteDeadline);$('voteNote').textContent=mine?`✓ คุณโหวตแล้ว · ${voteCount}/${total} คน`:`โหวตและทายคำให้ทัน 2 นาที · ${voteCount}/${total} คนโหวตแล้ว`;renderGameStats('voteProgress',[{label:'ขั้นตอน',value:r.tieCandidates?'โหวตตัดสิน':'โหวตหา Spy'},{label:'ส่งโหวตแล้ว',value:`${voteCount} / ${total} คน`},{label:'เวลาที่เหลือ',value:formatLeft(r.voteDeadline)}]);$('voteChoices').replaceChildren();$('voteAnswer').hidden=!!mine;if(mine){$('voteChoices').innerHTML='<p class="notice">✓ บันทึกโหวตแล้ว รอเพื่อนหรือหมดเวลา</p>';return;}if(!choices.includes(chosenVote))chosenVote='';choices.filter(id=>id!==myId&&players[id]).forEach(id=>{const b=document.createElement('button');b.className=`vote-choice ${id===chosenVote?'selected':''}`;b.innerHTML=`${playerLabelHTML(id,r)}<b>${id===chosenVote?'✓ เลือกแล้ว':'เลือก →'}</b>`;b.onclick=()=>{chosenVote=id;chosenWord='';renderVotes(r);};$('voteChoices').append(b);});$('voteAnswer').hidden=!chosenVote;if(chosenVote){$('voteWord').replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='— ไม่ทายคำ —';$('voteWord').append(empty);[...new Set(packFor(r).groups?.[r.currentGroup]||[])].forEach(w=>{const o=document.createElement('option');o.value=w;o.textContent=w;$('voteWord').append(o);});$('voteWord').value=chosenWord;}}
function addDetail(target,text){const el=document.createElement('p');el.className='result-details';el.textContent=text;target.append(el);}
function renderResults(r){
 const players=r.players||{},scores=r.scores||{},ids=Object.keys(players).sort((a,b)=>(scores[b]||0)-(scores[a]||0));
 $('resultContent').replaceChildren();
 const hero=document.createElement('div');hero.className='result-hero';
 const spy=r.gameMode==='spyfall',result=r.result||{},heading=document.createElement('h2');
 heading.textContent=spy?(result.caught?'🎉 คนปกติจับ Spy ได้!':'🕵️ Spy ชนะรอบนี้!'):'🎊 จบเกม Who Am I!';
 const desc=document.createElement('p');
 desc.textContent=spy?`Spy คือ ${players[r.spyId]?.name||'ผู้เล่นที่ออกแล้ว'} · คำ Spy: ${r.roles?.[r.spyId]||'—'}`:r.gameMode==='whoami_rounds'?'ตอบถูกในรอบเดียวกัน ได้คะแนนเท่ากัน':'คนตอบถูกก่อน ได้คะแนนมากกว่า';
 hero.append(heading,desc);$('resultContent').append(hero);
 const detail=document.createElement('div');detail.className='result-section';detail.innerHTML='<h3>🔍 เฉลยและรายละเอียด</h3>';
 if(spy){
  const other=Object.keys(r.roles||{}).find(id=>id!==r.spyId);
  addDetail(detail,`หมวดคำ: ${result.groupLabel||groupLabel(packFor(r),r.currentGroup)}`);
  addDetail(detail,`คำของคนปกติ: ${r.roles?.[other]||'—'}`);
  addDetail(detail,result.tied?'ผลโหวตตัดสินยังเสมอ':`ผู้ถูกโหวตมากที่สุด: ${players[result.pickedId]?.name||'ไม่มีผู้ถูกเลือก'}`);
  const rounds=result.votesByRound||{round_1:r.votes||{}};
  Object.entries(rounds).sort(([a],[b])=>a.localeCompare(b)).forEach(([roundKey,ballots])=>{
   const roundNo=Number(String(roundKey).replace(/\\D/g,''))||1,counts={};
   Object.values(ballots||{}).forEach(v=>{if(v?.targetId)counts[v.targetId]=(counts[v.targetId]||0)+1;});
   addDetail(detail,`ผลโหวตรอบที่ ${roundNo}: ${Object.entries(counts).map(([id,count])=>`${players[id]?.name||'ผู้เล่น'} ${count} เสียง`).join(' · ')||'ไม่มีผู้ลงคะแนน'}`);
   Object.entries(ballots||{}).forEach(([id,b])=>addDetail(detail,`รอบ ${roundNo} · ${players[id]?.name||'ผู้เล่น'} โหวต ${players[b.targetId]?.name||'—'} · ทาย ${b.guessWord||'ไม่ทาย'}${roundNo===Number(r.voteRound)?` · โบนัส +${result.awards?.[id]?.bonus||0}`:''}`));
  });
 }else{
  ids.forEach(id=>{
   const d=r.guessDetails?.[id]||{},correctAnswer=d.correctAnswer||r.roles?.[id]||'—';
   const submitted=d.answer||(d.correct?'คำตอบถูก (ข้อมูลเก่า)':'ไม่ได้ตอบ');
   const status=d.correct?'ตอบถูก':d.answer?'ตอบผิด':d.correct===false?'ตอบผิด (ไม่มีข้อมูลคำตอบเดิม)':'ไม่ได้ตอบ';
   addDetail(detail,`${players[id]?.name||'ผู้เล่น'} · คำที่ถูก: ${correctAnswer} · คำตอบที่ส่ง: ${submitted} · ${status}${d.correct?` · รอบ ${d.round||1}`:''}`);
  });
 }
 $('resultContent').append(detail);
 const board=document.createElement('div');board.className='result-section';board.innerHTML='<h3>🏆 คะแนนของรอบนี้ / คะแนนสะสม</h3>';
 ids.forEach((id,i)=>{
  const a=spy?result.awards?.[id]:r.guessDetails?.[id],pts=spy?(a?.total||0):(a?.points||0);
  const note=spy?`ชนะ +${a?.base||0} · ทายคำ +${a?.bonus||0}`:(a?.correct?`ทายถูก · รอบ ${a.round}`:r.guessDetails?.[id]?.answer?'ตอบผิด':'ไม่ได้ตอบ');
  const row=document.createElement('div');row.className='result-row';
  row.innerHTML=`<div><strong class="result-player"><span class="score-medal">${['🥇','🥈','🥉'][i]||i+1}</span>${playerLabelHTML(id,r,false)}${id===r.spyId?' 🕵️':''}</strong><small>${esc(note)}</small></div><b>+${pts} / รวม ${scores[id]||0}</b>`;
  board.append(row);
 });
 $('resultContent').append(board);$('resultHostActions').hidden=!isHost;$('resultWaiting').hidden=isHost;
}

// ===== Game start, turns and final response windows =====
function toFinalGuess(r){const ids=Object.keys(r.players||{}),pending=ids.some(id=>r.attempts?.[id]!==0);if(!pending){r.status='results';r.finalDeadline=null;return;}r.status='final_guess';r.finalDeadline=serverNow()+FINAL_MS;}
function toVoting(r){r.status='voting';r.votes={};r.voteHistory={};r.voteRound=1;r.tieCandidates=null;r.voteDeadline=serverNow()+FINAL_MS;}
function advanceRound(r){
 const order=r.turnOrder||[];
 if(!order.length){if(r.gameMode==='spyfall')toVoting(r);else toFinalGuess(r);return;}
 let i=r.currentTurnIndex||0,round=r.currentRound||1;
 for(let n=0;n<order.length;n++){
  i++;if(i>=order.length){i=0;round++;}
  if(round>(r.totalRounds||1)){if(r.gameMode==='spyfall')toVoting(r);else toFinalGuess(r);return;}
  if(r.players?.[order[i]]){r.currentTurnIndex=i;r.currentRound=round;return;}
 }
 if(r.gameMode==='spyfall')toVoting(r);else toFinalGuess(r);
}
function removeCorrectWhoPlayer(r,id){
 if(r.gameMode!=='whoami_rounds'||r.status!=='playing')return;
 const order=Array.isArray(r.turnOrder)?r.turnOrder:[],removedAt=order.indexOf(id);
 if(removedAt<0)return;
 const currentIndex=Math.max(0,Math.min(Number(r.currentTurnIndex)||0,order.length-1));
 const currentId=order[currentIndex],nextOrder=order.filter(playerId=>playerId!==id);
 r.turnOrder=nextOrder;
 if(!nextOrder.length){r.currentTurnIndex=0;toFinalGuess(r);return;}
 if(currentId===id){
  if(removedAt>=nextOrder.length){
   r.currentTurnIndex=0;r.currentRound=(Number(r.currentRound)||1)+1;
   if(r.currentRound>(Number(r.totalRounds)||1))toFinalGuess(r);
  }else r.currentTurnIndex=removedAt;
 }else{
  const preservedIndex=nextOrder.indexOf(currentId);
  r.currentTurnIndex=preservedIndex>=0?preservedIndex:Math.min(currentIndex,nextOrder.length-1);
 }
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
   const pack=packFor(r);
   if(!supportsMode(pack,r.gameMode)){failMessage='หมวดคำนี้ไม่มีข้อมูลที่พร้อมเล่น กรุณาเลือกหมวดใหม่';return;}
   const roles={},attempts={};let group='',spy=null;
   if(r.gameMode==='spyfall'){
    const eligibleGroups=Object.entries(pack.groups||{}).filter(([,words])=>Array.isArray(words)&&new Set(words.filter(w=>typeof w==='string'&&w.trim())).size>=2);
    if(!eligibleGroups.length){failMessage='หมวดนี้ต้องมีกลุ่มที่มีคำไม่ซ้ำอย่างน้อย 2 คำ';return;}
    group=random(eligibleGroups.map(([name])=>name));
    const uniqueWords=[...new Set(pack.groups[group].filter(w=>typeof w==='string'&&w.trim()))];
    const [a,b]=shuffle(uniqueWords);
    spy=random(ids);
    ids.forEach(id=>roles[id]=id===spy?a:b);
   }else{
    const ws=shuffle(wordsOf(pack));
    if(!ws.length){failMessage='หมวดนี้ไม่มีคำสำหรับเล่น';return;}
    ids.forEach((id,i)=>{roles[id]=ws[i%ws.length];attempts[id]=1;});
   }
   r.status='playing';r.turnOrder=shuffle(ids);r.currentTurnIndex=0;r.currentRound=1;
   r.totalRounds=r.settingValue||2;r.roles=roles;r.spyId=spy;r.currentGroup=group;
   r.attempts=attempts;r.guessedCorrectly={};r.correctOrder=[];r.guessDetails={};
   r.votes={};r.voteHistory={};r.voteRound=0;r.voteDeadline=null;r.tieCandidates=null;r.result=null;
   r.finalDeadline=null;r.playDeadline=r.gameMode==='whoami_time'?serverNow()+(r.settingValue||3)*60000:null;
   r.gamesPlayed=(r.gamesPlayed||0)+1;r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
  if(res.committed){chosenGuess='';chosenVote='';chosenWord='';$('guessInput').value='';toast('เริ่มเกมแล้ว!','success');}
  else toast(failMessage,'error');
 }catch(e){error(e);}
 finally{$('startBtn').disabled=false;}
};
async function endMyTurn(mode){if(!roomId)return;try{await getRef().transaction(r=>{if(!r||r.status!=='playing'||r.gameMode!==mode||r.turnOrder?.[r.currentTurnIndex||0]!==myId)return;advanceRound(r);r.lastActivityAt=TIMESTAMP();return r;},undefined,false);}catch(e){error(e);}}
$('spyDoneBtn').onclick=()=>endMyTurn('spyfall');$('whoDoneBtn').onclick=()=>endMyTurn('whoami_rounds');
$('skipSpyBtn').onclick=async()=>{if(!isHost||!await confirmBox('ข้ามไปโหวต?','เริ่มจับเวลาโหวต 2 นาทีทันที','เริ่มโหวต'))return;try{await getRef().transaction(r=>{if(!r||r.hostId!==myId||r.gameMode!=='spyfall'||r.status!=='playing')return;toVoting(r);r.lastActivityAt=TIMESTAMP();return r;},undefined,false);}catch(e){error(e);}};
$('skipWhoBtn').onclick=async()=>{if(!isHost||!await confirmBox('ข้ามช่วงถาม?','คนที่ยังไม่ได้ตอบจะมีเวลาอีก 2 นาที','เริ่มช่วงตอบ'))return;try{await getRef().transaction(r=>{if(!r||r.hostId!==myId||r.gameMode==='spyfall'||r.status!=='playing')return;toFinalGuess(r);r.lastActivityAt=TIMESTAMP();return r;},undefined,false);}catch(e){error(e);}};

// ===== Who Am I answer and scoring =====
$('guessInput').addEventListener('input',()=>{chosenGuess='';$('guessSelected').textContent='ยังไม่ได้เลือกคำตอบ';const box=$('guessSuggestions');box.replaceChildren();const q=norm($('guessInput').value),r=roomState;if(!q||!r||r.gameMode==='spyfall'){box.hidden=true;return;}wordsOf(packFor(r)).filter(w=>norm(w).includes(q)).slice(0,15).forEach(w=>{const b=document.createElement('button');b.textContent=w;b.onclick=()=>{chosenGuess=w;$('guessInput').value=w;$('guessSelected').textContent=`✓ เลือก ${w}`;box.hidden=true;};box.append(b);});box.hidden=!box.children.length;});
$('guessBtn').onclick=async()=>{if(!roomId||!roomState||roomState.gameMode==='spyfall')return;const option=wordsOf(packFor(roomState)).find(w=>norm(w)===norm(chosenGuess||$('guessInput').value));if(!option){toast('เลือกคำตอบจากหมวดที่กำหนดก่อน','error');return;}if(!await confirmBox('ยืนยันคำตอบ?',`ตอบ “${option}” ได้เพียงครั้งเดียว`,'ส่งคำตอบ'))return;$('guessBtn').disabled=true;try{const res=await getRef().transaction(r=>{if(!r||!['playing','final_guess'].includes(r.status)||r.gameMode==='spyfall'||!r.players?.[myId]||r.attempts?.[myId]!==1)return;if(r.status==='final_guess'&&serverNow()>=r.finalDeadline)return;if(r.status==='playing'&&r.gameMode==='whoami_time'&&serverNow()>=r.playDeadline)return;const correct=norm(option)===norm(r.roles?.[myId]);r.attempts[myId]=0;r.guessedCorrectly||={};r.guessedCorrectly[myId]=correct;const round=r.status==='final_guess'?(r.totalRounds||1):(r.currentRound||1);let points=0;if(correct){r.correctOrder||=[];points=r.gameMode==='whoami_time'?Math.max(1,Object.keys(r.players).length-r.correctOrder.length):Math.max(1,(r.totalRounds||1)-round+1);r.correctOrder.push(myId);r.scores||={};r.scores[myId]=(r.scores[myId]||0)+points;}if(correct&&r.gameMode==='whoami_rounds')removeCorrectWhoPlayer(r,myId);r.guessDetails||={};r.guessDetails[myId]={correct,points,round,answer:option,correctAnswer:r.roles?.[myId]||''};if(Object.keys(r.players).every(id=>r.attempts?.[id]===0))r.status='results';r.lastActivityAt=TIMESTAMP();return r;},undefined,false);if(!res.committed){toast('หมดเวลาหรือคุณส่งคำตอบไปแล้ว','error');return;}const info=res.snapshot.val(),d=info?.guessDetails?.[myId];toast(d?.correct?`🎉 ถูกต้อง +${d.points} คะแนน`:`ตอบผิด! คำที่ถูกคือ ${info?.roles?.[myId]||'—'}`,d?.correct?'success':'error');}catch(e){error(e);}finally{$('guessBtn').disabled=false;}};

// ===== Spyfall voting =====
$('voteWord').onchange=e=>chosenWord=e.target.value;
$('voteSubmitBtn').onclick=async()=>{if(!roomId||!roomState||!chosenVote)return;const target=chosenVote,word=$('voteWord').value;$('voteSubmitBtn').disabled=true;try{const res=await getRef().transaction(r=>{const allowed=r?.tieCandidates||Object.keys(r?.players||{});if(!r||r.status!=='voting'||serverNow()>=r.voteDeadline||!r.players?.[myId]||!r.players?.[target]||target===myId||!allowed.includes(target)||r.votes?.[myId])return;if(word&&!new Set(packFor(r).groups?.[r.currentGroup]||[]).has(word))return;r.votes||={};r.votes[myId]={targetId:target,guessWord:word};r.lastActivityAt=TIMESTAMP();return r;},undefined,false);if(res.committed)toast('ส่งโหวตและคำทายแล้ว','success');else toast('โหวตไม่ได้ หรือหมดเวลาแล้ว','error');}catch(e){error(e);}finally{$('voteSubmitBtn').disabled=false;}};
function resolveVotes(r){
 const ids=Object.keys(r.players||{}),ballots=copyPack(r.votes||{}),roundNo=Number(r.voteRound)||1;
 r.voteHistory||={};r.voteHistory[`round_${roundNo}`]=ballots;
 const counts={};
 for(const [id,v] of Object.entries(ballots))if(r.players?.[id]&&r.players?.[v.targetId])counts[v.targetId]=(counts[v.targetId]||0)+1;
 const high=Math.max(0,...Object.values(counts)),top=Object.keys(counts).filter(id=>counts[id]===high);
 if(top.length>1&&roundNo===1){r.tieCandidates=top;r.voteRound=2;r.votes={};r.voteDeadline=serverNow()+FINAL_MS;return;}
 const tied=top.length!==1,pickedId=tied?null:top[0],caught=!tied&&pickedId===r.spyId,awards={};
 ids.forEach(id=>{
  const b=ballots[id]||{},spy=id===r.spyId;
  const guessed=!!b.guessWord&&!!r.roles?.[b.targetId]&&norm(b.guessWord)===norm(r.roles[b.targetId]);
  const base=spy?(caught?0:2):(caught?1:0),bonus=guessed&&(spy||b.targetId===r.spyId)?1:0;
  awards[id]={base,bonus,total:base+bonus};r.scores||={};r.scores[id]=(r.scores[id]||0)+base+bonus;
 });
 r.result={pickedId,caught,tied,awards,votesByRound:copyPack(r.voteHistory),voteCounts:counts,groupLabel:groupLabel(packFor(r),r.currentGroup)};
 r.status='results';r.voteDeadline=null;
}

// ===== Automatic timer transitions: any connected player can trigger them =====
async function runAutomatic(){if(autoBusy||!roomId||!roomState||leaving)return;const r=roomState,ids=Object.keys(r.players||{}),allAnswered=ids.length>0&&ids.every(id=>r.attempts?.[id]===0),allVoted=ids.length>0&&ids.every(id=>!!r.votes?.[id]);const need=(r.status==='playing'&&r.gameMode==='whoami_time'&&(serverNow()>=r.playDeadline||allAnswered))||(r.status==='playing'&&r.gameMode!=='whoami_time'&&!r.players?.[r.turnOrder?.[r.currentTurnIndex||0]])||(r.status==='final_guess'&&(serverNow()>=r.finalDeadline||allAnswered))||(r.status==='voting'&&(serverNow()>=r.voteDeadline||allVoted));if(!need)return;autoBusy=true;try{await getRef().transaction(x=>{if(!x)return;const pids=Object.keys(x.players||{}),done=pids.length>0&&pids.every(id=>x.attempts?.[id]===0);if(x.status==='playing'&&x.gameMode==='whoami_time'&&(done||serverNow()>=x.playDeadline)){if(done)x.status='results';else toFinalGuess(x);return x;}if(x.status==='playing'&&x.gameMode!=='whoami_time'&&!x.players?.[x.turnOrder?.[x.currentTurnIndex||0]]){advanceRound(x);return x;}if(x.status==='final_guess'&&(done||serverNow()>=x.finalDeadline)){x.status='results';return x;}if(x.status==='voting'&&(serverNow()>=x.voteDeadline||(pids.length&&pids.every(id=>x.votes?.[id])))){resolveVotes(x);return x;}},undefined,false);}catch(e){error(e);}finally{autoBusy=false;}}
setInterval(()=>{if(!roomId||!roomState)return;const r=roomState;if(r.status==='voting')$('voteTimer').textContent=formatLeft(r.voteDeadline);if(r.status==='final_guess')$('whoTimer').textContent=formatLeft(r.finalDeadline);if(r.status==='playing'&&r.gameMode==='whoami_time')$('whoTimer').textContent=formatLeft(r.playDeadline);runAutomatic();},1000);

// ===== Summary and return to lobby =====
$('nextGameBtn').onclick=async()=>{if(!isHost||!roomId||!await confirmBox('กลับล็อบบี้?','ทุกคนจะกลับไปรอเริ่มเกมรอบใหม่ และคะแนนสะสมยังอยู่','กลับล็อบบี้'))return;try{const res=await getRef().transaction(r=>{if(!r||r.hostId!==myId||r.status!=='results')return;r.status='lobby';r.roles=null;r.spyId=null;r.currentGroup=null;r.turnOrder=[];r.currentRound=1;r.currentTurnIndex=0;r.attempts={};r.guessedCorrectly={};r.guessDetails={};r.correctOrder=[];r.playDeadline=null;r.finalDeadline=null;r.voteDeadline=null;r.votes={};r.voteHistory={};r.voteRound=0;r.tieCandidates=null;r.result=null;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);if(res.committed){chosenGuess='';chosenWord='';chosenVote='';$('guessInput').value='';toast('กลับล็อบบี้แล้ว','success');}}catch(e){error(e);}};

// Restore remembered room only after the player confirms the prefilled name.
if(roomId){$('roomCode').textContent=roomId;$('roomTitle').textContent=`ห้อง ${roomId}`;$('leaveBtn').hidden=false;showOnly('homeView');}else showOnly('homeView');