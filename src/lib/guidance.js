export function createTroubleshootingGuidance(input) {
  if (!input?.problem?.actual?.trim())
    throw new Error("Describe what happened before choosing your next step.");
  const { problem, profile, scope, task } = input;
  const context = `Project: ${scope?.title || profile.idea}\nCore task: ${scope?.coreTask || profile.goal}\nCurrent exercise: ${task?.title || "Build my first app"}`;
  const details = ["attempt", "expected", "actual", "error", "tried"]
    .map((k) => `${k}: ${problem[k] || "(not provided)"}`)
    .join("\n");
  const setup =
    /server|localhost|port|connection|refused|npm|command|install|module|not found/i.test(
      `${problem.actual} ${problem.error}`,
    );
  return {
    explanation: setup
      ? "This may be a setup or development-server issue. This course guide cannot inspect your computer, so first ask Codex to check the exact error and the project instructions."
      : "There may be a mismatch between what you expected and the current app behavior. This course guide cannot diagnose the cause, but you can give Codex a small reproducible example.",
    nextStep: setup
      ? "In your existing project conversation, ask Codex to check how this project starts and report the exact local address. Keep the error message visible."
      : "Repeat the smallest action that shows the problem. Note the input, expected result, and what actually appeared before asking for one focused fix.",
    prompt: `Help me investigate one problem in my first app. Explain your findings in plain language.\n\n${context}\n\n${details}\n\nRead the relevant files and error first. Explain the likely cause, propose the smallest fix, preserve my existing work, and run the appropriate check. Do not add new features. Tell me exactly what I should try afterward.`,
    check: setup
      ? "Open the local address Codex reports. Confirm the app loads, then repeat the action that failed."
      : "Repeat the original action with the same input. Confirm the expected result appears, then try one other input to check the fix.",
  };
}
