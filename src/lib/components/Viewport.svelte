<script lang="ts">
	import { player } from '$lib/state/player.svelte';
	import { onMount } from 'svelte';

	let videoEl: HTMLVideoElement;

	onMount(() => {
		player.attach(videoEl);
		return () => player.detach();
	});

	function onMetadata() {
		player.onLoadedMetadata(videoEl);
	}

	function onEnded() {
		player.playing = false;
	}

	function onError() {
		player.error = 'The browser could not decode this video (codec not supported).';
	}
</script>

<div class="viewport">
	<div class="corners" aria-hidden="true">
		<span class="corner tl"></span>
		<span class="corner tr"></span>
		<span class="corner bl"></span>
		<span class="corner br"></span>
	</div>

	<video
		bind:this={videoEl}
		src={player.url ?? ''}
		onloadedmetadata={onMetadata}
		onended={onEnded}
		onerror={onError}
		playsinline
		muted={player.muted}
	></video>

	<div class="scanlines" aria-hidden="true"></div>
	<div class="vignette" aria-hidden="true"></div>

	<div class="safe-area" aria-hidden="true">
		<span class="tick top-center"></span>
		<span class="tick bottom-center"></span>
	</div>

	{#if !player.ready}
		<div class="placeholder" aria-hidden="true">
			<div class="cross"></div>
		</div>
	{/if}
</div>

<style>
	.viewport {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		background: #000;
		overflow: hidden;
		border-radius: var(--radius-panel);
		box-shadow:
			inset 0 0 0 1px #000,
			inset 0 2px 4px rgba(0, 0, 0, 0.9),
			inset 0 -1px 0 var(--color-steel-hi);
	}

	video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		background: #000;
	}

	.placeholder {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		background:
			radial-gradient(ellipse at center, rgba(28, 42, 30, 0.25), transparent 70%),
			#000;
	}

	.cross {
		width: 48px;
		height: 48px;
		opacity: 0.35;
		background:
			linear-gradient(var(--color-phosphor-dim) 0 0) center/100% 1px no-repeat,
			linear-gradient(var(--color-phosphor-dim) 0 0) center/1px 100% no-repeat;
	}

	.scanlines {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: repeating-linear-gradient(
			0deg,
			rgba(0, 0, 0, 0.12) 0 1px,
			transparent 1px 3px
		);
		mix-blend-mode: multiply;
		opacity: 0.5;
	}

	.vignette {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(
			ellipse at center,
			transparent 45%,
			rgba(0, 0, 0, 0.35) 100%
		);
	}

	.corners {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;
	}

	.corner {
		position: absolute;
		width: 14px;
		height: 14px;
		border: 1px solid rgba(244, 248, 255, 0.35);
		border-width: 0;
	}
	.corner.tl {
		top: 6px;
		left: 6px;
		border-top-width: 1px;
		border-left-width: 1px;
	}
	.corner.tr {
		top: 6px;
		right: 6px;
		border-top-width: 1px;
		border-right-width: 1px;
	}
	.corner.bl {
		bottom: 6px;
		left: 6px;
		border-bottom-width: 1px;
		border-left-width: 1px;
	}
	.corner.br {
		bottom: 6px;
		right: 6px;
		border-bottom-width: 1px;
		border-right-width: 1px;
	}

	.safe-area {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.tick {
		position: absolute;
		width: 1px;
		height: 6px;
		background: rgba(244, 248, 255, 0.25);
	}

	.tick.top-center {
		top: 0;
		left: 50%;
	}

	.tick.bottom-center {
		bottom: 0;
		left: 50%;
	}
</style>
