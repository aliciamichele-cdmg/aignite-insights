/* AIgnite Insights interactions */
(function () {
  "use strict";
  /* TODO: replace with the AIgnite Formspree endpoint (or Netlify forms). */
  var FORMSPREE = "https://formspree.io/f/mzdqwgyv";

  /* Mobile nav */
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.querySelector(".nav__menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () { menu.classList.toggle("open"); });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { if (window.innerWidth <= 920) menu.classList.remove("open"); });
    });
  }

  /* Scroll reveal */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    reveals.forEach(function (el) { obs.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add("in"); }); }

  /* Lead form submit (reusable) */
  function setStatus(form, msg, ok) {
    var n = form.querySelector(".form-status");
    if (!n) { n = document.createElement("p"); n.className = "form-status"; form.appendChild(n); }
    n.style.color = ok ? "#1d9b54" : "#c0392b"; n.textContent = msg;
  }
  function bindLeadForm(form) {
    if (form.__bound) return; form.__bound = true;
    if (!form.querySelector('input[name="_gotcha"]')) {
      var hp = document.createElement("input");
      hp.type = "text"; hp.name = "_gotcha"; hp.tabIndex = -1; hp.autocomplete = "off";
      hp.setAttribute("aria-hidden", "true");
      hp.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0";
      form.appendChild(hp);
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"], .btn');
      var orig = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }
      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.source = window.location.pathname;
      data._subject = "New AIgnite lead (" + (data.score ? "checker " + data.score : window.location.pathname) + ")";
      fetch(FORMSPREE, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }, function () { return { ok: r.ok }; }); })
        .then(function (r) {
          if (r.ok) { setStatus(form, "Thank you! You're all set. Alicia reviews every request personally and will be in touch within one business day.", true); form.reset(); }
          else { setStatus(form, "Something went wrong. Please email Alicia@AigniteInsights.com.", false); }
        })
        .catch(function () { setStatus(form, "Could not send just now. Please email Alicia@AigniteInsights.com.", false); })
        .finally(function () { if (btn) { btn.disabled = false; btn.textContent = orig; } });
    });
  }
  document.querySelectorAll("form[data-lead]").forEach(bindLeadForm);

  /* Footer year */
  var yr = document.getElementById("year"); if (yr) yr.textContent = new Date().getFullYear();

  /* ===== AI Visibility Checker ===== */
  var body = document.getElementById("checkerBody");
  if (!body) return;
  var QS = [
    { q: "When you ask ChatGPT, Claude, or Gemini about a business like yours, does your company come up?", pts: 25 },
    { q: "Does your website have structured data (schema markup) that tells AI what you are?", pts: 20 },
    { q: "Is your site content readable without JavaScript (not built as an app/builder site)?", pts: 20 },
    { q: "Do you publish question-and-answer style content your buyers actually search for?", pts: 20 },
    { q: "Do you have an llms.txt file giving AI a clean summary of your business?", pts: 15 }
  ];
  var idx = 0, score = 0;
  var OPTS = [{ t: "Yes", v: 1 }, { t: "Not sure", v: 0.15 }, { t: "No", v: 0 }];

  function progress() { return Math.round((idx) / QS.length * 100); }

  function renderQ() {
    var item = QS[idx];
    body.innerHTML =
      '<div class="checker__progress"><i style="width:' + progress() + '%"></i></div>' +
      '<div class="q__num">Question ' + (idx + 1) + ' of ' + QS.length + '</div>' +
      '<div class="q__text">' + item.q + '</div>' +
      '<div class="q__opts">' +
      OPTS.map(function (o, i) { return '<button class="opt" data-v="' + o.v + '">' + o.t + '</button>'; }).join("") +
      '</div>';
    body.querySelectorAll(".opt").forEach(function (b) {
      b.addEventListener("click", function () {
        score += QS[idx].pts * parseFloat(b.getAttribute("data-v"));
        idx++;
        if (idx < QS.length) renderQ(); else renderResult();
      });
    });
  }

  function band(s) {
    if (s <= 30) return { name: "Largely invisible", color: "#d9534f", msg: "AI engines mostly cannot find or read your business right now. That means you are missing from the answers buyers see first. The good news: this is very fixable, and most competitors have not fixed it either." };
    if (s <= 55) return { name: "At risk", color: "#e08a1e", msg: "You have a few things going for you, but real gaps are keeping you out of AI answers. A focused push would move you ahead of competitors quickly." };
    if (s <= 80) return { name: "Emerging", color: "#3a8fd4", msg: "You are on the radar. With a few targeted fixes you can turn occasional mentions into consistent recommendations." };
    return { name: "Strong", color: "#1d9b54", msg: "You are ahead of most. The work now is protecting and widening your lead as the engines and competitors keep moving." };
  }

  function renderResult() {
    var s = Math.max(0, Math.min(100, Math.round(score)));
    var b = band(s);
    body.innerHTML =
      '<div class="result">' +
      '<div class="gauge" style="--p:0"><div class="gauge__inner"><span class="gauge__num">0</span><span class="gauge__lbl">/ 100</span></div></div>' +
      '<span class="result__band" style="background:' + b.color + '22;color:' + b.color + '">' + b.name + '</span>' +
      '<h3>Your AI Visibility Score</h3>' +
      '<p>' + b.msg + '</p>' +
      '<div class="lead-mini">' +
      '<form data-lead>' +
      '<input type="hidden" name="score" value="' + s + '/100 (' + b.name + ')" />' +
      '<div class="grid grid-2" style="gap:12px">' +
      '<div class="field"><label>Name</label><input name="name" type="text" placeholder="Your name" required></div>' +
      '<div class="field"><label>Email</label><input name="email" type="email" placeholder="you@business.com" required></div>' +
      '</div>' +
      '<div class="field"><label>Website</label><input name="website" type="text" placeholder="yourbusiness.com" required></div>' +
      '<button type="submit" class="btn btn--primary btn--block btn--lg">Send Me My Full AI Visibility Snapshot</button>' +
      '<p class="form-note">Get the real numbers: which questions you appear for, who beats you, and the fixes. No spam.</p>' +
      '</form></div></div>';
    bindLeadForm(body.querySelector("form[data-lead]"));
    // animate gauge + number
    var gauge = body.querySelector(".gauge");
    var num = body.querySelector(".gauge__num");
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / 900);
      var cur = Math.round(p * s);
      gauge.style.setProperty("--p", (p * s));
      num.textContent = cur;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  renderQ();
})();
