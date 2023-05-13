<svelte:options immutable={true} />

<script
	context="module"
	lang="ts"
>
	export function testLineOfSight(world: WorldState, start: Position2D, end: Position2D): boolean {
		const dx = end.x - start.x;
		const dz = end.z - start.z;
		const distance = getDistanceFromPoints(start, end);
		const stepX = dx / distance;
		const stepZ = dz / distance;

		let x = start.x;
		let z = start.z;
		for (let i = 0; i < distance; i++) {
			// Round x and z to the nearest integer to get the coordinates of the tile
			const tileX = Math.ceil(x - 0.5);
			const tileZ = Math.floor(z + 0.5);

			// Check if the tile at (tileX, tileZ) contains a MapItem
			const tile = world[tileZ][tileX];
			if (CurrentLevel.checkCollisionWithWorld({ x: tileX, z: tileZ }, false)) {
				return false;
			}

			x += stepX;
			z += stepZ;
		}

		return true;
	}

	export class Cache<T> {
		private declare current: T;
		private declare previous: T;
		private declare self: Map<T, T>;
		constructor() {
			this.self = new Map();
		}

		has(value: T) {
			return this.self.has(value);
		}

		get(value: T) {
			const r = this.self.get(value);
			if (r && r !== this.current) this.current = r;
			return r;
		}

		set(value: T) {
			if (this.self.size >= 5 && this.previous !== value) {
				this.self.delete(this.previous);
				this.previous = this.current;
			}
			this.current = value;
			return this.self.set(value, value);
		}

		setIfNotFound(value: T) {
			if (this.has(value)) return;
			this.set(value);
		}
	}
</script>

<script lang="ts">
	import { PlayerState, type PlayerControls } from "$lib/stores/player";
	import { isVisibleToPlayer } from "$lib/utils/angle";
	import { GameObjects } from "$lib/utils/manager";
	import {
		getDistanceFromPoints,
		getFacingDirection,
		getLocalPositionFromRealPosition
	} from "$lib/utils/position";
	import { frameLoop } from "$lib/utils/raf";
	import { onDestroy, onMount, tick } from "svelte";
	import type Guard from "./Guard/Guard.svelte";
	import { AudioManager } from "$lib/helpers/audio";
	import PistolURL from "$lib/sounds/pistol.WAV?url";
	import type { ExtendedEntity, World } from "$lib/types/core";
	import type { Position2D } from "$lib/types/position";
	import { CurrentLevel, type WorldState } from "./Level.svelte";

	let state: "shoot" | "idle" = "idle";
	let windowWidth: number;
	let buttonsPressed: PlayerControls = {
		w: false,
		shift: false,
		s: false,
		a: false,
		d: false,
		leftarrow: false,
		rightarrow: false
	};

	let x: number = 0;

	const audioManager = new AudioManager({
		pistol: new URL(PistolURL, import.meta.url).toString(),
		knife: "",
		smg: new URL("../sounds/smg.WAV", import.meta.url).toString()
	});

	let cssText = ``;
	let start: number;
	const cache = new Cache<string>();

	const f = frameLoop((now) => {
		if (!start) start = now;
		const elapsed = now - start;
		const { x: a, y: b, z: c } = $PlayerState.rotation;
		if (elapsed > 8) {
			start = now;

			PlayerState.update(buttonsPressed);
		}
		cssText = `transform: translate3d(0px, 0px, var(--perspective)) rotateX(${a}deg) rotateY(${b}deg) rotateZ(${c}deg);`;
		// const key = `${a}${b}${c}`;
		return true;
	});

	onDestroy(() => {
		f.abort();
	});

	async function primaryAction() {
		const { position } = $PlayerState;
		const shouldAttackEnemy = await interactWithDoor(position);
		if (shouldAttackEnemy) {
			await attackClosestEnemy(position);
		}
	}

	function getTileDirectlyInFrontOfPlayer(playerPosition: Position2D) {
		const playerLocal = getLocalPositionFromRealPosition(playerPosition);
		let toPosition: Position2D = {} as Position2D;

		const direction = getFacingDirection($PlayerState.rotation.y);
		switch (direction) {
			case "left":
				toPosition = { ...playerLocal, x: playerLocal.x + 1 };
				break;
			case "right":
				toPosition = { ...playerLocal, x: playerLocal.x - 1 };
				break;
			case "back":
				toPosition = { ...playerLocal, z: playerLocal.z - 1 };
				break;
			case "front":
				toPosition = { ...playerLocal, z: playerLocal.z + 1 };
				break;
			default:
				break;
		}
		return toPosition;
	}

	// Returns true or false, to indicate whether the user should shoot or not (confusing, I know)
	async function interactWithDoor(position: Position2D) {
		if (!$GameObjects.doors) return;

		const toPosition = getTileDirectlyInFrontOfPlayer(position);

		if (
			$CurrentLevel[toPosition.z][toPosition.x].model &&
			$CurrentLevel[toPosition.z][toPosition.x].model?.component === "Elevator"
		) {
			for (const elevator of $GameObjects.elevators) {
				const localPosition = elevator?.getLocalPosition();
				if (localPosition.x === toPosition.x && localPosition.z === toPosition.z) {
					elevator.toggleAction();
					return false;
				}
			}
		} else {
			for (const door of $GameObjects.doors) {
				console.log(GameObjects, door, toPosition);
				const localPosition = door?.getLocalPosition();
				if (
					(localPosition.x === toPosition.x && localPosition.z === toPosition.z) ||
					(localPosition.x - 1 === toPosition.x && localPosition.z === toPosition.z)
				) {
					door.toggleAction();
					return false;
				}
			}
		}
		return true;
	}

	async function attackClosestEnemy(position: Position2D) {
		if (state === "shoot" && $PlayerState.weapons.active !== "smg") return;

		if ($PlayerState.weapons.active) audioManager.play($PlayerState.weapons.active);

		if ($PlayerState.weapons.ammo <= 0) {
			return;
		}
		$PlayerState.weapons.ammo -= 1;
		state = "shoot";
		await tick();

		const enemiesInRange: Guard[] = [];

		for (const e of $GameObjects.enemies) {
			const distance = getDistanceFromPoints(e?.getPosition(), {
				x: -position.x,
				z: -position.z
			});
			if (
				isVisibleToPlayer(e?.getPosition(), 35) &&
				testLineOfSight(
					$CurrentLevel,
					getLocalPositionFromRealPosition({
						x: position.x,
						z: position.z
					}),
					e.getLocalPosition()
				) &&
				distance < 750 &&
				e?.getState() !== "dead"
			) {
				enemiesInRange.push(e);
			}
		}

		if (!enemiesInRange.length) return;

		const closest = enemiesInRange.sort(
			(a, b) =>
				getDistanceFromPoints(a?.getPosition(), {
					x: -position.x,
					z: -position.z
				}) -
				getDistanceFromPoints(b?.getPosition(), {
					x: -position.x,
					z: -position.z
				})
		);

		const target = closest.shift()!;
		const playerPos = getLocalPositionFromRealPosition({
			x: position.x,
			z: position.z
		});

		if (!target) return;

		const enemyPosition = getLocalPositionFromRealPosition(target.getPosition());
		const canShoot = testLineOfSight($CurrentLevel, playerPos, enemyPosition)!;

		if (canShoot) {
			await PlayerState.attack(target);
		}
	}
