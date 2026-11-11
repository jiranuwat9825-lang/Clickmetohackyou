// --- ตั้งค่า Firebase ---
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

const defaultCategoriesData = {
    "rov": {
        name: "ROV",
        mode: "both",
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
        mode: "both",
        groups: {
            "Duelist": ["Hush", "Iso", "Jett", "Neon", "Phoenix", "Raze", "Reyna", "Waylay", "Yoru"],
            "Controller": ["Astra", "Brimstone", "Clove", "Harbor", "Miks", "Omen", "Viper"],
            "Initiator": ["Breach", "Fade", "Gekko", "KAY/O", "Skye", "Sova", "Tejo"],
            "Sentinel": ["Chamber", "Cypher", "Deadlock", "Killjoy", "Sage", "Veto", "Vyse"]
        }
    }
};

let allCategoriesData = JSON.parse(JSON.stringify(defaultCategoriesData));

const roomSelection = document.getElementById('roomSelection');
const createRoomModal = document.getElementById('createRoomModal');
const categoryManagerModal = document.getElementById('categoryManagerModal');
const lobbyArea = document.getElementById('lobbyArea');
const gameArea = document.getElementById('gameArea');
const whoAmIArea = document.getElementById('whoAmIArea');
const voteArea = document.getElementById('voteArea');

const nameInput = document.getElementById('nameInput');
const showCreateModalBtn = document.getElementById('showCreateModalBtn');
const openCategoryManagerBtn = document.getElementById('openCategoryManagerBtn');
const closeCategoryManagerBtn = document.getElementById('closeCategoryManagerBtn');

const manageCatSelect = document.getElementById('manageCatSelect');
const editCatNameInput = document.getElementById('editCatNameInput');
const editCatGameMode = document.getElementById('editCatGameMode');
const groupsEditorContainer = document.getElementById('groupsEditorContainer');
const addGroupBtn = document.getElementById('addGroupBtn');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');
const deleteCategoryBtn = document.getElementById('deleteCategoryBtn');

const backToHomeBtn = document.getElementById('backToHomeBtn');
const newRoomInput = document.getElementById('newRoomInput');
const gameModeSelect = document.getElementById('gameModeSelect');
const categorySelect = document.getElementById('categorySelect');
const settingValueInput = document.getElementById('settingValueInput');
const roundOrTimeLabel = document.getElementById('roundOrTimeLabel');
const confirmCreateBtn = document.getElementById('confirmCreateBtn');
const activeRoomsList = document.getElementById('activeRoomsList');

const hostSettingsBox = document.getElementById('hostSettingsBox');
const lobbyGameModeSelect = document.getElementById('lobbyGameModeSelect');
const lobbyCategorySelect = document.getElementById('lobbyCategorySelect');
const lobbySettingValueInput = document.getElementById('lobbySettingValueInput');

const roomTitle = document.getElementById('roomTitle');
const roomCategoryBadge = document.getElementById('roomCategoryBadge');
const playerList = document.getElementById('playerList');
const startBtn = document.getElementById('startBtn');
const waitText = document.getElementById('waitText');
const closeRoomBtn = document.getElementById('closeRoomBtn');

const heroName = document.getElementById('heroName');
const heroGrid = document.getElementById('heroGrid');
const roundIndicator = document.getElementById('roundIndicator');
const currentSpeakerBox = document.getElementById('currentSpeakerBox');
const endTurnBtn = document.getElementById('endTurnBtn');
const fullTurnOrderContainer = document.getElementById('fullTurnOrderContainer');
const hostControls = document.getElementById('hostControls');
const skipToVoteBtn = document.getElementById('skipToVoteBtn');

const whoAmITimer = document.getElementById('whoAmITimer');
const othersRolesGrid = document.getElementById('othersRolesGrid');
const myGuessSearch = document.getElementById('myGuessSearch');
const searchResultsList = document.getElementById('searchResultsList');
const selectedGuessText = document.getElementById('selectedGuessText');
const submitMyGuessBtn = document.getElementById('submitMyGuessBtn');
const guessControlsDiv = document.getElementById('guessControlsDiv');
const guessStatusText = document.getElementById('guessStatusText');
const whoAmIHostControls = document.getElementById('whoAmIHostControls');
const whoAmISkipBtn = document.getElementById('whoAmISkipBtn');

const voteAreaTitle = document.getElementById('voteAreaTitle');
const voteList = document.getElementById('voteList');
const voteResult = document.getElementById('voteResult');
const scoreBoard = document.getElementById('scoreBoard');
const scoreListBody = document.getElementById('scoreListBody');
const hostPostVoteControls = document.getElementById('hostPostVoteControls');
const nextRoundBtn = document.getElementById('nextRoundBtn');
const backToLobbyBtn = document.getElementById('backToLobbyBtn');
const voteInstruction = document.getElementById('voteInstruction');

let myName = '';
let roomId = '';
let whoAmITimerInterval = null;
let selectedSearchGuess = "";

let myId = localStorage.getItem('rov_spy_myid');
if (!myId) {
    myId = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('rov_spy_myid', myId);
}

const savedName = localStorage.getItem('rov_spy_myname');
if (savedName) {
    nameInput.value = savedName;
}

// โหลดข้อมูลหมวดหมู่จาก Firebase และซิงค์รวมกับค่าเริ่มต้นเสมอ
db.ref('customCategories').on('value', (snapshot) => {
    const custom = snapshot.val() || {};
    allCategoriesData = { ...defaultCategoriesData, ...custom };
    updateCategoryDropdowns();
    updateManageCatDropdown();
});

