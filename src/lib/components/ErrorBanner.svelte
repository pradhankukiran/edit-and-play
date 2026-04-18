<script lang="ts">
	import { fly } from 'svelte/transition';
	import LED from './LED.svelte';

	interface Props {
		message: string | null;
		ondismiss?: () => void;
	}

	let { message, ondismiss }: Props = $props();
</script>

{#if message}
	<div class="banner" role="alert" transition:fly={{ y: -10, duration: 180 }}>
		<LED color="red" on={true} blink />
		<span class="msg">{message}</span>
		{#if ondismiss}
			<button type="button" class="dismiss" onclick={ondismiss} aria-label="Dismiss">✕</button>
		{/if}
	</div>
{/if}

<style>
	.banner {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		background: linear-gradient(to bottom, #2a1414, #1a0a0a);
		border-radius: var(--radius-panel);
		box-shadow:
			inset 0 1px 0 rgba(255, 43, 28, 0.35),
			inset 0 -1px 0 #000,
			0 1px 0 rgba(0, 0, 0, 0.8),
			0 0 16px rgba(255, 43, 28, 0.18);
	}

	.msg {
		flex: 1;
		font-family: var(--font-data);
		font-size: 11px;
		letter-spacing: 0.16em;
		color: var(--color-led-red);
		text-shadow: 0 0 4px rgba(255, 43, 28, 0.5);
		text-transform: uppercase;
	}

	.dismiss {
		background: none;
		border: 0;
		color: var(--color-led-red);
		font-size: 14px;
		padding: 4px 8px;
		font-family: var(--font-data);
	}

	.dismiss:hover {
		color: var(--color-led-xenon);
	}
</style>
