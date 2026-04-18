<script lang="ts">
	interface Props {
		time: number;
		fps?: number;
		size?: number;
		color?: 'phosphor' | 'amber' | 'red';
		label?: string;
	}

	let { time, fps = 30, size = 28, color = 'phosphor', label }: Props = $props();

	const formatted = $derived.by(() => {
		const t = Math.max(0, time);
		const hh = Math.floor(t / 3600);
		const mm = Math.floor((t % 3600) / 60);
		const ss = Math.floor(t % 60);
		const ff = Math.floor((t % 1) * fps);
		return {
			hh: String(hh).padStart(2, '0'),
			mm: String(mm).padStart(2, '0'),
			ss: String(ss).padStart(2, '0'),
			ff: String(ff).padStart(2, '0')
		};
	});
</script>

<div class="wrap" data-color={color}>
	{#if label}
		<span class="label">{label}</span>
	{/if}
	<div class="seg" style="--seg-size: {size}px">
		<span class="ghost">88</span><span class="lit">{formatted.hh}</span>
		<span class="colon">:</span>
		<span class="ghost">88</span><span class="lit">{formatted.mm}</span>
		<span class="colon">:</span>
		<span class="ghost">88</span><span class="lit">{formatted.ss}</span>
		<span class="colon dot">:</span>
		<span class="ghost">88</span><span class="lit">{formatted.ff}</span>
	</div>
</div>

<style>
	.wrap {
		display: inline-flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
	}

	.label {
		font-family: var(--font-data);
		font-size: 9px;
		letter-spacing: 0.28em;
		color: #6b7278;
		text-transform: uppercase;
	}

	.seg {
		display: inline-flex;
		align-items: baseline;
		padding: 8px 12px;
		background: var(--color-well);
		border-radius: var(--radius-panel);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.9),
			inset 0 -1px 0 rgba(255, 255, 255, 0.04),
			0 0 0 1px #000;
		font-family: var(--font-seg);
		font-size: var(--seg-size);
		line-height: 1;
		letter-spacing: 0.02em;
		position: relative;
	}

	.ghost,
	.lit {
		grid-area: 1 / 1;
	}

	.seg > .ghost + .lit {
		margin-left: calc(var(--seg-size) * -1.3);
	}

	.ghost {
		color: var(--color-phosphor-dim);
		opacity: 0.9;
	}

	.lit {
		color: var(--lit-color);
		text-shadow: 0 0 8px var(--lit-glow), 0 0 2px var(--lit-color);
	}

	.colon {
		display: inline-block;
		margin: 0 4px;
		color: var(--lit-color);
		text-shadow: 0 0 8px var(--lit-glow);
		animation: blink 1s steps(1, end) infinite;
	}

	.colon.dot {
		animation: none;
	}

	[data-color='phosphor'] {
		--lit-color: var(--color-phosphor);
		--lit-glow: var(--color-phosphor-glow);
	}
	[data-color='amber'] {
		--lit-color: var(--color-led-amber);
		--lit-glow: rgba(255, 180, 0, 0.55);
	}
	[data-color='red'] {
		--lit-color: var(--color-led-red);
		--lit-glow: rgba(255, 43, 28, 0.55);
	}

	@keyframes blink {
		50% {
			opacity: 0.35;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.colon {
			animation: none !important;
		}
	}
</style>
