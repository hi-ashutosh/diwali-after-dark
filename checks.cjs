// Dependency-free regression checks for the two reported issues.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname + '/app.js', 'utf8');
const stats = {strokes: 0, gradients: 0};
const drawing = new Proxy({
  createRadialGradient() { stats.gradients++; return {addColorStop() {}}; },
  stroke() { stats.strokes++; }
}, {get: (object, key) => object[key] || (() => {})});
const canvas = {getContext: () => drawing};
const sky = {clientWidth: 600, clientHeight: 360, classList: {remove() {}}};
const context = vm.createContext({
  document: {querySelector: selector => selector === '#sky' ? sky : canvas, createElement: () => canvas},
  matchMedia: () => ({matches: false}), navigator: {hardwareConcurrency: 8}, devicePixelRatio: 2,
  ResizeObserver: class {constructor(callback) {this.callback = callback;} observe() {this.callback();}},
  requestAnimationFrame: () => 1, setTimeout: () => 1, performance: {now: () => 0}, stats
});
vm.runInContext(source.split('const roofLines =')[0] + `
  for (let i = 0; i < 18; i++) burst(100 + i * 20, 100);
  animate(16); stats.strokes = 0; stats.gradients = 0; animate(32);
  const before = particles[0].life; animate(92);
  globalThis.result = {strokes: stats.strokes, gradients: stats.gradients, particles: particles.length, elapsed: before - particles[0].life};
`, context);
assert(context.result.strokes < 100, 'Dense volleys must batch canvas strokes');
assert.equal(context.result.gradients, 0, 'Warm frames must reuse glow sprites');
assert(Math.abs(context.result.elapsed - 60 / 16.67) < .001, 'A dropped frame must advance the full elapsed time');
assert(context.result.particles <= 1000, 'Dense volleys must respect the particle budget');
const scenes = vm.createContext({});
const start = source.indexOf('const reactions ='), end = source.indexOf('let papdiRoute =');
vm.runInContext(source.slice(start, end) + '\nglobalThis.scenes = {reactions, papdiStops};', scenes);
for (const stop of scenes.scenes.papdiStops) {
  assert(scenes.scenes.reactions[stop.reaction.meme], stop.name + ' needs a known, explicit reaction');
  assert(stop.reaction.memes.length >= 3, stop.name + ' needs several contextual options');
  for (const key of stop.reaction.memes) assert(scenes.scenes.reactions[key], 'Unknown contextual reaction: ' + key);
  assert(stop.reaction.caption.length > 20, stop.name + ' needs scene-specific context');
}
assert.equal(scenes.scenes.papdiStops.find(stop => stop.name === 'Bua ji').reaction.meme, 'control');
assert.equal(scenes.scenes.papdiStops.find(stop => stop.name === 'Gupta uncle').reaction.meme, 'confused');
assert(!source.includes('reactionBag'), 'Reactions must not be selected from a random bag');
for (const clip of Object.values(scenes.scenes.reactions)) {
  const data = fs.readFileSync(__dirname + '/' + clip.src);
  assert(data.includes(Buffer.from('ftyp')), clip.src + ' must be a real video');
  if (clip.hasAudio !== false) assert(data.includes(Buffer.from('soun')), clip.src + ' must contain its advertised audio track');
}
console.log('Passed: elapsed-time animation, bounded/batched rendering, cached glows, explicit scene mapping, and 18 reaction assets with available audio.');

assert.equal(Object.keys(scenes.scenes.reactions).length, 18);
vm.runInContext("globalThis.rotation = Array.from({length:4}, () => chooseReaction(papdiStops[0].reaction));", scenes);
assert.equal(new Set(scenes.rotation).size, 4, 'A scene must show each fitting option before repeating');

