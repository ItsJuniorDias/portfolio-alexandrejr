import { cueIndexAt, clamp } from "./timeline";

let progress = 0;
let index = 0;
const sceneListeners = new Set<() => void>();
const cueListeners = new Set<() => void>();

export const scrollStore = {
  getProgress: () => progress,
  getIndex: () => index,
  subscribeScene(listener: () => void) {
    sceneListeners.add(listener);
    return () => {
      sceneListeners.delete(listener);
    };
  },
  subscribeCue(listener: () => void) {
    cueListeners.add(listener);
    return () => {
      cueListeners.delete(listener);
    };
  },
  update(value: number) {
    progress = clamp(value);
    const next = cueIndexAt(progress);

    if (next !== index) {
      index = next;
      cueListeners.forEach((listener) => listener());
    }

    sceneListeners.forEach((listener) => listener());
  },
};
