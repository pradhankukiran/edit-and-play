<script lang="ts">
	import { player } from '$lib/state/player.svelte';

	let dragging = $state(false);
	let input: HTMLInputElement;
	let error = $state<string | null>(null);

	function accept(file: File | null | undefined) {
		if (!file) return;
		if (!file.type.startsWith('video/')) {
			error = 'That file is not a video. Try an .mp4 (H.264 recommended).';
			return;
		}
		error = null;
		player.load(file);
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const f = e.dataTransfer?.files?.[0];
		accept(f);
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		dragging = true;
	}

	function onDragLeave() {
		dragging = false;
	}

	function onChange(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		accept(f);
	}
</script>

<div
	class="dropzone"
	class:dragging
	ondrop={onDrop}
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	role="button"
	tabindex="0"
	onclick={() => input.click()}
	onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && input.click()}
>
	<div class="frame">
		<div class="corner tl"></div>
		<div class="corner tr"></div>
		<div class="corner bl"></div>
		<div class="corner br"></div>

		<div class="stack">
			<div class="label">INSERT MEDIA</div>
			<div class="hint">drag a video file or click to browse</div>
			<div class="codec">MP4 / H.264 · WebM · MOV</div>
		</div>

		<div class="scanline" aria-hidden="true"></div>
	</div>

	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}

	<input
		bind:this={input}
		type="file"
		accept="video/*"
		onchange={onChange}
		hidden
	/>
</div>

<style>
	.dropzone {
		width: min(640px, 90vw);
		display: flex;
		flex-direction: column;
		gap: 12px;
		cursor: pointer;
		user-select: none;
	}

	.frame {
		position: relative;
		background: var(--color-well);
		border: 1px solid #000;
		box-shadow:
			inset 0 2px 6px rgba(0, 0, 0, 0.9),
			inset 0 -1px 0 var(--color-steel-hi),
			0 1px 0 rgba(255, 255, 255, 0.04);
		padding: 56px 48px;
		overflow: hidden;
		transition: box-shadow 180ms var(--ease-mechanical);
	}

	.dropzone:hover .frame,
	.dragging .frame {
		box-shadow:
			inset 0 0 0 1px var(--color-led-amber),
			inset 0 2px 6px rgba(0, 0, 0, 0.9),
			0 0 18px rgba(255, 180, 0, 0.18);
	}

	.corner {
		position: absolute;
		width: 14px;
		height: 14px;
		border-color: var(--color-led-amber);
		border-style: solid;
		border-width: 0;
		opacity: 0.8;
	}
	.corner.tl {
		top: 8px;
		left: 8px;
		border-top-width: 2px;
		border-left-width: 2px;
	}
	.corner.tr {
		top: 8px;
		right: 8px;
		border-top-width: 2px;
		border-right-width: 2px;
	}
	.corner.bl {
		bottom: 8px;
		left: 8px;
		border-bottom-width: 2px;
		border-left-width: 2px;
	}
	.corner.br {
		bottom: 8px;
		right: 8px;
		border-bottom-width: 2px;
		border-right-width: 2px;
	}

	.stack {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		position: relative;
		z-index: 1;
	}

	.label {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 28px;
		letter-spacing: 0.18em;
		color: var(--color-led-amber);
		text-shadow: var(--glow-amber);
	}

	.hint {
		font-family: var(--font-ui);
		font-size: 13px;
		letter-spacing: 0.06em;
		color: #9aa3ab;
		text-transform: uppercase;
	}

	.codec {
		margin-top: 14px;
		font-family: var(--font-data);
		font-size: 10px;
		letter-spacing: 0.24em;
		color: #5a6066;
	}

	.scanline {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(
			180deg,
			transparent 0%,
			rgba(255, 180, 0, 0.08) 48%,
			transparent 52%
		);
		opacity: 0;
		transform: translateY(-100%);
		transition: opacity 200ms;
	}

	.dropzone:hover .scanline,
	.dragging .scanline {
		opacity: 1;
		animation: scan 2.4s linear infinite;
	}

	@keyframes scan {
		from {
			transform: translateY(-100%);
		}
		to {
			transform: translateY(100%);
		}
	}

	.error {
		margin: 0;
		font-family: var(--font-data);
		font-size: 12px;
		color: var(--color-led-red);
		text-shadow: var(--glow-red);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	@media (prefers-reduced-motion: reduce) {
		.scanline {
			animation: none !important;
		}
	}
</style>
