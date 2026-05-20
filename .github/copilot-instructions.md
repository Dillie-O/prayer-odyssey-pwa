# Copilot Agent Rules for Pull Requests

For every pull request that includes repository changes, Copilot agents must:

1. Generate or refresh screenshots and place them in `artifacts/screenshots/` to reflect the current PR changes.
2. Bump the app version in `package.json` (and lockfile via normal package tooling).
3. Add a corresponding release entry to `CHANGELOG.md`.

If a PR has no app or content changes that can be meaningfully screenshotted, agents should still include at least one updated screenshot of the current app state and note that in the PR description.
