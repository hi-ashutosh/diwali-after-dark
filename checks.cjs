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
assert.equal((html.match(/class="cracker(?: active)?"/g) || []).length, 4, 'The playground must offer four focused firecrackers');
console.log('Passed: four focused firecracker controls, and cartoon throw trajectory.');

const soundMap = source.match(/const samples = (\{[^}]+\})/);
assert(soundMap, 'Recorded firecracker sounds must be declared in one map');
const sampleFiles = vm.runInNewContext('(' + soundMap[1] + ')');
for (const type of ['rocket', 'ladi', 'greenbomb']) {
  assert(sampleFiles[type], type + ' needs a recorded sound');
  const data = fs.readFileSync(__dirname + '/' + sampleFiles[type]);
  assert(data.subarray(0, 3).equals(Buffer.from('ID3')) || (data[0] === 0xff && (data[1] & 0xe0) === 0xe0), sampleFiles[type] + ' must be a real MP3');
}
assert(fs.readFileSync(__dirname + '/index.html', 'utf8').includes('data-type="greenbomb"'), 'The tray needs its focused Green bomb button');


assert(source.includes('source.start(audio.currentTime);'), 'Recordings must start without being cut to synthetic effect durations');
console.log('Passed: recorded Rocket, Ladi and Green bomb audio assets.');

assert(fs.readFileSync(__dirname + '/assets/sounds/bhide-reaction.m4a').includes(Buffer.from('ftyp')), 'The TMKOC punchline needs a real audio asset');

vm.runInContext(`rockets.push({x:100,y:h-42,ground:h-42,target:50,born:92,flight:ROCKET_BURST*1000});animate(592);globalThis.rocketY=rockets[0].y;`, context);
assert(Number.isFinite(context.rocketY) && context.rocketY > 50 && context.rocketY < 318, 'Recorded rocket choreography must remain finite and rise toward its target');

const voiceStart = playground.indexOf('const crackerVoices ='), voiceEnd = playground.indexOf('const crackerVoicePlayer',voiceStart);
const voiceConfig = vm.runInNewContext(playground.slice(voiceStart,voiceEnd)+';crackerVoices');
assert.deepEqual(Object.keys(voiceConfig).sort(), ['chakri','greenbomb','ladi','rocket']);
assert.equal(new Set(Object.values(voiceConfig).map(v=>v.src)).size, 4, 'Each cracker needs a distinct TMKOC reaction');
for (const voice of Object.values(voiceConfig)) assert(fs.statSync(__dirname+'/'+voice.src).size > 1000, 'Every fixed TMKOC voice must have a local audio file');
assert(voiceConfig.ladi.caption.includes('chup re') && voiceConfig.greenbomb.caption.includes('Mataji'), 'The noisy ladi and big bomb must retain their matched reactions');
console.log('Passed: all four active crackers have unique, fixed, local TMKOC punchlines.');

const voiceNodes = new Map(), voiceTasks = [], fakePlayers = [];
const voiceRuntime = vm.createContext({
  Audio: class {constructor(){this.playCount=0;fakePlayers.push(this);} play(){this.playCount++;return Promise.resolve();} pause(){this.paused=true;}},
  $: key => {if(!voiceNodes.has(key))voiceNodes.set(key,{});return voiceNodes.get(key);},
  sound:true, volume:.45, timers:new Set(), clearTimeout(){},setSound(){},
  later: (fn,ms)=>{voiceTasks.push({fn,ms});return voiceTasks.length;}
});
vm.runInContext(playground.slice(voiceStart)+";queueCrackerVoice('ladi');queueCrackerVoice('greenbomb');", voiceRuntime);
voiceTasks.sort((a,b)=>a.ms-b.ms).forEach(task=>task.fn());
assert.equal(fakePlayers[0].playCount,1,'TMKOC voices must not overlap when crackers are clicked rapidly');
assert(fakePlayers[0].src.includes('babuchak-chup-re'));
fakePlayers[0].onended();
assert.equal(fakePlayers[0].playCount,2);assert(fakePlayers[0].src.includes('hey-ma-mataji'));
vm.runInContext('stopCrackerVoice()',voiceRuntime);assert(fakePlayers[0].paused,'Mute and clear must stop the funny audio');
console.log('Passed: matched dialogue queues without overlap and stops on clear/mute.');
