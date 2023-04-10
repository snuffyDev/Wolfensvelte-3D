import type Door from "$lib/components/Door.svelte";
import type Guard from "$lib/components/Guard/Guard.svelte";
import type Wall from "$lib/components/Wall.svelte";

type Model = Door | Guard;

class ObjectManager {
	walls: Wall[] = [];
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
}

export const GameObjects = new ObjectManager();