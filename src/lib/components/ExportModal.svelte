<script lang="ts">
	import {
		exporter,
		exportOptions,
		type Speed,
		type Aspect,
		type Format
	} from '$lib/state/export.svelte';
	import { player } from '$lib/state/player.svelte';
	import { trim } from '$lib/state/trim.svelte';
	import { chirp } from '$lib/media/sfx';
	import { fade, scale } from 'svelte/transition';
	import LED from './LED.svelte';
	import KnobButton from './KnobButton.svelte';
	import Timecode from './Timecode.svelte';

	const segs = 24;
	const open = $derived(exporter.configuring || exporter.status !== 'idle');
	const configView = $derived(exporter.configuring && exporter.status === 'idle');

	let panelEl: HTMLDivElement | null = $state(null);
	let priorFocus: HTMLElement | null = null;
	let wasOpen = false;

	$effect(() => {
		if (exporter.status === 'done') chirp(true);
		if (exporter.status === 'error') chirp(false);
	});

	$effect(() => {
		if (open && !wasOpen) {
			priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			queueMicrotask(() => {
				const target =
					panelEl?.querySelector<HTMLButtonElement>('button:not(:disabled)') ?? panelEl;
				target?.focus();
			});
			wasOpen = true;
		} else if (!open && wasOpen) {
			priorFocus?.focus();
			priorFocus = null;
			wasOpen = false;
		}
	});

	function download() {
		if (!exporter.result) return;
		const a = document.createElement('a');
		a.href = exporter.result.url;
		a.download = exporter.result.filename;
		a.click();
	}

	function startExport() {
		if (!player.file || trim.segments.length === 0 || trim.totalDuration <= 0.05) return;
		void exporter.start(player.file, trim.segments, exportOptions.snapshot(), {
			sourceWidth: player.width,
			sourceHeight: player.height
		});
	}

	function dismiss() {
		if (exporter.status === 'encoding' || exporter.status === 'loading') {
			exporter.cancel();
		} else {
			exporter.close();
		}
	}

	function retry() {
		startExport();
	}

	function onBackdropClick() {
		if (exporter.status === 'loading' || exporter.status === 'encoding') return;
		dismiss();
	}

	function fmtBytes(n: number): string {
		if (n < 1024) return `${n} B`;
		if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
		return `${(n / 1024 / 1024).toFixed(2)} MB`;
	}

	const downloadLabel = $derived(
		exporter.result
			? `TRIM.${(exporter.result.filename.split('.').pop() ?? 'mp4').toUpperCase()}`
			: 'TRIM'
	);

	const speeds: Speed[] = [0.5, 1, 2, 4];
	const aspects: Aspect[] = ['source', '16:9', '9:16', '1:1'];
	const formats: Format[] = ['mp4', 'webm', 'gif'];
</script>

