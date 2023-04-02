import {CurrentLevel} from '../../routes/editor/components/Level.svelte';
import type { Position, Position2D } from "$lib/types/position";
import { writable } from "svelte/store";

export const PlayerState = _playerState();

export type ButtonsPressed = {
	w: boolean;
	a: boolean;
	s: boolean;
	d: boolean;
	leftarrow: boolean;
	rightarrow: boolean;
	shift: boolean;
};

export interface IPlayerState {
	canMove: boolean;
	rotation: Position;
	health: number;
	origin: Omit<Position, "y">;
	position: Position;
	velocity: Position;
	angularVelocity: Position;
}

const CONSTANTS = {
	speed: 6
} as const;

function _playerState() {
	let canMove = true;
	const state: IPlayerState = {
		canMove,
		health: 100,
		origin: { x: 230, z: 110 },
		position: { x: -2340, z: -4554, y: 0 },
		rotation: { x: 0, y: -90, z: 0 },
		velocity: { x: 0, y: 0, z: 0 },
		angularVelocity: { x: 0, y: 0, z: 0 }
	};
	const { subscribe, set, update } = writable<IPlayerState>(state);

	return {
		subscribe,
		set,
		get() {
			return state;
		},
		setCanMove(value: boolean) {
			canMove = value;
			state.canMove = canMove;
			// update((u) => ({ ...u, canMove }));
		},
		takeDamage(source: "gun") {
			state.health -= 8;
		},
		update: function (buttonsPressed: ButtonsPressed) {

			const moves: Position2D[] = []

            if (buttonsPressed.w && !buttonsPressed.s) moves.push(this.moveForward())
			if (buttonsPressed.s&& !buttonsPressed.w) moves.push(this.moveBack());
			if (buttonsPressed.a && !buttonsPressed.d) moves.push(this.moveLeft())
			if (buttonsPressed.d && !buttonsPressed.a) moves.push(this.moveRight())
			if (moves.length){
				this.setCanMove(true)
				const finalPosition = moves.reduce((acc, cur) => ({x: cur.x + acc.x, z: cur.z + acc.z}));

				if (!CurrentLevel.checkCollisionWithWorld(finalPosition)) {
					this.moveTo(finalPosition)
				}
				moves.length = 0
			}
			if (buttonsPressed.leftarrow) this.rotate(canMove ? 'left' : 'right')
			if (buttonsPressed.rightarrow) this.rotate(canMove ? 'right' : 'left')

			update((u) => {
				return {
					...u,
					...state
				};
			});
			// if (!state.canMove) this.setCanMove(true);

		},
		moveTo(position: Position2D) {
			if (!canMove){
				this.rotate('right')
				state.position.x -= +position.x.toFixed(2);
				this.rotate('left')
				state.position.z += +position.z.toFixed(2);
								state.canMove = canMove = true;


								return;
			}
				state.position.x += +position.x.toFixed(2);
				state.position.z += +position.z.toFixed(2);

		},
		moveForward(): Position2D {
			const { rotation } = state;

			return {
				x: -Math.sin((rotation.y * Math.PI) / 180) * CONSTANTS.speed,
				z: Math.cos((rotation.y * Math.PI) / 180) * CONSTANTS.speed,
			};
		},
		moveLeft(): Position2D {
			const { rotation } = state;

		return {
			x: -Math.sin(((rotation.y - 90) * Math.PI) / 180) * CONSTANTS.speed,
			z: Math.cos(((rotation.y - 90) * Math.PI) / 180) * CONSTANTS.speed
		}
		},
		moveRight(): Position2D {
			const { rotation } = state;

			return {
				x: -Math.sin(((rotation.y + 90) * Math.PI) / 180) * CONSTANTS.speed,
				z: Math.cos(((rotation.y + 90) * Math.PI) / 180) * CONSTANTS.speed
			}
		},
		moveBack(): Position2D {
			const { rotation } = state;

			const deltaX = CONSTANTS.speed * Math.sin((rotation.y * Math.PI) / 180);
			const deltaZ = CONSTANTS.speed * -Math.cos((rotation.y * Math.PI) / 180);

			return {
				x: deltaX,
				z: deltaZ
			}
		},
		rotate(direction: 'left' | 'right') {
			const { rotation } = state;
			const angleToRotateTo =  (direction === 'left' ? 2.5 : -2.5);

			rotation.y -= angleToRotateTo
			rotation.y = rotation.y % 360

		},
		checkCollisionForPosition(position: Position) {
			const playerX = state.position.x;
			const playerZ = state.position.z;
			if (playerX < position.x) {
				console.log("X COLLISION");
			}
		}
	};
}
