import type { EnemyBehavior } from "$lib/core/ai";
import type { IPlayerState } from "$lib/stores/player";
import type { Position, Position2D } from "$lib/types/position";
import { enemyState } from "../Guard/state";

export interface DogState
	extends Omit<IPlayerState, "weapons" | "rotation" | "position" | "score"> {
	playerIsVisible: boolean;
	state: "dead" | "idle" | "walk" | "attack" | "hurt";
	position: Position2D;
	rotation: Pick<Position, "y">;
}

export const dogState = (init?: Partial<DogState>, behavior: EnemyBehavior) =>
	enemyState<DogState>(init, behavior);
