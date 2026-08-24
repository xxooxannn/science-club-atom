import { animate, createTimeline, stagger, utils } from 'animejs';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

const $$ = (s: string, r: ParentNode = document) =>
  Array.from(r.querySelectorAll<HTMLElement>(s));

// ── Central rAF loop (single, idle-cheap) ────────────────────
type Task = () => void;
const tasks = new Set<Task>();
// Tasks belonging to the current page — purged on navigation so
// detached-DOM closures don't pile up across view transitions.
let pageTasks: Task[] = [];
function addTask(t: Task) {
  tasks.add(t);
  pageTasks.push(t);
}
if (!(window as unknown as Record<string, boolean>).__atomsRaf) {
  (window as unknown as Record<string, boolean>).__atomsRaf = true;
  const loop = () => {
    tasks.forEach((t) => t());
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// ── Hero entrance choreography ───────────────────────────────
function playHero() {
  const lines = $$('.hero-line');
  if (!lines.length) return;

  const tl = createTimeline({ defaults: { ease: 'outQuart', duration: 700 } });

  tl.add('[data-hero="eyebrow"]', { opacity: [0, 1], translateY: [12, 0] })
    .add(
      lines,
      { translateY: ['115%', '0%'], duration: 950, delay: stagger(90) },
      '-=380'
    )
    .add('[data-hero="sub"]', { opacity: [0, 1], translateY: [14, 0] }, '-=520')
    .add('[data-hero="cta"]', { opacity: [0, 1], translateY: [14, 0] }, '-=480');

  const svg = document.querySelector('#atom-figure svg');
  if (svg) {
    tl.add(
      svg,
      {
        opacity: [0, 1],
        scale: [0.86, 1],
        rotate: [-8, 0],
        duration: 1200,
        ease: 'outBack(1.3)',
      },
      '-=1000'
    );

    const electrons = Array.from(svg.querySelectorAll<SVGCircleElement>('.atom-electron'));
    if (electrons.length) {
      const radii = electrons.map((e) => e.getAttribute('r') || '3');
      utils.set(electrons, { r: 0 });
      tl.add(
        electrons,
        {
          r: (_el: unknown, i: number) => radii[i],
          duration: 900,
          ease: 'outElastic(1, .55)',
          delay: stagger(150),
        },
        '-=650'
      );
    }

    const nucleus = svg.querySelector('.atom-nucleus');
    if (nucleus && !(window as unknown as Record<string, boolean>).__atomsPulse) {
      (window as unknown as Record<string, boolean>).__atomsPulse = true;
      animate(nucleus, {
        scale: [1, 1.07],
        duration: 1600,
        ease: 'inOutSine',
        alternate: true,
        loop: true,
      });
    }
  }

  // Hand-drawn scribble under "Repeat."
  const scribbles = $$('.scribble path');
  if (scribbles.length) {
    tl.add(
      scribbles,
      { strokeDashoffset: [1, 0], duration: 750, ease: 'outQuad' },
      '-=350'
    );
  }
}

// ── Pull-quote: word-by-word reveal on scroll ────────────────
function playQuote() {
  const words = $$('.q-word');
  if (!words.length) return;
  const scope = words[0].closest('blockquote') ?? words[0];
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.disconnect();
        animate(words, {
          opacity: [0, 1],
          translateY: [12, 0],
          duration: 650,
          delay: stagger(40),
          ease: 'outCubic',
        });
      }
    },
    { threshold: 0.35 }
  );
  io.observe(scope);
}

// ── Specimen drawer: vertical scroll drives horizontal ─────
function initDrawer() {
  // Reduced motion → CSS collapses the section to a native swipe strip.
  if (reduce) return;
  const section = document.getElementById('specimen-drawer');
  const track = document.getElementById('drawer-track') as HTMLElement | null;
  if (!section || !track) return;

  // Measure against layout heights (stable vh/svh units), never
  // window.innerHeight — on mobile that value changes when the URL
  // bar collapses, which used to make the strip jump backwards
  // mid-scroll. Stable inputs ⇒ progress is a pure function of
  // scroll position.
  const sticky = (section.firstElementChild as HTMLElement | null) ?? section;

  // One resize listener per visit — drop the previous page's first.
  const w = window as unknown as Record<string, unknown>;
  (w.__atomsDrawerCleanup as (() => void) | undefined)?.();

  let maxTranslate = 0;
  let lastX = Number.POSITIVE_INFINITY;

  const measure = () => {
    // End flush with the track's own inset (px-5) — mirrors x = 0.
    maxTranslate = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
  };

  const update = () => {
    const rect = section.getBoundingClientRect();
    // Cheap cull: skip all work while the drawer is far off-screen.
    if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
    const maxScroll = section.offsetHeight - sticky.offsetHeight;
    if (maxScroll <= 0) return;
    const progress = Math.min(Math.max(-rect.top / maxScroll, 0), 1);
    const x = -progress * maxTranslate;
    if (Math.abs(x - lastX) > 0.25) {
      lastX = x;
      track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    }
  };

  const remeasure = () => {
    measure();
    update();
  };

  w.__atomsDrawerCleanup = () => window.removeEventListener('resize', remeasure);
  measure();
  addTask(update);
  window.addEventListener('resize', remeasure, { passive: true });
}

