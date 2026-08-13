# AGENTS.md — image-viewer

Obsidian plugin providing a powerful image viewer with gallery view, zoom, slideshow, and more.

## Layout

- `main.ts` — plugin entry, registers image viewer view
- `src/` — source modules
- `manifest.json` / `versions.json` / `styles.css` / `esbuild.config.mjs` / `tsconfig.json`
- `deploy.mjs` / `release.mjs` / `version-bump.mjs` — maintainer scripts
- `DESIGN.md` — UI layout design documentation
- `main.js` — stale compiled output (ignore, use `dist/main.js`)

## Commands

```bash
npm run dev      # esbuild watch -> dist/main.js
npm run build    # tsc -noEmit -skipLibCheck + esbuild production
npm run deploy   # build + copy to author's local vaults, then delete dist/
npm run release  # gh release create from manifest.json version
```

**No `npm run lint` script.** The only quality gate is `tsc -noEmit` during build. ESLint config exists (`eslint.config.mjs`) but is not wired into any npm script.

## Build

- esbuild, entry `main.ts`, format `cjs`, target `es2018`
- externals: `obsidian`, `electron`, `@codemirror/*`, `@lezer/*`, Node builtins
- Copies `manifest.json`, `styles.css`, and `assets/` to `dist/`

## UI Layout Constraints

The plugin uses a **fixed viewport layer model**. When modifying `styles.css`:
1. Navigation arrows are in `.image-viewer-nav-arrow-container` — part of the image-area flex row, not overlays.
2. Toolbar is `position: fixed; bottom: 24px; z-index: 200` — must not depend on parent container layout.
3. Gallery strip is `position: fixed; bottom: 88px; z-index: 190` — sits above toolbar, toggles with height/opacity.
4. Do not use `absolute` positioning for toolbar/gallery inside image containers.
5. Info panel is the only side UI occupying real layout space (`width: 0` / `300px`).
6. Status bar hiding via `body.image-viewer-active` and `.image-viewer-leaf` classes.

See `DESIGN.md` for full layout documentation.

## Versioning

- `version-bump.mjs` bumps `manifest.json` and `versions.json` automatically
- `release.mjs` reads version from `manifest.json`
- Keep `package.json` in sync manually

## Marketplace / Scorecard

Marketplace, manifest, and release conventions live in the parent `obsidian-plugins-parent/AGENTS.md`. Read it before touching `manifest.json`, release flow, or marketplace-facing code.