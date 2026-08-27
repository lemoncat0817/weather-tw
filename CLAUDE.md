@AGENTS.md

## Claude Code

<!-- AGENTS.md is the canonical instruction file for every coding agent in this repo; this file
     exists only because Claude Code reads CLAUDE.md rather than AGENTS.md. A symlink would also
     work, but this project is developed on Windows, where symlinks need Administrator privileges
     or Developer Mode, so the documented @-import is used instead.
     Put Claude Code-specific instructions below, and everything tool-agnostic in AGENTS.md. -->

- Comments, UI strings, and docs in this repo are Traditional Chinese; commit messages are English
  Conventional Commits with a detailed body. Match whichever applies to the file you're editing.
- Run `pnpm typecheck && pnpm lint && pnpm test` before proposing a commit — that's the same gate CI
  enforces, and a red build blocks deployment.
