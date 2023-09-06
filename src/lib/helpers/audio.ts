export class AIAudioManager<T extends Record<string, string>> {
	private declare ref: Map<keyof T, HTMLAudioElement>;

	constructor(dict: Partial<T>) {
		this.ref = new Map();
		for (const key in dict) {
			const audio = new Audio(dict[key]);
			audio.volume = 0.7;
			this.ref.set(key, audio);
		}
	}

	play(sound: keyof T) {
		this.ref.get(sound)!.play();
	}
}
