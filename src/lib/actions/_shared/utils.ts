import type { EventType } from "$lib/utils";
import type { Detail } from "./types";

export function boundingRect(node: HTMLElement): {
	top: number;
	height: number;
	left: number;
	width: number;
	parent_top: number;
	parent_left: number;
} {
	const nodeRect = node.getBoundingClientRect();
	const parentRectTop = node.parentElement.offsetTop;
	const parentRectLeft = node.parentElement.offsetLeft;
	return {
		top: nodeRect.top,
		height: nodeRect.height,
		left: nodeRect.left,
		width: nodeRect.width,
		parent_top: parentRectTop,
		parent_left: parentRectLeft
	};
}
export function updateDetail(event: PointerEvent, detail: Detail) {
	detail.clientX = Math.floor(event.clientX);
	detail.clientY = Math.floor(event.clientY);
}

export function calculateVelocity(event: PointerEvent, detail: Detail) {
	const lastX = detail.clientX;
	const lastY = detail.clientY;
	const lastTime = detail.timeStamp;
	updateDetail(event, detail);

	const currentX = detail.clientX;
	const currentY = detail.clientY;
	const timeStamp = (detail.timeStamp = event.timeStamp);

	const timeDelta = timeStamp - lastTime;

	if (timeDelta > 0 && timeDelta < 100) {
		const distanceX = (currentX - lastX) / timeDelta;
		const distanceY = (currentY - lastY) / timeDelta;
		detail.velocityX = distanceX * 0.7 + detail.velocityX! * 0.3;
		detail.velocityY = distanceY * 0.7 + detail.velocityY! * 0.3;
	}
}

export type EventHandler<T> = (event: T) => void;

/** Dispatches a new CustomEvent on a given Node */
export const dispatcher =
	<
		Events extends Record<string, any> = Record<string, any>,
		Event extends keyof Events & string = keyof Events & string
	>() =>
	(node: HTMLElement, type: Event, detail: Events[Event]): boolean =>
		node.dispatchEvent(new CustomEvent(type, { detail: detail, bubbles: true }));

interface AddListener {
	<
		EventType extends keyof WindowEventMap = keyof WindowEventMap,
		Event extends WindowEventMap[EventType] = WindowEventMap[EventType]
	>(
		target: Window,
		type: EventType,
		listener: (event: Event) => void,
		options?: AddEventListenerOptions | boolean | undefined
	);
	<
		EventType extends keyof HTMLElementEventMap = keyof HTMLElementEventMap,
		Event extends HTMLElementEventMap[EventType] = HTMLElementEventMap[EventType]
	>(
		target: HTMLElement,
		type: EventType,
		listener: (event: Event) => void,
		options?: AddEventListenerOptions | boolean | undefined
	);
	<
		EventType extends keyof (WindowEventMap | HTMLElementEventMap) = keyof (
			| WindowEventMap
			| HTMLElementEventMap
		),
		Event extends (WindowEventMap | HTMLElementEventMap)[EventType] = (
			| WindowEventMap
			| HTMLElementEventMap
		)[EventType]
	>(
		target: Window | HTMLElement,
		type: EventType,
		listener: (event: Event) => void,
		options?: AddEventListenerOptions | boolean | undefined
	);
	<EventType, Event>(
		target: unknown,
		type: EventType,
		listener: (event: Event) => void | EventListenerOrEventListenerObject,
		options?: AddEventListenerOptions | boolean | undefined
	): void;
}

export const addListener: AddListener = <EventType, Event>(target, type, listener, options) => {
	target.addEventListener(type, listener, options);
};
export function removeListener<
	EventType extends keyof WindowEventMap = keyof WindowEventMap,
	Event extends WindowEventMap[EventType] = WindowEventMap[EventType]
>(
	target: Window,
	type: EventType,
	listener: (event: Event) => void,
	options?: AddEventListenerOptions | boolean
);
export function removeListener<
	EventType extends keyof HTMLElementEventMap = keyof HTMLElementEventMap,
	Event extends HTMLElementEventMap[EventType] = HTMLElementEventMap[EventType]
>(
	target: HTMLElement,
	type: EventType,
	listener: (event: Event) => void,
	options?: AddEventListenerOptions | boolean
);
export function removeListener<
	EventType extends keyof (WindowEventMap | HTMLElementEventMap) = keyof (
		| WindowEventMap
		| HTMLElementEventMap
	),
	Event extends (WindowEventMap | HTMLElementEventMap)[EventType] = (
		| WindowEventMap
		| HTMLElementEventMap
	)[EventType]
>(
	target: Window | HTMLElement,
	type: EventType,
	listener: (event: Event) => void,
	options?: AddEventListenerOptions | boolean
) {
	target.removeEventListener(type, listener, options);
}
