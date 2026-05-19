"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";

/* ================================================================
   TYPES & CONFIGURATION
   ================================================================ */

interface GameConfig {
  name: string;
  type: "crash" | "runner";
  colors: [string, string, string, string];
  minMult?: number;
  maxMult?: number;
  rows?: number;
  cols?: number;
}

interface PathPoint {
  row: number;
  col: number;
}

type PredStatus = "idle" | "predicting" | "active";
type Difficulty = "facile" | "moyen" | "difficile";

const GAMES: Record<string, GameConfig> = {
  aero: {
    name: "Aero",
    type: "crash",
    colors: ["#0a1628", "#00bfff", "#003366", "#ff6b00"],
    minMult: 1.2,
    maxMult: 5.0,
  },
  jetx: {
    name: "JetX",
    type: "crash",
    colors: ["#1a0033", "#ff00ff", "#6600cc", "#ff4500"],
    minMult: 1.1,
    maxMult: 6.0,
  },
  laburun: {
    name: "Labu Run",
    type: "runner",
    colors: ["#1a3a1a", "#2d5a2d", "#4a7a3a", "#8b6914"],
    rows: 8,
    cols: 5,
  },
  aviator: {
    name: "Aviator",
    type: "crash",
    colors: ["#1a0000", "#cc0000", "#330000", "#ffffff"],
    minMult: 1.0,
    maxMult: 8.0,
  },
  aviatrix: {
    name: "Aviatrix",
    type: "crash",
    colors: ["#0a2010", "#00cc44", "#003300", "#ffd700"],
    minMult: 1.1,
    maxMult: 5.5,
  },
};

/* ================================================================
   HELPERS
   ================================================================ */

function generateMultiplier(min: number, max: number): string {
  const raw = min + Math.random() * (max - min);
  return (Math.round(raw * 100) / 100).toFixed(2);
}

function generateSafePath(cols: number, maxRows: number, totalRows: number): PathPoint[] {
  const path: PathPoint[] = [];
  let col = Math.floor(Math.random() * cols);
  for (let i = 0; i < maxRows; i++) {
    const row = totalRows - 1 - i;
    path.push({ row, col });
    const move = Math.floor(Math.random() * 3) - 1;
    col = Math.max(0, Math.min(cols - 1, col + move));
  }
  return path;
}

function generateRunnerMultiplier(difficulty: Difficulty): string {
  const ranges: Record<Difficulty, [number, number]> = {
    facile: [1.5, 2.5],
    moyen: [2.5, 4.0],
    difficile: [4.0, 8.0],
  };
  const [min, max] = ranges[difficulty];
  return generateMultiplier(min, max);
}

function getDifficultyRows(difficulty: Difficulty): number {
  switch (difficulty) {
    case "facile": return 3;
    case "moyen": return 5;
    case "difficile": return 8;
  }
}

/* ================================================================
   SVG ICONS
   ================================================================ */

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" className="predire-spinner-svg">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="31.4 31.4" strokeLinecap="round" />
    </svg>
  );
}

/* ================================================================
   CRASH GAME ANIMATIONS
   ================================================================ */

/* --- AERO: Sleek jet, deep blue & cyan --- */
function AeroAnimation() {
  return (
    <div className="anim-viewport anim-aero">
      <div className="anim-bg anim-aero-bg" />
      {/* Stars */}
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <div key={`star-${i}`} className="aero-star" style={{
          left: `${5 + (i * 11) % 90}%`,
          top: `${5 + (i * 13) % 85}%`,
          animationDelay: `${i * 0.3}s`,
          width: `${2 + (i % 3)}px`,
          height: `${2 + (i % 3)}px`,
        }} />
      ))}
      {/* Speed lines */}
      {[0,1,2,3,4,5].map(i => (
        <div key={`speed-${i}`} className="aero-speed-line" style={{
          left: `${10 + i * 15}%`,
          animationDelay: `${i * 0.25}s`,
          height: `${30 + (i % 3) * 18}px`,
          opacity: 0.12 + (i % 3) * 0.08,
        }} />
      ))}
      {/* Glow particles */}
      {[0,1,2].map(i => (
        <div key={`glow-${i}`} className="aero-glow-particle" style={{
          left: `${20 + i * 30}%`,
          bottom: `${10 + i * 15}%`,
          animationDelay: `${i * 0.8}s`,
        }} />
      ))}
      {/* Plane ascending */}
      <div className="aero-plane-wrap">
        <svg viewBox="0 0 100 40" fill="none" className="aero-plane-svg">
          <path d="M5 20 L30 6 L90 20 L30 34 Z" fill="#00bfff" />
          <path d="M22 20 L42 10 L42 30 Z" fill="rgba(227,242,253,0.35)" />
          <path d="M75 20 L90 17 L90 23 Z" fill="#ff6b00" />
          <circle cx="30" cy="20" r="3" fill="rgba(255,255,255,0.7)" />
        </svg>
        {/* Afterburner trail */}
        <div className="aero-afterburn" />
      </div>
    </div>
  );
}