function updateCategoryDropdowns() {
    let mode = 'both';
    if (lobbyArea.style.display !== 'none' && lobbyGameModeSelect) {
        mode = lobbyGameModeSelect.value;
    } else if (createRoomModal.style.display !== 'none' && gameModeSelect) {
        mode = gameModeSelect.value;
    }

    [categorySelect, lobbyCategorySelect].forEach(selectEl => {
        if (!selectEl) return;
        const currentVal = selectEl.value;
        selectEl.innerHTML = '';
        
        let addedCount = 0;
        Object.keys(allCategoriesData).forEach(key => {
            const cat = allCategoriesData[key];
            if (cat && (cat.mode === 'both' || mode === 'both' || cat.mode === mode)) {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = cat.name;
                selectEl.appendChild(opt);
                addedCount++;
            }
        });

        if (addedCount === 0) {
            Object.keys(allCategoriesData).forEach(key => {
                const cat = allCategoriesData[key];
                if (cat) {
                    const opt = document.createElement('option');
                    opt.value = key;
                    opt.textContent = cat.name;
                    selectEl.appendChild(opt);
                }
            });
        }

        if (currentVal && selectEl.querySelector(`option[value="${currentVal}"]`)) {
            selectEl.value = currentVal;
        }
    });
}

function updateManageCatDropdown() {
    const currentVal = manageCatSelect.value;
    manageCatSelect.innerHTML = `<option value="new">➕ สร้างหมวดหมู่ใหม่...</option>`;
    Object.keys(allCategoriesData).forEach(key => {
        const cat = allCategoriesData[key];
        if (cat) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = cat.name;
            manageCatSelect.appendChild(opt);
        }
    });
    if (currentVal && manageCatSelect.querySelector(`option[value="${currentVal}"]`)) {
        manageCatSelect.value = currentVal;
    }
}

manageCatSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    groupsEditorContainer.innerHTML = '';
    if (val === 'new') {
        editCatNameInput.value = '';
        editCatGameMode.value = 'both';
        deleteCategoryBtn.style.display = 'none';
        addGroupRow("เลนที่ 1", "");
    } else {
        const cat = allCategoriesData[val];
        if (!cat) return;
        editCatNameInput.value = cat.name;
        editCatGameMode.value = cat.mode || 'both';
        deleteCategoryBtn.style.display = 'block';

        const groups = cat.groups || {};
        Object.keys(groups).forEach(gName => {
            const itemsArr = Array.isArray(groups[gName]) ? groups[gName] : [];
            addGroupRow(gName, itemsArr.join(', '));
        });
    }
});

function addGroupRow(groupName = "", itemsText = "") {
    const row = document.createElement('div');
    row.className = 'group-row';
    row.style.cssText = "background: rgba(15, 23, 42, 0.8); padding: 8px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.2); display: flex; flex-direction: column; gap: 4px;";
    
    row.innerHTML = `
        <div style="display: flex; gap: 4px;">
            <input type="text" class="group-name-input category-select" placeholder="ชื่อเลน/กลุ่ม (เช่น ป่า, แครี่)" value="${groupName}" style="flex: 2; text-align: left; padding: 5px 8px; min-width: 0;">
            <button type="button" class="remove-group-btn join-room-tab-btn" style="background: #ef4444; flex: 0.5;">ลบ</button>
        </div>
        <textarea class="group-items-textarea category-select" placeholder="รายชื่อตัวละคร คั่นด้วยจุลภาค (,)" style="height: 55px; text-align: left; padding: 6px; font-size: 0.8rem; min-width: 0;">${itemsText}</textarea>
    `;

    row.querySelector('.remove-group-btn').onclick = () => {
        row.remove();
    };

    groupsEditorContainer.appendChild(row);
}

addGroupBtn.onclick = () => {
    addGroupRow("เลนใหม่", "");
};

// ปุ่มบันทึกหมวดหมู่ (ดึงข้อมูลจากคลาส .group-row โดยตรง)
saveCategoryBtn.onclick = () => {
    const catName = editCatNameInput.value.trim();
    const gMode = editCatGameMode.value;
    const selectedKey = manageCatSelect.value;

    if (!catName) {
        alert('กรุณากรอกชื่อหมวดหมู่!');
        return;
    }

    const groupRows = groupsEditorContainer.querySelectorAll('.group-row');
    if (groupRows.length === 0) {
        alert('กรุณาเพิ่มเลนหรือกลุ่มย่อยอย่างน้อย 1 กลุ่ม!');
        return;
    }

    let groupsObj = {};
    let isValid = true;

    groupRows.forEach(row => {
        const nameInputEl = row.querySelector('.group-name-input');
        const itemsTextEl = row.querySelector('.group-items-textarea');
        if (!nameInputEl || !itemsTextEl) return;

        const gName = nameInputEl.value.trim();
        const rawItems = itemsTextEl.value.trim();
        if (!gName || !rawItems) {
            isValid = false;
            return;
        }
        const itemsArr = rawItems.split(/[\n,]+/).map(i => i.trim()).filter(i => i.length > 0);
        groupsObj[gName] = itemsArr;
    });

    if (!isValid) {
        alert('กรุณากรอกชื่อเลนและรายชื่อตัวละครให้ครบถ้วนทุกกลุ่ม!');
        return;
    }

    let catKey = selectedKey;
    if (selectedKey === 'new') {
        catKey = 'cat_' + Date.now();
    }

    const catData = {
        name: catName,
        mode: gMode,
        groups: groupsObj
    };

    db.ref(`customCategories/${catKey}`).set(catData).then(() => {
        alert('✔️ บันทึกหมวดหมู่เรียบร้อยแล้ว!');
        categoryManagerModal.style.display = 'none';
        roomSelection.style.display = 'flex';
    }).catch((error) => {
        alert('❌ เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    });
};

deleteCategoryBtn.onclick = () => {
    const selectedKey = manageCatSelect.value;
    if (selectedKey === 'new') return;
    
    if (confirm('คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่?')) {
        db.ref(`customCategories/${selectedKey}`).remove().then(() => {
            alert('🗑️ ลบหมวดหมู่สำเร็จ');
            manageCatSelect.value = 'new';
            manageCatSelect.dispatchEvent(new Event('change'));
        });
    }
};

openCategoryManagerBtn.addEventListener('click', () => {
    roomSelection.style.display = 'none';
    categoryManagerModal.style.display = 'flex';
    manageCatSelect.value = 'new';
    manageCatSelect.dispatchEvent(new Event('change'));
});

closeCategoryManagerBtn.addEventListener('click', () => {
    categoryManagerModal.style.display = 'none';
    roomSelection.style.display = 'flex';
});

gameModeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'whoami') {
        roundOrTimeLabel.textContent = '⏱️ เวลาจำกัด (นาที):';
        settingValueInput.value = '3';
    } else {
        roundOrTimeLabel.textContent = '🔄 จำนวนรอบการพูด:';
        settingValueInput.value = '2';
    }
    updateCategoryDropdowns();
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        db.goOnline();
        if (roomId && myId) {
            db.ref(`rooms/${roomId}`).once('value', (snap) => {
                if (!snap.val()) {
                    localStorage.removeItem('rov_spy_roomid');
                    location.reload();
                } else {
                    db.ref(`rooms/${roomId}/players/${myId}`).set({ name: myName || savedName || "ผู้เล่น" });
                    db.ref(`rooms/${roomId}/players/${myId}`).onDisconnect().remove();
                }
            });
        }
    }
});

