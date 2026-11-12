# Assets — real in-game media only

All files are referenced by `index.html` with flat relative paths (`assets/<name>`).
To swap a visual, **overwrite the file with the same name, format and pixel size**.
No code change is needed. Every image/video sits in a 16:9 frame with
`object-fit: cover`, so other 16:9 captures fit without distortion.

The current files are official media from the game's Steam store page
(https://store.steampowered.com/app/4212480/Ragnarok_The_New_World/),
converted to WebP. Screenshots and trailer © Gravity Game Vision Limited.

| File | Exact size | Used in | Current content |
|---|---|---|---|
| `hero-bg.webp` | 1920 × 1080 | Hero background | Party on the airship |
| `feature-classes.webp` | 1280 × 720 | Section 3, large bento card | Class / outfit line-up |
| `feature-mvp.webp` | 1280 × 720 | Section 3, "MVP hunts" | Party vs. MVP boss |
| `feature-prontera.webp` | 1280 × 720 | Section 3, "Prontera" | Crowd in Prontera |
| `feature-mount.webp` | 1280 × 720 | Section 3, "Open world" | Climbing / swimming / floating (swap for an MVP-mount capture if available) |
| `feature-offline.webp` | 1280 × 720 | Section 4 | Auto-hunting Porings |
| `feature-guild.webp` | 1280 × 720 | Section 5 | Guild occupation battle |
| `video-poster.webp` | 1920 × 1080 | Section 6, before Play | Frame from the official trailer |
| `gameplay-trailer.mp4` | 1280 × 720, H.264 + AAC, 1:56, `+faststart` | Section 6 player | Official Steam trailer |

## If a file is missing

The page never shows a broken-image icon: `script.js` catches the error and the
frame turns into a dark "cinema" placeholder labelled *Official in-game visual*.

## Video notes

- Loaded only on Play (`preload="none"`), never autoplays with sound.
- Chapter buttons use `data-time` (seconds) in `index.html`: 0 (Open World),
  12 (MVP Combat), 80 (Classes & Looks). Update them if you change the video.
- Captions: WebVTT cues in the `<script type="text/vtt" id="captions-en">`
  block of `index.html` (scene descriptions for now; paste official subtitles there).
- "Real in-game footage" note: set `data-footage-note="real"` on the video section
  only if the file is 100 % in-game capture.

## Logo

The header uses a text wordmark. To use the official logo, add `assets/logo.webp`
(about 480 × 160, transparent) and put an `<img>` in the header where the comment says.

## Testimonials (section 9)

Add only real, dated, sourced quotes to the JSON block `#testimonials-data` in
`index.html`: `[{ "quote": "…", "author": "Name, PH", "date": "2026-11-05", "source": "https://…" }]`.
The block stays hidden while the list is empty.
