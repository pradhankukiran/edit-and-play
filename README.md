# edit-and-play

A tactile, broadcast-deck inspired **video editor** in the browser. Drop a clip, cut multiple segments, grab still frames, drop markers, and export — with speed, aspect, and format options — all 100% client-side via `ffmpeg.wasm`. No upload, no backend.

Built with SvelteKit 2 + Svelte 5 (runes) and TypeScript. Deploys as a static site to Vercel.

---

## What it does

- **Multi-cut splice** — mark multiple IN/OUT segments, rearrange or split, concatenated on export
- **Frame grab** — capture the current frame as PNG
- **Markers** — drop timestamp markers, jump between them
- **Export options** — speed (0.5× / 1× / 2× / 4×), aspect crop (source / 16:9 / 9:16 / 1:1), mute audio, output format (MP4 / WebM / animated GIF)
- **Jog wheel scrubbing** — weighted rotary scrubber with pointer-to-angle inertia
- **7-segment timecode**, VU meters with ballistic decay, status LEDs, CPU/load indicator — all decorative but reactive

---

## The design language

Not a generic flat editor. The entire UI is a machined console — raised metallic panels, chunky bevelled buttons, 7-segment LED timecode, segmented VU meters, a weighted rotary jog wheel, and optional procedural button clicks. Think Elgato Stream Deck × Ableton Push × DaVinci Resolve's hardware panel.

All visuals are CSS + SVG — no raster textures, no design-system library, no flat-color Tailwind. Every gradient, shadow, and LED glow is hand-built against a token file.

---

## Svelte / SvelteKit showcase

| Feature | Where |
|---|---|
| Runes (`$state` / `$derived` / `$effect` / `$props`) | All state |
| Rune classes in `.svelte.ts` files | `player`, `trim`, `markers`, `export`, `ui`, `waveform` |
| `use:` actions | `draggable`, `jogwheel`, `hotkey` |
| Snippets (`{#snippet}` / `{@render}`) | `Console` children |
| Transitions (`fly`, `scale`, `fade`) | Export modal, error banner |
| SvelteKit `adapter-vercel` + prerender | Zero runtime server cost |

| Engineering feature | File |
|---|---|
| Frame thumbnail extraction | `lib/media/thumbnails.ts` |
| Audio waveform peaks (`OfflineAudioContext`) | `lib/media/waveform.ts` |
| Client-side segment concat + transcode via `ffmpeg.wasm` | `lib/media/ffmpeg.ts` |
| Frame capture (canvas drawImage) | `lib/media/framegrab.ts` |
| Procedural button/chirp sounds (WebAudio) | `lib/media/sfx.ts` |
| Rotary jog wheel (pointer → angle → inertia) | `lib/actions/jogwheel.ts` |
| Cross-origin isolation (COOP/COEP) | `vite.config.ts` + `vercel.json` |

---

## Keyboard reference

| Action | Keys |
|---|---|
| Play / pause | `Space` |
| Mark IN / OUT for current segment | `I` / `O` |
| Split segment at playhead | `S` |
| Delete selected segment | `Backspace` / `Delete` |
| Step 1 frame | `←` / `→` |
| Step 1 second | `Shift + ←` / `Shift + →` |
| Shuttle: reverse / pause@1× / forward (escalates ×2 on repeat) | `J` / `K` / `L` |
| Home / End | `Home` / `End` |
| Add marker | `M` |
| Prev / next marker | `[` / `]` |
| Clear all markers | `Shift + M` |
| Grab frame (PNG download) | `G` |
| Open export dialog | `E` |
| Preview selected segment | `Enter` |
| Close / cancel modal | `Escape` |

Scrub: drag playhead, click the timeline, or grab the jog wheel. Arrow keys nudge a focused slider (playhead or trim handle) by one frame.

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

Supported source codecs: whatever the browser's `<video>` element can decode (MP4/H.264 is the safe bet). MP4 output at 1× speed / source aspect uses `-c copy` (stream copy — fast, keyframe-bounded). Any other combo forces a re-encode; the modal shows `ENCODE` vs `COPY` live. GIF output is capped at 15fps / 480px wide because GIF encoding in WebAssembly is CPU-heavy.

---

## Project layout

```
src/
├── routes/
│   ├── +layout.svelte          app.css import + meta
│   ├── +layout.ts              prerender = true
│   └── +page.svelte            hotkey wiring + console assembly
├── lib/
│   ├── components/             bespoke Svelte components (Console, Viewport, Timeline, …)
│   ├── actions/                draggable, jogwheel, hotkey
│   ├── state/                  player, trim, markers, export, ui, waveform (rune classes)
│   ├── media/                  thumbnails, waveform, ffmpeg, framegrab, sfx
│   └── styles/                 tokens.css (@theme), fonts.css, base.css
static/
├── ffmpeg/                     vendored ffmpeg-core.{js,wasm} (gitignored, populated on install)
└── fonts/                      DSEG7 Classic (7-seg display font)
```
