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

// ฐานข้อมูลฮีโร่ ROV อัปเดตครบถ้วนและถูกต้องตามเลนเมต้าปัจจุบัน
const rovLanes = {
    "แครี่ (Carry Lane)": ["Valhein", "Yorn", "Violet", "Capheny", "Hayate", "Elsu", "Laville", "Thorne", "Tel'Annas", "Eland'orr", "Fennik", "Slimz", "Moren", "Wisp", "Lindis", "Teeri", "Celica", "Erin", "Stuart"],
    "เลนกลาง (Mid Lane)": ["Krixi", "Tulen", "Liliana", "Raz", "Lauriel", "Natalya", "Veera", "Ilumia", "Kahlii", "Mganga", "Preyta", "Jinnar", "Aleister", "Diao Chan", "Zata", "Iggy", "Dirak", "Lorion", "Bonnie", "Yue", "Dyadia", "Heino", "Gildur", "Azzen'Ka", "Ishar"],
    "ออฟเลน (Dark Slayer Lane)": ["Florentino", "Yena", "Ryoma", "Maloch", "Lu Bu", "Allain", "Veres", "Omen", "Airi", "Amily", "Arthur", "Astrid", "Skud", "Taara", "Qi", "Richter", "Rourke", "Zuka", "Tachi", "Dextra", "Biron", "Bijan", "Yan", "Wonder Woman", "Arduin", "Mortos", "Max", "Errol", "Volkath", "Ata"],
    "ป่า (Jungle / Assassin)": ["Nakroth", "Murad", "Butterfly", "Aoi", "Keera", "Zill", "Kriknak", "Quillen", "Enzo", "Sinestrea", "Wukong", "Paine", "Bright", "Kaine", "Zanis", "Zephys"],
    "โรมมิ่ง / ซัพพอร์ต (Roaming)": ["Grakk", "Alice", "Thane", "Toro", "Zip", "Aya", "Arum", "Cresht", "Baldum", "Mina", "Omega", "Annette", "Helen", "Krizzix", "Rouie", "Lumburr", "Ming", "Dolia", "TeeMee", "Chaugnar", "Sephera", "Xeniel", "Ormarr", "Wiro", "Roxie"]
};

const roomSelection = document.getElementById('roomSelection');
const lobbyArea = document.getElementById('lobbyArea');
const gameArea = document.getElementById('gameArea');
const voteArea = document.getElementById('voteArea');

const nameInput = document.getElementById('nameInput');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const roomTitle = document.getElementById('roomTitle');
const playerList = document.getElementById('playerList');
const startBtn = document.getElementById('startBtn');
const waitText = document.getElementById('waitText');
const heroName = document.getElementById('heroName');
const heroGrid = document.getElementById('heroGrid');
const hostControls = document.getElementById('hostControls');
const skipToVoteBtn = document.getElementById('skipToVoteBtn');
const timerDisplay = document.getElementById('timer');
const voteList = document.getElementById('voteList');
const voteResult = document.getElementById('voteResult');
const backToLobbyBtn = document.getElementById('backToLobbyBtn');

const testGameBtn = document.getElementById('testGameBtn');
const botDebugBox = document.getElementById('botDebugBox');
const botStatusList = document.getElementById('botStatusList');

let myName = '';
let roomId = '';

let myId = localStorage.getItem('rov_spy_myid');
if (!myId) {
    myId = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('rov_spy_myid', myId);
}

let isHost = false;
let timerInterval = null;
let selectedVoteTarget = null;

joinBtn.addEventListener('click', () => {
    myName = nameInput.value.trim();
    roomId = roomInput.value.trim();

    if (!myName || !roomId) {
        alert('กรุณากรอกชื่อและชื่อห้องให้ครบถ้วน');
        return;
    }

    roomSelection.style.display = 'none';
    lobbyArea.style.display = 'block';
    roomTitle.textContent = `ห้อง: ${roomId}`;

    const playerRef = db.ref(`rooms/${roomId}/players/${myId}`);
    playerRef.set({ name: myName });
    playerRef.onDisconnect().remove();

    checkHostAndListen();
    listenGameState();
});

testGameBtn.addEventListener('click', () => {
    if (!roomId) return;
    
    const sortedPlayers = {};
    sortedPlayers[myId] = { name: myName };
    sortedPlayers['z_bot_1'] = { name: '🤖 บอทโรมมิ่ง' };
    sortedPlayers['z_bot_2'] = { name: '🤖 บอทแครี่' };
    sortedPlayers['z_bot_3'] = { name: '🤖 บอทเลนกลาง' };
    sortedPlayers['z_bot_4'] = { name: '🤖 บอทป่า' };

    db.ref(`rooms/${roomId}/players`).set(sortedPlayers);
    testGameBtn.style.display = 'none';
});

