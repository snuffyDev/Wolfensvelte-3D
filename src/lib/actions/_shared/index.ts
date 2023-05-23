import type { Detail } from "./types";
import type { GestureHandlers } from "./types";
import { dispatcher, boundingRect, calculateVelocity } from "./utils";
import { updateDetail } from "./utils";
import { addListener, removeListener } from "./utils";

export function setHandlers(
	node: HTMLElement,
	args: {
		id: Record<string, any>;
		handlers: GestureHandlers;
		capture?: boolean;
		onDestroy?: () => void | null;
	}
) {
	const { capture, handlers, onDestroy = null } = args;
	addListener(node, "pointerdown", handlers.onStart, capture);
	return {
		destroy() {
			if (typeof onDestroy === "function") {
				onDestroy();
			}
			removeListener(node, "pointerdown", handlers.onStart, capture);
		}
	};
}
export function draggable(node: HTMLElement) {
	const detail: Detail = {
		startTime: 0,
		timeStamp: 0,
		startX: 0,
		startY: 0,
		clientX: 0,
		clientY: 0,
		deltaX: 0,
		deltaY: 0,
		velocityX: 0,
		velocityY: 0
	};
	const dispatch = dispatcher<DragEvent>();
	const initialRect = { top: 0, left: 0, width: 0, height: 0, parentTop: 0, parentLeft: 0 };
	const id = {};

	const handlers: GestureHandlers = {
		onStart(event) {
			if (
				(event.target as HTMLElement).isSameNode(node) !== true &&
				node.contains(event.target as Node) !== true
			)
				return;
			event.stopPropagation();

			const { top, left, width, height, parent_top, parent_left } = boundingRect(node);
			initialRect.top = top;
			initialRect.left = left;
			initialRect.width = width;
			initialRect.height = height;
			initialRect.parentTop = parent_top;
			detail.startX = detail.clientX = event.clientX - left - width;
			detail.startY = detail.clientY = event.clientY - top - height;
			initialRect.parentLeft = parent_left;
			updateDetail(event, detail);

			dispatch(node, "dragstart", detail);

			addListener(window, "pointermove", handlers.onMove);
			addListener(window, "pointerup", handlers.onEnd, { passive: true });
			addListener(window, "pointercancel", handlers.onEnd);
		},
		onMove(event) {
			if (
				(event.target as HTMLElement).isSameNode(node) !== true &&
				node.contains(event.target as Node) !== true
			)
				return;
			event.stopImmediatePropagation();

			calculateVelocity(event, detail);

			const clientX = initialRect.left - event.clientX - initialRect.width / 2;
			const clientY = initialRect.top - event.clientY - initialRect.height / 2;

			detail.deltaX = clientX - detail.startX!;
			detail.deltaY = clientY - detail.startY!;
			detail.clientX = clientX;
			detail.clientY = clientY;

			dispatch(node, "dragmove", detail);
		},
		onEnd(event) {
			if (
				(event.target as HTMLElement).isSameNode(node) !== true &&
				node.contains(event.target as Node) !== true
			)
				return;
			event.stopImmediatePropagation();

			calculateVelocity(event, detail);

			detail.deltaX = detail.clientX - detail.startX!;
			detail.deltaY = detail.clientY - detail.startY!;

			dispatch(node, "dragend", detail);

			removeListener(window, "pointermove", handlers.onMove);
			removeListener(window, "pointercancel", handlers.onEnd);
			removeListener(window, "pointerup", handlers.onEnd);
		}
	};
	return setHandlers(node, { handlers, id, capture: true });
}
