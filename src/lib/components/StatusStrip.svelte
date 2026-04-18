<script lang="ts">
	import { player } from '$lib/state/player.svelte';
	import { trim } from '$lib/state/trim.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { click as clickSfx } from '$lib/media/sfx';
	import { onMount } from 'svelte';
	import LED from './LED.svelte';
	import Timecode from './Timecode.svelte';
	import VUMeter from './VUMeter.svelte';

	let cpu = $state(0);
	let raf: number | null = null;

	onMount(() => {
		let phase = 0;
		const tick = () => {
			phase += 0.03;
			const base = player.playing ? 0.45 : 0.12;
			const jitter = player.playing ? 0.18 : 0.04;
			cpu = base + Math.sin(phase) * jitter + (Math.random() - 0.5) * 0.06;
			cpu = Math.max(0, Math.min(1, cpu));
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => {
			if (raf !== null) cancelAnimationFrame(raf);
		};
	});

	function toggleMute() {
		player.muted = !player.muted;
		clickSfx();
	}

	function toggleSfx() {
		ui.toggleSound();
		clickSfx();
	}

	const resolution = $derived(player.width > 0 ? `${player.width}×${player.height}` : '----');
	const selection = $derived(trim.selected);
</script>

<div class="status">
	<div class="left">
		<div class="group">
			<LED color="red" on={player.playing} blink={player.playing} />
			<span class="lbl" data-on={player.playing}>REC</span>
		</div>

		<div class="group">
			<LED color="green" on={player.ready} />
			<span class="lbl" data-on={player.ready}>RDY</span>
		</div>

		<button
			type="button"
			class="mute"
			onclick={toggleMute}
			aria-pressed={player.muted}
			aria-label="Toggle mute"
		>
			<LED color="amber" on={player.muted} />
			<span class="lbl" data-on={player.muted}>MUTE</span>
		</button>

		<button
			type="button"
			class="mute"
			onclick={toggleSfx}
			aria-pressed={ui.soundEnabled}
			aria-label="Toggle interface sounds"
		>
			<LED color="green" on={ui.soundEnabled} />
			<span class="lbl" data-on={ui.soundEnabled}>SFX</span>
		</button>
	</div>

	<div class="center">
		<VUMeter />
	</div>

	<div class="right">
		<div class="readout">
			<span class="k">T/C</span>
			<Timecode time={player.currentTime} fps={player.fps} size={16} />
		</div>
		<div class="data">
			<div><span class="k">DUR</span> <span class="v">{player.duration.toFixed(2)}s</span></div>
			<div><span class="k">SEL</span> <span class="v">{selection.toFixed(2)}s</span></div>
			<div><span class="k">RES</span> <span class="v">{resolution}</span></div>
			<div><span class="k">FPS</span> <span class="v">{player.fps}</span></div>
		</div>
		<div class="cpu">
			<span class="k">LOAD</span>
			<div class="cpu-bar" style="--w: {cpu * 100}%">
				<div class="fill"></div>
			</div>
		</div>
	</div>
</div>

<style>
	.status {
		position: relative;
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 18px;
		align-items: stretch;
		padding: 14px 16px 10px;
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
			0 1px 0 rgba(0, 0, 0, 0.6);
	}

	.status::before {
		content: 'STATUS';
		position: absolute;
		top: 3px;
		left: 10px;
		font-family: var(--font-data);
		font-size: 8px;
		letter-spacing: 0.38em;
		color: #4a4f54;
	}

	.left {
		display: flex;
		flex-direction: column;
		gap: 6px;
		justify-content: center;
	}

	.group,
	.mute {
		display: flex;
		align-items: center;
		gap: 6px;
		background: none;
		border: 0;
		padding: 2px 0;
		cursor: default;
	}

	.mute {
		cursor: pointer;
	}

	.lbl {
		font-family: var(--font-data);
		font-size: 9px;
		letter-spacing: 0.24em;
		color: #5a6066;
		text-transform: uppercase;
		transition: color 120ms, text-shadow 120ms;
	}

	.lbl[data-on='true'] {
		color: var(--color-led-xenon);
	}

	.mute .lbl[data-on='true'] {
		color: var(--color-led-amber);
		text-shadow: 0 0 6px rgba(255, 180, 0, 0.5);
	}

	.center {
		display: grid;
		place-items: center;
	}

	.right {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.readout {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
	}

	.data {
		display: grid;
		grid-template-columns: auto auto;
		gap: 1px 10px;
		font-family: var(--font-data);
		font-size: 10px;
		letter-spacing: 0.14em;
	}

	.data .k,
	.readout .k,
	.cpu .k {
		color: #5a6066;
		text-transform: uppercase;
	}

	.data .v {
		color: var(--color-led-xenon);
	}

	.cpu {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 80px;
	}

	.cpu-bar {
		position: relative;
		width: 100%;
		height: 8px;
		background: var(--color-well);
		border-radius: 2px;
		box-shadow:
			inset 0 1px 2px rgba(0, 0, 0, 0.9),
			inset 0 -1px 0 rgba(255, 255, 255, 0.03);
		overflow: hidden;
	}

	.fill {
		position: absolute;
		inset: 1px;
		width: var(--w);
		background: linear-gradient(
			to right,
			var(--color-led-green) 0%,
			var(--color-led-amber) 75%,
			var(--color-led-red) 100%
		);
		box-shadow: 0 0 6px rgba(59, 255, 124, 0.4);
		transition: width 80ms linear;
	}

	@media (max-width: 720px) {
		.status {
			grid-template-columns: 1fr;
			gap: 12px;
		}
		.right {
			flex-wrap: wrap;
			gap: 10px;
		}
	}
</style>
