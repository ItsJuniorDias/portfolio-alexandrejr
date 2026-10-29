import { clamp, smoothstep } from "./timeline";

export const FILM = {
  width: 1280,
  height: 720,
  cropTop: 64,
  duration: 120,
  fps: 24,
  lastTime: 119 + 23 / 24,
  pixelsPerSecond: 200,
};
const cameraKeys = [
  { time: 0, z: 0, x: 0.5, y: 0.58 },
  { time: 4, z: 0, x: 0.5, y: 0.58 },
  { time: 9, z: 55, x: 0.51, y: 0.52 },
  { time: 14, z: 82, x: 0.5, y: 0.48 },
  { time: 20, z: 65, x: 0.54, y: 0.5 },
  { time: 28, z: 0, x: 0.5, y: 0.58 },
  { time: 32, z: 0, x: 0.5, y: 0.58 },
  { time: 38, z: 48, x: 0.51, y: 0.61 },
  { time: 46, z: 75, x: 0.5, y: 0.48 },
  { time: 53, z: 55, x: 0.53, y: 0.6 },
  { time: 59, z: 0, x: 0.5, y: 0.58 },
  { time: 64, z: 0, x: 0.5, y: 0.58 },
  { time: 73, z: 60, x: 0.51, y: 0.51 },
  { time: 81, z: 78, x: 0.5, y: 0.52 },
  { time: 89, z: 0, x: 0.5, y: 0.58 },
  { time: 120, z: 0, x: 0.5, y: 0.58 },
];

export function immersionAt(time: number) {
  return Math.max(
    ...[
      [3, 27],
      [33, 57],
      [63, 87],
    ].map(
      ([start, end]) =>
        smoothstep(start, start + 2.5, time) * (1 - smoothstep(end - 2.5, end, time)),
    ),
  );
}

export function cameraAt(time: number, enabled = true) {
  if (!enabled) return { z: 0, x: 0.5, y: 0.58 };
  const bounded = clamp(time, 0, 120);
  const index = cameraKeys.findIndex((key) => key.time >= bounded);
  const next = cameraKeys[index < 0 ? cameraKeys.length - 1 : index];
  const previous = cameraKeys[Math.max(0, index - 1)];
  const t = next.time === previous.time ? 1 : smoothstep(previous.time, next.time, bounded);
  return {
    z: previous.z + (next.z - previous.z) * t,
    x: previous.x + (next.x - previous.x) * t,
    y: previous.y + (next.y - previous.y) * t,
  };
}

export function frameTime(progress: number) {
  return Math.round(clamp(progress) * (FILM.duration * FILM.fps - 1)) / FILM.fps;
}

export function smoothFilmTime(
  current: number,
  desired: number,
  delta: number,
  reduced = false,
  playbackRate = 1,
) {
  if (reduced || Math.abs(desired - current) < 1 / 96) return desired;

  // A second of animation takes a second of wall time, like normal MP4 playback.
  const distance = desired - current;
  const step = Math.min(Math.abs(distance), Math.max(0, Math.min(delta, 0.1)) * playbackRate);

  return current + Math.sign(distance) * step;
}

export function cameraTransform(
  width: number,
  height: number,
  time: number,
  zoom = 1,
  automatic = true,
  contentMode: "contain" | "cover" = "contain",
) {
  const sourceHeight = FILM.height - FILM.cropTop;
  // Portrait uses a full-height crop; the dolly remains a separate cinematic movement.
  const fit = contentMode === "cover" ? Math.max : Math.min;
  const base = fit(width / FILM.width, height / sourceHeight);
  const key = cameraAt(time, automatic);
  const scale = base * zoom * (1000 / (1000 - key.z));
  const renderedWidth = FILM.width * scale;
  const renderedHeight = sourceHeight * scale;
  const x = width / 2 - renderedWidth / 2 - (key.x - 0.5) * renderedWidth;
  const y = height - sourceHeight * base - (renderedHeight - sourceHeight * base) * key.y;
  return {
    scale,
    x: renderedWidth <= width ? (width - renderedWidth) / 2 : clamp(x, width - renderedWidth, 0),
    y: clamp(y, Math.min(0, height - renderedHeight), height - renderedHeight),
  };
}
