import { browser } from "$app/environment";

class SoundEffectNode {
	private node: OscillatorNode | null = null;
	private filter: BiquadFilterNode | null = null;
	private constructor(private context: AudioContext, options: OscillatorOptions) {
		this.node = new OscillatorNode(this.context, options);

		this.node.onended = () => this.onended();
	}

	addFilter(type: BiquadFilterType, options: BiquadFilterOptions) {
		if (!this.node) throw Error("Cannot add a filter to an uninitialized AudioNode");
		this.filter = new BiquadFilterNode(this.context, options);
		this.filter.type = type;
		this.node.connect(this.filter);
		return this.connect(this.filter);
	}

	connect(connectee: AudioNode) {
		return (to: AudioNode) => {
			connectee.connect(to);
		};
	}

	play(when?: number, lengthInMs?: number | undefined) {
		if (!this.node) throw Error("Cannot call play on an uninitialized AudioNode");

		this.node.start(when);
		if (lengthInMs) {
			this.node.stop(this.context.currentTime + lengthInMs / 1000);
		}
	}

	private onended() {
		if (!this.node) return;

		this.node.onended = null;

		this.node.stop();
		this.node.disconnect();
		this.filter?.disconnect();

		try {
			this.node = null;
			this.filter = null;
		} catch {
			/* empty */
		}
	}

	static create(context: AudioContext, options: OscillatorOptions) {
		return new SoundEffectNode(context, options);
	}
}

class WebAudioCore {
	private declare context: AudioContext;
	private declare gainNode: GainNode;
	private declare squareOsc: OscillatorNode;
	private buffers: { [key: string]: AudioBuffer } = {};
	private preloadQueue: [
		name: string,
		buffer: ArrayBuffer | string,
		autoPlay: boolean,
		loop: boolean
	][] = [];
	private isPlayingSound = false;
	private declare activeSourceNode: AudioBufferSourceNode | null;
	constructor(private initial?: { [key: string]: string }) {
		if (!browser) return;
		const onUserInteractionCallback = () => {
			this.init();
		};

		document.body.addEventListener("click", onUserInteractionCallback, {
			once: true,
			capture: true
		});
	}

	public async loadAudioFile(
		name: string,
		buffer: ArrayBuffer | string,
		autoPlay = false,
		loop = false
	) {
		if (!this.context) {
			this.preloadQueue.push([name, buffer, autoPlay, loop]);
			console.log("preload");
			return;
		}

		if (typeof buffer === "string") {
			buffer = await fetch(buffer as string).then((res) => res.arrayBuffer());
		}
		const audioBuffer = await this.context.decodeAudioData(buffer as ArrayBuffer);
		console.log("buffer", audioBuffer);
		this.buffers[name] = audioBuffer;
		if (autoPlay) {
			console.log(this);
			this.play(name, loop);
		}
	}
	public play(name: string, loop = false) {
		if (this.activeSourceNode) {
			this.activeSourceNode.stop(this.context.currentTime);
			this.activeSourceNode.disconnect();
			try {
				this.activeSourceNode = null;
			} catch {
				/* empty */
			}
		}
		if (!name) return;
		if (!this.buffers[name]) return console.log(this.buffers.n);
		this.activeSourceNode = this.context.createBufferSource();
		this.activeSourceNode.buffer = this.buffers[name];
		if (loop) this.activeSourceNode.loop = loop;
		this.activeSourceNode.connect(this.gainNode);
		this.activeSourceNode.start(this.context.currentTime);
	}
	public playEffect(name: "blocked") {
		switch (name) {
			case "blocked":
				{
					const fx = SoundEffectNode.create(this.context, {
						frequency: 144,
						type: "sine",
						detune: 50
					});

					fx.addFilter("highpass", { frequency: 220, gain: -3, Q: 2 })(this.gainNode);
					fx.play(undefined, 16.7);
				}
				break;
			default:
				break;
		}
	}
	private init() {
		this.context = new AudioContext();
		if (this.context.state === "suspended") {
			this.context.resume();
		}

		this.gainNode = this.context.createGain();
		this.gainNode.gain.value = 0.3;
		this.gainNode.connect(this.context.destination);
		while (this.preloadQueue.length) {
			const item = this.preloadQueue.shift()!;
			this.loadAudioFile(...item);
		}
	}
}

export const AudioEngine = new WebAudioCore();
