<script
	context="module"
	lang="ts"
>
	export const CurrentLevel = _levelStore();

	function _levelStore() {
		const world: World = [];
		const { subscribe, set, update } = writable<World>([]);

		return {
			subscribe,
			set: (level: World) => {
				Object.assign(world, level);
				set(world);
			},
			update,
			checkCollisionWithWorld(position: Position | Position2D) {
				try {
					const wall = world[position!.z][position!.x];
					return (
						!!wall.model?.component ||
						Object.values(wall.surfaces ?? {}).every((t) => typeof t !== "object" && t !== " ")
					);
				} catch (e) {
					return false;
				}
			}
		};
	}
</script>

<script lang="ts">
	import Door from "$lib/components/Door.svelte";
	import Guard from "$lib/components/Guard/Guard.svelte";
	import Player from "$lib/components/Player.svelte";
	import Wall from "$lib/components/Wall.svelte";
	import { PlayerState } from "$lib/stores/player";
	import type { Position, Position2D } from "$lib/types/position";
	import type { World } from "$lib/utils/map";
	import { objectKeys } from "$lib/utils/object";
	import { getDistanceFromPoints } from "$lib/utils/position";
	import { frameLoop } from "$lib/utils/raf";
	import { onMount } from "svelte";
	import { writable } from "svelte/store";

	export let level: World = [];
	export let mode: "editor" | "generating" | "play" = "play";

	let world: HTMLElement;
	let previousPlayerPosition: Position;

	const gameLoop = frameLoop.add(update);

	const walls: InstanceType<typeof Wall>[] = Array.from({ length: level.length }).fill(
		[]
	) as InstanceType<typeof Wall>[];

	const models: InstanceType<typeof Door>[] = [];
	const collisions: (string | any)[] = [];

	const MODEL_MAP = {
		Door: Door
	} as const;

	function normalize(angle: number): number {
		// while (angle < 0) {
		// 	angle += 2 * Math.PI;
		// 	// console.log('LOOP 1', angle);
		// }
		// while (angle >= 2 * Math.PI) {
		// 	angle -= 2 * Math.PI;
		// 	// console.log('LOOP 2', angle);
		// }
		// return angle % 360;
		const range = 360;
		// return angle % 360;
		return ((angle % range) + range) % range;
	}

	function getAngleBetween(pos1: Position, pos2: Position, log = false) {
		const dx = pos1.x - pos2.x;
		const dz = pos2.z - pos1.z;

		const angle = normalize((Math.atan2(dz, dx) * 180) / Math.PI);
		// if (log) console.log(angle);
		return angle;
	}

	function isAngleBetween(mid: number, start: number, end: number): boolean {
		const formattedEnd = end - start < 0 ? end - start + 360 : end - start;
		const formattedMid = mid - start < 0 ? mid - start + 360 : mid - start;

		return formattedMid > formattedEnd;
	}

	function checkCollision(position: Omit<Position, "y">) {
		try {
			const wall = level[position!.z][position!.x];
			return (
				wall.model?.component ||
				Object.values(wall.surfaces ?? {}).every((t) => typeof t !== "object" && t !== " ")
			);
		} catch (e) {
			return false;
		}
	}

	function isVisible(wall: InstanceType<typeof Wall> | Position) {
		let p: Position;
		if (wall instanceof Wall) {
			p = wall.getPosition() as Position;
		} else {
			p = wall;
		}
		const angle = getAngleBetween($PlayerState.position, p as Position);
		// console.log(angle);
		const playerViewAngle = normalize($PlayerState.rotation.y - 90);

		const playerViewLeft = normalize(playerViewAngle - 800 / 2);
		const playerViewRight = normalize(playerViewAngle + 800 / 2);
		return isAngleBetween(angle, playerViewLeft, playerViewRight);
	}
	let start: number;

	function processVisibility(
		wall: InstanceType<typeof Wall>,
		x: number,
		z: number,
		collisions: any[]
	) {
		const pos = wall?.getPosition?.();
		if (!pos) return;

		for (const side of wall.boundSides) {
			if (
				previousPlayerPosition.x.toFixed(2) === x.toFixed(2) &&
				previousPlayerPosition.z.toFixed(2) === z.toFixed(2)
			)
				return;
			if (side === null) continue;

			if (!side) return;
			const position = {
				x: Number(side.dataset.x),
				z: Number(side.dataset.z)
			};
			// const isVisible
			const distance = getDistanceFromPoints({ x: position.x, z: position.z }, { x: x, z: z });
			// if (distance > 1200) {
			// const sideVisible = isVisible(position as Position) ? "visible" : "hidden";
			if (distance >= 2000) {
				// console.log(position);
				// if (side?.style && side?.style?.visibility !== sideVisible) {
				// side.style.visibility = "hidden";
				// }
			} else if (side.style.visibility === "hidden") {
				// side.style.visibility = "visible";
			}
			if (distance <= 75 && checkCollision(pos)) {
				collisions.push(position);
			}
		}
	}

	function update(ts: number) {
		if (!previousPlayerPosition) previousPlayerPosition = { x: 0, y: 0, z: 0 };
		// console.log(ts)
		const { x, y, z } = $PlayerState.position ?? { x: 0, y: 0, z: 0 };
		world.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;

		for (const wall of walls) {
			if (!wall) continue;
			if (!wall.boundSides) continue;
			const pos = wall.getPosition();
			const distance = getDistanceFromPoints({ x: pos.x - 50, z: pos.z }, $PlayerState.position);
			if (distance < 1000) {
				processVisibility(wall, x, z, collisions);
			}
			if (wall.checkCollisionWithWorld() && distance <= 75) {
				// console.log({ angle, sideVisible });
				collisions.push(pos);
				// PlayerState.setCanMove(false);
			}
		}

		for (const item of models) {
			const pos = item.getPosition();
			const distance = getDistanceFromPoints({ x: pos.x - 50, z: pos.z }, $PlayerState.position);

			if (checkCollision(item?.getLocalPosition?.()) && distance <= 35) {
				collisions.push(pos);
			}
		}
		if (collisions.length) {
			PlayerState.setCanMove(false);
			collisions.length = 0;
		}
	}

	let idx = 0;

	onMount(() => {
		world = document.getElementById("world")!;
		CurrentLevel.set(level);

		gameLoop.start();
		return () => {
			gameLoop.stop();
			frameLoop.dispose();
		};
	});
	$: console.log(walls);
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.ctrlKey && e.key.toLowerCase() === "w") e.preventDefault();
	}}
