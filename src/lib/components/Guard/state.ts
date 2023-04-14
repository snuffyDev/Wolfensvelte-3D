import { get, writable } from "svelte/store";
import { PlayerState, type IPlayerState } from "../../stores/player";
import type { Position, Position2D } from "../../types/position";
import { tweened } from "svelte/motion";
import {
	getLocalPositionFromRealPosition,
	getRealPositionFromLocalPosition
} from "../../utils/position";
import { CurrentLevel } from "../Level.svelte";
import { rand } from "$lib/utils/engine";
import { tick } from "svelte";

import { findPath } from "$lib/helpers/ai";

export interface EnemyState extends Omit<IPlayerState, "score" | "rotation" | "position"> {
	playerIsVisible: boolean;
	state: "dead" | "idle" | "walk" | "attack" | "hurt";
	position: Position2D;
	rotation: Pick<Position, "y">;
}

export function enemyState<T extends Partial<EnemyState | IPlayerState>>(init?: Partial<T>) {
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
	const { subscribe: tSubscribe, set: tSet, update: tUpdate } = tween;

	let AC: AbortController;

	const setupAbortController = () => {
		if (AC?.signal?.aborted === false) return;
		AC = new AbortController();
	};

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
			try {
				const current = state.position;

				const toMove = {
					x: position.x + current.x,
					z: position.z + current.z
				};

				const playerPosition = getLocalPositionFromRealPosition(toMove);
				const ourPosition = getLocalPositionFromRealPosition(state.position);

				// Get the shortest (unblocked) path to the player
				let paths = findPath(ourPosition, playerPosition);
				if (!Array.isArray(paths)) return;

				// console.log(paths, playerPosition);
				let count = 0;
				for (const path of paths) {
					AC.signal.throwIfAborted();
					if (state.state === "dead") break;
					if (!path) return;
					// console.log(path);
					state.state = "walk";
					update((u) => ({ ...u, state: state.state }));

					// Current path point is blocked by something, skip to next just in case.
					if (CurrentLevel.checkCollisionWithWorld(path)) {
						if (count === 2) return;
						count += 1;
						console.log(CurrentLevel.get()[path.x][path.z]);
						paths = findPath(ourPosition, playerPosition);
						continue;
					}

					const realPosition = getRealPositionFromLocalPosition(path);

					// All 'real' positions are inverted, relative to the camera
					const tX = 1 - realPosition.x;
					const tZ = 1 - realPosition.z;

					state.position = { x: tX, z: tZ };
					// Tween to the next position
					await tUpdate(() => ({ x: tX, z: tZ }), { duration: 668 }).then(() => {
						update((u) => ({ ...u, position: { x: tX, z: tZ } }));
					});
				}
				// Ensure we go back to an 'idle' state before starting the next task
				queueMicrotask(() => {
					state.state = "idle";
					update((u) => ({ ...u, ...state }));
				});
			} catch {
				// We abort the tween here if there's an error, since we
				// will want to stop moving, probably.
				// (an error can be from the AbortController, or an actual error, even
				// though real ones *should not* happen)
				this.tween.cancel();
				setupAbortController();
			}
		},
		async giveDamage(n?: number) {
			let previousState = state.state;
			if (AC) {
				// Abort any movements we're making, attack!
				AC?.abort();
			}

			update((u) => ({ ...u, state: "hurt" }));

			if (typeof n !== "number") {
				n = Math.abs(rand.nextInt(5, 20));
			}

			state.health -= n;

			await tick();

			if (state.health <= 0) {
				state.state = "dead";
				previousState = "dead";
				PlayerState.givePoints(100);
			}
			// Update our health and return our state to the previous state
			update((u) => ({ ...u, health: state.health, state: previousState }));
		},
		setState(targetState: EnemyState["state"]) {
			state.state = targetState;
			return new Promise((res) => {
				// 80% chance of doing damage so it doesn't feel too predictable
				if (state.state === "attack") {
					if (Math.random() < 0.8) {
						tick().then(() => {
							PlayerState.takeDamage();
						});
					}
				}
				update((u) => ({ ...u, state: state.state }));
				setTimeout(res, 1000);
			});
		}
	};
}

