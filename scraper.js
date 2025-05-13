// scraper.js
const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const url = 'https://plaintextsports.com/mlb/2025/standings'; // replace with your real target
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  
  // Example: grab all h2s
  const items = $('h2').map((_, el) => $(el).text().trim()).get();
  console.log(JSON.stringify(items, null, 2));
})();
