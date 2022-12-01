import clc from 'cli-color'
import clipboardy from 'clipboardy'
import express from 'express'
import bodyParser from 'body-parser'
import fs from 'fs'
// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
import fetch from 'node-fetch'

const PORT = process.env.PORT || 3030

const app = express()
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
// app.use(bodyParser.text());

app.use((req, res, next) => {
    console.log(
        clc.magentaBright('---middleware:'),
        clc.green(req.method),
        req.originalUrl
    )
    next()
})

app.use(express.static('.'))

app.get('/', (req, res) => {
    res.redirect('getgame.html')
})
app.post('/', (req, res) => {
    console.log('POST', req.body)
    res.status(200).send('ooOKkk')
})

app.get('/clipboard', (req, res) => {
    const clip = clipboardy.readSync().trim()
    console.log(clc.greenBright('Clipboard Read:'), clip)
    if (clip.includes('store.steampowered.com/app')) {
        const newLink = `/game/${getIDFromLink(clip)}?playtimemin=10`
        console.log('Link:', clc.yellowBright(newLink))
        res.redirect(newLink)
    } else {
        console.log(clc.redBright('Bad Clipboard'))
        res.send('Bad Clipboard')
    }

    function getIDFromLink(link) {
        link = link.replace('https://store.steampowered.com/app/', '')
        const slash = link.indexOf('/')
        const id = link.slice(0, slash)
        return id
    }
})

app.get('/game/:id', (req, res) => {
    console.log(clc.cyanBright('GAME:'), req.params)
    console.log(clc.cyanBright('QUERY:'), req.query)
    const gameID = req.params.id
    const cursor = req.query.cursor || '*'

    if (gameID === '0') {
        console.log('ZERO')
        res.send('ZERO Game')
        return
    }

    ;(async function main() {
        const urlGameInfo = `https://store.steampowered.com/api/appdetails?appids=${gameID}`
        const responseGI = await fetch(urlGameInfo)
        const gameInfo = await responseGI.json()
        // console.log('gameInfo:', JSON.stringify(gameInfo));
        if (JSON.stringify(gameInfo).includes('"success":false')) {
            console.log(clc.redBright('Game not found'))
            res.send('Game not found')
            return
        }
        // console.log(Object.hasOwn(gameInfo, gameID))
        // console.log(Object.hasOwn(gameInfo, 'data'))
        // console.log(Object.hasOwn(gameInfo, 'name'))
        const gameName = gameInfo[gameID].data.name
        console.log(clc.cyanBright('Name:'), gameName)

        const playtimemin = req.query.playtimemin || 10

        const url = `https://store.steampowered.com/appreviews/${gameID}?cursor=${cursor}&day_range=30&start_date=-1&end_date=-1&date_range_type=all&filter=recent&language=russian&l=russian&review_type=negative&purchase_type=all&playtime_filter_min=${playtimemin}&playtime_filter_max=0&filter_offtopic_activity=1`
        console.log(clc.cyanBright('URLrev: ') + clc.yellowBright(url))
        const response = await fetch(url)
        const data = await response.json()
        // console.log('Data:', data.html.slice(0,50))

        const content = fs.readFileSync('template.html', 'utf8')
        let newContent = content.replace('file:///AAAAAAA', '/style.css')
        newContent = newContent.replace('Steam REVIEW', gameName + ' - Neg REVIEW')
        const titleLink = `<a href="https://store.steampowered.com/app/${gameID}" target="_blank" rel="noopener noreferrer">${gameName} - ${gameID}</a>`
        newContent = newContent.replace('WWWWWW', titleLink)
        newContent = newContent.replace('XXXXXX', data.html)

        res.send(newContent)
        console.log()
    })()
})

// app.get("/favicon.ico", (req, res) => {
//     res.sendFile("favicon.ico", { root: '.' })
// })

app.listen(PORT, () => {
    console.log()
    console.log('Start server')
    console.log('Working Dir:', process.cwd())
    console.log(clc.yellowBright(`http://127.0.0.1:${PORT}/getgame.html`))
    console.log(clc.yellowBright(`http://127.0.0.1:${PORT}/clipboard`))
}).on('error', function (e) {
    console.log(clc.redBright('--- ! ERROR ! -'), e.message)
})
