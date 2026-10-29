import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  FILM,
  cameraTransform,
  frameTime,
  immersionAt,
  smoothFilmTime,
} from "../src/lib/film-camera.ts";
import { filmPresentation, cardForKey } from "../src/lib/film-presentation.ts";
import { recommendation } from "../src/data/portfolio.ts";
import { titleAt } from "../src/lib/stage-title.ts";

test("scroll advances one second of film per elapsed second, forwards and backwards", () => {
  for (const fps of [24, 30, 60, 120]) {
    let forward = 5;
    let reverse = 5;

    for (let frame = 0; frame < fps; frame++) {
      forward = smoothFilmTime(forward, 20, 1 / fps);
      reverse = smoothFilmTime(reverse, 0, 1 / fps);
    }

    assert.ok(Math.abs(forward - 6) < 0.001);
    assert.ok(Math.abs(reverse - 4) < 0.001);
  }

  assert.equal(smoothFilmTime(5, 5, 1 / 60), 5);
  assert.equal(smoothFilmTime(5, 20, 1 / 60, true), 20);
});

test("scrubbing cannot seek outside decoded film frames", () => {
  assert.equal(frameTime(-1), 0);
  assert.equal(frameTime(2), FILM.lastTime);
  assert.equal(frameTime(1), 2879 / 24);
});

test("menu travel plays at 1.5x in either direction and stops at its destination", () => {
  let forward = 5;
  let reverse = 20;

  for (let frame = 0; frame < 120; frame++) {
    forward = smoothFilmTime(forward, 102, 1 / 60, false, 1.5);
    reverse = smoothFilmTime(reverse, 0, 1 / 60, false, 1.5);
  }

  assert.ok(Math.abs(forward - 8) < 0.001);
  assert.ok(Math.abs(reverse - 17) < 0.001);
  assert.equal(smoothFilmTime(5, 5.02, 1 / 30, false, 1.5), 5.02);
});

test("contain preserves aspect ratio and anchors the stage to the bottom", () => {
  for (const [width, height] of [
    [1440, 830],
    [390, 732],
    [1920, 700],
  ]) {
    const pose = cameraTransform(width, height, 0, 1, false);
    const renderedWidth = FILM.width * pose.scale;
    const renderedHeight = (FILM.height - FILM.cropTop) * pose.scale;

    assert.ok(renderedWidth <= width + 0.001);
    assert.ok(renderedHeight <= height + 0.001);
    assert.ok(Math.abs(pose.y + renderedHeight - height) < 0.001);
    assert.ok(Math.abs(pose.x + renderedWidth / 2 - width / 2) < 0.001);
  }

  assert.equal(immersionAt(0), 0);
  assert.equal(immersionAt(12), 1);
  assert.equal(immersionAt(102), 0);
});

test("portrait cover fills every edge throughout camera movement without stretching", () => {
  for (const [width, height] of [
    [320, 464],
    [390, 740],
    [390, 844],
    [430, 932],
  ]) {
    for (let time = 0; time <= FILM.duration; time += 0.5) {
      for (const automatic of [true, false]) {
        const pose = cameraTransform(width, height, time, 1, automatic, "cover");
        const right = pose.x + FILM.width * pose.scale;
        const bottom = pose.y + (FILM.height - FILM.cropTop) * pose.scale;

        assert.ok(pose.x <= 0.001 && pose.y <= 0.001);
        assert.ok(right >= width - 0.001 && bottom >= height - 0.001);
      }
    }
  }
});

test("recommendation cards follow the displayed film, including reverse scrubbing", () => {
  const publish = (time) =>
    filmPresentation.publish({
      time,
      width: 1280,
      height: 656,
      scale: 1,
      x: 0,
      y: 0,
      cameraScale: 1,
      cameraX: 0,
      cameraY: 0,
    });

  for (const [time, key] of [
    [95, "quote-0"],
    [102, "quote-1"],
    [112, "quote-2"],
    [95, "quote-0"],
    [119, ""],
  ]) {
    publish(time);
    assert.equal(filmPresentation.getKey(), key);
  }

  assert.equal(cardForKey("quote-0").description, recommendation.paragraphs[0]);
  assert.equal(cardForKey("quote-1").description, recommendation.paragraphs[3]);
  assert.equal(cardForKey("quote-2").section, "tarcisio");
});

test("coded stage title leaves and returns with the filmed camera", () => {
  assert.equal(titleAt(0).visible, true);
  assert.equal(titleAt(12).visible, false);
  assert.equal(titleAt(21).visible, true);
  assert.equal(titleAt(40).visible, false);
  assert.equal(titleAt(102).visible, true);
  assert.ok(titleAt(21.25).y < titleAt(21).y);
  assert.ok(titleAt(21.25).y > titleAt(21.5).y);
});

test("clean media retains the complete 120 second, 24 fps animation", () => {
  const probe = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,duration,nb_frames,r_frame_rate",
      "-of",
      "json",
      "public/assets/film/codigo-em-cena-no-text.mp4",
    ],
    { encoding: "utf8" },
  );

  assert.equal(probe.status, 0, probe.stderr);
  const [stream] = JSON.parse(probe.stdout).streams;

  assert.equal(stream.width, 1920);
  assert.equal(stream.height, 984);
  assert.equal(stream.nb_frames, "2880");
  assert.equal(stream.r_frame_rate, "24/1");
  assert.equal(Number(stream.duration), 120);
});