const savedRoomId = localStorage.getItem('rov_spy_roomid');
if (savedRoomId) {
    roomId = savedRoomId;
    myName = savedName || "ผู้เล่น";
    
    db.ref(`rooms/${roomId}`).once('value', (snapshot) => {
        const roomData = snapshot.val();
        if (roomData) {
            roomSelection.style.display = 'none';
            if (roomData.status === 'playing') {
                if (roomData.gameMode === 'whoami') whoAmIArea.style.display = 'block';
                else gameArea.style.display = 'block';
            } else if (roomData.status === 'voting') {
                voteArea.style.display = 'block';
            } else {
                lobbyArea.style.display = 'block';
                roomTitle.textContent = `ห้อง: ${roomId}`;
            }
            
            db.ref(`rooms/${roomId}/players/${myId}`).set({ name: myName });
            db.ref(`rooms/${roomId}/players/${myId}`).onDisconnect().remove();

            checkHostAndListen();
            listenGameState();
        } else {
            localStorage.removeItem('rov_spy_roomid');
        }
    });
}

let isHost = false;
let selectedVoteTarget = null;
let selectedHeroGuess = "";

function getCategoryData(key) {
    return allCategoriesData[key] || Object.values(allCategoriesData)[0] || { name: "ทั่วไป", groups: {} };
}

function getAllCategoryItems(key) {
    const cat = getCategoryData(key);
    if (!cat || !cat.groups) return [];
    return Object.values(cat.groups).flat();
}

showCreateModalBtn.addEventListener('click', () => {
    myName = nameInput.value.trim();
    if (!myName) {
        alert('กรุณากรอกชื่อเล่นของคุณก่อน!');
        nameInput.focus();
        return;
    }
    localStorage.setItem('rov_spy_myname', myName);
    roomSelection.style.display = 'none';
    createRoomModal.style.display = 'flex';
    updateCategoryDropdowns();
});

backToHomeBtn.addEventListener('click', () => {
    createRoomModal.style.display = 'none';
    roomSelection.style.display = 'flex';
});

db.ref('rooms').on('value', (snapshot) => {
    const rooms = snapshot.val();
    activeRoomsList.innerHTML = '';

    if (!rooms || Object.keys(rooms).length === 0) {
        activeRoomsList.innerHTML = `<p class="no-room-text">ยังไม่มีห้องที่เปิดอยู่ กดสร้างห้องใหม่ด้านบนได้เลย!</p>`;
        return;
    }

    Object.keys(rooms).forEach(rId => {
        const rData = rooms[rId];
        const rStatus = rData.status || 'lobby';
        const pCount = rData.players ? Object.keys(rData.players).length : 0;
        const mode = rData.gameMode === 'whoami' ? '❓ ฉันคือใคร' : '🕵️ Spyfall';

        const card = document.createElement('div');
        card.className = 'room-item-card';

        let statusText = '⏳ รอผู้เล่น';
        let canJoin = true;

        if (rStatus === 'playing') {
            statusText = '🎮 กำลังเล่น';
            canJoin = false;
        } else if (rStatus === 'voting') {
            statusText = '🗳️ สรุปผล';
            canJoin = false;
        }

        if (pCount === 0) {
            if (!rData.emptySince) {
                db.ref(`rooms/${rId}/emptySince`).set(Date.now());
            } else {
                const elapsed = Date.now() - rData.emptySince;
                const timeLeft = Math.max(0, Math.ceil((60000 - elapsed) / 1000));
                if (timeLeft <= 0) {
                    db.ref(`rooms/${rId}`).remove();
                    return;
                }
                statusText = `⚠️ ห้องร้าง (ลบใน ${timeLeft}s)`;
            }
        }

        card.innerHTML = `
            <div class="room-item-info">
                <span class="room-item-name">🏠 ห้อง: ${rId} (${pCount} คน)</span>
                <span class="room-item-status" ${pCount === 0 ? 'style="color:#fbbf24;"' : ''}>${mode} | ${statusText}</span>
            </div>
        `;

        const btn = document.createElement('button');
        btn.className = 'join-room-tab-btn';
        btn.textContent = canJoin ? 'เข้าร่วม' : 'ติดเล่น';
        btn.disabled = !canJoin;

        if (canJoin) {
            btn.addEventListener('click', () => {
                myName = nameInput.value.trim();
                if (!myName) {
                    alert('กรุณากรอกชื่อเล่นของคุณก่อน!');
                    nameInput.focus();
                    return;
                }
                localStorage.setItem('rov_spy_myname', myName);
                joinExistingRoom(rId);
            });
        }

        card.appendChild(btn);
        activeRoomsList.appendChild(card);
    });
});

