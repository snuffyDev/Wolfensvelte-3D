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
		let tilemap: World = [];
		const { subscribe, set, update } = writable<World>([]);

		return {
			subscribe,
			set: (level: World) => {
				tilemap = Object.assign(tilemap, level);

				set(tilemap);
			},
			update,
			checkCollisionWithWorld(position: Position | Position2D) {
				try {
					const wall = tilemap[position!.z][position!.x];

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
	import Guard, { rand } from "$lib/components/Guard/Guard.svelte";
	import Player from "$lib/components/Player.svelte";
	import Wall from "$lib/components/Wall.svelte";

	import type { Position, Position2D } from "$lib/types/position";
	import type { Entity, MapItem, Texture, World } from "../types/core";
	import { compare } from "../utils/compare";
	import {
		getAngleBetweenPoints,
		isAngleBetween,
		isVisibleToPlayer,
		normalizeAngle
	} from "../utils/angle";
	import { GameObjects } from "$lib/utils/manager";

	export let level: World = [];
	export let mode: "editor" | "generating" | "play" = "play";

	let worldRef: HTMLElement;

	const gameLoop = frameLoop.add(update);

	function update() {
		const { x, y, z } = $PlayerState.position ?? { x: 0, y: 0, z: 0 };

		for (const wall of GameObjects.walls) {
			if (!wall) continue;

			const pos = wall.getPosition?.();
			if (!pos) continue;
			const visible = isVisibleToPlayer(wall, 30);
			const distance = getDistanceFromPoints(
				{ x: pos.x - 50, z: pos.z },
				{ x, y, z } /* playerPosition */
			);
			if (visible !== true || distance >= 1750) {
				wall.setVisibility(false);
				continue;
			}

			wall.setVisibility(true);
		}

		worldRef.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
	}

	function findConnectedRenderableMapItems(world: World): MapItem[][] {
		const connectedMapItems: MapItem[][] = [];
		const visited: Set<string> = new Set();

		// Define a recursive DFS helper function
		function dfs(x: number, y: number, currentItems: MapItem[]): void {
			const item = world[x][y];
			if (!visited.has(`${x},${y}`) && item?.surfaces) {
				visited.add(`${x},${y}`);
				currentItems.push(item);

				// Recursively explore neighboring tiles
				if (x > 0) dfs(x - 1, y, currentItems);
				if (x < world.length - 1) dfs(x + 1, y, currentItems);
				if (y > 0) dfs(x, y - 1, currentItems);
				if (y < world[x].length - 1) dfs(x, y + 1, currentItems);
			}
		}

		// Iterate over all tiles in the world
		for (let x = 0; x < world.length; x++) {
			const row: MapItem[] = [];
			for (let y = 0; y < world[x].length; y++) {
				if (
					!visited.has(`${x},${y}`) &&
					(typeof world[x][y].model === "object" || world[x][y].surfaces)
				) {
					const currentItems: MapItem[] = [];
					dfs(x, y, currentItems);
				}
				if (
					world[x][y] &&
					(typeof world[x][y].model === "object" || world[x][y].surfaces !== null)
				) {
					row.push(world[x][y]);
				} else {
					row.push({ surfaces: null, rotation: undefined });
				}
			}
			connectedMapItems.push(row.filter((item) => item));
		}
		connectedMapItems;
		return connectedMapItems;
	}
	onMount(() => {
		worldRef = document.getElementById("world")!;
		CurrentLevel.set(level);
		console.log($CurrentLevel);

		gameLoop.start();
		setTimeout(() => {
			console.log(worldRef.childNodes.length);
		}, 7500);
		return () => {
			gameLoop.stop();
			frameLoop.dispose();
		};
	});
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.ctrlKey && e.key.toLowerCase() === "w") e.preventDefault();
		// if (e.key === " ") console.log(Math.min(34, Math.max(12, rand.rnd() / 8)));
	}}
/>

<div id="scene">
	{#if mode !== "generating"}
		<Player>
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
									bind:this={GameObjects.enemies[GameObjects.enemies.length]}
									bind:item
								/>
							{:else}
								<svelte:component
									this={MODEL_MAP[item.model.component]}
									{offset}
									{section}
									bind:this={GameObjects.models[GameObjects.models.length]}
									bind:item
								/>
							{/if}
						{:else if item.surfaces}
							<Wall
								bind:this={GameObjects.walls[GameObjects.walls.length]}
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
		/* height: 100%; */
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
		/* height: 100%; */
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
		/* // transform-origin: center; */
		inset: 0;

		backface-visibility: hidden;
		will-change: transform;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
	}
	.wall,
	.floor {
		/* left: 50%; */
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
