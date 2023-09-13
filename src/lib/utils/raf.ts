// Based on https://github.com/sveltejs/svelte/blob/master/packages/svelte/src/runtime/internal/loop.js

import { browser } from "$app/environment";
import { asap } from "./asap";

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

const TARGET_FPS = 1000 / 24;
async function run_async(now: number) {
	const _tasks: TaskEntry[] = [];
	for (const task of tasks) {
		_tasks.push(task);
	}

	await Promise.all(
		_tasks.map(async (v) => {
			try {
				if (!(await v.c(now, add_to_queue))) {
					tasks.delete(v);
					v.f();
				}
			} catch (e) {
				console.error(e);
			}
		})
	);
}

let running = false;

async function run_tasks() {
	let then: number | undefined = undefined;
	while (running) {
		if (tasks.size === 0) {
			running = false;
			break;
		}
		const now = await new Promise<number>((resolve) => requestAnimationFrame(resolve));
		if (!then) then = now;
		const elapsed = (now - then) as number;
		if (elapsed > TARGET_FPS) {
			then = now - (elapsed % TARGET_FPS);

			queueMicrotask(() => {
				run_async(now);
			});
			while (prerender_queue.length) {
				try {
					prerender_queue.shift()?.();
				} catch (e) {
					console.error(e);
				}
			}
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
