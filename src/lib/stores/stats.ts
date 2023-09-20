import { clear_loops } from "$lib/utils/raf";
import { writable } from "svelte/store";

export const LevelHandler = (() => {
	let currentIdx = 0;
	const { subscribe, set } = writable<{ isComplete?: boolean; level: number }>({
		isComplete: false,
		level: currentIdx
	});

	return {
		subscribe,
		levelCompleteSecret(value: boolean) {
			clear_loops();
			currentIdx = 10;
			set({ isComplete: value, level: currentIdx });
		},
		levelComplete(value: boolean) {
			clear_loops();
			currentIdx += 1;

			set({ isComplete: value, level: currentIdx });
		},
		reset() {
			clear_loops();
			set({ isComplete: false, level: 0 });
		}
	};
})();

export const LevelStatManager = (() => {
	type Stats = {
		treasure: number;
		totalTreasure: number;
		kills: number;
		totalKills: number;
		secrets: number;
		totalSecrets: number;
	};
	type StatKey = keyof Stats;
	const getDefaultStatObj = (init: Partial<Stats>): Stats =>
		({
			treasure: 0,
			totalTreasure: 0,
			kills: 0,
			totalKills: 0,
			secrets: 0,
			...init
		} as Stats);
	const { subscribe, update, set } = writable<Stats>(getDefaultStatObj({}));

	return {
		subscribe,
		add(key: Exclude<StatKey, `total${string}`>) {
			update((u) => ({ ...u, [key]: u[key]++ }));
		},
		addTotalKey(key: Extract<StatKey, `total${string}`>) {
			update((u) => ({ ...u, [key]: (u[key] !== undefined ? u[key] : 0) + 1 }));
		},
		restart() {
			update((u) => {
				for (const key in u) {
					if (key.includes("total")) continue;
					u[key as keyof typeof u] = 0;
				}
				return u;
			});
		},
		reset() {
			set(getDefaultStatObj({}));
		}
	};
})();
