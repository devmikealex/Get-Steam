import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// console.log(__dirname);

import fs from 'fs'
import fetch from 'node-fetch'

const gameID = 211820;

(async function main() {
    const urlGameInfo = `https://store.steampowered.com/api/appdetails?appids=${gameID}`
    const responseGI = await fetch(urlGameInfo)
    const gameInfo = await responseGI.json()
    const gameName = gameInfo[gameID].data.name
    console.log('name', gameName);

    const url = `https://store.steampowered.com/appreviews/${gameID}?cursor=*&day_range=30&start_date=-1&end_date=-1&date_range_type=all&filter=recent&language=russian&l=russian&review_type=negative&purchase_type=all&playtime_filter_min=10&playtime_filter_max=0&filter_offtopic_activity=1`
    const response = await fetch(url)
    const data = await response.json()
    console.log(data.html.slice(0,50))

    const content = fs.readFileSync('template.html', 'utf8')
    let newContent = content.replace('AAAAAAA', path.resolve(__dirname, 'style.css'))
    newContent = newContent.replace('Steam REVIEW', gameName)
    newContent = newContent.replace('XXXXXX', data.html)
    fs.writeFileSync(`t:/${gameID}-${gameName}.html`, newContent);
})()
