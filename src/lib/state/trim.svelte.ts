class TrimState {
	inPoint = $state(0);
	outPoint = $state(0);

	duration = $state(0);
	selected = $derived(Math.max(0, this.outPoint - this.inPoint));
	isFullClip = $derived(this.inPoint === 0 && this.outPoint === this.duration);

	reset(duration: number) {
		this.duration = duration;
		this.inPoint = 0;
		this.outPoint = duration;
	}

	markIn(t: number) {
		const clamped = Math.max(0, Math.min(t, this.duration));
		this.inPoint = Math.min(clamped, this.outPoint);
	}

	markOut(t: number) {
		const clamped = Math.max(0, Math.min(t, this.duration));
		this.outPoint = Math.max(clamped, this.inPoint);
	}

	setIn(t: number) {
		this.inPoint = clamp(t, 0, this.outPoint);
	}

	setOut(t: number) {
		this.outPoint = clamp(t, this.inPoint, this.duration);
	}
}

function clamp(v: number, lo: number, hi: number) {
	return Math.max(lo, Math.min(v, hi));
}

export const trim = new TrimState();
