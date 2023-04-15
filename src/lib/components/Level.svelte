<svelte:options immutable={true} />

<script
	context="module"
	lang="ts"
>
	const splice = (
		input: any[],
		start: number,
		deleteCount = input.length - start,
		...items: any[]
	) => input.slice(0, start).concat(...items, input.slice(start + deleteCount));

	const MODEL_MAP = {
		Guard: Guard,
		Dog: Dog,
		Door: Door,
		Object: MapObject
	} as const;

	export const CurrentLevel = _levelStore();
	function createExtendedWorld(world: World): ExtendedEntity[][] {
		return world.map((row) => {
			return row.map((entity) => {
				if (entity.surfaces !== null) {
					const surfaces: Record<WallFace, Surface> = {
						front: entity.surfaces,
						left: entity.surfaces,
						back: entity.surfaces,
						right: entity.surfaces
					};

					return { ...entity, surfaces } as ExtendedEntity;
				}

				return { ...entity, surfaces: null } as ExtendedEntity;
			});
		});
	}

	function removeConnectedSurfaces(world: ExtendedEntity[][]): void {
		const numRows = world.length;
		const numCols = world[0].length;

		for (let row = 0; row < numRows; row++) {
			for (let col = 0; col < numCols; col++) {
				const currentEntity = world[row][col];

				if (
					currentEntity.surfaces === null ||
					currentEntity.model ||
					currentEntity.pushwall ||
					currentEntity.rotation
				)
					continue;

				// Check adjacent tiles
				const adjacentPositions = [
					{ row: row - 1, col, face: "front" as WallFace },
					{ row: row + 1, col, face: "back" as WallFace },
					{ row, col: col - 1, face: "left" as WallFace },
					{ row, col: col + 1, face: "right" as WallFace }
				];

				for (const { row: adjRow, col: adjCol, face } of adjacentPositions) {
					if (
						adjRow >= 0 &&
						adjRow < numRows &&
						adjCol >= 0 &&
						adjCol < numCols &&
						world[adjRow][adjCol].surfaces !== null &&
						world[adjRow][adjCol].pushwall !== true
					) {
						// Set connected surfaces to null
						currentEntity.surfaces[face] = null;
					}
				}
			}
		}
	}

	export type WorldState = ExtendedEntity[][];

	function _levelStore() {
		let TILES: WorldState = [];
		const { subscribe, set, update } = writable<WorldState>([]);

		const checkCollisionWithWorld = (position: Position | Position2D, isBot = false) => {
			const {
				pushwall = false,
				secret = false,
				model,
				position: wallPosition,
				surfaces,
				rotation
			} = TILES[position!.z][position!.x];

			if (model?.texture && noClipObjectIds.includes(model?.texture)) {
				handleNoClipObject(model, position);
				return false;
			} else if (model?.texture) return true;

			const doorCheck = isDoor(
				{ pushwall, secret, model, position: wallPosition, rotation, surfaces },
				position
			);
			if (doorCheck) return doorCheck;
			if (
				isWall(
					{ position: wallPosition, secret, rotation, pushwall, model, surfaces },
					wallPosition
				)
			)
				return true;

			if (isBot && isEnemy(model)) return true;
			else if (isEnemy(model)) return false;

			return (
				surfaces &&
				(pushwall
					? secret && position.x === wallPosition?.x && position.z === wallPosition?.z
					: surfaces && Object.values(surfaces).some(hasValidTexture))
			);
		};

		const isDoor = (
			entity: { [K in keyof ExtendedEntity]: ExtendedEntity[K] },
			position: Position2D
		) => {
			return (
				(entity.pushwall === true && entity.secret === true) ||
				("model" in entity &&
					typeof entity.model === "object" &&
					"component" in entity.model &&
					entity.model.component === "Door" &&
					entity.position?.x === position.x &&
					entity.position?.z === position.z)
			);
		};

		const handleNoClipObject = (
			model: NonNullable<ExtendedEntity["model"]>,
			position: Position2D
		) => {
			if (!ArrayUtils.includesUnknown(ItemPickupIds, model.texture)) return;

			if (model.texture === ItemPickups.Smg) {
				PlayerState.giveWeapon("smg");
			}
			if (model.texture === ItemPickups.Ammo) {
				PlayerState.giveAmmo("pistol", 4);
			}

			if (model.texture! in TreasurePickupPointMap) {
				PlayerState.givePoints(
					TreasurePickupPointMap[model.texture! as keyof typeof TreasurePickupPointMap]
				);
			}
			if (model.texture === ItemPickups.DogFood) {
				PlayerState.giveHealth(4);
			}
			if (model.texture === ItemPickups.Medkit) {
				PlayerState.giveHealth(25);
			}

			model.texture = undefined;
			updateTileAt(position.z, position.x, { rotation: undefined, surfaces: null });
		};

		const isWall = (
			{
				secret,
				position: wallPosition,
				pushwall,
				surfaces,
				model
			}: { [K in keyof ExtendedEntity]: ExtendedEntity[K] },
			position: ExtendedEntity["position"]
		) => {
			return (
				position &&
				!model &&
				wallPosition &&
				wallPosition.x === position.x &&
				wallPosition.z === position.z &&
				surfaces &&
				!secret
			);
		};

		const isEnemy = (model: ExtendedEntity["model"]) => {
			return model?.component === "Guard" || model?.component === "Dog";
		};

		const hasValidTexture = (surfaces: Surface) => {
			return compare(surfaces, (t) => isValidTexture(t) !== false);
		};

		const updateTileAt = (row: number, column: number, data: ExtendedEntity) => {
			console.log("BEFORE UPDATE TILE AT ", { row, column }, TILES[row][column]);
			console.log("BEFORE UPDATE DATA", data);

			update((u) => {
				u = [...u.slice(0, row), splice(u[row], column, 1, data), ...u.slice(row + 1)];
				return u;
			});

			TILES[row][column] = data;
			console.log("AFTER UPDATE TILE AT", TILES[row][column]);
			console.log({ row, column });
		};
		return {
			subscribe,
			get() {
				return TILES;
			},
			set(level: typeof TILES) {
				TILES = level;
				set(TILES);
			},
			updateTileAt,
			update: (updateFn: Updater<typeof TILES>) => {
				update((v) => {
					v = updateFn(TILES);
					TILES = v;
					return v;
				});
			},
			checkCollisionWithWorld
		};
	}
