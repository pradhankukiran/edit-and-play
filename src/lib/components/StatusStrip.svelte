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

	function eject() {
		clickSfx();
		player.clear();
	}

	const resolution = $derived(player.width > 0 ? `${player.width}×${player.height}` : '----');
</script>

<div class="status">
	<div class="timecode-section">
		<span class="section-tag">T/C</span>
		<Timecode time={player.currentTime} fps={player.fps} size={20} color="phosphor" />
	</div>

	<VUMeter />

	<div class="led-bar">
		<span class="led-item">
			<LED color="red" on={player.playing} blink={player.playing} />
			<span class="lbl" data-on={player.playing}>REC</span>
		</span>
		<span class="led-item">
			<LED color="green" on={player.ready} />
			<span class="lbl" data-on={player.ready}>RDY</span>
		</span>
	</div>

	<div class="toggle-bar">
		<button
			type="button"
			class="toggle"
			onclick={toggleMute}
			aria-pressed={player.muted}
			aria-label="Toggle mute"
		>
			<LED color="amber" on={player.muted} />
			<span class="lbl" data-on={player.muted}>MUTE</span>
		</button>
		<button
			type="button"
			class="toggle"
			onclick={toggleSfx}
			aria-pressed={ui.soundEnabled}
			aria-label="Toggle interface sounds"
		>
			<LED color="green" on={ui.soundEnabled} />
			<span class="lbl" data-on={ui.soundEnabled}>SFX</span>
		</button>
		<button
			type="button"
			class="toggle eject"
			onclick={eject}
			aria-label="Eject and load a different video"
		>
			<span class="eject-icon">⏏</span>
			<span class="lbl">EJECT</span>
		</button>
	</div>

	<div class="data">
		<div><span class="k">DUR</span><span class="v">{player.duration.toFixed(2)}s</span></div>
		<div><span class="k">SEL</span><span class="v">{trim.selected.toFixed(2)}s</span></div>
		<div><span class="k">RES</span><span class="v">{resolution}</span></div>
		<div><span class="k">FPS</span><span class="v">{player.fps}</span></div>
	</div>

	<div class="cpu">
		<span class="k">LOAD</span>
		<div class="cpu-bar" style="--w: {cpu * 100}%">
			<div class="fill"></div>
		</div>
	</div>
</div>

<style>
	.status {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 12px;
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
			0 1px 0 rgba(0, 0, 0, 0.6);
	}

	.status::before {
		content: 'STATUS';
		position: absolute;
		top: 4px;
		left: 10px;
		font-family: var(--font-data);
		font-size: 8px;
		letter-spacing: 0.38em;
		color: #4a4f54;
	}

	.timecode-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.section-tag {
		font-family: var(--font-data);
		font-size: 9px;
		letter-spacing: 0.32em;
		color: #5a6066;
		text-transform: uppercase;
	}

	.led-bar,
	.toggle-bar {
		display: flex;
		justify-content: space-around;
		flex-wrap: wrap;
		gap: 6px 10px;
		padding: 6px 0;
	}

	.toggle-bar {
		padding-top: 2px;
		padding-bottom: 6px;
		border-top: 1px dashed rgba(255, 255, 255, 0.05);
		border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
	}

	.led-item,
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: none;
		border: 0;
		padding: 2px 4px;
	}

	.toggle {
		cursor: pointer;
	}

	.lbl {
		font-family: var(--font-data);
		font-size: 9px;
		letter-spacing: 0.22em;
		color: #5a6066;
		text-transform: uppercase;
		transition: color 120ms, text-shadow 120ms;
	}

	.lbl[data-on='true'] {
		color: var(--color-led-xenon);
	}

	.toggle .lbl[data-on='true'] {
		color: var(--color-led-amber);
		text-shadow: 0 0 6px rgba(255, 180, 0, 0.5);
	}

	.eject .eject-icon {
		display: inline-block;
		width: 10px;
		text-align: center;
		line-height: 10px;
		color: #9aa3ab;
		font-size: 11px;
	}

	.eject:hover .eject-icon,
	.eject:hover .lbl {
		color: var(--color-led-xenon);
	}

	.data {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px 10px;
		font-family: var(--font-data);
		font-size: 10px;
		letter-spacing: 0.14em;
	}

	.data > div {
		display: flex;
		justify-content: space-between;
		gap: 4px;
	}

	.data .k,
	.cpu .k {
		color: #5a6066;
		text-transform: uppercase;
	}

	.data .v {
		color: var(--color-led-xenon);
	}

	.cpu {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.cpu-bar {
		position: relative;
		flex: 1;
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
</style>
