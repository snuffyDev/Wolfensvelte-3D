class CarmackRNG {
	private seed: number;

	constructor(seed: number) {
		this.seed = seed;
	}

	// Generate a random integer between 0 and 255
	public nextByte(): number {
		this.seed = (this.seed * 1664525 + 1013904223) % Math.pow(2, 32);
		return (this.seed >> 24) & 0xff;
	}

	// Generate a random integer between min and max (inclusive)
	public nextInt(min: number, max: number): number {
		return Math.floor(this.nextFloat() * (max - min + 1)) + min;
	}

	// Generate a random float between 0 and 1 (exclusive)
	public nextFloat(): number {
		// Combine four random bytes to generate a 32-bit floating-point number
		const b1 = this.nextByte();
		const b2 = this.nextByte();
		const b3 = this.nextByte();
		const b4 = this.nextByte();
		const bits = ((b1 << 24) | (b2 << 16) | (b3 << 8) | b4) >>> 0;
		const float = bits / (Math.pow(2, 32) - 1);
		return float;
	}
}

export const rand = new CarmackRNG(Date.now());
