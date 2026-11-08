'use strict';
const $ = s => document.querySelector(s);
const canvas = $('#fireworks'), ctx = canvas.getContext('2d'), sky = $('#sky');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const colors = ['#ffd17e', '#ff8668', '#c99bf0', '#9fd9b1', '#fff1c1', '#ef7dac'];
let w = 0, h = 0, particles = [], rockets = [], flashes = [], count = 0;
let selected = 'rocket', sound = false, audio, master, noiseBuffer, frame, lastTime = 0;
let volume = .45, partyUntil = 0, neighbourTimer, lastComment = 0;
const timers = new Set(), audioSources = new Set();
const smallDevice = matchMedia('(max-width: 700px)').matches || navigator.hardwareConcurrency <= 4;
let particleBudget = reduced ? 160 : smallDevice ? 650 : 1000;
let frameAverage = 16.67, lastQualityCheck = 0;
const sparkColors = new Set(), glowSprites = new Map();
function glowSprite(color) {
  if (glowSprites.has(color)) return glowSprites.get(color);
  const sprite = document.createElement('canvas'); sprite.width = sprite.height = 64;
  const brush = sprite.getContext('2d'), gradient = brush.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, color); gradient.addColorStop(1, 'transparent');
  brush.fillStyle = gradient; brush.fillRect(0, 0, 64, 64); glowSprites.set(color, sprite); return sprite;
}
function later(fn, ms) {
  const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
  timers.add(id); return id;
}
function resize() {
  const d = Math.min(devicePixelRatio || 1, smallDevice ? 1 : 1.5);
  w = sky.clientWidth; h = sky.clientHeight;
  canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
}
new ResizeObserver(resize).observe(sky);

