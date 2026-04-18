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
		const ffmpeg = new FFmpeg();
		if (onLog) {
			ffmpeg.on('log', ({ message }) => onLog(message));
		}
		const origin = typeof window !== 'undefined' ? window.location.origin : '';
		await ffmpeg.load({
			coreURL: `${origin}/ffmpeg/ffmpeg-core.js`,
			wasmURL: `${origin}/ffmpeg/ffmpeg-core.wasm`
		});
		instance = ffmpeg;
		return ffmpeg;
	})();

	return loadPromise;
}

export interface Segment {
	inPoint: number;
	outPoint: number;
}

export interface ExportOptions {
	speed: 0.5 | 1 | 2 | 4;
	aspect: 'source' | '16:9' | '9:16' | '1:1';
	muteAudio: boolean;
	format: 'mp4' | 'webm' | 'gif';
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
	speed: 1,
	aspect: 'source',
	muteAudio: false,
	format: 'mp4'
};

export interface TrimOptions {
	segments: Segment[];
	options?: Partial<ExportOptions>;
	sourceWidth?: number;
	sourceHeight?: number;
	onProgress?: (ratio: number) => void;
	onLog?: (message: string) => void;
	signal?: AbortSignal;
}

export interface TrimResult {
	blob: Blob;
	mime: string;
	extension: string;
}

function checkAbort(signal?: AbortSignal) {
	if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
}

function atempoChain(speed: number): string {
	// atempo supports 0.5..2 per filter, chain as needed.
	if (speed === 1) return '';
	if (speed === 0.5) return 'atempo=0.5';
	if (speed === 2) return 'atempo=2.0';
	if (speed === 4) return 'atempo=2.0,atempo=2.0';
	// fallback: decompose into factors within [0.5, 2]
	let remaining = speed;
	const parts: string[] = [];
	while (remaining > 2) {
		parts.push('atempo=2.0');
		remaining /= 2;
	}
	while (remaining < 0.5) {
		parts.push('atempo=0.5');
		remaining /= 0.5;
	}
	parts.push(`atempo=${remaining.toFixed(4)}`);
	return parts.join(',');
}

function computeCrop(
	aspect: ExportOptions['aspect'],
	srcW?: number,
	srcH?: number
): string | null {
	if (aspect === 'source') return null;
	if (!srcW || !srcH) return null;

	const ratios: Record<Exclude<ExportOptions['aspect'], 'source'>, number> = {
		'16:9': 16 / 9,
		'9:16': 9 / 16,
		'1:1': 1
	};
	const target = ratios[aspect];
	const srcRatio = srcW / srcH;

	let cropW: number;
	let cropH: number;
	if (srcRatio > target) {
		// source wider than target — crop sides
		cropH = srcH;
		cropW = Math.round(srcH * target);
	} else {
		// source taller than target — crop top/bottom
		cropW = srcW;
		cropH = Math.round(srcW / target);
	}
	// keep dims even for yuv420p compatibility
	cropW = cropW - (cropW % 2);
	cropH = cropH - (cropH % 2);
	const x = Math.max(0, Math.floor((srcW - cropW) / 2));
	const y = Math.max(0, Math.floor((srcH - cropH) / 2));
	return `crop=${cropW}:${cropH}:${x}:${y}`;
}

