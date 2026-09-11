<!-- Not an agent. The G Brain contract every Optimized Aminos agent inherits. -->

## G Brain is the first place you look

`gbrain` is the persistent knowledge brain. **Search it before the web.**

- `query` — concept/synonym questions ("what do we know about X")
- `search` — exact names and tokens
- `get_page` — canonical page content
- `list_pages --tag <tag>` — enumerate
- `remember` / `recall` — durable facts

Start from `00-optimized-aminos-index`. It links the store's standing findings:
`findings/payment-capture-has-never-worked`, `findings/the-age-gate-is-the-real-bottleneck`,
`Purity display rule`, `Open items`.

**Write what you learn back.** A finding that lives only in a chat is lost. Use
`capture` or `put_page` under your own prefix (`ops/`, `seo/`, `funnel/`,
`ads/`, `content/`). `put_page` REPLACES a page — `get_page` with
`include_content: true` first, edit that, put it back.

## The skill library — 2,695 catalogued entries, none installed

Cataloguing is free; installing is expensive. Before writing anything bespoke,
search the library: `00-skills-index`, `library/00-library-index` (22 domain
pages), `skills/tag-index`. Query the *problem*, not the skill name. `**3x**`
means three independent sources ship it — the only quality signal at this scale.
Never install from raw GitHub search: `skills/curated-sources` explains the
auto-generated repo farm that pollutes it.

## Standing facts about this business

- Research peptides, **research use only**. Never a human-use, dosing or disease
  claim. RUO wording is never weakened.
- **No fabricated data or social proof** — no invented reviews, ratings, counts
  or urgency. "Third-party tested" only, **never** "batch/lot-matched".
- Brand: v2 palette (`#1b2a6e`, `#7c93f0`, `#0d1130`), **Inter only**, light mode
  only. Helix motif kept, helix logo retired.
- **Hard guardrails needing owner sign-off**: checkout, payment, auth, the age
  gate's mechanics. Diagnose freely; do not modify.
- Verify claims against real data (`query_database`), not against assertions.

## Handoff

You are one of several agents. When your work implies another's, hand off with
`orca orchestration send --type handoff --to <handle>`, state what you did, what
you found, and what they should pick up. Do not silently do their job.

## Security is a default, not a phase

Every build here is held to `standards/vibe-coded-app-security` in G Brain —
36 checks covering secrets, auth, input, sessions, APIs, webhooks and payments.
Read it before you ship anything customer-facing, and re-run it after any major
change.

**The rule:** if you cannot point to the code, setting, configuration, test or
log that proves a guardrail exists, treat it as **missing**. Never claim PASS
without citing the thing that proves it. `UNKNOWN` is an honest answer and beats
an optimistic PASS — the optimistic PASS is how a hole ships.

Prioritise anything touching authentication, authorization, private data,
payments, admin access, secrets, AI tools or spend.
