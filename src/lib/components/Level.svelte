<script
	context="module"
	lang="ts"
>
	const MODEL_MAP = {
		Guard: Guard,
		Door: Door
	} as const;

	export const CurrentLevel = _levelStore();

	function _levelStore() {
		let world: World = [];
		const { subscribe, set, update } = writable<World>([]);

		return {
			subscribe,
			set: (level: World) => {
				world = Object.assign(world, level);

				set(world);
			},
			update,
			checkCollisionWithWorld(position: Position | Position2D) {
				try {
					const wall = world[position!.z][position!.x];

					if (wall.position) {
						return (
							!!wall.model?.component &&
							wall.position.x === position.x &&
							wall.position.z === position.z
						);
					}

					return compare(wall.surfaces, (t) => isValidTexture(t) !== false);
				} catch (e) {
					return false;
				}
			}
		};
	}
</script>

<script lang="ts">
	import { frameLoop } from "$lib/utils/raf";
	import { getDistanceFromPoints } from "$lib/utils/position";
	import { isValidTexture } from "../utils/validation";
	import { onMount } from "svelte";
	import { PlayerState } from "$lib/stores/player";
	import { writable } from "svelte/store";

	import Door from "$lib/components/Door.svelte";
	import Guard from "$lib/components/Guard/Guard.svelte";
	import Player from "$lib/components/Player.svelte";
	import Wall from "$lib/components/Wall.svelte";

	import type { Position, Position2D } from "$lib/types/position";
	import type { World } from "../types/core";
	import { compare } from "../utils/compare";
	import { getAngleBetween, isAngleBetween, normalizeAngle } from "../utils/angle";

	export let level: World = [];
	export let mode: "editor" | "generating" | "play" = "play";

	let worldRef: HTMLElement;

	const gameLoop = frameLoop.add(update);

	const walls: InstanceType<typeof Wall>[] = Array.from({ length: level.length }).fill(
		[]
	) as InstanceType<typeof Wall>[];

	const models: InstanceType<typeof Door>[] = [];
	const enemies: InstanceType<typeof Guard>[] = [];

	function update() {
		const { x, y, z } = $PlayerState.position ?? { x: 0, y: 0, z: 0 };

		for (const wall of walls) {
			if (!wall) continue;

			const pos = wall.getPosition?.();
			if (!pos) continue;
			const distance = getDistanceFromPoints(
				{ x: pos.x - 50, z: pos.z },
				{ x, y, z } /* playerPosition */
			);

			if (distance >= 1850 && wall.getVisibility() !== false) {
				wall.setVisibility(false);
				continue;
			} else if (wall.getVisibility() === false && distance < 1850) {
				wall.setVisibility(true);
			}
		}

		worldRef.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
	}

	function isVisible(obj: Guard, fov: number = 30) {
		const angle = getAngleBetween($PlayerState.position, obj.getPosition());

		const viewAngle = normalizeAngle(-$PlayerState.rotation.y + 96);

		const left = normalizeAngle(viewAngle - fov / 2);

		const right = normalizeAngle(viewAngle + fov / 2);

		return isAngleBetween(angle, left, right);
	}
	function handlePlayerShoot() {
		const { rotation, position } = $PlayerState;
		const enemiesToAttack = enemies
			.filter((e) => {
				const v = isVisible(e, 35);
				if (e.getState() === "dead") return;
				if (!v) return;
				return v;
			})
			.sort(
				(a, b) =>
					getDistanceFromPoints(b.getPosition(), position) -
					getDistanceFromPoints(a.getPosition(), position)
			);
		enemiesToAttack[0].setState("dead");
		console.log(enemiesToAttack);
	}

	onMount(() => {
		worldRef = document.getElementById("world")!;
		CurrentLevel.set(level);

		gameLoop.start();
		return () => {
			gameLoop.stop();
			frameLoop.dispose();
		};
	});
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.ctrlKey && e.key.toLowerCase() === "w") e.preventDefault();
	}}
/>

<div id="scene">
	{#if mode !== "generating"}
		<Player on:shoot={handlePlayerShoot}>
			<div
				class="world"
				id="world"
			>
				{#each $CurrentLevel as group, section}
					{#each group as item, offset}
						{#if item.model?.component}
							{#if item.model.component === "Guard"}
								<svelte:component
									this={MODEL_MAP[item.model.component]}
									{offset}
									{section}
									bind:this={enemies[enemies.length]}
									bind:item
								/>
							{:else}
								<svelte:component
									this={MODEL_MAP[item.model.component]}
									{offset}
									{section}
									bind:this={models[models.length]}
									bind:item
								/>
							{/if}
						{:else if item.surfaces !== null}
							<Wall
								bind:this={walls[walls.length]}
								{item}
								{section}
								{offset}
							/>
						{/if}
					{/each}
				{/each}
				<div class="floor" />
			</div></Player
		>
	{/if}
</div>

<style
	lang="scss"
	global
	x
>
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
		transform: scale3d(64, 1, 64) translateY(-300px) rotateX(90deg);
		backface-visibility: hidden;
	}

	html,
	body {
		margin: 0;
		padding: 0;
		backface-visibility: hidden;
		width: 100%;
		position: fixed;

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
		position: fixed;
		top: 50% !important;
		left: 50% !important;
		/* // transform-origin: center; */
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

		font-family: sans-serif;
		font-size: 3em;
		text-align: center;
		line-height: 300px;

		/* How to treat the textures */
		background-size: 100%;
		background-repeat: repeat;
	}
</style>
