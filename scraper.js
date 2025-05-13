const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const scrape = async () => {
  const url = 'https://plaintextsports.com/mlb/2025/standings';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const results = [];

  // Step 1: Find the "NL West:" <div>
  const nlWestHeader = $('div.font-bold').filter((_, el) =>
    $(el).text().trim() === 'NL West:'
  );

  if (!nlWestHeader.length) {
    console.error('❌ Could not find NL West header');
    return;
  }

  // Step 2: Grab the next sibling .standing-group
  const standingsGroup = nlWestHeader.nextAll('.standing-group').first();

  if (!standingsGroup.length) {
    console.error('❌ Could not find NL West standings group');
    return;
  }

  // Step 3: Extract team rows
  standingsGroup.children('div').each((_, el) => {
    const $el = $(el);
    const $clone = $el.clone();

    let time = $clone.find('time').text().trim();
    $clone.find('time').remove();

    // Convert to Pacific Time
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr);
    const minute = minuteStr.padStart(2, '0');

    hour -= 3;
    if (hour < 1) hour += 12; // basic handling of 12-hour rollover

    const pacificTime = `${hour}:${minute}`;

    const rawText = $clone.text().replace(/\s+/g, ' ').trim();
    const team = $clone.find('a').text().trim();

    const parts = rawText.replace(team, '').trim().split(' ');

    const wl = parts[0].split('-');
    const wins = parseInt(wl[0]);
    const losses = parseInt(wl[1]);
    const pct = parts[1];
    const gb = parts[2];
    const streak = parts[3];
    const last10 = parts[4];

    let todayText = parts.slice(5).join(' ').trim();
    if (todayText.endsWith('@')) {
      todayText = todayText.slice(0, -1).trim();
    }
    const today = todayText + ' @ ' + pacificTime;

    results.push({
      team,
      wins,
      losses,
      pct,
      gb,
      streak,
      last10,
      today: today.trim()
    });
  });

  const output = {
    timestamp: new Date().toISOString(),
    standings: results
  };

  const outputDir = path.join(__dirname, 'public');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  fs.writeFileSync(path.join(outputDir, 'standings.json'), JSON.stringify(output, null, 2));
  console.log('✅ Wrote public/standings.json');
};

scrape();
