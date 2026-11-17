# Ragnarok: The New World — Landing page (TAF 2, Groupe 109)

Single goal: **first login in the game** after installing via Steam.
CTA URL (exact, no parameter, never modified by JS):
`https://store.steampowered.com/app/4212480/Ragnarok_The_New_World/`

```
index.html          Thai page (GEO 1, lang="th") — TO REVIEW BY A NATIVE THAI SPEAKER
en.html             English fallback (Philippines, GEO 2), same structure and CTA
style.css           Midgard palette (key-art sky, logo gold, parchment, Poring pink)
script.js           A/B 50/50, events, sticky CTA, lightbox, FAQ, video, relay
assets/img/         official Steam screenshots (WebP)
assets/video/       0:47 teaser (MP4 + WebM), poster, subtitles (th, en)
copy-source-fr.md   full French source text for the Thai reviewer
ragnarok-lp.zip     package to import in AFBooster (index.html at the zip root)
```

## 1. Replacing images and video

All media are **real official visuals** from the game's Steam page
(https://store.steampowered.com/app/4212480/Ragnarok_The_New_World/), © Gravity.
To swap one, overwrite the file with the **same name, format and size**.

| File | Size | Where |
|---|---|---|
| `img/hero-keyart.webp` + `img/hero-keyart-960.webp` | 1920×1080 / 960×540 | Hero, variant A |
| `img/hero-offline.webp` + `img/hero-offline-960.webp` | 1920×1080 / 960×540 | Hero, variant B (auto-hunting Porings) |
| `img/gallery-prontera.webp` (+ `-640`) | 1280×720 (640×360) | Gallery |
| `img/gallery-mvp-mount.webp` (+ `-640`) | 1280×720 (640×360) | Gallery — currently an MVP fight (no MVP-mount screenshot on Steam) |
| `img/gallery-classes.webp` (+ `-640`) | 1280×720 (640×360) | Gallery + section 5 (guild war) |
| `img/gallery-wedding.webp` (+ `-640`) | 1280×720 (640×360) | Gallery |
| `img/gallery-costumes.webp` (+ `-640`) | 1280×720 (640×360) | Gallery |
| `img/gallery-open-world.webp` (+ `-640`) | 1280×720 (640×360) | Gallery |
| `img/og-image.webp` | 1200×630 | Social preview (set an **absolute** URL in `og:image` once published) |
| `video/teaser-50s.mp4` / `.webm` | 960×540, 0:47, < 4 MB | Section 6 |
| `video/teaser-poster.webp` | 960×540 | Video poster |
| `video/teaser-th.vtt` / `teaser-en.vtt` | WebVTT | Subtitles (th default on `index.html`) |

The teaser is the official trailer cut at **0:47** (the next line starts at 0:48 and
would be cut mid-sentence at 0:50), H.264 `veryfast` + VP9. The trailer has English
lines burned in; the Thai track sits at the top of the frame so both stay readable.
A creator video can replace it only **with a written agreement**.

## 2. To validate by the client before publishing

Marked in the HTML with `data-validate="…"` (search for it):

- [ ] `achats-integres` — "optional in-app purchases" (FAQ 1 + footer)
- [ ] Monetisation and automation wording (FAQ 1 and 3, section 4 note) — never "no pay-to-win"
- [ ] `latence` — "servers close to you, lower ping" (section 5)
- [ ] `duree-etape-1..4` — step durations (≈10 s, depends on connection, ≈2 min, ≈3 min)
- [ ] `classification` — age rating. Steam lists USK 12 (DE) and 14 (BR), fantasy violence; **no Thai or PH rating** published
- [ ] `discord-date` — ≈346,000 members and the date of the count
- [ ] `createurs` — Junqko, Shipdont (TH) / Myrtle Sarrosa, Nikkinikki (PH): block is **hidden** until a written agreement exists (remove `hidden`)
- [ ] Player reviews: none shown; add only authorised, dated quotes
- [ ] Release date: the brief says 26 July 2026, Steam's API says 27 Jul 2026 (time zone?). The page says "July 2026"
- [ ] Gift code: none on the page (add only if the client provides one)
- [ ] **Native Thai proofreading** of `index.html` and `assets/video/teaser-th.vtt` (register "เรา", informal but respectful), using `copy-source-fr.md`

## 3. AFBooster

1. Affiliate account for the class on **afbooster.com** — in "Motivation", write the
   exact class name and the programme **The Stage**.
2. **Landing Pages** → import `ragnarok-lp.zip` (`index.html` is at the root of the zip).
3. Publish, then open the published page and check the attribution (a click on the CTA
   must reach the exact Steam URL; AFBooster adds its own tracking, the page adds nothing).
4. The challenge conversion is the **first login**, reported server-side by the client
   (postback with the campaign id). CTA clicks and relay clicks are **not** conversions.

## 4. Test plan (recette)

- [ ] Published URL opened in private browsing on **mobile** and **PC**
- [ ] No missing file (404), no JS error in the console, no horizontal scroll (360 / 768 / 1280 / 1920 px)
- [ ] Every CTA opens the exact Steam URL in a new tab
- [ ] `?v=a` and `?v=b` show each hero; a new visitor gets a random, remembered variant
- [ ] FAQ with the keyboard (Tab, Enter/Space, arrows), gallery (Enter, ←/→, Escape)
- [ ] Video: starts muted when visible, Thai subtitles, no autoplay with "reduce motion"
- [ ] Relay: link keeps the campaign parameters and adds `relais=1`
- [ ] PageSpeed Insights / Lighthouse (mobile) ≥ 90 on Performance, Accessibility,
      Best practices, SEO — run it on the **hosted** URL, fix, re-test
- [ ] URL stays online during the whole evaluation

## 5. Events (window.dataLayer, else console.debug)

`page_view` (variant) · `cta_click` (section, variant) · `scroll_faq` · `video_play` ·
`faq_open` · `relay_click` (method). None of them is the conversion.
