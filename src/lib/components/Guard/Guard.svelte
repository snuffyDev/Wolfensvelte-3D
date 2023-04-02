<svelte:options accessors={true} />

<script
	lang="ts"
	context="module"
>
	type Deferred = { promise: Promise<void>; resolve: () => void };
	const deferred = () => {
		const d: Deferred = {} as Deferred;
		d.promise = new Promise((resolve) => {
			d.resolve = resolve;
		});
		return d;
	};
</script>

<script lang="ts">
	import { PlayerState } from "$lib/stores/player";
	import type { Position } from "$lib/types/position";
	import { getDistanceFromPoints, getRealPositionFromLocalPosition } from "$lib/utils/position";
	import { frameLoop } from "$lib/utils/raf";
	import { onMount } from "svelte";
	import { tweened } from "svelte/motion";
	import type { MapItem } from "../../types/core";

	export let item: MapItem;
	export let offset: number;
	export let section: number;

	export const getPosition = () => $tPosition;

	let state: "attack" | "walk" | "default";
	let timeout: NodeJS.Timeout;
	let isTargetingPlayer = false;

	const position = getRealPositionFromLocalPosition({ x: offset, z: section });
	const tPosition = tweened<typeof position>(
		{ x: -position.x, z: -position.z },
		{ duration: 1726, delay: 100 }
	);

	let start: number;
	let running = false;

	const queue = async (task: Deferred) => {
		if (running) return;
		running = true;
		await task.promise.then(() => {
			running = false;
		});
	};
	const loop = frameLoop.add(() => {
		const distance = getDistanceFromPoints($tPosition, {
			x: -$PlayerState.position.x,
			y: 0,
			z: -$PlayerState.position.z
		});

		if (distance < 475) {
			if (running) return;
			const task = deferred();
			isTargetingPlayer = true;
			if (distance <= 235 && Math.random() > 0.6666) {
				state = "walk";
				tPosition
					.update(
						(tv, v) => {
							// state = 'walk';
							return { x: tv.x + Math.random() * 100, y: 0, z: tv.z + Math.random() * 100 };
						},
						{ duration: distance * 12 }
					)
					.then(task.resolve);
			} else if (distance <= 275 && distance >= 35 && Math.random() < 0.6) {
				state = "walk";
				tPosition
					.update(
						(tv, v) => {
							// state = 'walk';
							return { x: -$PlayerState.position.x, y: 0, z: -$PlayerState.position.z };
						},
						{ duration: distance * 12 }
					)
					.then(task.resolve);
			} else if (distance <= 320) {
				state = "attack";
				// rotation = -$PlayerState.rotation.y!;
				console.log($tPosition);

				PlayerState.takeDamage("gun");
				task.resolve();
			}
			isTargetingPlayer = false;
		}
	});
	onMount(() => {
		let count = 0;
		timeout = setInterval(() => {
			if (isTargetingPlayer) return;
			state = Math.random() < 0.5 ? "default" : "walk";
			if (state === "walk") {
				count += 1;
				if (count % 2)
					tPosition.set({
						...$tPosition,
						x: $tPosition.x > $PlayerState.position.x ? $tPosition.x + 62 : $tPosition.x + 151,
						z: $tPosition.z < $PlayerState.position.z ? $tPosition.z + 14 : $tPosition.z + 86
					});
				else
					tPosition.set({
						...$tPosition,
						x: $tPosition.x > $PlayerState.position.x ? $tPosition.x + 165 : $tPosition.x - 29,
						z: $tPosition.z > $PlayerState.position.z ? $tPosition.z - 21 : $tPosition.z + 99
					});
			} else {
			}
		}, 1500);

		loop.start();
		return () => {
			clearTimeout(timeout);
			loop.stop();
		};
	});
</script>

<div
	class="sprite enemy guard {state}"
	style="transform: translate3d({$tPosition.x}px, -50%, {$tPosition.z}px) rotateY({-$PlayerState
		.rotation.y}deg);"
/>

<style lang="scss">
	.sprites {
		transform-style: preserve-3d;
	}
	.sprite {
		position: absolute;

		backface-visibility: hidden;
		transform: translateY(-50%);

		top: 0%;
		bottom: 0;
		background-repeat: no-repeat !important;
	}
	.sprite.enemy.guard {
		height: 177px;
		width: 76px;
		background: url(./guard.png) left center;
		background-size: 960px;
		image-rendering: pixelated;
		background-origin: center;
		&.default {
			background-position-x: -1%;
		}
		&.walk {
			animation: walk 1.1s steps(1) infinite;
			@keyframes walk {
				0% {
					background-position-x: 8%;
				}
				25% {
					background-position: 16%;
				}
				50% {
					background-position: 24%;
				}
				75% {
					background-position: 33%;
				}
			}
		}
		&.dead {
			background-position: -3132px;
			animation: dead 1s steps(1);
			@keyframes dead {
				0% {
					background-position: -1558px;
				}
				20% {
					background-position: -1880px;
				}
				40% {
					background-position: -2210px;
				}
				60% {
					background-position: -2522px;
				}
				80% {
					background-position: -3132px;
				}
			}
		}
		&.attack {
			animation: attack 1.1s steps(1) infinite;
			@keyframes attack {
				0% {
					background-position: 92%;
				}
				50% {
					background-position: 100%;
				}
			}
		}
	}
</style>