/>

<div id="scene">
	{#if mode !== "generating"}
		<Player>
			<div
				class="world"
				id="world"
			>
				<Guard />
				{#each level as group, section}
					{#each group as item, offset}
						{#if objectKeys(item.surfaces).every((k) => typeof item.surfaces[k] !== "object" && item.surfaces[k] !== " ")}
							<Wall
								bind:this={walls[idx++]}
								{item}
								{section}
								{offset}
							/>
						{:else if item.model?.component}
							<svelte:component
								this={MODEL_MAP[item.model.component]}
								{section}
								{offset}
								bind:this={models[models.length]}
								{item}
							/>
						{/if}
					{/each}
				{/each}
				<div class="floor" />
			</div></Player
		>
	{/if}
</div>

<style lang="scss">
	#scene {
		width: 100%;
		height: 100%;
		perspective: calc(var(--perspective));
		inset: 0;
		overflow: hidden;
		backface-visibility: hidden;
		position: absolute;
		transform-style: preserve-3d;
		// background-color: rgb(50, 50, 50); /* Sky texture */
	}
	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}
	.floor {
		min-width: 100%;
		height: 100%;
		background-color: rgb(104, 104, 104);
		backface-visibility: hidden;
		position: fixed;
		// inset: 0;
		// bottom: 0;
		top: 0;
		transform: scale3d(64, 3, 64) translateY(-300px) rotateX(90deg);
		backface-visibility: hidden;
	}

	html,
	body {
		margin: 0;
		padding: 0;
		backface-visibility: hidden;
		width: 100%;
		height: 100%;
	}

	html,
	body {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d !important;
		position: absolute !important;
		// inset: 0;
	}
	#scene {
		width: 100%;
		height: 100%;
		perspective: var(--perspective);
		overflow: hidden;
		backface-visibility: hidden;

		/* Sky texture */
		background-size: cover;
	}

	#camera,
	#world {
		position: absolute;
		top: 50% !important;
		left: 50% !important;
		// transform-origin: center;
		// inset: 0;

		backface-visibility: hidden;
		will-change: transform;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
	}
	.wall,
	.floor {
		left: 50%;
		top: 50%;
		backface-visibility: hidden !important;
		// background-size: ;
		/* For the instruction text */
		font-family: sans-serif;
		font-size: 3em;
		text-align: center;
		line-height: 300px;

		/* How to treat the textures */
		background-size: 100%;
		background-repeat: repeat;
	}
</style>
