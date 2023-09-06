<svelte:options
	accessors={true}
	immutable={true}
/>

<script lang="ts">
	import type { Position, Position2D } from "$lib/types/position";
	import type { ExtendedEntity, ExtendedEntityV2, MapItem } from "../types/core";
	import {
		getLocalPositionFromRealPosition,
		getRealPositionFromLocalPosition
	} from "$lib/utils/position";
	import { getContext, onMount } from "svelte";
	import { tweened } from "svelte/motion";
	import { CurrentLevel, getTileRegion, getTileRegions, renderVisibleTiles } from "./Level.svelte";
	import { ctxKey, type WSContext } from "../../routes/key";
	import { compare } from "../utils/compare";
	import { AIAudioManager } from "$lib/helpers/audio";
	import { PlayerState } from "$lib/stores/player";
	import { GameObjects } from "$lib/utils/manager";
	import { getAdjacentRegions, getCurrentRegion } from "./portal";
	import { asap } from "$lib/utils/levelManager";

	export let item: ExtendedEntityV2;
	export let offset: number;
	export let section: number;

	let state: "open" | "closed" = "closed";
	let visibility = true;
	let shouldMute = true;
	let count = 0;
	let willChange: string | false = false;
	const { textures }: WSContext = getContext(ctxKey);

	const _position = getRealPositionFromLocalPosition({ x: offset, z: section });
	const position = tweened(_position);
	const audioPlayer = new AIAudioManager({
		open: new URL("../sounds/objects/door/door.WAV", import.meta.url).toString(),
		close: new URL("../sounds/objects/door/door_close.WAV", import.meta.url).toString()
	});
	$: console.log({ item, offset, section });
	export const getVisibility = () => visibility;
	export const setVisibility = (visible: boolean, triggeredByPlayer = false) => {
		willChange = "visibility";
		return () => {
			if (triggeredByPlayer) {
				setTimeout(
					() => {
						visibility = visible;
						willChange = false;
					},
					visible === true ? 0 : 500
				);
			} else {
				visibility = visible;
				willChange = false;
			}
		};
	};

	let timer: ReturnType<typeof setTimeout>;

	export const toggleAction = async () => {
		if (item.attributes?.needsKey && !$PlayerState.keys?.[item.attributes.needsKey]) return;

		if (shouldMute && count >= 2) shouldMute = false;
		if (shouldMute) count += 1;

		state = state === "open" ? "closed" : "open";
		const oldState = $position;

		position.update((u) =>
			!rotation
				? {
						x: state === "open" ? _position.x + 64 : _position.x,
						z: $position.z
				  }
				: { z: state === "open" ? _position.z + 64 : _position.z, x: $position.x }
		);

		if (
			compare(
				getLocalPositionFromRealPosition($PlayerState.position),
				({ x, z }) => $position.x === x && $position.z === z
			)
		) {
			$position = oldState;
			state = state === "closed" ? "open" : "closed";
			clearTimeout(timer);
			timer = setTimeout(() => {
				toggleAction();
			}, 5000);
			return;
		}
		let currentState = $CurrentLevel[section][offset];
		if (!currentState.position) currentState.position = {} as Position2D;
		if (count >= 0) {
			await new Promise((resolve) => {
				const regions = getTileRegions(
					getLocalPositionFromRealPosition($position),
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
				renderVisibleTiles(visibleTiles, [...GameObjects], (position, state, isLast) => {
					const visibility = position.setVisibility(state);
					queueMicrotask(() => visibility());
					if (isLast) resolve(undefined);
				});
			}).then(() => console.log("RESOLVED"));
		}

		if (state === "open") {
			currentState.position = { x: offset + 1, z: section };
			if (!currentState.attributes) currentState.attributes = {} as any;
			currentState.attributes!.state = "open";
		} else {
			currentState.position = { x: offset, z: section };
			if (!currentState.attributes) currentState.attributes = {} as any;
			currentState.attributes!.state = "closed";
		}
		state = currentState.attributes!.state;
		CurrentLevel.updateTileAt(section, offset, currentState);

		if (state === "open" && !shouldMute) {
			audioPlayer.play("open");
			clearTimeout(timer);
			timer = setTimeout(() => {
				toggleAction();
			}, 5000);
		} else if (!shouldMute) {
			clearTimeout(timer);
			audioPlayer.play("close");
		}
	};
	export const getPosition = () => $position;
	export const getLocalPosition = (): Omit<Position, "y"> => ({
		x: state === "open" ? offset + 1 : offset,
		z: section
	});
	export const type = "door";
	$: rotation = 0;

	onMount(() => {
		let interval: string | number | NodeJS.Timer | undefined;
		queueMicrotask(() => {
			// toggleAction();?
		});
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
		} catch {}
	});
	$: console.log($textures[item.texture].original);
</script>

<!-- {#if visibility} -->
<div
	class="door {state}"
	style="{willChange ? `will-change: ${willChange};` : ''} visibility: {visibility
		? 'visible'
		: 'hidden'};  --pX: {-$position.x}px; --pZ: {-$position.z}px; --rotation: {rotation ?? 0}deg;"
>
	<!---->
	{#if item.texture}
		<div
			class=" sprite"
			style="background-image: url({$textures[rotation ? item.texture : item.texture - 1]
				.original});"
		>
			<!---->
		</div>
		<div
			class=" sprite"
			style="background-image: url({$textures[rotation ? item.texture : item.texture - 1]
				.original});"
		>
			<!---->
		</div>
	{/if}
</div>

<!-- {/if} -->
<style lang="scss">
	.door {
		position: absolute;
		width: 64px;
		height: 64px;
		top: 0;
		left: 0;
		right: 0;

		transform: translate3d(var(--pX), -50%, var(--pZ)) rotateY(var(--rotation));

		// backface-visibility: hidden;
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
