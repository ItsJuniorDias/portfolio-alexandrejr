import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { AnimatePresence, motion, useMotionValue, type MotionStyle } from "framer-motion";
import { cardForKey, filmPresentation, type FilmPresentation } from "../lib/film-presentation";
import { FILM } from "../lib/film-camera";
import { clamp } from "../lib/timeline";
import { recommendation } from "../data/portfolio";

// Where each card sits in the film's own pixels, over the plates removed from the video.
const slots = {
  chapter: { x: 164, y: 570, width: 660 },
  letter: { x: 197, y: 215, width: 886 },
};
const TOOLBAR_GAP = 12;

type Slot = (typeof slots)[keyof typeof slots];
type LayoutMode = "mobile" | "landscape" | "stage";
type Layout = { left: number; top: number; width: number; fontScale: number };

const layouts: Record<LayoutMode, (frame: FilmPresentation, slot: Slot) => Layout> = {
  mobile: (frame) => ({ left: 16, top: frame.height - 140, width: frame.width - 32, fontScale: 1 }),
  landscape: (frame) => ({ left: frame.width - 320, top: 16, width: 300, fontScale: 1 }),
  stage: (frame, slot) => ({
    left: frame.x + slot.x * frame.scale,
    top: frame.y + (slot.y - FILM.cropTop) * frame.scale,
    width: slot.width * frame.scale,
    fontScale: clamp(frame.scale, 1, 1.65),
  }),
};

function layoutMode(frame: FilmPresentation): LayoutMode {
  if (frame.width <= 700) return "mobile";
  if (frame.width < 950 && frame.height < 500) return "landscape";
  return "stage";
}

const recommender = {
  role: recommendation.headlineVisible.split(" | ")[0],
  date: recommendation.date.split("-").reverse().join("."),
};

export default function FilmCards({
  reduced,
  onOpen,
  toolbar,
}: {
  reduced: boolean;
  onOpen: (section: string) => void;
  toolbar: RefObject<HTMLElement | null>;
}) {
  const key = useSyncExternalStore(
    filmPresentation.subscribeCard,
    filmPresentation.getKey,
    () => "",
  );
  const card = cardForKey(key);
  const anchor = useRef<HTMLDivElement>(null);
  const left = useMotionValue(0);
  const top = useMotionValue(0);
  const width = useMotionValue(660);
  const fontScale = useMotionValue(1);
  const quote = card?.quote ?? false;

  useEffect(() => {
    function update() {
      const frame = filmPresentation.getFrame();
      const mode = layoutMode(frame);
      const layout = layouts[mode](frame, quote ? slots.letter : slots.chapter);
      // On the stage the card follows the film but never slides under the toolbar.
      const floor =
        (toolbar.current?.offsetTop ?? frame.height) -
        TOOLBAR_GAP -
        (anchor.current?.offsetHeight ?? 0);
      left.set(layout.left);
      top.set(mode === "stage" ? Math.max(TOOLBAR_GAP, Math.min(layout.top, floor)) : layout.top);
      width.set(layout.width);
      fontScale.set(layout.fontScale);
    }
    update();
    const resize = new ResizeObserver(update);
    if (anchor.current) resize.observe(anchor.current);
    const unsubscribe = filmPresentation.subscribeLayout(update);
    return () => {
      unsubscribe();
      resize.disconnect();
    };
  }, [left, top, width, fontScale, quote, toolbar]);

  return (
    <motion.div
      ref={anchor}
      className={`coded-card-anchor ${quote ? "is-letter" : ""}`}
      style={{ left, top, width, "--card-scale": fontScale } as MotionStyle}
    >
      <AnimatePresence mode="wait">
        {card && (
          <motion.article
            key={card.id}
            className={`coded-card ${card.quote ? "coded-letter" : ""}`}
            initial={reduced ? false : { opacity: 0, y: 18, rotateX: -4 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: reduced ? 0 : 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="coded-pin left" aria-hidden="true" />
            <span className="coded-pin right" aria-hidden="true" />
            <div className="coded-card-top">
              <span>{card.period}</span>
              <span>{card.number}</span>
            </div>
            {card.quote ? (
              <>
                <blockquote>{card.description}</blockquote>
                <div className="coded-letter-footer">
                  <div>
                    <strong>{recommendation.author}</strong>
                    <p>
                      {recommender.role} · {recommender.date}
                    </p>
                    <p>{recommendation.relationship}</p>
                  </div>
                  <button onClick={() => onOpen(card.section)}>{card.action}</button>
                </div>
              </>
            ) : (
              <>
                <h2>{card.title}</h2>
                <p>{card.description}</p>
                <button onClick={() => onOpen(card.section)}>
                  {card.action} <span aria-hidden="true">↗</span>
                </button>
              </>
            )}
          </motion.article>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
