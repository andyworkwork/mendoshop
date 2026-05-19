import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..', 'src')
const CLOSE_BAD = '\u003c/\u006d\u006f\u0074\u0069\u006f\u006e\u003e'
const CLOSE_GOOD = '\u003c/\u0064\u0069\u0076\u003e'
const OPEN_BAD = '\u003c\u006d\u006f\u0074\u0069\u006f\u006e'

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p)
    else if (p.endsWith('.tsx')) {
      const o = fs.readFileSync(p, 'utf8')
      const fixed = o.replaceAll(CLOSE_BAD, CLOSE_GOOD).replaceAll(OPEN_BAD, '\u003c\u0064\u0069\u0076')
      if (fixed !== o) fs.writeFileSync(p, fixed)
    }
  }
}

walk(root)
console.log('done')
