// SCIM practice CBT: all app logic. Expects the global `Q` from js/questions.js,
// which index.html loads first. Wrapped in an IIFE so nothing else leaks into global scope.
(() => {
  const SUBJ = [
    "Algebra",
    "Calculus",
    "Differential Equations",
    "Numerical Analysis",
    "Mathematical Analysis",
  ];
  const L = "ABCD",
    $ = (id) => document.getElementById(id);
  // localStorage wrapper: fails silently (private mode, blocked storage) so the app still runs.
  const store = {
    get(k) {
      try {
        return JSON.parse(localStorage.getItem(k));
      } catch (e) {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {}
    },
    del(k) {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    },
  };
  // T is the test in progress (null when none); it is saved to localStorage as "scim-cur" so it can be resumed.
  //   T.items[i] = { q: index into Q, p: display order of options (p[k] = original option index shown at letter k),
  //                  a: chosen original option index or null, f: flagged, done: answer locked (practice mode) }
  //   T.end is the mock deadline as a timestamp, so the countdown survives reloads.
  let T = null,
    timerId = null,
    filter = "all"; // active review tab on the results screen
  let last = null; // the most recently finished test, shown on the results screen
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const show = (id) => {
    for (const s of ["setup", "exam", "result"]) $(s).hidden = s !== id;
    scrollTo(0, 0);
  };

  $("chips").innerHTML = SUBJ.map(
    (s) =>
      `<label class="chip"><input type="checkbox" value="${s}" checked> ${s} <span class="small">${Q.filter((q) => q[0] === s).length}</span></label>`,
  ).join("");
  const syncMode = () => {
    $("timeBox").style.visibility =
      document.querySelector("[name=mode]:checked").value === "mock" ? "visible" : "hidden";
  };
  document.querySelectorAll("[name=mode]").forEach((r) => r.addEventListener("change", syncMode));

  // Start a new test from a list of question indices. Each question gets its own option shuffle.
  function build(ids, mode, mins) {
    T = {
      mode,
      items: ids.map((i) => ({ q: i, p: shuffle([0, 1, 2, 3]), a: null, f: false, done: false })),
      cur: 0,
      end: mode === "mock" ? Date.now() + mins * 60000 : null,
      start: Date.now(),
      mins,
    };
    save();
    startExam();
  }
  $("cfg").addEventListener("submit", (e) => {
    e.preventDefault();
    const subs = [...document.querySelectorAll("#chips input:checked")].map((i) => i.value);
    if (!subs.length) {
      $("cfgMsg").textContent = "Pick at least one subject.";
      return;
    }
    $("cfgMsg").textContent = "";
    const mode = document.querySelector("[name=mode]:checked").value;
    let n = +$("count").value;
    // Balanced pick: take one question from each chosen subject in turn until n are picked.
    const pools = subs.map((s) => shuffle(Q.map((q, i) => i).filter((i) => Q[i][0] === s)));
    const total = pools.reduce((t, p) => t + p.length, 0);
    if (!n || n > total) n = total;
    const ids = [];
    let k = 0;
    while (ids.length < n) {
      const p = pools[k % pools.length];
      if (p.length) ids.push(p.pop());
      k++;
    }
    if ($("shuf").checked) shuffle(ids);
    else ids.sort((a, b) => a - b);
    build(ids, mode, Math.max(1, +$("mins").value || 60));
  });
  const save = () => {
    if (T) store.set("scim-cur", T);
  };

  function startExam() {
    show("exam");
    $("reset").hidden = T.mode !== "practice";
    $("legend").innerHTML =
      T.mode === "mock"
        ? '<span><i style="background:var(--teal);border-color:var(--teal)"></i>Answered</span><span><i></i>Not answered</span><span><i style="background:var(--amber);border-color:var(--amber)"></i>Flagged</span>'
        : '<span><i style="background:var(--teal);border-color:var(--teal)"></i>Correct</span><span><i style="background:var(--red);border-color:var(--red)"></i>Wrong</span><span><i style="background:var(--amber);border-color:var(--amber)"></i>Flagged</span>';
    clearInterval(timerId);
    tick();
    timerId = setInterval(tick, 1000);
    render();
  }
  // Runs every second: mock mode shows the countdown and auto-submits at 0; practice mode shows the running score.
  function tick() {
    if (!T) return;
    const c = $("clock");
    if (T.mode === "mock") {
      const left = Math.max(0, Math.round((T.end - Date.now()) / 1000));
      c.textContent = fmt(left);
      c.classList.toggle("low", left < 300);
      if (left <= 0) finish();
    } else {
      const ok = T.items.filter((it) => it.done && it.a === Q[it.q][3]).length,
        done = T.items.filter((it) => it.done).length;
      c.textContent = `${ok} / ${done} correct`;
    }
  }
  const fmt = (s) =>
    `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ":" : ""}${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Draw the current question, its options, practice feedback and the bubble sheet.
  function render() {
    const it = T.items[T.cur],
      q = Q[it.q],
      n = T.items.length;
    $("qSubj").textContent = q[0];
    $("qNum").textContent = `Question ${T.cur + 1} of ${n}`;
    $("qText").textContent = q[1];
    const reveal = T.mode === "practice" && it.done;
    $("opts").innerHTML = it.p
      .map((o, k) => {
        let c = "";
        if (reveal) {
          if (o === q[3]) c = "ok";
          else if (o === it.a) c = "bad";
        } else if (o === it.a) c = "sel";
        return `<button class="opt ${c}" role="radio" aria-checked="${o === it.a}" data-o="${o}" ${reveal ? "disabled" : ""}><span class="b">${L[k]}</span><span></span></button>`;
      })
      .join("");
    // Option text goes in via textContent so question data is never parsed as HTML.
    [...$("opts").children].forEach((b, k) => (b.lastChild.textContent = q[2][it.p[k]]));
    const fb = $("fb");
    fb.hidden = !reveal;
    if (reveal) {
      const ok = it.a === q[3];
      fb.innerHTML = `<b class="${ok ? "ok" : "bad"}">${ok ? "Correct." : "Not quite. The answer is " + L[it.p.indexOf(q[3])] + "."}</b> <span></span>`;
      fb.lastChild.textContent = q[4];
    }
    $("prev").disabled = T.cur === 0;
    $("next").textContent = T.cur === n - 1 ? "Finish" : "Next →";
    $("flag").classList.toggle("flagged", it.f);
    $("flag").textContent = it.f ? "Flagged" : "Flag for review";
    $("reset").disabled = !it.done && it.a === null;
    const answered = T.items.filter((x) => x.a !== null).length;
    $("progress").textContent = `${answered} of ${n} answered`;
    $("bub").innerHTML = T.items
      .map((x, i) => {
        let c = "";
        if (x.a !== null) c = T.mode === "practice" && x.done && x.a !== Q[x.q][3] ? "w" : "a";
        return `<button class="${c} ${x.f ? "fl" : ""} ${i === T.cur ? "cur" : ""}" data-i="${i}" aria-label="Question ${i + 1}">${i + 1}</button>`;
      })
      .join("");
    tick();
  }
  // o is the original option index (not the displayed letter). Practice answers lock once chosen.
  function choose(o) {
    const it = T.items[T.cur];
    if (T.mode === "practice" && it.done) return;
    it.a = o;
    if (T.mode === "practice") it.done = true;
    save();
    render();
  }
  function go(i) {
    if (i < 0 || i >= T.items.length) return;
    T.cur = i;
    save();
    render();
  }
  $("opts").addEventListener("click", (e) => {
    const b = e.target.closest(".opt");
    if (b && !b.disabled) choose(+b.dataset.o);
  });
  $("bub").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) go(+b.dataset.i);
  });
  $("prev").onclick = () => go(T.cur - 1);
  $("next").onclick = () => (T.cur === T.items.length - 1 ? ask() : go(T.cur + 1));
  $("flag").onclick = () => {
    T.items[T.cur].f = !T.items[T.cur].f;
    save();
    render();
  };
  $("reset").onclick = () => {
    const it = T.items[T.cur];
    it.a = null;
    it.done = false;
    save();
    render();
  };
  $("submitBtn").onclick = ask;
  function ask() {
    const un = T.items.filter((x) => x.a === null).length,
      fl = T.items.filter((x) => x.f).length;
    $("dlgP").textContent =
      (un ? `${un} question${un > 1 ? "s are" : " is"} unanswered. ` : "All questions answered. ") +
      (fl ? `${fl} flagged for review.` : "");
    $("dlg").hidden = false;
    $("dlgNo").focus();
  }
  $("dlgNo").onclick = () => {
    $("dlg").hidden = true;
  };
  $("dlgYes").onclick = () => {
    $("dlg").hidden = true;
    finish();
  };
  // Keyboard shortcuts: A–D answer, ←/→ move, F flag; Escape closes the submit dialog.
  document.addEventListener("keydown", (e) => {
    if (!$("dlg").hidden) {
      if (e.key === "Escape") $("dlg").hidden = true;
      return;
    }
    if ($("exam").hidden || e.ctrlKey || e.metaKey || e.altKey || e.target.matches("input,select"))
      return;
    const k = e.key.toUpperCase();
    if (L.includes(k) && k.length === 1) {
      choose(T.items[T.cur].p[L.indexOf(k)]);
      e.preventDefault();
    } else if (e.key === "ArrowRight") go(T.cur + 1);
    else if (e.key === "ArrowLeft") go(T.cur - 1);
    else if (k === "F") $("flag").click();
  });

  // Score the test, save it to history (last 30 kept), and show the results screen.
  function finish() {
    if (!T) return;
    clearInterval(timerId);
    const R = T;
    T = null;
    store.del("scim-cur");
    const ok = R.items.filter((x) => x.a === Q[x.q][3]).length,
      n = R.items.length,
      pct = Math.round((100 * ok) / n);
    const used = Math.round(((R.end ? Math.min(Date.now(), R.end) : Date.now()) - R.start) / 1000);
    const h = store.get("scim-hist") || [];
    h.unshift({ t: Date.now(), m: R.mode, ok, n });
    store.set("scim-hist", h.slice(0, 30));
    $("rMode").textContent = (R.mode === "mock" ? "Mock exam" : "Practice") + " result";
    $("rPct").textContent = pct + "%";
    $("rLine").textContent =
      `${ok} of ${n} correct · ${R.items.filter((x) => x.a === null).length} unanswered · ${fmt(used)} used`;
    const by = SUBJ.map((s) => {
      const xs = R.items.filter((x) => Q[x.q][0] === s);
      return { s, n: xs.length, ok: xs.filter((x) => x.a === Q[x.q][3]).length };
    }).filter((b) => b.n);
    $("rSubj").innerHTML = by
      .map(
        (b) =>
          `<div class="subj"><span>${b.s}</span><div class="meter"><i style="width:0" data-w="${Math.round((100 * b.ok) / b.n)}"></i></div><span class="n">${b.ok} / ${b.n}</span></div>`,
      )
      .join("");
    // Wait two frames so the bars render at width 0 first, letting the CSS transition animate them.
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.querySelectorAll("#rSubj i").forEach((i) => (i.style.width = i.dataset.w + "%")),
      ),
    );
    const w = [...by].sort((a, b) => a.ok / a.n - b.ok / b.n)[0];
    $("weak").textContent =
      w.ok === w.n
        ? "Everything correct in this test. Try a longer mock or another subject mix."
        : `${w.s}: ${w.ok} of ${w.n} correct. Revise this topic first, then retry your wrong answers.`;
    const wrong = R.items.filter((x) => x.a !== Q[x.q][3]).map((x) => x.q);
    $("retryWrong").disabled = !wrong.length;
    // Unanswered questions count as wrong, so they are retried too.
    $("retryWrong").onclick = () => build(shuffle(wrong.slice()), "practice", 0);
    filter = "all";
    R.items.forEach((x) => (x.ok = x.a === Q[x.q][3]));
    last = R;
    drawReview();
    show("result");
    drawHist();
  }
  function drawReview() {
    const sets = {
      all: ["All", () => true],
      wrong: ["Wrong", (x) => !x.ok],
      flag: ["Flagged", (x) => x.f],
      un: ["Unanswered", (x) => x.a === null],
    };
    $("tabs").innerHTML = Object.entries(sets)
      .map(
        ([k, [t, f]]) =>
          `<button data-k="${k}" aria-pressed="${k === filter}">${t} (${last.items.filter(f).length})</button>`,
      )
      .join("");
    const list = last.items.map((x, i) => ({ x, i })).filter(({ x }) => sets[filter][1](x));
    $("review").innerHTML = list.length
      ? list
          .map(
            () =>
              `<div class="rv"><p class="qn"></p><p class="qt"></p><p class="y"></p><p class="c"></p><p class="small e" style="font-size:15px"></p></div>`,
          )
          .join("")
      : '<p class="small">Nothing here.</p>';
    [...$("review").querySelectorAll(".rv")].forEach((el, j) => {
      const { x, i } = list[j],
        q = Q[x.q];
      el.querySelector(".qn").textContent = `Question ${i + 1} · ${q[0]}${x.f ? " · flagged" : ""}`;
      el.querySelector(".qt").textContent = q[1];
      const y = el.querySelector(".y");
      y.classList.add(x.ok ? "ok" : "bad");
      y.textContent =
        x.a === null ? "Not answered" : `Your answer: ${q[2][x.a]}${x.ok ? " ✓" : " ✗"}`;
      el.querySelector(".c").textContent = x.ok ? "" : `Correct answer: ${q[2][q[3]]}`;
      el.querySelector(".e").textContent = q[4];
    });
  }
  $("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) {
      filter = b.dataset.k;
      drawReview();
    }
  });
  $("newTest").onclick = () => {
    show("setup");
    checkResume();
  };
  function drawHist() {
    const h = store.get("scim-hist") || [];
    $("noHist").hidden = !!h.length;
    $("hist").hidden = !h.length;
    $("hist").tBodies[0].innerHTML = h
      .map(
        (r) =>
          `<tr><td>${new Date(r.t).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td>${r.m === "mock" ? "Mock" : "Practice"}</td><td class="n">${r.ok} / ${r.n} (${Math.round((100 * r.ok) / r.n)}%)</td></tr>`,
      )
      .join("");
  }
  function checkResume() {
    const s = store.get("scim-cur");
    $("resume").hidden = !s;
    if (s) {
      $("resumeTxt").textContent =
        `Unfinished ${s.mode === "mock" ? "mock exam" : "practice"}: ${s.items.filter((x) => x.a !== null).length} of ${s.items.length} answered.`;
    }
  }
  // A mock whose deadline passed while the page was closed is submitted straight away.
  $("resumeBtn").onclick = () => {
    T = store.get("scim-cur");
    if (!T) return;
    if (T.mode === "mock" && T.end <= Date.now()) {
      finish();
      return;
    }
    startExam();
  };
  $("discard").onclick = () => {
    store.del("scim-cur");
    checkResume();
  };
  // Initial setup screen.
  syncMode();
  drawHist();
  checkResume();
})();
