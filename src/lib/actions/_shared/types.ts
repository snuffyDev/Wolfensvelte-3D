export type Axis = "x" | "y";
export type EventKind = "drag";
export interface Detail {
	startTime: number;
	timeStamp: number;
	startX: number;
	startY: number;
	clientX: number;
	clientY: number;
	deltaX?: number;
	deltaY?: number;
	velocityX?: number;
	velocityY?: number;
}
export type GestureEventTarget = Window | HTMLElement;

export interface GestureHandlers {
	onStart(event: PointerEvent): void;
	onMove(event: PointerEvent): void;
	onEnd(event: PointerEvent): void;
}
export interface DragEvent {
	dragstart: Detail;
	dragmove: Detail;
	dragend: Detail;
}

export interface PanEvent {
	panstart: Detail;
	pan: Detail;
	panend: Detail;
}
