# Assets — how to finalize the media package

Every file below is already referenced by `index.html`. To swap in the official
visuals, **overwrite the file with the same name, same format and same pixel size**.
No code change is needed.

The images currently in `images/` are **original placeholder illustrations**
(not official art). The trailer and its poster come from the game's official
Steam store page.

## Images (WebP, sRGB, quality 80–85)

| File | Size (px) | Ratio | Used in | What to put there |
|---|---|---|---|---|
| `images/hero-keyart.webp` | 1920 × 1080 | 16:9 | Hero background | Official PC key art, widescreen. Keep the left 45 % calm (headline sits there). |
| `images/og-image.webp` | 1200 × 630 | 1.91:1 | Social share preview | Key art + logo. Many networks prefer PNG/JPG: export `og-image.jpg` too if needed and update the `og:image` meta. |
| `images/bento-classes-druid.webp` | 1200 × 900 | 4:3 | Bento card "8 classes" (large) | Class line-up with the Druid in front. |
| `images/bento-mvp-mount.webp` | 800 × 600 | 4:3 | Bento card "MVP mounts" | A player riding a tamed MVP. |
| `images/bento-prontera.webp` | 800 × 600 | 4:3 | Bento card "Prontera" | Prontera plaza / castle. |
| `images/bento-trade-stalls.webp` | 800 × 600 | 4:3 | Bento card "Trade stalls" | Player vending stalls. |
| `images/bento-wedding.webp` | 800 × 600 | 4:3 | Bento card "Weddings" | Wedding ceremony. |
| `images/bento-costumes.webp` | 800 × 600 | 4:3 | Bento card "Costumes" | Costume / dye showcase. |
| `images/busy-cross-progression.webp` | 1200 × 750 | 16:10 | Section 4 | PC + mobile showing the same character (or offline-hunting screen). |
| `images/guild-party.webp` | 1200 × 750 | 16:10 | Section 5 | Guild war or party dungeon screenshot. |

## Video

| File | Spec | Notes |
|---|---|---|
| `gameplay-trailer.mp4` | H.264 High, AAC, 1280×720 (or 1920×1080), `+faststart`, ideally ≤ 15 MB | Loaded only when the visitor presses Play (`preload="none"`), never autoplays with sound. |
| `video-poster.webp` | 1920 × 1080 | First frame shown before Play. |

**Captions:** the WebVTT cues live in the `<script type="text/vtt" id="captions-en">`
block of `index.html` (inline so they also work when the page is opened from disk).
They are scene descriptions for now: paste the official English subtitles there
(same WebVTT format). The **CC** button toggles them.

If you replace the video, update the chapter start times in `index.html`
(`data-time` on the three chapter buttons: Open World, MVP Combat, Classes).

The "Real in-game footage" note is controlled by `data-footage-note` on the
video section: switch it to `real` only if the new file is 100 % in-game capture.

## Icons (SVG, keep as is)

`icons/logo.svg` is an original emblem. If the client supplies the official
logo, add it as `icons/logo-official.svg` (or `.webp`, ~ 480 × 160) and update the
two `<img>` tags marked `<!-- LOGO -->` in `index.html`.

## Testimonials (section 9)

Only add **real, dated quotes with a public source**. Edit the JSON block
`<script type="application/json" id="testimonials-data">` in `index.html`:

```json
[
  { "quote": "…", "author": "Name, PH", "date": "2026-11-05", "source": "https://…" }
]
```

The block stays hidden while the list is empty.
