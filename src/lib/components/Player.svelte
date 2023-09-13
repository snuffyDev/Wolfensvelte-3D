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
			if (CurrentLevel.checkCollisionWithWorld({ x: tileX, z: tileZ }, null)) {
				return false;
			}

			x += stepX;
			z += stepZ;
		}

		return true;
	}

	export function testLineOfSight2(
		world: ExtendedEntityV2[][],
		start: Position2D,
		end: Position2D
	): boolean {
		let dx = Math.abs(end.x - start.x);
		let dy = Math.abs(end.z - start.z);
		let x = start.x;
		let z = start.z;
		let n = 1 + dx + dy;
		let x_inc = end.x > start.x ? 1 : -1;
		let y_inc = end.z > start.z ? 1 : -1;
		let error = dx - dy;
		dx *= 2;
		dy *= 2;

		for (; n > 0; --n) {
			// check if current tile is valid and doesn't have a model
			if (
				x < 0 ||
				x >= world.length ||
				z < 0 ||
				z >= world[0].length ||
				CurrentLevel.checkCollisionWithWorld({ x, z }, null)
			) {
				return false;
			}

			if (error > 0) {
				x += x_inc;
				error -= dy;
			} else {
				z += y_inc;
				error += dx;
			}
		}

		return true;
	}

	function isBlocking(entity: ExtendedEntity | undefined): boolean {
		if (!entity) {
			return false;
		}

		// Doors are blocking if they exist and are closed
		if (
			entity.model &&
			entity.model?.component !== "Door" &&
			["SS", "Guard", "Dog"].includes(entity.model.component) !== true
		) {
			return false; // adjust this to check if the door is actually closed
		}
		if (
			entity.model &&
			entity.model.component === "Door" &&
			entity.model.attributes?.state &&
			entity.model.attributes?.state === "closed"
		) {
			return true;
		}
		// Walls are blocking if they have any surfaces
		if (entity.surfaces && Object.values(entity.surfaces).length) {
			return true;
		}

		return false;
	}
	type Model = InstanceType<typeof Door | typeof MapObject | typeof Elevator | typeof Enemy>;
	export type TracePoint = {
		position: Position2D;
		distance: number;
		normal: number;
	};

	export function bresenhamLineWithFilter(
		start: Position2D,
		end: Position2D,
		world: ExtendedEntityV2[][],
		include: ExtendedEntityV2["component"][] = ["Wall", "Door", "Elevator"]
	): boolean {
		const dx = Math.abs(end.z - start.z);
		const dy = Math.abs(end.x - start.x);

		const sx = start.z < end.z ? 1 : -1;
		const sy = start.x < end.x ? 1 : -1;
		let err = dx - dy;

		while (true) {
			if (
				world[start.z][start.x].blocking &&
				!include.includes(world[start.z][start.x].component)
			) {
				return false; // Hit an obstacle, no line of sight
			}

			if (start.z === end.z && start.x === end.x) {
				return true; // Reached the target without hitting obstacles
			}

			const e2 = 2 * err;
			if (e2 > -dy) {
				err -= dy;
				start.z += sx;
			}
			if (e2 < dx) {
				err += dx;
				start.x += sy;
			}
		}
	}

	export function bresenhamLineSimple(
		start: Position2D,
		end: Position2D,
		world: ExtendedEntityV2[][]
	): boolean {
		const dx = Math.abs(end.z - start.z);
		const dy = Math.abs(end.x - start.x);
		const sx = start.z < end.z ? 1 : -1;
		const sy = start.x < end.x ? 1 : -1;
		let err = dx - dy;

		while (true) {
			if (world[start.z][start.x].blocking) {
				return false; // Hit an obstacle, no line of sight
			}

			if (start.z === end.z && start.x === end.x) {
				return true; // Reached the target without hitting obstacles
			}

			const e2 = 2 * err;
			if (e2 > -dy) {
				err -= dy;
				start.z += sx;
			}
			if (e2 < dx) {
				err += dx;
				start.x += sy;
			}
		}
	}

	export function bresenhamLine(
		viewerPosition: Position2D,
		viewerDirectionDegrees: number,
		endPoint: Position2D,
		grid: ExtendedEntityV2[][]
	): boolean {
		// Convert degrees to radians for trigonometric calculations
		const viewerDirectionRadians = (viewerDirectionDegrees * Math.PI) / 180;

		// Calculate the direction vector based on the angle
		const dx = Math.cos(viewerDirectionRadians);
		const dz = Math.sin(viewerDirectionRadians);

		const sx = viewerPosition.x < endPoint.x ? 1 : -1;
		const sz = viewerPosition.z < endPoint.z ? 1 : -1;
		let err = dx - dz;
		let x = viewerPosition.x;
		let z = viewerPosition.z;

		while (true) {
			if (
				x < 0 ||
				x >= grid.length ||
				z < 0 ||
				z >= grid[0].length ||
				grid[Math.floor(z)][Math.floor(x)].blocking
			) {
				return false; // Hit an obstacle, no line of sight
			}

			if (Math.floor(z) === Math.floor(endPoint.z) && Math.floor(x) === Math.floor(endPoint.x)) {
				return true; // Reached the target without hitting obstacles
			}

			const e2 = 2 * err;
			if (e2 > -dz) {
				err -= dz;
				z += sx;
			}
			if (e2 < dx) {
				err += dx;
				x += sz;
			}
		}
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
	import { PlayerState, type PlayerControls, playerHealth, playerState } from "$lib/stores/player";
	import { isVisibleToPlayer, normalizeAngle } from "$lib/utils/angle";
	import { GameObjects, type GameObjectType } from "$lib/utils/manager";
	import {
		comparePositions,
		getDistanceFromPoints,
		getFacingDirection,
		getLocalPositionFromRealPosition,
		getRealPositionFromLocalPosition
	} from "$lib/utils/position";
	import { frameLoop } from "$lib/utils/raf";
	import { onDestroy, onMount, tick } from "svelte";
	import type Guard from "./Guard/Guard.svelte";
	import { AIAudioManager } from "$lib/helpers/audio";
	import PistolURL from "$lib/sounds/pistol.WAV?url";
	import type { ExtendedEntity, ExtendedEntityV2, World } from "$lib/types/core";
	import type { Position, Position2D } from "$lib/types/position";
	import { CurrentLevel, type WorldState } from "./Level.svelte";
	import type Enemy from "./Enemy.svelte";
	import type Door from "./Door.svelte";
	import type MapObject from "./MapObject.svelte";
	import type Elevator from "./Elevator.svelte";
	import { gameData } from "$lib/helpers/maps";

	$: state = $playerState;

	let windowWidth: number;
	let camera: HTMLDivElement;
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

	const audioManager = new AIAudioManager({
		pistol: new URL(PistolURL, import.meta.url).toString(),
		knife: "",
		smg: new URL("../sounds/smg.WAV", import.meta.url).toString()
	});

	let cssText = ``;
	let start: number;
	const cache = new Cache<string>();

	const f = frameLoop(async (now) => {
		if (!start) start = now;
		const elapsed = now - start;
		const { x: a, y: b, z: c } = $PlayerState.rotation;
		const { x, y, z } = $PlayerState.position ?? { x: 0, y: 0, z: 0 };

		if (elapsed > 8 && $playerHealth > 0) {
			start = now;

			PlayerState.update(buttonsPressed);
			cssText = `transform: translate3d(0px, 0px, var(--perspective)) rotateX(${a}deg) rotateY(${b}deg) rotateZ(${c}deg) perspective(var(--perspective));`;
		}

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

		for (const door of [
			...$GameObjects.doors,
			...$GameObjects.pushwalls,
			...$GameObjects.elevators
		]) {
			const localPosition = door?.getLocalPosition();
			if (
				(localPosition.x === toPosition.x && localPosition.z === toPosition.z) ||
				(localPosition.x - 1 === toPosition.x && localPosition.z === toPosition.z)
			) {
				door.toggleAction();
				return false;
			}
		}
		return true;
	}

	async function attackClosestEnemy(position: Position2D) {
		if (state === "attack" && $PlayerState.weapons.active !== "smg") return;
		if ($PlayerState.weapons.ammo <= 0 && $PlayerState.weapons.active !== "knife") {
			return;
		}

		if ($PlayerState.weapons.active !== "knife") {
			$PlayerState.weapons.ammo -= 1;
			if ($PlayerState.weapons.active) audioManager.play($PlayerState.weapons.active);
		}
		$PlayerState.state = "attack";

		await tick();

		const enemiesInRange: Enemy[] = [];

		for (const e of $GameObjects.enemies) {
			const distance = getDistanceFromPoints(e?.getPosition(), {
				x: -position.x,
				z: -position.z
			});

			if (
				isVisibleToPlayer($PlayerState, e?.getPosition(), 20) &&
				bresenhamLineSimple(
					getLocalPositionFromRealPosition({
						x: position.x,
						z: position.z
					}),
					e.getLocalPosition(),
					$CurrentLevel
				) &&
				distance < 750 &&
				e?.getState() !== "dead"
			) {
				enemiesInRange.push(e);
			}
		}

		if (!enemiesInRange.length) return;
		let timeout = 0;
		switch ($PlayerState.weapons.active) {
			case "smg":
				timeout = 125;
				break;
			case "pistol":
				timeout = 350;
				break;
			case "knife":
				timeout = 125;
				break;
				defaulgetLocalPositionFromRealPositiont: break;
		}

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
		const distance = getDistanceFromPoints(playerPos, target.getLocalPosition());
		setTimeout(() => {
			$PlayerState.state = "idle";
		}, timeout);

		if (!target) return;
		if ($PlayerState.weapons.active === "knife" && distance > 1) return;

		const enemyPosition = getLocalPositionFromRealPosition(target.getPosition());
		const canShoot = bresenhamLineSimple(playerPos, enemyPosition, $CurrentLevel)!;

		if (canShoot) {
			await PlayerState.attack(target);
		}
	}

	const handleTouchStart = (e: TouchEvent) => {
		if (!camera) return;

		if (
			(e.target as HTMLDivElement).contains(camera) ||
			camera.isSameNode(e.target as HTMLElement)
		) {
			console.log(e.target);
			primaryAction();
		}
	};
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

<svelte:body on:touchstart={handleTouchStart} />
<div
	class="player camera "
	style={cssText}
	bind:this={camera}
	bind:clientWidth={windowWidth}
>
	<slot />
</div>
<div class="player-gun {state} {$PlayerState.weapons.active}" />

<style lang="scss">
	.player-gun {
		position: fixed;
		bottom: 0;
		margin: 0 auto;
		pointer-events: none;
		z-index: 1000;
		left: 0;
		max-width: 24.125rem;
		// contain: strict;
		right: 0;
		inset: 0;

		transform: translateZ(0px);
		@media screen and (max-width: 949px) {
			transform: translateZ(0px) scale(1.675);
		}
	}
	.player-gun::after {
		content: "";
		position: absolute;
		width: 24.125rem;
		height: 24.125rem;
		bottom: 0;
		// contain: strict;
		background: var(--url);
		perspective: var(--perspective);
		background-size: calc(24.125rem * 4);
		background-repeat: no-repeat no-repeat;
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
	.attack {
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
		inset: 0;
		pointer-events: all;
		perspective: var(--perspective);
		backface-visibility: hidden;
		contain: layout style size;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		will-change: transform;
	}
</style>
