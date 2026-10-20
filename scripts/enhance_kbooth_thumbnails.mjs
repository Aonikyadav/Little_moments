import fs from "fs"
import path from "path"
import { Resvg } from "@resvg/resvg-js"
import jpeg from "jpeg-js"

const publicDir = "public/kbooth"
const distDir = "dist/kbooth"
const cleanBaseDir = "scratch/clean_bases"

function getBase64DataUrl(filename) {
  // Always read from clean base to guarantee zero compounding artifacts
  const srcPath = fs.existsSync(path.join(cleanBaseDir, filename))
    ? path.join(cleanBaseDir, filename)
    : path.join(publicDir, filename)
  const buf = fs.readFileSync(srcPath)
  return `data:image/jpeg;base64,${buf.toString("base64")}`
}

fs.mkdirSync(publicDir, { recursive: true })
if (fs.existsSync("dist")) {
  fs.mkdirSync(distDir, { recursive: true })
}

console.log("Applying final pixel-perfect bold typography to all 15 K-Booth templates...")

const enhancements = [
  // --- 01: Purple & Beige Birthday Twin 4-Cut Strip (1280x1600) ---
  {
    file: "kbooth-01.png",
    width: 1280,
    height: 1600,
    renderSvg: (base64) => `
      <svg width="1280" height="1600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="1280" height="1600" />
        
        <!-- Strip Bottom Cover -->
        <rect x="410" y="1245" width="460" height="195" fill="#f4f4f4" />
        
        <!-- Left: 27 . 09 (Extra Bold & Large) -->
        <text x="445" y="1335" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="46" fill="#18181b">27</text>
        <circle cx="457" cy="1355" r="5" fill="#18181b" />
        <text x="445" y="1410" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="46" fill="#18181b">09</text>

        <!-- Right: Happy birthday to me (Extra Bold & Large) -->
        <text x="835" y="1335" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="42" fill="#18181b" text-anchor="end">Happy</text>
        <text x="835" y="1375" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="42" fill="#18181b" text-anchor="end">birthday</text>
        <text x="835" y="1415" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="42" fill="#18181b" text-anchor="end">to me.</text>

        <!-- Top Header: HAPPY BIRTHDAY Badge -->
        <rect x="410" y="70" width="460" height="52" fill="#faf5ef" />
        <text x="640" y="108" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="30" fill="#7c3aed" letter-spacing="3" text-anchor="middle">✦ HAPPY BIRTHDAY ✦</text>
      </svg>
    `
  },

  // --- 02: Brown Retro Birthday Fanned V-Strips (900x1600) ---
  {
    file: "kbooth-02.png",
    width: 900,
    height: 1600,
    renderSvg: (base64) => `
      <svg width="900" height="1600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="900" height="1600" />
        
        <!-- Bottom Right Opaque Patch covering old faint text -->
        <rect x="620" y="1370" width="280" height="230" fill="#221611" />
        
        <!-- Large Bold Birthday Calligraphy comfortably fitted inside width -->
        <text x="860" y="1445" font-family="Georgia, cursive, serif" font-style="italic" font-weight="900" font-size="68" fill="#fde68a" text-anchor="end">happy</text>
        <text x="860" y="1515" font-family="Georgia, cursive, serif" font-style="italic" font-weight="900" font-size="68" fill="#fef3c7" text-anchor="end">birthday!</text>

        <!-- Top Header: RETRO MEMORIES -->
        <rect x="230" y="25" width="440" height="48" fill="#2b1e17" rx="8" />
        <text x="450" y="58" font-family="Georgia, serif" font-weight="900" font-size="28" fill="#fde047" letter-spacing="4" text-anchor="middle">★ RETRO MEMORIES ★</text>
      </svg>
    `
  },

  // --- 03: Blue & White Starry Couple Ticket Strips (900x1600) ---
  {
    file: "kbooth-03.png",
    width: 900,
    height: 1600,
    renderSvg: (base64) => `
      <svg width="900" height="1600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="900" height="1600" />
        
        <!-- Left Strip Top Header Box: y:48 to y:122 (above perforated line) -->
        <rect x="55" y="48" width="350" height="74" fill="#f5f0e6" />
        <text x="230" y="96" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="34" fill="#0f172a" letter-spacing="3" text-anchor="middle">PHOTO BOOTH</text>
        <text x="230" y="118" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="16" fill="#0284c7" letter-spacing="2" text-anchor="middle">★ ADMIT ONE · COUPLE ★</text>

        <!-- Right Strip Top Header Box: y:122 to y:195 (above perforated line) -->
        <rect x="485" y="122" width="350" height="73" fill="#f5f0e6" />
        <text x="660" y="170" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="34" fill="#0f172a" letter-spacing="3" text-anchor="middle">PHOTO BOOTH</text>
        <text x="660" y="192" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="16" fill="#0284c7" letter-spacing="2" text-anchor="middle">★ MEMORIES ARCHIVE ★</text>
      </svg>
    `
  },

  // --- 04: Monochrome Friendship Staggered Ticket Cuts (900x1600) ---
  {
    file: "kbooth-04.png",
    width: 900,
    height: 1600,
    renderSvg: (base64) => `
      <svg width="900" height="1600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="900" height="1600" />
        
        <!-- Left Strip Top: Full Header Box Coverage down to perforated line at y:270 -->
        <rect x="50" y="30" width="390" height="242" fill="#ffffff" />
        <text x="245" y="165" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="46" fill="#09090b" letter-spacing="3" text-anchor="middle">PHOTOBOOTH</text>

        <!-- Left Strip Bottom: Full Footer Box Coverage -->
        <rect x="50" y="1100" width="390" height="110" fill="#ffffff" />
        <text x="245" y="1175" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="40" fill="#09090b" letter-spacing="4" text-anchor="middle">GOOD FRIEND</text>

        <!-- Right Strip Top: Full Header Box Coverage down to perforated line at y:425 -->
        <rect x="510" y="120" width="390" height="305" fill="#ffffff" />
        <text x="705" y="275" font-family="Georgia, cursive, serif" font-style="italic" font-weight="900" font-size="62" fill="#09090b" text-anchor="middle">Memories</text>
        <text x="705" y="330" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="26" fill="#27272a" letter-spacing="6" text-anchor="middle">TO KEEP</text>

        <!-- Right Strip Bottom: Full Footer Box Coverage -->
        <rect x="510" y="1250" width="390" height="110" fill="#ffffff" />
        <text x="705" y="1325" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="40" fill="#09090b" letter-spacing="4" text-anchor="middle">GOOD VIBES</text>
      </svg>
    `
  },

  // --- 05: B&W Retro Birthday Blush Twin Strip (1280x1600) ---
  {
    file: "kbooth-05.png",
    width: 1280,
    height: 1600,
    renderSvg: (base64) => `
      <svg width="1280" height="1600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="1280" height="1600" />
        
        <!-- Bottom Strip Numbers: Solid Cover -->
        <rect x="410" y="1265" width="460" height="175" fill="#f7ebe6" />
        
        <!-- Left: 27 . 09 -->
        <text x="442" y="1345" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="48" fill="#18181b">27</text>
        <circle cx="454" cy="1365" r="5" fill="#18181b" />
        <text x="442" y="1415" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="48" fill="#18181b">09</text>

        <!-- Right: 27 . 09 (Correctly aligned inside right column at x:672) -->
        <text x="672" y="1345" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="48" fill="#18181b">27</text>
        <circle cx="684" cy="1365" r="5" fill="#18181b" />
        <text x="672" y="1415" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="48" fill="#18181b">09</text>

        <!-- Right dark background: Solid cover starting safely outside strip at x:885 -->
        <rect x="885" y="1100" width="390" height="490" fill="#1c1614" />
        <text x="1080" y="1320" font-family="Georgia, cursive, serif" font-style="italic" font-weight="900" font-size="40" fill="#ffffff" text-anchor="middle">happy birthday</text>
        <text x="1080" y="1375" font-family="Georgia, cursive, serif" font-style="italic" font-weight="900" font-size="38" fill="#fbcfe8" text-anchor="middle">to my favourite</text>
        <text x="1080" y="1430" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="40" fill="#ffffff" text-anchor="middle">human! ♡</text>

        <!-- Top Header Strip -->
        <rect x="410" y="75" width="460" height="46" fill="#f7ebe6" />
        <text x="640" y="108" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="28" fill="#18181b" letter-spacing="3" text-anchor="middle">✦ FOREVER YOUNG · 2026 ✦</text>
      </svg>
    `
  },

  // --- 06: Dark Olive Leather Minimalist Quad 4-Cut Strip (1280x1600) ---
  {
    file: "kbooth-06.png",
    width: 1280,
    height: 1600,
    renderSvg: (base64) => `
      <svg width="1280" height="1600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="1280" height="1600" />
        
        <!-- Top Left: 2026 -->
        <rect x="50" y="45" width="240" height="85" fill="#2d3326" rx="6" />
        <text x="170" y="106" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="58" fill="#fef08a" letter-spacing="4" text-anchor="middle">2026</text>

        <!-- Bottom Right: august / LIFE FOUR CUTS -->
        <rect x="800" y="1240" width="450" height="300" fill="#2d3326" rx="8" />
        <text x="1025" y="1370" font-family="Georgia, cursive, serif" font-style="italic" font-weight="900" font-size="115" fill="#fef9c3" text-anchor="middle">august</text>
        <text x="1025" y="1455" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="34" fill="#facc15" letter-spacing="6" text-anchor="middle">· LIFE FOUR CUTS ·</text>
      </svg>
    `
  },

  // --- 07: Dark Wood Slats Elegant Studio Quad Cut (1280x1600) ---
  {
    file: "kbooth-07.png",
    width: 1280,
    height: 1600,
    renderSvg: (base64) => `
      <svg width="1280" height="1600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="1280" height="1600" />
        
        <!-- Top Left: 2026 · ARCHIVE -->
        <rect x="30" y="40" width="370" height="70" fill="#1b1614" rx="6" />
        <text x="215" y="88" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="34" fill="#fbbf24" letter-spacing="4" text-anchor="middle">2026 · ARCHIVE</text>

        <!-- Bottom Right: sept. / STUDIO EDITION -->
        <rect x="830" y="1255" width="425" height="295" fill="#1b1614" rx="8" />
        <text x="1042" y="1395" font-family="Georgia, cursive, serif" font-style="italic" font-weight="900" font-size="120" fill="#ffffff" text-anchor="middle">sept.</text>
        <text x="1042" y="1480" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="34" fill="#f59e0b" letter-spacing="5" text-anchor="middle">STUDIO EDITION</text>
      </svg>
    `
  },

  // --- 08: Crimson Alligator Postage Stamp Strip (1280x1600) ---
  {
    file: "kbooth-08.png",
    width: 1280,
    height: 1600,
    renderSvg: (base64) => `
      <svg width="1280" height="1600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="1280" height="1600" />
        
        <!-- Top Left Badge: 27 06 -->
        <rect x="68" y="55" width="195" height="175" fill="#9f1239" rx="8" />
        <text x="165" y="120" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="60" fill="#ffffff" text-anchor="middle">27</text>
        <circle cx="165" cy="140" r="5" fill="#fef08a" />
        <text x="165" y="195" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="60" fill="#ffffff" text-anchor="middle">06</text>

        <!-- Bottom Right Banner: HAPPY BIRTHDAY TO ME -->
        <rect x="760" y="1240" width="490" height="295" fill="#be123c" rx="12" />
        <text x="1005" y="1340" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="58" fill="#ffffff" letter-spacing="2" text-anchor="middle">HAPPY</text>
        <text x="1005" y="1410" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="58" fill="#ffffff" letter-spacing="2" text-anchor="middle">BIRTHDAY</text>
        <text x="1005" y="1485" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="46" fill="#fef08a" letter-spacing="4" text-anchor="middle">TO ME ★</text>

        <!-- Stamp header -->
        <rect x="390" y="52" width="500" height="46" fill="#fffdfa" />
        <text x="640" y="86" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="28" fill="#be123c" letter-spacing="4" text-anchor="middle">★ POSTAGE STAMP · 2026 ★</text>
      </svg>
    `
  },

  // --- 09: Crimson Alligator Single Large Postage Frame (1280x1600) ---
  {
    file: "kbooth-09.png",
    width: 1280,
    height: 1600,
    renderSvg: (base64) => `
      <svg width="1280" height="1600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="1280" height="1600" />
        
        <!-- Top Left: 27 06 -->
        <rect x="68" y="55" width="195" height="175" fill="#9f1239" rx="8" />
        <text x="165" y="120" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="60" fill="#ffffff" text-anchor="middle">27</text>
        <circle cx="165" cy="140" r="5" fill="#fef08a" />
        <text x="165" y="195" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="60" fill="#ffffff" text-anchor="middle">06</text>

        <!-- Bottom Right: HAPPY BIRTHDAY TO ME -->
        <rect x="760" y="1240" width="490" height="295" fill="#be123c" rx="12" />
        <text x="1005" y="1340" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="58" fill="#ffffff" letter-spacing="2" text-anchor="middle">HAPPY</text>
        <text x="1005" y="1410" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="58" fill="#ffffff" letter-spacing="2" text-anchor="middle">BIRTHDAY</text>
        <text x="1005" y="1485" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="46" fill="#fef08a" letter-spacing="4" text-anchor="middle">TO ME ★</text>

        <!-- Stamp header -->
        <rect x="340" y="85" width="600" height="46" fill="#fffdfa" />
        <text x="640" y="118" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="30" fill="#be123c" letter-spacing="4" text-anchor="middle">AIR MAIL · OFFICIAL POSTAGE</text>
      </svg>
    `
  },

  // --- 10: Pastel Vintage Polaroid Moodboard 6-Cut (900x1600) ---
  {
    file: "kbooth-10.png",
    width: 900,
    height: 1600,
    renderSvg: (base64) => `
      <svg width="900" height="1600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="900" height="1600" />
        
        <!-- Center Polaroid Chin: Tilted at -13deg around (510, 1060), sitting exactly on polaroid chin -->
        <g transform="rotate(-13 510 1060)">
          <rect x="330" y="1030" width="360" height="70" fill="#f0eae0" rx="4" />
          <text x="510" y="1075" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="34" fill="#1c1917" letter-spacing="2" text-anchor="middle">HAPPY BIRTHDAY</text>
        </g>

        <!-- Top Header: Memories & Stories -->
        <rect x="150" y="25" width="600" height="60" fill="#ded5c6" rx="8" />
        <text x="450" y="68" font-family="Georgia, serif" font-style="italic" font-weight="900" font-size="40" fill="#451a03" text-anchor="middle">✦ Memories &amp; Stories ✦</text>
      </svg>
    `
  },

  // --- 11: Kraft Scrapbook Collage with Washi Tape (900x1600) ---
  {
    file: "kbooth-11.png",
    width: 900,
    height: 1600,
    renderSvg: (base64) => `
      <svg width="900" height="1600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="900" height="1600" />
        
        <!-- Top Left Paper Scrap: make today amazing (Covering actual scrap at y:45-240) -->
        <rect x="50" y="45" width="345" height="195" fill="#dfd6c8" rx="6" />
        <text x="220" y="120" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="44" fill="#382215" text-anchor="middle">make today</text>
        <text x="220" y="180" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="44" fill="#382215" text-anchor="middle">amazing ★</text>

        <!-- Middle Paper Scrap: Memories that last forever (Covering actual scrap at y:465-650) -->
        <rect x="430" y="465" width="355" height="185" fill="#dcd0bc" rx="6" />
        <text x="605" y="525" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="40" fill="#2d1a0e" text-anchor="middle">Memories</text>
        <text x="605" y="575" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="38" fill="#2d1a0e" text-anchor="middle">that last</text>
        <text x="605" y="625" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="40" fill="#2d1a0e" text-anchor="middle">forever ♡</text>
      </svg>
    `
  },

  // --- 12: Vintage Cinema Ticket Double Strip (1067x1600) ---
  {
    file: "kbooth-12.png",
    width: 1067,
    height: 1600,
    renderSvg: (base64) => `
      <svg width="1067" height="1600" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="1067" height="1600" />
        
        <!-- Left Strip Inner Header Box: Full Coverage y:32 to y:214 -->
        <rect x="30" y="32" width="465" height="182" fill="#f3ead8" />
        <text x="265" y="92" font-family="Georgia, cursive, serif" font-style="italic" font-weight="900" font-size="62" fill="#991b1b" text-anchor="middle">Night Movie</text>
        <line x1="30" y1="115" x2="495" y2="115" stroke="#1c1917" stroke-width="2.5" />
        <line x1="200" y1="115" x2="200" y2="214" stroke="#1c1917" stroke-width="2" />
        <line x1="330" y1="115" x2="330" y2="214" stroke="#1c1917" stroke-width="2" />
        <line x1="30" y1="165" x2="200" y2="165" stroke="#1c1917" stroke-width="2" />
        <line x1="330" y1="165" x2="495" y2="165" stroke="#1c1917" stroke-width="2" />
        <text x="115" y="148" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="20" fill="#1c1917" text-anchor="middle">Sunday, July 23</text>
        <text x="115" y="195" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="22" fill="#991b1b" text-anchor="middle">7:05 PM</text>
        <text x="265" y="182" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="58" fill="#991b1b" text-anchor="middle">13</text>
        <text x="412" y="148" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="21" fill="#1c1917" text-anchor="middle">Seat 6</text>
        <text x="412" y="195" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="21" fill="#1c1917" text-anchor="middle">Row 2</text>

        <!-- Right Strip Inner Header Box: Full Coverage y:32 to y:214 -->
        <rect x="538" y="32" width="465" height="182" fill="#f3ead8" />
        <text x="772" y="92" font-family="Georgia, cursive, serif" font-style="italic" font-weight="900" font-size="62" fill="#991b1b" text-anchor="middle">Night Movie</text>
        <line x1="538" y1="115" x2="1003" y2="115" stroke="#1c1917" stroke-width="2.5" />
        <line x1="708" y1="115" x2="708" y2="214" stroke="#1c1917" stroke-width="2" />
        <line x1="838" y1="115" x2="838" y2="214" stroke="#1c1917" stroke-width="2" />
        <line x1="538" y1="165" x2="708" y2="165" stroke="#1c1917" stroke-width="2" />
        <line x1="838" y1="165" x2="1003" y2="165" stroke="#1c1917" stroke-width="2" />
        <text x="623" y="148" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="20" fill="#1c1917" text-anchor="middle">Sunday, July 23</text>
        <text x="623" y="195" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="22" fill="#991b1b" text-anchor="middle">7:05 PM</text>
        <text x="772" y="182" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="58" fill="#991b1b" text-anchor="middle">12</text>
        <text x="920" y="148" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="21" fill="#1c1917" text-anchor="middle">Seat 6</text>
        <text x="920" y="195" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="21" fill="#1c1917" text-anchor="middle">Row 2</text>
      </svg>
    `
  },

  // --- 13: Cream & Maroon Modern Cinema Photostrip (High-Res 600x1800) ---
  {
    file: "kbooth-13.png",
    width: 600,
    height: 1800,
    renderSvg: (base64) => `
      <svg width="600" height="1800" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="600" height="1800" preserveAspectRatio="none" />
        
        <!-- Header: Photograph -->
        <rect x="70" y="65" width="460" height="260" fill="#faf7f0" rx="16" />
        <text x="300" y="175" font-family="Georgia, serif" font-style="italic" font-weight="900" font-size="78" fill="#42131b" text-anchor="middle">Photograph</text>
        <text x="300" y="255" font-family="'DM Sans', sans-serif" font-weight="900" font-size="42" fill="#f59e0b" letter-spacing="12" text-anchor="middle">★ ★ ★ ★ ★</text>

        <!-- Table: Sunday, 3 May 2047 | 20.00 | Row A | Seat 15 -->
        <rect x="70" y="1515" width="460" height="135" fill="#faf7f0" />
        <rect x="70" y="1515" width="460" height="135" fill="none" stroke="#42131b" stroke-width="3" />
        <line x1="285" y1="1515" x2="285" y2="1650" stroke="#42131b" stroke-width="2.5" />
        <line x1="405" y1="1515" x2="405" y2="1650" stroke="#42131b" stroke-width="2.5" />
        <line x1="70" y1="1565" x2="530" y2="1565" stroke="#42131b" stroke-width="2.5" />

        <text x="178" y="1552" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="20" fill="#42131b" text-anchor="middle">Sunday, 3 May 2047</text>
        <text x="178" y="1622" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="42" fill="#42131b" text-anchor="middle">20.00</text>

        <text x="345" y="1552" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="21" fill="#42131b" text-anchor="middle">Row</text>
        <text x="345" y="1624" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="46" fill="#42131b" text-anchor="middle">A</text>

        <text x="468" y="1552" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="21" fill="#42131b" text-anchor="middle">Seat</text>
        <text x="468" y="1624" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="46" fill="#42131b" text-anchor="middle">15</text>

        <!-- Bottom Caption: Enjoy the moment -->
        <rect x="70" y="1655" width="460" height="95" fill="#faf7f0" />
        <text x="300" y="1722" font-family="Georgia, serif" font-style="italic" font-weight="900" font-size="48" fill="#42131b" text-anchor="middle">Enjoy the moment</text>
      </svg>
    `
  },

  // --- 14: Retro Y2K Blue Denim Browser Windows (High-Res 1200x1800) ---
  {
    file: "kbooth-14.png",
    width: 1200,
    height: 1800,
    renderSvg: (base64) => `
      <svg width="1200" height="1800" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="1200" height="1800" preserveAspectRatio="none" />
        
        <!-- Right Strip Top Banner: BEST FRIENDS -->
        <rect x="700" y="28" width="435" height="58" fill="#1e3a8a" rx="4" />
        <text x="918" y="68" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="38" fill="#fef08a" letter-spacing="4" text-anchor="middle">★ BEST FRIENDS ★</text>

        <!-- Right Strip Bottom Block: Cool -->
        <rect x="700" y="1595" width="440" height="185" fill="#1e3a5f" rx="8" />
        <text x="920" y="1735" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-size="145" fill="#ffffff" letter-spacing="4" text-anchor="middle">Cool</text>
      </svg>
    `
  },

  // --- 15: 70s Retro Groovy Olive & Espresso Twin Strips (High-Res 1200x1800) ---
  {
    file: "kbooth-15.png",
    width: 1200,
    height: 1800,
    renderSvg: (base64) => `
      <svg width="1200" height="1800" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image xlink:href="${base64}" x="0" y="0" width="1200" height="1800" preserveAspectRatio="none" />
        
        <!-- Left Strip Top Banner: Groovy Days -->
        <rect x="18" y="16" width="564" height="234" fill="#4d5d36" rx="10" />
        <text x="300" y="115" font-family="Georgia, serif" font-style="italic" font-weight="900" font-size="82" fill="#fafaf9" text-anchor="middle">Groovy Days</text>
        <text x="300" y="165" font-family="'DM Sans', Arial, sans-serif" font-weight="900" font-size="28" fill="#fde047" letter-spacing="8" text-anchor="middle">⚯ 1970s RETRO ⚯</text>

        <!-- Right Strip Top Banner: GROOVY BABY -->
        <rect x="618" y="16" width="564" height="234" fill="#2d1c15" rx="10" />
        <text x="900" y="105" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-size="84" fill="#fca5a5" letter-spacing="5" text-anchor="middle">GROOVY</text>
        <text x="900" y="180" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-size="78" fill="#fdba74" letter-spacing="8" text-anchor="middle">BABY  ✿</text>

        <!-- Left Strip Footer: Good Friends Good Times -->
        <rect x="18" y="1570" width="564" height="215" fill="#4d5d36" rx="8" />
        <text x="300" y="1660" font-family="Georgia, serif" font-weight="900" font-size="56" fill="#ffffff" text-anchor="middle">Good Friends</text>
        <text x="300" y="1735" font-family="Georgia, serif" font-weight="900" font-size="56" fill="#ffffff" text-anchor="middle">Good Times</text>

        <!-- Right Strip Footer: Good Friends Good Times -->
        <rect x="618" y="1570" width="564" height="215" fill="#2d1c15" rx="8" />
        <text x="900" y="1660" font-family="Georgia, serif" font-weight="900" font-size="56" fill="#ffffff" text-anchor="middle">Good Friends</text>
        <text x="900" y="1735" font-family="Georgia, serif" font-weight="900" font-size="56" fill="#ffffff" text-anchor="middle">Good Times</text>
      </svg>
    `
  }
]

for (const item of enhancements) {
  const base64 = getBase64DataUrl(item.file)
  const svg = item.renderSvg(base64)
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: item.width }
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  // Convert to high-quality JPEG buffer (saving as .png name for compatibility)
  const rawData = pngData.pixels
  const jpegImageData = {
    data: rawData,
    width: item.width,
    height: item.height
  }
  const jpegBuffer = jpeg.encode(jpegImageData, 92).data

  // Save to public/kbooth/
  const destPublic = path.join(publicDir, item.file)
  fs.writeFileSync(destPublic, jpegBuffer)

  // Save to dist/kbooth/ if dist exists
  if (fs.existsSync("dist")) {
    const destDist = path.join(distDir, item.file)
    fs.writeFileSync(destDist, jpegBuffer)
  }

  console.log(`✓ Enhanced ${item.file}: ${item.width}x${item.height} (${jpegBuffer.length} bytes)`)
}

console.log("\nSuccessfully enhanced all 15/15 K-Booth templates with bold, enlarged typography!")
