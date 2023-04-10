<svelte:options
	immutable={true}
	accessors={true}
/>

<script
	context="module"
	lang="ts"
>
	export const DIRECTION_MAP: Record<string, number> = {
		front: 0,
		backleft: 45,
		left: 270,
		back: 180,
		topright: 135,
		right: 90
	};

	import type { Position } from "$lib/types/position";
	import { objectEntries } from "$lib/utils/object";
	import { getRealPositionFromLocalPosition } from "$lib/utils/position";
	import { WALL_FACES, isValidTexture } from "$lib/utils/validation";
	import { getContext } from "svelte";
	import { CurrentLevel } from "./Level.svelte";
	import { ctxKey, type TextureContext } from "../../routes/key";
	import type { MapItem, Texture, WallFace } from "../types/core";
</script>

<script lang="ts">
	export let offset = 0;
	export let section = 0;
	export let height = 64;
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
	export const sides: { [dir in WallFace]: Texture } = Object.fromEntries(
		WALL_FACES.map((dir) => [dir, item.surfaces])
	) as any;

	/** Returns an array of DOM elements for each wall face */
	export const boundSides: HTMLDivElement[] = [];

	const { textures }: TextureContext = getContext(ctxKey);

	const getZPosition = (direction: "front" | "left" | "right" | "back") => {
		switch (direction) {
			case "back":
				return -position.z - 32;
			case "front":
				return -position.z + 32;
			case "left":
			case "right":
				return -position.z - 32;
		}
	};
</script>

{#if isVisible}
	<div class="surface">
		{#each objectEntries(sides) as [direction, texture], i}
			{#if direction && typeof texture === "number"}
				{@const positionZ = getZPosition(direction)}
				{@const validatedTexture = isValidTexture(texture)
					? $textures[direction !== "left" && direction !== "right" ? texture : texture + 1]
							?.original
					: ""}
				{@const img = ` --img: url(${validatedTexture});`}

				<div
					class="wall {direction}"
					bind:this={boundSides[i]}
					data-x={-position.x}
					data-z={positionZ}
					data-rotation={DIRECTION_MAP[direction]}
					style="--height: {height}px; {img} transform: translate3d({-position.x}px, -50%, {positionZ}px) rotateY({DIRECTION_MAP[
						direction
					]}deg); "
				>
					<!-- {direction} -->
				</div>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.wall {
		height: var(--height);
		background-image: var(--img);
		/* top: 0%; */
		image-rendering: pixelated;
		background-size: 100%;
		background-repeat: no-repeat;
		backface-visibility: hidden !important;
		font-size: 1rem;
		color: white;

		/* image-rendering: ; */
		/* opacity: 1; */
	}
</style>