confirmCreateBtn.addEventListener('click', () => {
    roomId = newRoomInput.value.trim();
    const gameMode = gameModeSelect.value;
    const selectedCategory = categorySelect.value;
    const settingVal = parseInt(settingValueInput.value) || (gameMode === 'whoami' ? 3 : 2);

    if (!roomId) {
        alert('กรุณากรอกชื่อห้อง');
        return;
    }

    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.once('value', (snapshot) => {
        if (snapshot.val()) {
            alert('❌ ชื่อห้องนี้มีอยู่แล้ว');
            return;
        }

        createRoomModal.style.display = 'none';
        lobbyArea.style.display = 'block';
        roomTitle.textContent = `ห้อง: ${roomId}`;

        roomRef.set({
            hostId: myId,
            gameMode: gameMode,
            category: selectedCategory,
            settingValue: settingVal,
            status: 'lobby',
            emptySince: null
        });

        roomRef.child(`players/${myId}`).set({ name: myName });
        roomRef.child(`players/${myId}`).onDisconnect().remove();

        localStorage.setItem('rov_spy_roomid', roomId);
        checkHostAndListen();
        listenGameState();
    });
});

function joinExistingRoom(targetRoomId) {
    roomId = targetRoomId;
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.once('value', (snapshot) => {
        const roomData = snapshot.val();
        if (!roomData) { alert('❌ ไม่พบห้องนี้'); return; }
        if (roomData.status && roomData.status !== 'lobby') {
            alert('❌ ห้องนี้กำลังเล่นอยู่!');
            return;
        }

        roomSelection.style.display = 'none';
        lobbyArea.style.display = 'block';
        roomTitle.textContent = `ห้อง: ${roomId}`;

        roomRef.child(`players/${myId}`).set({ name: myName });
        roomRef.child(`players/${myId}`).onDisconnect().remove();
        roomRef.update({ emptySince: null });

        localStorage.setItem('rov_spy_roomid', roomId);
        checkHostAndListen();
        listenGameState();
    });
}

lobbyGameModeSelect.addEventListener('change', (e) => {
    if (!isHost || !roomId) return;
    const mode = e.target.value;
    db.ref(`rooms/${roomId}/gameMode`).set(mode);
    const defaultVal = mode === 'whoami' ? 3 : 2;
    db.ref(`rooms/${roomId}/settingValue`).set(defaultVal);
    updateCategoryDropdowns();
});
lobbyCategorySelect.addEventListener('change', (e) => {
    if (!isHost || !roomId) return;
    db.ref(`rooms/${roomId}/category`).set(e.target.value);
});
lobbySettingValueInput.addEventListener('change', (e) => {
    if (!isHost || !roomId) return;
    db.ref(`rooms/${roomId}/settingValue`).set(parseInt(e.target.value) || 2);
});

closeRoomBtn.addEventListener('click', () => {
    if (!roomId) return;
    if (confirm('คุณต้องการปิดห้องใช่หรือไม่?')) {
        db.ref(`rooms/${roomId}`).remove();
        localStorage.removeItem('rov_spy_roomid');
        location.reload();
    }
});

function checkHostAndListen() {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) { 
            alert('ห้องถูกปิดหรือถูกลบเนื่องจากไม่มีผู้เล่น'); 
            localStorage.removeItem('rov_spy_roomid');
            location.reload(); 
            return; 
        }

        const players = data.players || {};
        const playerIds = Object.keys(players);
        
        if (playerIds.length === 0) {
            if (!data.emptySince) {
                roomRef.update({ emptySince: Date.now() });
            } else if (Date.now() - data.emptySince > 60000) {
                roomRef.remove();
            }
        } else if (data.emptySince) {
            roomRef.update({ emptySince: null });
        }

        playerList.innerHTML = '';
        const hostId = data.hostId;
        const mode = data.gameMode || 'spyfall';
        const catKey = data.category || 'rov';
        const setVal = data.settingValue || (mode === 'whoami' ? 3 : 2);
        
        updateCategoryDropdowns();

        const catInfo = getCategoryData(catKey);

        roomCategoryBadge.textContent = `โหมด: ${mode === 'whoami' ? 'ฉันคือใคร' : 'Spyfall'} | หมวด: ${catInfo ? catInfo.name : 'ทั่วไป'} | ${mode === 'whoami' ? 'เวลา: ' + setVal + ' นาที' : 'รอบ: ' + setVal}`;
        lobbyGameModeSelect.value = mode;
        lobbyCategorySelect.value = catKey;
        lobbySettingValueInput.value = setVal;
        
        if (lobbySettingValueInput.previousElementSibling) {
            lobbySettingValueInput.previousElementSibling.textContent = mode === 'whoami' ? '⏱️ เวลาจำกัด (นาที):' : '🔄 จำนวนรอบการพูด:';
        }

        if (hostId === myId) {
            isHost = true;
            startBtn.style.display = 'block';
            waitText.style.display = 'none';
            hostSettingsBox.style.display = 'block';
            closeRoomBtn.style.display = 'block';
        } else {
            isHost = false;
            startBtn.style.display = 'none';
            waitText.style.display = 'block';
            hostSettingsBox.style.display = 'none';
            closeRoomBtn.style.display = 'none';
        }

        playerIds.forEach((id) => {
            const li = document.createElement('li');
            const isMe = (id === myId);
            const isThisHost = (id === hostId);
            li.innerHTML = `👤 ${players[id].name} ${isMe ? '<b style="color:#22c55e;">(you)</b>' : ''} ${isThisHost ? '<span style="color:#38bdf8; font-size:0.8rem; margin-left:auto;">(หัวหน้าห้อง)</span>' : ''}`;
            playerList.appendChild(li);
        });
    });
}