/* --- JETX: Rocket shape, dark purple & magenta --- */
function JetXAnimation() {
  return (
    <div className="anim-viewport anim-jetx">
      <div className="anim-bg anim-jetx-bg" />
      {/* Neon grid lines */}
      {[0,1,2,3].map(i => (
        <div key={`gline-${i}`} className="jetx-grid-line" style={{
          top: `${20 + i * 20}%`,
          animationDelay: `${i * 0.5}s`,
        }} />
      ))}
      {/* Neon particles */}
      {[0,1,2,3,4,5,6].map(i => (
        <div key={`np-${i}`} className="jetx-neon-particle" style={{
          left: `${8 + (i * 13) % 85}%`,
          top: `${10 + (i * 19) % 70}%`,
          animationDelay: `${i * 0.35}s`,
          animationDuration: `${1.5 + (i % 3) * 0.5}s`,
        }} />
      ))}
      {/* Speed lines */}
      {[0,1,2,3,4].map(i => (
        <div key={`js-${i}`} className="jetx-speed-line" style={{
          left: `${12 + i * 17}%`,
          animationDelay: `${i * 0.3}s`,
          height: `${35 + (i % 3) * 16}px`,
        }} />
      ))}
      {/* Pulsing halo */}
      <div className="jetx-halo" />
      {/* Rocket ascending */}
      <div className="jetx-rocket-wrap">
        <svg viewBox="0 0 100 50" fill="none" className="jetx-rocket-svg">
          <path d="M10 25 L35 5 L90 25 L35 45 Z" fill="#9c27b0" />
          <path d="M25 25 L44 12 L44 38 Z" fill="#e040fb" opacity="0.35" />
          <path d="M74 25 L90 22 L90 28 Z" fill="#ff00ff" />
          <circle cx="38" cy="25" r="3.5" fill="rgba(255,255,255,0.55)" />
          <path d="M5 25 L10 22 L10 28 Z" fill="#ff4500" />
        </svg>
        <div className="jetx-flame-trail" />
      </div>
    </div>
  );
}

/* --- AVIATOR: Small red plane (triangle), red & black --- */
function AviatorAnimation() {
  return (
    <div className="anim-viewport anim-aviator">
      <div className="anim-bg anim-aviator-bg" />
      {/* Vignette glow */}
      <div className="aviator-vignette-glow" />
      {/* Faint graph curve */}
      <svg className="aviator-graph-curve" viewBox="0 0 300 280" preserveAspectRatio="none">
        <path d="M 10 260 Q 60 258 110 210 Q 160 162 200 105 Q 235 58 275 15" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" strokeDasharray="5 7" />
      </svg>
      {/* Sparks */}
      {[0,1,2,3].map(i => (
        <div key={`sp-${i}`} className="aviator-spark" style={{
          left: `${15 + (i * 23) % 70}%`,
          top: `${10 + (i * 19) % 60}%`,
          animationDelay: `${i * 1.1}s`,
          animationDuration: `${2 + i * 0.4}s`,
        }} />
      ))}
      {/* Red plane ascending */}
      <div className="aviator-plane-wrap">
        <svg viewBox="0 0 36 36" fill="none" className="aviator-plane-svg">
          <path d="M18 3 L34 33 L2 33 Z" fill="#cc0000" />
          <path d="M18 3 L28 33 L2 33 Z" fill="#990000" />
          <path d="M18 10 L14 33" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
        </svg>
        <div className="aviator-trail-dot" />
      </div>
    </div>
  );
}

