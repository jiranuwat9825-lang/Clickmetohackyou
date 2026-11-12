
// Party Game Hub V3 — Firebase Realtime Database
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

// หมวดที่จัดการเก็บในเครื่องผู้ใช้ และจะถูกแนบลงห้องเมื่อสร้างห้อง
const CATEGORY_STORAGE_KEY = 'party_game_categories_v3';
const MODE_IDS = ['spyfall','whoami_time','whoami_rounds'];
function defaultLibrary() {
  const library = JSON.parse(JSON.stringify(builtinCategories));
  Object.values(library).forEach(c => c.enabledModes = [...MODE_IDS]);
  return library;
}
function loadCategoryLibrary() {
  try {
    const saved = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY));
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return defaultLibrary();
    const valid = Object.entries(saved).filter(([key,cat]) =>
      /^[a-zA-Z0-9_-]{1,50}$/.test(key) && cat &&
      typeof cat.name === 'string' && cat.groups && typeof cat.groups === 'object' &&
      Array.isArray(cat.enabledModes));
    if (valid.length <= 100) return Object.fromEntries(valid);
  } catch (err) { console.warn('โหลดหมวดที่บันทึกไม่ได้',err); }
  return defaultLibrary();
}
let categoriesData = loadCategoryLibrary();
function saveCategoryLibrary() {
  localStorage.setItem(CATEGORY_STORAGE_KEY,JSON.stringify(categoriesData));
}
function getCurrentCategoryPack(room = roomState) {
  return room?.categoryPack || categoriesData[room?.category] || builtinCategories[room?.category] || builtinCategories.rov;
}
function availableModes(cat) { return Array.isArray(cat?.enabledModes) ? cat.enabledModes : MODE_IDS; }
function categoryWords(cat) {
  return [...new Set(Object.values(cat?.groups || {}).flat().filter(v => typeof v === 'string' && v.trim()))];
}

// -------------------------------------------------------------------------
// ตั้งค่าและตัวช่วยทั่วไป
// -------------------------------------------------------------------------
const INACTIVITY_MS = 10 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 30 * 1000;
const ACTIVITY_THROTTLE_MS = 45 * 1000;
const $ = (id) => document.getElementById(id);
const ui = Object.fromEntries([
  'roomSelection','createRoomModal','categoryManager','roomContent','lobbyArea','gameArea','whoAmIArea','voteArea',
  'nameInput','showCreateModalBtn','backToHomeBtn','newRoomInput','gameModeSelect','categorySelect',
  'settingValueInput','roundOrTimeLabel','settingHint','settingMinusBtn','settingPlusBtn','setupDetails','modeCardList','categoryCardGrid','categoryPickerHint','openManagerBtn','manageFromSetupBtn','confirmCreateBtn','activeRoomsList','roomTitle','roomCode',
  'roomStatusPill','roomCategoryBadge','lobbyHostName','lobbyPlayerCount','playerList','startBtn',
  'waitText','closeRoomBtn','headerLeaveBtn','copyRoomBtn','heroName','heroGrid','heroGroupTitle',
  'roundIndicator','currentSpeakerBox','endTurnBtn','fullTurnOrderContainer','hostControls','skipToVoteBtn',
  'whoAmITimerContainer','whoAmITimer','whoAmITurnBoxContainer','whoAmIRoundIndicator',
  'whoAmICurrentSpeakerBox','whoAmIEndTurnBtn','whoAmIFullTurnOrderContainer','othersRolesGrid',
  'myGuessSearch','searchResultsList','selectedGuessText','submitMyGuessBtn','guessControlsDiv',
  'guessStatusText','whoAmIHostControls','whoAmISkipBtn','voteAreaTitle','voteList','voteResult',
  'scoreBoard','scoreListBody','hostPostVoteControls','nextRoundBtn','backToLobbyBtn','voteInstruction',
  'managerCategoryList','managerCategoryCount','newCategoryBtn','resetCategoriesBtn','categoryEditor','managerEmpty','managerCategoryName','managerModeOptions','managerGroups','addGroupBtn','saveCategoryBtn','deleteCategoryBtn','backFromManagerBtn','toastStack','confirmOverlay','confirmTitle','confirmMessage','confirmCancelBtn','confirmOkBtn'
].map(id => [id, $(id)]));
const serverTimestamp = () => firebase.database.ServerValue.TIMESTAMP;
const now = () => Date.now() + serverOffset;
const getRoomRef = () => roomId ? db.ref(`rooms/${roomId}`) : null;
const getAllItems = (cat, pack = null) => categoryWords(pack || categoriesData[cat] || builtinCategories[cat] || builtinCategories.rov);
const escapeHTML = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gameModeName = mode => ({spyfall:'Spyfall · จับสายลับ',whoami_time:'ฉันคือใคร · จับเวลา',whoami_rounds:'ฉันคือใคร · นับรอบ'}[mode] || 'Spyfall · จับสายลับ');
const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];
function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}
function setVisible(el, visible) { if (el) el.hidden = !visible; }
function showView(view) {
  for (const id of ['roomSelection','createRoomModal','categoryManager','roomContent']) setVisible(ui[id], id === view);
}
function toast(message, type = 'info') {
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  const icon = document.createElement('span');
  icon.textContent = type === 'error' ? '✕' : type === 'success' ? '✓' : '✦';
  const content = document.createElement('span');
  content.textContent = message;
  const close = document.createElement('button');
  close.type = 'button'; close.setAttribute('aria-label','ปิดแจ้งเตือน'); close.textContent = '×';
  node.append(icon,content,close);
  const remove = () => { node.classList.add('removing'); setTimeout(() => node.remove(),220); };
  close.addEventListener('click',remove);
  ui.toastStack.prepend(node);
  setTimeout(remove,3800);
  while (ui.toastStack.children.length > 4) ui.toastStack.lastElementChild.remove();
}
function gameError(err) {
  console.error('PartyGame:',err);
  toast(err?.code === 'PERMISSION_DENIED' ? 'Firebase ไม่อนุญาตให้ดำเนินการ โปรดตรวจสอบกฎฐานข้อมูล' : 'การเชื่อมต่อมีปัญหา กรุณาลองอีกครั้ง', 'error');
}
let confirmResolve = null;
function askConfirm(title, message, okText = 'ยืนยัน') {
  if (confirmResolve) confirmResolve(false);
  ui.confirmTitle.textContent = title;
  ui.confirmMessage.textContent = message;
  ui.confirmOkBtn.textContent = okText;
  setVisible(ui.confirmOverlay,true);
  ui.confirmCancelBtn.focus();
  return new Promise(resolve => { confirmResolve = resolve; });
}
function closeConfirm(ok) {
  if (!confirmResolve) return;
  const resolve = confirmResolve; confirmResolve = null;
  setVisible(ui.confirmOverlay,false);
  resolve(ok);
}
ui.confirmCancelBtn.addEventListener('click',() => closeConfirm(false));
ui.confirmOkBtn.addEventListener('click',() => closeConfirm(true));
ui.confirmOverlay.addEventListener('click',e => { if (e.target === ui.confirmOverlay) closeConfirm(false); });
document.addEventListener('keydown',e => { if (e.key === 'Escape' && !ui.confirmOverlay.hidden) closeConfirm(false); });

