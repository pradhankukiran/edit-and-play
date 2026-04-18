<script lang="ts">
	import { player } from '$lib/state/player.svelte';
	import { trim } from '$lib/state/trim.svelte';
	import { markers } from '$lib/state/markers.svelte';
	import { extractThumbnails, releaseThumbs, type Thumb } from '$lib/media/thumbnails';
	import { extractWaveform } from '$lib/media/waveform';
	import { waveform } from '$lib/state/waveform.svelte';
	import TrimHandle from './TrimHandle.svelte';
	import Playhead from './Playhead.svelte';
	import { onDestroy, untrack } from 'svelte';

	function formatSMPTE(t: number, fps: number): string {
		const v = Math.max(0, t);
		const hh = Math.floor(v / 3600);
		const mm = Math.floor((v % 3600) / 60);
		const ss = Math.floor(v % 60);
		const ff = Math.floor((v % 1) * fps);
		return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
	}

	function onMarkerClick(e: MouseEvent, time: number) {
		e.stopPropagation();
		player.seek(time);
	}

	function onMarkerContextMenu(e: MouseEvent, id: string) {
		e.preventDefault();
		e.stopPropagation();
		markers.remove(id);
	}

	let thumbs = $state<Thumb[]>([]);
	let loading = $state(false);
	let peaks = $state<Float32Array | null>(null);
	let wfStatus = $state<'idle' | 'loading' | 'done' | 'unavailable'>('idle');
	let wfCanvas: HTMLCanvasElement;
	let wfAbort: AbortController | null = null;
	let thumbAbort: AbortController | null = null;
	let thumbToken = 0;
	let wfToken = 0;
	let trackEl = $state<HTMLElement | null>(null);

	$effect(() => {
		if (player.ready) trim.reset(player.duration);
	});

	const playheadPct = $derived(
		player.duration > 0 ? player.currentTime / player.duration : 0
	);

	const gaps = $derived.by(() => {
		if (player.duration <= 0) return [] as Array<{ start: number; end: number }>;
		const sorted = [...trim.segments].sort((a, b) => a.inPoint - b.inPoint);
		const out: Array<{ start: number; end: number }> = [];
		let cursor = 0;
		for (const s of sorted) {
			if (s.inPoint > cursor) out.push({ start: cursor, end: s.inPoint });
			cursor = Math.max(cursor, s.outPoint);
		}
		if (cursor < player.duration) out.push({ start: cursor, end: player.duration });
		return out;
	});

	let wasPlaying = false;

	function onTrackClick(e: MouseEvent) {
		if (!trackEl || !player.ready) return;
		const target = e.target as HTMLElement;
		if (target.closest('[role="slider"]')) return;
		const rect = trackEl.getBoundingClientRect();
		const pct = (e.clientX - rect.left) / rect.width;
		player.seek(pct * player.duration);
	}

	function onScrubStart() {
		wasPlaying = player.playing;
		if (wasPlaying) player.pause();
	}

	function onScrub(pct: number) {
		queueSeek(pct * player.duration);
	}

	function onScrubEnd() {
		flushSeek();
		if (wasPlaying) player.play();
		wasPlaying = false;
	}

	let pendingSeek: number | null = null;
	let seekRaf: number | null = null;

	function queueSeek(t: number) {
		pendingSeek = t;
		if (seekRaf !== null) return;
		seekRaf = requestAnimationFrame(() => {
			seekRaf = null;
			if (pendingSeek !== null) {
				player.seek(pendingSeek);
				pendingSeek = null;
			}
		});
	}

	function flushSeek() {
		if (seekRaf !== null) cancelAnimationFrame(seekRaf);
		seekRaf = null;
		if (pendingSeek !== null) {
			player.seek(pendingSeek);
			pendingSeek = null;
		}
	}

	$effect(() => {
		const url = player.url;
		const file = player.file;
		if (!url || !player.ready) {
			reset();
			return;
		}
		runThumbs(url);
		if (file) runWaveform(file);
		return () => {
			thumbAbort?.abort();
			wfAbort?.abort();
		};
	});

	$effect(() => {
		if (peaks && wfCanvas) drawWaveform();
	});

	onDestroy(() => {
		thumbAbort?.abort();
		wfAbort?.abort();
		releaseThumbs(thumbs);
	});

	function reset() {
		thumbAbort?.abort();
		wfAbort?.abort();
		releaseThumbs(untrack(() => thumbs));
		thumbs = [];
		peaks = null;
		loading = false;
		wfStatus = 'idle';
		waveform.clear();
	}

	async function runThumbs(url: string) {
		thumbAbort?.abort();
		releaseThumbs(untrack(() => thumbs));
		thumbs = [];
		loading = true;
		const myToken = ++thumbToken;
		const ctrl = new AbortController();
		thumbAbort = ctrl;
		const next: Thumb[] = [];
		try {
			for await (const { thumb } of extractThumbnails(url, {
				count: 60,
				signal: ctrl.signal
			})) {
				if (myToken !== thumbToken) {
					URL.revokeObjectURL(thumb.url);
					return;
				}
				next.push(thumb);
				thumbs = [...next];
			}
		} catch (err) {
			if ((err as Error).name !== 'AbortError') console.warn('thumbnails failed', err);
		} finally {
			if (myToken === thumbToken) loading = false;
		}
	}

	async function runWaveform(file: File) {
		wfAbort?.abort();
		const ctrl = new AbortController();
		wfAbort = ctrl;
		const myToken = ++wfToken;
		wfStatus = 'loading';
		try {
			const result = await extractWaveform(file, {
				peakCount: 2000,
				signal: ctrl.signal
			});
			if (myToken !== wfToken) return;
			peaks = result.peaks;
			waveform.set(result.peaks, result.duration);
			wfStatus = 'done';
		} catch (err) {
			if (myToken !== wfToken) return;
			const name = (err as Error).name;
			if (name === 'AbortError') return;
			wfStatus = 'unavailable';
			if (name !== 'EncodingError') console.warn('waveform failed', err);
		}
	}

	function drawWaveform() {
		if (!wfCanvas || !peaks) return;
		const dpr = window.devicePixelRatio || 1;
		const w = wfCanvas.clientWidth;
		const h = wfCanvas.clientHeight;
		wfCanvas.width = w * dpr;
		wfCanvas.height = h * dpr;
		const ctx = wfCanvas.getContext('2d');
		if (!ctx) return;
		ctx.scale(dpr, dpr);
		ctx.clearRect(0, 0, w, h);

		const n = peaks.length;
		const mid = h / 2;
		const barWidth = Math.max(1, w / n);
		ctx.fillStyle = 'rgba(59, 255, 124, 0.82)';
		ctx.shadowColor = 'rgba(59, 255, 124, 0.5)';
		ctx.shadowBlur = 2;

		for (let i = 0; i < n; i++) {
			const x = (i / n) * w;
			const amp = peaks[i] * (mid - 1);
			ctx.fillRect(x, mid - amp, barWidth * 0.78, amp * 2);
		}
	}
