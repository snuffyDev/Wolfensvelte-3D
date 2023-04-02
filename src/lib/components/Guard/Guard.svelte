<script lang="ts">
	import { PlayerState } from '$lib/stores/player';
	import type { Position } from '$lib/types/position';
	import { getDistanceFromPoints } from '$lib/utils/position';
	import { frameLoop } from '$lib/utils/raf';
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	let state: 'attack' | 'walk' | 'default';
	let timeout: NodeJS.Timeout;
	let rotation: number = 0;
	let position: Position = { x: 0, y: 0, z: 0 };
	let isTargetingPlayer = false;
	const tPosition = tweened<typeof position>(position, { duration: 1726, delay: 100 });
	let start: number;
	const loop = frameLoop.add((now) => {
		if (!start) start = now;
		const elapsed = now - start;
		if (elapsed > 700) {
			start = now;
			const distance = getDistanceFromPoints($tPosition, {
				x: -$PlayerState.position.x,
				y: 0,
				z: -$PlayerState.position.z
			});
			console.log({ distance });
			if (distance < 475) {
				isTargetingPlayer = true;
				if (distance <= 135 && Math.random() > 0.6666) {
					state = 'walk';
					tPosition.update(
						(tv, v) => {
							// state = 'walk';
							return { x: tv.x + Math.random() * 100, y: 0, z: tv.z + Math.random() * 100 };
						},
						{ duration: distance * 12 }
					);
				} else if (distance <= 275 && distance >= 125 && Math.random() < 0.6) {
					state = 'walk';
					tPosition.update(
						(tv, v) => {
							// state = 'walk';
							return { x: -$PlayerState.position.x, y: 0, z: -$PlayerState.position.z };
						},
						{ duration: distance * 12 }
					);
				} else if (distance <= 320) {
					state = 'attack';
					// rotation = -$PlayerState.rotation.y!;
					console.log($tPosition);

					PlayerState.takeDamage('gun');
				}
				// isTargetingPlayer = false;
			}
		}
	});
	onMount(() => {
		let count = 0;
		timeout = setInterval(() => {
			if (isTargetingPlayer) return;
			state = Math.random() < 0.5 ? 'default' : 'walk';
			if (state === 'walk') {
				count += 1;
				if (count % 2)
					tPosition.set({
						...$tPosition,
						x: $tPosition.x > -$PlayerState.position.x ? $tPosition.x + 62 : $tPosition.x + 151,
						z: $tPosition.z < -$PlayerState.position.z ? $tPosition.z + 14 : $tPosition.z + 86
					});
				else
					tPosition.set({
						...$tPosition,
						x: $tPosition.x > -$PlayerState.position.x ? $tPosition.x + 165 : $tPosition.x - 29,
						z: $tPosition.z > -$PlayerState.position.z ? $tPosition.z - 21 : $tPosition.z + 99
					});
			} else {
			}
		}, 1500);
		loop.start();
		return () => clearTimeout(timeout);
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
