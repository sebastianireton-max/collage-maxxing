# Getting every agent onto the MacBook, running Orca

Written 2026-09-11 from the actual state of the Windows machine, not from docs.

## What is already done

Every agent branch across all three projects is pushed to GitHub (all private).
**Agent definitions live inside the repos** (`.claude/agents/*.md`), so cloning
a repo brings its agents with it. Nothing extra to sync for those.

| Project | Agents | Remote |
|---|---|---|
| `optimized-aminos` | 8 (+ shared preamble) | `sebastianireton-max/optimized-aminos` |
| `collage-maxxing` | 3 (+ shared preamble) | `sebastianireton-max/collage-maxxing` |
| `office-room-booking` | 2 | `sebastianireton-max/office-room-booking` |

## Step 1 — clone and recreate the worktrees

```bash
mkdir -p ~/orca ~/orca/workspaces && cd ~/orca

git clone https://github.com/sebastianireton-max/optimized-aminos
git clone https://github.com/sebastianireton-max/collage-maxxing
git clone https://github.com/sebastianireton-max/office-room-booking

cd ~/orca/optimized-aminos
git checkout claude/kashu-checkout-path
for a in operations-manager seo-lead ads-manager funnel-lead content-lead \
         store-engineer quality-auditor design-auditor; do
  git worktree add "../workspaces/optimized-aminos/$a" "agent/$a"
done

cd ~/orca/collage-maxxing
for a in cadence-engine lead-scout site-smith; do
  git worktree add "../workspaces/collage-maxxing/$a" "agent/$a"
done

cd ~/orca/office-room-booking
for a in design-auditor security-auditor; do
  git worktree add "../workspaces/office-room-booking/$a" "agent/$a"
done
```

Keep the `~/orca` layout — the paths in existing briefs assume it.

## Step 2 — Orca itself

Install the Orca app on the Mac and sign in. On Windows its binary sits at
`AppData/Local/Programs/orca/resources/bin/orca`; the Mac equivalent lives in the
app bundle. Point it at `~/orca` as the workspace root.

`~/.orca/agent-hooks` is the only local Orca state here. Copy it across if you
rely on those hooks; otherwise Orca rebuilds what it needs.

## Step 3 — the Claude Code layer

These are **user-level, not in any repo**, so a clone does not bring them:

| Path | What it is | Port it? |
|---|---|---|
| `~/.claude/CLAUDE.md` | Your standing context — the G Brain rules, the skill-library policy, working defaults | **Yes.** Agents behave differently without it. |
| `~/.claude/plugins/` | Includes the `ponytail` plugin the manager now runs in | **Yes**, or reinstall the plugins. |
| `~/.claude/projects/<project>/memory/` | Per-project auto-memory | Yes, small. |
| `~/.claude/settings.json` | Permissions, hooks, env | Yes, but re-check paths — they are Windows-shaped. |

Everything else under `~/.claude` (cache, history, image-cache, file-history) is
disposable. Do not copy it.

## Step 4 — G Brain, which is the genuinely hard part

`~/.gbrain` is **206 MB**, and `brain.pglite` is a PGLite database with a
**single-writer lock**. That is the constraint that decides your whole setup:

> **Two machines cannot both write the brain.** Copying `.gbrain` to the Mac
> gives you two brains that immediately diverge, and no merge path. File-syncing
> it (iCloud/Dropbox) is worse — it corrupts the database.

Three honest options:

**A. One brain, served over HTTP — the right answer if you want agents on both
machines sharing one memory.** Leave the Windows box on and run:

```bash
gbrain serve --http --port 8322
```

Point the Mac's `gbrain` MCP at `http://<windows-host>:8322`. One writer, one
truth, both machines read and write it. Cost: the Windows machine must stay
awake and reachable (Tailscale is the sane way to do that rather than opening a
port to the internet).

**B. Move the brain to the Mac and retire the Windows copy.** Clean, no server,
but then the Windows machine has no brain. Copy `~/.gbrain` across *once*, with
both `gbrain` processes stopped, and never write the old one again.

**C. Read-only on the Mac.** Import the library (`~/.gbrain/library/`) so the Mac
can search, and keep all writes on Windows. Simplest, and fine if the MacBook is
for reviewing rather than running agents.

There is a real backup already (`brain.pglite.bak`, plus a dated one). Take a
fresh copy before doing any of this.

## The limit worth planning around

A large share of the outstanding Optimized Aminos work is **browser work inside
the Kashu CRM** — publishing the funnel, setting the email sending domain, the
promotions form, the processor account ID. That needs a browser carrying your
logged-in session.

- **Repo work travels anywhere.** Any machine, any cloud agent.
- **CRM work does not.** It runs only where you are signed in.

So "agents everywhere, always working" is true for the code half and false for
the CRM half. Plan the CRM tasks for whichever machine you are actually sitting
at.

## Keeping the two machines honest

```bash
git push origin HEAD          # before you leave a machine
git fetch --all && git pull   # when you arrive
```

Never put a repo in Dropbox/iCloud/OneDrive. Git is the sync tool; layering a
file syncer over `.git` is the standard way to corrupt a repository.
