<script lang="ts">
	import { draggable, type DragInfo } from '$lib/actions/draggable';

	interface Props {
		percent: number;
		time: number;
		fps: number;
		duration: number;
		trackEl: HTMLElement | null;
		onscrub?: (percent: number) => void;
		onscrubStart?: () => void;
		onscrubEnd?: () => void;
	}

	let {
		percent,
		time,
		fps,
		duration,
		trackEl,
		onscrub,
		onscrubStart,
		onscrubEnd
	}: Props = $props();

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

	function formatSMPTE(t: number): string {
		const hh = Math.floor(t / 3600);
		const mm = Math.floor((t % 3600) / 60);
		const ss = Math.floor(t % 60);
		const ff = Math.floor((t % 1) * fps);
		return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
	}

	function nudge(delta: number) {
		if (duration <= 0) return;
		const next = Math.max(0, Math.min(duration, time + delta));
		onscrub?.(next / duration);
	}

	function onKeydown(e: KeyboardEvent) {
		let handled = true;
		const frameStep = 1 / fps;
		switch (e.key) {
			case 'ArrowLeft':
				nudge(e.shiftKey ? -1 : -frameStep);
				break;
			case 'ArrowRight':
				nudge(e.shiftKey ? 1 : frameStep);
				break;
			case 'Home':
				onscrub?.(0);
				break;
			case 'End':
				onscrub?.(1);
				break;
			default:
				handled = false;
		}
		if (handled) {
			e.preventDefault();
			e.stopPropagation();
		}
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
	aria-valuemax={duration}
	aria-valuenow={time}
	aria-valuetext={formatSMPTE(time)}
	onkeydown={onKeydown}
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
