/* =========================================================
   TERRANO — scripts do site
   >>> Edite os contatos em CONFIG (usados no formulário e nos links de WhatsApp)
   ========================================================= */
const CONFIG = {
  whatsapp: "5545999371887", // número com DDI + DDD, só dígitos
  // Conversão do Google Ads "Clique WhatsApp - Site" (conta 534-967-8946)
  adsConversao: "AW-17785428601/mwbGCMDQzrYdEPm04KBC",
};

/* Registra no Google Ads cada vez que alguém abre o WhatsApp pelo site */
function registrarConversaoWhatsApp(origem) {
  try {
    if (typeof gtag === "function") {
      gtag("event", "conversion", { send_to: CONFIG.adsConversao });
      gtag("event", "clique_whatsapp", { origem: origem || "", pagina: location.pathname });
    }
  } catch (e) { /* nunca atrapalhar o clique */ }
}

(function () {
  const doc = document.documentElement;
  const body = document.body;

  /* ---------- Header: fundo ao rolar ---------- */
  const header = document.querySelector(".header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 30);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  const toggle = document.querySelector(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open);
    });
    document.querySelectorAll(".nav a").forEach((a) =>
      a.addEventListener("click", () => {
        body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------- Links de WhatsApp ---------- */
  document.querySelectorAll("[data-wa]").forEach((el) => {
    const msg = el.getAttribute("data-wa") || "Olá! Vim pelo site da Terrano e gostaria de mais informações.";
    el.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
    el.target = "_blank";
    el.rel = "noopener";
    el.addEventListener("click", () => registrarConversaoWhatsApp(el.className.includes("wa-float") ? "botao-flutuante" : "botao"));
  });

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Curvas de nível (fundo topográfico gerado) ---------- */
  function rand(seed) {
    let s = seed;
    return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  }
  function smoothPath(pts) {
    // Catmull-Rom fechado -> Bezier
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + "Z";
  }
  document.querySelectorAll(".contours").forEach((el) => {
    const seed = parseInt(el.dataset.seed || "7", 10);
    const r = rand(seed);
    const W = 1600, H = 1000;
    const cx = W * (el.dataset.x ? parseFloat(el.dataset.x) : 0.78);
    const cy = H * (el.dataset.y ? parseFloat(el.dataset.y) : 0.5);
    const a1 = r() * 6.28, a2 = r() * 6.28, a3 = r() * 6.28;
    const color = el.dataset.color || (el.closest(".dark, .dark--green") ? "rgba(236,235,232,0.09)" : "rgba(46,36,28,0.075)");
    let paths = "";
    const rings = 26;
    for (let k = 1; k <= rings; k++) {
      const base = k * 38;
      const pts = [];
      const N = 48;
      for (let i = 0; i < N; i++) {
        const t = (i / N) * Math.PI * 2;
        const wob = 1 + 0.16 * Math.sin(2 * t + a1 + k * 0.08) + 0.09 * Math.sin(3 * t + a2 - k * 0.05) + 0.05 * Math.sin(5 * t + a3);
        pts.push([cx + Math.cos(t) * base * wob * 1.25, cy + Math.sin(t) * base * wob]);
      }
      const sw = k % 5 === 0 ? 1.4 : 0.8;
      paths += `<path d="${smoothPath(pts)}" stroke-width="${sw}"/>`;
    }
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" fill="none" stroke="${color}" aria-hidden="true">${paths}</svg>`;
  });

  /* ---------- Parallax suave nas bandas de imagem ---------- */
  const bands = document.querySelectorAll(".band img");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (bands.length && !reduce) {
    const par = () => {
      bands.forEach((img) => {
        const rect = img.parentElement.getBoundingClientRect();
        const p = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
        img.style.transform = `translateY(${(-p * 8).toFixed(2)}%)`;
      });
    };
    par();
    window.addEventListener("scroll", par, { passive: true });
  }

  /* ---------- Formulário -> WhatsApp ---------- */
  const form = document.querySelector("#form-contato");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const lines = [
        "Olá, Terrano! Vim pelo site.",
        `*Nome:* ${f.get("nome") || ""}`,
        f.get("telefone") ? `*Telefone:* ${f.get("telefone")}` : "",
        `*Serviço:* ${f.get("servico") || ""}`,
        f.get("cidade") ? `*Local da obra:* ${f.get("cidade")}` : "",
        f.get("mensagem") ? `*Mensagem:* ${f.get("mensagem")}` : "",
      ].filter(Boolean);
      registrarConversaoWhatsApp("formulario");
      window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
    });
  }

  /* ---------- Ano no rodapé ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
