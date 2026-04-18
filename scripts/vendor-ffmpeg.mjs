import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'node_modules/@ffmpeg/core/dist/umd');
const DEST = resolve(ROOT, 'static/ffmpeg');

const files = ['ffmpeg-core.js', 'ffmpeg-core.wasm'];

mkdirSync(DEST, { recursive: true });
for (const f of files) {
	const src = resolve(SRC, f);
	const dest = resolve(DEST, f);
	if (!existsSync(src)) {
		console.error(`[vendor-ffmpeg] missing ${src} — is @ffmpeg/core installed?`);
		process.exit(1);
	}
	copyFileSync(src, dest);
	console.log(`[vendor-ffmpeg] copied ${f}`);
}
