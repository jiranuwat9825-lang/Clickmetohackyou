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
    rov: {
        name: "ROV (Arena of Valor)",
        groups: {
            "แครี่ (Carry Lane)": [
                "Valhein", "Yorn", "Violet", "Capheny", "Hayate", "Elsu",
                "Laville", "Thorne", "Tel'Annas", "Eland'orr", "Fennik",
                "Slimz", "Moren", "Wisp", "Lindis", "Teeri", "Celica",
                "Erin", "Stuart"
            ],
            "เลนกลาง (Mid Lane)": [
                "Krixi", "Tulen", "Liliana", "Raz", "Lauriel", "Natalya",
                "Veera", "Ilumia", "Kahlii", "Mganga", "Preyta", "Jinnar",
                "Aleister", "Diao Chan", "Zata", "Iggy", "Dirak", "Lorion",
                "Bonnie", "Yue", "Dyadia", "Heino", "Evita", "Gildur",
                "Azzen'Ka", "Ishar"
            ],
            "ออฟเลน (Dark Slayer Lane)": [
                "Florentino", "Yena", "Ryoma", "Maloch", "Lu Bu", "Allain",
                "Veres", "Omen", "Airi", "Amily", "Arthur", "Astrid", "Skud",
                "Taara", "Qi", "Richter", "Rourke", "Zuka", "Tachi", "Dextra",
                "Biron", "Bijan", "Yan", "Wonder Woman", "Arduin", "Mortos",
                "Max", "Errol", "Volkath", "Ata"
            ],
            "ป่า (Jungle / Assassin)": [
                "Nakroth", "Murad", "Butterfly", "Aoi", "Keera", "Zill",
                "Kriknak", "Quillen", "Enzo", "Sinestrea", "Wukong", "Paine",
                "Bright", "Kaine", "Zanis", "Zephys"
            ],
            "โรมมิ่ง / ซัพพอร์ต (Roaming)": [
                "Grakk", "Alice", "Thane", "Toro", "Zip", "Aya", "Arum",
                "Cresht", "Baldum", "Mina", "Omega", "Annette", "Helen",
                "Krizzix", "Rouie", "Lumburr", "Ming", "Dolia", "TeeMee",
                "Chaugnar", "Sephera", "Xeniel", "Ormarr", "Wiro", "Roxie"
            ]
        }
    },
    valorant: {
        name: "Valorant",
        groups: {
            "Duelist": [
                "Iso", "Jett", "Neon", "Phoenix", "Raze", "Reyna",
                "Waylay", "Yoru"
            ],
            "Controller": [
                "Astra", "Brimstone", "Clove", "Harbor", "Miks", "Omen", "Viper"
            ],
            "Initiator": [
                "Breach", "Fade", "Gekko", "KAY/O", "Skye", "Sova", "Tejo"
            ],
            "Sentinel": [
                "Chamber", "Cypher", "Deadlock", "Killjoy", "Sage", "Veto", "Vyse"
            ]
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
const newRoomInput = $("newRoomInput");
const showCreateModalBtn = $("showCreateModalBtn");
const backToHomeBtn = $("backToHomeBtn");
const confirmCreateBtn = $("confirmCreateBtn");
const activeRoomsList = $("activeRoomsList");

const gameModeSelect = $("gameModeSelect");
const categorySelect = $("categorySelect");
const settingValueInput = $("settingValueInput");
const settingLabel = $("settingLabel");

const hostSettingsBox = $("hostSettingsBox");
const lobbyGameModeSelect = $("lobbyGameModeSelect");
const lobbyCategorySelect = $("lobbyCategorySelect");
const lobbySettingValueInput = $("lobbySettingValueInput");
const lobbySettingLabel = $("lobbySettingLabel");

const roomTitle = $("roomTitle");
const roomInfo = $("roomInfo");
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
let selectedVoteTarget = "";
let selectedHeroGuess = "";
let whoAmITimerInterval = null;
let timerEndTime = null;
let roomRef = null;

function categoryFor(key) {
    return categoriesData[key] || categoriesData.rov;
}

function allItemsFor(key) {
    return Object.values(categoryFor(key).groups).flat();
}

function settingNumber(value, fallback) {
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number) && number >= 1 ? number : fallback;
}

function shuffle(list) {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function setSettingLabel(mode) {
    const label = mode === "whoami" ? "⏱️ เวลาจำกัด (นาที)" : "🔄 จำนวนรอบการพูด";
    settingLabel.textContent = label;
    lobbySettingLabel.textContent = label;

    if (mode === "whoami" && gameModeSelect.value === mode) {
        settingValueInput.value = "3";
    } else if (mode === "spyfall" && gameModeSelect.value === mode) {
        settingValueInput.value = "2";
    }
}

function drawScores(players, scores) {
    scoreListBody.innerHTML = "";
    const ids = Object.keys(players || {})
        .sort((a, b) => (scores?.[b] || 0) - (scores?.[a] || 0))
        .slice(0, 6);

    ids.forEach(id => {
        const row = document.createElement("div");
        row.className = "score-row";

        const name = document.createElement("span");
        name.textContent = `${players[id]?.name || "ผู้เล่น"}${id === myId ? " (you)" : ""}`;

        const score = document.createElement("b");
        score.textContent = `${scores?.[id] || 0} แต้ม`;

        row.append(name, score);
        scoreListBody.appendChild(row);
    });

    scoreBoard.style.display = ids.length ? "block" : "none";
}

function showOnly(section) {
    [roomSelection, createRoomModal, lobbyArea, gameArea, whoAmIArea, voteArea]
        .forEach(el => el.style.display = "none");
    if (section) section.style.display = "flex";
}

function addRoomListener() {
    roomRef = db.ref(`rooms/${roomId}`);
    roomRef.on("value", snapshot => {
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
        drawScores(players, data.scores || {});
        renderLobby(data);

        if (data.status === "playing") {
            if (data.gameMode === "whoami") {
                showOnly(whoAmIArea);
                renderWhoAmI(data);
                startWhoAmITimer(data.endTime);
            } else {
                showOnly(gameArea);
                if (whoAmITimerInterval) clearInterval(whoAmITimerInterval);
                renderSpyfall(data);
            }
        } else if (data.status === "voting" || data.status === "results") {
            showOnly(voteArea);
            if (whoAmITimerInterval) clearInterval(whoAmITimerInterval);

            if (data.status === "voting" && data.gameMode === "spyfall") {
                renderSpyfallVoting(data);
                processSpyfallVotes(data);
            } else {
                renderResults(data);
            }
        } else {
            if (whoAmITimerInterval) clearInterval(whoAmITimerInterval);
            showOnly(lobbyArea);
        }
    });
}

function renderLobby(data) {
    const players = data.players || {};
    const mode = data.gameMode || "spyfall";
    const setting = settingNumber(data.settingValue, mode === "whoami" ? 3 : 2);
    const cat = categoryFor(data.category);

    roomTitle.textContent = `ห้อง: ${roomId}`;
    roomInfo.textContent =
        `โหมด: ${mode === "whoami" ? "ฉันคือใคร" : "Spyfall"} | หมวด: ${cat.name} | ` +
        (mode === "whoami" ? `เวลา ${setting} นาที` : `${setting} รอบ`);

    playerList.innerHTML = "";
    Object.keys(players).forEach(id => {
        const li = document.createElement("li");
        const name = document.createElement("span");
        name.textContent = `👤 ${players[id]?.name || "ผู้เล่น"}${id === myId ? " (you)" : ""}`;
        li.appendChild(name);

        if (id === data.hostId) {
            const hostTag = document.createElement("span");
            hostTag.textContent = "(หัวหน้าห้อง)";
            hostTag.style.cssText = "margin-left:auto;color:#38bdf8;font-size:.75rem;";
            li.appendChild(hostTag);
        }
        playerList.appendChild(li);
    });

    const isLobby = data.status === "lobby";
    hostSettingsBox.style.display = isHost && isLobby ? "flex" : "none";
    closeRoomBtn.style.display = isHost && isLobby ? "block" : "none";
    startBtn.style.display = isHost && isLobby ? "block" : "none";
    waitText.style.display = !isHost && isLobby ? "block" : "none";
    skipToVoteBtn.style.display = isHost && data.status === "playing" && mode === "spyfall" ? "block" : "none";
    whoAmISkipBtn.style.display = isHost && data.status === "playing" && mode === "whoami" ? "block" : "none";

    lobbyGameModeSelect.value = mode;
    lobbyCategorySelect.value = data.category || "rov";
    lobbySettingValueInput.value = setting;
    lobbySettingLabel.textContent = mode === "whoami" ? "เวลาจำกัด (นาที)" : "จำนวนรอบการพูด";
}

function renderPlainOrder(container, order, players, omitted = new Set()) {
    container.innerHTML = "";
    let position = 0;

    (order || []).forEach(id => {
        if (!players[id] || omitted.has(id)) return;
        position++;

        const item = document.createElement("div");
        item.className = "turn-order-item";
        item.textContent = `${position}. ${players[id].name}${id === myId ? " (you)" : ""}`;
        container.appendChild(item);
    });

    if (position === 0) {
        const item = document.createElement("div");
        item.className = "turn-order-item";
        item.textContent = "ไม่มีรายชื่อที่ต้องแสดง";
        container.appendChild(item);
    }
}

function renderSpyfall(data) {
    const players = data.players || {};
    const roles = data.roles || {};
    const order = data.turnOrder || [];
    const index = Number(data.currentTurnIndex) || 0;
    const speakerId = order[index];

    heroName.textContent = roles[myId] || "กำลังโหลด...";
    roundIndicator.textContent = `รอบที่ ${data.currentRound || 1} จาก ${data.totalRounds || 1}`;

    if (speakerId === myId) {
        currentSpeakerBox.textContent = "ถึงตาคุณพูดแล้ว";
        endTurnBtn.style.display = "block";
    } else {
        currentSpeakerBox.textContent = "รอถึงเทิร์นของคุณ";
        endTurnBtn.style.display = "none";
    }

    renderPlainOrder(fullTurnOrderContainer, order, players);

    const cat = categoryFor(data.category);
    const items = cat.groups[data.currentGroup] || [];
    heroListTitle.textContent = `ตัวละครในตำแหน่ง: ${data.currentGroup || ""}`;
    heroGrid.innerHTML = "";

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

    othersRolesGrid.innerHTML = "";
    Object.keys(players).forEach(id => {
        if (id === myId) return;
        const item = document.createElement("div");
        item.className = "hero-item";
        item.textContent = `${players[id].name}: ${roles[id] || "—"}`;
        othersRolesGrid.appendChild(item);
    });

    const options = allItemsFor(data.category);
    const groupKey = data.category || "rov";

    if (myGuessSelect.dataset.category !== groupKey) {
        myGuessSelect.innerHTML = '<option value="">-- เลือกคำตอบ --</option>';
        options.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            myGuessSelect.appendChild(option);
        });
        myGuessSelect.dataset.category = groupKey;
    }

    if (correct[myId]) {
        guessStatusText.textContent = "🎉 คุณตอบถูกแล้ว ได้รับ 1 คะแนน";
        guessControlsDiv.style.display = "none";
    } else if ((attempts[myId] ?? 1) <= 0) {
        guessStatusText.textContent = "❌ ตอบผิดแล้ว ได้ 0 คะแนนในรอบนี้";
        guessControlsDiv.style.display = "none";
    } else {
        guessStatusText.textContent = "🎯 คุณมีสิทธิ์ตอบ 1 ครั้ง";
        guessControlsDiv.style.display = "flex";
    }

    // แสดงเฉพาะลำดับผู้เล่น ไม่บอกว่าเป็นตาของใคร
    // ผู้ที่ตอบถูกแล้วจะถูกนำออกจากรายการ
    const correctIds = new Set(
        Object.keys(correct).filter(id => correct[id])
    );
    renderPlainOrder(whoAmITurnOrderContainer, data.turnOrder || [], players, correctIds);
}

