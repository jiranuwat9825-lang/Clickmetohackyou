const firebaseConfig = {
    apiKey: "AIzaSyC3IuOTFTc200JcUmpVe1GEv13nCj1EM8",
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
    rov: {
        name: "ROV (Arena of Valor)",
        groups: {
            "แครี่ (Carry Lane)": ["Valhein", "Yorn", "Violet", "Capheny", "Hayate", "Elsu", "Laville", "Thorne", "Tel'Annas", "Eland'orr", "Fennik", "Slimz", "Moren", "Wisp", "Lindis", "Teeri", "Celica", "Erin", "Stuart"],
            "เลนกลาง (Mid Lane)": ["Krixi", "Tulen", "Liliana", "Raz", "Lauriel", "Natalya", "Veera", "Ilumia", "Kahlii", "Mganga", "Preyta", "Jinnar", "Aleister", "Diao Chan", "Zata", "Iggy", "Dirak", "Lorion", "Bonnie", "Yue", "Dyadia", "Heino", "Evita", "Gildur", "Azzen'Ka", "Ishar"],
            "ออฟเลน (Dark Slayer Lane)": ["Florentino", "Yena", "Ryoma", "Maloch", "Lu Bu", "Allain", "Veres", "Omen", "Airi", "Amily", "Arthur", "Astrid", "Skud", "Taara", "Qi", "Richter", "Rourke", "Zuka", "Tachi", "Dextra", "Biron", "Bijan", "Yan", "Wonder Woman", "Arduin", "Mortos", "Max", "Errol", "Volkath", "Ata"],
            "ป่า (Jungle / Assassin)": ["Nakroth", "Murad", "Butterfly", "Aoi", "Keera", "Zill", "Kriknak", "Quillen", "Enzo", "Sinestrea", "Wukong", "Paine", "Bright", "Kaine", "Zanis", "Zephys"],
            "โรมมิ่ง / ซัพพอร์ต (Roaming)": ["Grakk", "Alice", "Thane", "Toro", "Zip", "Aya", "Arum", "Cresht", "Baldum", "Mina", "Omega", "Annette", "Helen", "Krizzix", "Rouie", "Lumburr", "Ming", "Dolia", "TeeMee", "Chaugnar", "Sephera", "Xeniel", "Ormarr", "Wiro", "Roxie"]
        }
    }
};

const $ = id => document.getElementById(id);

const roomSelection = $("roomSelection");
const createRoomModal = $("createRoomModal");
const lobbyArea = $("lobbyArea");
const gameArea = $("gameArea");
const whoAmIArea = $("whoAmIArea");
const voteArea = $("voteArea");

const nameInput = $("nameInput");
const showCreateModalBtn = $("showCreateModalBtn");
const backToHomeBtn = $("backToHomeBtn");
const newRoomInput = $("newRoomInput");
const gameModeSelect = $("gameModeSelect");
const categorySelect = $("categorySelect");
const settingValueInput = $("settingValueInput");
const roundOrTimeLabel = $("roundOrTimeLabel");
const confirmCreateBtn = $("confirmCreateBtn");
const activeRoomsList = $("activeRoomsList");

const hostSettingsBox = $("hostSettingsBox");
const lobbyGameModeSelect = $("lobbyGameModeSelect");
const lobbyCategorySelect = $("lobbyCategorySelect");
const lobbySettingValueInput = $("lobbySettingValueInput");
const lobbySettingLabel = $("lobbySettingLabel");

const roomTitle = $("roomTitle");
const roomCategoryBadge = $("roomCategoryBadge");
const playerList = $("playerList");
const startBtn = $("startBtn");
const waitText = $("waitText");
const closeRoomBtn = $("closeRoomBtn");

const heroName = $("heroName");
const heroGrid = $("heroGrid");
const heroListTitle = $("heroListTitle");
const roundIndicator = $("roundIndicator");
const currentSpeakerBox = $("currentSpeakerBox");
const endTurnBtn = $("endTurnBtn");
const fullTurnOrderContainer = $("fullTurnOrderContainer");
const skipToVoteBtn = $("skipToVoteBtn");

const whoAmITimer = $("whoAmITimer");
const othersRolesGrid = $("othersRolesGrid");
const myGuessSelect = $("myGuessSelect");
const submitMyGuessBtn = $("submitMyGuessBtn");
const guessControlsDiv = $("guessControlsDiv");
const guessStatusText = $("guessStatusText");
const whoAmITurnOrderContainer = $("whoAmITurnOrderContainer");
const whoAmISkipBtn = $("whoAmISkipBtn");

