<script lang="ts">
	import { player } from '$lib/state/player.svelte';
	import { extractThumbnails, releaseThumbs, type Thumb } from '$lib/media/thumbnails';
	import { onDestroy } from 'svelte';

	let thumbs = $state<Thumb[]>([]);
	let loading = $state(false);
	let abortCtrl: AbortController | null = null;

	$effect(() => {
		const url = player.url;
		if (!url || !player.ready) {
			reset();
			return;
		}
		run(url);
		return () => abortCtrl?.abort();
	});

	onDestroy(() => {
		abortCtrl?.abort();
		releaseThumbs(thumbs);
	});

	function reset() {
		abortCtrl?.abort();
		releaseThumbs(thumbs);
		thumbs = [];
		loading = false;
	}

	async function run(url: string) {
		reset();
		loading = true;
		abortCtrl = new AbortController();
		const next: Thumb[] = [];
		try {
			for await (const { thumb } of extractThumbnails(url, {
				count: 60,
				signal: abortCtrl.signal
			})) {
				next.push(thumb);
				thumbs = [...next];
			}
		} catch (err) {
			if ((err as Error).name !== 'AbortError') {
				console.warn('thumbnail extraction failed', err);
			}
		} finally {
			loading = false;
		}
	}
</script>

<div class="timeline">
	<div class="perf top" aria-hidden="true"></div>

	<div class="strip">
		{#if thumbs.length === 0 && loading}
			{#each Array(60) as _, i (i)}
				<div class="thumb placeholder" style="--delay: {i * 18}ms"></div>
			{/each}
		{:else}
			{#each thumbs as t (t.t)}
				<div class="thumb">
					<img src={t.url} alt="" />
				</div>
			{/each}
		{/if}
	</div>

	<div class="perf bottom" aria-hidden="true"></div>
</div>

<style>
	.timeline {
		position: relative;
		width: 100%;
		background: var(--color-well);
		border-radius: var(--radius-panel);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.9),
			inset 0 -1px 0 rgba(255, 255, 255, 0.03),
			0 0 0 1px #000;
		padding: 4px 0;
		overflow: hidden;
	}

	.strip {
		display: flex;
		width: 100%;
		height: 72px;
		gap: 0;
		background: #000;
	}

	.thumb {
		flex: 1 0 0;
		min-width: 0;
		position: relative;
		background: #000;
		border-right: 1px solid rgba(0, 0, 0, 0.4);
	}

	.thumb:last-child {
		border-right: 0;
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		filter: contrast(1.05) saturate(0.92);
	}

	.thumb.placeholder {
		background: linear-gradient(90deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
		background-size: 200% 100%;
		animation: shimmer 1.6s ease-in-out infinite;
		animation-delay: var(--delay);
	}

	@keyframes shimmer {
		0%,
		100% {
			background-position: 0% 0;
		}
		50% {
			background-position: 100% 0;
		}
	}

	.perf {
		position: relative;
		height: 4px;
		background-image: radial-gradient(circle, #000 0.9px, transparent 1.1px);
		background-size: 12px 4px;
		background-repeat: repeat-x;
		opacity: 0.85;
	}

	@media (prefers-reduced-motion: reduce) {
		.thumb.placeholder {
			animation: none;
		}
	}
</style>
