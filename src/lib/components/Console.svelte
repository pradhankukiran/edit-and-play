<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="console">
	<div class="rail top">
		<div class="brand">
			<span class="wordmark">EDIT<em>·</em>AND<em>·</em>PLAY</span>
			<span class="model">MODEL 016 · POST SUITE</span>
		</div>
		<div class="brand-led"><span class="power-led"></span><span class="power-label">PWR</span></div>
	</div>

	<div class="body">
		<div class="screw tl" aria-hidden="true"></div>
		<div class="screw tr" aria-hidden="true"></div>
		<div class="screw bl" aria-hidden="true"></div>
		<div class="screw br" aria-hidden="true"></div>

		<div class="inner">
			{@render children()}
		</div>
	</div>

	<div class="rail bottom">
		<span class="plate">serial 00-016-0000-A</span>
		<span class="plate">svelte · vercel · ffmpeg.wasm</span>
	</div>
</div>

<style>
	.console {
		width: min(1080px, 96vw);
		display: flex;
		flex-direction: column;
		gap: 0;
		font-family: var(--font-ui);
		position: relative;
	}

	.rail {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 22px;
		background: linear-gradient(to bottom, #2e3338, #1a1c1e);
		border-radius: 6px 6px 0 0;
		box-shadow:
			inset 0 1px 0 var(--color-steel-hi),
			inset 0 -1px 0 #000,
			0 1px 0 rgba(0, 0, 0, 0.6);
	}

	.rail.bottom {
		border-radius: 0 0 6px 6px;
		padding: 6px 22px;
		background: linear-gradient(to bottom, #1a1c1e, #0e0f10);
		font-family: var(--font-data);
		font-size: 9px;
		letter-spacing: 0.28em;
		color: #5a6066;
		text-transform: uppercase;
		justify-content: space-between;
	}

	.brand {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.wordmark {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 20px;
		letter-spacing: 0.22em;
		color: var(--color-led-xenon);
	}

	.wordmark em {
		font-style: normal;
		color: var(--color-led-amber);
		text-shadow: 0 0 6px rgba(255, 180, 0, 0.5);
		margin: 0 2px;
	}

	.model {
		font-family: var(--font-data);
		font-size: 9px;
		letter-spacing: 0.32em;
		color: #5a6066;
		text-transform: uppercase;
		margin-top: 2px;
	}

	.brand-led {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.power-led {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--color-led-green);
		box-shadow:
			inset 0 0 3px rgba(255, 255, 255, 0.4),
			0 0 4px var(--color-led-green),
			0 0 10px rgba(59, 255, 124, 0.55);
	}

	.power-label {
		font-family: var(--font-data);
		font-size: 10px;
		letter-spacing: 0.3em;
		color: var(--color-led-green);
		text-shadow: 0 0 4px rgba(59, 255, 124, 0.5);
	}

	.body {
		position: relative;
		background:
			repeating-linear-gradient(
				90deg,
				rgba(255, 255, 255, 0.01) 0 1px,
				transparent 1px 2px
			),
			linear-gradient(to bottom, var(--color-charcoal) 0%, var(--color-graphite) 100%);
		box-shadow:
			inset 0 1px 0 var(--color-steel-hi),
			inset 0 -1px 0 #000,
			0 1px 0 rgba(0, 0, 0, 0.8);
		padding: 24px 22px;
	}

	.inner {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.screw {
		position: absolute;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background:
			radial-gradient(circle at 35% 30%, #6a6f74 0%, #2a2e32 70%, #0a0b0c 100%);
		box-shadow:
			inset 0 1px 1px rgba(255, 255, 255, 0.2),
			inset 0 -1px 1px rgba(0, 0, 0, 0.6),
			0 1px 1px rgba(0, 0, 0, 0.8);
	}

	.screw::after {
		content: '';
		position: absolute;
		inset: 2px;
		border-radius: 50%;
		background:
			linear-gradient(45deg, transparent 45%, rgba(0, 0, 0, 0.8) 45%, rgba(0, 0, 0, 0.8) 55%, transparent 55%),
			linear-gradient(135deg, transparent 45%, rgba(0, 0, 0, 0.8) 45%, rgba(0, 0, 0, 0.8) 55%, transparent 55%);
	}

	.screw.tl {
		top: 10px;
		left: 10px;
	}
	.screw.tr {
		top: 10px;
		right: 10px;
	}
	.screw.bl {
		bottom: 10px;
		left: 10px;
	}
	.screw.br {
		bottom: 10px;
		right: 10px;
	}

	@media (max-width: 640px) {
		.rail {
			padding: 8px 14px;
		}
		.body {
			padding: 20px 16px;
		}
		.wordmark {
			font-size: 16px;
		}
		.screw {
			display: none;
		}
	}
</style>