/* --- AVIATRIX: Futuristic plane, green & gold --- */
function AviatrixAnimation() {
  return (
    <div className="anim-viewport anim-aviatrix">
      <div className="anim-bg anim-aviatrix-bg" />
      {/* Connecting lines SVG */}
      <svg className="aviatrix-connect-lines" viewBox="0 0 300 280" fill="none">
        <line x1="45" y1="55" x2="125" y2="130" stroke="rgba(0,204,68,0.07)" strokeWidth="1" />
        <line x1="125" y1="130" x2="215" y2="75" stroke="rgba(0,204,68,0.05)" strokeWidth="1" />
        <line x1="125" y1="130" x2="75" y2="210" stroke="rgba(255,215,0,0.05)" strokeWidth="1" />
        <line x1="215" y1="75" x2="255" y2="170" stroke="rgba(0,204,68,0.05)" strokeWidth="1" />
      </svg>
      {/* Nodes */}
      {[0,1,2,3,4,5].map(i => (
        <div key={`node-${i}`} className="aviatrix-node-dot" style={{
          left: `${10 + (i * 27) % 78}%`,
          top: `${15 + (i * 29) % 60}%`,
          animationDelay: `${i * 0.7}s`,
        }} />
      ))}
      {/* Gold particles floating up */}
      {[0,1,2,3,4,5].map(i => (
        <div key={`gp-${i}`} className="aviatrix-gold-particle" style={{
          left: `${6 + (i * 15) % 84}%`,
          animationDelay: `${i * 0.55}s`,
          animationDuration: `${3 + (i % 3)}s`,
        }} />
      ))}
      {/* Center glow */}
      <div className="aviatrix-center-glow" />
      {/* Futuristic plane ascending */}
      <div className="aviatrix-plane-wrap">
        <svg viewBox="0 0 100 45" fill="none" className="aviatrix-plane-svg">
          <path d="M8 22 L35 5 L92 22 L35 39 Z" fill="#00cc44" />
          <path d="M22 22 L42 12 L42 32 Z" fill="#69f0ae" opacity="0.3" />
          <circle cx="36" cy="22" r="4" fill="#ffd700" />
          <path d="M5 22 L20 12" stroke="#ffd700" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M5 22 L20 32" stroke="#ffd700" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M92 22 L80 15" stroke="rgba(255,215,0,0.4)" strokeWidth="0.8" />
          <path d="M92 22 L80 29" stroke="rgba(255,215,0,0.4)" strokeWidth="0.8" />
        </svg>
        <div className="aviatrix-thrust" />
      </div>
    </div>
  );
}

