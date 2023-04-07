<svelte:options accessors={true} />

<script
	lang="ts"
	context="module"
>
	const rng = () => {
		/* This is just John Carmack's table driven pseudo-random number generator */
		var rndtable = [
			0, 8, 109, 220, 222, 241, 149, 107, 75, 248, 254, 140, 16, 66, 74, 21, 211, 47, 80, 242, 154,
			27, 205, 128, 161, 89, 77, 36, 95, 110, 85, 48, 212, 140, 211, 249, 22, 79, 200, 50, 28, 188,
			52, 140, 202, 120, 68, 145, 62, 70, 184, 190, 91, 197, 152, 224, 149, 104, 25, 178, 252, 182,
			202, 182, 141, 197, 4, 81, 181, 242, 145, 42, 39, 227, 156, 198, 225, 193, 219, 93, 122, 175,
			249, 0, 175, 143, 70, 239, 46, 246, 163, 53, 163, 109, 168, 135, 2, 235, 25, 92, 20, 145, 138,
			77, 69, 166, 78, 176, 173, 212, 166, 113, 94, 161, 41, 50, 239, 49, 111, 164, 70, 60, 2, 37,
			171, 75, 136, 156, 11, 56, 42, 146, 138, 229, 73, 146, 77, 61, 98, 196, 135, 106, 63, 197,
			195, 86, 96, 203, 113, 101, 170, 247, 181, 113, 80, 250, 108, 7, 255, 237, 129, 226, 79, 107,
			112, 166, 103, 241, 24, 223, 239, 120, 198, 58, 60, 82, 128, 3, 184, 66, 143, 224, 145, 224,
			81, 206, 163, 45, 63, 90, 168, 114, 59, 33, 159, 95, 28, 139, 123, 98, 125, 196, 15, 70, 194,
			253, 54, 14, 109, 226, 71, 17, 161, 93, 186, 87, 244, 138, 20, 52, 123, 251, 26, 36, 17, 46,
			52, 231, 232, 76, 31, 221, 84, 37, 216, 165, 212, 106, 197, 242, 98, 43, 39, 175, 254, 145,
			190, 84, 118, 222, 187, 136, 120, 163, 236, 249
		];

		var rndindex = 0;

		function init(randomize: boolean) {
			if (randomize) {
				rndindex = new Date().getTime() & 0xff;
			} else {
				rndindex = 0;
			}
		}

		function rnd() {
			rndindex++;
			rndindex &= 0xff;
			return rndtable[rndindex];
		}
		return {
			init,
			rnd
		};
	};

	export const rand = rng();
	rand.init(true);

	const distanceToPosition = (a: Position2D, b: Position2D) => {
		const distance = getDistanceFromPoints(a, { x: b.x, z: b.z });

		const { x, z } = getLocalPositionFromRealPosition({
			x: b.x - distance,
			z: b.z - distance
		});
		console.log(distance);
		return [x, z] as const;
	};

	function getPositionFromDistance(a: Position2D, b: Position2D) {
		const [x, y] = distanceToPosition(b, {
			...a,
			x: -a.x,
			z: -a.z
		});
		const moveTo = { x: 1 - (a.x + b.x + x) + x * 2, z: 1 - (a.z + b.z + y) + y * 2 };

		return moveTo;
	}
</script>