const voteAreaTitle = $("voteAreaTitle");
const voteInstruction = $("voteInstruction");
const voteList = $("voteList");
const voteResult = $("voteResult");
const scoreBoard = $("scoreBoard");
const scoreListBody = $("scoreListBody");
const hostPostVoteControls = $("hostPostVoteControls");
const nextRoundBtn = $("nextRoundBtn");
const backToLobbyBtn = $("backToLobbyBtn");

let myId = localStorage.getItem("rov_spy_myid");
if (!myId) {
    myId = "user_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("rov_spy_myid", myId);
}

let myName = "";
let roomId = "";
let isHost = false;
let selectedVoteTarget = null;
let selectedHeroGuess = "";
let whoAmITimerInterval = null;
let roomListenerRef = null;
let roomListener = null;

function getCategoryData(categoryKey) {
    return categoriesData[categoryKey] || categoriesData.rov;
}

function getSettingValue(value, fallback) {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) && n >= 1 ? n : fallback;
}

function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function getRandomGroup(categoryKey) {
    const groups = getCategoryData(categoryKey).groups;
    const keys = Object.keys(groups);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return { key, items: [...groups[key]] };
}

function updateSettingLabels(mode) {
    const isWhoAmI = mode === "whoami";
    roundOrTimeLabel.textContent = isWhoAmI ? "⏱️ เวลาจำกัด (นาที)" : "🔄 จำนวนรอบการพูด";
    settingValueInput.value = isWhoAmI ? "3" : "2";
    lobbySettingLabel.textContent = isWhoAmI ? "⏱️ เวลาจำกัด (นาที)" : "🔄 จำนวนรอบการพูด";
}

function renderScores(players, scores) {
    scoreListBody.innerHTML = "";
    const ids = Object.keys(players || {});
    ids.sort((a, b) => (scores?.[b] || 0) - (scores?.[a] || 0));

    ids.slice(0, 6).forEach(id => {
        const row = document.createElement("div");
        row.className = "score-row-item";

        const name = document.createElement("span");
        name.textContent = `${players[id]?.name || "ผู้เล่น"}${id === myId ? " (you)" : ""}`;

        const score = document.createElement("b");
        score.textContent = `${scores?.[id] || 0} แต้ม`;

        row.append(name, score);
        scoreListBody.appendChild(row);
    });

    scoreBoard.style.display = ids.length ? "block" : "none";
}

function attachRoomListener() {
    if (roomListenerRef && roomListener) {
        roomListenerRef.off("value", roomListener);
    }

    roomListenerRef = db.ref(`rooms/${roomId}`);
    roomListener = snapshot => {
        const data = snapshot.val();

        if (!data) {
            if (roomId) {
                alert("ห้องถูกปิดหรือลบแล้ว");
                location.reload();
            }
            return;
        }

        isHost = data.hostId === myId;
        const players = data.players || {};
        renderScores(players, data.scores || {});
        renderLobby(data);

        if (data.status === "playing") {
            voteArea.style.display = "none";

            if (data.gameMode === "whoami") {
                gameArea.style.display = "none";
                whoAmIArea.style.display = "flex";
                renderWhoAmI(data);
                startWhoAmITimer(data.endTime);
            } else {
                whoAmIArea.style.display = "none";
                gameArea.style.display = "flex";
                renderSpyfall(data);
                if (whoAmITimerInterval) clearInterval(whoAmITimerInterval);
            }
        } else if (data.status === "voting") {
            gameArea.style.display = "none";
            whoAmIArea.style.display = "none";
            lobbyArea.style.display = "none";
            voteArea.style.display = "flex";
            if (whoAmITimerInterval) clearInterval(whoAmITimerInterval);
            renderResultsOrVoting(data);
        } else {
            gameArea.style.display = "none";
            whoAmIArea.style.display = "none";
            voteArea.style.display = "none";
            lobbyArea.style.display = "flex";
            if (whoAmITimerInterval) clearInterval(whoAmITimerInterval);
        }
    };

    roomListenerRef.on("value", roomListener);
}

