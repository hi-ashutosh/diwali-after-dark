# Diwali After Dark 🪔

**Play live:** https://hi-ashutosh.github.io/diwali-after-dark/

A royal, very unserious Diwali playground. Vanilla HTML, CSS, Canvas, and JavaScript. No database, build step, API keys, or npm dependencies.

## Play

- **Patakha lab:** seven visual effects with Dharmik’s four cracker recordings. Rocket uses `rocket.mp3`, Chakri uses `chakri-sizzle.wav`, a 2.64-second extension of the same `fuljadi.mp3` sizzle with crossfaded sustain and a 0.6-second fade for the final sparks, Ladi uses `ladi.mp3`, and all four bomb variants use `bomb.mp3`. Every launch plays its recording from the beginning without interrupting earlier launches (up to eight simultaneous recordings). Rocket bursts at 2.95 seconds; the bombs blast at 0.30 and 2.97 seconds. Whole mohalla shares one Rocket recording and synchronizes its volley to that bang. Improved visuals, fuse bodies, shock rings, smoke, rooftop lighting and cartoon throws are retained. No Happy Diwali singing, Nonsense, Babuchak, Bhide panic or delayed dialogue track in the playground.
- **Soan Papdi Multiverse:** follow a gift through five randomly selected recipients from a cast of twelve. Each reset shuffles the order and guarantees a different first recipient. Each joke has a curated pool of fitting reaction clips and a scene-specific caption. Least-recently-used selection reduces repetition across games, and “Another take” cycles through the current scene’s fitting alternatives. Endings change between trips.
- **Chhat fights:** choose Chintu, Sharma ji, or Pooja as your thrower, select a patakha, and tap a rooftop rival. Cartoon packets follow an arc; characters jump, complain, and optionally throw a chakri back once. This is a solo browser game with NPC characters. The counter tracks successful pranks.
- **Big screen / Surprise me / Breeze:** expand the arena, launch a random effect, or let the wind bend your sparks. Escape exits big-screen mode.
- **The chhat gang:** click Sharma ji, Chintu, and Pooja for rooftop commentary. They sway, wave, film, and dance as fireworks launch. Milestone counts unlock society-committee complaints.
- **Family WhatsApp:** choose your reply and face the consequences.
- **Corporate bonus:** five escalating HR disappointments, with a Hera Pheri reaction GIF.
- **Share:** native sharing on supported devices; clipboard fallback elsewhere.

## Run locally

Open `index.html` directly, or serve the directory:

```sh
python3 -m http.server 8080
```

Visit http://localhost:8080. No installation required.

## GitHub Pages

Published from `main`, repository root, at https://hi-ashutosh.github.io/diwali-after-dark/. Push changes to `main` to redeploy automatically.

Repository: https://github.com/hi-ashutosh/diwali-after-dark

All local asset links are relative, so project subpaths work. `.nojekyll` disables Jekyll processing. No secrets or backend services are needed.

## Design & accessibility

Aubergine, vermilion, antique gold, and sage; original CSS illustrations; a rooftop skyline; Google Fonts (Yatra One and DM Sans) with system fallbacks. Keyboard-operable controls, native modal focus management, visible focus outlines, reduced-motion support, and audio enabled by default with a mute toggle (playback starts on interaction, subject to browser policy). Large particle sequences are capped. The site pauses animation in background tabs.

## External content

The reaction library contains 18 local MP4 clips, 16 with their original audio. Two TMKOC reactions are silent and clearly labeled. New clips are trimmed to six seconds or less. They play once per reveal, support replay and sound toggles, and stop when the card closes or the tab is hidden. Reduced-motion visitors opt into playback. Fonts retain system fallbacks, and failed videos display the reaction text.

Clip sources (also credited beside each reaction):

- Control Uday / Welcome: https://templates.meme/templates/control-uday — frustrating relatives and disappointing HR news.
- Yeh kya hai? / CarryMinati: https://templates.meme/templates/yeh-kya-hai — confusing gift labels, circular regifting, and fake gifts.
- Paisa barbad / CarryMinati: https://templates.meme/templates/paisa-barbad — the ₹101 bonus requiring a ₹999 purchase.
- Abhi maza ayega / Phir Hera Pheri: https://templates.meme/templates/abhi-maza-ayega-na-bhidu — finally opening the mithai with chai.

