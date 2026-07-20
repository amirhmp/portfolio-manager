# CLAUDE.md

Guidance for working in this repository.

## What this is

A Next.js (App Router) + TypeScript + Prisma app for managing **group
buy/sell portfolios**: a set of `User`s pool cash, buy/sell `Stock`
positions together (one trade split proportionally across participants),
and can individually or collectively add capital or withdraw ("exit")
cash. Fully internationalized (English/Farsi) with RTL support and a
light/dark theme.

## Stack

- Next.js App Router, React Server Components + Server Actions (`"use server"`)
- Prisma ORM, SQLite (`better-sqlite3` adapter), client generated to
  `src/generated/prisma` (do not hand-edit; re-generate via `prisma generate`)
- `next-intl` for i18n — locale-prefixed routes under `src/app/[locale]/`,
  config in `src/i18n/` (`routing.ts`, `navigation.ts`, `request.ts`),
  locale detection/redirect in `src/proxy.ts` (this project's
  middleware-equivalent)
- UI: Tailwind v4 + `@base-ui/react` primitives (NOT Radix) wrapped in
  shadcn-style `src/components/ui/*` components (Select, Checkbox, Button,
  RadioGroup, Dialog, AlertDialog, Switch, Table, Badge, etc.) — data-slot
  + `cn()` (clsx+tailwind-merge) conventions. Toasts via `sonner`.
- No test runner / no `package.json` visible in this environment. **Do
  not attempt to `npm install`, run the dev server, or run Prisma
  commands** — verify changes by reading the code carefully instead. This
  also means: don't introduce a new npm dependency (charting libs, theme
  libs, etc.) without confirming it's actually installed — prefer a
  dependency-free implementation (see `portfolio-pie-chart.tsx`, and the
  hand-rolled theme toggle instead of `next-themes`) unless the user
  confirms the package is present.
- **`messages/en.json` / `messages/fa.json` are not visible in what gets
  uploaded to this environment** (only `src/` is included). Any new
  `t("key")` added to the code needs a matching key in both files, but
  since their current full content isn't available, don't overwrite them
  — hand back small additive JSON snippets per namespace (e.g.
  `messages-additions.en.json`) for the user to merge in by hand, and say
  so explicitly.

## Data model (`schema.prisma`)

- `User` — `cash: Float`, has many `UserShare`, `Transaction`.
- `Stock` — `name` unique. Gold is a regular Stock row seeded with id
  `GOLD_STOCK_ID` (`src/constants/index.ts`, currently `1`).
- `UserShare` — per (user, stock) running share balance (`count`).
  Unique on `[userId, stockId]`.
- `TransactionGroup` — one **group event**: `type` (`"buy" | "sell" |
  "capital-increased" | "cash-exited" | "group-cash-exited"`), `count`
  (total units traded), `unitPrice`, `commission` (percent, e.g. `0.25` =
  0.25%), `totalCost` (total money), `dealDate` (defaults to `now()`, but
  can be backdated via a date picker in the buy/sell forms — distinct from
  `createdAt`, which is always "when the row was inserted"). `stockId` /
  `unitPrice` / `commission` are null for capital/cash-exit events
  (individual or group).
- `Transaction` — one **participant's share** of a `TransactionGroup`:
  `count` and `totalCost` are that user's portion. The sum of every
  participant `Transaction.count` in a group always equals the group's
  `count` (see `splitByWeight` below). Deleting a `TransactionGroup`
  cascades to delete its `Transaction` rows.

So: "Transaction History" conceptually means **TransactionGroups**, each
of which fans out into one row per participating `Transaction`.

## Core business logic — `src/lib/gold-accounting.ts`

`submitTransaction(userIds, stockId, count, type, unitPrice, commission, dealDate?)`:
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
- `submitGroupCashExit(userIds, amount)` is the multi-user sibling of
  `submitCashExit`: creates one `"group-cash-exited"` group and splits
  `amount` across participating users by the **same cash-weighting as
  buy**, excluding zero/negative-cash users the same way. Used by the
  dashboard's `GroupCashExitForm`.
