<script lang="ts">
	import { player } from '$lib/state/player.svelte';
	import { trim } from '$lib/state/trim.svelte';
	import { exporter } from '$lib/state/export.svelte';
	import { hotkey } from '$lib/actions/hotkey';
	import DropZone from '$lib/components/DropZone.svelte';
	import Viewport from '$lib/components/Viewport.svelte';
	import TransportBar from '$lib/components/TransportBar.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import JogWheel from '$lib/components/JogWheel.svelte';
	import Console from '$lib/components/Console.svelte';
	import StatusStrip from '$lib/components/StatusStrip.svelte';
	import ExportModal from '$lib/components/ExportModal.svelte';
	import ErrorBanner from '$lib/components/ErrorBanner.svelte';

	function markIn() {
		trim.setIn(player.currentTime);
	}

	function markOut() {
		trim.setOut(player.currentTime);
	}

	function onExport() {
		if (!player.file || !player.ready) return;
		if (trim.selected <= 0.05) return;
		player.pause();
		void exporter.start(player.file, trim.inPoint, trim.outPoint);
	}

	function previewTrim() {
		player.seek(trim.inPoint);
		player.play();
	}

	const shortcuts = $derived({
		space: () => player.ready && player.toggle(),
		i: () => player.ready && markIn(),
		o: () => player.ready && markOut(),
		e: () => player.ready && onExport(),
		enter: () => player.ready && previewTrim(),
		arrowleft: () => player.ready && player.step(-1),
		arrowright: () => player.ready && player.step(1),
		'shift+arrowleft': () => player.ready && player.seek(player.currentTime - 1),
		'shift+arrowright': () => player.ready && player.seek(player.currentTime + 1),
		home: () => player.ready && player.seek(0),
		end: () => player.ready && player.seek(player.duration),
		j: () => player.ready && player.setRate(-2),
		k: () => player.ready && (player.setRate(1), player.pause()),
		l: () => player.ready && (player.setRate(2), player.play())
	});
</script>

<svelte:head>
	<title>edit-and-play · video trimmer</title>
</svelte:head>

<main use:hotkey={shortcuts}>
	{#if !player.url}
		<div class="intro">
			<h1>edit-and-play</h1>
			<p class="subtitle">a tactile video trimmer</p>
			<DropZone />
		</div>
	{:else}
		<Console>
			<ErrorBanner message={player.error} ondismiss={() => (player.error = null)} />
			<div class="workbench">
				<section class="screen">
					<Viewport />
					<Timeline />
				</section>
				<aside class="rail">
					<StatusStrip />
					<TransportBar onmarkIn={markIn} onmarkOut={markOut} onexport={onExport} />
					<div class="jog-mount">
						<JogWheel />
					</div>
				</aside>
			</div>
		</Console>
	{/if}

	<ExportModal />
</main>

<style>
	main {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 24px;
	}

	.intro {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
	}

	h1 {
		margin: 0;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 48px;
		letter-spacing: 0.22em;
		color: var(--color-led-xenon);
		text-transform: uppercase;
	}

	.subtitle {
		margin: -18px 0 12px;
		font-family: var(--font-data);
		font-size: 11px;
		letter-spacing: 0.4em;
		color: #5a6066;
		text-transform: uppercase;
	}

	.workbench {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 320px;
		gap: 16px;
		align-items: start;
	}

	.screen {
		display: flex;
		flex-direction: column;
		gap: 16px;
		min-width: 0;
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
