# mlb-scraper

A tiny Node script that scrapes the NL West standings from [plaintextsports.com](https://plaintextsports.com/mlb/2025/standings), normalizes a few fields, and writes the result to `public/standings.json`. A GitHub Actions workflow runs it every four hours and commits the updated JSON back to `main`, so the file in this repo is always a fresh snapshot.

## What it produces

`public/standings.json`:

```json
{
  "timestamp": "Wed, Apr 8, 5:41 PM",
  "standings": [
    {
      "team": "LAD",
      "wins": 93,
      "losses": 69,
      "pct": ".574",
      "gb": "-",
      "streak": "W5",
      "last10": "8-2",
      "today": "52-29 41-40 @ 4:10"
    }
  ]
}
```

- `timestamp` — when the snapshot was taken, formatted in `America/Los_Angeles`.
- `standings` — one entry per NL West team in standings order. `today` includes the game time converted from Eastern to Pacific.

## Requirements

- Node 18+
- `npm install` to pull in `axios` and `cheerio`

## Running locally

```bash
npm install
node scraper.js
```

The script overwrites `public/standings.json` and prints a confirmation line. There is no build, lint, or test setup.

## How it works

1. Fetches the standings page with `axios` and loads it into `cheerio`.
2. Finds the `<div class="font-bold">` whose text is `NL West:`, then walks to the next sibling `.standing-group`.
3. For each team row: extracts the `<time>` element separately, collapses whitespace on the remaining text, splits on spaces, and assigns fields by position (`W-L`, `pct`, `gb`, `streak`, `last10`, then the today-game text).
4. Converts the game time from Eastern to Pacific by subtracting three hours with a naive 12-hour wraparound (no AM/PM, no DST handling).
5. Writes the combined object to `public/standings.json`.

## Automation

`.github/workflows/scrape.yaml` runs on the `0 */4 * * *` cron and on manual dispatch. It installs deps, runs the scraper, and commits any diff to `public/standings.json` directly to `main` as `github-actions[bot]`. Most of the commit history is these automated updates.

## Scope and caveats

- **NL West only.** The other five divisions are not parsed. Adding them means repeating the `nextAll('.standing-group')` walk for each division header.
- **Fragile parser.** Field assignment is positional and assumes the upstream page keeps its column order and whitespace shape. A layout change at plaintextsports.com will silently produce wrong values rather than an error.
- **Time conversion is approximate.** ET→PT is a flat `-3` with no AM/PM or daylight-saving logic, which is fine for evening game times but will give wrong-looking results around the wraparound.
- **Hardcoded season.** The URL pins `/mlb/2025/standings`; bump it for a new season.
- `public/standings.json` is a generated artifact — edit `scraper.js`, not the JSON.
