export const specialObjectIds = [...Array(52).keys()].map((v) => v + 115);

/** 168 - Dog
 *  169 - Guard
 */
export const enemySymbolIds = [168,169]

export const EnemySymbol = {
    Guard: 169,
    Dog: 168
} as const

export const ItemPickups = {
    Cross: 146,
    Goblet: 147,
    Chest: 148,
    Crown: 149,

    Chaingun: 145,
    Smg: 144,

    Ammo: 143,

    Medkit: 142,
    Food: 141,


} as const;

export const noClipObjectIds = [
	131, 121, 155, 151, 165, 143, 144, 145, 146, 147, 148, 149, 150, 138, 137, 165
];