function checkHostAndListen() {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        playerList.innerHTML = '';
        const players = data.players || {};
        const playerIds = Object.keys(players);

        if (playerIds.length === 0) {
            roomRef.remove();
            return;
        }

        if (playerIds[0] === myId) {
            isHost = true;
            startBtn.style.display = 'block';
            waitText.style.display = 'none';
            hostControls.style.display = 'block';
            
            if (!players['z_bot_1']) {
                testGameBtn.style.display = 'flex';
            }
        } else {
            isHost = false;
            startBtn.style.display = 'none';
            waitText.style.display = 'block';
            hostControls.style.display = 'none';
            testGameBtn.style.display = 'none';
        }

        playerIds.forEach((id, index) => {
            const li = document.createElement('li');
            li.innerHTML = `👤 ${players[id].name} ${index === 0 ? '<span style="color:#38bdf8; font-size:0.8rem; margin-left:auto;">(หัวหน้าห้อง)</span>' : ''}`;
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

        if (playerIds.length < 3) {
            alert('ต้องมีผู้เล่นอย่างน้อย 3 คนถึงจะเริ่มเกมได้!');
            return;
        }

        const laneKeys = Object.keys(rovLanes);
        const selectedLane = laneKeys[Math.floor(Math.random() * laneKeys.length)];
        let laneHeroes = [...rovLanes[selectedLane]];

        const spyIndex = Math.floor(Math.random() * playerIds.length);
        const spyId = playerIds[spyIndex];

        let rolesData = {};

        const spyHeroIdx = Math.floor(Math.random() * laneHeroes.length);
        const spyHero = laneHeroes.splice(spyHeroIdx, 1)[0];
        rolesData[spyId] = spyHero;

        const normalHero = laneHeroes[Math.floor(Math.random() * laneHeroes.length)];

        playerIds.forEach((id) => {
            if (id !== spyId) {
                rolesData[id] = normalHero;
            }
        });

        const endTime = Date.now() + 300 * 1000;

        roomRef.update({
            status: 'playing',
            roles: rolesData,
            lane: selectedLane,
            spyId: spyId,
            endTime: endTime,
            votes: null
        });
    });
});

// ฟังสถานะเกม
function listenGameState() {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            roomSelection.style.display = 'block';
            lobbyArea.style.display = 'none';
            gameArea.style.display = 'none';
            voteArea.style.display = 'none';
            return;
        }

        if (data.status === 'playing') {
            lobbyArea.style.display = 'none';
            voteArea.style.display = 'none';
            gameArea.style.display = 'block';

            const roles = data.roles || {};
            const myHero = roles[myId] || "กำลังซิงค์ข้อมูล...";
            heroName.textContent = myHero;

            heroGrid.innerHTML = '';
            const currentLane = data.lane;
            if (currentLane && rovLanes[currentLane]) {
                document.querySelector('.section-title').textContent = `🛡️ ฮีโร่ในเลนปัจจุบัน (${currentLane}):`;
                rovLanes[currentLane].forEach(hero => {
                    const div = document.createElement('div');
                    div.className = 'hero-item';
                    div.textContent = hero;
                    heroGrid.appendChild(div);
                });
            }

            botDebugBox.style.display = 'block';
            botStatusList.innerHTML = '';
            const players = data.players || {};

            Object.keys(players).forEach(id => {
                if (id !== myId && id.includes('bot')) {
                    const li = document.createElement('li');
                    const isBotSpy = (id === data.spyId);
                    li.textContent = `${players[id].name} -> ตัวละคร: ${roles[id]} ${isBotSpy ? '🤫 [SPY]' : ''}`;
                    if (isBotSpy) li.style.color = '#f43f5e';
                    botStatusList.appendChild(li);
                }
            });

            startTimer(data.endTime);

        } else if (data.status === 'voting') {
            if (timerInterval) clearInterval(timerInterval);
            gameArea.style.display = 'none';
            lobbyArea.style.display = 'none';
            voteArea.style.display = 'block';
            renderVotingScreen(data);

        } else if (data.status === 'lobby') {
            if (timerInterval) clearInterval(timerInterval);
            gameArea.style.display = 'none';
            voteArea.style.display = 'none';
            lobbyArea.style.display = 'block';
            botDebugBox.style.display = 'none';
        }
    });
}

