import { CurrentLevel } from "$lib/components/Level.svelte";
import type { Position2D } from "$lib/types/position";

type Path = Array<Position2D>;

export function findPath(start: Position2D, goal: Position2D): Position2D[] {
	const world = CurrentLevel.get();
	function heuristic(a: Position2D, b: Position2D): number {
		return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
	}

	function getNeighbors(pos: Position2D): Position2D[] {
		const neighbors: Position2D[] = [
			{ x: pos.x - 1, z: pos.z },
			{ x: pos.x + 1, z: pos.z },
			{ x: pos.x, z: pos.z - 1 },
			{ x: pos.x, z: pos.z + 1 }
		];

		return neighbors.filter(
			(neighbor) =>
				neighbor.x >= 0 &&
				neighbor.x < world.length &&
				neighbor.z >= 0 &&
				neighbor.z < world[0].length &&
				world[neighbor.x][neighbor.z].model !== null &&
				typeof world[neighbor.x][neighbor.z].model !== "object" &&
				world[neighbor.x][neighbor.z].surfaces === null
		);
	}

	const openSet: Position2D[] = [start];
	const cameFrom: Map<string, Position2D> = new Map();
	const gScore: Map<string, number> = new Map();
	const fScore: Map<string, number> = new Map();

	function posToStr(pos: Position2D): string {
		return `${Math.floor(pos.x)},${Math.floor(pos.z)}`;
	}

	world.forEach((row, x) => {
		row.forEach((_, z) => {
			const posStr = posToStr({ x, z });
			gScore.set(posStr, Infinity);
			fScore.set(posStr, Infinity);
		});
	});

	gScore.set(posToStr(start), 0);
	fScore.set(posToStr(start), heuristic(start, goal));

	while (openSet.length) {
		const current = openSet.reduce((min, pos) =>
			fScore.get(posToStr(pos))! < fScore.get(posToStr(min))! ? pos : min
		);

		if (current.x === goal.x && current.z === goal.z) {
			const path: Position2D[] = [current];
			let temp = current;

			while (cameFrom.has(posToStr(temp))) {
				temp = cameFrom.get(posToStr(temp))!;
				path.unshift(temp);
			}

			return Array.from(new Map(path.map((v) => [posToStr(v), v] as const)).values());
		}

		openSet.splice(openSet.indexOf(current), 1);
		getNeighbors(current).forEach((neighbor) => {
			const tentativeGScore = gScore.get(posToStr(current))! + 1;
			const neighborKey = posToStr(neighbor);

			if (tentativeGScore < gScore.get(neighborKey)!) {
				cameFrom.set(neighborKey, current);
				gScore.set(neighborKey, tentativeGScore);
				fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, goal));

				if (!openSet.find((pos) => pos.x === neighbor.x && pos.z === neighbor.z)) {
					openSet.push(neighbor);
				}
			}
		});
	}

	return []; // No path found
}
