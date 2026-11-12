# LP v2 — how to finish it

## 1. Texts (English now, Thai later) → `translations.js`
Every visible text is a key in `window.I18N.en`. To translate:
copy the `en` block into `th`, translate the values (keep keys and `{placeholders}`),
then open the page with `?lang=th` (or set `defaultLang: 'th'` in `config.js`).
Missing Thai keys automatically fall back to English.

Starter-pack quantities are texts too (so they can be localized):
`pack.vip.days`, `pack.potions.qty`, `pack.zeny.qty`, `pack.headgear.name`.

## 2. Real data → `config.js`
| Setting | Example | If empty |
|---|---|---|
| `starterPack.code` | `'RTNW-XXXX-XXXX'` (the real, active code) | live: whole Starter Pack block hidden, CTA becomes "Play Free on Steam" |
| `eventEnd` | `'2026-12-15T23:59:00+07:00'` (with timezone) | live: countdown hidden (also hidden once the date is past) |
| `milestoneCurrent` / `milestoneAsOf` / `milestones[].at` | `18450`, `'2026-11-12'`, `10000 / 20000 / 30000` | live: milestone bar hidden |
| `claimedCount` / `claimedAsOf` | `12400`, `'2026-11-12'` | live: counter hidden |
| `tierList[].ranks` | `{ pvp: 'S+', mvp: 'S', farm: 'A' }` | live: ranks and tabs hidden, class cards + CTAs stay |

`mode: 'draft'` shows a yellow banner and "to fill" tags (team review).
Switch to `mode: 'live'` before sending Ads traffic.

## 3. Images (in this folder)
| File | Size | Use |
|---|---|---|
| `hero-bg.webp` | 1920 × 1080 | Hero background (real Steam screenshot) |
| `feature-mvp.webp`, `feature-prontera.webp`, `feature-guild.webp` | 1280 × 720 | Gallery |
| `item-vip-pass.webp`, `item-potions.webp`, `item-zeny.webp`, `item-headgear.webp` | 400 × 400 | Optional official item art: add the file, then set its path in `config.js` → `starterPack.items[].image`. Until then a minimal icon is shown. |

The Steam URL is fixed in `index.html` and `config.js`:
`https://store.steampowered.com/app/4212480/Ragnarok_The_New_World/` (no parameters).
