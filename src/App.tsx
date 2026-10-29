import { lazy, Suspense, useCallback, useRef, useState, useSyncExternalStore } from "react";
import { cues, actNames, scrollToCue } from "./lib/timeline";
import { FILM } from "./lib/film-camera";
import { filmPresentation } from "./lib/film-presentation";
import { useReducedMotion, useScrollDirector } from "./lib/use-scroll";
import Program from "./components/Program";
import FilmCards from "./components/FilmCards";
import StageTitle from "./components/StageTitle";
import "./film.css";

const FilmStage = lazy(() => import("./pixi/FilmStage"));

export default function App() {
  const index = useScrollDirector();
  const reduced = useReducedMotion();
  const cue = cues[index];
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [sound, setSound] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const destination = useSyncExternalStore(
    filmPresentation.subscribeNavigation,
    filmPresentation.getDestination,
    () => null,
  );
  const handleReady = useCallback(() => {
    setReady(true);
    setFailed(false);
  }, []);
  const handleFailure = useCallback(() => setFailed(true), []);
  const openChapter = useCallback((id: string) => setSection(id), []);

  async function toggleSound() {
    if (!audio.current) return;
    if (sound) {
      audio.current.pause();
      return;
    }
    audio.current.volume = 0.25;
    try {
      await audio.current.play();
    } catch {
      setSound(false);
    }
  }

  return (
    <>
      <a className="skip-link" href="/content/curriculo.html">
        Ler currículo sem animação
      </a>
      <header className="film-header">
        <button
          className="brand"
          onClick={() => scrollToCue("prologo", reduced)}
          aria-label="Voltar ao início"
        >
          <span>Alexandre Junior</span>
          <small>Desenvolvedor</small>
        </button>
        <nav aria-label="Navegação principal">
          <button onClick={() => scrollToCue("bizstore", reduced)}>Trajetória</button>
          <button onClick={() => scrollToCue("spotify", reduced)}>Projetos</button>
          <button onClick={() => scrollToCue("tarcisio", reduced)}>Indicação</button>
          <button onClick={() => scrollToCue("contato", reduced)}>Contato ↗</button>
        </nav>
        <button
          className="film-program"
          onClick={() => setSection("sobre")}
          aria-label="Abrir currículo completo"
        >
          ≡
        </button>
      </header>
      <main>
        <div className={`film-viewport ${ready ? "film-ready" : ""}`} data-scene={cue.id}>
          <div className="film-poster" aria-hidden="true" />
          <div className="mobile-film-caption">
            <span className="eyebrow">
              Ato {String(cue.act).padStart(2, "0")} · {actNames[cue.act]}
            </span>
            <h1>{cue.title}</h1>
            <p>{cue.subtitle}</p>
            <button className="inline-link" onClick={() => setSection(cue.section)}>
              {cue.kind === "letter" ? "Ler a indicação completa" : "Ler este capítulo"} ↗
            </button>
          </div>
          <Suspense fallback={null}>
            <FilmStage
              zoom={1}
              cameraEnabled={cameraEnabled}
              reduced={reduced}
              onReady={handleReady}
              onFailure={handleFailure}
            />
          </Suspense>
          <FilmCards reduced={reduced} onOpen={openChapter} />
          <StageTitle />
          {destination && (
            <button
              className="film-travel-status"
              onClick={() => window.dispatchEvent(new Event("film:stop"))}
              aria-label={`Parar percurso para ${destination}`}
            >
              {destination} · 1,5× <span>Parar ×</span>
            </button>
          )}
          {!ready && !failed && (
            <div className="film-loading" role="status">
              Preparando o filme…
            </div>
          )}
          {failed && (
            <div className="film-error">
              <p>Não foi possível carregar a cena.</p>
              <a href="/assets/film/codigo-em-cena-no-text.mp4">Abrir o vídeo</a>
              <button onClick={() => setSection("sobre")}>Ler o currículo</button>
            </div>
          )}
          <div className="film-toolbar">
            <button className="chapter-button" onClick={() => setSection(cue.section)}>
              {cue.kind === "letter" ? "Ler a indicação" : "Abrir capítulo"} ↗
            </button>
            <div className="film-navigation">
              <button
                onClick={() => scrollToCue(cues[Math.max(0, index - 1)].id, reduced)}
                disabled={index === 0}
                aria-label="Cena anterior"
              >
                ←
              </button>
              <span>
                {String(index + 1).padStart(2, "0")} / {cues.length}
              </span>
              <button
                onClick={() => scrollToCue(cues[Math.min(cues.length - 1, index + 1)].id, reduced)}
                disabled={index === cues.length - 1}
                aria-label="Próxima cena"
              >
                →
              </button>
            </div>
            <div className="camera-controls" aria-label="Controles da câmera">
              <button
                className="camera-toggle"
                aria-pressed={cameraEnabled}
                onClick={() => setCameraEnabled((value) => !value)}
              >
                {cameraEnabled ? "Câmera cinematográfica" : "Câmera fixa"}
              </button>
              <button className="film-sound" onClick={toggleSound} aria-pressed={sound}>
                {sound ? "Som ligado" : "Ativar som"}
              </button>
            </div>
          </div>
          {index === 0 && ready && (
            <button className="film-scroll-hint" onClick={() => scrollToCue("bizstore", reduced)}>
              Role para abrir as cortinas <span>↓</span>
            </button>
          )}
          <div className="scroll-progress">
            <span />
          </div>
        </div>
        <div
          className="scroll-track"
          style={{ height: `calc(100vh + ${FILM.duration * FILM.pixelsPerSecond}px)` }}
          aria-hidden="true"
        />
      </main>
      <Program section={section} onClose={() => setSection(null)} />
      <audio
        ref={audio}
        src="/assets/audio/trilha.mp3"
        preload="none"
        loop
        onPlay={() => setSound(true)}
        onPause={() => setSound(false)}
      />
    </>
  );
}
