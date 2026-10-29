import { useEffect, useSyncExternalStore } from "react";
import { scrollStore } from "./scroll-store";
import { filmPresentation } from "./film-presentation";
import { cueIndexAt } from "./timeline";

const reducedQuery = "(prefers-reduced-motion: reduce)";

function subscribeMotion(listener: () => void) {
  const media = window.matchMedia(reducedQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(reducedQuery).matches,
    () => false,
  );
}

export function useScrollDirector() {
  const index = useSyncExternalStore(
    filmPresentation.subscribeCard,
    () => cueIndexAt(filmPresentation.getFrame().time / 120),
    () => 0,
  );

  useEffect(() => {
    let frame = 0;

    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      scrollStore.update(progress);
      document.documentElement.style.setProperty("--scroll-progress", String(progress));
      document.documentElement.style.setProperty(
        "--intro-opacity",
        String(Math.max(0, 1 - progress / 0.07)),
      );
      frame = 0;
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return index;
}
