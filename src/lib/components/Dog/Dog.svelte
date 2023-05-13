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
	import { PlayerState, playerRotation } from "$lib/stores/player";
	import type { Position2D } from "$lib/types/position";
	import {
		comparePositions,
		diffPositions,
		getDistanceFromPoints,
		getLocalPositionFromRealPosition,
		getRealPositionFromLocalPosition
	} from "$lib/utils/position";
	import { frameLoop } from "$lib/utils/raf";
	import { getContext, onMount, tick } from "svelte";
	import type { ExtendedEntity } from "../../types/core";
	import BarkSound from "$lib/sounds/dog/bark.WAV?url";
	import DeathSound from "$lib/sounds/dog/death.WAV?url";
	import { AudioManager } from "$lib/helpers/audio";
	import { CurrentLevel } from "../Level.svelte";
	import { testLineOfSight } from "../Player.svelte";
	import { rand } from "$lib/utils/engine";
	import { dogState } from "./state";
	import { ctxKey, type WSContext } from "../../../routes/key";

	export let item: ExtendedEntity;
	export let offset: number;
	export let section: number;

	const position = getRealPositionFromLocalPosition({ x: offset, z: section });

	const { isLoadingNextLevel } = getContext(ctxKey) as WSContext;

	const state = dogState({
		position: { x: -position.x, z: -position.z },
		state: "idle"
	});

	const audioManager = new AudioManager({
		bark: new URL(BarkSound, import.meta.url).toString(),
		death: new URL(DeathSound, import.meta.url).toString()
	});

	let isVisible = false;
	let hasTakenDamage = false;

	const tween = state.tween;

	export const getPosition = () => $tween;
	export const getLocalPosition = () => ({ x: offset, z: section });

	export const setState = state.setState;
	export const getState = () => $state.state;

	export const getVisibility = () => isVisible;
	export const setVisibility = (state: boolean) => (isVisible = state);

	export const takeDamage = async () => {
		await state.giveDamage();
		if ($state.health <= 0) {
			tween.cancel();
			stateLoop.abort();
			audioManager.play("death");
			state.setState("dead");
		}
	};
	let previousAnimationState: typeof $state.state;

	$: if ($state) $state.rotation.y = $playerRotation;

	let startFrame: number;
	let busy = false;

	let playerLastSeenAt: number;
	let playerJustSeen = false;

	const stateLoop = frameLoop((now) => {
		if ($isLoadingNextLevel) return true;
		if ($state.state === "dead") {
			return true;
		}
		if (!startFrame) startFrame = now;
		const elapsed = now - startFrame;

		if (elapsed > 211 + rand.nextInt(129, 188)) {
			if (busy) return true;
			startFrame = now;

			const distance = getDistanceFromPoints(
				{ x: 1 - $PlayerState.position.x, z: 1 - $PlayerState.position.z },
				$state.position
			);

			const playerPosition = getLocalPositionFromRealPosition({
				x: -$PlayerState.position.x,
				z: -$PlayerState.position.z
			});
			const ourPosition = getLocalPositionFromRealPosition(getPosition());
			if (testLineOfSight($CurrentLevel, ourPosition, playerPosition) && distance < 1500) {
				if (!playerJustSeen) {
					playerJustSeen = true;
					audioManager.play("bark");
				}
				const r = rand.nextInt(0, 10);
				console.log(r);
				if ((distance >= 55 && distance < 128 && !(r % 5)) || hasTakenDamage) {
					if (busy) return true;
					if (!busy) busy = true;
					tick().then(() => {
						audioManager.play("bark");
						tween.cancel();

						previousAnimationState = "attack";
						state.setState("attack");
						busy = false;
					});
				} else if (distance > 74) {
					if (busy) return true;
					if (!busy) busy = true;
					previousAnimationState = "walk";
					state.setState("walk");
					const posDiff = diffPositions($PlayerState.position, ourPosition);
					const posCmp = comparePositions($PlayerState.position, ourPosition);
					state
						.moveTo(
							getPositionFromDistance(
								{
									x: posCmp.x === 0 ? 0 : $PlayerState.position.x + (posDiff.x < 0 ? -32 : 32),
									z: posCmp.z === 0 ? 0 : $PlayerState.position.z + (posDiff.z < 0 ? -32 : 32)
								},
								$state.position
							)
						)
						.finally(() => {
							busy = false;
						});
				} else {
					if (distance > 1000) playerJustSeen = false;
					// busy = false;
					state.setState("idle");
				}
			} else {
				if (distance > 1000) playerJustSeen = false;
				if (!busy) {
					previousAnimationState = "idle";
					state.setState("idle");
				}
			}
			return true;
		}
	});
	onMount(() => {
		return () => {
			stateLoop.abort();
		};
	});

	$: if ($state.state === "dead") stateLoop.abort();
</script>

<div
	on:animationstart={() => {
		if ($state.state === "hurt" && previousAnimationState !== "hurt") {
			tween.cancel();
			previousAnimationState = "hurt";
		}
	}}
	on:animationend={() => {
		if (previousAnimationState === "hurt") {
			busy = false;
		}
	}}
	class="sprite dog {$state.state}"
	style="transform: translate3d({$tween.x}px, -50%, {$tween.z}px) rotateY({-$playerRotation}deg);"
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
			animation: hurtAnimation 0.4s steps(1);
		}

		&.walk {
			animation: runAnimation 0.625s steps(1) infinite;
		}
	}
</style>