function startWhoAmITimer(endTime) {
    if (whoAmITimerInterval) clearInterval(whoAmITimerInterval);
    if (!endTime) return;

    const tick = () => {
        const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        whoAmITimer.textContent =
            `${String(Math.floor(left / 60)).padStart(2, "0")}:` +
            `${String(left % 60).padStart(2, "0")}`;

        if (left <= 0) {
            clearInterval(whoAmITimerInterval);
            if (isHost) finishWhoAmI(true);
        }
    };

    tick();
    whoAmITimerInterval = setInterval(tick, 1000);
}

async function finishWhoAmI(force = false) {
    if (!roomId || !isHost) return;

    await roomRef.transaction(current => {
        if (!current || current.status !== "playing" || current.gameMode !== "whoami") return;

        const ids = Object.keys(current.players || {});
        const attempts = current.attempts || {};
        const correct = current.guessedCorrectly || {};
        const allAnswered = ids.every(id => (attempts[id] ?? 1) <= 0 || correct[id]);

        if (force || allAnswered) {
            current.status = "results";
            return current;
        }
        return;
    });
}

async function submitWhoAmIAnswer() {
    const guess = myGuessSelect.value;
    if (!guess) {
        alert("กรุณาเลือกคำตอบก่อน");
        return;
    }

    let wasCorrect = false;
    const result = await roomRef.transaction(current => {
        if (!current || current.status !== "playing" || current.gameMode !== "whoami") return;

        current.attempts = current.attempts || {};
        current.guessedCorrectly = current.guessedCorrectly || {};
        current.scores = current.scores || {};

        if ((current.attempts[myId] ?? 1) <= 0 || current.guessedCorrectly[myId]) return;

        current.attempts[myId] = 0;
        wasCorrect = guess.toLowerCase() === String(current.roles?.[myId] || "").toLowerCase();

        if (wasCorrect) {
            current.guessedCorrectly[myId] = true;
            current.scores[myId] = (current.scores[myId] || 0) + 1;
        }

        const ids = Object.keys(current.players || {});
        const allAnswered = ids.every(id =>
            (current.attempts[id] ?? 1) <= 0 || current.guessedCorrectly[id]
        );
        if (allAnswered) current.status = "results";

        return current;
    });

    if (!result.committed) return;
    alert(wasCorrect ? "🎉 ตอบถูก ได้ 1 คะแนน" : "❌ ตอบผิด ได้ 0 คะแนน");
    myGuessSelect.value = "";
    await finishWhoAmI(false);
}

