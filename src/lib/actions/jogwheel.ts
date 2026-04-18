import type { Action } from 'svelte/action';

export interface JogOptions {
	onspin?: (deltaRad: number, velocity: number) => void;
	onstart?: () => void;
	onend?: () => void;
	inertia?: boolean;
	damping?: number;
}

export const jogwheel: Action<HTMLElement, JogOptions> = (node, params = {}) => {
	let opts = params;
	let active = false;
	let pointerId: number | null = null;
	let centerX = 0;
	let centerY = 0;
	let lastAngle = 0;
	let lastTime = 0;
	let velocity = 0;
	let inertiaRaf: number | null = null;

	function angleFromCenter(clientX: number, clientY: number) {
		return Math.atan2(clientY - centerY, clientX - centerX);
	}

	function normalizeDelta(delta: number) {
		while (delta > Math.PI) delta -= 2 * Math.PI;
		while (delta < -Math.PI) delta += 2 * Math.PI;
		return delta;
	}

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		stopInertia();
		active = true;
		pointerId = e.pointerId;
		const rect = node.getBoundingClientRect();
		centerX = rect.left + rect.width / 2;
		centerY = rect.top + rect.height / 2;
		lastAngle = angleFromCenter(e.clientX, e.clientY);
		lastTime = performance.now();
		velocity = 0;
		node.setPointerCapture(pointerId);
		opts.onstart?.();
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
		window.addEventListener('pointercancel', onPointerUp);
	}

	function onPointerMove(e: PointerEvent) {
		if (!active) return;
		const now = performance.now();
		const angle = angleFromCenter(e.clientX, e.clientY);
		const dt = Math.max(1, now - lastTime);
		const delta = normalizeDelta(angle - lastAngle);
		velocity = delta / dt;
		lastAngle = angle;
		lastTime = now;
		opts.onspin?.(delta, velocity);
	}

	function onPointerUp() {
		if (!active) return;
		active = false;
		if (pointerId !== null) {
			try {
				node.releasePointerCapture(pointerId);
			} catch {
				// noop
			}
		}
		pointerId = null;
		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerup', onPointerUp);
		window.removeEventListener('pointercancel', onPointerUp);
		opts.onend?.();
		if (opts.inertia !== false && Math.abs(velocity) > 0.0005) {
			startInertia();
		} else {
			velocity = 0;
		}
	}

	function startInertia() {
		const damping = opts.damping ?? 0.94;
		let last = performance.now();
		const tick = (now: number) => {
			const dt = now - last;
			last = now;
			velocity *= Math.pow(damping, dt / 16);
			if (Math.abs(velocity) < 0.0003) {
				velocity = 0;
				inertiaRaf = null;
				return;
			}
			const delta = velocity * dt;
			opts.onspin?.(delta, velocity);
			inertiaRaf = requestAnimationFrame(tick);
		};
		inertiaRaf = requestAnimationFrame(tick);
	}

	function stopInertia() {
		if (inertiaRaf !== null) cancelAnimationFrame(inertiaRaf);
		inertiaRaf = null;
	}

	node.addEventListener('pointerdown', onPointerDown);

	return {
		update(next: JogOptions) {
			opts = next;
		},
		destroy() {
			stopInertia();
			node.removeEventListener('pointerdown', onPointerDown);
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
			window.removeEventListener('pointercancel', onPointerUp);
		}
	};
};