function startTimer(endTime) {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const timeLeft = Math.floor((endTime - Date.now()) / 1000);
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.textContent = "00:00";
            if (isHost) {
                db.ref(`rooms/${roomId}`).update({ status: 'voting' });
            }
        } else {
            const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
            const seconds = (timeLeft % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `${minutes}:${seconds}`;
        }
    }, 1000);
}

skipToVoteBtn.addEventListener('click', () => {
    db.ref(`rooms/${roomId}`).update({ status: 'voting' });
});

// หน้าจอโหวต (แสดงรายชื่อครบถ้วนแบบกะทัดรัด ไม่ต้องเลื่อน)
function renderVotingScreen(data) {
    voteList.innerHTML = '';
    voteResult.style.display = 'none';
    backToLobbyBtn.style.display = isHost ? 'block' : 'none';

    const players = data.players || {};
    const votes = data.votes || {};
    const playerIds = Object.keys(players);
    const hostId = playerIds[0];
    const hostVote = votes[hostId];

    const pListTitle = document.createElement('p');
    pListTitle.className = 'subtitle';
    pListTitle.textContent = isHost 
        ? (hostVote ? "✅ หัวหน้าห้องยืนยันผลโหวตแล้ว" : "👉 หัวหน้าห้องคลิกเลือกผู้เล่นที่ต้องการโหวต:")
        : "⏳ กำลังรอหัวหน้าห้องทำการตัดสินใจโหวต...";
    voteList.appendChild(pListTitle);

    Object.keys(players).forEach(targetId => {
        const btn = document.createElement('button');
        btn.className = 'vote-btn';
        if (selectedVoteTarget === targetId) {
            btn.style.borderColor = '#38bdf8';
            btn.style.background = 'rgba(56, 189, 248, 0.25)';
        }

        let isHostVotedThis = (hostVote === targetId);
        btn.innerHTML = `<span>👤 ${players[targetId].name}</span> ${isHostVotedThis ? '<span style="color:#38bdf8; font-weight:700;">🗳️ [เลือกแล้ว]</span>' : ''}`;
        
        if (isHost && !hostVote) {
            btn.addEventListener('click', () => {
                selectedVoteTarget = targetId;
                renderVotingScreen(data);
            });
        } else {
            btn.disabled = true;
        }

        voteList.appendChild(btn);
    });

    if (isHost && !hostVote && selectedVoteTarget) {
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn primary-glow';
        confirmBtn.style.marginTop = '4px';
        confirmBtn.textContent = `🔒 ยืนยันโหวตให้ ${players[selectedVoteTarget].name}`;
        confirmBtn.addEventListener('click', () => {
            db.ref(`rooms/${roomId}/votes/${hostId}`).set(selectedVoteTarget);
        });
        voteList.appendChild(confirmBtn);
    }

    if (hostVote) {
        voteResult.style.display = 'block';
        const suspectName = players[hostVote] ? players[hostVote].name : "ไม่ทราบชื่อ";
        const suspectHero = data.roles[hostVote] || "-";
        const isTargetSpy = (hostVote === data.spyId);
        const spyName = players[data.spyId] ? players[data.spyId].name : "ไม่ทราบชื่อ";

        if (isTargetSpy) {
            voteResult.innerHTML = `
                <h3 style="font-size:0.95rem; margin-bottom:4px;">🔍 ผลการเปิดเผยบทบาท</h3>
                <p style="margin: 4px 0; font-size:0.85rem;">คนที่ถูกโหวตคือ <b>${suspectName}</b> (ตัวละคร: <b>${suspectHero}</b>)</p>
                <p style="color:#22c55e; font-weight:700; font-size: 1rem;">🎉 ทายถูก! ผู้เล่นฝั่งทีมผู้เล่นชนะทันที!</p>
                <p style="font-size:0.75rem; color:#94a3b8;">(Spy ที่แท้จริงคือ ${spyName})</p>
            `;
        } else {
            voteResult.innerHTML = `
                <h3 style="font-size:0.95rem; margin-bottom:4px;">🔍 ผลการเปิดเผยบทบาท</h3>
                <p style="margin: 4px 0; font-size:0.85rem;">คนที่ถูกโหวตคือ <b>${suspectName}</b> (ตัวละคร: <b>${suspectHero}</b>)</p>
                <p style="color:#ef4444; font-weight:700; font-size: 1rem;">❌ ทายผิด! ฝั่ง Spy เป็นฝ่ายชนะ!</p>
                <p style="font-size:0.75rem; color:#94a3b8;">(Spy ที่แท้จริงคือ ${spyName})</p>
            `;
        }
    }
}

backToLobbyBtn.addEventListener('click', () => {
    db.ref(`rooms/${roomId}`).remove();
});
