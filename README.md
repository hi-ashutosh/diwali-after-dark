# Diwali After Dark 🪔

**Play live:** https://hi-ashutosh.github.io/diwali-after-dark/

A royal, very unserious Diwali playground. Vanilla HTML, CSS, Canvas, and JavaScript. No database, build step, API keys, or npm dependencies.

## Play

- **Patakha lab:** seven effects with four fixed, local TMKOC sound clips. Rocket and Diwali special use Jethalal’s actual Diwali-firecracker gag; Chakri and Sutli bomb use “Nonsense”; Ladi and the triple-burst Mirchi bomb use “Babuchak, chup re”; Green bomb uses “Hey Maa Mataji.” Each effect starts with its one full clip, using its loaded duration. Repeated clicks share the remaining clip without cutting/restarting it. Whole mohalla plays one Diwali track for the volley. No physical-sound-to-punchline transition or Bhide panic. New fuse bodies, layered flower bursts, shock rings, ground sparks and rooftop lighting stay within the adaptive particle budget. Mute, Clear sky and backgrounding stop playback.
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

Aubergine, vermilion, antique gold, and sage; original CSS illustrations; a rooftop skyline; Google Fonts (Yatra One and DM Sans) with system fallbacks. Keyboard-operable controls, native modal focus management, visible focus outlines, reduced-motion support, and opt-in audio. Large particle sequences are capped. The site pauses animation in background tabs.

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

Rooftop characters and bomb icons are original inline SVG artwork. Dharmik’s original MP3 recordings are retained in the repository; the active seven-cracker tray uses the four complete TMKOC clips credited below, with no additional synthesized soundtrack.

The bonus/soan-papdi scenario was inspired by current Diwali gifting chatter; the jokes and interactive scenarios are original:
- https://www.ndtvprofit.com/trending/diwali-gifts-viral-video-shows-office-employees-getting-air-fryers-still-getting-soan-papdi-resign-12260442

No analytics, cookies, or user data storage.

## Regression checks

With Node installed, run `node checks.cjs`. Checks cover real elapsed time after dropped frames, bounded and batched rendering, cached glow sprites, contextual reaction assignments, and all 18 reaction assets, available audio tracks, contextual rotation, seven firecracker controls, throw trajectories, clip metadata timing, and uninterrupted repeated-click playback.

Recorded firecracker audio and Bomb choreography adapted from Dharmik’s commits `87ef472` and `9669cad`, retaining the expanded arena and cartoon toss mode.

Green bomb now uses one complete Daya clip during its blast. Mirchi bomb adds three red bursts, Sutli adds ground shock rings and smoke, and Diwali special adds a gold flower crown. Visible fuses, brighter cores, multi-ring impacts and rooftop lighting preserve reduced-motion support and the particle budget.

## Fixed TMKOC firecracker audio

- Rocket / Diwali special → Jethalal’s original Diwali-firecracker gag (full 5.64-second clip, audio extracted without trimming): https://humornama.com/memes/happy-diwali-jethalal-meme/
- Chakri / Sutli bomb → Jetha Nonsense: https://www.voicy.network/sounds/XHcruaKeSk__6B55fQnDqQ-jetha-nonsense
- Ladi / Mirchi bomb → Babuchak Chup re: https://www.voicy.network/sounds/1V9zV295Vkyey32Du_vq-A-babuchak-chup-re
- Green bomb → Hey Ma Mataji: https://www.voicy.network/sounds/JLIVv7szYU_HATFNCklWGw-hey-ma-mataji

The three short Voicy uploads are credited to Chilas; dialogue comes from TMKOC. Each pairing is intentional, without random funny-audio selection. The four sound clips are shared across seven distinct visual effects. Existing audio assets are retained for collaborator work.
