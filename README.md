# Diwali After Dark 🪔

**Play live:** https://hi-ashutosh.github.io/diwali-after-dark/

A royal, very unserious Diwali playground. Vanilla HTML, CSS, Canvas, and JavaScript. No database, build step, API keys, or npm dependencies.

## Play

- **Patakha lab:** select Rocket, Anaar, Chakri, Ladi, or Bomb and tap the sky. Each effect behaves differently. “The whole mohalla” launches a finale. Firecracker sound is opt-in. Rocket, Anaar (fuljadi), Ladi, and Bomb play real recordings from `assets/sounds/`, always played in full, with the animation choreographed to each recording: the rocket climbs through the launch whoosh and bursts on the bang at 2.95s, then crackles with the tail; each bomb's fuse fizzes up to its bang (0.3s and 2.97s), which flashes and shakes the sky; the anaar and ladi run exactly as long as their 2-second recordings. Chakri and the remaining effects use layered Web Audio synthesis with stereo positioning. Opening `index.html` straight from disk falls back to plain `<audio>` playback. The volume slider controls firecrackers and reaction-video audio. The finale opens with an immediate three-rocket volley and a compact crescendo. The renderer uses cached glows, batched trails, a device-aware particle budget, and elapsed-time physics to avoid slow motion under load.
- **Haath wala anaar:** Chhotu tries to light an anaar in his hand. “See what happens” swaps the illustration for the “Hipal lightiya” meme (`assets/hipal-lightiya.mp4`), which starts instantly with sound. The clip is cropped to the short and trimmed so there is no dead air before or after; “Watch again” replays it.
- **Soan Papdi Multiverse:** follow a gift through five randomly selected recipients from a cast of twelve. Each reset shuffles the order and guarantees a different first recipient. Each joke has a curated pool of fitting reaction clips and a scene-specific caption. Least-recently-used selection reduces repetition across games, and “Another take” cycles through the current scene’s fitting alternatives. Endings change between trips.
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

Rooftop characters are original inline SVG artwork. Rocket, fuljadi, ladi, and bomb sounds are local MP3 recordings in `assets/sounds/`; chakri is synthesized. Reaction dialogue comes from the local video clips.

The bonus/soan-papdi scenario was inspired by current Diwali gifting chatter; the jokes and interactive scenarios are original:
- https://www.ndtvprofit.com/trending/diwali-gifts-viral-video-shows-office-employees-getting-air-fryers-still-getting-soan-papdi-resign-12260442

No analytics, cookies, or user data storage.

## Regression checks

With Node installed, run `node checks.cjs`. Checks cover real elapsed time after dropped frames, bounded and batched rendering, cached glow sprites, contextual reaction assignments, and all 18 reaction assets, available audio tracks, and contextual rotation before repetition.
