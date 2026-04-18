import type { Action } from 'svelte/action';

export interface DragInfo {
	x: number;
	y: number;
	dx: number;
	dy: number;
	sx: number;
	sy: number;
}

export interface DraggableOptions {
	ondrag?: (info: DragInfo) => void;
	onstart?: (info: DragInfo) => void;
	onend?: (info: DragInfo) => void;
	axis?: 'x' | 'y' | 'both';
	cursor?: string;
}

export const draggable: Action<HTMLElement, DraggableOptions> = (node, params = {}) => {
	let opts = params;
	let startX = 0;
	let startY = 0;
	let lastX = 0;
	let lastY = 0;
	let active = false;
	let pointerId: number | null = null;
	let priorCursor = '';

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		active = true;
		pointerId = e.pointerId;
		startX = lastX = e.clientX;
		startY = lastY = e.clientY;
		node.setPointerCapture(pointerId);
		priorCursor = document.body.style.cursor;
		if (opts.cursor) document.body.style.cursor = opts.cursor;
		opts.onstart?.({
			x: e.clientX,
			y: e.clientY,
			dx: 0,
			dy: 0,
			sx: startX,
			sy: startY
		});
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
		window.addEventListener('pointercancel', onPointerUp);
	}

	function onPointerMove(e: PointerEvent) {
		if (!active) return;
		const rawDx = e.clientX - lastX;
		const rawDy = e.clientY - lastY;
		lastX = e.clientX;
		lastY = e.clientY;
		const axis = opts.axis ?? 'both';
		const dx = axis === 'y' ? 0 : rawDx;
		const dy = axis === 'x' ? 0 : rawDy;
		opts.ondrag?.({
			x: e.clientX,
			y: e.clientY,
			dx,
			dy,
			sx: startX,
			sy: startY
		});
	}

	function onPointerUp(e: PointerEvent) {
		if (!active) return;
		active = false;
		if (pointerId !== null) {
			try {
				node.releasePointerCapture(pointerId);
			} catch {
				// already released
			}
		}
		pointerId = null;
		document.body.style.cursor = priorCursor;
		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerup', onPointerUp);
		window.removeEventListener('pointercancel', onPointerUp);
		opts.onend?.({
			x: e.clientX,
			y: e.clientY,
			dx: e.clientX - startX,
			dy: e.clientY - startY,
			sx: startX,
			sy: startY
		});
	}

	node.addEventListener('pointerdown', onPointerDown);

	return {
		update(next: DraggableOptions) {
			opts = next;
		},
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown);
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
			window.removeEventListener('pointercancel', onPointerUp);
		}
	};
};
