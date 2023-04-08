// Set of callback fns that will run on each animation frame
const tasks = new Set<(now: number) => Promise<void> | void>();
const asyncTasks = new Set<(now: number) => Promise<void>>();

/**
 * frameLoop is a global animation frame loop, that allows for adding and removing tasks whenever desired.
 * Why a single frameloop? Imagine the map, each enemy, the player, etc. all calling RAF individually... Yeah, no bueno.
 */
export const frameLoop = requestFrame();

function requestFrame() {
	let frame: number;
	let running = false;
	let then: number;
	const run = (now: number) => {
		if (!then) then = now;
		const interval = 1000 / 30;
		let delta = 0;
		if (now - then < interval - delta) {
			if (frame) cancelAnimationFrame(frame);
			frame = requestAnimationFrame(run);

			return;
		}
		delta = Math.min(interval, delta + now - then - interval);
		// if (frame) cancelAnimationFrame(frame);
		// render code
		// const asyncTasks = [];

		// await Promise.race(asyncTasks);
		for (const it of tasks.values()) {
			it(now);
			// await yieldMicrotask();
		}
		then = now;
		frame = requestAnimationFrame(run);
		// frame = requestAnimationFrame(run);
	};

	return {
		/** Initialize a new callback to add the loop */
		add: (cb: (now: number) => void) => ({
			/** Adds the provided callback to the loop */
			start: function () {
				tasks.add(cb);
				if (!running) {
					running = true;
					requestAnimationFrame(run);
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