</script>

<svelte:window onresize={drawWaveform} />

<div class="timeline">
	<div class="perf top" aria-hidden="true"></div>

	<div class="marker-row" aria-hidden={!player.ready}>
		{#if player.ready && player.duration > 0}
			{#each markers.list as m (m.id)}
				<button
					type="button"
					class="marker-glyph"
					style="--pct: {(m.time / player.duration) * 100}%"
					onclick={(e) => onMarkerClick(e, m.time)}
					oncontextmenu={(e) => onMarkerContextMenu(e, m.id)}
					aria-label="Marker {m.label} at {formatSMPTE(m.time, player.fps)}"
				>
					<span class="triangle"></span>
					<span class="tooltip">{m.label} · {formatSMPTE(m.time, player.fps)}</span>
				</button>
			{/each}
		{/if}
	</div>

	<div class="track" bind:this={trackEl} onclick={onTrackClick} role="presentation">
		{#if player.ready && player.duration > 0}
			<div class="marker-lines" aria-hidden="true">
				{#each markers.list as m (m.id)}
					<div class="marker-line" style="--pct: {(m.time / player.duration) * 100}%"></div>
				{/each}
			</div>
		{/if}
		<div class="strip">
			{#if !player.url}
				<div class="strip-idle">AWAITING MEDIA</div>
			{:else if thumbs.length === 0 && loading}
				{#each Array(60) as _, i (i)}
					<div class="thumb placeholder" style="--delay: {i * 18}ms"></div>
				{/each}
			{:else}
				{#each thumbs as t (t.t)}
					<div class="thumb">
						<img src={t.url} alt="" />
					</div>
				{/each}
			{/if}
		</div>

		<div class="waveform">
			<canvas bind:this={wfCanvas}></canvas>
			{#if player.ready && wfStatus === 'loading'}
				<div class="wf-status">analyzing audio…</div>
			{:else if player.ready && wfStatus === 'unavailable'}
				<div class="wf-status" data-variant="muted">no audio track</div>
			{/if}
		</div>

		{#if player.ready && player.duration > 0}
			{#each gaps as g (g.start)}
				<div
					class="gap-mask"
					style="--left: {(g.start / player.duration) * 100}%; --width: {((g.end - g.start) / player.duration) * 100}%"
					aria-hidden="true"
				></div>
			{/each}

			{#each trim.segments as seg (seg.id)}
				{@const inPctSeg = seg.inPoint / player.duration}
				{@const outPctSeg = seg.outPoint / player.duration}
				{@const selected = trim.selectedId === seg.id}
				<button
					type="button"
					class="segment"
					data-selected={selected}
					style="--in: {inPctSeg * 100}%; --out: {outPctSeg * 100}%"
					onclick={(e) => {
						e.stopPropagation();
						trim.selectSegment(seg.id);
					}}
					aria-label="Segment from {seg.inPoint.toFixed(2)}s to {seg.outPoint.toFixed(2)}s"
				></button>
			{/each}

			{#each trim.segments as seg (seg.id)}
				{@const inPctSeg = seg.inPoint / player.duration}
				{@const outPctSeg = seg.outPoint / player.duration}
				<TrimHandle
					variant="in"
					percent={inPctSeg}
					time={seg.inPoint}
					fps={player.fps}
					duration={player.duration}
					{trackEl}
					onstart={() => {
						trim.selectSegment(seg.id);
						onScrubStart();
					}}
					onmove={(pct) => {
						trim.updateSegment(seg.id, { inPoint: pct * player.duration });
						queueSeek(seg.inPoint);
					}}
					onend={onScrubEnd}
				/>
				<TrimHandle
					variant="out"
					percent={outPctSeg}
					time={seg.outPoint}
					fps={player.fps}
					duration={player.duration}
					{trackEl}
					onstart={() => {
						trim.selectSegment(seg.id);
						onScrubStart();
					}}
					onmove={(pct) => {
						trim.updateSegment(seg.id, { outPoint: pct * player.duration });
						queueSeek(seg.outPoint);
					}}
					onend={onScrubEnd}
				/>
			{/each}

			<Playhead
				percent={playheadPct}
				time={player.currentTime}
				fps={player.fps}
				duration={player.duration}
				{trackEl}
				onscrubStart={onScrubStart}
				onscrub={onScrub}
				onscrubEnd={onScrubEnd}
			/>
		{/if}
	</div>

	<div class="perf bottom" aria-hidden="true"></div>
</div>

<style>
	.timeline {
		position: relative;
		width: 100%;
		background: var(--color-well);
		border-radius: var(--radius-panel);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.9),
			inset 0 -1px 0 rgba(255, 255, 255, 0.03),
			0 0 0 1px #000;
		padding: 4px 0;
		overflow: hidden;
	}

	.timeline::before {
		content: 'TIMELINE';
		position: absolute;
		top: -16px;
		left: 2px;
		font-family: var(--font-data);
		font-size: 8px;
		letter-spacing: 0.38em;
		color: #4a4f54;
		z-index: 5;
	}

	.track {
		position: relative;
		width: 100%;
		cursor: pointer;
	}

	.strip {
		display: flex;
		width: 100%;
		height: 72px;
		gap: 0;
		background: #000;
	}

	.strip-idle {
		flex: 1;
		display: grid;
		place-items: center;
		font-family: var(--font-data);
		font-size: 10px;
		letter-spacing: 0.38em;
		color: #3a3f44;
		text-transform: uppercase;
		background-image: repeating-linear-gradient(
			45deg,
			rgba(255, 255, 255, 0.015) 0 2px,
			transparent 2px 8px
		);
	}

	.gap-mask {
		position: absolute;
		top: 0;
		bottom: 0;
		left: var(--left);
		width: var(--width);
		background: rgba(0, 0, 0, 0.55);
		pointer-events: none;
		z-index: 2;
	}

	.segment {
		position: absolute;
		top: 0;
		bottom: 0;
		left: var(--in);
		right: calc(100% - var(--out));
		padding: 0;
		margin: 0;
		border: 0;
		background: linear-gradient(
			to bottom,
			rgba(255, 180, 0, 0.14) 0%,
			rgba(255, 180, 0, 0.08) 100%
		);
		box-shadow:
			inset 1px 0 0 rgba(255, 180, 0, 0.7),
			inset -1px 0 0 rgba(255, 180, 0, 0.7),
			inset 0 2px 0 rgba(255, 180, 0, 0.35),
			inset 0 -2px 0 rgba(255, 180, 0, 0.35);
		cursor: pointer;
		z-index: 1;
		transition: box-shadow 140ms var(--ease-mechanical);
	}

	.segment:hover {
		background: linear-gradient(
			to bottom,
			rgba(255, 180, 0, 0.18) 0%,
			rgba(255, 180, 0, 0.1) 100%
		);
	}

	.segment[data-selected='true'] {
		box-shadow:
			inset 2px 0 0 var(--color-led-amber),
			inset -2px 0 0 var(--color-led-amber),
			inset 0 3px 0 rgba(255, 180, 0, 0.7),
			inset 0 -3px 0 rgba(255, 180, 0, 0.7),
			0 0 18px rgba(255, 180, 0, 0.28);
	}

	.segment:focus-visible {
		outline: 2px solid var(--color-led-amber);
		outline-offset: 2px;
	}

	.thumb {
		flex: 1 0 0;
		min-width: 0;
		position: relative;
		background: #000;
		border-right: 1px solid rgba(0, 0, 0, 0.4);
	}

	.thumb:last-child {
		border-right: 0;
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		filter: contrast(1.05) saturate(0.92);
	}

	.thumb.placeholder {
		background: linear-gradient(90deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
		background-size: 200% 100%;
		animation: shimmer 1.6s ease-in-out infinite;
		animation-delay: var(--delay);
	}

	@keyframes shimmer {
		0%,
		100% {
			background-position: 0% 0;
		}
		50% {
			background-position: 100% 0;
		}
	}

	.waveform {
		position: relative;
		height: 44px;
		background: #040504;
		border-top: 1px solid #000;
		border-bottom: 1px solid #000;
	}

	.waveform canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.wf-status {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-family: var(--font-data);
		font-size: 10px;
		letter-spacing: 0.22em;
		color: var(--color-led-green-dim);
		text-transform: uppercase;
	}

	.wf-status[data-variant='muted'] {
		color: #3a3f44;
	}

	.perf {
		position: relative;
		height: 4px;
		background-image: radial-gradient(circle, #000 0.9px, transparent 1.1px);
		background-size: 12px 4px;
		background-repeat: repeat-x;
		opacity: 0.85;
	}

	@media (prefers-reduced-motion: reduce) {
		.thumb.placeholder {
			animation: none;
		}
	}

	.marker-row {
		position: relative;
		height: 12px;
		width: 100%;
	}

	.marker-glyph {
		position: absolute;
		top: 0;
		left: var(--pct);
		transform: translateX(-50%);
		width: 12px;
		height: 12px;
		padding: 0;
		margin: 0;
		border: 0;
		background: transparent;
		cursor: pointer;
		display: grid;
		place-items: center;
		z-index: 4;
	}

	.triangle {
		width: 8px;
		height: 6px;
		background: var(--color-led-green);
		clip-path: polygon(0 0, 100% 0, 50% 100%);
		filter: drop-shadow(0 0 3px rgba(59, 255, 124, 0.7))
			drop-shadow(0 0 6px rgba(59, 255, 124, 0.35));
		transition: filter 120ms, transform 120ms;
	}

	.marker-glyph:hover .triangle,
	.marker-glyph:focus-visible .triangle {
		filter: drop-shadow(0 0 4px rgba(59, 255, 124, 0.9))
			drop-shadow(0 0 10px rgba(59, 255, 124, 0.55));
		transform: scale(1.15);
	}

	.marker-glyph:focus-visible {
		outline: 1px solid var(--color-led-xenon);
		outline-offset: 2px;
	}

	.tooltip {
		position: absolute;
		bottom: calc(100% + 4px);
		left: 50%;
		transform: translateX(-50%);
		pointer-events: none;
		opacity: 0;
		transition: opacity 120ms;
		z-index: 10;
		padding: 4px 8px;
		background: var(--color-well);
		border-radius: var(--radius-panel);
		box-shadow:
			inset 0 1px 0 var(--color-steel-hi),
			inset 0 -1px 0 #000,
			0 2px 6px rgba(0, 0, 0, 0.8);
		font-family: var(--font-data);
		font-size: 9px;
		letter-spacing: 0.14em;
		color: var(--color-led-green);
		text-shadow: 0 0 4px rgba(59, 255, 124, 0.5);
		white-space: nowrap;
		text-transform: uppercase;
	}

	.marker-glyph:hover .tooltip,
	.marker-glyph:focus-visible .tooltip {
		opacity: 1;
	}

	.marker-lines {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;
	}

	.marker-line {
		position: absolute;
		top: 0;
		bottom: 0;
		left: var(--pct);
		width: 1px;
		transform: translateX(-50%);
		background: rgba(59, 255, 124, 0.35);
		box-shadow: 0 0 3px rgba(59, 255, 124, 0.3);
	}
</style>
