# CLAUDE.md

Guidance for working in this repository.

## What this is

A Next.js (App Router) + TypeScript + Prisma app for managing **group
buy/sell portfolios**: a set of `User`s pool cash, buy/sell `Stock`
positions together (one trade split proportionally across participants),
and can individually add capital or withdraw ("exit") cash.

## Stack

- Next.js App Router, React Server Components + Server Actions (`"use server"`)
- Prisma ORM, SQLite (`better-sqlite3` adapter), client generated to
  `src/generated/prisma` (do not hand-edit; re-generate via `prisma generate`)
- UI: Tailwind v4 + `@base-ui/react` primitives (NOT Radix) wrapped in
  shadcn-style `src/components/ui/*` components (Select, Checkbox, Button,
  RadioGroup, Table, Badge, etc.) — data-slot + `cn()` (clsx+tailwind-merge)
  conventions. ToEast via `sonner`.
- No test runner / no `package.json` included in this environment. **Do not
  attempt to `npm install`, run the dev server, or run Prisma commands** —
  verify changes by reading the code carefully instead.

## Data model (`schema.prisma`)

- `User` — `cash: Float`, has many `UserShare`, `Transaction`.
- `Stock` — `name` unique. Gold is a regular Stock row seeded with id
  `GOLD_STOCK_ID` (`src/constants/index.ts`, currently `1`).
- `UserShare` — per (user, stock) running share balance (`count`).
  Unique on `[userId, stockId]`.
- `TransactionGroup` — one **group event**: `type` (`"buy" | "sell" |
  "capital-increased" | "cash-exited"`), `count` (total units traded),
  `unitPrice`, `commission` (percent, e.g. `0.25` = 0.25%), `totalCost`
  (total money). `stockId`/`unitPrice`/`commission` are null for
  capital/cash-exit events.
- `Transaction` — one **participant's share** of a `TransactionGroup`:
  `count` and `totalCost` are that user's portion. The sum of every
  participant `Transaction.count` in a group always equals the group's
  `count` (see `splitByWeight` below).

So: "Transaction History" conceptually means **TransactionGroups**, each
of which fans out into one row per participating `Transaction`.

## Core business logic — `src/lib/gold-accounting.ts`

`submitTransaction(userIds, stockId, count, type, unitPrice, commission)`:
- Computes `realPrice = getRealPrice(unitPrice, commission, type)` (buy pays
  more, sell receives less — `src/lib/pricing.ts`), `totalCost = realPrice * count`.
- **Buy**: only users with `cash > 0` participate; the group's `count`/`totalCost`
  are split across them **by weight = their cash / total eligible cash**
  (`splitByWeight`, which gives the *last* participant the remainder so the
  parts always sum exactly to the total despite float rounding).
- **Sell**: only `UserShare` rows with `count > 0` for that stock
  participate; split by weight = their share count / total eligible shares.
- Users excluded by the cash/share filters are not included in the
  denominator either — i.e. they're fully removed from the calculation,
  not just given a zero-weight slot.
- `submitCapitalIncrease` / `submitCashExit` are single-user, no-stock
  TransactionGroups (`capital-increased` / `cash-exited`), used by
  `increaseUserCapital` / `exitUserCash`.

`createGoldTransaction` (in `src/app/actions.ts`) is a thin wrapper: the
gold form collects a purchased **amount** (money, millions of Toman) and a
**mithqal price** (millions/mithqal); it derives `count` (grams) and
`gramPrice`, then calls `submitTransaction` with `GOLD_STOCK_ID` and no
commission.

All server actions are wrapped in `withErrorHandling` (`src/lib/with-action-error-handling.ts`)
which returns `{ success, data }` or `{ success: false, message }` —
consumed client-side by the `useSubmitForm` hook, which shows a toast and
resolves the result.

## Money/number formatting

- `normalizePrice` / `parsePrice` (`src/lib/utils.ts`) handle comma
  formatting and parsing; `PriceInput` / `PriceLabel` /
  `use-price-input.ts` (`src/components/price/`) are the input/display
  primitives — always prefer these over raw `<input type="number">` for
  money/count fields, they submit a hidden numeric `<input>` alongside a
  formatted display field.

## Conventions worth preserving

- Server components fetch data directly via `prisma` (see `src/lib/prisma.ts`);
  client components (`"use client"`) call server actions from
  `src/app/actions.ts` through `useSubmitForm`.
- `revalidatePath` is called for every path that displays affected data
  after a mutation.
- UI primitives go in `src/components/ui/`; wrap `@base-ui/react/*` with a
  `cn()`-merged className and `data-slot` attribute, matching the existing
  files (see `select.tsx`, `checkbox.tsx`, `radio-group.tsx` for the
  pattern used for the new `dialog.tsx`).
- Percentage/breakdown math for the transaction-group detail dialog is
  computed **client-side** from raw counts/costs passed down as props —
  not persisted or computed on the server.

## Known layout detail

The root layout (`src/app/layout.tsx`) keeps the `<body>` viewport-height
and non-scrolling; only `<main>` scrolls. This keeps the `Sidebar` fixed in
place while page content scrolls — don't reintroduce `min-h-full` on
`body` without an `overflow-hidden`/fixed height pairing, or the sidebar
will scroll away with the page again.

`Sidebar.tsx` supports collapsing to an icon-only rail (state + a
localStorage flag under `sidebar-collapsed`); it manages its own width, so
`layout.tsx` doesn't need to know about it.

## Base UI controlled-component gotcha (important)

`@base-ui/react`'s `RadioGroup` — unlike its `Select`, which explicitly
supports `null` as a defined "nothing selected" controlled value — treats
a `value` of `undefined` as "render uncontrolled". Starting a `RadioGroup`
at `value={undefined}` (e.g. to satisfy "the type must not default to buy
or sell") and only later setting it to `"buy"`/`"sell"` flips it from
uncontrolled to controlled on the first click and throws. The fix used
throughout this app: keep the app-level state (`type`) `| undefined` as
required, but always hand the `RadioGroup` itself a defined sentinel via
`value={type ?? ""}`. `Select`'s `value={stockId}` can safely stay
`number | null` since `null` (not `undefined`) is the correct "unset"
sentinel there.

## Transaction/gold form UI convention

`transaction-form.tsx` / `gold-transaction-form.tsx` put the stock picker
(fixed to Gold on the gold form) at the top, then the Buy/Sell type
selector itself as two full-width cards — each `RadioGroupItem` is
embedded inside its own card (via `Label htmlFor` wrapping the card), so
the card *is* the radio option: the Buy card shows Total Cash, the Sell
card shows Total Shares/Gold for the currently selected stock. Below that,
a responsive grid of "checkbox-card" participants (a `Label`+`Checkbox`
pair styled as a bordered card) shows each user's cash (buy) or share
count for the selected stock (sell) and dims/disables ineligible users.
Keep new selection UIs in this family consistent with that card pattern
rather than reverting to a plain radio row or checkbox list.

## Dashboard portfolio chart

`components/portfolio-pie-chart.tsx` is a dependency-free inline-SVG pie
chart (no `recharts` — there's no `package.json` in this environment to
confirm it's installed, so a raw-SVG chart was used instead to avoid an
unverified import). `app/page.tsx` values each stock slice using its most
recently *traded* `unitPrice` (from `TransactionGroup`) as a stand-in
current price, since `Stock` has no live price field in the schema;
stocks with no trade yet are valued at 0 and flagged in a caption.

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->