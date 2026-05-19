"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

/* ───────── SVG ICONS ───────── */

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

/* ───────── GAME DATA ───────── */

const games = [
  { name: "Aero", slug: "aero", img: "/games/aero.png", provider: "Turbo Games", href: "/prediction/aero" },
  { name: "JetX", slug: "jetx", img: "/games/jetx.jpg", provider: "SmartSoft", href: "/prediction/jetx" },
  { name: "Labu Run", slug: "laburun", img: "/games/laburun.png", provider: "PoggiPlay", href: "/prediction/laburun" },
  { name: "Aviator", slug: "aviator", img: "/games/aviator.jpg", provider: "Spribe", href: "/prediction/aviator" },
  { name: "Aviatrix", slug: "aviatrix", img: "/games/aviatrix.jpg", provider: "Aviatrix", href: "/prediction/aviatrix" },
];

/* ───────── MAIN PAGE ───────── */

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMenuOpen((v) => !v);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const openInfo = useCallback(() => {
    closeMenu();
    setInfoOpen(true);
  }, [closeMenu]);

  const closeInfo = useCallback(() => {
    setInfoOpen(false);
  }, []);

  /* Zoom block */
  useEffect(() => {
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    const preventDoubleTap = (() => {
      let last = 0;
      return () => {
        const now = Date.now();
        if (now - last <= 300) return true;
        last = now;
        return false;
      };
    })();

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

    /* Force viewport meta on resize */
    const lockViewport = () => {
      const vp = document.querySelector('meta[name="viewport"]');
      if (vp) vp.setAttribute("content", "width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover");
    };
    window.addEventListener("resize", lockViewport);
    setTimeout(lockViewport, 500);

    return () => {
      document.removeEventListener("touchstart", preventZoom);
      document.removeEventListener("touchmove", preventZoom);
      document.removeEventListener("gesturestart", onGesture);
      document.removeEventListener("gesturechange", onGesture);
      document.removeEventListener("gestureend", onGesture);
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", lockViewport);
    };
  }, []);

  return (
    <>
      {/* ── Top Bar ── */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <Image src="/logo.png" alt="BNET54" className="logo" width={36} height={36} priority />
            <span className="brand">BNET54</span>
          </div>
          <button className="menu-btn" onClick={toggleMenu} aria-label="Menu">
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* ── Overlay ── */}
      <div className={`overlay ${menuOpen ? "open" : ""}`} onClick={closeMenu} />

      {/* ── Dropdown Menu ── */}
      <nav className={`dropdown ${menuOpen ? "open" : ""}`} role="navigation">
        <a href="https://t.me/BNET54" target="_blank" rel="noopener" onClick={closeMenu}>
          <TelegramIcon />
          Canal Telegram
        </a>
        <a href="https://t.me/BNET54_Support" target="_blank" rel="noopener" onClick={closeMenu}>
          <PhoneIcon />
          Contact Telegram
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); openInfo(); }}>
          <ShieldIcon />
          Prediction
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); openInfo(); }}>
          <InfoIcon />
          Info
        </a>
      </nav>

      {/* ── Subtitle ── */}
      <section className="subtitle">
        <h2>BNET54 Prediction</h2>
      </section>

      {/* ── Games Grid ── */}
      <main className="games-grid">
        {games.map((game) => (
          <a key={game.slug} className="game" href={game.href}>
            <div className="game-card">
              <div className="glow" />
              <Image
                src={game.img}
                alt={game.name}
                className="game-img"
                width={400}
                height={300}
                loading="lazy"
              />
            </div>
          </a>
        ))}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <p>Tout droit reserve a BNET54</p>
      </footer>

      {/* ── Info Modal ── */}
      <div className={`info-modal ${infoOpen ? "open" : ""}`} role="dialog" aria-modal="true">
        <div className="info-modal-bg" onClick={closeInfo} />
        <div className="info-modal-sheet">
          <div className="info-modal-handle" />
          <div className="info-modal-header">
            <h3>BNET54 Info</h3>
            <button className="info-modal-close" onClick={closeInfo} aria-label="Fermer">
              <CloseIcon />
            </button>
          </div>
          <div className="info-modal-body">
            <div className="info-section">
              <h4>A propos</h4>
              <p>
                BNET54 est une plateforme de prediction de jeux avancee qui utilise des algorithmes
                d&apos;intelligence artificielle et des systemes d&apos;analyse de donnees de pointe pour
                fournir des predictions precises et fiables. Notre technologie analyse en temps reel les
                tendances, les patterns et les probabilites pour maximiser vos chances de gain sur chaque
                partie.
              </p>
            </div>

            <div className="info-section">
              <h4>Jeux disponibles</h4>
              <div className="info-games-grid">
                {games.map((g) => (
                  <div key={g.slug} className="info-game-item">
                    <strong>{g.name}</strong>
                    <span>{g.provider} - Crash Game</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="info-section">
              <h4>Code Promo BNET54</h4>
              <div className="info-promo">
                <p>Utilisez ce code lors de votre inscription</p>
                <div className="info-promo-code">BNET54</div>
                <div className="bonus">+500% BONUS</div>
                <p>
                  Le code promo BNET54 vous donne un bonus de 500% sur votre premier depot. Nos licences
                  de prediction sont entierement synchronisees avec l&apos;utilisation de ce code, garantissant
                  ainsi des chances de gain optimales et une experience premium.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
