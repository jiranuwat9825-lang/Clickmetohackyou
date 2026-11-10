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

// ฐานข้อมูลฮีโร่ ROV แยกตามเลน
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

let myName = '';
let roomId = '';

// ใช้ LocalStorage เพื่อจำ ID เดิมของผู้เล่น ไม่ให้เปลี่ยนมั่วเวลารีเฟรช
let myId = localStorage.getItem('rov_spy_myid');
if (!myId) {
    myId = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('rov_spy_myid', myId);
}

let isHost = false;
let timerInterval = null;

// แสดงรายชื่อฮีโร่รวมทั้งหมด
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

function checkHostAndListen() {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        playerList.innerHTML = '';
        const players = data.players || {};
        const playerIds = Object.keys(players);

        // เช็คว่าเราคือคนแรกที่เข้าห้องไหม (เป็น Host)
        if (playerIds.length > 0 && playerIds[0] === myId) {
            isHost = true;
            startBtn.style.display = 'block';
            waitText.style.display = 'none';
            hostControls.style.display = 'block';
        } else {
            isHost = false;
            startBtn.style.display = 'none';
            waitText.style.display = 'block';
            hostControls.style.display = 'none';
        }

        playerIds.forEach((id, index) => {
            const li = document.createElement('li');
            li.textContent = `👤 ${players[id].name} ${index === 0 ? '(หัวหน้าห้อง)' : ''}`;
            playerList.appendChild(li);
        });
    });
}

// กดเริ่มเกม (สุ่มเลน และสุ่มฮีโร่)
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

        // 1. สุ่มเลนหลักมา 1 เลน
        const laneKeys = Object.keys(rovLanes);
        const selectedLane = laneKeys[Math.floor(Math.random() * laneKeys.length)];
        const laneHeroes = [...rovLanes[selectedLane]];

        // สุ่มตัวละครหลักสำหรับคนปกติ
        const normalHeroIndex1 = Math.floor(Math.random() * laneHeroes.length);
        const normalHero1 = laneHeroes.splice(normalHeroindex = normalHeroIndex1, 1)[0];
        const normalHero2 = laneHeroes.length > 0 ? laneHeroes.splice(Math.floor(Math.random() * laneHeroes.length), 1)[0] : normalHero1;

        // สุ่มตัวละครปลอมสำหรับ Spy (จากเลนอื่น)
        const otherLanes = laneKeys.filter(l => l !== selectedLane);
        const randomOtherLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
        const spyHeroes = rovLanes[randomOtherLane];
        const spyHero = spyHeroes[Math.floor(Math.random() * spyHeroes.length)];

        // สุ่มเลือกผู้เล่นที่เป็น Spy
        const spyIndex = Math.floor(Math.random() * playerIds.length);
        
        let rolesData = {};
        playerIds.forEach((id, index) => {
            if (index === spyIndex) {
                rolesData[id] = spyHero; // ตัวปลอม
            } else {
                rolesData[id] = index % 2 === 0 ? normalHero1 : normalHero2;
            }
        });

        const endTime = Date.now() + 300 * 1000; // 5 นาที

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

            // ดึงฮีโร่ของตัวเองจาก Firebase มาแสดงผล
            const roles = data.roles || {};
            const myHero = roles[myId] || "กำลังซิงค์ข้อมูล...";
            heroName.textContent = myHero;

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
        }
    });
}

// ฟังก์ชันจับเวลา
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

// หน้าจอโหวต
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
