export class AudioManager<T extends Record<string, string>> {
	private declare ref: Map<keyof T, HTMLAudioElement>;

	constructor(dict: T) {
		this.ref = new Map();
		for (const key in dict) {
			this.ref.set(key, new Audio(dict[key]));
		}
	}

	play(sound: keyof T) {
		this.ref.get(sound)!.play();
	}
}
