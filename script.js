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

const rovLanes = {
    "แครี่ (Carry Lane)": ["Valhein", "Yorn", "Violet", "Capheny", "Hayate", "Elsu", "Laville", "Thorne", "Tel'Annas", "Eland'orr", "Fennik", "Slimz", "Moren", "Wisp", "Lindis", "Teeri", "Celica", "Erin", "Stuart"],
    "เลนกลาง (Mid Lane)": ["Krixi", "Tulen", "Liliana", "Raz", "Lauriel", "Natalya", "Veera", "Ilumia", "Kahlii", "Mganga", "Preyta", "Jinnar", "Aleister", "Diao Chan", "Zata", "Iggy", "Dirak", "Lorion", "Bonnie", "Yue", "Dyadia", "Heino", "Evita", "Gildur", "Azzen'Ka", "Ishar"],
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

const testGameBtn = document.getElementById('testGameBtn');
const botDebugBox = document.getElementById('botDebugBox');
const botStatusList = document.getElementById('botStatusList');

const scoreBoard = document.getElementById('scoreBoard');
const scoreListBody = document.getElementById('scoreListBody');
const hostPostVoteControls = document.getElementById('hostPostVoteControls');
const nextRoundBtn = document.getElementById('nextRoundBtn');
const backToLobbyBtn = document.getElementById('backToLobbyBtn');
const voteInstruction = document.getElementById('voteInstruction');

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
let selectedHeroGuess = null;

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

    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.once('value', (snapshot) => {
        const roomData = snapshot.val();
        let hostId = roomData ? roomData.hostId : null;

        // ถ้าห้องยังไม่มี host ให้ตั้งคนแรกที่เข้าห้องเป็น host ถาวร
        if (!hostId) {
            hostId = myId;
            roomRef.child('hostId').set(hostId);
        }

        const playerRef = roomRef.child(`players/${myId}`);
        playerRef.set({ name: myName });
        playerRef.onDisconnect().remove();

        checkHostAndListen();
        listenGameState();
    });
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
        const hostId = data.hostId;

        if (playerIds.length === 0) {
            roomRef.remove();
            return;
        }

        // เช็คว่าไอดีเราตรงกับ hostId ที่ถูกล็อกไว้ไหม
        if (hostId === myId) {
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

        playerIds.forEach((id) => {
            const li = document.createElement('li');
            const isThisHost = (id === hostId);
            li.innerHTML = `👤 ${players[id].name} ${isThisHost ? '<span style="color:#38bdf8; font-size:0.8rem; margin-left:auto;">(หัวหน้าห้อง)</span>' : ''}`;
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
        let currentScores = data.scores || {};
        playerIds.forEach(id => {
            if (currentScores[id] === undefined) {
                currentScores[id] = 0;
            }
        });

        roomRef.update({
            status: 'playing',
            roles: rolesData,
            lane: selectedLane,
            spyId: spyId,
            endTime: endTime,
            votes: null,
            guess: null,
            tieCandidates: null,
            scoreUpdated: false,
            scores: currentScores
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
            scoreBoard.style.display = 'none';
            return;
        }

        const scores = data.scores || {};
        const players = data.players || {};
        scoreListBody.innerHTML = '';
        Object.keys(players).forEach(id => {
            const pName = players[id].name;
            const pScore = scores[id] || 0;
            const isSpyTag = (id === data.spyId && data.status === 'voting') ? ' [Spy]' : '';
            const row = document.createElement('div');
            row.className = 'score-row-item';
            row.innerHTML = `<span>${pName}${isSpyTag}</span> <b>${pScore} แต้ม</b>`;
            scoreListBody.appendChild(row);
        });
        scoreBoard.style.display = 'block';

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

// หน้าจอโหวต (แสดงรายชื่อครบถ้วนรวมถึง Spy ให้เลือกโหวต)
function renderVotingScreen(data) {
    voteList.innerHTML = '';
    voteResult.style.display = 'none';
    hostPostVoteControls.style.display = 'none';

    const players = data.players || {};
    const votes = data.votes || {};
    const guessData = data.guess || {};
    const isAmISpy = (myId === data.spyId);
    const currentLaneHeroes = rovLanes[data.lane] || [];

    // แสดงรายชื่อผู้เล่นทั้งหมดให้ครบถ้วนรวมถึง Spy เพื่อให้กดโหวตได้
    const activeCandidates = data.tieCandidates || Object.keys(players);
    const myVote = votes[myId];

    if (isAmISpy) {
        voteInstruction.textContent = "🤫 คุณคือ Spy! คุณไม่มีสิทธิ์โหวต หลบมุมให้เนียนแล้วรอลุ้นผลงาน!";
    } else {
        voteInstruction.textContent = myVote ? "✅ คุณได้ทำการโหวตเรียบร้อยแล้ว รอสรุปผล..." : "👉 คลิกเลือกผู้เล่นที่คิดว่าเป็น Spy และทายตัวละคร:";
    }

    if (!isAmISpy) {
        activeCandidates.forEach(targetId => {
            if (!players[targetId]) return;
            const btn = document.createElement('button');
            btn.className = 'vote-btn';
            if (selectedVoteTarget === targetId) {
                btn.style.borderColor = '#38bdf8';
                btn.style.background = 'rgba(56, 189, 248, 0.25)';
            }

            let voteCount = 0;
            Object.values(votes).forEach(v => { if (v === targetId) voteCount++; });

            btn.innerHTML = `<span>👤 ${players[targetId].name}</span> <span style="font-size:0.8rem; color:#94a3b8;">(คะแนน: ${voteCount})</span>`;
            
            if (!myVote) {
                btn.addEventListener('click', () => {
                    selectedVoteTarget = targetId;
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
                defaultOpt.textContent = "-- เลือกตัวละครที่คิดว่า Spy เป็น --";
                selectHero.appendChild(defaultOpt);

                currentLaneHeroes.forEach(h => {
                    const opt = document.createElement('option');
                    opt.value = h;
                    opt.textContent = h;
                    if (selectedHeroGuess === h) opt.selected = true;
                    selectHero.appendChild(opt);
                });

                selectHero.addEventListener('change', (e) => {
                    selectedHeroGuess = e.target.value;
                });

                voteList.appendChild(selectHero);

                const confirmBtn = document.createElement('button');
                confirmBtn.className = 'btn primary-glow';
                confirmBtn.style.marginTop = '6px';
                confirmBtn.textContent = `🔒 ยืนยันโหวต ${players[targetId].name}`;
                confirmBtn.addEventListener('click', () => {
                    if (!selectedHeroGuess) {
                        alert('กรุณาเลือกตัวละครที่ต้องการทายก่อนยืนยัน');
                        return;
                    }
                    db.ref(`rooms/${roomId}/votes/${myId}`).set(targetId);
                    db.ref(`rooms/${roomId}/guess/${myId}`).set(selectedHeroGuess);
                });
                voteList.appendChild(confirmBtn);
            }
        });
    }

    const validVotersCount = Object.keys(players).filter(id => id !== data.spyId).length;
    const totalVotes = Object.keys(votes).length;

    if (totalVotes >= Math.min(1, validVotersCount)) {
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
                    votes: null,
                    guess: null,
                    tieHandled: true
                });
            }
            voteResult.innerHTML = `<p style="color:#fbbf24; font-weight:700;">⚠️ ผลโหวตเท่ากัน! กำลังรีโหวตเลือกระหว่างผู้เล่นที่คะแนนซ้ำกัน...</p>`;
            return;
        }

        const mostVotedId = topTargets[0];
        const suspectName = players[mostVotedId] ? players[mostVotedId].name : "ไม่ทราบชื่อ";
        const suspectHero = data.roles[mostVotedId] || "-";
        const isTargetSpy = (mostVotedId === data.spyId);
        const spyName = players[data.spyId] ? players[data.spyId].name : "ไม่ทราบชื่อ";
        const realSpyHero = data.roles[data.spyId] || "-";

        const firstVoterId = Object.keys(votes)[0];
        const playerGuess = guessData[firstVoterId] || "";
        let isHeroGuessedCorrectly = (playerGuess.toLowerCase() === realSpyHero.toLowerCase());

        if (isTargetSpy) {
            voteResult.innerHTML = `
                <h3 style="font-size:0.95rem; margin-bottom:4px;">🔍 ผลการเปิดเผยบทบาท</h3>
                <p style="margin: 4px 0; font-size:0.85rem;">คนที่ถูกโหวตสูงสุดคือ <b>${suspectName}</b> (ตัวละคร: <b>${suspectHero}</b>)</p>
                <p style="color:#22c55e; font-weight:700; font-size: 1rem;">🎉 ทายถูก! ฝั่งผู้เล่นจับ Spy สำเร็จ!</p>
                <p style="font-size:0.75rem; color:#cbd5e1;">🎯 ทายตัวละคร: "${playerGuess}" ${isHeroGuessedCorrectly ? '<b style="color:#22c55e;">(ถูกต้อง! รับโบนัส 2 แต้มคนเดียว)</b>' : '<b style="color:#ef4444;">(ผิด ตัวจริงคือ ' + realSpyHero + ')</b>'}</p>
                <p style="font-size:0.75rem; color:#94a3b8;">(Spy ที่แท้จริงคือ ${spyName})</p>
            `;

            if (isHost && !data.scoreUpdated) {
                let updatedScores = data.scores || {};
                Object.keys(votes).forEach(voterId => {
                    if (updatedScores[voterId] === undefined) updatedScores[voterId] = 0;
                    let pGuess = guessData[voterId] || "";
                    if (pGuess.toLowerCase() === realSpyHero.toLowerCase()) {
                        updatedScores[voterId] += 2;
                    } else {
                        updatedScores[voterId] += 1;
                    }
                });
                db.ref(`rooms/${roomId}`).update({
                    scores: updatedScores,
                    scoreUpdated: true
                });
            }

        } else {
            voteResult.innerHTML = `
                <h3 style="font-size:0.95rem; margin-bottom:4px;">🔍 ผลการเปิดเผยบทบาท</h3>
                <p style="margin: 4px 0; font-size:0.85rem;">คนที่ถูกโหวตสูงสุดคือ <b>${suspectName}</b> (ตัวละคร: <b>${suspectHero}</b>)</p>
                <p style="color:#ef4444; font-weight:700; font-size: 1rem;">❌ ทายผิด! ฝั่ง Spy ชนะ (+2 คะแนน)!</p>
                <p style="font-size:0.75rem; color:#94a3b8;">(Spy ที่แท้จริงคือ ${spyName} - ตัวละคร ${realSpyHero})</p>
            `;

            if (isHost && !data.scoreUpdated) {
                let updatedScores = data.scores || {};
                const spyId = data.spyId;
                if (updatedScores[spyId] === undefined) updatedScores[spyId] = 0;
                updatedScores[spyId] += 2;

                db.ref(`rooms/${roomId}`).update({
                    scores: updatedScores,
                    scoreUpdated: true
                });
            }
        }
    }
}

// ปุ่มเริ่มรอบถัดไปสำหรับหัวหน้าห้อง
nextRoundBtn.addEventListener('click', () => {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.once('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        roomRef.update({
            status: 'lobby',
            roles: null,
            lane: null,
            spyId: null,
            votes: null,
            guess: null,
            tieCandidates: null,
            tieHandled: false,
            scoreUpdated: false
        });
        selectedVoteTarget = null;
        selectedHeroGuess = null;
    });
});

backToLobbyBtn.addEventListener('click', () => {
    db.ref(`rooms/${roomId}`).remove();
});
