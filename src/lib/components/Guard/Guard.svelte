<svelte:options
	accessors={true}
	immutable={true}
/>

<script
	lang="ts"
	context="module"
>
	const distanceToPosition = (a: Position2D, b: Position2D) => {
		const distance = getDistanceFromPoints(a, { x: b.x, z: b.z });

		const { x, z } = getLocalPositionFromRealPosition({
			x: b.x - distance,
			z: b.z - distance
		});
		return [x, z] as const;
	};

	function getPositionFromDistance(a: Position2D, b: Position2D) {
		const [x, y] = distanceToPosition(b, {
			...a,
			x: -a.x,
			z: -a.z
		});
		const moveTo = { x: 1 - (a.x + b.x + x), z: 1 - (a.z + b.z + y) };

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
	import { CurrentLevel } from "../Level.svelte";
	import { testLineOfSight } from "../Player.svelte";
	import { rand } from "$lib/utils/engine";

	export let item: MapItem;
	export let offset: number;
	export let section: number;

	const position = getRealPositionFromLocalPosition({ x: offset, z: section });

	const state = enemyState({
		position: { x: -position.x, z: -position.z },
		state: "idle"
	});
	const tween = state.tween;
	const audioManager = new AudioManager({
		halt: new URL(HaltSound, import.meta.url).toString(),
		shoot: new URL(ShootSound, import.meta.url).toString()
	});

	let isVisible = false;
	$: if ($state && !isVisible) $state.rotation.y = $PlayerState.rotation.y;
	export const setState = state.setState;

	export const getPosition = () => $tween;
	export const getState = () => $state.state;

	export const getVisibility = () => isVisible;
	export const setVisibility = (state: boolean) => (isVisible = state);
	export const getLocalPosition = (): Position2D => ({
		x: offset,
		z: section
	});

	export const takeDamage = async () => {
		await state.giveDamage();
		if ($state.health <= 0) {
			tween.cancel();
			stateLoop.stop();
			state.setState("dead");
		}
	};
	let previousAnimationState: typeof $state.state;

	let startFrame: number;
	let busy = false;

	let playerLastSeenAt: number;
	let playerJustSeen = false;
	$: if ($state.state === "dead") stateLoop.stop();

	const stateLoop = frameLoop.add(async (now) => {
		if (isVisible) return;
		if ($state.state === "dead") return;
		if (!startFrame) startFrame = now;
		if (busy) return;
		const elapsed = now - startFrame;

		if (elapsed > 225 + Math.abs(~~(rand.nextInt() / 0xfef0b))) {
			if (busy) return;

			busy = true;
			startFrame = now;

			const distance = getDistanceFromPoints(
				{ x: 1 - $PlayerState.position.x, z: 1 - $PlayerState.position.z },
				$state.position
			);

			const seen = isVisibleToPlayer(getPosition(), 45);
			const playerPosition = getLocalPositionFromRealPosition({
				x: 1 - $PlayerState.position.x,
				z: 1 - $PlayerState.position.z
			});
			const ourPosition = getLocalPositionFromRealPosition(getPosition());
			if (testLineOfSight($CurrentLevel, ourPosition, playerPosition) && seen && distance < 1000) {
				if (!playerJustSeen) {
					playerJustSeen = true;
					audioManager.play("halt");
				}

				if (distance >= 55 && distance < 680 && Math.random() < 0.6) {
					await tween.cancel();

					audioManager.play("shoot");
					previousAnimationState = "attack";
					state.setState("attack");
					await tick();
					busy = false;
				} else if (distance > 64 && distance < 750) {
					previousAnimationState = "walk";
					return state
						.moveTo(
							getPositionFromDistance(
								{ x: $PlayerState.position.x - 100, z: $PlayerState.position.z - 100 },
								$state.position
							)
						)
						.finally(() => {
							busy = false;
						});
				} else {
					// if (distance > 1000) playerJustSeen = false;
					state.setState("idle");
					busy = false;
				}
			} else {
				// if (distance > 1000) playerJustSeen = false;
				previousAnimationState = "idle";
				state.setState("idle");
				busy = false;
			}
		}
		busy = false;
	}, true);

	onMount(() => {
		stateLoop.start();
		return () => {
			stateLoop.stop();
		};
	});
</script>

<div
	on:animationstart={() => {
		if ($state.state === "hurt" && previousAnimationState !== "hurt") {
			previousAnimationState = "hurt";
		}
	}}
	on:animationend={() => {
		busy = false;
	}}
	class="sprite enemy guard {$state.state} {isVisible ? 'hidden' : ''}"
	style="transform: translate3d({$tween.x}px, -50%, {$tween.z}px) rotateY({-$PlayerState.rotation
		.y}deg);"
/>

<style lang="scss">
	.sprite {
		top: 0%;
		position: absolute;

		backface-visibility: hidden;
		background-repeat: no-repeat !important;
	}
	.sprite.enemy.guard {
		height: 64px;
		width: 64px;
		background: url(./guard.png);
		background-size: 832px;
		image-rendering: pixelated;

		will-change: transform;
		&.idle {
			background-position-x: 0px;
		}
		&.walk {
			animation: walk 1.1s steps(1) infinite;
			@keyframes walk {
				0% {
					background-position-x: -64px;
				}
				25% {
					background-position: -128px;
				}
				50% {
					background-position: -192px;
				}
				75% {
					background-position: -256px;
				}
			}
		}
		&.dead {
			background-position: 84%;
			animation: dead steps(1) 1s;

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
			animation: hurt steps(1) 75ms;
			background-position: -576px;
			@keyframes hurt {
				50% {
					background-position: -576px;
				}
			}
		}
		&.attack {
			animation: attack 1.1s steps(1);
			@keyframes attack {
				0% {
					background-position: -704px;
				}
				50% {
					background-position: -768px;
				}
			}
		}
	}
</style>
