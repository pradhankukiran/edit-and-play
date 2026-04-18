<script lang="ts">
	type Color = 'red' | 'amber' | 'green' | 'xenon';

	interface Props {
		color?: Color;
		on?: boolean;
		size?: number;
		blink?: boolean;
		label?: string;
	}

	let { color = 'red', on = false, size = 8, blink = false, label }: Props = $props();
</script>

<span class="led-wrap">
	<span
		class="led"
		data-color={color}
		data-on={on}
		data-blink={blink && on}
		style="--led-size: {size}px"
	></span>
	{#if label}
		<span class="label" data-on={on}>{label}</span>
	{/if}
</span>

<style>
	.led-wrap {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.led {
		display: inline-block;
		width: var(--led-size);
		height: var(--led-size);
		border-radius: var(--radius-led);
		background: var(--led-dim);
		box-shadow:
			inset 0 0 2px rgba(0, 0, 0, 0.9),
			inset 0 1px 0 rgba(0, 0, 0, 0.6),
			0 0 0 1px #000;
		transition: box-shadow 120ms var(--ease-mechanical), background 120ms;
	}

	.led[data-on='true'] {
		background: var(--led-bright);
		box-shadow:
			inset 0 0 3px rgba(255, 255, 255, 0.4),
			0 0 4px var(--led-bright),
			0 0 10px var(--led-glow),
			0 0 0 1px #000;
	}

	.led[data-blink='true'] {
		animation: blink 1.1s steps(1, end) infinite;
	}

	@keyframes blink {
		50% {
			background: var(--led-dim);
			box-shadow:
				inset 0 0 2px rgba(0, 0, 0, 0.9),
				inset 0 1px 0 rgba(0, 0, 0, 0.6),
				0 0 0 1px #000;
		}
	}

	.label {
		font-family: var(--font-data);
		font-size: 9px;
		letter-spacing: 0.22em;
		color: #6b7278;
		text-transform: uppercase;
		transition: color 120ms, text-shadow 120ms;
	}

	.label[data-on='true'] {
		color: var(--led-bright);
		text-shadow: 0 0 6px var(--led-glow);
	}

	[data-color='red'] {
		--led-bright: var(--color-led-red);
		--led-dim: var(--color-led-red-dim);
		--led-glow: rgba(255, 43, 28, 0.7);
	}
	[data-color='amber'] {
		--led-bright: var(--color-led-amber);
		--led-dim: var(--color-led-amber-dim);
		--led-glow: rgba(255, 180, 0, 0.7);
	}
	[data-color='green'] {
		--led-bright: var(--color-led-green);
		--led-dim: var(--color-led-green-dim);
		--led-glow: rgba(59, 255, 124, 0.7);
	}
	[data-color='xenon'] {
		--led-bright: var(--color-led-xenon);
		--led-dim: #2a2e31;
		--led-glow: rgba(244, 248, 255, 0.55);
	}

	@media (prefers-reduced-motion: reduce) {
		.led {
			animation: none !important;
		}
	}
</style>
