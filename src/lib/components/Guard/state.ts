import { get, writable } from "svelte/store";
import { PlayerState, type IPlayerState } from "../../stores/player";
import type { Position, Position2D } from "../../types/position";
import { tweened } from "svelte/motion";
import {
	getDistanceFromPoints,
	getLocalPositionFromRealPosition,
	getRealPositionFromLocalPosition
} from "../../utils/position";
import { CurrentLevel } from "../Level.svelte";
import { rand } from "./Guard.svelte";
import { tick } from "svelte";

interface EnemyState extends IPlayerState {
	playerIsVisible: boolean;
	state: "dead" | "idle" | "walk" | "attack" | "hurt";
	position: Position2D;
	rotation: Pick<Position, "y">;
}

export function enemyState(init?: Partial<EnemyState>) {
	const state: EnemyState = {
		health: 100,
		playerIsVisible: false,
		position: { x: 0, z: 0 },
		rotation: { y: 0 },
		state: "idle",
		weapons: { pistol: { ammo: Infinity, acquired: true } }
	};
	if (init) {
		Object.assign(state, init);
	}
	const { subscribe, update, set } = writable<EnemyState>(state);

	const tween = tweened<Position2D>({ x: state.position.x, z: state.position.z });
	const { subscribe: tSubscribe, set: tSet } = tween;

	return {
		subscribe,
		set,
		tween: {
			subscribe: tSubscribe,
			cancel() {
				tSet(get(tween), { duration: 0 });
			}
		},
		async moveTo(position: Position2D) {
			const current = state.position;

			const toMove = {
				x: position.x + current.x,
				z: position.z + current.z
			};

			const playerPosition = getLocalPositionFromRealPosition(toMove);
			const ourPosition = getLocalPositionFromRealPosition(state.position);

			const paths = findPath(ourPosition, playerPosition);
			if (!Array.isArray(paths)) return;
			state.state = "walk";
			update((u) => ({ ...u, state: state.state }));
			for (const path of paths) {
				state.state = "walk";
				const current = state.position;
				if (CurrentLevel.checkCollisionWithWorld(path)) continue;
				const realPosition = getRealPositionFromLocalPosition(path);
				const tX = 1 - realPosition.x;
				const tZ = 1 - realPosition.z;

				const distance = getDistanceFromPoints(current, toMove);
				await tSet({ x: tX, z: tZ }, { duration: distance * 2.325 }).then(() => {
					state.position = { x: tX, z: tZ };
					update((u) => ({ ...u, position: { x: tX, z: tZ } }));
				});
			}
			state.state = "idle";
			update((u) => ({ ...u, state: state.state }));
		},
		async giveDamage(n?: number) {
			update((u) => ({ ...u, state: "hurt" }));

			if (typeof n !== "number") {
				n = Math.min(30, Math.max(38, rand.rnd() / 8));
			}

			state.health -= n;

			if (state.health <= 0) {
				state.state = "dead";
				PlayerState.givePoints(100);
			}
			update((u) => ({ ...u, health: state.health, state: state.state }));
		},
		setState(targetState: EnemyState["state"]) {
			state.state = targetState;
			queueMicrotask(() => {
				update((u) => ({ ...u, state: state.state }));
			});
			if (state.state === "attack") {
				if (Math.random() < 0.45) {
					tick().then(() => {
						PlayerState.takeDamage();
					});
				}
			}
		}
	};
}

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