<script lang="ts">
	import { PlayerState } from "$lib/stores/player";
	import type { Position2D } from "$lib/types/position";
	import {
		getDistanceFromPoints,
		getLocalPositionFromRealPosition,
		getRealPositionFromLocalPosition
	} from "$lib/utils/position";
	import { frameLoop } from "$lib/utils/raf";
	import { onMount, tick } from "svelte";
	import type { MapItem } from "../../types/core";
	import { isVisibleToPlayer } from "../../utils/angle";
	import { enemyState } from "./state";
	import HaltSound from "$lib/sounds/guard_halt.WAV?url";
	import ShootSound from "$lib/sounds/guard_shoot.WAV?url";
	import { AudioManager } from "$lib/helpers/audio";

	export let item: MapItem;
	export let offset: number;
	export let section: number;

	const localPosition = getRealPositionFromLocalPosition({ x: offset, z: section });

	const state = enemyState({
		position: { x: -localPosition.x, z: -localPosition.z },
		state: "idle"
	});
	const tween = state.tween;

	export const getPosition = () => $tween;
	export const setState = state.setState;
	export const getState = () => $state.state;
	export const takeDamage = async () => {
		if (Math.random() < 0.65) state.setState("hurt");
		await state.giveDamage();
		if ($state.health <= 0) {
			tween.cancel();
			stateLoop.stop();
		}
	};
	let previousAnimationState: typeof $state.state;
	const audioManager = new AudioManager({
		halt: new URL(HaltSound, import.meta.url).toString(),
		shoot: new URL(ShootSound, import.meta.url).toString()
	});
	$: if ($state) $state.rotation.y = $PlayerState.rotation.y - 90;

	let startFrame: number;
	let busy = false;

	let playerLastSeenAt: number;
	let playerJustSeen = false;
	const stateLoop = frameLoop.add(async (now) => {
		if (!startFrame) startFrame = now;
		if (busy) return;
		if ($state.state === "dead") return stateLoop.stop();
		const elapsed = now - startFrame;

		if (elapsed > 1000) {
			if (busy) return;
			await tick();
			busy = true;
			startFrame = now;

			const lastSeen = playerLastSeenAt;
			const distance = getDistanceFromPoints(
				{ x: -$PlayerState.position.x, z: -$PlayerState.position.z },
				$state.position
			);

			const seen = isVisibleToPlayer(getPosition(), 45);
			if (seen) {
				if (distance > 250 && distance < 750 && Math.random() < 0.5) {
					if (!playerJustSeen) {
						playerJustSeen = true;
						audioManager.play("halt");
					}

					previousAnimationState = "walk";
					await tick();
					return state
						.moveTo(
							getPositionFromDistance(
								{ x: $PlayerState.position.x - 100, z: $PlayerState.position.z - 100 },
								$state.position
							)
						)
						.finally(() => (busy = false));
				} else if (distance >= 125 && distance < 720 && Math.random() > 0.3) {
					audioManager.play("shoot");
					previousAnimationState = "attack";
					state.setState("attack");
					await tick();
					busy = false;
					return;
				} else {
					previousAnimationState = "idle";
					state.setState("idle");
				}
			} else {
				previousAnimationState = "idle";
				state.setState("idle");
			}
			busy = false;
		}
	});

	onMount(() => {
		stateLoop.start();
		return () => {
			stateLoop.stop();
		};
	});
	$: $state && $state.state === "dead" && stateLoop.stop();
</script>

<div
	on:animationstart={() => {
		if ($state.state === "hurt" && previousAnimationState !== "hurt") {
			previousAnimationState = "hurt";
			// busy = true;
		}
	}}
	on:animationend={() => {
		if (previousAnimationState === "hurt") {
			busy = false;
		}
	}}
	class="sprite enemy guard {$state.state}"
	style="transform: translate3d({$tween.x}px, -50%, {$tween.z}px) rotateY({-$PlayerState.rotation
		.y}deg);"
/>

<style lang="scss">
	.sprites {
		transform-style: preserve-3d;
	}
	.sprite {
		position: absolute;

		backface-visibility: hidden;
		// transform: translateY(-50%);
		// image-rendering: crisp-edges;
		top: 0%;
		// bottom: 0;
		top: 0;
		background-repeat: no-repeat !important;
	}
	.sprite.enemy.guard {
		height: 100px;
		width: 75px;
		background: url(./guard.png) left center;
		background-size: 1262.5px;
		image-rendering: pixelated;
		// background-origin: center;
		&.idle {
			background-position-x: 0px;
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
			background-position: 84%;
			animation: dead steps(1) 1s;
			// background-color: red;
			// animation-delay: 1000ms;
			@keyframes dead {
				0% {
					background-position: 42%;
				}
				20% {
					background-position: 50%;
				}
				40% {
					background-position: 59%;
				}

				60% {
					background-position: 68%;
				}
			}
		}

		&.hurt {
			animation: hurt steps(1) 0.1s;
			background-position: 74%;
			@keyframes hurt {
				50% {
					background-position: 74% !important;
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
