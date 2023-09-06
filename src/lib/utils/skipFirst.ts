export const skipFirstInvocation = <T extends any[]>(cb: (...args: T) => void) => {
	let count = -1;
	return (...args: T) => {
		if (++count === 0) return;
		return cb(...args);
	};
};
