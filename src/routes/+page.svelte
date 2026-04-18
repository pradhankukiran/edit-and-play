<script lang="ts">
	import { player } from '$lib/state/player.svelte';
	import DropZone from '$lib/components/DropZone.svelte';
	import Viewport from '$lib/components/Viewport.svelte';
</script>

<svelte:head>
	<title>edit-and-play · video trimmer</title>
</svelte:head>

<main>
	{#if !player.url}
		<div class="intro">
			<h1>edit-and-play</h1>
			<p class="subtitle">a tactile video trimmer</p>
			<DropZone />
		</div>
	{:else}
		<div class="stage">
			<Viewport />
		</div>
	{/if}
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

	.stage {
		width: min(960px, 95vw);
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