// เริ่มเกม (สุ่มใหม่ทุกตา)
startBtn.addEventListener('click', () => {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.once('value', (snapshot) => {
        const data = snapshot.val();
        const players = data.players || {};
        const playerIds = Object.keys(players);
        const gameMode = data.gameMode || 'spyfall';
        const catKey = data.category || 'rov';
        const catData = getCategoryData(catKey);
        const setVal = data.settingValue || (gameMode === 'whoami' ? 3 : 2);

        const minPlayers = gameMode === 'whoami' ? 2 : 3;
        if (playerIds.length < minPlayers) {
            alert(`โหมดนี้ต้องมีผู้เล่นอย่างน้อย ${minPlayers} คนขึ้นไป!`);
            return;
        }

        let shuffledPlayerIds = [...playerIds];
        for (let i = shuffledPlayerIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPlayerIds[i], shuffledPlayerIds[j]] = [shuffledPlayerIds[j], shuffledPlayerIds[i]];
        }

        let rolesData = {};
        let attemptsData = {};
        let selectedGroupKey = "";

        if (gameMode === 'spyfall') {
            const groupKeys = Object.keys(catData.groups);
            selectedGroupKey = groupKeys[Math.floor(Math.random() * groupKeys.length)];
            let groupItems = [...catData.groups[selectedGroupKey]];

            const spyIndex = Math.floor(Math.random() * playerIds.length);
            const spyId = playerIds[spyIndex];

            const spyItemIdx = Math.floor(Math.random() * groupItems.length);
            const spyItem = groupItems.splice(spyItemIdx, 1)[0];
            rolesData[spyId] = spyItem;

            const normalItem = groupItems[Math.floor(Math.random() * groupItems.length)];
            playerIds.forEach((id) => {
                if (id !== spyId) rolesData[id] = normalItem;
            });
        } else {
            selectedGroupKey = Object.keys(catData.groups)[0];
            const allItems = getAllCategoryItems(catKey);

            playerIds.forEach((id) => {
                const idx = Math.floor(Math.random() * allItems.length);
                rolesData[id] = allItems[idx];
                attemptsData[id] = 1;
            });
        }

        let currentScores = data.scores || {};
        playerIds.forEach(id => {
            if (currentScores[id] === undefined) currentScores[id] = 0;
        });

        const updateObj = {
            status: 'playing',
            roles: rolesData,
            turnOrder: shuffledPlayerIds,
            currentTurnIndex: 0,
            currentRound: 1,
            totalRounds: gameMode === 'spyfall' ? setVal : 1,
            endTime: gameMode === 'whoami' ? Date.now() + setVal * 60 * 1000 : null,
            attempts: attemptsData,
            guessedCorrectly: {},
            currentGroup: selectedGroupKey,
            votes: null,
            guess: null,
            spyGuess: null,
            scoreUpdated: false,
            scores: currentScores,
            emptySince: null
        };

        if (gameMode === 'spyfall') {
            updateObj.spyId = Object.keys(rolesData).find(k => rolesData[k] !== Object.values(rolesData).find(v => v));
        }

        roomRef.update(updateObj);
    });
});

// ฟังสถานะเกม
function listenGameState() {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const players = data.players || {};
        if (Object.keys(players).length === 0) {
            if (!data.emptySince) {
                roomRef.update({ emptySince: Date.now() });
            } else if (Date.now() - data.emptySince > 60000) {
                roomRef.remove();
                return;
            }
        }

        const scores = data.scores || {};
        const gameMode = data.gameMode || 'spyfall';

        scoreListBody.innerHTML = '';
        Object.keys(players).forEach(id => {
            const pName = players[id].name;
            const pScore = scores[id] || 0;
            const isMe = (id === myId);
            const row = document.createElement('div');
            row.className = 'score-row-item';
            row.innerHTML = `<span>${pName} ${isMe ? '<b style="color:#22c55e;">(you)</b>' : ''}</span> <b>${pScore} แต้ม</b>`;
            scoreListBody.appendChild(row);
        });
        scoreBoard.style.display = 'block';

        if (data.status === 'playing') {
            lobbyArea.style.display = 'none';
            voteArea.style.display = 'none';

            if (gameMode === 'spyfall') {
                whoAmIArea.style.display = 'none';
                gameArea.style.display = 'block';

                const roles = data.roles || {};
                heroName.textContent = roles[myId] || "...";

                const turnOrder = data.turnOrder || [];
                const currentTurnIndex = data.currentTurnIndex || 0;
                const currentRound = data.currentRound || 1;
                const totalRounds = data.totalRounds || 2;
                const currentSpeakerId = turnOrder[currentTurnIndex];

                roundIndicator.textContent = `🔄 รอบที่ ${currentRound} จาก ${totalRounds} รอบ`;
                
                fullTurnOrderContainer.innerHTML = '';
                turnOrder.forEach((id, idx) => {
                    const p = players[id];
                    if (!p) return;
                    const isCurrent = (idx === currentTurnIndex);
                    const div = document.createElement('div');
                    div.style.cssText = `font-size:0.8rem; padding:3px 6px; border-radius:4px; background:${isCurrent ? 'rgba(56, 189, 248, 0.3)' : 'rgba(15, 23, 42, 0.4)'}; color:${isCurrent ? '#38bdf8' : '#cbd5e1'};`;
                    div.innerHTML = `${idx + 1}. ${p.name} ${id === myId ? '(you)' : ''} ${isCurrent ? ' 👈' : ''}`;
                    fullTurnOrderContainer.appendChild(div);
                });

                if (currentSpeakerId === myId) {
                    currentSpeakerBox.innerHTML = `🗣️ ตาของคุณพูดแล้ว!`;
                    endTurnBtn.style.display = 'block';
                } else {
                    currentSpeakerBox.innerHTML = `⏳ กำลังรอ <b style="color:#fbbf24;">${players[currentSpeakerId]?.name}</b> พูด...`;
                    endTurnBtn.style.display = 'none';
                }

                heroGrid.innerHTML = '';
                const catKey = data.category || 'rov';
                const catData = getCategoryData(catKey);
                const currentGroup = data.currentGroup;
                if (catData && currentGroup && catData.groups[currentGroup]) {
                    document.querySelector('.section-title').textContent = `🛡️ รายชื่อในกลุ่มปัจจุบัน (${currentGroup}):`;
                    catData.groups[currentGroup].forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'hero-item';
                        div.textContent = item;
                        heroGrid.appendChild(div);
                    });
                }

            } else {
                gameArea.style.display = 'none';
                whoAmIArea.style.display = 'block';

                startWhoAmITimer(data.endTime, roomId, data);

                othersRolesGrid.innerHTML = '';
                const roles = data.roles || {};
                const attempts = data.attempts || {};
                const guessedCorrectly = data.guessedCorrectly || {};
                const turnOrder = data.turnOrder || [];
                const currentTurnIndex = data.currentTurnIndex || 0;

                turnOrder.forEach((pId) => {
                    if (pId !== myId && players[pId]) {
                        const div = document.createElement('div');
                        div.className = 'hero-item';

                        const isDone = (attempts[pId] ?? 1) <= 0 || guessedCorrectly[pId];
                        const isCorrect = guessedCorrectly[pId];
                        const isCurrentTurn = (turnOrder[currentTurnIndex] === pId);

                        let bgStyle = "background: rgba(30, 41, 59, 0.9);";
                        let statusText = "";

                        if (isCurrentTurn && !isDone) {
                            bgStyle = "background: rgba(251, 191, 36, 0.25); border: 2px solid #fbbf24;";
                        }

                        if (isDone) {
                            if (isCorrect) {
                                bgStyle = "background: rgba(34, 197, 94, 0.25); opacity: 0.65; border: 1px solid #22c55e;";
                                statusText = '<br><span style="color:#22c55e; font-size:0.7rem;">(ตอบถูก ✅)</span>';
                            } else {
                                bgStyle = "background: rgba(100, 116, 139, 0.25); opacity: 0.5; border: 1px solid #64748b;";
                                statusText = '<br><span style="color:#94a3b8; font-size:0.7rem;">(ตอบผิด ❌)</span>';
                            }
                        }

                        div.style.cssText = bgStyle + " padding: 8px; border-radius: 6px; text-align: center;";
                        div.innerHTML = `<b>${players[pId].name}</b><br><span style="color:#38bdf8;">${roles[pId]}</span>${statusText}`;
                        othersRolesGrid.appendChild(div);
                    }
                });

                const myAttempts = attempts[myId] ?? 1;
                const isAlreadyCorrect = guessedCorrectly[myId];

                if (isAlreadyCorrect) {
                    guessControlsDiv.style.display = 'none';
                    guessStatusText.textContent = `🎉 คุณทายถูกแล้ว! รอลุ้นเพื่อนคนอื่น`;
                } else if (myAttempts <= 0) {
                    guessControlsDiv.style.display = 'none';
                    guessStatusText.textContent = `❌ คุณใช้สิทธิ์ตอบไปแล้ว (0 ครั้ง)`;
                } else {
                    guessControlsDiv.style.display = 'block';
                    guessStatusText.textContent = `🎯 ค้นหาและทายตัวละคร (สิทธิ์ตอบ 1 ครั้ง):`;
                }

                setupSearchDropdown(data.category);
                whoAmIHostControls.style.display = isHost ? 'block' : 'none';
            }

        } else if (data.status === 'voting') {
            gameArea.style.display = 'none';
            whoAmIArea.style.display = 'none';
            lobbyArea.style.display = 'none';
            voteArea.style.display = 'block';
            renderVotingScreen(data);

        } else if (data.status === 'lobby') {
            gameArea.style.display = 'none';
            whoAmIArea.style.display = 'none';
            voteArea.style.display = 'none';
            lobbyArea.style.display = 'block';
        }
    });
}

