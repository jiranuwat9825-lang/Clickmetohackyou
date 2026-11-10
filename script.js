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
const lobbyArea = document.getElementById('lobbyArea');
const gameArea = document.getElementById('gameArea');
const voteArea = document.getElementById('voteArea');

const nameInput = document.getElementById('nameInput');
const roomInput = document.getElementById('roomInput');
const categorySelect = document.getElementById('categorySelect');
const joinBtn = document.getElementById('joinBtn');
const activeRoomsList = document.getElementById('activeRoomsList');

const roomTitle = document.getElementById('roomTitle');
const roomCategoryBadge = document.getElementById('roomCategoryBadge');
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
let selectedHeroGuess = "";

// โหลดรายชื่อห้องทั้งหมดที่เปิดอยู่แบบเรียลไทม์เพื่อทำปุ่ม Join ทันที
db.ref('rooms').on('value', (snapshot) => {
    const rooms = snapshot.val();
    activeRoomsList.innerHTML = '';

    if (!rooms || Object.keys(rooms).length === 0) {
        activeRoomsList.innerHTML = `<p class="no-room-text">ยังไม่มีห้องที่เปิดอยู่ในขณะนี้ สร้างห้องใหม่ด้านบนได้เลย!</p>`;
        return;
    }

    Object.keys(rooms).forEach(rId => {
        const rData = rooms[rId];
        const rStatus = rData.status || 'lobby';
        const pCount = rData.players ? Object.keys(rData.players).length : 0;
        const catKey = rData.category || 'rov';
        const catName = categoriesData[catKey] ? categoriesData[catKey].name : 'ROV';

        const card = document.createElement('div');
        card.className = 'room-item-card';

        let statusText = '⏳ กำลังรอผู้เล่น (Lobby)';
        let canJoin = true;

        if (rStatus === 'playing') {
            statusText = '🎮 กำลังเล่นเกมอยู่';
            canJoin = false;
        } else if (rStatus === 'voting') {
            statusText = '🗳️ กำลังช่วงลงคะแนน';
            canJoin = false;
        }

        card.innerHTML = `
            <div class="room-item-info">
                <span class="room-item-name">🏠 ห้อง: ${rId} (${pCount} คน)</span>
                <span class="room-item-status">${catName} | ${statusText}</span>
            </div>
        `;

        const btn = document.createElement('button');
        btn.className = 'join-room-tab-btn';
        btn.textContent = canJoin ? 'เข้าร่วม' : 'ติดเล่นอยู่';
        btn.disabled = !canJoin;

        if (canJoin) {
            btn.addEventListener('click', () => {
                roomInput.value = rId;
                joinBtn.click();
            });
        }

        card.appendChild(btn);
        activeRoomsList.appendChild(card);
    });
});

