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
	<video
		bind:this={videoEl}
		src={player.url ?? ''}
		onloadedmetadata={onMetadata}
		onended={onEnded}
		onerror={onError}
		playsinline
		muted={player.muted}
	></video>

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
</style>
