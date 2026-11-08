# Diwali After Dark 🪔

**Play live:** https://hi-ashutosh.github.io/diwali-after-dark/

A royal, very unserious Diwali playground. Vanilla HTML, CSS, Canvas, and JavaScript. No database, build step, API keys, or npm dependencies.

## Play

- **Patakha lab:** select Rocket, Anaar, Chakri, or Ladi and tap the sky. Each effect behaves differently. “The whole mohalla” launches a finale. Sound is opt-in and generated with Web Audio.
- **Soan Papdi Multiverse:** follow a gift through six households and make a historic decision.
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

The site works without external media; fonts fall back and GIF failures hide the image gracefully. The Hera Pheri GIF is served by GIPHY and credited in the interface: https://giphy.com/gifs/GrowthX-Club-joke-babu-rao-mast-mara-Dt4ReTH8TrUkB2WWbV

The bonus/soan-papdi scenario was inspired by current Diwali gifting chatter; the jokes and interactive scenarios are original:
- https://www.ndtvprofit.com/trending/diwali-gifts-viral-video-shows-office-employees-getting-air-fryers-still-getting-soan-papdi-resign-12260442

No analytics, cookies, or user data storage.
