// --- ตั้งค่า Firebase (ใช้ค่าเดิมของคุณได้เลย) ---
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

// รายชื่อสถานที่ในเกม Spyfall
const locations = [
    "สถานีอวกาศ", "ธนาคาร", "คาสิโน", "โรงพยาบาล", 
    "กองถ่ายหนัง", "สถานีตำรวจ", "เรือสำราญ", "โรงเรียน", 
    "ฐานทัพทหาร", "โรงแรมหรู", "ซูเปอร์มาร์เก็ต", "สวนสนุก"
];

const roomSelection = document.getElementById('roomSelection');
const lobbyArea = document.getElementById('lobbyArea');
const gameArea = document.getElementById('gameArea');
const nameInput = document.getElementById('nameInput');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const roomTitle = document.getElementById('roomTitle');
const playerList = document.getElementById('playerList');
const startBtn = document.getElementById('startBtn');
const waitText = document.getElementById('waitText');
const roleTitle = document.getElementById('roleTitle');
const roleDesc = document.getElementById('roleDesc');
const locationGrid = document.getElementById('locationGrid');
const restartBtn = document.getElementById('restartBtn');

let myName = '';
let roomId = '';
let myId = 'user_' + Math.random().toString(36).substring(2, 9);
let isHost = false;

// เรนเดอร์รายชื่อสถานที่ให้ทุกคนเห็น
locations.forEach(loc => {
    const div = document.createElement('div');
    div.className = 'loc-item';
    div.textContent = loc;
    locationGrid.appendChild(div);
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

        // อัปเดตรายชื่อผู้เล่น
        playerList.innerHTML = '';
        const players = data.players || {};
        const playerIds = Object.keys(players);

        // คนแรกที่เข้าห้องคือ Host
        if (playerIds[0] === myId) {
            isHost = true;
            startBtn.style.display = 'block';
            waitText.style.display = 'none';
        } else {
            isHost = false;
            startBtn.style.display = 'none';
            waitText.style.display = 'block';
        }

        playerIds.forEach(id => {
            const li = document.createElement('li');
            li.textContent = `👤 ${players[id].name} ${id === playerIds[0] ? '(หัวหน้าห้อง)' : ''}`;
            playerList.appendChild(li);
        });
    });
}

// กดเริ่มเกม (เฉพาะ Host)
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

        // สุ่มเลือกสถานที่
        const secretLocation = locations[Math.floor(Math.random() * locations.length)];
        
        // สุ่มเลือกคนเป็น Spy (เลือก index สุ่มจากผู้เล่นทั้งหมด)
        const spyIndex = Math.floor(Math.random() * playerIds.length);
        
        let rolesData = {};
        playerIds.forEach((id, index) => {
            if (index === spyIndex) {
                rolesData[id] = 'SPY';
            } else {
                rolesData[id] = secretLocation;
            }
        });

        // อัปเดตสถานะเกมลง Firebase
        roomRef.update({
            status: 'playing',
            location: secretLocation,
            roles: rolesData
        });
    });
});

// ฟังสถานะการเปลี่ยนหน้าจอ (Lobby -> Game)
function listenGameState() {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        if (data.status === 'playing') {
            lobbyArea.style.display = 'none';
            gameArea.style.display = 'block';

            const myRole = data.roles[myId];
            if (myRole === 'SPY') {
                roleTitle.textContent = "🤫 คุณคือ: สายลับ (Spy)!";
                roleDesc.textContent = "คุณไม่รู้สถานที่ พยายามเนียนและหลอกถามคนอื่นเพื่อทายสถานที่ให้ถูก!";
            } else {
                roleTitle.textContent = `📍 สถานที่ลับคือ: ${myRole}`;
                roleDesc.textContent = "ช่วยกันตั้งคำถามและจับพิรุธว่าใครคือสายลับ!";
            }

            if (isHost) {
                restartBtn.style.display = 'block';
            }
        } else if (data.status === 'lobby') {
            gameArea.style.display = 'none';
            lobbyArea.style.display = 'block';
            restartBtn.style.display = 'none';
        }
    });
}

// ปุ่มรีเซ็ตกลับมารอหน้าล็อบบี้
restartBtn.addEventListener('click', () => {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.update({
        status: 'lobby',
        location: null,
        roles: null
    });
});
