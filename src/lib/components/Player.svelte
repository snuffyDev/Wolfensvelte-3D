<svelte:options immutable={true} />

<script
	context="module"
	lang="ts"
>
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
				(world[Math.floor(z)][Math.floor(x)].blocking &&
					world[Math.floor(z)][Math.floor(x)].component === "Door" &&
					world[Math.floor(z)][Math.floor(x)].attributes?.state !== "open") ||
				world[Math.floor(z)][Math.floor(x)].blocking
			) {
				// console.warn("No Line Of Sight", world[Math.floor(start.z)][Math.floor(start.x)]);
				return false; // Hit an obstacle, no line of sight
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

	export function bresenhamLine(
		start: Position2D,
		end: Position2D,
		world: ExtendedEntityV2[][]
	): boolean {
		const startX = Math.floor(start.z); // Swap x and z here
		const startZ = Math.floor(start.x); // Swap x and z here
		const endX = Math.floor(end.z); // Swap x and z here
		const endZ = Math.floor(end.x); // Swap x and z here

		const dx = Math.abs(endX - startX);
		const dz = Math.abs(endZ - startZ);

		const sx = startX < endX ? 1 : -1;
		const sz = startZ < endZ ? 1 : -1;

		let err = dx - dz;
		let x = startX;
		let z = startZ;

		while (true) {
			if (x === endX && z === endZ) {
				return true; // Reached the target without hitting obstacles
			}

			if (
				x < 0 ||
				x >= world.length ||
				z < 0 ||
				z >= world[0].length ||
				(world[Math.floor(start.z)][Math.floor(start.x)].blocking &&
					world[Math.floor(start.z)][Math.floor(start.x)].component === "Door" &&
					world[Math.floor(start.z)][Math.floor(start.x)].attributes?.state !== "open") ||
				world[Math.floor(start.z)][Math.floor(start.x)].blocking
			) {
				return false; // Hit an obstacle, no line of sight
			}

			const e2 = 2 * err;

			if (e2 > -dz) {
				err -= dz;
				x += sx;
			}

			if (e2 < dx) {
				err += dx;
				z += sz;
			}
		}
	}
</script>

<script lang="ts">
	import { PlayerState, type PlayerControls, playerHealth, playerState } from "$lib/stores/player";
	import { isVisibleToPlayer } from "$lib/utils/angle";
	import { GameObjects } from "$lib/utils/manager";
	import {
		getDistanceFromPoints,
		getFacingDirection,
		getLocalPositionFromRealPosition
	} from "$lib/utils/position";
	import { frameLoop } from "$lib/utils/raf";
	import { onDestroy, onMount, tick } from "svelte";
	import { AIAudioManager } from "$lib/helpers/audio";
	import PistolURL from "$lib/sounds/pistol.WAV?url";
	import type { ExtendedEntityV2 } from "$lib/types/core";
	import type { Position2D } from "$lib/types/position";
	import { CurrentLevel } from "./Level.svelte";
	import type Enemy from "./Enemy.svelte";
	import { AudioEngine } from "$lib/helpers/music";

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

	const audioManager = AudioEngine;

	let cssText = ``;
	let start: number;

	const f = frameLoop(async (now) => {
		if (!start) start = now;
		const elapsed = now - start;
		const { x: a, y: b, z: c } = $PlayerState.rotation;

		if (elapsed > 8 && $playerHealth > 0) {
			start = now;

			PlayerState.update(buttonsPressed);
			cssText = `transform: translate3d(0px, 0px, var(--perspective)) rotateX(${a}deg) rotateY(${b}deg) rotateZ(${c}deg) perspective(var(--perspective));`;
		}

		return true;
	});

	onMount(async () => {
		await Promise.all(
			Object.entries({
				"player:pistol": new URL(PistolURL, import.meta.url).toString(),
				"player:smg": new URL("../sounds/smg.WAV", import.meta.url).toString(),
				"player:chaingun": new URL("../sounds/chaingun.WAV", import.meta.url).toString()
			}).map(async ([key, value]) => {
				await AudioEngine.loadAudioFile(key, value);
			})
		);
	});
	onDestroy(() => {
		f.abort();
	});

	async function primaryAction(event: KeyboardEvent) {
		const { position } = $PlayerState;
		const shouldAttackEnemy = await interactWithDoor(position);
		if (shouldAttackEnemy) {
			if ($PlayerState.weapons.active !== "knife" && $PlayerState.weapons.ammo > 0) {
				if ($PlayerState.weapons.active !== "pistol" && event.repeat)
					queueMicrotask(() => {
						AudioEngine.play(`player:${$PlayerState.weapons.active}`, false, false);
					});
			}
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
				if (door.component === "Elevator" && door.secret === true) {
					await door.toggleAction(true);
					return false;
				}
				door.toggleAction();

				return false;
			}
		}
		return true;
	}

	async function attackClosestEnemy(position: Position2D) {
		if (
			state === "attack" &&
			$PlayerState.weapons.active !== "smg" &&
			$PlayerState.weapons.active !== "chaingun"
		)
			return;
		if ($PlayerState.weapons.ammo <= 0 && $PlayerState.weapons.active !== "knife") {
			return;
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
					e.getLocalPosition(),
					getLocalPositionFromRealPosition({
						x: position.x,
						z: position.z
					}),
					$CurrentLevel
				) &&
				distance < 750 &&
				e?.getState() !== "dead"
			) {
				enemiesInRange.push(e);
			}
		}
		let timeout = 0;

		switch ($PlayerState.weapons.active) {
			case "smg":
				timeout = 255;
				break;
			case "pistol":
				timeout = 500;
				break;
			case "chaingun":
				timeout = 200;
				break;
			case "knife":
				timeout = 550;
				break;
		}

		AudioEngine.play(`player:${$PlayerState.weapons.active}`, false, false);

		setTimeout(() => {
			$PlayerState.state = "idle";
		}, timeout);

		if (!enemiesInRange.length) return PlayerState.attack(undefined);

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

		if ($PlayerState.weapons.active === "knife" && distance > 1) return;

		PlayerState.attack(target);
	}

	const handleTouchStart = (e: TouchEvent) => {
		if (!camera) return;

		if (
			(e.target as HTMLDivElement).contains(camera) ||
			camera.isSameNode(e.target as HTMLElement)
		) {
			primaryAction(e as never);
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
			case "4":
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
				primaryAction(e);
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
		background: var(--url);
		perspective: var(--perspective);
		background-size: cover;
		background-repeat: no-repeat no-repeat;
		transition: inherit;
		transition-delay: 0s;
		pointer-events: none;

		z-index: 1000;
	}
	@keyframes shooting {
		0% {
			background-position-x: 0; // No need for "-0px"
		}
		20% {
			background-position-x: -23.0625rem; // Converted from -369px to rem
		}
		40% {
			background-position-x: -48rem; // Converted from -768px to rem
		}
		60% {
			background-position-x: -71.75rem; // Converted from -1148px to rem
		}
	}

	.pistol {
		--url: url(../sprites/PISTOL.png) no-repeat;
		--shoot-speed-anim: 0.6125s;

		@keyframes shooting {
			0% {
				background-position-x: 0; // No need for "-0px"
			}
			20% {
				background-position-x: -23.0625rem; // Converted from -369px to rem
			}
			40% {
				background-position-x: -48rem; // Converted from -768px to rem
			}
			60% {
				background-position-x: -71.75rem; // Converted from -1148px to rem
			}
		}
	}

	.chaingun {
		--url: url(../sprites/CHAINGUN.png) no-repeat;
		--shoot-speed-anim: 0.11s;

		@keyframes shooting {
			0% {
				background-position-x: 0; // No need for "-0px"
			}
			20% {
				background-position-x: -23.0625rem; // Converted from -369px to rem
			}
			40% {
				background-position-x: -48rem; // Converted from -768px to rem
			}
			60% {
				background-position-x: -71.75rem; // Converted from -1148px to rem
			}
		}
	}

	.smg {
		--url: url(../sprites/SMG.png) no-repeat;
		--shoot-speed-anim: 0.55s;

		@keyframes shooting {
			0% {
				background-position-x: 0; // No need for "-0px"
			}
			20% {
				background-position-x: -23.0625rem; // Converted from -369px to rem
			}
			40% {
				background-position-x: -48rem; // Converted from -768px to rem
			}
			60% {
				background-position-x: -71.75rem; // Converted from -1148px to rem
			}

			80% {
				background-position-x: -48rem; // Converted from -768px to rem
			}
			100% {
				background-position-x: -23.0625rem; // Converted from -369px to rem
			}
		}
	}

	.knife {
		--url: url(../sprites/KNIFE.png) no-repeat;
		--shoot-speed-anim: 0.55s;

		@keyframes shooting {
			0% {
				background-position-x: 0; // No need for "-0px"
			}
			20% {
				background-position-x: -23.0625rem; // Converted from -369px to rem
			}
			40% {
				background-position-x: -48rem; // Converted from -768px to rem
			}
			60% {
				background-position-x: -71.75rem; // Converted from -1148px to rem
			}

			80% {
				background-position-x: -48rem; // Converted from -768px to rem
			}
			100% {
				background-position-x: -23.0625rem; // Converted from -369px to rem
			}
		}
	}

	.attack {
		&::after {
			animation: shooting steps(1) var(--shoot-speed-anim);

			@keyframes shooting {
				0% {
					background-position-x: 0; // No need for "-0px"
				}
				20% {
					background-position-x: -23.0625rem; // Converted from -369px to rem
				}
				40% {
					background-position-x: -48rem; // Converted from -768px to rem
				}
				60% {
					background-position-x: -71.75rem; // Converted from -1148px to rem
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
