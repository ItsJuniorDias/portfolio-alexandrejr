import { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useMotionValue, type MotionStyle } from "framer-motion";
import { cardForKey, filmPresentation } from "../lib/film-presentation";
import { FILM } from "../lib/film-camera";

export default function FilmCards({
  reduced,
  onOpen,
}: {
  reduced: boolean;
  onOpen: (section: string) => void;
}) {
  const key = useSyncExternalStore(
    filmPresentation.subscribeCard,
    filmPresentation.getKey,
    () => "",
  );
  const card = cardForKey(key);
  const left = useMotionValue(0);
  const top = useMotionValue(0);
  const width = useMotionValue(660);
  const fontScale = useMotionValue(1);
  const quote = card?.quote ?? false;

  useEffect(() => {
    function update() {
      const frame = filmPresentation.getFrame();
      const mobile = frame.width <= 700;
      const landscape = frame.width >= 700 && frame.width < 950 && frame.height < 500;
      const sourceX = quote ? 197 : 164;
      const sourceY = quote ? 215 : 570;
      const sourceWidth = quote ? 886 : 660;
      left.set(mobile ? 16 : landscape ? frame.width - 320 : frame.x + sourceX * frame.scale);
      top.set(
        mobile
          ? frame.height - 140
          : landscape
            ? 16
            : frame.y + (sourceY - FILM.cropTop) * frame.scale,
      );
      width.set(mobile ? frame.width - 32 : landscape ? 300 : sourceWidth * frame.scale);
      fontScale.set(mobile || landscape ? 1 : Math.max(1, Math.min(frame.scale, 1.65)));
    }
    update();
    return filmPresentation.subscribeLayout(update);
  }, [left, top, width, fontScale, quote]);

  return (
    <motion.div
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
                    <strong>Tarcisio Bezerra</strong>
                    <p>Engenheiro de Software Sênior · 14.10.2025</p>
                    <p>Trabalhou com Alexandre na mesma equipe</p>
                  </div>
                  <button onClick={() => onOpen("tarcisio")}>{card.action}</button>
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
