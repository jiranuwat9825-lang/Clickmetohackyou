// References are public rules only. Personal roles and answers stay in the game view.
const deskGames = {
  spyfall: {name: 'Spyfall', seats: '3 คนขึ้นไป', mark: '◎', rules: [
    'ดูคำหรือบทบาทของตัวเอง แล้วผลัดกันพูดใบ้',
    'ฟังว่าใครให้คำใบ้ต่างจากคนอื่น เมื่อครบรอบให้โหวตหาสายลับ',
    'แบบคำลับต่างกัน ทั้งสองฝ่ายทายคำอีกฝ่ายได้ ส่วนแบบ Spy รู้ตัวตน สายลับทายคำแทนการโหวต'
  ]},
  whoami: {name: 'Who Am I', seats: '2 คนขึ้นไป', mark: '?', rules: [
    'คุณเห็นคำของเพื่อน ส่วนคำของคุณให้เพื่อนช่วยใบ้',
    'ผลัดกันถามเพื่อหาคำของตัวเอง เลือกได้ทั้งจับเวลาหรือนับรอบ',
    'ถ้าเลือกให้ผู้เล่นตั้งคำเอง แต่ละคนทายได้ครั้งเดียว คนที่ตั้งคำจะเป็นผู้ตัดสิน'
  ]},
  insider: {name: 'Insider', seats: '4 คนขึ้นไป', mark: '◉', rules: [
    'Master ตั้งคำลับ ส่วน Insider แอบรู้คำตอบ',
    'ช่วยกันถามและทายให้ทันเวลา Insider ต้องพาเพื่อนไปถึงคำตอบโดยไม่ถูกจับได้',
    'เมื่อทายถูก ให้โหวตหา Insider จับได้คนอื่นได้คนละ 1 คะแนน ถ้ารอด Insider ได้ 2 คะแนน'
  ]},
  cheese: {name: 'Steal Cheese', seats: '4–8 คน', mark: '◒', rules: [
    'ทอยเต๋าเพื่อดูเวลาตื่นของตัวเองในแต่ละช่วงของคืน',
    'สังเกตว่าใครตื่นพร้อมกันและชีสยังอยู่หรือไม่ แล้วคุยกันว่าใครเป็นขโมย',
    'ทุกคนโหวตพร้อมกัน ถ้าขโมยได้คะแนนโหวตสูงสุด ฝ่ายหนูขี้เซาชนะ หากเปิดหนูแพะและหนูแพะได้คะแนนสูงสุด หนูแพะชนะคนเดียว'
  ]},
  avalon: {name: 'Avalon', seats: '9–10 คน', mark: '♜', rules: [
    'ดูบทบาทและข้อมูลฝ่ายที่คุณได้รับ',
    'หัวหน้าเลือกทีม ทุกคนโหวตรับหรือปฏิเสธทีม เมื่อผ่าน สมาชิกทีมส่งผลภารกิจเป็นความลับ',
    'ฝ่ายแดงชนะเมื่อภารกิจล้มเหลวครบ 3 ครั้ง หากฝ่ายน้ำเงินทำสำเร็จ 3 ครั้ง มือสังหารยังมีโอกาสทาย Merlin'
  ]},
  cryptid: {name: 'Cryptid Beta', seats: '3–5 คน', mark: '⬡', rules: [
    'อ่านเบาะแสของตัวเอง ทุกเบาะแสชี้ไปยังช่องเดียวกันบนแผนที่',
    'วางหมากเริ่มต้น แล้วเลือกช่องเพื่อถามเพื่อน สี่เหลี่ยมหมายถึงอยู่ไม่ได้ วงกลมหมายถึงยังเป็นไปได้',
    'เมื่อมั่นใจให้ค้นหาช่องนั้น ถ้าตรงกับเบาะแสของทุกคน คุณชนะและได้ 1 คะแนน'
  ]}
};

function gameFamily(mode) {
  return mode?.startsWith('whoami') ? 'whoami' : mode;
}

function showGuide(mode) {
  const game = deskGames[mode];
  $('guideMode').value = mode;
  const steps = document.createElement('ol');
  for (const rule of game.rules) {
    const step = document.createElement('li');
    step.textContent = rule;
    steps.append(step);
  }
  const count = document.createElement('p');
  count.textContent = game.seats;
  $('guideBody').replaceChildren(count, steps);
  if (!$('gameGuide').open) $('gameGuide').showModal();
}

