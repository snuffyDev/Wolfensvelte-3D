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

type TaskCallback = (now: number) => boolean | void;
type TaskEntry = { c: TaskCallback; f: () => void };

const tasks = new Set<TaskEntry>();

function run_tasks(now: number) {
	tasks.forEach((task) => {
		if (!task.c(now)) {
			tasks.delete(task);
			task.f();
		}
	});

	if (tasks.size !== 0) requestAnimationFrame(run_tasks);
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