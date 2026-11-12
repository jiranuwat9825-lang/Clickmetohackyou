
/* ====================================================================
   PARTY GAME HUB V4 — scoring + voting patch
   นำโค้ดชุดนี้ไปต่อท้าย script.js ของ V3 (ไม่ต้องลบโค้ดเก่า)
   ==================================================================== */
let voteWordSelectionV4 = '';
let voteSendingV4 = false;

// รับรูปแบบโหวตเก่า (ข้อความ ID) และใหม่ ({targetId, guessWord})
function ballotV4(value) {
  if (typeof value === 'string') return {targetId: value, guessWord: ''};
  return {targetId: value?.targetId || '', guessWord: value?.guessWord || ''};
}
function sameWordV4(a,b) {
  return String(a || '').trim().toLocaleLowerCase() === String(b || '').trim().toLocaleLowerCase();
}
function eligibleVoteWordsV4(state) {
  const pack = getCurrentCategoryPack(state);
  return [...new Set(pack?.groups?.[state.currentGroup] || [])].filter(Boolean);
}

// แทนฟังก์ชันแสดงหน้าโหวตเดิม ให้เลือกคนและทายคำในฟอร์มเดียวกัน
function renderVoteOrResults(state) {
  const spyMode = state.gameMode === 'spyfall';
  const resultMode = state.status === 'results';
  setVisible(ui.voteList,spyMode && !resultMode);
  setVisible(ui.voteResult,resultMode);
  setVisible(ui.hostPostVoteControls,resultMode && isHost);
  if (!spyMode) {
    ui.voteAreaTitle.textContent = '🏆 สรุปผล Who Am I';
    ui.voteInstruction.textContent = 'คะแนนสะสมของผู้เล่นในห้อง';
    renderWhoAmIResult(state);
    return;
  }
  if (resultMode) {
    ui.voteAreaTitle.textContent = '🏆 ผลเกม Spyfall';
    ui.voteInstruction.textContent = 'คะแนนจากการจับ Spy และโบนัสทายคำ';
    renderSpyfallResult(state);
    return;
  }

  const players = state.players || {};
  const ids = Object.keys(players);
  const votes = state.votes || {};
  const myVote = votes[myId];
  const totalVoted = ids.filter(id => !!votes[id]).length;
  const candidates = (state.tieCandidates || ids).filter(id => players[id]);
  const canPick = candidates.filter(id => id !== myId);
  ui.voteAreaTitle.textContent = state.tieCandidates ? '🗳️ โหวตรอบตัดสิน' : '🗳️ ใครคือ Spy?';
  ui.voteInstruction.textContent = myVote
    ? `ส่งคำตอบแล้ว (${totalVoted}/${ids.length}) รอเพื่อนที่เหลือ`
    : `เลือกผู้ต้องสงสัย แล้วลองทายคำของคนนั้นเพื่อชิงโบนัส · ${totalVoted}/${ids.length} คนโหวตแล้ว`;
  ui.voteList.replaceChildren();

  if (myVote) {
    const vote = ballotV4(myVote);
    const note = document.createElement('div'); note.className = 'info-note';
    note.textContent = `✓ โหวต ${players[vote.targetId]?.name || 'ผู้เล่น'}${vote.guessWord ? ` · ทายคำ “${vote.guessWord}”` : ''} เรียบร้อย`;
    ui.voteList.append(note);
    return;
  }
  if (!canPick.includes(selectedTargetId)) { selectedTargetId = ''; voteWordSelectionV4 = ''; }
  if (!canPick.length) {
    const note = document.createElement('div'); note.className = 'info-note';
    note.textContent = 'ไม่มีผู้ต้องสงสัยให้เลือก ระบบจะสรุปผลเมื่อทุกคนโหวตครบ';
    ui.voteList.append(note);
    return;
  }

  const title = document.createElement('div'); title.className = 'vote-step-title';
  title.textContent = '01 · เลือกคนที่คิดว่าเป็น Spy'; ui.voteList.append(title);
  const choices = document.createElement('div'); choices.className = 'vote-choice-list';
  canPick.forEach(id => {
    const btn = document.createElement('button'); btn.type='button';
    btn.className = `vote-choice ${selectedTargetId === id ? 'selected' : ''}`;
    btn.innerHTML = `<span>👤 ${escapeHTML(players[id].name)}</span><span>${selectedTargetId === id ? '✓ เลือกแล้ว' : 'เลือกคนนี้'}</span>`;
    btn.addEventListener('click',() => {
      if (selectedTargetId !== id) voteWordSelectionV4 = '';
      selectedTargetId = id; renderVoteOrResults(state);
    });
    choices.append(btn);
  });
  ui.voteList.append(choices);
  if (!selectedTargetId) return;

  const extra = document.createElement('div'); extra.className = 'vote-bonus-panel';
  const label = document.createElement('label'); label.className = 'field-label';
  label.textContent = '02 · ทายคำของคนที่เลือก (ไม่บังคับ)';
  const hint = document.createElement('p'); hint.className = 'vote-bonus-hint';
  hint.textContent = 'ทายถูกได้โบนัส +1 คะแนน ไม่ว่าทีมไหนจะชนะ';
  const select = document.createElement('select'); select.className = 'vote-word-select';
  const blank = document.createElement('option'); blank.value = ''; blank.textContent = '— ไม่ทายคำ —'; select.append(blank);
  eligibleVoteWordsV4(state).forEach(word => {
    const opt = document.createElement('option'); opt.value = word; opt.textContent = word;
    select.append(opt);
  });
  select.value = voteWordSelectionV4;
  select.addEventListener('change',() => { voteWordSelectionV4 = select.value; });
  const confirmBtn = document.createElement('button'); confirmBtn.type='button';
  confirmBtn.className = 'btn btn-primary btn-wide vote-confirm';
  confirmBtn.textContent = `ยืนยันโหวต ${players[selectedTargetId].name} →`;
  confirmBtn.disabled = voteSendingV4;
  confirmBtn.addEventListener('click',submitVote);
  extra.append(label,hint,select,confirmBtn); ui.voteList.append(extra);
}

