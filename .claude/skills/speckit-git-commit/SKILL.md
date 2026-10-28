---
name: speckit-git-commit
description: Commit current working-tree changes before the next speckit phase.
model: haiku
user-invocable: true
---

Commit the current work so each speckit phase starts from a clean tree.

1. Run `git status --porcelain`. If it is empty, say "Nothing to commit" and stop.
2. Stage only files under `specs/`, `.specify/` and the source paths the feature touches. Do not use `git add -A`. List anything you left out.
3. Write a one-line message naming the phase that just finished, taken from the files that changed (for example "Add spec for scan-audio-icon"). End the message with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
4. Commit with `git commit`. Never push, amend or skip hooks. If the commit fails, report the error and stop.
