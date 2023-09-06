<svelte:options
	accessors={true}
	immutable={true}
/>

<script
	context="module"
	lang="ts"
>
	export const DIRECTION_MAP: Record<string, number> = {
		front: 0,
		backleft: 45,
		left: 90,
		back: 180,
		topright: 135,
		right: -90
	};

	const getZPosition = (direction: "front" | "left" | "right" | "back", position: Position2D) => {
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

	import type { Position, Position2D } from "$lib/types/position";
	import { objectEntries } from "$lib/utils/object";
	import { getRealPositionFromLocalPosition } from "$lib/utils/position";
	import { WALL_FACES, isValidTexture } from "$lib/utils/validation";
	import { getContext } from "svelte";
	import { CurrentLevel } from "./Level.svelte";
	import { ctxKey, type WSContext } from "../../routes/key";
	import type { ExtendedEntity, Texture, WallFace } from "../types/core";
</script>

<script lang="ts">
	export let offset = 0;
	export let section = 0;
	export let height = 64;
	export let item: ExtendedEntity;

	const position = getRealPositionFromLocalPosition({ x: offset, z: section });

	let isVisible = true;
	let willChange: string | false = false;

	export let style = "";
	export const type = "wall";
	/** Position for the component instance */
	export const getPosition = () => position;

	/** Returns the localPosition ()`offset` and `section`) of the component within the level  */
	export const getLocalPosition = (): Omit<Position, "y"> => ({ x: offset, z: section });

	/** Returns the visibility state  */
	export const getVisibility = () => isVisible;

	/** Sets the visibility state  */
	export const setVisibility = (visible: boolean) => {
		willChange = "visibility, transform";
		return () => {
			isVisible = visible;
		};
	};

	export const checkCollisionWithWorld = () =>
		CurrentLevel.checkCollisionWithWorld(getLocalPosition());

	/** Returns an array of each wall face */
	export const sides: { [dir in WallFace]: Texture } = Object.fromEntries(
		WALL_FACES.map((dir) => [dir, item.surfaces])
	) as any;
	/**
	 * Just making TS Happy...
	 */
	const { textures }: WSContext = getContext(ctxKey);
</script>

{#if isVisible}
	<div class="surface">
		{#if item.surfaces}
			{#each objectEntries(item.surfaces) as [direction, texture], i}
				{#if direction && typeof texture === "number"}
					{@const positionZ = getZPosition(direction, position)}
					{@const validatedTexture = isValidTexture(texture)
						? $textures[direction !== "left" && direction !== "right" ? texture : texture + 1]
								?.original
						: ""}
					{@const img = ` --img: url(${validatedTexture});`}

					<div
						class="wall {direction}"
						data-x={-position.x}
						data-z={positionZ}
						data-rotation={DIRECTION_MAP[direction]}
						style="{willChange
							? `will-change: ${willChange};`
							: ''} --height: {height}px; {img} transform: translate3d({-position.x}px, -50%, {positionZ}px) rotateY({DIRECTION_MAP[
							direction
						]}deg); {style}"
					>
						<!-- {direction} -->
					</div>
				{/if}
			{/each}
		{/if}
	</div>
{/if}

<style>
	.wall {
		height: var(--height);
		background-image: var(--img);
		/* top: 0%; */
		image-rendering: pixelated;
		background-size: 64px;
		background-repeat: no-repeat;
		/* backface-visibility: hidden !important; */
		font-size: 1rem;
		color: white;
		backface-visibility: hidden !important;
		z-index: -1;
		opacity: 1;
		/* image-rendering: ; */
	}
</style>
