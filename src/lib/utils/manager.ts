import type Door from "$lib/components/Door.svelte";
import type Elevator from "$lib/components/Elevator.svelte";
import type Enemy from "$lib/components/Enemy.svelte";
import type MapObject from "$lib/components/MapObject.svelte";
import type Pushwall from "$lib/components/Pushwall.svelte";
import type Wall from "$lib/components/Wall.svelte";
import { asap } from "./asap";

export type Model = Wall | Door | Enemy | MapObject | Elevator;

interface GameObjectStore {
	walls: Wall[];
	pushwalls: Pushwall[];
	enemies: Enemy[];
	models: Exclude<Model, Door>[];
	doors: Door[];
	elevators: Elevator[];
}

export const GameObjectTypes = ["wall", "pushwall", "enemy", "model", "door", "elevator"] as const;

export type GameObjectType = (typeof GameObjectTypes)[number];

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

		this.subscribe;
	}

	public subscribe = (callback: (store: GameObjectStore) => void): (() => void) => {
		this.subscribers.add(callback);
		callback(this.store);

		return () => {
			this.subscribers.delete(callback);
		};
	};

	public find = (
		key: keyof GameObjectStore,
		predicate: (value: Model) => boolean
	): Model | undefined => {
		return this.store[key].find(predicate);
	};

	public delete = (key: keyof GameObjectStore, predicate: (value: Model) => boolean): void => {
		const index = this.store[key].findIndex(predicate);
		if (index !== -1) {
			this.store[key].splice(index, 1);
			this.subscribers.forEach((callback) => callback(this.store));
		}
	};

	public update = (key: keyof GameObjectStore, value: Model[]): void => {
		//@ts-expect-error it's fine
		this.store[key] = value;
		this.subscribers.forEach((callback) => callback(this.store));
	};

	set = (value: GameObjectStore) => {
		for (const v in value) {
			const items = value[v as keyof GameObjectStore];
			value[v as keyof GameObjectStore] = items.filter((v) => !!v && !!v.item);
		}
		this.store = value;
		this.subscribers.forEach((cb) => cb(this.store));
	};
	reset = () => {
		for (const key in this.store) {
			asap(() => {
				this.store[key as keyof typeof this.store].length = 0;
				this.subscribers.forEach((cb) =>
					cb(
						Object.fromEntries(
							Object.keys(this.store).map((k) => [k, []])
						) as unknown as GameObjectStore
					)
				);
				this.store[key as keyof typeof this.store] = this.store[
					key as keyof typeof this.store
				].filter((v) => v != null) as any;
			});
		}
		this.subscribers.forEach((cb) =>
			cb(
				Object.fromEntries(
					Object.keys(this.store).map((k) => [k, []])
				) as unknown as GameObjectStore
			)
		);
	};
	*[Symbol.iterator]() {
		for (const key of this.keys) {
			yield* this.store[key];
		}
	}
}

export const GameObjects = new GameObjectStoreManager();