function startWhoAmITimer(endTime, rId, data) {
    if (whoAmITimerInterval) clearInterval(whoAmITimerInterval);
    if (!endTime) return;

    const tick = () => {
        const timeLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        whoAmITimer.textContent = `${m}:${s}`;

        const players = data.players || {};
        const pIds = Object.keys(players);
        const attempts = data.attempts || {};
        const guessedCorrectly = data.guessedCorrectly || {};

        const allAttemptsUsed = pIds.every(id => (attempts[id] ?? 1) <= 0);
        const allCorrect = pIds.every(id => guessedCorrectly[id]);

        if (timeLeft <= 0 || allAttemptsUsed || allCorrect) {
            clearInterval(whoAmITimerInterval);
            if (isHost && data.status === 'playing') {
                db.ref(`rooms/${rId}`).update({ status: 'voting' });
            }
        }
    };

    tick();
    whoAmITimerInterval = setInterval(tick, 1000);
}

function setupSearchDropdown(catKey) {
    const allItems = getAllCategoryItems(catKey);
    
    myGuessSearch.oninput = (e) => {
        const keyword = e.target.value.toLowerCase().trim();
        searchResultsList.innerHTML = '';
        if (!keyword) {
            searchResultsList.style.display = 'none';
            return;
        }

        const filtered = allItems.filter(item => item.toLowerCase().includes(keyword));
        if (filtered.length === 0) {
            searchResultsList.style.display = 'none';
            return;
        }

        filtered.forEach(item => {
            const div = document.createElement('div');
            div.textContent = item;
            div.onclick = () => {
                selectedSearchGuess = item;
                myGuessSearch.value = item;
                selectedGuessText.textContent = `✔️ เลือก: ${item}`;
                searchResultsList.style.display = 'none';
            };
            searchResultsList.appendChild(div);
        });
        searchResultsList.style.display = 'block';
    };
}

