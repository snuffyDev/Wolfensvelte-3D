<svelte:options accessors={true} />

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
		getDistanceFromPoints,
		getLocalPositionFromRealPosition,
		getRealPositionFromLocalPosition
	} from "$lib/utils/position";
	import { frameLoop } from "$lib/utils/raf";
	import { onMount, tick } from "svelte";
	import type { ExtendedEntity, MapItem, WallFace } from "../../types/core";
	import { isVisibleToPlayer } from "../../utils/angle";
	import { enemyState } from "./state";
	import HaltSound from "$lib/sounds/guard/halt.WAV?url";
	import ShootSound from "$lib/sounds/guard/shoot.WAV?url";
	import Death1Sound from "$lib/sounds/guard/death_1.WAV?url";
	import Death2Sound from "$lib/sounds/guard/death_2.WAV?url";
	import Death3Sound from "$lib/sounds/guard/death_3.WAV?url";
	import { AudioManager } from "$lib/helpers/audio";
	import { CurrentLevel } from "../Level.svelte";
	import { testLineOfSight } from "../Player.svelte";
	import { rand } from "$lib/utils/engine";
	import { WALL_FACES } from "$lib/utils/validation";

	export let item: ExtendedEntity;
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
		shoot: new URL(ShootSound, import.meta.url).toString(),
		death_1: new URL(Death1Sound, import.meta.url).toString(),
		death_2: new URL(Death2Sound, import.meta.url).toString(),
		death_3: new URL(Death3Sound, import.meta.url).toString()
	});

	let isVisible = false;

	export const setState = state.setState;

	export const getPosition = () => $tween;
	export const getState = () => $state.state;

	export const getVisibility = () => isVisible;
	export const setVisibility = (state: boolean) => (isVisible = state);
	export const getLocalPosition = (): Position2D => getLocalPositionFromRealPosition($tween);

	export const takeDamage = async () => {
		await state.giveDamage();
		if ($state.health <= 0) {
			tween.cancel();
			stateLoop.stop();
			audioManager.play(
				`death_${Math.max(1, Math.min(3, Math.floor(Math.random() * 4))) as 1 | 2 | 3}`
			);
			state.setState("dead");
		}
	};
	let previousAnimationState: typeof $state.state;

	let startFrame: number;
	let busy = false;

	let playerLastSeenAt: number;
	let playerJustSeen = false;
	$: if (previousAnimationState !== "dead" && $state.state === "dead") {
		previousAnimationState = "dead";
		const findEmptyTile = (direction: WallFace) => {
			let toPosition: Position2D = getLocalPosition() as Position2D;

			switch (direction) {
				case "left":
					toPosition = { ...toPosition, x: toPosition.x + 1 };
					break;
				case "right":
					toPosition = { ...toPosition, x: toPosition.x - 1 };
					break;
				case "back":
					toPosition = { ...toPosition, z: toPosition.z + 1 };
					break;
				case "front":
					toPosition = { ...toPosition, z: toPosition.z - 1 };
					break;
				default:
					break;
			}
			return [CurrentLevel.checkCollisionWithWorld(toPosition), toPosition] as const;
		};

		const [, p] = WALL_FACES.map(findEmptyTile)
			.filter(([v]) => !v)
			.shift()!;

		CurrentLevel.updateTileAt(p.z, p.x, {
			...$CurrentLevel[p.z][p.x],
			model: { component: "Object", texture: 143 }
		});

		stateLoop.stop();
	}

	const stateLoop = frameLoop.add(async (now) => {
		if (isVisible) return;
		if ($state.state === "dead") {
			return;
		}
		if (!startFrame) startFrame = now;
		const elapsed = now - startFrame;

		if (!busy && elapsed > 400 + rand.nextByte()) {
			startFrame = now;

			const distance = getDistanceFromPoints(
				{ x: 1 - $PlayerState.position.x, z: 1 - $PlayerState.position.z },
				$state.position
			);

			const seen = isVisibleToPlayer(getPosition(), 45);
			const playerPosition = getLocalPositionFromRealPosition({
				x: -$PlayerState.position.x,
				z: -$PlayerState.position.z
			});
			const ourPosition = getLocalPositionFromRealPosition(getPosition());
			if (testLineOfSight($CurrentLevel, ourPosition, playerPosition) && distance < 1000) {
				busy = true;
				if (!playerJustSeen) {
					playerJustSeen = true;
					audioManager.play("halt");
				}

				if (distance >= 55 && distance < 680 && Math.random() < 0.6) {
					audioManager.play("shoot");
					tween.cancel();

					previousAnimationState = "attack";
					state.setState("attack").then(() => {
						busy = false;
					});
				} else if (distance > 74 && distance < 750) {
					previousAnimationState = "walk";
					state
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
				}
			} else {
				// if (distance > 1000) playerJustSeen = false;
				busy = false;
				previousAnimationState = "idle";
				state.setState("idle");
			}
		}
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
			tween.cancel();
			previousAnimationState = "hurt";
		}
	}}
	on:animationend={() => {
		if (previousAnimationState === "hurt") {
			busy = false;
		}
	}}
	class="sprite enemy guard {$state.state} {isVisible ? 'hidden' : ''}"
	style="transform: translate3d({$tween.x}px, -50%, {$tween.z}px) rotateY({-$playerRotation}deg);"
/>

<style lang="scss">
	.sprite {
		top: 0%;
		position: absolute;

		backface-visibility: hidden;
		background-repeat: no-repeat !important;
		height: 64px;
		width: 64px;
	}
	.ammo {
		background: url(./../../textures/143.png) 100%;
		width: 64px;
		height: 64px;
		z-index: 500;
	}
	.sprite.enemy.guard {
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
			animation: hurt steps(1) 1s;
			background-position: -576px;
			@keyframes hurt {
				50% {
					background-position: -576px;
				}
			}
		}
		&.attack {
			animation: attack 1.1s steps(1) infinite;
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
