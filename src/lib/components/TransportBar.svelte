<script lang="ts">
	import { player } from '$lib/state/player.svelte';
	import KnobButton from './KnobButton.svelte';

	interface Props {
		onmarkIn?: () => void;
		onmarkOut?: () => void;
		onexport?: () => void;
	}

	let { onmarkIn, onmarkOut, onexport }: Props = $props();
</script>

<div class="bar">
	<div class="row primary">
		<KnobButton
			label="‹‹"
			sublabel="FRAME"
			size="sm"
			onclick={() => player.step(-1)}
			disabled={!player.ready}
		/>
		<KnobButton
			label={player.playing ? '⏸' : '▶'}
			sublabel={player.playing ? 'PAUSE' : 'PLAY'}
			accent="green"
			active={player.playing}
			size="lg"
			onclick={() => player.toggle()}
			disabled={!player.ready}
		/>
		<KnobButton
			label="››"
			sublabel="FRAME"
			size="sm"
			onclick={() => player.step(1)}
			disabled={!player.ready}
		/>
	</div>

	<div class="row marks">
		<KnobButton
			label="IN"
			sublabel="[I]"
			accent="red"
			onclick={() => onmarkIn?.()}
			disabled={!player.ready}
		/>
		<KnobButton
			label="OUT"
			sublabel="[O]"
			accent="amber"
			onclick={() => onmarkOut?.()}
			disabled={!player.ready}
		/>
	</div>

	<div class="row export">
		<KnobButton
			label="EXPORT"
			sublabel="[E]"
			accent="red"
			size="lg"
			onclick={() => onexport?.()}
			disabled={!player.ready}
		/>
	</div>
</div>

<style>
	.bar {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 18px 16px 14px;
		background:
			repeating-linear-gradient(
				90deg,
				rgba(255, 255, 255, 0.015) 0 1px,
				transparent 1px 2px
			),
			linear-gradient(to bottom, var(--color-charcoal), var(--color-graphite));
		border-radius: var(--radius-panel);
		box-shadow:
			inset 0 1px 0 var(--color-steel-hi),
			inset 0 -1px 0 #000,
			0 2px 4px rgba(0, 0, 0, 0.6);
	}

	.bar::before {
		content: 'TRANSPORT';
		position: absolute;
		top: 4px;
		left: 10px;
		font-family: var(--font-data);
		font-size: 8px;
		letter-spacing: 0.38em;
		color: #4a4f54;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.row.primary {
		justify-content: center;
	}

	.row.marks {
		justify-content: space-between;
		padding: 0 4px;
	}

	.row.export {
		justify-content: center;
		padding-top: 4px;
		border-top: 1px dashed rgba(255, 255, 255, 0.05);
		margin-top: 2px;
	}
</style>
