<script lang="ts">
	import { player } from '$lib/state/player.svelte';
	import { waveform } from '$lib/state/waveform.svelte';
	import { onMount } from 'svelte';

	interface Props {
		segments?: number;
		height?: number;
	}

	let { segments = 18, height = 8 }: Props = $props();

	let raf: number | null = null;
	let levelL = $state(0);
	let levelR = $state(0);
	let peakL = $state(0);
	let peakR = $state(0);
	let peakLHoldUntil = 0;
	let peakRHoldUntil = 0;

	const decay = 0.92;
	const peakDecay = 0.985;
	const holdMs = 600;

	onMount(() => {
		const tick = (now: number) => {
			const active = player.playing && player.ready && !player.muted;
			const t = player.currentTime;
			const targetL = active ? waveform.levelAt(t, 0.06) : 0;
			const targetR = active ? waveform.levelAt(t + 0.018, 0.06) : 0;

			levelL = levelL * decay + targetL * (1 - decay);
			levelR = levelR * decay + targetR * (1 - decay);

			if (levelL > peakL) {
				peakL = levelL;
				peakLHoldUntil = now + holdMs;
			} else if (now > peakLHoldUntil) {
				peakL *= peakDecay;
			}
			if (levelR > peakR) {
				peakR = levelR;
				peakRHoldUntil = now + holdMs;
			} else if (now > peakRHoldUntil) {
				peakR *= peakDecay;
			}

			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => {
			if (raf !== null) cancelAnimationFrame(raf);
		};
	});

	function segmentLevel(i: number): number {
		return (i + 0.5) / segments;
	}

	function color(i: number): 'green' | 'amber' | 'red' {
		const ratio = i / segments;
		if (ratio < 0.7) return 'green';
		if (ratio < 0.9) return 'amber';
		return 'red';
	}
</script>

<div class="meter" style="--seg-h: {height}px">
	<div class="row">
		<span class="tag">L</span>
		<div class="bar">
			{#each Array(segments) as _, i (i)}
				{@const thr = segmentLevel(i)}
				{@const lit = levelL >= thr}
				{@const peak = peakL >= thr && peakL < thr + 1 / segments}
				<span class="seg" data-color={color(i)} data-lit={lit} data-peak={peak}></span>
			{/each}
		</div>
	</div>
	<div class="row">
		<span class="tag">R</span>
		<div class="bar">
			{#each Array(segments) as _, i (i)}
				{@const thr = segmentLevel(i)}
				{@const lit = levelR >= thr}
				{@const peak = peakR >= thr && peakR < thr + 1 / segments}
				<span class="seg" data-color={color(i)} data-lit={lit} data-peak={peak}></span>
			{/each}
		</div>
	</div>
	<div class="scale">
		<span>-∞</span><span>-20</span><span>-10</span><span>-3</span><span>0</span>
	</div>
</div>

<style>
	.meter {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 4px 10px;
		padding: 10px 12px;
		background: var(--color-well);
		border-radius: var(--radius-panel);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.9),
			inset 0 -1px 0 rgba(255, 255, 255, 0.03),
			0 0 0 1px #000;
		min-width: 220px;
	}

	.row {
		display: contents;
	}

	.tag {
		font-family: var(--font-data);
		font-size: 10px;
		letter-spacing: 0.22em;
		color: #6b7278;
		align-self: center;
	}

	.bar {
		display: flex;
		gap: 2px;
		height: var(--seg-h);
		align-items: stretch;
	}

	.seg {
		flex: 1 1 0;
		background: var(--seg-dim);
		border-radius: 1px;
		box-shadow: inset 0 0 1px rgba(0, 0, 0, 0.8);
		transition: background 40ms linear, box-shadow 40ms linear;
	}

	.seg[data-lit='true'] {
		background: var(--seg-on);
		box-shadow:
			inset 0 0 1px rgba(255, 255, 255, 0.35),
			0 0 3px var(--seg-on);
	}

	.seg[data-peak='true'] {
		background: var(--seg-on);
		box-shadow:
			inset 0 0 1px rgba(255, 255, 255, 0.6),
			0 0 6px var(--seg-glow);
	}

	[data-color='green'] {
		--seg-on: var(--color-led-green);
		--seg-dim: var(--color-led-green-dim);
		--seg-glow: rgba(59, 255, 124, 0.8);
	}
	[data-color='amber'] {
		--seg-on: var(--color-led-amber);
		--seg-dim: var(--color-led-amber-dim);
		--seg-glow: rgba(255, 180, 0, 0.8);
	}
	[data-color='red'] {
		--seg-on: var(--color-led-red);
		--seg-dim: var(--color-led-red-dim);
		--seg-glow: rgba(255, 43, 28, 0.8);
	}

	.scale {
		grid-column: 2;
		display: flex;
		justify-content: space-between;
		font-family: var(--font-data);
		font-size: 8px;
		letter-spacing: 0.16em;
		color: #4a4f54;
		margin-top: 2px;
	}
</style>
