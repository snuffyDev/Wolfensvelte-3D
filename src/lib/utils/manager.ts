import type Door from "$lib/components/Door.svelte";
import type Guard from "$lib/components/Guard/Guard.svelte";
import type MapObject from "$lib/components/MapObject.svelte";
import type Pushwall from "$lib/components/Pushwall.svelte";
import type Wall from "$lib/components/Wall.svelte";

type Model = Door | Guard | MapObject;

class ObjectManager {
	walls: Wall[] = [];
	pushwalls: Pushwall[] = [];
	enemies: Guard[] = [];
	models: Exclude<Model, Door>[] = [];
	doors: Model[] = [];

	constructor() {
		//
	}

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
		const arr = [this.walls, this.pushwalls, this.doors, this.enemies, this.models].flat();
		for (const entry of arr) {
			yield entry;
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