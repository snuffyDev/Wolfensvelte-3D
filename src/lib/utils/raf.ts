// Set of callback fns that will run on each animation frame
const tasks = new Set<(now: number) => void>();
const asyncTasks = new Array<(now: number) => Promise<void>>();

/**
 * frameLoop is a global animation frame loop, that allows for adding and removing tasks whenever desired.
 * Why a single frameloop? Imagine the map, each enemy, the player, etc. all calling RAF individually... Yeah, no bueno.
 */
export const frameLoop = requestFrame();

function requestFrame() {
	let frame: number;
	let running = false;
	let then: number;
	const processAsync = async (now: number) => {
		await Promise.allSettled(asyncTasks.map((cb) => cb(now)));
	};
	let delta = 0;
	const run = (now: number) => {
		if (!then) then = now;
		const interval = 1000 / 29;
		if (now - then < interval - delta) {
			// if (frame) cancelAnimationFrame(frame);
			frame = requestAnimationFrame(run);
			return;
		}
		delta = Math.min(interval, delta + now - then - interval);

		for (const it of tasks.values()) {
			it(now);
		}

		processAsync(now);

		then = now;
		// if (frame) cancelAnimationFrame(frame);
		frame = requestAnimationFrame(run);
	};

	return {
		/** Initialize a new callback to add the loop */
		add: (cb: (now: number) => void | Promise<void>, async?: boolean) => ({
			/** Adds the provided callback to the loop */
			start: function () {
				if (async) {
					asyncTasks.push(cb as (now: number) => Promise<void>);
				} else {
					tasks.add(cb);
				}
				if (!running) {
					running = true;
					requestAnimationFrame(run);
				}
				return this;
			},
			/** Removes the provided callback from the loop */
			stop: function () {
				if (async) {
					const hasCb = asyncTasks.findIndex(cb as () => Promise<void>);
					if (hasCb) asyncTasks.splice(hasCb, 1);
				} else {
					tasks.delete(cb);
				}
				if (tasks.size < 1 && asyncTasks.length < 1) {
					running = false;
					cancelAnimationFrame(frame);
				}
				return this;
			}
		}),
		/** Kills all callbacks, removing them from the loop, and kills the loop globally. */
		dispose: () => {
			cancelAnimationFrame(frame);
			tasks.clear();
			asyncTasks.length = 0;
		}
	};
}
