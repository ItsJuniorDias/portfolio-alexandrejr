import { useEffect, useRef } from "react";
import { education, experiences, formatMonth, profile } from "../data/portfolio";
import { scrollStore } from "../lib/scroll-store";
import { localProgress, scrollToCue } from "../lib/timeline";
import type { Cue } from "../lib/timeline";

export default function SceneCopy({
  cue,
  reduced,
  openProgram,
}: {
  cue: Cue;
  reduced: boolean;
  openProgram: (section: string) => void;
}) {
  const letter = useRef<HTMLDivElement>(null);
  const experience = experiences.find((item) => item.id === cue.id);

  useEffect(() => {
    function update() {
      if (!letter.current || cue.id !== "tarcisio") return;
      const local = localProgress(scrollStore.getProgress(), cue);
      letter.current.style.setProperty(
        "--letter-turn",
        reduced ? "0deg" : `${(1 - Math.min(1, local * 5)) * -3}deg`,
      );
    }
    update();
    return scrollStore.subscribeScene(update);
  }, [cue, reduced]);

  if (cue.kind === "intro")
    return (
      <section className="intro-copy" aria-label="Introdução">
        <p className="eyebrow">Um portfólio em seis atos</p>
        <h1>
          Todo código
          <br />
          conta uma <em>história.</em>
        </h1>
        <p className="intro-description">
          Sou Alexandre. Desenvolvo interfaces,
          <br className="desktop-break" /> construo experiências e dou vida a ideias.
        </p>
        <button className="ticket-button" onClick={() => scrollToCue("bizstore", reduced)}>
          <span>Abra as cortinas</span>
          <span aria-hidden="true">↓</span>
        </button>
        <span className="scroll-hint">
          <span className="scroll-line" />
          Role para conduzir a história
        </span>
      </section>
    );

  if (cue.kind === "letter")
    return (
      <section className="letter-scene" aria-label="Indicação de Tarcisio Bezerra">
        <div className="letter-heading">
          <span className="eyebrow">Ato V · Uma carta de confiança</span>
          <h2>Quem dividiu o palco comigo.</h2>
        </div>
        <div className="testimonial-paper" ref={letter}>
          <span className="paper-pin pin-left" />
          <span className="paper-pin pin-right" />
          <span className="quote-mark" aria-hidden="true">
            “
          </span>
          <blockquote>
            Ele é daqueles talentos que <em>elevam o nível do time</em> por onde passam.
          </blockquote>
          <div className="letter-signature">
            <div>
              <strong>Tarcisio Bezerra</strong>
              <span>Engenheiro de Software Sênior</span>
              <small>14 de outubro de 2025</small>
            </div>
            <span className="wax-seal" aria-hidden="true">
              ✦
            </span>
          </div>
          <button className="inline-link" onClick={() => openProgram("tarcisio")}>
            Ler a indicação completa <span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>
    );

  if (cue.kind === "contact")
    return (
      <section className="scene-copy contact-copy" key={cue.id}>
        <span className="eyebrow">O próximo ato</span>
        <h2>
          Vamos criar
          <br />
          algo <em>memorável?</em>
        </h2>
        <p>
          Boas ideias merecem sair do papel.
          <br />
          Vamos conversar sobre a sua.
        </p>
        <a className="solid-button" href={profile.linkedin} target="_blank" rel="noreferrer">
          Vamos conversar <span aria-hidden="true">↗</span>
        </a>
        <div className="contact-links">
          <a href={profile.github} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <a href={profile.medium} target="_blank" rel="noreferrer">
            Medium ↗
          </a>
        </div>
        <button className="inline-link replay-link" onClick={() => scrollToCue("prologo", reduced)}>
          ↶ Reabrir a história
        </button>
      </section>
    );

  return (
    <section className="scene-copy" key={cue.id} aria-labelledby="scene-title">
      <span className="eyebrow">
        {experience
          ? `${formatMonth(experience.start)} — ${formatMonth(experience.end)}`
          : cue.kind === "education"
            ? "2017 · O aprendizado continua"
            : "Ideias que saíram do papel"}
      </span>
      <p className="scene-company">{cue.label}</p>
      <h2 id="scene-title">{cue.title}</h2>
      <p className="scene-description">{cue.subtitle}</p>
      {experience ? (
        <>
          <span className="scene-role">{experience.role}</span>
          <div className="tags scene-tags">
            {experience.technologies.slice(0, 3).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </>
      ) : null}
      {cue.kind === "education" ? (
        <div className="education-preview">
          {education.map((item) => (
            <p key={item.institution}>
              <strong>{item.institution}</strong>
              <span>{item.program}</span>
            </p>
          ))}
          <small>Cambly Certificate · 2025</small>
        </div>
      ) : null}
      <button className="inline-link" onClick={() => openProgram(cue.id)}>
        {" "}
        {experience
          ? "Os detalhes deste capítulo"
          : cue.kind === "education"
            ? "Ver formação completa"
            : "Conhecer o projeto"}{" "}
        <span aria-hidden="true">↗</span>
      </button>
    </section>
  );
}
