import { get, writable } from "svelte/store";
import { PlayerState, type IPlayerState } from "../../stores/player";
import type { Position, Position2D } from "../../types/position";
import { tweened } from "svelte/motion";
import { getDistanceFromPoints, getLocalPositionFromRealPosition } from "../../utils/position";
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
	const { subscribe: tSubscribe, update: tUpdate, set: tSet } = tween;
	function syncTweenAndPosition([value, opts]: Parameters<typeof tSet>) {}
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

			const localTarget = getLocalPositionFromRealPosition(toMove);

			if (!CurrentLevel.checkCollisionWithWorld(localTarget)) {
				state.state = "walk";

				// console.log({ localCurrent, localTarget });
				// console.log({ localCurrent, localTarget });
				console.log({ toMove, state: state.position });
				const tX = +toMove.x;
				const tZ = +toMove.z;

				const distance = getDistanceFromPoints(current, toMove);
				return tSet({ x: tX, z: tZ }, { duration: distance * 3 }).then(() => {
					state.state = "idle";
					update((u) => ({ ...u, position: { x: tX, z: tZ } }));
				});
			}
		},
		async giveDamage(n?: number) {
			update((u) => ({ ...u, state: "hurt" }));
			if (typeof n !== "number") {
				n = Math.min(12, Math.max(28, rand.rnd() / 8));
			}
			update((u) => ({ ...u, state: "hurt" }));
			state.health -= n;

			if (state.health <= 0) {
				state.state = "dead";
			}
			update((u) => ({ ...u, health: state.health, state: state.state }));
		},
		setState(targetState: EnemyState["state"]) {
			state.state = targetState;
			queueMicrotask(() => {
				update((u) => ({ ...u, state: state.state }));
			});
			if (state.state === "attack") {
				if (Math.random() < 0.5) {
					tick().then(() => {
						PlayerState.takeDamage();
					});
				}
			}
		}
	};
}