- `undoLastTransactionGroup()` finds the single most-recently-**created**
  `TransactionGroup` (`createdAt desc` — deliberately not `dealDate`,
  since a deal can be backdated but "undo" means undo the thing you just
  entered), reverses its effect per participant based on `type` (buy →
  refund cash / remove shares; sell → charge cash / restore shares;
  capital-increased → remove cash; cash-exited or group-cash-exited →
  refund cash), then deletes the group. Called by the `undoLastTransaction`
  server action, gated behind a confirmation `AlertDialog` on the
  Transactions page (`UndoLastTransactionButton`).

`createGoldTransaction` (in `src/app/actions.ts`) is a thin wrapper: the
gold form collects a purchased **amount** (money, millions of Toman) and a
**mithqal price** (millions/mithqal); it derives `count` (grams) and
`gramPrice`, then calls `submitTransaction` with `GOLD_STOCK_ID` and no
commission.

All server actions are wrapped in `withErrorHandling` (`src/lib/with-action-error-handling.ts`)
which returns `{ success, data }` or `{ success: false, message }` —
consumed client-side by the `useSubmitForm` hook, which shows a toast and
resolves the result. Error messages inside `gold-accounting.ts` and
`actions.ts` are pulled from the `Errors` translation namespace via
`getTranslations`, not hardcoded strings.

## Total Received Capital

`capitalIncreased − cashExited`, where `cashExited` includes **both**
`"cash-exited"` (individual) and `"group-cash-exited"` (group) —
otherwise a group exit wouldn't move the metric at all. Computed two ways:
- **Per user** (`users/[id]/page.tsx`): filter that user's own
  `Transaction` rows by their `transactionGroup.type`, since a
  `group-cash-exited` group's own `totalCost` is the *whole* group's
  withdrawal, not any one participant's share.
- **System-wide** (dashboard): `prisma.transactionGroup.aggregate` summed
  by `type`, since for the aggregate case the group's `totalCost` already
  equals the total moved regardless of participant count.

Both places show the formula's two operands alongside the result (not
just the final number), per how this was originally requested.

## Money/number formatting

- `normalizePrice` / `parsePrice` (`src/lib/utils.ts`) handle comma
  formatting and parsing; `PriceInput` / `PriceLabel` /
  `use-price-input.ts` (`src/components/price/`) are the input/display
  primitives — always prefer these over raw `<input type="number">` for
  money/count fields, they submit a hidden numeric `<input>` alongside a
  formatted display field, and support controlled `value`/`onChange` when
  a live preview is needed (see `GroupCashExitForm`'s per-user share
  preview).

## Conventions worth preserving

- Server components fetch data directly via `prisma` (see `src/lib/prisma.ts`);
  client components (`"use client"`) call server actions from
  `src/app/actions.ts` through `useSubmitForm`.
- `revalidatePath` is called for every path that displays affected data
  after a mutation.
- UI primitives go in `src/components/ui/`; wrap `@base-ui/react/*` with a
  `cn()`-merged className and `data-slot` attribute, matching the existing
  files (see `select.tsx`, `checkbox.tsx`, `radio-group.tsx`, `dialog.tsx`,
  `alert-dialog.tsx` for the pattern).
- Percentage/breakdown math for the transaction-group detail dialog (and
  the group-cash-exit per-user preview) is computed **client-side** from
  raw counts/costs passed down as props — not persisted or computed on
  the server.
- To merge Base UI props onto a custom styled component (e.g. render a
  `Button` as a `Dialog.Trigger`), use `render={<Button .../>}` — a direct
  element, not a render function — matching `select.tsx`'s existing usage.

## Known layout detail

