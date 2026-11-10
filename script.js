// --- ตั้งค่า Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyC3IuOtFTc200JcUmpVe1GEv13nCj1EM8",
    authDomain: "xo-game-e5fdd.firebaseapp.com",
    databaseURL: "https://xo-game-e5fdd-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "xo-game-e5fdd",
    storageBucket: "xo-game-e5fdd.firebasestorage.app",
    messagingSenderId: "890496938682",
    appId: "1:890496938682:web:c99edd29e639415ac4883",
    measurementId: "G-4RHMNWP5ZJ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const rovLanes = {
    "แครี่ (Carry Lane)": ["Valhein", "Yorn", "Violet", "Capheny", "Hayate", "Elsu", "Laville", "Thorne", "Tel'Annas", "Eland'orr", "Fennik", "Slimz", "Moren", "Wisp", "Lindis", "Teeri", "Celica"],
    "เลนกลาง (Mid Lane)": ["Krixi", "Tulen", "Liliana", "Raz", "Lauriel", "Natalya", "Veera", "Ilumia", "Kahlii", "Mganga", "Preyta", "Jinnar", "Aleister", "Diao Chan", "Zata", "Iggy", "Dirak", "Lorion", "Thorne", "Valhein"],
    "ออฟเลน (Dark Slayer Lane)": ["Florentino", "Yena", "Ryoma", "Maloch", "Lu Bu", "Allain", "Veres", "Omen", "Airi", "Amily", "Arthur", "Astrid", "Skud", "Taara", "Qi", "Richter", "Rourke", "Zuka", "Tachi", "Dextra", "Biron"],
    "ป่า (Jungle / Assassin)": ["Nakroth", "Murad", "Butterfly", "Aoi", "Keera", "Zill", "Kriknak", "Quillen", "Enzo", "Sinestrea", "Wukong", "Paine", "Bright", "Kaine"],
    "โรมมิ่ง / ซัพพอร์ต (Roaming)": ["Grakk", "Alice", "Thane", "Toro", "Zip", "Aya", "Arum", "Cresht", "Baldum", "Mina", "Omega", "Annette", "Schnaug", "Helen", "Krizzix", "Rouie", "Lumburr", "Ming", "Dolia"]
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

const allHeroes = Object.values(rovLanes).flat();
allHeroes.forEach(hero => {
    const div = document.createElement('div');
    div.className = 'hero-item';
    div.textContent = hero;
    heroGrid.appendChild(div);
});

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

// ฟังก์ชันปุ่ม Test Game (เพิ่มบอทโดยไม่ให้ทับตำแหน่งหัวหน้าห้องของคุณ)
testGameBtn.addEventListener('click', () => {
    if (!roomId) return;
    const bots = {
        'bot_1': { name: '🤖 บอทโรมมิ่ง' },
        'bot_2': { name: '🤖 บอทแครี่' },
        'bot_3': { name: '🤖 บอทเลนกลาง' },
        'bot_4': { name: '🤖 บอทป่า' }
    };

    // ใช้ update เพื่อเพิ่มบอทเข้าไปโดยคงตัวตนของคุณ (myId) ไว้เป็นคนแรกสุด
    db.ref(`rooms/${roomId}/players`).update(bots);
    testGameBtn.style.display = 'none'; // ซ่อนปุ่มหลังกดแล้ว
});

