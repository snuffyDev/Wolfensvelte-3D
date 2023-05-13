import type { WorldState } from "$lib/components/Level.svelte";
import type { World } from "$lib/types/core";
import { E1M1, E1M2 } from "$lib/utils/map";
import { clear_loops } from "$lib/utils/raf";
import { writable } from "svelte/store";

export const MAP_DICT: Record<string, WorldState> = {
	E1M1,
	E1M2
};

const MAP_KEYS = Object.keys(MAP_DICT) as (keyof typeof MAP_DICT)[];
const MAP_COUNT = MAP_KEYS.length;

class MapManager<T extends typeof MAP_DICT> {
	private levels: { [Key in keyof T]: T[Key] } = {} as any;
	private _currentMapName: keyof T = "" as any;
	public get currentMapName(): keyof T {
		return this._currentMapName;
	}
	public set currentMapName(value: keyof T) {
		this._currentMapName = value;
	}
	private declare _currentLevel: T[keyof T];

	public get currentLevel(): T[keyof T] {
		return this._currentLevel;
	}
	private store = writable<number>();
	private levelIdx = 0;
	private makeLevelKey(index: number) {
		return `E1M${index}`;
	}
	constructor(maps: T) {
		this.levels = maps;
		this.levelIdx++;
		this.currentMapName = Object.keys(maps)[0]! as keyof T;
		this._currentLevel = this.levels[this.currentMapName];
		this.store.set(this.levelIdx);
	}

	public get subscribe() {
		return this.store.subscribe;
	}
	nextMap() {
		this.levelIdx++;
		this.currentMapName = this.makeLevelKey(this.levelIdx);
		this._currentLevel = this.levels[this.currentMapName];
		this.store.set(this.levelIdx);
		return this._currentMapName;
	}
	changeMap(name: keyof T) {
		this._currentMapName = name;
		this._currentLevel = this.levels[this.currentMapName];
		this.store.set(this.levelIdx);
	}
}

export const MapHandler = new MapManager(MAP_DICT);

export const LevelHandler = (() => {
	let currentIdx = 0;
	const { subscribe, set } = writable<{ isComplete?: boolean }>({ isComplete: false });

	return {
		subscribe,
		levelComplete(value: boolean) {
			clear_loops();
			currentIdx += 1;

			set({ isComplete: value });
		},
		reset() {
			clear_loops();
			set({ isComplete: false });
		}
	};
})();
