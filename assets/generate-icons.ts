#!/usr/bin/env bun

import { mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { $ } from "bun"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
process.chdir(__dirname)

const input = "nsw-riichi-mahjong.webp"
const pub = "../public"

await mkdir(`${pub}/icons`, { recursive: true })

const sizes = [16, 32, 48, 64, 128, 256]

for (const size of sizes) {
  await $`magick ${input} -resize ${size}x${size} ${pub}/icons/icon-${size}.png`
}

// apple touch icon
await $`magick ${input} -resize 180x180 ${pub}/icons/apple-touch-icon.png`

// favicon.ico
await $`magick ${input} -background none -resize 32x32 -define icon:auto-resize=32,16 ${pub}/favicon.ico`
