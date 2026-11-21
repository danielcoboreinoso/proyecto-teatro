/* ============================================================
   LUCES Y SOMBRAS — JavaScript principal
   Menú, cuenta atrás, animaciones, formularios y reservas
   ============================================================ */

(() => {
  "use strict";

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* Funciones de la temporada. Cambia aquí fechas, horas y etiquetas. */
  const SHOWS = [
    {
      id: "estreno",
      iso: "2027-02-05T20:00:00+01:00",
      label: "Viernes 5 de febrero de 2027",
    },
    {
      id: "especial",
      iso: "2027-03-20T20:00:00+01:00",
      label: "Sábado 20 de marzo de 2027",
    },
  ];
  const showsById = new Map(SHOWS.map((show) => [show.id, show]));

  const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

  const formatShowDate = (show) => {
    const date = new Date(show.iso);
    const formatted = new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
    return `${capitalize(formatted)} · 19:00 h`;
  };

  const nextUpcomingShow = () =>
    SHOWS.find((show) => new Date(show.iso).getTime() > Date.now()) || null;

  /* ---------- Header, barra de progreso y volver arriba ---------- */
  const header = $("#site-header");
  const progressBar = $(".scroll-progress span");
  const toTopButton = $("#to-top");
  let scrollTicking = false;

  function updateScrollUI() {
    const y = window.scrollY || window.pageYOffset;
    header?.classList.toggle("is-scrolled", y > 30);
    toTopButton?.classList.toggle("is-visible", y > 650);

    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(y / max, 1) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
    }
    scrollTicking = false;
  }

  function requestScrollUpdate() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollUI);
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  updateScrollUI();

  toTopButton?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion.matches ? "auto" : "smooth",
    });
  });

  /* ---------- Menú móvil ---------- */
  const navToggle = $(".nav-toggle");
  const nav = $("#nav");
  let navOpen = false;

  function setNav(open) {
    navOpen = open;
    document.body.classList.toggle("nav-open", open);
    document.documentElement.classList.toggle("is-locked", open);
    navToggle?.setAttribute("aria-expanded", String(open));
    navToggle?.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }

  navToggle?.addEventListener("click", () => setNav(!navOpen));

  $$(".nav a").forEach((link) => {
    link.addEventListener("click", () => setNav(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navOpen) {
      setNav(false);
      navToggle?.focus();
    }
  });

  const desktopQuery = window.matchMedia("(min-width: 981px)");
  const handleDesktopChange = (event) => {
    if (event.matches) setNav(false);
  };
  if (desktopQuery.addEventListener) {
    desktopQuery.addEventListener("change", handleDesktopChange);
  } else {
    desktopQuery.addListener(handleDesktopChange);
  }

  /* ---------- Enlace activo según la sección visible ---------- */
  const navLinks = $$(".nav__link");
  const sections = $$("main section[id]");

  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const currentHash = `#${entry.target.id}`;

          navLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === currentHash;
            link.classList.toggle("is-active", isActive);
            if (isActive) {
              link.setAttribute("aria-current", "page");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ---------- Revelado de elementos al hacer scroll ---------- */
  const revealElements = $$("[data-reveal]");

  if (!reduceMotion.matches && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  /* ---------- Cuenta atrás ---------- */
  const cardCountdowns = $$("[data-countdown]")
    .map((element) => {
      const show = showsById.get(element.dataset.show);
      if (!show) return null;
      return {
        element,
        target: new Date(show.iso).getTime(),
      };
    })
    .filter(Boolean);

  const heroCountdown = $("[data-next-countdown]");
  const heroDate = $("[data-next-date]");
  let heroShow = nextUpcomingShow();
  let heroTarget = heroShow ? new Date(heroShow.iso).getTime() : null;

  if (heroDate) {
    heroDate.textContent = heroShow
      ? formatShowDate(heroShow)
      : "Muy pronto, nueva temporada";
  }

  if (!heroShow) {
    heroCountdown?.remove();
  }

  function paintCountdown(element, target) {
    const difference = target - Date.now();
    const remaining = Math.max(0, difference);
    const values = {
      days: Math.floor(remaining / 86400000),
      hours: Math.floor((remaining % 86400000) / 3600000),
      minutes: Math.floor((remaining % 3600000) / 60000),
      seconds: Math.floor((remaining % 60000) / 1000),
    };

    Object.entries(values).forEach(([unit, value]) => {
      const node = element.querySelector(`[data-unit="${unit}"]`);
      if (node) node.textContent = String(value).padStart(2, "0");
    });

    element.classList.toggle("is-finished", difference <= 0);
  }

  function tickCountdowns() {
    cardCountdowns.forEach(({ element, target }) => {
      const finished = target - Date.now() <= 0;
      paintCountdown(element, target);

      const card = element.closest("[data-show-card]");
      if (card) {
        card.classList.toggle("is-past", finished);
        if (finished) {
          const tag = card.querySelector("[data-show-tag]");
          if (tag) tag.textContent = "Finalizada";
        }
      }
    });

    if (heroCountdown && heroShow) {
      const upcoming = nextUpcomingShow();
      if (upcoming && upcoming.id !== heroShow.id) {
        heroShow = upcoming;
        heroTarget = new Date(upcoming.iso).getTime();
        if (heroDate) heroDate.textContent = formatShowDate(upcoming);
      }
      if (heroTarget !== null) paintCountdown(heroCountdown, heroTarget);
    }
  }

  if (cardCountdowns.length || heroCountdown) {
    tickCountdowns();
    window.setInterval(tickCountdowns, 1000);
  }

  /* ---------- Luz que sigue al cursor en el hero ---------- */
  const hero = $(".hero");
  const heroGlow = $(".hero__glow");

  if (hero && heroGlow && finePointer.matches && !reduceMotion.matches) {
    let glowFrame = null;
    let glowX = 0;
    let glowY = 0;

    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      glowX = event.clientX - rect.left;
      glowY = event.clientY - rect.top;

      if (glowFrame) return;
      glowFrame = window.requestAnimationFrame(() => {
        heroGlow.style.setProperty("--mx", `${glowX}px`);
        heroGlow.style.setProperty("--my", `${glowY}px`);
        glowFrame = null;
      });
    });
  }

  /* ---------- Inclinación del póster ---------- */
  const poster = $("[data-tilt]");

  if (poster && finePointer.matches && !reduceMotion.matches) {
    const resetTilt = () => {
      poster.style.setProperty("--rx", "0deg");
      poster.style.setProperty("--ry", "0deg");
    };

    poster.addEventListener("pointermove", (event) => {
      const rect = poster.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      poster.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
      poster.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
    });

    poster.addEventListener("pointerleave", resetTilt);
    poster.addEventListener("pointercancel", resetTilt);
  }

  /* ---------- Polvo de luz sobre el escenario ---------- */
  const canvas = $(".hero__dust");

  if (canvas && !reduceMotion.matches) {
    const context = canvas.getContext("2d");

    if (context) {
      let particles = [];
      let canvasWidth = 0;
      let canvasHeight = 0;
      let animationId = null;
      let resizeTimer = null;

      const random = (min, max) => Math.random() * (max - min) + min;

      const createParticle = (initial = false) => ({
        x: random(0, canvasWidth),
        y: initial ? random(0, canvasHeight) : canvasHeight + random(0, 40),
        radius: random(0.5, 1.9),
        speed: random(0.08, 0.32),
        drift: random(-0.14, 0.14),
        alpha: random(0.12, 0.55),
        twinkle: random(0.005, 0.016),
        phase: random(0, Math.PI * 2),
      });

      const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvasWidth = rect.width;
        canvasHeight = rect.height;
        canvas.width = Math.floor(canvasWidth * dpr);
        canvas.height = Math.floor(canvasHeight * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.max(18, Math.min(60, Math.floor(canvasWidth / 24)));
        particles = Array.from({ length: count }, () => createParticle(true));
      };

      const draw = () => {
        context.clearRect(0, 0, canvasWidth, canvasHeight);

        particles.forEach((particle) => {
          particle.y -= particle.speed;
          particle.phase += particle.twinkle;
          particle.x += particle.drift + Math.sin(particle.phase) * 0.08;

          if (
            particle.y < -10 ||
            particle.x < -10 ||
            particle.x > canvasWidth + 10
          ) {
            Object.assign(particle, createParticle(false), {
              x: random(0, canvasWidth),
            });
          }

          const alpha =
            particle.alpha * (0.6 + Math.sin(particle.phase) * 0.4);

          context.beginPath();
          context.arc(
            particle.x,
            particle.y,
            particle.radius,
            0,
            Math.PI * 2
          );
          context.fillStyle = `rgba(240, 212, 155, ${alpha.toFixed(3)})`;
          context.fill();
        });

        animationId = window.requestAnimationFrame(draw);
      };

      const startDust = () => {
        if (animationId === null && !document.hidden) {
          animationId = window.requestAnimationFrame(draw);
        }
      };

      const stopDust = () => {
        if (animationId !== null) {
          window.cancelAnimationFrame(animationId);
          animationId = null;
        }
      };

      resizeCanvas();
      startDust();

      window.addEventListener(
        "resize",
        () => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(resizeCanvas, 200);
        },
        { passive: true }
      );

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stopDust();
        else startDust();
      });

      if ("IntersectionObserver" in window) {
        const dustObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) startDust();
              else stopDust();
            });
          },
          { threshold: 0 }
        );
        dustObserver.observe(canvas);
      }
    }
  }

  /* ---------- Año del pie de página ---------- */
  $$("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  /* ---------- Contador de visitas ---------- */
  function setupVisitCounter() {
    const output = $("[data-visits]");
    if (!output) return;

    const BASE = "https://abacus.jasoncameron.dev";
    const NAMESPACE = "luces-y-sombras";
    const KEY = "visitas";
    const STORAGE_KEY = "luces-visitas-registradas";
    const LOCAL_COUNT_KEY = "luces-visitas-contador-local";
    const LAST_VALUE_KEY = "luces-visitas-ultimo-valor";
    /* Último valor real conocido antes de migrar de proveedor. */
    const MINIMUM_COUNT = 7;

    const noTracking =
      navigator.doNotTrack === "1" ||
      window.doNotTrack === "1" ||
      navigator.globalPrivacyControl === true;

    let alreadyCounted = false;
    try {
      alreadyCounted = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch (_) {
      /* Almacenamiento bloqueado: se cuenta la visita igualmente. */
    }

    function rememberValue(value) {
      try {
        window.localStorage.setItem(LAST_VALUE_KEY, String(value));
      } catch (_) {
        /* Nada que hacer si el navegador bloquea localStorage. */
      }
    }

    async function readCount(action) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(
          `${BASE}/${action}/${NAMESPACE}/${KEY}`,
          { cache: "no-store", signal: controller.signal }
        );
        if (!response.ok) throw new Error("Contador no disponible");
        const data = await response.json();
        const value = Number(data && data.value);
        if (!Number.isFinite(value)) throw new Error("Valor no válido");
        rememberValue(value);
        output.textContent = new Intl.NumberFormat("es-ES").format(value);
      } finally {
        window.clearTimeout(timeout);
      }
    }

    function markAsCounted() {
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch (_) {
        /* Nada que hacer si el navegador bloquea localStorage. */
      }
    }

    /* Si el servicio no responde, muestra el último valor conocido. */
    function showLocalCount(increment) {
      let value = MINIMUM_COUNT;
      try {
        const lastValue = Number(window.localStorage.getItem(LAST_VALUE_KEY));
        const localValue = Number(window.localStorage.getItem(LOCAL_COUNT_KEY));
        if (Number.isFinite(lastValue) && lastValue > 0) value = lastValue;
        if (Number.isFinite(localValue) && localValue > value) value = localValue;
      } catch (_) {
        /* Almacenamiento bloqueado: se muestra el mínimo conocido. */
      }
      if (increment) value += 1;
      if (value < MINIMUM_COUNT) value = MINIMUM_COUNT;
      try {
        window.localStorage.setItem(LOCAL_COUNT_KEY, String(value));
      } catch (_) {
        /* Nada que hacer si el navegador bloquea localStorage. */
      }
      output.textContent = new Intl.NumberFormat("es-ES").format(value);
    }

    /* Número visible desde el primer momento, sin esperar a la API. */
    const shouldCount = !alreadyCounted && !noTracking;
    showLocalCount(shouldCount);

    if (!shouldCount) {
      readCount("get").catch(() => {});
      return;
    }

    readCount("hit")
      .then(markAsCounted)
      .catch(() =>
        readCount("get")
          .then(() => markAsCounted())
          .catch(() => markAsCounted())
      );
  }

  setupVisitCounter();

  /* ---------- Formularios de reserva ---------- */
  function setupReservationForm(form, options = {}) {
    if (!form) return null;

    const container =
      form.closest(".booking__card") || form.closest(".modal__inner");
    const success = container?.querySelector("[data-success]");
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonHTML = submitButton ? submitButton.innerHTML : "";

    const fields = {
      name: form.querySelector('[name="name"]'),
      email: form.querySelector('[name="email"]'),
      show: form.querySelector('[name="show"]'),
      tickets: form.querySelector('[name="tickets"]'),
      privacy: form.querySelector('[name="privacy"]'),
    };

    const messages = {
      name: "Escribe tu nombre (mínimo 2 caracteres).",
      email: "Introduce un correo electrónico válido.",
      show: "Elige la función a la que quieres asistir.",
      tickets: "Indica un número de entradas entre 1 y 6.",
      privacy: "Necesitamos tu consentimiento para contactarte.",
    };

    function setFieldError(name, message) {
      const input = fields[name];
      const field = input?.closest(".field");
      const error = field?.querySelector(".field__error");

      field?.classList.toggle("has-error", Boolean(message));
      if (error) error.textContent = message || "";
      input?.setAttribute("aria-invalid", message ? "true" : "false");
    }

    function validateField(name) {
      const input = fields[name];
      if (!input) return true;

      let message = "";

      switch (name) {
        case "name":
          if (input.value.trim().length < 2) message = messages.name;
          break;
        case "email":
          if (!EMAIL_PATTERN.test(input.value.trim())) message = messages.email;
          break;
        case "show":
          if (!input.value) message = messages.show;
          break;
        case "tickets": {
          const amount = Number(input.value);
          if (!Number.isInteger(amount) || amount < 1 || amount > 6) {
            message = messages.tickets;
          }
          break;
        }
        case "privacy":
          if (!input.checked) message = messages.privacy;
          break;
        default:
          break;
      }

      setFieldError(name, message);
      return !message;
    }

    Object.entries(fields).forEach(([name, input]) => {
      if (!input) return;
      const eventName =
        input.tagName === "SELECT" || input.type === "checkbox"
          ? "change"
          : "input";

      input.addEventListener(eventName, () => {
        if (input.closest(".field")?.classList.contains("has-error")) {
          validateField(name);
        }
      });
    });

    function fillSuccessPanel(panel, data) {
      const values = {
        "[data-success-name]": data.name,
        "[data-success-email]": data.email,
        "[data-success-show]": data.showLabel,
        "[data-success-tickets]": `${data.tickets} ${
          Number(data.tickets) === 1 ? "entrada" : "entradas"
        }`,
      };

      Object.entries(values).forEach(([selector, value]) => {
        const element = panel.querySelector(selector);
        if (element) element.textContent = value;
      });
    }

    function resetForm({ focus = false } = {}) {
      form.reset();
      Object.keys(fields).forEach((name) => setFieldError(name, ""));
      if (success) success.hidden = true;
      form.hidden = false;

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove("is-loading");
        submitButton.innerHTML = originalButtonHTML;
      }

      if (focus) {
        fields.name?.focus({ preventScroll: true });
      }
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const isValid = Object.keys(fields).map(validateField).every(Boolean);

      if (!isValid) {
        const firstInvalid = form.querySelector(
          ".field.has-error input, .field.has-error select"
        );
        firstInvalid?.focus();
        return;
      }

      if (!success) return;

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add("is-loading");
        submitButton.textContent = "Enviando…";
      }

      const reservation = {
        name: fields.name.value.trim(),
        email: fields.email.value.trim(),
        showLabel:
          fields.show.options[fields.show.selectedIndex]?.text ||
          "la función elegida",
        tickets: fields.tickets.value,
      };

      /* Punto de integración: aquí conectarías tu backend,
         Formspree, EmailJS o el servicio de reservas que uses. */
      window.setTimeout(() => {
        form.hidden = true;
        success.hidden = false;
        fillSuccessPanel(success, reservation);

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.classList.remove("is-loading");
          submitButton.innerHTML = originalButtonHTML;
        }

        success
          .querySelector("[data-reset-form]")
          ?.focus({ preventScroll: true });
      }, 750);
    });

    success
      ?.querySelector("[data-reset-form]")
      ?.addEventListener("click", () => {
        if (typeof options.onReset === "function") {
          options.onReset();
        } else {
          resetForm({ focus: true });
        }
      });

    return { reset: resetForm };
  }

  setupReservationForm($("#booking-form"));

  /* ---------- Modal de reserva ---------- */
  const modal = $("#booking-modal");
  const modalForm = $("#modal-form");
  const modalBookingForm = setupReservationForm(modalForm, {
    onReset: () => modal?.close(),
  });

  const modalShowSelect = modalForm?.querySelector('[name="show"]');
  const modalNameInput = modalForm?.querySelector('[name="name"]');

  $$("[data-book]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!modal) return;

      const showId = button.dataset.book;
      if (modalShowSelect && showsById.has(showId)) {
        modalShowSelect.value = showId;
      }

      modal.showModal();
      document.documentElement.classList.add("is-locked");

      window.setTimeout(() => {
        modalNameInput?.focus({ preventScroll: true });
      }, 90);
    });
  });

  modal
    ?.querySelectorAll("[data-close-modal]")
    .forEach((button) => button.addEventListener("click", () => modal.close()));

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });

  modal?.addEventListener("close", () => {
    document.documentElement.classList.remove("is-locked");
    modalBookingForm?.reset();
  });

  /* Mantiene el foco dentro del modal si el navegador no lo hace solo */
  modal?.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;

    const focusable = $$(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href]',
      modal
    ).filter((element) => element.offsetParent !== null);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* Marca de inicialización correcta (fallback de revelado en el HTML) */
  window.__lucesReady = true;
})();
