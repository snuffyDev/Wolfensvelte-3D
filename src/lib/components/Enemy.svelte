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
	import type { ExtendedEntity, ExtendedEntityV2, WallFace } from "$lib/types/core";

	import { enemyState } from "./Guard/state";

	import { AIAudioManager } from "$lib/helpers/audio";
	import { CurrentLevel } from "./Level.svelte";
	import { testLineOfSight2 } from "./Player.svelte";
	import { ItemPickups, rand } from "$lib/utils/engine";
	import { WALL_FACES } from "$lib/utils/validation";
	import { ctxKey, type WSContext } from "../../routes/key";
	import { ENEMY_INIT } from "$lib/core/ai";
	import { findPath } from "$lib/helpers/ai";
	import { LevelStatManager } from "$lib/stores/stats";

	const { isLoadingNextLevel } = getContext(ctxKey) as WSContext;

	export let item: ExtendedEntityV2;
	export let offset: number;
	export let section: number;

	const position = getRealPositionFromLocalPosition({ x: offset, z: section });

	const state = enemyState(
		{
			position: { x: -position.x, z: -position.z },
			state: "idle"
		},
		ENEMY_INIT[item.component! as keyof typeof ENEMY_INIT]
	);
	const tween = state.tween;

	const behavior = ENEMY_INIT[item.component as keyof typeof ENEMY_INIT];

	const audioManager = new AIAudioManager<Record<string, string>>(behavior.sounds!);

	let isVisible = false;
	let hasTakenDamage = false;
	let willChange: string | false = false;
	let canPatrol = Math.random() > 0.3;
	export const setState = state.setState;

	export const getPosition = () => $tween;
	export const getState = () => $state.state;

	export const getVisibility = () => isVisible;
	export const setVisibility = (visible: boolean) => {
		willChange = "visibility, transform";
		return () => {
			isVisible = visible;
		};
	};
	export const getLocalPosition = (): Position2D => getLocalPositionFromRealPosition($tween);
	export const type = "enemy";

	export const takeDamage = async (amount?: number) => {
		hasTakenDamage = true;
		await state.giveDamage(amount);
		busy = false;
		setTimeout(() => {
			hasTakenDamage = false;
		}, 125);
		if ($state.health <= 0) {
			tween.cancel();
			stateLoop.abort();
			try {
				audioManager.play(
					`death_${Math.max(1, Math.min(3, Math.floor(Math.random() * 4))) as 1 | 2 | 3}`
				);
			} catch {
				audioManager.play("death");
			}

			state.setState("dead");
			LevelStatManager.add('kills');
		}
	};
	let previousAnimationState: typeof $state.state;

	let startFrame: number;
	let busy = false;

	let playerLastSeenAt: number;
	let playerJustSeen = false;

	const findEmptyTile = (direction: WallFace, amount = 1) => {
		let toPosition: Position2D = getLocalPosition() as Position2D;

		switch (direction) {
			case "left":
				toPosition = { ...toPosition, x: toPosition.x + amount };
				break;
			case "right":
				toPosition = { ...toPosition, x: toPosition.x - amount };
				break;
			case "back":
				toPosition = { ...toPosition, z: toPosition.z + amount };
				break;
			case "front":
				toPosition = { ...toPosition, z: toPosition.z - amount };
				break;
			default:
				break;
		}
		return [CurrentLevel.checkCollisionWithWorld(toPosition, null), toPosition] as const;
	};
	let timeSinceLastPatrol = 0;
	let startPatrolTime = 0;
	const stateLoop = frameLoop(async (now) => {
		if ($isLoadingNextLevel) return true;
		if ($state.state === "dead") {
			return false;
		}
		if (!startFrame) startFrame = now;
		const elapsed = now - startFrame;

		if (elapsed > behavior.reactionTime + rand.nextInt(162, 231)) {
			startFrame = now;

			const distance = getDistanceFromPoints(
				{ x: -$PlayerState.position.x, z: -$PlayerState.position.z },
				$state.position
			);

			const playerPosition = getLocalPositionFromRealPosition({
				x: -$PlayerState.position.x,
				z: -$PlayerState.position.z
			});
			const ourPosition = getLocalPositionFromRealPosition(getPosition());
			const [min, preferred, max] = behavior.attackDistance;
			const hasLineOfSight = testLineOfSight2($CurrentLevel, ourPosition, playerPosition);
			if (hasLineOfSight && distance < 800) {
				if (!playerJustSeen) {
					playerJustSeen = true;
					audioManager.play("playerSeen");
				}
				const r = rand.nextInt(distance / 2.25, max);

				if (
					(distance >= min &&
						(item.component === "Dog"
							? distance <= max
							: preferred(distance) < max * Math.random()) &&
						r % 3) ||
					hasTakenDamage
				) {
					if (busy) return true;
					if (!busy) busy = true;
					await tick().then(() => {
						audioManager.play("attack");
						tween.cancel();

						previousAnimationState = "attack";
						state.setState("attack");
						busy = false;
					});
				} else if (distance > min) {
					if (busy) return true;
					if (!busy) busy = true;
					previousAnimationState = "walk";
					state.setState("walk");
					const posDiff = diffPositions($PlayerState.position, ourPosition);
					const posCmp = comparePositions($PlayerState.position, ourPosition);
					await state
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

					state.setState("idle");
				}
			} else {
				if (canPatrol && !busy && $state.state === "idle") {
					const timeSinceLastPatrol = now - startPatrolTime;
					// previousAnimationState = "idle";

					if (timeSinceLastPatrol > Math.min(3200, Math.max(100, (rand.nextByte() * 512) / 4))) {
						startPatrolTime = now;
						busy = true;
						state.setState("walk");
						previousAnimationState = "idle";
						console.log("WALKING!");

						const directions = [...Array(4).keys()].map((i) => WALL_FACES[rand.nextInt(0, 8) % 4]);
						const res = [[true, getLocalPosition()] as const];
						for (let idx = 0; idx < directions.length; idx++) {
							const dir = directions[idx];
							if (item.component === "Guard") {
								const [canMove, pos] = findEmptyTile(dir, ~~rand.nextInt(1, 8));
								if (canMove) {
									res.push([canMove, pos] as const);
								}
							}
						}
						const [, goToPosition] = res.reduce((acc, curr) => {
							if (!curr[0]) return acc;
							const [, accPosition] = acc;
							const [, currPosition] = curr;

							const diff = comparePositions(currPosition, accPosition);
							acc[1].x += diff.x;
							acc[1].z += diff.z;
							return acc;
						});

						await Promise.race([
							new Promise((r) => setTimeout(r, 5000)),
							state.moveTo(getRealPositionFromLocalPosition(goToPosition))
						]);
						busy = false;
						previousAnimationState = "idle";
						state.setState("idle");
					}
				}
				playerJustSeen = false;
				previousAnimationState = "idle";
				state.setState("idle");
			}
		}
		return true;
	});
	$: if (previousAnimationState !== "dead" && $state.state === "dead") {
		stateLoop.abort();
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
			return [CurrentLevel.checkCollisionWithWorld(toPosition, null), toPosition] as const;
		};

		const [, p] = WALL_FACES.map(findEmptyTile)
			.filter(([v]) => !v)
			.shift()!;

		if (behavior.dropOnDeath) {
			CurrentLevel.updateTileAt(p.z, p.x, {
				...$CurrentLevel[p.z][p.x],
				...{
					component: "Object",
					blocking: false,
					texture: ItemPickups[behavior.dropOnDeath],
					attributes: { collectable: true }
				}
			});
		}

		stateLoop.abort();
	}
	onMount(() => {
		return () => {
			stateLoop.abort();
		};
	});
