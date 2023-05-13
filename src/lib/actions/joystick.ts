import { normalizeAngle } from "$lib/utils/angle";
import { getFacingDirection } from "$lib/utils/position";

type JoystickEvent =
	| "forward"
	| "backward"
	| "left"
	| "right"
	| "forward-left"
	| "forward-right"
	| "backward-left"
	| "backward-right";

type JoystickOptions = {
	sensitivity: number;
};

export function joystick(
	node: HTMLElement,
	options: JoystickOptions = { sensitivity: 0.2 }
): { destroy: () => void } {
	let startX = 0;
	let startY = 0;

	let isDragging = false;
	const handlepointerdown = (event: PointerEvent) => {
		if (
			node.parentElement !== (event.target as HTMLElement) &&
			!(event.target as HTMLElement).isSameNode(node)
		) {
			isDragging = false;
			return;
		}
		isDragging = true;
		const touch = event;
		startX = touch.pageX;
		startY = touch.pageY;
		window.addEventListener("pointermove", handlepointerMove, { capture: true });
	};
	function getFacingDirection(angle: number): string {
		angle = angle < 0 ? 360 + angle : angle;
		if (angle >= 315 || angle < 45) {
			return "front";
		} else if (angle >= 45 && angle < 135) {
			return "right";
		} else if (angle >= 135 && angle < 225) {
			return "back";
		} else {
			return "left";
		}
	}
	const handlepointerMove = (event: PointerEvent) => {
		const touch = event;
		const rect = node.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		const touchX = touch.pageX - centerX;
		const touchY = touch.pageY - centerY;

		const distance = Math.sqrt(touchX * touchX + touchY * touchY);
		const sensitivity = options.sensitivity;
		const deadzoneRadius = rect.width / 10;

		if (distance > deadzoneRadius) {
			let angle = Math.atan2(touchY, touchX);
			angle = angle < 0 ? angle + 2 * Math.PI : angle;
			const angleDeg = (angle * 180) / Math.PI;
			const coordinates = {
				type: getFacingDirection(normalizeAngle(angleDeg) + 90)
			};
			node.dispatchEvent(
				new CustomEvent("move", { detail: { type: coordinates.type, x: touchX, y: touchY } })
			);
			// if ((angleDeg >= 180 && angleDeg < 225) || (angleDeg >= 0 && angleDeg < 45)) {
			// 	emitEvent("forward", coordinates);
			// } else if (angleDeg >= 45 && angleDeg < 90) {
			// 	emitEvent("forward-right", coordinates);
			// } else if (angleDeg >= 90 && angleDeg < 135) {
			// 	emitEvent("right", coordinates);
			// } else if (angleDeg >= 135 && angleDeg < 180) {
			// 	emitEvent("backward-right", coordinates);
			// } else if (angleDeg >= 225 && angleDeg < 270) {
			// 	emitEvent("backward", coordinates);
			// } else if (angleDeg >= 270 && angleDeg < 315) {
			// 	emitEvent("backward-left", coordinates);
			// } else if (angleDeg >= 315 && angleDeg < 360) {
			// 	emitEvent("left", coordinates);
			// } else if (angleDeg >= 225 && angleDeg < 270) {
			// 	emitEvent("forward-left", coordinates);
			// }
		} else {
			// startX = touchX;
			// startY = touchY;
		}
	};
	function handlepointerup(event) {
		if (!isDragging) return;
		isDragging = false;
		window.removeEventListener("pointermove", handlepointerMove, { capture: true });
		node.dispatchEvent(new CustomEvent("stop", { detail: { type: event } }));
		// emitEvent("stop", null);
		startX = 0;
		startY = 0;
	}
	const emitEvent = (event: JoystickEvent, coordinates: { x: number; y: number } | null) => {
		node.dispatchEvent(new CustomEvent("move", { detail: { ...coordinates } }));
	};

	node.addEventListener("pointerdown", handlepointerdown, { capture: true });
	window.addEventListener("pointerup", handlepointerup, { capture: true });

	return {
		destroy() {
			node.removeEventListener("pointerdown", handlepointerdown, { capture: true });
			window.removeEventListener("pointerup", handlepointerup, { capture: true });
		}
	};
}
