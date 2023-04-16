<svelte:options accessors={true} />

<script lang="ts">
	import type { Position, Position2D } from "$lib/types/position";
	import type { ExtendedEntity } from "../types/core";
	import { getFacingDirection, getRealPositionFromLocalPosition } from "$lib/utils/position";
	import { tweened } from "svelte/motion";
	import { CurrentLevel } from "./Level.svelte";
	import Wall from "./Wall.svelte";
	import { PlayerState } from "$lib/stores/player";

	export let item: ExtendedEntity;
	export let offset: number;
	export let section: number;

	let state: "open" | "closed" = "closed";
	let hasOpenedOnce = false;
	let visibility = true;

	const _position = getRealPositionFromLocalPosition({ x: offset, z: section });
	const position = tweened(_position);

	export const getVisibility = () => visibility;
	export const setVisibility = (visible: boolean) => (visibility = visible);

	export const toggleAction = async () => {
		if (state === "open" || hasOpenedOnce) return;
		hasOpenedOnce = true;

		const direction = getFacingDirection($PlayerState.rotation.y);
		let toPosition: Position2D = getLocalPosition();

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
		// if (!currentState.position) currentState.position = {} as Position2D;
		currentState.position = toPosition;

		CurrentLevel.updateTileAt(toPosition.z, toPosition.x, {
			position: currentState.position,
			surfaces: currentState.surfaces,
			rotation: undefined,
			secret: false,
			pushwall: true
		});

		CurrentLevel.updateTileAt(section, offset, {
			surfaces: null,
			rotation: undefined,
			secret: false,
			pushwall: true
		});

		queueMicrotask(() => {
			state = "open";
		});
	};
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
	style="visibility: {visibility
		? 'visible'
		: 'hidden'};  --pX: {-$position.x}px; --pZ: {-$position.z}px; --rotation: {0}deg;"
>
	<Wall {item} />
</div>

<style lang="scss">
	.pushwall {
		position: absolute;
		width: 64px;
		height: 64px;
		transform: translate3d(var(--pX), 0%, var(--pZ)) rotateY(var(--rotation));
		// contain: content;
		backface-visibility: hidden;
		transform-style: preserve-3d;
	}
</style>
