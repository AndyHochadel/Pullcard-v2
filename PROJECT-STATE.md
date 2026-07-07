# Floorstock Systems - Project State
Last updated: July 2026. Owner: Andy Hochadel (Hochadel Co. LLC).
Purpose: single source of truth for the project. Lives in the repo. Paste into
any AI conversation for instant context.

## What this is
A done-for-you kanban pull card system for small manufacturing shops, sold as
owned software (one-time fee), not SaaS. Built and proven on the floor at
Mi-Kin Creations. Brand: Floorstock Systems. First product: Floorstock Pull Cards.

## Business model (decided)
- Sell-to-own, perpetual license style. No SaaS. Customer owns everything:
  their Google Sheet, their Apps Script, their hosted file.
- Founding price $750 (first 3 shops, in exchange for feedback + testimonial),
  regular $1,250. Includes setup, branding, import up to ~200 items, walkthrough
  call, 30 days email support. Import beyond that quoted separately.
- Optional support/updates plan ~$200-250/yr (classic 15-20% maintenance ratio).
- On-site premium package idea: ~$1,800-2,000, install + card placement walk.
- Positioning: "Buy it once, own it forever. Flat price, unlimited cards.
  Installed by a working shop GM." Own-your-tools framing (shops buy machines,
  not subscriptions). Comparable: 37signals ONCE model.
- Key competitor: Arda (arda.cards). Scannable kanban cards SaaS. Free tier
  10 cards; Growth $250/mo for 250 cards ($1/card); Pro $500/mo. Strong ordering
  automation (Amazon carts, McMaster emails, POs, QuickBooks). If a prospect
  needs that automation, refer them honestly. Floorstock wins on ownership,
  flat pricing, small-shop affordability, and craft-trade (millwork/cabinet)
  specificity. Steal later: free card-generator lead magnet, welcome kit.
- Validation target: ~20-25 conversations, 3 paid installs in 90 days.
  Channels: personal network, supplier reps, CMA/woodworking groups, IWF Atlanta.

## Technical state (all files in this repo)
- pullcard-template.html: the product. Single-file frontend, CONFIG block at top
  (shopNameHTML, homeLink, scriptUrl, gatePassword). Setup guard shows a message
  if scriptUrl unset. Catalog-utility design: white, neutral grays, green #1a5632,
  system fonts, 2px corners, no shadows/pills/mono/uppercase (deliberate anti-AI-
  aesthetic direction). Mobile breakpoint at 700px. Printed card design untouched
  (Arial, orange part numbers) by choice.
- pullcard-backend.gs: hardened Apps Script v2. LockService on all writes,
  surgical endpoints (saveCard, deleteCard, saveCategory, deleteCategory,
  logOrder, updateOrder, deleteOrder, markPrinted batch, togglePrinted,
  saveSetting), atomic legacy bulk writes, initializeSheets() setup function,
  weeklyBackup() + backupNow() to a pruned Drive folder (keeps 8), Settings
  sheet stores layout (pcm_layout) so card layout follows the shop.
- pullcard.html: Mi-Kin's production instance. Identical to template except
  CONFIG values. Deployed via GitHub Pages. Backend deployed on Andy's work
  Google account (MIGRATION PENDING, see open items).
- RUNBOOK.md: 7-phase install checklist with troubleshooting, timing boxes,
  and the migration-vs-fresh-import distinction. Benchmark: 103 cards /
  15 categories imported in ~1.5 unhurried hours. Full install estimate 3-3.5 hrs.
- Orders sheet now includes 'po' column (added July 2026, self-migrates).
- Reorder history entries are editable/deletable in-app (edit modal + rollback).

## Architecture facts that matter
- Stack: single HTML file + Google Apps Script web app + Google Sheets, hosted
  on GitHub Pages, all under the CUSTOMER'S accounts. Zero hosting cost or data
  liability for Floorstock. Images stored as compressed base64 in Sheet cells
  (600px/75% JPEG); fine to a few hundred cards, Drive-hosted images is the
  eventual fix. Gate password is client-side, a courtesy lock, disclosed as such.
- Script updates: always Manage deployments > pencil > New version (keeps URL).
  New deployment = new URL = broken frontend.
- CSV export is a report, not a backup: drops notes and images.

## Roadmap (v1.1, in priority order)
1. In-app CSV/spreadsheet importer (cuts install labor, promoted after import
   rehearsal proved the manual path is gotcha-heavy: category ids, missing
   categories, name drift).
2. QR code on printed cards -> phone-first "log reorder" floor page (Arda
   validates scan interaction as table stakes).
3. Reorder status workflow: Turned In -> Ordered -> Received, open-reorders view.
4. Supplier as managed list (dedupe free-text supplier field).
5. Spend summary view (by category/supplier/month) from existing cost data.
Later: free kanban card generator as lead magnet, Rework Logger and 5S tools
under the Floorstock brand, deeper Floorstock product page.

## Open items
- [ ] Register floorstocksystems.com (checked: floorstock.com parked by a WI
      flooring supplier, no software/trademark collisions found; not legal
      clearance, attorney + USPTO filing when revenue is real)
- [ ] Check GA DBA requirement for "Floorstock Systems" under Hochadel Co. LLC
- [ ] Create GitHub repo (private) for template masters; this doc lives there
- [ ] Migrate Mi-Kin instance off Andy's work Google account to a company-owned
      account (tab-copy method in runbook). Treat as install #1, time it.
      Also covers succession for the daily brief, Rework Logger, Doc Library.
- [ ] Review Mi-Kin employment IP/invention-assignment language before selling
- [ ] Offer page for CI site Resources section. Spine: problem / how it works /
      what's included / founding price / factual comparison vs subscription
      tools / founder story ("built it for our floor; couldn't justify the
      subscription alternatives for my own shop either")
- [ ] Fix "Mischellaneous" typo in test instance categories

## Working preferences (for any AI assistant)
- No em dashes, no "not X, it's Y" constructions, no AI-default aesthetics
  (cream/terracotta palettes, trendy Google Fonts, pills, mono micro-labels).
- Complete paste-ready files over incremental edits. Step-by-step deploy
  instructions. Andy is not a developer.
- Never fabricate metrics. First person for portfolio write-ups.
