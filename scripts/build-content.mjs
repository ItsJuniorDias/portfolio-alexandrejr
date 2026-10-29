import { readFile, writeFile } from "node:fs/promises";
const content = JSON.parse(await readFile("src/data/curriculum.json", "utf8"));
const raw = await readFile("public/content/indicacao-tarcisio.txt", "utf8");
const quote = raw.slice(raw.indexOf("Tive o privilégio"), raw.indexOf("\n\nFonte:"));
const escape = (text) =>
  String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const entries = content.experiences
  .map(
    (item) =>
      `<article><p class="period">${escape(item.start)} — ${escape(item.end ?? "Atual")}</p><h3>${escape(item.company)}${item.client ? ` · ${escape(item.client)}` : ""}</h3><p><strong>${escape(item.role)}</strong><br>${escape(item.location)} · ${escape(item.workMode)}</p><ul>${item.responsibilities.map((line) => `<li>${escape(line)}</li>`).join("")}</ul><p class="skills">${item.technologies.map(escape).join(" · ")}</p></article>`,
  )
  .join("");
const education = content.education
  .map(
    (item) =>
      `<article><h3>${escape(item.institution)}</h3><p>${escape(item.program)} · ${escape(item.start)} — ${escape(item.end)}</p></article>`,
  )
  .join("");
const projects = content.projects
  .map(
    (item) =>
      `<article><h3>${escape(item.name)}</h3>${item.visibleContent.map((line) => `<p>${escape(line)}</p>`).join("")}${item.relationship ? `<p>${escape(item.relationship)}</p>` : ""}</article>`,
  )
  .join("");
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Currículo — Alexandre Junior</title><style>body{max-width:850px;margin:0 auto;padding:45px 25px;font:16px/1.7 system-ui,sans-serif;color:#263d3d;background:#fbf7ed}h1,h2,h3{font-family:Georgia,serif;line-height:1.2}h1{font-size:38px}h2{font-size:27px;margin-top:45px;border-bottom:1px solid #baa581;padding-bottom:12px}h3{font-size:21px;margin-bottom:12px}article{padding:18px 0;border-bottom:1px solid #d8ccb4;break-inside:avoid}.period,.skills{font-size:14px;color:#695b43}a{color:#6f2033}blockquote{margin:25px 0;border-left:3px solid #b28b4f;padding-left:24px}button{font:14px system-ui;padding:10px 15px;background:#263d3d;color:white;border:0;cursor:pointer}@media print{body{padding:0;background:white;font-size:14px}button{display:none}a{color:inherit}h2{break-after:avoid}}</style></head><body><button onclick="window.print()">Imprimir / Salvar como PDF</button><h1>Alexandre Junior</h1><p>Desenvolvimento mobile, web e jogos<br>${escape(content.profile.location)}</p><p><a href="${escape(content.profile.linkedin)}">LinkedIn</a> · <a href="${escape(content.profile.github)}">GitHub</a> · <a href="${escape(content.profile.medium)}">Medium</a></p><p>Desenvolvimento mobile e web desde o final de 2019, com React e React Native. Aprendizado contínuo e foco na qualidade das experiências.</p><h2>Experiência profissional</h2>${entries}<h2>Formação</h2>${education}<h3>Cambly Certificate</h3><p>Cambly Inc. · Novembro de 2025</p><h2>Projetos e destaques</h2>${projects}<h2>Indicação de Tarcisio Bezerra</h2><p>Engenheiro de Software Sênior · 14 de outubro de 2025<br>Trabalhou com Alexandre na mesma equipe.</p><blockquote>${quote
  .split(/\n+/)
  .map((line) => `<p>${escape(line)}</p>`)
  .join("")}</blockquote></body></html>`;
await writeFile("public/content/curriculo.html", html);
console.log("Generated printable curriculum with full available experience and recommendation.");
