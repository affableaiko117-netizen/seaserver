#!/usr/bin/env node
import https from "https"
import fs from "fs"
import path from "path"
import { URL } from "url"

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

const p = new URLSearchParams({ q: "street night city", categories: "111", purity: "100", sorting: "views", order: "desc" })
const j = await new Promise((res, rej) => {
    https.get("https://wallhaven.cc/api/v1/search?" + p, { headers: { "User-Agent": "Mozilla/5.0" } }, r => {
        let d = ""
        r.on("data", c => d += c)
        r.on("end", () => res(JSON.parse(d)))
    }).on("error", rej)
})

const img = j.data[0]
const ext = path.extname(new URL(img.path).pathname) || ".jpg"
await dl(img.path, `seanime-web/public/themes/holyland${ext}`)

const tf = "seanime-web/src/lib/theme/anime-themes/holyland-theme.ts"
let c = fs.readFileSync(tf, "utf8")
c = c.replace(/backgroundImageUrl:\s*"[^"]*"/, `backgroundImageUrl: "/themes/holyland${ext}"`)
fs.writeFileSync(tf, c, "utf8")
console.log("holyland ->", img.path)
