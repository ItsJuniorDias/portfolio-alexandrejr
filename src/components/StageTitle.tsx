import { useEffect, useId } from "react";
import { motion, useMotionValue } from "framer-motion";
import { filmPresentation } from "../lib/film-presentation";
import { titleAt } from "../lib/stage-title";

export default function StageTitle() {
  const pathId = useId();
  const left = useMotionValue(0);
  const top = useMotionValue(0);
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const opacity = useMotionValue(0);

  useEffect(() => {
    function update() {
      const frame = filmPresentation.getFrame();
      const title = titleAt(frame.time);
      const scale = frame.cameraScale / 1.5;

      left.set(frame.cameraX + title.x * scale);
      top.set(frame.cameraY + (title.y - 8) * scale);
      width.set(title.width * scale);
      height.set(title.width * scale * (70 / 320));
      opacity.set(title.visible ? 1 : 0);
    }

    update();

    return filmPresentation.subscribeLayout(update);
  }, [left, top, width, height, opacity]);

  return (
    <motion.svg
      className="stage-title"
      viewBox="0 0 320 70"
      style={{ left, top, width, height, opacity }}
      role="img"
      aria-label="Código em Cena"
    >
      <defs>
        <path id={pathId} d="M 12 56 Q 160 25 308 56" />
      </defs>
      <text textAnchor="middle" fontSize="34" textLength="266" lengthAdjust="spacingAndGlyphs">
        <textPath href={`#${pathId}`} startOffset="50%">
          CÓDIGO EM CENA
        </textPath>
      </text>
    </motion.svg>
  );
}
