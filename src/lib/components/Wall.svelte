<svelte:options accessors={true} />

<script
	context="module"
	lang="ts"
>
	export const DIRECTION_MAP: Record<string, number> = {
		front: 0,
		left: 270,
		back: -180,
		right: 90
	};

	import type { Position } from "$lib/types/position";
	import { objectEntries } from "$lib/utils/object";
	import { getRealPositionFromLocalPosition } from "$lib/utils/position";
	import { isValidTexture } from "$lib/utils/validation";
	import { getContext, onMount } from "svelte";
	import { CurrentLevel } from "../../routes/editor/components/Level.svelte";
	import { ctxKey, type TextureContext } from "../../routes/key";
	import type { MapItem, Texture } from "../utils/map";
</script>

<script lang="ts">
	export let offset = 0;
	export let section = 0;
	export let height = 100;
	export let item: MapItem;

	const position = getRealPositionFromLocalPosition({ x: offset, z: section });

	let isVisible = true;

	/** Position for the component instance */
	export const getPosition = () => position;

	/** Returns the localPosition ()`offset` and `section`) of the component within the level  */
	export const getLocalPosition = (): Omit<Position, "y"> => ({ x: offset, z: section });

	/** Returns the visibility state  */
	export const getVisibility = () => isVisible;

	/** Sets the visibility state  */
	export const setVisibility = (visible: boolean) => (isVisible = visible);

	export const checkCollisionWithWorld = () =>
		CurrentLevel.checkCollisionWithWorld(getLocalPosition());

	/** Returns an array of each wall face */
	export const sides: ([direction: string, texture: Texture] | null)[] = Object.entries(
		item?.surfaces ?? {}
	).map(([k, v]) => (v !== " " ? [k, v] : null));

	/** Returns an array of DOM elements for each wall face */
	export const boundSides: HTMLDivElement[] = [];

	const { textures }: TextureContext = getContext(ctxKey);

	const getZPosition = (direction: "front" | "left" | "right" | "back") => {
		switch (direction) {
			case "front":
				return position.z + 50;
			case "back":
				return position.z - 50;
			case "left":
			case "right":
				return position.z - 50;
		}
	};

	const COLORS = {
		front: "red",
		back: "yellow",
		left: "limegreen",
		right: "blue"
	};
</script>

<div class="surface">
	{#each objectEntries(item?.surfaces) as [direction, texture], i}
		{#if direction && texture && typeof texture === "string"}
			{@const positionZ = getZPosition(direction)}
			{@const validatedTexture = isValidTexture(texture) ? $textures[texture]?.original : ""}
			{@const img = ` --img: url(${validatedTexture});`}
			<div
				class="wall {direction}"
				bind:this={boundSides[i]}
				data-x={-position.x}
				data-z={positionZ}
				data-rotation={DIRECTION_MAP[direction]}
				style="--height: {height}px; {img} transform: translate3d({position.x}px, -50%, {positionZ}px) rotateY({DIRECTION_MAP[
					direction
				]}deg); "
			>
				<!-- {direction} -->
			</div>
		{/if}
	{/each}
</div>

<style>
	.wall {
		contain: layout size;
		visibility: visible;
		background-repeat: repeat;
		/* background-size: 100%; */
		/* content-visibility: auto; */
		will-change: visibility;
		/* transform-origin: bottom left; */
		/* transform-origin: left; */
		position: absolute;
		height: var(--height);
		/* transform: var(--transform); */
		background-image: var(--img);
		/* backface-visibility: v !important; */
		/* backface-visibility: visible !important; */
		image-rendering: pixelated;
	}
	.hidden {
		visibility: hidden;
	}
</style>
