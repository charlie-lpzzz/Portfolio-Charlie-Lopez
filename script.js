/* ===================================================
   CHARLIE LOPEZ — PORTFOLIO 2026
   Three.js · Lenis (smooth scroll) · GSAP
   =================================================== */

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------
   1.  LOADER
   - Skipped en visite mise en cache (sessionStorage)
   - Beaucoup plus rapide (≈ 600 ms total au lieu de ≈ 2 s)
   pour ne pas plomber le LCP de PageSpeed.
------------------------------------------------ */
const loader   = document.querySelector('.loader');
const counter  = document.getElementById('count');
const bar      = document.querySelector('.loader__bar span');

function runLoader() {
  return new Promise(resolve => {
    // Visite déjà cached → on skip l'animation
    if (sessionStorage.getItem('cl_visited')) {
      loader.style.display = 'none';
      return resolve();
    }
    sessionStorage.setItem('cl_visited', '1');

    const start = performance.now();
    const COUNT_DURATION = 350; // ms

    const tick = (t) => {
      const p = Math.min(1, (t - start) / COUNT_DURATION);
      const val = Math.round(p * 100);
      counter.textContent = val;
      bar.style.width = val + '%';
      if (p < 1) requestAnimationFrame(tick);
      else {
        gsap.to(loader, {
          y: '-100%', duration: 0.5, ease: 'expo.inOut',
          onComplete: () => { loader.style.display = 'none'; resolve(); }
        });
      }
    };
    requestAnimationFrame(tick);
  });
}

/* ------------------------------------------------
   2.  CUSTOM CURSOR — single ring (Paloha-style)
   Just one outlined ring that lerps toward the real cursor. The lerp factor
   is bumped a touch (0.25) now that there's no instant dot to anchor it,
   so the ring still feels responsive while keeping a soft ease.
------------------------------------------------ */
const ring = document.querySelector('.cursor');
let mx = innerWidth/2, my = innerHeight/2;
let rx = mx, ry = my;

window.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
});

function loopCursor() {
  rx += (mx - rx) * 0.25;
  ry += (my - ry) * 0.25;
  ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
  requestAnimationFrame(loopCursor);
}
loopCursor();

document.querySelectorAll('[data-cursor="hover"]').forEach(el => {
  el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
  el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
});
document.querySelectorAll('[data-cursor="view"]').forEach(el => {
  el.addEventListener('mouseenter', () => ring.classList.add('is-view'));
  el.addEventListener('mouseleave', () => ring.classList.remove('is-view'));
});

/* ------------------------------------------------
   3.  THREE.JS — Distorted sphere in hero (desktop only)
   Three.js est lazy-loaded depuis le bootstrap après le premier paint
   pour ne pas bloquer le LCP. Sur mobile le canvas reste caché via CSS.
------------------------------------------------ */
function loadThreeLazy() {
  // Pas de Three.js sur mobile (560 KB inutiles)
  if (window.innerWidth < 768) {
    const c = document.getElementById('webgl');
    if (c) c.style.display = 'none';
    return;
  }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
  s.async = true;
  s.onload = () => initThree();
  document.head.appendChild(s);
}

