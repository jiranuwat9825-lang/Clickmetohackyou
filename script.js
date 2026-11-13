
// Party Game Hub V6 — complete standalone file
const firebaseConfig = {
    apiKey: "AIzaSyC3IuOtFTc200JcUmpVe1GEv13nCj1EM8",
    authDomain: "xo-game-e5fdd.firebaseapp.com",
    databaseURL: "https://xo-game-e5fdd-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "xo-game-e5fdd",
    storageBucket: "xo-game-e5fdd.appspot.com",
    messagingSenderId: "890496938682",
    appId: "1:890496938682:web:c99edd29e639415ac4883",
    measurementId: "G-4RHMNWP5ZJ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const builtinCategories = {
    "rov": {
        name: "ROV",
        groups: {
            "แครี่ (Carry Lane)": ["Valhein", "Yorn", "Violet", "Capheny", "Hayate", "Elsu", "Laville", "Thorne", "Tel'Annas", "Eland'orr", "Fennik", "Slimz", "Moren", "Wisp", "Lindis", "Teeri", "Celica", "Erin", "Stuart"],
            "เลนกลาง (Mid Lane)": ["Krixi", "Tulen", "Liliana", "Raz", "Lauriel", "Natalya", "Veera", "Ilumia", "Kahlii", "Mganga", "Preyta", "Jinnar", "Aleister", "Diao Chan", "Zata", "Iggy", "Dirak", "Lorion", "Bonnie", "Yue", "Dyadia", "Heino", "Evita", "Gildur", "Azzen'Ka", "Ishar"],
            "ออฟเลน (Dark Slayer Lane)": ["Florentino", "Yena", "Ryoma", "Maloch", "Lu Bu", "Allain", "Veres", "Omen", "Airi", "Amily", "Edras", "Astrid", "Skud", "Taara", "Qi", "Richter", "Rourke", "Zuka", "Tachi", "Dextra", "Biron", "Bijan", "Yan", "Wonder Woman", "Arduin", "Mortos", "Max", "Errol", "Volkath", "Ata"],
            "ป่า (Jungle / Assassin)": ["Nakroth", "Murad", "Butterfly", "Aoi", "Keera", "Zill", "Kriknak", "Quillen", "Enzo", "Sinestrea", "Wukong", "Paine", "Bright", "Kaine", "Zanis", "Zephys"],
            "โรมมิ่ง / ซัพพอร์ต (Roaming)": ["Grakk", "Alice", "Thane", "Toro", "Zip", "Aya", "Arum", "Cresht", "Baldum", "Mina", "Omega", "Annette", "Helen", "Krizzix", "Rouie", "Lumburr", "Ming", "Dolia", "TeeMee", "Chaugnar", "Sephera", "Xeniel", "Ormarr", "Wiro", "Roxie"]
        }
    },
    "valorant": {
        name: "Valorant",
        groups: {
            "Duelist": ["Hush", "Iso", "Jett", "Neon", "Phoenix", "Raze", "Reyna", "Waylay", "Yoru"],
            "Controller": ["Astra", "Brimstone", "Clove", "Harbor", "Miks", "Omen", "Viper"],
            "Initiator": ["Breach", "Fade", "Gekko", "KAY/O", "Skye", "Sova", "Tejo"],
            "Sentinel": ["Chamber", "Cypher", "Deadlock", "Killjoy", "Sage", "Veto", "Vyse"]
        }
    },
    "general_items": {
        name: "สิ่งของทั่วไป",
        groups: {
            "เครื่องใช้ไฟฟ้าและไอที": ["โทรศัพท์", "คอมพิวเตอร์", "ทีวี", "ตู้เย็น", "พัดลม", "ไมโครเวฟ", "แอร์", "หูฟัง", "เมาส์", "คีย์บอร์ด", "พาวเวอร์แบงค์", "กล้อง", "เครื่องซักผ้า", "เตาอบ", "ลำโพง", "เครื่องดูดฝุ่น"],
            "ของใช้ในบ้านและห้องน้ำ": ["ไม้กวาด", "ถังขยะ", "กระจก", "หมอน", "ผ้าห่ม", "ไม้แขวนเสื้อ", "แชมพู", "สบู่", "ยาสีฟัน", "แปรงสีฟัน", "ผ้าเช็ดตัว", "ขันน้ำ", "กรรไกรตัดเล็บ", "ไดร์เป่าผม", "หวี", "กระดาษทิชชู่"],
            "เครื่องเขียนและอุปกรณ์": ["ปากกา", "ดินสอ", "ยางลบ", "ไม้บรรทัด", "สมุด", "กรรไกร", "กาว", "สีเทียน", "สีน้ำ", "ดินน้ำมัน", "กระดาษ A4", "แฟ้มเอกสาร", "เทปใส", "คัตเตอร์", "พู่กัน", "สมุดโน้ต"],
            "เครื่องครัวและภาชนะ": ["จาน", "ชาม", "ช้อน", "ส้อม", "แก้วน้ำ", "หม้อ", "กระทะ", "มีด", "เขียง", "ตะหลิว", "ทัพพี", "กาน้ำร้อน", "กล่องข้าว", "ขวดน้ำ", "ตะเกียบ", "เครื่องปั่น"],
            "เสื้อผ้าและเครื่องแต่งกาย": ["เสื้อยืด", "เสื้อเชิ้ต", "เสื้อกันหนาว", "เสื้อฮู้ด", "กางเกงยีนส์", "กางเกงขาสั้น", "กระโปรง", "ชุดนอน", "ชุดว่ายน้ำ", "รองเท้าผ้าใบ", "รองเท้าแตะ", "รองเท้าบูท", "ถุงเท้า", "หมวก", "แว่นกันแดด", "นาฬิกาข้อมือ", "เข็มขัด", "กระเป๋าสะพาย", "กระเป๋าเป้", "ผ้าพันคอ", "ถุงมือ", "เสื้อสูท", "เสื้อโปโล", "เสื้อกันฝน"],
            "อาหารและเครื่องดื่ม": ["ข้าวผัด", "ข้าวมันไก่", "ก๋วยเตี๋ยว", "ต้มยำกุ้ง", "ส้มตำ", "ผัดไทย", "พิซซ่า", "แฮมเบอร์เกอร์", "เฟรนช์ฟรายส์", "ไอศกรีม", "เค้ก", "โดนัท", "คุกกี้", "ขนมปัง", "ข้าวเหนียวมะม่วง", "ชาเย็น", "กาแฟ", "นม", "น้ำผลไม้", "น้ำอัดลม", "บะหมี่กึ่งสำเร็จรูป", "ซูชิ", "แพนเค้ก", "วาฟเฟิล", "น้ำผึ้ง", "ช็อกโกแลต", "ขนมครก", "ลูกอม", "ป๊อปคอร์น", "โยเกิร์ต"],
            "ยานพาหนะและการเดินทาง": ["รถยนต์", "รถจักรยานยนต์", "จักรยาน", "รถบัส", "รถตู้", "รถไฟ", "รถไฟฟ้า", "แท็กซี่", "รถตุ๊กตุ๊ก", "เครื่องบิน", "เฮลิคอปเตอร์", "เรือ", "เรือดำน้ำ", "สเก็ตบอร์ด", "สกูตเตอร์", "รถบรรทุก", "รถพยาบาล", "รถดับเพลิง", "แผนที่", "กระเป๋าเดินทาง", "พาสปอร์ต", "ตั๋วรถ", "เข็มทิศ", "หมวกกันน็อก"],
            "กีฬาและงานอดิเรก": ["ลูกฟุตบอล", "ลูกบาสเกตบอล", "ลูกแบดมินตัน", "ไม้เทนนิส", "ลูกวอลเลย์บอล", "เชือกกระโดด", "ดัมเบล", "เสื่อโยคะ", "จักรยานออกกำลังกาย", "กีตาร์", "เปียโน", "กลอง", "ไวโอลิน", "ไมโครโฟน", "บอร์ดเกม", "ไพ่", "ตัวต่อเลโก้", "จิ๊กซอว์", "ตุ๊กตา", "รถบังคับ", "หนังสือ", "การ์ตูน", "ลูกข่าง", "เกมคอนโซล", "ว่าว", "เบ็ดตกปลา"],
            "สัตว์และธรรมชาติ": ["แมว", "สุนัข", "กระต่าย", "นกแก้ว", "ปลาทอง", "เต่า", "กบ", "ช้าง", "ม้า", "สิงโต", "เสือ", "ยีราฟ", "ลิง", "งู", "ผีเสื้อ", "ผึ้ง", "มด", "แมงมุม", "ต้นไม้", "ดอกกุหลาบ", "ดอกทานตะวัน", "กระบองเพชร", "ภูเขา", "น้ำตก", "ทะเล", "แม่น้ำ", "เมฆ", "สายรุ้ง", "ดวงอาทิตย์", "ดวงจันทร์"],
            "อุปกรณ์และสิ่งของรอบตัว": ["ร่ม", "กุญแจ", "แม่กุญแจ", "ไฟฉาย", "นาฬิกาปลุก", "เทียน", "ไฟแช็ก", "ถ่านไฟฉาย", "เชือก", "กล่องพัสดุ", "ถุงพลาสติก", "ถุงผ้า", "ตะกร้า", "กล่องเครื่องมือ", "ค้อน", "ไขควง", "ตลับเมตร", "บันได", "ไม้ถูพื้น", "สายชาร์จ", "ปลั๊กพ่วง", "รีโมต", "แบตเตอรี่", "เครื่องคิดเลข", "เครื่องพิมพ์", "สติกเกอร์", "ป้ายชื่อ", "พวงกุญแจ", "กระปุกออมสิน", "หน้ากากอนามัย"]
        }
    }
};