Additional clips:

- Bhide’s dramatic reunion · TMKOC: https://templates.meme/templates/bhide-crying
- Gajab bejjati · Panchayat: https://templates.meme/templates/gajab-bejjati-hai-yaar
- Kaisa laga mera mazak · The Kapil Sharma Show: https://templates.meme/templates/kaisa-laga-mera-mazak
- Kuch samjhe Daya · CID: https://templates.meme/templates/kuch-samjhe-daya
- Nahi main nahi maanta · Khatta Meetha: https://templates.meme/templates/nahi-main-nahi-maanta
- Main nahi manta · Welcome: https://templates.meme/templates/nahi-main-nahi-manta
- Aurat ka chakkar · Hera Pheri: https://templates.meme/templates/aurat-ka-chakkar
- Are Deva! · Hera Pheri: https://templates.meme/templates/are-deva-yeh-toh-gadbad-hai-baba
- Jaldi bol · Golmaal: https://templates.meme/templates/jaldi-bol-kal-subah-panvel-nikalna-hai
- Practical nahi hai · Nayak: https://templates.meme/templates/sunne-mein-acha-hai
- Kehna kya chahte ho · 3 Idiots: https://templates.meme/templates/kehna-kya-chahte-ho
- Dil garden garden · Indian viral classic: https://templates.meme/templates/dil-garden-garden-ho-riya-hai
- Jethalal’s shocked face · TMKOC: https://tenor.com/view/jethalal-jethalal-shocked-shocked-face-reaction-what-what-what-gif-19739068
- Daya’s celebration · TMKOC: https://tenor.com/view/garba-daya-gif-26821643

Rooftop characters and bomb icons are original inline SVG artwork. Dharmik’s original MP3 recordings are retained in the repository; the active seven-cracker tray uses those original four MP3 recordings without edits or dialogue overlays.

The bonus/soan-papdi scenario was inspired by current Diwali gifting chatter; the jokes and interactive scenarios are original:
- https://www.ndtvprofit.com/trending/diwali-gifts-viral-video-shows-office-employees-getting-air-fryers-still-getting-soan-papdi-resign-12260442

No analytics, cookies, or user data storage.

## Regression checks

With Node installed, run `node checks.cjs`. Checks cover real elapsed time after dropped frames, bounded and batched rendering, cached glow sprites, contextual reaction assignments, and all 18 reaction assets, available audio tracks, contextual rotation, seven firecracker controls, throw trajectories, clip metadata timing, and uninterrupted recordings on repeated clicks and restored blast timings.

Recorded firecracker audio and Bomb choreography adapted from Dharmik’s commits `87ef472` and `9669cad`, retaining the expanded arena and cartoon toss mode.

Green bomb and the three new bomb variants use the original two-bomb recording, with both visual impacts timed to its bangs. Their silhouettes differ: Green has round emerald/cyan pressure shells; Mirchi has five upward red comet fans; Sutli has a white-hot ground punch, flat expanding dust rings and a smoky plume; Diwali special has a high, falling golden willow canopy. All crackers have thicker double-stroked trails, larger coloured spark heads and white-hot cores, with the same particle caps and cached glow rendering. Original icons and improved blast effects preserve reduced-motion support and the particle budget.

## Original firecracker audio

Four unchanged recordings were contributed by DBMistry-Git on `dharmik-dev`, commits `87ef472` and `9669cad`: `rocket.mp3`, `bomb.mp3`, `fuljadi.mp3`, and `ladi.mp3` under `assets/sounds/`. Rocket, Bomb and Ladi use these files unchanged. Chakri uses a derived 2.64-second WAV: the original attack, an extended middle with 80ms crossfades, and a 600ms fade synchronized with the final sparks. The original `fuljadi.mp3` remains unchanged. Later experimental dialogue clips are retained on disk but are not used by the firecrackers. The separate 18-clip meme games are unchanged.
