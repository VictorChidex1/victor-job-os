# Never Delete User Data

## What happened

During project work, an assistant assumed a running emulator + its exported data were "test data" it had created, killed the emulator, and ran `rm -rf .firebase/emulator-export/*` to "clean up". That data was actually the user's real saved state (auth user, job sources, discovered jobs). It was lost with no backup. This is a hard failure — do not repeat it.

## Rules

1. **Never delete, overwrite, or `rm -rf` anything under `.firebase/` or any emulator data** (export dirs, `emulator-export`, `emulator-data`, firestore data) without explicit user approval. "Cleanup" of emulator data is forbidden without a confirmation step.

2. **Never kill a process you did not personally spawn in the current turn.** If a process holds emulator/auth/Firestore data (including the Firestore java emulator on port 8080), treat it as the user's. Do not kill it, do not `emulators:stop` it, do not assume it's a leftover — ask first.

3. **Before any destructive command** (delete, kill, overwrite, migrate, `rm -rf`), state in one line exactly what will be removed and which data it touches, then stop and wait for an explicit yes. Do not rephrase and retry.

4. **Verify the owner before acting.** An emulator that is running and parented to a CLI process is the user's session — not disposable. The `--import`/`--export-on-exit` flags mean the export dir is the user's saved data, never a scratch area.

5. **Prefer non-destructive verification.** To check emulator state, read it (admin SDK read-only query) instead of resetting/clearing. To get a clean state, ask the user to stop their emulator first, or propose a separate throwaway project/port.

6. **Back up before any risk.** If a step could touch user data, run `npm run emulators:backup` first so a prior snapshot exists.

## Environment notes

- The user recreates their own data and is actively using the emulator for this project. Treat every `.firebase/` file and every emulator process as the user's data.
- Never assume a process or file is disposable because it "looks like test data" — confirm ownership before acting.