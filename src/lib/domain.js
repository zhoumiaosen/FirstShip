export const DAYS = [
  {
    id: 1,
    title: "From idea to first screen",
    subtitle: "Find your starting point",
    description:
      "Shape a small idea, meet your AI coding partner, and get something running.",
    time: "30–45 min",
    skill: "Scope & setup",
  },
  {
    id: 2,
    title: "Make it feel like yours",
    subtitle: "Build your main screen",
    description: "Turn your plan into a clear screen with your own content.",
    time: "30–45 min",
    skill: "Clear prompting",
  },
  {
    id: 3,
    title: "Bring your idea to life",
    subtitle: "Build the core feature",
    description: "Make one useful action work from beginning to end.",
    time: "45–60 min",
    skill: "Small iterations",
  },
  {
    id: 4,
    title: "Break it. Fix it. Learn.",
    subtitle: "Test with confidence",
    description:
      "Try real situations and learn to describe a problem your AI can investigate.",
    time: "30–45 min",
    skill: "Testing & debugging",
  },
  {
    id: 5,
    title: "Your first app, shipped",
    subtitle: "Polish and share",
    description:
      "Finish the small things, demonstrate your app, and decide what comes next.",
    time: "30–45 min",
    skill: "Review & sharing",
  },
];
const text = (value, limit = 1000) =>
  typeof value === "string" ? value.trim().slice(0, limit) : "";
const shorten = (value, max = 60) =>
  value.length > max ? `${value.slice(0, max - 1).trim()}…` : value;

export function createGuidedScope(profile = {}) {
  const idea = text(profile.idea) || "A personal organizer";
  const audience =
    text(profile.audience, 400) || "people with this everyday problem";
  const requested =
    text(profile.goal) || `complete one useful task in ${shorten(idea, 100)}`;
  const combined = `${idea} ${requested}`;
  const costly =
    /\b(payment|payments|checkout|subscription|subscriptions|booking|bookings|chat|social|marketplace|platform|network|API|integration|integrations|AI|automatically|wearable|wearables)\b/i;
  const compound =
    requested.split(/[,;]|\b(?:then|plus|also|and)\b/i).filter((x) => x.trim())
      .length > 2;
  let goal = requested;
  if (
    costly.test(requested) ||
    compound ||
    requested.length > 250 ||
    (/\b(build|make|create|launch|manage)\b/i.test(requested) &&
      costly.test(idea))
  ) {
    if (
      /airbnb|\b(room|rooms|rental|rentals|accommodation|booking|bookings)\b/i.test(
        combined,
      )
    )
      goal = "Browse a few sample room listings and filter them by price";
    else if (
      /\b(fitness|workout|workouts|exercise|exercises)\b/i.test(combined)
    )
      goal = "Record one workout in a personal log";
    else if (
      /\b(marketplace|shop|store|ecommerce|e-commerce|etsy|ebay)\b/i.test(
        combined,
      )
    )
      goal = "Browse a small sample catalog and filter items by category";
    else if (/\b(social|network|chat|messaging)\b/i.test(combined))
      goal = "Write a short post in a personal journal on this device";
    else {
      goal = requested
        .split(/[,;]|\b(?:then|plus|also|and|with|including)\b/i)[0]
        .trim();
      if (
        costly.test(goal) ||
        !/\b(record|save|track|list|browse|filter|calculate|compare|organize|create|write|read|view|add|practice|learn|plan|make|show|find)\b/i.test(
          goal,
        )
      )
        goal = `Keep a simple, manually entered list for ${shorten(idea.replace(/\b(?:AI|automatically|platform|API)\b/gi, "").trim(), 100)}`;
      goal = shorten(goal, 180);
    }
  }
  const base =
    idea
      .replace(/^(I (want|would like) to (build|make|create)\s+|an?\s+)/i, "")
      .split(/\b(with|including|plus|that also)\b/i)[0]
      .trim() || "My first app";
  const title = shorten(base.charAt(0).toUpperCase() + base.slice(1), 45);
  const later = [
    "Accounts and cloud sync",
    "Payments, subscriptions, checkout, and booking transactions",
    "Live chat, social feeds, and collaboration",
    "Automatic AI recommendations, paid APIs, and external integrations",
    "Native mobile apps and wearable connections",
  ];
  if (goal !== requested && compound)
    later.push(`Additional requested workflows: ${shorten(requested, 550)}`);
  return {
    title,
    description: `Suggested first version for ${audience}: ${goal}. Review or edit this smaller plan before you approve it.`,
    audience,
    coreTask: goal,
    features: [
      `One clear screen to ${goal.charAt(0).toLowerCase() + goal.slice(1)}`,
      "A visible result with helpful feedback for missing input",
      "Use sample data or browser-local entries, without outside services",
    ],
    done: [
      `A user can ${goal.charAt(0).toLowerCase() + goal.slice(1)} from start to finish.`,
      "The result is visible, with a useful message when input is missing.",
      "You have tried the main action and one unexpected input yourself.",
    ],
    later,
  };
}

