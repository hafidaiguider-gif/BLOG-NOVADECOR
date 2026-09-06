#!/usr/bin/env node
/**
 * Publish a WordPress post as a draft via the REST API.
 *
 * Credentials are never hardcoded here. They are read, in order of priority, from:
 *   1. Environment variables: WP_URL, WP_USERNAME, WP_APP_PASSWORD
 *   2. A local config file at ~/.config/claude-seo/wordpress.json:
 *      { "url": "...", "username": "...", "appPassword": "..." }
 *
 * Usage:
 *   node publish_draft.js "Article title" "Article content"
 *   node publish_draft.js "Article title" ./content.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

function loadConfig() {
  if (process.env.WP_URL && process.env.WP_USERNAME && process.env.WP_APP_PASSWORD) {
    return {
      url: process.env.WP_URL,
      username: process.env.WP_USERNAME,
      appPassword: process.env.WP_APP_PASSWORD,
    };
  }

  const configPath = path.join(os.homedir(), '.config', 'claude-seo', 'wordpress.json');
  if (fs.existsSync(configPath)) {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (raw.url && raw.username && raw.appPassword) {
      return raw;
    }
  }

  throw new Error(
    'No WordPress credentials found. Set WP_URL / WP_USERNAME / WP_APP_PASSWORD env vars, ' +
    'or create ~/.config/claude-seo/wordpress.json with { "url", "username", "appPassword" }.'
  );
}

async function publishDraft(title, content) {
  const { url, username, appPassword } = loadConfig();
  const endpoint = new URL('/wp-json/wp/v2/posts', url).toString();
  const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({ title, content, status: 'draft' }),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(`WordPress API error (${res.status}): ${JSON.stringify(body)}`);
  }

  return body;
}

async function main() {
  const [title, contentArg] = process.argv.slice(2);
  if (!title || !contentArg) {
    console.error('Usage: node publish_draft.js "Title" "Content or path/to/content.md"');
    process.exit(1);
  }

  const content = fs.existsSync(contentArg) ? fs.readFileSync(contentArg, 'utf8') : contentArg;

  const post = await publishDraft(title, content);
  console.log(`Draft created: id=${post.id}, status=${post.status}, edit link=${post.link}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
