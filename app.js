'use strict';
const $ = s => document.querySelector(s);
const canvas = $('#fireworks'), ctx = canvas.getContext('2d'), sky = $('#sky');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const colors = ['#ffd17e', '#ff8668', '#c99bf0', '#9fd9b1', '#fff1c1', '#ef7dac'];
let w = 0, h = 0, particles = [], rockets = [], flashes = [], count = 0;
let selected = 'rocket', sound = false, audio, master, noiseBuffer, frame, lastTime = 0;
let volume = .45, partyUntil = 0, neighbourTimer, lastComment = 0;
const timers = new Set(), audioSources = new Set();
function later(fn, ms) {
  const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
  timers.add(id); return id;
}
function resize() {
  const d = Math.min(devicePixelRatio || 1, 2);
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
  }
  audio.resume().catch(() => {});
}
function stopSounds() {
  audioSources.forEach(source => { try { source.stop(); } catch {} });
  audioSources.clear();
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
    if (kind === 'rocket') {
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
function beep() { soundEffect('pop'); }
function add(x, y, vx, vy, color, life = 65, size = 1.5, gravity = .055, extra = {}) {
  if (particles.length >= (reduced ? 350 : 2400)) return;
  particles.push({x, y, vx, vy, color, life, max: life, size, gravity, drag: .985, trail: [], ...extra});
}
function smoke(x, y, amount = 3) {
  if (reduced) return;
  for (let i = 0; i < amount; i++) add(x, y, .15 + Math.random() * .2, -.15 - Math.random() * .2, '#a8a0b2', 100 + Math.random() * 60, 5, -.001, {smoke: true});
}
function burst(x, y, n = 130, color = colors[Math.floor(Math.random() * colors.length)], quiet = false) {
  if (!quiet) soundEffect(n > 60 ? 'boom' : 'pop', x);
  const shape = Math.floor(Math.random() * 3), total = reduced ? Math.min(n, 22) : n;
  flashes.push({x, y, life: reduced ? 0 : 9, size: n > 60 ? 95 : 35, color});
  for (let i = 0; i < total; i++) {
    const a = Math.PI * 2 * i / total;
    const speed = shape === 1 ? 3.4 + Math.random() * .4 : 1 + Math.random() * 3.3;
    const gold = shape === 2;
    add(x, y, Math.cos(a) * speed, Math.sin(a) * speed, gold ? '#ffd591' : color,
      gold ? 95 + Math.random() * 45 : 55 + Math.random() * 45, 1 + Math.random(), gold ? .045 : .035,
      {twinkle: Math.random() > .6, drag: gold ? .991 : .984});
    if (i % 8 === 0) add(x, y, Math.cos(a) * speed * .6, Math.sin(a) * speed * .6, '#fff8d7', 35, 2, .04);
  }
  smoke(x, y, n > 60 ? 5 : 2);
}
function animate(time) {
  frame = requestAnimationFrame(animate);
  if (time - lastTime < 15) return;
  const dt = Math.min((time - lastTime) / 16.67, 2); lastTime = time;
  ctx.clearRect(0, 0, w, h);
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i]; r.speed *= Math.pow(.993, dt); r.y -= r.speed * dt;
    const wobble = Math.sin(time * .025) * .4;
    for (let k = 0; k < (reduced ? 1 : 4); k++) add(r.x + wobble, r.y, (Math.random() - .5) * .5, 1 + Math.random() * 1.2, k % 2 ? '#ff9e52' : '#fff3bd', 22 + Math.random() * 12, 1.2, .012);
    if (r.y <= r.target) { burst(r.x, r.y); rockets.splice(i, 1); }
  }
  // Soft smoke drifts behind the luminous sparks.
  ctx.globalCompositeOperation = 'source-over';
  for (const p of particles) if (p.smoke) {
    ctx.globalAlpha = Math.min(.09, p.life / p.max * .09);
    const radius = p.size + (p.max - p.life) * .12;
    const haze = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
    haze.addColorStop(0, p.color); haze.addColorStop(1, 'transparent'); ctx.fillStyle = haze;
    ctx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
  }
  ctx.globalCompositeOperation = 'lighter';
  for (let i = flashes.length - 1; i >= 0; i--) {
    const f = flashes[i]; f.life -= dt;
    if (f.life <= 0) { flashes.splice(i, 1); continue; }
    const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
    glow.addColorStop(0, f.color); glow.addColorStop(1, 'transparent');
    ctx.globalAlpha = f.life / 9 * .25; ctx.fillStyle = glow;
    ctx.fillRect(f.x - f.size, f.y - f.size, f.size * 2, f.size * 2);
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.trail.push([p.x, p.y]); if (p.trail.length > 5) p.trail.shift();
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(p.drag, dt); p.vy = p.vy * Math.pow(p.drag, dt) + p.gravity * dt; p.life -= dt;
    if (p.life <= 0 || p.y > h + 20) { particles.splice(i, 1); continue; }
    if (p.smoke) continue;
    const alpha = Math.min(1, p.life / 28) * (p.twinkle && p.life < 40 ? .35 + Math.random() * .65 : 1);
    ctx.strokeStyle = p.color; ctx.lineWidth = p.size; ctx.lineCap = 'round';
    ctx.globalAlpha = alpha * .35; ctx.beginPath();
    p.trail.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.lineTo(p.x, p.y); ctx.stroke();
    ctx.globalAlpha = alpha; ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
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
function launch(x = w * .5, y = h * .32, type = selected) {
  $('#sky-caption').style.opacity = '0'; count++;
  $('#launch-count').textContent = `${count} patakhe · zero complaints`;
  rooftopReaction(); const ground = h - 42;
  if (type === 'rocket') {
    soundEffect('rocket', x); rockets.push({x, y: ground, target: Math.max(32, Math.min(y, h * .57)), speed: 5.8 + Math.random()});
  } else if (type === 'anaar') {
    soundEffect('anaar', x);
    for (let k = 0; k < 42; k++) later(() => {
      const strength = Math.sin(Math.PI * (k + 3) / 46);
      for (let i = 0; i < (reduced ? 2 : 9); i++) {
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
    for (let k = 0; k < 20; k++) later(() => {
      const cx = Math.max(20, Math.min(w - 20, x + (k - 10) * 9));
      burst(cx, ground - Math.random() * 7, reduced ? 8 : 26, k % 2 ? '#ffd17e' : '#ff8668');
    }, k * 65 + Math.random() * 32);
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
$('#sound').onclick = () => {
  sound = !sound; $('#sound').textContent = sound ? '♪ Sound on' : '♪ Sound off'; $('#sound').setAttribute('aria-pressed', sound);
  if (sound) { try { prepareAudio(); } catch { sound = false; $('#sound').textContent = '♪ Sound off'; $('#sound').setAttribute('aria-pressed', 'false'); toast('Audio is unavailable in this browser.'); } }
  else stopSounds();
};
$('#volume').oninput = e => { volume = Number(e.target.value) / 100; if (master) master.gain.setTargetAtTime(volume, audio.currentTime, .03); };
$('#finale').onclick = () => {
  if ($('#finale').disabled) return;
  $('#finale').disabled = true; toast('Sharma ji just closed all his windows.');
  for (let i = 0; i < 18; i++) later(() => launch(w * (.12 + Math.random() * .76), h * (.14 + Math.random() * .29), i % 5 === 0 ? 'anaar' : 'rocket'), i * 210);
  later(() => $('#finale').disabled = false, 4500);
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
function openGame(game){previousFocus=document.activeElement;content.replaceChildren();if(game==='papdi')resetPapdi();if(game==='family')family();if(game==='bonus')bonus();dialog.showModal()}
document.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>openGame(b.dataset.game));
$('#close-dialog').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});dialog.addEventListener('close',()=>previousFocus?.focus());
const reactions = [
  {src: 'https://media1.tenor.com/m/fVBphFK19H8AAAAC/jethalal-jethalal-shocked.gif', alt: 'Jethalal looks completely shocked', title: 'Jethalal / TMKOC · Tenor', href: 'https://tenor.com/view/jethalal-jethalal-shocked-shocked-face-reaction-what-what-what-gif-19739068'},
  {src: 'https://media1.tenor.com/m/zezKeW8RSv8AAAAC/paisa-hi-paisa-hoga.gif', alt: 'Raju celebrates his big plan in Phir Hera Pheri', title: 'Phir Hera Pheri · Tenor', href: 'https://tenor.com/view/paisa-hi-paisa-hoga-gif-22249471'},
  {src: 'https://media1.tenor.com/m/tbnePOd_Gf4AAAAC/control-control-uday.gif', alt: 'Uday tries very hard to keep his cool in Welcome', title: 'Welcome / Control Uday · Tenor', href: 'https://tenor.com/en-IN/view/control-control-uday-control-uday-control-welcome-bas-kar-gif-13094741744719698430'},
  {src: 'https://media1.tenor.com/m/xoVXud0uxOgAAAAC/miracle-miracle-miracle.gif', alt: 'Akshay Kumar reacts to a miracle in Welcome', title: 'Welcome / Miracle · Tenor', href: 'https://tenor.com/view/miracle-miracle-miracle-saloniie-akshay-kumar-welcome-gif-14491263'}
];
function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
let reactionBag = [], lastReaction = -1;
function reaction(target = content) {
  if (!reactionBag.length) {
    reactionBag = shuffled(reactions.map((_, i) => i));
    if (reactionBag[0] === lastReaction) [reactionBag[0], reactionBag[1]] = [reactionBag[1], reactionBag[0]];
  }
  lastReaction = reactionBag.shift(); const meme = reactions[lastReaction];
  const figure = document.createElement('figure'); figure.className = 'reaction-frame';
  const img = document.createElement('img'); img.src = meme.src; img.alt = meme.alt; img.className = 'reaction';
  const fallback = document.createElement('div'); fallback.className = 'meme-fallback'; fallback.hidden = true;
  fallback.innerHTML = '<span>POV: dabba phir aa gaya.</span><b>Yeh toh hona hi tha. 🤦🏽</b>';
  img.onerror = () => { img.hidden = true; fallback.hidden = false; };
  // Reduced-motion visitors get a text meme with an opt-in to the GIF.
  if (reduced) { img.hidden = true; fallback.hidden = false; const play = document.createElement('button'); play.className = 'quiet-button'; play.textContent = 'Play reaction GIF'; play.onclick = () => { img.hidden = false; fallback.hidden = true; play.remove(); }; figure.append(play); }
  const link = document.createElement('a'); link.href = meme.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
  link.className = 'credit'; link.textContent = `Reaction: ${meme.title} ↗`;
  figure.append(img, fallback, link); target.append(figure);
}
const papdiStops = [
  {name: 'Sharma aunty', joke: '“Arre, iski kya zaroorat thi?” Gift bag ka handle pakad ke aunty ne kaha.'},
  {name: 'Gupta uncle', joke: 'Uncle ne upar “premium dry fruits” ka sticker chipka diya. Rebranding ka budget: ₹0.'},
  {name: 'Your manager', joke: 'Dabba is now a “festive performance incentive”. Your promotion is still in review.'},
  {name: 'Society secretary', joke: 'Maintenance ke paise full. Mithai society ke WhatsApp group se crowdsourced.'},
  {name: 'Your cousin', joke: 'Cousin ne gift tag badla. Instagram story mein “small wins, big blessings” daala.'},
  {name: 'Bua ji', joke: 'Dabba accept karne se pehle bua ne kundli maangi. Soan papdi ki nahi. Tumhari.'},
  {name: 'Chai-wale bhaiya', joke: 'Bhaiya ne bola “khata clear karo pehle”. Dabba bhi udhaar mein accept nahi hua.'},
  {name: 'NRI maasi', joke: '“Is this gluten-free?” Maasi has now taken the dabba through two international airports.'},
  {name: 'Gym bro', joke: '“Protein kitna hai?” He logs one bite as a cheat meal, regifts the remaining 499 grams.'},
  {name: 'The tuition sir', joke: 'Sir ne iske bhi 3 marks kaat diye. Steps nahi likhe the gift note pe.'},
  {name: 'Building ke kids', joke: 'Chocolate nahi nikli. Entire unboxing committee has unanimously rejected the product.'},
  {name: 'Your office bestie', joke: '“Mere ghar mat lana,” bestie said. Then left the exact same dabba on your desk.'}
];
let papdiRoute = [], previousFirst = '', papdiTrip = 0;
function resetPapdi() {
  const candidates = shuffled(papdiStops);
  if (candidates[0].name === previousFirst) [candidates[0], candidates[1]] = [candidates[1], candidates[0]];
  papdiRoute = candidates.slice(0, 5); previousFirst = papdiRoute[0].name; papdiTrip++;
  papdi(0);
}
function papdi(step) {
  const end = step === papdiRoute.length + 1;
  const trail = ['You', ...papdiRoute.slice(0, Math.min(step, papdiRoute.length)).map(stop => stop.name)];
  if (end) trail.push('You. Again.');
  const joke = step === 0 ? 'Naya route. Naye suspects. Wahi suspicious dabba. Is baar kiske ghar jayega?'
    : end ? 'Your own gift tag is still underneath. Dabba ne tumse zyada Diwali parties attend kar li.' : papdiRoute[step - 1].joke;
  content.innerHTML = `<div class="eyebrow">SOAN PAPDI MULTIVERSE · TRIP ${papdiTrip}</div><h2>${end ? 'Ghar wapsi ho gayi.' : step ? `${papdiRoute[step - 1].name} has the dabba.` : 'Same dabba. New drama.'}</h2><div class="route">${trail.join(' → ')}</div><p>${joke}</p><div id="papdi-reaction"></div><div class="game-actions"><button class="primary" id="pass">${end ? 'Break the cycle. Eat it.' : 'Regift. Obviously.'} ↗</button><button class="quiet-button" id="reset-route">Shuffle the route ↻</button></div>`;
  if (step) reaction($('#papdi-reaction'));
  $('#reset-route').onclick = () => { resetPapdi(); $('#pass').focus(); };
  $('#pass').onclick = () => {
    if (!end) { papdi(step + 1); $('#pass').focus(); beep(); }
    else {
      const endings = [
        'You ate the soan papdi. Somewhere, an entire supply chain just collapsed. Honestly? It was delicious.',
        'Plot twist: you actually like soan papdi. The family group has been notified. Seven more dabbas are on their way.',
        'You put it next to the chai. Five minutes later: empty dabba. Everyone blames the cousin who went to the gym.'
      ];
      content.innerHTML = `<span class="big-icon">🏆</span><h2>The cycle is broken.</h2><p>${endings[(papdiTrip - 1) % endings.length]}</p><button class="primary" id="again">Start another questionable journey ↗</button>`;
      reaction(); $('#again').onclick = () => { resetPapdi(); $('#pass').focus(); }; $('#again').focus();
    }
  };
}
function family(){content.innerHTML='<div class="eyebrow">SHARMA PARIVAAR · 47 MEMBERS</div><h2>Happy Diwali 🌷🙏</h2><div class="messages" id="messages" role="log" aria-live="polite"><div class="message"><b>PAPA · ADMIN</b>Happy Diwali. Please do not send Good Morning here. Separate group hai.</div><div class="message"><b>BUA JI</b>Beta, shaadi kab kar rahe ho? 👀</div></div><div class="options"><button data-reply="career">“Abhi career pe focus hai, bua.”</button><button data-reply="food">“Kaju katli kisne khatam ki?”</button><button data-reply="leave">Attempt to leave group ↗</button></div>';let replies=0;const responses={career:['BUA JI','Career toh Sharma ji ke bete ka bhi hai. Uske do bachche hain.'],food:['MUMMY','Maine mehmaan ke liye rakhi thi. Tumne fridge khola kyun?'],leave:['PAPA · ADMIN','Papa added you.\nPapa made you an admin.\nAb light bill ka PDF bhejo.']};content.querySelectorAll('[data-reply]').forEach(b=>b.onclick=()=>{const log=$('#messages');const you=document.createElement('div');you.className='message you';you.textContent=b.textContent;log.append(you);const answer=document.createElement('div');answer.className='message';const who=document.createElement('b');who.textContent=responses[b.dataset.reply][0];answer.append(who,document.createTextNode(responses[b.dataset.reply][1]));log.append(answer);log.scrollTop=log.scrollHeight;replies++;if(replies===3)toast('Achievement unlocked: emotionally present, physically on mute.');})}
let bonusRoll=0;
function bonus(){content.innerHTML='<div class="eyebrow">A PERSONAL MESSAGE FROM HR</div><span class="big-icon">✉️</span><h2>Your hard work<br>has been noticed.</h2><p>“Dear valued resource, we have gone above and beyond to curate your festive happiness.”</p><button class="primary" id="unbox">Open the hamper <span>↗</span></button>';$('#unbox').onclick=()=>{const prizes=[['₹ 0','A heartfelt email.','“Your contribution is priceless. So we haven’t put a price on it.”'],['1 DABBA','The legacy bonus.','Soan papdi. An air fryer was discussed. A suitcase was shortlisted. Then Finance joined the call.'],['₹ 101','Shagun, with conditions.','₹1 for good luck. ₹100 redeemable at the office cafeteria. Minimum spend ₹999.'],['1 DAY','A surprise holiday!','It’s Sunday. HR says you’re welcome.'],['AIR FRYER!','The plot twist nobody expected.','A picture of an air fryer. In the company newsletter. Please like and reshare.']];const p=prizes[bonusRoll++%prizes.length];content.innerHTML=`<div class="eyebrow">YOUR FESTIVE APPRAISAL IS HERE</div><div class="bonus-amount">${p[0]}</div><h2>${p[1]}</h2><p>${p[2]}</p><button class="primary" id="reroll">Try another company ↗</button>`;reaction();$('#reroll').onclick=bonus;beep()}}
$('#share').onclick=async()=>{const data={title:'Diwali After Dark',text:'Patakhe without pollution. Family drama without the family. Aao, thoda kaand karein. 🪔',url:location.href};try{if(navigator.share){await navigator.share(data)}else if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(`${data.text}\n${data.url}`);toast('Link copied. Family group mein daalne ki himmat hai?')}else{toast('Share this page’s address with your favourite troublemaker.')}}catch(e){if(e.name!=='AbortError')toast('Share this page’s address with your favourite troublemaker.')}};
// A tiny opening flourish; reduced-motion visitors start with a still sky.
if(!reduced)later(()=>{burst(w*.76,h*.3,55,'#d9ae66',true)},650);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(frame); clearSky(); clearTimeout(toastTimer); $('#toast').classList.remove('show');
    if (audio) audio.suspend().catch(() => {});
  } else { lastTime = performance.now(); frame = requestAnimationFrame(animate); }
});
