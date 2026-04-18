import type { FFmpeg } from '@ffmpeg/ffmpeg';

let instance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

export async function getFFmpeg(
	onLog?: (message: string) => void
): Promise<FFmpeg> {
	if (instance) return instance;
	if (loadPromise) return loadPromise;

	loadPromise = (async () => {
		const { FFmpeg } = await import('@ffmpeg/ffmpeg');
		const { toBlobURL } = await import('@ffmpeg/util');
		const ffmpeg = new FFmpeg();
		if (onLog) {
			ffmpeg.on('log', ({ message }) => onLog(message));
		}
		await ffmpeg.load({
			coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
			wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm')
		});
		instance = ffmpeg;
		return ffmpeg;
	})();

	return loadPromise;
}

export interface TrimOptions {
	inTime: number;
	outTime: number;
	onProgress?: (ratio: number) => void;
	onLog?: (message: string) => void;
	signal?: AbortSignal;
}

export interface TrimResult {
	blob: Blob;
	mime: string;
	extension: string;
}

export async function trimVideo(file: File, opts: TrimOptions): Promise<TrimResult> {
	const { inTime, outTime, onProgress, onLog, signal } = opts;
	if (signal?.aborted) throw new DOMException('aborted', 'AbortError');

	const ffmpeg = await getFFmpeg(onLog);

	const { fetchFile } = await import('@ffmpeg/util');
	const ext = inferExtension(file.name, file.type);
	const inputName = `input.${ext}`;
	const outputName = `output.${ext}`;

	const progressHandler = ({ progress }: { progress: number }) => {
		onProgress?.(Math.max(0, Math.min(1, progress)));
	};
	ffmpeg.on('progress', progressHandler);

	try {
		await ffmpeg.writeFile(inputName, await fetchFile(file));
		if (signal?.aborted) throw new DOMException('aborted', 'AbortError');

		const duration = Math.max(0, outTime - inTime);
		await ffmpeg.exec([
			'-ss',
			inTime.toFixed(3),
			'-i',
			inputName,
			'-t',
			duration.toFixed(3),
			'-c',
			'copy',
			'-avoid_negative_ts',
			'make_zero',
			outputName
		]);
		if (signal?.aborted) throw new DOMException('aborted', 'AbortError');

		const data = await ffmpeg.readFile(outputName);
		const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
		const mime = mimeFor(ext);
		const blob = new Blob([bytes as BlobPart], { type: mime });

		await ffmpeg.deleteFile(inputName).catch(() => {});
		await ffmpeg.deleteFile(outputName).catch(() => {});

		return { blob, mime, extension: ext };
	} finally {
		ffmpeg.off('progress', progressHandler);
	}
}

function inferExtension(name: string, type: string): string {
	const m = /\.([a-z0-9]+)$/i.exec(name);
	if (m) return m[1].toLowerCase();
	if (type.includes('webm')) return 'webm';
	if (type.includes('quicktime')) return 'mov';
	if (type.includes('ogg')) return 'ogv';
	return 'mp4';
}

function mimeFor(ext: string): string {
	switch (ext) {
		case 'webm':
			return 'video/webm';
		case 'mov':
			return 'video/quicktime';
		case 'mkv':
			return 'video/x-matroska';
		case 'ogv':
		case 'ogg':
			return 'video/ogg';
		default:
			return 'video/mp4';
	}
}
