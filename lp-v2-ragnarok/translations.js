/**
 * LP v2 — every visible text of the page.
 * index.html only holds keys (data-i18n="..."); script.js fills them from here.
 *
 * To translate to Thai: copy the whole `en` block into `th`, translate the values
 * (keep the keys and the {placeholders} unchanged), then open the page with ?lang=th
 * or set defaultLang: 'th' in config.js. Missing Thai keys fall back to English.
 */
window.I18N = {
  en: {
    'meta.title': 'Ragnarok: The New World — Claim your free Starter Pack',
    'meta.description': 'The first open-world Ragnarok, free on PC. Install on Steam, use the gift code and start with a free Starter Pack.',

    'draft.banner': 'Draft preview — values marked "to fill" must be replaced with real data in config.js before going live.',
    'draft.tag': 'to fill',

    'header.badge': 'Official License · Free-to-Play · Windows PC',
    'brand.name': 'Ragnarok',
    'brand.sub': 'The New World',

    'hero.eyebrow': 'New player reward',
    'hero.title': 'Start Midgard with a free Starter Pack.',
    'hero.sub': 'The first open-world Ragnarok, free on PC. Install on Steam, enter the gift code in-game and gear up from day one.',

    'pack.title': 'Your free Starter Pack',
    'pack.item.vip': 'VIP Pass',
    'pack.item.vip.detail': '{days} days',
    'pack.item.potions': 'Potions',
    'pack.item.potions.detail': 'x{qty}',
    'pack.item.zeny': 'Zeny',
    'pack.item.zeny.detail': '{qty}',
    'pack.item.headgear': 'Exclusive Headgear',
    'pack.item.headgear.detail': '{name}',
    'pack.vip.days': '',
    'pack.potions.qty': '',
    'pack.zeny.qty': '',
    'pack.headgear.name': '',

    'code.label': 'Exclusive gift code',
    'code.copy': 'Copy Code',
    'code.copied': 'Copied!',
    'code.copyFail': 'Select the code and copy it',
    'code.where': 'Enter it in-game after your first login.',

    'cta.main': 'Claim Free Starter Pack & Play',
    'cta.fallback': 'Play Free on Steam',
    'cta.micro': 'Free · Windows PC · Steam · Gravity account created in-game',
    'cta.class': 'Play {class} free',
    'cta.aria': 'Opens the official Steam page in a new tab',

    'urgency.eyebrow': 'Limited-time event',
    'urgency.title': 'The Starter Pack event ends in',
    'urgency.days': 'Days',
    'urgency.hours': 'Hours',
    'urgency.minutes': 'Min',
    'urgency.seconds': 'Sec',
    'urgency.ended': 'This event has ended.',

    'milestone.title': 'Community milestones',
    'milestone.sub': 'More players unlock more rewards for everyone.',
    'milestone.current': '{count} players',
    'milestone.asOf': 'as of {date}',
    'milestone.at': '{count}',
    'milestone.reward1': 'Bonus Potions for all',
    'milestone.reward2': 'Extra Zeny for all',
    'milestone.reward3': 'Rare costume for all',
    'milestone.unlocked': 'Unlocked',
    'milestone.locked': 'Locked',

    'tier.eyebrow': 'Pick your class',
    'tier.title': 'Class tier list',
    'tier.disclaimer': 'Editorial opinion, not an official ranking.',
    'tier.modesLabel': 'Choose a game mode',
    'tier.mode.pvp': 'PvP',
    'tier.mode.mvp': 'MVP',
    'tier.mode.farm': 'Farm',
    'tier.rankLabel': '{mode} rank',
    'class.swordman': 'Swordman',
    'class.swordman.role': 'Tank · Melee',
    'class.mage': 'Mage',
    'class.mage.role': 'Burst · Magic',
    'class.thief': 'Thief',
    'class.thief.role': 'Speed · Critical',
    'class.druid': 'Druid',
    'class.druid.role': 'New · Shapeshifter',

    'proof.eyebrow': 'Join the adventure',
    'proof.title': 'Players are already in Midgard',
    'proof.claimed': 'players claimed the Starter Pack',
    'proof.asOf': 'as of {date}',
    'proof.discord.num': '346,000+',
    'proof.discord': 'about 346,000 members on the official Discord (Nov 2026)',
    'trust.steam': 'Official Steam page',
    'trust.free': 'Free-to-play',
    'trust.pc': 'Windows PC',
    'trust.sea': 'SEA servers',
    'gallery.mvp': 'MVP hunts',
    'gallery.prontera': 'Prontera',
    'gallery.guild': 'Guild wars',
    'alt.hero': 'In-game screenshot: a party of adventurers on an airship',
    'alt.mvp': 'In-game screenshot: a party fighting a giant MVP boss',
    'alt.prontera': 'In-game screenshot: crowds of players in Prontera',
    'alt.guild': 'In-game screenshot: a guild battle in front of a castle',

    'steps.eyebrow': 'How to claim',
    'steps.title': '3 steps to your Starter Pack',
    'steps.1.title': 'Install on Steam',
    'steps.1.text': 'Free download, about 30 GB. Windows PC, 12 GB RAM minimum.',
    'steps.2.title': 'Create your Gravity account',
    'steps.2.text': 'In the game launcher, in addition to Steam.',
    'steps.3.title': 'Enter your gift code',
    'steps.3.text': 'After your first login, redeem the code in-game.',

    'final.title': 'Your Starter Pack is waiting.',
    'final.sub': 'Install free on Steam and claim it on your first login.',

    'footer.iap': 'Free-to-play with optional in-app purchases.',
    'footer.legal': 'Independent, non-official promotional page. Ragnarok and all related trademarks © Gravity Co., Ltd. / Gravity Game Vision Limited.',

    'sticky.text': 'Free Starter Pack',
    'toast.copied': 'Code copied — paste it in-game after your first login.'
  },

  /* Thai — fill in later (same keys as `en`). Empty = English fallback. */
  th: {}
};