const playground = fs.readFileSync(__dirname + '/playground.js', 'utf8');
const arcContext = vm.createContext({});
const arcStart = playground.indexOf('function tossPoint('), arcEnd = playground.indexOf('function tossAt(', arcStart);
vm.runInContext(playground.slice(arcStart, arcEnd) + `
  const from = {x: 10, y: 200}, to = {x: 510, y: 200};
  globalThis.arc = [tossPoint(from, to, 0, 100), tossPoint(from, to, .5, 100), tossPoint(from, to, 1, 100)];
`, arcContext);
assert.equal(arcContext.arc[0].x, 10); assert.equal(arcContext.arc[2].x, 510);
assert(Math.abs(arcContext.arc[1].x - 260) < .001 && arcContext.arc[1].y < 110, 'Thrown patakhas must follow an elevated arc to their target');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
assert.equal((html.match(/class="cracker(?: active)?"/g) || []).length, 7, 'The playground must offer seven firecrackers');
console.log('Passed: seven firecracker controls, and cartoon throw trajectory.');


const configStart = source.indexOf('const soundClips ='), configEnd = source.indexOf('const sampleElements =');
const config = vm.runInNewContext(source.slice(configStart, configEnd) + ';({soundClips, crackerProfiles})');
assert.equal(Object.keys(config.crackerProfiles).length, 7);
assert.equal(new Set(Object.values(config.crackerProfiles).map(p => p.clip)).size, 4, 'Seven effects must share four fixed clips');
assert(!source.includes('bhide-panic') && !playground.includes('queueCrackerVoice'), 'Bhide panic and the delayed punchline phase must be removed');
for (const profile of Object.values(config.crackerProfiles)) {
  const clip = config.soundClips[profile.clip];
  assert(clip && clip.duration > 1, 'Every cracker needs a complete assigned clip');
  assert(fs.statSync(__dirname + '/' + clip.src).size > 1000, 'Every clip must exist locally');
}
assert(fs.readFileSync(__dirname + '/' + config.soundClips.diwali.src).includes(Buffer.from('soun')), 'The new Diwali greeting must contain audio');
vm.runInContext(`rockets.push({x:100,y:h-42,ground:h-42,target:50,born:92,flight:2900});animate(592);globalThis.rocketY=rockets[0].y;`, context);
assert(Number.isFinite(context.rocketY) && context.rocketY > 50 && context.rocketY < 318, 'Rocket flight must remain finite and clock-driven');
(async () => {
  const players = [], nodes = new Map();
  const runtime = vm.createContext({
    Audio: class {
      constructor(src) { this.src=src; this.paused=true; this.ended=false; this.duration=3.25; this.currentTime=0; this.plays=0; players.push(this); }
      play() { this.paused=false; this.plays++; if(this.onplaying)this.onplaying(); return Promise.resolve(); }
      pause() { this.paused=true; }
    },
    $: key => { if(!nodes.has(key))nodes.set(key,{});return nodes.get(key); },
    sound:true, volume:.45, result:[]
  });
  vm.runInContext(source.slice(configStart, source.indexOf('function add(')) + `
    playCracker('ladi', d => result.push(d));
    clipPlayers.get('babuchak').currentTime=1;
    playCracker('mirchibomb', d => result.push(d));
  `, runtime);
  await Promise.resolve();
  assert.equal(players.find(p=>p.src.includes('babuchak')).plays,1, 'Shared sounds must never restart mid-line');
  assert.deepEqual(Array.from(runtime.result),[3.25,2.25], 'Visual timing must follow actual metadata and remaining playback');
  assert.equal(players.filter(p=>p.plays).length,1, 'One clip per cracker, with no synthetic or delayed second track');
  vm.runInContext('stopSounds()',runtime);
  assert(players.every(p=>p.paused),'Explicit mute/clear must stop active sounds');
  console.log('Passed: seven fixed pairings, four real audio assets, natural clip playback, repeat-click continuity, and duration-driven choreography.');
})().catch(error => { console.error(error); process.exitCode=1; });
