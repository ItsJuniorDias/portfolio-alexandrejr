export type NavigationRequest = { progress: number; reducedMotion: boolean; label: string };
type Stage = { navigate: (request: NavigationRequest) => void; stop: () => void };

let stage: Stage | null = null;

// The film stage registers itself; menus and buttons steer it without knowing the renderer.
export const filmNavigation = {
  attach(next: Stage) {
    stage = next;
    return () => {
      if (stage === next) stage = null;
    };
  },
  navigate(request: NavigationRequest) {
    stage?.navigate(request);
  },
  stop() {
    stage?.stop();
  },
};
