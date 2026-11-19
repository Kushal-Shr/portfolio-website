# Design source

These files are the exported source of the "Terminal Portfolio" design canvas
(https://claude.ai/artifact/KvxvetG6dNuyaR2BUwbP2E). They are the **visual and copy source of truth**
for the site. Never edit them; build the Next.js site to match them.

## Fact sources (`source/`)

- `source/kushal-shrestha-resume.pdf`: Kushal's real resume. It is published as-is at `/resume.pdf` (phase 3).
- `source/resume.md`: a text transcription of that PDF. **It is the fact source** for titles, dates, metrics, education and skills. If a fact differs from an artboard, the resume wins. The artboards still set the site's voice and wording.
- `source/github.md`: a GitHub profile snapshot (repo count, stars, featured repos), plus the facts for **Sanctuary**, a 5th project that is not in the artboards.

## Artboard → route map

| File | Route | Canvas size (px) | Notes |
|---|---|---|---|
| `artboards/Main.dc.html` | `/` | 1280×800 | interactive shell; the `<script>` block holds the full shell logic to port |
| `artboards/Tui.dc.html` | `/dashboard` | 1280×860 | TUI dashboard |
| `artboards/Man.dc.html` | `/about` | 1280×1400 | man page |
| `artboards/Projects.dc.html` | `/projects` | 1280×1120 | |
| `artboards/Experience.dc.html` | `/experience` | 1280×1280 | |
| `artboards/Leadership.dc.html` | `/leadership` | 1280×1080 | |
| `artboards/Skills.dc.html` | `/skills` | 1280×960 | filter + spinner |
| `artboards/Resume.dc.html` | `/resume` | 1280×1919 | |
| `artboards/Journey.dc.html` | `/journey` | 1280×1240 | heatmap + entries (copy is placeholder) |
| `artboards/Guide.dc.html` | `/guide` | 1280×1240 | accordion examples |
| `artboards/Nav.dc.html` | shared component | 1280×44 | tmux bar at the bottom of every page |
| `artboards/Prompt.dc.html` | shared component | 1280×48 | typed prompt line at the top of every content page |

Links inside the artboards point at `Xxx.dc.html`. Translate them using the table above.

## How to read a `.dc.html` file

- Ignore `<script src="./support.js">`, `<x-dc>` and `<helmet>`. They are canvas plumbing. The `<style>` inside `<helmet>` holds real global CSS: copy its rules.
- Inline `style="…"` attributes are the exact visual spec: sizes, colors, gaps and paddings.
- `{{name}}` is a value computed in the `<script type="text/x-dc">` block's `renderVals()`.
- `<sc-for list="{{items}}" as="it">` is a loop (`items.map`). `<sc-if value="{{x}}">` is a conditional.
- `<dc-import name="Nav" current="about">` mounts the shared component (`Nav.dc.html`) with props.
- `data-props` on the script tag declares design knobs with their defaults (for example `typeSpeed` 38 ms, `accent` `#7ee787`). Use the defaults.
- `class Component extends DCLogic` is React-like (`setState`, `componentDidMount`). Its logic is the behavior spec to port, but **rewrite it idiomatically** in React/TypeScript. Do not copy the DC runtime.
- Text like `[N]` or `[add: …]` is a content placeholder, not final copy.
