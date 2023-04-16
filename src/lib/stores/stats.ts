import { writable } from "svelte/store";

export const LevelHandler = (() => {
	const { subscribe, set } = writable<{ isComplete?: boolean }>({ isComplete: false });

	return {
		subscribe,
		levelComplete(value: boolean) {
			set({ isComplete: value });
		},
		reset() {
			set({ isComplete: false });
		}
	};
})();
