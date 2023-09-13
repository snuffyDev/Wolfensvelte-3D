<svelte:options
	accessors={true}
	immutable={true}
/>

<script lang="ts">
	import type { Position, Position2D } from "$lib/types/position";
	import type { ExtendedEntityV2 } from "../types/core";
	import {
		getFacingDirection,
		getLocalPositionFromRealPosition,
		getRealPositionFromLocalPosition
	} from "$lib/utils/position";
	import { tweened } from "svelte/motion";
	import { CurrentLevel, getTileRegions, renderVisibleTiles } from "./Level.svelte";
	import Wall from "./Wall.svelte";
	import { PlayerState } from "$lib/stores/player";
	import { GameObjects } from "$lib/utils/manager";

	export let item: ExtendedEntityV2;
	export let offset: number;
	export let section: number;

	let state: "open" | "closed" = "closed";
	let hasOpenedOnce = false;
	let visibility = false;

	const _position = getRealPositionFromLocalPosition({ x: offset, z: section });
	const position = tweened(_position);

	export const getVisibility = () => visibility;
	let willChange: string | false = false;
	export const setVisibility = (visible: boolean) => {
		willChange = "visibility, transform";
		return () => {
			visibility = visible;
		};
	};

	export const toggleAction = async () => {
		if (state === "open" || hasOpenedOnce) return;
		hasOpenedOnce = true;
		const oldPosition = $position;
		const direction = getFacingDirection($PlayerState.rotation.y);
		let toPosition: Position2D = getLocalPosition();
		const regions = getTileRegions(
			getLocalPositionFromRealPosition(oldPosition),
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
			queueMicrotask(() => visibility());
		});
		do {
			let nextMove: Position2D = {} as Position2D;

			switch (direction) {
				case "left":
					nextMove = { ...toPosition, x: toPosition.x + 1 };
					break;
				case "right":
					nextMove = { ...toPosition, x: toPosition.x - 1 };
					break;
				case "back":
					nextMove = { ...toPosition, z: toPosition.z - 1 };
					break;
				case "front":
					nextMove = { ...toPosition, z: toPosition.z + 1 };
					break;
				default:
					break;
			}
			if ($CurrentLevel[nextMove.z][nextMove.x].surfaces !== null) break;

			const nextPosition = getRealPositionFromLocalPosition({ ...nextMove });

			await position.set({ x: nextPosition.x, z: nextPosition.z }, { duration: 1000 }).then(() => {
				toPosition = nextMove;
			});
		} while ($CurrentLevel[toPosition.z][toPosition.x].surfaces === null);

		let currentState = $CurrentLevel[section][offset];

		currentState.position = toPosition;

		CurrentLevel.updateTileAt(toPosition.z, toPosition.x, {
			position: currentState.position,
			surfaces: currentState.surfaces,
			rotation: undefined,
			blocking: true,
			secret: false,
			pushwall: true
		});

		CurrentLevel.updateTileAt(section, offset, {
			surfaces: null,
			rotation: undefined,
			secret: false,
			pushwall: false
		});

		queueMicrotask(() => {
			state = "open";
		});
	};
	export const type = "pushwall";

	export const getPosition = () => $position;
	export const getLocalPosition = (): Omit<Position, "y"> =>
		state === "open" && item.position
			? item.position
			: {
					x: offset,
					z: section
			  };
</script>

<div
	class="pushwall  {state}"
	style="{willChange ? `will-change: ${willChange};` : ''} visibility: {visibility
		? 'visible'
		: 'hidden'};  --pX: {-$position.x}px; --pZ: {-$position.z}px; --rotation: {0}deg;"
>
	<Wall {item} />
</div>

<style lang="scss">
	.pushwall {
		position: fixed;
		width: 64px;
		height: 64px;
		transform: translate3d(var(--pX), 0%, var(--pZ)) rotateY(var(--rotation));
		top: 0;
		will-change: top;
		backface-visibility: hidden;
		transform-style: preserve-3d;
		backface-visibility: visible !important;
	}
</style>
