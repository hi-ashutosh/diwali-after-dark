# Diwali After Dark 🪔

**Play live:** https://hi-ashutosh.github.io/diwali-after-dark/

A royal, very unserious Diwali playground. Vanilla HTML, CSS, Canvas, and JavaScript. No database, build step, API keys, or npm dependencies.

## Play

- **Patakha lab:** select Rocket, Anaar, Chakri, or Ladi and tap the sky. Each effect behaves differently. “The whole mohalla” launches a finale. Sound is opt-in and generated with layered Web Audio: rocket whistles, ignition hiss, pressure thumps, stereo positioning, echoes, and crackling tails. The volume slider controls all effects.
- **Soan Papdi Multiverse:** follow a gift through five randomly selected recipients from a cast of twelve. Each reset shuffles the order and guarantees a different first recipient. Reaction GIFs cycle through a shuffled deck without immediate repeats, and endings change between trips.
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

The site works without external media; fonts fall back and failed GIFs display an original text meme. Reduced-motion visitors can choose whether to play reaction GIFs. Indian reaction GIFs are hotlinked from Tenor and individually credited in the interface:

- Jethalal shocked: https://tenor.com/view/jethalal-jethalal-shocked-shocked-face-reaction-what-what-what-gif-19739068
- Phir Hera Pheri: https://tenor.com/view/paisa-hi-paisa-hoga-gif-22249471
- Welcome / Control Uday: https://tenor.com/en-IN/view/control-control-uday-control-uday-control-welcome-bas-kar-gif-13094741744719698430
- Welcome / Miracle: https://tenor.com/view/miracle-miracle-miracle-saloniie-akshay-kumar-welcome-gif-14491263

Rooftop characters are original inline SVG artwork. Firecracker sounds are synthesized; no audio downloads or recordings are needed.

The bonus/soan-papdi scenario was inspired by current Diwali gifting chatter; the jokes and interactive scenarios are original:
- https://www.ndtvprofit.com/trending/diwali-gifts-viral-video-shows-office-employees-getting-air-fryers-still-getting-soan-papdi-resign-12260442

No analytics, cookies, or user data storage.