submitMyGuessBtn.addEventListener('click', () => {
    const guessVal = selectedSearchGuess || myGuessSearch.value.trim();
    if (!guessVal) {
        alert('กรุณาพิมพ์หรือเลือกตัวละครก่อนกดยืนยันคำตอบ');
        return;
    }

    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.once('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const myRealRole = data.roles[myId];
        let attempts = data.attempts || {};
        let guessedCorrectly = data.guessedCorrectly || {};
        let correctOrder = data.correctOrder || [];

        attempts[myId] = 0;

        let isCorrect = (guessVal.toLowerCase() === myRealRole.toLowerCase());
        if (isCorrect) {
            alert('🎉 ยินดีด้วย! คุณทายถูก!');
            guessedCorrectly[myId] = true;
            if (!correctOrder.includes(myId)) {
                correctOrder.push(myId);
            }
        } else {
            alert(`❌ ทายผิด! ตัวละครที่ถูกต้องคือ "${myRealRole}" ได้ 0 คะแนน`);
        }

        roomRef.update({
            attempts: attempts,
            guessedCorrectly: guessedCorrectly,
            correctOrder: correctOrder
        });

        setTimeout(() => {
            roomRef.once('value', (snap) => {
                const updatedData = snap.val();
                if (!updatedData || updatedData.status !== 'playing') return;
                const allPlayers = Object.keys(updatedData.players || {});
                const allAttemptsUsed = allPlayers.every(pId => (updatedData.attempts?.[pId] ?? 1) <= 0);
                const allCorrect = allPlayers.every(pId => updatedData.guessedCorrectly?.[pId]);

                if ((allAttemptsUsed || allCorrect) && isHost) {
                    roomRef.update({ status: 'voting' });
                }
            });
        }, 300);
    });
});

endTurnBtn.addEventListener('click', () => {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.once('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const turnOrder = data.turnOrder || [];
        let currentTurnIndex = (data.currentTurnIndex || 0) + 1;
        let currentRound = data.currentRound || 1;
        const totalRounds = data.totalRounds || 2;

        if (currentTurnIndex >= turnOrder.length) {
            currentTurnIndex = 0;
            currentRound += 1;
        }

        if (currentRound > totalRounds) {
            roomRef.update({ status: 'voting' });
        } else {
            roomRef.update({
                currentTurnIndex: currentTurnIndex,
                currentRound: currentRound
            });
        }
    });
});

skipToVoteBtn.addEventListener('click', () => {
    db.ref(`rooms/${roomId}`).update({ status: 'voting' });
});

whoAmISkipBtn.addEventListener('click', () => {
    if (isHost) {
        db.ref(`rooms/${roomId}`).update({ status: 'voting' });
    }
});

