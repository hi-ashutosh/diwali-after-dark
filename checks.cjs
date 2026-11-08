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
  assert(stop.reaction.caption.length > 20, stop.name + ' needs scene-specific context');
}
assert.equal(scenes.scenes.papdiStops.find(stop => stop.name === 'Bua ji').reaction.meme, 'control');
assert.equal(scenes.scenes.papdiStops.find(stop => stop.name === 'Gupta uncle').reaction.meme, 'confused');
assert(!source.includes('reactionBag'), 'Reactions must not be selected from a random bag');
for (const clip of Object.values(scenes.scenes.reactions)) {
  const data = fs.readFileSync(__dirname + '/' + clip.src);
  assert(data.includes(Buffer.from('soun')), clip.src + ' must contain an audio track');
}
console.log('Passed: elapsed-time animation, bounded/batched rendering, cached glows, explicit scene mapping, and four audio tracks.');