async function startNewRound() {
    if (!roomId || !isHost) return;

    const snapshot = await roomRef.once("value");
    const data = snapshot.val();
    if (!data) return;

    const players = data.players || {};
    const ids = Object.keys(players);
    const mode = data.gameMode || "spyfall";
    const categoryKey = data.category || "rov";
    const category = categoryFor(categoryKey);
    const minPlayers = mode === "whoami" ? 2 : 3;

    if (ids.length < minPlayers) {
        alert(`โหมดนี้ต้องมีผู้เล่นอย่างน้อย ${minPlayers} คน`);
        return;
    }

    let groupKey;
    let groupItems;

    if (mode === "spyfall") {
        const groupKeys = Object.keys(category.groups);
        groupKey = groupKeys[Math.floor(Math.random() * groupKeys.length)];
        groupItems = [...category.groups[groupKey]];
    } else {
        // ฉันคือใครสุ่มจากทุกตำแหน่งรวมกัน ไม่สนใจเลนหรือตำแหน่ง
        groupKey = "ทั้งหมด";
        groupItems = allItemsFor(categoryKey);
    }

    if (!groupItems.length) {
        alert("หมวดหมู่นี้ยังไม่มีตัวละครให้สุ่ม");
        return;
    }

    const order = shuffle(ids);
    const roles = {};
    const scores = { ...(data.scores || {}) };
    ids.forEach(id => {
        if (scores[id] === undefined) scores[id] = 0;
    });

    const update = {
        status: "playing",
        gameMode: mode,
        category: categoryKey,
        currentGroup: groupKey,
        roles,
        turnOrder: order,
        currentTurnIndex: 0,
        currentRound: 1,
        scores,
        votes: null,
        guess: null,
        spyGuess: null,
        tieCandidates: null,
        tieHandled: false,
        scoreUpdated: false,
        result: null
    };

    if (mode === "spyfall") {
        if (groupItems.length < 2) {
            alert("Spyfall ต้องมีตัวละครในตำแหน่งนั้นอย่างน้อย 2 ตัว");
            return;
        }

        const spyId = ids[Math.floor(Math.random() * ids.length)];
        const spyIndex = Math.floor(Math.random() * groupItems.length);
        const spyRole = groupItems[spyIndex];
        const normalOptions = groupItems.filter((_, index) => index !== spyIndex);
        const normalRole = normalOptions[Math.floor(Math.random() * normalOptions.length)];

        ids.forEach(id => {
            roles[id] = id === spyId ? spyRole : normalRole;
        });

        update.spyId = spyId;
        update.totalRounds = settingNumber(data.settingValue, 2);
        update.attempts = null;
        update.guessedCorrectly = null;
        update.endTime = null;
    } else {
        ids.forEach(id => {
            roles[id] = groupItems[Math.floor(Math.random() * groupItems.length)];
        });

        const attempts = {};
        ids.forEach(id => attempts[id] = 1);

        update.spyId = null;
        update.totalRounds = null;
        update.attempts = attempts;
        update.guessedCorrectly = {};
        update.endTime = Date.now() + settingNumber(data.settingValue, 3) * 60 * 1000;
    }

    await roomRef.update(update);
}

