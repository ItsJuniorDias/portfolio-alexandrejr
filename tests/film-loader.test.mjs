import test from "node:test";
import assert from "node:assert/strict";
import { prepareFilmVideo } from "../src/lib/film-loader.ts";

class VideoStub extends EventTarget {
  readyState = 0;
  videoWidth = 0;
  videoHeight = 0;
  seeking = false;
  error = null;
  paused = true;
  playCount = 0;
  loadCount = 0;
  attributes = new Map();
  blocked = false;

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  load() {
    this.loadCount++;
  }

  play() {
    this.playCount++;

    if (this.blocked) {
      return Promise.reject(new DOMException("A touch is required", "NotAllowedError"));
    }

    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }

  decode() {
    this.readyState = 2;
    this.videoWidth = 1920;
    this.videoHeight = 984;
    this.dispatchEvent(new Event("loadeddata"));
  }
}

function setup(video, overrides = {}) {
  const abort = new AbortController();
  const prompts = [];
  const loader = prepareFilmVideo(video, {
    signal: abort.signal,
    onInteractionRequired: (value) => prompts.push(value),
    ...overrides,
  });

  return { ...loader, abort, prompts };
}

test("a decoded MP4 frame is enough; canplaythrough is not required", async () => {
  const video = new VideoStub();
  const loader = setup(video);

  video.readyState = 1;
  video.dispatchEvent(new Event("loadedmetadata"));
  assert.equal(video.paused, false);

  video.decode();
  await loader.ready;

  assert.equal(video.paused, true);
  assert.equal(video.readyState, 2);
  assert.equal(video.muted, true);
  assert.equal(video.defaultMuted, true);
  assert.equal(video.playsInline, true);
  assert.ok(video.attributes.has("webkit-playsinline"));
  assert.deepEqual(loader.prompts, [false]);
});

test("a cached frame loads without replaying or resetting the video", async () => {
  const video = new VideoStub();
  video.decode();

  await setup(video).ready;

  assert.equal(video.loadCount, 0);
  assert.equal(video.playCount, 0);
});

test("iOS autoplay refusal can recover through a synchronous user activation", async () => {
  const video = new VideoStub();
  video.blocked = true;
  const loader = setup(video);
  await Promise.resolve();

  assert.deepEqual(loader.prompts, [true]);
  video.blocked = false;
  loader.activate();
  assert.equal(video.playCount, 2);

  video.decode();
  await loader.ready;
  assert.equal(video.paused, true);
  assert.deepEqual(loader.prompts, [true, false]);
});

test("a stalled video offers activation, then fails instead of loading forever", async () => {
  const loader = setup(new VideoStub(), { promptAfterMs: 5, timeoutMs: 20 });

  await assert.rejects(loader.ready, /loading deadline/);
  assert.deepEqual(loader.prompts, [true]);
});

test("unmount aborts loading and removes media callbacks", async () => {
  const video = new VideoStub();
  const loader = setup(video);

  loader.abort.abort();
  await assert.rejects(loader.ready, { name: "AbortError" });
  video.decode();
  loader.activate();

  assert.equal(video.playCount, 1);
  assert.equal(video.paused, true);
  assert.deepEqual(loader.prompts, []);
});

test("media errors fail promptly and stop the decoder", async () => {
  const video = new VideoStub();
  const loader = setup(video);

  video.error = { code: 4 };
  video.dispatchEvent(new Event("error"));

  await assert.rejects(loader.ready, /media error 4/);
  assert.equal(video.paused, true);
});
