export const compare = <T>(item: T, callback: (item: T) => boolean): item is T => {
	return callback(item);
};
