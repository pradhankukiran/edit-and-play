export interface Marker {
	id: string;
	time: number;
	label: string;
}

let nextId = 0;
function makeId() {
	return `m${nextId++}`;
}

const DEDUPE_EPSILON = 0.05;

class MarkersState {
	list = $state<Marker[]>([]);
	sorted = $derived([...this.list].sort((a, b) => a.time - b.time));
	count = $derived(this.list.length);

	add(time: number, label?: string) {
		if (this.list.some((m) => Math.abs(m.time - time) < DEDUPE_EPSILON)) return;
		const autoLabel = label ?? `M${this.list.length + 1}`;
		this.list = [...this.list, { id: makeId(), time, label: autoLabel }];
	}

	remove(id: string) {
		this.list = this.list.filter((m) => m.id !== id);
	}

	clear() {
		this.list = [];
	}

	nextAfter(t: number): Marker | null {
		let best: Marker | null = null;
		for (const m of this.list) {
			if (m.time > t && (best === null || m.time < best.time)) best = m;
		}
		return best;
	}

	prevBefore(t: number): Marker | null {
		let best: Marker | null = null;
		for (const m of this.list) {
			if (m.time < t && (best === null || m.time > best.time)) best = m;
		}
		return best;
	}
}

export const markers = new MarkersState();
