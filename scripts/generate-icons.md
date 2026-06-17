# PWA Icon Generation

Generate PNG icons from `/public/favicon.svg` at these sizes and place them in `/public/icons/`:

| File | Size | Purpose |
|---|---|---|
| icon-72x72.png | 72×72 | Android legacy |
| icon-96x96.png | 96×96 | Android |
| icon-128x128.png | 128×128 | Chrome Web Store |
| icon-144x144.png | 144×144 | IE / Windows 8 |
| icon-152x152.png | 152×152 | iPad |
| icon-192x192.png | 192×192 | Android home screen (maskable) |
| icon-384x384.png | 384×384 | Android splash |
| icon-512x512.png | 512×512 | PWA install prompt (maskable) |

**Quick generation using sharp (Node.js):**
```bash
npx sharp-cli -i public/favicon.svg -o public/icons/icon-192x192.png resize 192 192
```

Or use https://realfavicongenerator.net with the SVG.

For maskable icons, ensure the logo has ~10% safe-zone padding on all sides.
