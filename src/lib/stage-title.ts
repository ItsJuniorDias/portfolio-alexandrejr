import track from "../data/stage-title.json";
import { clamp } from "./timeline";

export function titleAt(time: number) {
  const visible = track.windows.some(([start, end]) => time >= start && time <= end);
  const nextIndex = track.keys.findIndex(([timestamp]) => timestamp >= time);
  const next = track.keys[nextIndex < 0 ? track.keys.length - 1 : nextIndex];
  const previous = track.keys[Math.max(0, nextIndex - 1)];
  const mix = next[0] === previous[0] ? 1 : clamp((time - previous[0]) / (next[0] - previous[0]));
  const interpolate = (index: number) => previous[index] + (next[index] - previous[index]) * mix;

  return {
    visible,
    x: interpolate(1),
    y: interpolate(2),
    width: interpolate(3),
    height: interpolate(4),
  };
}
