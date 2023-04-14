import type Door from "$lib/components/Door.svelte";
import type Guard from "$lib/components/Guard/Guard.svelte";
import type Pushwall from "$lib/components/Pushwall.svelte";
import type Wall from "$lib/components/Wall.svelte";

type Model = Door | Guard;

class ObjectManager {
	walls: Wall[] = [];
	pushwalls: Pushwall[] = [];
	enemies: Guard[] = [];
	models: Model[] = [];
	doors: Model[] = [];

	constructor() {}

	addModel(model: Model) {
		this.models.push(model);
	}

	addEnemy(enemy: Guard) {
		this.enemies.push(enemy);
	}

	addWall(wall: Wall) {
		this.walls.push(wall);
	}

	*[Symbol.iterator]() {
		for (const wall of this.walls) {
			yield wall;
		}
		for (const wall of this.pushwalls) {
			yield wall;
		}
		for (const wall of this.doors) {
			yield wall;
		}
		for (const enemy of this.enemies) {
			yield enemy;
		}
		for (const model of this.models) {
			yield model;
		}
	}

	reset() {
		this.walls = [];
		this.pushwalls = [];
		this.enemies = [];
		this.models = [];
		this.doors = [];
	}
}

export const GameObjects = new ObjectManager();