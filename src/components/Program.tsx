import { useEffect, useRef } from "react";
import {
  certifications,
  education,
  experiences,
  formatMonth,
  profile,
  projects,
  recommendation,
} from "../data/portfolio";

export default function Program({
  section,
  onClose,
}: {
  section: string | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = dialog.current;
    if (!node || !section) return;
    node.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const target = node.querySelector(`[data-section="${section}"]`);
    target?.scrollIntoView({ block: "start" });

    return () => {
      node.close();
      document.body.style.overflow = previous;
    };
  }, [section]);

  return (
    <dialog
      className="program"
      ref={dialog}
      onClose={onClose}
      aria-labelledby="program-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="program-shell">
        <header className="program-header">
          <div>
            <span className="eyebrow">O programa da peça</span>
            <h2 id="program-title">Alexandre Junior</h2>
          </div>
          <button
            type="button"
            className="icon-button close-button"
            onClick={onClose}
            aria-label="Fechar programa"
          >
            ×
          </button>
        </header>
        <div className="program-body">
          <aside className="program-index">
            <span className="eyebrow">Em cartaz</span>
            <a href="#program-about">Sobre</a>
            <a href="#program-experiences">Trajetória</a>
            <a href="#program-education">Formação</a>
            <a href="#program-projects">Projetos</a>
            <a href="#program-recommendation">Indicação</a>
            <a
              className="download-link"
              href="/content/curriculo.html"
              target="_blank"
              rel="noreferrer"
            >
              Currículo para imprimir ↗
            </a>
          </aside>
          <div className="program-content">
            <section id="program-about" data-section="sobre">
              <span className="eyebrow">Nos bastidores</span>
              <h3>Desenvolvimento com intenção.</h3>
              <p>
                Trabalho com desenvolvimento mobile e web desde o final de 2019, usando React e
                React Native. Hoje, também construo experiências de jogos, unindo interfaces,
                animação e performance.
              </p>
              <p>{profile.location}</p>
              <div className="text-links">
                <a href={profile.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn ↗
                </a>
                <a href={profile.github} target="_blank" rel="noreferrer">
                  GitHub ↗
                </a>
                <a href={profile.medium} target="_blank" rel="noreferrer">
                  Medium ↗
                </a>
              </div>
            </section>
            <section id="program-experiences" data-section="trajetoria">
              <span className="eyebrow">Cada experiência, um novo cenário</span>
              <h3>Trajetória</h3>
              {experiences.map((item) => (
                <article className="experience-entry" key={item.id} data-section={item.id}>
                  <p className="entry-date">
                    {formatMonth(item.start)} — {formatMonth(item.end)}
                  </p>
                  <h4>
                    {item.company}
                    {"client" in item && item.client ? <span> / {item.client}</span> : null}
                  </h4>
                  <p className="entry-role">{item.role}</p>
                  <p className="entry-meta">
                    {item.location} · {item.workMode}
                  </p>
                  <ul>
                    {item.responsibilities.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                  <div className="tags">
                    {item.technologies.map((technology) => (
                      <span key={technology}>{technology}</span>
                    ))}
                  </div>
                  {"projectLink" in item && item.projectLink ? (
                    <a
                      className="inline-link"
                      href={item.projectLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Conhecer o aplicativo ↗
                    </a>
                  ) : null}
                </article>
              ))}
            </section>
            <section id="program-education" data-section="formacao">
              <span className="eyebrow">O aprendizado continua</span>
              <h3>Formação e certificação</h3>
              {education.map((item) => (
                <article className="education-entry" key={item.institution}>
                  <p className="entry-date">
                    {formatMonth(item.start)} — {formatMonth(item.end)}
                  </p>
                  <h4>{item.institution}</h4>
                  <p>{item.program}</p>
                </article>
              ))}
              {certifications.map((item) => (
                <article className="education-entry" key={item.name}>
                  <p className="entry-date">Emitido em {formatMonth(item.issued)}</p>
                  <h4>{item.name}</h4>
                  <p>{item.issuer}</p>
                </article>
              ))}
            </section>
            <section id="program-projects" data-section="projetos">
              <span className="eyebrow">Ideias que saíram do papel</span>
              <h3>Projetos autorais</h3>
              {projects.map((item, i) => (
                <article className="project-entry" key={item.name} data-section={item.id}>
                  <span className="entry-date">Projeto {String(i + 1).padStart(2, "0")}</span>
                  <h4>{item.name}</h4>
                  {item.visibleContent.map((text) => (
                    <p key={text}>{text}.</p>
                  ))}
                  {"relationship" in item && <small>{item.relationship}</small>}
                </article>
              ))}
              <a className="inline-link" href={profile.github} target="_blank" rel="noreferrer">
                Explorar meu GitHub ↗
              </a>
            </section>
            <section id="program-recommendation" data-section="tarcisio">
              <span className="eyebrow">Uma carta de confiança</span>
              <h3>Palavras de quem trabalhou comigo.</h3>
              <blockquote>
                {recommendation.paragraphs.map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </blockquote>
              <p>
                <strong>{recommendation.author}</strong>
                <br />
                Engenheiro de Software Sênior
              </p>
              <p className="entry-meta">14 de outubro de 2025 · Trabalhamos na mesma equipe.</p>
              <a className="inline-link" href={profile.linkedin} target="_blank" rel="noreferrer">
                Ver meu perfil no LinkedIn ↗
              </a>
            </section>
          </div>
        </div>
      </div>
    </dialog>
  );
}
