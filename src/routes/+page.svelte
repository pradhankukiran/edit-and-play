<script lang="ts">
	import { player } from '$lib/state/player.svelte';
	import { trim } from '$lib/state/trim.svelte';
	import { markers } from '$lib/state/markers.svelte';
	import { exporter } from '$lib/state/export.svelte';
	import { hotkey, type HotkeyMap } from '$lib/actions/hotkey';
	import { chirp as chirpSfx } from '$lib/media/sfx';
	import Viewport from '$lib/components/Viewport.svelte';
	import TransportBar from '$lib/components/TransportBar.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import JogWheel from '$lib/components/JogWheel.svelte';
	import Console from '$lib/components/Console.svelte';
	import StatusStrip from '$lib/components/StatusStrip.svelte';
	import ExportModal from '$lib/components/ExportModal.svelte';
	import ErrorBanner from '$lib/components/ErrorBanner.svelte';

	function markIn() {
		trim.markIn(player.currentTime);
	}

	function markOut() {
		trim.markOut(player.currentTime);
	}

	function splitAtPlayhead() {
		trim.splitAt(player.currentTime);
	}

	function deleteSelected() {
		if (trim.selectedId) trim.removeSegment(trim.selectedId);
	}

	function formatSMPTE(t: number, fps: number): string {
		const v = Math.max(0, t);
		const hh = Math.floor(v / 3600);
		const mm = Math.floor((v % 3600) / 60);
		const ss = Math.floor(v % 60);
		const ff = Math.floor((v % 1) * fps);
		return `${String(hh).padStart(2, '0')}_${String(mm).padStart(2, '0')}_${String(ss).padStart(2, '0')}_${String(ff).padStart(2, '0')}`;
	}

	async function onGrab() {
		if (!player.file || !player.ready) return;
		const blob = await player.captureFrame();
		if (!blob) return;
		const base = player.file.name.replace(/\.[^.]+$/, '');
		const tc = formatSMPTE(player.currentTime, player.fps);
		const filename = `${base}_frame_${tc}.png`;
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 10_000);
		chirpSfx(true);
	}

	function addMarker() {
		markers.add(player.currentTime);
	}

	function gotoPrevMarker() {
		const prev = markers.prevBefore(player.currentTime);
		if (prev) player.seek(prev.time);
	}

	function gotoNextMarker() {
		const next = markers.nextAfter(player.currentTime);
		if (next) player.seek(next.time);
	}

	function clearMarkers() {
		markers.clear();
	}

	function onExport() {
		if (!player.file || !player.ready) return;
		if (trim.segments.length === 0 || trim.totalDuration <= 0.05) return;
		player.pause();
		exporter.openConfig();
	}

	function previewTrim() {
		if (!trim.selected) return;
		player.seek(trim.selected.inPoint);
		player.play();
	}

	const shortcutsActive = $derived(player.ready && exporter.status === 'idle');

	const shortcuts: HotkeyMap = $derived(
		shortcutsActive
			? {
					space: () => player.toggle(),
					i: markIn,
					o: markOut,
					s: splitAtPlayhead,
					backspace: deleteSelected,
					delete: deleteSelected,
					g: onGrab,
					m: addMarker,
					'shift+m': clearMarkers,
					'[': gotoPrevMarker,
					']': gotoNextMarker,
					e: onExport,
					enter: previewTrim,
					arrowleft: () => player.step(-1),
					arrowright: () => player.step(1),
					'shift+arrowleft': () => player.seek(player.currentTime - 1),
					'shift+arrowright': () => player.seek(player.currentTime + 1),
					home: () => player.seek(0),
					end: () => player.seek(player.duration),
					j: () => player.stepBackward(),
					k: () => player.pauseAtOne(),
					l: () => player.bumpForward()
				}
			: ({} as HotkeyMap)
	);
</script>

<svelte:head>
	<title>edit-and-play · tactile video editor in the browser</title>
	<meta
		name="description"
		content="A tactile, broadcast-deck inspired video editor. Multi-cut splice, frame grab, markers, and MP4/WebM/GIF export — all client-side via ffmpeg.wasm. Built with Svelte."
	/>
</svelte:head>

<main use:hotkey={shortcuts}>
	<Console>
		<ErrorBanner message={player.error} ondismiss={() => (player.error = null)} />
		<div class="workbench">
			<section class="screen">
				<Viewport />
				<Timeline />
			</section>
			<aside class="rail">
				<StatusStrip />
				<TransportBar
					onmarkIn={markIn}
					onmarkOut={markOut}
					onsplit={splitAtPlayhead}
					ondelete={deleteSelected}
					ongrab={onGrab}
					onexport={onExport}
				/>
				<div class="jog-mount">
					<JogWheel />
				</div>
			</aside>
		</div>
	</Console>

	<ExportModal />
</main>

<style>
	main {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 12px;
	}

	.workbench {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 360px;
		gap: 16px;
		align-items: start;
	}

	.screen {
		display: flex;
		flex-direction: column;
		gap: 16px;
		min-width: 0;
		width: 100%;
		max-width: calc((100dvh - 320px) * 16 / 9);
		margin: 0 auto;
	}

	.rail {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
	}

	.jog-mount {
		display: grid;
		place-items: center;
		padding: 16px 0 4px;
	}

	@media (max-width: 1024px) {
		.workbench {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 480px) {
		main {
			padding: 12px;
		}
	}
</style>
