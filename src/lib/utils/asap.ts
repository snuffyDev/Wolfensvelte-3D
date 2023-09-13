const taskQueue: (() => void)[] = [];
let flushing = false;
let index = 0;
let requestFlush: () => void;

export function asap(task: () => void) {
	if (!taskQueue.length) {
		requestFlush();
		flushing = true;
	}
	taskQueue[taskQueue.length] = task;
}

function flush() {
	while (index < taskQueue.length) {
		const currentIndex = index;
		index += 1;
		taskQueue[currentIndex].call(null);

		if (index > 1024) {
			for (let scan = 0, newL = taskQueue.length - index; scan < newL; scan++) {
				taskQueue[scan] = taskQueue[scan + index];
			}
			taskQueue.length -= index;
			index = 0;
		}
	}
	taskQueue.length = 0;
	index = 0;
	flushing = false;
}

function makeRequestCallFromMutationObserver(callback: MutationCallback) {
	let toggle = 1;
	const observer = new MutationObserver(callback);
	const node = document.createTextNode("");
	observer.observe(node, { characterData: true });
	return function requestCall() {
		toggle = -toggle;
		node.data = toggle.toString();
	};
}
if (typeof MutationObserver !== "undefined") {
	requestFlush = makeRequestCallFromMutationObserver(flush);
}