function renderLobby(data) {
    const players = data.players || {};
    const ids = Object.keys(players);
    const mode = data.gameMode || "spyfall";
    const setting = getSettingValue(data.settingValue, mode === "whoami" ? 3 : 2);
    const category = getCategoryData(data.category);

    roomTitle.textContent = `ห้อง: ${roomId}`;
    roomCategoryBadge.textContent =
        `โหมด: ${mode === "whoami" ? "ฉันคือใคร" : "Spyfall"} | หมวด: ${category.name} | ` +
        (mode === "whoami" ? `เวลา: ${setting} นาที` : `รอบ: ${setting}`);

    playerList.innerHTML = "";
    ids.forEach(id => {
        const li = document.createElement("li");
        const name = document.createElement("span");
        name.textContent = `👤 ${players[id]?.name || "ผู้เล่น"}${id === myId ? " (you)" : ""}`;
        li.appendChild(name);

        if (id === data.hostId) {
            const hostTag = document.createElement("span");
            hostTag.className = "host-tag";
            hostTag.textContent = "(หัวหน้าห้อง)";
            hostTag.style.cssText = "margin-left:auto;color:#38bdf8;font-size:0.75rem;";
            li.appendChild(hostTag);
        }
        playerList.appendChild(li);
    });

    if (isHost && data.status === "lobby") {
        hostSettingsBox.style.display = "flex";
        closeRoomBtn.style.display = "block";
        startBtn.style.display = "block";
        waitText.style.display = "none";

        lobbyGameModeSelect.value = mode;
        lobbyCategorySelect.value = data.category || "rov";
        lobbySettingValueInput.value = setting;
        updateSettingLabels(mode);
    } else {
        hostSettingsBox.style.display = "none";
        closeRoomBtn.style.display = "none";
        startBtn.style.display = "none";
        waitText.style.display = "block";
    }

    skipToVoteBtn.style.display = isHost && data.status === "playing" && mode === "spyfall" ? "block" : "none";
    whoAmISkipBtn.style.display = isHost && data.status === "playing" && mode === "whoami" ? "block" : "none";
}

function renderTurnOrder(container, order, players, hiddenIds = new Set()) {
    container.innerHTML = "";
    let displayedIndex = 0;

    (order || []).forEach(id => {
        if (!players[id] || hiddenIds.has(id)) return;
        displayedIndex++;

        const item = document.createElement("div");
        item.className = "turn-order-item";
        item.textContent = `${displayedIndex}. ${players[id].name}${id === myId ? " (you)" : ""}`;
        container.appendChild(item);
    });

    if (displayedIndex === 0) {
        const empty = document.createElement("div");
        empty.className = "turn-order-item";
        empty.textContent = "ไม่มีรายชื่อที่ต้องแสดง";
        container.appendChild(empty);
    }
}

function renderSpyfall(data) {
    const players = data.players || {};
    const roles = data.roles || {};
    const order = data.turnOrder || [];
    const turnIndex = Number(data.currentTurnIndex) || 0;
    const currentSpeakerId = order[turnIndex];

    heroName.textContent = roles[myId] || "กำลังซิงค์ข้อมูล...";
    roundIndicator.textContent = `รอบที่ ${data.currentRound || 1} จาก ${data.totalRounds || 1}`;

    if (currentSpeakerId === myId) {
        currentSpeakerBox.textContent = "🗣️ ถึงตาคุณพูดแล้ว";
        endTurnBtn.style.display = "block";
        endTurnBtn.disabled = false;
    } else {
        currentSpeakerBox.textContent = `⏳ รอ ${players[currentSpeakerId]?.name || "ผู้เล่น"} พูด`;
        endTurnBtn.style.display = "none";
    }

    renderTurnOrder(fullTurnOrderContainer, order, players);

    heroGrid.innerHTML = "";
    const category = getCategoryData(data.category);
    const items = category.groups[data.currentGroup] || [];
    heroListTitle.textContent = `🛡️ ตัวละครในกลุ่ม: ${data.currentGroup || ""}`;

    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "hero-item";
        div.textContent = item;
        heroGrid.appendChild(div);
    });
}

function renderWhoAmI(data) {
    const players = data.players || {};
    const roles = data.roles || {};
    const attempts = data.attempts || {};
    const correct = data.guessedCorrectly || {};
    const myAttempts = attempts[myId] ?? 1;

    othersRolesGrid.innerHTML = "";
    Object.keys(players).forEach(id => {
        if (id === myId) return;

        const div = document.createElement("div");
        div.className = "hero-item";
        const name = document.createElement("b");
        name.textContent = players[id]?.name || "ผู้เล่น";
        const role = document.createElement("span");
        role.textContent = roles[id] || "—";
        role.style.cssText = "display:block;color:#38bdf8;margin-top:3px;";
        div.append(name, role);
        othersRolesGrid.appendChild(div);
    });

    const category = getCategoryData(data.category);
    const items = category.groups[data.currentGroup] || [];
    if (myGuessSelect.dataset.group !== data.currentGroup) {
        myGuessSelect.innerHTML = '<option value="">-- เลือกตัวละครที่คุณคิดว่าเป็น --</option>';
        items.forEach(item => {
            const option = document.createElement("option");
            option.value = item;
            option.textContent = item;
            myGuessSelect.appendChild(option);
        });
        myGuessSelect.dataset.group = data.currentGroup || "";
    }

    if (correct[myId]) {
        guessStatusText.textContent = "🎉 คุณตอบถูกแล้ว ได้รับ 1 คะแนน";
        guessControlsDiv.style.display = "none";
    } else if (myAttempts <= 0) {
        guessStatusText.textContent = "❌ คุณตอบผิดแล้ว ได้ 0 คะแนนในรอบนี้";
        guessControlsDiv.style.display = "none";
    } else {
        guessStatusText.textContent = "🎯 เลือกคำตอบได้ 1 ครั้ง";
        guessControlsDiv.style.display = "flex";
    }

    // แสดงเฉพาะลำดับ ไม่เน้นว่าใครกำลังพูด
    // ผู้ที่ตอบถูกแล้วจะถูกนำออกจากรายการ
    const alreadyCorrectIds = new Set(
        Object.keys(correct).filter(id => correct[id])
    );
    renderTurnOrder(whoAmITurnOrderContainer, data.turnOrder || [], players, alreadyCorrectIds);
}