async function endSpyfallTurn() {
    if (!roomRef) return;

    await roomRef.transaction(current => {
        if (!current || current.status !== "playing" || current.gameMode !== "spyfall") return;

        const order = current.turnOrder || [];
        const index = Number(current.currentTurnIndex) || 0;

        // อนุญาตให้คนที่ถึงเทิร์นตัวเองเท่านั้นกดจบเทิร์น
        if (order[index] !== myId) return;

        let nextIndex = index + 1;
        let nextRound = Number(current.currentRound) || 1;

        if (nextIndex >= order.length) {
            nextIndex = 0;
            nextRound++;

            if (nextRound > Number(current.totalRounds || 1)) {
                current.status = "voting";
                current.votes = null;
                current.guess = null;
                current.spyGuess = null;
                return current;
            }

            // สุ่มลำดับใหม่ทุกครั้งที่เริ่มรอบพูดใหม่
            current.turnOrder = shuffle(order);
        }

        current.currentTurnIndex = nextIndex;
        current.currentRound = nextRound;
        return current;
    });
}

function renderResults(data) {
    voteList.innerHTML = "";
    voteResult.innerHTML = "";
    voteResult.style.display = "block";
    hostPostVoteControls.style.display = isHost ? "flex" : "none";

    if (data.gameMode === "whoami") {
        voteAreaTitle.textContent = "🏁 สรุปผลโหมด ฉันคือใคร";
        voteInstruction.textContent = "ตอบถูกได้ 1 คะแนน ตอบผิดหรือหมดเวลาได้ 0 คะแนน";

        const heading = document.createElement("h3");
        heading.textContent = "เฉลยตัวละคร";
        heading.style.color = "#38bdf8";
        voteResult.appendChild(heading);

        const players = data.players || {};
        Object.keys(players).forEach(id => {
            const line = document.createElement("p");
            line.style.marginTop = "6px";
            line.textContent =
                `${players[id]?.name || "ผู้เล่น"}${id === myId ? " (you)" : ""}: ` +
                `${data.roles?.[id] || "—"} — ` +
                `${data.guessedCorrectly?.[id] ? "+1 คะแนน" : "0 คะแนน"}`;
            voteResult.appendChild(line);
        });
        return;
    }

    voteAreaTitle.textContent = "🏁 สรุปผล Spyfall";
    voteInstruction.textContent = "ผลการโหวตรอบนี้";

    const result = data.result || {};
    const line = document.createElement("p");
    line.style.fontWeight = "700";
    line.style.color = result.caughtSpy ? "#22c55e" : "#ef4444";
    line.textContent = result.caughtSpy
        ? `จับ Spy ถูก! ผู้เล่นฝั่งปกติได้คนละ 1 คะแนน`
        : `จับ Spy ไม่ถูก! Spy ได้ 2 คะแนน`;
    voteResult.appendChild(line);

    const details = document.createElement("p");
    details.style.marginTop = "8px";
    details.textContent =
        `ผู้ถูกโหวตสูงสุด: ${data.players?.[result.targetId]?.name || "ไม่ทราบ"} | ` +
        `Spy: ${data.players?.[data.spyId]?.name || "ไม่ทราบ"} ` +
        `(${data.roles?.[data.spyId] || "—"})`;
    voteResult.appendChild(details);
}

