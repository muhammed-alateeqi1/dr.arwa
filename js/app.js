(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* Message                                                             */
  /* ------------------------------------------------------------------ */

  // Each line is typed in order, top to bottom, styled by its variant
  // (dedication / greeting / body / signature) via CSS.
  function buildMessage() {
    return [
      { text: "إلى د/ أروى 🤍", variant: "dedication" },
      { text: "يا دكتور،", variant: "greeting" },
      { text: "كنت بس حابة أقولك إني بحبك جدًا 🤍", variant: "body" },
      { text: "يمكن بخاف أعصب حضرتك أوقات، بس بحب جدًا الشغل والمناقشات معاكي.", variant: "body" },
      { text: "وحتى لما تقوليلي إن الديزاين \"ugly\" 😂\nببقى عارفة إن دي علامة إن لسه قدامي مستوى أعلى أوصله.", variant: "body" },
      { text: "وبالمناسبة...", variant: "body" },
      { text: "اختصرت الرسالة جدًا،\nحفاظًا على أعصاب حضرتك من أي رغي زيادة. 😂🤍", variant: "body" },
      { text: "— إسراء عاطف", variant: "signature" }
    ];
  }

  /* ------------------------------------------------------------------ */
  /* Ambient particles                                                   */
  /* ------------------------------------------------------------------ */

  function spawnParticles() {
    const host = document.getElementById("particles");
    if (!host || prefersReducedMotion) return;
    const count = window.innerWidth < 640 ? 12 : 18;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      const size = (3 + Math.random() * 4).toFixed(1);
      const duration = (11 + Math.random() * 9).toFixed(1);
      const delay = (-Math.random() * 20).toFixed(1);
      const drift = Math.round((Math.random() - 0.5) * 90);
      const peak = (0.25 + Math.random() * 0.4).toFixed(2);
      p.style.setProperty("--x", `${Math.round(Math.random() * 100)}%`);
      p.style.setProperty("--size", `${size}px`);
      p.style.setProperty("--duration", `${duration}s`);
      p.style.setProperty("--delay", `${delay}s`);
      p.style.setProperty("--drift", `${drift}px`);
      p.style.setProperty("--peak", peak);
      frag.appendChild(p);
    }
    host.appendChild(frag);
  }

  /* ------------------------------------------------------------------ */
  /* Haptics                                                             */
  /* ------------------------------------------------------------------ */

  function buzz(ms) {
    if (navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (_) { /* ignore */ }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Typing engine                                                       */
  /* ------------------------------------------------------------------ */

  // Types an array of {text, variant} lines, one after another, top to bottom,
  // each rendered as its own <p class="card__line card__line--{variant}">.
  function typeMessage(container, lines, opts) {
    const {
      baseMin = 36,
      baseMax = 48,
      commaPause = 200,
      periodPause = 360,
      linePause = 550,
      signaturePause = 780,
      onDone = () => {}
    } = opts || {};

    container.textContent = "";
    const state = { skipped: prefersReducedMotion };

    const skip = () => { state.skipped = true; };

    const wait = (ms) => new Promise((resolve) => {
      if (state.skipped) return resolve();
      setTimeout(resolve, ms);
    });

    const isCommaChar = (ch) => ch === "," || ch === "،";
    const isStopChar = (ch) => ch === "." || ch === "!" || ch === "؟" || ch === "?";

    async function run() {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (i > 0) {
          await wait(line.variant === "signature" ? signaturePause : linePause);
        }

        const p = document.createElement("p");
        const gapClass = i === 0
          ? null
          : line.variant === "signature"
            ? null
            : lines[i - 1].variant === "dedication"
              ? "card__line--after-dedication"
              : "card__line--gap";
        p.className = ["card__line", `card__line--${line.variant}`, gapClass].filter(Boolean).join(" ");
        container.appendChild(p);

        const textNode = document.createTextNode("");
        const caret = document.createElement("span");
        caret.className = "caret";
        caret.textContent = "​";
        p.appendChild(textNode);
        p.appendChild(caret);

        if (state.skipped) {
          textNode.appendData(line.text);
        } else {
          for (const ch of line.text) {
            textNode.appendData(ch);
            if (state.skipped) continue;
            let delay = baseMin + Math.random() * (baseMax - baseMin);
            if (isCommaChar(ch)) delay += commaPause;
            else if (isStopChar(ch)) delay += periodPause;
            await wait(delay);
          }
        }
        caret.remove();
      }
      onDone();
    }

    run();
    return skip;
  }

  /* ------------------------------------------------------------------ */
  /* Card interaction                                                    */
  /* ------------------------------------------------------------------ */

  function initCard() {
    const card = document.getElementById("card");
    const seal = document.getElementById("seal");
    const cardBody = document.getElementById("cardBody");
    const messageEl = document.getElementById("message");
    const replay = document.getElementById("replay");

    let skipTyping = null;
    let opened = false;

    function openCard() {
      if (opened) return;
      opened = true;
      buzz(14);
      card.classList.add("is-open");
      cardBody.hidden = false;

      skipTyping = typeMessage(messageEl, buildMessage(), {
        onDone: () => {
          replay.hidden = false;
          requestAnimationFrame(() => replay.classList.add("is-visible"));
        }
      });
    }

    seal.addEventListener("click", openCard);

    cardBody.addEventListener("click", (e) => {
      if (e.target.closest(".card__replay")) return;
      if (skipTyping) skipTyping();
    });

    replay.addEventListener("click", (e) => {
      e.stopPropagation();
      opened = false;
      card.classList.remove("is-open");
      replay.classList.remove("is-visible");
      window.setTimeout(() => {
        cardBody.hidden = true;
        replay.hidden = true;
        messageEl.textContent = "";
      }, 550);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Opening animation orchestration                                     */
  /* ------------------------------------------------------------------ */

  function initIntro() {
    const intro = document.getElementById("intro");
    const experience = document.getElementById("experience");
    const flash = document.getElementById("flash");
    const skipBtn = document.getElementById("skipIntro");

    const T = prefersReducedMotion
      ? { fall: 60, bounce: 60, settle: 40, text: 60, hold: 120, exit: 60 }
      : { fall: 950, bounce: 900, settle: 300, text: 1250, hold: 1500, exit: 900 };

    let finished = false;
    const timers = [];
    const after = (ms, fn) => timers.push(window.setTimeout(fn, ms));

    function finish() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);

      buzz(10);
      flash.classList.add("is-pulsing");
      intro.classList.add("is-exiting");
      experience.classList.add("is-visible");

      window.setTimeout(() => {
        intro.classList.add("is-gone");
        intro.setAttribute("aria-hidden", "true");
        const seal = document.getElementById("seal");
        if (seal) seal.focus({ preventScroll: true });
      }, T.exit);
    }

    skipBtn.addEventListener("click", finish);
    intro.addEventListener("click", (e) => {
      if (e.target === skipBtn) return;
      if (intro.classList.contains("is-skippable")) finish();
    });

    requestAnimationFrame(() => {
      intro.classList.add("is-falling");
      buzz(6);

      after(T.fall, () => {
        intro.classList.remove("is-falling");
        intro.classList.add("is-landed");
        buzz(16);
      });

      after(T.fall + T.bounce, () => {
        intro.classList.add("is-idle");
      });

      after(T.fall + T.bounce + T.settle, () => {
        intro.classList.add("is-texting");
        intro.classList.add("is-skippable");
      });

      after(T.fall + T.bounce + T.settle + T.text + T.hold, finish);
    });
  }

  /* ------------------------------------------------------------------ */

  document.addEventListener("DOMContentLoaded", () => {
    spawnParticles();
    initCard();
    initIntro();
  });
})();
