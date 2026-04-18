import { trimVideo } from '$lib/media/ffmpeg';

export type ExportStatus = 'idle' | 'loading' | 'encoding' | 'done' | 'error';

interface ExportResult {
	blob: Blob;
	url: string;
	filename: string;
	size: number;
}

class ExportState {
	status = $state<ExportStatus>('idle');
	progress = $state(0);
	error = $state<string | null>(null);
	result = $state<ExportResult | null>(null);
	logs = $state<string[]>([]);
	abortCtrl: AbortController | null = null;

	async start(file: File, inTime: number, outTime: number) {
		this.reset();
		this.status = 'loading';
		this.abortCtrl = new AbortController();
		const signal = this.abortCtrl.signal;

		try {
			const result = await trimVideo(file, {
				inTime,
				outTime,
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
			const filename = `${base}_trim_${inTime.toFixed(2)}-${outTime.toFixed(2)}.${result.extension}`;
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