function renderVotingScreen(data) {
    voteList.innerHTML = '';
    voteResult.style.display = 'none';
    hostPostVoteControls.style.display = 'none';

    const players = data.players || {};
    const gameMode = data.gameMode || 'spyfall';

    if (gameMode === 'whoami') {
        voteAreaTitle.textContent = "🏁 สรุปผลคะแนนโหมด ฉันคือใคร";
        voteInstruction.textContent = "เฉลยตัวละครและสรุปแต้มตามลำดับการตอบ:";
        voteResult.style.display = 'block';
        if (isHost) {
            hostPostVoteControls.style.display = 'flex';
            if (!data.scoreUpdated) {
                let scores = data.scores || {};
                const correctOrder = data.correctOrder || [];
                const totalCorrect = correctOrder.length;

                correctOrder.forEach((pId, idx) => {
                    const pts = totalCorrect - idx;
                    scores[pId] = (scores[pId] || 0) + pts;
                });

                db.ref(`rooms/${roomId}`).update({
                    scores: scores,
                    scoreUpdated: true
                });
            }
        }
        
        let htmlStr = `<h3 style="color:#38bdf8; margin-bottom:8px;">👥 เฉลยตัวละครและคะแนนรอบนี้:</h3>`;
        const correctOrder = data.correctOrder || [];
        const totalCorrect = correctOrder.length;

        Object.keys(players).forEach(pId => {
            const pName = players[pId].name;
            const role = data.roles[pId];
            const isCorrect = data.guessedCorrectly?.[pId];
            let ptsAwarded = 0;
            if (isCorrect) {
                const rankIdx = correctOrder.indexOf(pId);
                ptsAwarded = totalCorrect - rankIdx;
            }
            htmlStr += `<p style="font-size:0.85rem; margin:4px 0;"><b>${pName}:</b> ${role} ${isCorrect ? `✅ (ตอบถูกอันดับที่ ${correctOrder.indexOf(pId) + 1} ได้ +${ptsAwarded} แต้ม)` : '❌ (0 แต้ม)'}</p>`;
        });
        voteResult.innerHTML = htmlStr;
        return;
    }

    voteAreaTitle.textContent = "🗳️ ช่วงเวลาโหวตหา Spy!";
    const votes = data.votes || {};
    const isAmISpy = (myId === data.spyId);
    
    const catKey = data.category || 'rov';
    const catData = getCategoryData(catKey);
    const currentGroup = data.currentGroup;
    const currentGroupItems = (catData && currentGroup && catData.groups[currentGroup]) ? catData.groups[currentGroup] : [];

    const activeCandidates = data.tieCandidates || Object.keys(players);
    const myVote = votes[myId];

    if (isAmISpy) {
        voteInstruction.textContent = myVote ? "✅ คุณ (Spy) ทำการโหวตแล้ว รอสรุปผล..." : "🤫 คุณคือ Spy! เลือกคนที่คิดว่าน่าสงสัยที่สุด (ห้ามโหวตตัวเอง):";
    } else {
        voteInstruction.textContent = myVote ? "✅ คุณได้ทำการโหวตเรียบร้อยแล้ว รอสรุปผล..." : "👉 คลิกเลือกผู้เล่นที่คิดว่าเป็น Spy (ห้ามโหวตตัวเอง):";
    }

    activeCandidates.forEach(targetId => {
        if (!players[targetId]) return;
        if (targetId === myId) return;

        const btn = document.createElement('button');
        btn.className = 'vote-btn';
        if (selectedVoteTarget === targetId) {
            btn.style.borderColor = '#38bdf8';
            btn.style.background = 'rgba(56, 189, 248, 0.25)';
        }

        btn.innerHTML = `<span>👤 ${players[targetId].name}</span> <span style="font-size:0.8rem; color:#94a3b8;">(โหวตแล้ว: ${Object.keys(votes).length}/${Object.keys(players).length})</span>`;
        
        if (!myVote) {
            btn.addEventListener('click', () => {
                selectedVoteTarget = targetId;
                selectedHeroGuess = "";
                renderVotingScreen(data);
            });
        } else {
            btn.disabled = true;
        }

        voteList.appendChild(btn);

        if (selectedVoteTarget === targetId && !myVote) {
            const selectHero = document.createElement('select');
            const defaultOpt = document.createElement('option');
            defaultOpt.value = "";
            defaultOpt.textContent = "-- ไม่ทายตัวละคร (เอาแค่โหวต) --";
            selectHero.appendChild(defaultOpt);

            currentGroupItems.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item;
                opt.textContent = item;
                if (selectedHeroGuess === item) opt.selected = true;
                selectHero.appendChild(opt);
            });

            selectHero.addEventListener('change', (e) => { selectedHeroGuess = e.target.value; });
            voteList.appendChild(selectHero);

            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn primary-glow';
            confirmBtn.style.marginTop = '6px';
            confirmBtn.textContent = `🔒 ยืนยันโหวต ${players[targetId].name}`;
            confirmBtn.addEventListener('click', () => {
                db.ref(`rooms/${roomId}/votes/${myId}`).set(targetId);
                if (isAmISpy) {
                    db.ref(`rooms/${roomId}/spyGuess/${myId}`).set({ targetId: targetId, guessHero: selectedHeroGuess });
                } else {
                    db.ref(`rooms/${roomId}/guess/${myId}`).set(selectedHeroGuess);
                }
            });
            voteList.appendChild(confirmBtn);
        }
    });

    const totalPlayersCount = Object.keys(players).length;
    const totalVotes = Object.keys(votes).length;

    if (totalVotes >= totalPlayersCount) {
        voteResult.style.display = 'block';
        if (isHost) hostPostVoteControls.style.display = 'flex';

        let voteCounts = {};
        Object.values(votes).forEach(t => { voteCounts[t] = (voteCounts[t] || 0) + 1; });

        let maxVotes = 0;
        let topTargets = [];
        for (let id in voteCounts) {
            if (voteCounts[id] > maxVotes) {
                maxVotes = voteCounts[id];
                topTargets = [id];
            } else if (voteCounts[id] === maxVotes) {
                topTargets.push(id);
            }
        }

        if (topTargets.length > 1 && !data.tieHandled) {
            if (isHost) {
                db.ref(`rooms/${roomId}`).update({
                    tieCandidates: topTargets,
                    votes: null, guess: null, spyGuess: null,
                    tieHandled: true
                });
            }
            voteResult.innerHTML = `<p style="color:#fbbf24; font-weight:700;">⚠️ ผลโหวตเท่ากัน กำลังรีโหวต...</p>`;
            return;
        }

        const mostVotedId = topTargets[0];
        const suspectName = players[mostVotedId] ? players[mostVotedId].name : "ไม่ทราบชื่อ";
        const suspectHero = data.roles[mostVotedId] || "-";
        const isTargetSpy = (mostVotedId === data.spyId);
        const spyId = data.spyId;
        const spyName = players[spyId] ? players[spyId].name : "ไม่ทราบชื่อ";
        const realSpyItem = data.roles[spyId] || "-";

        if (isTargetSpy) {
            voteResult.innerHTML = `
                <h3 style="font-size:0.95rem; margin-bottom:4px;">🔍 ผลการเปิดเผยบทบาท</h3>
                <p style="margin: 4px 0; font-size:0.85rem;">คนที่ถูกโหวตสูงสุดคือ <b>${suspectName}</b> (ตัวละคร: <b>${suspectHero}</b>)</p>
                <p style="color:#22c55e; font-weight:700; font-size: 1rem;">🎉 ทายถูก! ฝั่งผู้เล่นจับ Spy สำเร็จ! (+1 แต้ม)</p>
                <p style="font-size:0.75rem; color:#94a3b8;">(Spy คือ ${spyName})</p>
            `;

            if (isHost && !data.scoreUpdated) {
                let updatedScores = data.scores || {};
                Object.keys(players).forEach(pId => {
                    if (pId !== spyId) {
                        if (updatedScores[pId] === undefined) updatedScores[pId] = 0;
                        updatedScores[pId] += 1;
                    }
                });
                db.ref(`rooms/${roomId}`).update({ scores: updatedScores, scoreUpdated: true });
            }
        } else {
            voteResult.innerHTML = `
                <h3 style="font-size:0.95rem; margin-bottom:4px;">🔍 ผลการเปิดเผยบทบาท</h3>
                <p style="margin: 4px 0; font-size:0.85rem;">คนที่ถูกโหวตสูงสุดคือ <b>${suspectName}</b> (ตัวละคร: <b>${suspectHero}</b>)</p>
                <p style="color:#ef4444; font-weight:700; font-size: 1rem;">❌ ทายผิด! ฝั่ง Spy ชนะ (+2 แต้ม)!</p>
                <p style="font-size:0.75rem; color:#94a3b8;">(Spy คือ ${spyName} - ตัวละคร ${realSpyItem})</p>
            `;

            if (isHost && !data.scoreUpdated) {
                let updatedScores = data.scores || {};
                if (updatedScores[spyId] === undefined) updatedScores[spyId] = 0;
                updatedScores[spyId] += 2;
                db.ref(`rooms/${roomId}`).update({ scores: updatedScores, scoreUpdated: true });
            }
        }
    }
}

nextRoundBtn.addEventListener('click', () => {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.once('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        roomRef.update({
            status: 'lobby',
            roles: null,
            turnOrder: null,
            currentTurnIndex: 0,
            currentRound: 1,
            currentGroup: null,
            spyId: null,
            votes: null,
            guess: null,
            spyGuess: null,
            attempts: null,
            guessedCorrectly: null,
            correctOrder: null,
            tieCandidates: null,
            tieHandled: false,
            scoreUpdated: false
        });
        selectedVoteTarget = null;
        selectedHeroGuess = "";
        selectedSearchGuess = "";
    });
});

backToLobbyBtn.addEventListener('click', () => {
    db.ref(`rooms/${roomId}`).remove();
    localStorage.removeItem('rov_spy_roomid');
    location.reload();
});
