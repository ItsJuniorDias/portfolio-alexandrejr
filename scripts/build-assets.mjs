import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { NodeIO } from "@gltf-transform/core";
import { dedup, prune, weld } from "@gltf-transform/functions";
import sharp from "sharp";

const root = path.resolve("public/assets");
const materials = Object.fromEntries(
  Object.entries({
    paper: "#ead9b5",
    edge: "#a67742",
    teal: "#254b4d",
    gold: "#bd9457",
    red: "#792a3b",
    ink: "#253336",
    pale: "#f8edcf",
  }).map(([key, color]) => [
    key,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.93,
      metalness: key === "gold" ? 0.16 : 0,
      name: key,
    }),
  ]),
);

globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = value;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((value) => {
      this.result = `data:${blob.type};base64,${Buffer.from(value).toString("base64")}`;
      this.onloadend?.();
    });
  }
};

function group(name) {
  const node = new THREE.Group();
  node.name = name;
  return node;
}

function box(parent, name, dimensions, position, material = "paper") {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), materials[material]);
  mesh.name = name;
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function cutout(parent, name, points, depth, position, material = "paper") {
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => (index ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 1,
      steps: 1,
      curveSegments: 10,
    }),
    materials[material],
  );
  mesh.name = name;
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function disk(parent, name, radius, position, material = "gold", depth = 0.08) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, depth, 32),
    materials[material],
  );
  mesh.name = name;
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function panel(parent, name, width, height, position, material = "paper") {
  const g = group(name);
  g.position.set(...position);
  box(g, `${name}-corrugation`, [width, height, 0.11], [0, height / 2, 0], "edge");
  box(g, `${name}-face`, [width - 0.035, height - 0.035, 0.025], [0, height / 2, 0.075], material);
  parent.add(g);
  return g;
}

function star(parent, name, radius, position, material = "gold") {
  const points = Array.from({ length: 16 }, (_, i) => {
    const angle = (i * Math.PI) / 8;
    const r = i % 2 ? radius * 0.3 : radius;
    return [Math.cos(angle) * r, Math.sin(angle) * r];
  });
  return cutout(parent, name, points, 0.07, position, material);
}

const models = {};
const phone = group("phone");
panel(phone, "body", 1.65, 3.2, [0, 0, 0], "teal");
panel(phone, "screen", 1.39, 2.55, [0, 0.36, 0.12], "paper");
box(phone, "speaker", [0.43, 0.055, 0.03], [0, 3.03, 0.14], "gold");
disk(phone, "home", 0.11, [0, 0.18, 0.14], "gold");
disk(phone, "avatar", 0.22, [-0.38, 2.48, 0.24], "red");
box(phone, "heading", [0.53, 0.06, 0.035], [0.23, 2.56, 0.24], "teal");
box(phone, "subtitle", [0.38, 0.035, 0.035], [0.16, 2.4, 0.24], "gold");
for (let i = 0; i < 3; i++) {
  const tile = panel(
    phone,
    `interface-${i}`,
    1.08,
    0.42,
    [0, 0.68 + i * 0.55, 0.2],
    i === 2 ? "teal" : "pale",
  );
  box(tile, "line", [0.66, 0.035, 0.02], [0, 0.23, 0.1], i === 2 ? "paper" : "gold");
}
models.phone = phone;

const shop = group("storefront");
panel(shop, "facade", 2.8, 2.5, [0, 0, 0]);
panel(shop, "door", 0.65, 1.55, [0.58, 0, 0.13], "teal");
panel(shop, "window", 1.1, 1.12, [-0.62, 0.46, 0.13], "teal");
box(shop, "window-crossbar", [1.15, 0.06, 0.05], [-0.62, 1, 0.25], "gold");
box(shop, "window-mullion", [0.055, 1.15, 0.05], [-0.62, 1, 0.25], "gold");
box(shop, "sign", [2.9, 0.4, 0.16], [0, 2.38, 0.1], "teal");
for (let i = 0; i < 9; i++) {
  const awning = box(
    shop,
    `awning-${i}`,
    [0.32, 0.58, 0.07],
    [-1.28 + i * 0.32, 1.96, 0.35],
    i % 2 ? "paper" : "red",
  );
  awning.rotation.x = -0.5;
}
models.storefront = shop;

