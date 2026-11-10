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

const categoriesData = {
    "rov": {
        name: "ROV (Arena of Valor)",
        lanes: {
            "แครี่ (Carry Lane)": ["Valhein", "Yorn", "Violet", "Capheny", "Hayate", "Elsu", "Laville", "Thorne", "Tel'Annas", "Eland'orr", "Fennik", "Slimz", "Moren", "Wisp", "Lindis", "Teeri", "Celica", "Erin", "Stuart"],
            "เลนกลาง (Mid Lane)": ["Krixi", "Tulen", "Liliana", "Raz", "Lauriel", "Natalya", "Veera", "Ilumia", "Kahlii", "Mganga", "Preyta", "Jinnar", "Aleister", "Diao Chan", "Zata", "Iggy", "Dirak", "Lorion", "Bonnie", "Yue", "Dyadia", "Heino", "Evita", "Gildur", "Azzen'Ka", "Ishar"],
            "ออฟเลน (Dark Slayer Lane)": ["Florentino", "Yena", "Ryoma", "Maloch", "Lu Bu", "Allain", "Veres", "Omen", "Airi", "Amily", "Arthur", "Astrid", "Skud", "Taara", "Qi", "Richter", "Rourke", "Zuka", "Tachi", "Dextra", "Biron", "Bijan", "Yan", "Wonder Woman", "Arduin", "Mortos", "Max", "Errol", "Volkath", "Ata"],
            "ป่า (Jungle / Assassin)": ["Nakroth", "Murad", "Butterfly", "Aoi", "Keera", "Zill", "Kriknak", "Quillen", "Enzo", "Sinestrea", "Wukong", "Paine", "Bright", "Kaine", "Zanis", "Zephys"],
            "โรมมิ่ง / ซัพพอร์ต (Roaming)": ["Grakk", "Alice", "Thane", "Toro", "Zip", "Aya", "Arum", "Cresht", "Baldum", "Mina", "Omega", "Annette", "Helen", "Krizzix", "Rouie", "Lumburr", "Ming", "Dolia", "TeeMee", "Chaugnar", "Sephera", "Xeniel", "Ormarr", "Wiro", "Roxie"]
        }
    }
};

const roomSelection = document.getElementById('roomSelection');
const createRoomModal = document.getElementById('createRoomModal');
const lobbyArea = document.getElementById('lobbyArea');
const gameArea = document.getElementById('gameArea');
const whoAmIArea = document.getElementById('whoAmIArea');
const voteArea = document.getElementById('voteArea');

const nameInput = document.getElementById('nameInput');
const showCreateModalBtn = document.getElementById('showCreateModalBtn');
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

// ตัวแปรโหมด ฉันคือใคร
const whoAmITimer = document.getElementById('whoAmITimer');
const othersRolesGrid = document.getElementById('othersRolesGrid');
const remainingAttempts = document.getElementById('remainingAttempts');
const myGuessSelect = document.getElementById('myGuessSelect');
const submitMyGuessBtn = document.getElementById('submitMyGuessBtn');
const guessControlsDiv = document.getElementById('guessControlsDiv');
const guessStatusText = document.getElementById('guessStatusText');
const whoAmITurnOrderContainer = document.getElementById('whoAmITurnOrderContainer');
const whoAmIHostControls = document.getElementById('whoAmIHostControls');
const whoAmISkipBtn = document.getElementById('whoAmISkipBtn');

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

let myId = localStorage.getItem('rov_spy_myid');
if (!myId) {
    myId = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('rov_spy_myid', myId);
}

let isHost = false;
let selectedVoteTarget = null;
let selectedHeroGuess = "";

// เปลี่ยนป้ายกำกับตามโหมดเกมที่เลือก
gameModeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'whoami') {
        roundOrTimeLabel.textContent = '⏱️ เวลาจำกัด (นาที):';
        settingValueInput.value = '3';
    } else {
        roundOrTimeLabel.textContent = '🔄 จำนวนรอบการพูด:';
        settingValueInput.value = '2';
    }
});

showCreateModalBtn.addEventListener('click', () => {
    myName = nameInput.value.trim();
    if (!myName) {
        alert('กรุณากรอกชื่อเล่นของคุณก่อน!');
        nameInput.focus();
        return;
    }
    roomSelection.style.display = 'none';
    createRoomModal.style.display = 'flex';
});

