<script lang="ts">
	import { LevelHandler } from "$lib/stores/stats";
	import type { ExtendedEntity, Texture, WallFace } from "$lib/types/core";
	import type { Position2D } from "$lib/types/position";
	import { getRealPositionFromLocalPosition } from "$lib/utils/position";
	import { frameLoop } from "$lib/utils/raf";
	import { WALL_FACES } from "$lib/utils/validation";
	import { getContext } from "svelte";
	import Wall from "./Wall.svelte";
	import { ctxKey, type WSContext } from "../../routes/key";

	export let offset: number;
	export let section: number;
	export let item: ExtendedEntity;

	let visibility: boolean = false;
	let state: "inactive" | "active" = "inactive";

	const position = getRealPositionFromLocalPosition({ x: offset, z: section });

	export const getVisibility = () => visibility;
	export const setVisibility = (visible: boolean) => (visibility = visible);
	export const getPosition = () => position;
	export const getLocalPosition = (): Position2D => ({
		x: offset,
		z: section
	});

	const { isLoadingNextLevel } = getContext(ctxKey) as WSContext;
	export const toggleAction = () => {
		state = "active";
		LevelHandler.levelComplete(true);
		setTimeout(() => {
			$isLoadingNextLevel = true;
		}, 0);
	};

	$: if (state === "active") {
		item.surfaces = Object.fromEntries(WALL_FACES.map((f) => [f, 109])) as Record<
			WallFace,
			Texture
		>;
	}
	item.surfaces = Object.fromEntries(WALL_FACES.map((f) => [f, 107])) as Record<WallFace, Texture>;
</script>

{#key state}
	<Wall
		{section}
		{offset}
		{item}
		height={64}
	/>
{/key}

<style lang="scss">
</style>
