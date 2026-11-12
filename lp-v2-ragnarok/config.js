/**
 * LP v2 — settings (no visible text here: all copy lives in translations.js).
 *
 * MODE
 *   'draft' : team review. A "Draft" banner shows, and every missing value is
 *             displayed as a highlighted "to fill" tag so nothing is forgotten.
 *   'live'  : Ads traffic. Any block whose data is missing (null / '') is hidden
 *             automatically, so no fake code, date or number can go online.
 *
 * Fill every `null` / '' below with REAL, verifiable data before switching to 'live'.
 */
window.LP_CONFIG = {
  mode: 'draft',

  // Default language; override with ?lang=th (translations.js must contain the key).
  defaultLang: 'en',

  // Exact Steam URL. Do NOT add UTM or any parameter.
  steamUrl: 'https://store.steampowered.com/app/4212480/Ragnarok_The_New_World/',

  /* ---------- Starter pack & gift code ---------- */
  starterPack: {
    // The real, active gift code, e.g. 'RTNW-XXXX-XXXX'. Empty = code block hidden in live mode.
    code: '',
    // Optional official item images (WebP, 400x400, transparent or dark bg), e.g. 'assets/item-vip-pass.webp'.
    // Empty = a minimal UI icon is shown instead (no broken image).
    items: [
      { id: 'vip', image: '' },
      { id: 'potions', image: '' },
      { id: 'zeny', image: '' },
      { id: 'headgear', image: '' }
    ]
  },

  /* ---------- Event countdown ---------- */
  // Real end of the event, ISO 8601 WITH timezone offset, e.g. '2026-12-15T23:59:00+07:00' (Bangkok).
  // Empty = countdown hidden in live mode. Past date = countdown hidden automatically.
  eventEnd: '',

  /* ---------- Milestone bar ---------- */
  // Real current figure and the date it was measured, e.g. 18450 and '2026-11-12'.
  milestoneCurrent: null,
  milestoneAsOf: '',
  // Real thresholds. Reward names are in translations.js (milestone.reward1..3).
  milestones: [
    { at: null, rewardKey: 'milestone.reward1' },
    { at: null, rewardKey: 'milestone.reward2' },
    { at: null, rewardKey: 'milestone.reward3' }
  ],

  /* ---------- Social proof ---------- */
  // Real number of players who claimed the pack, and the date. Shown as a fixed number (no fake live ticker).
  claimedCount: null,
  claimedAsOf: '',

  /* ---------- Class tier list ---------- */
  // Classes confirmed on the Steam page. Ranks per mode: 'S+', 'S', 'A', 'B' or null (= to fill).
  // Labelled on the page as an editorial opinion (tier.disclaimer in translations.js).
  tierList: [
    { id: 'swordman', ranks: { pvp: null, mvp: null, farm: null } },
    { id: 'mage',     ranks: { pvp: null, mvp: null, farm: null } },
    { id: 'thief',    ranks: { pvp: null, mvp: null, farm: null } },
    { id: 'druid',    ranks: { pvp: null, mvp: null, farm: null } }
  ]
};
