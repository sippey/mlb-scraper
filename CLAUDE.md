# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `node scraper.js` — run the scraper once; writes `public/standings.json`.
- `npm install` — install `axios` and `cheerio`. There is no build, lint, or test setup.

## Architecture

Single-file Node script (`scraper.js`) plus a GitHub Actions cron that runs it and commits the result.

- **Source**: scrapes `https://plaintextsports.com/mlb/2025/standings`. The current scraper only extracts the **NL West** division — it locates a `div.font-bold` whose text is `NL West:`, then walks to the next `.standing-group` sibling. Other divisions are not parsed.
- **Row parsing**: each team row is parsed by cloning the element, pulling `<time>` out separately, then splitting the remaining whitespace-collapsed text by spaces. Field order assumed: `W-L pct gb streak last10 today...`. Times are converted ET→PT by subtracting 3 hours with a naive 12-hour wraparound (no AM/PM tracking, no DST awareness). Changes to the upstream HTML structure or column order will silently corrupt fields.
- **Output**: `public/standings.json` with `{ timestamp, standings: [...] }`. `timestamp` is formatted in `America/Los_Angeles`. The file is committed to `main` by the workflow — treat it as a generated artifact, not a hand-edited file.
- **Schedule**: `.github/workflows/scrape.yaml` runs every 4 hours (`0 */4 * * *`) and on manual dispatch, then commits any diff to `public/standings.json` directly on `main`. Most recent commits on the branch will typically be those automated updates.
