// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			FACES: Record<
				"dead" | "dying" | "beat_up" | "hurt" | "full" | "low_hp" | "near_death",
				string[]
			>;
			FACE_KEYS: ("dead" | "dying" | "beat_up" | "hurt" | "full" | "low_hp" | "near_death")[];
		}
		// interface Platform {}
	}
}

export {};