{#if open}
	<div
		class="backdrop"
		transition:fade={{ duration: 180 }}
		onclick={onBackdropClick}
		role="presentation"
	>
		<div
			bind:this={panelEl}
			class="panel"
			transition:scale={{ duration: 220, start: 0.92 }}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-labelledby="export-title"
		>
			<div class="panel-header">
				<span id="export-title" class="title">EXPORT</span>
				<span class="subtitle">CLIENT-SIDE TRIM · FFMPEG.WASM</span>
			</div>

			<div class="meta">
				<div class="row">
					<span class="k">SEGMENTS</span>
					<span class="vtext">{trim.segments.length}</span>
				</div>
				<div class="row">
					<span class="k">DUR</span>
					<Timecode time={trim.totalDuration} size={14} color="phosphor" />
				</div>
				<div class="row">
					<span class="k">MODE</span>
					<span class="vtext" data-hot={exportOptions.needsReencode}>
						{exportOptions.needsReencode ? 'ENCODE' : 'COPY'}
					</span>
				</div>
			</div>

			{#if configView}
				<div class="options">
					<div class="option-row">
						<span class="olabel">SPEED</span>
						<div class="segmented">
							{#each speeds as s (s)}
								<button
									type="button"
									class="seg-btn"
									data-active={exportOptions.speed === s}
									onclick={() => (exportOptions.speed = s)}
								>
									{s === 1 ? '1×' : `${s}×`}
								</button>
							{/each}
						</div>
					</div>

					<div class="option-row">
						<span class="olabel">ASPECT</span>
						<div class="segmented">
							{#each aspects as a (a)}
								<button
									type="button"
									class="seg-btn"
									data-active={exportOptions.aspect === a}
									onclick={() => (exportOptions.aspect = a)}
								>
									{a === 'source' ? 'SRC' : a}
								</button>
							{/each}
						</div>
					</div>

					<div class="option-row">
						<span class="olabel">FORMAT</span>
						<div class="segmented">
							{#each formats as f (f)}
								<button
									type="button"
									class="seg-btn"
									data-active={exportOptions.format === f}
									onclick={() => (exportOptions.format = f)}
								>
									{f.toUpperCase()}
								</button>
							{/each}
						</div>
					</div>

					<div class="option-row toggle-row">
						<span class="olabel">MUTE AUDIO</span>
						<button
							type="button"
							class="toggle"
							onclick={() => (exportOptions.muteAudio = !exportOptions.muteAudio)}
							aria-pressed={exportOptions.muteAudio}
						>
							<LED color="amber" on={exportOptions.muteAudio} />
							<span class="tlbl" data-on={exportOptions.muteAudio}>
								{exportOptions.muteAudio ? 'MUTED' : 'ACTIVE'}
							</span>
						</button>
					</div>

					{#if exportOptions.format === 'gif'}
						<div class="hint">GIF encoding is CPU-heavy · capped at 15fps / 480px wide</div>
					{:else if exportOptions.format === 'webm'}
						<div class="hint">WebM re-encode with libvpx-vp9 — slower than MP4</div>
					{/if}
				</div>
			{:else}
				<div class="bar-wrap">
					<div class="bar">
						{#each Array(segs) as _, i (i)}
							{@const ratio = (i + 1) / segs}
							{@const lit = exporter.progress >= ratio - 1 / segs}
							{@const color =
								exporter.status === 'done'
									? 'green'
									: exporter.status === 'error'
										? 'red'
										: i < segs * 0.6
											? 'green'
											: i < segs * 0.88
												? 'amber'
												: 'red'}
							<span class="seg" data-color={color} data-lit={lit}></span>
						{/each}
					</div>
					<div class="progress-readout">
						{Math.round(exporter.progress * 100)}%
					</div>
				</div>

				<div class="status-row">
					<LED
						color={exporter.status === 'error'
							? 'red'
							: exporter.status === 'done'
								? 'green'
								: 'amber'}
						on={true}
						blink={exporter.status === 'loading' || exporter.status === 'encoding'}
					/>
					<span class="status-text">
						{#if exporter.status === 'loading'}
							LOADING FFMPEG CORE…
						{:else if exporter.status === 'encoding'}
							ENCODING…
						{:else if exporter.status === 'done' && exporter.result}
							READY · {fmtBytes(exporter.result.size)}
						{:else if exporter.status === 'error'}
							ERROR · {exporter.error ?? 'unknown'}
						{/if}
					</span>
				</div>
			{/if}

			<div class="actions">
				{#if configView}
					<KnobButton
						label="START"
						sublabel="[ENTER]"
						accent="green"
						size="lg"
						active
						onclick={startExport}
					/>
					<KnobButton label="CANCEL" sublabel="[ESC]" onclick={() => exporter.close()} />
				{:else if exporter.status === 'done'}
					<KnobButton
						label="DOWNLOAD"
						sublabel={downloadLabel}
						accent="green"
						size="lg"
						active
						onclick={download}
					/>
					<KnobButton label="CLOSE" sublabel="[ESC]" onclick={dismiss} />
				{:else if exporter.status === 'error'}
					<KnobButton label="RETRY" sublabel="[E]" accent="amber" size="lg" onclick={retry} />
					<KnobButton label="CLOSE" sublabel="[ESC]" onclick={() => exporter.close()} />
				{:else}
					<KnobButton label="CANCEL" sublabel="[ESC]" accent="red" onclick={dismiss} />
				{/if}
			</div>

			{#if !configView && exporter.logs.length > 0}
				<details class="console-log">
					<summary>FFMPEG LOG</summary>
					<pre>{exporter.logs.slice(-12).join('\n')}</pre>
				</details>
			{/if}
		</div>
	</div>
{/if}

<svelte:window
	onkeydown={(e) => {
		if (!open) return;
		if (e.key === 'Escape') dismiss();
		else if (e.key === 'Enter' && configView) startExport();
	}}
/>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.72);
		backdrop-filter: blur(6px);
		display: grid;
		place-items: center;
		z-index: 100;
	}

	.panel {
		width: min(520px, 92vw);
		padding: 22px 22px 20px;
		background:
			repeating-linear-gradient(
				90deg,
				rgba(255, 255, 255, 0.015) 0 1px,
				transparent 1px 2px
			),
			linear-gradient(to bottom, var(--color-charcoal), var(--color-graphite));
		border-radius: 6px;
		box-shadow:
			inset 0 1px 0 var(--color-steel-hi),
			inset 0 -1px 0 #000,
			0 30px 60px rgba(0, 0, 0, 0.7),
			0 0 0 1px #000;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.panel-header {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.title {
		font-family: var(--font-display);
		font-size: 22px;
		letter-spacing: 0.26em;
		color: var(--color-led-xenon);
	}

	.subtitle {
		font-family: var(--font-data);
		font-size: 9px;
		letter-spacing: 0.32em;
		color: #5a6066;
		text-transform: uppercase;
	}

	.meta {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		padding: 10px 12px;
		background: var(--color-well);
		border-radius: var(--radius-panel);
		box-shadow:
			inset 0 2px 3px rgba(0, 0, 0, 0.8),
			inset 0 -1px 0 rgba(255, 255, 255, 0.03);
	}

	.row {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.k {
		font-family: var(--font-data);
		font-size: 9px;
		letter-spacing: 0.24em;
		color: #5a6066;
		text-transform: uppercase;
	}

	.vtext {
		font-family: var(--font-data);
		font-size: 12px;
		letter-spacing: 0.14em;
		color: var(--color-led-xenon);
	}

	.vtext[data-hot='true'] {
		color: var(--color-led-amber);
		text-shadow: 0 0 6px rgba(255, 180, 0, 0.5);
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 12px;
		background: var(--color-well);
		border-radius: var(--radius-panel);
		box-shadow:
			inset 0 2px 3px rgba(0, 0, 0, 0.8),
			inset 0 -1px 0 rgba(255, 255, 255, 0.03);
	}

	.option-row {
		display: grid;
		grid-template-columns: 80px 1fr;
		gap: 10px;
		align-items: center;
	}

	.olabel {
		font-family: var(--font-data);
		font-size: 10px;
		letter-spacing: 0.24em;
		color: #5a6066;
		text-transform: uppercase;
	}

	.segmented {
		display: flex;
		gap: 2px;
		padding: 2px;
		background: #0a0b0c;
		border-radius: 3px;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.8);
	}

	.seg-btn {
		flex: 1;
		padding: 6px 8px;
		background: linear-gradient(to bottom, #2a2e32, #1a1c1e);
		border: 0;
		color: #9aa3ab;
		font-family: var(--font-data);
		font-size: 10px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		border-radius: 2px;
		cursor: pointer;
		transition:
			background 120ms var(--ease-snap),
			color 120ms,
			box-shadow 120ms;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.04),
			inset 0 -1px 0 rgba(0, 0, 0, 0.6);
	}

	.seg-btn:hover {
		color: var(--color-led-xenon);
	}

	.seg-btn[data-active='true'] {
		background: linear-gradient(to bottom, #1a1c1e, #2a2e32);
		color: var(--color-led-amber);
		text-shadow: 0 0 6px rgba(255, 180, 0, 0.55);
		box-shadow:
			inset 0 2px 3px rgba(0, 0, 0, 0.7),
			inset 0 0 0 1px rgba(255, 180, 0, 0.4);
	}

	.seg-btn:focus-visible {
		outline: 1px solid var(--color-led-amber);
		outline-offset: 1px;
	}

	.toggle-row .toggle {
		justify-self: start;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: none;
		border: 0;
		padding: 4px 6px;
		cursor: pointer;
	}

	.tlbl {
		font-family: var(--font-data);
		font-size: 10px;
		letter-spacing: 0.22em;
		color: #5a6066;
		text-transform: uppercase;
	}

	.tlbl[data-on='true'] {
		color: var(--color-led-amber);
		text-shadow: 0 0 6px rgba(255, 180, 0, 0.5);
	}

	.hint {
		font-family: var(--font-data);
		font-size: 9px;
		letter-spacing: 0.16em;
		color: var(--color-led-amber);
		text-transform: uppercase;
		padding: 4px 2px;
	}

	.bar-wrap {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 12px;
		align-items: center;
		padding: 10px 12px;
		background: var(--color-well);
		border-radius: var(--radius-panel);
		box-shadow:
			inset 0 2px 3px rgba(0, 0, 0, 0.8),
			inset 0 -1px 0 rgba(255, 255, 255, 0.03);
	}

	.bar {
		display: flex;
		gap: 2px;
		height: 14px;
	}

	.seg {
		flex: 1 1 0;
		border-radius: 1px;
		background: var(--seg-dim);
		box-shadow: inset 0 0 1px rgba(0, 0, 0, 0.8);
		transition: background 80ms linear, box-shadow 80ms linear;
	}

	.seg[data-lit='true'] {
		background: var(--seg-on);
		box-shadow:
			inset 0 0 1px rgba(255, 255, 255, 0.35),
			0 0 4px var(--seg-on);
	}

	[data-color='green'] {
		--seg-on: var(--color-led-green);
		--seg-dim: var(--color-led-green-dim);
	}
	[data-color='amber'] {
		--seg-on: var(--color-led-amber);
		--seg-dim: var(--color-led-amber-dim);
	}
	[data-color='red'] {
		--seg-on: var(--color-led-red);
		--seg-dim: var(--color-led-red-dim);
	}

	.progress-readout {
		font-family: var(--font-seg);
		font-size: 20px;
		color: var(--color-phosphor);
		text-shadow: var(--glow-phosphor);
		min-width: 64px;
		text-align: right;
	}

	.status-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.status-text {
		font-family: var(--font-data);
		font-size: 11px;
		letter-spacing: 0.18em;
		color: var(--color-led-xenon);
		text-transform: uppercase;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: 10px;
	}

	.console-log {
		font-family: var(--font-data);
		font-size: 9px;
		color: #6b7278;
	}

	.console-log summary {
		cursor: pointer;
		letter-spacing: 0.3em;
		text-transform: uppercase;
	}

	.console-log pre {
		margin: 6px 0 0;
		padding: 8px;
		background: var(--color-well);
		border-radius: 3px;
		color: var(--color-phosphor-dim);
		max-height: 140px;
		overflow: auto;
		white-space: pre-wrap;
	}
</style>