function renderSpyfallVoting(data) {
    voteAreaTitle.textContent = "🗳️ โหวตหา Spy";
    voteList.innerHTML = "";
    voteResult.style.display = "none";
    hostPostVoteControls.style.display = "none";

    const players = data.players || {};
    const ids = Object.keys(players);
    const votes = data.votes || {};
    const candidateIds = data.tieCandidates || ids;
    const myVote = votes[myId];
    const voteTotal = ids.filter(id => votes[id]).length;

    voteInstruction.textContent = myVote
        ? `คุณโหวตแล้ว (${voteTotal}/${ids.length})`
        : `เลือกผู้เล่นที่คิดว่าเป็น Spy (${voteTotal}/${ids.length}) — เลือกตัวเองไม่ได้`;

    candidateIds.forEach(targetId => {
        if (!players[targetId] || targetId === myId) return;

        const button = document.createElement("button");
        button.className = `vote-btn${selectedVoteTarget === targetId ? " selected" : ""}`;
        button.disabled = Boolean(myVote);

        const name = document.createElement("span");
        name.textContent = players[targetId].name;

        const count = Object.values(votes).filter(v => v === targetId).length;
        const countText = document.createElement("span");
        countText.textContent = `โหวต ${count}`;
        countText.style.cssText = "color:#94a3b8;font-size:.75rem;";

        button.append(name, countText);
        button.addEventListener("click", () => {
            if (myVote) return;
            selectedVoteTarget = targetId;
            selectedHeroGuess = "";
            renderSpyfallVoting(data);
        });
        voteList.appendChild(button);

        if (selectedVoteTarget === targetId && !myVote) {
            const select = document.createElement("select");
            select.className = "form-control";

            const none = document.createElement("option");
            none.value = "";
            none.textContent = "-- ไม่ทายตัวละคร --";
            select.appendChild(none);

            const cat = categoryFor(data.category);
            const items = cat.groups[data.currentGroup] || [];
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
            confirm.className = "btn primary";
            confirm.textContent = `🔒 ยืนยันโหวต ${players[targetId].name}`;
            confirm.addEventListener("click", () => submitSpyVote(targetId, selectedHeroGuess));
            voteList.appendChild(confirm);
        }
    });
}

