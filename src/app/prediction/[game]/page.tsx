"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

/* ================================================================
   GAME CONFIGURATION
   ================================================================ */

interface GameConfig {
  name: string;
  slug: string;
  minMult: number;
  maxMult: number;
  baseInterval: number;
  tileImg: string;
}

const GAME_CONFIGS: Record<string, GameConfig> = {
  aero: { name: "Aero", slug: "aero", minMult: 1.2, maxMult: 5.0, baseInterval: 12000, tileImg: "/games/aero_tile.png" },
  jetx: { name: "JetX", slug: "jetx", minMult: 1.1, maxMult: 6.0, baseInterval: 10000, tileImg: "/games/jetx_tile.jpg" },
  laburun: { name: "Labu Run", slug: "laburun", minMult: 1.2, maxMult: 4.5, baseInterval: 15000, tileImg: "/games/laburun_tile.png" },
  aviator: { name: "Aviator", slug: "aviator", minMult: 1.0, maxMult: 8.0, baseInterval: 8000, tileImg: "/games/aviator_tile.png" },
  aviatrix: { name: "Aviatrix", slug: "aviatrix", minMult: 1.1, maxMult: 5.5, baseInterval: 11000, tileImg: "/games/aviatrix_tile.webp" },
};

/* ================================================================
   PREDICTION ENGINE (EWMA-based)
   ================================================================ */

const HISTORY_LEN = 10;
const EWMA_ALPHA = 0.3;

function generateMultiplier(config: GameConfig, history: number[]): number {
  let base: number;
  if (history.length === 0) {
    base = (config.minMult + config.maxMult) / 2;
  } else {
    let ewma = history[0];
    for (let i = 1; i < history.length; i++) {
      ewma = EWMA_ALPHA * history[i] + (1 - EWMA_ALPHA) * ewma;
    }
    base = ewma;
  }
  const range = config.maxMult - config.minMult;
  const noise = (Math.random() - 0.5) * range * 0.6;
  const raw = base + noise;
  return Math.max(config.minMult, Math.min(config.maxMult, raw));
}

/* ================================================================
   STATUS TYPES
   ================================================================ */

type PredictionStatus = "waiting" | "calculating" | "live" | "ended";

const STATUS_LABELS: Record<PredictionStatus, string> = {
  waiting: "En attente",
  calculating: "Calcul...",
  live: "En direct",
  ended: "En attente",
};

const STATUS_COLORS: Record<PredictionStatus, string> = {
  waiting: "#e8b830",
  calculating: "#e8b830",
  live: "#00e676",
  ended: "#e8b830",
};

/* ================================================================
   SVG ICONS
   ================================================================ */

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

/* ================================================================
   PREDICTION PAGE COMPONENT
   ================================================================ */

export default function PredictionPage() {
  const params = useParams();
  const router = useRouter();
  const gameSlug = params.game as string;

  const config = useMemo(() => GAME_CONFIGS[gameSlug], [gameSlug]);

  const [status, setStatus] = useState<PredictionStatus>("waiting");
  const [multiplier, setMultiplier] = useState<string>("--");
  const [bounceKey, setBounceKey] = useState(0);
  const [history, setHistory] = useState<number[]>([]);

  const historyRef = useRef<number[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const runCycleRef = useRef<() => void>(() => {});

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  /* Prediction cycle */
  const runCycle = useCallback(() => {
    clearAllTimeouts();

    if (!config) return;

    /* Step 1: Waiting (5-15s) */
    setStatus("waiting");
    setMultiplier("--");

    const waitDelay = 5000 + Math.random() * 10000;
    const t1 = setTimeout(() => {
      /* Step 2: Calculating (2-3s) */
      setStatus("calculating");

      const calcDelay = 2000 + Math.random() * 1000;
      const t2 = setTimeout(() => {
        /* Step 3: Generate & display multiplier */
        const newMult = generateMultiplier(config, historyRef.current);
        historyRef.current = [...historyRef.current.slice(-(HISTORY_LEN - 1)), newMult];
        setHistory([...historyRef.current]);
        setMultiplier("x" + newMult.toFixed(2));
        setBounceKey((k) => k + 1);
        setStatus("live");

        /* Step 4: Live for 8-15s, then restart */
        const liveDelay = 8000 + Math.random() * 7000;
        const t3 = setTimeout(() => {
          runCycleRef.current();
        }, liveDelay);
        timeoutsRef.current.push(t3);
      }, calcDelay);
      timeoutsRef.current.push(t2);
    }, waitDelay);
    timeoutsRef.current.push(t1);
  }, [config, clearAllTimeouts]);

  /* Keep ref in sync */
  useEffect(() => {
    runCycleRef.current = runCycle;
  }, [runCycle]);

  /* Start cycle on mount */
  useEffect(() => {
    const t = setTimeout(() => {
      runCycle();
    }, 0);
    return () => {
      clearTimeout(t);
      clearAllTimeouts();
    };
  }, [runCycle, clearAllTimeouts]);

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

  /* Invalid game slug */
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

  const statusDotColor = STATUS_COLORS[status];
  const statusLabel = STATUS_LABELS[status];

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
          <span
            className="pred-status-dot"
            style={{ backgroundColor: statusDotColor }}
          />
          <span className="pred-status-text">{statusLabel}</span>
        </div>
      </header>

      {/* Content */}
      <main className="pred-content">
        {/* Game Title */}
        <h1 className="pred-game-title">{config.name}</h1>

        {/* Game Preview */}
        <div className="pred-preview">
          <div className="pred-preview-glass">
            <div className="pred-preview-gradient-top" />
            <Image
              src={config.tileImg}
              alt={config.name}
              width={200}
              height={200}
              className="pred-preview-img"
              priority
            />
            <div className="pred-preview-gradient-bottom" />
          </div>
        </div>

        {/* Prediction Card */}
        <div className="pred-card" key={bounceKey}>
          <div className="pred-card-shimmer" />
          <div className="pred-card-inner">
            <span className="pred-card-label">PROCHAINE PREDICTION</span>
            <span className={`pred-card-value ${status === "live" ? "pred-bounce" : ""}`}>
              {multiplier}
            </span>
            <span className="pred-card-state">
              {status === "waiting" || status === "ended"
                ? "Preparation du signal..."
                : status === "calculating"
                  ? "Calcul en cours..."
                  : "Prediction active"}
            </span>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="pred-history">
            <span className="pred-history-label">Historique</span>
            <div className="pred-history-items">
              {history.map((m, i) => (
                <span key={i} className="pred-history-chip">
                  {m.toFixed(2)}x
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
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
