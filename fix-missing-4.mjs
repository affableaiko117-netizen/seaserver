#!/usr/bin/env node
import https from "https"
import fs from "fs"
import path from "path"
import { URL } from "url"

const OUT    = "seanime-web/public/themes"
const THEMES = "seanime-web/src/lib/theme/anime-themes"

const fallbacks = [
    { id: "pluto",               q: "astro boy robot manga sci-fi" },
    { id: "blade-of-the-immortal", q: "samurai sword edo period" },
    { id: "holyland",            q: "boxing street fighting martial arts" },
    { id: "berserk-of-gluttony", q: "dark fantasy warrior sword" },
]

function get(url) {
    return new Promise((res, rej) => {
        https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, r => {
            let d = ""
            r.on("data", c => d += c)
            r.on("end", () => { try { res(JSON.parse(d)) } catch(e) { rej(e) } })
        }).on("error", rej)
    })
}

function dl(url, dest) {
    return new Promise((res, rej) => {
        const f = fs.createWriteStream(dest)
        https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, r => {
            if (r.statusCode === 301 || r.statusCode === 302) {
                f.close(); try { fs.unlinkSync(dest) } catch {}
                return dl(r.headers.location, dest).then(res).catch(rej)
            }
            r.pipe(f)
            f.on("finish", () => f.close(res))
        }).on("error", rej)
    })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

for (const t of fallbacks) {
    const p = new URLSearchParams({ q: t.q, categories: "111", purity: "100", sorting: "views", order: "desc", atleast: "1920x1080" })
    const j = await get("https://wallhaven.cc/api/v1/search?" + p.toString())
    if (!j.data?.length) { console.log(`${t.id}: still 0 results`); continue }

    const img = j.data[0]
    const ext = path.extname(new URL(img.path).pathname) || ".jpg"
    const dest = path.join(OUT, `${t.id}${ext}`)
    await dl(img.path, dest)

    const tf = path.join(THEMES, `${t.id}-theme.ts`)
    let c = fs.readFileSync(tf, "utf8")
    c = c.replace(/backgroundImageUrl:\s*"[^"]*"/, `backgroundImageUrl: "/themes/${t.id}${ext}"`)
    fs.writeFileSync(tf, c, "utf8")

    console.log(`[OK] ${t.id} -> ${img.path} (${img.dimension_x}x${img.dimension_y})`)
    await sleep(1500)
}
console.log("done")
