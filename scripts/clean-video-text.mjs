import { readFile, writeFile, rename } from "node:fs/promises";
import { spawn } from "node:child_process";

const samples = JSON.parse(await readFile("work/text-audit/results.json", "utf8"));
const review = JSON.parse(await readFile("work/text-audit/verified.json", "utf8"));

for (const sample of samples) {
  const extras = review.find((row) => row.time === sample.time)?.words ?? [];

  // Exclude large illustrations and the music player's pause icon misread by OCR.
  sample.words.push(...extras.filter((word) => word.height < 120 && word.text !== "II"));
}
const titleKeys = [
  [0, 809, 11, 299, 39],
  [6.5, 809, 8, 299, 39],
  [6.8, 804, -12, 310, 39],
  [7.1, 795, -45, 330, 40],
  [20.3, 833, 94, 255, 34],
  [20.5, 827, 88, 266, 35],
  [21, 820, 75, 276, 37],
  [21.5, 815, 53, 287, 39],
  [22, 812, 33, 296, 39],
  [22.5, 809, 24, 299, 39],
  [23, 809, 19.5, 299, 39],
  [23.5, 809, 14, 299, 39],
  [24, 809, 11, 299, 39],
  [30, 809, 11, 299, 39],
  [31, 807, 8, 307, 39],
  [31.5, 807, 5.6, 307, 39],
  [32, 803, -5, 316, 39],
  [32.5, 798, -25, 325, 40],
  [32.8, 790, -48, 340, 40],
  [57.8, 790, -48, 340, 40],
  [58, 800, -25, 320, 40],
  [58.5, 804, 2.8, 310, 39],
  [59, 807, 11, 307, 39],
  [59.5, 807, 11, 304, 39],
  [60, 809, 11, 299, 39],
  [120, 809, 11, 299, 39],
];
const titleWindows = [
  [0, 7.1],
  [20.3, 32.8],
  [57.8, 120],
];
const tracks = [];

function isTitle(word) {
  return word.x > 750 && word.x < 1150 && word.y < 150 && word.width > 150;
}

function distance(a, b) {
  return Math.hypot(a.x + a.width / 2 - b.x - b.width / 2, a.y + a.height / 2 - b.y - b.height / 2);
}

for (const sample of samples) {
  const used = new Set();

  for (const word of sample.words) {
    const letters = word.text.match(/[\p{L}\p{N}]/gu) ?? [];

    if (isTitle(word) || letters.length < 2 || word.width < 20) continue;
    if (word.y < 45 && word.x > 780 && word.x < 1160) continue;
    if (sample.time > 76 || sample.time < 3) continue;

    const candidates = tracks.filter((track) => {
      const last = track.at(-1);
      return (
        !used.has(track) &&
        sample.time - last.time <= 1 &&
        sample.time > last.time &&
        distance(last, word) < Math.max(75, word.width * 0.7) &&
        word.width / last.width > 0.45 &&
        word.width / last.width < 2.2
      );
    });
    candidates.sort((a, b) => distance(a.at(-1), word) - distance(b.at(-1), word));
    const track = candidates[0] ?? [];

    if (!candidates.length) tracks.push(track);
    track.push({ time: sample.time, ...word });
    used.add(track);
  }
}

function expression(points, field) {
  let result = String(points.at(-1)[field].toFixed(2));

  for (let index = points.length - 2; index >= 0; index--) {
    const a = points[index];
    const b = points[index + 1];
    const delta = b[field] - a[field];
    const linear = `${a[field].toFixed(2)}+(${delta.toFixed(2)})*clip((t-${a.time})/${b.time - a.time},0,1)`;
    result = `if(lt(t,${b.time}),${linear},${result})`;
  }

  return result;
}

function filter(points, enable, padding = 6) {
  const x = expression(points, "x");
  const y = expression(points, "y");
  const w = expression(points, "width");
  const h = expression(points, "height");
  return `delogo=x='clip((${x})-${padding},1,1916)':y='clip((${y})-${padding},1,980)':w='min((${w})+${padding * 2},1918-clip((${x})-${padding},1,1916))':h='min((${h})+${padding * 2},982-clip((${y})-${padding},1,980))':enable='${enable}'`;
}

const filters = [];

for (const [start, end] of titleWindows) {
  const points = titleKeys
    .filter(([time]) => time >= start && time <= end)
    .map(([time, x, y, width, height]) => ({ time, x, y, width, height }));
  filters.push(filter(points, `between(t,${start},${end})`, 6));
}

for (const track of tracks) {
  const start = Math.max(0, track[0].time - 0.25);
  const end = Math.min(120, track.at(-1).time + 0.25);
  filters.push(filter(track, `between(t,${start},${end})`, 7));
}

await writeFile(
  "src/data/stage-title.json",
  JSON.stringify({ keys: titleKeys, windows: titleWindows }, null, 2),
);
await writeFile("work/text-audit/clean-filter.txt", filters.join(",\n"));
await writeFile("work/text-audit/tracks.json", JSON.stringify(tracks, null, 2));
console.log(`Removing title and ${tracks.length} incidental text tracks.`);

const args = [
  "-hide_banner",
  "-loglevel",
  "warning",
  "-nostats",
  "-progress",
  "pipe:1",
  "-stats_period",
  "15",
  "-y",
  "-i",
  "public/assets/film/codigo-em-cena-stage-1920.mp4",
  "-vf",
  filters.join(","),
  "-an",
  "-c:v",
  "libx264",
  "-preset",
  "fast",
  "-crf",
  "17",
  "-g",
  "6",
  "-keyint_min",
  "6",
  "-sc_threshold",
  "0",
  "-bf",
  "0",
  "-pix_fmt",
  "yuv420p",
  "-threads",
  "4",
  "-movflags",
  "+faststart",
  "work/text-audit/no-text-next.mp4",
];
const process = spawn("ffmpeg", args, { stdio: "inherit" });

await new Promise((resolve, reject) => {
  process.on("error", reject);
  process.on("exit", (code) =>
    code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)),
  );
});

await rename("work/text-audit/no-text-next.mp4", "public/assets/film/codigo-em-cena-no-text.mp4");
