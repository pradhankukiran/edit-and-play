<script lang="ts">
	import { draggable, type DragInfo } from '$lib/actions/draggable';

	interface Props {
		percent: number;
		trackEl: HTMLElement | null;
		onscrub?: (percent: number) => void;
		onscrubStart?: () => void;
		onscrubEnd?: () => void;
	}

	let { percent, trackEl, onscrub, onscrubStart, onscrubEnd }: Props = $props();

	let dragging = $state(false);

	function onStart() {
		dragging = true;
		onscrubStart?.();
	}

	function onDrag(info: DragInfo) {
		if (!trackEl) return;
		const rect = trackEl.getBoundingClientRect();
		const pct = (info.x - rect.left) / rect.width;
		onscrub?.(Math.max(0, Math.min(1, pct)));
	}

	function onEnd() {
		dragging = false;
		onscrubEnd?.();
	}
</script>

<div
	class="playhead"
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
	aria-label="Playhead position"
	aria-valuemin="0"
	aria-valuemax="1"
	aria-valuenow={percent}
>
	<div class="head"></div>
	<div class="line"></div>
</div>

<style>
	.playhead {
		position: absolute;
		top: -4px;
		bottom: -4px;
		left: var(--pct);
		width: 16px;
		transform: translateX(-50%);
		z-index: 4;
		touch-action: none;
		user-select: none;
		cursor: ew-resize;
	}

	.line {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 1px;
		transform: translateX(-50%);
		background: var(--color-led-xenon);
		box-shadow: 0 0 6px rgba(244, 248, 255, 0.6);
	}

	.head {
		position: absolute;
		top: -2px;
		left: 50%;
		width: 12px;
		height: 10px;
		transform: translateX(-50%);
		background: var(--color-led-xenon);
		clip-path: polygon(0 0, 100% 0, 50% 100%);
		box-shadow: 0 0 8px rgba(244, 248, 255, 0.8);
	}

	.playhead:hover .head,
	.playhead[data-dragging='true'] .head {
		box-shadow: 0 0 14px rgba(244, 248, 255, 0.95);
	}

	.playhead:focus-visible .line {
		outline: 2px solid var(--color-led-amber);
		outline-offset: 2px;
	}
</style>
