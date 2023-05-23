<svelte:options
	accessors={true}
	immutable={true}
/>

<script lang="ts">
	import { getContext } from "svelte";
	import { type WSContext, ctxKey } from "../../routes/key";
	import type { Entity, ExtendedEntity } from "$lib/types/core";
	import { getRealPositionFromLocalPosition } from "$lib/utils/position";
	import { PlayerState, playerRotation } from "$lib/stores/player";

	const { textures }: WSContext = getContext(ctxKey);

	export let item: ExtendedEntity;
	export let offset: number;
	export let section: number;

	let position = getRealPositionFromLocalPosition({ x: offset, z: section });

	let isVisible = true;
	export const getVisibility = () => isVisible;
	let willChange: string | false = false;
	export const setVisibility = (visible: boolean) => {
		willChange = "visibility, transform";
		return () => {
			isVisible = visible;
		};
	};

	export const getPosition = () => {
		return position;
	};

	export const getLocalPosition = () => ({ x: offset, z: section });
	export const type = "object";

	let texture = item.model?.texture;
</script>

{#if isVisible && texture}
	{@const url = `--img: url(${$textures[texture].original});`}
	<div
		class="sprite"
		style="{willChange
			? `will-change: ${willChange};`
			: ''} {url} transform: translate3d({-position.x}px, -50%, {-position.z}px) rotateY({-$playerRotation}deg);"
	/>
{/if}

<style lang="scss">
	.sprite {
		height: 64px;
		width: 64px;
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		transform-style: preserve-3d;
		will-change: top;
		z-index: 1;
		background-image: var(--img);
		background-size: 64px;
		background-position: top left;
		image-rendering: pixelated;
		contain: strict;
	}
</style>
