import { browser } from "$app/environment";

type Task = {
    start: ()=>void;
    remove: ()=>void;
}
const tasks = new Set<(now: number) => void>()
// const tasks: Task[] = []
export const frameLoop = requestFrame();

function requestFrame() {
    let frame: number;
    let running = false;
    let lastTs: number;
    const run = (now: number) => {
        if (!lastTs) lastTs = now;
        const lastLap = now - lastTs;
        // if (frame) cancelAnimationFrame(frame)

        if (lastLap > 16) {
            lastTs = now;
            const iter = tasks.values();
            let node: ReturnType<typeof iter.next> = iter.next();
            while (!node.done) {
                node.value(lastLap);
                node = iter.next();
            }
        }
        frame = requestAnimationFrame(run);
    }

    return {add: (cb: (now: number) => void) =>({
        start: function ()  {tasks.add(cb); if (!running) {running = true; frame = requestAnimationFrame(run)}; return this},
        stop: function (){tasks.delete(cb); if (tasks.size < 1) {running = false; cancelAnimationFrame(frame)}; return this}
    }),
    dispose: ()=> {
        cancelAnimationFrame(frame)
        tasks.clear()
    }
}
}