/* --- LABU RUN: Forest/road runner, green & earthy --- */
function LabuRunAnimation() {
  return (
    <div className="anim-viewport anim-laburun">
      <div className="anim-bg anim-laburun-bg" />
      {/* Trees */}
      {[0,1,2,3].map(i => (
        <div key={`tree-${i}`} className="laburun-tree" style={{
          left: `${8 + i * 24}%`,
          animationDelay: `${i * 0.6}s`,
        }} />
      ))}
      {/* Road dashes */}
      <div className="laburun-road">
        <div className="laburun-road-dashes" />
      </div>
      {/* Coins */}
      {[0,1,2,3].map(i => (
        <div key={`coin-${i}`} className="laburun-coin" style={{
          left: `${18 + i * 20}%`,
          animationDelay: `${i * 0.6}s`,
        }} />
      ))}
      {/* Character running */}
      <div className="laburun-runner">
        <svg viewBox="0 0 28 40" fill="none">
          <circle cx="14" cy="5" r="4.5" fill="#4a7a3a" />
          <path d="M14 10 L14 24" stroke="#4a7a3a" strokeWidth="3" strokeLinecap="round" />
          <path d="M14 15 L7 19" stroke="#4a7a3a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M14 15 L21 19" stroke="#4a7a3a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M14 24 L8 35" stroke="#4a7a3a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M14 24 L20 35" stroke="#4a7a3a" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

/* ================================================================
   ANIMATION RENDERER
   ================================================================ */

function GameAnimation({ slug }: { slug: string }) {
  switch (slug) {
    case "aero": return <AeroAnimation />;
    case "jetx": return <JetXAnimation />;
    case "aviator": return <AviatorAnimation />;
    case "aviatrix": return <AviatrixAnimation />;
    case "laburun": return <LabuRunAnimation />;
    default: return null;
  }
}

/* ================================================================
   LABU RUN GRID
   ================================================================ */

function LabuRunGrid({ safePath }: { safePath: PathPoint[] }) {
  const COLS = 5;
  const ROWS = 8;
  const safeSet = useMemo(
    () => new Set(safePath.map((p) => `${p.row}-${p.col}`)),
    [safePath]
  );

  return (
    <div className="labu-grid-wrapper">
      <div className="labu-grid">
        {Array.from({ length: ROWS }).map((_, row) =>
          Array.from({ length: COLS }).map((_, col) => {
            const key = `${row}-${col}`;
            const isSafe = safeSet.has(key);
            const pathIdx = safePath.findIndex((p) => p.row === row && p.col === col);
            const isStart = row === ROWS - 1 && isSafe;
            const isEnd = isSafe && pathIdx === safePath.length - 1 && safePath.length > 0;
            const delay = pathIdx >= 0 ? pathIdx * 0.12 : 0;

            return (
              <div
                key={key}
                className={`labu-tile ${isSafe ? "labu-tile-safe" : ""} ${isStart ? "labu-tile-start" : ""} ${isEnd ? "labu-tile-end" : ""}`}
                style={{ "--tile-delay": `${delay}s` } as React.CSSProperties}
              >
                {isStart && (
                  <svg className="labu-tile-icon" viewBox="0 0 24 32" fill="none">
                    <circle cx="12" cy="5" r="4" fill="#4a7a3a" />
                    <path d="M12 9 L12 20 M12 14 L7 17 M12 14 L17 17 M12 20 L8 28 M12 20 L16 28" stroke="#4a7a3a" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                {isEnd && !isStart && (
                  <svg className="labu-tile-icon labu-flag-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M8 4 L8 20" stroke="#ffd740" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8 4 L20 7 L8 10" fill="#ffd740" />
                  </svg>
                )}
              </div>
            );
          })
        )}
      </div>
      {safePath.length > 0 && (
        <span className="labu-safe-count">
          {safePath.length} cases securisees
        </span>
      )}
    </div>
  );
}

/* ================================================================
   DIFFICULTY SELECTOR
   ================================================================ */

function DifficultySelector({
  difficulty,
  onSelect,
}: {
  difficulty: Difficulty;
  onSelect: (d: Difficulty) => void;
}) {
  const options: { value: Difficulty; label: string }[] = [
    { value: "facile", label: "FACILE" },
    { value: "moyen", label: "MOYEN" },
    { value: "difficile", label: "DIFFICILE" },
  ];

  return (
    <div className="labu-difficulty">
      <span className="labu-difficulty-label">Difficulte</span>
      <div className="labu-difficulty-btns">
        {options.map((opt) => (
          <button
            key={opt.value}
            className={`labu-diff-btn ${difficulty === opt.value ? "active" : ""}`}
            onClick={() => onSelect(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function PredictionPage() {
  const params = useParams();
  const router = useRouter();
  const gameSlug = params.game as string;

  const config = useMemo(() => GAMES[gameSlug], [gameSlug]);
  const isRunner = config?.type === "runner";

  /* State */
  const [predStatus, setPredStatus] = useState<PredStatus>("idle");
  const [multiplier, setMultiplier] = useState<string | null>(null);
  const [bounceKey, setBounceKey] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("moyen");
  const [safePath, setSafePath] = useState<PathPoint[]>([]);

  /* PREDIRE handler */
  const handlePredict = useCallback(() => {
    if (predStatus === "predicting" || !config) return;
    setPredStatus("predicting");

    if (isRunner) {
      setSafePath([]);
      setMultiplier(null);
    } else {
      setMultiplier(null);
    }

    setTimeout(() => {
      if (isRunner) {
        const maxRows = getDifficultyRows(difficulty);
        const path = generateSafePath(5, maxRows, 8);
        setSafePath(path);
        const mult = generateRunnerMultiplier(difficulty);
        setMultiplier(mult);
      } else {
        const mult = generateMultiplier(config.minMult!, config.maxMult!);
        setMultiplier(mult);
      }
      setBounceKey((k) => k + 1);
      setPredStatus("active");
    }, 2000);
  }, [predStatus, config, isRunner, difficulty]);

  /* Anti-zoom */
  useEffect(() => {
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    const onGesture = (e: Event) => e.preventDefault();
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) e.preventDefault();
    };

    document.addEventListener("touchstart", preventZoom, { passive: false });
    document.addEventListener("touchmove", preventZoom, { passive: false });
    document.addEventListener("gesturestart", onGesture, { passive: false });
    document.addEventListener("gesturechange", onGesture, { passive: false });
    document.addEventListener("gestureend", onGesture, { passive: false });
    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("touchstart", preventZoom);
      document.removeEventListener("touchmove", preventZoom);
      document.removeEventListener("gesturestart", onGesture);
      document.removeEventListener("gesturechange", onGesture);
      document.removeEventListener("gestureend", onGesture);
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  /* Status helpers */
  const statusDotColor = predStatus === "active" ? "#00e676" : "#e8b830";
  const statusLabel =
    predStatus === "predicting" ? "Analyse..." : predStatus === "active" ? "Signal actif" : "Pret";

  /* Invalid game */
  if (!config) {
    return (
      <div className="pred-root">
        <div className="pred-invalid">
          <p>Jeu non trouve</p>
          <button className="pred-back-btn" onClick={() => router.back()}>
            <ArrowLeftIcon />
            <span>Retour</span>
          </button>
        </div>
      </div>
    );
  }

  /* Runner multiplier label */
  const runnerMultLabel = isRunner && multiplier && predStatus === "active"
    ? `Multiplicateur: x${multiplier}`
    : null;

  return (
    <div className="pred-root">
      {/* Ambient light */}
      <div className="pred-ambient" />

      {/* Fixed Header */}
      <header className="pred-header">
        <div className="pred-header-left">
          <span className="pred-logo">BNET54</span>
          <span className="pred-header-sub">Predictions</span>
        </div>
        <div className="pred-header-right">
          <span className="pred-status-dot" style={{ backgroundColor: statusDotColor }} />
          <span className="pred-status-text">{statusLabel}</span>
        </div>
      </header>

      {/* Content */}
      <main className="pred-content">
        {/* Game Title */}
        <h1 className="pred-game-title">{config.name}</h1>

        {/* Game Animation */}
        <GameAnimation slug={gameSlug} />

        {/* Crash Games: Prediction Card */}
        {!isRunner && (
          <div className="pred-card" key={bounceKey}>
            <div className="pred-card-shimmer" />
            <div className="pred-card-inner">
              <span className="pred-card-label">PROCHAINE PREDICTION</span>
              <span className={`pred-card-value ${predStatus === "active" ? "pred-bounce" : ""}`}>
                {predStatus === "predicting"
                  ? "..."
                  : multiplier
                    ? `x${multiplier}`
                    : "--"}
              </span>
              <span className="pred-card-state">
                {predStatus === "idle"
                  ? "Cliquez sur PREDIRE pour obtenir votre signal"
                  : predStatus === "predicting"
                    ? "Analyse en cours..."
                    : "Signal actif"}
              </span>
            </div>
          </div>
        )}

        {/* Labu Run: Difficulty Selector */}
        {isRunner && <DifficultySelector difficulty={difficulty} onSelect={setDifficulty} />}

        {/* Labu Run: Grid */}
        {isRunner && (
          <div className="labu-prediction-area">
            {predStatus === "idle" && safePath.length === 0 && (
              <div className="labu-idle-msg">
                <span>Choisissez la difficulte et cliquez PREDIRE</span>
              </div>
            )}
            {predStatus === "predicting" && (
              <div className="labu-analyzing-msg">
                <SpinnerIcon />
                <span>Analyse du chemin en cours...</span>
              </div>
            )}
            {predStatus === "active" && safePath.length > 0 && (
              <>
                <LabuRunGrid safePath={safePath} />
                {runnerMultLabel && (
                  <div className="labu-mult-result pred-bounce" key={bounceKey}>
                    {runnerMultLabel}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* PREDIRE Button */}
        <button
          className="predire-btn"
          onClick={handlePredict}
          disabled={predStatus === "predicting"}
        >
          {predStatus === "predicting" ? (
            <span className="predire-loading">
              <SpinnerIcon />
              Analyse...
            </span>
          ) : (
            "PREDIRE"
          )}
        </button>

        {/* Retour Button */}
        <button className="pred-back-btn" onClick={() => router.back()}>
          <ArrowLeftIcon />
          <span>Retour</span>
        </button>
      </main>

      {/* Footer */}
      <footer className="pred-footer">
        <p>BNET54 2025</p>
      </footer>

      {/* Floating Badge */}
      <div className="pred-badge">BNET54</div>
    </div>
  );
}
