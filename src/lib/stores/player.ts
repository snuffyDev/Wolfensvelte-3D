import type { Position, Position2D } from "$lib/types/position";
import { writable } from "svelte/store";
import { CurrentLevel } from "../components/Level.svelte";
import { getLocalPositionFromRealPosition } from "../utils/position";
import { frameLoop } from "../utils/raf";

export const PlayerState = _playerState();

export type PlayerControls = {
	w: boolean;
	a: boolean;
	s: boolean;
	d: boolean;
	leftarrow: boolean;
	rightarrow: boolean;
	shift: boolean;
};

export type Weapons = "pistol" | "knife" | "shotgun";

export interface IPlayerState {
	health: number;
	weapons: Record<Weapons, { ammo: number | null; acquired: boolean }>;
	rotation: Position;
	position: Position;
}

const CONSTANTS = {
	speed: 6.5
} as const;

function _playerState() {
	const state: IPlayerState = {
		health: 100,
		weapons: {
			knife: { acquired: true, ammo: null },
			pistol: { acquired: true, ammo: 8 },
			shotgun: { acquired: false, ammo: null }
		},
		position: { x: 3215, z: 5801, y: 0 },
		rotation: { x: 0, y: -90, z: 0 }
	};
	const { subscribe, set, update } = writable<IPlayerState>(state);

	return {
		subscribe,
		set,
		get() {
			return state;
		},
		takeDamage(source: "gun") {
			state.health -= 8;
		},
		update: function (input: PlayerControls) {
			const moves: Position2D[] = [];

			if (input.w && !input.s) moves.push(this.moveForward());
			if (input.s && !input.w) moves.push(this.moveBack());
			if (input.a && !input.d) moves.push(this.moveLeft());
			if (input.d && !input.a) moves.push(this.moveRight());
			if (moves.length) {
				const finalPosition = moves.reduce((acc, cur) => ({ x: cur.x + acc.x, z: cur.z + acc.z }));

				this.moveTo(finalPosition);
				moves.length = 0;
			}
			if (input.leftarrow) this.rotate("left");
			if (input.rightarrow) this.rotate("right");

			update((u) => {
				return {
					...u,
					...state
				};
			});

			// state.canMove = canMove = true;
		},
		moveTo(position: Position2D) {
			const current = state.position;
			const toMove = {
				x: position.x + current.x,
				z: position.z + current.z
			};

			const localTarget = getLocalPositionFromRealPosition(toMove);
			// const localCurrent = getLocalPositionFromRealPosition(current);
			if (!CurrentLevel.checkCollisionWithWorld(localTarget)) {
				// console.log({ localCurrent, localTarget });
				state.position.x = +toMove.x;
				state.position.z = +toMove.z;
			}
		},
		moveForward(): Position2D {
			const { rotation } = state;

			return {
				x: -Math.sin((rotation.y * Math.PI) / 180) * CONSTANTS.speed,
				z: Math.cos((rotation.y * Math.PI) / 180) * CONSTANTS.speed
			};
		},
		moveLeft(): Position2D {
			const { rotation } = state;

			return {
				x: -Math.sin(((rotation.y - 90) * Math.PI) / 180) * CONSTANTS.speed,
				z: Math.cos(((rotation.y - 90) * Math.PI) / 180) * CONSTANTS.speed
			};
		},
		moveRight(): Position2D {
			const { rotation } = state;

			return {
				x: -Math.sin(((rotation.y + 90) * Math.PI) / 180) * CONSTANTS.speed,
				z: Math.cos(((rotation.y + 90) * Math.PI) / 180) * CONSTANTS.speed
			};
		},
		moveBack(): Position2D {
			const { rotation } = state;

			const deltaX = CONSTANTS.speed * Math.sin((rotation.y * Math.PI) / 180);
			const deltaZ = CONSTANTS.speed * -Math.cos((rotation.y * Math.PI) / 180);

			return {
				x: deltaX,
				z: deltaZ
			};
		},
		rotate(direction: "left" | "right") {
			const { rotation } = state;
			const angleToRotateTo = direction === "left" ? -2.65 : 2.65;

			rotation.y += angleToRotateTo;
			rotation.y = rotation.y % 360;
		}
	};
}

export { _playerState as AIBaseStore };