</script>

<!-- {#if isVisible} -->
<div
	on:animationstart={() => {
		if ($state.state === "hurt" && previousAnimationState !== "hurt") {
			busy = true;
			tween.cancel();
			previousAnimationState = "hurt";
		}
	}}
	on:animationend={() => {
		if (previousAnimationState === "hurt") {
			busy = false;
		}
	}}
	class="{willChange
		? `will-change: ${willChange};`
		: ''} sprite enemy {item.component.toLocaleLowerCase()} {$state.state} {!isVisible
		? 'hidden'
		: ''}"
	style="transform: translate3d({$tween.x}px, -50%, {$tween.z}px) rotateY({-$playerRotation}deg);"
/>

<style lang="scss">
	.sprite {
		top: 0%;
		position: absolute;
		will-change: transform;

		backface-visibility: hidden;
		background-repeat: no-repeat !important;
		height: 64px;
		width: 64px;
		transform-style: preserve-3d;

		background-image: var(--img);
		background-size: 64px;
		background-position: top left;
		image-rendering: pixelated;
		contain: strict;
	}
	.ammo {
		background: url(./../textures/143.png) 100%;
		width: 64px;
		height: 64px;
		z-index: 500;
	}
	.guard {
		background: url(./Guard/guard.png);
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
			animation: dead steps(1) 0.666s;

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
			animation: hurt steps(1) 0.666s;
			// background-position: -576px;
			@keyframes hurt {
				50% {
					background-position: -576px;
				}
			}
		}
		&.attack {
			animation: attack 0.666s steps(1) infinite;
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

	.dog {
		width: 64px;
		height: 64px;
		image-rendering: pixelated;
		background: url(./../sprites/guard_dog/spritesheet.png) no-repeat;
		background-size: 192px;

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

		@keyframes hurtAnimation {
			0% {
				background-position: -64px -128px;
			}
			100% {
				background-position: -128px -0px;
			}
		}

		&.idle {
			background-position: -0px -192px;
		}
		&.attack {
			animation: attackAnimation 0.6s steps(1);
		}

		&.dead {
			animation: dogDeadAnimation 0.675s steps(1);
			background-position: -0px -128px;

			@keyframes dogDeadAnimation {
				5% {
					background-position: -64px -128px;
				}
				25% {
					background-position: -128px -0px;
				}
				50% {
					background-position: -64px -64px;
				}
				75% {
					background-position: -0px -128px;
				}
				100% {
					background-position: -0px -128px;
				}
			}
		}

		&.hurt {
			animation: hurtAnimation 0.4s steps(1);
		}

		&.walk {
			animation: dogRunAnimation 0.625s steps(1) infinite;
			@keyframes dogRunAnimation {
				0% {
					background-position: -0px -192px;
				}
				25% {
					background-position: -64px -192px;
				}
				50% {
					background-position: -128px -64px;
				}
				75% {
					background-position: -128px -128px;
				}
			}
		}
	}

	.ss {
		position: absolute;
		width: 64px;
		height: 64px;
		background-size: 192px;
		inset: 0;
		background-repeat: no-repeat;

		background-image: url(./SS/ss.png);

		&.idle {
			background-position: 0px;
		}
		// background-position: -128px;

		&.idle {
			background-position: -0px -0px;
		}
		&.attack {
			animation: attackAnimation 0.666s steps(1);
			background-position: -64px -128px;
		}

		&.dead {
			background-position: -128px -128px;

			animation: deadAnimation 0.666s steps(1);
		}

		&.hurt {
			animation: hurtAnimation 0.8s steps(1) infinite;
		}

		&.walk {
			animation: runAnimation 1s steps(1) infinite;
		}

		@keyframes runAnimation {
			0% {
				background-position: -0px -64px;
			}
			25% {
				background-position: -0px -128px;
			}
			50% {
				background-position: -64px -0px;
			}

			75% {
				background-position: -0px -128px;
			}
		}

		@keyframes hurtAnimation {
			25% {
				background-position: -128px -192px;
			}
			50% {
				background-position: -64px -64px;
			}
		}

		@keyframes attackAnimation {
			0% {
				background-position: -64px -0px;
			}
			99% {
				background-position: -64px -128px;
			}
		}

		@keyframes deadAnimation {
			20% {
				// background-color: blue;
				background-position: -64px -192px;
			}
			25% {
				// background-color: transparent;
				background-position: -128px -0x;
			}
			50% {
				// background-color: red;
				background-position: -128px -64px;
			}
			90% {
				// background-color: blue;
				background-position: -128px -128px;
			}
		}
	}
</style>
