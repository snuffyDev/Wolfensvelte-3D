<svelte:options accessors={true} />

<script lang="ts">
	import type { Position } from "$lib/types/position";
	import type { MapItem } from "$lib/utils/map";
	import { getRealPositionFromLocalPosition } from "$lib/utils/position";
	import { getContext, onMount } from "svelte";
	import { tweened } from "svelte/motion";
	import { CurrentLevel } from "./Level.svelte";
	import { ctxKey, type TextureContext } from "../../routes/key";
	import { compare } from "../utils/compare";

	export let item: MapItem;
	export let offset: number;
	export let section: number;

	let state: "open" | "closed" = "closed";
	let visibility = true;
	const { textures }: TextureContext = getContext(ctxKey);

	const _position = getRealPositionFromLocalPosition({ x: offset, z: section });
	const position = tweened(_position);

	export const getVisibility = () => visibility;
	export const setVisibility = (visible: boolean) => (visibility = visible);

	export const getPosition = () => $position;
	export const getLocalPosition = (): Omit<Position, "y"> => ({
		x: state === "open" ? offset + 1 : offset,
		z: section
	});

	$: rotation = 0;

	onMount(() => {
		let interval: string | number | NodeJS.Timer | undefined;

		try {
			const isLeftRight =
				compare(
					$CurrentLevel?.[section]?.[offset + 1]?.surfaces,
					(v) => typeof v === "number" && v !== 0
				) &&
				compare(
					$CurrentLevel?.[section]?.[offset - 1]?.surfaces,
					(v) => typeof v === "number" && v !== 0
				);
			const isTopBottom =
				compare(
					$CurrentLevel?.[section - 1]?.[offset]?.surfaces,
					(v) => typeof v === "number" && v !== 0
				) &&
				compare(
					$CurrentLevel?.[section + 1]?.[offset]?.surfaces,
					(v) => typeof v === "number" && v !== 0
				);
			if (isLeftRight) rotation = 0;
			else if (isTopBottom) rotation = 90;
		} catch {}

		interval = setInterval(
			function cb() {
				state = state === "open" ? "closed" : "open";
				// if (state === 'open') {
				position.update((u) =>
					!rotation
						? {
								x: state === "open" ? _position.x + 64 : _position.x,
								z: $position.z
						  }
						: { z: state === "open" ? _position.z + 64 : _position.z, x: $position.x }
				);

				let currentState = $CurrentLevel[section][offset];
				if (!currentState.position) currentState.position = {};
				if (state === "open") {
					currentState.position = { x: offset + 1, z: section };
				} else {
					currentState.position = { x: offset, z: section };
				}
				$CurrentLevel[section][offset] = currentState;
				// }
				clearInterval(interval);
				interval = setInterval(cb, state === "closed" ? 1500 : 6000);
			},
			state === "closed" ? 1500 : 6000
		);
		return () => {
			clearInterval(interval);
		};
	});
	let isMouseOver = false;
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.key === " " && isMouseOver) {
			state = state === "open" ? "closed" : "open";
		}
	}}
/>
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
		will-change: transform, visibility;
		transform: translate3d(var(--pX), -50%, var(--pZ)) rotateY(var(--rotation));

		backface-visibility: hidden;
		transform-style: preserve-3d;
		> :where(.sprite) {
			background-size: 100%;
			image-rendering: pixelated;
			transform-style: preserve-3d;
			transform: translate3d(0, 0%, -8px);
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
