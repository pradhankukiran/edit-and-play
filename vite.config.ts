import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

// Static file requests (like /ffmpeg/*) bypass `server.headers` in some Vite/SvelteKit
// combinations because the static handler calls `res.writeHead()` which resets headers
// set earlier by middleware. We monkey-patch `writeHead` to re-apply COOP/COEP at the
// last moment, guaranteeing they land on every response — required for SharedArrayBuffer.
function crossOriginIsolation(): Plugin {
	return {
		name: 'cross-origin-isolation',
		configureServer(server) {
			server.middlewares.use((_req, res, next) => {
				const originalWriteHead = res.writeHead.bind(res);
				// @ts-expect-error overload variants
				res.writeHead = (...args: Parameters<typeof res.writeHead>) => {
					res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
					res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
					res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
					return originalWriteHead(...args);
				};
				next();
			});
		},
		configurePreviewServer(server) {
			server.middlewares.use((_req, res, next) => {
				const originalWriteHead = res.writeHead.bind(res);
				// @ts-expect-error overload variants
				res.writeHead = (...args: Parameters<typeof res.writeHead>) => {
					res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
					res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
					res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
					return originalWriteHead(...args);
				};
				next();
			});
		}
	};
}

export default defineConfig({
	plugins: [crossOriginIsolation(), tailwindcss(), sveltekit()],
	optimizeDeps: {
		exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
	}
});
