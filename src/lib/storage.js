import { getDays, validCompletion, safeUrl } from "./domain.js";
export const STORAGE_KEY = "firstship.project.v1";
const isObject = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const string = (x, max = 3000) => typeof x === "string" && x.length <= max;
const strings = (x, max) =>
  Array.isArray(x) &&
  x.length > 0 &&
  x.length <= max &&
  x.every((v) => string(v, 700) && v.trim().length > 0);
export function isValidProject(p) {
  if (
    !isObject(p) ||
    !string(p.id, 100) ||
    !string(p.createdAt, 100) ||
    !isObject(p.profile) ||
    !isObject(p.scope) ||
    !isObject(p.completed)
  )
    return false;
  if (
    !["idea", "audience", "goal", "experience", "time"].every((k) =>
      string(p.profile[k], 1000),
    )
  )
    return false;
  if (
    !["title", "description", "audience", "coreTask"].every(
      (k) =>
        string(p.scope[k], k === "title" ? 100 : 2000) &&
        p.scope[k].trim().length > 0,
    )
  )
    return false;
  if (
    !strings(p.scope.features, 3) ||
    !strings(p.scope.done, 5) ||
    !strings(p.scope.later, 8)
  )
    return false;
  if (
    p.scope.features.length > 3 ||
    !p.scope.title.trim() ||
    !p.scope.coreTask.trim()
  )
    return false;
  if (
    typeof p.approved !== "boolean" ||
    !Number.isInteger(p.activeDay) ||
    p.activeDay < 1 ||
    p.activeDay > 5 ||
    !string(p.appUrl, 2000)
  )
    return false;
  if (p.appUrl && safeUrl(p.appUrl) === "") return false;
  if (
    !["guided", "ai"].includes(p.mode) ||
    !isObject(p.reflections) ||
    !Object.values(p.reflections).every((x) => string(x))
  )
    return false;
  const tasks = getDays(p).flatMap((d) => d.tasks);
  if (
    !Object.entries(p.completed).every(([id, record]) => {
      const task = tasks.find((t) => t.id === id);
      return task && validCompletion(record, task);
    })
  )
    return false;
  if (
    p.completed["day-5-task-2"] &&
    tasks.slice(0, -1).some((t) => !validCompletion(p.completed[t.id], t))
  )
    return false;
  // Drafts are UI-owned, but bound the stored payload and allow only ordinary task IDs.
  if (
    p.draftChecks !== undefined &&
    (!isObject(p.draftChecks) ||
      !Object.entries(p.draftChecks).every(([id, checks]) => {
        const task = tasks.find((t) => t.id === id);
        return (
          task &&
          Array.isArray(checks) &&
          checks.length === task.checks.length &&
          checks.every((v) => typeof v === "boolean")
        );
      }))
  )
    return false;
  if (
    p.helpDraft !== undefined &&
    (!isObject(p.helpDraft) ||
      !Object.entries(p.helpDraft).every(
        ([id, draft]) =>
          tasks.some((t) => t.id === id) &&
          isObject(draft) &&
          Object.entries(draft).every(
            ([key, value]) =>
              ["attempt", "expected", "actual", "error", "tried"].includes(
                key,
              ) && string(value, 4000),
          ),
      ))
  )
    return false;
  if (
    p.drafts !== undefined &&
    (!isObject(p.drafts) ||
      Object.keys(p.drafts).some((id) => !tasks.some((t) => t.id === id)))
  )
    return false;
  return true;
}
export function loadProject(storage) {
  try {
    storage ??= globalThis.localStorage;
    const saved = storage?.getItem(STORAGE_KEY);
    if (!storage)
      return {
        project: null,
        warning:
          "Browser storage is unavailable. Your work will stay in this tab only.",
      };
    if (!saved) return { project: null, warning: "" };
    if (saved.length > 300000) throw Error("oversized");
    const envelope = JSON.parse(saved);
    if (envelope.version !== 1 || !isValidProject(envelope.project))
      throw Error("invalid");
    return { project: envelope.project, warning: "" };
  } catch {
    return {
      project: null,
      warning:
        "We could not restore your saved project. Your original saved data has been kept. Download a backup before starting over.",
    };
  }
}
export function saveProject(project, storage) {
  try {
    storage ??= globalThis.localStorage;
    if (!isValidProject(project)) throw Error("invalid");
    if (!storage) throw Error("unavailable");
    const serialized = JSON.stringify({ version: 1, project });
    if (serialized.length > 300000) throw Error("oversized");
    storage.setItem(STORAGE_KEY, serialized);
    return { ok: true, warning: "" };
  } catch {
    return {
      ok: false,
      warning:
        "Your latest changes could not be saved in this browser. Keep this tab open and download your summary to keep a copy.",
    };
  }
}