function startWhoAmITimer(endTime) {
    if (whoAmITimerInterval) clearInterval(whoAmITimerInterval);
    if (!endTime) {
        whoAmITimer.textContent = "00:00";
        return;
    }

    const update = async () => {
        const secondsLeft = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
        const seconds = String(secondsLeft % 60).padStart(2, "0");
        whoAmITimer.textContent = `${minutes}:${seconds}`;

        if (secondsLeft === 0 && isHost) {
            await finishWhoAmIIfReady(true);
        }
    };

    update();
    whoAmITimerInterval = setInterval(update, 1000);
}

async function finishWhoAmIIfReady(force = false) {
    if (!roomId || !isHost) return;

    const roomRef = db.ref(`rooms/${roomId}`);
    const snapshot = await roomRef.once("value");
    const data = snapshot.val();
    if (!data || data.status !== "playing" || data.gameMode !== "whoami") return;

    const players = Object.keys(data.players || {});
    const attempts = data.attempts || {};
    const correct = data.guessedCorrectly || {};
    const allFinished = players.every(id => (attempts[id] ?? 1) <= 0 || correct[id]);

    if (force || allFinished) {
        await roomRef.transaction(current => {
            if (!current || current.status !== "playing") return;
            current.status = "voting";
            return current;
        });
    }
}

function renderResultsOrVoting(data) {
    if (data.gameMode === "whoami") {
        renderWhoAmIResults(data);
        return;
    }
    renderSpyfallVoting(data);
}

function renderWhoAmIResults(data) {
    voteAreaTitle.textContent = "🏁 สรุปผลโหมด ฉันคือใคร";
    voteInstruction.textContent = "เฉลยตัวละครและคะแนนของรอบนี้";
    voteList.innerHTML = "";
    voteResult.style.display = "block";
    hostPostVoteControls.style.display = isHost ? "flex" : "none";

    const players = data.players || {};
    const roles = data.roles || {};
    const correct = data.guessedCorrectly || {};

    voteResult.innerHTML = "";
    const heading = document.createElement("h3");
    heading.textContent = "👥 ผลการทาย";
    heading.style.color = "#38bdf8";
    voteResult.appendChild(heading);

    Object.keys(players).forEach(id => {
        const line = document.createElement("p");
        line.style.marginTop = "6px";
        line.textContent =
            `${players[id]?.name || "ผู้เล่น"}${id === myId ? " (you)" : ""}: ` +
            `${roles[id] || "—"} — ${correct[id] ? "ตอบถูก +1 คะแนน" : "0 คะแนน"}`;
        voteResult.appendChild(line);
    });
}