// Layered, spatial Web Audio: ignition, whistle, pressure thump, crackle and echoes.
function prepareAudio() {
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    master = audio.createGain(); master.gain.value = volume;
    const limiter = audio.createDynamicsCompressor();
    limiter.threshold.value = -14; limiter.knee.value = 10; limiter.ratio.value = 8;
    master.connect(limiter); limiter.connect(audio.destination);
    noiseBuffer = audio.createBuffer(1, audio.sampleRate * 3, audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    loadSamples();
  }
  audio.resume().catch(() => {});
}
// Recorded patakha sounds. Decoded into Web Audio when served over http(s);
// plain <audio> playback covers index.html opened straight from disk.
const samples = {rocket: 'assets/sounds/rocket.mp3', anaar: 'assets/sounds/fuljadi.mp3', ladi: 'assets/sounds/ladi.mp3', bomb: 'assets/sounds/bomb.mp3'};
// Moments (seconds) in each recording that the animation is choreographed to.
// Rocket: launch whoosh from 0s, burst bang at 2.95s, crackle tail around 3.3–3.7s. Bomb: two bangs.
const ROCKET_BURST = 2.95, ROCKET_CRACKLE = [3.3, 3.45, 3.6, 3.72], BOMB_BLASTS = [.3, 2.97], FOUNTAIN_LENGTH = 2, LADI_LENGTH = 2;
const sampleBuffers = new Map(), sampleElements = new Set();
let samplesRequested = false;
function loadSamples() {
  if (samplesRequested || location.protocol === 'file:') return;
  samplesRequested = true;
  for (const [kind, src] of Object.entries(samples)) {
    fetch(src).then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
      .then(data => audio.decodeAudioData(data)).then(buffer => sampleBuffers.set(kind, buffer)).catch(() => {});
  }
}
// Recordings always play in full, start to finish.
function playSample(kind, pan) {
  const buffer = sampleBuffers.get(kind);
  if (buffer) {
    if (audioSources.size > 65) return;
    const source = audio.createBufferSource(), filter = audio.createGain(), gain = audio.createGain();
    source.buffer = buffer; output(source, filter, gain, pan); source.start(audio.currentTime);
    return;
  }
  if (sampleElements.size > 16) return;
  const element = new Audio(samples[kind]);
  element.volume = volume; sampleElements.add(element);
  element.onended = element.onerror = () => sampleElements.delete(element);
  element.play().catch(() => sampleElements.delete(element));
}
function stopSounds() {
  audioSources.forEach(source => { try { source.stop(); } catch {} });
  audioSources.clear();
  sampleElements.forEach(element => element.pause());
  sampleElements.clear();
}
function output(source, filter, gain, pan) {
  const panner = audio.createStereoPanner(); panner.pan.value = Math.max(-.85, Math.min(.85, pan));
  source.connect(filter); filter.connect(gain); gain.connect(panner); panner.connect(master);
  audioSources.add(source);
  source.onended = () => { audioSources.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); panner.disconnect(); };
}
function noise(at, duration, level, frequency, pan, sustained = false) {
  if (audioSources.size > 65) return;
  const source = audio.createBufferSource(), gain = audio.createGain(), filter = audio.createBiquadFilter();
  source.buffer = noiseBuffer; filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = .6;
  gain.gain.setValueAtTime(.001, at);
  gain.gain.linearRampToValueAtTime(level, at + .006);
  if (sustained) {
    for (let t = .04; t < duration - .06; t += .04) gain.gain.linearRampToValueAtTime(level * (.35 + Math.random() * .65), at + t);
  }
  gain.gain.exponentialRampToValueAtTime(.001, at + duration);
  output(source, filter, gain, pan); source.start(at, Math.random() * (3 - duration), duration);
}
function tone(at, duration, from, to, level, pan, type = 'sine') {
  if (audioSources.size > 65) return;
  const source = audio.createOscillator(), gain = audio.createGain(), filter = audio.createBiquadFilter();
  source.type = type; source.frequency.setValueAtTime(from, at);
  source.frequency.exponentialRampToValueAtTime(to, at + duration);
  filter.type = 'lowpass'; filter.frequency.value = 5000;
  gain.gain.setValueAtTime(.001, at); gain.gain.linearRampToValueAtTime(level, at + .015);
  gain.gain.exponentialRampToValueAtTime(.001, at + duration);
  output(source, filter, gain, pan); source.start(at); source.stop(at + duration);
}
function soundEffect(kind, x = w / 2) {
  if (!sound) return;
  try {
    prepareAudio(); const t = audio.currentTime, pan = x / Math.max(w, 1) * 1.6 - .8;
    if (samples[kind]) {
      playSample(kind, pan);
    } else if (kind === 'rocket') {
      noise(t, .7, .35, 2800, pan, true);
      tone(t + .08, .7, 650, 2600, .075, pan);
    } else if (kind === 'anaar' || kind === 'chakri') {
      noise(t, 1.8, .38, kind === 'anaar' ? 5200 : 3300, pan, true);
      if (kind === 'chakri') tone(t, 1.4, 500, 1800, .025, pan, 'triangle');
      for (let i = 0; i < 10; i++) noise(t + .08 + Math.random() * 1.5, .025, .22, 6500, pan);
    } else {
      const big = kind === 'boom';
      noise(t, big ? .4 : .12, big ? .95 : .65, big ? 1400 : 3400, pan);
      tone(t, big ? .6 : .13, big ? 125 : 200, 34, big ? .65 : .18, pan);
      noise(t + .13, .25, big ? .2 : .08, 700, -pan);
      if (big) {
        noise(t + .29, .38, .11, 500, pan * .4);
        for (let i = 0; i < 7; i++) noise(t + .25 + Math.random() * .65, .025, .13, 5500, pan);
      }
    }
  } catch { sound = false; $('#sound').textContent = '♪ Sound off'; $('#sound').setAttribute('aria-pressed', 'false'); toast('Your browser is keeping this Diwali silent.'); }
}
function add(x, y, vx, vy, color, life = 65, size = 1.5, gravity = .055, extra = {}) {
  if (particles.length >= particleBudget) return;
  sparkColors.add(color);
  particles.push({x, y, vx, vy, color, life, max: life, size, gravity, drag: .985, ...extra});
}
function smoke(x, y, amount = 3) {
  if (reduced || particles.filter(p => p.smoke).length >= 20) return;
  for (let i = 0; i < Math.min(amount, 2); i++) add(x, y, .15 + Math.random() * .2, -.15 - Math.random() * .2, '#a8a0b2', 100 + Math.random() * 60, 5, -.001, {smoke: true});
}
function burst(x, y, n = 130, color = colors[Math.floor(Math.random() * colors.length)], quiet = false) {
  if (!quiet) soundEffect(n > 60 ? 'boom' : 'pop', x);
  const shape = Math.floor(Math.random() * 3), total = reduced ? Math.min(n, 18) : Math.min(n, Math.round(particleBudget * .12));
  flashes.push({x, y, life: reduced ? 0 : 9, size: n > 60 ? 95 : 35, color});
  for (let i = 0; i < total; i++) {
    const a = Math.PI * 2 * i / total;
    const speed = shape === 1 ? 3.4 + Math.random() * .4 : 1 + Math.random() * 3.3;
    const gold = shape === 2;
    add(x, y, Math.cos(a) * speed, Math.sin(a) * speed, gold ? '#ffd591' : color,
      gold ? 95 + Math.random() * 45 : 55 + Math.random() * 45, 1 + Math.random(), gold ? .045 : .035,
      {drag: gold ? .991 : .984});
    if (i % 8 === 0) add(x, y, Math.cos(a) * speed * .6, Math.sin(a) * speed * .6, '#fff8d7', 35, 2, .04);
  }
  smoke(x, y, n > 60 ? 5 : 2);
}
function animate(time) {
  frame = requestAnimationFrame(animate);
  const elapsed = lastTime ? time - lastTime : 16.67;
  lastTime = time;
  // Elapsed time drives physics; dropped frames never put the show into slow motion.
  const dt = elapsed / 16.67;
  frameAverage = frameAverage * .95 + elapsed * .05;
  if (!reduced && time - lastQualityCheck > 900) {
    if (frameAverage > 23) particleBudget = Math.max(320, Math.round(particleBudget * .8));
    else if (frameAverage < 18) particleBudget = Math.min(smallDevice ? 650 : 1000, particleBudget + 40);
    lastQualityCheck = time;
  }
  if (!particles.length && !rockets.length && !flashes.length && !partyUntil) return;
  ctx.clearRect(0, 0, w, h);
  for (let i = rockets.length - 1; i >= 0; i--) {
    // Clock-driven flight: a hard push during the launch whoosh, then a slow coast to the bang.
    const r = rockets[i], progress = Math.min(1, (time - r.born) / r.flight);
    r.y = r.ground - (r.ground - r.target) * (1 - Math.pow(1 - progress, 2.4));
    const sparks = progress < .3 ? 3 : progress < .75 ? 2 : 1;
    for (let k = 0; k < (reduced ? 1 : sparks); k++) add(r.x + (Math.random() - .5) * 1.5, r.y, (Math.random() - .5) * .5, .6 + Math.random() * (progress < .3 ? 2 : .8), k % 2 ? '#ff9e52' : '#fff3bd', progress < .3 ? 30 : 20, 1.2, .012);
    if (progress >= 1) { rocketBurst(r.x, r.target); rockets.splice(i, 1); }
  }
  // Compact survivors in place: no per-spark arrays, shifts or splice allocations.
  let alive = 0;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]; p.life -= dt;
    if (p.life <= 0 || p.y > h + 20) continue;
    const damping = Math.pow(p.drag, dt);
    p.x += p.vx * dt; p.y += p.vy * dt + p.gravity * dt * dt * .5;
    p.vx *= damping; p.vy = p.vy * damping + p.gravity * dt;
    particles[alive++] = p;
  }
  particles.length = alive;
  ctx.globalCompositeOperation = 'source-over';
  for (const p of particles) if (p.smoke) {
    const radius = p.size + (p.max - p.life) * .12;
    ctx.globalAlpha = p.life / p.max * .08;
    ctx.drawImage(glowSprite(p.color), p.x - radius, p.y - radius, radius * 2, radius * 2);
  }
  ctx.globalCompositeOperation = 'lighter';
  for (let i = flashes.length - 1; i >= 0; i--) {
    const f = flashes[i]; f.life -= dt;
    if (f.life <= 0) { flashes.splice(i, 1); continue; }
    ctx.globalAlpha = f.life / 9 * .25;
    ctx.drawImage(glowSprite(f.color), f.x - f.size, f.y - f.size, f.size * 2, f.size * 2);
  }
  // Batch trails by colour: a handful of canvas strokes replaces thousands.
  ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  for (const color of sparkColors) {
    ctx.strokeStyle = color; ctx.globalAlpha = .38; ctx.beginPath();
    for (const p of particles) if (!p.smoke && p.color === color && p.life > 12) {
      ctx.moveTo(p.x - p.vx * 3.2, p.y - p.vy * 3.2); ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.fillStyle = color; ctx.globalAlpha = .9; ctx.beginPath();
    for (const p of particles) if (!p.smoke && p.color === color) {
      const size = p.size * Math.min(1, p.life / 16);
      ctx.rect(p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (partyUntil && time > partyUntil) { sky.classList.remove('celebrating'); partyUntil = 0; }
}
const roofLines = ['Door se jalao, hero!', 'Mummy ko mat batana.', 'Sharma ji: bas last wala!', 'Meri reel mein aa gaya!', 'Chai thandi ho rahi hai!'];
function rooftopReaction(force = false) {
  partyUntil = performance.now() + 2400; sky.classList.add('celebrating');
  if (!force && performance.now() - lastComment < 1900) return;
  lastComment = performance.now();
  $('#roof-comment').textContent = roofLines[Math.floor(Math.random() * roofLines.length)];
  $('#roof-comment').classList.add('visible'); clearTimeout(neighbourTimer);
  neighbourTimer = setTimeout(() => $('#roof-comment').classList.remove('visible'), 2400);
}
function rocketBurst(x, y) {
  burst(x, y, 130, undefined, true);
  // The recording's crackle tail: glittering pops scattered around the burst.
  ROCKET_CRACKLE.forEach(at => later(() => {
    for (let n = 0; n < (reduced ? 1 : 3); n++) {
      const a = Math.random() * Math.PI * 2, d = 25 + Math.random() * 45;
      burst(x + Math.cos(a) * d, y + Math.sin(a) * d + 15, reduced ? 4 : 12, '#fff8d7', true);
    }
  }, (at - ROCKET_BURST) * 1000));
}
function shakeSky() {
  if (reduced) return;
  sky.classList.remove('shake'); void sky.offsetWidth; sky.classList.add('shake');
  later(() => sky.classList.remove('shake'), 420);
}
function launch(x = w * .5, y = h * .32, type = selected) {
  $('#sky-caption').style.opacity = '0'; count++;
  $('#launch-count').textContent = `${count} patakhe · zero complaints`;
  rooftopReaction(); const ground = h - 42;
  if (type === 'rocket') {
    // The full recording plays; the rocket rises through the whoosh and bursts on its bang.
    soundEffect('rocket', x);
    rockets.push({x, y: ground, ground, target: Math.max(32, Math.min(y, h * .57)), born: performance.now(), flight: ROCKET_BURST * 1000});
  } else if (type === 'bomb') {
    soundEffect('bomb', x);
    const second = Math.max(30, Math.min(w - 30, x + (Math.random() > .5 ? 36 : -36)));
    const fuse = (fx, from, to) => { for (let t = from; t < to; t += 40) later(() => {
      for (let i = 0; i < (reduced ? 1 : 4); i++) add(fx, ground - 4, (Math.random() - .5) * 2.4, -1 - Math.random() * 2, Math.random() > .4 ? '#ffd17e' : '#fff6c6', 18 + Math.random() * 12, 1.2, .06);
    }, t); };
    // Each bomb's fuse fizzes right up to its bang in the recording.
    fuse(x, 0, BOMB_BLASTS[0] * 1000); fuse(second, BOMB_BLASTS[1] * 1000 - 900, BOMB_BLASTS[1] * 1000);
    BOMB_BLASTS.forEach((at, n) => later(() => {
      const bx = n ? second : x;
      flashes.push({x: bx, y: ground - 20, life: reduced ? 0 : 14, size: 200, color: '#fff1c1'});
      burst(bx, ground - 22, 150, n ? '#ffd17e' : '#ff8668', true);
      for (let i = 0; i < (reduced ? 6 : 36); i++) {
        const a = -Math.PI / 2 + (Math.random() - .5) * 1.9, speed = 3 + Math.random() * 5.5;
        add(bx, ground - 6, Math.cos(a) * speed, Math.sin(a) * speed, Math.random() > .5 ? '#ffb64b' : '#fff8d7', 40 + Math.random() * 30, 1.8, .11);
      }
      smoke(bx, ground - 10, 3); shakeSky();
    }, at * 1000));
  } else if (type === 'anaar') {
    soundEffect('anaar', x);
    // The fountain sprays for exactly as long as the fuljadi recording.
    const ticks = Math.round(FOUNTAIN_LENGTH * 1000 / 43);
    for (let k = 0; k < ticks; k++) later(() => {
      const strength = Math.sin(Math.PI * (k + 3) / (ticks + 4));
      for (let i = 0; i < (reduced ? 2 : 6); i++) {
        const a = -Math.PI / 2 + (Math.random() - .5) * .7, speed = (2.5 + Math.random() * 4.2) * strength;
        add(x, ground, Math.cos(a) * speed, Math.sin(a) * speed, Math.random() > .3 ? '#ffcb70' : '#fff6c6', 52 + Math.random() * 28, 1.3, .075);
      }
      if (k % 7 === 0) { smoke(x, ground, 1); flashes.push({x, y: ground, life: reduced ? 0 : 6, size: 25, color: '#ffb64b'}); }
    }, k * 43);
  } else if (type === 'chakri') {
    soundEffect('chakri', x);
    for (let k = 0; k < 60; k++) later(() => {
      const a = k * k * .035, cx = Math.max(24, Math.min(w - 24, x + Math.sin(k * .12) * 15));
      for (let j = 0; j < (reduced ? 2 : 6); j++) {
        const angle = a + j * Math.PI;
        add(cx, ground - 2, Math.cos(angle) * (2 + Math.random() * 3.5), Math.sin(angle) * 1.4 - .7, k % 3 ? '#ffca72' : '#ffecbb', 28 + Math.random() * 20, 1.5, .025);
      }
      if (k % 10 === 0) smoke(cx, ground, 1);
    }, k * 30);
  } else {
    // The string of pops runs for exactly as long as the ladi recording.
    soundEffect('ladi', x);
    const pops = Math.round(LADI_LENGTH * 1000 / 64);
    for (let k = 0; k < pops; k++) later(() => {
      const cx = Math.max(20, Math.min(w - 20, x + (k - pops / 2) * 6));
      burst(cx, ground - Math.random() * 7, reduced ? 8 : 26, k % 2 ? '#ffd17e' : '#ff8668', true);
    }, k * (LADI_LENGTH * 1000 - 40) / pops + Math.random() * 30);
  }
  if ([10, 25, 50, 100].includes(count)) toast(`${count} patakhe! Society committee ne emergency meeting bula li.`);
}
canvas.addEventListener('pointerdown', e => { const r = canvas.getBoundingClientRect(); launch(e.clientX - r.left, e.clientY - r.top); });
canvas.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); launch(); } });
document.querySelectorAll('.cracker').forEach(b => b.addEventListener('click', () => {
  selected = b.dataset.type;
  document.querySelectorAll('.cracker').forEach(c => { const active = c === b; c.classList.toggle('active', active); c.setAttribute('aria-pressed', active); });
  launch(w * .55, h * .3, selected);
}));
function setSound(enabled) {
  sound = enabled;
  if (sound) {
    try { prepareAudio(); }
    catch { sound = false; toast('Audio is unavailable in this browser.'); }
  } else stopSounds();
  $('#sound').textContent = sound ? '♪ Sound on' : '♪ Sound off';
  $('#sound').setAttribute('aria-pressed', sound); syncReactionAudio();
}
$('#sound').onclick = () => setSound(!sound);
$('#volume').oninput = e => {
  volume = Number(e.target.value) / 100;
  if (master) master.gain.setTargetAtTime(volume, audio.currentTime, .03);
  sampleElements.forEach(element => element.volume = volume);
  syncReactionAudio();
};
$('#finale').onclick = () => {
  if ($('#finale').disabled) return;
  $('#finale').disabled = true; toast('Sharma ji just closed all his windows.');
  // An immediate first volley, then a compact crescendo with only one fountain.
  for (let i = 0; i < 3; i++) launch(w * (.22 + i * .28), h * (.18 + i * .07), 'rocket');
  for (let i = 0; i < 12; i++) later(() => launch(w * (.12 + Math.random() * .76), h * (.14 + Math.random() * .29), i === 5 ? 'anaar' : 'rocket'), 140 + i * 115);
  later(() => $('#finale').disabled = false, 140 + 11 * 115 + ROCKET_BURST * 1000);
};
function clearSky() {
  timers.forEach(clearTimeout); timers.clear(); particles = []; rockets = []; flashes = []; stopSounds();
  $('#finale').disabled = false; $('#sky-caption').style.opacity = '1';
  sky.classList.remove('celebrating'); partyUntil = 0; clearTimeout(neighbourTimer); $('#roof-comment').classList.remove('visible');
  ctx.clearRect(0, 0, w, h);
}
$('#clear-sky').onclick = clearSky;
document.querySelectorAll('.roof-person').forEach(b => b.onclick = () => {
  $('#sky-caption').style.opacity = '0'; rooftopReaction(true);
  toast(b.dataset.line);
  if (b.dataset.friend === 'dancer') { burst(w * .5, h * .3, 75, '#ef7dac'); }
});
requestAnimationFrame(animate);
let toastTimer;
function toast(t) { $('#toast').textContent = t; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3300); }
const dialog=$('#game-dialog'),content=$('#game-content');let previousFocus;
function openGame(game){previousFocus=document.activeElement;stopReactions();clearSky();content.replaceChildren();if(game==='papdi')resetPapdi();if(game==='family')family();if(game==='bonus')bonus();dialog.showModal()}
document.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>openGame(b.dataset.game));
$('#close-dialog').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});dialog.addEventListener('close',()=>{stopReactions();previousFocus?.focus()});
const reactions = {
  control: {src: 'assets/control-uday.mp4', title: 'Control Uday · Welcome', href: 'https://templates.meme/templates/control-uday', line: 'Control, Uday. Control.'},
  confused: {src: 'assets/yeh-kya-hai.mp4', title: 'Yeh kya hai? · CarryMinati', href: 'https://templates.meme/templates/yeh-kya-hai', line: 'Yeh kya hai?!'},
  wasted: {src: 'assets/paisa-barbad.mp4', title: 'Paisa barbad · CarryMinati', href: 'https://templates.meme/templates/paisa-barbad', line: 'Toh paisa barbad!'},
  fun: {src: 'assets/abhi-maza-ayega-na-bhidu.mp4', title: 'Abhi maza ayega · Phir Hera Pheri', href: 'https://templates.meme/templates/abhi-maza-ayega-na-bhidu', line: 'Abhi maza ayega na, bhidu!'},
  bhide: {"src": "assets/bhide-crying.mp4", "title": "Bhide’s dramatic reunion · TMKOC", "href": "https://templates.meme/templates/bhide-crying", "line": "Dabba wapas aa gaya!", "hasAudio": true},
  insult: {"src": "assets/gajab-bejjati-hai-yaar.mp4", "title": "Gajab bejjati · Panchayat", "href": "https://templates.meme/templates/gajab-bejjati-hai-yaar", "line": "Gajab bejjati hai yaar!", "hasAudio": true},
  prank: {"src": "assets/kaisa-laga-mera-mazak.mp4", "title": "Kaisa laga mera mazak · The Kapil Sharma Show", "href": "https://templates.meme/templates/kaisa-laga-mera-mazak", "line": "Kaisa laga mera mazak?", "hasAudio": true},
  detective: {"src": "assets/kuch-samjhe-daya.mp4", "title": "Kuch samjhe Daya · CID", "href": "https://templates.meme/templates/kuch-samjhe-daya", "line": "Kuch samjhe, Daya?", "hasAudio": true},
  denial: {"src": "assets/nahi-main-nahi-maanta.mp4", "title": "Nahi main nahi maanta · Khatta Meetha", "href": "https://templates.meme/templates/nahi-main-nahi-maanta", "line": "Nahi, main nahi maanta.", "hasAudio": true},
  disbelief: {"src": "assets/nahi-main-nahi-manta.mp4", "title": "Main nahi manta · Welcome", "href": "https://templates.meme/templates/nahi-main-nahi-manta", "line": "Nahi, main nahi manta!", "hasAudio": true},
  relationship: {"src": "assets/aurat-ka-chakkar.mp4", "title": "Aurat ka chakkar · Hera Pheri", "href": "https://templates.meme/templates/aurat-ka-chakkar", "line": "Aurat ka chakkar, Babu bhaiya.", "hasAudio": true},
  gadbad: {"src": "assets/are-deva-yeh-toh-gadbad-hai-baba.mp4", "title": "Are Deva! · Hera Pheri", "href": "https://templates.meme/templates/are-deva-yeh-toh-gadbad-hai-baba", "line": "Are Deva! Yeh toh gadbad hai!", "hasAudio": true},
  panvel: {"src": "assets/jaldi-bol-kal-subah-panvel-nikalna-hai.mp4", "title": "Jaldi bol · Golmaal", "href": "https://templates.meme/templates/jaldi-bol-kal-subah-panvel-nikalna-hai", "line": "Jaldi bol, kal subah Panvel nikalna hai.", "hasAudio": true},
  practical: {"src": "assets/sunne-mein-acha-hai.mp4", "title": "Practical nahi hai · Nayak", "href": "https://templates.meme/templates/sunne-mein-acha-hai", "line": "Sunne mein acha hai, lekin practical nahi hai.", "hasAudio": true},
  explain: {"src": "assets/kehna-kya-chahte-ho.mp4", "title": "Kehna kya chahte ho · 3 Idiots", "href": "https://templates.meme/templates/kehna-kya-chahte-ho", "line": "Kehna kya chahte ho?", "hasAudio": true},
  delight: {"src": "assets/dil-garden-garden-ho-riya-hai.mp4", "title": "Dil garden garden · Indian viral classic", "href": "https://templates.meme/templates/dil-garden-garden-ho-riya-hai", "line": "Dil garden garden ho riya hai!", "hasAudio": true},
  jethalal: {"src": "assets/jethalal-shocked.mp4", "title": "Jethalal’s shocked face · TMKOC", "href": "https://tenor.com/view/jethalal-jethalal-shocked-shocked-face-reaction-what-what-what-gif-19739068", "line": "Yeh dabba phir aa gaya?!", "hasAudio": false},
  garba: {"src": "assets/daya-garba.mp4", "title": "Daya’s celebration · TMKOC", "href": "https://tenor.com/view/garba-daya-gif-26821643", "line": "Ab toh garba banta hai!", "hasAudio": false}
};
function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
// Every pool is curated for the scene. Least-recent use adds variety without changing its meaning.
const reactionUse = new Map();
let reactionTurn = 0;
function reactionChoices(scene) { return scene.memes || [scene.meme]; }
function chooseReaction(scene) {
  const choices = reactionChoices(scene);
  const key = choices.reduce((best, candidate) => (reactionUse.get(candidate) || 0) < (reactionUse.get(best) || 0) ? candidate : best);
  reactionUse.set(key, ++reactionTurn); return key;
}
function stopReactions() { document.querySelectorAll('video.reaction').forEach(video => video.pause()); }
function syncReactionAudio() {
  document.querySelectorAll('video.reaction').forEach(video => { video.muted = !sound || video.dataset.silent === 'true'; video.volume = volume; });
  document.querySelectorAll('[data-reaction-sound]').forEach(button => {
    button.textContent = sound ? '♪ Sound on' : '♪ Sound off'; button.setAttribute('aria-pressed', sound);
  });
}
function reaction(scene, target = content) {
  const meme = reactions[chooseReaction(scene)];
  const figure = document.createElement('figure'); figure.className = 'reaction-frame';
  const caption = document.createElement('figcaption'); caption.className = 'reaction-context'; caption.textContent = scene.caption;
  const video = document.createElement('video'); video.src = meme.src; video.className = 'reaction';
  video.setAttribute('aria-label', meme.title); video.playsInline = true; video.preload = 'metadata';
  video.dataset.silent = String(meme.hasAudio === false);
  video.muted = !sound || meme.hasAudio === false; video.volume = volume;
  const fallback = document.createElement('div'); fallback.className = 'meme-fallback'; fallback.hidden = !reduced;
  const quote = document.createElement('b'); quote.textContent = meme.line; fallback.append(quote);
  video.hidden = reduced;
  const controls = document.createElement('div'); controls.className = 'reaction-controls';
  const replay = document.createElement('button'); replay.className = 'quiet-button'; replay.textContent = reduced ? '▶ Play reaction' : '↻ Replay reaction';
  const mute = document.createElement('button'); mute.className = 'quiet-button';
  if (meme.hasAudio !== false) mute.dataset.reactionSound = '';
  mute.textContent = meme.hasAudio === false ? 'Silent reaction' : sound ? '♪ Sound on' : '♪ Sound off'; mute.setAttribute('aria-pressed', sound && meme.hasAudio !== false); mute.disabled = meme.hasAudio === false;
  const play = () => {
    video.hidden = false; fallback.hidden = true;
    video.currentTime = 0; video.play().catch(() => { replay.textContent = '▶ Play reaction'; });
  };
  replay.onclick = play;
  mute.onclick = () => { setSound(!sound); if (sound) play(); };
  video.onerror = () => { video.hidden = true; fallback.hidden = false; replay.disabled = true; mute.disabled = true; };
  const link = document.createElement('a'); link.href = meme.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
  link.className = 'credit'; link.textContent = `${meme.title} · source ↗`;
  const another = document.createElement('button'); another.className = 'quiet-button'; another.textContent = 'Another take ↻'; another.disabled = reactionChoices(scene).length < 2;
  another.onclick = () => { stopReactions(); figure.remove(); reaction(scene, target); target.querySelector('.reaction-controls button:nth-child(2)')?.focus(); };
  controls.append(replay, another, mute); figure.append(caption, video, fallback, controls, link); target.append(figure);
  // One playback per reveal; dialogue never loops or continues after the card closes.
  if (!reduced) play();
}
const papdiStops = [
  {name: 'Sharma aunty', joke: '“Arre, iski kya zaroorat thi?” Gift bag ka handle pakad ke aunty ne kaha.', reaction: {"meme": "control", "memes": ["denial", "jethalal", "control", "disbelief"], "caption": "Trying to keep a straight face as aunty plans to regift your gift."}},
  {name: 'Gupta uncle', joke: 'Uncle ne upar “premium dry fruits” ka sticker chipka diya. Rebranding ka budget: ₹0.', reaction: {"meme": "confused", "memes": ["detective", "jethalal", "gadbad", "confused"], "caption": "That premium dry-fruit sticker is covering a soan-papdi label."}},
  {name: 'Your manager', joke: 'Dabba is now a “festive performance incentive”. Your promotion is still in review.', reaction: {"meme": "control", "memes": ["insult", "practical", "prank", "control"], "caption": "When your manager calls a regifted dabba a performance incentive."}},
  {name: 'Society secretary', joke: 'Maintenance ke paise full. Mithai society ke WhatsApp group se crowdsourced.', reaction: {"meme": "control", "memes": ["bhide", "practical", "control", "insult"], "caption": "Paying full maintenance, then funding the society mithai too."}},
  {name: 'Your cousin', joke: 'Cousin ne gift tag badla. Instagram story mein “small wins, big blessings” daala.', reaction: {"meme": "confused", "memes": ["detective", "prank", "disbelief", "gadbad"], "caption": "A new Instagram story and a gift tag do not make this a new gift."}},
  {name: 'Bua ji', joke: 'Dabba accept karne se pehle bua ne kundli maangi. Soan papdi ki nahi. Tumhari.', reaction: {"meme": "control", "memes": ["relationship", "panvel", "control", "explain"], "caption": "When giving bua mithai somehow starts a marriage interview."}},
  {name: 'Chai-wale bhaiya', joke: 'Bhaiya ne bola “khata clear karo pehle”. Dabba bhi udhaar mein accept nahi hua.', reaction: {"meme": "control", "memes": ["denial", "explain", "practical", "control"], "caption": "Chai-wale bhaiya is waiting for payment. You brought soan papdi."}},
  {name: 'NRI maasi', joke: '“Is this gluten-free?” Maasi has now taken the dabba through two international airports.', reaction: {"meme": "confused", "memes": ["jethalal", "explain", "confused", "detective"], "caption": "When a local dabba has a better international travel history than you."}},
  {name: 'Gym bro', joke: '“Protein kitna hai?” He logs one bite as a cheat meal, regifts the remaining 499 grams.', reaction: {"meme": "confused", "memes": ["explain", "denial", "practical", "confused"], "caption": "Watching gym bro calculate macros for a regifted dabba."}},
  {name: 'The tuition sir', joke: 'Sir ne iske bhi 3 marks kaat diye. Steps nahi likhe the gift note pe.', reaction: {"meme": "control", "memes": ["insult", "explain", "control", "denial"], "caption": "Tuition sir is grading the gift note. Even on Diwali."}},
  {name: 'Building ke kids', joke: 'Chocolate nahi nikli. Entire unboxing committee has unanimously rejected the product.', reaction: {"meme": "control", "memes": ["disbelief", "denial", "jethalal", "control"], "caption": "The kids were promised chocolate. The dabba was not chocolate."}},
  {name: 'Your office bestie', joke: '“Mere ghar mat lana,” bestie said. Then left the exact same dabba on your desk.', reaction: {"meme": "confused", "memes": ["gadbad", "prank", "detective", "jethalal"], "caption": "Your bestie banned the dabba, then secretly put it on your desk."}},
];
let papdiRoute = [], previousFirst = '', papdiTrip = 0;
function resetPapdi() {
  const candidates = shuffled(papdiStops);
  if (candidates[0].name === previousFirst) [candidates[0], candidates[1]] = [candidates[1], candidates[0]];
  papdiRoute = candidates.slice(0, 5); previousFirst = papdiRoute[0].name; papdiTrip++;
  papdi(0);
}
function papdi(step) {
  stopReactions();
  const end = step === papdiRoute.length + 1;
  const trail = ['You', ...papdiRoute.slice(0, Math.min(step, papdiRoute.length)).map(stop => stop.name)];
  if (end) trail.push('You. Again.');
  const joke = step === 0 ? 'Naya route. Naye suspects. Wahi suspicious dabba. Is baar kiske ghar jayega?'
    : end ? 'Your own gift tag is still underneath. Dabba ne tumse zyada Diwali parties attend kar li.' : papdiRoute[step - 1].joke;
  content.innerHTML = `<div class="eyebrow">SOAN PAPDI MULTIVERSE · TRIP ${papdiTrip}</div><h2>${end ? 'Ghar wapsi ho gayi.' : step ? `${papdiRoute[step - 1].name} has the dabba.` : 'Same dabba. New drama.'}</h2><div class="route">${trail.join(' → ')}</div><p>${joke}</p><div id="papdi-reaction"></div><div class="game-actions"><button class="primary" id="pass">${end ? 'Break the cycle. Eat it.' : 'Regift. Obviously.'} ↗</button><button class="quiet-button" id="reset-route">Shuffle the route ↻</button></div>`;
  if (step) reaction(end ? {meme: 'confused', memes: ['bhide', 'jethalal', 'gadbad', 'detective', 'disbelief'], caption: 'The dabba you gave away comes back with your own gift tag still on it.'} : papdiRoute[step - 1].reaction, $('#papdi-reaction'));
  $('#reset-route').onclick = () => { resetPapdi(); $('#pass').focus(); };
  $('#pass').onclick = () => {
    if (!end) { papdi(step + 1); $('#pass').focus(); }
    else {
      stopReactions();
      const endings = [
        'You ate the soan papdi. Somewhere, an entire supply chain just collapsed. Honestly? It was delicious.',
        'Plot twist: you actually like soan papdi. The family group has been notified. Seven more dabbas are on their way.',
        'You put it next to the chai. Five minutes later: empty dabba. Everyone blames the cousin who went to the gym.'
      ];
      content.innerHTML = `<span class="big-icon">🏆</span><h2>The cycle is broken.</h2><p>${endings[(papdiTrip - 1) % endings.length]}</p><button class="primary" id="again">Start another questionable journey ↗</button>`;
      reaction((papdiTrip - 1) % 3 === 1 ? {meme: 'control', memes: ['gadbad', 'jethalal', 'control', 'disbelief'], caption: 'You admit you like soan papdi. Your family sends seven more boxes.'} : {meme: 'fun', memes: ['garba', 'delight', 'fun'], caption: 'You finally stop regifting and bring the mithai to the chai table.'}); $('#again').onclick = () => { resetPapdi(); $('#pass').focus(); }; $('#again').focus();
    }
  };
}
function family(){content.innerHTML='<div class="eyebrow">SHARMA PARIVAAR · 47 MEMBERS</div><h2>Happy Diwali 🌷🙏</h2><div class="messages" id="messages" role="log" aria-live="polite"><div class="message"><b>PAPA · ADMIN</b>Happy Diwali. Please do not send Good Morning here. Separate group hai.</div><div class="message"><b>BUA JI</b>Beta, shaadi kab kar rahe ho? 👀</div></div><div class="options"><button data-reply="career">“Abhi career pe focus hai, bua.”</button><button data-reply="food">“Kaju katli kisne khatam ki?”</button><button data-reply="leave">Attempt to leave group ↗</button></div>';let replies=0;const responses={career:['BUA JI','Career toh Sharma ji ke bete ka bhi hai. Uske do bachche hain.'],food:['MUMMY','Maine mehmaan ke liye rakhi thi. Tumne fridge khola kyun?'],leave:['PAPA · ADMIN','Papa added you.\nPapa made you an admin.\nAb light bill ka PDF bhejo.']};content.querySelectorAll('[data-reply]').forEach(b=>b.onclick=()=>{const log=$('#messages');const you=document.createElement('div');you.className='message you';you.textContent=b.textContent;log.append(you);const answer=document.createElement('div');answer.className='message';const who=document.createElement('b');who.textContent=responses[b.dataset.reply][0];answer.append(who,document.createTextNode(responses[b.dataset.reply][1]));log.append(answer);log.scrollTop=log.scrollHeight;replies++;if(replies===3)toast('Achievement unlocked: emotionally present, physically on mute.');})}
let bonusRoll = 0;
function bonus() {
  stopReactions();
  content.innerHTML = '<div class="eyebrow">A PERSONAL MESSAGE FROM HR</div><span class="big-icon">✉️</span><h2>Your hard work<br>has been noticed.</h2><p>“Dear valued resource, we have gone above and beyond to curate your festive happiness.”</p><button class="primary" id="unbox">Open the hamper <span>↗</span></button>';
  $('#unbox').onclick = () => {
    const prizes = [
      ['₹ 0', 'A heartfelt email.', '“Your contribution is priceless. So we haven’t put a price on it.”', {meme: 'control', memes: ['insult', 'bhide', 'control', 'practical'], caption: 'Trying to stay professional after an email is announced as your bonus.'}],
      ['1 DABBA', 'The legacy bonus.', 'Soan papdi. An air fryer was discussed. A suitcase was shortlisted. Then Finance joined the call.', {meme: 'control', memes: ['denial', 'jethalal', 'disbelief', 'control'], caption: 'Your face when the promised appliance becomes another soan-papdi dabba.'}],
      ['₹ 101', 'Shagun, with conditions.', '₹1 for good luck. ₹100 redeemable at the office cafeteria. Minimum spend ₹999.', {meme: 'wasted', memes: ['wasted', 'practical', 'insult', 'gadbad'], caption: 'When using your ₹101 bonus requires spending ₹999 first.'}],
      ['1 DAY', 'A surprise holiday!', 'It’s Sunday. HR says you’re welcome.', {meme: 'confused', memes: ['prank', 'insult', 'denial', 'confused'], caption: 'When HR gives you the Sunday you already had off.'}],
      ['AIR FRYER!', 'The plot twist nobody expected.', 'A picture of an air fryer. In the company newsletter. Please like and reshare.', {meme: 'confused', memes: ['prank', 'jethalal', 'gadbad', 'disbelief', 'confused'], caption: 'Opening your air fryer gift and finding a JPEG attachment.'}]
    ];
    const p = prizes[bonusRoll++ % prizes.length];
    content.innerHTML = `<div class="eyebrow">YOUR FESTIVE APPRAISAL IS HERE</div><div class="bonus-amount">${p[0]}</div><h2>${p[1]}</h2><p>${p[2]}</p><button class="primary" id="reroll">Try another company ↗</button>`;
    reaction(p[3]); $('#reroll').onclick = bonus;
  };
}
$('#share').onclick=async()=>{const data={title:'Diwali After Dark',text:'Patakhe without pollution. Family drama without the family. Aao, thoda kaand karein. 🪔',url:location.href};try{if(navigator.share){await navigator.share(data)}else if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(`${data.text}\n${data.url}`);toast('Link copied. Family group mein daalne ki himmat hai?')}else{toast('Share this page’s address with your favourite troublemaker.')}}catch(e){if(e.name!=='AbortError')toast('Share this page’s address with your favourite troublemaker.')}};
// A tiny opening flourish; reduced-motion visitors start with a still sky.
if(!reduced)later(()=>{burst(w*.76,h*.3,55,'#d9ae66',true)},650);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(frame); clearSky(); stopReactions(); clearTimeout(toastTimer); $('#toast').classList.remove('show');
    if (audio) audio.suspend().catch(() => {});
  } else { lastTime = performance.now(); frame = requestAnimationFrame(animate); }
});
