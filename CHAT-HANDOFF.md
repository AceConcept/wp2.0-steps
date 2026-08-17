# Empty waypoint — chat handoff

Vanilla rebuild of `waypoints/empty` (Endfield-style authoring). Previous React app is in `_legacy-react-src/` (reference only).

## Architecture

- **Entry:** `index.html` → `src/main.js`
- **UI:** HTML template functions + `state` object; mount once, then `patch*` regions (keeps stage stable)
- **Look:** CSS rem + document scaler in `src/scale.js`
- **Not React** — no component tree; edit templates in `main.js`, tokens in `src/styles/`

## Design size

| Piece | Size | Rem (@16px) |
|-------|------|-------------|
| Artboard | **1920×912** | 120×57 |
| Center stage (iframe/image host) | **1360×765** (16:9) | 85×47.8125 |

Scaler: contain via `html { font-size: 16 × scale }`. Body `overflow: hidden` (no scroll footer).

## Stage content (temporary)

- Iframes **off** for now: `USE_STAGE_IFRAME = false` in `src/data/steps.js`
- Stage shows `/stage/0106.73d441.jpg` (copied from endfield-site)
- Dual-iframe crossfade + embed URLs are **still in code** — set `USE_STAGE_IFRAME = true` to restore
- Embed origin (when re-enabled): `https://integration-node-view.vercel.app`

## Removed / simplified

- Right **sidebar rail/drawer** removed from the shell
- Waypoint Manager dropdown in the navbar still exists (uses `wp-sidebar__*` card styles)
- Scrollable OTF footer band disabled (`display: none`)

## Where to edit

| Task | File |
|------|------|
| Step copy / embed URLs / iframe toggle | `src/data/steps.js` |
| Markup / interactions | `src/main.js` |
| Artboard & stage size | `src/styles/tokens.css` |
| Shell layout | `src/styles/chrome.css` |
| Rem scaler | `src/scale.js` |
| Longer scaling notes | `DOCUMENT-SCALING-PORT-GUIDE.md` |

## Run

```bash
npm run dev
```

## Workspace (this chat)

Multi-root workspace pairing **endfield-site** + **empty**:

`C:\Users\Ace\AppData\Roaming\Cursor\glassMultiRootWorkspaces\endfield-site-empty-workspace.code-workspace`

Folders it opens:

- `C:\Users\Ace\Desktop\personal-projects\endfield-site`
- `C:\Users\Ace\Desktop\personal-projects\waypoints\empty`

Reopen that `.code-workspace` file (or the same two folders) so chat history for this session stays attached.
