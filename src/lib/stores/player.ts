import type { Position, Position2D } from "$lib/types/position";
import { derived, writable } from "svelte/store";
import { CurrentLevel } from "../components/Level.svelte";
import { getDistanceFromPoints, getLocalPositionFromRealPosition } from "../utils/position";
import { rand } from "$lib/utils/engine";
import { ArrayUtils } from "$lib/utils/validation";
import type Enemy from "$lib/components/Enemy.svelte";
import { AudioEngine } from "$lib/helpers/music";

export const createPlayerState = (initialState: Partial<IPlayerState>) =>
	_playerState(initialState as IPlayerState);

export type PlayerControls = {
	w: boolean;
	a: boolean;
	s: boolean;
	d: boolean;
	leftarrow: boolean;
	rightarrow: boolean;
	shift: boolean;
};

const WEAPON_KEYS = ["knife", "pistol", "smg", "chaingun"] as const;

export type Weapon = (typeof WEAPON_KEYS)[number];

const isValidWeaponKey = (input: unknown): input is Weapon => {
	return typeof input === "string" && ArrayUtils.includesUnknown(WEAPON_KEYS, input);
};

export interface IPlayerState {
	health: number;
	score: number;
	state: "hurt" | "attack" | "idle" | "pickup";
	weapons: Partial<Record<Weapon, { acquired: boolean }>> & { ammo: number; active: Weapon };
	rotation: Position;
	position: Position;
	keys?: {
		blue: boolean;
		yellow: boolean;
	};
	lives: number;
}

const CONSTANTS = {
	speed: 7.6
} as const;

const DEFAULT_STATE = (lives = 3, score = 0): IPlayerState => ({
	health: 100,
	state: "idle",
	keys: {
		blue: false,
		yellow: false
	},
	weapons: {
		ammo: 8,
		active: "pistol",
		knife: { acquired: true },
		pistol: { acquired: true },
		smg: { acquired: false }
	},
	lives: typeof lives === "undefined" ? 3 : lives,
	score,
	position: { x: 0, y: 0, z: 0 },
	rotation: { x: 0, y: 270, z: 0 }
});

export const PlayerState = _playerState(DEFAULT_STATE(3, undefined));