</script>

<script lang="ts">
	import { frameLoop } from "$lib/utils/raf";
	import { getDistanceFromPoints } from "$lib/utils/position";
	import { ArrayUtils, isValidTexture } from "../utils/validation";
	import { onMount } from "svelte";
	import { PlayerState } from "$lib/stores/player";
	import { writable, type Updater } from "svelte/store";

	import MapObject from "$lib/components/MapObject.svelte";
	import Door from "$lib/components/Door.svelte";
	import Guard from "$lib/components/Guard/Guard.svelte";
	import Player from "$lib/components/Player.svelte";
	import Wall from "$lib/components/Wall.svelte";

	import type { Position, Position2D } from "$lib/types/position";
	import type { ExtendedEntity, Entity, Model, Surface, WallFace, World } from "../types/core";
	import { compare } from "../utils/compare";
	import { isVisibleToPlayer } from "../utils/angle";
	import { GameObjects } from "$lib/utils/manager";
	import {
		ItemPickupIds,
		ItemPickups,
		TreasurePickupPointMap,
		noClipObjectIds
	} from "$lib/utils/engine/objects";
	import Dog from "./Dog/Dog.svelte";
	import Pushwall from "./Pushwall.svelte";

	export let level: World = [];
	export let mode: "editor" | "generating" | "play" = "play";

	let worldRef: HTMLElement;

	let gameLoop: ReturnType<(typeof frameLoop)["add"]>;

	function update() {
		if (!worldRef) return;
		const { x, y, z } = $PlayerState.position ?? { x: 0, y: 0, z: 0 };

		worldRef.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
		for (const obj of GameObjects) {
			if (!obj) continue;
			const pos = obj.getPosition?.();
			if (!pos) continue;
			const visible = isVisibleToPlayer(obj, -180);
			const distance = getDistanceFromPoints(
				{ x: pos.x - 50, z: pos.z },
				{ x, y, z } /* playerPosition */
			);

			const isVisibleAlready = obj.getVisibility();

			if (visible !== true && isVisibleAlready && distance > 1500) {
				obj.setVisibility(false);
				continue;
			} else if (!isVisibleAlready && distance < 1500 && visible === true) {
				obj.setVisibility(true);
			}
		}
	}
	onMount(() => {
		worldRef = document.getElementById("world")!;
		// Create an ExtendedWorld and remove connected surfaces
		const extendedRoom = createExtendedWorld(level);
		const rm = removeConnectedSurfaces(extendedRoom);
		console.log(extendedRoom, rm);
		CurrentLevel.set(extendedRoom);
		gameLoop = frameLoop.add(update);
		gameLoop.start();
		console.log($CurrentLevel);
		setTimeout(() => {
			console.log(GameObjects);
		}, 4000);
		return () => {
			gameLoop.stop();
			frameLoop.dispose();
		};
	});
	$: console.log($CurrentLevel);
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
				bind:this={worldRef}
				class="world"
				id="world"
			>
				{#each $CurrentLevel as group, section}
					{#each group as item, offset}
						{#if item.model?.component}
							{#if item.model.component === "Guard" || item.model.component === "Dog"}
								<svelte:component
									this={MODEL_MAP[item.model.component]}
									{offset}
									{section}
									bind:this={GameObjects.enemies[GameObjects.enemies.length]}
									{item}
								/>
							{:else if item.model.component === "Door"}
								<svelte:component
									this={MODEL_MAP[item.model.component]}
									{offset}
									{section}
									bind:this={GameObjects.doors[GameObjects.doors.length]}
									{item}
								/>
							{:else}
								<svelte:component
									this={MODEL_MAP[item.model.component]}
									{offset}
									{section}
									bind:this={GameObjects.models[GameObjects.models.length]}
									{item}
								/>
							{/if}
						{:else if item.pushwall}
							<Pushwall
								bind:this={GameObjects.doors[GameObjects.doors.length]}
								{item}
								{section}
								{offset}
							/>
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
		perspective: calc(var(--perspective));
		// transform: perspective(1000px);
		position: absolute;
		will-change: transform, contents;
		width: 100%;
		inset: 0;
		// overflow: hidden;
		height: 100%;
		backface-visibility: hidden;
		// transform-style: preserve-3d;
	}

	#world {
		position: absolute;
		top: 50% !important;
		left: 50% !important;
		// /* // transform-origin: center; */
		inset: 0;
		// overflow: hidden;

		backface-visibility: hidden;
		will-change: transform;
		// width: 100%;
		// height: 100%;
		// contain: layout style size;
		transform-style: preserve-3d;
	}
</style>
