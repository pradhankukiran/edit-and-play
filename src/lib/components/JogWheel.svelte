<script lang="ts">
	import { player } from '$lib/state/player.svelte';
	import { jogwheel } from '$lib/actions/jogwheel';

	interface Props {
		secondsPerTurn?: number;
		size?: number;
	}

	let { secondsPerTurn = 2, size = 112 }: Props = $props();

	let rotation = $state(0);
	let active = $state(false);

	function onSpin(delta: number) {
		rotation += delta;
		const secondsDelta = (delta / (2 * Math.PI)) * secondsPerTurn;
		player.seek(player.currentTime + secondsDelta);
	}
</script>

<div class="jog-wrap" style="--size: {size}px">
	<div class="ring">
		<div class="tick top">▲</div>
		<div class="tick bottom">▼</div>
	</div>

	<button
		type="button"
		class="wheel"
		data-active={active}
		disabled={!player.ready}
		style="transform: rotate({rotation}rad)"
		use:jogwheel={{
			onspin: onSpin,
			onstart: () => (active = true),
			onend: () => (active = false),
			inertia: true
		}}
		aria-label="Jog wheel — drag to scrub"
	>
		<span class="dimple"></span>
		<span class="indicator"></span>
		<span class="notch" aria-hidden="true"></span>
	</button>

	<div class="label">JOG</div>
</div>

<style>
	.jog-wrap {
		position: relative;
		width: var(--size);
		height: calc(var(--size) + 16px);
		display: grid;
		place-items: center;
		grid-template-rows: var(--size) auto;
		gap: 4px;
	}

	.ring {
		position: absolute;
		top: -5px;
		left: -5px;
		width: calc(var(--size) + 10px);
		height: calc(var(--size) + 10px);
		border-radius: 50%;
		background:
			radial-gradient(circle at 50% 45%, #3a3f44 0%, #1a1c1e 70%, #0a0b0c 100%);
		box-shadow:
			inset 0 2px 3px rgba(0, 0, 0, 0.85),
			inset 0 -1px 0 var(--color-steel-hi),
			0 0 0 1px #000;
		display: grid;
		place-items: center;
	}

	.tick {
		position: absolute;
		font-size: 7px;
		color: var(--color-led-amber-dim);
		left: 50%;
		transform: translateX(-50%);
	}

	.tick.top {
		top: 2px;
	}

	.tick.bottom {
		bottom: 2px;
	}

	.wheel {
		position: relative;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		border: 0;
		padding: 0;
		background:
			radial-gradient(circle at 30% 25%, #5a6066 0%, #2a2e32 40%, #1a1c1e 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.18),
			inset 0 -2px 4px rgba(0, 0, 0, 0.7),
			0 3px 5px rgba(0, 0, 0, 0.8),
			0 0 0 1px #000;
		cursor: grab;
		touch-action: none;
		user-select: none;
		transition: box-shadow 140ms var(--ease-mechanical);
	}

	.wheel:active,
	.wheel[data-active='true'] {
		cursor: grabbing;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.25),
			inset 0 -2px 4px rgba(0, 0, 0, 0.8),
			0 1px 2px rgba(0, 0, 0, 0.9),
			0 0 0 1px #000,
			0 0 14px rgba(59, 255, 124, 0.25);
	}

	.wheel:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.dimple {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 22%;
		aspect-ratio: 1;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #2e3237 0%, #0e0f10 100%);
		box-shadow:
			inset 0 2px 3px rgba(0, 0, 0, 0.9),
			0 0 0 1px #000;
	}

	.indicator {
		position: absolute;
		top: 8%;
		left: 50%;
		width: 4px;
		height: 10px;
		transform: translateX(-50%);
		background: var(--color-led-green);
		border-radius: 1px;
		box-shadow: 0 0 6px rgba(59, 255, 124, 0.7);
	}

	.notch {
		position: absolute;
		inset: 8%;
		border-radius: 50%;
		background:
			repeating-conic-gradient(
				from 0deg,
				rgba(0, 0, 0, 0.22) 0deg 3deg,
				transparent 3deg 6deg
			);
		pointer-events: none;
	}

	.label {
		grid-row: 2;
		font-family: var(--font-data);
		font-size: 10px;
		letter-spacing: 0.32em;
		color: #6b7278;
		text-transform: uppercase;
		margin-top: 12px;
	}
</style>
