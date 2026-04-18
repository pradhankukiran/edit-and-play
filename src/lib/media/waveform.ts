export interface WaveformResult {
	peaks: Float32Array;
	duration: number;
	channels: number;
	sampleRate: number;
}

export interface WaveformOptions {
	peakCount?: number;
	signal?: AbortSignal;
}

export async function extractWaveform(
	src: Blob | File,
	opts: WaveformOptions = {}
): Promise<WaveformResult> {
	const { peakCount = 2000, signal } = opts;
	if (signal?.aborted) throw new DOMException('aborted', 'AbortError');

	const buf = await src.arrayBuffer();
	if (signal?.aborted) throw new DOMException('aborted', 'AbortError');

	const AudioCtx: typeof OfflineAudioContext =
		(window.OfflineAudioContext as typeof OfflineAudioContext) ||
		((window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
			.webkitOfflineAudioContext as typeof OfflineAudioContext);
	if (!AudioCtx) throw new Error('OfflineAudioContext not supported');

	const probeCtx = new AudioCtx(1, 1, 44100);
	const audio = await probeCtx.decodeAudioData(buf.slice(0));
	if (signal?.aborted) throw new DOMException('aborted', 'AbortError');

	const { numberOfChannels: channels, sampleRate, duration, length } = audio;
	const peaks = new Float32Array(peakCount);
	const bucket = length / peakCount;

	const channelData: Float32Array[] = [];
	for (let c = 0; c < channels; c++) channelData.push(audio.getChannelData(c));

	for (let i = 0; i < peakCount; i++) {
		const start = Math.floor(i * bucket);
		const end = Math.min(length, Math.floor((i + 1) * bucket));
		let sumSquares = 0;
		let count = 0;
		for (let s = start; s < end; s++) {
			for (let c = 0; c < channels; c++) {
				const v = channelData[c][s];
				sumSquares += v * v;
				count++;
			}
		}
		peaks[i] = count > 0 ? Math.sqrt(sumSquares / count) : 0;
	}

	let max = 0;
	for (let i = 0; i < peakCount; i++) if (peaks[i] > max) max = peaks[i];
	if (max > 0) {
		const norm = 1 / max;
		for (let i = 0; i < peakCount; i++) peaks[i] *= norm;
	}

	return { peaks, duration, channels, sampleRate };
}
