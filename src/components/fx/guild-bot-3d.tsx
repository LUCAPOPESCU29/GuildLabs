"use client";

/**
 * <GuildBot3D /> — GuildLabs' CSS-3D robot mascot.
 *
 * Ported from the Claude Design "GuildLabs 3D Robot" handoff: a pure-CSS 3D
 * cuboid head (no WebGL) with a glowing mint screen, antenna, smile, floating
 * idle bob and ground shadow. The head tilts toward the pointer, the eyes
 * drift, it blinks, and it hops on click. Brand purple/mint. Reduced-motion
 * safe (float/tilt/blink/hop all disabled).
 *
 * Self-contained: the CSS lives in a scoped <style> block keyed to `.gl-*`
 * classes (prefixed to avoid collisions), so it drops in anywhere — just size
 * the wrapper.
 */

import * as React from "react";
import { useReducedMotion } from "framer-motion";

const CSS = `
.gl-bot-scene{ width:100%; height:100%; perspective:1100px; perspective-origin:50% 42%; cursor:pointer; user-select:none; }
.gl-bot{ position:relative; width:100%; height:100%; transform-style:preserve-3d; transform:rotateX(0) rotateY(0); transition:transform .25s cubic-bezier(.22,.61,.36,1); animation:gl-float 5.5s ease-in-out infinite; }
@keyframes gl-float{ 0%,100%{margin-top:0} 50%{margin-top:-16px} }
.gl-rig{ position:absolute; inset:0; transform-style:preserve-3d; }
.gl-antenna{ position:absolute; left:50%; top:34px; width:12px; height:62px; transform:translateX(-50%) translateZ(8px); transform-style:preserve-3d; }
.gl-antenna .stalk{ position:absolute; left:50%; top:18px; width:10px; height:46px; border-radius:6px; transform:translateX(-50%); background:linear-gradient(90deg,#D2CDE8,#fff 45%,#EAE7F6); }
.gl-antenna .ball{ position:absolute; left:50%; top:-4px; width:30px; height:30px; border-radius:50%; transform:translateX(-50%); background:radial-gradient(circle at 34% 30%, #7CF3C2, #3FE3A3 55%, #1FB87E 100%); box-shadow:0 0 18px rgba(63,227,163,.7), inset -3px -4px 8px rgba(0,0,0,.18); }
.gl-head{ position:absolute; left:50%; top:96px; width:220px; height:196px; margin-left:-110px; transform-style:preserve-3d; }
.gl-face{ position:absolute; border-radius:46px; }
.gl-face.face-front{ width:220px; height:196px; background:linear-gradient(150deg,#FFFFFF 0%,#F1EEFA 60%,#E4E0F2 100%); transform:translateZ(46px); box-shadow:inset 0 4px 10px rgba(255,255,255,.9), inset 0 -10px 22px rgba(124,92,255,.10); }
.gl-face.face-back{ width:220px; height:196px; background:#D2CDE8; transform:translateZ(-46px) rotateY(180deg); }
.gl-face.face-right{ width:92px; height:196px; border-radius:40px; left:220px; background:linear-gradient(180deg,#E9E5F5,#CFC9E6); transform:translateX(-46px) rotateY(90deg); }
.gl-face.face-left{ width:92px; height:196px; border-radius:40px; left:-92px; background:linear-gradient(180deg,#E2DDF1,#C7C1E0); transform:translateX(46px) rotateY(-90deg); }
.gl-face.face-top{ width:220px; height:92px; border-radius:40px; top:-46px; background:linear-gradient(180deg,#FFFFFF,#F3F0FB); transform:translateY(46px) rotateX(90deg); }
.gl-face.face-bottom{ width:220px; height:92px; border-radius:40px; top:196px; background:linear-gradient(180deg,#D8D3EC,#C4BEDE); transform:translateY(-46px) rotateX(-90deg); }
.gl-screen{ position:absolute; left:32px; top:40px; width:156px; height:116px; border-radius:34px; transform:translateZ(48px); background:radial-gradient(120% 120% at 50% 18%, #3A2566 0%, #2A1B4A 70%); box-shadow:inset 0 6px 16px rgba(0,0,0,.45), 0 2px 4px rgba(255,255,255,.5); overflow:hidden; }
.gl-screen::before{ content:""; position:absolute; inset:0; background:linear-gradient(135deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 42%); }
.gl-eyes{ position:absolute; left:0; right:0; top:34px; display:flex; justify-content:center; gap:30px; transition:transform .12s ease-out; }
.gl-eye{ width:26px; height:26px; border-radius:50%; background:radial-gradient(circle at 36% 30%, #7CF3C2, #3FE3A3 60%, #20BD82 100%); box-shadow:0 0 12px rgba(63,227,163,.8); transition:transform .08s ease-out, height .09s ease; }
.gl-bot.blink .gl-eye{ height:4px; }
.gl-smile{ position:absolute; left:50%; top:78px; width:64px; height:30px; transform:translateX(-50%); border:6px solid #3FE3A3; border-top:none; border-radius:0 0 60px 60px; box-shadow:0 0 10px rgba(63,227,163,.5); }
.gl-shadow{ position:absolute; left:50%; bottom:34px; width:200px; height:34px; margin-left:-100px; background:radial-gradient(50% 50% at 50% 50%, rgba(40,18,90,.45), rgba(40,18,90,0) 70%); border-radius:50%; animation:gl-shadow 5.5s ease-in-out infinite; }
@keyframes gl-shadow{ 0%,100%{transform:scale(1);opacity:.55} 50%{transform:scale(.82);opacity:.35} }
.gl-celebrate{ position:absolute; inset:0; transform-style:preserve-3d; }
.gl-spark{ position:absolute; left:50%; top:42%; width:11px; height:11px; border-radius:50%; pointer-events:none; z-index:20; }
.gl-bubble{ position:absolute; left:50%; top:2px; z-index:30; transform:translateX(-50%); padding:7px 13px; border-radius:15px; background:#fff; color:#2A1B4A; font-weight:800; font-size:13px; line-height:1; white-space:nowrap; box-shadow:0 10px 26px rgba(40,18,90,.4); animation:gl-pop .26s cubic-bezier(.34,1.56,.64,1); }
.gl-bubble::after{ content:""; position:absolute; left:50%; bottom:-6px; width:14px; height:14px; background:#fff; transform:translateX(-50%) rotate(45deg); border-radius:3px; }
@keyframes gl-pop{ from{transform:translateX(-50%) scale(.5); opacity:0} to{transform:translateX(-50%) scale(1); opacity:1} }
@media (prefers-reduced-motion:reduce){ .gl-bot{animation:none} .gl-shadow{animation:none} }
`;

