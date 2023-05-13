import { browser } from "$app/environment";

class WebAudioCore {
	private declare context: AudioContext;
	private declare gainNode: GainNode;
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

		window.addEventListener("click", onUserInteractionCallback, {
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
		if (!this.buffers[name]) return;
		this.activeSourceNode = this.context.createBufferSource();
		this.activeSourceNode.buffer = this.buffers[name];
		if (loop) this.activeSourceNode.loop = loop;
		this.activeSourceNode.connect(this.gainNode);
		this.activeSourceNode.start(this.context.currentTime);
	}
	private init() {
		this.context = new AudioContext();
		if (this.context.state === "suspended") {
			this.context.resume();
		}
		this.gainNode = this.context.createGain();
		this.gainNode.gain.value = 0.5;
		this.gainNode.connect(this.context.destination);
		while (this.preloadQueue.length) {
			const item = this.preloadQueue.pop()!;
			this.loadAudioFile(...item);
		}
	}
}

export const MusicManager = new WebAudioCore();
