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
| `images/trailer_ragnarok_2026_30s-poster.webp` | 1280 × 720 | Section 6, before Play | Frame of the party charge (official trailer) |
| `images/trailer_ragnarok_2026_30s.mp4` | 1280 × 720, H.264 + AAC, **30.0 s**, 4.2 MB, `+faststart` | Section 6 player | 30 s action cut of the official Steam trailer |

## If a file is missing

The page never shows a broken-image icon: `script.js` catches the error and the
frame turns into a dark "cinema" placeholder labelled *Official in-game visual*.

## Video notes

- Loaded only on Play (`preload="none"`), never autoplays with sound.
- The 30 s cut uses 12 shots of the official trailer: balloon over Midgard (0:00),
  MVP bosses (0:03), skills and magic (0:11), party charge (0:23), title card (0:27).
  On the title card, the trailer's outdated mobile "pre-order / pre-register" badges
  are covered by a "Play free on Steam · Windows PC" box.
- Chapter buttons use `data-time` (seconds) in `index.html`: 0, 3, 11.2. Update them if you change the video.
- If the file is missing or the player is blocked, a "Watch the trailer on Steam" button
  appears in the player (exact Steam URL, no UTM).
- Captions: WebVTT cues in the `<script type="text/vtt" id="captions-en">` block of
  `index.html`, timed to the 30 s cut (the three quoted lines are the trailer's own; the rest describes the scenes).
- "Real in-game footage" note: set `data-footage-note="real"` on the video section
  only if the file is 100 % in-game capture.

## Logo

The header uses a text wordmark. To use the official logo, add `assets/logo.webp`
(about 480 × 160, transparent) and put an `<img>` in the header where the comment says.

## Testimonials (section 9)

Add only real, dated, sourced quotes to the JSON block `#testimonials-data` in
`index.html`: `[{ "quote": "…", "author": "Name, PH", "date": "2026-11-05", "source": "https://…" }]`.
The block stays hidden while the list is empty.
