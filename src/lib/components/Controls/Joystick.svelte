<script lang="ts">
	import { draggable } from "$lib/actions/_shared";
	import type { Detail } from "$lib/actions/_shared/types";
	import { PlayerState } from "$lib/stores/player";
	import { frameLoop } from "$lib/utils/raf";
	import { spring } from "svelte/motion";

	export let type: "turn" | "move" = "move";
	export let style = "";

	const DEFAULT_COORDINATES = { x: 0, y: 0 } as const;

	let coordinates: { x: number; y: number } = DEFAULT_COORDINATES;

	let isDragging = false;

	const tween = spring<typeof coordinates>(coordinates, {
		stiffness: 0.1,
		damping: 1,
		precision: 1
	});

	// Limits a positive or negative number to the correct sign.
	const clamp = (number: number, limit: number) => {
		const abs = Math.abs(number);
		return abs < limit ? number : Math.sign(number) * limit;
	};

	const handleMove = ({ detail }: { detail: Detail }) => {
		const x = clamp(+detail.clientX - detail.startX / 2, 150);
		const y = clamp(+detail.clientY - detail.startY / 2, 150);

		tween.set({ x, y });
	};

	let then: number | undefined = undefined;

	const handleStart = ({ detail }: { detail: Detail }) => {
		isDragging = true;

		const { startX: x, startY: y } = detail;
		coordinates = { x: x * 2, y: y * 2 };

		tween.set({ ...coordinates });

		frameLoop((now) => {
			if (!then) then = now;

			then = now;

			if (type === "move") {
				PlayerState.update({
					a: $tween.x > 12,
					d: $tween.x < -20,
					s: $tween.y < -20,
					w: $tween.y > 12,
					leftarrow: false,
					rightarrow: false,
					shift: false
				});
			} else {
				PlayerState.update({
					leftarrow: $tween.x > 8,
					rightarrow: $tween.x < -12,

					shift: false,
					w: false,
					a: false,
					s: false,
					d: false
				});
			}
			return isDragging;
		});
	};
</script>

<div
	class="joystick"
	{style}
	use:draggable
	on:dragstart={handleStart}
	on:dragmove={handleMove}
	on:dragend={() => {
		isDragging = false;
		coordinates = { x: 0, y: 0 };
		tween.set(coordinates);
	}}
>
	<div
		class="thumb {!isDragging ? 'idle' : ''}"
		style="transform: translate(calc({-$tween.x / 3.2 + 'px'}),
			calc({-$tween.y / 3.2}px));"
	/>
</div>

<style lang="scss">
	.joystick {
		position: relative;
		width: 18vw;
		height: 18vw;
		display: grid;
		touch-action: none;
		place-items: center;
		border-radius: 99999rem;
		background-color: #12121276;
		pointer-events: all;
		z-index: 1000;
		&:nth-of-type(1) {
			margin-left: 3vw;
			margin-bottom: 3vw;
		}
		@media screen and (orientation: landscape) and (pointer: coarse) {
			background-color: scale-color(#0000002e, $lightness: 0%);

			width: 12.5vw;
			height: 12.5vw;
		}
	}
	.thumb {
		position: absolute;
		width: 15.25vw;
		height: 15.25vw;
		border-radius: 99999rem;
		background-color: #000000;
		place-self: center;
		box-shadow: 0px 0px 32px -18px #eee inset;
		transition: cubic-bezier(0.215, 0.61, 0.355, 1) background-color;
		transition-duration: 200ms;

		transform: translate(50%, 50%);
		&:active {
			background-color: scale-color(#000000d5, $lightness: 33%);
		}
		@media screen and (orientation: landscape) and (pointer: coarse) {
			background-color: scale-color(#00000060, $lightness: 33%);

			width: 9.25vw;
			height: 9.25vw;
		}
	}
	.idle {
		transform: translate(-50%, -50%);
	}
</style>
