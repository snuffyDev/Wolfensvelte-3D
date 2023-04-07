<svelte:options accessors={true} />

<script lang="ts">
	import { getContext } from "svelte";
	import { type TextureContext, ctxKey } from "../../routes/key";
	import type { Entity } from "$lib/types/core";
	import { getRealPositionFromLocalPosition } from "$lib/utils/position";
	import { PlayerState } from "$lib/stores/player";
	import { isVisibleToPlayer } from "$lib/utils/angle";

	const { textures }: TextureContext = getContext(ctxKey);

	export let item: Entity;
	export let offset: number;
	export let section: number;

	let position = getRealPositionFromLocalPosition({ x: offset, z: section });

	let visibility = true;

	export const getVisibility = () => visibility;
	export const setVisibility = (visible: boolean) => (visibility = visible);

	export const getPosition = () => {
		return position;
	};

	export const getLocalPosition = () => ({ x: offset, z: section });

	$: texture = item.model?.texture;
	let rotation: number;
	$: if (isVisibleToPlayer(position, 30)) rotation = -$PlayerState.rotation.y;
</script>

{#if texture}
	{@const url = `--img: url(${$textures[texture].original});`}
	<div
		class="sprite"
		style="{url} visibility: {visibility
			? 'visible'
			: 'hidden'}; transform: translate3d({-position.x}px, -50%, {-position.z}px) rotateY({rotation}deg); "
	/>
{/if}

<style lang="scss">
	.sprite {
		height: 64px;
		width: 64px;
		position: absolute;
		top: 0;
		will-change: visibility, transform;
		left: 0;
		bottom: 0;
		background-image: var(--img);
		background-size: 100%;
		backface-visibility: visible !important;
		image-rendering: pixelated;
		opacity: 1;
	}
</style>
