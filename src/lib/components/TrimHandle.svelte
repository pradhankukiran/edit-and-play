<script lang="ts">
	import { draggable, type DragInfo } from '$lib/actions/draggable';
	import Timecode from './Timecode.svelte';

	type Variant = 'in' | 'out';

	interface Props {
		variant: Variant;
		percent: number;
		time: number;
		fps: number;
		trackEl: HTMLElement | null;
		onmove?: (percent: number) => void;
		onstart?: () => void;
		onend?: () => void;
	}

	let { variant, percent, time, fps, trackEl, onmove, onstart, onend }: Props = $props();

	let dragging = $state(false);

	function onStart() {
		dragging = true;
		onstart?.();
	}

	function onDrag(info: DragInfo) {
		if (!trackEl) return;
		const rect = trackEl.getBoundingClientRect();
		const pct = (info.x - rect.left) / rect.width;
		onmove?.(Math.max(0, Math.min(1, pct)));
	}

	function onEnd() {
		dragging = false;
		onend?.();
	}
</script>

<div
	class="handle"
	data-variant={variant}
	data-dragging={dragging}
	style="--pct: {percent * 100}%"
	use:draggable={{
		onstart: onStart,
		ondrag: onDrag,
		onend: onEnd,
		axis: 'x',
		cursor: 'ew-resize'
	}}
	role="slider"
	tabindex="0"
	aria-label="{variant === 'in' ? 'In' : 'Out'} trim point"
	aria-valuemin="0"
	aria-valuemax="1"
	aria-valuenow={percent}
>
	<div class="bar"></div>
	<div class="grip">
		<span class="letter">{variant === 'in' ? 'I' : 'O'}</span>
	</div>

	{#if dragging}
		<div class="tooltip" data-variant={variant}>
			<Timecode {time} {fps} size={14} color={variant === 'in' ? 'red' : 'amber'} />
		</div>
	{/if}
</div>

<style>
	.handle {
		position: absolute;
		top: 0;
		bottom: 0;
		left: var(--pct);
		width: 12px;
		transform: translateX(-50%);
		z-index: 3;
		touch-action: none;
		user-select: none;
		cursor: ew-resize;
	}

	.bar {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 2px;
		transform: translateX(-50%);
		background: var(--handle-color);
		box-shadow: 0 0 8px var(--handle-glow);
	}

	.grip {
		position: absolute;
		top: -2px;
		left: 50%;
		transform: translateX(-50%);
		width: 14px;
		height: 18px;
		background: linear-gradient(to bottom, #3a3f44, #1a1c1e);
		border-radius: 2px;
		display: grid;
		place-items: center;
		box-shadow:
			inset 0 1px 0 var(--color-steel-hi),
			inset 0 -1px 0 #000,
			0 1px 2px rgba(0, 0, 0, 0.8),
			0 0 6px var(--handle-glow);
		border-left: 1px solid var(--handle-color);
		border-right: 1px solid var(--handle-color);
	}

	.letter {
		font-family: var(--font-data);
		font-size: 8px;
		font-weight: 700;
		color: var(--handle-color);
		text-shadow: 0 0 4px var(--handle-glow);
		letter-spacing: 0.04em;
	}

	[data-variant='in'] {
		--handle-color: var(--color-led-red);
		--handle-glow: rgba(255, 43, 28, 0.7);
	}
	[data-variant='out'] {
		--handle-color: var(--color-led-amber);
		--handle-glow: rgba(255, 180, 0, 0.7);
	}

	.handle:hover .grip,
	.handle[data-dragging='true'] .grip {
		box-shadow:
			inset 0 1px 0 var(--color-steel-hi),
			inset 0 -1px 0 #000,
			0 1px 2px rgba(0, 0, 0, 0.8),
			0 0 14px var(--handle-glow);
	}

	.tooltip {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		pointer-events: none;
		z-index: 10;
	}

	.handle:focus-visible .bar {
		outline: 2px solid var(--color-led-xenon);
		outline-offset: 2px;
	}
</style>