function initThree() {
  const canvas = document.getElementById('webgl');
  if (!canvas) return;
  if (typeof THREE === 'undefined') return;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 100);
  camera.position.z = 3;

  const geo = new THREE.IcosahedronGeometry(1.2, 60);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:     { value: 0 },
      uMouse:    { value: new THREE.Vector2(0,0) },
      uColorA:   { value: new THREE.Color('#8b5cf6') },
      uColorB:   { value: new THREE.Color('#0d0d0c') },
      uColorC:   { value: new THREE.Color('#c4ff3a') },
    },
    vertexShader: `
      uniform float uTime;
      uniform vec2  uMouse;
      varying vec3  vNormal;
      varying vec3  vPos;

      vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0))*289.0;}
      vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0))*289.0;}
      vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
      float snoise(vec3 v){
        const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
        vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
        vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
        i=mod289(i);
        vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
        float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
        vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
        vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
        vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
        vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
        vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
        vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
        vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
        m=m*m; return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }

      void main() {
        vec3 p = position;
        float n = snoise(p*1.5 + uTime*0.25);
        float n2 = snoise(p*3.0 - uTime*0.15);
        p += normal * (n*0.35 + n2*0.12);
        p += normal * uMouse.x * 0.25;

        vNormal = normalize(normalMatrix * normal);
        vPos = p;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vPos;

      void main() {
        float fres = pow(1.0 - max(dot(vNormal, vec3(0.0,0.0,1.0)),0.0), 2.0);
        float wave = sin(vPos.y*4.0 + uTime*0.6)*0.5+0.5;
        vec3 col  = mix(uColorB, uColorA, fres);
        col       = mix(col, uColorC, fres*wave*0.4);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    wireframe: false
  });
  const blob = new THREE.Mesh(geo, mat);
  scene.add(blob);

  const partGeo = new THREE.BufferGeometry();
  const N = 1200;
  const pos = new Float32Array(N*3);
  for (let i=0;i<N;i++){
    pos[i*3]   = (Math.random()-0.5)*8;
    pos[i*3+1] = (Math.random()-0.5)*8;
    pos[i*3+2] = (Math.random()-0.5)*8;
  }
  partGeo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const partMat = new THREE.PointsMaterial({
    size: 0.012, color: 0xf4f0ea,
    transparent: true, opacity: 0.6
  });
  const points = new THREE.Points(partGeo, partMat);
  scene.add(points);

  const mouse = new THREE.Vector2(0, 0);
  window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX/innerWidth -0.5)*2;
    mouse.y = (e.clientY/innerHeight-0.5)*2;
  });

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();
    mat.uniforms.uTime.value = t;
    mat.uniforms.uMouse.value.lerp(mouse, 0.05);

    blob.rotation.y = t*0.1 + mouse.x*0.3;
    blob.rotation.x = mouse.y*0.2;

    points.rotation.y = t*0.02;
    points.rotation.x = t*0.01;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

/* ------------------------------------------------
   4.  LENIS SMOOTH SCROLL
------------------------------------------------ */
function initLenis() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false
  });
  // Exposer pour les autres modules (rail, marquee skew…)
  window.__lenis = lenis;

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Anchor smooth-scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        e.preventDefault();
        lenis.scrollTo(id, { offset: 0, duration: 1.4 });
      }
    });
  });

  return lenis;
}

/* ------------------------------------------------
   5.  GSAP ANIMATIONS
------------------------------------------------ */
function initAnimations() {
  // -- HERO TITLE reveal
  if (document.querySelector('.hero__title')) {
    gsap.to('.hero__title .line > span', {
      y: 0, duration: 1.4, ease: 'expo.out',
      stagger: 0.12, delay: 0.2
    });
  }
  gsap.from('.hero__meta, .hero__desc, .hero__scroll', {
    y: 40, opacity: 0, duration: 1.1,
    ease: 'expo.out', stagger: 0.15, delay: 0.8
  });
  gsap.from('.nav', { y:-30, opacity:0, duration:1.0, ease:'expo.out', delay:0.5 });

  // -- ABOUT photo : fade + slight scale-up on enter
  if (document.querySelector('.about__photo')) {
    gsap.from('.about__photo', {
      scrollTrigger: { trigger: '.about__layout', start: 'top 80%' },
      y: 60, opacity: 0, scale: 0.97,
      duration: 1.1, ease: 'expo.out'
    });
  }

  // -- ABOUT bio paragraphs : staggered reveal
  if (document.querySelector('.about__bio p')) {
    gsap.from('.about__bio p', {
      scrollTrigger: { trigger: '.about__bio', start: 'top 80%' },
      y: 30, opacity: 0,
      duration: 1.0, ease: 'expo.out',
      stagger: 0.12
    });
  }

  // -- ABOUT interest tags : pop in stagger
  if (document.querySelector('.about__interests span')) {
    gsap.from('.about__interests span', {
      scrollTrigger: { trigger: '.about__interests', start: 'top 90%' },
      y: 20, opacity: 0,
      duration: 0.7, ease: 'expo.out',
      stagger: 0.06
    });
  }

  // -- WORK title
  gsap.from('.work__title span', {
    scrollTrigger: { trigger: '.work__title', start: 'top 85%' },
    y: '110%', duration: 1.2, ease: 'expo.out', stagger: 0.1
  });

  // -- WORK items
  gsap.from('.work__item', {
    scrollTrigger: { trigger: '.work__list', start: 'top 80%' },
    y: 60, opacity: 0, duration: 1.0, ease: 'expo.out',
    stagger: 0.12
  });

  // -- SKILLS
  gsap.from('.skills__head h2', {
    scrollTrigger: { trigger: '.skills', start: 'top 80%' },
    y: 80, opacity: 0, duration: 1.2, ease: 'expo.out'
  });
  gsap.from('.skills__list li', {
    scrollTrigger: { trigger: '.skills__grid', start: 'top 80%' },
    y: 30, opacity: 0, duration: 0.9, ease: 'expo.out',
    stagger: { amount: 0.6, from: 'start' }
  });

  // -- CONTACT
  gsap.from('.contact__title span', {
    scrollTrigger: { trigger: '.contact', start: 'top 70%' },
    y: '110%', duration: 1.3, ease: 'expo.out', stagger: 0.12
  });

  // -- Project gallery tiles : staggered reveal as the gallery enters view.
  // Using set + ScrollTrigger.create({once:true}) instead of gsap.from() —
  // more deterministic when Lenis is intercepting scroll (the gsap.from +
  // implicit toggleActions could leave tiles stuck at opacity 0).
  if (document.querySelector('.project-gallery')) {
    const tiles = document.querySelectorAll('.project-gallery .tile');
    gsap.set(tiles, { y: 60, opacity: 0, scale: 0.96 });
    ScrollTrigger.create({
      trigger: '.project-gallery',
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(tiles, {
          y: 0, opacity: 1, scale: 1,
          duration: 1.0, ease: 'expo.out',
          stagger: { amount: 0.6, from: 'start' }
        });
      }
    });
  }

  // -- Hero parallax on scroll
  if (document.getElementById('webgl')) {
    gsap.to('#webgl', {
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top', end: 'bottom top',
        scrub: true
      },
      y: 100, scale: 0.95, opacity: 0.6
    });
  }

  // -- Parallax for [data-scroll-speed]
  document.querySelectorAll('[data-scroll-speed]').forEach(el => {
    const speed = parseFloat(el.dataset.scrollSpeed);
    gsap.to(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top bottom', end: 'bottom top',
        scrub: true
      },
      y: -speed * 30
    });
  });
}

/* ------------------------------------------------
   6.  WORK ITEM — floating preview anchored to the right
   - The preview no longer follows the cursor (was cramped & cluttered with
     the "VIEW" cursor). It now lives on the right side, vertically centered,
     and reacts to cursor movement with a subtle parallax (~±18px x, ±12px y).
   - Entrance: opacity 0 → 1, scale 0.88 → 1, rotation -2.5° → 0°.
   - GSAP fully owns the transform — yPercent: -50 handles the vertical
     centering paired with the CSS `top: 50%`, so x/y/rotation stack cleanly
     on top of that without fighting CSS.
------------------------------------------------ */
function initWorkHover() {
  const items = document.querySelectorAll('.work__item');
  if (!items.length) return;

  // Helper — shared show/hide so we can also reset from a global safety net.
  const hide = img => {
    gsap.killTweensOf(img);
    gsap.to(img, {
      opacity: 0, scale: 0.88, rotation: -2.5,
      x: 0, y: 0,
      duration: 0.4, ease: 'power2.out'
    });
  };

  items.forEach(item => {
    const img = item.querySelector('.work__hover');
    if (!img) return;

    gsap.set(img, {
      yPercent: -50,
      x: 0, y: 0,
      scale: 0.88,
      rotation: -2.5,
      opacity: 0,
      transformOrigin: 'center center'
    });

    const setX = gsap.quickTo(img, 'x', { duration: 0.7, ease: 'power3.out' });
    const setY = gsap.quickTo(img, 'y', { duration: 0.7, ease: 'power3.out' });

    // pointerenter / pointerleave : plus fiables que mouseenter/leave lors d'un
    // déplacement rapide. killTweensOf évite l'empilement de tweens qui laissait
    // certaines previews bloquées en opacity:1 quand la souris filait.
    item.addEventListener('pointerenter', () => {
      gsap.killTweensOf(img);
      gsap.to(img, {
        opacity: 1, scale: 1, rotation: 0,
        duration: 0.5, ease: 'power3.out'
      });
    });

    item.addEventListener('pointermove', e => {
      const rect = item.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width  - 0.5) * 36;
      const py = ((e.clientY - rect.top)  / rect.height - 0.5) * 24;
      setX(px);
      setY(py);
    });

    item.addEventListener('pointerleave', () => hide(img));
    item.addEventListener('pointercancel', () => hide(img));
  });

  // Filet de sécurité : si le pointer quitte la liste OU la fenêtre,
  // on force toutes les previews à se cacher (couvre les cas où
  // pointerleave d'un item ne se déclenche pas pendant un mouvement rapide).
  const list = document.querySelector('.work__list');
  const resetAll = () => document.querySelectorAll('.work__hover').forEach(hide);
  if (list) list.addEventListener('pointerleave', resetAll);
  window.addEventListener('blur', resetAll);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetAll();
  });
}

/* ------------------------------------------------
   7.  ACTIVE SECTION INDICATOR
   IntersectionObserver tracks which section is closest to the viewport top
   and toggles `.is-active` on the matching nav link. Used by the glass-pill
   menu so the user always knows where they are.
------------------------------------------------ */
function initActiveNav() {
  const links = document.querySelectorAll('.nav__menu a[href^="#"]');
  if (!links.length) return;

  const linkBySection = new Map();
  links.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    const section = document.getElementById(id);
    if (section) linkBySection.set(section, a);
  });
  if (!linkBySection.size) return;

  const setActive = link => {
    links.forEach(a => a.classList.remove('is-active'));
    if (link) link.classList.add('is-active');
  };

  const obs = new IntersectionObserver(entries => {
    // Pick the entry whose top is highest above 35% of the viewport AND
    // is currently intersecting — that's the section the user is reading.
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => a.target.offsetTop - b.target.offsetTop);
    if (visible.length) {
      // Last visible whose top is above the threshold = current section.
      const current = visible[visible.length - 1];
      setActive(linkBySection.get(current.target));
    }
  }, {
    rootMargin: '-35% 0px -55% 0px', // narrow band near upper third of viewport
    threshold: 0
  });

  linkBySection.forEach((_, section) => obs.observe(section));
}

/* ------------------------------------------------
   8.  BOOT
   Ordre :
   1) Loader (très court ou skippé)
   2) Tout le reste (Lenis, GSAP, hover, etc.)
   3) Three.js en lazy-load après que la page soit interactive
------------------------------------------------ */
window.addEventListener('load', async () => {
  await runLoader();
  initLenis();
  initAnimations();
  initWorkHover();
  initActiveNav();
  ScrollTrigger.refresh();

  // Three.js : on le charge en idle pour ne pas bloquer le LCP
  const lazy = () => loadThreeLazy();
  if ('requestIdleCallback' in window) {
    requestIdleCallback(lazy, { timeout: 1500 });
  } else {
    setTimeout(lazy, 600);
  }
});