// ข้อมูลโหวต + คำเดาเขียนพร้อมกันใน transaction เดียว
async function submitVote() {
  if (!roomId || !roomState || !selectedTargetId || voteSendingV4) return;
  const targetId = selectedTargetId;
  const guessWord = voteWordSelectionV4;
  voteSendingV4 = true;
  try {
    const result = await getRoomRef().transaction(room => {
      const candidates = room?.tieCandidates || Object.keys(room?.players || {});
      if (!room || room.status !== 'voting' || !room.players?.[myId] ||
          !room.players?.[targetId] || targetId === myId ||
          !candidates.includes(targetId) || room.votes?.[myId]) return;
      const words = eligibleVoteWordsV4(room);
      if (guessWord && !words.includes(guessWord)) return;
      room.votes ||= {};
      room.votes[myId] = {targetId,guessWord};
      room.lastActivityAt = serverTimestamp();
      return room;
    },undefined,false);
    if (result.committed) toast('บันทึกโหวตและคำทายแล้ว ✓','success');
    else toast('โหวตไม่สำเร็จ หรือคุณโหวตไปแล้ว','error');
  } catch(err) { gameError(err); }
  finally { voteSendingV4 = false; }
}

// คิดคะแนนครั้งเดียว ณ ขณะเปลี่ยน status จาก voting เป็น results
function calculateSpyfallV4(room) {
  const players = room.players || {};
  const ids = Object.keys(players);
  const votes = room.votes || {};
  const counts = {};
  ids.forEach(id => {
    const target = ballotV4(votes[id]).targetId;
    if (players[target]) counts[target] = (counts[target] || 0) + 1;
  });
  const maxVotes = Math.max(0,...Object.values(counts));
  const winners = Object.keys(counts).filter(id => counts[id] === maxVotes);
  const tieFinal = winners.length !== 1;
  const pickedId = tieFinal ? null : winners[0];
  const caught = !tieFinal && pickedId === room.spyId;
  const awards = {};
  ids.forEach(id => {
    const spy = id === room.spyId;
    const ballot = ballotV4(votes[id]);
    const guessedRight = !!ballot.guessWord && !!room.roles?.[ballot.targetId] &&
      sameWordV4(ballot.guessWord,room.roles[ballot.targetId]);
    // ฝั่งปกติต้องโหวต Spy ถูกก่อนจึงมีสิทธิ์โบนัสคำของ Spy
    const bonus = guessedRight && (spy || ballot.targetId === room.spyId) ? 1 : 0;
    const base = spy ? (caught ? 0 : 2) : (caught ? 1 : 0);
    awards[id] = {base,bonus,total:base+bonus};
  });
  return {pickedId,spyId:room.spyId,caught,tieFinal,awards};
}
function maybeFinalizeVote(state) {
  if (autoFinalizing || state.status !== 'voting' || !isHost) return;
  const ids = Object.keys(state.players || {});
  if (!ids.length || !ids.every(id => state.votes?.[id])) return;
  autoFinalizing = true;
  getRoomRef().transaction(room => {
    if (!room || room.status !== 'voting' || room.hostId !== myId) return;
    const living = Object.keys(room.players || {});
    if (!living.length || !living.every(id => room.votes?.[id])) return;
    const counts = {};
    living.forEach(id => {
      const target = ballotV4(room.votes[id]).targetId;
      if (room.players[target]) counts[target] = (counts[target] || 0) + 1;
    });
    const max = Math.max(0,...Object.values(counts));
    const top = Object.keys(counts).filter(id => counts[id] === max);
    if (top.length > 1 && !room.tieHandled) {
      room.tieHandled = true;
      room.tieCandidates = top;
      room.votes = {};
      room.lastActivityAt = serverTimestamp();
      return room;
    }
    const result = calculateSpyfallV4(room);
    room.scores ||= {};
    Object.entries(result.awards).forEach(([id,award]) => {
      room.scores[id] = (room.scores[id] || 0) + award.total;
    });
    room.result = result;
    room.status = 'results';
    room.lastActivityAt = serverTimestamp();
    return room;
  },undefined,false).catch(gameError).finally(() => {autoFinalizing = false;});
}
function renderSpyfallResult(state) {
  const r = state.result || {};
  const ids = Object.keys(state.players || {});
  ui.voteResult.replaceChildren();
  const title = document.createElement('h3');
  title.textContent = r.caught ? '🎉 ทีมผู้เล่นจับ Spy สำเร็จ!' : '🕶️ Spy รอดและชนะรอบนี้!';
  const detail = document.createElement('p');
  detail.textContent = `${r.tieFinal ? 'โหวตรอบตัดสินยังเสมอ · ' : ''}Spy คือ ${state.players?.[r.spyId]?.name || 'ผู้เล่นที่ออกไปแล้ว'} · คำ Spy: ${state.roles?.[r.spyId] || '—'}`;
  ui.voteResult.append(title,detail);
  const sub = document.createElement('p'); sub.className='result-subtitle';
  sub.textContent = 'คะแนนที่ได้รับในรอบนี้'; ui.voteResult.append(sub);
  ids.sort((a,b) => (r.awards?.[b]?.total || 0)-(r.awards?.[a]?.total || 0));
  ids.forEach(id => {
    const award = r.awards?.[id] || {base:0,bonus:0,total:0};
    const item = document.createElement('div'); item.className='result-score-row';
    const who = document.createElement('span'); who.textContent = `${state.players[id]?.name || 'ผู้เล่น'}${id === r.spyId ? ' 🕵️' : ''}`;
    const why = document.createElement('small'); why.textContent = `ชนะ ${award.base || 0} + โบนัสทายคำ ${award.bonus || 0}`;
    const value = document.createElement('strong'); value.textContent = `+${award.total || 0}`;
    const content = document.createElement('div'); content.append(who,why);
    item.append(content,value); ui.voteResult.append(item);
  });
}

