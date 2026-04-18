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
