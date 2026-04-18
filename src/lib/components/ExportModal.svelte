<script lang="ts">
	import { exporter } from '$lib/state/export.svelte';
	import { player } from '$lib/state/player.svelte';
	import { trim } from '$lib/state/trim.svelte';
	import { chirp } from '$lib/media/sfx';
	import { fade, scale } from 'svelte/transition';
	import LED from './LED.svelte';
	import KnobButton from './KnobButton.svelte';
	import Timecode from './Timecode.svelte';

	const segments = 24;
	const open = $derived(exporter.status !== 'idle');

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

	function dismiss() {
		if (exporter.status === 'encoding' || exporter.status === 'loading') {
			exporter.cancel();
		} else {
			exporter.close();
		}
	}

	function retry() {
		if (!player.file || trim.totalDuration <= 0.05) return;
		void exporter.start(player.file, trim.inPoint, trim.outPoint);
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
		exporter.result ? `TRIM.${(exporter.result.filename.split('.').pop() ?? 'mp4').toUpperCase()}` : 'TRIM'
	);
</script>

{#if open}
	<div class="backdrop" transition:fade={{ duration: 180 }} onclick={onBackdropClick} role="presentation">
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
				<div class="row"><span class="k">IN</span><Timecode time={trim.inPoint} size={14} color="red" /></div>
				<div class="row"><span class="k">OUT</span><Timecode time={trim.outPoint} size={14} color="amber" /></div>
				<div class="row"><span class="k">DUR</span><Timecode time={trim.totalDuration} size={14} color="phosphor" /></div>
			</div>

			<div class="bar-wrap">
				<div class="bar">
					{#each Array(segments) as _, i (i)}
						{@const ratio = (i + 1) / segments}
						{@const lit = exporter.progress >= ratio - 1 / segments}
						{@const color =
							exporter.status === 'done'
								? 'green'
								: exporter.status === 'error'
									? 'red'
									: i < segments * 0.6
										? 'green'
										: i < segments * 0.88
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
					color={exporter.status === 'error' ? 'red' : exporter.status === 'done' ? 'green' : 'amber'}
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

			<div class="actions">
				{#if exporter.status === 'done'}
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
					<KnobButton
						label="RETRY"
						sublabel="[E]"
						accent="amber"
						size="lg"
						onclick={retry}
					/>
					<KnobButton label="CLOSE" sublabel="[ESC]" onclick={() => exporter.close()} />
				{:else}
					<KnobButton label="CANCEL" sublabel="[ESC]" accent="red" onclick={dismiss} />
				{/if}
			</div>

			{#if exporter.logs.length > 0}
				<details class="console-log">
					<summary>FFMPEG LOG</summary>
					<pre>
{exporter.logs.slice(-12).join('\n')}
					</pre>
				</details>
			{/if}
		</div>
	</div>
{/if}

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && open) dismiss();
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
		width: min(480px, 92vw);
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
