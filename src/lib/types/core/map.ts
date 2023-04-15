import type { TEXTURE_KEYS } from "$lib/utils/engine/textures";
import type { Position2D, Position } from "../position";

export type Texture = (typeof TEXTURE_KEYS)[number] | null;

export type WallFace = "front" | "left" | "back" | "right";

// Alias for Texture
export type Surface = Texture;

export type Model = {
	component: "Guard" | "Dog" | "Door" | "Object";
	texture?: number;
	attributes?: {
		score: number | null;
		health: number | null;
		weapon: "chaingun" | "smg" | null;
		ammo: number | null;
	};
};

export type Entity = {
	position?: Position2D | undefined;
	rotation: Position | undefined;
	model?: Model;
	surfaces: Surface;
	secret?: boolean;
	pushwall?: boolean;
};
// Updated Entity type
export type ExtendedEntity = {
	position?: Position2D | undefined;
	rotation: Position | undefined;
	model?: Model;
	secret?: boolean;
	pushwall?: boolean;
	surfaces: Record<WallFace, Surface> | null;
};
// Dict containing textures for each cardinal direction
export type MapItem = Entity;

// A Multidimensional Array with MapItems
export type World = ReadonlyArray<Entity[]>;
