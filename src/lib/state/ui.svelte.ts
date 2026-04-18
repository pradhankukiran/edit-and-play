class UIState {
	soundEnabled = $state(false);
	reducedMotion = $state(false);

	constructor() {
		if (typeof window !== 'undefined') {
			const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
			this.reducedMotion = mq.matches;
			mq.addEventListener?.('change', (e) => (this.reducedMotion = e.matches));
		}
	}

	toggleSound() {
		this.soundEnabled = !this.soundEnabled;
	}
}

export const ui = new UIState();