function renderSpyfallVoting(data) {
    voteAreaTitle.textContent = "🗳️ โหวตหา Spy";
    voteList.innerHTML = "";
    voteResult.style.display = "none";
    hostPostVoteControls.style.display = "none";

    const players = data.players || {};
    const playerIds = Object.keys(players);
    const votes = data.votes || {};
    const myVote = votes[myId];
    const activeCandidates = data.tieCandidates || playerIds;

    const votedCount = playerIds.filter(id => votes[id]).length;

    voteInstruction.textContent = myVote
        ? `คุณโหวตแล้ว รอผู้เล่นคนอื่น (${votedCount}/${playerIds.length})`
        : `เลือกผู้เล่นที่คิดว่าเป็น Spy (${votedCount}/${playerIds.length})`;

    activeCandidates.forEach(targetId => {
        if (!players[targetId] || targetId === myId) return;

        const button = document.createElement("button");
        button.className = `vote-btn${selectedVoteTarget === targetId ? " selected" : ""}`;
        button.disabled = Boolean(myVote);

        const name = document.createElement("span");
        name.textContent = players[targetId].name || "ผู้เล่น";

        const count = Object.values(votes).filter(id => id === targetId).length;
        const countLabel = document.createElement("span");
        countLabel.textContent = `โหวต ${count}`;
        countLabel.style.cssText = "color:#94a3b8;font-size:0.75rem;";

        button.append(name, countLabel);
        button.addEventListener("click", () => {
            if (myVote) return;
            selectedVoteTarget = targetId;
            selectedHeroGuess = "";
            renderSpyfallVoting(data);
        });
        voteList.appendChild(button);

        if (selectedVoteTarget === targetId && !myVote) {
            const category = getCategoryData(data.category);
            const items = category.groups[data.currentGroup] || [];

            const select = document.createElement("select");
            select.className = "form-select";
            const none = document.createElement("option");
            none.value = "";
            none.textContent = "-- ไม่ทายตัวละคร --";
            select.appendChild(none);

            items.forEach(item => {
                const option = document.createElement("option");
                option.value = item;
                option.textContent = item;
                select.appendChild(option);
            });

            select.value = selectedHeroGuess;
            select.addEventListener("change", event => {
                selectedHeroGuess = event.target.value;
            });
            voteList.appendChild(select);

            const confirm = document.createElement("button");
            confirm.className = "btn primary-glow";
            confirm.textContent = `🔒 ยืนยันโหวต ${players[targetId].name}`;
            confirm.addEventListener("click", () => submitSpyfallVote(targetId, selectedHeroGuess));
            voteList.appendChild(confirm);
        }
    });

    // ประมวลผลเฉพาะเมื่อผู้เล่นทุกคนโหวตแล้ว
    if (playerIds.length > 0 && votedCount === playerIds.length) {
        processSpyfallVotes(data);
    }
}

