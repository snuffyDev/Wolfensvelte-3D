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
import { rand } from "$lib/utils/engine";
import { tick } from "svelte";
import { findPath } from "$lib/helpers/ai";

interface EnemyState extends Omit<IPlayerState, "score" | "rotation" | "position"> {
	playerIsVisible: boolean;
	state: "dead" | "idle" | "walk" | "attack" | "hurt";
	position: Position2D;
	rotation: Pick<Position, "y">;
}

export function enemyState(init?: Partial<EnemyState>) {
	const state: EnemyState = {
		health: 25,
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

			// Get the shortest (unblocked) path to the player
			const paths = findPath(ourPosition, playerPosition);
			if (!Array.isArray(paths)) return;

			state.state = "walk";
			update((u) => ({ ...u, state: state.state }));
			console.log(paths);
			for (const path of paths) {
				console.log(path);
				state.state = "walk";
				update((u) => ({ ...u, state: state.state }));

				// Current path point is blocked by something, skip to next just in case.
				if (CurrentLevel.checkCollisionWithWorld(path)) continue;

				const realPosition = getRealPositionFromLocalPosition(path);

				const tX = 1 - realPosition.x;
				const tZ = 1 - realPosition.z;

				await tSet({ x: tX, z: tZ }, { duration: 768 }).then(() => {
					state.position = { x: tX, z: tZ };
					update((u) => ({ ...u, position: { x: tX, z: tZ } }));
				});
			}
			state.state = "idle";
			update((u) => ({ ...u, ...state }));
		},
		async giveDamage(n?: number) {
			const previousState = state.state;
			update((u) => ({ ...u, state: "hurt" }));

			if (typeof n !== "number") {
				n = Math.abs(rand.randomInRange(7, 13));
			}

			state.health -= n;

			if (state.health <= 0) {
				state.state = "dead";
				PlayerState.givePoints(100);
			}
			await tick();
			update((u) => ({ ...u, health: state.health, state: previousState }));
		},
		setState(targetState: EnemyState["state"]) {
			state.state = targetState;
			if (state.state === "attack") {
				if (Math.random() < 0.7) {
					tick().then(() => {
						PlayerState.takeDamage();
					});
				}
			}
			update((u) => ({ ...u, state: state.state }));
		}
	};
}

