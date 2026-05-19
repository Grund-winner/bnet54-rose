"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ================================================================
   TYPES & CONFIGURATION
   ================================================================ */

interface GameConfig {
  name: string;
  type: "crash" | "runner";
  bg: string;
  curveColor?: string;
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
    bg: "/games/screenshots/aero_bg.png",
    curveColor: "#00bfff",
    minMult: 1.2,
    maxMult: 5.0,
  },
  jetx: {
    name: "JetX",
    type: "crash",
    bg: "/games/screenshots/jetx_bg.png",
    curveColor: "#ff00ff",
    minMult: 1.1,
    maxMult: 6.0,
  },
  aviator: {
    name: "Aviator",
    type: "crash",
    bg: "/games/screenshots/aviator_bg.jpg",
    curveColor: "#cc0000",
    minMult: 1.0,
    maxMult: 8.0,
  },
  aviatrix: {
    name: "Aviatrix",
    type: "crash",
    bg: "/games/screenshots/aviatrix_bg.jpg",
    curveColor: "#00cc44",
    minMult: 1.1,
    maxMult: 5.5,
  },
  laburun: {
    name: "Labu Run",
    type: "runner",
    bg: "/games/screenshots/laburun_bg.png",
    rows: 8,
    cols: 5,
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
   CRASH CURVE CANVAS
   ================================================================ */

function CrashCurveCanvas({ curveColor }: { curveColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    let progress = 0;
    const crashPoint = 0.4 + Math.random() * 0.5;
    const points: { x: number; y: number }[] = [];
    const numPoints = 60;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const isCrashed = t > crashPoint;
      const x = (i / numPoints) * w;
      let y: number;
      if (!isCrashed) {
        const base = Math.pow(t / crashPoint, 1.5);
        const noise = Math.sin(t * 12) * 3 + Math.sin(t * 5) * 2;
        y = h - (base * (h * 0.85)) + noise;
      } else {
        y = h - (h * 0.85) + (t - crashPoint) * 200;
      }
      points.push({ x, y: Math.max(0, Math.min(h, y)) });
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 5; i++) {
        const gy = h - (i / 5) * h * 0.85;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = "10px -apple-system, sans-serif";
        ctx.fillText(`${i}x`, 4, gy - 3);
      }

      // Curve
      const drawCount = Math.floor(progress * points.length);
      if (drawCount > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < drawCount; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = curveColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = curveColor;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Fill under curve
        ctx.lineTo(points[drawCount - 1].x, h);
        ctx.lineTo(points[0].x, h);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, curveColor + "20");
        gradient.addColorStop(1, curveColor + "05");
        ctx.fillStyle = gradient;
        ctx.fill();

        // Dot at current position
        if (drawCount > 0 && drawCount <= points.length) {
          const p = points[drawCount - 1];
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = curveColor;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = curveColor + "30";
          ctx.fill();
        }
      }

      progress += 0.005;
      if (progress > 1.2) {
        progress = 0;
        // Regenerate curve on reset
        const newCrashPoint = 0.4 + Math.random() * 0.5;
        points.length = 0;
        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints;
          const isCrashed = t > newCrashPoint;
          const x = (i / numPoints) * w;
          let y: number;
          if (!isCrashed) {
            const base = Math.pow(t / newCrashPoint, 1.5);
            const noise = Math.sin(t * 12) * 3 + Math.sin(t * 5) * 2;
            y = h - (base * (h * 0.85)) + noise;
          } else {
            y = h - (h * 0.85) + (t - newCrashPoint) * 200;
          }
          points.push({ x, y: Math.max(0, Math.min(h, y)) });
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [curveColor]);

  return (
    <canvas
      ref={canvasRef}
      className="crash-curve-canvas"
    />
  );
}

/* ================================================================
   MULTIPLIER OVERLAY
   ================================================================ */

function MultiplierOverlay({
  predStatus,
  multiplier,
}: {
  predStatus: PredStatus;
  multiplier: string | null;
}) {
  return (
    <div className="mult-overlay">
      {predStatus === "active" && multiplier && (
        <span className="mult-signal-label">SIGNAL ACTIF</span>
      )}
      <span className={`mult-value ${predStatus === "active" && multiplier ? "mult-bounce" : ""}`}>
        {predStatus === "predicting"
          ? "..."
          : predStatus === "active" && multiplier
            ? `x${multiplier}`
            : "--"}
      </span>
      <span className="mult-state">
        {predStatus === "idle"
          ? "En attente du signal"
          : predStatus === "predicting"
            ? "Analyse en cours..."
            : "Signal actif"}
      </span>
    </div>
  );
}

/* ================================================================
   HISTORY ROW
   ================================================================ */

function HistoryRow({ history }: { history: string[] }) {
  if (history.length === 0) return null;

  return (
    <div className="history-row">
      <span className="history-label">DERNIERS SIGNAUX</span>
      <div className="history-chips">
        {history.map((mult, idx) => {
          const numMult = parseFloat(mult);
          const isHigh = numMult >= 3;
          return (
            <span
              key={idx}
              className={`history-chip ${isHigh ? "history-chip-high" : ""}`}
            >
              {mult}x
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================
   GAME VIEWPORT (Crash Games)
   ================================================================ */

function CrashGameViewport({
  config,
  predStatus,
  multiplier,
}: {
  config: GameConfig;
  predStatus: PredStatus;
  multiplier: string | null;
}) {
  return (
    <div className="game-section">
      <CrashCurveCanvas curveColor={config.curveColor!} />
      <div className="game-viewport">
        <Image
          src={config.bg}
          alt={config.name}
          fill
          sizes="100vw"
          className="game-viewport-bg"
          priority
        />
        <div className="game-viewport-overlay" />
        <div className="game-viewport-gradient" />
        <MultiplierOverlay predStatus={predStatus} multiplier={multiplier} />
      </div>
    </div>
  );
}

/* ================================================================
   GAME VIEWPORT (Runner Game)
   ================================================================ */

function RunnerGameViewport({ config }: { config: GameConfig }) {
  return (
    <div className="game-section">
      <div className="game-viewport game-viewport-runner">
        <Image
          src={config.bg}
          alt={config.name}
          fill
          sizes="100vw"
          className="game-viewport-bg"
          priority
        />
        <div className="game-viewport-overlay" />
        <div className="game-viewport-gradient" />
      </div>
    </div>
  );
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
            const delay = pathIdx >= 0 ? pathIdx * 0.15 : 0;

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
  const [history, setHistory] = useState<string[]>([]);

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
      let newMult: string;
      if (isRunner) {
        const maxRows = getDifficultyRows(difficulty);
        const path = generateSafePath(5, maxRows, 8);
        setSafePath(path);
        newMult = generateRunnerMultiplier(difficulty);
        setMultiplier(newMult);
      } else {
        newMult = generateMultiplier(config.minMult!, config.maxMult!);
        setMultiplier(newMult);
      }
      setBounceKey((k) => k + 1);
      setPredStatus("active");
      setHistory((prev) => [newMult, ...prev].slice(0, 5));
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
    predStatus === "predicting"
      ? "Analyse..."
      : predStatus === "active"
        ? "Signal actif"
        : "Pret";

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
  const runnerMultLabel =
    isRunner && multiplier && predStatus === "active"
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

        {/* Game Viewport */}
        {!isRunner ? (
          <CrashGameViewport config={config} predStatus={predStatus} multiplier={multiplier} />
        ) : (
          <RunnerGameViewport config={config} />
        )}

        {/* History Row (crash games) */}
        {!isRunner && <HistoryRow history={history} />}

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