// ดักก่อน listener เดิม (capture) เพื่อใช้กติกาคะแนนใหม่แทนทั้งหมด
ui.submitMyGuessBtn.addEventListener('click',async event => {
  event.stopImmediatePropagation();
  event.preventDefault();
  if (!roomId || !roomState?.gameMode?.startsWith('whoami')) return;
  const input = (selectedGuess || ui.myGuessSearch.value.trim()).toLocaleLowerCase();
  const choice = getAllItems(roomState.category,getCurrentCategoryPack(roomState))
    .find(item => item.toLocaleLowerCase() === input);
  if (!choice) {toast('กรุณาเลือกคำที่มีในหมวดก่อนตอบ','error');return;}
  if (!await askConfirm('ยืนยันคำตอบ?',`คุณเลือก “${choice}” มีสิทธิ์ทายได้ 1 ครั้ง`,'ยืนยันคำตอบ')) return;
  ui.submitMyGuessBtn.disabled = true;
  try {
    const result = await getRoomRef().transaction(room => {
      if (!room || room.status !== 'playing' || !room.gameMode?.startsWith('whoami') ||
          !room.players?.[myId] || room.attempts?.[myId] !== 1) return;
      if (room.gameMode === 'whoami_time' && now() >= Number(room.endTime || 0)) return;
      const correct = sameWordV4(choice,room.roles?.[myId]);
      room.attempts[myId] = 0;
      room.guessedCorrectly ||= {};
      room.guessedCorrectly[myId] = correct;
      if (room.guessDetailsGame !== room.gamesPlayed) {
        room.guessDetailsGame = room.gamesPlayed;
        room.guessDetails = {};
      }
      let points = 0;
      const round = Number(room.currentRound || 1);
      if (correct) {
        room.correctOrder ||= [];
        if (room.gameMode === 'whoami_time') {
          // คนตอบถูกลำดับที่ 1 = N คะแนน, ลำดับ 2 = N-1, ...
          points = Math.max(1,Object.keys(room.players).length - room.correctOrder.length);
        } else {
          // รอบเดียวกันได้เท่ากัน ไม่สนว่าใครคลิกก่อนในรอบ
          points = Math.max(1,Number(room.totalRounds || 2) - round + 1);
        }
        room.correctOrder.push(myId);
        room.scores ||= {};
        room.scores[myId] = (room.scores[myId] || 0) + points;
      }
      room.guessDetails ||= {};
      room.guessDetails[myId] = {correct,round,points};
      room.lastActivityAt = serverTimestamp();
      const active = Object.keys(room.players);
      if (active.length && active.every(id => room.attempts?.[id] === 0)) room.status = 'results';
      return room;
    },undefined,false);
    if (!result.committed) toast('ส่งไม่ได้ อาจหมดเวลาหรือใช้สิทธิ์ไปแล้ว','error');
    else {
      const correct = !!result.snapshot.val()?.guessedCorrectly?.[myId];
      const points = result.snapshot.val()?.guessDetails?.[myId]?.points || 0;
      toast(correct ? `ถูกต้อง! ได้ +${points} คะแนน 🎉` : `ยังไม่ถูก คำตอบคือ ${result.snapshot.val()?.roles?.[myId] || '—'}`,correct?'success':'error');
    }
  } catch(err) {gameError(err);}
  finally {ui.submitMyGuessBtn.disabled = false;}
},true);
function renderWhoAmIResult(state) {
  const players = state.players || {};
  const scores = state.scores || {};
  const details = state.guessDetailsGame === state.gamesPlayed ? (state.guessDetails || {}) : {};
  const ids = Object.keys(players).sort((a,b) => (scores[b] || 0)-(scores[a] || 0));
  ui.voteResult.replaceChildren();
  const title = document.createElement('h3'); title.textContent = '🏆 ตารางคะแนนรวม';
  const hint = document.createElement('p');
  hint.textContent = state.gameMode === 'whoami_rounds'
    ? 'คนตอบถูกในรอบเดียวกันได้คะแนนเท่ากัน'
    : 'คนตอบถูกก่อน ได้คะแนนมากกว่า';
  ui.voteResult.append(title,hint);
  ids.forEach((id,i) => {
    const item = document.createElement('div');item.className='result-score-row';
    const content = document.createElement('div');
    const name = document.createElement('span');name.textContent=`${['🥇','🥈','🥉'][i] || `${i+1}.`} ${players[id].name}`;
    const desc = document.createElement('small');
    desc.textContent = details[id]?.correct ? `รอบนี้ +${details[id].points} คะแนน${state.gameMode === 'whoami_rounds' ? ` · ตอบถูกรอบ ${details[id].round}` : ''}` : 'รอบนี้ +0 คะแนน';
    content.append(name,desc);
    const total = document.createElement('strong');total.textContent=`${scores[id] || 0} pts`;
    item.append(content,total);ui.voteResult.append(item);
  });
}
