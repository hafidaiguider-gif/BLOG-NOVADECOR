#!/usr/bin/env node
/**
 * wp-publish-draft.js
 *
 * Standalone Node.js script (no npm dependencies, Node >= 18) that publishes
 * SEO articles to a WordPress site as DRAFTS via the core REST API
 * (/wp-json/wp/v2/posts). Written as a self-contained fallback because the
 * full claude-seo skill/agent toolkit could not be cloned into this repo.
 *
 * Usage:
 *   node scripts/wp-publish-draft.js <article.json> [--status draft|pending|publish] [--post-id <id>]
 *
 * Pass --post-id to update an existing post in place (e.g. to fix content
 * after review) instead of creating a new one.
 *
 * Article JSON schema (see content/drafts/*.json for an example):
 *   {
 *     "title": "string",
 *     "slug": "string (optional)",
 *     "excerpt": "string (also used as meta description)",
 *     "metaDescription": "string (optional, defaults to excerpt)",
 *     "focusKeyword": "string (optional, informational only)",
 *     "content": "HTML string with <h2>/<h3> structure",
 *     "categories": ["Category Name", ...] (optional, matched/created by name)
 *     "tags": ["tag", ...] (optional, matched/created by name)
 *     "faq": [{ "question": "...", "answer": "..." }, ...] (optional)
 *   }
 *
 * Credentials are NEVER read from this file or hardcoded. They are resolved,
 * in order, from:
 *   1. Environment variables: WP_SITE_URL, WP_USERNAME, WP_APP_PASSWORD
 *   2. A user-space config file: ~/.config/claude-seo/wordpress.json
 *      (see .gitignore — this path is intentionally outside the repo)
 *      Shape: { "sites": { "<host>": { "url", "username", "app_password" } } }
 *
 * The WordPress "Application Password" must belong to a user with permission
 * to create posts (Author or above) and, if categories/tags need to be
 * created on the fly, to manage terms (Editor/Administrator).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function validateSiteUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    fail(`WP_SITE_URL is not a valid URL: ${rawUrl}`);
  }
  if (url.protocol !== 'https:') {
    fail('WP_SITE_URL must use https://');
  }
  const host = url.hostname.toLowerCase();
  const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
  if (
    blocked.includes(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host)
  ) {
    fail(`Refusing to target a local/private host: ${host}`);
  }
  return url;
}

function loadConfigFile(host) {
  const configPath = path.join(os.homedir(), '.config', 'claude-seo', 'wordpress.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return raw.sites && raw.sites[host] ? raw.sites[host] : null;
  } catch {
    return null;
  }
}

function resolveCredentials() {
  let siteUrl = process.env.WP_SITE_URL;
  let username = process.env.WP_USERNAME;
  let appPassword = process.env.WP_APP_PASSWORD;

  if (!siteUrl || !username || !appPassword) {
    const hostGuess = siteUrl ? new URL(siteUrl).hostname : null;
    const fromConfig = hostGuess ? loadConfigFile(hostGuess) : null;
    if (fromConfig) {
      siteUrl = siteUrl || fromConfig.url;
      username = username || fromConfig.username;
      appPassword = appPassword || fromConfig.app_password;
    }
  }

  if (!siteUrl || !username || !appPassword) {
    fail(
      'Missing WordPress credentials. Set WP_SITE_URL, WP_USERNAME, WP_APP_PASSWORD ' +
        'environment variables, or configure ~/.config/claude-seo/wordpress.json. ' +
        'Never hardcode credentials in files committed to the repo.'
    );
  }

  const url = validateSiteUrl(siteUrl);
  return { siteUrl: url.origin, username, appPassword };
}

function authHeader(username, appPassword) {
  const token = Buffer.from(`${username}:${appPassword}`).toString('base64');
  return `Basic ${token}`;
}

async function wpFetch(siteUrl, authHdr, endpoint, options = {}) {
  const res = await fetch(`${siteUrl}/wp-json/wp/v2/${endpoint}`, {
    ...options,
    headers: {
      Authorization: authHdr,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const detail = json.message || JSON.stringify(json);
    throw new Error(`WordPress API ${res.status} on ${endpoint}: ${detail}`);
  }
  return json;
}

async function resolveTermIds(siteUrl, authHdr, taxonomy, names) {
  if (!names || names.length === 0) return [];
  const ids = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const existing = await wpFetch(
      siteUrl,
      authHdr,
      `${taxonomy}?search=${encodeURIComponent(trimmed)}&per_page=100`
    );
    const match = existing.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (match) {
      ids.push(match.id);
      continue;
    }
    try {
      const created = await wpFetch(siteUrl, authHdr, taxonomy, {
        method: 'POST',
        body: JSON.stringify({ name: trimmed }),
      });
      ids.push(created.id);
    } catch (err) {
      console.warn(`Warning: could not resolve/create ${taxonomy} "${trimmed}": ${err.message}`);
    }
  }
  return ids;
}

function buildFaqBlock(faq) {
  if (!faq || faq.length === 0) return '';

  const html = faq
    .map(
      (item) => `<h3>${escapeHtml(item.question)}</h3>\n<p>${item.answer}</p>`
    )
    .join('\n');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return `\n<h2>Frequently Asked Questions</h2>\n${html}\n<script type="application/ld+json">${JSON.stringify(
    jsonLd
  )}</script>\n`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Converts our semantic HTML (h2/h3/p/ul/blockquote/hr, plus any trailing
// JSON-LD <script> tags) into real Gutenberg blocks, so the article is
// editable as normal paragraphs/headings/quotes in the visual editor
// instead of one opaque Custom HTML blob (see PROMPT_MAITRE.md V1.6).
// Only the JSON-LD <script> tags are wrapped in a single Custom HTML block,
// placed at the very end, isolated from the rest of the content.
function toGutenbergBlocks(html) {
  const scripts = [];
  const withoutScripts = html.replace(
    /<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/g,
    (m) => {
      scripts.push(m);
      return '';
    }
  );

  const blocks = [];
  const blockRe =
    /<h2([^>]*)>([\s\S]*?)<\/h2>|<h3([^>]*)>([\s\S]*?)<\/h3>|<blockquote><p>([\s\S]*?)<\/p><\/blockquote>|<ul>([\s\S]*?)<\/ul>|<p>([\s\S]*?)<\/p>|<hr\s*\/?>/g;
  let match;
  while ((match = blockRe.exec(withoutScripts)) !== null) {
    if (match[2] !== undefined) {
      const idMatch = (match[1] || '').match(/id="([^"]*)"/);
      const anchor = idMatch ? idMatch[1] : null;
      const attrs = anchor ? ` {"anchor":"${anchor}"}` : '';
      const idAttr = anchor ? ` id="${anchor}"` : '';
      blocks.push(
        `<!-- wp:heading${attrs} -->\n<h2 class="wp-block-heading"${idAttr}>${match[2]}</h2>\n<!-- /wp:heading -->`
      );
    } else if (match[4] !== undefined) {
      blocks.push(
        `<!-- wp:heading {"level":3} -->\n<h3 class="wp-block-heading">${match[4]}</h3>\n<!-- /wp:heading -->`
      );
    } else if (match[5] !== undefined) {
      blocks.push(
        `<!-- wp:quote -->\n<blockquote class="wp-block-quote"><p>${match[5]}</p></blockquote>\n<!-- /wp:quote -->`
      );
    } else if (match[6] !== undefined) {
      blocks.push(`<!-- wp:list -->\n<ul class="wp-block-list">${match[6]}</ul>\n<!-- /wp:list -->`);
    } else if (match[7] !== undefined) {
      blocks.push(`<!-- wp:paragraph -->\n<p>${match[7]}</p>\n<!-- /wp:paragraph -->`);
    } else {
      blocks.push(
        '<!-- wp:separator -->\n<hr class="wp-block-separator has-alpha-channel-opacity"/>\n<!-- /wp:separator -->'
      );
    }
  }

  if (scripts.length) {
    blocks.push(`<!-- wp:html -->\n${scripts.join('\n')}\n<!-- /wp:html -->`);
  }

  return blocks.join('\n\n');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0].startsWith('--')) {
    fail(
      'Usage: node scripts/wp-publish-draft.js <article.json> [--status draft|pending|publish] [--post-id <id>]'
    );
  }
  const articlePath = path.resolve(args[0]);
  const statusFlagIndex = args.indexOf('--status');
  const status = statusFlagIndex !== -1 ? args[statusFlagIndex + 1] : 'draft';
  if (!['draft', 'pending', 'publish'].includes(status)) {
    fail(`Invalid --status "${status}". Use draft, pending, or publish.`);
  }
  const postIdFlagIndex = args.indexOf('--post-id');
  const updatePostId = postIdFlagIndex !== -1 ? args[postIdFlagIndex + 1] : null;
  if (postIdFlagIndex !== -1 && !/^\d+$/.test(updatePostId || '')) {
    fail('--post-id must be a numeric WordPress post ID.');
  }

  if (!fs.existsSync(articlePath)) {
    fail(`Article file not found: ${articlePath}`);
  }
  const article = JSON.parse(fs.readFileSync(articlePath, 'utf8'));
  if (!article.title || !article.content) {
    fail('Article JSON must include at least "title" and "content".');
  }

  const { siteUrl, username, appPassword } = resolveCredentials();
  const authHdr = authHeader(username, appPassword);

  console.log(`Site: ${siteUrl}`);
  console.log(`Status: ${status}`);
  console.log(`Title: ${article.title}`);

  const categoryIds = await resolveTermIds(siteUrl, authHdr, 'categories', article.categories);
  const tagIds = await resolveTermIds(siteUrl, authHdr, 'tags', article.tags);

  const metaDescription = article.metaDescription || article.excerpt || '';
  const fullContent = toGutenbergBlocks(article.content + buildFaqBlock(article.faq));

  const payload = {
    title: article.title,
    content: fullContent,
    status,
    excerpt: article.excerpt || '',
    ...(article.slug ? { slug: article.slug } : {}),
    ...(categoryIds.length ? { categories: categoryIds } : {}),
    ...(tagIds.length ? { tags: tagIds } : {}),
    meta: {
      // Best-effort: only applied if the active SEO plugin registers these
      // meta keys with show_in_rest. Silently ignored otherwise.
      _yoast_wpseo_metadesc: metaDescription,
      _yoast_wpseo_focuskw: article.focusKeyword || '',
      rank_math_title: article.metaTitle || '',
      rank_math_description: metaDescription,
      rank_math_focus_keyword: article.focusKeyword || '',
    },
  };

  const endpoint = updatePostId ? `posts/${updatePostId}` : 'posts';
  const result = await wpFetch(siteUrl, authHdr, endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  console.log(updatePostId ? '\nDraft updated successfully.' : '\nDraft created successfully.');
  console.log(`Post ID: ${result.id}`);
  console.log(`Edit link: ${siteUrl}/wp-admin/post.php?post=${result.id}&action=edit`);
  if (result.link) console.log(`Preview link: ${result.link}`);
}

main().catch((err) => fail(err.message));
