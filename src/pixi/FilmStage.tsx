import { useEffect, useRef } from "react";
import { Application, Container, Rectangle, Sprite, Texture, VideoSource } from "pixi.js";
import { scrollStore } from "../lib/scroll-store";
import { cameraTransform, FILM, frameTime, immersionAt, smoothFilmTime } from "../lib/film-camera";
import { filmPresentation } from "../lib/film-presentation";

export default function FilmStage({
  zoom,
  cameraEnabled,
  reduced,
  onReady,
  onFailure,
}: {
  zoom: number;
  cameraEnabled: boolean;
  reduced: boolean;
  onReady: () => void;
  onFailure: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef({ zoom: 1, automatic: true, reduced: false });
  const redraw = useRef<(() => void) | null>(null);
  useEffect(() => {
    controls.current = { zoom, automatic: cameraEnabled && !reduced, reduced };
    redraw.current?.();
  }, [zoom, cameraEnabled, reduced]);

  useEffect(() => {
    const target = host.current;
    if (!target) return;
    let disposed = false;
    let appReady = false;
    let unsubscribe = () => {};
    let observer: ResizeObserver | undefined;
    let source: VideoSource | undefined;
    let desired = frameTime(scrollStore.getProgress());
    let visualTime = desired;
    let navigationTarget: number | null = null;
    let pendingFrame = 0;
    let previousTimestamp = 0;
    let presented = false;
    let presentationFrame = 0;
    const app = new Application();
    const camera = new Container({ label: "cinematic-camera-2d" });
    const video = document.createElement("video");
    video.src = "/assets/film/codigo-em-cena-no-text.mp4";
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("aria-hidden", "true");
    video.className = "film-source";
    target.appendChild(video);

    function draw() {
      if (disposed || !appReady) return;
      const bounds = target!.getBoundingClientRect();
      const immersion = controls.current.reduced ? 0 : immersionAt(visualTime);
      document.documentElement.style.setProperty("--film-immersion", immersion.toFixed(4));
      const contentMode = bounds.width <= 700 ? "cover" : "contain";
      const transform = cameraTransform(
        bounds.width,
        bounds.height,
        visualTime,
        controls.current.zoom,
        controls.current.automatic,
        contentMode,
      );
      const readableFrame = cameraTransform(bounds.width, bounds.height, visualTime, 1, false);
      camera.scale.set(transform.scale);
      camera.position.set(transform.x, transform.y);
      app.render();
      filmPresentation.publish({
        time: video.currentTime,
        width: bounds.width,
        height: bounds.height,
        ...readableFrame,
        cameraScale: transform.scale,
        cameraX: transform.x,
        cameraY: transform.y,
      });
      target!.dataset.frame = String(Math.round(video.currentTime * FILM.fps));
      target!.dataset.cameraDepth = transform.scale.toFixed(4);
      target!.dataset.immersion = immersion.toFixed(4);
      target!.dataset.contentMode = contentMode;
      target!.dataset.dpr = "3";
      target!.dataset.playbackRate = navigationTarget === null ? "1" : "1.5";
    }
    function seek() {
      if (disposed || video.readyState < 2 || video.seeking) return;
      const position = Math.round(visualTime * FILM.fps) / FILM.fps;
      if (Math.abs(video.currentTime - position) > 1 / (FILM.fps * 2)) video.currentTime = position;
    }
    function animate(timestamp: number) {
      pendingFrame = 0;
      if (disposed) return;
      const delta = previousTimestamp ? (timestamp - previousTimestamp) / 1000 : 1 / 60;
      previousTimestamp = timestamp;
      visualTime = smoothFilmTime(
        visualTime,
        desired,
        delta,
        controls.current.reduced,
        navigationTarget === null ? 1 : 1.5,
      );

      if (navigationTarget !== null) {
        syncScroll();

        if (Math.abs(visualTime - navigationTarget) < 1 / 96) {
          visualTime = navigationTarget;
          syncScroll();
          navigationTarget = null;
          filmPresentation.setDestination(null);
        }
      }
      seek();
      draw();
      if (Math.abs(visualTime - desired) > 1 / 96 || video.seeking)
        pendingFrame = requestAnimationFrame(animate);
      else {
        visualTime = desired;
        previousTimestamp = 0;
        seek();
        draw();
      }
    }
    function schedule() {
      if (!pendingFrame) pendingFrame = requestAnimationFrame(animate);
    }
    function seeked() {
      if (!disposed) {
        source?.update();
        draw();
        if (!presented && video.readyState >= 2) {
          presented = true;
          onReady();
        }
        schedule();
      }
    }
    function decoded() {
      if (disposed || !source || video.readyState < 2) return;

      if (video.seeking) return;

      if (!presented && Math.abs(video.currentTime - visualTime) > 1 / (FILM.fps * 2)) {
        seek();
        return;
      }

      cancelAnimationFrame(presentationFrame);
      presentationFrame = requestAnimationFrame(() => {
        if (disposed) return;
        source?.update();
        draw();
        if (!presented) {
          presented = true;
          onReady();
        }
        schedule();
      });
    }
    function scroll() {
      if (navigationTarget !== null) return;

      desired = frameTime(scrollStore.getProgress());

      if (!presented) visualTime = desired;

      schedule();
    }

    function syncScroll() {
      const progress = visualTime / FILM.lastTime;
      const max = document.documentElement.scrollHeight - window.innerHeight;

      window.scrollTo({ top: max * progress, behavior: "instant" });
      scrollStore.update(progress);
    }

    function navigate(event: Event) {
      const { progress, reducedMotion, label } = (
        event as CustomEvent<{ progress: number; reducedMotion: boolean; label: string }>
      ).detail;

      desired = frameTime(progress);
      navigationTarget = desired;
      filmPresentation.setDestination(label);
      previousTimestamp = 0;

      if (reducedMotion) {
        visualTime = desired;
        syncScroll();
        navigationTarget = null;
        filmPresentation.setDestination(null);
        seek();
      }

      schedule();
    }

    function cancelNavigation() {
      if (navigationTarget === null) return;

      navigationTarget = null;
      desired = visualTime;
      filmPresentation.setDestination(null);
      syncScroll();
    }

    function keyNavigation(event: KeyboardEvent) {
      if (
        ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Escape"].includes(
          event.key,
        )
      ) {
        cancelNavigation();
      }
    }
    function resize() {
      if (appReady && !disposed) {
        app.renderer.resize(target!.clientWidth, target!.clientHeight);
        draw();
      }
    }

    async function setup() {
      try {
        await app.init({
          width: target!.clientWidth,
          height: target!.clientHeight,
          backgroundAlpha: 0,
          antialias: true,
          resolution: 3,
          autoDensity: true,
          autoStart: false,
          sharedTicker: false,
          preference: "webgl",
        });
        if (disposed) {
          app.destroy(true);
          return;
        }
        appReady = true;
        app.canvas.setAttribute("aria-hidden", "true");
        target!.appendChild(app.canvas);
        draw();
        source = new VideoSource({
          resource: video,
          autoPlay: false,
          autoLoad: false,
          muted: true,
          playsinline: true,
          preload: true,
          updateFPS: 24,
          scaleMode: "linear",
        });
        source.autoUpdate = false;
        await source.load();
        if (disposed) return;
        if (video.readyState < 2)
          await new Promise<void>((resolve, reject) => {
            video.addEventListener("loadeddata", () => resolve(), { once: true });
            video.addEventListener("error", () => reject(new Error("Video decode failed")), {
              once: true,
            });
          });
        if (disposed) return;
        const sourceScale = video.videoWidth / FILM.width;
        const planes = [
          { name: "upper-architecture", y: 64, height: 106 },
          { name: "scenery-and-moving-props", y: 170, height: 400 },
          { name: "lower-scenery", y: 570, height: 110 },
          { name: "stage-floor", y: 680, height: 40 },
        ];
        for (const plane of planes) {
          const texture = new Texture({
            source,
            frame: new Rectangle(
              0,
              (plane.y - FILM.cropTop) * sourceScale,
              FILM.width * sourceScale,
              plane.height * sourceScale,
            ),
          });
          const sprite = new Sprite({ texture, label: plane.name });
          sprite.position.set(0, plane.y - FILM.cropTop);
          sprite.width = FILM.width;
          sprite.height = plane.height;
          camera.addChild(sprite);
        }
        app.stage.addChild(camera);
        video.pause();
        video.addEventListener("seeked", seeked);
        video.addEventListener("loadeddata", decoded);
        video.addEventListener("canplay", decoded);
        video.addEventListener("error", onFailure);
        observer = new ResizeObserver(resize);
        observer.observe(target!);
        unsubscribe = scrollStore.subscribeScene(scroll);
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const initialProgress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;

        desired = frameTime(initialProgress);
        visualTime = desired;
        scrollStore.update(initialProgress);
        seek();

        window.addEventListener("film:navigate", navigate);
        window.addEventListener("film:stop", cancelNavigation);
        window.addEventListener("wheel", cancelNavigation, { passive: true });
        window.addEventListener("touchstart", cancelNavigation, { passive: true });
        window.addEventListener("pointerdown", cancelNavigation, { passive: true });
        window.addEventListener("keydown", keyNavigation);
        redraw.current = draw;
        decoded();
      } catch (error) {
        if (!disposed) {
          console.error("Film renderer:", error);
          onFailure();
        }
      }
    }
    void setup();
    return () => {
      disposed = true;
      unsubscribe();
      window.removeEventListener("film:navigate", navigate);
      window.removeEventListener("film:stop", cancelNavigation);
      window.removeEventListener("wheel", cancelNavigation);
      window.removeEventListener("touchstart", cancelNavigation);
      window.removeEventListener("pointerdown", cancelNavigation);
      window.removeEventListener("keydown", keyNavigation);
      filmPresentation.setDestination(null);
      observer?.disconnect();
      cancelAnimationFrame(pendingFrame);
      cancelAnimationFrame(presentationFrame);
      redraw.current = null;
      video.removeEventListener("seeked", seeked);
      video.removeEventListener("loadeddata", decoded);
      video.removeEventListener("canplay", decoded);
      video.removeEventListener("error", onFailure);
      video.pause();
      source?.destroy();
      video.removeAttribute("src");
      video.load();
      video.remove();
      if (appReady) app.destroy(true, { children: true, texture: true, textureSource: false });
    };
  }, [onReady, onFailure]);

  return (
    <div
      ref={host}
      className="pixi-film"
      role="img"
      aria-label="Cenário original animado, com câmera cinematográfica controlada pelo scroll"
    />
  );
}
