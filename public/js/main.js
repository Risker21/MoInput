/* Mo记输入法 · 落地页交互
   粒子背景 / 打字机 / 滚动入场 / 截图轮播 / 二维码（渐进增强） */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ───────── 滚动入场 ───────── */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ───────── 打字机 ───────── */
  var typedEl = document.getElementById("typed");
  var lines = [
    "每个候选词后面，都跟着它的外语说法。",
    "敲一整段中文，几十个单词就从眼前过了一遍。",
    "英语、日语键盘里一键切换，不用开第二个 App。",
    "译词词库就在手机里，飞行模式照样学。"
  ];
  if (typedEl) {
    if (reduceMotion) {
      typedEl.textContent = lines[0];
    } else {
      var li = 0, ci = 0, deleting = false;
      (function tick() {
        var line = lines[li];
        if (!deleting) {
          ci++;
          typedEl.textContent = line.slice(0, ci);
          if (ci >= line.length) {
            deleting = true;
            setTimeout(tick, 2600);
            return;
          }
          setTimeout(tick, 55 + Math.random() * 60);
        } else {
          ci -= 2;
          if (ci <= 0) {
            ci = 0;
            deleting = false;
            li = (li + 1) % lines.length;
            setTimeout(tick, 420);
            return;
          }
          typedEl.textContent = line.slice(0, ci);
          setTimeout(tick, 24);
        }
      })();
    }
  }

  /* ───────── 截图轮播 ───────── */
  var slides = document.querySelectorAll(".phone-screen .slide");
  var dots = document.querySelectorAll(".slide-dots .dot");
  var cur = 0, carouselTimer = null;

  function showSlide(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle("active", k === cur); });
    dots.forEach(function (d, k) { d.classList.toggle("active", k === cur); });
  }
  function startCarousel() {
    if (reduceMotion || slides.length < 2) return;
    stopCarousel();
    carouselTimer = setInterval(function () { showSlide(cur + 1); }, 3400);
  }
  function stopCarousel() {
    if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; }
  }
  dots.forEach(function (d) {
    d.addEventListener("click", function () {
      showSlide(parseInt(d.dataset.i, 10));
      startCarousel();
    });
  });
  startCarousel();

  /* ───────── 译词演示：英/日两组轮换 ───────── */
  var langSets = document.querySelectorAll(".lang-set");
  var langTabs = document.querySelectorAll(".demo-tab");
  var langIdx = 0, langTimer = null;

  function showLang(i) {
    langIdx = (i + langSets.length) % langSets.length;
    langSets.forEach(function (s, k) { s.classList.toggle("active", k === langIdx); });
    langTabs.forEach(function (t, k) { t.classList.toggle("active", k === langIdx); });
  }
  langTabs.forEach(function (t, k) {
    t.addEventListener("click", function () {
      showLang(k);
      if (langTimer) { clearInterval(langTimer); langTimer = null; startLangTimer(); }
    });
  });
  function startLangTimer() {
    if (reduceMotion || langSets.length < 2) return;
    langTimer = setInterval(function () { showLang(langIdx + 1); }, 4200);
  }
  startLangTimer();

  /* ───────── 卡片高光跟随鼠标 ───────── */
  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    });
  });

  /* ───────── 粒子背景：键盘矩阵式点线网络 ───────── */
  var canvas = document.getElementById("bg-canvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, points = [], mouse = { x: -9999, y: -9999 };

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      var count = Math.min(90, Math.round((W * H) / 20000));
      points = [];
      for (var i = 0; i < count; i++) {
        points.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.6 + 0.7
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        // 点与鼠标连线
        var mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        var md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 150) {
          ctx.strokeStyle = "rgba(53,230,168," + (0.20 * (1 - md / 150)) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }

        // 点与点连线
        for (var j = i + 1; j < points.length; j++) {
          var q = points[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.strokeStyle = "rgba(53,230,168," + (0.10 * (1 - d / 120)) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = "rgba(53,230,168,0.55)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener("pointerleave", function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    if (reduceMotion) {
      // 静态帧：只画一次
      (function staticFrame() {
        ctx.clearRect(0, 0, W, H);
        points.forEach(function (p) {
          ctx.fillStyle = "rgba(53,230,168,0.4)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        });
      })();
    } else {
      requestAnimationFrame(frame);
    }
  }

  /* ───────── 宣传视频：自动播放被拦截时补播放键 ───────── */
  var pv = document.querySelector(".promo-frame video");
  if (pv) {
    var pvWrap = pv.parentNode;
    var pvTryPlay = function () {
      var pr = pv.play();
      if (pr && pr.then) {
        pr.then(function () { pvWrap.classList.remove("is-paused"); })
          .catch(function () { pvWrap.classList.add("is-paused"); });
      } else {
        pvWrap.classList.remove("is-paused");
      }
    };
    pv.addEventListener("loadeddata", pvTryPlay);
    pv.addEventListener("play", function () { pvWrap.classList.remove("is-paused"); });
    pvWrap.addEventListener("click", function () {
      if (pvWrap.classList.contains("is-paused")) pvTryPlay();
    });
    /* 滚出视口暂停（省电/省流量），滚回来续播 */
    if ("IntersectionObserver" in window) {
      var pvo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) pvTryPlay();
            else pv.pause();
          });
        },
        { threshold: 0.25 }
      );
      pvo.observe(pv);
    }
  }

  /* ───────── 下载二维码（CDN 可用才显示，失败自动隐藏） ───────── */
  function initQr() {
    if (typeof window.qrcode !== "function") return;
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    try {
      var base = location.href.replace(/[^/]*$/, "");
      var url = base + "downloads/MoJi-latest.apk";
      var q = window.qrcode(0, "M");
      q.addData(url);
      q.make();
      var holder = document.getElementById("qr");
      var wrap = document.getElementById("qr-wrap");
      if (!holder || !wrap) return;
      holder.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      var svg = holder.querySelector("svg");
      if (svg) { svg.style.width = "150px"; svg.style.height = "150px"; }
      wrap.hidden = false;
    } catch (e) { /* 二维码失败不影响主功能 */ }
  }

  var qrScript = document.createElement("script");
  /* qrcode-generator 1.4.4 已本地化（public/js/qrcode.js），断网/内网也能出码 */
  qrScript.src = "js/qrcode.js";
  qrScript.async = true;
  qrScript.onload = initQr;
  qrScript.onerror = function () { /* CDN 不可用：隐藏二维码区域 */ };
  document.head.appendChild(qrScript);
})();
