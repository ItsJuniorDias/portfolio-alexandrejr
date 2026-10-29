import test from "node:test";
import assert from "node:assert/strict";
import chapters from "../src/data/film-chapters.json" with { type: "json" };
import curriculum from "../src/data/curriculum.json" with { type: "json" };
import { FILM } from "../src/lib/film-camera.ts";
import { filmPresentation } from "../src/lib/film-presentation.ts";
import { cues } from "../src/lib/timeline.ts";

// Mirrors the data-section anchors rendered by src/components/Program.tsx.
const programSections = new Set([
  "sobre",
  "trajetoria",
  "formacao",
  "projetos",
  "tarcisio",
  ...curriculum.experiences.map((item) => item.id),
  ...curriculum.projects.map((item) => item.id),
]);

test("chapters cover the whole film without gaps or overlaps", () => {
  assert.equal(chapters[0].start, 0);
  assert.equal(chapters.at(-1).end, FILM.duration);
  chapters
    .slice(1)
    .forEach((chapter, index) => assert.equal(chapter.start, chapters[index].end, chapter.id));
});

test("every chapter opens a section that exists in the program", () => {
  for (const chapter of chapters) {
    assert.ok(programSections.has(chapter.section), `${chapter.id} → ${chapter.section}`);
  }
});

test("jumping between chapters without cards still announces the new chapter", () => {
  const frame = {
    width: 1280,
    height: 656,
    scale: 1,
    x: 0,
    y: 0,
    cameraScale: 1,
    cameraX: 0,
    cameraY: 0,
  };
  let notified = 0;
  const unsubscribe = filmPresentation.subscribeChapter(() => notified++);

  filmPresentation.publish({ ...frame, time: 0 });
  filmPresentation.publish({ ...frame, time: 118 });
  unsubscribe();

  assert.equal(filmPresentation.getKey(), "");
  assert.equal(chapters[filmPresentation.getChapterIndex()].id, "epilogo");
  assert.equal(notified, 1);
});

test("every cue has a scene kind and acts never go backwards", () => {
  for (const cue of cues) assert.ok(cue.kind, `${cue.id} has no scene kind`);
  cues.slice(1).forEach((cue, index) => assert.ok(cue.act >= cues[index].act, cue.id));
  assert.deepEqual([...new Set(cues.map((cue) => cue.act))], [1, 2, 3, 4]);
});
