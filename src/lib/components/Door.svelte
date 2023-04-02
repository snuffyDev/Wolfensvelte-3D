<script lang="ts">
	import type { Position } from "$lib/types/position";
	import type { MapItem } from "$lib/utils/map";
	import { getRealPositionFromLocalPosition } from "$lib/utils/position";
	import { getContext, onMount } from "svelte";
	import { tweened } from "svelte/motion";
	import { ctxKey, type TextureContext } from "../../routes/key";

	export let item: MapItem;
	export let offset: number;
	export let section: number;

	let state: "open" | "closed" = "closed";
	const { textures }: TextureContext = getContext(ctxKey);

	const _position = getRealPositionFromLocalPosition({ x: offset, z: section });
	const position = tweened(_position);

	export const getPosition = () => $position;
	export const getLocalPosition = (): Omit<Position, "y"> => ({
		x: state === "open" ? offset + 1 : offset,
		z: section
	});

	onMount(() => {
		// const interval = setInterval(() => {
		// 	state = state === "open" ? "closed" : "open";
		// 	// if (state === 'open') {
		// 	position.update((u) => ({
		// 		x: state === "open" ? _position.x + 100 : _position.x,
		// 		z: $position.z
		// 	}));
		// 	// }
		// }, 3000);
		// return () => {
		// 	clearInterval(interval);
		// };
	});
	let isMouseOver = false;
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.key === "Space" && isMouseOver) {
			state = state === "open" ? "closed" : "open";
		}
	}}
/>
<div
	on:pointerover={() => {
		isMouseOver = true;
	}}
	on:pointerleave={() => {
		isMouseOver = false;
	}}
	class="door {state}"
	style="rotate: {item.rotation
		? item.rotation.y
		: 0}deg; --pX: {$position.x}px; --pZ: {$position.z}px;"
>
	<!---->
	<div
		class=" sprite"
		style="background-image: url({$textures['m1'].original});"
	>
		<!---->
	</div>
	<div
		class=" sprite"
		style="background-image: url({$textures['m1'].original});"
	>
		<!---->
	</div>
</div>

<style lang="scss">
	.door {
		position: absolute;
		width: 100px;
		height: 100px;
		top: 0;
		left: 0;
		contain: layout size style;
		// display: grid;
		will-change: transform;
		// grid-template-rows: 1fr;
		// grid-template-columns: 16px 16px;
		// gap: 16px;?
		transform: translate3d(var(--pX), -50%, var(--pZ));
		&:hover {
			cursor: pointer;
		}
		backface-visibility: hidden;
		transform-style: preserve-3d;
		> :where(.sprite) {
			transform-style: preserve-3d;
			// transition: inherit;
			will-change: transform;
			// backface-visibility: hidden;
			transform: translate3d(0, 0%, -8px);
			&:nth-child(2) {
				transform: translateZ(0.5em);
			}
			// background-color: slategray;
			width: 6.25rem;
			height: 6.25rem;
			position: inherit;
			top: 0%;
			//
			left: 0%;
			// transform: inherit;
		}
		&::before,
		&::after {
			content: "";
			position: inherit;

			// inset: 0;
			width: 16px;
			height: 100%;
			// right: 0;
			// transform-origin: center;
			background: darkcyan;
			top: 0;
			// inset: 0;
			bottom: 0;
			// transition: inherit;
			backface-visibility: hidden;
			transform: rotateY(90deg);
		}
		&::before {
			right: -7.95px;
			// left: 0;
		}
		&::after {
			left: -7.95px;
			// right: 0;
		}
	}
</style>
