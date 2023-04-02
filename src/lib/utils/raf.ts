// Set of callback fns that will run on each animation frame
const tasks = new Set<(now: number) => void>();

/**
 * frameLoop is a global animation frame loop, that allows for adding and removing tasks whenever desired.
 * Why a single frameloop? Imagine the map, each enemy, the player, etc. all calling RAF individually... Yeah, no bueno.
 */
export const frameLoop = requestFrame();

function requestFrame() {
	let frame: number;
	let running = false;
	let lastTs: number;
	const run = (now: number) => {
		if (!lastTs) lastTs = now;
		const lastLap = now - lastTs;

		/** Run each callback every 32ms */
		if (lastLap > 33.3) {
			if (frame) cancelAnimationFrame(frame);
			const iter = tasks.values();
			let node: ReturnType<typeof iter.next> = iter.next();
			while (!node.done) {
				node.value(lastLap);
				node = iter.next();
			}
			lastTs = now;
			frame = requestAnimationFrame(run);
		} else {
			frame = requestAnimationFrame(run);
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
			cancelAnimationFrame(frame);
			tasks.clear();
		}
	};
}
