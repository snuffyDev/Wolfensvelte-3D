import type { TEXTURE_KEYS } from "$lib/utils/engine/textures";
import type { Position2D, Position } from "../position";

export type Texture = (typeof TEXTURE_KEYS)[number] | null;

export type WallFace = "front" | "left" | "back" | "right";

// Alias for Texture
export type Surface = Texture;


export type EntityV2 = {
	secret: boolean;
	pushwall: boolean;
	blocking: boolean;
	component: "Guard" | "Dog" | "Door" | "Object" | "Elevator" | "SS" | "Wall";

	rotation: Position2D | null;
	position: Position2D | undefined;
	texture: number | null;
	attributes: {
		state?: "open" | "closed";
		pointValue?: number | null;
		needsKey?: "yellow" | "blue";
		health?: number | null;
		weapon?: "chaingun" | "smg" | null;
		ammo?: number | null;
		collectable?: boolean;
	} | null;
};

export type ExtendedEntityV2 = EntityV2 & {
	surfaces: Record<WallFace, Surface> | null;
};

// A Multidimensional Array with MapItems
export type World = ReadonlyArray<ExtendedEntityV2[]>;