const QUIPS = ["Let's build! 🚀", "👑", "Beep boop ✨", "Hi there!", "To the server!", "gm ☀️", "Nice click 😄", "Free forever 💜"];

export function GuildBot3D({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const sceneRef = React.useRef<HTMLDivElement>(null);
  const botRef = React.useRef<HTMLDivElement>(null);
  const eyesRef = React.useRef<HTMLDivElement>(null);
  const celebrateRef = React.useRef<HTMLDivElement>(null);
  const bubbleTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [quip, setQuip] = React.useState<string | null>(null);

  React.useEffect(() => {
    const scene = sceneRef.current;
    const bot = botRef.current;
    const eyes = eyesRef.current;
    if (!scene || !bot || !eyes) return;

    // Skip the per-frame rAF + pointer tracking when there's no fine pointer
    // (touch devices) or motion is reduced — it would otherwise run forever on
    // phones for no benefit. The bot still floats via its CSS animation.
    if (reduce || !window.matchMedia("(pointer: fine)").matches) {
      bot.style.transform = "rotateY(14deg) rotateX(-6deg)";
      return;
    }

    let tx = 0, ty = 0, cx = 0, cy = 0;
    let raf = 0;
    const blinkTimers: ReturnType<typeof setTimeout>[] = [];

    const onMove = (e: MouseEvent) => {
      const r = scene.getBoundingClientRect();
      const px = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const py = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      tx = Math.max(-1, Math.min(1, px));
      ty = Math.max(-1, Math.min(1, py));
    };
    const recenter = () => { tx = 0; ty = 0; };

    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      bot.style.transform = `rotateY(${cx * 22}deg) rotateX(${-cy * 16}deg)`;
      eyes.style.transform = `translate(${cx * 7}px, ${cy * 5}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const blink = () => {
      bot.classList.add("blink");
      blinkTimers.push(setTimeout(() => bot.classList.remove("blink"), 140));
      blinkTimers.push(setTimeout(blink, 2600 + Math.random() * 3200));
    };
    blinkTimers.push(setTimeout(blink, 1800));

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", recenter);

    return () => {
      cancelAnimationFrame(raf);
      blinkTimers.forEach(clearTimeout);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", recenter);
    };
  }, [reduce]);

  // Clear the speech-bubble timer on unmount.
  React.useEffect(() => () => clearTimeout(bubbleTimer.current), []);

  // ── Click: spin + bounce, a burst of brand sparkles, and a quip bubble ──
  function spawnSparks() {
    const scene = sceneRef.current;
    if (!scene) return;
    const colors = ["#3FE3A3", "#7C5CFF", "#FB7185", "#7CF3C2", "#A855F7"];
    for (let i = 0; i < 16; i++) {
      const s = document.createElement("span");
      s.className = "gl-spark";
      const c = colors[i % colors.length];
      s.style.background = c;
      s.style.boxShadow = `0 0 8px ${c}`;
      scene.appendChild(s);
      const ang = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 70 + Math.random() * 70;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist - 24;
      const anim = s.animate(
        [
          { transform: "translate(-50%,-50%) translate(0,0) scale(.4)", opacity: 1 },
          { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(1)`, opacity: 1, offset: 0.7 },
          { transform: `translate(-50%,-50%) translate(${dx * 1.2}px,${dy * 1.2 + 28}px) scale(0)`, opacity: 0 },
        ],
        { duration: 700 + Math.random() * 300, easing: "cubic-bezier(.2,.6,.3,1)" }
      );
      anim.onfinish = () => s.remove();
    }
  }

  function celebrate() {
    setQuip(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setQuip(null), 1500);
    if (reduce) return;
    celebrateRef.current?.animate(
      [
        { transform: "rotateY(0deg) translateY(0) scale(1)" },
        { transform: "rotateY(180deg) translateY(-44px) scale(1.06)", offset: 0.5 },
        { transform: "rotateY(360deg) translateY(0) scale(1)" },
      ],
      { duration: 760, easing: "cubic-bezier(.34,1.56,.64,1)" }
    );
    spawnSparks();
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div ref={sceneRef} onClick={celebrate} className={`gl-bot-scene ${className}`} aria-label="GuildLabs robot mascot — click me" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); celebrate(); } }}>
        {quip && <div className="gl-bubble">{quip}</div>}
        <div className="gl-shadow" />
        <div ref={celebrateRef} className="gl-celebrate">
          <div ref={botRef} className="gl-bot">
            <div className="gl-rig">
              <div className="gl-antenna">
                <div className="stalk" />
                <div className="ball" />
              </div>
              <div className="gl-head">
                <div className="gl-face face-back" />
                <div className="gl-face face-right" />
                <div className="gl-face face-left" />
                <div className="gl-face face-top" />
                <div className="gl-face face-bottom" />
                <div className="gl-face face-front" />
                <div className="gl-screen">
                  <div ref={eyesRef} className="gl-eyes">
                    <div className="gl-eye" />
                    <div className="gl-eye" />
                  </div>
                  <div className="gl-smile" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
