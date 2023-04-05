import type Door from "$lib/components/Door.svelte";
import type Guard from "$lib/components/Guard/Guard.svelte";
import type Wall from "$lib/components/Wall.svelte";

type Model = Door | Guard;
class ObjectManager {
	private _walls: Wall[];
	public get walls(): Wall[] {
		return this._walls;
	}
	public set walls(value: Wall[]) {
		this._walls = value;
	}

	private _enemies: Guard[];
	public get enemies(): Guard[] {
		return this._enemies;
	}
	public set enemies(value: Guard[]) {
		this._enemies = value;
	}

	private _models: Model[];
	public get models(): Model[] {
		return this._models;
	}
	public set models(value: Model[]) {
		this._models = value;
	}

	constructor() {
		this._walls = [];
		this._enemies = [];
		this._models = [];
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
}

export const GameObjects = new ObjectManager();
