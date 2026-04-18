<script lang="ts">
	import { player } from '$lib/state/player.svelte';
	import KnobButton from './KnobButton.svelte';
	import Timecode from './Timecode.svelte';

	interface Props {
		onmarkIn?: () => void;
		onmarkOut?: () => void;
		onexport?: () => void;
	}

	let { onmarkIn, onmarkOut, onexport }: Props = $props();
</script>

<div class="bar">
	<div class="group readout">
		<Timecode time={player.currentTime} fps={player.fps} label="T/C" color="phosphor" />
	</div>

	<div class="group transport">
		<KnobButton
			label="IN"
			sublabel="[I]"
			accent="red"
			onclick={() => onmarkIn?.()}
			disabled={!player.ready}
		/>
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
		<KnobButton
			label="OUT"
			sublabel="[O]"
			accent="amber"
			onclick={() => onmarkOut?.()}
			disabled={!player.ready}
		/>
	</div>

	<div class="group export">
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
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 24px;
		padding: 18px 22px 14px;
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

	.group {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.transport {
		justify-content: center;
	}

	.export {
		justify-self: end;
	}

	@media (max-width: 720px) {
		.bar {
			grid-template-columns: 1fr;
			gap: 12px;
		}
		.export {
			justify-self: stretch;
		}
	}
</style>
