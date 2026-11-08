'use strict';
let playMode = 'sky', thrower = 'launcher', prankCount = 0, paintingAt = 0;
const people = {uncle: 'Sharma ji', launcher: 'Chintu', dancer: 'Pooja'};
const crackerNames = {rocket: 'Rocket', anaar: 'Anaar', chakri: 'Chakri', ladi: 'Ladi', phuljhadi: 'Phuljhadi', sutli: 'Sutli bomb', skyshots: 'Sky shots', confetti: 'Confetti', ufo: 'Flying UFO', dilwale: 'Dilwale'};
function roofSay(line) {
  $('#roof-comment').textContent = line; $('#roof-comment').classList.add('visible');
  clearTimeout(neighbourTimer); neighbourTimer = setTimeout(() => $('#roof-comment').classList.remove('visible'), 2600);
}
function sparkle(x, y) {
  for (let i = 0; i < (reduced ? 5 : 18); i++) {
    const a = Math.random() * Math.PI * 2, v = .6 + Math.random() * 2.3;
    add(x, y, Math.cos(a) * v, Math.sin(a) * v, i % 3 ? '#ffd17e' : '#fff8d7', 25 + Math.random() * 25, 1.5, .045);
  }
}
function extraFirecracker(type, x, y) {
  const floor = h - 44;
  if (type === 'phuljhadi') {
    soundEffect('chakri', x); sparkle(x, y);
    for (let i = 1; i < 6; i++) later(() => sparkle(x + (Math.random() - .5) * 8, y), i * 70);
  } else if (type === 'sutli') {
    soundEffect('chakri', x);
    for (let k = 0; k < 6; k++) later(() => sparkle(x, floor - 8), k * 55);
    later(() => { burst(x, floor - 20, 120, '#ffd17e'); smoke(x, floor - 15, 2); }, 390);
  } else if (type === 'skyshots') {
    soundEffect('rocket', x);
    for (let k = 0; k < 5; k++) later(() => {
      const sx = Math.max(20, Math.min(w - 20, x + (k - 2) * 48));
      rockets.push({x: sx, y: floor, target: Math.max(35, y - (k % 2) * 45), speed: Math.max(10, h / 36)});
    }, k * 110);
  } else if (type === 'confetti') {
    soundEffect('pop', x);
    for (let k = 0; k < (reduced ? 25 : 100); k++) {
      const a = -Math.PI / 2 + (Math.random() - .5) * 1.8;
      const speed = 2 + Math.random() * 5;
      add(x, y, Math.cos(a) * speed, Math.sin(a) * speed, colors[k % colors.length], 80 + Math.random() * 50, 3 + Math.random() * 2, .065, {drag: .994, confetti: true});
    }
  } else if (type === 'ufo') {
    soundEffect('rocket', x);
    for (let k = 0; k < 35; k++) later(() => {
      const cx = x + Math.sin(k * .18) * Math.min(w * .18, 110), cy = floor - k * 5;
      for (let j = 0; j < (reduced ? 2 : 6); j++) {
        const a = k * .7 + j;
        add(cx, cy, Math.cos(a) * 2, Math.sin(a) * .65, j % 2 ? '#9fd9b1' : '#c99bf0', 35, 1.8, .02);
      }
    }, k * 24);
  } else if (type === 'dilwale') {
    soundEffect('boom', x);
    const total = reduced ? 24 : 75;
    for (let k = 0; k < total; k++) {
      const a = k / total * Math.PI * 2;
      const vx = 16 * Math.sin(a) ** 3 * .22;
      const vy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * .22;
      add(x, y, vx, vy, '#ef7dac', 90, 2, .013, {drag: .99});
    }
    roofSay('Pyaar ka rocket. Rishta bua ji bhejengi.');
  } else return false;
  return true;
}
function personPosition(id) {
  const box = document.querySelector('.roof-person.' + id).getBoundingClientRect();
  const arena = sky.getBoundingClientRect();
  return {x: box.left + box.width / 2 - arena.left, y: h - 53};
}
// A time-based, purely cartoon arc; no animation speed depends on frame count.
function tossPoint(from, to, t, height) {
  return {x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - Math.sin(Math.PI * t) * height};
}
function tossAt(fromId, targetId, reply = false, type = selected) {
  if (fromId === targetId) { roofSay('Khud pe? Society mein aur log bhi hain!'); return; }
  if (projectiles.length >= 5) { toast('Chhat traffic jam. Ek second, bhai!'); return; }
  const from = personPosition(fromId), to = personPosition(targetId);
  projectiles.push({from, to, fromRatio: from.x / w, toRatio: to.x / w, fromId, targetId, reply, type, started: performance.now(), duration: reduced ? 180 : 700, arc: Math.min(h * .4, Math.abs(to.x - from.x) * .35 + 60)});
  const actor = document.querySelector('.roof-person.' + fromId); actor.classList.add('is-tossing');
  later(() => actor.classList.remove('is-tossing'), 450);
  $('#sky-caption').style.opacity = '0'; rooftopReaction();
  roofSay(reply ? `${people[fromId]}: return gift le lo!` : `${people[fromId]} → ${people[targetId]} · ${crackerNames[type]}`);
}
function updateTosses(time) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const shot = projectiles[i], t = Math.min(1, (time - shot.started) / shot.duration);
    const from = {x: shot.fromRatio * w, y: h - 53}, to = {x: shot.toRatio * w, y: h - 53};
    const pos = tossPoint(from, to, t, Math.min(h * .4, Math.abs(to.x - from.x) * .35 + 60));
    if (t >= 1) {
      projectiles.splice(i, 1); const landing = personPosition(shot.targetId); launch(landing.x, Math.max(50, landing.y - 35), shot.type);
      const target = document.querySelector('.roof-person.' + shot.targetId);
      target.classList.add('is-hit'); later(() => target.classList.remove('is-hit'), 650);
      if (!shot.reply) { prankCount++; $('#fight-score').textContent = `${prankCount} successful prank${prankCount === 1 ? '' : 's'}`; }
      const retorts = {uncle: 'Secretary ko phone lagao! Yeh maintenance mein included nahi tha!', launcher: 'Bhai! Camera toh on hone deta!', dancer: 'Mere dupatte ko confetti samjha hai kya?'};
      roofSay(`${people[shot.targetId]}: ${retorts[shot.targetId]}`);
      if (!shot.reply && $('#return-fire').checked && playMode === 'fight') later(() => {
        if (playMode === 'fight') tossAt(shot.targetId, shot.fromId, true, 'confetti');
      }, 1000);
      continue;
    }
    if (!reduced) add(pos.x, pos.y, (Math.random() - .5) * .3, .5, '#ffd17e', 18, 1.2, .015);
    ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(t * Math.PI * 4);
    ctx.fillStyle = shot.reply ? '#b8c79a' : '#ee866b'; ctx.fillRect(-7, -4, 14, 8);
    ctx.fillStyle = '#f6d49b'; ctx.fillRect(-1, -4, 2, 8);
    ctx.restore();
  }
}
function resetTosses() {
  document.querySelectorAll('.roof-person').forEach(person => person.classList.remove('is-hit', 'is-tossing'));
}
function setPlayMode(mode) {
  playMode = mode; clearSky();
  sky.classList.toggle('fight-active', mode === 'fight');
  $('#fight-controls').hidden = mode !== 'fight';
  for (const [id, value] of [['sky-mode', 'sky'], ['fight-mode', 'fight']]) {
    $('#' + id).classList.toggle('chosen', value === mode); $('#' + id).setAttribute('aria-pressed', value === mode);
  }
  $('#play-instruction').textContent = mode === 'fight' ? 'CHOOSE YOUR THROWER + PATAKHA, THEN TAP ANOTHER CHARACTER' : 'PICK A PATAKHA, THEN TAP THE SKY · PHULJHADI: DRAG TO DRAW';
  $('#sky-caption').querySelector('strong').innerHTML = mode === 'fight' ? 'Dosti apni jagah.<br>Badla apni jagah.' : 'Badi chhat.<br>Bade kaand.';
  $('#sky-caption').querySelector('p').textContent = mode === 'fight' ? 'Tap a rooftop rival. They might return the favour.' : 'Tap the sky to launch. Drag a phuljhadi to draw.';
  updateThrower();
}
function updateThrower() {
  document.querySelectorAll('.roof-person').forEach(b => {
    const id = b.dataset.friend;
    b.classList.toggle('is-thrower', id === thrower && playMode === 'fight');
    b.setAttribute('aria-label', playMode === 'fight' ? `Throw at ${people[id]}` : `Talk to ${people[id]} on the roof`);
  });
}
function rooftopClick(button) {
  if (playMode !== 'fight') return false;
  tossAt(thrower, button.dataset.friend); return true;
}
function playgroundAction(x, y) {
  if (playMode === 'sky') launch(x, y);
  else {
    const rivals = Object.keys(people).filter(id => id !== thrower);
    const nearest = rivals.reduce((a, b) => Math.abs(personPosition(a).x - x) < Math.abs(personPosition(b).x - x) ? a : b);
    tossAt(thrower, nearest);
  }
}
$('#sky-mode').onclick = () => setPlayMode('sky');
$('#fight-mode').onclick = () => setPlayMode('fight');
$('#thrower').onchange = e => { thrower = e.target.value; updateThrower(); };
$('#wind').onchange = e => { wind = Number(e.target.value); roofSay(wind ? 'Hawa tez hai. Sharma ji ka hairstyle gaya.' : 'Hawa shaant. Mohalla bilkul nahi.'); };
$('#lucky-dip').onclick = () => {
  const types = Object.keys(crackerNames); selected = types[Math.floor(Math.random() * types.length)];
  document.querySelectorAll('.cracker').forEach(b => { const active = b.dataset.type === selected; b.classList.toggle('active', active); b.setAttribute('aria-pressed', active); });
  if (playMode === 'fight') {
    const rivals = Object.keys(people).filter(id => id !== thrower); tossAt(thrower, rivals[Math.floor(Math.random() * rivals.length)]);
  } else launch(w * (.2 + Math.random() * .6), h * (.18 + Math.random() * .25));
  toast(`Lucky dip: ${crackerNames[selected]}!`);
};
function bigScreen(enabled) {
  $('#playground').classList.toggle('theatre-mode', enabled); document.body.classList.toggle('playground-open', enabled);
  $('#big-screen').textContent = enabled ? '× Exit big screen' : '⛶ Big screen'; $('#big-screen').setAttribute('aria-pressed', enabled);
}
$('#big-screen').onclick = () => bigScreen(!$('#playground').classList.contains('theatre-mode'));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#playground').classList.contains('theatre-mode')) { bigScreen(false); $('#big-screen').focus(); } });
canvas.addEventListener('pointermove', e => {
  if (!e.buttons || selected !== 'phuljhadi' || playMode !== 'sky' || performance.now() - paintingAt < 30) return;
  paintingAt = performance.now(); const rect = canvas.getBoundingClientRect(); sparkle(e.clientX - rect.left, e.clientY - rect.top);
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Tab' || !$('#playground').classList.contains('theatre-mode')) return;
  const controls = [...$('#playground').querySelectorAll('button:not(:disabled), select, input, canvas[tabindex]')].filter(el => el.getClientRects().length);
  const first = controls[0], last = controls[controls.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
