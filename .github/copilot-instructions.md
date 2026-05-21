# Copilot Agent Rules for Pull Requests

For every pull request that includes repository changes, Copilot agents must:

1. Generate or refresh screenshots that reflect the current PR changes and attach them to the pull request (do not commit screenshot binaries into the repository).
2. Bump the app version in `package.json` (and lockfile via normal package tooling).
3. Add a corresponding release entry to `CHANGELOG.md`.

If a PR has no app or content changes that can be meaningfully screenshotted, agents should still include at least one updated screenshot of the current app state and attach it to the PR with a short note.
