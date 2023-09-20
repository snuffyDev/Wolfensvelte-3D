// Based on https://github.com/sveltejs/svelte/blob/master/packages/svelte/src/runtime/internal/loop.js
export interface Task {
	abort(): void;
	promise: Promise<void>;
}

export type TaskCallback = (
	now: number,
	scheduler: (cb: () => void) => void
) => void | boolean | Promise<boolean | void>;
type TaskEntry = { c: TaskCallback; f: () => void };

const tasks = new Set<TaskEntry>();
const prerender_queue = new Array<() => void>();

const add_to_queue = (cb: () => void) => {
	prerender_queue.push(cb);
};

const TARGET_FPS = 1000 / 33;
async function run_async(now: number) {
	return new Promise<void>((resolve) => {
		const q = Array.from(tasks);
		for (let idx = 0; idx < tasks.size; idx++) {
			const task = q[idx];
			const r = task.c(now, add_to_queue);
			if (typeof (r as Promise<void>)?.then !== "undefined") {
				Promise.resolve(r)
					.then((r) => {
						if (!r) {
							tasks.delete(task);
							task.f();
						}
					})
					.catch((r) => console.error(r))
					.finally(() => {
						task.f();
					});
			} else {
				if (r === false) {
					tasks.delete(task);
					task.f();
				}
			}
			if (idx === tasks.size - 1) resolve();
		}
	});
}

let running = false;

async function run_tasks() {
	let then: number | undefined = undefined;
	while (running) {
		const now = await new Promise<number>((resolve) => requestAnimationFrame(resolve));
		if (tasks.size === 0) {
			running = false;
			break;
		}
		if (!then) then = now;
		const elapsed = (now - then) as number;
		if (elapsed > TARGET_FPS) {
			await run_async(now);

			while (prerender_queue.length) {
				try {
					prerender_queue.shift()?.();
				} catch (e) {
					// no empty
				}
			}
			then = now - (elapsed % TARGET_FPS);
		}
	}
}

export function clear_loops() {
	tasks.clear();
}

/**
 * frameLoop is a global animation frame loop, that allows for adding and removing tasks whenever desired.
 * Why a single frameloop? Imagine the map, each enemy, the player, etc. all calling RAF individually... Yeah, no bueno.
 */
export function frameLoop(callback: TaskCallback): Task {
	let task: TaskEntry;

	if (tasks.size === 0) {
		requestAnimationFrame(run_tasks);
		running = true;
	}

	return {
		promise: new Promise((fulfill) => {
			tasks.add((task = { c: callback, f: fulfill }));
		}),
		abort() {
			tasks.delete(task);
		}
	};
}
