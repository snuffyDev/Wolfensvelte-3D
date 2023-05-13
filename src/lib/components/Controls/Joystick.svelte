<script lang="ts">
	import { draggable } from "$lib/actions/_shared";
	import type { Detail } from "$lib/actions/_shared/types";
	import { PlayerState } from "$lib/stores/player";
	import { frameLoop } from "$lib/utils/raf";
	import { spring } from "svelte/motion";

	export let type: "turn" | "move" = "move";

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
		coordinates = { x: x, y: y };

		tween.set({ ...coordinates });

		frameLoop((now) => {
			if (!then) then = now;

			if (now - then > 50) {
				then = now;

				if (type === "move") {
					PlayerState.update({
						a: $tween.x > 16,
						d: $tween.x < -24,
						s: $tween.y < -24,
						w: $tween.y > 0,
						leftarrow: false,
						rightarrow: false,
						shift: false
					});
				} else {
					PlayerState.update({
						leftarrow: $tween.x > 16,
						rightarrow: $tween.x < -24,

						shift: false,
						w: false,
						a: false,
						s: false,
						d: false
					});
				}
			}
			return isDragging;
		});
	};
</script>

<div class="joystick">
	<div
		class="thumb {!isDragging ? 'idle' : ''}"
		use:draggable
		on:dragstart={handleStart}
		on:dragmove={handleMove}
		on:dragend={() => {
			isDragging = false;
			coordinates = { x: 0, y: 0 };
			tween.set(coordinates);
		}}
		style="transform: translate(calc({-$tween.x / 3.2 + 'px'}),
			calc({-$tween.y / 3.2}px));"
	/>
</div>

<style lang="scss">
	.joystick {
		position: relative;
		width: 21vw;
		height: 21vw;
		display: grid;
		touch-action: none;
		place-items: center;
		border-radius: 99999rem;
		background-color: #12121276;
	}
	.thumb {
		position: absolute;
		width: 17.5vw;
		height: 17.5vw;
		border-radius: 99999rem;
		background-color: #000000;
		place-self: center;
		box-shadow: 0px 0px 32px -18px #eee inset;
		transition: cubic-bezier(0.215, 0.61, 0.355, 1) background-color;
		transition-duration: 200ms;
		// top: 50%;
		// left: 50%;
		// top: 50%;

		// left: 50%;
		// top: 50%;
		// left: -50%;
		transform: translate(50%, 50%);
		&:active {
			background-color: scale-color(#000000d5, $lightness: 33%);
		}
	}
	.idle {
		transform: translate(-50%, -50%);
	}
</style>
