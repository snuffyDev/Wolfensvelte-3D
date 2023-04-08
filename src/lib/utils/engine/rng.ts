class RNG {
	private _seed: number;
	// Implementation of Carmack's RNG algorithm
	constructor(seed: number) {
		this._seed = seed;
	}

	public nextInt(): number {
		this._seed = (this._seed * 1664525 + 1013904223) % 2 ** 32;
		return this._seed;
	}

	public nextFloat(): number {
		return ~~(this.nextInt() / 0x100000000);
	}

	public randomInRange(min: number, max: number): number {
		return Math.abs(min + this.nextFloat() * (max - min));
	}
}

export const rand = new RNG(Date.now());