The root layout (`src/app/[locale]/layout.tsx` — the file at
`src/app/layout.tsx` is just Next's required minimal pass-through root)
keeps the `<body>` viewport-height and non-scrolling; only `<main>`
scrolls. This keeps the `Sidebar` fixed in place while page content
scrolls — don't reintroduce `min-h-full` on `body` without an
`overflow-hidden`/fixed height pairing, or the sidebar will scroll away
with the page again.

`Sidebar.tsx` supports collapsing to an icon-only rail (state + a
localStorage flag under `sidebar-collapsed`); it manages its own width, so
`layout.tsx` doesn't need to know about it. The sidebar's bottom section,
top to bottom, is: theme toggle → language switcher → collapse button
(both toggle rows hide when collapsed, matching each other).

## Internationalization (i18n) & RTL

- Locales: `en`, `fa` (routing/config in `src/i18n/routing.ts`). Every
  route lives under `src/app/[locale]/...`; `src/proxy.ts` handles
  locale detection/redirect (this project's Next middleware equivalent).
- Almost everything — pages, components, `actions.ts`, even
  `gold-accounting.ts` — pulls text via `useTranslations` (client) /
  `getTranslations` (server), namespaced per page/component (e.g.
  `"Dashboard"`, `"Errors"`, `"UndoLastTransaction"`). Keep new UI text
  consistent with this rather than hardcoding strings — see the
  `messages/*.json` caveat under Stack above.
- RTL: `dir` is set on `<html>` based on locale in
  `src/app/[locale]/layout.tsx`. Any directional styling (icons that
  should flip, translate-x offsets, etc.) uses Tailwind's `rtl:` variant
  (`[dir="rtl"] &` under the hood) rather than assuming LTR — see the
  Sidebar's collapse chevron (`rtl:rotate-180`) and the `Switch` thumb's
  translate direction for precedent. `Select`/`RadioGroup` controlled-value
  gotcha below is unrelated but adjacent code to be aware of in the same
  files.
- Fonts swap per locale via CSS custom-property overrides passed as an
  inline `style` on `<html>` in `[locale]/layout.tsx`: Farsi redirects
  `--font-geist-sans`/`--font-geist-mono` to Vazirmatn and
  `--font-fraunces` to Markazi Text, so every place that already uses
  `font-sans`/`font-mono`/`font-serif` renders correctly with no
  per-component changes.

## Light/dark theme

- `:root` (light) and `.dark` (dark) each hold a full, independent
  palette in `globals.css` — they are **not** meant to be kept identical;
  the dark palette is the app's original "vault/ledger" look and should
  stay visually unchanged when tweaking light-mode colors.
- No `next-themes` dependency (same "don't assume a package is installed"
  reasoning as the pie chart). Instead: a blocking inline `<script>` in
  `<head>` (`[locale]/layout.tsx`) reads `localStorage["theme"]` and adds
  the `dark` class to `<html>` before first paint (defaults to dark if
  unset), avoiding a flash of the wrong theme. `suppressHydrationWarning`
  is already on `<html>` to allow for this. The toggle itself lives in
  `Sidebar.tsx`: it reads whatever class the blocking script already
  applied (doesn't re-decide a default) and both toggles
  `document.documentElement`'s `dark` class and writes the same
  `localStorage["theme"]` key on change.

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
rather than reverting to a plain radio row or checkbox list. Both forms
also carry an optional backdated `dealDate` via `ui/date-picker.tsx`.

## Dashboard (`app/[locale]/page.tsx`)

Top summary row is 3 cards: Total Users, Total Cash, **Total Received
Capital** (formula shown underneath — see above). There is deliberately
no "Stocks Held" count card anymore (removed in favor of Total Received
Capital). Below that: the portfolio composition pie chart, the **Group
Cash Exit** form (`GroupCashExitForm` — withdraws from the whole pool at
once, split by cash share, with a live per-user preview), then the
Total-Shares-by-Stock table and the Users table.

`components/portfolio-pie-chart.tsx` is a dependency-free inline-SVG pie
chart (see the no-unconfirmed-dependency rule under Stack). Each stock
slice is valued using its most recently **traded** `unitPrice` (from the
latest `TransactionGroup` for that stock, ordered by `dealDate desc`) as
a stand-in current price, since `Stock` has no live price field in the
schema; stocks with no trade yet are valued at 0 and flagged in a caption.

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