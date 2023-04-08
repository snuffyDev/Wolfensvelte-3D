<script
	context="module"
	lang="ts"
>
	const MODEL_MAP = {
		Guard: Guard,
		Door: Door,
		Object: MapObject
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

					if (wall.model?.texture && noClipObjectIds.includes(wall.model?.texture as number))
						return false;
					if (wall.model?.texture) return true;
					if (wall.position) {
						return (
							wall.model?.component !== "Object" &&
							wall.position.x === position.x &&
							wall.position.z === position.z
						);
					}
					if (wall.model?.component === "Guard") return true;

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

	import MapObject from "$lib/components/MapObject.svelte";
	import Door from "$lib/components/Door.svelte";
	import Guard from "$lib/components/Guard/Guard.svelte";
	import Player from "$lib/components/Player.svelte";
	import Wall from "$lib/components/Wall.svelte";

	import type { Position, Position2D } from "$lib/types/position";
	import type { World } from "../types/core";
	import { compare } from "../utils/compare";
	import { isVisibleToPlayer } from "../utils/angle";
	import { GameObjects } from "$lib/utils/manager";
	import { noClipObjectIds } from "$lib/utils/engine/objects";

	export let level: World = [];
	export let mode: "editor" | "generating" | "play" = "play";

	let worldRef: HTMLElement;

	const gameLoop = frameLoop.add(update);

	function update() {
		const { x, y, z } = $PlayerState.position ?? { x: 0, y: 0, z: 0 };

		for (const model of GameObjects.models) {
			if (!model) continue;

			const pos = model.getPosition?.();
			if (!pos) continue;
			const visible = isVisibleToPlayer(model, 90);
			const distance = getDistanceFromPoints(
				{ x: pos.x - 50, z: pos.z },
				{ x, y, z } /* playerPosition */
			);
			if (visible !== true || distance >= 1650) {
				model.setVisibility(false);
				continue;
			}

			model.setVisibility(true);
		}
		for (const wall of GameObjects.walls) {
			if (!wall) continue;

			const pos = wall.getPosition?.();
			if (!pos) continue;
			const visible = isVisibleToPlayer(wall, 90);
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

<style lang="scss">
	#scene {
		width: 100%;
		perspective: calc(var(--perspective));
		inset: 0;
		overflow: hidden;
		backface-visibility: hidden;
		position: fixed;
		transform-style: preserve-3d;
	}

	#world {
		position: absolute;
		top: 50% !important;
		left: 50% !important;
		/* // transform-origin: center; */
		inset: 0;
		// overflow: hidden;

		backface-visibility: hidden;
		will-change: transform;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
	}
</style>