const plane = group("airplane");
cutout(
  plane,
  "body",
  [
    [-1.9, 0],
    [-1.45, 0.16],
    [0.7, 0.17],
    [1.2, 0.55],
    [1.55, 0.55],
    [1.35, 0.08],
    [1.65, -0.05],
    [1.42, -0.18],
    [-1.5, -0.18],
  ],
  0.12,
  [0, 0.65, 0],
);
cutout(
  plane,
  "wing",
  [
    [-0.55, 0],
    [0.52, -0.74],
    [0.85, -0.7],
    [0.25, 0.04],
  ],
  0.08,
  [0, 0.65, 0.15],
  "teal",
);
for (let i = 0; i < 9; i++)
  disk(plane, `window-${i}`, 0.038, [-1.15 + i * 0.23, 0.68, 0.19], "teal", 0.02);
models.airplane = plane;

const cloud = group("cloud");
const cloudShape = new THREE.Shape();
cloudShape.moveTo(-1.4, 0);
cloudShape.bezierCurveTo(-1.9, 0.8, -1, 1.1, -0.65, 0.72);
cloudShape.bezierCurveTo(-0.45, 1.6, 0.9, 1.4, 0.95, 0.65);
cloudShape.bezierCurveTo(1.7, 0.8, 1.95, 0.12, 1.35, 0);
cloudShape.closePath();
const cloudMesh = new THREE.Mesh(
  new THREE.ExtrudeGeometry(cloudShape, { depth: 0.09, bevelEnabled: false }),
  materials.pale,
);
cloudMesh.name = "paper-cloud";
cloud.add(cloudMesh);
models.cloud = cloud;

const terminal = group("payment-terminal");
panel(terminal, "body", 1.4, 2.1, [0, 0, 0], "teal");
panel(terminal, "screen", 1.1, 0.7, [0, 1.15, 0.15], "pale");
for (let i = 0; i < 9; i++)
  box(
    terminal,
    `key-${i}`,
    [0.22, 0.13, 0.06],
    [-0.33 + (i % 3) * 0.33, 0.4 + Math.floor(i / 3) * 0.23, 0.15],
    i === 2 ? "red" : "paper",
  );
star(terminal, "contactless", 0.19, [0, 1.48, 0.27]);
models.terminal = terminal;

const book = group("popup-book");
const left = group("cover-left-hinge");
const right = group("cover-right-hinge");
left.rotation.y = -0.18;
right.rotation.y = 0.18;
box(left, "cover-left", [1.6, 0.11, 1.6], [-0.8, 0, 0], "teal");
box(right, "cover-right", [1.6, 0.11, 1.6], [0.8, 0, 0], "teal");
for (let i = 0; i < 5; i++) {
  box(left, `page-left-${i}`, [1.5, 0.026, 1.5], [-0.77, 0.09 + i * 0.035, 0], "paper");
  box(right, `page-right-${i}`, [1.5, 0.026, 1.5], [0.77, 0.09 + i * 0.035, 0], "paper");
}
book.add(left, right);
models.book = book;

const academy = group("academy");
panel(academy, "facade", 2.8, 1.7, [0, 0, 0], "paper");
cutout(
  academy,
  "pediment",
  [
    [-1.58, 0],
    [0, 0.9],
    [1.58, 0],
  ],
  0.14,
  [0, 1.7, 0],
  "teal",
);
disk(academy, "clock", 0.24, [0, 2.02, 0.21], "gold");
for (let i = 0; i < 5; i++) {
  box(academy, `column-${i}`, [0.12, 1.55, 0.22], [-1.15 + i * 0.57, 0.82, 0.23], "pale");
  if (i < 4) panel(academy, `window-${i}`, 0.28, 0.9, [-0.87 + i * 0.57, 0.4, 0.12], "teal");
}
box(academy, "steps", [3.05, 0.13, 0.6], [0, 0, 0.17], "edge");
models.academy = academy;

