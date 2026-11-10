// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3IuOtFTc2OOJclUMpVe1GEv13nCjlEM8",
  authDomain: "xo-game-e5fdd.firebaseapp.com",
  projectId: "xo-game-e5fdd",
  storageBucket: "xo-game-e5fdd.firebasestorage.app",
  messagingSenderId: "890496938682",
  appId: "1:890496938682:web:c99edd29e9639415ac4883",
  measurementId: "G-4RHMNWP5ZJ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const roomSelection = document.getElementById('roomSelection');
const gameArea = document.getElementById('gameArea');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const statusText = document.getElementById('status');
const roleInfo = document.getElementById('roleInfo');
const restartBtn = document.getElementById('restartBtn');
const cells = document.querySelectorAll('.cell');

let roomId = '';
let myRole = ''; // 'X' หรือ 'O'

joinBtn.addEventListener('click', () => {
    roomId = roomInput.value.trim();
    if (!roomId) {
        alert('กรุณากรอกชื่อห้องก่อนครับ');
        return;
    }

    roomSelection.style.display = 'none';
    gameArea.style.display = 'block';

    const roomRef = db.ref('rooms/' + roomId);
    roomRef.once('value', (snapshot) => {
        const roomData = snapshot.val();
        if (!roomData || !roomData.playerX) {
            // ถ้ายังไม่มีคนสร้างห้อง ให้เราเป็น X
            myRole = 'X';
            roomRef.set({
                board: ['', '', '', '', '', '', '', '', ''],
                turn: 'X',
                playerX: true,
                playerO: false,
                winner: null
            });
        } else if (!roomData.playerO) {
            // ถ้ามี X แล้ว ให้เราเป็น O
            myRole = 'O';
            roomRef.update({ playerO: true });
        } else {
            // ห้องเต็ม
            myRole = 'Spectator (ผู้ชม)';
            alert('ห้องนี้มีผู้เล่นครบ 2 คนแล้ว คุณจะเข้ามาเป็นผู้ชม');
        }

        roleInfo.textContent = `คุณคือผู้เล่น: ${myRole}`;
        listenGameData();
    });
});

function listenGameData() {
    const roomRef = db.ref('rooms/' + roomId);
    roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // อัปเดตตารางหน้าจอ
        data.board.forEach((val, index) => {
            cells[index].textContent = val;
            cells[index].className = 'cell';
            if (val === 'X') cells[index].classList.add('x');
            if (val === 'O') cells[index].classList.add('o');
        });

        // ตรวจสอบสถานะเกม
        if (data.winner) {
            if (data.winner === 'Draw') {
                statusText.textContent = `เสมอ กัน! 🤝`;
            } else {
                statusText.textContent = `ผู้เล่น ${data.winner} ชนะแล้ว! 🎉`;
            }
        } else {
            if (data.turn === myRole) {
                statusText.textContent = `ตาของคุณ! (${myRole})`;
            } else {
                statusText.textContent = `รอตาของฝ่ายตรงข้าม (${data.turn})`;
            }
        }
    });
}

// กดเลือกช่องเล่นเกม
cells.forEach((cell, index) => {
    cell.addEventListener('click', () => {
        if (myRole !== 'X' && myRole !== 'O') return; // ผู้ชมกดไม่ได้

        const roomRef = db.ref('rooms/' + roomId);
        roomRef.once('value', (snapshot) => {
            const data = snapshot.val();

            // เช็คว่าเป็นตาเราไหม และช่องว่างเปล่าไหม และเกมยังไม่จบ
            if (data.turn === myRole && data.board[index] === '' && !data.winner) {
                let newBoard = data.board;
                newBoard[index] = myRole;

                let nextTurn = myRole === 'X' ? 'O' : 'X';
                let winner = checkWinner(newBoard);

                roomRef.update({
                    board: newBoard,
                    turn: nextTurn,
                    winner: winner
                });
            }
        });
    });
});

function checkWinner(b) {
    const wins = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    for (let i = 0; i < wins.length; i++) {
        const [x, y, z] = wins[i];
        if (b[x] && b[x] === b[y] && b[x] === b[z]) {
            return b[x];
        }
    }
    if (!b.includes('')) return 'Draw';
    return null;
}

// ปุ่มรีเซ็ตเกม
restartBtn.addEventListener('click', () => {
    if (myRole !== 'X' && myRole !== 'O') return;
    const roomRef = db.ref('rooms/' + roomId);
    roomRef.update({
        board: ['', '', '', '', '', '', '', '', ''],
        turn: 'X',
        winner: null
    });
});