// ===== Core state =====
const $ = id => document.getElementById(id);
const MODES = ['spyfall','whoami_time','whoami_rounds'];
const CATEGORIES_KEY = 'party_game_categories_v3';
const IDLE_MS = 10 * 60_000;
const FINAL_MS = 2 * 60_000;
const TIMESTAMP = () => firebase.database.ServerValue.TIMESTAMP;
const serverNow = () => Date.now() + serverOffset;
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modeTitle = m => ({spyfall:'Spyfall',whoami_time:'Who Am I · จับเวลา',whoami_rounds:'Who Am I · นับรอบ'}[m] || 'Spyfall');
const random = array => array[Math.floor(Math.random() * array.length)];
const shuffle = input => { const a = [...input]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; };
const getRef = () => db.ref(`rooms/${roomId}`);
const copyPack = v => JSON.parse(JSON.stringify(v));
const wordsOf = pack => [...new Set(Object.values(pack?.groups || {}).flat().filter(x=>typeof x==='string' && x.trim()))];
const normalize = s => String(s ?? '').trim().toLocaleLowerCase();
let serverOffset = 0, roomId = sessionStorage.getItem('pg_room_v6') || '', roomState = null;
let myId = sessionStorage.getItem('pg_tab_id') || `u_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
let myName = localStorage.getItem('rov_spy_myname') || '';
let selectedMode = '', selectedCategory = '', chosenVote = '', chosenGuess = '', chosenWord = '';
let isHost = false, subscribedRef = null, roomCallback = null, leaving = false;
let sweepBusy = false, autoBusy = false, reconnectBusy = false, lastTouch = 0;
let managerReturn = 'homeView', editKey = null, editNew = false, editDraft = null;
sessionStorage.setItem('pg_tab_id', myId);
$('nameInput').value = myName;
$('nameInput').addEventListener('input', () => { myName = $('nameInput').value.trim(); localStorage.setItem('rov_spy_myname',myName); });
db.ref('.info/serverTimeOffset').on('value',s => { serverOffset = Number(s.val()) || 0; });

function defaultCategories(){const c=copyPack(builtinCategories);Object.values(c).forEach(x=>x.enabledModes=[...MODES]);return c;}
function loadCategories(){
  try{const data=JSON.parse(localStorage.getItem(CATEGORIES_KEY));
    if(data && typeof data==='object' && !Array.isArray(data) && Object.keys(data).length<=100)
      return Object.fromEntries(Object.entries(data).filter(([key,v])=>/^[\w-]{1,50}$/.test(key)&&v&&typeof v.name==='string'&&v.groups&&Array.isArray(v.enabledModes)));
  }catch(e){console.warn('Category load',e);}return defaultCategories();
}
let library=loadCategories();
const saveCategories=()=>localStorage.setItem(CATEGORIES_KEY,JSON.stringify(library));
const packFor = room => room?.categoryPack || library[room?.category] || builtinCategories[room?.category] || builtinCategories.rov;
const enabledFor = pack => Array.isArray(pack?.enabledModes)?pack.enabledModes:MODES;
function showOnly(view){['homeView','createView','managerView','roomView'].forEach(id=>$(id).hidden=id!==view);}
function showScreen(screen){['lobbyScreen','spyScreen','whoScreen','voteScreen','resultsScreen'].forEach(id=>$(id).hidden=id!==screen);}
function toast(message,type='info'){const el=document.createElement('div');el.className=`toast ${type}`;el.textContent=message;$('toasts').prepend(el);setTimeout(()=>el.remove(),3800);}
function error(err){console.error(err);toast(err?.code==='PERMISSION_DENIED'?'Firebase ปฏิเสธสิทธิ์ กรุณาตรวจสอบ Rules':'เชื่อมต่อไม่ได้ กรุณาลองอีกครั้ง','error');}
let confirmResolver=null;
function confirmBox(title,message,yes='ยืนยัน'){
  if(confirmResolver)confirmResolver(false);
  $('dialogTitle').textContent=title;$('dialogMessage').textContent=message;$('dialogYes').textContent=yes;
  $('dialog').hidden=false;$('dialogCancel').focus();
  return new Promise(resolve=>confirmResolver=resolve);
}
function dismissConfirm(ok){if(!confirmResolver)return;const resolve=confirmResolver;confirmResolver=null;$('dialog').hidden=true;resolve(ok);}
$('dialogCancel').onclick=()=>dismissConfirm(false);
$('dialogYes').onclick=()=>dismissConfirm(true);
$('dialog').onclick=e=>{if(e.target===$('dialog'))dismissConfirm(false);};
document.addEventListener('keydown',e=>{if(e.key==='Escape')dismissConfirm(false);});
function ensureName(){if(!$('nameInput').value.trim()){toast('กรุณาใส่ชื่อเล่นก่อน','error');$('nameInput').focus();return false;}myName=$('nameInput').value.trim();localStorage.setItem('rov_spy_myname',myName);return true;}
function formatLeft(ts){const sec=Math.max(0,Math.ceil((Number(ts||0)-serverNow())/1000));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
function inactive(room){const last=room?.lastActivityAt??room?.createdAt;return typeof last==='number'&&serverNow()-last>=IDLE_MS;}

// ===== Room list and idle cleanup (requires at least one open browser) =====
db.ref('rooms').on('value',snap=>renderRoomList(snap.val()||{}),error);
function renderRoomList(rooms){
  const list=$('roomList');list.replaceChildren();
  const entries=Object.entries(rooms).filter(([,r])=>r&&!inactive(r));
  if(!entries.length){list.innerHTML='<p class="muted">ยังไม่มีห้อง ลองสร้างห้องใหม่เลย ✨</p>';return;}
  entries.sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0));
  entries.forEach(([id,r])=>{
    const row=document.createElement('div');row.className='room-entry';
    const info=document.createElement('div');const title=document.createElement('strong');title.textContent=`🏠 ${id}`;
    const sub=document.createElement('p');sub.textContent=`${modeTitle(r.gameMode)} · ${Object.keys(r.players||{}).length} คน · ${r.status==='lobby'?'รอผู้เล่น':'กำลังเล่น'}`;
    info.append(title,sub);const btn=document.createElement('button');btn.className='btn soft small';btn.textContent=r.status==='lobby'?'เข้าร่วม':'กำลังเล่น';btn.disabled=r.status!=='lobby';
    btn.onclick=()=>{if(ensureName())joinRoom(id);};row.append(info,btn);list.append(row);
  });
}
async function removeInactive(id){
  await db.ref(`rooms/${id}`).transaction(r=>{if(r&&inactive(r))return null;},undefined,false);
}
async function sweep(){if(sweepBusy)return;sweepBusy=true;
  try{const snap=await db.ref('rooms').once('value');for(const [id,r] of Object.entries(snap.val()||{}))if(inactive(r))await removeInactive(id);}
  catch(e){console.warn('Idle sweep',e);}finally{sweepBusy=false;}
}
setTimeout(sweep,1300);setInterval(sweep,30_000);
function touch(){if(!roomId||leaving||serverNow()-lastTouch<45_000)return;lastTouch=serverNow();getRef().child('lastActivityAt').set(TIMESTAMP()).catch(error);}
$('roomView').addEventListener('pointerdown',touch);
$('roomView').addEventListener('keydown',touch);

// ===== Setup flow =====
$('openCreateBtn').onclick=()=>{if(!ensureName())return;selectedMode='';selectedCategory='';$('durationInput').value=2;$('createDetails').hidden=true;renderModeChoices();showOnly('createView');};
$('createBackBtn').onclick=()=>showOnly('homeView');
function renderModeChoices(){document.querySelectorAll('[data-mode]').forEach(btn=>{btn.classList.toggle('selected',btn.dataset.mode===selectedMode);btn.setAttribute('aria-pressed',String(btn.dataset.mode===selectedMode));});renderCategoryChoices();}
$('modeOptions').onclick=e=>{const btn=e.target.closest('[data-mode]');if(!btn)return;selectedMode=btn.dataset.mode;selectedCategory='';$('durationInput').value=selectedMode==='whoami_time'?3:2;$('createDetails').hidden=false;
  $('durationLabel').textContent=selectedMode==='whoami_time'?'เวลาเล่น (นาที)':'จำนวนรอบพูด';
  $('durationHelp').textContent=selectedMode==='whoami_time'?'ครบเวลาจะมีช่วงทายสุดท้าย 2 นาที':'ครบเทิร์นสุดท้ายจะมีช่วงตอบ 2 นาที';renderModeChoices();
};
function renderCategoryChoices(){const target=$('categoryOptions');target.replaceChildren();
  const entries=Object.entries(library).filter(([,c])=>enabledFor(c).includes(selectedMode));
  if(!entries.some(([id])=>id===selectedCategory))selectedCategory='';
  entries.forEach(([key,c])=>{const btn=document.createElement('button');btn.className=`choice ${selectedCategory===key?'selected':''}`;btn.type='button';btn.innerHTML=`<strong>${escapeHTML(c.name)}</strong><small>${wordsOf(c).length} คำ</small>`;btn.onclick=()=>{selectedCategory=key;renderCategoryChoices();};target.append(btn);});
  if(!entries.length)target.innerHTML='<p class="muted">ไม่มีหมวดที่เปิดให้ใช้กับโหมดนี้</p>';
  $('createConfirmBtn').disabled=!selectedMode||!selectedCategory;
}
$('minusBtn').onclick=()=>{$('durationInput').value=Math.max(1,Number($('durationInput').value||2)-1);};
$('plusBtn').onclick=()=>{$('durationInput').value=Math.min(99,Number($('durationInput').value||2)+1);};

// ===== Category editor (local to this browser) =====
$('openManagerBtn').onclick=()=>openManager('homeView');
$('manageInCreateBtn').onclick=()=>openManager('createView');
$('managerBackBtn').onclick=()=>{showOnly(managerReturn);if(managerReturn==='createView')renderCategoryChoices();};
function openManager(from){managerReturn=from;showOnly('managerView');if(!editDraft&&Object.keys(library).length)chooseCategory(Object.keys(library)[0]);renderManager();}
function chooseCategory(key){if(!library[key])return;editKey=key;editNew=false;const p=copyPack(library[key]);editDraft={name:p.name,enabledModes:[...enabledFor(p)],groups:Object.entries(p.groups).map(([name,words])=>({name,words:[...words]}))};renderManager();}
function renderManager(){const target=$('managerList');target.replaceChildren();
  Object.entries(library).forEach(([key,c])=>{const b=document.createElement('button');b.className=`manager-item ${!editNew&&key===editKey?'selected':''}`;b.textContent=c.name;const s=document.createElement('small');s.textContent=`${wordsOf(c).length} คำ`;b.append(s);b.onclick=()=>chooseCategory(key);target.append(b);});
  $('managerEditor').hidden=!editDraft;$('managerEmpty').hidden=!!editDraft;if(!editDraft)return;
  $('editCategoryName').value=editDraft.name;
  document.querySelectorAll('#enabledModes input').forEach(c=>c.checked=editDraft.enabledModes.includes(c.value));
  $('deleteCategoryBtn').disabled=editNew;renderGroups();
}
$('editCategoryName').oninput=()=>{if(editDraft)editDraft.name=$('editCategoryName').value;};
$('enabledModes').onchange=()=>{if(editDraft)editDraft.enabledModes=[...document.querySelectorAll('#enabledModes input:checked')].map(x=>x.value);};
function parseWords(text){return [...new Set(String(text).split(/[\n,，]+/).map(w=>w.trim()).filter(Boolean))];}
function renderGroups(){const target=$('groupEditors');target.replaceChildren();editDraft.groups.forEach((g,index)=>{
  const box=document.createElement('div');box.className='group-edit';const head=document.createElement('div');head.className='head';
  const name=document.createElement('input');name.value=g.name;name.placeholder='ชื่อกลุ่ม';name.maxLength=45;name.oninput=()=>g.name=name.value;
  const del=document.createElement('button');del.className='btn danger small';del.textContent='ลบ';del.onclick=()=>{editDraft.groups.splice(index,1);renderGroups();};head.append(name,del);
  const input=document.createElement('textarea');input.value=g.words.join('\n');input.placeholder='พิมพ์คำละ 1 บรรทัด';const count=document.createElement('small');count.textContent=`${g.words.length} คำ`;
  input.oninput=()=>{g.words=parseWords(input.value);count.textContent=`${g.words.length} คำ`;};box.append(head,input,count);target.append(box);
});}
$('newCategoryBtn').onclick=()=>{editKey=null;editNew=true;editDraft={name:'',enabledModes:[...MODES],groups:[{name:'กลุ่มแรก',words:[]}]};renderManager();$('editCategoryName').focus();};
$('addGroupBtn').onclick=()=>{if(!editDraft)return;if(editDraft.groups.length>=20){toast('สูงสุด 20 กลุ่มต่อหมวด','error');return;}editDraft.groups.push({name:`กลุ่ม ${editDraft.groups.length+1}`,words:[]});renderGroups();};
$('saveCategoryBtn').onclick=()=>{if(!editDraft)return;const name=editDraft.name.trim();if(name.length<2||name.length>40){toast('ชื่อหมวดต้องยาว 2–40 ตัว','error');return;}
  if(!editDraft.enabledModes.length){toast('เลือกโหมดเกมอย่างน้อย 1 โหมด','error');return;}const groups={};
  for(const g of editDraft.groups){const n=g.name.trim();if(!n||groups[n]||g.words.length>150||g.words.some(w=>w.length>60)){toast('ตรวจสอบชื่อกลุ่ม คำซ้ำ หรือจำนวนคำ','error');return;}if(g.words.length)groups[n]=[...new Set(g.words)];}
  if(!Object.keys(groups).length){toast('เพิ่มคำอย่างน้อยหนึ่งคำ','error');return;}if(editDraft.enabledModes.includes('spyfall')&&!Object.values(groups).some(g=>g.length>=2)){toast('Spyfall ต้องมีกลุ่มที่มีอย่างน้อยสองคำ','error');return;}
  if(editNew&&Object.keys(library).length>=100){toast('สูงสุด 100 หมวด','error');return;}
  const key=editNew?`custom_${Date.now().toString(36)}`:editKey;library[key]={name,groups,enabledModes:[...editDraft.enabledModes]};
  try{saveCategories();chooseCategory(key);renderCategoryChoices();toast('บันทึกหมวดแล้ว','success');}catch(e){error(e);}
};
$('deleteCategoryBtn').onclick=async()=>{if(!editKey||!await confirmBox('ลบหมวดนี้?',`ลบ ${library[editKey].name} ในเบราว์เซอร์นี้`,'ลบ'))return;
  delete library[editKey];saveCategories();editDraft=null;editKey=null;const first=Object.keys(library)[0];if(first)chooseCategory(first);else renderManager();renderCategoryChoices();toast('ลบหมวดแล้ว','success');
};
$('resetCategoriesBtn').onclick=async()=>{if(!await confirmBox('คืนค่าหมวดเริ่มต้น?', 'หมวดที่แก้เองในเบราว์เซอร์นี้จะถูกแทนที่ทั้งหมด','คืนค่า'))return;
  library=defaultCategories();saveCategories();chooseCategory(Object.keys(library)[0]);renderCategoryChoices();toast('คืนค่าหมวดแล้ว','success');
};

// ===== Room creation, join, reconnection =====
$('createConfirmBtn').onclick=async()=>{
  if(!ensureName())return;const name=$('roomNameInput').value.trim(), n=Number($('durationInput').value), pack=library[selectedCategory];
  if(!/^[\p{L}\p{N}_-]{1,20}$/u.test(name)){toast('ชื่อห้องใช้ตัวอักษร ตัวเลข - _ 1–20 ตัว','error');return;}
  if(!selectedMode||!pack||!enabledFor(pack).includes(selectedMode)){toast('เลือกโหมดและหมวดคำก่อน','error');return;}
  if(!Number.isInteger(n)||n<1||n>99){toast('จำนวนรอบ/นาทีต้องอยู่ระหว่าง 1–99','error');return;}
  if(selectedMode==='spyfall'&&!Object.values(pack.groups).some(g=>new Set(g).size>=2)){toast('หมวดนี้ยังไม่มีคำพอสำหรับ Spyfall','error');return;}
  if(!wordsOf(pack).length){toast('หมวดไม่มีคำ','error');return;}
  const ref=db.ref(`rooms/${name}`);$('createConfirmBtn').disabled=true;
  try{
    await ref.child(`players/${myId}`).onDisconnect().remove();
    const res=await ref.transaction(r=>{
      if(r)return;return {hostId:myId,gameMode:selectedMode,category:selectedCategory,categoryPack:copyPack(pack),settingValue:n,
      status:'lobby',players:{[myId]:{name:myName}},scores:{[myId]:0},createdAt:TIMESTAMP(),lastActivityAt:TIMESTAMP(),gamesPlayed:0};
    },undefined,false);
    if(!res.committed){await ref.child(`players/${myId}`).onDisconnect().cancel();toast('ชื่อห้องนี้ถูกใช้แล้ว','error');return;}
    enterRoom(name);toast('สร้างห้องเรียบร้อย!','success');
  }catch(e){error(e);}finally{$('createConfirmBtn').disabled=false;renderCategoryChoices();}
};
async function joinRoom(id){
  const ref=db.ref(`rooms/${id}`);
  try{await ref.child(`players/${myId}`).onDisconnect().remove();
    const result=await ref.transaction(r=>{
      if(!r||r.status!=='lobby'||inactive(r))return;
      r.players||={};r.players[myId]={name:myName};r.scores||={};r.scores[myId]??=0;
      r.lastActivityAt=TIMESTAMP();return r;
    },undefined,false);
    if(!result.committed){await ref.child(`players/${myId}`).onDisconnect().cancel();toast('ห้องนี้เข้าร่วมไม่ได้แล้ว','error');return;}
    enterRoom(id);toast('เข้าห้องแล้ว','success');
  }catch(e){error(e);}
}
function unsubscribe(){if(subscribedRef&&roomCallback)subscribedRef.off('value',roomCallback);subscribedRef=null;roomCallback=null;}
function goHome(message=''){
  unsubscribe();roomId='';roomState=null;isHost=false;leaving=false;sessionStorage.removeItem('pg_room_v6');$('leaveBtn').hidden=true;
  showOnly('homeView');if(message)toast(message);
}
function enterRoom(id){unsubscribe();roomId=id;leaving=false;lastTouch=serverNow();sessionStorage.setItem('pg_room_v6',id);
  $('roomTitle').textContent=`ห้อง ${id}`;$('roomCode').textContent=id;$('leaveBtn').hidden=false;showOnly('roomView');subscribe();
}
function subscribe(){if(!roomId)return;unsubscribe();const id=roomId;const ref=db.ref(`rooms/${id}`);
  const cb=snap=>{
    if(id!==roomId||leaving)return;const r=snap.val();
    if(!r){goHome('ห้องถูกปิดหรือหมดอายุแล้ว');return;}
    roomState=r;isHost=r.hostId===myId;
    const players=r.players||{};if(Object.keys(players).length&&!players[r.hostId]){
      ref.transaction(x=>{if(!x)return;const keys=Object.keys(x.players||{});if(keys.length&&!x.players[x.hostId]){x.hostId=keys[0];return x;}},undefined,false).catch(error);
    }
    renderRoom(r);runAutomatic();
  };subscribedRef=ref;roomCallback=cb;ref.on('value',cb,error);
}
async function reconnect(){if(!roomId||leaving||reconnectBusy)return;reconnectBusy=true;const id=roomId,ref=db.ref(`rooms/${id}`);
  try{const snap=await ref.once('value'),r=snap.val();if(id!==roomId)return;
    if(!r||inactive(r)){if(r)await removeInactive(id);goHome('ห้องเดิมหมดอายุแล้ว');return;}
    if(r.status!=='lobby'&&!r.roles?.[myId]){goHome('เกมเริ่มแล้ว ไม่สามารถเข้ากลางเกมได้');return;}
    await ref.child(`players/${myId}`).onDisconnect().remove();
    await ref.child(`players/${myId}`).set({name:myName||'ผู้เล่น'});
    if(!subscribedRef)subscribe();
  }catch(e){error(e);}finally{reconnectBusy=false;}
}
db.ref('.info/connected').on('value',s=>{if(s.val()===true&&roomId&&!leaving)reconnect();});
$('leaveBtn').onclick=async()=>{if(!roomId)return;if(!await confirmBox('ออกจากห้อง?', 'คุณจะออกจากเกมปัจจุบัน','ออกจากห้อง'))return;
  const ref=getRef();leaving=true;
  try{await ref.child(`players/${myId}`).onDisconnect().cancel();
    await ref.transaction(r=>{if(!r||!r.players?.[myId])return;delete r.players[myId];if(r.hostId===myId)r.hostId=Object.keys(r.players)[0]||null;r.lastActivityAt=TIMESTAMP();return r;},undefined,false);
    goHome('ออกจากห้องแล้ว');
  }catch(e){leaving=false;error(e);}
};
$('copyRoomBtn').onclick=async()=>{try{await navigator.clipboard.writeText(roomId);toast('คัดลอกรหัสห้องแล้ว','success');}catch{toast(`รหัสห้องคือ ${roomId}`);}};
async function closeRoom(){if(!isHost||!roomId)return;if(!await confirmBox('ปิดห้อง?', 'ผู้เล่นทุกคนจะออกและคะแนนถูกลบ','ปิดห้อง'))return;
  try{await getRef().remove();goHome('ปิดห้องแล้ว');}catch(e){error(e);}
}
$('deleteRoomBtn').onclick=closeRoom;$('closeAfterBtn').onclick=closeRoom;

// ===== Rendering =====
function renderRoom(r){const players=r.players||{},ids=Object.keys(players),status=r.status;
  $('roomTitle').textContent=`ห้อง ${roomId}`;$('roomCode').textContent=roomId;
  $('roomMeta').textContent=`${modeTitle(r.gameMode)} · ${packFor(r).name} · ${r.settingValue||2} ${r.gameMode==='whoami_time'?'นาที':'รอบ'}`;
  renderScores(r);showScreen(({lobby:'lobbyScreen',playing:r.gameMode==='spyfall'?'spyScreen':'whoScreen',final_guess:'whoScreen',voting:'voteScreen',results:'resultsScreen'})[status]||'lobbyScreen');
  if(status==='lobby'){
    $('hostLine').textContent=`👑 หัวหน้าห้อง: ${players[r.hostId]?.name||'กำลังโอนหัวหน้า'} · ${ids.length} คน`;
    $('playerList').replaceChildren();ids.forEach((id,i)=>{const el=document.createElement('div');el.className='player-row';
      el.innerHTML=`<span class="avatar">${i+1}</span><strong>${escapeHTML(players[id].name)}${id===myId?' (คุณ)':''}</strong>${id===r.hostId?'<span class="host-tag">👑 HOST</span>':''}`;
      $('playerList').append(el);
    });const min=r.gameMode==='spyfall'?3:2;$('startBtn').hidden=!isHost;$('startBtn').disabled=ids.length<min;
    $('startBtn').textContent=ids.length<min?`ต้องมีอย่างน้อย ${min} คน`:'▶ เริ่มเกม';$('deleteRoomBtn').hidden=!isHost;
    $('lobbyNotice').hidden=isHost;$('lobbyNotice').textContent=`รอ ${players[r.hostId]?.name||'Host'} เริ่มเกม…`;
  }else if(status==='playing'&&r.gameMode==='spyfall')renderSpy(r);
  else if(status==='playing'||status==='final_guess')renderWho(r);
  else if(status==='voting')renderVotes(r);
  else if(status==='results')renderResults(r);
}
function renderScores(r){const p=r.players||{},s=r.scores||{};$('scoreList').replaceChildren();
  Object.keys(p).sort((a,b)=>(s[b]||0)-(s[a]||0)).forEach((id,i)=>{const el=document.createElement('div');el.className='score-row';
    el.innerHTML=`<span>${['🥇','🥈','🥉'][i]||i+1} ${escapeHTML(p[id].name)}${id===myId?' (คุณ)':''}</span><b>${s[id]||0} pts</b>`;$('scoreList').append(el);
  });
}
function renderOrder(target,r){target.replaceChildren();(r.turnOrder||[]).forEach((id,i)=>{const chip=document.createElement('span');chip.className=`chip ${i===(r.currentTurnIndex||0)?'current':''}`;
  chip.textContent=`${i+1}. ${r.players?.[id]?.name||'ออกจากเกม'}${id===myId?' (คุณ)':''}`;target.append(chip);
});}
function renderSpy(r){const idx=r.currentTurnIndex||0,speaker=r.turnOrder?.[idx];
  $('mySpyWord').textContent=r.roles?.[myId]||'—';$('spyRound').textContent=`รอบ ${r.currentRound||1} / ${r.totalRounds||2}`;
  $('spySpeaker').textContent=speaker===myId?'ถึงตาคุณพูดแล้ว':`กำลังรอ ${r.players?.[speaker]?.name||'ผู้เล่น'} พูด`;
  $('spyDoneBtn').hidden=speaker!==myId;$('skipSpyBtn').hidden=!isHost;renderOrder($('spyOrder'),r);
  $('spyGroupName').textContent=`คำในกลุ่ม: ${r.currentGroup||'—'}`;$('spyWords').replaceChildren();
  (packFor(r).groups?.[r.currentGroup]||[]).forEach(w=>{const el=document.createElement('div');el.className='word';el.textContent=w;$('spyWords').append(el);});
}
function renderWho(r){const final=r.status==='final_guess',timed=r.gameMode==='whoami_time';const idx=r.currentTurnIndex||0,speaker=r.turnOrder?.[idx];
  $('whoTurnBlock').hidden=timed||final;$('whoTimerBlock').hidden=!timed&&!final;
  $('whoTimerLabel').textContent=final?'⏳ ช่วงตอบสุดท้าย (2 นาที)':'⏱️ เวลาเล่น';
  $('whoTimer').textContent=formatLeft(final?r.finalDeadline:r.playDeadline);
  $('whoRound').textContent=`รอบ ${r.currentRound||1} / ${r.totalRounds||2}`;
  $('whoSpeaker').textContent=speaker===myId?'ตาคุณถามแล้ว':`กำลังรอ ${r.players?.[speaker]?.name||'ผู้เล่น'} ถาม`;
  $('whoDoneBtn').hidden=timed||final||speaker!==myId;
  $('whoOrder').replaceChildren();(r.turnOrder||[]).forEach((id,i)=>{const chip=document.createElement('span');chip.className=`chip ${!timed&&!final&&i===idx?'current':''}`;chip.textContent=`${i+1}. ${r.players?.[id]?.name||'ออกจากเกม'}`;$('whoOrder').append(chip);});
  $('otherWords').replaceChildren();(r.turnOrder||[]).forEach(id=>{if(id===myId||!r.players?.[id])return;const el=document.createElement('div');el.className=`word ${r.attempts?.[id]===0?'done':''}`;
    el.innerHTML=`<b>${escapeHTML(r.players[id].name)}</b><span>${escapeHTML(r.roles?.[id]||'—')}</span>${r.attempts?.[id]===0?`<small>${r.guessedCorrectly?.[id]?' ✓ ถูก':' ✕ ผิด'}</small>`:''}`;$('otherWords').append(el);
  });
  const answered=r.attempts?.[myId]===0;$('guessInputs').hidden=answered;
  $('guessHeading').textContent=answered?(r.guessedCorrectly?.[myId]?'🎉 คุณตอบถูกแล้ว!':'คุณใช้สิทธิ์ทายแล้ว'):(final?'🎯 โอกาสสุดท้าย! ทายภายใน 2 นาที':'🎯 ทายคำของคุณ (1 ครั้ง)');
  $('skipWhoBtn').hidden=!isHost||final;
}
function renderVotes(r){const players=r.players||{},ids=Object.keys(players),mine=r.votes?.[myId],choices=r.tieCandidates||ids;
  $('voteHeading').textContent=r.tieCandidates?'🗳️ โหวตรอบตัดสิน':'🗳️ ใครคือ Spy?';
  $('voteTimer').textContent=formatLeft(r.voteDeadline);
  $('voteNote').textContent=mine?`✓ คุณโหวตแล้ว · ${Object.keys(r.votes||{}).length}/${ids.length} คน`:`โหวตและทายคำให้ทัน 2 นาที · ${Object.keys(r.votes||{}).length}/${ids.length} คนโหวตแล้ว`;
  $('voteChoices').replaceChildren();$('voteAnswer').hidden=!!mine;
  if(mine){$('voteChoices').innerHTML='<p class="notice">บันทึกโหวตแล้ว รอเพื่อนหรือหมดเวลา</p>';return;}
  if(!choices.includes(chosenVote))chosenVote='';
  choices.filter(id=>id!==myId&&players[id]).forEach(id=>{const btn=document.createElement('button');btn.className=`vote-choice ${id===chosenVote?'selected':''}`;
    btn.innerHTML=`<span>👤 ${escapeHTML(players[id].name)}</span><b>${id===chosenVote?'✓ เลือกแล้ว':'เลือก →'}</b>`;
    btn.onclick=()=>{chosenVote=id;chosenWord='';renderVotes(r);};$('voteChoices').append(btn);
  });
  $('voteAnswer').hidden=!chosenVote;
  if(chosenVote){$('voteWord').replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='— ไม่ทายคำ —';$('voteWord').append(empty);
    [...new Set(packFor(r).groups?.[r.currentGroup]||[])].forEach(w=>{const opt=document.createElement('option');opt.value=w;opt.textContent=w;$('voteWord').append(opt);});
    $('voteWord').value=chosenWord;
  }
}
function renderResults(r){const players=r.players||{},scores=r.scores||{},ids=Object.keys(players).sort((a,b)=>(scores[b]||0)-(scores[a]||0));
  $('resultContent').replaceChildren();const hero=document.createElement('div');hero.className='result-hero';
  const spy=r.gameMode==='spyfall',result=r.result||{};const heading=document.createElement('h2');
  heading.textContent=spy?(result.caught?'🎉 คนปกติจับ Spy ได้!':'🕵️ Spy ชนะรอบนี้!'):'🎊 จบเกม Who Am I!';
  const description=document.createElement('p');description.textContent=spy?`Spy คือ ${players[r.spyId]?.name||'ผู้เล่นที่ออกแล้ว'} · คำ Spy: ${r.roles?.[r.spyId]||'—'}`:r.gameMode==='whoami_rounds'?'ตอบถูกในรอบเดียวกัน ได้คะแนนเท่ากัน':'คนตอบถูกก่อน ได้คะแนนมากกว่า';
  hero.append(heading,description);$('resultContent').append(hero);
  const detail=document.createElement('div');detail.className='result-section';detail.innerHTML='<h3>🔍 เฉลยและรายละเอียด</h3>';
  if(spy){const other=Object.keys(r.roles||{}).find(id=>id!==r.spyId);addDetail(detail,`คำของคนปกติ: ${r.roles?.[other]||'—'}`);
    addDetail(detail,result.tied?'ผลโหวตตัดสินยังเสมอ':`ผู้ถูกโหวตมากที่สุด: ${players[result.pickedId]?.name||'ไม่มีผู้ถูกเลือก'}`);
    Object.entries(r.votes||{}).forEach(([id,b])=>addDetail(detail,`${players[id]?.name||'ผู้เล่น'} โหวต ${players[b.targetId]?.name||'—'} · ทาย ${b.guessWord||'ไม่ทาย'} · โบนัส +${result.awards?.[id]?.bonus||0}`));
  }else ids.forEach(id=>addDetail(detail,`${players[id].name}: ${r.roles?.[id]||'—'} · ${r.guessDetails?.[id]?.correct?`ตอบถูกรอบ ${r.guessDetails[id].round}`:'ไม่ได้ตอบถูก'}`));
  $('resultContent').append(detail);
  const board=document.createElement('div');board.className='result-section';board.innerHTML='<h3>🏆 คะแนนของรอบนี้ / คะแนนสะสม</h3>';
  ids.forEach((id,i)=>{const award=spy?r.result?.awards?.[id]:r.guessDetails?.[id];const pts=spy?(award?.total||0):(award?.points||0);
    const note=spy?`ชนะ +${award?.base||0} · ทายคำ +${award?.bonus||0}`:(award?.correct?`ทายถูก · รอบ ${award.round}`:'ไม่ตอบถูก');
    const row=document.createElement('div');row.className='result-row';row.innerHTML=`<div><strong>${['🥇','🥈','🥉'][i]||i+1} ${escapeHTML(players[id].name)}${id===r.spyId?' 🕵️':''}</strong><small>${escapeHTML(note)}</small></div><b>+${pts} / รวม ${scores[id]||0}</b>`;board.append(row);
  });$('resultContent').append(board);
  $('resultHostActions').hidden=!isHost;$('resultWaiting').hidden=isHost;
}
function addDetail(target,text){const el=document.createElement('p');el.className='result-details';el.textContent=text;target.append(el);}

// ===== Round transitions: ALWAYS 2-minute final response window =====
function toFinalGuess(r){
  const ids=Object.keys(r.players||{}),pending=ids.some(id=>r.attempts?.[id]!==0);
  if(!pending){r.status='results';r.finalDeadline=null;return;}
  r.status='final_guess';r.finalDeadline=serverNow()+FINAL_MS;r.currentRound=Math.min(r.totalRounds||1,r.currentRound||1);
}
function toVoting(r){r.status='voting';r.votes={};r.voteRound=1;r.tieCandidates=null;r.voteDeadline=serverNow()+FINAL_MS;}
function advanceRound(r){
  const order=r.turnOrder||[];if(!order.length){r.status='results';return;}
  let index=r.currentTurnIndex||0,round=r.currentRound||1;
  for(let i=0;i<order.length;i++){
    index++;if(index>=order.length){index=0;round++;}
    if(round>(r.totalRounds||1)){if(r.gameMode==='spyfall')toVoting(r);else toFinalGuess(r);return;}
    if(r.players?.[order[index]]){r.currentTurnIndex=index;r.currentRound=round;return;}
  }
  if(r.gameMode==='spyfall')toVoting(r);else toFinalGuess(r);
}
$('startBtn').onclick=async()=>{
  if(!isHost||!roomId)return;$('startBtn').disabled=true;
  try{const res=await getRef().transaction(r=>{
    if(!r||r.status!=='lobby'||r.hostId!==myId)return;
    const ids=Object.keys(r.players||{});if(ids.length<(r.gameMode==='spyfall'?3:2))return;
    const pack=packFor(r),roles={},attempts={};let group='',spy=null;
    if(r.gameMode==='spyfall'){
      const groups=Object.entries(pack.groups).filter(([,w])=>new Set(w).size>=2).map(([k])=>k);
      if(!groups.length)return;group=random(groups);const [a,b]=shuffle([...new Set(pack.groups[group])]);spy=random(ids);
      ids.forEach(id=>roles[id]=id===spy?a:b);
    }else{
      const words=shuffle(wordsOf(pack));if(!words.length)return;
      ids.forEach((id,i)=>{roles[id]=words[i%words.length];attempts[id]=1;});
    }
    r.status='playing';r.turnOrder=shuffle(ids);r.currentTurnIndex=0;r.currentRound=1;r.totalRounds=r.settingValue||2;
    r.roles=roles;r.spyId=spy;r.currentGroup=group;r.attempts=attempts;r.guessedCorrectly={};r.correctOrder=[];r.guessDetails={};
    r.votes={};r.voteRound=0;r.voteDeadline=null;r.tieCandidates=null;r.result=null;r.finalDeadline=null;
    r.playDeadline=r.gameMode==='whoami_time'?serverNow()+(r.settingValue||3)*60_000:null;
    r.gamesPlayed=(r.gamesPlayed||0)+1;r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
  if(res.committed){chosenGuess='';chosenVote='';chosenWord='';$('guessInput').value='';toast('เริ่มเกมแล้ว!','success');}
  else toast('เริ่มไม่ได้ ตรวจสอบจำนวนผู้เล่น','error');
  }catch(e){error(e);}finally{$('startBtn').disabled=false;}
};
async function endMyTurn(mode){if(!roomId)return;
  try{await getRef().transaction(r=>{
    if(!r||r.status!=='playing'||r.gameMode!==mode||r.turnOrder?.[r.currentTurnIndex||0]!==myId)return;
    advanceRound(r);r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);}catch(e){error(e);}
}
$('spyDoneBtn').onclick=()=>endMyTurn('spyfall');
$('whoDoneBtn').onclick=()=>endMyTurn('whoami_rounds');
$('skipSpyBtn').onclick=async()=>{if(!isHost||!await confirmBox('ข้ามไปโหวต?', 'เริ่มจับเวลาโหวต 2 นาทีทันที','เริ่มโหวต'))return;
  try{await getRef().transaction(r=>{if(!r||r.hostId!==myId||r.gameMode!=='spyfall'||r.status!=='playing')return;toVoting(r);r.lastActivityAt=TIMESTAMP();return r;},undefined,false);}catch(e){error(e);}
};
$('skipWhoBtn').onclick=async()=>{if(!isHost||!await confirmBox('ข้ามช่วงถาม?', 'คนที่ยังไม่ได้ตอบจะมีเวลาอีก 2 นาที','เริ่มช่วงตอบ'))return;
  try{await getRef().transaction(r=>{if(!r||r.hostId!==myId||r.gameMode==='spyfall'||r.status!=='playing')return;toFinalGuess(r);r.lastActivityAt=TIMESTAMP();return r;},undefined,false);}catch(e){error(e);}
};

// ===== Who Am I search and scoring =====
$('guessInput').addEventListener('input',()=>{
  chosenGuess='';$('guessSelected').textContent='ยังไม่ได้เลือกคำตอบ';const box=$('guessSuggestions');box.replaceChildren();
  const q=normalize($('guessInput').value),r=roomState;
  if(!q||!r||r.gameMode==='spyfall'){box.hidden=true;return;}
  wordsOf(packFor(r)).filter(w=>normalize(w).includes(q)).slice(0,15).forEach(word=>{
    const b=document.createElement('button');b.textContent=word;b.onclick=()=>{chosenGuess=word;$('guessInput').value=word;$('guessSelected').textContent=`✓ เลือก ${word}`;box.hidden=true;};box.append(b);
  });box.hidden=!box.children.length;
});
$('guessBtn').onclick=async()=>{
  if(!roomId||!roomState||roomState.gameMode==='spyfall')return;
  const option=wordsOf(packFor(roomState)).find(w=>normalize(w)===normalize(chosenGuess||$('guessInput').value));
  if(!option){toast('เลือกคำตอบจากหมวดที่กำหนดก่อน','error');return;}
  if(!await confirmBox('ยืนยันคำตอบ?',`ตอบ “${option}” ได้เพียงครั้งเดียว`,'ส่งคำตอบ'))return;
  $('guessBtn').disabled=true;
  try{const res=await getRef().transaction(r=>{
    if(!r||!['playing','final_guess'].includes(r.status)||r.gameMode==='spyfall'||!r.players?.[myId]||r.attempts?.[myId]!==1)return;
    if(r.status==='final_guess'&&serverNow()>=r.finalDeadline)return;
    if(r.status==='playing'&&r.gameMode==='whoami_time'&&serverNow()>=r.playDeadline)return;
    const correct=normalize(option)===normalize(r.roles?.[myId]);r.attempts[myId]=0;r.guessedCorrectly||={};r.guessedCorrectly[myId]=correct;
    const round=r.status==='final_guess'?(r.totalRounds||1):(r.currentRound||1);
    let points=0;if(correct){
      r.correctOrder||=[];
      points=r.gameMode==='whoami_time'?Math.max(1,Object.keys(r.players).length-r.correctOrder.length):Math.max(1,(r.totalRounds||1)-round+1);
      r.correctOrder.push(myId);r.scores||={};r.scores[myId]=(r.scores[myId]||0)+points;
    }
    r.guessDetails||={};r.guessDetails[myId]={correct,points,round};
    if(Object.keys(r.players).every(id=>r.attempts?.[id]===0))r.status='results';
    r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
    if(!res.committed){toast('หมดเวลาหรือคุณส่งคำตอบไปแล้ว','error');return;}
    const info=res.snapshot.val(),detail=info?.guessDetails?.[myId];
    toast(detail?.correct?`🎉 ถูกต้อง +${detail.points} คะแนน`:`ตอบผิด! คำที่ถูกคือ ${info?.roles?.[myId]||'—'}`,detail?.correct?'success':'error');
  }catch(e){error(e);}finally{$('guessBtn').disabled=false;}
};

// ===== Spyfall voting with separate bonus word =====
$('voteWord').onchange=e=>{chosenWord=e.target.value;};
$('voteSubmitBtn').onclick=async()=>{
  if(!roomId||!roomState||!chosenVote)return;
  const target=chosenVote,word=$('voteWord').value;
  $('voteSubmitBtn').disabled=true;
  try{const res=await getRef().transaction(r=>{
    const available=r?.tieCandidates||Object.keys(r?.players||{});
    if(!r||r.status!=='voting'||serverNow()>=r.voteDeadline||!r.players?.[myId]||!r.players?.[target]||target===myId||!available.includes(target)||r.votes?.[myId])return;
    if(word&&!new Set(packFor(r).groups?.[r.currentGroup]||[]).has(word))return;
    r.votes||={};r.votes[myId]={targetId:target,guessWord:word};r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
    if(res.committed)toast('ส่งโหวตและคำทายแล้ว','success');else toast('โหวตไม่ได้ หรือหมดเวลาแล้ว','error');
  }catch(e){error(e);}finally{$('voteSubmitBtn').disabled=false;}
};
function resolveVotes(r){
  const ids=Object.keys(r.players||{}),ballots=r.votes||{},counts={};
  for(const [id,v] of Object.entries(ballots))if(r.players?.[id]&&r.players?.[v.targetId])counts[v.targetId]=(counts[v.targetId]||0)+1;
  const high=Math.max(0,...Object.values(counts)),top=Object.keys(counts).filter(id=>counts[id]===high);
  if(top.length>1&&r.voteRound===1){r.tieCandidates=top;r.voteRound=2;r.votes={};r.voteDeadline=serverNow()+FINAL_MS;return;}
  const tied=top.length!==1,pickedId=tied?null:top[0],caught=!tied&&pickedId===r.spyId;
  const awards={};ids.forEach(id=>{
    const ballot=ballots[id]||{},isSpy=id===r.spyId;
    const guessed=!!ballot.guessWord && !!r.roles?.[ballot.targetId] && normalize(ballot.guessWord)===normalize(r.roles[ballot.targetId]);
    const base=isSpy?(caught?0:2):(caught?1:0);
    const bonus=guessed&&(isSpy||ballot.targetId===r.spyId)?1:0;
    awards[id]={base,bonus,total:base+bonus};r.scores||={};r.scores[id]=(r.scores[id]||0)+base+bonus;
  });
  r.result={pickedId,caught,tied,awards};r.status='results';r.voteDeadline=null;
}

// ===== Automatic transitions; ANY open client can perform them, not only host =====
async function runAutomatic(){
  if(autoBusy||!roomId||!roomState||leaving)return;const r=roomState;
  const active=Object.keys(r.players||{});
  const allAnswered=active.length>0&&active.every(id=>r.attempts?.[id]===0);
  const allVoted=active.length>0&&active.every(id=>!!r.votes?.[id]);
  const need=(r.status==='playing'&&r.gameMode==='whoami_time'&&(serverNow()>=r.playDeadline||allAnswered)) ||
    (r.status==='playing'&&r.gameMode!=='whoami_time'&&!r.players?.[r.turnOrder?.[r.currentTurnIndex||0]]) ||
    (r.status==='final_guess'&&(serverNow()>=r.finalDeadline||allAnswered)) ||
    (r.status==='voting'&&(serverNow()>=r.voteDeadline||allVoted));
  if(!need)return;
  autoBusy=true;try{
    await getRef().transaction(x=>{
      if(!x)return;const ids=Object.keys(x.players||{}),done=ids.length>0&&ids.every(id=>x.attempts?.[id]===0);
      if(x.status==='playing'&&x.gameMode==='whoami_time'&&(done||serverNow()>=x.playDeadline)){
        if(done)x.status='results';else toFinalGuess(x);return x;
      }
      if(x.status==='playing'&&x.gameMode!=='whoami_time'&&!x.players?.[x.turnOrder?.[x.currentTurnIndex||0]]){
        advanceRound(x);return x;
      }
      if(x.status==='final_guess'&&(done||serverNow()>=x.finalDeadline)){
        x.status='results';return x;
      }
      if(x.status==='voting'&&(serverNow()>=x.voteDeadline||(ids.length&&ids.every(id=>x.votes?.[id])))){
        resolveVotes(x);return x;
      }
    },undefined,false);
  }catch(e){error(e);}finally{autoBusy=false;}
}
setInterval(()=>{
  if(!roomId||!roomState)return;const r=roomState;
  if(r.status==='voting')$('voteTimer').textContent=formatLeft(r.voteDeadline);
  if(r.status==='final_guess')$('whoTimer').textContent=formatLeft(r.finalDeadline);
  if(r.status==='playing'&&r.gameMode==='whoami_time')$('whoTimer').textContent=formatLeft(r.playDeadline);
  runAutomatic();
},1000);

// ===== Summary remains until host returns to lobby =====
$('nextGameBtn').onclick=async()=>{
  if(!isHost||!roomId||!await confirmBox('กลับล็อบบี้?', 'ทุกคนจะกลับไปรอเริ่มเกมรอบใหม่ และคะแนนสะสมยังอยู่','กลับล็อบบี้'))return;
  try{const res=await getRef().transaction(r=>{
    if(!r||r.hostId!==myId||r.status!=='results')return;
    r.status='lobby';r.roles=null;r.spyId=null;r.currentGroup=null;r.turnOrder=[];
    r.currentRound=1;r.currentTurnIndex=0;r.attempts={};r.guessedCorrectly={};r.guessDetails={};r.correctOrder=[];
    r.playDeadline=null;r.finalDeadline=null;r.voteDeadline=null;r.votes={};r.voteRound=0;r.tieCandidates=null;r.result=null;
    r.lastActivityAt=TIMESTAMP();return r;
  },undefined,false);
    if(res.committed){chosenGuess='';chosenWord='';chosenVote='';$('guessInput').value='';toast('กลับล็อบบี้แล้ว','success');}
  }catch(e){error(e);}
};

// Restore room after browser refresh
if(roomId){$('roomCode').textContent=roomId;$('roomTitle').textContent=`ห้อง ${roomId}`;$('leaveBtn').hidden=false;showOnly('roomView');reconnect();}
else showOnly('homeView');
