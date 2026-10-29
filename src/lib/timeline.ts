import chapters from "../data/film-chapters.json";

export type SceneKind =
  | "intro"
  | "retail"
  | "finance"
  | "travel"
  | "education"
  | "music"
  | "game"
  | "security"
  | "letter"
  | "contact";
export type Cue = {
  id: string;
  act: number;
  start: number;
  end: number;
  kind: SceneKind;
  section: string;
  title: string;
  subtitle: string;
  label: string;
};
const kinds: Record<string, SceneKind> = {
  prologo: "intro",
  bizstore: "retail",
  dxco: "retail",
  inmetrics: "finance",
  rethink: "travel",
  datum: "finance",
  "formacao-intro": "education",
  fatec: "education",
  rocketseat: "education",
  cambly: "education",
  spotify: "music",
  "solo-game": "game",
  "sistemas-intro": "finance",
  teddy: "finance",
  t10: "security",
  jungle: "game",
  "tarcisio-intro": "letter",
  tarcisio: "letter",
  epilogo: "contact",
};
const actByStart = [
  { from: 86, act: 4 },
  { from: 57, act: 3 },
  { from: 27, act: 2 },
  { from: 0, act: 1 },
];
export const cues: Cue[] = chapters.map((chapter) => ({
  id: chapter.id,
  act: actByStart.find(({ from }) => chapter.start >= from)?.act ?? 1,
  start: chapter.start / 120,
  end: chapter.end / 120,
  kind: kinds[chapter.id],
  section: chapter.section,
  title: chapter.title,
  subtitle: chapter.description,
  label: chapter.title,
}));
export const actNames = [
  "",
  "Trajetória",
  "Formação e projetos",
  "Sistemas e jogos",
  "Uma carta de confiança",
];
export function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}
export function smoothstep(start: number, end: number, value: number) {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}
export function cueIndexAt(progress: number) {
  const value = clamp(Number.isFinite(progress) ? progress : 0);
  const index = cues.findIndex((cue) => value >= cue.start && value < cue.end);
  return index < 0 ? cues.length - 1 : index;
}
export function cueAt(progress: number) {
  return cues[cueIndexAt(progress)];
}
export function localProgress(progress: number, cue: Cue) {
  return clamp((progress - cue.start) / (cue.end - cue.start));
}
export function scrollToCue(id: string, reducedMotion = false) {
  const aliases: Record<string, string> = {
    contato: "epilogo",
    formacao: "fatec",
    jogo: "solo-game",
  };
  const cue = cues.find((item) => item.id === (aliases[id] ?? id));
  if (!cue) return;
  const progress = cue.id === "prologo" ? 0 : cue.start + (cue.end - cue.start) * 0.35;
  window.dispatchEvent(
    new CustomEvent("film:navigate", {
      detail: { progress, reducedMotion, label: cue.label },
    }),
  );
}