export async function trimVideo(file: File, opts: TrimOptions): Promise<TrimResult> {
	const { segments, onProgress, onLog, signal, sourceWidth, sourceHeight } = opts;

	if (!segments || segments.length === 0) {
		throw new Error('At least one segment is required.');
	}
	for (const seg of segments) {
		if (!(seg.outPoint > seg.inPoint)) {
			throw new Error('Each segment must have outPoint greater than inPoint.');
		}
	}

	const options: ExportOptions = { ...DEFAULT_EXPORT_OPTIONS, ...(opts.options ?? {}) };
	checkAbort(signal);

	const ffmpeg = await getFFmpeg(onLog);
	const { fetchFile } = await import('@ffmpeg/util');
	const ext = inferExtension(file.name, file.type);
	const inputName = `input.${ext}`;

	const needsReencode =
		options.speed !== 1 || options.aspect !== 'source' || options.format !== 'mp4';

	// Warn if aspect crop requested but dimensions unknown.
	if (options.aspect !== 'source' && (!sourceWidth || !sourceHeight)) {
		onLog?.(
			`[edit-and-play] aspect '${options.aspect}' requested but sourceWidth/sourceHeight missing — skipping crop.`
		);
	}

	// Track which files we wrote so finally can clean them up.
	const writtenFiles = new Set<string>([inputName]);
	const outExt = options.format;
	const outputName = `output.${outExt}`;

	// Progress scaling across potentially multiple ffmpeg.exec() calls.
	let passIndex = 0;
	let passCount = 1;
	const progressHandler = ({ progress }: { progress: number }) => {
		const clamped = Math.max(0, Math.min(1, progress));
		const total = (passIndex + clamped) / passCount;
		onProgress?.(Math.max(0, Math.min(1, total)));
	};
	ffmpeg.on('progress', progressHandler);

	try {
		await ffmpeg.writeFile(inputName, await fetchFile(file));
		checkAbort(signal);

		// ── STREAM COPY PATH ────────────────────────────────────────────────
		if (!needsReencode) {
			const muteArgs = options.muteAudio ? ['-an'] : [];

			if (segments.length === 1) {
				passCount = 1;
				const seg = segments[0];
				const dur = seg.outPoint - seg.inPoint;
				await ffmpeg.exec([
					'-ss',
					seg.inPoint.toFixed(3),
					'-i',
					inputName,
					'-t',
					dur.toFixed(3),
					'-c',
					'copy',
					...muteArgs,
					'-avoid_negative_ts',
					'make_zero',
					outputName
				]);
				passIndex = 1;
				checkAbort(signal);
			} else {
				passCount = segments.length + 1;
				const segFiles: string[] = [];
				for (let i = 0; i < segments.length; i++) {
					const seg = segments[i];
					const dur = seg.outPoint - seg.inPoint;
					const segName = `segment_${i}.${ext}`;
					segFiles.push(segName);
					writtenFiles.add(segName);
					await ffmpeg.exec([
						'-ss',
						seg.inPoint.toFixed(3),
						'-i',
						inputName,
						'-t',
						dur.toFixed(3),
						'-c',
						'copy',
						...muteArgs,
						'-avoid_negative_ts',
						'make_zero',
						segName
					]);
					passIndex = i + 1;
					checkAbort(signal);
				}

				const concatList = segFiles.map((name) => `file '${name}'`).join('\n') + '\n';
				const concatName = 'concat.txt';
				writtenFiles.add(concatName);
				await ffmpeg.writeFile(concatName, new TextEncoder().encode(concatList));
				checkAbort(signal);

				await ffmpeg.exec([
					'-f',
					'concat',
					'-safe',
					'0',
					'-i',
					concatName,
					'-c',
					'copy',
					...muteArgs,
					outputName
				]);
				passIndex = passCount;
				checkAbort(signal);
			}

			writtenFiles.add(outputName);
			const data = await ffmpeg.readFile(outputName);
			const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
			const mime = mimeFor(outExt);
			const blob = new Blob([bytes as BlobPart], { type: mime });
			onProgress?.(1);
			return { blob, mime, extension: outExt };
		}

		// ── RE-ENCODE PATH ─────────────────────────────────────────────────
		// Build filter_complex that trims each segment, concats, then applies
		// aspect crop + speed. For GIF we render an intermediate mp4 first
		// then run a two-pass palette flow.

		const cropFilter = computeCrop(options.aspect, sourceWidth, sourceHeight);
		const hasAudio = !options.muteAudio && options.format !== 'gif';
		const n = segments.length;

		// Segment trim filters.
		const vLabels: string[] = [];
		const aLabels: string[] = [];
		const parts: string[] = [];
		for (let i = 0; i < n; i++) {
			const seg = segments[i];
			const s = seg.inPoint.toFixed(3);
			const e = seg.outPoint.toFixed(3);
			parts.push(`[0:v]trim=start=${s}:end=${e},setpts=PTS-STARTPTS[v${i}]`);
			vLabels.push(`[v${i}]`);
			if (hasAudio) {
				parts.push(`[0:a]atrim=start=${s}:end=${e},asetpts=PTS-STARTPTS[a${i}]`);
				aLabels.push(`[a${i}]`);
			}
		}

		// Concat: interleave [v0][a0][v1][a1]… when audio present.
		const concatInputs: string[] = [];
		for (let i = 0; i < n; i++) {
			concatInputs.push(vLabels[i]);
			if (hasAudio) concatInputs.push(aLabels[i]);
		}
		if (hasAudio) {
			parts.push(`${concatInputs.join('')}concat=n=${n}:v=1:a=1[vc][ac]`);
		} else {
			parts.push(`${concatInputs.join('')}concat=n=${n}:v=1:a=0[vc]`);
		}

		// Video post chain: crop (optional) + speed (setpts).
		const vChain: string[] = [];
		if (cropFilter) vChain.push(cropFilter);
		if (options.speed !== 1) {
			const ratio = (1 / options.speed).toFixed(6);
			vChain.push(`setpts=${ratio}*PTS`);
		}
		if (vChain.length > 0) {
			parts.push(`[vc]${vChain.join(',')}[vout]`);
		} else {
			parts.push(`[vc]null[vout]`);
		}

		// Audio post chain: atempo for speed.
		if (hasAudio) {
			const aChain = atempoChain(options.speed);
			if (aChain) {
				parts.push(`[ac]${aChain}[aout]`);
			} else {
				parts.push(`[ac]anull[aout]`);
			}
		}

		const filterComplex = parts.join(';');

		// ── GIF: render intermediate.mp4 then two-pass palettegen/paletteuse ─
		if (options.format === 'gif') {
			passCount = 3; // intermediate + palettegen + paletteuse
			const intermediateName = 'intermediate.mp4';
			writtenFiles.add(intermediateName);

			await ffmpeg.exec([
				'-i',
				inputName,
				'-filter_complex',
				filterComplex,
				'-map',
				'[vout]',
				'-an',
				'-c:v',
				'libx264',
				'-preset',
				'veryfast',
				'-crf',
				'23',
				'-pix_fmt',
				'yuv420p',
				intermediateName
			]);
			passIndex = 1;
			checkAbort(signal);

			const paletteName = 'palette.png';
			writtenFiles.add(paletteName);
			await ffmpeg.exec([
				'-i',
				intermediateName,
				'-vf',
				'fps=15,scale=480:-1:flags=lanczos,palettegen',
				'-y',
				paletteName
			]);
			passIndex = 2;
			checkAbort(signal);

			await ffmpeg.exec([
				'-i',
				intermediateName,
				'-i',
				paletteName,
				'-filter_complex',
				'[0:v]fps=15,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse',
				'-y',
				outputName
			]);
			passIndex = 3;
			checkAbort(signal);

			writtenFiles.add(outputName);
			const data = await ffmpeg.readFile(outputName);
			const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
			const mime = mimeFor('gif');
			const blob = new Blob([bytes as BlobPart], { type: mime });
			onProgress?.(1);
			return { blob, mime, extension: 'gif' };
		}

		// ── MP4 / WEBM re-encode in one pass ───────────────────────────────
		passCount = 1;
		const codecArgs: string[] =
			options.format === 'webm'
				? [
						'-c:v',
						'libvpx-vp9',
						'-b:v',
						'0',
						'-crf',
						'30',
						...(hasAudio ? ['-c:a', 'libopus', '-b:a', '128k'] : ['-an'])
				  ]
				: [
						'-c:v',
						'libx264',
						'-preset',
						'veryfast',
						'-crf',
						'23',
						'-pix_fmt',
						'yuv420p',
						...(hasAudio ? ['-c:a', 'aac', '-b:a', '128k'] : ['-an'])
				  ];

		const mapArgs = hasAudio ? ['-map', '[vout]', '-map', '[aout]'] : ['-map', '[vout]'];

		await ffmpeg.exec([
			'-i',
			inputName,
			'-filter_complex',
			filterComplex,
			...mapArgs,
			...codecArgs,
			outputName
		]);
		passIndex = 1;
		checkAbort(signal);

		writtenFiles.add(outputName);
		const data = await ffmpeg.readFile(outputName);
		const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
		const mime = mimeFor(outExt);
		const blob = new Blob([bytes as BlobPart], { type: mime });
		onProgress?.(1);
		return { blob, mime, extension: outExt };
	} finally {
		ffmpeg.off('progress', progressHandler);
		for (const name of writtenFiles) {
			await ffmpeg.deleteFile(name).catch(() => {});
		}
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
		case 'gif':
			return 'image/gif';
		default:
			return 'video/mp4';
	}
}