export function createProject(profile, scope) {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `project-${Date.now()}`,
    profile: {
      idea: text(profile.idea),
      audience: text(profile.audience),
      goal: text(profile.goal),
      experience: text(profile.experience, 100),
      time: text(profile.time, 100),
    },
    scope,
    approved: false,
    completed: {},
    drafts: {},
    activeDay: 1,
    appUrl: "",
    reflections: {},
    createdAt: new Date().toISOString(),
  };
}

export function getDays(project) {
  const s = project?.scope ?? createGuidedScope(project?.profile);
  const title = text(s.title),
    core = text(s.coreTask),
    audience = text(s.audience);
  const context = `I am a beginner building “${title}”, a small browser app for ${audience}. The core workflow is: ${core}.\nKeep this first version limited to: ${(s.features ?? []).join("; ")}. Deferred: ${(s.later ?? []).join("; ")}. Explain unfamiliar words simply. Never request my passwords or API keys.\n\n`;
  const task = (day, n, title, learn, prompt, expect, checks, reflection) => ({
    id: `day-${day}-task-${n}`,
    title,
    learn,
    prompt: context + prompt,
    expect,
    checks,
    reflection,
  });
  const tasks = [
    [
      task(
        1,
        1,
        "Turn your idea into a tiny plan",
        "A good first app solves one small problem. Give your AI a clear finish line before asking it to build.",
        `Read this plan before writing code. Summarize the smallest version of my app and propose a short build checklist. Definition of done: ${(s.done ?? []).join(" ")}. Ask me about any important ambiguity, then wait for my approval.`,
        "A short plan that describes one user, one main action, and a visible result.",
        [
          "I can explain who this app helps.",
          "The plan contains one main workflow and leaves the later features out.",
        ],
        "What did you leave for later, and why?",
      ),
      task(
        1,
        2,
        "Open your very first screen",
        "Your project folder holds the files for your app. A local preview lets you try those files in a browser before sharing anything.",
        `Help me create this app in an empty project folder. Check my setup and explain any required installation before running it. Start with the smallest runnable browser app: a heading for “${title}” and a short explanation of its purpose. Show me how to open the preview and save a working checkpoint. Do not implement every feature yet.`,
        "Your own app opens in a browser and displays its name.",
        [
          "I opened the preview in my browser.",
          "I can see my app name and saved a working version.",
        ],
        "How do you reopen your app preview?",
      ),
    ],
    [
      task(
        2,
        1,
        "Build the main screen",
        "Be specific about what people see and do. A screenshot or a rough sketch can help your AI understand your layout.",
        `Build the main screen for this workflow: ${core}. Before editing, name the fields, action button, and result area it needs. Use clear labels, readable text, and a layout that works on a narrow screen. Use example content rather than connecting services. Keep changes focused on this screen.`,
        "A main screen with the inputs, action, and result area your idea needs.",
        [
          "The screen has clear labels and a main action.",
          "The content describes my idea and fits a narrow browser window.",
        ],
        "Which part of the screen tells someone what to do next?",
      ),
      task(
        2,
        2,
        "Make one small change yourself",
        "Small requests are easier to review. Checking one change at a time helps you notice when something stops working.",
        `Help me improve one small part of the main screen. First ask me which label, color, spacing, or example I want to change. Change only that item, show what files changed, and help me check the preview. Explain one line of the changed code in simple words. Save a working checkpoint.`,
        "One intentional improvement you can recognize and explain.",
        [
          "I chose a specific change and saw it appear.",
          "The rest of the screen still works and I saved a checkpoint.",
        ],
        "What changed, and which file controls it?",
      ),
    ],
    [
      task(
        3,
        1,
        "Make the main action work",
        "Build the smallest complete path first: someone provides an input, takes an action, and sees a useful result.",
        `Implement only the core workflow: ${core}. Use the existing main screen. Describe the input, action, and visible result first, then implement that small path. Run any relevant checks and show their results. Tell me exactly how to try it myself. Keep deferred features out.`,
        "You can complete your main user task from beginning to end.",
        [
          "I tried the main action with a realistic example.",
          "The visible result matches what I expected.",
        ],
        "Describe the input you tried and the result you saw.",
      ),
      task(
        3,
        2,
        "Handle an empty or missing input",
        "A working app also helps someone recover when they leave something blank. Clear feedback makes the experience easier to trust.",
        `Review the core workflow (${core}) for empty or missing input. Add a clear message for one likely mistake without adding new features. If this workflow stores entries, keep them on this device and confirm what happens after refresh; if storage is not needed, explain why. Test the main workflow again and save a checkpoint.`,
        "Missing input gets a useful response, and the normal path still works.",
        [
          "I tried an empty or incomplete input and saw useful feedback.",
          "I retried the main workflow successfully and saved a working version.",
        ],
        "What happened when an input was missing?",
      ),
    ],
    [
      task(
        4,
        1,
        "Test like a real user",
        "Testing means comparing what actually happens with what you expected. Write down steps so you and your AI can repeat them.",
        `Create a short manual testing checklist for ${core}: one normal example, one empty or invalid example, and one repeat-use or refresh example appropriate to this app. Give the expected result for each. Run available automated checks and show evidence, but leave the manual checklist for me to try.`,
        "Three concrete test cases with expected results you can compare yourself.",
        [
          "I tried a normal example and an unexpected input.",
          "I tried repeat use or refresh and wrote down the outcomes.",
        ],
        "Which test gave you the most useful information?",
      ),
      task(
        4,
        2,
        "Practice describing and fixing a problem",
        "A useful bug report says what you tried, what you expected, and what happened instead. A tiny fix is easier to verify than a rewrite.",
        `Help me investigate one issue or confusing behavior in ${title}. Ask me for reproduction steps, expected behavior, actual behavior, and the exact error if one appeared. Do not invent a bug. If my checks found none, help me inspect one empty-state message. Propose a focused change, run relevant checks, and tell me how to retry the original steps.`,
        "One investigated problem or reviewed empty-state message, with a repeatable check.",
        [
          "I described an observed issue or inspected an actual empty state.",
          "I repeated the check after the change and confirmed the main action still works.",
        ],
        "What evidence showed whether your change helped?",
      ),
    ],
    [
      task(
        5,
        1,
        "Add the finishing touches",
        "Polish helps someone understand an app. Finish the core experience before adding anything from your later list.",
        `Review ${title} against its original definition of done: ${(s.done ?? []).join(" ")}. Check labels, empty states, narrow-screen layout, and the core workflow. Fix only issues that block that definition. Help me write a short README with start instructions and honest limitations. Offer a sharing option, but explain any account, cost, or publishing step before doing it.`,
        "A tidy small app with clear instructions and known limitations.",
        [
          "I retried the core workflow and checked the narrow-screen layout.",
          "I have start instructions and can name the current limitations.",
        ],
        "What is one thing someone should know before trying your app?",
      ),
      task(
        5,
        2,
        "Show what you built",
        "You have a first version when you can show its main task working and explain who it helps. Sharing is optional; showing it running locally counts.",
        `Help me prepare a 60-second walkthrough of ${title}: who it helps, the problem, the main workflow (${core}), and an honest limitation. Have me demonstrate it rather than claiming you verified what I did. Help me keep the app running for my walkthrough. Leave new features on my later list.`,
        "A short walkthrough of your working first app and a clear next step.",
        [
          "I demonstrated my main workflow from start to finish.",
          "I can explain who it helps and one limitation.",
          "I checked every earlier task and recorded what I observed.",
        ],
        "What can you now do with AI that you could not do at the start?",
      ),
    ],
  ];
  return DAYS.map((day, i) => ({ ...day, tasks: tasks[i] }));
}

