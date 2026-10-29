import { useCallback, useEffect, useRef, useState } from "react";

const PREFERENCE_KEY = "codigo-em-cena:som";
const VOLUME = 0.25;
const GESTURES = ["pointerdown", "keydown", "touchend"] as const;

function wantsSound() {
  try {
    return localStorage.getItem(PREFERENCE_KEY) !== "off";
  } catch {
    return true;
  }
}

function rememberSound(on: boolean) {
  try {
    localStorage.setItem(PREFERENCE_KEY, on ? "on" : "off");
  } catch {
    // Private browsing may refuse storage; the choice then lasts for this visit only.
  }
}

// The soundtrack is on by default. Browsers only allow audible playback after a user gesture,
// so a blocked start retries on the visitor's first tap, click or key press.
export function useSoundtrack() {
  const audio = useRef<HTMLAudioElement>(null);
  const toggleButton = useRef<HTMLButtonElement>(null);
  const cancelRetry = useRef(() => {});
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    let disposed = false;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    function retry(event: Event) {
      // The toggle handles its own press, so that press doesn't start and stop the music at once.
      if (disposed || toggleButton.current?.contains(event.target as Node)) return;
      cancelRetry.current();
      void element!.play().catch(() => {});
    }

    cancelRetry.current = () =>
      GESTURES.forEach((type) => window.removeEventListener(type, retry, true));
    element.volume = VOLUME;
    element.addEventListener("play", onPlay);
    element.addEventListener("pause", onPause);

    if (wantsSound()) {
      element.play().catch(() => {
        if (!disposed) GESTURES.forEach((type) => window.addEventListener(type, retry, true));
      });
    }

    return () => {
      disposed = true;
      cancelRetry.current();
      element.removeEventListener("play", onPlay);
      element.removeEventListener("pause", onPause);
      element.pause();
    };
  }, []);

  const toggle = useCallback(() => {
    const element = audio.current;
    if (!element) return;
    cancelRetry.current();
    rememberSound(element.paused);
    if (element.paused) void element.play().catch(() => setPlaying(false));
    else element.pause();
  }, []);

  return { audio, toggleButton, playing, toggle };
}
