export interface Thumb {
	t: number;
	url: string;
	width: number;
	height: number;
}

export interface ThumbProgress {
	index: number;
	total: number;
	thumb: Thumb;
}

export interface ExtractOptions {
	count?: number;
	height?: number;
	signal?: AbortSignal;
}

export async function* extractThumbnails(
	src: string,
	opts: ExtractOptions = {}
): AsyncGenerator<ThumbProgress, void, void> {
	const { count = 60, height = 72, signal } = opts;

	const video = document.createElement('video');
	video.crossOrigin = 'anonymous';
	video.muted = true;
	video.preload = 'auto';
	video.playsInline = true;
	video.src = src;

	try {
		await waitFor(video, 'loadedmetadata', signal);
		const duration = video.duration;
		if (!isFinite(duration) || duration <= 0) return;

		const aspect = video.videoWidth / video.videoHeight || 16 / 9;
		const width = Math.round(height * aspect);
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d', { alpha: false });
		if (!ctx) return;

		for (let i = 0; i < count; i++) {
			if (signal?.aborted) return;
			const t = duration * ((i + 0.5) / count);
			video.currentTime = t;
			await waitFor(video, 'seeked', signal);
			ctx.drawImage(video, 0, 0, width, height);
			const blob = await canvasToBlob(canvas);
			if (!blob) continue;
			const url = URL.createObjectURL(blob);
			yield { index: i, total: count, thumb: { t, url, width, height } };
		}
	} finally {
		video.removeAttribute('src');
		video.load();
	}
}

function waitFor(el: HTMLVideoElement, event: string, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) return reject(new DOMException('aborted', 'AbortError'));

		const onEvent = () => {
			cleanup();
			resolve();
		};
		const onError = () => {
			cleanup();
			reject(new Error(`video ${event} failed`));
		};
		const onAbort = () => {
			cleanup();
			reject(new DOMException('aborted', 'AbortError'));
		};
		const cleanup = () => {
			el.removeEventListener(event, onEvent);
			el.removeEventListener('error', onError);
			signal?.removeEventListener('abort', onAbort);
		};

		el.addEventListener(event, onEvent, { once: true });
		el.addEventListener('error', onError, { once: true });
		signal?.addEventListener('abort', onAbort, { once: true });
	});
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
	return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/webp', 0.72));
}

export function releaseThumbs(thumbs: Thumb[]) {
	for (const t of thumbs) URL.revokeObjectURL(t.url);
}
