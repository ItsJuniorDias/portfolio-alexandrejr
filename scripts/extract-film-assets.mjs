import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { createHash } from "node:crypto";

const source = path.resolve("codigo-em-cena-2min.mp4");
const out = path.resolve("public/assets/film/layers");
await mkdir(out, { recursive: true });
const specifications = [
  ["theatre-arch", 0, 0, 0, 1280, 220, "architecture"],
  ["theatre-left-wing", 0, 0, 220, 170, 440, "architecture"],
  ["theatre-right-wing", 0, 1110, 220, 170, 440, "architecture"],
  ["theatre-floor", 0, 0, 650, 1280, 70, "foreground"],
  ["curtain-left", 0, 170, 180, 470, 470, "curtain"],
  ["curtain-right", 0, 640, 180, 470, 470, "curtain"],
  ["retail-environment", 5, 170, 190, 940, 460, "background"],
  ["retail-phone-visible", 5, 552, 217, 174, 355, "prop"],
  ["retail-store-left-visible", 5, 223, 301, 310, 271, "prop"],
  ["retail-store-right", 5, 749, 249, 307, 400, "prop"],
  ["bizstore-caption", 5, 164, 570, 660, 110, "caption"],
  ["lebes-environment", 8, 0, 90, 1280, 480, "background"],
  ["lebes-caption", 8, 164, 570, 660, 110, "caption"],
  ["workshop-environment", 12, 0, 64, 1280, 506, "background"],
  ["workshop-phone", 12, 507, 55, 245, 515, "prop"],
  ["meifacil-caption", 12, 164, 570, 660, 110, "caption"],
  ["travel-popup", 18, 195, 80, 795, 490, "prop"],
  ["travel-plane", 18, 365, 291, 597, 195, "prop"],
  ["smiles-caption", 18, 164, 570, 660, 110, "caption"],
  ["payments-diorama", 25, 288, 218, 727, 352, "prop"],
  ["aqbank-caption", 25, 164, 570, 660, 110, "caption"],
  ["education-book", 34, 280, 438, 713, 198, "prop"],
  ["education-academy", 34, 450, 446, 390, 124, "prop"],
  ["fatec-caption", 34, 164, 570, 660, 110, "caption"],
  ["rocketseat-interface-panels", 40, 335, 104, 765, 470, "prop"],
  ["rocketseat-caption", 40, 164, 570, 660, 110, "caption"],
  ["certificate-envelope-visible", 43, 330, 221, 610, 349, "prop"],
  ["cambly-caption", 43, 164, 570, 660, 110, "caption"],
  ["music-phone-visible", 48, 465, 66, 343, 504, "prop"],
  ["music-disc", 48, 531, 232, 220, 265, "prop"],
  ["spotify-caption", 48, 164, 570, 660, 110, "caption"],
  ["solo-game-diorama", 54, 315, 280, 785, 440, "prop"],
  ["solo-game-caption", 54, 164, 570, 660, 110, "caption"],
  ["teddy-interfaces", 66, 274, 208, 727, 362, "prop"],
  ["teddy-caption", 66, 164, 570, 660, 110, "caption"],
  ["antifraud-shield", 74, 491, 309, 275, 261, "prop"],
  ["antifraud-scenery", 74, 244, 262, 796, 308, "background"],
  ["tribanco-caption", 74, 164, 570, 660, 110, "caption"],
  ["jungle-card-stage", 82, 275, 198, 750, 433, "prop"],
  ["jungle-caption", 82, 164, 570, 660, 110, "caption"],
  ["testimonial-backdrop", 92, 385, 165, 450, 385, "background"],
  ["tarcisio-letter-commitment", 97, 197, 215, 886, 367, "letter"],
  ["tarcisio-letter-leadership", 104, 197, 215, 886, 367, "letter"],
  ["tarcisio-letter-recommendation", 112, 197, 215, 886, 367, "letter"],
  ["closing-curtain-left", 119, 170, 180, 470, 470, "curtain"],
  ["closing-curtain-right", 119, 640, 180, 470, 470, "curtain"],
];

const assets = [];
for (const [id, time, x, y, width, height, role] of specifications) {
  const file = path.join(out, `${id}.png`);
  const result = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      String(time),
      "-i",
      source,
      "-frames:v",
      "1",
      "-vf",
      `format=rgb24,crop=${width}:${height}:${x}:${y}:exact=1`,
      file,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(`${id}: ${result.stderr}`);
  assets.push({
    id,
    role,
    file: `/assets/film/layers/${id}.png`,
    timeSeconds: time,
    sourceFrame: time * 24,
    rectangle: { x, y, width, height },
    sourcePixels: true,
    alpha: false,
    note: "Recorte retangular do vídeo original. Preserva os pixels e o contexto visível; partes ocultas não foram inventadas.",
  });
}
const bytes = await readFile(source);
await writeFile(
  path.join(out, "manifest.json"),
  JSON.stringify(
    {
      source: "codigo-em-cena-2min.mp4",
      sourceSha256: createHash("sha256").update(bytes).digest("hex"),
      method: "FFmpeg: decode original frame → RGB24 → exact rectangular crop → lossless PNG",
      sourceSize: [1280, 720],
      fps: 24,
      duration: 120,
      animation:
        "O MP4 continua como animação principal no PixiJS; os PNGs não substituem o movimento.",
      limitation:
        "Os recortes não são máscaras semânticas transparentes. O MP4 não contém os pixels escondidos atrás dos objetos.",
      assets,
    },
    null,
    2,
  ),
);
console.log(`Extracted ${assets.length} lossless PNG cutouts from the original video.`);