joinBtn.addEventListener('click', () => {
    myName = nameInput.value.trim();
    roomId = roomInput.value.trim();
    const selectedCategory = categorySelect.value;

    if (!myName || !roomId) {
        alert('กรุณากรอกชื่อและชื่อห้องให้ครบถ้วน');
        return;
    }

    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.once('value', (snapshot) => {
        const roomData = snapshot.val();
        
        // เช็คความปลอดภัย: ถ้าห้องเริ่มเล่นไปแล้ว ห้ามกด Join เข้าห้องเด็ดขาด
        if (roomData && roomData.status && roomData.status !== 'lobby' && roomData.status !== '') {
            alert('❌ ห้องนี้กำลังอยู่ในระหว่างการเล่นเกม ไม่สามารถเข้าร่วมได้ในขณะนี้ ต้องรอจนกว่าจะจบรอบ!');
            return;
        }

        roomSelection.style.display = 'none';
        lobbyArea.style.display = 'block';
        roomTitle.textContent = `ห้อง: ${roomId}`;

        let hostId = roomData ? roomData.hostId : null;

        if (!hostId) {
            hostId = myId;
            roomRef.child('hostId').set(hostId);
            roomRef.child('category').set(selectedCategory);
            roomRef.child('status').set('lobby');
        }

        const playerRef = roomRef.child(`players/${myId}`);
        playerRef.set({ name: myName });
        playerRef.onDisconnect().remove();

        checkHostAndListen();
        listenGameState();
    });
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
        const currentCatKey = data.category || 'rov';
        const catInfo = categoriesData[currentCatKey] || categoriesData['rov'];

        roomCategoryBadge.textContent = `หมวดหมู่: ${catInfo.name}`;

        if (playerIds.length === 0) {
            roomRef.remove();
            return;
        }

        if (hostId === myId) {
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
        const catKey = data.category || 'rov';
        const catData = categoriesData[catKey] || categoriesData['rov'];

        if (playerIds.length < 3) {
            alert('ต้องมีผู้เล่นอย่างน้อย 3 คนถึงจะเริ่มเกมได้!');
            return;
        }

        const laneKeys = Object.keys(catData.lanes);
        const selectedGroupKey = laneKeys[Math.floor(Math.random() * laneKeys.length)];
        let groupItems = [...catData.lanes[selectedGroupKey]];

        const spyIndex = Math.floor(Math.random() * playerIds.length);
        const spyId = playerIds[spyIndex];

        let rolesData = {};

        const spyItemIdx = Math.floor(Math.random() * groupItems.length);
        const spyItem = groupItems.splice(spyItemIdx, 1)[0];
        rolesData[spyId] = spyItem;

        const normalItem = groupItems[Math.floor(Math.random() * groupItems.length)];

        playerIds.forEach((id) => {
            if (id !== spyId) {
                rolesData[id] = normalItem;
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
            currentGroup: selectedGroupKey,
            spyId: spyId,
            endTime: endTime,
            votes: null,
            guess: null,
            spyGuess: null,
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
            const isSpyTag = (id === data.spyId && data.status === 'voting' && data.scoreUpdated) ? ' [Spy]' : '';
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
    hostPostVoteControls.style.display = 'none';

    const players = data.players || {};
    const votes = data.votes || {};
    const guessData = data.guess || {};
    const spyGuessData = data.spyGuess || {};
    const isAmISpy = (myId === data.spyId);
    
    const catKey = data.category || 'rov';
    const catData = categoriesData[catKey] || categoriesData['rov'];
    const currentGroup = data.currentGroup;
    const currentGroupItems = (currentGroup && catData.lanes[currentGroup]) ? catData.lanes[currentGroup] : [];

    const activeCandidates = data.tieCandidates || Object.keys(players);
    const myVote = votes[myId];

    if (isAmISpy) {
        voteInstruction.textContent = myVote ? "✅ คุณ (Spy) ทำการโหวตแล้ว รอสรุปผล..." : "🤫 คุณคือ Spy! เลือกคนที่คิดว่าน่าสงสัยที่สุดและ (จะเลือกทายตัวละครหรือไม่ก็ได้):";
    } else {
        voteInstruction.textContent = myVote ? "✅ คุณได้ทำการโหวตเรียบร้อยแล้ว รอสรุปผล..." : "👉 คลิกเลือกผู้เล่นที่คิดว่าเป็น Spy:";
    }

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

            selectHero.addEventListener('change', (e) => {
                selectedHeroGuess = e.target.value;
            });

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
                    votes: null,
                    guess: null,
                    spyGuess: null,
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
        const spyId = data.spyId;
        const spyName = players[spyId] ? players[spyId].name : "ไม่ทราบชื่อ";
        const realSpyItem = data.roles[spyId] || "-";

        if (isTargetSpy) {
            voteResult.innerHTML = `
                <h3 style="font-size:0.95rem; margin-bottom:4px;">🔍 ผลการเปิดเผยบทบาท</h3>
                <p style="margin: 4px 0; font-size:0.85rem;">คนที่ถูกโหวตสูงสุดคือ <b>${suspectName}</b> (ตัวละคร: <b>${suspectHero}</b>)</p>
                <p style="color:#22c55e; font-weight:700; font-size: 1rem;">🎉 ทายถูก! ฝั่งผู้เล่นจับ Spy สำเร็จ! (ทุกคนในฝั่งผู้เล่นได้ +1 แต้ม)</p>
                <p style="font-size:0.75rem; color:#94a3b8;">(Spy ที่แท้จริงคือ ${spyName})</p>
            `;

            if (isHost && !data.scoreUpdated) {
                let updatedScores = data.scores || {};
                
                Object.keys(players).forEach(pId => {
                    if (pId !== spyId) {
                        if (updatedScores[pId] === undefined) updatedScores[pId] = 0;
                        updatedScores[pId] += 1;
                    }
                });

                Object.keys(guessData).forEach(voterId => {
                    let pGuess = guessData[voterId] || "";
                    if (pGuess !== "" && pGuess.toLowerCase() === realSpyItem.toLowerCase()) {
                        if (updatedScores[voterId] === undefined) updatedScores[voterId] = 0;
                        updatedScores[voterId] += 1;
                    }
                });

                const sGuessObj = spyGuessData[spyId];
                if (sGuessObj && sGuessObj.guessHero !== "") {
                    const targetPlayerItem = data.roles[sGuessObj.targetId] || "";
                    if (sGuessObj.guessHero.toLowerCase() === targetPlayerItem.toLowerCase()) {
                        if (updatedScores[spyId] === undefined) updatedScores[spyId] = 0;
                        updatedScores[spyId] += 1;
                    }
                }

                db.ref(`rooms/${roomId}`).update({
                    scores: updatedScores,
                    scoreUpdated: true
                });
            }

        } else {
            voteResult.innerHTML = `
                <h3 style="font-size:0.95rem; margin-bottom:4px;">🔍 ผลการเปิดเผยบทบาท</h3>
                <p style="margin: 4px 0; font-size:0.85rem;">คนที่ถูกโหวตสูงสุดคือ <b>${suspectName}</b> (ตัวละคร: <b>${suspectHero}</b>)</p>
                <p style="color:#ef4444; font-weight:700; font-size: 1rem;">❌ ทายผิด! ฝั่ง Spy ชนะ (+2 แต้มหลัก)!</p>
                <p style="font-size:0.75rem; color:#94a3b8;">(Spy ที่แท้จริงคือ ${spyName} - ตัวละคร ${realSpyItem})</p>
            `;

            if (isHost && !data.scoreUpdated) {
                let updatedScores = data.scores || {};
                if (updatedScores[spyId] === undefined) updatedScores[spyId] = 0;
                updatedScores[spyId] += 2;

                const sGuessObj = spyGuessData[spyId];
                if (sGuessObj && sGuessObj.guessHero !== "") {
                    const targetPlayerItem = data.roles[sGuessObj.targetId] || "";
                    if (sGuessObj.guessHero.toLowerCase() === targetPlayerItem.toLowerCase()) {
                        updatedScores[spyId] += 1;
                    }
                }

                Object.keys(guessData).forEach(voterId => {
                    let pGuess = guessData[voterId] || "";
                    if (pGuess !== "" && pGuess.toLowerCase() === realSpyItem.toLowerCase()) {
                        if (updatedScores[voterId] === undefined) updatedScores[voterId] = 0;
                        updatedScores[voterId] += 1;
                    }
                });

                db.ref(`rooms/${roomId}`).update({
                    scores: updatedScores,
                    scoreUpdated: true
                });
            }
        }
    }
}

// ปุ่มเริ่มรอบถัดไปสำหรับหัวหน้าห้อง (เปลี่ยนสถานะกลับเป็น lobby เพื่อเปิดให้คนอื่นกด Join ได้)
nextRoundBtn.addEventListener('click', () => {
    const roomRef = db.ref(`rooms/${roomId}`);
    roomRef.once('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        roomRef.update({
            status: 'lobby',
            roles: null,
            currentGroup: null,
            spyId: null,
            votes: null,
            guess: null,
            spyGuess: null,
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
});
