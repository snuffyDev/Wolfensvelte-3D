import type Door from "$lib/components/Door.svelte";
import type Elevator from "$lib/components/Elevator.svelte";
import type Guard from "$lib/components/Guard/Guard.svelte";
import type MapObject from "$lib/components/MapObject.svelte";
import type Pushwall from "$lib/components/Pushwall.svelte";
import type Wall from "$lib/components/Wall.svelte";
import { writable } from "svelte/store";
type Model = InstanceType<typeof Door | typeof Guard | typeof MapObject | typeof Elevator>;

interface GameObjectStore {
	walls: Wall[];
	pushwalls: Pushwall[];
	enemies: Guard[];
	models: Exclude<Model, Door>[];
	doors: Door[];
	elevators: Elevator[];
}

class GameObjectStoreManager {
	private store: GameObjectStore = {
		walls: [],
		pushwalls: [],
		enemies: [],
		models: [],
		doors: [],
		elevators: []
	};

	private subscribers: Array<(store: GameObjectStore) => void> = [];

	constructor() {
		//
	}

	public subscribe(callback: (store: GameObjectStore) => void): () => void {
		this.subscribers.push(callback);
		callback(this.store);

		return () => {
			const index = this.subscribers.indexOf(callback);
			if (index !== -1) {
				this.subscribers.splice(index, 1);
			}
		};
	}

	public update(key: keyof GameObjectStore, value: Model[]): void {
		//@ts-expect-error it's fine
		this.store[key] = value;
		this.subscribers.forEach((callback) => callback(this.store));
	}

	set(value: GameObjectStore) {
		this.store = value;
		this.subscribers.forEach((cb) => cb(this.store));
	}
	reset() {
		for (const key in this.store) {
			for (const obj of this.store[key as keyof GameObjectStore]) {
				if (obj === null) continue;
				if ("$destroy" in obj && typeof obj.$destroy === "function") obj.$destroy();
			}
			this.store[key as keyof typeof this.store] = (
				this.store[key as keyof typeof this.store] as never[]
			).filter((k) => k != null);
			this.subscribers.forEach((cb) => cb(this.store));
		}
		this.subscribers.forEach((cb) => cb(this.store));
		// this.subscribers.forEach((cb) => cb);
	}
	*[Symbol.iterator]() {
		for (const key of Object.keys(this.store) as (keyof GameObjectStore)[]) {
			yield this.store[key];
		}
	}
}

export const GameObjects = (() => {
	const storeManager = new GameObjectStoreManager();

	return {
		subscribe: storeManager.subscribe.bind(storeManager),
		update: (key: keyof GameObjectStore, value: Model[]) => {
			storeManager.update(key, value);
		},
		set: storeManager.set.bind(storeManager),
		reset() {
			storeManager.reset();
		},
		[Symbol.iterator]: storeManager[Symbol.iterator].bind(storeManager)
	};
})();
