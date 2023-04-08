<script
	context="module"
	lang="ts"
>
	export function testLineOfSight(world: World, start: Position2D, end: Position2D): boolean {
		const dx = end.x - start.x;
		const dz = end.z - start.z;
		const distance = Math.sqrt(dx * dx + dz * dz);
		const stepX = dx / distance;
		const stepZ = dz / distance;

		let x = start.x;
		let z = start.z;
		for (let i = 0; i < distance; i++) {
			// Round x and z to the nearest integer to get the coordinates of the tile
			const tileX = Math.round(x);
			const tileZ = Math.round(z);

			// Check if the tile at (tileX, tileZ) contains a MapItem
			if (world[tileZ][tileX].model?.component === "Door" || world[tileZ][tileX].surfaces != null) {
				return false;
			}

			x += stepX;
			z += stepZ;
		}

		return true;
	}
</script>

<script lang="ts">
	import { PlayerState, type PlayerControls } from "$lib/stores/player";
	import { isVisibleToPlayer } from "$lib/utils/angle";
	import { GameObjects } from "$lib/utils/manager";
	import { getDistanceFromPoints, getLocalPositionFromRealPosition } from "$lib/utils/position";
	import { frameLoop } from "$lib/utils/raf";
	import { createEventDispatcher, onDestroy, tick } from "svelte";
	import type Guard from "./Guard/Guard.svelte";
	import { AudioManager } from "$lib/helpers/audio";
	import PistolURL from "$lib/sounds/pistol.WAV?url";
	import type { MapItem, World } from "$lib/types/core";
	import type { Position2D } from "$lib/types/position";
	import { CurrentLevel } from "./Level.svelte";

	const dispatch = createEventDispatcher<{ shoot: void }>();
	let state: "shoot" | "idle" = "idle";
	let buttonsPressed: PlayerControls = {
		w: false,
		shift: false,
		s: false,
		a: false,
		d: false,
		leftarrow: false,
		rightarrow: false
	};
	let x: number = 0;

	const audioManager = new AudioManager({ pistol: new URL(PistolURL, import.meta.url).toString() });

	let cssText = ``;
	const f = frameLoop.add(() => {
		const { x: a, y: b, z: c } = $PlayerState.rotation;

		// if (moving) {
		PlayerState.update(buttonsPressed);
		// }

		cssText = `transform: translate3d(0px, 0px, var(--perspective)) rotateX(${a}deg) rotateY(${b}deg) rotateZ(${c}deg);`;
	});

	f.start();

	onDestroy(() => {
		f.stop();
	});

	async function requestPointerLock(e: MouseEvent) {
		const target = e.target as HTMLElement;
		await target.requestPointerLock();
	}

	async function findClosestEnemy() {
		await tick();
		const { position } = $PlayerState;
		const enemiesInRange: Guard[] = [];

		for (const e of GameObjects.enemies) {
			const distance = getDistanceFromPoints(e?.getPosition(), {
				x: -position.x,
				z: -position.z
			});
			if (isVisibleToPlayer(e?.getPosition(), 30) && distance < 750 && e?.getState() !== "dead") {
				enemiesInRange.push(e);
			}
		}
		audioManager.play("pistol");
		if (!enemiesInRange.length) return;

		const closest = enemiesInRange.sort(
			(a, b) =>
				getDistanceFromPoints(a?.getPosition(), {
					x: -position.x,
					z: -position.z
				}) -
				getDistanceFromPoints(b?.getPosition(), {
					x: -position.x,
					z: -position.z
				})
		);
		const c = [...closest].shift()!;
		// console.log(closest);
		const playerPos = getLocalPositionFromRealPosition({
			x: position.x,
			z: position.z
		});
		const enemPos = getLocalPositionFromRealPosition(c?.getPosition());
		// console.log({ playerPos, enemPos });
		const canShoot = testLineOfSight($CurrentLevel, playerPos, enemPos);
		// console.log(canShoot);
		if (canShoot) {
			await PlayerState.attack(c!);
		}
	}

	function handleMouseMove(node: HTMLElement) {
		function handleMove(event: MouseEvent) {
			x = event.movementX;
			// console.log({ dx, x });
			if (x < -1) {
				buttonsPressed.leftarrow = true;
				buttonsPressed.rightarrow = false;
			} else if (x > 1) {
				buttonsPressed.rightarrow = true;
				buttonsPressed.leftarrow = false;
			} else {
				buttonsPressed.rightarrow = false;
				buttonsPressed.leftarrow = false;
			}
			buttonsPressed = { ...buttonsPressed };
		}
		const mouseOut = () => {
			buttonsPressed.leftarrow = false;
			buttonsPressed.rightarrow = false;
		};
		window.addEventListener("mousemove", handleMove);
		window.addEventListener("mouseout", mouseOut);
		return {
			destroy() {
				window.removeEventListener("mousemove", handleMove);
				window.removeEventListener("mouseout", mouseOut);
			}
		};
	}
	let moving = false;
