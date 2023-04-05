import type { TEXTURE_KEYS } from "$lib/utils/engine/textures";
import type { Position2D, Position } from "../position";

export type Texture = (typeof TEXTURE_KEYS)[number] | null;

export type WallFace = "front" | "left" | "back" | "right";

// Alias for Texture
export type Surface = Texture;

export type Model = { component: "Guard" | "Door" };

export type Entity = {
	position?: Position2D | undefined;
	rotation: Position | undefined;
	model?: Model;
	surfaces: Surface;
};

// Dict containing textures for each cardinal direction
export type MapItem = Entity;

// A Multidimensional Array with MapItems
export type World = ReadonlyArray<MapItem[]>;