// Set of callback fns that will run on each animation frame
const tasks = new Set<(now: number) => void>();
const asyncTasks = new Array<(now: number) => Promise<void>>();

const yieldMicrotask = () => new Promise<void>(queueMicrotask);
/**
 * frameLoop is a global animation frame loop, that allows for adding and removing tasks whenever desired.
 * Why a single frameloop? Imagine the map, each enemy, the player, etc. all calling RAF individually... Yeah, no bueno.
 */
export const frameLoop = requestFrame();

function requestFrame() {
	let frame: number;
	let running = false;
	let then: number;
	const _tasks: Promise<void>[] = [];
	// let delta = 0;
	// const run = async () => {
	// 	let then = performance.now();
	const processAsync = async (now: number) => {
		for (let idx = 0; idx < asyncTasks.length; idx++) {
			const task = asyncTasks[idx];
			task(now);
			// _tasks.push(task(now));
		}
		// Promise.allSettled(_tasks);
		_tasks.length = 0;
	};
	// 	const interval = 1000 / 60;
	// 	let delta = 0;
	// 	while (running) {
	// 		const now = await new Promise(requestAnimationFrame);
	// 		if (now - then < interval - delta) {
	// 			continue;
	// 		}
	// 		delta = Math.min(interval, delta + now - then - interval);
	// 		for (const task of tasks) {
	// 			task(now);
	// 		}
	// 		processAsync(now);
	// 		then = now;

	// 		// render code
	// 	}

	// 	// }
	// };
	const run = (now: number) => {
		const frameRate = 30;
		const timeout = 1000 / frameRate;
		if (!then) then = now;

		const elapsed = now - then;

		if (elapsed >= timeout) {
			then = now - (elapsed % timeout);
			for (const task of tasks.values()) {
				task(now);
			}
			queueMicrotask(() => {
				processAsync(now);
			});
		}

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
					frame = requestAnimationFrame(run);
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
			running = false;
			cancelAnimationFrame(frame);
			tasks.clear();
			asyncTasks.length = 0;
		}
	};
}
