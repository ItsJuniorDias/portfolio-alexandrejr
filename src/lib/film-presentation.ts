import chapters from "../data/film-chapters.json";
import { recommendation } from "../data/portfolio";

export type FilmPresentation = {
  time: number;
  width: number;
  height: number;
  scale: number;
  x: number;
  y: number;
  cameraScale: number;
  cameraX: number;
  cameraY: number;
};
let frame: FilmPresentation = {
  time: 0,
  width: 1280,
  height: 720,
  scale: 1,
  x: 0,
  y: 0,
  cameraScale: 1,
  cameraX: 0,
  cameraY: 0,
};
const quoteByTime = [
  { from: 117, key: null },
  { from: 109, key: "quote-2" },
  { from: 101, key: "quote-1" },
  { from: 94, key: "quote-0" },
];
let key = "";
let destination: string | null = null;
const layoutListeners = new Set<() => void>();
const cardListeners = new Set<() => void>();
const navigationListeners = new Set<() => void>();
export const filmPresentation = {
  getFrame: () => frame,
  getKey: () => key,
  getDestination: () => destination,
  setDestination(value: string | null) {
    if (destination === value) return;

    destination = value;
    navigationListeners.forEach((listener) => listener());
  },
  subscribeNavigation(listener: () => void) {
    navigationListeners.add(listener);

    return () => {
      navigationListeners.delete(listener);
    };
  },
  subscribeLayout(listener: () => void) {
    layoutListeners.add(listener);
    return () => {
      layoutListeners.delete(listener);
    };
  },
  subscribeCard(listener: () => void) {
    cardListeners.add(listener);
    return () => {
      cardListeners.delete(listener);
    };
  },
  publish(value: FilmPresentation) {
    frame = value;
    const next =
      quoteByTime.find(({ from }) => value.time >= from)?.key ??
      chapters.find((chapter) => value.time >= chapter.start && value.time < chapter.end)?.id ??
      "";
    const visibleKey = next === "prologo" || next === "epilogo" ? "" : next;
    if (visibleKey !== key) {
      key = visibleKey;
      cardListeners.forEach((listener) => listener());
    }
    layoutListeners.forEach((listener) => listener());
  },
};

const quoteText = [
  recommendation.paragraphs[0],
  recommendation.paragraphs[3],
  "Ele é daqueles talentos que elevam o nível do time por onde passam.",
];
const quoteHeadings = [
  "Compromisso e colaboração",
  "Liderança natural",
  "O valor de quem trabalha junto",
];

export function cardForKey(key: string) {
  if (key.startsWith("quote-")) {
    const index = Number(key.slice(-1));
    return {
      id: key,
      quote: true,
      period: quoteHeadings[index],
      title: "Tarcisio Bezerra",
      description: quoteText[index],
      number: "",
      action: "Ler indicação completa",
      section: "tarcisio",
    };
  }
  const chapter = chapters.find((item) => item.id === key);
  if (!chapter) return null;
  return { ...chapter, quote: false };
}