</script>

<svelte:window
	on:keydown={(e) => {
		const b = buttonsPressed;
		switch (e.key.toLowerCase()) {
			case "1":
			case "2":
			case "3":
				const key = +e.key;
				PlayerState.changeWeapon(key);
				break;
			case "w":
			case "arrowup":
				b.w = true;
				break;
			case "s":
			case "arrowdown":
				b.s = true;
				break;
			case "a":
				b.a = true;
				break;
			case " ":
			case "space":
				primaryAction();

				break;
			case "d":
				b.d = true;
				break;
			case "arrowleft":
				b.leftarrow = true;
				break;
			case "shift":
				b.shift = true;
				break;
			case "arrowright":
				b.rightarrow = true;
				break;
		}
	}}
	on:keyup={(e) => {
		const b = buttonsPressed;
		switch (e.key.toLowerCase()) {
			case "w":
			case "arrowup":
				b.w = false;
				break;
			case "s":
			case "arrowdown":
				b.s = false;
				break;
			case "a":
				b.a = false;
				break;
			case "d":
				b.d = false;
				break;
			case "arrowleft":
				b.leftarrow = false;
				break;
			case "shift":
				b.shift = false;
				break;
			case "arrowright":
				b.rightarrow = false;
				break;
		}
	}}
/>

<div
	class="player camera "
	style={cssText}
	on:touchstart={() => {
		primaryAction();
	}}
	bind:clientWidth={windowWidth}
>
	<slot />
</div>
<div
	class="player-gun {state} {$PlayerState.weapons.active}"
	on:animationend|capture={() => {
		state = "idle";
	}}
/>

<style lang="scss">
	.player-gun {
		position: absolute;
		bottom: 0;
		margin: 0 auto;
		pointer-events: none;
		z-index: 1000;
		left: 0;
		max-width: 24.125rem;
		contain: style size layout;
		right: 0;

		transform: translate(0px, 0px);
	}
	.player-gun::after {
		content: "";
		position: absolute;
		width: 24.125rem;
		height: 24.125rem;
		bottom: 0;
		background: var(--url);
		background-size: cover;
		transition: inherit;
		transition-delay: 0s;
		pointer-events: none;

		z-index: 1000;
	}
	@keyframes shooting {
		0% {
			background-position-x: -0px;
		}
		20% {
			background-position-x: -369px;
		}
		40% {
			background-position-x: -768px;
		}
		60% {
			background-position-x: -1148px;
		}
	}
	.pistol {
		--url: url(../sprites/PISTOL.png) no-repeat;
		--shoot-speed-anim: 0.6125s;
		@keyframes shooting {
			0% {
				background-position-x: -0px;
			}
			20% {
				background-position-x: -369px;
			}
			40% {
				background-position-x: -768px;
			}
			60% {
				background-position-x: -1148px;
			}
		}
	}
	.smg {
		--url: url(../sprites/SMG.png) no-repeat;
		--shoot-speed-anim: 0.125s;
		@keyframes shooting {
			0% {
				background-position-x: -0px;
			}
			20% {
				background-position-x: -369px;
			}
			40% {
				background-position-x: -768px;
			}
			60% {
				background-position-x: -1148px;
			}
		}
	}
	.shoot {
		&::after {
			animation: shooting steps(1) var(--shoot-speed-anim);

			@keyframes shooting {
				0% {
					background-position-x: -0px;
				}
				20% {
					background-position-x: -369px;
				}
				40% {
					background-position-x: -768px;
				}
				60% {
					background-position-x: -1148px;
				}
			}
		}
	}

	.camera {
		position: absolute;
		perspective: var(--perspective);
		inset: 0;
		pointer-events: all;
		transform: translateZ(0);
		// overflow: hidden;
		backface-visibility: hidden;
		transform-style: preserve-3d;
		will-change: transform;
	}
</style>