async function submitSpyfallVote(targetId, heroGuess) {
    if (!roomId || targetId === myId) return;

    const roomRef = db.ref(`rooms/${roomId}`);
    const updates = {};
    updates[`votes/${myId}`] = targetId;

    if (myId === (await roomRef.child("spyId").once("value")).val()) {
        updates[`spyGuess/${myId}`] = { targetId, guessHero: heroGuess || "" };
    } else {
        updates[`guess/${myId}`] = heroGuess || "";
    }

    try {
        await roomRef.update(updates);
        selectedVoteTarget = null;
        selectedHeroGuess = "";
    } catch (error) {
        alert("บันทึกโหวตไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
}

async function processSpyfallVotes(data) {
    const players = data.players || {};
    const votes = data.votes || {};
    const playerIds = Object.keys(players);
    if (playerIds.some(id => !votes[id])) return;

    const voteCounts = {};
    playerIds.forEach(id => {
        const target = votes[id];
        voteCounts[target] = (voteCounts[target] || 0) + 1;
    });

    const maxVotes = Math.max(...Object.values(voteCounts));
    const topTargets = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes);

    if (topTargets.length > 1 && !data.tieHandled) {
        if (isHost) {
            await db.ref(`rooms/${roomId}`).update({
                tieCandidates: topTargets,
                votes: null,
                guess: null,
                spyGuess: null,
                tieHandled: true
            });
        }
        voteInstruction.textContent = "⚠️ คะแนนโหวตเสมอกัน กำลังเริ่มโหวตใหม่";
        return;
    }

    const selectedId = topTargets[0];
    const spyId = data.spyId;
    const caughtSpy = selectedId === spyId;

    voteResult.style.display = "block";
    hostPostVoteControls.style.display = isHost ? "flex" : "none";
    voteInstruction.textContent = "ผลโหวตสรุปแล้ว";

    voteResult.innerHTML = "";
    const result = document.createElement("p");
    result.textContent = caughtSpy
        ? `🎉 จับ Spy ถูก! ผู้เล่นฝั่งปกติได้คนละ 1 คะแนน`
        : `❌ จับ Spy ไม่ถูก! Spy ได้ 2 คะแนน`;
    result.style.color = caughtSpy ? "#22c55e" : "#ef4444";
    result.style.fontWeight = "700";

    const reveal = document.createElement("p");
    reveal.style.marginTop = "6px";
    reveal.textContent =
        `ถูกโหวตสูงสุด: ${players[selectedId]?.name || "ผู้เล่น"} | Spy คือ ${players[spyId]?.name || "ผู้เล่น"}`;

    voteResult.append(result, reveal);

    if (isHost && !data.scoreUpdated) {
        await applySpyfallScores(caughtSpy, data);
    }
}

async function applySpyfallScores(caughtSpy, gameData) {
    const roomRef = db.ref(`rooms/${roomId}`);

    await roomRef.transaction(current => {
        if (!current || current.scoreUpdated || current.status !== "voting") return;

        const scores = { ...(current.scores || {}) };
        const players = current.players || {};
        const spyId = current.spyId;

        if (caughtSpy) {
            Object.keys(players).forEach(id => {
                if (id !== spyId) scores[id] = (scores[id] || 0) + 1;
            });
        } else {
            scores[spyId] = (scores[spyId] || 0) + 2;
        }

        // คะแนนส่วนตัวสำหรับทายตัวละคร Spy ถูก
        const spyHero = current.roles?.[spyId] || "";
        const guesses = current.guess || {};
        Object.keys(guesses).forEach(id => {
            if (id !== spyId && guesses[id] && guesses[id].toLowerCase() === spyHero.toLowerCase()) {
                scores[id] = (scores[id] || 0) + 1;
            }
        });

        // คะแนนส่วนตัว Spy ถ้าทายตัวละครของเป้าหมายถูก
        const spyGuess = current.spyGuess?.[spyId];
        if (spyGuess?.guessHero) {
            const targetHero = current.roles?.[spyGuess.targetId] || "";
            if (spyGuess.guessHero.toLowerCase() === targetHero.toLowerCase()) {
                scores[spyId] = (scores[spyId] || 0) + 1;
            }
        }

        current.scores = scores;
        current.scoreUpdated = true;
        return current;
    });
}

async function startNewGame() {
    if (!roomId || !isHost) return;

    const roomRef = db.ref(`rooms/${roomId}`);
    const snapshot = await roomRef.once("value");
    const data = snapshot.val();
    if (!data) return;

    const players = data.players || {};
    const playerIds = Object.keys(players);
    const mode = data.gameMode || "spyfall";
    const minimumPlayers = mode === "whoami" ? 2 : 3;

    if (playerIds.length < minimumPlayers) {
        alert(`โหมดนี้ต้องมีผู้เล่นอย่างน้อย ${minimumPlayers} คน`);
        return;
    }

    const category = getCategoryData(data.category);
    const { key: groupKey, items } = getRandomGroup(data.category);
    const order = shuffle(playerIds);
    const scores = { ...(data.scores || {}) };
    playerIds.forEach(id => {
        if (scores[id] === undefined) scores[id] = 0;
    });

    const roles = {};
    const update = {
        status: "playing",
        gameMode: mode,
        category: data.category || "rov",
        currentGroup: groupKey,
        roles,
        turnOrder: order,
        currentTurnIndex: 0,
        currentRound: 1,
        votes: null,
        guess: null,
        spyGuess: null,
        tieCandidates: null,
        tieHandled: false,
        scoreUpdated: false,
        scores
    };

    if (mode === "spyfall") {
        const spyId = playerIds[Math.floor(Math.random() * playerIds.length)];
        const spyHeroIndex = Math.floor(Math.random() * items.length);
        const spyHero = items[spyHeroIndex];
        const otherHeroes = items.filter((_, index) => index !== spyHeroIndex);
        const normalHero = otherHeroes[Math.floor(Math.random() * otherHeroes.length)];

        playerIds.forEach(id => {
            roles[id] = id === spyId ? spyHero : normalHero;
        });

        update.spyId = spyId;
        update.totalRounds = getSettingValue(data.settingValue, 2);
        update.attempts = null;
        update.guessedCorrectly = null;
        update.endTime = null;
    } else {
        const shuffledItems = shuffle(items);
        playerIds.forEach((id, index) => {
            // หากจำนวนผู้เล่นเกินจำนวนตัวละครในกลุ่ม ให้สุ่มซ้ำจากกลุ่มเดิม
            roles[id] = shuffledItems[index % shuffledItems.length];
        });

        const attempts = {};
        playerIds.forEach(id => attempts[id] = 1);

        update.spyId = null;
        update.totalRounds = null;
        update.endTime = Date.now() + getSettingValue(data.settingValue, 3) * 60 * 1000;
        update.attempts = attempts;
        update.guessedCorrectly = {};
    }

    await roomRef.update(update);
}

async function endSpyfallTurn() {
    if (!roomId) return;

    const roomRef = db.ref(`rooms/${roomId}`);
    await roomRef.transaction(current => {
        if (!current || current.status !== "playing" || current.gameMode !== "spyfall") return;

        const order = current.turnOrder || [];
        const index = Number(current.currentTurnIndex) || 0;
        if (order[index] !== myId) return;

        let nextIndex = index + 1;
        let nextRound = Number(current.currentRound) || 1;

        if (nextIndex >= order.length) {
            nextIndex = 0;
            nextRound += 1;

            if (nextRound > Number(current.totalRounds || 1)) {
                current.status = "voting";
                current.votes = null;
                return current;
            }

            // สุ่มลำดับใหม่เมื่อเริ่มรอบพูดถัดไป
            current.turnOrder = shuffle(order);
        }

        current.currentTurnIndex = nextIndex;
        current.currentRound = nextRound;
        return current;
    });
}

async function submitWhoAmIAnswer() {
    const guess = myGuessSelect.value;
    if (!guess) {
        alert("กรุณาเลือกคำตอบก่อน");
        return;
    }

    const roomRef = db.ref(`rooms/${roomId}`);
    let answerWasCorrect = false;

    await roomRef.transaction(current => {
        if (!current || current.status !== "playing" || current.gameMode !== "whoami") return;

        const attempts = current.attempts || {};
        const correct = current.guessedCorrectly || {};
        if ((attempts[myId] ?? 1) <= 0 || correct[myId]) return;

        const realAnswer = current.roles?.[myId] || "";
        answerWasCorrect = guess.toLowerCase() === realAnswer.toLowerCase();

        attempts[myId] = 0;
        if (answerWasCorrect) {
            correct[myId] = true;
            current.scores = current.scores || {};
            current.scores[myId] = (current.scores[myId] || 0) + 1;
        }

        current.attempts = attempts;
        current.guessedCorrectly = correct;

        const ids = Object.keys(current.players || {});
        const allFinished = ids.every(id => (attempts[id] ?? 1) <= 0 || correct[id]);
        if (allFinished) current.status = "voting";

        return current;
    });

    alert(answerWasCorrect ? "🎉 ตอบถูก! ได้รับ 1 คะแนน" : "❌ ตอบผิด ได้ 0 คะแนนในรอบนี้");
    myGuessSelect.value = "";
    await finishWhoAmIIfReady(false);
}

function renderWhoAmIResults(data) {
    voteAreaTitle.textContent = "🏁 สรุปผลโหมด ฉันคือใคร";
    voteInstruction.textContent = "ผู้ที่ตอบถูกได้ 1 คะแนน ผู้ที่ตอบผิดหรือไม่ทันได้ 0 คะแนน";
    voteList.innerHTML = "";
    voteResult.style.display = "block";
    hostPostVoteControls.style.display = isHost ? "flex" : "none";
    voteResult.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "เฉลยตัวละคร";
    title.style.color = "#38bdf8";
    voteResult.appendChild(title);

    const players = data.players || {};
    const roles = data.roles || {};
    const correct = data.guessedCorrectly || {};

    Object.keys(players).forEach(id => {
        const line = document.createElement("p");
        line.style.marginTop = "6px";
        line.textContent =
            `${players[id]?.name || "ผู้เล่น"}${id === myId ? " (you)" : ""}: ` +
            `${roles[id] || "—"} — ${correct[id] ? "+1 คะแนน" : "0 คะแนน"}`;
        voteResult.appendChild(line);
    });
}

function renderVotingScreen(data) {
    if (data.gameMode === "whoami") {
        renderWhoAmIResults(data);
        return;
    }

    renderSpyfallVoting(data);
}

async function joinExistingRoom(targetRoomId) {
    myName = nameInput.value.trim();
    if (!myName) {
        alert("กรุณากรอกชื่อเล่นก่อน");
        nameInput.focus();
        return;
    }

    roomId = targetRoomId;
    const roomRef = db.ref(`rooms/${roomId}`);

    const result = await roomRef.transaction(current => {
        if (!current || (current.status && current.status !== "lobby")) return;
        current.players = current.players || {};
        current.players[myId] = { name: myName };
        current.scores = current.scores || {};
        if (current.scores[myId] === undefined) current.scores[myId] = 0;
        return current;
    });

    if (!result.committed) {
        roomId = "";
        alert("ห้องนี้เริ่มเกมแล้วหรือไม่พบห้อง กรุณาเลือกห้องที่ยังเปิดรับผู้เล่น");
        return;
    }

    roomSelection.style.display = "none";
    createRoomModal.style.display = "none";
    lobbyArea.style.display = "flex";
    roomRef.child(`players/${myId}`).onDisconnect().remove();
    attachRoomListener();
}

async function createRoom() {
    myName = nameInput.value.trim();
    const newRoomId = newRoomInput.value.trim();
    const mode = gameModeSelect.value;
    const category = categorySelect.value;
    const settingValue = getSettingValue(settingValueInput.value, mode === "whoami" ? 3 : 2);

    if (!myName) {
        alert("กรุณากรอกชื่อเล่นก่อน");
        return;
    }
    if (!newRoomId) {
        alert("กรุณากรอกชื่อห้อง");
        return;
    }
    if (/[.#$\[\]/]/.test(newRoomId)) {
        alert("ชื่อห้องห้ามมีอักขระ . # $ [ ] /");
        return;
    }

    roomId = newRoomId;
    const roomRef = db.ref(`rooms/${roomId}`);

    const result = await roomRef.transaction(current => {
        if (current !== null) return;
        return {
            hostId: myId,
            gameMode: mode,
            category,
            settingValue,
            status: "lobby",
            players: { [myId]: { name: myName } },
            scores: { [myId]: 0 }
        };
    });

    if (!result.committed) {
        roomId = "";
        alert("ชื่อห้องนี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น");
        return;
    }

    createRoomModal.style.display = "none";
    lobbyArea.style.display = "flex";
    roomRef.child(`players/${myId}`).onDisconnect().remove();
    attachRoomListener();
}

showCreateModalBtn.addEventListener("click", () => {
    if (!nameInput.value.trim()) {
        alert("กรุณากรอกชื่อเล่นก่อน");
        nameInput.focus();
        return;
    }
    roomSelection.style.display = "none";
    createRoomModal.style.display = "flex";
});

backToHomeBtn.addEventListener("click", () => {
    createRoomModal.style.display = "none";
    roomSelection.style.display = "flex";
});

gameModeSelect.addEventListener("change", () => {
    updateSettingLabels(gameModeSelect.value);
});

confirmCreateBtn.addEventListener("click", createRoom);
startBtn.addEventListener("click", startNewGame);
endTurnBtn.addEventListener("click", endSpyfallTurn);
submitMyGuessBtn.addEventListener("click", submitWhoAmIAnswer);

skipToVoteBtn.addEventListener("click", async () => {
    if (!isHost || !roomId) return;
    await db.ref(`rooms/${roomId}`).update({ status: "voting", votes: null });
});

whoAmISkipBtn.addEventListener("click", async () => {
    if (!isHost || !roomId) return;
    await db.ref(`rooms/${roomId}`).update({ status: "voting" });
});

lobbyGameModeSelect.addEventListener("change", async () => {
    if (!isHost || !roomId) return;
    await db.ref(`rooms/${roomId}`).update({ gameMode: lobbyGameModeSelect.value });
});

lobbyCategorySelect.addEventListener("change", async () => {
    if (!isHost || !roomId) return;
    await db.ref(`rooms/${roomId}`).update({ category: lobbyCategorySelect.value });
});

lobbySettingValueInput.addEventListener("change", async () => {
    if (!isHost || !roomId) return;
    const mode = lobbyGameModeSelect.value;
    const fallback = mode === "whoami" ? 3 : 2;
    const value = getSettingValue(lobbySettingValueInput.value, fallback);
    lobbySettingValueInput.value = value;
    await db.ref(`rooms/${roomId}/settingValue`).set(value);
});

closeRoomBtn.addEventListener("click", async () => {
    if (!isHost || !roomId) return;
    if (confirm("ต้องการปิดและลบห้องนี้ใช่หรือไม่?")) {
        await db.ref(`rooms/${roomId}`).remove();
        location.reload();
    }
});

nextRoundBtn.addEventListener("click", startNewGame);

backToLobbyBtn.addEventListener("click", async () => {
    if (!isHost || !roomId) return;
    if (confirm("ต้องการปิดและลบห้องนี้ใช่หรือไม่?")) {
        await db.ref(`rooms/${roomId}`).remove();
        location.reload();
    }
});

// แสดงรายชื่อห้องแบบเรียลไทม์; เข้าร่วมได้เฉพาะห้องที่ยังอยู่ในล็อบบี้
db.ref("rooms").on("value", snapshot => {
    const rooms = snapshot.val() || {};
    activeRoomsList.innerHTML = "";

    const roomIds = Object.keys(rooms);
    if (!roomIds.length) {
        const empty = document.createElement("p");
        empty.className = "no-room-text";
        empty.textContent = "ยังไม่มีห้องที่เปิดอยู่";
        activeRoomsList.appendChild(empty);
        return;
    }

    roomIds.forEach(id => {
        const data = rooms[id] || {};
        const isLobby = !data.status || data.status === "lobby";
        const playerCount = Object.keys(data.players || {}).length;
        const modeName = data.gameMode === "whoami" ? "ฉันคือใคร" : "Spyfall";

        const card = document.createElement("div");
        card.className = "room-item-card";

        const info = document.createElement("div");
        info.className = "room-item-info";

        const name = document.createElement("span");
        name.className = "room-item-name";
        name.textContent = `🏠 ${id} (${playerCount} คน)`;

        const status = document.createElement("span");
        status.className = "room-item-status";
        status.textContent = `${modeName} | ${isLobby ? "รอผู้เล่น" : "กำลังเล่น"}`;
        info.append(name, status);

        const button = document.createElement("button");
        button.className = "join-room-tab-btn";
        button.textContent = isLobby ? "เข้าร่วม" : "กำลังเล่น";
        button.disabled = !isLobby;
        if (isLobby) {
            button.addEventListener("click", () => joinExistingRoom(id));
        }

        card.append(info, button);
        activeRoomsList.appendChild(card);
    });
});