async function submitSpyVote(targetId, heroGuess) {
    if (!roomRef || targetId === myId) return;

    const snapshot = await roomRef.once("value");
    const data = snapshot.val();
    if (!data || data.status !== "voting" || data.votes?.[myId]) return;

    const updates = {};
    updates[`votes/${myId}`] = targetId;

    if (myId === data.spyId) {
        updates[`spyGuess/${myId}`] = { targetId, guessHero: heroGuess || "" };
    } else {
        updates[`guess/${myId}`] = heroGuess || "";
    }

    await roomRef.update(updates);
    selectedVoteTarget = "";
    selectedHeroGuess = "";
}

async function processSpyfallVotes(data) {
    if (!isHost || data.status !== "voting" || data.scoreUpdated) return;

    const players = data.players || {};
    const ids = Object.keys(players);
    const votes = data.votes || {};
    if (!ids.length || ids.some(id => !votes[id])) return;

    const counts = {};
    ids.forEach(id => {
        const target = votes[id];
        counts[target] = (counts[target] || 0) + 1;
    });

    const max = Math.max(...Object.values(counts));
    const leaders = Object.keys(counts).filter(id => counts[id] === max);

    if (leaders.length > 1 && !data.tieHandled) {
        await roomRef.transaction(current => {
            if (!current || current.status !== "voting" || current.tieHandled) return;
            current.tieCandidates = leaders;
            current.votes = null;
            current.guess = null;
            current.spyGuess = null;
            current.tieHandled = true;
            return current;
        });
        return;
    }

    const targetId = leaders[Math.floor(Math.random() * leaders.length)];
    await roomRef.transaction(current => {
        if (!current || current.status !== "voting" || current.scoreUpdated) return;

        const currentPlayers = current.players || {};
        const currentIds = Object.keys(currentPlayers);
        const currentVotes = current.votes || {};
        if (currentIds.some(id => !currentVotes[id])) return;

        const caughtSpy = targetId === current.spyId;
        const scores = { ...(current.scores || {}) };
        const spyId = current.spyId;

        if (caughtSpy) {
            currentIds.forEach(id => {
                if (id !== spyId) scores[id] = (scores[id] || 0) + 1;
            });
        } else {
            scores[spyId] = (scores[spyId] || 0) + 2;
        }

        const spyHero = String(current.roles?.[spyId] || "").toLowerCase();
        Object.keys(current.guess || {}).forEach(id => {
            const guess = String(current.guess[id] || "").toLowerCase();
            if (guess && guess === spyHero) scores[id] = (scores[id] || 0) + 1;
        });

        const spyGuess = current.spyGuess?.[spyId];
        if (spyGuess?.guessHero) {
            const targetHero = String(current.roles?.[spyGuess.targetId] || "").toLowerCase();
            if (String(spyGuess.guessHero).toLowerCase() === targetHero) {
                scores[spyId] = (scores[spyId] || 0) + 1;
            }
        }

        current.scores = scores;
        current.scoreUpdated = true;
        current.result = { caughtSpy, targetId };
        current.status = "results";
        return current;
    });
}