for (const [mode, game] of Object.entries(deskGames)) {
  $('guideMode').add(new Option(game.name, mode));
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'shelf-tile';
  tile.innerHTML = '<span class="game-mark" aria-hidden="true">'+game.mark+'</span><strong>'+game.name+'</strong><small>'+game.seats+'</small>';
  tile.setAttribute('aria-label', 'วิธีเล่น '+game.name+' · '+game.seats);
  tile.onclick = () => showGuide(mode);
  $('guideShelf').append(tile);
  const choice = document.querySelector('#modeOptions [data-mode="'+mode+'"]');
  const mark = tile.firstElementChild.cloneNode(true);
  choice.prepend(mark);
}
$('guideOpen').onclick = () => showGuide(gameFamily(!$('roomView').hidden ? roomState?.gameMode : !$('createView').hidden ? selectedMode : '') || 'spyfall');
$('guideMode').onchange = event => showGuide(event.target.value);

$('copyCodeBtn').onclick = async () => {
  const code = roomState?.roomCode || roomId;
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    toast('คัดลอกรหัสห้องแล้ว', 'success');
  } catch {
    const range = document.createRange();
    range.selectNodeContents($('roomCode'));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    toast('เลือกรหัสให้แล้ว กดคัดลอกได้เลย');
  }
};

// Presets edit the existing creation form. Validation and room creation use the same fields.
const roundPresets = [
  ['รอบสั้น · 1 รอบ', {durationInput: 1}],
  ['คุยเต็มที่ · 3 รอบ', {durationInput: 3}]
];
const setupPresets = {
  spyfall: roundPresets, whoami_rounds: roundPresets, whoami_custom: roundPresets,
  whoami_time: [['รอบสั้น · คนละ 1 นาที', {durationInput: 1}], ['คุยเต็มที่ · คนละ 5 นาที', {durationInput: 5}]],
  insider: [
    ['เกมเร็ว · ทาย 2 นาที', {insiderCreatePrep: 30, insiderCreateGuess: 2, insiderCreateAttempts: 3, insiderCreateVote: 60}],
    ['มาตรฐาน · ทาย 5 นาที', {insiderCreatePrep: 60, insiderCreateGuess: 5, insiderCreateAttempts: 5, insiderCreateVote: 120}]
  ],
  cheese: [
    ['วงเล็ก · 4 คน คุย 2 นาที', {cheeseCreateCount: 4, cheeseCreateDiscuss: 2, cheeseCreateFall: false}],
    ['วงใหญ่ · 8 คน พร้อมหนูแพะ', {cheeseCreateCount: 8, cheeseCreateDiscuss: 5, cheeseCreateFall: true}]
  ],
  avalon: [
    ['9 คน · ไม่มี Angel', {avalonCreateCount: 9, avalonCreateAngel: false}],
    ['10 คน · เปิด Angel', {avalonCreateCount: 10, avalonCreateAngel: true}]
  ],
  cryptid: [
    ['3 คน · ป่าหมอก', {cryptidCreateCount: 3, cryptidCreateMap: 'mistwood'}],
    ['5 คน · สุ่มแผนที่', {cryptidCreateCount: 5, cryptidCreateMap: 'random'}]
  ]
};
function renderQuickSetup(mode) {
  const select = $('quickSetup');
  select.replaceChildren(new Option('เลือกชุดการตั้งค่า', ''));
  for (const [index, [label]] of setupPresets[mode].entries()) select.add(new Option(label, String(index)));
  $('presetStatus').textContent = '';
}
$('quickSetup').onchange = event => {
  if (event.target.value === '') return;
  const [label, fields] = setupPresets[selectedMode][Number(event.target.value)];
  for (const [id, value] of Object.entries(fields)) {
    if (typeof value === 'boolean') $(id).checked = value;
    else $(id).value = String(value);
  }
  if (selectedMode === 'cryptid') {
    cryptidCountChoices('cryptidCreate', Number($('cryptidCreateCount').value));
    cryptidRenderMapPreview('cryptidCreateMapPreview', $('cryptidCreateMap').value);
  }
  if (selectedMode === 'cheese') syncFallMouse('cheeseCreate');
  // The selector is a shortcut, not a persistent mode. Manual edits always win.
  event.target.value = '';
  $('presetStatus').textContent = 'ใช้ชุด '+label+' แล้ว ปรับต่อได้ด้านล่าง';
};
