import type Door from "$lib/components/Door.svelte";
import type Elevator from "$lib/components/Elevator.svelte";
import type Enemy from "$lib/components/Enemy.svelte";
import type Guard from "$lib/components/Guard/Guard.svelte";
import type MapObject from "$lib/components/MapObject.svelte";
import type Pushwall from "$lib/components/Pushwall.svelte";
import type Wall from "$lib/components/Wall.svelte";
import { writable } from "svelte/store";
import { asap } from "./levelManager";

export type Model = InstanceType<typeof Door | typeof E | typeof MapObject | typeof Elevator>;

interface GameObjectStore {
	walls: Wall[];
	pushwalls: Pushwall[];
	enemies: Enemy[];
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

	private subscribers: Set<(store: GameObjectStore) => void> = new Set();
	private keys: (keyof GameObjectStore)[] = [];
	constructor() {
		this.keys = Object.keys(this.store) as (keyof GameObjectStore)[];
		//
	}

	public subscribe = (callback: (store: GameObjectStore) => void): (() => void) => {
		this.subscribers.add(callback);
		callback(this.store);

		return () => {
			this.subscribers.delete(callback);
		};
	};

	public update = (key: keyof GameObjectStore, value: Model[]): void => {
		//@ts-expect-error it's fine
		this.store[key] = value;
		this.subscribers.forEach((callback) => callback(this.store));
	};

	set = (value: GameObjectStore) => {
		this.store = value;
		this.subscribers.forEach((cb) => cb(this.store));
	};
	reset = () => {
		for (const key in this.store) {
			asap(() => {
				this.store[key as keyof typeof this.store].length = 0;
				this.subscribers.forEach((cb) =>
					cb(Object.fromEntries(Object.keys(this.store).map((k) => [k, []])))
				);
				this.store[key as keyof typeof this.store] = this.store[
					key as keyof typeof this.store
				].filter((v) => v != null) as any;
			});
		}
		this.subscribers.forEach((cb) =>
			cb(Object.fromEntries(Object.keys(this.store).map((k) => [k, []])))
		);
	};
	*[Symbol.iterator]() {
		for (const key of this.keys) {
			yield* this.store[key];
		}
	}
}

export const GameObjects = new GameObjectStoreManager();
