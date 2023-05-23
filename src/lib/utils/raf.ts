// Set of callback fns that will run on each animation frame

import { browser } from "$app/environment";

const yieldMicrotask = () => new Promise<void>(queueMicrotask);
/**
 * frameLoop is a global animation frame loop, that allows for adding and removing tasks whenever desired.
 * Why a single frameloop? Imagine the map, each enemy, the player, etc. all calling RAF individually... Yeah, no bueno.
 */

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
let then: number;
const TARGET_FPS = 1000 / 24;
async function run_async(now: number) {
	const _tasks: TaskEntry[] = [];
	for (const task of tasks) {
		_tasks.push(task);
	}
	await Promise.allSettled(
		_tasks.map(async (v) => {
			if (!(await v.c(now, add_to_queue))) {
				tasks.delete(v);
				v.f();
			}
		})
	);
}
function run_tasks(now: number) {
	if (!then) then = now;
	const elapsed = now - then;

	if (elapsed > TARGET_FPS) {
		then = now - (elapsed % TARGET_FPS);

		run_async(now);
	}

	if (tasks.size !== 0) {
		while (prerender_queue.length) {
			const cb = prerender_queue.shift()!;
			cb();
		}
		requestAnimationFrame(run_tasks);
	}
}

/**
 * For testing purposes only!
 */
export function clear_loops() {
	tasks.clear();
}

/**
 * Creates a new task that runs on each raf frame
 * until it returns a falsy value or is aborted
 */
export function frameLoop(callback: TaskCallback): Task {
	let task: TaskEntry;

	if (tasks.size === 0) requestAnimationFrame(run_tasks);

	return {
		promise: new Promise((fulfill) => {
			tasks.add((task = { c: callback, f: fulfill }));
		}),
		abort() {
			tasks.delete(task);
		}
	};
}