const certificate = group("certificate");
panel(certificate, "sheet", 2.4, 1.65, [0, 0, 0], "pale");
for (let i = 0; i < 5; i++)
  box(
    certificate,
    `text-${i}`,
    [i === 0 ? 1.3 : 1.75, i === 0 ? 0.06 : 0.025, 0.02],
    [0, 1.35 - i * 0.18, 0.12],
    "gold",
  );
disk(certificate, "seal", 0.22, [0.65, 0.35, 0.15], "red");
models.certificate = certificate;

const shield = group("shield");
const shieldPoints = [
  [-1.18, 2.5],
  [0, 2.85],
  [1.18, 2.5],
  [1.02, 1.2],
  [0, 0.18],
  [-1.02, 1.2],
];
cutout(shield, "back", shieldPoints, 0.13, [0, 0, 0], "gold");
const inner = cutout(shield, "face", shieldPoints, 0.05, [0, 0.08, 0.17], "teal");
inner.scale.set(0.9, 0.92, 1);
box(shield, "lock", [0.65, 0.58, 0.12], [0, 1.42, 0.35], "paper");
const torus = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.065, 6, 20, Math.PI), materials.gold);
torus.name = "lock-arch";
torus.position.set(0, 1.68, 0.36);
shield.add(torus);
disk(shield, "keyhole", 0.06, [0, 1.46, 0.44], "teal");
models.shield = shield;

const music = group("record-player");
panel(music, "sleeve", 2.65, 2.65, [0, 0, 0], "teal");
disk(music, "vinyl", 1.05, [0, 1.35, 0.2], "ink");
for (let i = 0; i < 5; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.49 + i * 0.105, 0.008, 4, 48),
    materials.gold,
  );
  ring.name = `groove-${i}`;
  ring.position.set(0, 1.35, 0.25);
  music.add(ring);
}
disk(music, "label", 0.36, [0, 1.35, 0.27], "red");
disk(music, "spindle", 0.06, [0, 1.35, 0.34], "paper");
models.music = music;

const card = group("game-card");
panel(card, "back", 1.35, 1.95, [0, 0, 0], "paper");
panel(card, "inner", 1.08, 1.64, [0, 0.15, 0.12], "teal");
star(card, "emblem", 0.43, [0, 0.97, 0.26], "gold");
disk(card, "corner-a", 0.065, [-0.42, 1.62, 0.25], "gold");
disk(card, "corner-b", 0.065, [0.42, 0.45, 0.25], "gold");
models["game-card"] = card;

const envelope = group("envelope");
panel(envelope, "body", 2.7, 1.65, [0, 0, 0], "paper");
cutout(
  envelope,
  "fold-left",
  [
    [-1.33, 0],
    [-1.33, 1.63],
    [0.2, 0.5],
  ],
  0.02,
  [0, 0, 0.12],
  "pale",
);
cutout(
  envelope,
  "fold-right",
  [
    [1.33, 0],
    [1.33, 1.63],
    [-0.2, 0.5],
  ],
  0.02,
  [0, 0, 0.13],
  "paper",
);
const flap = group("top-flap-hinge");
flap.position.y = 1.65;
cutout(
  flap,
  "flap",
  [
    [-1.34, 0],
    [1.34, 0],
    [0, -0.98],
  ],
  0.025,
  [0, 0, 0.17],
  "pale",
);
envelope.add(flap);
disk(envelope, "wax-seal", 0.22, [0, 0.65, 0.24], "red");
models.envelope = envelope;

const letter = group("letter");
panel(letter, "sheet", 2.1, 2.8, [0, 0, 0], "pale");
models.letter = letter;

const token = group("token");
disk(token, "coin", 0.33, [0, 0.33, 0], "gold", 0.12);
star(token, "symbol", 0.2, [0, 0.33, 0.09], "paper");
models.token = token;

const floor = group("floor");
for (let i = 0; i < 20; i++)
  box(
    floor,
    `plank-${i}`,
    [0.79, 0.08, 3.8],
    [-7.5 + i * 0.79, 0, 0],
    i % 3 === 0 ? "gold" : "edge",
  );
