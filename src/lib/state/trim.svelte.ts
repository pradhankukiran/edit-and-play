export interface Segment {
	id: string;
	inPoint: number;
	outPoint: number;
}

let nextId = 0;
function makeId() {
	return `s${nextId++}`;
}

function clamp(v: number, lo: number, hi: number) {
	return Math.max(lo, Math.min(v, hi));
}

class TrimState {
	segments = $state<Segment[]>([]);
	duration = $state(0);
	selectedId = $state<string | null>(null);

	isActive = $derived(this.segments.length > 0);
	sorted = $derived([...this.segments].sort((a, b) => a.inPoint - b.inPoint));
	totalDuration = $derived(
		this.segments.reduce((sum, s) => sum + Math.max(0, s.outPoint - s.inPoint), 0)
	);
	selected = $derived(
		this.segments.find((s) => s.id === this.selectedId) ?? this.segments[0] ?? null
	);

	get inPoint(): number {
		return this.sorted[0]?.inPoint ?? 0;
	}

	get outPoint(): number {
		return this.sorted[this.sorted.length - 1]?.outPoint ?? this.duration;
	}

	reset(duration: number) {
		this.duration = duration;
		const id = makeId();
		this.segments = [{ id, inPoint: 0, outPoint: duration }];
		this.selectedId = id;
	}

	clearAll() {
		this.segments = [];
		this.selectedId = null;
	}

	#activeSegment(): Segment | null {
		return this.selected ?? this.segments[0] ?? null;
	}

	markIn(t: number) {
		const clamped = clamp(t, 0, this.duration);
		const active = this.#activeSegment();
		if (active) {
			active.inPoint = Math.min(clamped, active.outPoint);
			this.segments = [...this.segments];
			return;
		}
		const id = makeId();
		this.segments = [{ id, inPoint: clamped, outPoint: this.duration }];
		this.selectedId = id;
	}

	markOut(t: number) {
		const clamped = clamp(t, 0, this.duration);
		const active = this.#activeSegment();
		if (active) {
			active.outPoint = Math.max(clamped, active.inPoint);
			this.segments = [...this.segments];
			return;
		}
		const id = makeId();
		this.segments = [{ id, inPoint: 0, outPoint: clamped }];
		this.selectedId = id;
	}

	setIn(t: number) {
		const active = this.#activeSegment();
		if (!active) return;
		active.inPoint = clamp(t, 0, active.outPoint);
		this.segments = [...this.segments];
	}

	setOut(t: number) {
		const active = this.#activeSegment();
		if (!active) return;
		active.outPoint = clamp(t, active.inPoint, this.duration);
		this.segments = [...this.segments];
	}

	updateSegment(id: string, patch: { inPoint?: number; outPoint?: number }) {
		const seg = this.segments.find((s) => s.id === id);
		if (!seg) return;
		if (patch.inPoint !== undefined) {
			seg.inPoint = clamp(patch.inPoint, 0, seg.outPoint);
		}
		if (patch.outPoint !== undefined) {
			seg.outPoint = clamp(patch.outPoint, seg.inPoint, this.duration);
		}
		this.segments = [...this.segments];
	}

	splitAt(t: number) {
		const idx = this.segments.findIndex((s) => t > s.inPoint && t < s.outPoint);
		if (idx < 0) return;
		const seg = this.segments[idx];
		const first = { id: makeId(), inPoint: seg.inPoint, outPoint: t };
		const second = { id: makeId(), inPoint: t, outPoint: seg.outPoint };
		const next = [...this.segments];
		next.splice(idx, 1, first, second);
		this.segments = next;
		this.selectedId = second.id;
	}

	removeSegment(id: string) {
		this.segments = this.segments.filter((s) => s.id !== id);
		if (this.selectedId === id) {
			this.selectedId = this.segments[0]?.id ?? null;
		}
	}

	selectSegment(id: string) {
		if (this.segments.some((s) => s.id === id)) {
			this.selectedId = id;
		}
	}
}

export const trim = new TrimState();
