export const specialObjectIds = [...Array(52).keys()].map((v) => v + 115);

/** 168 - Dog
 *  169 - Guard
 */
export const enemySymbolIds = [168, 169, 173] as const;

export const EnemySymbol = {
	Guard: 169,
	Dog: 168,
	SS: 173
} as const;

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
	DogFood: 123
} as const;

export const ItemPickupIds = Object.values<
	Readonly<(typeof ItemPickups)[keyof typeof ItemPickups]>
>(ItemPickups).map((v) => +v) as unknown as Readonly<
	(typeof ItemPickups)[keyof typeof ItemPickups]
>;

export const TreasurePickupPointMap = {
	146: 100,
	147: 500,
	148: 1000,
	149: 5000
} as const;

export const SpawnTile = 171;

export const noClipObjectIds = [
	131, 121, 155, 151, 165, 143, 142, 144, 145, 146, 147, 123, 148, 149, 150, 138, 137, 165, 126,
	141, 168
];
