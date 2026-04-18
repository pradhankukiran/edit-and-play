# edit-and-play

A tactile, broadcast-deck inspired video trimmer. 100% client-side — drop a video in, trim with draggable handles and a jog wheel, and export a real MP4 via `ffmpeg.wasm`. No upload, no backend.

Built with SvelteKit 2 + Svelte 5 (runes) and TypeScript. Deploys as a static site to Vercel.

---

## The design language

Not a generic flat editor. The entire UI is a machined console — raised metallic panels, chunky bevelled buttons, 7-segment LED timecode, segmented VU meters with ballistic decay, a weighted rotary jog wheel with inertia, and optional procedural button clicks. Think Elgato Stream Deck × Ableton Push × DaVinci Resolve's hardware panel.

All visuals are CSS + SVG — no raster textures, no design-system library, no flat-color Tailwind. Every gradient, shadow, and LED glow is hand-built against a token file.

---

## What's showcased

| Svelte / SvelteKit feature | Where |
|---|---|
| Runes (`$state` / `$derived` / `$effect` / `$props`) | All state |
| Rune classes in `.svelte.ts` files | `player`, `trim`, `export`, `ui`, `waveform` |
| `use:` actions | `draggable`, `jogwheel`, `hotkey` |
| Snippets (`{#snippet}` / `{@render}`) | `Console` children |
| Transitions (`fly`, `scale`, `fade`) | Export modal, error banner |
| SvelteKit `adapter-vercel` + prerender | Zero runtime server cost |

| Engineering feature | File |
|---|---|
| Frame thumbnail extraction (seek + canvas) | `lib/media/thumbnails.ts` |
| Audio waveform peaks (`OfflineAudioContext`) | `lib/media/waveform.ts` |
| Client-side trim via `ffmpeg.wasm` | `lib/media/ffmpeg.ts` |
| Procedural button clicks (WebAudio) | `lib/media/sfx.ts` |
| Rotary jog wheel (pointer → angle → inertia) | `lib/actions/jogwheel.ts` |
| Cross-origin isolation (COOP/COEP) for `SharedArrayBuffer` | `vite.config.ts` + `vercel.json` |

---

## Controls

| Action | Keys / Gesture |
|---|---|
| Play / pause | `Space` |
| Mark IN / OUT | `I` / `O` |
| Step 1 frame | `←` / `→` |
| Step 1 second | `Shift + ←` / `Shift + →` |
| Scrub | Drag playhead, click timeline, or use jog wheel |
| Reverse / pause / forward (2×) | `J` / `K` / `L` |
| Preview trim | `Enter` |
| Export | `E` |
| Home / End | `Home` / `End` |
| Eject current clip | STATUS → `⏏ EJECT` |
| Toggle UI sounds | STATUS → `SFX` |

---

## Running locally

```sh
pnpm install   # vendors ffmpeg core files into static/ffmpeg/ via postinstall
pnpm dev       # http://localhost:5173
```

Cross-origin isolation (COOP + COEP) is applied by a Vite plugin in `vite.config.ts` — required for `SharedArrayBuffer`, which `ffmpeg.wasm` needs.

```sh
pnpm build && pnpm preview   # validates production output locally
```

---

## Deploy to Vercel

```sh
vercel --prod
```

`vercel.json` sets COOP/COEP headers on every route and long-cache headers on `/ffmpeg/*` and `/fonts/*`. The whole app is prerendered — no serverless functions.

Supported codecs: whatever the browser's `<video>` element can decode (MP4/H.264 is the safe bet). Trim uses `-c copy` (stream copy), so cuts land on the nearest keyframe — fast but not strictly frame-accurate. A re-encode mode is out of scope for v1.

---

## Project layout

```
src/
├── routes/
│   ├── +layout.svelte          app.css import + meta
│   ├── +layout.ts              prerender = true
│   └── +page.svelte            hotkey wiring + console assembly
├── lib/
│   ├── components/             15 bespoke Svelte components
│   ├── actions/                draggable, jogwheel, hotkey
│   ├── state/                  player, trim, export, ui, waveform (rune classes)
│   ├── media/                  thumbnails, waveform, ffmpeg, sfx
│   └── styles/                 tokens.css (@theme), fonts.css, base.css
static/
├── ffmpeg/                     vendored ffmpeg-core.{js,wasm} (gitignored)
└── fonts/                      DSEG7 Classic (7-seg display font)
```