async function joinRoom(targetRoomId) {
    myName = nameInput.value.trim();
    if (!myName) {
        alert("กรุณาใส่ชื่อเล่นก่อน");
        nameInput.focus();
        return;
    }

    const ref = db.ref(`rooms/${targetRoomId}`);
    const result = await ref.transaction(current => {
        if (!current || (current.status && current.status !== "lobby")) return;
        current.players = current.players || {};
        current.players[myId] = { name: myName };
        current.scores = current.scores || {};
        if (current.scores[myId] === undefined) current.scores[myId] = 0;
        return current;
    });

    if (!result.committed) {
        alert("ห้องนี้เริ่มเกมแล้วหรือปิดไปแล้ว");
        return;
    }

    roomId = targetRoomId;
    await ref.child(`players/${myId}`).onDisconnect().remove();
    showOnly(lobbyArea);
    addRoomListener();
}

async function createRoom() {
    myName = nameInput.value.trim();
    const newId = newRoomInput.value.trim();
    const mode = gameModeSelect.value;
    const category = categorySelect.value;
    const fallback = mode === "whoami" ? 3 : 2;
    const settingValue = settingNumber(settingValueInput.value, fallback);

    if (!myName) {
        alert("กรุณาใส่ชื่อเล่นก่อน");
        return;
    }
    if (!newId) {
        alert("กรุณาใส่ชื่อห้อง");
        return;
    }
    if (/[.#$\[\]/]/.test(newId)) {
        alert("ชื่อห้องห้ามมีอักขระ . # $ [ ] /");
        return;
    }

    const ref = db.ref(`rooms/${newId}`);
    const result = await ref.transaction(current => {
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
        alert("ชื่อห้องนี้มีผู้ใช้งานแล้ว");
        return;
    }

    roomId = newId;
    await ref.child(`players/${myId}`).onDisconnect().remove();
    showOnly(lobbyArea);
    addRoomListener();
}

async function updateRoomSetting(key, value) {
    if (!isHost || !roomId) return;
    const data = {};
    data[key] = value;
    await db.ref(`rooms/${roomId}`).update(data);
}

async function closeRoom() {
    if (!isHost || !roomId) return;
    if (!confirm("ต้องการปิดและลบห้องนี้ใช่หรือไม่?")) return;
    await db.ref(`rooms/${roomId}`).remove();
    location.reload();
}

async function endWhoAmI() {
    if (!isHost || !roomRef) return;
    await finishWhoAmI(true);
}

// หน้าแรกสร้างรายการห้องแบบเรียลไทม์
db.ref("rooms").on("value", snapshot => {
    const rooms = snapshot.val() || {};
    activeRoomsList.innerHTML = "";

    const ids = Object.keys(rooms);
    if (!ids.length) {
        const empty = document.createElement("p");
        empty.className = "empty-text";
        empty.textContent = "ยังไม่มีห้องที่เปิดอยู่";
        activeRoomsList.appendChild(empty);
        return;
    }

    ids.forEach(id => {
        const data = rooms[id] || {};
        const canJoin = !data.status || data.status === "lobby";
        const count = Object.keys(data.players || {}).length;
        const mode = data.gameMode === "whoami" ? "ฉันคือใคร" : "Spyfall";

        const card = document.createElement("div");
        card.className = "room-card";

        const info = document.createElement("div");
        info.className = "room-info";

        const name = document.createElement("span");
        name.className = "room-name";
        name.textContent = `🏠 ${id} (${count} คน)`;

        const status = document.createElement("span");
        status.className = "room-status";
        status.textContent = `${mode} | ${canJoin ? "รอผู้เล่น" : "กำลังเล่น"}`;

        info.append(name, status);

        const button = document.createElement("button");
        button.className = "join-btn";
        button.textContent = canJoin ? "เข้าร่วม" : "กำลังเล่น";
        button.disabled = !canJoin;
        if (canJoin) button.addEventListener("click", () => joinRoom(id));

        card.append(info, button);
        activeRoomsList.appendChild(card);
    });
});

showCreateModalBtn.addEventListener("click", () => {
    if (!nameInput.value.trim()) {
        alert("กรุณาใส่ชื่อเล่นก่อน");
        nameInput.focus();
        return;
    }
    showOnly(createRoomModal);
});

backToHomeBtn.addEventListener("click", () => showOnly(roomSelection));

gameModeSelect.addEventListener("change", () => {
    setSettingLabel(gameModeSelect.value);
});

lobbyGameModeSelect.addEventListener("change", () => {
    updateRoomSetting("gameMode", lobbyGameModeSelect.value);
    lobbySettingLabel.textContent =
        lobbyGameModeSelect.value === "whoami" ? "เวลาจำกัด (นาที)" : "จำนวนรอบการพูด";
    lobbySettingValueInput.value = lobbyGameModeSelect.value === "whoami" ? 3 : 2;
    updateRoomSetting("settingValue", Number(lobbySettingValueInput.value));
});

lobbyCategorySelect.addEventListener("change", () => {
    updateRoomSetting("category", lobbyCategorySelect.value);
});

lobbySettingValueInput.addEventListener("change", () => {
    const mode = lobbyGameModeSelect.value;
    const value = settingNumber(lobbySettingValueInput.value, mode === "whoami" ? 3 : 2);
    lobbySettingValueInput.value = value;
    updateRoomSetting("settingValue", value);
});

confirmCreateBtn.addEventListener("click", createRoom);
startBtn.addEventListener("click", startNewRound);
endTurnBtn.addEventListener("click", endSpyfallTurn);
submitMyGuessBtn.addEventListener("click", submitWhoAmIAnswer);
skipToVoteBtn.addEventListener("click", async () => {
    if (isHost && roomRef) await roomRef.update({ status: "voting" });
});
whoAmISkipBtn.addEventListener("click", endWhoAmI);
nextRoundBtn.addEventListener("click", startNewRound);
closeRoomBtn.addEventListener("click", closeRoom);
backToLobbyBtn.addEventListener("click", closeRoom);
