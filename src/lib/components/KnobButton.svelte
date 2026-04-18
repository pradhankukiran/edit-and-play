<script lang="ts">
	import type { Snippet } from 'svelte';
	import LED from './LED.svelte';
	import { click as clickSfx } from '$lib/media/sfx';

	type Accent = 'red' | 'amber' | 'green' | 'xenon' | 'none';

	interface Props {
		label?: string;
		sublabel?: string;
		accent?: Accent;
		active?: boolean;
		disabled?: boolean;
		size?: 'sm' | 'md' | 'lg';
		onclick?: (e: MouseEvent) => void;
		icon?: Snippet;
	}

	let {
		label,
		sublabel,
		accent = 'none',
		active = false,
		disabled = false,
		size = 'md',
		onclick,
		icon
	}: Props = $props();

	function onClickInner(e: MouseEvent) {
		clickSfx();
		onclick?.(e);
	}
</script>

<button
	class="knob"
	data-size={size}
	data-active={active}
	{disabled}
	onclick={onClickInner}
	type="button"
>
	<span class="cap">
		{#if icon}
			<span class="icon">{@render icon()}</span>
		{/if}
		{#if label}
			<span class="text">{label}</span>
		{/if}
	</span>

	{#if accent !== 'none'}
		<span class="accent">
			<LED color={accent} on={active} size={6} />
		</span>
	{/if}

	{#if sublabel}
		<span class="sublabel">{sublabel}</span>
	{/if}
</button>

<style>
	.knob {
		position: relative;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 0;
		background: none;
		border: 0;
		font-family: var(--font-ui);
	}

	.cap {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px 14px;
		min-width: 52px;
		min-height: 36px;
		background: linear-gradient(to bottom, #3a3f44 0%, #1e2124 100%);
		border-radius: var(--radius-button);
		box-shadow:
			inset 0 1px 0 var(--color-steel-hi),
			inset 0 -1px 0 #000,
			0 2px 3px rgba(0, 0, 0, 0.7),
			0 1px 0 rgba(0, 0, 0, 0.9);
		transition:
			box-shadow 80ms var(--ease-snap),
			transform 80ms var(--ease-snap),
			background 120ms;
		color: #d8dce0;
		font-size: 11px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	[data-size='sm'] .cap {
		padding: 8px 10px;
		min-width: 40px;
		min-height: 30px;
		font-size: 10px;
	}

	[data-size='lg'] .cap {
		padding: 14px 18px;
		min-width: 64px;
		min-height: 44px;
		font-size: 12px;
	}

	.knob:hover:not(:disabled) .cap {
		background: linear-gradient(to bottom, #40454a 0%, #22262a 100%);
	}

	.knob:active:not(:disabled) .cap,
	.knob[data-active='true'] .cap {
		transform: translateY(1px);
		background: linear-gradient(to bottom, #1a1d20 0%, #2a2e32 100%);
		box-shadow:
			inset 0 2px 3px rgba(0, 0, 0, 0.8),
			inset 0 -1px 0 var(--color-steel-hi),
			0 0 0 1px #000;
	}

	.knob:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.knob:focus-visible .cap {
		outline: 2px solid var(--color-led-amber);
		outline-offset: 3px;
	}

	.icon {
		display: inline-grid;
		place-items: center;
		line-height: 0;
		color: inherit;
	}

	.text {
		font-weight: 500;
	}

	.accent {
		position: absolute;
		top: -4px;
		right: -4px;
	}

	.sublabel {
		font-family: var(--font-data);
		font-size: 9px;
		letter-spacing: 0.24em;
		color: #5a6066;
		text-transform: uppercase;
		margin-top: 2px;
	}
</style>
