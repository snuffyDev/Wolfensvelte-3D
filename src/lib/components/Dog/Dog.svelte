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
	import BarkSound from "$lib/sounds/dog.WAV?url";
	import { AudioManager } from "$lib/helpers/audio";
	import { CurrentLevel } from "../Level.svelte";
	import { testLineOfSight } from "../Player.svelte";
	import { rand } from "$lib/utils/engine";
	import { dogState } from "./state";

	export let item: MapItem;
	export let offset: number;
	export let section: number;

	const position = getRealPositionFromLocalPosition({ x: offset, z: section });

	const state = dogState({
		position: { x: -position.x, z: -position.z },
		state: "idle"
	});

	const audioManager = new AudioManager({
		bark: new URL(BarkSound, import.meta.url).toString()
	});

	let isVisible = false;

	const tween = state.tween;

	export const getPosition = () => $tween;
	export const setState = state.setState;
	export const getState = () => $state.state;

	export const getVisibility = () => isVisible;
	export const setVisibility = (state: boolean) => (isVisible = state);

	export const takeDamage = async () => {
		await state.giveDamage();
		if ($state.health <= 0) {
			tween.cancel();
			stateLoop.stop();
			state.setState("dead");
		}
	};
	let previousAnimationState: typeof $state.state;

	$: if ($state) $state.rotation.y = $PlayerState.rotation.y;

	let startFrame: number;
	let busy = false;

	let playerLastSeenAt: number;
	let playerJustSeen = false;
	const stateLoop = frameLoop.add(async (now) => {
		if (isVisible) return;
		if (!startFrame) startFrame = now;
		if (busy) return;
		if ($state.state === "dead") return;
		const elapsed = now - startFrame;

		if (elapsed > 150 + Math.abs(~~(rand.nextInt() / 0xfef0b))) {
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
					audioManager.play("bark");
				}

				if (distance > 64 && distance < 850 && Math.abs(Math.random()) > 0.85) {
					await tick();
					previousAnimationState = "walk";
					return state
						.moveTo(
							getPositionFromDistance(
								{ x: $PlayerState.position.x, z: $PlayerState.position.z },
								$state.position
							)
						)
						.finally(() => {
							busy = false;
						});
				} else if (distance >= 32 && distance < 150 && Math.random() < 0.6) {
					await tick();
					await tween.cancel();
					previousAnimationState = "attack";
					state.setState("attack");

					// state.setState("attack");
					busy = false;
					// return;
				} else {
					await tick();
					if (distance > 1000) playerJustSeen = false;
					previousAnimationState = "idle";
					state.setState("idle");
				}
			} else {
				await tick();
				if (distance > 1000) playerJustSeen = false;
				previousAnimationState = "idle";
				state.setState("idle");
				busy = false;
			}
			// return;
		}
		busy = false;
	}, true);

	onMount(() => {
		stateLoop.start();
		return () => {
			stateLoop.stop();
		};
	});
	$: if ($state.state === "dead") stateLoop.stop();
</script>

<div
	on:animationstart={() => {
		if ($state.state === "hurt" && previousAnimationState !== "hurt") {
			previousAnimationState = "hurt";
		}
	}}
	on:animationend={() => {
		if (previousAnimationState === "hurt") {
			busy = false;
		}
	}}
	class="sprite dog {$state.state}"
	style="transform: translate3d({$tween.x}px, -50%, {$tween.z}px) rotateY({-$PlayerState.rotation
		.y}deg);"
/>

<style lang="scss">
	@keyframes attackAnimation {
		0% {
			background-position: -0px -64px;
		}
		50% {
			background-position: -0px -0px;
		}
		100% {
			background-position: -64px -0px;
		}
	}

	@keyframes deadAnimation {
		0% {
			background-position: -0px -128px;
		}
		100% {
			background-position: -64px -64px;
		}
	}

	@keyframes hurtAnimation {
		0% {
			background-position: -64px -128px;
		}
		100% {
			background-position: -128px -0px;
		}
	}

	@keyframes runAnimation {
		0% {
			background-position: -128px -64px;
		}
		25% {
			background-position: -128px -128px;
		}
		50% {
			background-position: -0px -192px;
		}
		75% {
			background-position: -64px -192px;
		}
		100% {
			background-position: -128px -64px;
		}
	}

	.sprite {
		top: 0%;
		position: absolute;

		backface-visibility: hidden;
		background-repeat: no-repeat !important;
	}
	.sprite {
		top: 0%;
		position: absolute;

		backface-visibility: hidden;
		background-repeat: no-repeat !important;
	}
	.sprite.dog {
		height: 64px;
		width: 64px;
		background: url(./../../sprites/guard_dog/spritesheet.png) no-repeat;
		background-size: 192px;
		image-rendering: pixelated;
	}
	.dog {
		width: 64px;
		height: 64px;
		// background-size: 192px;
		image-rendering: pixelated;

		&.idle {
			background-position: -0px -192px;
		}
		&.attack {
			animation: attackAnimation 0.6s steps(1) infinite;
		}

		&.dead {
			animation: deadAnimation 1.1s steps(1) infinite;
		}

		&.hurt {
			animation: hurtAnimation 0.6s steps(1) infinite;
		}

		&.walk {
			animation: runAnimation 0.625s steps(1) infinite;
		}
	}
</style>
