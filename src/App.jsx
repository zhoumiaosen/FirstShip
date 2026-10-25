import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Flag,
  Leaf,
  Lightbulb,
  LoaderCircle,
  Map,
  Menu,
  MessageCircle,
  PanelTop,
  Play,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Sprout,
  Terminal,
  X,
  BookOpen,
  Compass,
} from "lucide-react";
import {
  DAYS,
  getDays,
  createGuidedScope,
  createProject,
  completeTask,
  getProgress,
  exportSummary,
  safeUrl,
} from "./lib/domain.js";
import { loadProject, saveProject, STORAGE_KEY } from "./lib/storage.js";
import {
  requestCoaching as coach,
  getCoachHealth,
  ONLINE_DEMO,
} from "./lib/coach-client.js";

const emptyProfile = {
  idea: "",
  audience: "",
  goal: "",
  experience: "I’m completely new to coding",
  time: "30–60 minutes",
};
const icons = [Lightbulb, PanelTop, Code2, ShieldCheck, Rocket];
const dayTitles = [
  "Find your starting point",
  "Make it feel like yours",
  "Bring your idea to life",
  "Test, learn, improve",
  "Share what you made",
];
const dayLabels = [
  "Idea & setup",
  "Your first screen",
  "Make it work",
  "Test & improve",
  "Your first launch",
];
const emptyProblem = {
  attempt: "",
  expected: "",
  actual: "",
  error: "",
  tried: "",
};

