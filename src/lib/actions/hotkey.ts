import type { Action } from 'svelte/action';

export type HotkeyHandler = (event: KeyboardEvent) => void;

export interface HotkeyMap {
	[combo: string]: HotkeyHandler;
}

interface Combo {
	key: string;
	shift: boolean;
	ctrl: boolean;
	alt: boolean;
	meta: boolean;
}

function parse(combo: string): Combo {
	const parts = combo.toLowerCase().split('+').map((p) => p.trim());
	const modifiers = { shift: false, ctrl: false, alt: false, meta: false };
	let key = '';
	for (const p of parts) {
		if (p === 'shift') modifiers.shift = true;
		else if (p === 'ctrl' || p === 'control') modifiers.ctrl = true;
		else if (p === 'alt') modifiers.alt = true;
		else if (p === 'meta' || p === 'cmd' || p === 'command') modifiers.meta = true;
		else key = p;
	}
	return { key, ...modifiers };
}

function matches(event: KeyboardEvent, combo: Combo): boolean {
	const eventKey = (event.key === ' ' ? 'space' : event.key).toLowerCase();
	if (eventKey !== combo.key) return false;
	if (event.shiftKey !== combo.shift) return false;
	if (event.ctrlKey !== combo.ctrl) return false;
	if (event.altKey !== combo.alt) return false;
	if (event.metaKey !== combo.meta) return false;
	return true;
}

function isEditableTarget(t: EventTarget | null): boolean {
	if (!(t instanceof HTMLElement)) return false;
	const tag = t.tagName;
	return (
		tag === 'INPUT' ||
		tag === 'TEXTAREA' ||
		tag === 'SELECT' ||
		t.isContentEditable
	);
}

export const hotkey: Action<HTMLElement, HotkeyMap> = (_node, initialMap = {}) => {
	let parsed: Array<{ combo: Combo; handler: HotkeyHandler }> = [];

	function rebuild(map: HotkeyMap) {
		parsed = Object.entries(map).map(([k, h]) => ({ combo: parse(k), handler: h }));
	}

	function onKey(e: KeyboardEvent) {
		if (isEditableTarget(e.target)) return;
		for (const { combo, handler } of parsed) {
			if (matches(e, combo)) {
				e.preventDefault();
				handler(e);
				return;
			}
		}
	}

	rebuild(initialMap);
	window.addEventListener('keydown', onKey);

	return {
		update(next: HotkeyMap) {
			rebuild(next);
		},
		destroy() {
			window.removeEventListener('keydown', onKey);
		}
	};
};