export function completeTask(project, taskId, checks, reflection) {
  const tasks = getDays(project).flatMap((d) => d.tasks),
    task = tasks.find((t) => t.id === taskId);
  if (!task) throw new Error("This task does not exist.");
  if (
    !Array.isArray(checks) ||
    checks.length !== task.checks.length ||
    !checks.every((v) => v === true)
  )
    throw new Error("Try and confirm every check before completing this task.");
  const note = text(reflection, 3000);
  if (!note) throw new Error("Write a short observation about what happened.");
  if (
    taskId === "day-5-task-2" &&
    tasks
      .slice(0, -1)
      .some((t) => !validCompletion(project.completed?.[t.id], t))
  )
    throw new Error(
      "Complete the earlier tasks before finishing your journey.",
    );
  return {
    ...project,
    completed: {
      ...project.completed,
      [taskId]: { checks: [...checks], reflection: note },
    },
  };
}
export function validCompletion(record, task) {
  return (
    !!record &&
    Array.isArray(record.checks) &&
    record.checks.length === task.checks.length &&
    record.checks.every((v) => v === true) &&
    typeof record.reflection === "string" &&
    record.reflection.trim().length > 0 &&
    record.reflection.length <= 3000
  );
}
export function getProgress(project) {
  const tasks = getDays(project).flatMap((d) => d.tasks),
    completed = tasks.filter((t) =>
      validCompletion(project?.completed?.[t.id], t),
    ).length;
  return {
    completed,
    total: tasks.length,
    percent: Math.round((completed / tasks.length) * 100),
  };
}
export function safeUrl(value) {
  try {
    const url = new URL(text(value, 2000));
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}
export function exportSummary(project) {
  const progress = getProgress(project),
    s = project.scope,
    url = safeUrl(project.appUrl);
  return `# ${s.title} — My FirstShip journey\n\nStatus: ${progress.completed === progress.total ? "Completed" : "In progress"} (${progress.completed}/${progress.total} tasks)\n\nProgress and checks are learner-confirmed; FirstShip has not inspected the app.\n\n## My idea\n${project.profile.idea}\n\n## First version\n${s.description}\n\nAudience: ${s.audience}\n\nCore workflow: ${s.coreTask}\n\n## Build now\n${s.features.map((x) => `- ${x}`).join("\n")}\n\n## Definition of done\n${s.done.map((x) => `- ${x}`).join("\n")}\n\n${url ? `App or walkthrough: ${url}\n\n` : ""}## My practice\n${getDays(
    project,
  )
    .map(
      (d) =>
        `### Day ${d.id}: ${d.title}\n${d.tasks.map((t) => `- ${validCompletion(project.completed?.[t.id], t) ? "[x]" : "[ ]"} ${t.title}${project.completed?.[t.id]?.reflection ? `\n  Observation: ${project.completed[t.id].reflection}` : ""}`).join("\n")}`,
    )
    .join("\n\n")}\n\n## Final reflections\n${[
    ["learned", "What I learned"],
    ["proud", "What I am proud of"],
    ["next", "What I would try differently"],
  ]
    .map(
      ([key, label]) =>
        `### ${label}\n${project.reflections?.[key]?.trim() || "(Not recorded yet)"}`,
    )
    .join("\n\n")}\n\n## Later\n${s.later.map((x) => `- ${x}`).join("\n")}\n`;
}