// sessionStorage แยกผู้เล่นแต่ละแท็บ และยังจำผู้เล่นเดิมเมื่อรีเฟรช
let myId = sessionStorage.getItem('party_game_tab_id') || localStorage.getItem('rov_spy_myid');
if (!myId) myId = `player_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
sessionStorage.setItem('party_game_tab_id',myId);
localStorage.removeItem('rov_spy_myid');
let myName = localStorage.getItem('rov_spy_myname') || '';
let roomId = sessionStorage.getItem('party_game_room') || localStorage.getItem('rov_spy_roomid') || '';
if (roomId) sessionStorage.setItem('party_game_room',roomId);
localStorage.removeItem('rov_spy_roomid');
let isHost = false;
let roomState = null;
let syncRef = null;
let syncHandler = null;
let lastActivitySentAt = 0;
let selectedGuess = '';
let selectedTargetId = '';
let timerInterval = null;
let serverOffset = 0;
let sweepInProgress = false;
let transferringHost = false;
let autoAdvancing = false;
let autoFinalizing = false;
let isLeaving = false;
let latestRoomList = {};
ui.nameInput.value = myName;
ui.nameInput.addEventListener('input',() => {
  const name = ui.nameInput.value.trim();
  localStorage.setItem('rov_spy_myname',name);
  myName = name;
});
db.ref('.info/serverTimeOffset').on('value',s => { serverOffset = Number(s.val()) || 0; });

function rememberName() {
  const name = ui.nameInput.value.trim();
  if (!name) { toast('กรุณาตั้งชื่อเล่นก่อนเริ่มเกม','error'); ui.nameInput.focus(); return false; }
  myName = name;
  localStorage.setItem('rov_spy_myname',name);
  return true;
}
function unsubscribeRoom() {
  if (syncRef && syncHandler) syncRef.off('value',syncHandler);
  syncRef = null; syncHandler = null;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}
function resetToHome(message = '') {
  unsubscribeRoom();
  roomId = ''; roomState = null; isHost = false; isLeaving = false;
  sessionStorage.removeItem('party_game_room');
  setVisible(ui.headerLeaveBtn,false); setVisible(ui.scoreBoard,false);
  showView('roomSelection');
  if (message) toast(message);
}
function registerDisconnect(ref) { return ref.child(`players/${myId}`).onDisconnect().remove(); }
async function rejoinIfConnected() {
  if (!roomId || isLeaving) return;
  const id = roomId;
  const ref = db.ref(`rooms/${id}`);
  try {
    const snap = await ref.once('value');
    const room = snap.val();
    if (!room) { if (id === roomId) resetToHome('ห้องเดิมไม่อยู่แล้ว'); return; }
    if (stale(room)) { await tryDeleteInactive(id); if (id === roomId) resetToHome('ห้องหมดอายุจากการไม่มีความเคลื่อนไหว 10 นาที'); return; }
    if (id !== roomId) return;
    if (room.status !== 'lobby' && !room.roles?.[myId]) {
      resetToHome('ไม่สามารถกลับเข้าห้องที่เริ่มเกมแล้วได้'); return;
    }
    await registerDisconnect(ref);
    if (id !== roomId) return;
    await ref.child(`players/${myId}`).set({name:myName || 'ผู้เล่น'});
    if (id === roomId && !syncRef) subscribeRoom();
  } catch(err) { gameError(err); }
}
db.ref('.info/connected').on('value', snap => {
  if (snap.val() === true && roomId && !isLeaving) rejoinIfConnected();
});

// -------------------------------------------------------------------------
// การจัดการความเคลื่อนไหวและลบห้องไม่มีการใช้งาน
// -------------------------------------------------------------------------
function touchActivity() {
  if (!roomId || isLeaving) return;
  if (now() - lastActivitySentAt < ACTIVITY_THROTTLE_MS) return;
  lastActivitySentAt = now();
  getRoomRef().child('lastActivityAt').set(serverTimestamp()).catch(gameError);
}
ui.roomContent.addEventListener('pointerdown',touchActivity);
ui.roomContent.addEventListener('keydown',touchActivity);
function stale(room) {
  const when = room?.lastActivityAt ?? room?.createdAt;
  return typeof when === 'number' && now() - when >= INACTIVITY_MS;
}
async function tryDeleteInactive(id) {
  const ref = db.ref(`rooms/${id}`);
  try {
    await ref.transaction(room => {
      if (!room) return;
      if (stale(room)) return null;
      if (!room.lastActivityAt && !room.createdAt) {
        room.lastActivityAt = serverTimestamp();
        return room;
      }
    }, undefined, false);
  } catch(err) { console.warn('cleanup:',id,err); }
}
async function sweepInactiveRooms() {
  if (sweepInProgress) return;
  sweepInProgress = true;
  try {
    const snap = await db.ref('rooms').once('value');
    const rooms = snap.val() || {};
    for (const [id,room] of Object.entries(rooms)) {
      if (stale(room) || (!room.lastActivityAt && !room.createdAt)) await tryDeleteInactive(id);
    }
  } catch(err) { console.warn('scan inactivity:',err); }
  finally { sweepInProgress = false; }
}
setInterval(sweepInactiveRooms,CLEANUP_INTERVAL_MS);
setTimeout(sweepInactiveRooms,1500);

db.ref('rooms').on('value',snap => {
  latestRoomList = snap.val() || {};
  renderRooms(latestRoomList);
},gameError);
function renderRooms(rooms) {
  ui.activeRoomsList.replaceChildren();
  const entries = Object.entries(rooms).filter(([,room]) => room && !stale(room));
  if (!entries.length) {
    ui.activeRoomsList.innerHTML = '<p class="empty-message">ยังไม่มีห้องที่เปิดอยู่ ✨<br>สร้างห้องแรกแล้วชวนเพื่อนมาเล่นกัน!</p>';
    return;
  }
  entries.sort((a,b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
  for (const [id,room] of entries) {
    const canJoin = (room.status || 'lobby') === 'lobby';
    const playerCount = Object.keys(room.players || {}).length;
    const article = document.createElement('article'); article.className = 'room-entry';
    const info = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = `✦ ${id}`;
    const subtitle = document.createElement('p');
    subtitle.textContent = `${gameModeName(room.gameMode)} · ${playerCount} คน · ${canJoin ? 'กำลังรอ' : 'กำลังเล่น'}`;
    info.append(title,subtitle);
    const button = document.createElement('button'); button.type = 'button';
    button.className = 'btn btn-small btn-soft'; button.textContent = canJoin ? 'เข้าร่วม →' : 'กำลังเล่น';
    button.disabled = !canJoin;
    button.addEventListener('click',() => { if (rememberName()) joinRoom(id); });
    article.append(info,button); ui.activeRoomsList.append(article);
  }
}

// -------------------------------------------------------------------------
// หน้าเลือกโหมดและการตั้งค่าห้อง
// -------------------------------------------------------------------------
function updateSetupState() {
  const mode = ui.gameModeSelect.value;
  setVisible(ui.setupDetails,MODE_IDS.includes(mode));
  ui.modeCardList.querySelectorAll('[data-mode]').forEach(btn => {
    const chosen = btn.dataset.mode === mode;
    btn.classList.toggle('active',chosen);
    btn.setAttribute('aria-pressed',String(chosen));
  });
  if (mode === 'whoami_time') {
    ui.roundOrTimeLabel.textContent = 'เวลาเล่น (นาที)';
    ui.settingHint.textContent = 'นับเวลาจากเซิร์ฟเวอร์ เมื่อหมดเวลาจะสรุปคะแนน';
  } else {
    ui.roundOrTimeLabel.textContent = 'จำนวนรอบพูด';
    ui.settingHint.textContent = 'ทุกคนจะได้พูดหรือถามคนละหนึ่งครั้งต่อรอบ';
  }
  renderCategoryPicker();
}
function renderCategoryPicker() {
  const mode = ui.gameModeSelect.value;
  const choices = Object.entries(categoriesData).filter(([,cat]) => availableModes(cat).includes(mode));
  if (!choices.some(([key]) => key === ui.categorySelect.value)) ui.categorySelect.value = '';
  ui.categoryCardGrid.replaceChildren();
  choices.forEach(([key,cat]) => {
    const active = ui.categorySelect.value === key;
    const card = document.createElement('button');
    card.type = 'button'; card.className = `category-card ${active ? 'active' : ''}`;
    const info = document.createElement('span');
    const title = document.createElement('strong'); title.textContent = cat.name;
    const detail = document.createElement('small'); detail.textContent = `${categoryWords(cat).length} คำ · ${Object.keys(cat.groups).length} กลุ่ม`;
    info.append(title,detail);
    const tick = document.createElement('span'); tick.className = 'category-check'; tick.textContent = '✓';
    card.append(info,tick);
    card.addEventListener('click',() => { ui.categorySelect.value = key; renderCategoryPicker(); });
    ui.categoryCardGrid.append(card);
  });
  if (!choices.length) ui.categoryCardGrid.innerHTML = '<div class="category-empty">ยังไม่มีหมวดที่ใช้กับโหมดนี้ได้ กด “จัดการหมวดหมู่” เพื่อสร้างหรือเปิดใช้งาน</div>';
  ui.categoryPickerHint.textContent = choices.length ? 'เลือกหมวดที่อยากใช้หนึ่งหมวด · สามารถปรับแต่งคำในตัวจัดการหมวดได้' : '';
  ui.confirmCreateBtn.disabled = !MODE_IDS.includes(mode) || !ui.categorySelect.value;
}
ui.modeCardList.addEventListener('click',e => {
  const button = e.target.closest('[data-mode]');
  if (!button) return;
  const changed = ui.gameModeSelect.value !== button.dataset.mode;
  ui.gameModeSelect.value = button.dataset.mode;
  if (changed) {
    ui.categorySelect.value = '';
    ui.settingValueInput.value = button.dataset.mode === 'whoami_time' ? '3' : '2';
  }
  updateSetupState();
});
function setupRoomForm() {
  ui.gameModeSelect.value = '';
  ui.categorySelect.value = '';
  ui.settingValueInput.value = '2';
  updateSetupState();
}
ui.settingMinusBtn.addEventListener('click',() => ui.settingValueInput.value = Math.max(1,Number(ui.settingValueInput.value || 2) - 1));
ui.settingPlusBtn.addEventListener('click',() => ui.settingValueInput.value = Math.min(99,Number(ui.settingValueInput.value || 2) + 1));
ui.showCreateModalBtn.addEventListener('click',() => {
  if (!rememberName()) return;
  setupRoomForm();
  showView('createRoomModal');
  ui.newRoomInput.focus();
});
ui.backToHomeBtn.addEventListener('click',() => showView('roomSelection'));

// -------------------------------------------------------------------------
// Content Studio: จัดการหมวด กลุ่มย่อย และคำ
// -------------------------------------------------------------------------
let managerReturnView = 'roomSelection';
let managerKey = null;
let managerDraft = null;
let managerIsNew = false;
function openCategoryManager(from) {
  managerReturnView = from;
  showView('categoryManager');
  if (!managerDraft) {
    const first = Object.keys(categoriesData)[0];
    if (first) chooseManagerCategory(first);
  }
  renderManagerList();
}
ui.openManagerBtn.addEventListener('click',() => openCategoryManager('roomSelection'));
ui.manageFromSetupBtn.addEventListener('click',() => openCategoryManager('createRoomModal'));
ui.backFromManagerBtn.addEventListener('click',() => {
  showView(managerReturnView);
  if (managerReturnView === 'createRoomModal') updateSetupState();
});
function parseWords(value) {
  const seen = new Set();
  return String(value).split(/[\n,，]+/).map(w => w.trim()).filter(w => {
    const code = w.toLocaleLowerCase();
    if (!w || seen.has(code)) return false;
    seen.add(code); return true;
  });
}
function renderManagerList() {
  ui.managerCategoryList.replaceChildren();
  const entries = Object.entries(categoriesData);
  ui.managerCategoryCount.textContent = `${entries.length} หมวด`;
  entries.forEach(([key,cat]) => {
    const button = document.createElement('button'); button.type='button';
    button.className = `manager-item ${managerKey === key && !managerIsNew ? 'active' : ''}`;
    button.textContent = cat.name;
    const sub = document.createElement('small'); sub.textContent = `${categoryWords(cat).length} คำ · ${availableModes(cat).length} โหมด`;
    button.append(sub);
    button.addEventListener('click',() => chooseManagerCategory(key));
    ui.managerCategoryList.append(button);
  });
}
function chooseManagerCategory(key) {
  if (!categoriesData[key]) return;
  managerKey = key; managerIsNew = false;
  const category = JSON.parse(JSON.stringify(categoriesData[key]));
  managerDraft = {name:category.name,enabledModes:availableModes(category),groups:Object.entries(category.groups).map(([name,words]) => ({name,words:[...words]}))};
  renderManagerEditor(); renderManagerList();
}
function renderManagerEditor() {
  setVisible(ui.categoryEditor,!!managerDraft);
  setVisible(ui.managerEmpty,!managerDraft);
  if (!managerDraft) return;
  ui.managerCategoryName.value = managerDraft.name;
  ui.managerModeOptions.querySelectorAll('input[type="checkbox"]').forEach(input => input.checked = managerDraft.enabledModes.includes(input.value));
  ui.deleteCategoryBtn.disabled = managerIsNew;
  renderManagerGroups();
}
ui.managerCategoryName.addEventListener('input',() => { if (managerDraft) managerDraft.name = ui.managerCategoryName.value; });
ui.managerModeOptions.addEventListener('change',() => {
  if (!managerDraft) return;
  managerDraft.enabledModes = [...ui.managerModeOptions.querySelectorAll('input:checked')].map(el => el.value);
});
function renderManagerGroups() {
  ui.managerGroups.replaceChildren();
  managerDraft.groups.forEach((group,index) => {
    const section = document.createElement('section'); section.className='group-editor';
    const row = document.createElement('div'); row.className='group-editor-top';
    const name = document.createElement('input'); name.type='text'; name.maxLength=45; name.value=group.name; name.placeholder='ชื่อกลุ่มย่อย';
    name.addEventListener('input',() => {group.name=name.value;});
    const remove = document.createElement('button'); remove.type='button'; remove.textContent='ลบกลุ่ม';
    remove.addEventListener('click',() => {managerDraft.groups.splice(index,1);renderManagerGroups();});
    row.append(name,remove);
    const words = document.createElement('textarea'); words.rows=5; words.placeholder='พิมพ์คำละ 1 บรรทัด เช่น\nหมอน\nโต๊ะ\nเก้าอี้'; words.value=group.words.join('\n');
    const count = document.createElement('div'); count.className='group-count'; count.textContent=`${group.words.length} คำ`;
    words.addEventListener('input',() => {group.words=parseWords(words.value);count.textContent=`${group.words.length} คำ`;});
    section.append(row,words,count); ui.managerGroups.append(section);
  });
}
ui.addGroupBtn.addEventListener('click',() => {
  if (!managerDraft) return;
  if (managerDraft.groups.length >= 20) {toast('สร้างได้ไม่เกิน 20 กลุ่มย่อยต่อหมวด','error');return;}
  managerDraft.groups.push({name:`กลุ่ม ${managerDraft.groups.length+1}`,words:[]});
  renderManagerGroups(); ui.managerGroups.lastElementChild?.querySelector('input')?.focus();
});
ui.newCategoryBtn.addEventListener('click',() => {
  managerKey = null; managerIsNew = true;
  managerDraft = {name:'',enabledModes:[...MODE_IDS],groups:[{name:'กลุ่ม 1',words:[]}]};
  renderManagerEditor();renderManagerList();ui.managerCategoryName.focus();
});
ui.saveCategoryBtn.addEventListener('click',() => {
  if (!managerDraft) return;
  const name = managerDraft.name.trim();
  if (name.length < 2 || name.length > 40) {toast('ชื่อหมวดต้องยาว 2–40 ตัวอักษร','error');return;}
  if (!managerDraft.enabledModes.length) {toast('เลือกให้หมวดนี้ใช้กับอย่างน้อย 1 โหมด','error');return;}
  const groups = {};
  const used = new Set();
  for (const group of managerDraft.groups) {
    const groupName = group.name.trim();
    if (!groupName || used.has(groupName.toLocaleLowerCase())) {toast('ตั้งชื่อกลุ่มย่อยไม่ซ้ำกันและห้ามเว้นว่าง','error');return;}
    used.add(groupName.toLocaleLowerCase());
    if (group.words.length > 150 || group.words.some(word => word.length > 60)) {toast('กลุ่มหนึ่งมีได้ไม่เกิน 150 คำ และคำละไม่เกิน 60 ตัวอักษร','error');return;}
    if (group.words.length) groups[groupName] = group.words;
  }
  if (!Object.keys(groups).length) {toast('เพิ่มคำอย่างน้อยหนึ่งคำก่อนบันทึก','error');return;}
  if (managerDraft.enabledModes.includes('spyfall') && !Object.values(groups).some(words => words.length >= 2)) {
    toast('Spyfall ต้องมีกลุ่มย่อยที่มีคำต่างกันอย่างน้อย 2 คำ','error');return;
  }
  if (managerIsNew && Object.keys(categoriesData).length >= 100) {toast('มีหมวดได้ไม่เกิน 100 หมวด','error');return;}
  const key = managerIsNew ? `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}` : managerKey;
  try {
    categoriesData[key] = {name,enabledModes:[...managerDraft.enabledModes],groups};
    saveCategoryLibrary();
    managerKey = key; managerIsNew = false;
    chooseManagerCategory(key); renderCategoryPicker();
    toast('บันทึกหมวดคำเรียบร้อยแล้ว','success');
  } catch(err) {gameError(err);}
});
ui.deleteCategoryBtn.addEventListener('click',async () => {
  if (!managerKey || !categoriesData[managerKey]) return;
  const name = categoriesData[managerKey].name;
  if (!await askConfirm('ลบหมวดหมู่นี้?',`หมวด “${name}” และคำทั้งหมดในหมวดจะถูกลบจากเบราว์เซอร์นี้`,'ลบหมวด')) return;
  delete categoriesData[managerKey];
  saveCategoryLibrary(); managerKey = null; managerDraft = null; managerIsNew = false;
  const first = Object.keys(categoriesData)[0];
  if (first) chooseManagerCategory(first); else {renderManagerEditor();renderManagerList();}
  renderCategoryPicker();toast('ลบหมวดหมู่แล้ว','success');
});
ui.resetCategoriesBtn.addEventListener('click',async () => {
  if (!await askConfirm('คืนค่าหมวดเริ่มต้น?', 'หมวดและคำที่ปรับแต่งไว้ในเบราว์เซอร์นี้จะถูกแทนที่ด้วยชุดเริ่มต้นทั้งหมด','คืนค่าเริ่มต้น')) return;
  categoriesData = defaultLibrary(); saveCategoryLibrary();
  managerKey = null;managerDraft=null;managerIsNew=false;
  chooseManagerCategory(Object.keys(categoriesData)[0]);renderCategoryPicker();
  toast('คืนค่าหมวดมาตรฐานแล้ว','success');
});

// -------------------------------------------------------------------------
// สร้างห้อง เข้าห้อง ออกห้อง
// -------------------------------------------------------------------------
ui.confirmCreateBtn.addEventListener('click',async () => {
  const id = ui.newRoomInput.value.trim();
  if (!/^[\p{L}\p{N}_-]{1,20}$/u.test(id) || /[.#$\[\]/]/.test(id)) {
    toast('ชื่อห้องต้องยาว 1–20 ตัว และไม่มีช่องว่างหรืออักขระพิเศษ','error'); return;
  }
  const rounds = Number(ui.settingValueInput.value);
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 99) {
    toast('กรุณากำหนดจำนวนรอบ/นาที ระหว่าง 1 ถึง 99','error'); return;
  }
  const selectedMode = ui.gameModeSelect.value;
  const selectedKey = ui.categorySelect.value;
  const category = categoriesData[selectedKey];
  if (!MODE_IDS.includes(selectedMode) || !category || !availableModes(category).includes(selectedMode)) {
    toast('เลือกโหมดและหมวดคำที่รองรับโหมดนี้ก่อน','error'); return;
  }
  if (selectedMode === 'spyfall' && !Object.values(category.groups).some(words => new Set(words).size >= 2)) {
    toast('หมวด Spyfall ต้องมีกลุ่มย่อยที่มีคำอย่างน้อย 2 คำ','error'); return;
  }
  if (!categoryWords(category).length) { toast('หมวดนี้ยังไม่มีคำให้เล่น','error'); return; }
  ui.confirmCreateBtn.disabled = true;
  const ref = db.ref(`rooms/${id}`);
  try {
    await registerDisconnect(ref);
    const result = await ref.transaction(current => {
      if (current) return;
      return {
        hostId:myId,gameMode:selectedMode,category:selectedKey,categoryPack:JSON.parse(JSON.stringify(category)),
        settingValue:rounds,status:'lobby',players:{[myId]:{name:myName}},scores:{[myId]:0},
        createdAt:serverTimestamp(),lastActivityAt:serverTimestamp(),gamesPlayed:0
      };
    },undefined,false);
    if (!result.committed) { await ref.child(`players/${myId}`).onDisconnect().cancel(); toast('มีห้องชื่อนี้แล้ว ลองเปลี่ยนชื่อห้อง','error'); return; }
    enterRoom(id);
    toast('สร้างห้องสำเร็จ! ส่งรหัสให้เพื่อนเข้ามาเล่นได้เลย','success');
  } catch(err) { gameError(err); }
  finally { ui.confirmCreateBtn.disabled = false; }
});
async function joinRoom(id) {
  const ref = db.ref(`rooms/${id}`);
  try {
    await registerDisconnect(ref);
    const result = await ref.transaction(room => {
      if (!room || room.status !== 'lobby' || stale(room)) return;
      room.players ||= {};
      room.scores ||= {};
      room.players[myId] = {name:myName};
      room.scores[myId] ??= 0;
      room.lastActivityAt = serverTimestamp();
      return room;
    },undefined,false);
    if (!result.committed) { await ref.child(`players/${myId}`).onDisconnect().cancel(); toast('ห้องนี้เข้าไม่ได้แล้ว ลองเลือกห้องอื่น','error'); return; }
    enterRoom(id); toast('เข้าห้องสำเร็จ พร้อมลุย!','success');
  } catch(err) { gameError(err); }
}
function enterRoom(id) {
  if (roomId && roomId !== id) unsubscribeRoom();
  roomId = id; isLeaving = false; lastActivitySentAt = now();
  sessionStorage.setItem('party_game_room',id);
  ui.roomTitle.textContent = `ห้อง ${id}`;
  ui.roomCode.textContent = id;
  setVisible(ui.headerLeaveBtn,true); showView('roomContent');
  subscribeRoom();
}
async function leaveRoom() {
  if (!roomId) return;
  if (!await askConfirm('ออกจากห้องนี้?', 'คะแนนในห้องจะยังอยู่ แต่คุณจะออกจากเกมปัจจุบัน','ออกจากห้อง')) return;
  const ref = getRoomRef(); isLeaving = true;
  try {
    await ref.child(`players/${myId}`).onDisconnect().cancel();
    await ref.transaction(room => {
      if (!room) return;
      if (!room.players?.[myId]) return;
      delete room.players[myId];
      const remain = Object.keys(room.players);
      if (room.hostId === myId && remain.length) room.hostId = remain[0];
      room.lastActivityAt = serverTimestamp();
      return room;
    },undefined,false);
    resetToHome('ออกจากห้องแล้ว');
  } catch(err) { isLeaving = false; gameError(err); }
}
ui.headerLeaveBtn.addEventListener('click',leaveRoom);
ui.copyRoomBtn.addEventListener('click',async () => {
  if (!roomId) return;
  try { await navigator.clipboard.writeText(roomId); toast('คัดลอกรหัสห้องแล้ว','success'); }
  catch { toast(`รหัสห้อง: ${roomId}`); }
});
ui.closeRoomBtn.addEventListener('click',async () => {
  if (!isHost || !roomId) return;
  if (!await askConfirm('ลบห้องถาวร?', 'ผู้เล่นทุกคนจะถูกนำออกจากห้อง และคะแนนจะถูกลบ','ลบห้อง')) return;
  try { await getRoomRef().remove(); resetToHome('ลบห้องเรียบร้อยแล้ว'); }
  catch(err) { gameError(err); }
});
ui.backToLobbyBtn.addEventListener('click',async () => {
  if (!isHost) return;
  if (!await askConfirm('ปิดห้องและกลับหน้าแรก?', 'ผู้เล่นทุกคนจะออกจากเกมและข้อมูลคะแนนจะถูกลบ','ปิดห้อง')) return;
  try { await getRoomRef().remove(); resetToHome('ปิดห้องแล้ว'); } catch(err) { gameError(err); }
});

// -------------------------------------------------------------------------
// Realtime state เป็นแหล่งข้อมูลกลางของทุกเครื่อง
// -------------------------------------------------------------------------
function subscribeRoom() {
  if (!roomId) return;
  unsubscribeRoom();
  const id = roomId;
  syncRef = db.ref(`rooms/${id}`);
  syncHandler = snap => {
    if (id !== roomId || isLeaving) return;
    const state = snap.val();
    if (!state) { resetToHome('ห้องถูกปิดหรือไม่มีความเคลื่อนไหวนานเกิน 10 นาที'); return; }
    roomState = state;
    const players = state.players || {};
    const ids = Object.keys(players);
    if (ids.length && (!state.hostId || !players[state.hostId]) && !transferringHost) {
      transferringHost = true;
      syncRef.transaction(room => {
        if (!room) return;
        const current = Object.keys(room.players || {});
        if (current.length && !room.players[room.hostId]) {
          room.hostId = current[0]; room.lastActivityAt = serverTimestamp(); return room;
        }
      },undefined,false).catch(gameError).finally(() => { transferringHost = false; });
    }
    isHost = state.hostId === myId;
    renderRoom(state);
    if (isHost) {
      maybeAdvanceAbsentSpeaker(state);
      maybeFinishWhoAmI(state);
      maybeFinalizeVote(state);
    }
  };
  syncRef.on('value',syncHandler,gameError);
}
function renderRoom(state) {
  const players = state.players || {};
  const ids = Object.keys(players);
  const status = state.status || 'lobby';
  ui.roomStatusPill.textContent = ({lobby:'● รอเริ่ม',playing:'● กำลังเล่น',voting:'● กำลังโหวต',results:'● สรุปผล'})[status] || status;
  ui.roomCategoryBadge.textContent = `${gameModeName(state.gameMode)}  ·  ${getCurrentCategoryPack(state).name}  ·  ${state.settingValue || 2} ${state.gameMode === 'whoami_time' ? 'นาที' : 'รอบ'}`;
  ui.roomCode.textContent = roomId;
  setVisible(ui.lobbyArea,status === 'lobby');
  setVisible(ui.gameArea,status === 'playing' && state.gameMode === 'spyfall');
  setVisible(ui.whoAmIArea,status === 'playing' && state.gameMode !== 'spyfall');
  setVisible(ui.voteArea,status === 'voting' || status === 'results');
  setVisible(ui.scoreBoard,true);
  renderScores(state);
  if (status === 'lobby') {
    ui.lobbyHostName.textContent = players[state.hostId]?.name || 'กำลังเลือกหัวหน้าห้อง';
    ui.lobbyPlayerCount.textContent = `${ids.length} ผู้เล่น`;
    ui.playerList.replaceChildren();
    ids.forEach((id,index) => {
      const row = document.createElement('div'); row.className = 'player-row';
      row.innerHTML = `<div class="avatar">${index + 1}</div><span class="player-name">${escapeHTML(players[id].name)}${id === myId ? '<span class="you-tag">คุณ</span>' : ''}</span>${id === state.hostId ? '<span class="host-tag">👑 HOST</span>' : ''}`;
      ui.playerList.append(row);
    });
    setVisible(ui.startBtn,isHost); setVisible(ui.waitText,!isHost); setVisible(ui.closeRoomBtn,isHost);
    ui.startBtn.textContent = ids.length < (state.gameMode === 'spyfall' ? 3 : 2) ? `ต้องมีอย่างน้อย ${state.gameMode === 'spyfall' ? 3 : 2} คนถึงจะเริ่มได้` : 'เริ่มเกมเลย →';
    ui.startBtn.disabled = ids.length < (state.gameMode === 'spyfall' ? 3 : 2);
    ui.waitText.textContent = `กำลังรอหัวหน้าห้อง ${players[state.hostId]?.name || ''} เริ่มเกม…`;
  } else if (status === 'playing') {
    if (state.gameMode === 'spyfall') renderSpyfall(state);
    else renderWhoAmI(state);
  } else {
    stopTimer(); renderVoteOrResults(state);
  }
}
function renderScores(state) {
  const scores = state.scores || {};
  const players = state.players || {};
  const sorted = Object.keys(players).sort((a,b) => (scores[b] || 0) - (scores[a] || 0));
  ui.scoreListBody.replaceChildren();
  sorted.forEach((id,index) => {
    const row = document.createElement('div'); row.className = 'score-row';
    row.innerHTML = `<span class="rank-icon">${['🥇','🥈','🥉'][index] || `${index + 1}.`}</span><span class="score-name">${escapeHTML(players[id].name)}${id === myId ? ' (คุณ)' : ''}</span><span class="score-value">${scores[id] || 0} pts</span>`;
    ui.scoreListBody.append(row);
  });
}
function renderTurnOrder(element,order,players,currentIndex = -1) {
  element.replaceChildren();
  order.forEach((id,index) => {
    const chip = document.createElement('span'); chip.className = `turn-chip ${index === currentIndex ? 'active' : ''}`;
    chip.textContent = `${index+1}. ${players[id]?.name || 'ออกจากห้อง'}${id === myId ? ' (คุณ)' : ''}`;
    element.append(chip);
  });
}
function renderSpyfall(state) {
  stopTimer();
  const order = state.turnOrder || [];
  const index = state.currentTurnIndex || 0;
  const speaker = order[index];
  ui.heroName.textContent = state.roles?.[myId] || '—';
  ui.roundIndicator.textContent = `ROUND ${state.currentRound || 1} / ${state.totalRounds || 2}`;
  ui.currentSpeakerBox.textContent = speaker === myId ? 'ถึงตาคุณแล้ว! เล่าใบ้ได้เลย' : `กำลังรอ ${state.players?.[speaker]?.name || 'ผู้เล่น'} พูด…`;
  setVisible(ui.endTurnBtn,speaker === myId);
  renderTurnOrder(ui.fullTurnOrderContainer,order,state.players || {},index);
  const group = state.currentGroup;
  ui.heroGroupTitle.textContent = `คำในกลุ่ม: ${group || '—'}`;
  ui.heroGrid.replaceChildren();
  const list = getCurrentCategoryPack(state).groups[group] || [];
  for (const item of list) {
    const card = document.createElement('div'); card.className = 'hero-item'; card.textContent = item;
    ui.heroGrid.append(card);
  }
  setVisible(ui.hostControls,isHost);
}
function stopTimer() { if (timerInterval) clearInterval(timerInterval); timerInterval = null; }
function renderTimer(state) {
  stopTimer();
  function tick() {
    const left = Math.max(0,Math.ceil((Number(state.endTime || 0) - now())/1000));
    const mm = String(Math.floor(left/60)).padStart(2,'0');
    const ss = String(left % 60).padStart(2,'0');
    ui.whoAmITimer.textContent = `${mm}:${ss}`;
    if (left <= 0) { stopTimer(); if (isHost && roomState?.status === 'playing') maybeFinishWhoAmI(roomState); }
  }
  tick(); timerInterval = setInterval(tick,1000);
}
function renderWhoAmI(state) {
  const timed = state.gameMode === 'whoami_time';
  setVisible(ui.whoAmITimerContainer,timed); setVisible(ui.whoAmITurnBoxContainer,!timed);
  const order = state.turnOrder || [];
  const index = state.currentTurnIndex || 0;
  const speaker = order[index];
  ui.whoAmIRoundIndicator.textContent = `ROUND ${state.currentRound || 1} / ${state.totalRounds || 2}`;
  ui.whoAmICurrentSpeakerBox.textContent = speaker === myId ? 'ตาคุณแล้ว! ถามเพื่อนเลย' : `กำลังรอ ${state.players?.[speaker]?.name || 'ผู้เล่น'} ถาม…`;
  setVisible(ui.whoAmIEndTurnBtn,!timed && speaker === myId);
  renderTurnOrder(ui.whoAmIFullTurnOrderContainer,order,state.players || {},timed ? -1 : index);
  if (timed) renderTimer(state); else stopTimer();
  ui.othersRolesGrid.replaceChildren();
  for (const id of order) {
    if (id === myId || !state.players?.[id]) continue;
    const done = state.attempts?.[id] === 0;
    const correct = state.guessedCorrectly?.[id];
    const div = document.createElement('div'); div.className = `hero-item ${correct ? 'correct' : done ? 'wrong' : ''}`;
    div.innerHTML = `<strong>${escapeHTML(state.players[id].name)}</strong><em>${escapeHTML(state.roles?.[id] || '—')}</em>${done ? `<div>${correct ? '✓ ตอบถูก' : '✕ ตอบผิด'}</div>` : ''}`;
    ui.othersRolesGrid.append(div);
  }
  const done = state.attempts?.[myId] === 0;
  setVisible(ui.guessControlsDiv,!done);
  ui.guessStatusText.textContent = done ? state.guessedCorrectly?.[myId] ? 'เยี่ยมมาก! คุณตอบถูกแล้ว 🎉' : 'คุณใช้สิทธิ์ทายแล้ว รอลุ้นเพื่อนคนอื่น' : '🎯 ทายคำของคุณ (มีสิทธิ์เพียง 1 ครั้ง)';
  setVisible(ui.whoAmIHostControls,isHost);
}
function maybeAdvanceAbsentSpeaker(state) {
  if (autoAdvancing || state.status !== 'playing' || state.gameMode === 'whoami_time') return;
  const order = state.turnOrder || [];
  if (!order.length || state.players?.[order[state.currentTurnIndex || 0]]) return;
  autoAdvancing = true;
  getRoomRef().transaction(room => {
    if (!room || room.status !== 'playing' || room.players?.[room.turnOrder?.[room.currentTurnIndex || 0]]) return;
    advanceTurnData(room); room.lastActivityAt = serverTimestamp(); return room;
  },undefined,false).catch(gameError).finally(() => { autoAdvancing = false; });
}
function advanceTurnData(room) {
  const order = room.turnOrder || [];
  let index = room.currentTurnIndex || 0;
  let round = room.currentRound || 1;
  if (!order.length) { room.status = 'results'; return; }
  for (let n=0;n<order.length;n++) {
    index++;
    if (index >= order.length) { index = 0; round++; }
    if (round > (room.totalRounds || 2)) { room.status = room.gameMode === 'spyfall' ? 'voting' : 'results'; return; }
    if (room.players?.[order[index]]) { room.currentTurnIndex = index; room.currentRound = round; return; }
  }
  room.status = room.gameMode === 'spyfall' ? 'voting' : 'results';
}
async function advanceMyTurn(requiredMode) {
  const ref = getRoomRef(); if (!ref) return;
  try {
    const result = await ref.transaction(room => {
      if (!room || room.status !== 'playing' || (requiredMode === 'spyfall') !== (room.gameMode === 'spyfall')) return;
      if (room.turnOrder?.[room.currentTurnIndex || 0] !== myId) return;
      advanceTurnData(room); room.lastActivityAt = serverTimestamp(); return room;
    },undefined,false);
    if (!result.committed) toast('เทิร์นนี้ถูกเปลี่ยนไปแล้ว','error');
  } catch(err) { gameError(err); }
}
ui.endTurnBtn.addEventListener('click',() => advanceMyTurn('spyfall'));
ui.whoAmIEndTurnBtn.addEventListener('click',() => advanceMyTurn('whoami'));
async function changePhase(next) {
  if (!isHost) return;
  try {
    await getRoomRef().transaction(room => {
      if (!room || room.hostId !== myId || room.status !== 'playing') return;
      room.status = next; room.lastActivityAt = serverTimestamp(); return room;
    },undefined,false);
  } catch(err) { gameError(err); }
}
ui.skipToVoteBtn.addEventListener('click',async () => {
  if (await askConfirm('ข้ามไปหน้าโหวต?', 'ผู้เล่นจะหยุดพูดและเริ่มลงคะแนนทันที','เริ่มโหวต')) changePhase('voting');
});
ui.whoAmISkipBtn.addEventListener('click',async () => {
  if (await askConfirm('จบเกมตอนนี้?', 'เกมจะหยุดและไปหน้าสรุปคะแนนทันที','ดูคะแนน')) changePhase('results');
});
ui.startBtn.addEventListener('click',async () => {
  if (!isHost) return;
  ui.startBtn.disabled = true;
  try {
    const result = await getRoomRef().transaction(room => {
      if (!room || room.hostId !== myId || room.status !== 'lobby') return;
      const ids = Object.keys(room.players || {});
      const min = room.gameMode === 'spyfall' ? 3 : 2;
      if (ids.length < min) return;
      const order = shuffle(ids);
      const cat = getCurrentCategoryPack(room);
      if (!cat || !cat.groups) return;
      const roles = {};
      const attempts = {};
      let group = '', spyId = null;
      if (room.gameMode === 'spyfall') {
        const validGroups = Object.entries(cat.groups).filter(([,words]) => [...new Set(words)].length >= 2).map(([key]) => key);
        if (!validGroups.length) return;
        group = randomItem(validGroups);
        const candidates = shuffle([...new Set(cat.groups[group])]);
        const spyWord = candidates[0]; const commonWord = candidates[1];
        spyId = randomItem(ids);
        ids.forEach(id => { roles[id] = id === spyId ? spyWord : commonWord; });
      } else {
        const items = shuffle(getAllItems(room.category,cat));
        ids.forEach((id,index) => { roles[id] = items[index % items.length]; attempts[id] = 1; });
      }
      room.roles = roles; room.attempts = attempts; room.guessedCorrectly = {};
      room.correctOrder = []; room.turnOrder = order;
      room.currentTurnIndex = 0; room.currentRound = 1;
      room.totalRounds = room.settingValue || 2;
      room.endTime = room.gameMode === 'whoami_time' ? now() + room.settingValue * 60 * 1000 : null;
      room.currentGroup = group; room.spyId = spyId;
      room.votes = {}; room.tieCandidates = null; room.tieHandled = false;
      room.result = null; room.status = 'playing';
      room.gamesPlayed = (room.gamesPlayed || 0) + 1;
      room.lastActivityAt = serverTimestamp();
      return room;
    },undefined,false);
    if (result.committed) { selectedGuess = ''; ui.myGuessSearch.value = ''; ui.selectedGuessText.textContent = 'ยังไม่ได้เลือกคำตอบ'; selectedTargetId = ''; toast('เริ่มเกมแล้ว ขอให้สนุก!','success'); }
    else toast('ยังเริ่มเกมไม่ได้ กรุณาตรวจสอบจำนวนผู้เล่น','error');
  } catch(err) { gameError(err); }
  finally { ui.startBtn.disabled = false; }
});

// -------------------------------------------------------------------------
// Who Am I: คำไม่ซ้ำ และป้องกันตอบซ้ำ
// -------------------------------------------------------------------------
ui.myGuessSearch.addEventListener('input',() => {
  selectedGuess = '';
  ui.selectedGuessText.textContent = 'ยังไม่ได้เลือกคำตอบ';
  const query = ui.myGuessSearch.value.trim().toLocaleLowerCase();
  ui.searchResultsList.replaceChildren();
  if (!query || !roomState || !roomState.gameMode?.startsWith('whoami')) { setVisible(ui.searchResultsList,false); return; }
  const matches = getAllItems(roomState.category,getCurrentCategoryPack(roomState)).filter(item => item.toLocaleLowerCase().includes(query)).slice(0,12);
  for (const item of matches) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'search-option'; b.textContent = item;
    b.addEventListener('click',() => { selectedGuess = item; ui.myGuessSearch.value = item; ui.selectedGuessText.textContent = `✓ เลือก ${item}`; setVisible(ui.searchResultsList,false); });
    ui.searchResultsList.append(b);
  }
  setVisible(ui.searchResultsList,matches.length > 0);
});
ui.submitMyGuessBtn.addEventListener('click',async () => {
  if (!roomState || !roomState.gameMode?.startsWith('whoami')) return;
  const allItems = getAllItems(roomState.category,getCurrentCategoryPack(roomState));
  const input = (selectedGuess || ui.myGuessSearch.value.trim()).toLocaleLowerCase();
  const chosen = allItems.find(item => item.toLocaleLowerCase() === input);
  if (!chosen) { toast('กรุณาเลือกคำตอบจากรายชื่อที่มี','error'); return; }
  if (!await askConfirm('ยืนยันคำตอบนี้?', `คุณเลือก “${chosen}” และมีสิทธิ์ทายได้เพียง 1 ครั้ง`,'ส่งคำตอบ')) return;
  ui.submitMyGuessBtn.disabled = true;
  try {
    const result = await getRoomRef().transaction(room => {
      if (!room || room.status !== 'playing' || !room.gameMode?.startsWith('whoami') || !room.players?.[myId] || room.attempts?.[myId] !== 1) return;
      const correct = chosen.toLocaleLowerCase() === String(room.roles?.[myId] || '').toLocaleLowerCase();
      room.attempts[myId] = 0;
      room.guessedCorrectly ||= {};
      room.guessedCorrectly[myId] = correct;
      if (correct) {
        room.correctOrder ||= [];
        const rank = room.correctOrder.length;
        room.correctOrder.push(myId);
        room.scores ||= {};
        room.scores[myId] = (room.scores[myId] || 0) + Math.max(1,Object.keys(room.players).length - rank);
      }
      room.lastActivityAt = serverTimestamp();
      const ids = Object.keys(room.players);
      if (ids.length && ids.every(id => room.attempts?.[id] === 0)) room.status = 'results';
      return room;
    },undefined,false);
    if (!result.committed) toast('ส่งคำตอบไม่ได้ หรือคุณใช้สิทธิ์ไปแล้ว','error');
    else if (result.snapshot.val()?.guessedCorrectly?.[myId]) toast('ตอบถูก! ได้รับคะแนนแล้ว 🎉','success');
    else toast(`ยังไม่ถูก คำตอบคือ ${result.snapshot.val()?.roles?.[myId] || '—'}`,'error');
  } catch(err) { gameError(err); }
  finally { ui.submitMyGuessBtn.disabled = false; }
});
function maybeFinishWhoAmI(state) {
  if (autoFinalizing || state.status !== 'playing' || !state.gameMode?.startsWith('whoami')) return;
  const ids = Object.keys(state.players || {});
  const allDone = ids.length && ids.every(id => state.attempts?.[id] === 0);
  const timeUp = state.gameMode === 'whoami_time' && Number(state.endTime) <= now();
  if (!allDone && !timeUp) return;
  autoFinalizing = true;
  getRoomRef().transaction(room => {
    if (!room || room.status !== 'playing' || room.hostId !== myId) return;
    const living = Object.keys(room.players || {});
    const finished = living.length && living.every(id => room.attempts?.[id] === 0);
    if (!finished && !(room.gameMode === 'whoami_time' && Number(room.endTime) <= now())) return;
    room.status = 'results'; room.lastActivityAt = serverTimestamp(); return room;
  },undefined,false).catch(gameError).finally(() => { autoFinalizing = false; });
}

// -------------------------------------------------------------------------
// Spyfall: โหวตและสรุปคะแนน
// -------------------------------------------------------------------------
function renderVoteOrResults(state) {
  const isSpyfall = state.gameMode === 'spyfall';
  const resultMode = state.status === 'results';
  setVisible(ui.voteList,isSpyfall && !resultMode);
  setVisible(ui.voteResult,resultMode);
  setVisible(ui.hostPostVoteControls,resultMode && isHost);
  if (!isSpyfall) {
    ui.voteAreaTitle.textContent = '🏆 สรุปคะแนนเกมนี้';
    ui.voteInstruction.textContent = 'คะแนนสะสมของทุกคนในห้อง — เล่นต่อได้โดยไม่ต้องสร้างห้องใหม่';
    renderWhoAmIResult(state); return;
  }
  if (resultMode) {
    ui.voteAreaTitle.textContent = '🏆 ผลการแข่งขัน';
    ui.voteInstruction.textContent = 'เปิดเผยสายลับและคะแนนที่ได้รับ';
    renderSpyfallResult(state); return;
  }
  ui.voteAreaTitle.textContent = state.tieCandidates ? '🗳️ รอบตัดสิน' : '🗳️ ใครคือสายลับ?';
  const votes = state.votes || {};
  const players = state.players || {};
  const ids = Object.keys(players);
  const myVote = votes[myId];
  const voted = ids.filter(id => votes[id]).length;
  ui.voteInstruction.textContent = myVote ? `ส่งคะแนนแล้ว (${voted}/${ids.length}) กำลังรอคนอื่น…` : state.tieCandidates ? 'คะแนนเสมอ! เลือกใหม่เฉพาะผู้ที่มีคะแนนสูงสุด (หากเสมออีก Spy ชนะ)' : `เลือกผู้ที่น่าสงสัยที่สุด · โหวตแล้ว ${voted}/${ids.length} คน`;
  ui.voteList.replaceChildren();
  if (myVote) {
    const done = document.createElement('div'); done.className = 'info-note'; done.textContent = `✓ โหวต ${players[myVote]?.name || 'ผู้เล่น'} แล้ว รอเพื่อนโหวตให้ครบ`;
    ui.voteList.append(done); return;
  }
  const candidates = state.tieCandidates || ids;
  if (selectedTargetId && !candidates.includes(selectedTargetId)) selectedTargetId = '';
  candidates.filter(id => id !== myId && players[id]).forEach(id => {
    const b = document.createElement('button'); b.type = 'button';
    b.className = `vote-choice ${selectedTargetId === id ? 'selected' : ''}`;
    b.innerHTML = `<span>👤 ${escapeHTML(players[id].name)}</span><span>${selectedTargetId === id ? '✓ เลือกแล้ว' : 'เลือก →'}</span>`;
    b.addEventListener('click',() => { selectedTargetId = id; renderVoteOrResults(state); });
    ui.voteList.append(b);
  });
  if (!candidates.some(id => id !== myId && players[id])) {
    ui.voteList.innerHTML = '<p class="info-note">รอระบบสรุปผลการโหวต…</p>';
    return;
  }
  if (selectedTargetId) {
    const confirmButton = document.createElement('button');
    confirmButton.type = 'button'; confirmButton.className = 'btn btn-primary btn-wide';
    confirmButton.textContent = `ยืนยันโหวต ${players[selectedTargetId]?.name || ''}`;
    confirmButton.addEventListener('click',submitVote);
    ui.voteList.append(confirmButton);
  }
}
async function submitVote() {
  if (!selectedTargetId || !roomState) return;
  const target = selectedTargetId;
  try {
    const result = await getRoomRef().transaction(room => {
      const candidates = room?.tieCandidates || Object.keys(room?.players || {});
      if (!room || room.status !== 'voting' || !room.players?.[myId] || !room.players?.[target] || target === myId || !candidates.includes(target)) return;
      room.votes ||= {};
      if (room.votes[myId]) return;
      room.votes[myId] = target;
      room.lastActivityAt = serverTimestamp();
      return room;
    },undefined,false);
    if (result.committed) toast('ส่งคะแนนโหวตแล้ว','success');
    else toast('ไม่สามารถโหวตซ้ำได้ หรือช่วงโหวตสิ้นสุดแล้ว','error');
  } catch(err) { gameError(err); }
}
function maybeFinalizeVote(state) {
  if (autoFinalizing || state.status !== 'voting' || !isHost) return;
  const ids = Object.keys(state.players || {});
  if (!ids.length || !ids.every(id => state.votes?.[id])) return;
  autoFinalizing = true;
  getRoomRef().transaction(room => {
    if (!room || room.status !== 'voting' || room.hostId !== myId) return;
    const living = Object.keys(room.players || {});
    if (!living.length || !living.every(id => room.votes?.[id])) return;
    const counts = {};
    living.forEach(id => { const target = room.votes[id]; if (room.players[target]) counts[target] = (counts[target] || 0) + 1; });
    const highest = Math.max(0,...Object.values(counts));
    const top = Object.keys(counts).filter(id => counts[id] === highest);
    if (top.length > 1 && !room.tieHandled) {
      room.tieHandled = true; room.tieCandidates = top; room.votes = {};
      room.lastActivityAt = serverTimestamp(); return room;
    }
    const tieFinal = top.length > 1;
    const pickedId = tieFinal ? null : top[0];
    const caught = !tieFinal && pickedId === room.spyId;
    room.scores ||= {};
    if (caught) {
      living.forEach(id => { if (id !== room.spyId) room.scores[id] = (room.scores[id] || 0) + 1; });
    } else if (room.spyId) room.scores[room.spyId] = (room.scores[room.spyId] || 0) + 2;
    room.result = {pickedId:pickedId || null,spyId:room.spyId,caught,tieFinal};
    room.status = 'results'; room.lastActivityAt = serverTimestamp();
    return room;
  },undefined,false).catch(gameError).finally(() => { autoFinalizing = false; });
}
function renderSpyfallResult(state) {
  const r = state.result || {};
  const spyName = escapeHTML(state.players?.[state.spyId]?.name || 'ผู้เล่นที่ออกไปแล้ว');
  const spyWord = escapeHTML(state.roles?.[state.spyId] || '—');
  const picked = escapeHTML(state.players?.[r.pickedId]?.name || 'ไม่มีผู้ชนะโหวต');
  ui.voteResult.innerHTML = `<h3>${r.caught ? '🎉 ทีมผู้เล่นจับสายลับสำเร็จ!' : '🕶️ สายลับชนะเกมนี้!'}</h3><p class="${r.caught ? 'success' : 'failure'}">${r.caught ? 'ผู้เล่นที่ไม่ใช่ Spy ได้ +1 คะแนน' : 'Spy ได้ +2 คะแนน'}</p><p>${r.tieFinal ? 'ผลโหวตเสมอกันอีกครั้ง → Spy ชนะตามกติกา' : `ผู้ที่ได้รับคะแนนโหวตสูงสุด: <strong>${picked}</strong>`}</p><p>สายลับคือ <strong>${spyName}</strong> · คำของ Spy: <strong>${spyWord}</strong></p>`;
}
function renderWhoAmIResult(state) {
  const scores = state.scores || {};
  const ids = Object.keys(state.players || {}).sort((a,b) => (scores[b] || 0) - (scores[a] || 0));
  ui.voteResult.innerHTML = `<h3>คะแนนรวมประจำห้อง</h3>${ids.map((id,index) => `<p><strong>${['🥇','🥈','🥉'][index] || `${index+1}.`} ${escapeHTML(state.players[id].name)}</strong> · ${scores[id] || 0} คะแนน</p>`).join('')}`;
}
ui.nextRoundBtn.addEventListener('click',async () => {
  if (!isHost) return;
  try {
    const res = await getRoomRef().transaction(room => {
      if (!room || room.hostId !== myId || room.status !== 'results') return;
      room.status = 'lobby'; room.roles = null; room.spyId = null; room.currentGroup = null;
      room.attempts = {}; room.guessedCorrectly = {}; room.correctOrder = [];
      room.votes = {}; room.tieCandidates = null; room.tieHandled = false; room.result = null;
      room.turnOrder = []; room.currentTurnIndex = 0; room.currentRound = 1; room.endTime = null;
      room.lastActivityAt = serverTimestamp();
      return room;
    },undefined,false);
    if (res.committed) { selectedTargetId = ''; selectedGuess = ''; ui.myGuessSearch.value = ''; ui.selectedGuessText.textContent = 'ยังไม่ได้เลือกคำตอบ'; toast('กลับสู่ล็อบบี้แล้ว เริ่มรอบใหม่ได้เลย','success'); }
  } catch(err) { gameError(err); }
});

// กู้ห้องเดิมเมื่อรีเฟรชหน้า
if (roomId) {
  ui.roomTitle.textContent = `ห้อง ${roomId}`;
  ui.roomCode.textContent = roomId;
  setVisible(ui.headerLeaveBtn,true);
  showView('roomContent');
  rejoinIfConnected();
} else showView('roomSelection');
