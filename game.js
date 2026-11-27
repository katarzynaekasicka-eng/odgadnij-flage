'use strict';

const BUILD = '20261127.1';
const COUNTRY_CODES = 'AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LT LI LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW PS'.split(' ');
const ROUND_MS = 20000;
const $ = id => document.getElementById(id);
const assets = window.FLAG_GAME_ASSETS;
const game = {
  view: 'home', phase: 'idle', order: [], index: 0, question: null,
  score: 0, streak: 0, bestStreak: 0, lives: 3, correct: 0, answered: 0,
  swapUsed: false, token: 0, timer: null, deadline: 0, timeLeftMs: ROUND_MS,
  sessionId: '', startingBest: 0, recorded: false, audio: null, confirmAction: null
};
let storageWarningShown = false;
let updatePending = false;

function notice(message) {
  $('appNotice').textContent = message;
  $('appNotice').hidden = false;
  clearTimeout(notice.timeout);
  notice.timeout = setTimeout(() => { $('appNotice').hidden = true; }, 5000);
}
function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch {
    if (!storageWarningShown) {
      storageWarningShown = true;
      notice('Gra działa, ale przeglądarka nie pozwala zapisać wyników na urządzeniu.');
    }
    return false;
  }
}
function safeNumber(value) { return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0; }
function bestScore() { return safeNumber(read('flag-best', 0)); }
function nameOf(code) { return assets.names[code] || code; }
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function makeQuestion(code) {
  return { code, options: shuffle([code, ...shuffle(COUNTRY_CODES.filter(c => c !== code)).slice(0, 3)]) };
}
const preferences = {
  sound: read('flag-sound', true) !== false,
  motion: read('flag-motion', !matchMedia('(prefers-reduced-motion: reduce)').matches) !== false
};
function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#i-' + name);
  svg.append(use);
  return svg;
}
function syncPreferences() {
  $('soundSetting').checked = preferences.sound;
  $('motionSetting').checked = preferences.motion;
  $('sound').setAttribute('aria-pressed', String(preferences.sound));
  $('sound').setAttribute('aria-label', preferences.sound ? 'Wyłącz dźwięk' : 'Włącz dźwięk');
  $('sound').querySelector('use').setAttribute('href', preferences.sound ? '#i-sound' : '#i-mute');
  document.body.classList.toggle('no-motion', !preferences.motion);
}
function tone(frequency, duration = .14, delay = 0) {
  if (!preferences.sound) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    game.audio ||= new Audio();
    if (game.audio.state === 'suspended') game.audio.resume().catch(() => {});
    const start = game.audio.currentTime + delay;
    const osc = game.audio.createOscillator();
    const gain = game.audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(.045, start + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(gain); gain.connect(game.audio.destination);
    osc.start(start); osc.stop(start + duration + .02);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  } catch { /* Sound must never interrupt play. */ }
}
function showScreen(id, focus = true) {
  pauseTimer();
  game.view = id;
  document.querySelectorAll('.screen').forEach(screen => { screen.hidden = screen.id !== id; });
  if (id === 'stats') drawStats();
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (focus && id !== 'home') {
    const title = $(id).querySelector('h1');
    if (title) { title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true }); }
  }
  if (id === 'home' && updatePending) location.reload();
}
function stopTimer() {
  if (game.timer !== null) clearInterval(game.timer);
  game.timer = null;
}
function pauseTimer() {
  if (game.timer !== null) game.timeLeftMs = Math.max(0, game.deadline - performance.now());
  stopTimer();
  if (game.phase === 'question' && game.view === 'quiz') $('paused').hidden = false;
}
function paintTime() {
  const seconds = Math.max(0, Math.ceil(game.timeLeftMs / 1000));
  $('timer').textContent = seconds;
  $('timer').parentElement.classList.toggle('urgent', seconds <= 5);
}
function resumeTimer() {
  if (game.phase !== 'question' || game.view !== 'quiz' || document.hidden || $('confirmDialog').open || $('answerDialog').open) return;
  stopTimer();
  $('paused').hidden = true;
  game.deadline = performance.now() + game.timeLeftMs;
  paintTime();
  const token = game.token;
  game.timer = setInterval(() => {
    if (game.token !== token || game.phase !== 'question') { stopTimer(); return; }
    game.timeLeftMs = Math.max(0, game.deadline - performance.now());
    paintTime();
    if (game.timeLeftMs <= 0) answer(-1);
  }, 100);
}
function paintScore() {
  $('score').textContent = game.score;
  $('streak').textContent = game.streak;
  $('lives').textContent = game.lives;
  $('lives').parentElement.setAttribute('aria-label', `Pozostałe życia: ${game.lives}`);
}
function startGame() {
  pauseTimer();
  if ($('answerDialog').open) $('answerDialog').close();
  game.token++;
  Object.assign(game, {
    phase: 'loading', order: shuffle(COUNTRY_CODES), index: 0,
    score: 0, streak: 0, bestStreak: 0, lives: 3, correct: 0, answered: 0,
    swapUsed: false, recorded: false, startingBest: bestScore(),
    sessionId: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
  });
  showScreen('quiz');
  // Resume Web Audio inside the gesture, especially on iOS.
  tone(520, .08);
  renderQuestion();
}
function decodeImage(image) {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = error => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      image.removeEventListener('load', loaded);
      image.removeEventListener('error', failed);
      error ? reject(error) : resolve();
    };
    const loaded = () => finish(image.naturalWidth ? null : new Error('Empty image'));
    const failed = () => finish(new Error('Image unavailable'));
    const timeout = setTimeout(failed, 7000);
    image.addEventListener('load', loaded);
    image.addEventListener('error', failed);
    if (image.complete) queueMicrotask(loaded);
  });
}
async function renderQuestion(retry = false) {
  pauseTimer();
  const token = ++game.token;
  game.phase = 'loading';
  game.timeLeftMs = ROUND_MS;
  paintTime();
  $('paused').hidden = true;
  $('roundError').hidden = true;
  $('flagLoading').hidden = false;
  $('flagLoading').textContent = 'Ładowanie flagi…';
  $('flagCard').setAttribute('aria-busy', 'true');
  if (!retry) game.question = makeQuestion(game.order[game.index]);
  paintScore();
  $('count').textContent = `${game.index + 1} / ${game.order.length}`;
  $('progress').style.width = `${game.index / game.order.length * 100}%`;
  $('progressTrack').setAttribute('aria-valuenow', game.index);
  $('swap').disabled = game.swapUsed || game.index === game.order.length - 1;
  $('swapHint').textContent = game.swapUsed ? 'Zamiana wykorzystana' : 'Jedna zamiana flagi na grę';
  const choices = $('choices');
  choices.replaceChildren();
  game.question.options.forEach((code, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'choice'; button.disabled = true;
    const label = document.createElement('span'); label.className = 'choice-label'; label.textContent = nameOf(code);
    const shortcut = document.createElement('span'); shortcut.className = 'choice-shortcut'; shortcut.textContent = index + 1;
    shortcut.setAttribute('aria-hidden', 'true');
    button.append(label, shortcut);
    button.addEventListener('click', () => { if (game.token === token) answer(index); });
    choices.append(button);
  });
  const flag = $('flag');
  flag.src = assets.flags[game.question.code];
  try {
    await decodeImage(flag);
    if (game.token !== token || game.view !== 'quiz') return;
    $('flagLoading').hidden = true;
    $('flagCard').setAttribute('aria-busy', 'false');
    game.phase = 'question';
    for (const button of choices.children) button.disabled = false;
    resumeTimer();
  } catch {
    if (game.token !== token) return;
    game.phase = 'load-error';
    $('flagLoading').textContent = 'Flaga niedostępna';
    $('roundError').hidden = false;
    $('swap').disabled = true;
  }
}
function showConfetti() {
  const container = $('confetti');
  container.replaceChildren();
  if (!preferences.motion) return;
  const colors = ['#22deff', '#f13bdd', '#ffdd37', '#9c5dff', '#52ed63'];
  for (let i = 0; i < 30; i++) {
    const bit = document.createElement('i');
    bit.style.setProperty('--x', `${(i * 37 + 7) % 100}%`);
    bit.style.setProperty('--y', `${(i * 19) % 60}%`);
    bit.style.setProperty('--color', colors[i % colors.length]);
    bit.style.setProperty('--rotation', `${i * 51}deg`);
    bit.style.setProperty('--delay', `${(i % 7) * .04}s`);
    container.append(bit);
  }
}
function answer(index) {
  if (game.phase !== 'question' || game.view !== 'quiz') return;
  if (index !== -1 && (!Number.isInteger(index) || index < 0 || index > 3)) return;
  // One state transition locks mouse, touch, keyboard and timeout together.
  game.phase = 'feedback';
  pauseTimer();
  const correct = game.question.options[index] === game.question.code;
  game.answered++;
  if (correct) {
    game.score += 3; game.correct++; game.streak++;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    if (game.score > bestScore()) write('flag-best', game.score);
    tone(660, .15); tone(880, .2, .12);
  } else {
    game.streak = 0; game.lives = Math.max(0, game.lives - 1);
    tone(180, .24);
  }
  paintScore();
  [...$('choices').children].forEach((button, i) => {
    button.disabled = true;
    if (game.question.options[i] === game.question.code) {
      button.classList.add('correct');
      button.prepend(icon('check'));
    } else if (i === index) button.classList.add('wrong');
  });
  $('progress').style.width = `${(game.index + 1) / game.order.length * 100}%`;
  $('progressTrack').setAttribute('aria-valuenow', game.index + 1);
  const final = game.lives === 0 || game.index === game.order.length - 1;
  const dialog = $('answerDialog');
  dialog.classList.toggle('bad', !correct);
  $('answerEmblem').replaceChildren(icon(correct ? 'check' : index === -1 ? 'clock' : 'close'));
  $('answerTitle').replaceChildren();
  if (correct) $('answerTitle').append('Dobra', document.createElement('br'), 'odpowiedź!');
  else $('answerTitle').textContent = index === -1 ? 'Czas minął!' : 'Tym razem nie!';
  $('answerPoints').textContent = correct ? '+3 punkty' : '−1 życie';
  $('answerDetail').textContent = correct ? nameOf(game.question.code) : `Poprawna odpowiedź: ${nameOf(game.question.code)}`;
  if (final) $('answerDetail').textContent += ' · Koniec gry';
  $('continue').querySelector('span').textContent = final ? 'Zobacz wynik' : 'Następne pytanie';
  $('confetti').replaceChildren();
  if (correct) showConfetti();
  dialog.showModal();
  $('continue').focus({ preventScroll: true });
}
function nextQuestion() {
  if (game.phase !== 'feedback') return;
  $('answerDialog').close();
  $('confetti').replaceChildren();
  if (game.lives === 0 || game.index === game.order.length - 1) { finishGame(); return; }
  game.index++;
  $('questionHeading').focus({ preventScroll: true });
  renderQuestion();
}
function swapQuestion() {
  if (game.phase !== 'question' || game.swapUsed || game.index >= game.order.length - 1) return;
  const nextIndex = game.index + 1 + Math.floor(Math.random() * (game.order.length - game.index - 1));
  [game.order[game.index], game.order[nextIndex]] = [game.order[nextIndex], game.order[game.index]];
  game.swapUsed = true;
  renderQuestion();
}
function boardRows() {
  const rows = read('flag-board', []);
  return (Array.isArray(rows) ? rows : [])
    .filter(row => row && typeof row.nick === 'string' && Number.isFinite(row.score) && row.score >= 0)
    .map(row => ({ id: typeof row.id === 'string' ? row.id : '', nick: row.nick.slice(0, 24), score: safeNumber(row.score) }))
    .sort((a, b) => b.score - a.score).slice(0, 10);
}
function totals() {
  const raw = read('flag-totals', {});
  return { games: safeNumber(raw?.games), correct: safeNumber(raw?.correct), answered: safeNumber(raw?.answered) };
}
function finishGame() {
  game.phase = 'finished';
  stopTimer();
  if (!game.recorded) {
    const total = totals();
    write('flag-totals', { games: total.games + 1, correct: total.correct + game.correct, answered: total.answered + game.answered });
    const nick = read('flag-player', 'Gracz');
    const entry = { id: game.sessionId, nick: typeof nick === 'string' ? nick.slice(0, 24) : 'Gracz', score: game.score };
    write('flag-board', [...boardRows(), entry].sort((a, b) => b.score - a.score).slice(0, 10));
    game.recorded = true;
  }
  $('finalScore').textContent = game.score;
  $('finalCorrect').textContent = `${game.correct} / ${game.answered}`;
  $('finalAccuracy').textContent = `${game.answered ? Math.round(game.correct / game.answered * 100) : 0}%`;
  $('finalStreak').textContent = game.bestStreak;
  $('newRecord').hidden = game.score <= game.startingBest;
  $('summaryReason').textContent = game.lives === 0 ? 'Trzy życia wykorzystane. Spróbujesz pobić swój wynik?' : 'Wszystkie flagi za Tobą. Świetna znajomość świata!';
  const player = read('flag-player', '');
  $('playerName').value = typeof player === 'string' ? player.slice(0, 24) : '';
  $('saveStatus').textContent = 'Wynik zapisany na tym urządzeniu.';
  showScreen('summary');
}
function drawStats() {
  $('bestScore').replaceChildren(String(bestScore()) + ' ', Object.assign(document.createElement('small'), { textContent: 'pkt' }));
  const total = totals();
  $('totalGames').textContent = total.games;
  $('totalAccuracy').textContent = total.answered ? `${Math.round(total.correct / total.answered * 100)}%` : '—';
  const board = $('leaderboard'); board.replaceChildren();
  const rows = boardRows(); $('emptyBoard').hidden = rows.length !== 0;
  for (const row of rows) {
    const li = document.createElement('li');
    const nick = document.createElement('span'); nick.className = 'nick'; nick.textContent = row.nick;
    const score = document.createElement('strong'); score.textContent = `${row.score} pkt`;
    li.append(nick, score); board.append(li);
  }
}
function askConfirmation(title, detail, onConfirm) {
  if ($('confirmDialog').open) return;
  pauseTimer();
  game.confirmAction = onConfirm;
  $('confirmTitle').textContent = title; $('confirmDetail').textContent = detail;
  $('confirmDialog').showModal();
  $('confirmCancel').focus();
}
function cancelConfirmation() {
  $('confirmDialog').close(); game.confirmAction = null; resumeTimer();
}
function initialize() {
  if (!assets || COUNTRY_CODES.length !== 195 || new Set(COUNTRY_CODES).size !== 195 || COUNTRY_CODES.some(code => !assets.flags[code] || !assets.names[code])) {
    $('bootError').hidden = false; $('start').disabled = true; return;
  }
  const hero = $('heroImage');
  hero.addEventListener('load', () => $('hero').classList.add('loaded'));
  hero.addEventListener('error', () => $('hero').classList.remove('loaded'));
  hero.src = assets.hero;
  for (const code of ['PL', 'BR', 'JP', 'GB', 'FR']) {
    const img = document.createElement('img'); img.alt = ''; img.src = assets.flags[code]; $('parade').append(img);
  }
  syncPreferences();
  $('start').disabled = false;
  $('startLabel').textContent = 'Rozpocznij grę';
  $('start').addEventListener('click', startGame);
  $('playAgain').addEventListener('click', startGame);
  $('continue').addEventListener('click', nextQuestion);
  $('swap').addEventListener('click', swapQuestion);
  $('retryFlag').addEventListener('click', () => renderQuestion(true));
  $('reset').addEventListener('click', () => askConfirmation('Zacząć od nowa?', 'Bieżący postęp zostanie utracony. Rozpoczniesz grę z 3 życiami.', startGame));
  $('leave').addEventListener('click', () => askConfirmation('Wrócić do menu?', 'Bieżący postęp nie zostanie zapisany.', () => {
    game.token++; game.phase = 'idle'; showScreen('home'); $('start').focus();
  }));
  document.querySelectorAll('[data-screen]').forEach(button => button.addEventListener('click', () => showScreen(button.dataset.screen)));
  $('sound').addEventListener('click', () => {
    preferences.sound = !preferences.sound; write('flag-sound', preferences.sound); syncPreferences(); tone(520, .08);
  });
  $('soundSetting').addEventListener('change', event => {
    preferences.sound = event.target.checked; write('flag-sound', preferences.sound); syncPreferences(); tone(520, .08);
  });
  $('motionSetting').addEventListener('change', event => {
    preferences.motion = event.target.checked; write('flag-motion', preferences.motion); syncPreferences();
  });
  $('saveName').addEventListener('click', () => {
    const nick = $('playerName').value.trim().slice(0, 24) || 'Gracz';
    const rows = boardRows();
    const own = rows.find(row => row.id === game.sessionId);
    if (own) own.nick = nick;
    const saved = write('flag-player', nick) && write('flag-board', rows);
    $('saveStatus').textContent = saved ? 'Nick zapisany. Twój wynik jest w statystykach.' : 'Przeglądarka zablokowała zapis.';
  });
  $('clearStats').addEventListener('click', () => askConfirmation('Wyczyścić statystyki?', 'Usuniesz lokalne wyniki, rekord i historię ukończonych gier.', () => {
    write('flag-board', []); write('flag-best', 0); write('flag-totals', {}); drawStats();
  }));
  $('confirmCancel').addEventListener('click', cancelConfirmation);
  $('confirmAccept').addEventListener('click', () => {
    const action = game.confirmAction; game.confirmAction = null; $('confirmDialog').close(); if (action) action();
  });
  $('confirmDialog').addEventListener('cancel', event => { event.preventDefault(); cancelConfirmation(); });
  $('answerDialog').addEventListener('cancel', event => event.preventDefault());
  document.addEventListener('visibilitychange', () => { document.hidden ? pauseTimer() : resumeTimer(); });
  document.addEventListener('keydown', event => {
    if (event.repeat || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || $('confirmDialog').open) return;
    if (game.phase === 'question' && game.view === 'quiz' && /^[1-4]$/.test(event.key)) { event.preventDefault(); answer(Number(event.key) - 1); }
  });
  window.flagGameReady = true;
  if (!document.documentElement.hasAttribute('data-standalone') && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' })
        .then(registration => registration.update().catch(() => {})).catch(() => {});
    });
    // An open round stays intact. Updated files load on the next visit to the menu.
    const wasControlled = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!wasControlled) return;
      if (game.view === 'home') location.reload();
      else { updatePending = true; notice('Aktualizacja gotowa. Włączy się po powrocie do menu.'); }
    });
  }
}
initialize();
