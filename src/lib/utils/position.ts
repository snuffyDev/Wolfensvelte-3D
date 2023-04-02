import type { Position, Position2D } from "$lib/types/position";

export const getDistanceFromPoints = (p1: Position | Position2D, p2: Position | Position2D): number => {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.z - p1.z) ** 2);
};

export function getRealPositionFromLocalPosition({ x, z }: Position | Omit<Position, 'y'>) {
    return {
        x: x * 100,
        z: z * 100
    };
}

export function getLocalPositionFromRealPosition({ x, z }: Position | Omit<Position, 'y'>) {
    return {
        x: ~~Math.floor((x + 1000) / 100 ),
        z: ~~Math.floor((z + 1000) / 100)
    };
}