import type { Position, Position2D } from "$lib/types/position";
import { writable } from "svelte/store";
import { CurrentLevel } from "../components/Level.svelte";
import { getLocalPositionFromRealPosition } from "../utils/position";
import type Guard from "../components/Guard/Guard.svelte";
import { rand } from "$lib/utils/engine";
import { ArrayUtils } from "$lib/utils/validation";

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

export type Weapons = "pistol" | "knife" | "smg";

const WEAPON_KEYS: Weapons[] = ["knife", "pistol", "smg"] as const;

const isValidWeaponKey = (input: unknown): input is Weapons => {
	return typeof input === "string" && ArrayUtils.includesUnknown(WEAPON_KEYS, input);
};
export interface IPlayerState {
	health: number;
	score: number;
	weapons: Partial<Record<Weapons, { acquired: boolean }>> & { ammo: number; active: Weapons };
	rotation: Position;
	position: Position;
	lives?: number;
}

const CONSTANTS = {
	speed: 5.875
} as const;

const DEFAULT_STATE = (lives = 3): IPlayerState => ({
	health: 100,
	weapons: {
		ammo: 8,
		active: "pistol",
		knife: { acquired: true },
		pistol: { acquired: true },
		smg: { acquired: false }
	},
	lives,
	score: 0,
	position: { x: 1794, z: 3008, y: 0 },
	rotation: { x: 0, y: 270, z: 0 }
});

function _playerState() {
	let state: Required<IPlayerState> = {
		health: 100,
		weapons: {
			ammo: 8,
			active: "pistol",
			knife: { acquired: true },
			pistol: { acquired: true },
			smg: { acquired: false }
		},
		lives: 3,
		score: 0,
		position: { x: 1794, z: 3008, y: 0 },
		rotation: { x: 0, y: 270, z: 0 }
	};
	const { subscribe, set, update } = writable<IPlayerState>(state);

	return {
		subscribe,
		set,
		init() {
			state = DEFAULT_STATE(state.lives - 1);
			set(state);
		},
		get() {
			return state;
		},
		giveHealth(health: 25 | 4 | 10) {
			state.health += health;
			if (state.health >= 100) state.health = 100;
			update((u) => ({ ...u, health: state.health }));
		},
		giveWeapon(weapon: Weapons) {
			if (state.weapons[weapon]?.acquired) state.weapons.ammo += 4;
			else {
				if (isValidWeaponKey(weapon)) {
					if (!state.weapons[weapon]) state.weapons[weapon] = {} as { acquired: boolean };

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					state.weapons[weapon]!.acquired = true;
				}
			}

			update((u) => ({ ...u, weapons: state["weapons"] }));
		},
		changeWeapon(key: number) {
			if (key > WEAPON_KEYS.length) return;
			const toWeapon = WEAPON_KEYS[key - 1];
			if (state.weapons.active === toWeapon) return;

			if (state.weapons[toWeapon]?.acquired) {
				state.weapons.active = toWeapon;
			}
			update((u) => ({ ...u, weapons: state.weapons }));
		},
		takeDamage(n?: number | undefined) {
			if (typeof n !== "number") {
				n = rand.nextInt(9, 18);
			}
			state.health -= n;
			state.health = state.health < 0 ? 0 : state.health;

			update((u) => ({ ...u, health: state.health }));
		},
		givePoints(points: number) {
			state.score += points;
			update((u) => ({ ...u, score: state.score }));
		},

		giveAmmo(weapon: Weapons, count: number) {
			const weaponState = state["weapons"][weapon];
			if (!weaponState) {
				state["weapons"][weapon] = { acquired: true };
			} else {
				if (state.weapons.ammo === null) {
					state.weapons.ammo = count;
				} else {
					state.weapons.ammo += count;
				}
			}

			update((u) => ({ ...u, weapons: { ...state.weapons, [weapon]: weaponState } }));
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
			update((u) => {
				u.position = state.position;
				return u;
			});
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
			const angleToRotateTo =
				direction === "left"
					? Math.sin(-0.825 * Math.PI) * CONSTANTS.speed
					: Math.sin(0.825 * Math.PI) * CONSTANTS.speed;

			rotation.y += +angleToRotateTo;
			rotation.y = +(rotation.y % 360).toFixed(0);
			update((u) => ({ ...u, rotation: state.rotation }));
		},

		// ACTIONS
		async attack(e: Guard) {
			e.setState("hurt");
			if (e) await e?.takeDamage();
		}
	};
}

export { _playerState as AIBaseStore };