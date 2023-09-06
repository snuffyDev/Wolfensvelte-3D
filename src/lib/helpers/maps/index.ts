// adapted from: https://github.com/vpoupet/wolfenstein/blob/master/js/files.js

class GameData {
	private declare VSWAP: DataView | undefined;
	private declare MAPHEAD: ArrayBuffer | undefined;
	private declare GAMEMAPS: ArrayBuffer | undefined;
	private declare wallTexturesOffset: number;
	private declare plane0: DataView | undefined;
	private declare plane1: DataView | undefined;
	private declare _plane2: boolean[][] | undefined;

	public get plane2(): boolean[][] {
		return this._plane2 as boolean[][];
	}
	public set plane2(value: boolean[][]) {
		this._plane2 = value;
	}
	constructor() {
		this.VSWAP = undefined;
		this.MAPHEAD = undefined;
		this.GAMEMAPS = undefined;
		this.wallTexturesOffset = 0;
		this.plane0 = undefined;
		this.plane1 = undefined;
		this._plane2 = [];
	}

	get() {
		return [
			this.VSWAP,
			this.MAPHEAD,
			this.GAMEMAPS,
			this.wallTexturesOffset,
			this.plane0,
			this.plane1,
			this._plane2
		] as const;
	}

	rlewDecode(inView: DataView): DataView | undefined {
		if (!this.MAPHEAD) return;
		const mapHeadView = new DataView(this.MAPHEAD);
		const rlewTag = mapHeadView.getUint16(0, true);
		const size = inView.getUint16(0, true);
		const buffer = new ArrayBuffer(size);
		const outView = new DataView(buffer);
		let inOffset = 2;
		let outOffset = 0;

		while (inOffset < inView.byteLength) {
			const w = inView.getUint16(inOffset, true);
			inOffset += 2;
			if (w === rlewTag) {
				const n = inView.getUint16(inOffset, true);
				const x = inView.getUint16(inOffset + 2, true);
				inOffset += 4;
				for (let i = 0; i < n; i++) {
					outView.setUint16(outOffset, x, true);
					outOffset += 2;
				}
			} else {
				outView.setUint16(outOffset, w, true);
				outOffset += 2;
			}
		}
		return outView;
	}

	carmackDecode(inView: DataView): DataView {
		const size = inView.getUint16(0, true);
		const buffer = new ArrayBuffer(size);
		const outView = new DataView(buffer);
		let inOffset = 2;
		let outOffset = 0;

		while (inOffset < inView.byteLength) {
			const x = inView.getUint8(inOffset + 1);
			if (x === 0xa7 || x === 0xa8) {
				// possibly a pointer
				const n = inView.getUint8(inOffset);
				if (n === 0) {
					// exception (not really a pointer)
					outView.setUint8(outOffset, inView.getUint8(inOffset + 2));
					outView.setUint8(outOffset + 1, x);
					inOffset += 3;
					outOffset += 2;
				} else if (x === 0xa7) {
					// near pointer
					const offset = 2 * inView.getUint8(inOffset + 2);
					for (let i = 0; i < n; i++) {
						outView.setUint16(outOffset, outView.getUint16(outOffset - offset, true), true);
						outOffset += 2;
					}
					inOffset += 3;
				} else {
					// far pointer
					const offset = 2 * inView.getUint16(inOffset + 2, true);
					for (let i = 0; i < n; i++) {
						outView.setUint16(outOffset, outView.getUint16(offset + 2 * i, true), true);
						outOffset += 2;
					}
					inOffset += 4;
				}
			} else {
				// not a pointer
				outView.setUint16(outOffset, inView.getUint16(inOffset, true), true);
				inOffset += 2;
				outOffset += 2;
			}
		}
		return outView;
	}

	loadBytes(url: string): Promise<ArrayBuffer> {
		return fetch(url).then((response) => {
			if (!response.ok) {
				throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
			}
			return response.arrayBuffer();
		});
	}

	loadResources(): Promise<void | void[]> {
		const splashPromise = new Promise<void>((resolve) => setTimeout(resolve, 1000));
		const gamemapsPromise = this.loadBytes("data/GAMEMAPS.WL6");
		const mapheadPromise = this.loadBytes("data/MAPHEAD.WL6");
		const vswapPromise = this.loadBytes("data/VSWAP.WL6");

		return Promise.all([splashPromise, gamemapsPromise, mapheadPromise, vswapPromise]).then(
			([_, gamemaps, maphead, vswap]) => {
				this.GAMEMAPS = gamemaps;
				this.MAPHEAD = maphead;
				this.VSWAP = new DataView(vswap);
				this.wallTexturesOffset = this.VSWAP.getUint32(6, true);
			}
		);
	}

	loadLevel(level: number): void {
		if (!this.MAPHEAD || !this.GAMEMAPS) return;
		const mapHeadView = new DataView(this.MAPHEAD);
		const offset = mapHeadView.getUint32(2 + 4 * level, true);
		const mapHeader = new DataView(this.GAMEMAPS, offset, 42);
		const plane0View = new DataView(
			this.GAMEMAPS,
			mapHeader.getUint32(0, true),
			mapHeader.getUint16(12, true)
		);
		this.plane0 = this.rlewDecode(this.carmackDecode(plane0View));
		const plane1View = new DataView(
			this.GAMEMAPS,
			mapHeader.getUint32(4, true),
			mapHeader.getUint16(14, true)
		);
		this.plane1 = this.rlewDecode(this.carmackDecode(plane1View));
		this._plane2 = Array.from({ length: 64 }, () => Array(64).fill(false));
	}

	getMap0(x: number, y: number): number | undefined {
		try {
			return this.plane0!.getUint16(2 * (x + 64 * y), true);
		} catch (e) {
			return undefined;
		}
	}

	setMap0(x: number, y: number, value: number): void {
		this.plane0!.setUint16(2 * (x + 64 * y), value, true);
	}

	getMap1(x: number, y: number): number | undefined {
		try {
			return this.plane1!.getUint16(2 * (x + 64 * y), true);
		} catch (e) {
			return undefined;
		}
	}

	setMap1(x: number, y: number, value: number): void {
		this.plane1!.setUint16(2 * (x + 64 * y), value, true);
	}
}

export const gameData = new GameData();