function Button({
  children,
  secondary = false,
  small = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`button ${secondary ? "secondary" : "primary"} ${small ? "small" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
function Brand({ onClick }) {
  return (
    <button className="brand" onClick={onClick} aria-label="FirstShip home">
      <span className="brand-icon">
        <Flag size={21} strokeWidth={2.3} />
      </span>
      <span>
        firstship<span className="brand-period">.</span>
      </span>
    </button>
  );
}
function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector("button, input, textarea, select")?.focus();
    const handle = (e) => {
      if (e.key === "Escape") onCloseRef.current();
      if (e.key !== "Tab") return;
      const nodes = [
        ...ref.current.querySelectorAll(
          'button:not(:disabled), a[href], input, textarea, select, [tabindex="0"]',
        ),
      ];
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`modal ${wide ? "wide" : ""}`}
      >
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={21} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default function App() {
  const [initial] = useState(() => loadProject());
  const [project, setProject] = useState(initial.project);
  const [warning, setWarning] = useState(initial.warning || "");
  const [view, setView] = useState(initial.project ? "journey" : "welcome");
  const [profile, setProfile] = useState(
    initial.project?.profile || emptyProfile,
  );
  const [step, setStep] = useState(0);
  const [draftScope, setDraftScope] = useState(null);
  const [scopeMode, setScopeMode] = useState("guided");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [aiAvailable, setAiAvailable] = useState(false);
  const [helpTask, setHelpTask] = useState(null);
  const [resources, setResources] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [scopeEditing, setScopeEditing] = useState(false);
  const [recoveryProtected, setRecoveryProtected] = useState(
    !initial.project && !!initial.warning?.includes("restore"),
  );
  const [confirmRecovery, setConfirmRecovery] = useState(false);
  useEffect(() => {
    getCoachHealth()
      .then((d) => setAiAvailable(!!d.aiAvailable))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(id);
  }, [notice]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);
  function persist(next) {
    setProject(next);
    const result = saveProject(next);
    if (!result.ok)
      setWarning(
        result.warning ||
          "This browser couldn’t save your progress. Keep this tab open and download your summary.",
      );
    else setWarning("");
  }
  function navigate(next) {
    setError("");
    setMobileNav(false);
    setView(next);
  }
  function selectDay(id) {
    persist({ ...project, activeDay: id });
    setActiveTask(null);
    navigate("lesson");
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Prompt copied. Take it to Codex when you’re ready.");
    } catch {
      setNotice(
        "Copy is unavailable in this browser. Select the prompt text and copy it manually.",
      );
    }
  }
  async function generateScope() {
    setBusy(true);
    setError("");
    try {
      const data = await coach({ action: "scope", profile });
      setDraftScope(data.result);
      setScopeMode(data.mode);
      navigate("scope");
    } catch (err) {
      setError(
        err.name === "TimeoutError"
          ? "The coach took too long. Try again or use starter guidance below."
          : err.message,
      );
    } finally {
      setBusy(false);
    }
  }
  function starterScope() {
    setDraftScope(createGuidedScope(profile));
    setScopeMode("guided");
    navigate("scope");
  }
  function approveScope(forceReplace = false) {
    const fields = ["title", "description", "audience", "coreTask"];
    if (
      !draftScope ||
      fields.some(
        (key) =>
          !draftScope[key]?.trim() ||
          draftScope[key].length > (key === "title" ? 100 : 2000),
      )
    ) {
      setError(
        "Add a project name, description, audience, and core task. Keep the name under 100 characters and each description under 2,000.",
      );
      return;
    }
    for (const [key, max, label] of [
      ["features", 3, "Build now"],
      ["done", 5, "Success checks"],
      ["later", 8, "Later list"],
    ]) {
      const items = draftScope[key].map((v) => v.trim()).filter(Boolean);
      if (
        !items.length ||
        items.length > max ||
        items.some((v) => v.length > 700)
      ) {
        setError(
          `${label} needs 1–${max} items, with up to 700 characters each.`,
        );
        return;
      }
    }
    if (recoveryProtected && forceReplace !== true) {
      setConfirmRecovery(true);
      return;
    }
    const clean = {
      ...draftScope,
      features: draftScope.features.map((v) => v.trim()).filter(Boolean),
      done: draftScope.done.map((v) => v.trim()).filter(Boolean),
      later: draftScope.later.map((v) => v.trim()).filter(Boolean),
    };
    if (scopeEditing && project)
      persist({
        ...project,
        scope: clean,
        completed: {},
        reflections: {},
        draftChecks: {},
        helpDraft: {},
        activeDay: 1,
      });
    else
      persist({ ...createProject(profile, clean, scopeMode), approved: true });
    setRecoveryProtected(false);
    setConfirmRecovery(false);
    setScopeEditing(false);
    setActiveTask(null);
    navigate("journey");
  }
  function downloadRawBackup() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) throw Error("No saved data found");
      downloadText(raw, "firstship-recovery-backup.json", "application/json");
      setNotice(
        "Saved-data backup downloaded. Keep it before replacing your old project.",
      );
    } catch {
      setNotice(
        "This browser could not read the saved data. It will stay untouched until you confirm replacement.",
      );
    }
  }
  function editScope() {
    setDraftScope({ ...project.scope });
    setScopeMode(project.mode || "guided");
    setScopeEditing(true);
    navigate("scope");
  }
  const days = project ? getDays(project) : [];
  const progress = project
    ? getProgress(project)
    : { completed: 0, total: 10, percent: 0 };
  const currentDay = days.find((d) => d.id === project?.activeDay) || days[0];
  const currentTask =
    currentDay?.tasks.find((t) => t.id === activeTask) ||
    currentDay?.tasks.find((t) => !project.completed[t.id]) ||
    currentDay?.tasks[0];
  const totalDone = progress.completed === progress.total && progress.total > 0;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Brand onClick={() => navigate(project ? "journey" : "welcome")} />
          <nav className="top-nav" aria-label="Main navigation">
            {project ? (
              <>
                <button
                  className={
                    view === "journey" || view === "lesson" ? "selected" : ""
                  }
                  onClick={() => navigate("journey")}
                >
                  My journey
                </button>
                <button
                  className={view === "project" ? "selected" : ""}
                  onClick={() => navigate("project")}
                >
                  My project
                </button>
              </>
            ) : (
              <a
                href="#how-it-works"
                onClick={() => {
                  if (view !== "welcome") navigate("welcome");
                }}
              >
                How it works
              </a>
            )}
            <button onClick={() => setResources(true)}>
              Field guide <ArrowUpRight size={14} />
            </button>
          </nav>
          <div className="header-right">
            <span className="beginner-badge">
              <span /> Made for first-timers
            </span>
            {project ? (
              <button
                className="avatar"
                onClick={() => navigate("project")}
                aria-label="Open my project"
              >
                {project.scope.title.slice(0, 1).toUpperCase()}
              </button>
            ) : (
              <Button
                small
                onClick={() => {
                  setStep(0);
                  navigate("onboarding");
                }}
              >
                Start building <ArrowRight size={15} />
              </Button>
            )}
          </div>
        </div>
      </header>
      {ONLINE_DEMO && (
        <div className="online-demo-note">
          <Sprout size={17} />
          <span>
            <strong>Online demo · Starter guidance.</strong> Your project stays
            in this browser. Build in Codex, then return here to check your
            progress.
          </span>
          <a href="../">About FirstShip ↗</a>
        </div>
      )}
      {warning && (
        <div className="storage-warning" role="alert">
          {warning}
          {recoveryProtected && (
            <button className="text-button" onClick={downloadRawBackup}>
              Download saved-data backup <Download size={14} />
            </button>
          )}
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}

      {view === "welcome" && (
        <main id="main" className="landing">
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="tiny-star">✦</span> A SMALL IDEA. A REAL FIRST
                STEP.
              </span>
              <h1>
                That app idea?
                <br />
                Let’s make it
                <br />
                <span>your first app.</span>
              </h1>
              <p>
                You don’t need to know how to code. Bring your idea, and we’ll
                help you build it with AI—one small, confident step at a time.
              </p>
              <div className="hero-actions">
                <Button
                  onClick={() => {
                    setStep(0);
                    navigate("onboarding");
                  }}
                >
                  Let’s find your starting point <ArrowRight size={18} />
                </Button>
                <span>
                  No experience needed.
                  <br />
                  Just a little curiosity.
                </span>
              </div>
              <div className="hero-bottom">
                <div className="mini-avatars">
                  <span>J</span>
                  <span>A</span>
                  <span>M</span>
                </div>
                <div>
                  <strong>Your idea. Your pace.</strong>
                  <span>Five guided days. Something you can call yours.</span>
                </div>
              </div>
            </div>
            <JourneyIllustration />
          </section>
          <div className="promise-strip">
            <span>
              <Compass size={19} /> A plan built around your idea
            </span>
            <span>
              <Terminal size={19} /> Build in Codex, learn here
            </span>
            <span>
              <Leaf size={19} /> Small steps. Real progress.
            </span>
          </div>
          <section id="how-it-works" className="how-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">FROM “WHAT IF” TO “I MADE THIS”</span>
                <h2>A little guidance goes a long way.</h2>
              </div>
              <p>
                We’re your coach, not another coding tool.
                <br />
                You bring the idea. We help you find the next step.
              </p>
            </div>
            <div className="how-grid">
              {[
                {
                  icon: Lightbulb,
                  n: "01",
                  title: "Start with your idea",
                  text: "A habit tracker? A recipe book? We’ll help you find the smallest, useful version.",
                },
                {
                  icon: Map,
                  n: "02",
                  title: "Follow your own path",
                  text: "Get five days of practical tasks and prompts tailored to what you want to build.",
                },
                {
                  icon: Rocket,
                  n: "03",
                  title: "Make something yours",
                  text: "Build in Codex, check your work, and finish with an app you understand.",
                },
              ].map(({ icon: Icon, n, title, text }) => (
                <article className="how-card" key={n}>
                  <div>
                    <span className="soft-icon">
                      <Icon size={23} />
                    </span>
                    <span className="step-number">{n}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="landing-note">
            <Sprout size={25} />
            <div>
              <strong>You’re learning a process, not memorizing code.</strong>
              <p>
                Ask clearly. Build a little. Check what happened. Those are
                skills you’ll take to every app after this one.
              </p>
            </div>
          </section>
          <footer className="landing-footer">
            <Brand
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            />
            <span>Big things begin with a first ship.</span>
            <span>Built for curious people.</span>
          </footer>
        </main>
      )}

      {view === "onboarding" && (
        <main id="main" className="onboarding-page">
          <div className="onboard-aside">
            <span className="eyebrow">YOUR FIRST CHAPTER</span>
            <h1>
              Every app starts
              <br />
              with a little
              <br />
              <span>“what if?”</span>
            </h1>
            <p>
              It doesn’t have to change the world.
              <br />
              Making your own day a little better is a great place to start.
            </p>
            <div className="onboard-note">
              <Sprout size={24} />
              <span>
                We’ll help you keep it small enough to finish—and useful enough
                to feel proud of.
              </span>
            </div>
          </div>
          <section className="onboard-form">
            <div className="step-line">
              <span>GETTING TO KNOW YOUR IDEA</span>
              <span>{step + 1} of 5</span>
            </div>
            <div className="step-dots">
              {[0, 1, 2, 3, 4].map((n) => (
                <span key={n} className={n <= step ? "active" : ""} />
              ))}
            </div>
            <OnboardingQuestion
              step={step}
              profile={profile}
              onChange={(key, value) =>
                setProfile({ ...profile, [key]: value })
              }
              onIdea={(idea) => setProfile({ ...profile, idea })}
            />
            {error && (
              <div className="inline-error" role="alert">
                {error}
              </div>
            )}
            <div className="onboard-actions">
              <button
                className="text-button"
                onClick={() => {
                  if (step) {
                    setStep(step - 1);
                    setError("");
                  } else navigate("welcome");
                }}
                disabled={busy}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <Button
                disabled={
                  busy ||
                  !String(
                    profile[
                      ["idea", "audience", "goal", "experience", "time"][step]
                    ] || "",
                  ).trim()
                }
                onClick={() => {
                  if (step < 4) {
                    setStep(step + 1);
                    setError("");
                  } else generateScope();
                }}
              >
                {busy ? (
                  <>
                    <LoaderCircle className="spin" size={17} /> Finding your
                    path…
                  </>
                ) : step === 4 ? (
                  <>
                    Make my five-day plan <Sparkles size={17} />
                  </>
                ) : (
                  <>
                    Continue <ArrowRight size={17} />
                  </>
                )}
              </Button>
            </div>
            {step === 4 && error && (
              <button
                className="text-button fallback-button"
                onClick={starterScope}
              >
                Use starter guidance instead <ArrowRight size={15} />
              </button>
            )}
            <p className="privacy-note">
              <ShieldCheck size={14} />
              {aiAvailable
                ? "Your answers are sent to our AI coach to personalize your plan."
                : "Starter guidance works without an AI connection."}{" "}
              Progress stays in this browser.
            </p>
          </section>
        </main>
      )}

      {view === "scope" && draftScope && (
        <main id="main" className="scope-page">
          <button
            className="text-button"
            onClick={() => navigate(scopeEditing ? "project" : "onboarding")}
          >
            <ArrowLeft size={16} />{" "}
            {scopeEditing ? "Back to my project" : "Back to my answers"}
          </button>
          <div className="scope-title">
            <span className="eyebrow">A SMALL PLAN WITH A BIG FIRST STEP</span>
            <h1>Your idea, made achievable.</h1>
            <p>
              Here’s a first version you can finish. Make it yours before you
              begin.
            </p>
          </div>
          <div className="scope-layout">
            <section className="scope-editor card">
              <div className="card-topline">
                <span className="pill">
                  <Sprout size={14} /> Your first version
                </span>
                <ModeTag mode={scopeMode} />
              </div>
              <label className="field-label" htmlFor="scope-title">
                Project name
              </label>
              <input
                id="scope-title"
                className="scope-name"
                value={draftScope.title}
                maxLength={100}
                onChange={(e) =>
                  setDraftScope({ ...draftScope, title: e.target.value })
                }
              />
              <label className="field-label" htmlFor="scope-description">
                The idea in one sentence
              </label>
              <textarea
                id="scope-description"
                value={draftScope.description}
                maxLength={2000}
                rows={3}
                onChange={(e) =>
                  setDraftScope({ ...draftScope, description: e.target.value })
                }
              />
              <label className="field-label" htmlFor="scope-audience">
                Who it’s for
              </label>
              <input
                id="scope-audience"
                value={draftScope.audience}
                maxLength={2000}
                onChange={(e) =>
                  setDraftScope({ ...draftScope, audience: e.target.value })
                }
              />
              <label className="field-label" htmlFor="scope-core">
                The one main thing it should do
              </label>
              <textarea
                id="scope-core"
                value={draftScope.coreTask}
                maxLength={2000}
                rows={2}
                onChange={(e) =>
                  setDraftScope({ ...draftScope, coreTask: e.target.value })
                }
              />
              <div className="scope-fields">
                <ListEditor
                  label="Build now"
                  id="scope-features"
                  value={draftScope.features}
                  onChange={(v) =>
                    setDraftScope({ ...draftScope, features: v })
                  }
                  hint="Up to three small features, one per line."
                />
                <ListEditor
                  label="I’ll know it works when…"
                  id="scope-done"
                  value={draftScope.done}
                  onChange={(v) => setDraftScope({ ...draftScope, done: v })}
                  hint="Observable checks, one per line."
                />
              </div>
            </section>
            <aside className="scope-side">
              <div className="coach-note">
                <span className="soft-icon">
                  <Lightbulb size={23} />
                </span>
                <h3>Small is a superpower.</h3>
                <p>
                  Your first app only needs to do one useful thing well. You can
                  always grow it after you’ve made it work.
                </p>
              </div>
              <section className="later-card">
                <div>
                  <Clock3 size={18} />
                  <h3>For another day</h3>
                </div>
                <p>Good ideas. Just not for your first five days.</p>
                <ListEditor
                  label="Your later list"
                  id="scope-later"
                  value={draftScope.later}
                  onChange={(v) => setDraftScope({ ...draftScope, later: v })}
                />
              </section>
              <p className="small-muted">
                {scopeMode === "ai"
                  ? "This is an AI suggestion. You decide what belongs in your project."
                  : "This is starter guidance based on your answers. Edit it to fit your idea."}
              </p>
            </aside>
          </div>
          {scopeEditing && (
            <p className="inline-warning">
              Changing your scope restarts task checks and reflections so they
              match your new plan.
            </p>
          )}
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          <div className="scope-footer">
            <span>
              <CheckCircle2 size={17} /> Your idea. You make the decisions.
            </span>
            <Button onClick={approveScope}>
              This is my starting point <ArrowRight size={18} />
            </Button>
          </div>
        </main>
      )}

      {project && ["journey", "lesson", "project", "finish"].includes(view) && (
        <div className="workspace">
          <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
            <div className="sidebar-label">YOUR LEARNING SPACE</div>
            <button
              className={`sidebar-item ${view === "journey" ? "active" : ""}`}
              onClick={() => navigate("journey")}
            >
              <Compass size={18} /> My journey
            </button>
            <div className="sidebar-separator" />
            <div className="sidebar-label">FIVE DAYS TO YOUR FIRST APP</div>
            <nav aria-label="Training days">
              {days.map((d, i) => {
                const Icon = icons[i];
                const done = d.tasks.every((t) => project.completed[t.id]);
                return (
                  <button
                    key={d.id}
                    className={`day-nav ${view === "lesson" && project.activeDay === d.id ? "active" : ""}`}
                    onClick={() => selectDay(d.id)}
                  >
                    <span className={`day-nav-icon ${done ? "done" : ""}`}>
                      {done ? <Check size={17} /> : <Icon size={17} />}
                    </span>
                    <span>
                      <small>DAY {d.id}</small>
                      <strong>{dayLabels[i]}</strong>
                    </span>
                    {done && <span className="nav-done-dot" />}
                  </button>
                );
              })}
            </nav>
            <div className="sidebar-separator" />
            <button
              className={`sidebar-item ${view === "project" ? "active" : ""}`}
              onClick={() => navigate("project")}
            >
              <BookOpen size={18} /> My project plan
            </button>
            <button
              className={`sidebar-item ${view === "finish" ? "active" : ""}`}
              onClick={() => navigate("finish")}
            >
              <Flag size={18} /> My first launch
            </button>
            <div className="sidebar-bottom">
              <div className="sidebar-encourage">
                <Leaf size={20} />
                <strong>Progress over perfection.</strong>
                <p>You’re not behind. You’re building at your own pace.</p>
              </div>
              <button
                className="sidebar-help"
                onClick={() => setResources(true)}
              >
                <BookOpen size={15} /> Open the field guide{" "}
                <ArrowUpRight size={14} />
              </button>
            </div>
          </aside>
          <main id="main" className="workspace-main">
            <div className="mobile-workspace-bar">
              <button
                className="text-button"
                onClick={() => setMobileNav(!mobileNav)}
                aria-expanded={mobileNav}
              >
                <Menu size={19} /> Learning menu
              </button>
              <span>{progress.percent}% complete</span>
            </div>
            {view === "journey" && (
              <>
                <div className="page-breadcrumb">
                  Your learning space <ChevronRight size={13} /> My journey
                </div>
                <div className="page-heading">
                  <div>
                    <span className="eyebrow">
                      YOU’VE GOT AN IDEA. NOW YOU’VE GOT A PATH.
                    </span>
                    <h1>
                      Let’s build something
                      <br className="desktop-break" /> you can call yours
                      <span className="heading-dot">.</span>
                    </h1>
                    <p>
                      Five small chapters. One real app. And a little guidance
                      along the way.
                    </p>
                  </div>
                  <div className="heading-sketch" aria-hidden="true">
                    <Sprout size={67} strokeWidth={1.25} />
                    <span>
                      start small,
                      <br />
                      grow from here
                    </span>
                  </div>
                </div>
                <div className="dashboard-grid">
                  <div>
                    <section className="continue-card">
                      <div className="continue-top">
                        <span className="pill light">
                          <span className="pulse-dot" />{" "}
                          {progress.completed
                            ? "KEEP YOUR MOMENTUM"
                            : "YOUR FIRST STEP STARTS HERE"}
                        </span>
                        <span className="duration">
                          <Clock3 size={14} /> {project.profile.time} / day
                        </span>
                      </div>
                      <span className="continue-kicker">
                        DAY {project.activeDay} ·{" "}
                        {dayLabels[project.activeDay - 1]?.toUpperCase()}
                      </span>
                      <h2>{dayTitles[project.activeDay - 1]}</h2>
                      <p>
                        {currentDay?.description ||
                          "Turn a big idea into one small thing you can actually build. We’ll take it from here, together."}
                      </p>
                      <Button
                        className="mint-button"
                        onClick={() => selectDay(project.activeDay)}
                      >
                        {totalDone
                          ? "Revisit your work"
                          : progress.completed
                            ? "Continue my journey"
                            : "Start day one"}{" "}
                        <ArrowRight size={17} />
                      </Button>
                      <div className="continue-art" aria-hidden="true">
                        <div className="art-orbit" />
                        <Lightbulb size={64} strokeWidth={1.1} />
                        <span className="art-star">✦</span>
                      </div>
                    </section>
                    <div className="journey-section-title">
                      <h2>Your five-day journey</h2>
                      <span>Go at your own pace</span>
                    </div>
                    <div className="journey-list">
                      {days.map((d, i) => {
                        const Icon = icons[i];
                        const done = d.tasks.filter(
                          (t) => project.completed[t.id],
                        ).length;
                        return (
                          <button
                            className={`journey-day ${project.activeDay === d.id ? "current" : ""}`}
                            key={d.id}
                            onClick={() => selectDay(d.id)}
                          >
                            <span
                              className={`journey-icon ${done === d.tasks.length ? "completed" : ""}`}
                            >
                              {done === d.tasks.length ? (
                                <Check size={22} />
                              ) : (
                                <Icon size={22} />
                              )}
                            </span>
                            <span className="journey-day-copy">
                              <span className="day-eyebrow">
                                DAY {d.id}
                                {project.activeDay === d.id && (
                                  <span className="current-label">
                                    You are here
                                  </span>
                                )}
                              </span>
                              <strong>{dayLabels[i]}</strong>
                              <span>{d.subtitle || d.title}</span>
                            </span>
                            <span className="task-count">
                              {done}/{d.tasks.length} tasks
                            </span>
                            <ChevronRight size={18} />
                          </button>
                        );
                      })}
                    </div>
                    <p className="pace-note">
                      <Clock3 size={15} /> Five days is a rhythm, not a
                      deadline. Every chapter is open whenever you’re ready.
                    </p>
                  </div>
                  <aside className="dashboard-aside">
                    <ProjectCard
                      project={project}
                      onEdit={() => navigate("project")}
                    />
                    <section className="progress-card card">
                      <div className="card-title-row">
                        <h3>A little closer</h3>
                        <span>{progress.percent}%</span>
                      </div>
                      <div className="progress-track">
                        <span style={{ width: `${progress.percent}%` }} />
                      </div>
                      <p>
                        {progress.completed} of {progress.total} tasks checked
                        by you
                      </p>
                      <div className="progress-note">
                        <Sprout size={18} />
                        <span>
                          {progress.completed
                            ? "Look at that. Small steps add up."
                            : "Every builder starts right here."}
                        </span>
                      </div>
                    </section>
                    <section className="coach-card">
                      <div className="coach-avatar">
                        <Sparkles size={21} />
                      </div>
                      <span className="eyebrow">A NOTE FROM YOUR COACH</span>
                      <h3>You don’t need to know everything to begin.</h3>
                      <p>
                        Just take the next small step. We’ll help you ask the
                        right questions and check what happens.
                      </p>
                      <div className="coach-signature">
                        You’ve got this.<span>— Your FirstShip coach</span>
                      </div>
                    </section>
                    <ModeDisclosure aiAvailable={aiAvailable} />
                  </aside>
                </div>
              </>
            )}
            {view === "lesson" && currentDay && currentTask && (
              <>
                <div className="page-breadcrumb">
                  <button onClick={() => navigate("journey")}>
                    My journey
                  </button>
                  <ChevronRight size={13} /> Day {currentDay.id}
                </div>
                <div className="lesson-heading">
                  <span className="eyebrow">
                    DAY {currentDay.id} ·{" "}
                    {dayLabels[currentDay.id - 1].toUpperCase()}
                  </span>
                  <h1>
                    {dayTitles[currentDay.id - 1]}
                    <span className="heading-dot">.</span>
                  </h1>
                  <p>{currentDay.description}</p>
                </div>
                <div className="lesson-grid">
                  <div>
                    <div
                      className="task-tabs"
                      role="group"
                      aria-label="Tasks for this day"
                    >
                      {currentDay.tasks.map((t, i) => (
                        <button
                          key={t.id}
                          className={currentTask.id === t.id ? "active" : ""}
                          onClick={() => setActiveTask(t.id)}
                        >
                          {project.completed[t.id] ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <span>{i + 1}</span>
                          )}
                          {t.title}
                        </button>
                      ))}
                    </div>
                    <TaskCard
                      key={currentTask.id}
                      task={currentTask}
                      project={project}
                      persist={persist}
                      copy={copy}
                      onHelp={() => setHelpTask(currentTask)}
                      onComplete={(checks, reflection) => {
                        try {
                          const next = completeTask(
                            project,
                            currentTask.id,
                            checks,
                            reflection,
                          );
                          persist(next);
                          setNotice(
                            "A small step, checked and saved. Nice work.",
                          );
                          const nextTask = currentDay.tasks.find(
                            (t) =>
                              t.id !== currentTask.id && !next.completed[t.id],
                          );
                          if (nextTask) setActiveTask(nextTask.id);
                          else if (currentDay.id < 5) {
                            persist({ ...next, activeDay: currentDay.id + 1 });
                            setActiveTask(null);
                            navigate("journey");
                          } else navigate("finish");
                        } catch (err) {
                          setError(err.message);
                        }
                      }}
                    />
                    {error && (
                      <p role="alert" className="inline-error">
                        {error}
                      </p>
                    )}
                    <div className="lesson-footer">
                      <button
                        className="text-button"
                        onClick={() => navigate("journey")}
                      >
                        <ArrowLeft size={16} /> Back to my journey
                      </button>
                      {currentDay.id < 5 && (
                        <button
                          className="text-button"
                          onClick={() => selectDay(currentDay.id + 1)}
                        >
                          Explore day {currentDay.id + 1}{" "}
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <aside className="lesson-aside">
                    <ProjectCard
                      project={project}
                      onEdit={() => navigate("project")}
                    />
                    <section className="workspace-reminder">
                      <Terminal size={22} />
                      <h3>Build there. Learn here.</h3>
                      <p>
                        Copy your prompt into Codex. Come back when you can see
                        what changed, and check it yourself.
                      </p>
                      <a
                        href="https://chatgpt.com/codex"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Codex <ExternalLink size={14} />
                      </a>
                    </section>
                    <ModeDisclosure aiAvailable={aiAvailable} />
                  </aside>
                </div>
              </>
            )}
            {view === "project" && (
              <>
                <div className="page-breadcrumb">
                  Your learning space <ChevronRight size={13} /> My project
                </div>
                <div className="page-heading">
                  <div>
                    <span className="eyebrow">YOUR NORTH STAR</span>
                    <h1>
                      One idea. A clear direction
                      <span className="heading-dot">.</span>
                    </h1>
                    <p>
                      A little reminder of what you’re building, and what can
                      wait.
                    </p>
                  </div>
                </div>
                <div className="project-detail-grid">
                  <section className="card project-detail">
                    <span className="pill">
                      <Sprout size={14} /> YOUR FIRST VERSION
                    </span>
                    <h2>{project.scope.title}</h2>
                    <p className="project-description">
                      {project.scope.description}
                    </p>
                    <div className="detail-section">
                      <span className="eyebrow">WHO IT’S FOR</span>
                      <p>
                        {project.scope.audience || project.profile.audience}
                      </p>
                    </div>
                    <div className="detail-section">
                      <span className="eyebrow">THE ONE MAIN THING</span>
                      <p>{project.scope.coreTask}</p>
                    </div>
                    <div className="detail-section">
                      <h3>Build now</h3>
                      <CheckList items={project.scope.features} />
                    </div>
                    <div className="detail-section">
                      <h3>I’ll know it works when…</h3>
                      <CheckList items={project.scope.done} />
                    </div>
                    <Button secondary onClick={editScope}>
                      Edit my scope <ArrowUpRight size={16} />
                    </Button>
                    <p className="small-muted">
                      Changing the scope restarts task checks so your learning
                      matches the new plan.
                    </p>
                  </section>
                  <aside>
                    <section className="later-card">
                      <div>
                        <Clock3 size={18} />
                        <h3>For another day</h3>
                      </div>
                      <p>
                        Keep these ideas. Give your first version room to
                        breathe.
                      </p>
                      <ul>
                        {project.scope.later.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </section>
                    <section className="data-card card">
                      <ShieldCheck size={23} />
                      <h3>Your work, in this browser.</h3>
                      <p>
                        No account, no cloud sync. Download a summary to keep a
                        copy of your plan and reflections.
                      </p>
                      <Button
                        secondary
                        small
                        onClick={() => downloadSummary(project)}
                      >
                        Download my summary <Download size={15} />
                      </Button>
                      <button
                        className="text-button muted-danger"
                        onClick={() => setConfirmReset(true)}
                      >
                        Start a different project
                      </button>
                    </section>
                  </aside>
                </div>
              </>
            )}
            {view === "finish" && (
              <>
                <div className="page-breadcrumb">
                  <button onClick={() => navigate("journey")}>
                    My journey
                  </button>
                  <ChevronRight size={13} /> My first launch
                </div>
                <section className="finish-hero">
                  <span className="finish-icon">
                    <Flag size={32} />
                  </span>
                  <span className="eyebrow">
                    {totalDone
                      ? "LOOK WHAT YOU MADE"
                      : "YOUR FIRST LAUNCH IS TAKING SHAPE"}
                  </span>
                  <h1>
                    {totalDone
                      ? "From “what if” to “I made this.”"
                      : "A little closer to “I made this.”"}
                  </h1>
                  <p>
                    {totalDone
                      ? "You took an idea, learned a process, and checked your work. That’s something worth sharing."
                      : "Your launch page is ready when you are. Finish your checks, keep your reflections, and share what you’ve built."}
                  </p>
                  <span className="pill">
                    {progress.completed} of {progress.total} tasks
                    learner-confirmed
                  </span>
                </section>
                <div className="finish-grid">
                  <section className="card">
                    <h2>{project.scope.title}</h2>
                    <p>{project.scope.description}</p>
                    <FinalLinkEditor
                      key={project.id}
                      project={project}
                      persist={persist}
                    />
                    <div className="detail-section">
                      <h3>A moment to look back</h3>
                      {[
                        {
                          id: "learned",
                          label:
                            "What can you do now that you couldn’t do before?",
                        },
                        {
                          id: "proud",
                          label: "What part are you most proud of?",
                        },
                        {
                          id: "next",
                          label: "What would you try differently next time?",
                        },
                      ].map(({ id, label }) => (
                        <label className="reflection-field" key={id}>
                          {label}
                          <textarea
                            rows={2}
                            maxLength={3000}
                            value={project.reflections?.[id] || ""}
                            onChange={(e) =>
                              persist({
                                ...project,
                                reflections: {
                                  ...project.reflections,
                                  [id]: e.target.value,
                                },
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <Button onClick={() => downloadSummary(project)}>
                      Download my {totalDone ? "project" : "progress"} summary{" "}
                      <Download size={17} />
                    </Button>
                    {!totalDone && (
                      <p className="small-muted">
                        Your export is labeled “in progress” until all tasks are
                        checked.
                      </p>
                    )}
                  </section>
                  <aside>
                    <section className="coach-note">
                      <Rocket size={28} />
                      <h3>Before you share</h3>
                      <CheckList
                        items={[
                          "Try the main action from start to finish.",
                          "Check an empty or unexpected input.",
                          "Keep passwords and private data out of your demo.",
                          "Explain what works and what’s still on your later list.",
                        ]}
                      />
                    </section>
                    <div className="finish-next card">
                      <h3>This is a beginning.</h3>
                      <p>
                        The skills you practiced—clear requests, small steps,
                        and checking results—go with you to your next idea.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => navigate("journey")}
                      >
                        Revisit my journey <ArrowRight size={16} />
                      </button>
                    </div>
                  </aside>
                </div>
              </>
            )}
            <footer className="workspace-footer">
              <span>Small steps. Real things.</span>
              <span>FIRSTSHIP · YOUR FIRST APP STARTS HERE</span>
            </footer>
          </main>
        </div>
      )}

      {resources && (
        <Modal title="Your field guide" onClose={() => setResources(false)}>
          <p className="modal-intro">
            A few good habits you can use with any AI coding assistant.
          </p>
          <div className="resource-list">
            {[
              {
                n: "01",
                title: "Give the AI a clear destination",
                text: "Say who your app is for, what one thing it should do, and what success looks like.",
              },
              {
                n: "02",
                title: "Ask for one small change at a time",
                text: "Build, open the app, and try the change before adding the next feature.",
              },
              {
                n: "03",
                title: "Show what actually happened",
                text: "When stuck, share the exact error, what you expected, and what you already tried. Remove secrets first.",
              },
              {
                n: "04",
                title: "Save working versions",
                text: "Ask Codex to save a Git commit after a change works. A commit is a checkpoint you can return to.",
              },
              {
                n: "05",
                title: "You are the final check",
                text: "An AI saying “done” is a starting point. Open your app, try the main action, and test something unexpected.",
              },
            ].map((r) => (
              <article key={r.n}>
                <span>{r.n}</span>
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="resource-links">
            <h3>Read a little further</h3>
            <a
              href="https://docs.replit.com/learn/effective-prompting"
              target="_blank"
              rel="noreferrer"
            >
              Replit · Effective prompting <ArrowUpRight size={15} />
            </a>
            <a
              href="https://code.claude.com/docs/en/best-practices"
              target="_blank"
              rel="noreferrer"
            >
              Claude Code · Best practices <ArrowUpRight size={15} />
            </a>
            <a
              href="https://chatgpt.com/features/codex-get-started/"
              target="_blank"
              rel="noreferrer"
            >
              Codex · Getting started <ArrowUpRight size={15} />
            </a>
          </div>
        </Modal>
      )}
      {helpTask && project && (
        <HelpPanel
          task={helpTask}
          project={project}
          persist={persist}
          copy={copy}
          onClose={() => setHelpTask(null)}
        />
      )}
      {confirmRecovery && (
        <Modal
          title="Replace the saved project?"
          onClose={() => setConfirmRecovery(false)}
        >
          <p>
            Your browser has saved data that FirstShip could not restore.
            Download the original data before replacing it with your new plan.
          </p>
          <div className="modal-actions">
            <Button secondary onClick={downloadRawBackup}>
              Download original backup <Download size={16} />
            </Button>
            <Button onClick={() => approveScope(true)}>
              Replace with this new plan <ArrowRight size={16} />
            </Button>
          </div>
        </Modal>
      )}
      {confirmReset && (
        <Modal
          title="Make room for a new idea?"
          onClose={() => setConfirmReset(false)}
        >
          <p>
            This browser keeps one project at a time. Your current project stays
            saved until you approve the new plan; approving it replaces the old
            project.
          </p>
          <p>Download your summary first if you’d like to keep a copy.</p>
          <div className="modal-actions">
            <Button secondary onClick={() => downloadSummary(project)}>
              Download current summary <Download size={16} />
            </Button>
            <Button
              onClick={() => {
                setProfile(emptyProfile);
                setStep(0);
                setScopeEditing(false);
                setConfirmReset(false);
                navigate("onboarding");
              }}
            >
              Plan a new idea <ArrowRight size={16} />
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

function OnboardingQuestion({ step, profile, onChange, onIdea }) {
  const questions = [
    {
      key: "idea",
      title: "What would you love to build?",
      text: "Start with something useful to you. A rough idea is more than enough.",
      placeholder: "I’d love an app that helps me…",
    },
    {
      key: "audience",
      title: "Who are you making it for?",
      text: "It can be just you. Think of one person and one situation where your app would help.",
      placeholder: "For me, when I’m planning my week…",
    },
    {
      key: "goal",
      title: "What’s the one thing it should do?",
      text: "Imagine someone opens your app. What useful action should they be able to finish?",
      placeholder: "They should be able to…",
    },
    {
      key: "experience",
      title: "Have you built with AI before?",
      text: "There’s no right starting point. We’ll meet you where you are.",
    },
    {
      key: "time",
      title: "How much time feels realistic?",
      text: "Five days is a suggested pace, not a deadline. Your lessons will always be open.",
    },
  ];
  const q = questions[step];
  return (
    <>
      <h2>{q.title}</h2>
      <p className="question-description">{q.text}</p>
      {step < 3 ? (
        <>
          <label className="sr-only" htmlFor={`question-${q.key}`}>
            {q.title}
          </label>
          <textarea
            autoFocus
            key={q.key}
            id={`question-${q.key}`}
            rows={5}
            maxLength={1000}
            value={profile[q.key]}
            onChange={(e) => onChange(q.key, e.target.value)}
            placeholder={q.placeholder}
          />
          {step === 0 && (
            <div className="idea-suggestions">
              <span>A little inspiration</span>
              {[
                "A personal habit tracker",
                "A recipe organizer",
                "A study quiz for my class",
              ].map((idea) => (
                <button key={idea} onClick={() => onIdea(idea)}>
                  {idea} <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <fieldset className="choice-group">
          <legend className="sr-only">{q.title}</legend>
          {(step === 3
            ? [
                "I’m completely new to coding",
                "I’ve tried a little coding",
                "I’ve used an AI coding tool before",
              ]
            : ["15–30 minutes", "30–60 minutes", "1–2 hours"]
          ).map((v, i) => (
            <label
              key={v}
              className={`choice ${profile[q.key] === v ? "selected" : ""}`}
            >
              <input
                type="radio"
                name={q.key}
                value={v}
                checked={profile[q.key] === v}
                onChange={() => onChange(q.key, v)}
              />
              <span>{v}</span>
              {profile[q.key] === v && <CheckCircle2 size={19} />}
            </label>
          ))}
        </fieldset>
      )}
    </>
  );
}
function ListEditor({ label, id, value, onChange, hint }) {
  return (
    <div className="list-editor">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        value={value.join("\n")}
        rows={4}
        maxLength={3000}
        onChange={(e) => onChange(e.target.value.split("\n"))}
      />
      {hint && <span className="input-hint">{hint}</span>}
    </div>
  );
}
function CheckList({ items }) {
  return (
    <ul className="check-list">
      {items.map((x, i) => (
        <li key={i}>
          <Check size={16} />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}
function ModeTag({ mode }) {
  return (
    <span className="mode-tag">
      <span className={mode === "ai" ? "live-dot" : ""} />
      {mode === "ai" ? "AI-personalized" : "Starter guidance"}
    </span>
  );
}
function ModeDisclosure({ aiAvailable }) {
  return (
    <div className="mode-disclosure">
      <ShieldCheck size={16} />
      <p>
        {aiAvailable
          ? "AI coaching is available. Only what you submit for planning or help is sent to the AI provider."
          : ONLINE_DEMO
            ? "Starter guidance runs in your browser. Your plan and troubleshooting notes stay on this device."
            : "Starter guidance is active. Live AI coaching needs a server connection configured by the app owner."}
      </p>
    </div>
  );
}
function ProjectCard({ project, onEdit }) {
  return (
    <section className="project-card card">
      <div className="card-topline">
        <span className="eyebrow">THE IDEA YOU’RE BRINGING TO LIFE</span>
        <Sprout size={20} />
      </div>
      <h3>{project.scope.title}</h3>
      <p>{project.scope.description}</p>
      <div className="project-card-bottom">
        <span className="pill">FIRST VERSION</span>
        <button className="text-button" onClick={onEdit}>
          View plan <ArrowUpRight size={14} />
        </button>
      </div>
    </section>
  );
}
function TaskCard({ task, project, persist, copy, onHelp, onComplete }) {
  const done = project.completed[task.id];
  const [editing, setEditing] = useState(false);
  const checks =
    (!editing && done?.checks) ||
    project.draftChecks?.[task.id] ||
    task.checks.map(() => false);
  const reflection =
    (!editing && done?.reflection) || project.reflections?.[task.id] || "";
  const readonly = !!done && !editing;
  return (
    <section className="task-card card">
      <div className="task-card-header">
        <span className="eyebrow">YOUR NEXT SMALL STEP</span>
        {done && (
          <span className="pill">
            <CheckCircle2 size={14} /> Checked by you
          </span>
        )}
      </div>
      <h2>{task.title}</h2>
      <p className="task-learn">{task.learn}</p>
      <div className="task-subheading">
        <span className="task-step">1</span>
        <h3>Take this prompt to Codex</h3>
        <span>TRY IT</span>
      </div>
      <div className="prompt-box">
        <div className="prompt-top">
          <span>
            <Terminal size={15} /> YOUR BUILDING PROMPT
          </span>
          <button onClick={() => copy(task.prompt)} className="copy-button">
            <Copy size={14} /> Copy prompt
          </button>
        </div>
        <p>{task.prompt}</p>
      </div>
      <div className="expected-box">
        <span className="soft-icon">
          <Play size={17} />
        </span>
        <div>
          <strong>What you should see</strong>
          <p>{task.expect}</p>
        </div>
      </div>
      <button className="stuck-link" onClick={onHelp}>
        <MessageCircle size={17} />
        <span>Something not quite working?</span> Get unstuck{" "}
        <ArrowRight size={15} />
      </button>
      <div className="task-divider" />
      <div className="task-subheading">
        <span className="task-step">2</span>
        <h3>Come back and check it</h3>
        <span>CHECK IT</span>
      </div>
      <p className="check-intro">
        Open your app and try each check yourself. These are your observations,
        not an automatic code review.
      </p>
      <div className="task-checks">
        {task.checks.map((text, i) => (
          <label className={`task-check ${checks[i] ? "checked" : ""}`} key={i}>
            <input
              type="checkbox"
              checked={!!checks[i]}
              disabled={readonly}
              onChange={(e) => {
                const next = [...checks];
                next[i] = e.target.checked;
                persist({
                  ...project,
                  draftChecks: { ...project.draftChecks, [task.id]: next },
                });
              }}
            />
            <span>{text}</span>
          </label>
        ))}
      </div>
      <label
        className="field-label reflection-label"
        htmlFor={`reflection-${task.id}`}
      >
        {task.reflection || "What did you notice when you tried it?"}
      </label>
      <textarea
        id={`reflection-${task.id}`}
        rows={3}
        maxLength={3000}
        readOnly={readonly}
        placeholder="A sentence is enough. What happened, or what did you learn?"
        value={reflection}
        onChange={(e) =>
          persist({
            ...project,
            reflections: { ...project.reflections, [task.id]: e.target.value },
          })
        }
      />
      <div className="task-complete-row">
        <span>
          <ShieldCheck size={15} /> Learner-confirmed progress
        </span>
        {readonly ? (
          <button
            className="text-button"
            onClick={() => {
              persist({
                ...project,
                draftChecks: { ...project.draftChecks, [task.id]: done.checks },
                reflections: {
                  ...project.reflections,
                  [task.id]: done.reflection,
                },
              });
              setEditing(true);
            }}
          >
            Review my check <ArrowRight size={15} />
          </button>
        ) : (
          <Button
            disabled={
              checks.length !== task.checks.length ||
              !checks.every(Boolean) ||
              !reflection.trim()
            }
            onClick={() => {
              onComplete(checks, reflection);
              setEditing(false);
            }}
          >
            I checked it—continue <Check size={17} />
          </Button>
        )}
      </div>
      {!readonly && (!checks.every(Boolean) || !reflection.trim()) && (
        <p className="input-hint completion-hint">
          Try every check and add a short reflection to complete this step.
        </p>
      )}
    </section>
  );
}
function HelpPanel({ task, project, persist, copy, onClose }) {
  const [problem, setProblem] = useState(() => ({
    ...emptyProblem,
    ...project.helpDraft?.[task.id],
  }));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("guided");
  function update(key, value) {
    const next = { ...problem, [key]: value };
    setProblem(next);
    persist({
      ...project,
      helpDraft: { ...project.helpDraft, [task.id]: next },
    });
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await coach({
        action: "help",
        profile: project.profile,
        scope: project.scope,
        task: { id: task.id, title: task.title },
        problem,
      });
      setResult(d.result);
      setMode(d.mode);
    } catch (err) {
      setError(
        err.name === "TimeoutError"
          ? "The coach took too long. Your notes are still here; try again."
          : err.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Let’s get you unstuck." onClose={onClose} wide>
      <div className="help-context">
        <MessageCircle size={18} />
        <span>
          Working on: <strong>{task.title}</strong>
        </span>
      </div>
      <p className="modal-intro">
        Getting stuck is part of building. A clear description helps you—and
        Codex—find the next step.
      </p>
      <div className="secret-note">
        <ShieldCheck size={17} /> Remove passwords, API keys, and private
        information before sharing.
      </div>
      {!result ? (
        <form onSubmit={submit} className="help-form">
          {[
            {
              key: "attempt",
              label: "What were you trying to do?",
              required: true,
              placeholder: "I asked Codex to…",
            },
            {
              key: "expected",
              label: "What did you expect to happen?",
              required: true,
              placeholder: "When I click the button, it should…",
            },
            {
              key: "actual",
              label: "What happened instead?",
              required: true,
              placeholder: "The screen shows…",
            },
            {
              key: "error",
              label: "Exact error message (if there is one)",
              placeholder: "Paste the error text, without any secrets.",
            },
            {
              key: "tried",
              label: "What have you already tried? (optional)",
              placeholder: "I tried refreshing the page…",
            },
          ].map((f) => (
            <label key={f.key} className="reflection-field">
              {f.label}
              <textarea
                rows={2}
                maxLength={f.key === "error" ? 4000 : 2000}
                required={f.required}
                value={problem[f.key] || ""}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
              />
            </label>
          ))}
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <Button
            disabled={
              busy ||
              !problem.attempt.trim() ||
              !problem.expected.trim() ||
              !problem.actual.trim()
            }
            type="submit"
          >
            {busy ? (
              <>
                <LoaderCircle className="spin" size={17} /> Finding a next step…
              </>
            ) : (
              <>
                Help me find the next step <Sparkles size={17} />
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="help-result">
          <ModeTag mode={mode} />
          <h3>Here’s a place to start.</h3>
          <p>{result.explanation}</p>
          <div className="next-step">
            <strong>Your next small step</strong>
            <p>{result.nextStep}</p>
          </div>
          <div className="prompt-box">
            <div className="prompt-top">
              <span>
                <Terminal size={15} /> TAKE THIS TO CODEX
              </span>
              <button
                className="copy-button"
                onClick={() => copy(result.prompt)}
              >
                <Copy size={14} /> Copy prompt
              </button>
            </div>
            <p>{result.prompt}</p>
          </div>
          <div className="expected-box">
            <CheckCircle2 size={20} />
            <div>
              <strong>How to check the result</strong>
              <p>{result.check}</p>
            </div>
          </div>
          <p className="small-muted">
            This is a suggested next step. Your coach hasn’t inspected your code
            or run your app.
          </p>
          <div className="modal-actions">
            <Button secondary onClick={() => setResult(null)}>
              Still stuck / edit details
            </Button>
            <Button onClick={onClose}>
              I’ll give it a try <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
function downloadText(text, name, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadSummary(project) {
  downloadText(
    exportSummary(project),
    "firstship-project-summary.md",
    "text/markdown;charset=utf-8",
  );
}
function FinalLinkEditor({ project, persist }) {
  const [draft, setDraft] = useState(project.appUrl || "");
  const valid = !draft.trim() || !!safeUrl(draft.trim());
  function save() {
    if (valid && draft.trim() !== project.appUrl)
      persist({ ...project, appUrl: draft.trim() });
  }
  return (
    <>
      <label className="field-label" htmlFor="app-url">
        Your app or demo link <span>(optional)</span>
      </label>
      <input
        id="app-url"
        type="url"
        placeholder="https://your-first-app.com"
        maxLength={1000}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
      />
      {!valid && (
        <p className="inline-error">
          Use a complete http:// or https:// link. Your previous saved link is
          unchanged.
        </p>
      )}
      {safeUrl(project.appUrl) && (
        <a
          className="text-button app-link"
          href={safeUrl(project.appUrl)}
          target="_blank"
          rel="noreferrer"
        >
          Open my app <ExternalLink size={15} />
        </a>
      )}
      <span className="input-hint">
        A valid link is saved when you leave this field.
      </span>
    </>
  );
}
function JourneyIllustration() {
  return (
    <div
      className="hero-illustration"
      aria-label="An illustrated journey from an idea to a working app"
    >
      <div className="illustration-label">
        <span /> YOUR NEXT CHAPTER, LOADING…
      </div>
      <div className="illustration-orbit orbit-one" />
      <div className="illustration-orbit orbit-two" />
      <div className="idea-sticker">
        <Lightbulb size={23} />
        <span>what if I built…</span>
        <Sparkles size={16} />
      </div>
      <svg
        className="journey-path"
        viewBox="0 0 520 480"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M97 95C40 166 61 226 164 242S448 252 422 363C410 410 306 447 234 417"
          stroke="#8dab8a"
          strokeWidth="2"
          strokeDasharray="7 8"
        />
        <path d="m237 408-9 11 14 5" stroke="#8dab8a" strokeWidth="2" />
      </svg>
      <div className="mock-app">
        <div className="mock-app-bar">
          <span />
          <span />
          <span />
          <div>my-first-app</div>
          <ArrowUpRight size={13} />
        </div>
        <div className="mock-app-content">
          <div className="mock-leaf">
            <Sprout size={27} />
          </div>
          <h3>
            A little better,
            <br />
            every day.
          </h3>
          <p>My little habit tracker</p>
          <div className="mock-habit">
            <span className="mock-check">
              <Check size={13} />
            </span>
            <span>Read a few pages</span>
            <span className="mock-days">
              M T W <b>T</b> F
            </span>
          </div>
          <div className="mock-habit">
            <span className="mock-check">
              <Check size={13} />
            </span>
            <span>Get outside</span>
            <span className="mock-days">
              M T W <b>T</b> F
            </span>
          </div>
          <div className="mock-habit muted">
            <span className="mock-check" />
            <span>Make something</span>
            <span className="mock-days">M T W T F</span>
          </div>
          <div className="mock-app-bottom">
            <span>Small things count.</span>
            <span>↗</span>
          </div>
        </div>
      </div>
      <div className="prompt-sticker">
        <span className="prompt-sticker-icon">
          <Terminal size={17} />
        </span>
        <div>
          <small>YOU + A LITTLE AI</small>
          <strong>“Let’s build the first screen.”</strong>
        </div>
      </div>
      <div className="shipped-sticker">
        <span>
          <Check size={19} />
        </span>
        <div>
          <strong>I made this.</strong>
          <small>And you can, too.</small>
        </div>
      </div>
      <span className="floating-star star-one">✦</span>
      <span className="floating-star star-two">✧</span>
      <div className="illustration-caption">
        A small idea can go a long way.
        <svg viewBox="0 0 60 30" aria-hidden="true">
          <path
            d="M2 4c18 23 38 22 51 8m-9 0 10-3-1 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
}
