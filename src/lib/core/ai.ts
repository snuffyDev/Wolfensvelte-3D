import DogBarkSound from "$lib/sounds/dog/bark.WAV?url";
import DogDeathSound from "$lib/sounds/dog/death.WAV?url";
import SSPlayerSeen from "$lib/sounds/ss/SS_alert.WAV?url";
import SSDeath from "$lib/sounds/ss/SS_death.WAV?url";
import SSShoot from "$lib/sounds/ss/SS_shoot.WAV?url";
import GuardHaltSound from "$lib/sounds/guard/halt.WAV?url";
import GuardShootSound from "$lib/sounds/guard/shoot.WAV?url";
import GuardDeath1Sound from "$lib/sounds/guard/death_1.WAV?url";
import GuardDeath2Sound from "$lib/sounds/guard/death_2.WAV?url";
import GuardDeath3Sound from "$lib/sounds/guard/death_3.WAV?url";
import { ItemPickups, rand } from "$lib/utils/engine";

function getPreferredAttackDistance(distance: number) {
	return rand.nextInt(distance / 2.25, distance);
}

export interface EnemyBehavior {
	health: number;
	damage: [low: number, high: number];
	attackDistance: [low: number, preferred: typeof getPreferredAttackDistance, high: number];
	reactionTime: number;
	sounds: Partial<Record<"playerSeen" | "attack" | `death${string}`, string>>;
	dropOnDeath: keyof typeof ItemPickups | null;
	pointValue: number;
}

const GuardBehavior: EnemyBehavior = {
	health: 25,
	damage: [9, 15],
	reactionTime: 1551,
	pointValue: 100,
	attackDistance: [55, getPreferredAttackDistance, 900],
	sounds: {
		playerSeen: new URL(GuardHaltSound, import.meta.url).toString(),
		attack: new URL(GuardShootSound, import.meta.url).toString(),
		death_1: new URL(GuardDeath1Sound, import.meta.url).toString(),
		death_2: new URL(GuardDeath2Sound, import.meta.url).toString(),
		death_3: new URL(GuardDeath3Sound, import.meta.url).toString()
	},
	dropOnDeath: "Ammo"
};

const DogBehavior: EnemyBehavior = {
	health: 15,
	damage: [8, 14],
	reactionTime: 100,
	attackDistance: [1, getPreferredAttackDistance, 64],
	pointValue: 500,
	sounds: {
		playerSeen: new URL(DogBarkSound, import.meta.url).toString(),
		death_1: new URL(DogDeathSound, import.meta.url).toString(),
		attack: ""
	},
	dropOnDeath: null
};

const SSBehavior: EnemyBehavior = {
	health: 35,
	damage: [12, 21],
	pointValue: 100,
	reactionTime: 100,
	attackDistance: [55, getPreferredAttackDistance, 900],
	sounds: {
		playerSeen: new URL(SSPlayerSeen, import.meta.url).toString(),
		death: new URL(SSDeath, import.meta.url).toString(),
		attack: new URL(SSShoot, import.meta.url).toString()
	},
	dropOnDeath: "Smg"
};

export const ENEMY_INIT = { Guard: GuardBehavior, Dog: DogBehavior, SS: SSBehavior } as const;
