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
    'ถ้าเลือกให้ผู้เล่นตั้งคำเอง แต่ละคนทายได้ตามจำนวนครั้งที่ตั้งไว้ คนที่ตั้งคำจะเป็นผู้ตัดสิน'
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
  avalon: {name: 'Avalon', seats: '8–10 คน', mark: '♜', rules: [
    'ดูบทบาทและข้อมูลฝ่ายที่คุณได้รับ',
    'หัวหน้าเลือกทีม ทุกคนโหวตรับหรือปฏิเสธทีม เมื่อผ่าน สมาชิกทีมส่งผลภารกิจเป็นความลับ',
    'ฝ่ายแดงชนะเมื่อภารกิจล้มเหลวครบ 3 ครั้ง หากฝ่ายน้ำเงินทำสำเร็จ 3 ครั้ง มือสังหารยังมีโอกาสทาย Merlin'
  ]},
  cryptid: {name: 'Cryptid', seats: '2–5 คน', mark: '⬡', rules: [
    'อ่านเบาะแสของตัวเอง ทุกเบาะแสชี้ไปยังช่องเดียวกันบนแผนที่',
    'แบบ 2 คนเพิ่มคำใบ้ระบุภูมิประเทศตรง ๆ เพื่อให้ทุกด่านมีคู่คำใบ้ที่ไขได้ ส่วนระดับบอทเลือกปกติหรือยากได้ก่อนเริ่ม',
    'เลือก Original, Deep Sea หรือ Volcano แต่ละชุดมีพื้นที่ สัตว์ สิ่งก่อสร้าง และเบาะแสเฉพาะธีม',
    'วางหมากเริ่มต้น แล้วเลือกช่องเพื่อถามเพื่อน สี่เหลี่ยมหมายถึงอยู่ไม่ได้ วงกลมหมายถึงยังเป็นไปได้',
    'เมื่อมั่นใจให้ค้นหาช่องนั้น ถ้าตรงกับเบาะแสของทุกคน คุณชนะและได้ 1 คะแนน'
  ]},
  coup: {name:'Coup',seats:'2–6 คน',mark:'♛',rules:[
    'ภาคพื้นฐาน: ไพ่ 15 ใบ มี Duke, Assassin, Captain, Ambassador และ Contessa อย่างละ 3 ใบ แจกคนละ 2 ใบและ 2 เหรียญ เกม 2 คน ผู้เริ่มได้ 1 เหรียญ',
    'แต่ละตาเลือก 1 แอ็กชัน: รายได้ +1, เงินช่วยเหลือ +2, ภาษี +3, ขโมยสูงสุด 2, แลกไพ่, ลอบสังหารจ่าย 3 หรือรัฐประหารจ่าย 7 มีตั้งแต่ 10 เหรียญต้องรัฐประหาร',
    'อ้างบทบาทได้แม้ไม่ได้ถือไพ่ ทุกคนมีสิทธิ์ท้าบทบาท ผู้แพ้เปิดทิ้ง 1 ใบ ผู้พิสูจน์ได้คืนไพ่ที่แสดงแล้วจั่วใหม่',
    'Duke ขวางเงินช่วยเหลือได้ ผู้ถูกโจมตีใช้ Contessa ขวางการลอบสังหาร หรือ Captain / Ambassador ขวางการขโมย การขวางถูกท้าได้เช่นกัน',
    'รัฐประหารขวางหรือท้าไม่ได้ เสียไพ่ครบ 2 ใบออกจากเกม คนสุดท้ายชนะ +1 คะแนน'
  ],source:'https://www.qugs.org/rules/r131357.pdf'},
  liar_deck: {name:'Liar’s Deck',seats:'2–4 คน',mark:'♠',rules:[
    'Classic ตาม Liar’s Bar: ไพ่ A, K, Q อย่างละ 6 ใบ และ Joker 2 ใบ รวม 20 ใบ แจกคนละ 5 ใบและสุ่มไพ่ประจำโต๊ะ',
    'ลงไพ่คว่ำ 1–3 ใบ โดยอ้างว่าเป็นไพ่ประจำโต๊ะ Joker แทนไพ่ประจำโต๊ะได้ คนถัดไปเลือกลงต่อหรือเรียก LIAR!',
    'เปิดเฉพาะชุดล่าสุด หากผิดแม้ใบเดียว คนลงแพ้ หากตรงทั้งหมด คนท้าแพ้ ผู้แพ้เสี่ยงออก 1 จาก 6 ช่อง ตำแหน่งเสี่ยงคงเดิมตลอดเกม ความเสี่ยงเพิ่มหลังแต่ละครั้งที่รอด',
    'ไพ่หมดให้ข้ามตา หากเหลือคนถือไพ่เพียงคนเดียว ต้องท้าคำอ้างล่าสุด หลังเปิดผลแจกใหม่ ผู้รอดเป็นคนสุดท้ายชนะ +1 คะแนน'
  ],source:'https://store.steampowered.com/app/3097560/Liars_Bar/'},
  liar_dice: {name:'Liar’s Dice',seats:'2–4 คน',mark:'⚄',rules:[
    'Classic ตาม Liar’s Bar: ทุกคนทอยเต๋า 5 ลูกและเห็นเฉพาะของตัวเอง เลข 1 นับเป็นเลข 1 ไม่ใช่ตัวแทน',
    'อ้างจำนวนเต๋าหน้าใดหน้าหนึ่งที่มีรวมทั้งโต๊ะ เช่น มีหน้า 4 อย่างน้อย 5 ลูก',
    'คนถัดไปต้องเพิ่มจำนวน หรือใช้จำนวนเดิมแต่เพิ่มหน้าเต๋า หรือเรียก LIAR! เพื่อเปิดเต๋าทุกคน',
    'ถ้ามีจริงน้อยกว่าคำอ้าง คนอ้างแพ้ ถ้าเท่ากันหรือมากกว่า คนท้าแพ้ รับโทษครบ 2 ครั้งออกจากเกม',
    'ทอยใหม่ทุกรอบ ผู้รอดเป็นคนสุดท้ายชนะ +1 คะแนน'
  ],source:'https://store.steampowered.com/app/3097560/Liars_Bar/'},
  take6: {name:'6 nimmt!',seats:'2–10 คน',mark:'Ⅵ',rules:[
    'ทุกคนได้รับไพ่เลข 1–104 คนละ 10 ใบ เปิดไพ่สี่ใบเป็นจุดเริ่มของสี่แถว',
    'เลือกไพ่คว่ำพร้อมกัน แล้วเปิดและวางจากเลขน้อยไปมาก ไพ่ต้องต่อท้ายแถวที่มีเลขต่ำกว่าและใกล้ที่สุด',
    'หากต้องวางเป็นใบที่หก ให้เก็บห้าใบเดิมเป็นแต้มลบ หากเลขต่ำกว่าทุกแถว ให้เลือกแถวที่ต้องเก็บเอง',
    'เมื่อครบสิบตาให้นับหัววัวบนไพ่ที่เก็บ แจกไพ่ใหม่ เล่นจนมีใครสะสมแต้มลบถึง 66 คนที่มีแต้มน้อยที่สุดชนะ'
  ],source:'https://blog.amigo-spiele.de/content/ap/rule/04910-GB-AmigoRule.pdf'},
  just_one: {name:'Just One',seats:'3–7 คน',mark:'✎',rules:[
    'เล่นร่วมกัน 13 ใบ ผู้ทายเลือกเลข 1–5 โดยไม่เห็นคำที่อยู่ในช่องนั้น',
    'ผู้เล่นที่เหลือเขียนคำใบ้ลับคนละหนึ่งคำ หากเล่น 3–4 คนเขียนคนละสองคำ',
    'ตรวจและตัดคำใบ้ที่ซ้ำ คล้ายกัน หรือผิดกติกาก่อนเปิดให้ผู้ทายดู ผู้ทายตอบหนึ่งครั้งหรือข้าม',
    'ตอบถูกเก็บหนึ่งใบ ข้ามทิ้งหนึ่งใบ ตอบผิดทิ้งสองใบ ถ้าไพ่หมดให้คืนหนึ่งใบจากกองที่ได้',
    'โหมดนี้ให้ทุกคน +1 คะแนนในห้องหากทายถูกอย่างน้อย 9 จาก 13 ใบ'
  ],source:'https://www.rprod.com/en/games/just-one'},
  wavelength: {name:'Wavelength',seats:'2–10 คน',mark:'◒',rules:[
    'โหมดร่วมมือแบบแอป เล่น 8 รอบ โดยแต่ละรอบมีสเกลสองขั้ว เช่น เงียบ–เสียงดัง',
    'คนใบ้คนเดียวเห็นตำแหน่งเป้าหมายลับ 0–100 แล้วให้คำใบ้ที่พาเพื่อนนึกถึงตำแหน่งนั้น',
    'คนอื่นหารือและปรับหน้าปัด คนยืนยันกดเปิดเป้าหมายเพื่อรับ 0–4 แต้มตามความใกล้',
    'ครบ 8 รอบ ถ้ารวมได้อย่างน้อย 16 แต้ม ทุกคนได้ +1 คะแนนในห้อง'
  ],source:'https://www.wavelength.zone/'}
};

function gameFamily(mode) {
  return mode?.startsWith('whoami') ? 'whoami' : mode;
}

function showGuide(mode) {
  const game = deskGames[mode];
  $('guideTitle').textContent = 'วิธีเล่น '+game.name;
  const steps = document.createElement('ol');
  for (const rule of game.rules) {
    const step = document.createElement('li');
    step.textContent = rule;
    steps.append(step);
  }
  const count = document.createElement('p');
  count.textContent = game.seats;
  $('guideBody').replaceChildren(count, steps);
  if(game.source){const link=document.createElement('a');link.href=game.source;link.target='_blank';link.rel='noopener';link.textContent='กติกาจากผู้สร้างเกม';$('guideBody').append(link);}
  if (!$('gameGuide').open) $('gameGuide').showModal();
}

for (const [mode, game] of Object.entries(deskGames)) {
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
