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
	type Deferred = { promise: Promise<void>; resolve: () => void };
	const deferred = () => {
		const d: Deferred = {} as Deferred;
		d.promise = new Promise((resolve) => {
			d.resolve = resolve;
		});
		return d;
	};

	const rand = rng();
	rand.init(true);

	const distanceToPosition = (a: Position2D, b: Position2D) => {
		const distance = getDistanceFromPoints(a, b);

		const { x, z } = getLocalPositionFromRealPosition({ x: a.x + distance, z: a.z + distance });

		return [x, z] as const;
	};
	const getPathToPlayerPosition = (
		ourTarget: ReturnType<typeof AIBaseStore>,
		ourTween: Tweened<Position2D>
	) => {
		let running = false;
		return async (playerPosition: Position2D, ourPosition: Position2D) => {
			// if (running) return;
			// running = true;
			const distance = getDistanceFromPoints(playerPosition, {
				...ourPosition,
				x: -ourPosition.x,
				z: -ourPosition.z
			});

			// if (playerPostiion.x > ourPosition.x) {
			// console.warn(playerPosition.x, ourPosition.x, get(ourTarget), distance);
			// ourPosition;
			// ourTarget.rotate("");
			let idx = 0;
			const [x, y] = distanceToPosition(playerPosition, {
				...ourPosition,
				x: -ourPosition.x,
				z: -ourPosition.z
			});
			// console.warn({ x, y });
			const moveTo = {
				x: -1 * (rand.rnd() / 2.5 + ourPosition.x + playerPosition.x - x),
				z: -1 * (rand.rnd() / 2.5 + ourPosition.z + playerPosition.z - y)
			};
			const defer = deferred();
			// if (-playerPosition.x < ourPosition.x) {
			// 	console.error("NICE");
			// } else {
			// 	ourTarget.moveTo({
			// 		x: 1 + distance * 0.01,
			// 		z: (-playerPosition.z < ourPosition.z ? -1 : 1) + distance / 100
			// 	});
			// }

			// ourTarget.moveForward()

			ourTarget.moveTo(moveTo);
			const result = ourTarget.get().position;
			ourTween
				.update((t) => ({ x: t.x, z: t.z }), { duration: 0 })
				.then(() => {
					defer.resolve();
					ourTween.set({ x: result.x, z: result.z }, { duration: distance * 5 });
					// const result = ourTarget.get().position;
				});
			defer.promise.finally(() => {
				running = false;
			});
		};
	};
</script>

<script lang="ts">
	import { AIBaseStore, PlayerState } from "$lib/stores/player";
	import type { Position, Position2D } from "$lib/types/position";
	import {
		getDistanceFromPoints,
		getLocalPositionFromRealPosition,
		getRealPositionFromLocalPosition
	} from "$lib/utils/position";
	import { frameLoop } from "$lib/utils/raf";
	import { onMount } from "svelte";
	import { tweened, type Tweened } from "svelte/motion";
	import { get } from "svelte/store";
	import type { MapItem } from "../../types/core";

	export let item: MapItem;
	export let offset: number;
	export let section: number;
	let state: "attack" | "walk" | "default" | "dead" = "default";

	export const getPosition = () => $self.position;
	export const setState = (targetState: "dead") => (state = targetState);
	export const getState = () => state;

	let timeout: NodeJS.Timeout;
	let isTargetingPlayer = false;

	const position = getRealPositionFromLocalPosition({ x: offset, z: section });
	const self = AIBaseStore();

	const tPosition = tweened<typeof position>(
		{ x: -position.x, y: 0, z: -position.z },
		{ duration: 1726, delay: 0 }
	);
	$self.position = { ...$tPosition, y: 0 };
	$: $self.rotation.y = $PlayerState.rotation.y - 90;
	const pathFinder = getPathToPlayerPosition(self, tPosition);

	let start: number;
	let running = false;

	const queue = async (task: Deferred) => {
		if (running) return;
		running = true;
		await task.promise.then(() => {
			running = false;
		});
	};

	const loop = frameLoop.add(async () => {
		const distance = getDistanceFromPoints($self.position, {
			x: -$PlayerState.position.x,
			y: 0,
			z: -$PlayerState.position.z
		});

		if (distance < 475) {
			if (state === "dead") return;
			if (running) return;
			running = true;
			const task = deferred();
			isTargetingPlayer = true;
			const random = rand.rnd() / 4;
			console.log(random);
			if (distance <= 335 && Math.random() < 0.5) {
				state = "walk";
				pathFinder($PlayerState.position, $self.position)
					.then(task.resolve)
					.then(() => console.log($self.position))
					.then(() => (running = false));
			} else {
				state = "attack";
				// rotation = -$PlayerState.rotation.y!;
				console.log($self.position);

				PlayerState.takeDamage("gun");
				new Promise((resolve) => {
					setTimeout(() => {
						resolve();
					}, 1000);
				}).then(() => {
					running = false;
				});
			}
			// running = false;
			isTargetingPlayer = false;
		}
	});

	onMount(() => {
		let count = 0;
		timeout = setInterval(() => {
			if (state === "dead") {
				clearInterval(timeout);
				state === "dead";
				return;
			}
			if (isTargetingPlayer) return;
			state = Math.random() < 0.5 ? "default" : "walk";
			if (state === "walk") {
				// count += 1;
				// if (count % 2)
				// 	tPosition.set({
				// 		...$tPosition,
				// 		x: $tPosition.x > $PlayerState.position.x ? $tPosition.x + 62 : $tPosition.x + 151,
				// 		z: $tPosition.z < $PlayerState.position.z ? $tPosition.z + 14 : $tPosition.z + 86
				// 	});
				// else
				// 	tPosition.set({
				// 		...$tPosition,
				// 		x: $tPosition.x > $PlayerState.position.x ? $tPosition.x + 165 : $tPosition.x - 29,
				// 		z: $tPosition.z > $PlayerState.position.z ? $tPosition.z - 21 : $tPosition.z + 99
				// 	});
			} else {
			}
		}, 1500);

		loop.start();
		return () => {
			clearTimeout(timeout);
			loop.stop();
		};
	});
	$: state === "dead" && loop.stop();
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
		&.default {
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
