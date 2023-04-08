// Set of callback fns that will run on each animation frame
const tasks = new Set<(now: number) => Promise<void> | void>();
const asyncTasks = new Set<(now: number) => Promise<void>>();

/**
 * frameLoop is a global animation frame loop, that allows for adding and removing tasks whenever desired.
 * Why a single frameloop? Imagine the map, each enemy, the player, etc. all calling RAF individually... Yeah, no bueno.
 */
export const frameLoop = requestFrame();
const yieldMicrotask = () => new Promise<void>((r) => queueMicrotask(r));
function requestFrame() {
	let frame: number;
	let running = false;
	let lastTs: number;
	const run = async () => {
		let then = performance.now();
		const interval = 1000 / 30;
		let delta = 0;
		while (running) {
			const now = await new Promise(requestAnimationFrame);
			if (now - then < interval - delta) {
				continue;
			}
			delta = Math.min(interval, delta + now - then - interval);
			then = now;
			// render code
			const asyncTasks = [];

			for (const it of tasks.values()) {
				const r = it(now);
				if (r?.then) asyncTasks.push(r);
			}
			await Promise.race(asyncTasks);
			await yieldMicrotask();
		}
	};

	return {
		/** Initialize a new callback to add the loop */
		add: (cb: (now: number) => void) => ({
			/** Adds the provided callback to the loop */
			start: function () {
				tasks.add(cb);
				if (!running) {
					running = true;
					frame = requestAnimationFrame(run);
				}
				return this;
			},
			/** Removes the provided callback from the loop */
			stop: function () {
				tasks.delete(cb);
				if (tasks.size < 1) {
					running = false;
					cancelAnimationFrame(frame);
				}
				return this;
			}
		}),
		/** Kills all callbacks, removing them from the loop, and kills the loop globally. */
		dispose: () => {
			tasks.clear();
			cancelAnimationFrame(frame);
		}
	};
}