function checkHostAndListen() {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        playerList.innerHTML = '';
        const players = data.players || {};
        const playerIds = Object.keys(players);

        // เช็คว่าคุณคือคนแรกสุดในรายชื่อไหม (Host)
        if (playerIds.length > 0 && playerIds[0] === myId) {
            isHost = true;
            startBtn.style.display = 'block';
            waitText.style.display = 'none';
            hostControls.style.display = 'block';
            
            // ถ้ายังไม่มีบอทในห้อง ให้แสดงปุ่ม Test Game
            if (!players['bot_1']) {
                testGameBtn.style.display = 'block';
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
            li.textContent = `👤 ${players[id].name} ${index === 0 ? '(หัวหน้าห้อง)' : ''}`;
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
        const laneHeroes = [...rovLanes[selectedLane]];

        const normalHeroIndex1 = Math.floor(Math.random() * laneHeroes.length);
        const normalHero1 = laneHeroes.splice(normalHeroIndex1, 1)[0];
        const normalHero2 = laneHeroes.length > 0 ? laneHeroes.splice(Math.floor(Math.random() * laneHeroes.length), 1)[0] : normalHero1;

        const otherLanes = laneKeys.filter(l => l !== selectedLane);
        const randomOtherLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
        const spyHeroes = rovLanes[randomOtherLane];
        const spyHero = spyHeroes[Math.floor(Math.random() * spyHeroes.length)];

        const spyIndex = Math.floor(Math.random() * playerIds.length);
        
        let rolesData = {};
        playerIds.forEach((id, index) => {
            if (index === spyIndex) {
                rolesData[id] = spyHero;
            } else {
                rolesData[id] = index % 2 === 0 ? normalHero1 : normalHero2;
            }
        });

        const endTime = Date.now() + 300 * 1000;

        roomRef.update({
            status: 'playing',
            roles: rolesData,
            spyId: playerIds[spyIndex],
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
        if (!data) return;

        if (data.status === 'playing') {
            lobbyArea.style.display = 'none';
            voteArea.style.display = 'none';
            gameArea.style.display = 'block';

            const roles = data.roles || {};
            const myHero = roles[myId] || "กำลังซิงค์ข้อมูล...";
            heroName.textContent = myHero;

            botDebugBox.style.display = 'block';
            botStatusList.innerHTML = '';
            const players = data.players || {};

            Object.keys(players).forEach(id => {
                if (id !== myId && id.startsWith('bot_')) {
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

function renderVotingScreen(data) {
    voteList.innerHTML = '';
    voteResult.style.display = 'none';
    backToLobbyBtn.style.display = isHost ? 'block' : 'none';

    const players = data.players || {};
    const votes = data.votes || {};

    Object.keys(players).forEach(targetId => {
        const btn = document.createElement('button');
        btn.className = 'vote-btn';
        
        let voteCount = 0;
        Object.values(votes).forEach(v => {
            if (v === targetId) voteCount++;
        });

        btn.textContent = `👤 ${players[targetId].name} (ถูกโหวต: ${voteCount} คะแนน)`;
        
        btn.addEventListener('click', () => {
            db.ref(`rooms/${roomId}/votes/${myId}`).set(targetId);
        });

        voteList.appendChild(btn);
    });

    const totalVotes = Object.keys(votes).length;
    const totalPlayers = Object.keys(players).length;

    if (totalVotes > 0) {
        let voteCounts = {};
        Object.values(votes).forEach(targetId => {
            voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        });

        let mostVotedId = null;
        let maxCount = 0;
        for (let id in voteCounts) {
            if (voteCounts[id] > maxCount) {
                maxCount = voteCounts[id];
                mostVotedId = id;
            }
        }

        if (totalVotes >= Math.ceil(totalPlayers / 2)) {
            voteResult.style.display = 'block';
            if (data.spyId && players[data.spyId]) {
                if (mostVotedId === data.spyId) {
                    voteResult.innerHTML = `🎉 <span style="color:#22c55e;">ทายถูก!</span> ผู้เล่นจับ Spy ได้สำเร็จ (${players[data.spyId].name} คือ Spy!)`;
                } else {
                    voteResult.innerHTML = `❌ <span style="color:#ef4444;">ทายผิด!</span> คนที่ถูกโหวตไม่ใช่ Spy (Spy ที่แท้จริงคือ ${players[data.spyId].name})`;
                }
            }
        }
    }
}

backToLobbyBtn.addEventListener('click', () => {
    db.ref(`rooms/${roomId}`).update({
        status: 'lobby',
        roles: null,
        spyId: null,
        votes: null
    });
});
