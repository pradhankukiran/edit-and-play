import { ui } from '$lib/state/ui.svelte';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!ctx) {
		const AC =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		if (!AC) return null;
		ctx = new AC();
	}
	if (ctx.state === 'suspended') void ctx.resume();
	return ctx;
}

function envelope(g: GainNode, peak: number, attack: number, release: number) {
	const now = g.context.currentTime;
	g.gain.setValueAtTime(0, now);
	g.gain.linearRampToValueAtTime(peak, now + attack);
	g.gain.exponentialRampToValueAtTime(0.001, now + attack + release);
}

function noise(ac: AudioContext, duration: number): AudioBufferSourceNode {
	const len = Math.ceil(ac.sampleRate * duration);
	const buf = ac.createBuffer(1, len, ac.sampleRate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
	const src = ac.createBufferSource();
	src.buffer = buf;
	return src;
}

export function click() {
	if (!ui.soundEnabled) return;
	const ac = getCtx();
	if (!ac) return;

	const src = noise(ac, 0.04);
	const bp = ac.createBiquadFilter();
	bp.type = 'bandpass';
	bp.frequency.value = 2400;
	bp.Q.value = 6;

	const g = ac.createGain();
	envelope(g, 0.22, 0.002, 0.035);

	src.connect(bp).connect(g).connect(ac.destination);
	src.start();
	src.stop(ac.currentTime + 0.06);
}

export function tick() {
	if (!ui.soundEnabled) return;
	const ac = getCtx();
	if (!ac) return;

	const osc = ac.createOscillator();
	osc.type = 'square';
	osc.frequency.value = 2000;

	const g = ac.createGain();
	envelope(g, 0.08, 0.001, 0.02);

	osc.connect(g).connect(ac.destination);
	osc.start();
	osc.stop(ac.currentTime + 0.04);
}

export function chirp(up = true) {
	if (!ui.soundEnabled) return;
	const ac = getCtx();
	if (!ac) return;

	const osc = ac.createOscillator();
	osc.type = 'sine';
	const start = up ? 600 : 1200;
	const end = up ? 1200 : 600;
	osc.frequency.setValueAtTime(start, ac.currentTime);
	osc.frequency.exponentialRampToValueAtTime(end, ac.currentTime + 0.08);

	const g = ac.createGain();
	envelope(g, 0.14, 0.002, 0.09);

	osc.connect(g).connect(ac.destination);
	osc.start();
	osc.stop(ac.currentTime + 0.12);
}
