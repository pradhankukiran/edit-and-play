class PlayerState {
	file = $state<File | null>(null);
	url = $state<string | null>(null);
	duration = $state(0);
	currentTime = $state(0);
	playing = $state(false);
	width = $state(0);
	height = $state(0);
	fps = $state(30);
	muted = $state(false);
	ready = $state(false);
	error = $state<string | null>(null);

	#videoEl: HTMLVideoElement | null = null;
	#rafId: number | null = null;

	attach(el: HTMLVideoElement) {
		this.#videoEl = el;
	}

	detach() {
		this.#videoEl = null;
		this.#stopRaf();
	}

	async load(file: File) {
		this.#stopRaf();
		if (this.url) URL.revokeObjectURL(this.url);
		this.ready = false;
		this.error = null;
		this.file = file;
		this.url = URL.createObjectURL(file);
		this.currentTime = 0;
		this.playing = false;
	}

	onLoadedMetadata(el: HTMLVideoElement) {
		this.duration = el.duration;
		this.width = el.videoWidth;
		this.height = el.videoHeight;
		this.fps = this.#estimateFps(el);
		this.ready = true;
	}

	#estimateFps(el: HTMLVideoElement): number {
		const anyEl = el as HTMLVideoElement & { getVideoPlaybackQuality?: () => { totalVideoFrames: number } };
		if (anyEl.getVideoPlaybackQuality && el.currentTime > 0) {
			const q = anyEl.getVideoPlaybackQuality();
			const f = q.totalVideoFrames / el.currentTime;
			if (f > 1 && f < 240) return Math.round(f);
		}
		return 30;
	}

	seek(t: number) {
		if (!this.#videoEl || !this.ready) return;
		const clamped = Math.max(0, Math.min(t, this.duration));
		this.#videoEl.currentTime = clamped;
		this.currentTime = clamped;
	}

	step(frames: number) {
		this.seek(this.currentTime + frames / this.fps);
	}

	play() {
		if (!this.#videoEl || !this.ready) return;
		this.#videoEl.play();
		this.playing = true;
		this.#startRaf();
	}

	pause() {
		if (!this.#videoEl) return;
		this.#videoEl.pause();
		this.playing = false;
		this.#stopRaf();
	}

	toggle() {
		this.playing ? this.pause() : this.play();
	}

	setRate(rate: number) {
		if (!this.#videoEl) return;
		this.#videoEl.playbackRate = rate;
	}

	clear() {
		this.pause();
		if (this.url) URL.revokeObjectURL(this.url);
		this.file = null;
		this.url = null;
		this.duration = 0;
		this.currentTime = 0;
		this.ready = false;
		this.width = 0;
		this.height = 0;
		this.error = null;
	}

	#startRaf() {
		const tick = () => {
			if (!this.#videoEl) return;
			this.currentTime = this.#videoEl.currentTime;
			if (this.#videoEl.paused || this.#videoEl.ended) {
				this.playing = false;
				this.#rafId = null;
				return;
			}
			this.#rafId = requestAnimationFrame(tick);
		};
		this.#rafId = requestAnimationFrame(tick);
	}

	#stopRaf() {
		if (this.#rafId !== null) {
			cancelAnimationFrame(this.#rafId);
			this.#rafId = null;
		}
	}
}

export const player = new PlayerState();
