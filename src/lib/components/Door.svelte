<svelte:options accessors={true} />

<script lang="ts">
	import type { Position, Position2D } from "$lib/types/position";
	import type { ExtendedEntity, MapItem } from "../types/core";
	import { getRealPositionFromLocalPosition } from "$lib/utils/position";
	import { getContext, onMount } from "svelte";
	import { tweened } from "svelte/motion";
	import { CurrentLevel } from "./Level.svelte";
	import { ctxKey, type TextureContext } from "../../routes/key";
	import { compare } from "../utils/compare";
	import { AudioManager } from "$lib/helpers/audio";

	export let item: ExtendedEntity;
	export let offset: number;
	export let section: number;

	let state: "open" | "closed" = "closed";
	let visibility = true;
	let shouldMute = true;
	let count = 0;

	const { textures }: TextureContext = getContext(ctxKey);

	const _position = getRealPositionFromLocalPosition({ x: offset, z: section });
	const position = tweened(_position);
	const audioPlayer = new AudioManager({
		open: new URL("../sounds/objects/door/door.WAV", import.meta.url).toString(),
		close: new URL("../sounds/objects/door/door_close.WAV", import.meta.url).toString()
	});

	export const getVisibility = () => visibility;
	export const setVisibility = (visible: boolean) => (visibility = visible);

	export const toggleOpen = () => {
		if (shouldMute && count >= 2) shouldMute = false;

		if (shouldMute) count += 1;

		state = state === "open" ? "closed" : "open";
		position.update((u) =>
			!rotation
				? {
						x: state === "open" ? _position.x + 64 : _position.x,
						z: $position.z
				  }
				: { z: state === "open" ? _position.z + 64 : _position.z, x: $position.x }
		);

		let currentState = $CurrentLevel[section][offset];
		if (!currentState.position) currentState.position = {} as Position2D;
		if (state === "open") {
			currentState.position = { x: offset + 1, z: section };
		} else {
			currentState.position = { x: offset, z: section };
		}
		CurrentLevel.updateTileAt(section, offset, currentState);

		if (!shouldMute) {
			if (state === "open") {
				audioPlayer.play("open");
				setTimeout(() => {
					toggleOpen();
				}, 5000);
			} else {
				audioPlayer.play("close");
			}
		}
	};
	export const getPosition = () => $position;
	export const getLocalPosition = (): Omit<Position, "y"> => ({
		x: state === "open" ? offset + 1 : offset,
		z: section
	});

	$: rotation = 0;

	onMount(() => {
		let interval: string | number | NodeJS.Timer | undefined;
		toggleOpen();
		toggleOpen();
		try {
			const isLeftRight =
				Object.values($CurrentLevel?.[section]?.[offset + 1]?.surfaces ?? {}).some(
					(v) => typeof v === "number" && v !== 0
				) &&
				Object.values($CurrentLevel?.[section]?.[offset - 1]?.surfaces ?? {}).some(
					(v) => typeof v === "number" && v !== 0
				);
			const isTopBottom =
				Object.values($CurrentLevel?.[section - 1]?.[offset]?.surfaces ?? {}).some(
					(v) => typeof v === "number" && v !== 0
				) &&
				Object.values($CurrentLevel?.[section + 1]?.[offset]?.surfaces ?? {}).some(
					(v) => typeof v === "number" && v !== 0
				);
			if (isLeftRight) rotation = 0;
			else if (isTopBottom) rotation = 90;

			visibility = true;
		} catch {}
	});
</script>

<div
	class="door {state}"
	style="visibility: {visibility
		? 'visible'
		: 'hidden'};  --pX: {-$position.x}px; --pZ: {-$position.z}px; --rotation: {rotation ?? 0}deg;"
>
	<!---->
	<div
		class=" sprite"
		style="background-image: url({$textures[99].original});"
	>
		<!---->
	</div>
	<div
		class=" sprite"
		style="background-image: url({$textures[99].original});"
	>
		<!---->
	</div>
</div>

<style lang="scss">
	.door {
		position: absolute;
		width: 64px;
		height: 64px;
		top: 0;
		left: 0;
		right: 0;
		// will-change: transform, visibility;
		transform: translate3d(var(--pX), -50%, var(--pZ)) rotateY(var(--rotation));

		backface-visibility: hidden;
		transform-style: preserve-3d;
		> :where(.sprite) {
			background-size: 100%;
			image-rendering: pixelated;
			transform-style: preserve-3d;
			transform: translate3d(0, 0%, -8px) rotateY(180deg);
			&:nth-child(2) {
				transform: translateZ(8px);
			}
			width: 64px;
			height: 64px;
			position: inherit;
			top: 0%;
			//
			backface-visibility: hidden;
			left: 0%;
		}
		&::before,
		&::after {
			content: "";
			position: inherit;

			width: 16px;
			height: 100%;
			background: darkcyan;
			top: 0;
			bottom: 0;
			backface-visibility: hidden;
			transform: rotateY(90deg);
		}
		&::before {
			right: -1.95px;
		}
		&::after {
			left: -1.95px;
			transform: rotateY(-90deg);
		}
	}
</style>
