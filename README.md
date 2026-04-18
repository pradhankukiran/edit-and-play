<div align="center">

<img src="src/lib/assets/favicon.svg" width="110" alt="edit-and-play" />

# EDIT·AND·PLAY

**A tactile, broadcast-deck inspired video editor in the browser.**
Cut multi-segments, grab frames, drop markers, and export MP4 / WebM / animated GIF —
100% client-side through `ffmpeg.wasm`. No upload, no backend.

<br />

[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)](https://svelte.dev)
[![SvelteKit 2](https://img.shields.io/badge/SvelteKit-2-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)](https://svelte.dev/docs/kit)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![FFmpeg.wasm](https://img.shields.io/badge/ffmpeg-WebAssembly-007808?style=for-the-badge&logo=ffmpeg&logoColor=white)](https://ffmpegwasm.netlify.app/)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

![Client-side](https://img.shields.io/badge/100%25_client--side-no_backend-7DFF8F?style=flat-square&labelColor=0e0f10&color=7DFF8F)
![COOP/COEP](https://img.shields.io/badge/COOP%2FCOEP-SharedArrayBuffer-FFB400?style=flat-square&labelColor=0e0f10&color=FFB400)
![Design](https://img.shields.io/badge/UI-hand--built_tokens-FF2B1C?style=flat-square&labelColor=0e0f10&color=FF2B1C)

</div>

---

## ▶ &nbsp;PREVIEW

```text
┌─ [ EDIT·AND·PLAY ] ───────────────────────────────── [●PWR] ┐
│                                                             │
│  ┌─ [ VIEWPORT ] ─────────────────────┐  ┌─ [ STATUS ] ──┐  │
│  │                                    │  │  T/C          │  │
│  │        (video / drop zone)         │  │  ██:██:██:██  │  │
│  │                                    │  │               │  │
│  └────────────────────────────────────┘  │  L ▓▓▓░░░░░░░ │  │
│   ▼   ▼   ▼       ▼  MARKERS             │  R ▓▓░░░░░░░░ │  │
│  ╔═[ TIMELINE ]════════════════════════╗ │               │  │
│  ║█▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║ │  ●REC  ●RDY   │  │
│  ║▂▃▂▄▂▃▂▅▂▃▂▄▂▃▂▅▂▃▂▄▂▃▂▅▂▃▂▄▂▃▂▅▂▃▂▄║ │  MUTE SFX EJCT│  │
│  ║  │I█████O│       │I████O│           ║ │               │  │
│  ╚═════════════════════════════════════╝ │  DUR  SEL  MRK│  │
│                                          ├───[ TRANSPORT ]┤  │
│                                          │               │  │
│                                          │  ◀◀  ▶  ▶▶    │  │
│                                          │   IN ✂ OUT    │  │
│                                          │     DEL       │  │
│                                          │     GRAB      │  │
│                                          │   [ EXPORT ]  │  │
│                                          │               │  │
│                                          │      ◉        │  │
│                                          │      JOG      │  │
│                                          └───────────────┘  │
│                                                             │
└─ serial 00-016-0000-A ────────────────────── ffmpeg.wasm ───┘
```

---

## ◉ &nbsp;WHAT IT DOES

- **Multi-cut splice** — mark any number of IN/OUT segments, rearrange and split them on the timeline, concatenated on export
- **Frame grab** — capture the current frame as PNG with SMPTE-timecoded filename
- **Markers** — drop timestamp markers, jump between them with `[` and `]`, clear with one key
- **Export options** — speed `0.5× · 1× · 2× · 4×`, aspect crop `source · 16:9 · 9:16 · 1:1`, mute audio, output as **MP4 / WebM / animated GIF**
- **Jog wheel scrubbing** — weighted rotary scrubber with pointer-to-angle inertia decay
- **Frame-accurate thumbnail strip**, audio waveform, 7-segment timecode, VU meters with ballistic decay
- **Keyboard-first** — full JKL shuttle, mark/split/delete/grab/marker shortcuts, arrow-key frame nudging on focused sliders

---

## ● &nbsp;THE DESIGN LANGUAGE

Not a generic flat editor. The UI is a machined console —
**raised metallic panels · chunky bevelled buttons · 7-segment LED timecode · segmented VU meters · weighted rotary jog wheel · procedural click sounds.**
Think *Elgato Stream Deck × Ableton Push × DaVinci Resolve's control surface.*

Everything is CSS + SVG. No raster textures, no design-system library, no flat-color Tailwind.
Every gradient, shadow, and LED glow is hand-built against `src/lib/styles/tokens.css`.

---

## ◐ &nbsp;WHAT'S SHOWCASED

| **Svelte 5 / SvelteKit feature** | **Where** |
|---|---|
| Runes (`$state` / `$derived` / `$effect` / `$props`) | All state modules |
| Rune classes in `.svelte.ts` | `player` · `trim` · `markers` · `export` · `ui` · `waveform` |
| `use:` actions | `draggable` · `jogwheel` · `hotkey` |
| Snippets (`{#snippet}` / `{@render}`) | `Console` body |
| Transitions (`fly` · `scale` · `fade`) | Export modal · error banner |
| SvelteKit `adapter-vercel` + `prerender` | Zero runtime server cost |

| **Engineering feature** | **File** |
|---|---|
| Frame thumbnail extraction | `lib/media/thumbnails.ts` |
| Audio waveform peaks (`OfflineAudioContext`) | `lib/media/waveform.ts` |
| Multi-segment trim + concat + transcode via `ffmpeg.wasm` | `lib/media/ffmpeg.ts` |
| Frame capture via `canvas.drawImage` | `lib/media/framegrab.ts` |
| Procedural button / chirp sounds (WebAudio) | `lib/media/sfx.ts` |
| Rotary jog wheel (pointer → angle → inertia) | `lib/actions/jogwheel.ts` |
| Cross-origin isolation for `SharedArrayBuffer` | `vite.config.ts` + `vercel.json` |

---

## ⎉ &nbsp;CONTROLS

| **Action** | **Keys** |
|---|---|
| Play / pause | `Space` |
| Mark IN / OUT on active segment | `I` / `O` |
| Split segment at playhead | `S` |
| Delete selected segment | `Backspace` / `Delete` |
| Step 1 frame | `←` / `→` |
| Step 1 second | `Shift + ←` / `Shift + →` |
| Shuttle: reverse / pause@1× / forward (escalates ×2 on repeat) | `J` / `K` / `L` |
| Jump to start / end | `Home` / `End` |
| Add marker | `M` |
| Prev / next marker | `[` / `]` |
| Clear all markers | `Shift + M` |
| Grab frame (PNG download) | `G` |
| Open export dialog | `E` |
| Preview selected segment | `Enter` |
| Close / cancel modal | `Escape` |

Scrub by: dragging the playhead, clicking the timeline, or grabbing the jog wheel.
Arrow keys nudge a focused slider (trim handle or playhead) by one frame.

---

## ⏵ &nbsp;RUN LOCALLY

```bash
pnpm install       # vendors ffmpeg-core.{js,wasm} into static/ffmpeg/ via postinstall
pnpm dev           # http://localhost:5173
```

Cross-origin isolation (COOP + COEP) is enforced by a custom Vite plugin in `vite.config.ts` —
required for `SharedArrayBuffer`, which `ffmpeg.wasm` needs.

```bash
pnpm build && pnpm preview   # production bundle smoke test
```

---

## ▲ &nbsp;DEPLOY

```bash
vercel --prod
```

`vercel.json` sets COOP/COEP headers on every route and long-cache headers on `/ffmpeg/*` and `/fonts/*`.
The whole app is prerendered — **no serverless functions**, static site only.

**Source codec support:** whatever the browser's `<video>` element can decode (MP4/H.264 is the safe bet).
**Fast path:** MP4 · 1× · source aspect → stream-copy (`-c copy`), finishes in under a second.
**Re-encode path:** any other combo forces `libx264`/`libvpx-vp9`/GIF two-pass — the modal's `ENCODE/COPY` badge tells you which.
**GIF output** is capped at 15 fps / 480 px wide (WASM encoding is CPU-heavy).

---

## ▦ &nbsp;PROJECT LAYOUT

```text
src/
├── routes/
│   ├── +layout.svelte          app.css import + meta
│   ├── +layout.ts              prerender = true
│   └── +page.svelte            hotkey wiring + console assembly
├── lib/
│   ├── components/             Console · Viewport · Timeline · TransportBar · StatusStrip
│   │                           TrimHandle · Playhead · JogWheel · VUMeter · LED
│   │                           ExportModal · DropZone · ErrorBanner · Timecode · KnobButton
│   ├── actions/                draggable · jogwheel · hotkey
│   ├── state/                  player · trim · markers · export · ui · waveform  (rune classes)
│   ├── media/                  thumbnails · waveform · ffmpeg · framegrab · sfx
│   └── styles/                 tokens.css (@theme) · fonts.css · base.css
static/
├── ffmpeg/                     vendored ffmpeg-core.{js,wasm}  (gitignored)
└── fonts/                      DSEG7 Classic (7-seg display face)
```

---

<div align="center">

```text
╔════════════════════════════════════════════════════════════╗
║   EDIT·AND·PLAY · MODEL 016 · POST SUITE                   ║
║   serial 00-016-0000-A                        ffmpeg.wasm  ║
╚════════════════════════════════════════════════════════════╝
```

**Built as a portfolio piece for a Svelte + video-editor role.**
Source is MIT-licensable by the author on request.

</div>
