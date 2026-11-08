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
const originalHashes = {
  rocket:'b576841c219ddbdaba2e2f9cbcb480f90cf4e15e4207408a4031056acd3605ad',
  bomb:'6c11b0f4c68d3fa3b5c6a1c194c24b01408b46bbd9a1e4fc1a03a29ef310fde1',
  fizz:'37f8bd34842b2db9a00a4b6d01b56cd47404a2ee34ec7d2b3a8d576de90a19d7',
  ladi:'283dfb6f8e90e0715dd2d005abb02d7513ce832ab632322d284e4fca48114d2c'
};
for (const [key, hash] of Object.entries(originalHashes)) {
  assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(__dirname + '/' + (key === 'fizz' ? 'assets/sounds/fuljadi.mp3' : config.soundClips[key].src))).digest('hex'), hash, 'Restore the exact original '+key+' recording');
}
assert.deepEqual(Array.from(Object.values(config.crackerProfiles).map(p=>p.clip)), ['rocket','fizz','ladi','bomb','bomb','bomb','bomb']);
assert(!source.includes('jethalal-diwali') && !source.includes('jetha-nonsense') && !source.includes('babuchak-chup-re'), 'Rejected audio must not be used in the playground');
const cueTasks=[], blasts=[], choreography=vm.createContext({
  h:400,w:600,reduced:true,performance:{now:()=>0},devices:[],rockets:[],flashes:[],BOMB_BLASTS:[.3,2.97],ROCKET_BURST:2.95,CHAKRI_TAIL:.6,
  later:(fn,ms)=>cueTasks.push({fn,ms}),bombBurst:(x,y)=>blasts.push({x,y}),smoke(){},shakeSky(){},
  sky:{classList:{add(){},remove(){}}}
});
vm.runInContext(source.slice(source.indexOf('function animateCracker('),source.indexOf("canvas.addEventListener('pointerdown'"))+";animateCracker(300,80,'greenbomb',3.528);",choreography);
for (const ms of [300,2970]) { const cue=cueTasks.find(t=>t.ms===ms);assert(cue,'Each recorded bomb bang needs an exact visual cue');cue.fn(); }
assert.equal(blasts.length,2,'The original two-bomb track must produce two major impacts');
vm.runInContext("animateCracker(300,80,'rocket',4.032);",choreography);
assert.equal(choreography.rockets[0].flight,2950,'Rocket must burst on the original recorded bang');
// Chakri keeps its original spin length, with audio covering the 36-frame spark tail.
cueTasks.length=0;
vm.runInContext("animateCracker(300,80,'chakri',2.64);",choreography);
const lastSparkEnd = Math.max(...cueTasks.map(t=>t.ms)) + 36 * 16.67;
assert(lastSparkEnd <= config.soundClips.fizz.duration*1000 && lastSparkEnd > 2500, 'Chakri audio must cover every final spark without shortening the spin');
const sizzle=fs.readFileSync(__dirname+'/'+config.soundClips.fizz.src);
assert.equal(sizzle.toString('ascii',0,4),'RIFF');
assert.equal(sizzle.toString('ascii',8,12),'WAVE');
const pcm=sizzle.subarray(44), rate=sizzle.readUInt32LE(24), channels=sizzle.readUInt16LE(22);
assert.equal(pcm.length/(rate*channels*2),2.64,'The extended sizzle must last through the spark tail');
function sizzleRms(from,to){let sum=0,n=0;for(let i=Math.floor(from*rate)*channels*2;i<Math.floor(to*rate)*channels*2;i+=2){sum+=pcm.readInt16LE(i)**2;n++;}return Math.sqrt(sum/n);}
assert(sizzleRms(2.54,2.64)<sizzleRms(1.8,1.9)*.1,'Chakri must fade smoothly to silence instead of cutting out');
assert.equal(pcm.readInt16LE(pcm.length-2),0,'The final audio sample must end at silence');
vm.runInContext(`rockets.push({x:100,y:h-42,ground:h-42,target:50,born:92,flight:2900});animate(592);globalThis.rocketY=rockets[0].y;`, context);
assert(Number.isFinite(context.rocketY) && context.rocketY > 50 && context.rocketY < 318, 'Rocket flight must remain finite and clock-driven');
// Verify the actual emitted shapes have different geometry and preserve rendering caps.
const blastCode=source.slice(source.indexOf('function bombBurst('),source.indexOf('function launch('));
vm.runInContext(blastCode + `
  function shakeSky() {}
  sky.classList.add=()=>{};
  globalThis.bombShapes={};
  for(const type of ['greenbomb','mirchibomb','sutlibomb','diwalibomb']){
    particles=[];shockwaves=[];flashes=[];
    bombBurst(300,300,type);
    bombShapes[type]={sparks:particles.filter(p=>!p.smoke),smoke:particles.filter(p=>p.smoke).length,rings:shockwaves.slice()};
  }
`,context);
const shapes=context.bombShapes;
assert(shapes.greenbomb.rings.every(r=>r.squash===1) && shapes.greenbomb.sparks.some(p=>p.vy>0),'Green bomb needs a round pressure sphere');
assert.equal(shapes.mirchibomb.rings.length,0,'Mirchi must avoid the generic circular shockwave');
assert(shapes.mirchibomb.sparks.every(p=>p.vy<0),'Mirchi must launch its fans upward');
assert(shapes.sutlibomb.rings.every(r=>r.squash<=.3) && shapes.sutlibomb.smoke>=6,'Sutli needs flat ground waves and a dusty plume');
assert(new Set(shapes.diwalibomb.sparks.map(p=>Math.round(p.x))).size>=7 && shapes.diwalibomb.sparks.every(p=>p.life>=112),'Diwali special needs separated, long-lived willow lobes');
for(const shape of Object.values(shapes)) assert(shape.sparks.length+shape.smoke<=1000,'Distinct bombs must respect the existing particle cap');
console.log('Passed: four different bomb silhouettes and physics with bounded particle counts.');
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
    clipPlayers.get('ladi').currentTime=1;
    playCracker('ladi', d => result.push(d));
  `, runtime);
  await Promise.resolve();
  const played=players.filter(p=>p.plays);
  assert.equal(played.length,2,'Repeated launches must each play the original recording');
  assert.equal(played[0].currentTime,1,'A new launch must not rewind an existing recording');
  assert.equal(played[1].currentTime,0,'A new launch must start its own complete recording');
  assert.deepEqual(Array.from(runtime.result),[3.25,3.25],'Each visual effect must use the full loaded clip duration');
  for(let i=0;i<12;i++) vm.runInContext("playCracker('ladi',()=>{})",runtime);
  assert.equal(players.filter(p=>p.plays).length,8,'Rapid launches must bound concurrent playback without stopping active recordings');
  vm.runInContext('stopSounds()',runtime);
  assert(players.every(p=>p.paused),'Explicit mute/clear must stop active sounds');
  console.log('Passed: original recordings preserved, Chakri sizzle covering final sparks with a smooth fade, recorded blast timing, complete repeat-click playback, and bounded audio concurrency.');
})().catch(error => { console.error(error); process.exitCode=1; });
