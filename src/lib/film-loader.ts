type FilmLoaderOptions = {
  signal: AbortSignal;
  onInteractionRequired: (required: boolean) => void;
  timeoutMs?: number;
  promptAfterMs?: number;
};

/** Decode one MP4 frame without waiting for the whole film or Pixi's WebM alpha probe. */
export function prepareFilmVideo(video: HTMLVideoElement, options: FilmLoaderOptions) {
  const { signal, onInteractionRequired, timeoutMs = 30_000, promptAfterMs = 4_000 } = options;
  let settled = false;
  let playing = false;
  let activate = () => {};

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  const ready = new Promise<void>((resolve, reject) => {
    const events = ["loadeddata", "canplay", "seeked", "playing"];
    const prompt = setTimeout(() => onInteractionRequired(true), promptAfterMs);
    const timeout = setTimeout(
      () => finish(new Error("Film did not decode its first frame within the loading deadline")),
      timeoutMs,
    );

    function cleanup() {
      clearTimeout(prompt);
      clearTimeout(timeout);
      events.forEach((event) => video.removeEventListener(event, check));
      video.removeEventListener("error", failed);
      signal.removeEventListener("abort", aborted);
    }

    function finish(error?: Error) {
      if (settled) return;

      settled = true;
      cleanup();
      video.pause();

      if (error) reject(error);
      else {
        onInteractionRequired(false);
        resolve();
      }
    }

    function check() {
      if (video.error) {
        failed();
      } else if (
        video.readyState >= 2 &&
        !video.seeking &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        finish();
      }
    }

    function failed() {
      finish(new Error(`Film decode failed (media error ${video.error?.code ?? "unknown"})`));
    }

    function aborted() {
      finish(new DOMException("Film loading cancelled", "AbortError"));
    }

    // Called directly by the touch/click handler, before any await, for iOS activation.
    activate = () => {
      if (settled || playing) return;

      playing = true;
      void video.play().then(
        () => {
          playing = false;
          check();
          if (settled) video.pause();
        },
        (error: unknown) => {
          playing = false;
          if (settled) return;

          if (error instanceof Error && error.name === "NotAllowedError") {
            onInteractionRequired(true);
          } else if (error instanceof Error && error.name === "NotSupportedError") {
            finish(error);
          }
        },
      );
    };

    events.forEach((event) => video.addEventListener(event, check));
    video.addEventListener("error", failed);
    signal.addEventListener("abort", aborted, { once: true });

    if (signal.aborted) {
      aborted();
      return;
    }

    check();

    if (!settled) {
      if (video.readyState === 0) video.load();
      activate();
    }
  });

  return { ready, activate: () => activate() };
}
