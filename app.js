'use strict';
const $ = s => document.querySelector(s);
const canvas = $('#fireworks'), ctx = canvas.getContext('2d'), sky = $('#sky');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const colors = ['#ffd17e', '#ff8668', '#c99bf0', '#9fd9b1', '#fff1c1', '#ef7dac'];
let w = 0, h = 0, particles = [], rockets = [], flashes = [], shockwaves = [], projectiles = [], devices = [], count = 0, wind = 0;
let selected = 'rocket', sound = true, frame, lastTime = 0;
let volume = .45, partyUntil = 0, neighbourTimer, lastComment = 0;
const timers = new Set();
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

// Dharmik's cracker recordings; Chakri sustains the same sizzle with a gentle tail.
const soundClips = {
  rocket: {src:'assets/sounds/rocket.mp3', duration:4.032},
  bomb: {src:'assets/sounds/bomb.mp3', duration:3.528},
  fizz: {src:'assets/sounds/chakri-sizzle.wav', duration:2.64},
  ladi: {src:'assets/sounds/ladi.mp3', duration:2.04}
};
const ROCKET_BURST = 2.95, BOMB_BLASTS = [.3, 2.97], CHAKRI_TAIL = .6;
const crackerProfiles = {
  rocket: {clip:'rocket', caption:'Rocket · the original whistle, bang and crackle'},
  chakri: {clip:'fizz', caption:'Chakri · the original sizzle, with a soft finish'},
  ladi: {clip:'ladi', caption:'Ladi · the original rapid-fire recording'},
  greenbomb: {clip:'bomb', caption:'Green bomb · the original two-bomb recording'},
  mirchibomb: {clip:'bomb', caption:'Mirchi bomb · red bursts on the original two bangs'},
  sutlibomb: {clip:'bomb', caption:'Sutli bomb · smoky impacts on the original two bangs'},
  diwalibomb: {clip:'bomb', caption:'Diwali special · gold crowns on the original two bangs'}
};
const sampleElements = new Set(), clipPlayers = new Map();
let audioGeneration = 0;
function prepareAudio() {
  for (const [key, clip] of Object.entries(soundClips)) if (!clipPlayers.has(key)) {
    const player = new Audio(clip.src); player.preload = 'auto'; player.volume = volume;
    clipPlayers.set(key, player);
  }
}
function playCracker(type, effect) {
  const profile = crackerProfiles[type], clip = soundClips[profile.clip];
  $('#voice-caption').textContent = profile.caption;
  $('#voice-credit').href = 'https://github.com/hi-ashutosh/diwali-after-dark/tree/dharmik-dev'; $('#voice-credit').hidden = false;
  if (!sound || sampleElements.size >= 8) { effect(clip.duration); return; }
  prepareAudio(); const ready = clipPlayers.get(profile.clip);
  // Every launch starts at the beginning; an already-playing recording is left to finish.
  const player = ready.paused || ready.ended ? ready : new Audio(clip.src);
  let started = false; const generation = audioGeneration;
  const start = () => { if (started || generation !== audioGeneration) return; started = true; effect(Number.isFinite(player.duration) ? player.duration : clip.duration); };
  player.currentTime = 0; player.volume = volume; sampleElements.add(player);
  player.onplaying = start;
  player.onended = player.onerror = () => { sampleElements.delete(player); start(); };
  player.play().then(start).catch(() => { sampleElements.delete(player); start(); });
}
function stopSounds() {
  audioGeneration++;
  sampleElements.forEach(player => { player.onplaying = player.onended = player.onerror = null; player.pause(); });
  sampleElements.clear();
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
function burst(x, y, n = 130, color = colors[Math.floor(Math.random() * colors.length)], quiet = true) {

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
  if (n > 90 && !reduced) {
    if (shockwaves.length >= 12) shockwaves.shift();
    shockwaves.push({x, y, age: 0, color, scale: n > 170 ? 1.8 : n > 140 ? 1.4 : 1});
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
  if (!particles.length && !rockets.length && !flashes.length && !shockwaves.length && !projectiles.length && !devices.length && !partyUntil) return;
  ctx.clearRect(0, 0, w, h);
  if (typeof updateTosses === 'function') updateTosses(time);
  if (typeof drawFuses === 'function') drawFuses(time);
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
    p.x += (p.vx + wind * (p.smoke ? 1.5 : .4)) * dt; p.y += p.vy * dt + p.gravity * dt * dt * .5;
    p.vx *= damping; p.vy = p.vy * damping + p.gravity * dt;
    particles[alive++] = p;
  }
  particles.length = alive;
  ctx.globalCompositeOperation = 'source-over';
  for (const p of particles) if (p.smoke) {
    const radius = p.size + (p.max - p.life) * .12;
    ctx.globalAlpha = p.life / p.max * (p.opacity || .1);
    ctx.drawImage(glowSprite(p.color), p.x - radius, p.y - radius, radius * 2, radius * 2);
  }
  ctx.globalCompositeOperation = 'lighter';
  for (let i = flashes.length - 1; i >= 0; i--) {
    const f = flashes[i]; f.life -= dt;
    if (f.life <= 0) { flashes.splice(i, 1); continue; }
    ctx.globalAlpha = f.life / 9 * .25;
    ctx.drawImage(glowSprite(f.color), f.x - f.size, f.y - f.size, f.size * 2, f.size * 2);
  }
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const ring = shockwaves[i]; ring.age += dt;
    const duration = ring.duration || 24;
    if (ring.age > duration) { shockwaves.splice(i, 1); continue; }
    const radius = (12 + ring.age * (ring.speed || 5)) * ring.scale;
    ctx.globalAlpha = (1 - ring.age / duration) * .65; ctx.strokeStyle = ring.color; ctx.lineWidth = ring.width || 3;
    ctx.beginPath(); ctx.ellipse(ring.x, ring.y, radius, radius * (ring.squash || 1), 0, 0, Math.PI * 2); ctx.stroke();
  }
  // Batch trails by colour: a handful of canvas strokes replaces thousands.
  ctx.lineCap = 'round';
  for (const color of sparkColors) {
    ctx.strokeStyle = color; ctx.beginPath();
    for (const p of particles) if (!p.smoke && p.color === color && p.life > 12) {
      ctx.moveTo(p.x - p.vx * 4.2, p.y - p.vy * 4.2); ctx.lineTo(p.x, p.y);
    }
    ctx.lineWidth = reduced ? 3 : 5.5; ctx.globalAlpha = .15; ctx.stroke();
    ctx.lineWidth = reduced ? 1.8 : 2.6; ctx.globalAlpha = .78; ctx.stroke();
    ctx.fillStyle = color; ctx.globalAlpha = 1; ctx.beginPath();
    for (const p of particles) if (!p.smoke && p.color === color) {
      const size = p.size * 1.7 * Math.min(1, p.life / 16);
      ctx.rect(p.x - size / 2, p.y - size / 2, p.confetti ? size * 1.7 : size, size);
    }
    ctx.fill();
  }
  // White-hot centres keep the thicker coloured sparks crisp, in one shared draw call.
  ctx.fillStyle = '#fff8df'; ctx.globalAlpha = .95; ctx.beginPath();
  for (const p of particles) if (!p.smoke && p.life > 6) {
    const size = p.size * .65 * Math.min(1, p.life / 16);
    ctx.rect(p.x - size / 2, p.y - size / 2, size, size);
  }
  ctx.fill();
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (partyUntil && time > partyUntil) { sky.classList.remove('celebrating', 'shake', 'heavy-impact'); partyUntil = 0; }
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
function flower(x, y, color, petals = 80, speed = 5, life = 80, twist = 0) {
  const total = reduced ? 14 : Math.min(petals, Math.floor(particleBudget * .18));
  for (let i = 0; i < total; i++) {
    const a = i / total * Math.PI * 2, v = speed * (1 + .2 * Math.cos(a * 7 + twist));
    add(x, y, Math.cos(a) * v, Math.sin(a) * v, i % 5 ? color : '#fff8d7', life + Math.random() * 20, i % 5 ? 1.6 : 2.3, .045, {drag:.987});
  }
  burst(x, y, 110, color);
}
function rocketBurst(x, y) {
  flower(x, y, '#ffd17e', 100, 5.2, 95);
  later(() => flower(x, y, '#ef7dac', 60, 2.9, 72, 1), 150);
  for (let i = 0; i < 5; i++) later(() => burst(x + Math.cos(i * 1.26) * 60, y + Math.sin(i * 1.26) * 45, 14, '#fff8d7'), 320 + i * 75);
}
function drawFuses(time) {
  for (let i = devices.length - 1; i >= 0; i--) {
    const d = devices[i], progress = (time - d.born) / d.fuse;
    if (progress >= 1) { devices.splice(i, 1); continue; }
    ctx.save(); ctx.translate(d.x, d.y);
    const pulse = 1 + Math.sin(progress * 30) * .04;
    ctx.scale(pulse, pulse); ctx.fillStyle = d.color; ctx.strokeStyle = '#f6d49b'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-10, -15, 20, 19, 5); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -15); ctx.quadraticCurveTo(12, -29, 5 + progress * 5, -22); ctx.stroke();
    ctx.restore();
    if (!reduced) for (let j = 0; j < 2; j++) add(d.x + 6, d.y - 24, (Math.random() - .5) * 2, -Math.random() * 2, '#fff1c1', 10, 1.4, .06);
  }
}
function shakeSky(strength = 1) {
  if (reduced) return;
  sky.style.setProperty('--jolt', strength); sky.classList.remove('shake'); void sky.offsetWidth; sky.classList.add('shake');
  later(() => sky.classList.remove('shake'), 420);
}
// Different silhouettes and physics, not recoloured copies of one radial burst.
function bombBurst(x, y, type) {
  const total = reduced ? 14 : Math.min(125, Math.floor(particleBudget * .17));
  const ring = (color, scale, squash = 1, speed = 5, width = 3) => {
    if (reduced) return;
    if (shockwaves.length >= 12) shockwaves.shift();
    shockwaves.push({x,y,age:0,color,scale,squash,speed,width,duration:30});
  };
  const flash = (color, size) => { if (!reduced) flashes.push({x,y,life:12,size,color}); };
  if (type === 'greenbomb') {
    // A round emerald pressure sphere with a bright cyan inner shell.
    y -= 70; flash('#84ffd1', 230);
    ring('#84ffd1', 1.2); ring('#caffef', .74, 1, 6, 4);
    for (let i = 0; i < total; i++) {
      const a = i / total * Math.PI * 2, speed = i % 3 ? 6 : 3.7;
      add(x,y,Math.cos(a)*speed,Math.sin(a)*speed,i % 4 ? '#75efab' : '#bdfff2',68,2.6,.025,{drag:.99});
    }
    shakeSky(1.2);
  } else if (type === 'mirchibomb') {
    // Five narrow red comet fans: all energy goes upward, with no circular halo.
    flash('#ff7553', 140);
    for (let i = 0; i < total; i++) {
      const spoke = i % 5, a = -Math.PI + .3 + spoke * (Math.PI - .6) / 4 + (Math.random() - .5) * .11;
      const speed = 4 + Math.random() * 7;
      add(x + (spoke - 2) * 10,y,Math.cos(a)*speed,Math.sin(a)*speed,i % 4 ? '#ff514f' : '#ffb04f',55 + Math.random()*20,2.7,.085,{drag:.988});
    }
    shakeSky(.85);
  } else if (type === 'sutlibomb') {
    // A white-hot ground punch, wide elliptical pressure waves and a dusty plume.
    flash('#fff3cf', 300); ring('#f4d6a1',1.8,.2,7,4); ring('#fff6dd',1.15,.3,6,3);
    for (let i = 0; i < total; i++) {
      const a = -Math.PI + Math.random()*Math.PI, speed = 2 + Math.random()*8;
      add(x,y,Math.cos(a)*speed,Math.sin(a)*speed*.8,i % 3 ? '#ffc285' : '#fff8df',48 + Math.random()*20,3.2,.18,{drag:.978});
    }
    if (!reduced) for (let i = 0; i < 8 && particles.filter(p=>p.smoke).length < 20; i++) {
      add(x + (i-3.5)*13,y-12,(i-3.5)*.35,-.8-Math.random(), '#b6a398',100,15,-.005,{smoke:true,opacity:.22});
    }
    shakeSky(1.7);
  } else if (type === 'diwalibomb') {
    // A high golden willow canopy: separated lobes leave long, falling ribbons.
    y = h * .34; flash('#ffdf8a',220);
    for (let i = 0; i < total; i++) {
      const lobe = i % 7, spread = (lobe-3)/3, a = -Math.PI/2 + spread*1.32;
      const speed = 3.8 + Math.random()*2.8;
      add(x + spread * Math.min(w*.19,110),y + Math.abs(spread)*22,
        Math.cos(a)*speed,Math.sin(a)*speed,i % 4 ? '#ffd36f' : '#fff5c6',112 + Math.random()*20,2.4,.095,{drag:.995});
    }
    shakeSky(.8);
  }
  sky.classList.add('heavy-impact'); later(() => sky.classList.remove('heavy-impact'), 500);
}
function launch(x = w * .5, y = h * .32, type = selected, audible = true, elapsed = 0) {
  $('#sky-caption').style.opacity = '0'; count++;
  $('#launch-count').textContent = `${count} patakhe · zero complaints`;
  rooftopReaction();
  const effect = duration => animateCracker(x, y, type, duration, elapsed);
  if (audible) playCracker(type, effect);
  else effect(soundClips[crackerProfiles[type].clip].duration);
  if ([10, 25, 50, 100].includes(count)) toast(`${count} patakhe! Society committee ne emergency meeting bula li.`);
}
function animateCracker(x, y, type, duration, elapsed = 0) {
  const ground = h - 42, ms = Math.max(450, duration * 1000);
  if (type === 'rocket') {
    rockets.push({x, y:ground, ground, target:Math.max(50, Math.min(y, h * .57)), born:performance.now() - elapsed * 1000, flight:ROCKET_BURST * 1000});
  } else if (type === 'chakri') {
    // Reserve the recording's fading tail for sparks already in the air.
    const spinMs = Math.max(450, ms - CHAKRI_TAIL * 1000), ticks = Math.ceil(spinMs / 45);
    for (let k = 0; k < ticks; k++) later(() => {
      const a = k * k * .04, cx = x + Math.sin(k * .15) * 22;
      for (let j = 0; j < (reduced ? 2 : 6); j++) {
        const angle = a + j * Math.PI / 3;
        add(cx, ground, Math.cos(angle) * 5, Math.sin(angle) * 2 - .5, k % 3 ? '#ffd17e' : '#ef7dac', 36, 1.7, .03);
      }
      if (k % 6 === 0) flashes.push({x:cx,y:ground,life:5,size:35,color:'#ffd17e'});
    }, k * spinMs / ticks);
  } else if (type === 'ladi') {
    const pops = Math.min(30, Math.ceil(ms / 65));
    for (let k = 0; k < pops; k++) later(() => {
      const cx = Math.max(20, Math.min(w - 20, x + (k - pops / 2) * 7));
      burst(cx, ground - 4, 24, k % 2 ? '#ffd17e' : '#ff8668');
      if (k % 5 === 0) shakeSky(.45);
    }, k * ms * .92 / pops);
  } else {
    const palette = {greenbomb:'#b9ec97',mirchibomb:'#ff6454',sutlibomb:'#edba7a',diwalibomb:'#ffdc84'};
    const color = palette[type];
    // Both blasts line up with the two bangs in the unchanged Bomb recording.
    BOMB_BLASTS.forEach((at, bang) => {
      const bx = Math.max(35, Math.min(w - 35, x + (bang ? 24 : -12))), fuse = bang ? 800 : at * 1000;
      const lightFuse = () => {
        if (devices.length >= 12) devices.shift();
        devices.push({x:bx,y:ground,born:performance.now(),fuse,color});
      };
      if (bang) later(lightFuse, at * 1000 - fuse); else lightFuse();
      later(() => {
        bombBurst(bx, ground - 18, type);
      }, at * 1000);
    });
  }
}
canvas.addEventListener('pointerdown', e => { const r = canvas.getBoundingClientRect(); playgroundAction(e.clientX - r.left, e.clientY - r.top); });
canvas.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playgroundAction(w * .5, h * .3); } });
document.querySelectorAll('.cracker').forEach(b => b.addEventListener('click', () => {
  selected = b.dataset.type;
  document.querySelectorAll('.cracker').forEach(c => { const active = c === b; c.classList.toggle('active', active); c.setAttribute('aria-pressed', active); });
  if (typeof playMode === 'undefined' || playMode === 'sky') launch(w * .55, h * .3, selected);
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
  sampleElements.forEach(element => element.volume = volume);
  syncReactionAudio();
  clipPlayers.forEach(player => player.volume = volume);
};
$('#finale').onclick = () => {
  if ($('#finale').disabled) return;
  $('#finale').disabled = true; toast('Sharma ji just closed all his windows.');
  // One original Rocket recording for the volley; every rocket bursts on its recorded bang.
  playCracker('rocket', duration => {
    for (let i = 0; i < 3; i++) launch(w * (.22 + i * .28), h * (.18 + i * .07), 'rocket', false);
    for (let i = 0; i < 12; i++) later(() => launch(w * (.12 + Math.random() * .76), h * (.14 + Math.random() * .29), 'rocket', false, (140 + i * 115) / 1000), 140 + i * 115);
    later(() => $('#finale').disabled = false, Math.max(duration * 1000, 5000));
  });
};
function clearSky(stopAudio = true) {
  timers.forEach(clearTimeout); timers.clear(); particles = []; rockets = []; flashes = []; shockwaves = []; projectiles = []; devices = []; if (stopAudio) stopSounds();
  if (typeof resetTosses === 'function') resetTosses();
  $('#finale').disabled = false; $('#sky-caption').style.opacity = '1';
  sky.classList.remove('celebrating', 'shake', 'heavy-impact'); partyUntil = 0; clearTimeout(neighbourTimer); $('#roof-comment').classList.remove('visible');
  ctx.clearRect(0, 0, w, h);
}
$('#clear-sky').onclick = () => clearSky();
document.querySelectorAll('.roof-person').forEach(b => b.onclick = () => {
  if (typeof rooftopClick === 'function' && rooftopClick(b)) return;
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
function stopReactions() { document.querySelectorAll('video.reaction, #dare-video').forEach(video => video.pause()); }
function syncReactionAudio() {
  document.querySelectorAll('video.reaction, #dare-video').forEach(video => { video.muted = !sound || video.dataset.silent === 'true'; video.volume = volume; });
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
// Every reply belongs to the message currently at the bottom of the family chat.
const familyScenes = {
  marriage: {who:'BUA JI', line:'Beta, shaadi kab kar rahe ho? 👀', replies:[
    ['Abhi career pe focus hai, bua.','career'],['Pehle batao, kaju katli kisne khatam ki?','food'],['Quietly leave the group ↗','admin']]},
  career: {who:'BUA JI', line:'Career toh Sharma ji ke bete ka bhi hai. Uske do bachche hain. Tumhara appraisal kab hai?', replies:[
    ['Uska LinkedIn bhejo. Rishta nahi, referral chahiye.','cousin'],['Appraisal mein sirf soan papdi mili.','bonus'],['Salary discuss karein toh sabke saamne karein?','salary']]},
  food: {who:'MUMMY', line:'Kaju katli mehmaan ke liye rakhi thi. Fridge mein sirf khaali dabba mila. Kisne khaya?', replies:[
    ['Cousin ki story mein wahi dabba tha.','suspect'],['Main nayi mithai order kar deta hoon.','budget'],['Maine toh bas ek quality check kiya tha.','confession']]},
  admin: {who:'PAPA · ADMIN', line:'Papa added you.\nPapa made you an admin.\nAb light bill ka PDF bhejo.', replies:[
    ['Bill_final_FINAL.jpg bhej diya.','pdf'],['Papa, phone mein storage full hai.','tech'],['Admin post se resignation dena hai.','resign']]},
  cousin: {who:'SHARMA JI KA BETA', line:'Referral bhej dunga. Pehle meri Diwali post pe “So proud of you, brother” comment kar do.', replies:[
    ['Comment ka bhi probation period hai kya?','bonus'],['Pehle tum batao mithai ka dabba kahan hai.','suspect'],['Family photo mein tag kar deta hoon.','photo']]},
  bonus: {who:'CHACHU', line:'Hamare zamaane mein bonus cash mein milta tha. Tumhari company ne kya diya?', replies:[
    ['“We are family” wala heartfelt email.','salary'],['Air fryer ki photo. Newsletter mein.','forwards'],['Soan papdi. Ghar bhej doon?','budget']]},
  salary: {who:'NRI MAASI', line:'Beta package kitna hai? Dollar mein batao. Group mein hi batao, sab apne hain.', replies:[
    ['Package 500 gram ka hai. Soan papdi wala.','budget'],['Maasi, aapne jo forward bheja tha woh fake hai.','forwards'],['Is sawaal ke baad group mute kar raha hoon.','mute']]},
  suspect: {who:'COUSIN', line:'Story mein mera dabba tha, lekin last piece Chhotu ne liya. CCTV footage mein main bas background mein hoon.', replies:[
    ['Family CID bulao. Footage nikalo.','cctv'],['Chhotu ko bolo haath wala anaar neeche rakhe.','chhotu'],['Theek hai. Naya dabba order karte hain.','budget']]},
  confession: {who:'MUMMY', line:'Ek quality check mein 18 pieces kaise chale gaye? Ab mehmaan ko khaali dabbe ka review doge?', replies:[
    ['Food reviewer banna mera backup career hai.','career'],['Replacement ka budget approve kar do.','budget'],['Cousin ne bhi teen liye the. Witness hoon.','suspect']]},
  budget: {who:'PAPA · ADMIN', line:'Nayi mithai ka budget ₹501. Delivery ₹99 hui toh khud jaake le aana. Bill sambhal ke rakhna.', replies:[
    ['Bill ka PDF bhi chahiye na?','pdf'],['Cousin ko bhejte hain. Uske paas scooty hai.','cousin'],['Family photo ke baad sab saath chalenge.','photo']]},
  pdf: {who:'PAPA · ADMIN', line:'Yeh photo hai. PDF chahiye. Aur file ka naam FINAL_2_last_real_final kyun hai?', replies:[
    ['Scan karke ek proper PDF bhejta hoon.','scan'],['Chachu ko bolo, woh tech expert hain.','tech'],['Admin banaya tha, IT department nahi.','resign']]},
  scan: {who:'PAPA · ADMIN', line:'PDF khul gaya. Good. Ab last 6 months ke bills bhi isi tarah bhej do. Happy Diwali.', replies:[
    ['Is assignment ka Diwali bonus milega?','bonus'],['Yeh kaam cousin ko delegate karte hain.','cousin'],['Main ab notifications mute kar raha hoon.','mute']]},
  tech: {who:'CHACHU · TECH EXPERT', line:'Phone restart karo. Nahi hua toh WhatsApp delete karke install karo. Main har problem mein yahi karta hoon.', replies:[
    ['Backup bhi isi group mein bhej doon?','forwards'],['Restart se bill PDF ban jaata hai kya?','pdf'],['Papa, admin access wapas le lo.','resign']]},
  resign: {who:'PAPA · ADMIN', line:'Admin se resign nahi kar sakte. Yeh family hai, startup nahi. Waise dinner ki family photo kisne kheechi?', replies:[
    ['Photo mere paas hai. Sab ready ho jao.','photo'],['Pehle mithai case solve kar lein?','food'],['Duty par hoon. Notifications off kar raha hoon.','mute']]},
  forwards: {who:'CHACHU', line:'Forwarded many times: NASA ne confirm kiya, space se hamare ghar ki Diwali lights dikh rahi hain. 🚀🙏', replies:[
    ['Chachu, iski source link bhejo.','factcheck'],['Lights se yaad aaya, bill ka PDF ready hai.','pdf'],['NASA ko family photo bhi bhej do.','photo']]},
  factcheck: {who:'CHACHU', line:'Source mere school ke friend ka brother hai. Woh Houston ke WhatsApp group mein hai. Aur kya proof chahiye?', replies:[
    ['Proof cousin ki mithai wali CCTV jaisa hai.','cctv'],['Theek hai, ab sirf Diwali wishes bhejo.','wishes'],['Aapke forwards ko silently mute kar raha hoon.','mute']]},
  cctv: {who:'COUSIN', line:'CCTV mein sab dikh gaya. Mummy ne last piece khaya. Ab recording delete karun ya family group mein bhejun?', replies:[
    ['Delete karo. Ghar pe dinner bhi khana hai.','wishes'],['Mummy, quality check kaisa tha?','confession'],['Evidence chhodo, family photo bhejo.','photo']]},
  chhotu: {who:'MUMMY', line:'CHHOTU KO PHONE DO. Anaar haath mein kisne diya?! Tum log video banana band karo pehle.', replies:[
    ['Anaar neeche rakh diya. Sab theek hain.','wishes'],['Cousin director bana hua tha.','suspect'],['Diwali family photo kar lein? Safe distance se.','photo']]},
  photo: {who:'MUMMY', line:'Family photo aa gayi. Papa ki aankh band hai, cousin ka filter on hai. Sab ek aur photo ke liye wapas aao.', replies:[
    ['Papa ko crop nahi, wake up karte hain.','wishes'],['Cousin se original photo maango.','cousin'],['Photo upload karke group mute kar deta hoon.','mute']]},
  wishes: {who:'DADI', line:'Bas karo CID aur PDF. Sabko Happy Diwali. Khana garam hai. Phone rakho aur aa jao. 🪔', replies:[
    ['Happy Diwali, Dadi. Aa raha hoon. ❤️','mute'],['Mithai toh bachi hai na?','food'],['Dinner se pehle ek family photo!','photo']]},
  mute: {who:'WHATSAPP', line:'You muted this group for Always.\n47 members are still typing. Diwali continues.', replies:[
    ['Ek baar dekh loon, naya forward aaya kya?','forwards'],['Kaju katli ka case phir kholte hain.','food'],['Dadi ko Happy Diwali bolna reh gaya.','wishes']]}
};
let familyVisits = 0;
function family() {
  content.innerHTML = '<div class="eyebrow">SHARMA PARIVAAR · 47 MEMBERS</div><h2>Happy Diwali 🌷🙏</h2><div class="messages" id="messages" role="log" aria-label="Family conversation" aria-live="polite"></div><div class="family-chat-meta"><span id="family-topic">47 members · everyone has an opinion</span><button class="quiet-button" id="family-reset">New conversation ↻</button></div><div class="options family-options" id="family-options" aria-label="Reply to the latest message"></div>';
  const log = $('#messages'), options = $('#family-options'); let turns = 0;
  function message(who, line, mine = false) {
    const bubble = document.createElement('div'); bubble.className = mine ? 'message you' : 'message';
    const label = document.createElement('b'); label.textContent = who;
    bubble.append(label, document.createTextNode(line)); log.append(bubble);
    while (log.children.length > 60) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function showScene(key, focus = false) {
    const scene = familyScenes[key]; message(scene.who, scene.line);
    $('#family-topic').textContent = key === 'mute' ? 'Muted. For now.' : `Replying to ${scene.who.toLowerCase()}`;
    options.replaceChildren();
    for (const [text, next] of scene.replies) {
      const button = document.createElement('button'); button.textContent = text;
      button.onclick = () => { message('YOU', text, true); turns++; showScene(next, true); if (turns === 6) toast('Achievement unlocked: emotionally present, physically on mute.'); };
      options.append(button);
    }
    if (focus) options.querySelector('button').focus({preventScroll:true});
  }
  message('PAPA · ADMIN', 'Happy Diwali. Please do not send Good Morning here. Separate group hai.');
  showScene(['marriage','food','forwards'][familyVisits++ % 3]);
  $('#family-reset').onclick = () => { family(); $('#family-options button').focus(); };
}
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
// Dharmik's Haath wala anaar reveal, with the exact branch clip and shared audio controls.
const dareVideo = $('#dare-video');
function playDare() {
  stopReactions(); clearSky(); $('#dare-art').hidden = true; dareVideo.hidden = false;
  dareVideo.muted = !sound; dareVideo.volume = volume; dareVideo.currentTime = 0;
  dareVideo.play().catch(() => { dareVideo.controls = true; });
  $('#dare-play').hidden = true; $('#dare-replay').hidden = false;
}
$('#dare-play').onclick = () => { playDare(); $('#dare-replay').focus(); };
$('#dare-replay').onclick = playDare;
dareVideo.onerror = () => {
  dareVideo.hidden = true; $('#dare-art').hidden = false;
  $('#dare-play').hidden = false; $('#dare-replay').hidden = true;
  toast('The clip could not load. Tap See what happens to try again.');
};
// A tiny opening flourish; reduced-motion visitors start with a still sky.
if(!reduced)later(()=>{burst(w*.76,h*.3,55,'#d9ae66',true)},650);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(frame); clearSky(); stopReactions(); clearTimeout(toastTimer); $('#toast').classList.remove('show');
  } else { lastTime = performance.now(); frame = requestAnimationFrame(animate); }
});
