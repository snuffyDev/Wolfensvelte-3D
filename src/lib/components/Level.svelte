<svelte:options
	accessors={true}
	immutable={true}
/>

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
		Guard: Enemy,
		Dog: Enemy,
		Door: Door,
		Object: MapObject,
		Elevator: Elevator,
		SS: Enemy
	} as const;

	export function getTileRegion(playerPosition: Position2D, regions: Region[]): number | undefined {
		for (let i = 0; i < regions.length; i++) {
			const region = regions[i];

			for (const portal of region.portals) {
				const { position } = portal;

				// Check if the player's position matches the portal's position
				if (position.x === playerPosition.x && position.z === playerPosition.z) {
					return i; // Return the region index
				}
			}
		}

		return undefined; // Player is not in any region
	}
	export function getTileRegions(playerPosition: Position2D, regions: Region[]): number[] {
		const { x, z } = playerPosition;
		const tileRegions: number[] = [];

		for (let i = 0; i < regions.length; i++) {
			const region = regions[i];
			const { portals, connectedRegions } = region;

			for (let j = 0; j < portals.length; j++) {
				const portal = portals[j];
				const { position, connectedRegion } = portal;

				if (position.x === x && position.z === z) {
					tileRegions.push(i);
					tileRegions.push(...connectedRegions, connectedRegion);

					break;
				}
			}
		}

		return Array.from(new Set(tileRegions));
	}

	export function renderVisibleTiles(
		visibleTiles: Position2D[],
		models: Model[],
		callback: (position: Model, state: boolean, isLast: boolean) => void
	): void {
		const tilePositions = visibleTiles;
		if (visibleTiles.length === 0) return;
		const modelsLength = models.length - 1;
		for (let index = 0; index < modelsLength; index++) {
			const model = models[index];
			if (!model) continue;
			const position = model?.getLocalPosition?.();
			if (!position) continue;

			if (
				tilePositions.some(
					(tilePos) => tilePos && tilePos?.x === position?.x && tilePos?.z === position?.z
				)
			) {
				callback(model, true, index === modelsLength - 1);
			} else {
				callback(model, false, index === modelsLength - 1);
			}
		}
	}
	export let CurrentLevel = _levelStore();
	export function processWorld(world: EntityV2[][]): ExtendedEntityV2[][] {
		return world.map((row, rowIndex) => {
			return row.map((entity, colIndex) => {
				if (entity.component === "Wall" && entity.texture) {
					const surfaces: Record<WallFace, Surface> = {
						front: entity.texture as Texture,
						left: entity.texture as Texture,
						back: entity.texture as Texture,
						right: entity.texture as Texture
					};

					const currentEntity = { ...entity, surfaces } as ExtendedEntityV2;

					if (entity.pushwall) return currentEntity;

					// Check adjacent tiles
					const adjacentPositions = [
						{ row: rowIndex - 1, col: colIndex, face: "front" as WallFace },
						{ row: rowIndex + 1, col: colIndex, face: "back" as WallFace },
						{ row: rowIndex, col: colIndex - 1, face: "left" as WallFace },
						{ row: rowIndex, col: colIndex + 1, face: "right" as WallFace }
					];

					for (const { row: adjRow, col: adjCol, face } of adjacentPositions) {
						const targetEntity = world[adjRow]?.[adjCol] as ExtendedEntityV2;
						if (!(adjRow >= 0 && adjRow < world.length && adjCol >= 0 && adjCol < world[0].length))
							continue;
						if (
							targetEntity.component === "Wall" &&
							!targetEntity.pushwall &&
							!currentEntity.pushwall
						) {
							if (currentEntity.surfaces === null)
								currentEntity.surfaces = {} as Record<WallFace, Texture>;
							// Set connected surfaces to null
							((currentEntity as ExtendedEntityV2).surfaces as Record<WallFace, Texture>)[face] =
								null;
						}
					}
					return currentEntity;
				}

				return { ...entity, surfaces: null } as ExtendedEntityV2;
			});
		});
	}

	export type WorldState = {
		spawn: { x: number; z: number; rotation: 0 | 270 | 180 | 90 };
		data: ExtendedEntityV2[][];
	};

	function _levelStore() {
		let TILES: WorldState["data"] = [];
		let PORTAL: Region[] = [];
		const { subscribe, set, update } = writable<WorldState["data"]>([]);

		const checkCollisionWithWorld = (
			position: Position | Position2D,
			isBot: boolean | null = false
		) => {
			const { component, surfaces, texture, attributes, blocking } =
				TILES[position!.z][position!.x];
			if (!component && (!texture || !surfaces)) return null;
			if (attributes?.collectable) {
				return handleNoClipObject(TILES[position.z][position.x], position, isBot);
				return false;
			}

			if (attributes?.state === "open") return false;

			return component === "Wall" || attributes?.state === "closed" || blocking === true;
		};

		const handleNoClipObject = (
			model: NonNullable<ExtendedEntityV2>,
			position: Position2D,
			isBot: boolean | null = false
		) => {
			if (isBot || isBot === null) return false;
			if (!ArrayUtils.includesUnknown(ItemPickupIds as never, model.texture)) return;
			if (model.texture === ItemPickups.Smg) {
				PlayerState.giveWeapon("smg");

				model.texture = null;
				updateTileAt(position.z, position.x, { surfaces: null });
			}
			if (model.texture === ItemPickups.Ammo) {
				PlayerState.giveAmmo("pistol", 4);

				model.texture = null;
				updateTileAt(position.z, position.x, { surfaces: null });
			}

			if (model.texture! in TreasurePickupPointMap) {
				PlayerState.givePoints(
					TreasurePickupPointMap[model.texture! as keyof typeof TreasurePickupPointMap]
				);
				PlayerState.setPickupState();

				model.texture = null;
				updateTileAt(position.z, position.x, { surfaces: null });
			}
			if (model.texture === ItemPickups.DogFood) {
				PlayerState.giveHealth(4);

				model.texture = null;
				updateTileAt(position.z, position.x, { surfaces: null });
			}

			if (model.texture === ItemPickups.Food) {
				PlayerState.giveHealth(10);

				model.texture = null;
				updateTileAt(position.z, position.x, { surfaces: null });
			}
			if (model.texture === ItemPickups.Medkit) {
				PlayerState.giveHealth(25);

				model.texture = null;
				updateTileAt(position.z, position.x, { surfaces: null });
			} else {
				return true;
			}
		};

		const updateTileAt = (row: number, column: number, data: Partial<ExtendedEntityV2>) => {
			queueMicrotask(() => {
				update((u) => {
					return [...u.slice(0, row), splice(u[row], column, 1, data), ...u.slice(row + 1)];
				});

				TILES[row][column] = data as ExtendedEntityV2;
			});
		};
		return {
			subscribe,
			get() {
				return TILES;
			},
			set() {
				const baseTile = (model: Partial<EntityV2>) =>
					({
						rotation: null,
						texture: null,
						pushwall: false,
						blocking: false,
						position: {},
						secret: false,
						attributes: null,
						...model
					} as EntityV2);

				const BASE_TILE_MAP: EntityV2[][] = [...Array(64).keys()].map(() =>
					[...Array(64).keys()].map(() => baseTile({}))
				);
				const BASE_PROP_MAP: EntityV2[][] = [...Array(64).keys()].map(() =>
					[...Array(64).keys()].map(() => baseTile({}))
				);
				for (let z = 0; z < 64; z++) {
					for (let x = 0; x < 64; x++) {
						let m0 = gameData.getMap0(x, z)!;
						if (m0 <= 63) {
							// wall
							BASE_TILE_MAP[z][x] = baseTile({
								blocking: true,
								position: { z, x },
								texture: m0 * 2 - 1,
								component: "Wall"
							});
							gameData.plane2[z][x] = true;
						} else if (89 <= m0 && m0 <= 103) {
							// door
							BASE_TILE_MAP[z][x] = baseTile({
								component: "Door",
								position: { z, x },
								texture: m0 + 9,
								attributes: { state: "closed" },
								blocking: true
							});
							gameData.plane2[z][x] = true;
						}
						let m1 = gameData.getMap1(x, z) as number;
						if (m0 === 21) {
							console.warn({ m1 });
							BASE_TILE_MAP[z][x] = baseTile({
								component: "Elevator",
								texture: 108,
								blocking: true
							});
						}
						if (19 <= m1 && m1 <= 22) {
							// player starting position
							PlayerState.modify((player) => {
								player.position.x = x - 0.5;

								player.position.z = z - 0.5;
								console.log(player.position);
								player.position = { ...getRealPositionFromLocalPosition(player.position), y: 0 };
								return player;
							});
							// TODO: Player spawn direction
							PlayerState.modify((player) => {
								if (m1 === 19) {
									player.rotation.y = 180;
								} else if (m1 === 20) {
									player.rotation.y = 270;
								} else if (m1 === 21) {
									player.rotation.y = 0;
								} else if (m1 === 22) {
									player.rotation.y = 90;
								}
								return player;
							});
						} else if (23 <= m1 && m1 <= 70) {
							// props
							// TODO: Map these correctly to the correct plane
							let collectible = false;
							if ([29, 43, 44, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56].indexOf(m1) >= 0) {
								// collectible
								collectible = true;
								if (52 <= m1 && m1 <= 56) {
									LevelStatManager.addTotalKey("totalTreasure");
								}
							}
							if (
								[
									24, 25, 26, 28, 30, 31, 33, 34, 35, 36, 39, 40, 41, 45, 58, 59, 60, 62, 63, 68, 69
								].indexOf(m1!) >= 0
							) {
								BASE_TILE_MAP[z][x] = baseTile({
									texture: 115 + m1! - 21,
									position: { z, x },
									component: "Object",
									attributes: { collectable: !!collectible },
									blocking: true
								});
								gameData.plane2[z][x] = true;
							} else {
								BASE_TILE_MAP[z][x] = baseTile({
									texture: 115 + m1! - 21,
									position: { z, x },
									component: "Object",
									attributes: { collectable: !!collectible },
									blocking: false
								});
							}
						} else if (m1 === 98) {
							// pushwall
							LevelStatManager.addTotalKey("totalSecrets");
							BASE_TILE_MAP[z][x] = {
								...BASE_TILE_MAP[z][x],
								position: { z, x },
								component: "Wall",
								blocking: true,
								pushwall: true
							};
						} else if (m1 === 124) {
							// dead guard
							BASE_TILE_MAP[z][x] = {
								...BASE_TILE_MAP[z][x],
								blocking: false,
								position: { z, x },
								texture: 165
							};
						} else if (m1 >= 108) {
							const guardEnemyRange = (108 <= m1 && m1 < 116) || (144 <= m1 && m1 < 152);
							const ssEnemyRange = (126 <= m1 && m1 < 134) || (162 <= m1 && m1 < 170);
							const dogEnemyRange = (134 <= m1 && m1 < 142) || (170 <= m1 && m1 < 178);
							if (guardEnemyRange) {
								const baseNumber = guardEnemyRange ? 108 : 144;
								BASE_TILE_MAP[z][x] = {
									...BASE_TILE_MAP[z][x],
									blocking: false,
									component: "Guard"
								};
								LevelStatManager.addTotalKey("totalKills");
							} else if (ssEnemyRange) {
								const baseNumber = ssEnemyRange ? 126 : 162;
								BASE_TILE_MAP[z][x] = { ...BASE_TILE_MAP[z][x], blocking: false, component: "SS" };
								LevelStatManager.addTotalKey("totalKills");
							} else if (dogEnemyRange) {
								const baseNumber = dogEnemyRange ? 134 : 170;
								BASE_TILE_MAP[z][x] = { ...BASE_TILE_MAP[z][x], blocking: false, component: "Dog" };
								LevelStatManager.addTotalKey("totalKills");
							}
						}
					}
				}

				console.log({ BASE_TILE_MAP });
				const extendedMap = processWorld(BASE_TILE_MAP);

				TILES = extendedMap;
				PORTAL = Array.from(preprocessLevel(TILES));
				console.log(PORTAL);
				set(TILES);
			},
			getPortal: () => PORTAL,
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
	import { frameLoop, type TaskCallback } from "$lib/utils/raf";
	import {
		getLocalPositionFromRealPosition,
		getRealPositionFromLocalPosition
	} from "$lib/utils/position";
	import { ArrayUtils } from "../utils/validation";
	import { getContext, onMount } from "svelte";
	import { PlayerState } from "$lib/stores/player";
	import { writable, type Updater } from "svelte/store";

	import MapObject from "$lib/components/MapObject.svelte";
	import Door from "$lib/components/Door.svelte";
	import Enemy from "$lib/components/Enemy.svelte";
	import Wall from "$lib/components/Wall.svelte";

	import type { Position, Position2D } from "$lib/types/position";
	import type { EntityV2, ExtendedEntityV2, Surface, Texture, WallFace } from "../types/core";
	import { GameObjects, type Model } from "$lib/utils/manager";
	import { ItemPickupIds, ItemPickups, TreasurePickupPointMap } from "$lib/utils/engine/objects";
	import Pushwall from "./Pushwall.svelte";
	import Elevator from "./Elevator.svelte";
	import { ctxKey, type WSContext } from "../../routes/key";
	import { gameData } from "$lib/helpers/maps";
	import { LevelStatManager } from "$lib/stores/stats";
	import { preprocessLevel, isPositionPortal, type Region, getCurrentRegion } from "./portal";
	import { asap } from "$lib/utils/asap";

	export let mode: "editor" | "generating" | "play" = "play";

	export let worldRef: HTMLElement;

	const { isLoadingNextLevel } = getContext(ctxKey) as WSContext;

	let start: number;
	let gameLoop: ReturnType<typeof frameLoop>;
	const INTERVAL = 1000 / 60;
	let schedule: (fn: () => void) => void;

	const update: TaskCallback = (now: number, scheduler) => {
		if (!schedule) schedule = scheduler;
		if (!start) start = now;
		const elapsed = now - start;

		const { x, y, z } = $PlayerState.position ?? { x: 0, y: 0, z: 0 };

		if ($isLoadingNextLevel) return true;
		worldRef.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
		if (elapsed > 250) {
			start = now % INTERVAL;
			const playerLocal = getLocalPositionFromRealPosition({ x, y, z });
			const { models } = $GameObjects;

			if (isPositionPortal(CurrentLevel.getPortal(), playerLocal)) {
				const regions = getTileRegions(
					getLocalPositionFromRealPosition({ x, z }),
					CurrentLevel.getPortal()
				);
				const visibleTiles = regions.flatMap((regionIndex) => {
					const region = CurrentLevel.getPortal()[regionIndex];
					return [
						region.tiles,
						...region.connectedRegions.map((v) =>
							CurrentLevel.getPortal()[v].portals.map((p) => p.position)
						),
						region.portals.map(({ position }) => position)
					].flat();
				});
				renderVisibleTiles(visibleTiles, [...GameObjects], (position, state) => {
					const visibility = position.setVisibility(state);
					scheduler(() => visibility());
				});
			} else {
			}
		}
		worldRef.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
		return true;
	};

	onMount(() => {
		queueMicrotask(() => {
			gameLoop = frameLoop(update);
			const currentRegion = getCurrentRegion(
				CurrentLevel.getPortal(),
				getLocalPositionFromRealPosition($PlayerState.position)
			)!;
			renderVisibleTiles(
				[
					...currentRegion.tiles,
					...currentRegion.portals.map(({ position }) => {
						return position;
					})
				],
				[...GameObjects],
				(model, state) => {
					const visibility = model.setVisibility(state);
					if (schedule) schedule(visibility);
					else asap(visibility);
				}
			);
		});
		return () => {
			asap(() => {
				gameLoop.abort();
				GameObjects.reset();
				gameLoop = null as never;
			});
		};
	});
	$: console.log($GameObjects, $CurrentLevel);
</script>

{#if mode !== "generating"}
	{#each $CurrentLevel as group, section}
		{#each group as item, offset}
			{#if item.component === "Guard" || item.component === "Dog" || item.component === "SS"}
				<svelte:component
					this={MODEL_MAP[item.component]}
					{offset}
					{section}
					bind:this={$GameObjects.enemies[$GameObjects.enemies.length]}
					{item}
				/>
			{:else if item.component === "Door"}
				<svelte:component
					this={MODEL_MAP[item.component]}
					{offset}
					{section}
					bind:this={$GameObjects.doors[$GameObjects.doors.length]}
					{item}
				/>
			{:else if item.component === "Elevator"}
				<svelte:component
					this={MODEL_MAP[item.component]}
					{offset}
					{section}
					bind:this={$GameObjects.elevators[$GameObjects.elevators.length]}
					{item}
				/>
			{:else if item.component === "Object"}
				<svelte:component
					this={MODEL_MAP[item.component]}
					{offset}
					{section}
					bind:this={$GameObjects.models[$GameObjects.models.length]}
					{item}
				/>
			{:else if item.pushwall}
				<Pushwall
					bind:this={$GameObjects.pushwalls[$GameObjects.pushwalls.length]}
					{item}
					{section}
					{offset}
				/>
			{:else if item.component === "Wall" && !!item.texture && !item.pushwall}
				<Wall
					bind:this={$GameObjects.walls[$GameObjects.walls.length]}
					{item}
					{section}
					{offset}
				/>
			{/if}
		{/each}
	{/each}
{/if}