backToHomeBtn.addEventListener('click', () => {
    createRoomModal.style.display = 'none';
    roomSelection.style.display = 'flex';
});

// โหลดรายชื่อห้อง
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
            statusText = '🗳️ กำลังโหวต';
            canJoin = false;
        }

        card.innerHTML = `
            <div class="room-item-info">
                <span class="room-item-name">🏠 ห้อง: ${rId} (${pCount} คน)</span>
                <span class="room-item-status">${mode} | ${statusText}</span>
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
                joinExistingRoom(rId);
            });
        }

        card.appendChild(btn);
        activeRoomsList.appendChild(card);
    });
});

// ยืนยันสร้างห้อง
confirmCreateBtn.addEventListener('click', () => {
    roomId = newRoomInput.value.trim();
    const gameMode = gameModeSelect.value;
    const selectedCategory = categorySelect.value;
    const settingVal = parseInt(settingValueInput.value) || 2;

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
            status: 'lobby'
        });

        roomRef.child(`players/${myId}`).set({ name: myName });
        roomRef.child(`players/${myId}`).onDisconnect().remove();

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

        checkHostAndListen();
        listenGameState();
    });
}

lobbyGameModeSelect.addEventListener('change', (e) => {
    if (!isHost || !roomId) return;
    db.ref(`rooms/${roomId}/gameMode`).set(e.target.value);
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
        location.reload();
    }
});

function checkHostAndListen() {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) { alert('ห้องถูกปิด'); location.reload(); return; }

        playerList.innerHTML = '';
        const players = data.players || {};
        const playerIds = Object.keys(players);
        const hostId = data.hostId;
        const mode = data.gameMode || 'spyfall';
        const catKey = data.category || 'rov';
        const setVal = data.settingValue || 2;
        const catInfo = categoriesData[catKey] || categoriesData['rov'];

        roomCategoryBadge.textContent = `โหมด: ${mode === 'whoami' ? 'ฉันคือใคร' : 'Spyfall'} | หมวด: ${catInfo.name} | ${mode === 'whoami' ? 'เวลา: ' + setVal + ' นาที' : 'รอบ: ' + setVal}`;
        lobbyGameModeSelect.value = mode;
        lobbyCategorySelect.value = catKey;
        lobbySettingValueInput.value = setVal;

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

// กดเริ่มเกม
startBtn.addEventListener('click', () => {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.once('value', (snapshot) => {
        const data = snapshot.val();
        const players = data.players || {};
        const playerIds = Object.keys(players);
        const gameMode = data.gameMode || 'spyfall';
        const catKey = data.category || 'rov';
        const catData = categoriesData[catKey] || categoriesData['rov'];
        const setVal = data.settingValue || 2;

        if (playerIds.length < (gameMode === 'whoami' ? 2 : 3)) {
            alert(`โหมดนี้ต้องมีผู้เล่นอย่างน้อย ${gameMode === 'whoami' ? 2 : 3} คนขึ้นไป!`);
            return;
        }

        // สุ่มลำดับผู้เล่นใหม่ทุกตา
        let shuffledPlayerIds = [...playerIds];
        for (let i = shuffledPlayerIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPlayerIds[i], shuffledPlayerIds[j]] = [shuffledPlayerIds[j], shuffledPlayerIds[i]];
        }

        const laneKeys = Object.keys(catData.lanes);
        const selectedGroupKey = laneKeys[Math.floor(Math.random() * laneKeys.length)];
        let groupItems = [...catData.lanes[selectedGroupKey]];

        let rolesData = {};
        let attemptsData = {};

        if (gameMode === 'spyfall') {
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
            // โหมด ฉันคือใคร: สุ่มตัวละครให้ทุกคนไม่ซ้ำกัน (หรือสุ่มจากลิสต์)
            playerIds.forEach((id) => {
                if (groupItems.length === 0) groupItems = [...catData.lanes[selectedGroupKey]];
                const idx = Math.floor(Math.random() * groupItems.length);
                rolesData[id] = groupItems.splice(idx, 1)[0];
                attemptsData[id] = 3; // ให้สิทธิ์ตอบผิดคนละ 3 ครั้ง
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
            currentGroup: selectedGroupKey,
            votes: null,
            guess: null,
            spyGuess: null,
            scoreUpdated: false,
            scores: currentScores
        };

        if (gameMode === 'spyfall') {
            updateObj.spyId = Object.keys(rolesData).find(k => rolesData[k] !== Object.values(rolesData).find(v => v)); // หรือหาตัวสปาย
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

        const scores = data.scores || {};
        const players = data.players || {};
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

                // แสดงลำดับการพูดทั้งหมด
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
                    div.innerHTML = `${idx + 1}. ${p.name} ${id === myId ? '(you)' : ''} ${isCurrent ? ' 👈 (กำลังพูด)' : ''}`;
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
                const catData = categoriesData[catKey] || categoriesData['rov'];
                const currentGroup = data.currentGroup;
                if (currentGroup && catData.lanes[currentGroup]) {
                    document.querySelector('.section-title').textContent = `🛡️ รายชื่อในกลุ่มปัจจุบัน (${currentGroup}):`;
                    catData.lanes[currentGroup].forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'hero-item';
                        div.textContent = item;
                        heroGrid.appendChild(div);
                    });
                }

            } else {
                // โหมด ฉันคือใคร
                gameArea.style.display = 'none';
                whoAmIArea.style.display = 'block';

                startWhoAmITimer(data.endTime, roomId);

                // แสดงตัวละครของคนอื่น (ยกเว้นตัวเอง)
                othersRolesGrid.innerHTML = '';
                const roles = data.roles || {};
                Object.keys(players).forEach(pId => {
                    if (pId !== myId) {
                        const div = document.createElement('div');
                        div.className = 'hero-item';
                        div.innerHTML = `<b>${players[pId].name}:</b><br><span style="color:#38bdf8;">${roles[pId]}</span>`;
                        othersRolesGrid.appendChild(div);
                    }
                });

                // อัปเดตสิทธิ์การตอบ
                const attempts = data.attempts || {};
                const myRemaining = attempts[myId] ?? 3;
                remainingAttempts.textContent = myRemaining;

                if (myRemaining <= 0) {
                    guessControlsDiv.style.display = 'none';
                    guessStatusText.textContent = `❌ คุณใช้สิทธิ์ตอบครบ 3 ครั้งแล้ว รอลุ้นเพื่อนคนอื่น!`;
                } else {
                    guessControlsDiv.style.display = 'block';
                }

                // เติมตัวเลือกใน Dropdown สำหรับทายตัวเอง
                const catKey = data.category || 'rov';
                const catData = categoriesData[catKey] || categoriesData['rov'];
                const currentGroup = data.currentGroup;
                if (currentGroup && catData.lanes[currentGroup]) {
                    if (myGuessSelect.options.length <= 1) {
                        myGuessSelect.innerHTML = `<option value="">-- เลือกตัวละครที่คุณคิดว่าเป็น --</option>`;
                        catData.lanes[currentGroup].forEach(item => {
                            const opt = document.createElement('option');
                            opt.value = item;
                            opt.textContent = item;
                            myGuessSelect.appendChild(opt);
                        });
                    }
                }

                // ลำดับการพูดโหมดฉันคือใคร
                const turnOrder = data.turnOrder || [];
                const currentTurnIndex = data.currentTurnIndex || 0;
                whoAmITurnOrderContainer.innerHTML = '';
                turnOrder.forEach((id, idx) => {
                    const p = players[id];
                    if (!p) return;
                    const isCurrent = (idx === currentTurnIndex);
                    const div = document.createElement('div');
                    div.style.cssText = `font-size:0.8rem; padding:3px 6px; border-radius:4px; background:${isCurrent ? 'rgba(56, 189, 248, 0.3)' : 'rgba(15, 23, 42, 0.4)'}; color:${isCurrent ? '#38bdf8' : '#cbd5e1'};`;
                    div.innerHTML = `${idx + 1}. ${p.name} ${id === myId ? '(you)' : ''} ${isCurrent ? ' 👈 (กำลังพูด)' : ''}`;
                    whoAmITurnOrderContainer.appendChild(div);
                });
            }

        } else if (data.status === 'voting') {
            if (whoAmITimerInterval) clearInterval(whoAmITimerInterval);
            gameArea.style.display = 'none';
            whoAmIArea.style.display = 'none';
            lobbyArea.style.display = 'none';
            voteArea.style.display = 'block';
            renderVotingScreen(data);

        } else if (data.status === 'lobby') {
            if (whoAmITimerInterval) clearInterval(whoAmITimerInterval);
            gameArea.style.display = 'none';
            whoAmIArea.style.display = 'none';
            voteArea.style.display = 'none';
            lobbyArea.style.display = 'block';
        }
    });
}

// ตัวจับเวลาโหมด ฉันคือใคร
function startWhoAmITimer(endTime, rId) {
    if (whoAmITimerInterval) clearInterval(whoAmITimerInterval);
    whoAmITimerInterval = setInterval(() => {
        const timeLeft = Math.floor((endTime - Date.now()) / 1000);
        if (timeLeft <= 0) {
            clearInterval(whoAmITimerInterval);
            whoAmITimer.textContent = "00:00";
            // หมดเวลา ให้จบเกม
            if (isHost) {
                db.ref(`rooms/${rId}`).update({ status: 'voting' });
            }
        } else {
            const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
            const s = (timeLeft % 60).toString().padStart(2, '0');
            whoAmITimer.textContent = `${m}:${s}`;
        }
    }, 1000);
}

// กดส่งคำตอบในโหมด "ฉันคือใคร"
submitMyGuessBtn.addEventListener('click', () => {
    const guessVal = myGuessSelect.value;
    if (!guessVal) {
        alert('กรุณาเลือกตัวละครก่อนกดonยืนยัน');
        return;
    }

    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.once('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const myRealRole = data.roles[myId];
        let attempts = data.attempts || {};
        let myAttempts = attempts[myId] ?? 3;

        if (guessVal.toLowerCase() === myRealRole.toLowerCase()) {
            alert('🎉 ยินดีด้วย! คุณทายตัวละครของตัวเองถูกต้อง!');
            // ให้คะแนนพิเศษ และจบเกมหรือให้คนอื่นเล่นต่อ
            let scores = data.scores || {};
            scores[myId] = (scores[myId] || 0) + 3; // ทายถูกได้ 3 แต้ม
            roomRef.update({ scores: scores, status: 'voting' });
        } else {
            myAttempts -= 1;
            attempts[myId] = myAttempts;
            if (myAttempts <= 0) {
                alert('❌ ทายผิด! สิทธิ์ของคุณหมดลงแล้ว (0 ครั้ง)');
            } else {
                alert(`❌ ทายผิด! คุณเหลือสิทธิ์ตอบอีก ${myAttempts} ครั้ง`);
            }
            roomRef.child('attempts').set(attempts);
        }
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

function renderVotingScreen(data) {
    voteList.innerHTML = '';
    voteResult.style.display = 'none';
    hostPostVoteControls.style.display = 'none';

    const players = data.players || {};
    const votes = data.votes || {};
    const guessData = data.guess || {};
    const spyGuessData = data.spyGuess || {};
    const gameMode = data.gameMode || 'spyfall';
    const isAmISpy = (myId === data.spyId);
    
    const catKey = data.category || 'rov';
    const catData = categoriesData[catKey] || categoriesData['rov'];
    const currentGroup = data.currentGroup;
    const currentGroupItems = (currentGroup && catData.lanes[currentGroup]) ? catData.lanes[currentGroup] : [];

    if (gameMode === 'whoami') {
        voteResult.style.display = 'block';
        if (isHost) hostPostVoteControls.style.display = 'flex';
        voteInstruction.textContent = "🏁 จบเกมโหมด ฉันคือใคร - สรุปตัวละครของทุกคน:";
        
        let htmlStr = `<h3>👥 เฉลยตัวละครทั้งหมด:</h3>`;
        Object.keys(players).forEach(pId => {
            htmlStr += `<p style="font-size:0.85rem; margin:4px 0;"><b>${players[pId].name}:</b> ${data.roles[pId]}</p>`;
        });
        voteResult.innerHTML = htmlStr;
        return;
    }

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
            tieCandidates: null,
            tieHandled: false,
            scoreUpdated: false
        });
        selectedVoteTarget = null;
        selectedHeroGuess = "";
    });
});

backToLobbyBtn.addEventListener('click', () => {
    db.ref(`rooms/${roomId}`).remove();
    location.reload();
});
