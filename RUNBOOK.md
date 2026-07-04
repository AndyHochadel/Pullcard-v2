# Floorstock Pull Cards - Install Runbook

A Floorstock Systems product.

Purpose: take a new shop from nothing to a working, branded Floorstock Pull Cards.
Fill in the timing boxes on every install. This data sets the setup fee.

**Files needed:** `pullcard-template.html`, `pullcard-backend.gs`
**Accounts needed:** the CUSTOMER'S Google account (they own their data), a GitHub account for hosting (yours or theirs, see Phase 4).

---

## Phase 0 - Intake (before install day)

Collect from the customer:

- [ ] Shop name as it should appear in the header
- [ ] Accent color if they have one (hex code); default is dark green #1a5632
- [ ] The password they want for the app gate
- [ ] Their inventory list, ideally as a spreadsheet (any format; it gets massaged in Phase 5)
- [ ] Which Google account will own the system (recommend a company-owned account, not a personal one, and say why: if that person leaves, the tool dies with their login)
- [ ] Categories they want, with 2 to 6 letter prefixes (e.g. FAST for fasteners, ABRS for abrasives)

Time spent: ______

## Phase 1 - Spreadsheet and backend

Signed into the CUSTOMER'S Google account:

1. [ ] Create a new Google Sheet. Name it `<Shop Name> Pull Cards`.
2. [ ] Extensions > Apps Script. Delete the starter code in Code.gs.
3. [ ] Paste the entire contents of `pullcard-backend.gs`. Save (Ctrl+S).
4. [ ] In the function dropdown, select `initializeSheets`, press Run.
   Approve the permissions prompt (choose the account, Advanced > Allow if Google warns about an unverified app).
   Verify: the Sheet now has Cards, Orders, Categories, and Settings tabs with headers.
5. [ ] Select `backupNow`, press Run. Approve the Drive permission.
   Verify: a "Pull Card Backups" folder now exists in their Drive with one copy inside.
6. [ ] Triggers (clock icon in the left rail) > Add Trigger:
   function `weeklyBackup`, event source Time-driven, Week timer, pick a low-traffic time (Sunday 2 to 3am). Save.

Time spent: ______

## Phase 2 - Deploy the web app

1. [ ] Deploy > New deployment > gear icon > Web app.
2. [ ] Description: `v1`. Execute as: **Me**. Who has access: **Anyone**.
3. [ ] Deploy, approve permissions if asked again.
4. [ ] Copy the Web app URL (ends in `/exec`). Paste it somewhere safe; it goes in CONFIG next.

Note for later updates: to change the script WITHOUT breaking the app, always use
Deploy > Manage deployments > pencil > Version: New version. A brand new deployment
gets a new URL and orphans the frontend.

Time spent: ______

## Phase 3 - Configure the frontend

1. [ ] Open `pullcard-template.html` in a text editor. Find the `CONFIG` block near the top of the script section.
2. [ ] Set `shopNameHTML` (wrap a word in `<span>` for the accent color if wanted).
3. [ ] Set `scriptUrl` to the `/exec` URL from Phase 2.
4. [ ] Set `gatePassword` to the customer's chosen password.
5. [ ] Optional accent color change: in the `:root` CSS block, replace both `--accent` and `--green` values with their hex.
6. [ ] Save the file as `index.html` (or `pullcard.html` if it lives alongside other pages).

Time spent: ______

## Phase 4 - Host it

Default: a GitHub repo with GitHub Pages, one repo per customer.

1. [ ] Create a new PUBLIC repo named `<shopname>-pullcards` (Pages on free accounts requires public; the file contains no data, only the gate password, so tell the customer the password is a courtesy lock, not security).
2. [ ] Upload the configured `index.html`.
3. [ ] Settings > Pages > Deploy from branch > main > root. Save.
4. [ ] Wait for the Pages URL to go live, open it, confirm the gate appears and unlocks.

Alternative if the customer wants zero external hosting: the file also runs opened
directly from a shared drive or local network folder, with the tradeoff that updates
mean redistributing the file.

Time spent: ______

## Phase 5 - Data import

1. [ ] In the app, create their categories first (Categories tab) so prefixes exist.
2. [ ] Massage their inventory list into the Cards sheet columns:
   `id, sku, desc, bin, supplier, qty, orderat, orderunit, notes, image, created, category, printed`
   - `id`: generate as `PREFIX-###` matching their categories (FAST-001, FAST-002, ...)
   - `category`: must contain the category's internal id from the Categories sheet (`cat-...`), not the display name
   - `image`, `printed`: leave blank; `created`: leave blank or a timestamp
3. [ ] Paste the rows directly into the Cards sheet below the header.
4. [ ] Refresh the app and verify counts, spot-check five cards, confirm category grouping.
5. [ ] Photos are added per card through the app afterward, by the customer or as a paid add-on.

Time spent: ______

## Phase 6 - Smoke test (do every item)

- [ ] Add a test card, refresh, confirm it persists
- [ ] Edit the test card, refresh, confirm the edit stuck
- [ ] Log a reorder on it with a unit cost, check History shows it with totals
- [ ] Select it in Print, print preview renders, card marks as printed
- [ ] Delete the test card and its category test entry if made
- [ ] Add and delete a test category, confirm cards are unharmed
- [ ] Adjust a layout slider, open the app in a second browser, confirm the layout followed
- [ ] Open the app on a phone, check Database, Categories, and History views
- [ ] Open the Sheet directly and confirm rows look sane

Time spent: ______

## Phase 7 - Handoff

- [ ] 30-minute walkthrough call: database, new card, logging a reorder, printing, categories
- [ ] Hand over: app URL, gate password, the Sheet URL, where backups live
- [ ] Tell them the two rules: never rename or delete the Sheet tabs, and never edit the header row
- [ ] Card stock recommendation for printing (3.25 x 5.25 layout, 4 per letter page)
- [ ] Ask for feedback in two weeks; founding customers owe a testimonial

Time spent: ______

---

## Troubleshooting

**App loads forever / "Failed to fetch":** the CONFIG scriptUrl is wrong, or the
deployment access is not set to Anyone. Redo Phase 2 step 2.

**"Setup needed" message on load:** CONFIG.scriptUrl was never pasted in.

**Changes to the script do nothing:** a new version was not deployed. Manage
deployments > pencil > New version.

**Data looks empty but the Sheet has rows:** tab names or headers were edited.
Restore names/headers exactly, or run initializeSheets and move data into place.

**Card shows no category / ungrouped:** the category column holds a display name
instead of the internal `cat-...` id. Fix the cell values.

**Sheet was deleted or mangled:** restore from the Pull Card Backups folder in
Drive (copy the backup, repoint nothing; the Apps Script is bound to the original
file, so instead copy the backup's tab contents back into the original Sheet).

---

Total install time: ______  |  Date: ______  |  Customer: ______
