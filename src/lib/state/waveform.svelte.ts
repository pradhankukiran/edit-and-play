class WaveformState {
	peaks = $state<Float32Array | null>(null);
	duration = $state(0);

	set(peaks: Float32Array, duration: number) {
		this.peaks = peaks;
		this.duration = duration;
	}

	clear() {
		this.peaks = null;
		this.duration = 0;
	}

	levelAt(t: number, window = 0.08): number {
		const p = this.peaks;
		if (!p || this.duration <= 0) return 0;
		const n = p.length;
		const start = Math.max(0, ((t - window / 2) / this.duration) * n);
		const end = Math.min(n, ((t + window / 2) / this.duration) * n);
		const iStart = Math.floor(start);
		const iEnd = Math.max(iStart + 1, Math.ceil(end));
		let max = 0;
		for (let i = iStart; i < iEnd; i++) if (p[i] > max) max = p[i];
		return max;
	}
}

export const waveform = new WaveformState();