function _playerState(initialState: IPlayerState = {} as IPlayerState) {
	let state: Required<IPlayerState> = {
		...DEFAULT_STATE(
			"lives" in initialState ? (initialState.lives as number) : 3,
			initialState.position as never
		),
		...(initialState as Required<IPlayerState>)
	};

	const { subscribe, set, update } = writable<IPlayerState>(state);
	let startScore = 0;

	const setPickupState = () => {
		state.state = "pickup";
		update((u) => ({ ...u, state: state.state }));
		setTimeout(() => {
			state.state = "idle";
			update((u) => ({ ...u, state: state.state }));
		}, 100);
	};

	const setHurtState = () => {
		state.state = "hurt";
		update((u) => ({ ...u, state: state.state }));
		setTimeout(() => {
			state.state = "idle";
			update((u) => ({ ...u, state: state.state }));
		}, 100);
	};

	return {
		subscribe,
		set,
		/** Alias for `Writable['update']` */
		modify: update,
		/** Helper function to flash the 'item pickup' animation */
		setPickupState,
		/** Initializes the player to the provided state, which overrides the default state */
		init(newState: Partial<IPlayerState>, dead = false) {
			if (!dead) {
				startScore = state.score;
			}

			state = {
				...DEFAULT_STATE(dead === true ? state.lives : state.lives, startScore),
				...newState
			} as Required<IPlayerState>;
			set(state);
		},
		/** Retrieves the current internal object for the player state.
		 *  This is not a copy, so modifying it will modify the player state without updating the store
		 *  (use `modify` for making arbitrary changes to the state)
		 */
		get() {
			return state;
		},
		/** Adds health to the player, up to a maximum of 100 */
		giveHealth(health: 25 | 4 | 10) {
			state.health += health;

			if (state.health >= 100) state.health = 100;

			if (state.health < 100) {
				update((u) => ({ ...u, health: state.health }));
				setPickupState();
				return true;
			}
			return false;
		},
		/** Gives the player a key to unlock a door */
		giveKey(key: "yellow" | "blue") {
			if (!state.keys) state.keys = {} as (typeof state)["keys"];
			state.keys[key] = true;

			update((u) => ({ ...u, keys: state.keys }));
			setPickupState();
		},
		/** Gives the player a weapon if not already acquired, otherwise it gives ammo */
		giveWeapon(weapon: Weapon) {
			if (state.weapons[weapon]?.acquired) state.weapons.ammo += 4;
			else {
				if (isValidWeaponKey(weapon)) {
					if (!state.weapons[weapon]) state.weapons[weapon] = {} as { acquired: boolean };

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					state.weapons[weapon]!.acquired = true;
				}
			}

			update((u) => ({ ...u, weapons: state["weapons"] }));
			setPickupState();
		},
		/** Changes the player's equipped weapon */
		changeWeapon(key: number) {
			if (key > WEAPON_KEYS.length) return;

			const toWeapon = WEAPON_KEYS[key - 1];
			if (state.weapons.active === toWeapon) return;

			if (state.weapons[toWeapon]?.acquired) {
				state.weapons.active = toWeapon;
			}
			update((u) => ({ ...u, weapons: state.weapons }));
		},
		/** Damages the player, if `amount` is unspecified, a random value will be taken from the player's health */
		takeDamage(amount?: number | undefined) {
			if (typeof amount !== "number") {
				amount = rand.nextInt(5, 13);
			}
			state.state = "hurt";
			state.health -= amount;
			state.health = state.health < 0 ? 0 : state.health;
			setHurtState();
			update((u) => ({ ...u, state: state.state, health: state.health }));
			setTimeout(() => {
				state.state = "idle";
				update((u) => ({ ...u, state: state.state }));
			}, 150);
		},
		/** Gives points for item pickups, kills, etc. */
		givePoints(points: number) {
			state.score += points;
			update((u) => ({ ...u, score: state.score }));
		},
		/** Gives ammo to the player */
		giveAmmo(weapon: Weapon, count: number) {
			if (state.weapons.ammo === 100) return false;
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
			setPickupState();
			return true;
		},
		/** Updates the player's position based on the pressed keys */
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
		},
		/**
		 *  Moves the player to the specified position
		 *  @internal
		 */
		moveTo(position: Position2D) {
			const current = state.position;
			const toMove = {
				x: position.x + current.x,
				z: position.z + current.z
			};

			const localTarget = getLocalPositionFromRealPosition(toMove);

			if (!CurrentLevel.checkCollisionWithWorld(localTarget, false)) {
				state.position.x = +toMove.x;
				state.position.z = +toMove.z;
			} else {
				AudioEngine.playEffect("blocked");
			}

			update((u) => {
				u.position = state.position;
				return u;
			});
		},
		/**
		 *  Calculates the forward movement vector based on the player's rotation
		 *  @internal
		 */
		moveForward(): Position2D {
			const { rotation } = state;

			return {
				x: -Math.sin((rotation.y * Math.PI) / 180) * CONSTANTS.speed,
				z: Math.cos((rotation.y * Math.PI) / 180) * CONSTANTS.speed
			};
		},

		/**
		 *  Calculates the left movement vector based on the player's rotation
		 *  @internal
		 */
		moveLeft(): Position2D {
			const { rotation } = state;

			return {
				x: -Math.sin(((rotation.y - 90) * Math.PI) / 180) * CONSTANTS.speed,
				z: Math.cos(((rotation.y - 90) * Math.PI) / 180) * CONSTANTS.speed
			};
		},

		/**
		 *  Calculates the right movement vector based on the player's rotation
		 *  @internal
		 */
		moveRight(): Position2D {
			const { rotation } = state;

			return {
				x: -Math.sin(((rotation.y + 90) * Math.PI) / 180) * CONSTANTS.speed,
				z: Math.cos(((rotation.y + 90) * Math.PI) / 180) * CONSTANTS.speed
			};
		},

		/**
		 *  Calculates the backwards movement vector based on the player's rotation
		 *  @internal
		 */
		moveBack(): Position2D {
			const { rotation } = state;

			const deltaX = CONSTANTS.speed * Math.sin((rotation.y * Math.PI) / 180);
			const deltaZ = CONSTANTS.speed * -Math.cos((rotation.y * Math.PI) / 180);

			return {
				x: deltaX,
				z: deltaZ
			};
		},

		/**
		 *  Calculates the rotation amount
		 *  @internal
		 */
		rotate(direction: "left" | "right") {
			const { rotation } = state;
			const angleToRotateTo =
				direction === "left"
					? Math.sin(-0.1875 * Math.PI) * CONSTANTS.speed
					: Math.sin(0.1875 * Math.PI) * CONSTANTS.speed;

			rotation.y += +angleToRotateTo;
			rotation.y = +(rotation.y % 360).toFixed(0);
			update((u) => ({ ...u, rotation: state.rotation }));
		},

		// ACTIONS

		/**
		 * Damages the enemy if it is within range
		 */
		async attack(e: Enemy | undefined) {
			try {
				if (e) {
					e.setState("hurt");
					let damage: number | undefined = undefined;
					const enemyPosition = e.getLocalPosition();
					const ourPosition = getLocalPositionFromRealPosition(state.position);
					const distance = getDistanceFromPoints(ourPosition, enemyPosition);
					const rand1 = rand.nextInt(0, 255);
					const rand2 = rand.nextInt(0, 255);

					// TODO: use this ?
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const hitChance = 160 - distance * 16;

					if (state.weapons.active !== "knife") {
						if (distance >= 4 && rand1 / 12 >= distance) {
							return;
						} else if (distance < 2) {
							damage = rand2 / 4;
						} else if (distance >= 2) {
							damage = rand2 / 6;
						} else {
							return;
						}
					} else {
						damage = 10;
					}
					await e.takeDamage(damage);
				}
			} finally {
				if (state.weapons.active !== "knife")
					state.weapons.ammo = Math.max(0, state.weapons.ammo - 1);
				update((u) => ({ ...u, weapons: state.weapons }));
			}
		}
	};
}

const playerRotation = derived(PlayerState, (state) => state.rotation.y);
const playerHealth = derived(PlayerState, (state) => state.health);
const playerScore = derived(PlayerState, (state) => state.score);
const playerPosition = derived(PlayerState, (state) => state.position);
const playerAmmo = derived(PlayerState, (state) => state.weapons.ammo);
const playerLives = derived(PlayerState, (state) => state.lives);
const playerState = derived(PlayerState, (state) => state.state);

export {
	playerRotation,
	playerHealth,
	playerScore,
	playerPosition,
	playerState,
	playerAmmo,
	playerLives
};

export { _playerState as AIBaseStore };
