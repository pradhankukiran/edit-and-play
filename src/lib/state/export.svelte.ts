import { trimVideo, type Segment, type ExportOptions } from '$lib/media/ffmpeg';

export type ExportStatus = 'idle' | 'loading' | 'encoding' | 'done' | 'error';

interface ExportResult {
	blob: Blob;
	url: string;
	filename: string;
	size: number;
}

interface ExportMeta {
	sourceWidth?: number;
	sourceHeight?: number;
}

class ExportState {
	status = $state<ExportStatus>('idle');
	progress = $state(0);
	error = $state<string | null>(null);
	result = $state<ExportResult | null>(null);
	logs = $state<string[]>([]);
	abortCtrl: AbortController | null = null;
	#inFlight: Promise<void> | null = null;

	async start(
		file: File,
		segments: Segment[],
		options?: Partial<ExportOptions>,
		meta?: ExportMeta
	) {
		if (this.#inFlight) {
			this.abortCtrl?.abort();
			await this.#inFlight.catch(() => {});
		}
		this.reset();
		this.status = 'loading';
		this.abortCtrl = new AbortController();
		const signal = this.abortCtrl.signal;

		const run = this.#runExport(file, segments, options, meta, signal);
		this.#inFlight = run;
		try {
			await run;
		} finally {
			if (this.#inFlight === run) this.#inFlight = null;
		}
	}

	async #runExport(
		file: File,
		segments: Segment[],
		options: Partial<ExportOptions> | undefined,
		meta: ExportMeta | undefined,
		signal: AbortSignal
	) {
		try {
			const result = await trimVideo(file, {
				segments,
				options,
				sourceWidth: meta?.sourceWidth,
				sourceHeight: meta?.sourceHeight,
				onProgress: (p) => {
					this.status = 'encoding';
					this.progress = p;
				},
				onLog: (m) => {
					if (this.logs.length > 80) this.logs = this.logs.slice(-80);
					this.logs = [...this.logs, m];
				},
				signal
			});

			const base = file.name.replace(/\.[^.]+$/, '');
			const totalSeconds = segments.reduce(
				(sum, s) => sum + Math.max(0, s.outPoint - s.inPoint),
				0
			);
			const filename = `${base}_trim_${totalSeconds.toFixed(2)}s.${result.extension}`;
			const url = URL.createObjectURL(result.blob);
			this.result = { blob: result.blob, url, filename, size: result.blob.size };
			this.progress = 1;
			this.status = 'done';
		} catch (e) {
			if ((e as Error).name === 'AbortError') {
				this.status = 'idle';
			} else {
				this.status = 'error';
				this.error = (e as Error).message || 'Export failed.';
				console.error('export failed', e);
			}
		} finally {
			this.abortCtrl = null;
		}
	}

	cancel() {
		this.abortCtrl?.abort();
	}

	close() {
		if (this.result) {
			URL.revokeObjectURL(this.result.url);
		}
		this.reset();
	}

	reset() {
		this.status = 'idle';
		this.progress = 0;
		this.error = null;
		this.logs = [];
		if (this.result) {
			URL.revokeObjectURL(this.result.url);
			this.result = null;
		}
	}
}

export const exporter = new ExportState();
