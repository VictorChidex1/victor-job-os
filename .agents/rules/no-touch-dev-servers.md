# Never Touch Running Dev Servers or Ports

## What happened

During project work, verification steps spawned background `npm run dev` servers and then killed "lingering" processes by grepping for the vite binary path. The user's own running dev server shares the exact same process path (`node_modules/.bin/vite`), so that cleanup killed the user's server. This is a real, repeated failure — do not repeat it.

## Rules

1. **Do NOT spawn a background dev server (`npm run dev`) for verification.** `npm run build` (which runs `tsc -b` + `vite build`) is the real gate: it type-checks and bundles, and it never starts or touches a server. Use build/lint as verification.

2. **Never kill a process you did not start.** When cleanup is required, kill only by the exact PID(s) you captured at spawn time. Never search for processes by path/name (`ps aux | grep vite`, `pkill`, `lsof | grep`) to decide what to kill — that pattern matches the user's own servers.

3. **If a live-server smoke test is genuinely required**, use a strict, isolated port that cannot collide with the user's work:
   - Vite dev: `npm run dev -- --port 5199 --strictPort`
   - Preview: `npm run preview -- --port 5199 --strictPort`
   - Spawn it, check it, then kill ONLY the PID you spawned.

4. **Treat the user's running servers as untouchable.** If a port is already listening (`lsof -iTCP:<port>` shows a process), that is the user's process — do not assume it is yours, do not kill it, do not bind over it. Work around it or ask.

5. **After mutating anything, verify real state.** If a server/port was involved, confirm what actually remains running before reporting success.

6. **Record running processes you create.** If you ever must spawn a long-running process, write its PID to a file (e.g. `.agents/.pids`) so cleanup can target exactly what you created.

## Environment notes

- The user runs multiple projects on this machine. Other projects' dev servers (e.g. on port 5173) may be running at any time. Their ports are theirs.
- Never assume a process belonging to this repo is disposable because the command path matches this repo — the user may be running it themselves.