// ── Periodic tiles: gentle mouse parallax (desktop only) ─────
function initTiles() {
  if (!finePointer || reduce) return;
  const figure = document.getElementById('atom-figure');
  const section = figure?.closest('section');
  const tiles = $$('.elem-tile', figure ?? undefined);
  if (!figure || !section || !tiles.length) return;

  let tx = 0, ty = 0, cx = 0, cy = 0;

  section.addEventListener('pointermove', (e) => {
    const r = section.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5;
    ty = (e.clientY - r.top) / r.height - 0.5;
  });
  section.addEventListener('pointerleave', () => {
    tx = 0;
    ty = 0;
  });

  addTask(() => {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    for (const tile of tiles) {
      const depth = parseFloat(tile.dataset.depth || '14');
      tile.style.transform = `translate3d(${(-cx * depth).toFixed(2)}px, ${(-cy * depth).toFixed(2)}px, 0)`;
    }
    figure.style.transform = `translate3d(${(cx * -10).toFixed(2)}px, ${(cy * -8).toFixed(2)}px, 0)`;
  });
}

// ── Magnetic buttons (desktop only) ──────────────────────────
function initMagnet() {
  if (!finePointer || reduce) return;
  for (const el of $$('.magnetic')) {
    const st = { tx: 0, ty: 0, cx: 0, cy: 0 };
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      st.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      st.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    el.addEventListener('pointerleave', () => {
      st.tx = 0;
      st.ty = 0;
    });
    addTask(() => {
      st.cx += (st.tx - st.cx) * 0.12;
      st.cy += (st.ty - st.cy) * 0.12;
      if (Math.abs(st.cx) + Math.abs(st.cy) > 0.002) {
        el.style.transform = `translate3d(${(st.cx * 7).toFixed(2)}px, ${(st.cy * 5).toFixed(2)}px, 0)`;
      } else if (el.style.transform) {
        el.style.transform = '';
      }
    });
  }
}

// ── Telemetry readout: live NPT clock + scroll % ─────────────
function startTelemetry() {
  const clock = document.getElementById('nst-clock');
  const scrollOut = document.getElementById('readout-scroll');

  if (clock && !(window as unknown as Record<string, boolean>).__atomsClock) {
    (window as unknown as Record<string, boolean>).__atomsClock = true;
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kathmandu',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const tick = () => {
      const el = document.getElementById('nst-clock');
      if (el) el.textContent = fmt.format(new Date());
    };
    tick();
    setInterval(tick, 1000);
  }

  if (scrollOut) {
    let last = -1;
    addTask(() => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
      if (pct !== last) {
        last = pct;
        const el = document.getElementById('readout-scroll');
        if (el) el.textContent = `${pct}%`;
      }
    });
  }
}

// ── Console easter egg (for nerds who open devtools) ─────────
function consoleEgg() {
  if ((window as unknown as Record<string, boolean>).__atomsEgg) return;
  (window as unknown as Record<string, boolean>).__atomsEgg = true;
  console.log(
    '%c ⚛ ATOMS %c\n\n Curious enough to open the console?\n You would fit right in → /join\n\n // Rosybuds School · Est. 2023',
    'background:#b01e28;color:#f7f6f2;font-size:20px;font-weight:bold;padding:6px 14px;border-radius:6px',
    'color:#57534e;font-size:13px;line-height:1.6'
  );
}

// ── Lab-visit counter (localStorage, just for fun) ───────
function visitCounter() {
  const el = document.getElementById('visit-count');
  if (!el) return;
  try {
    const n = parseInt(localStorage.getItem('atoms-visits') || '0', 10) + 1;
    localStorage.setItem('atoms-visits', String(n));
    el.textContent = String(n).padStart(4, '0');
  } catch {
    el.textContent = '∞';
  }
}

function initMotion() {
  // Purge the previous page's tasks so detached-DOM closures
  // don't pile up across view transitions.
  for (const t of pageTasks) tasks.delete(t);
  pageTasks = [];

  try {
    playHero();
  } catch {
    /* never let motion break content */
  }
  try {
    playQuote();
  } catch {
    /* ditto */
  }
  try {
    initDrawer();
    initTiles();
    initMagnet();
    startTelemetry();
    consoleEgg();
    visitCounter();
  } catch {
    /* ditto */
  }
}

document.addEventListener('astro:page-load', initMotion);