</script>

<svelte:window
	on:keydown={(e) => {
		const b = buttonsPressed;
		switch (e.key.toLowerCase()) {
			case "w":
			case "arrowup":
				moving = true;

				b.w = true;
				break;
			case "s":
			case "arrowdown":
				moving = true;
				b.s = true;
				break;
			case "a":
				moving = true;
				b.a = true;
				break;
			case " ":
			case "space":
				state = "shoot";

				try {
					dispatch("shoot");
				} catch {}

				break;
			case "d":
				moving = true;
				b.d = true;
				break;
			case "arrowleft":
				b.leftarrow = true;
				break;
			case "shift":
				b.shift = true;
				break;
			case "arrowright":
				b.rightarrow = true;
				break;
		}
		// if (e.repeat) return;
		// buttonsPressed = { ...b };
	}}
	on:keyup={(e) => {
		const b = buttonsPressed;
		switch (e.key.toLowerCase()) {
			case "w":
			case "arrowup":
				b.w = false;
				break;
			case "s":
			case "arrowdown":
				b.s = false;
				break;
			case "a":
				b.a = false;
				break;
			case "d":
				b.d = false;
				break;
			case "arrowleft":
				b.leftarrow = false;
				break;
			case "shift":
				b.shift = false;
				break;
			case "arrowright":
				b.rightarrow = false;
				break;
		}
		if (b.s !== true && b.w !== true && b.a !== true && b.d !== true) moving = false;
		// if (e.repeat) return;
		// buttonsPressed = { ...b };
	}}
/>
<svelte:body
	use:handleMouseMove
	on:click={requestPointerLock}
/>
<div
	class="player-gun {state}"
	on:animationstart|capture={findClosestEnemy}
	on:animationend|capture={() => {
		state = "idle";
	}}
/>
<!-- <div class="ray" style={cssText} /> -->
<div
	class="player camera"
	id="camera"
	style={cssText}
>
	<slot />
</div>

<style lang="scss">
	.player-gun {
		position: fixed;
		// top: 0;
		bottom: 0;
		margin: 0 auto;
		z-index: 1000;
		left: 0;
		max-width: 24.125rem;
		right: 0;

		transform: translate(0px, 0px);
		transition: transform cubic-bezier(0.77, 0, 0.175, 1) 1000ms;
		// inset: 0;
		// position: fixed;
		// animation: walk 0.6s cubic-bezier(0.77, 0, 0.175, 1) backwards;
		// animation-iteration-count: 4;
	}
	.player-gun::after {
		content: "";
		position: fixed;
		width: 24.125rem;
		height: 24.125rem;
		// inset: 0;
		bottom: 0;
		background: url(../sprites/PISTOL.png) left center no-repeat;
		background-size: 400%;
		// background-position-x: 0px;
		transition: inherit;
		// transform: translateX(-80%);
		transition-delay: 0s;

		z-index: 1000;
		// animation: unset;
	}
	.moving {
		// animation: walk 1s cubic-bezier(0.77, 0, 0.175, 1) both infinite alternate-reverse;
	}
	.shoot {
		&::after {
			animation: shooting steps(1) 0.6125s;

			@keyframes shooting {
				20% {
					background-position-x: 33%;
				}
				40% {
					background-position-x: 66%;
				}
				60% {
					background-position-x: 99%;
				}
			}
		}
	}
	@keyframes walk {
		from {
			transform: translate(-1%, 13%);
		}
		50% {
			transform: translate(8%, 0%);
		}
		to {
			transform: translate(-3%, 2%);
		}
	}
	#camera,
	#world {
		position: fixed;
		// perspective: var(--perspective);
		inset: 0;
		transform: translateZ(0);
		// transform: translate3d(, -50%, -640px);
		transform-style: preserve-3d;
		will-change: transform;
	}
	#camera {
		will-change: transform;
		// contain: layout;
	}
</style>
