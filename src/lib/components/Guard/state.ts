import { get, writable } from "svelte/store";
import { PlayerState, type IPlayerState } from "../../stores/player";
import type { Position, Position2D } from "../../types/position";
import { tweened } from "svelte/motion";
import {
	getDistanceFromPoints,
	getLocalPositionFromRealPosition,
	getRealPositionFromLocalPosition
} from "../../utils/position";
import { rand } from "$lib/utils/engine";
import { tick } from "svelte";

import type { EnemyBehavior } from "$lib/core/ai";

export interface EnemyState extends Omit<IPlayerState, "score" | "rotation" | "position"> {
	playerIsVisible: boolean;
	state: "dead" | "idle" | "walk" | "attack" | "hurt";
	position: Position2D;
	rotation: Pick<Position, "y">;
}

class PromisePool {
	private waitingQueue: (() => void)[] = [];
	private queue: (() => Promise<void>)[] = [];
	private activeTasks = 0;
	constructor() {
		//
	}

	async add(promise: () => Promise<void>) {
		if (this.activeTasks >= 1) {
			await new Promise<void>((resolve) => {
				this.waitingQueue.push(() => resolve());
			});
		}
		this.activeTasks += 1;
		try {
			return await promise();
		} finally {
			this.waitingQueue.shift()!();
			this.activeTasks -= 1;
		}
	}
}
const pool = new PromisePool();
export function enemyState<T extends Partial<EnemyState | IPlayerState>>(
	init: Partial<T> = {},
	behavior: EnemyBehavior
) {
	const state = {
		playerIsVisible: false,
		position: { x: 0, z: 0 },
		rotation: { y: 0 },
		state: "idle",
		weapons: { pistol: { ammo: Infinity, acquired: true } },
		...init,
		...{ health: behavior.health }
	} as EnemyState;

	const { subscribe, update, set } = writable<EnemyState>(state);

	const tween = tweened<Position2D>(
		{ x: state.position.x, z: state.position.z },
		{ duration: 388, delay: 0 }
	);

	const { subscribe: tSubscribe, set: tSet, update: tUpdate } = tween;

	let AC: AbortController;
	const setupAbortController = () => {
		if (AC?.signal?.aborted === false) return;
		AC = new AbortController();
	};

	setupAbortController();
	return {
		subscribe,
		set,
		tween: {
			subscribe: tSubscribe,
			cancel() {
				AC?.abort();
				tSet(get(tween), { duration: 0 });
			}
		},
		async moveTo(paths: Position2D[]) {
			try {
				for (const path of paths) {
					AC?.signal.throwIfAborted();

					if (state.state === "dead") continue;
					state.state = "walk";

					await new Promise<void>((resolve) => {
						if (!path) resolve();

						const realPosition = getRealPositionFromLocalPosition(path);

						// All 'real' positions are inverted, relative to the camera
						const tX = 1 - realPosition.x;
						const tZ = 1 - realPosition.z;

						const distance = getDistanceFromPoints({ x: tX, z: tZ }, state.position);
						state.position = { x: tX, z: tZ };

						// Tween to the next position
						tUpdate(() => ({ x: tX, z: tZ }), { duration: distance * 10 }).then(() => {
							resolve();
						});
					}).then(() => {
						update((u) => ({ ...u, ...state }));
					});
				}

				// Ensure we go back to an 'idle' state before starting the next task
				state.state = "idle";
				update((u) => ({ ...u, ...state }));
			} catch (e) {
				// We abort the tween here if there's an error, since we
				// will want to stop moving, probably.
				// (an error can be from the AbortController, or an actual error, even
				// though real ones *should not* happen)
				this.tween.cancel();
				AC.abort();

				state.state = "idle";

				update((u) => ({ ...u, ...state }));
				setupAbortController();
			}
		},
		async giveDamage(n?: number) {
			let previousState = state.state;
			if (AC) {
				// Abort any movements we're making, attack!
				AC?.abort();
				setupAbortController();
			}

			update((u) => ({ ...u, state: "hurt" }));

			if (typeof n !== "number") {
				n = Math.abs(rand.nextInt(...behavior.damage));
			}

			state.health -= n;

			await tick();

			if (state.health <= 0) {
				state.state = "dead";
				previousState = "dead";
				PlayerState.givePoints(behavior.pointValue);
			}
			// Update our health and return our state to the previous state
			update((u) => ({ ...u, health: state.health, state: previousState }));
		},
		setState(targetState: EnemyState["state"]) {
			state.state = targetState;
			return new Promise((res) => {
				// 80% chance of doing damage so it doesn't feel too predictable
				if (state.state === "attack") {
					const [minAttack, maxAttack] = behavior.damage;

					const playerPosition = getLocalPositionFromRealPosition(PlayerState.get().position);
					const ourPosition = getLocalPositionFromRealPosition(state.position);
					const distance = getDistanceFromPoints(ourPosition, playerPosition);
					const rand1 = rand.nextInt(0, 255);
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const rand2 = rand.nextInt(0, 255);
					const hitChance = 255 - distance * 16;
					let damage: number | undefined = undefined;

					if (rand1 < hitChance && distance < 2) {
						damage = rand1 / 4;
					} else if (rand1 < hitChance && distance > 2 && distance < 4) {
						damage = rand1 / 8;
					} else if (rand1 < hitChance && 4 < distance) {
						damage = rand1 / 16;
					} else {
						damage = rand.nextInt(minAttack, maxAttack);
					}
					damage = Math.floor(damage);
					PlayerState.takeDamage(damage);
				}
				update((u) => ({ ...u, state: state.state }));
				setTimeout(res, rand.nextInt(50, 120));
			});
		}
	};
}