models.floor = floor;

const footlight = group("footlight");
box(footlight, "base", [0.23, 0.1, 0.23], [0, 0.05, 0], "gold");
const bulb = new THREE.Mesh(
  new THREE.SphereGeometry(0.09, 10, 8),
  new THREE.MeshStandardMaterial({
    color: "#fff3c0",
    emissive: "#ffbb50",
    emissiveIntensity: 2,
    name: "bulb",
  }),
);
bulb.name = "bulb";
bulb.position.y = 0.16;
footlight.add(bulb);
models.footlight = footlight;

const exporter = new GLTFExporter();
const io = new NodeIO();
const manifest = [];
await mkdir(path.join(root, "models"), { recursive: true });

for (const [name, model] of Object.entries(models)) {
  const bytes = await exporter.parseAsync(model, { binary: true });
  const document = await io.readBinary(new Uint8Array(bytes));
  await document.transform(dedup(), weld(), prune());
  const optimized = await io.writeBinary(document);
  await writeFile(path.join(root, "models", `${name}.glb`), optimized);
  const bounds = new THREE.Box3().setFromObject(model);
  manifest.push({
    id: name,
    url: `/assets/models/${name}.glb`,
    bytes: optimized.byteLength,
    pivot: "base-center",
    up: "+Y",
    front: "+Z",
    bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
    nodes: document
      .getRoot()
      .listNodes()
      .map((n) => n.getName()),
  });
}

for (const name of ["proscenium", "curtain-suede", "workshop"]) {
  await sharp(path.join(root, "stage", `${name}.png`))
    .resize({ width: name === "curtain-suede" ? 768 : 1672, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(path.join(root, "stage", `${name}.webp`));
}

// Procedural vector sprites have fixed 128 px cells and equal first/last frames.
const sprites = ["sparkle", "token-hop", "paper-gesture"];
for (const name of sprites) {
  const cells = Array.from({ length: 12 }, (_, i) => {
    const phase = Math.sin((i / 11) * Math.PI);
    const translate = name === "token-hop" ? -phase * 24 : 0;
    const scale = name === "sparkle" ? 0.55 + phase * 0.45 : 1;
    const shape =
      name === "token-hop"
        ? '<circle r="25" fill="#bd9457" stroke="#ead9b5" stroke-width="5"/>'
        : name === "paper-gesture"
          ? '<path d="M-20 30V-8Q-20-16-14-10L-10 4V-29Q-10-37-4-29V-6L2-35Q8-40 9-29L7-5L17-27Q23-30 22-20L16 6L27-9Q34-10 29 2L20 29Z" fill="#ead9b5" stroke="#a67742" stroke-width="3"/>'
          : '<path d="M0-36 8-8 36 0 8 8 0 36-8 8-36 0-8-8Z" fill="#bd9457"/>';
    return `<g transform="translate(${i * 128 + 64} ${64 + translate}) scale(${scale})">${shape}</g>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="128" viewBox="0 0 1536 128">${cells}</svg>`;
  await writeFile(path.join(root, "sprites", `${name}.svg`), svg);
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(root, "sprites", `${name}.png`));
}
await writeFile(
  path.join(root, "manifest.json"),
  JSON.stringify(
    {
      version: 1,
      generator: "scripts/build-assets.mjs",
      models: manifest,
      textures: ["proscenium", "curtain-suede", "workshop"].map((id) => ({
        id,
        url: `/assets/stage/${id}.webp`,
      })),
      sprites: sprites.map((id) => ({
        id,
        url: `/assets/sprites/${id}.png`,
        frames: 12,
        frameSize: [128, 128],
        anchor: [0.5, 0.5],
        fps: 12,
        equalEndpoints: true,
      })),
    },
    null,
    2,
  ),
);
const profile = JSON.parse(await readFile("src/data/curriculum.json", "utf8"));
await writeFile("public/content/curriculo.json", JSON.stringify(profile, null, 2));
console.log(`Built ${manifest.length} GLB models, 3 stage textures and 3 sprite atlases.`);
