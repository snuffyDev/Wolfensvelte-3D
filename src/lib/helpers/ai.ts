import { CurrentLevel } from "$lib/components/Level.svelte";
import type { Position2D } from "$lib/types/position";

type Path = Array<Position2D>;

export function findPath(start: Position2D, end: Position2D): Path | null {
	const queue: Array<Position2D> = [start];
	const visited: Array<string> = [getKey(start)];

	// A dictionary to store the previous position of each visited position
	const previous: { [key: string]: Position2D } = {};

	while (queue.length > 0) {
		const current = queue.shift()!;
		if (current.x === end.x && current.z === end.z) {
			return getPath(previous, start, end);
		}
		const neighbors = getNeighbors(current);
		for (const neighbor of neighbors) {
			const key = getKey(neighbor);
			if (!visited.includes(key)) {
				visited.push(key);
				previous[key] = current;
				queue.push(neighbor);
			}
		}
	}
	return null;
}

function getKey(position: Position2D): string {
	return `${position.x},${position.z}`;
}

function getPath(
	previous: { [key: string]: Position2D },
	start: Position2D,
	end: Position2D
): Path {
	const path: Path = [];
	let current = end;
	while (!(current.x === start.x && current.z === start.z)) {
		path.unshift(current);
		current = previous[getKey(current)];
	}
	path.unshift(start);
	return path;
}

function getNeighbors(position: Position2D): Array<Position2D> {
	const neighbors = [];
	const x = position.x;
	const z = position.z;

	if (x > 0 && !isBlocked(x - 1, z)) {
		neighbors.push({ x: x - 1, z: z });
	}
	if (z > 0 && !isBlocked(x, z - 1)) {
		neighbors.push({ x: x, z: z - 1 });
	}
	if (x < 64 - 1 && !isBlocked(x + 1, z)) {
		neighbors.push({ x: x + 1, z: z });
	}
	if (z < 64 - 1 && !isBlocked(x, z + 1)) {
		neighbors.push({ x: x, z: z + 1 });
	}

	return neighbors;
}

function isBlocked(x: number, z: number): boolean {
	return !!CurrentLevel.checkCollisionWithWorld({ x, z });
}
