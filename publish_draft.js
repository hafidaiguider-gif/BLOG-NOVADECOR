#!/usr/bin/env node
/**
 * publish_draft.js
 *
 * Publishes a Markdown article (with YAML front matter) to WordPress as a
 * Draft post via the WP REST API, attributed to a specific author.
 *
 * Usage:
 *   node publish_draft.js <path-to-article.md> [--site https://example.com] [--author "Juliana MILLER"]
 *
 * Auth:
 *   By default the script sends anonymous requests and relies on the
 *   environment's HTTP layer to inject WordPress credentials (e.g. an
 *   authenticated proxy connection scoped to the target host).
 *
 *   To authenticate directly instead (e.g. running outside that
 *   environment), set these env vars and the script will send Basic Auth
 *   using a WordPress Application Password:
 *     WP_USERNAME=admin
 *     WP_APP_PASSWORD="xxxx xxxx xxxx xxxx xxxx xxxx"
 *
 *   Never hardcode credentials in this file or commit them to the repo.
 */

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--site") args.site = argv[++i];
    else if (a === "--author") args.author = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else args._.push(a);
  }
  return args;
}

function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const [, frontMatter, body] = match;
  const meta = {};
  for (const line of frontMatter.split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let value = kv[2].trim();

    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, "");
    }
    meta[key] = value;
  }
  return { meta, body: body.trim() };
}

// Minimal Markdown -> HTML conversion, sufficient for the structured
// articles this toolkit generates (headings, lists, bold/italic, links,
// paragraphs). Not a general-purpose Markdown parser.
function markdownToHtml(md) {
  const lines = md.split(/\r?\n/);
  const html = [];
  let listBuffer = [];
  let listType = null;

  const flushList = () => {
    if (!listBuffer.length) return;
    const tag = listType === "ol" ? "ol" : "ul";
    html.push(`<${tag}>`);
    for (const item of listBuffer) html.push(`<li>${inline(item)}</li>`);
    html.push(`</${tag}>`);
    listBuffer = [];
    listType = null;
  };

  const inline = (text) =>
    text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.*)$/);
    const unordered = line.match(/^[-*]\s+(.*)$/);
    if (ordered) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listBuffer.push(ordered[1]);
      continue;
    }
    if (unordered) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listBuffer.push(unordered[1]);
      continue;
    }

    flushList();
    html.push(`<p>${inline(line)}</p>`);
  }
  flushList();
  return html.join("\n");
}

async function wpFetch(siteUrl, endpoint, options = {}) {
  const url = `${siteUrl.replace(/\/$/, "")}/wp-json/wp/v2/${endpoint}`;
  const headers = { "Content-Type": "application/json", ...options.headers };

  const { WP_USERNAME, WP_APP_PASSWORD } = process.env;
  if (WP_USERNAME && WP_APP_PASSWORD) {
    const token = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString("base64");
    headers.Authorization = `Basic ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) {
    const detail = typeof body === "object" ? JSON.stringify(body) : body;
    throw new Error(`WordPress API ${res.status} on ${endpoint}: ${detail}`);
  }
  return body;
}

async function findAuthorId(siteUrl, authorName) {
  const users = await wpFetch(siteUrl, `users?search=${encodeURIComponent(authorName)}`);
  const match = users.find((u) => u.name.toLowerCase() === authorName.toLowerCase()) || users[0];
  if (!match) throw new Error(`No WordPress user found matching "${authorName}"`);
  return match.id;
}

async function findCategoryId(siteUrl, slugOrName) {
  if (!slugOrName) return null;
  const categories = await wpFetch(
    siteUrl,
    `categories?search=${encodeURIComponent(slugOrName)}&per_page=50`
  );
  const match =
    categories.find((c) => c.slug === slugOrName) ||
    categories.find((c) => c.name.toLowerCase() === slugOrName.toLowerCase());
  return match ? match.id : null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = args._[0];
  if (!filePath) {
    console.error("Usage: node publish_draft.js <path-to-article.md> [--site https://example.com] [--author \"Name\"]");
    process.exit(1);
  }

  const raw = fs.readFileSync(path.resolve(filePath), "utf8");
  const { meta, body } = parseFrontMatter(raw);

  const siteUrl = args.site || meta.site || "https://novadecorusa.com";
  const authorName = args.author || meta.author;
  if (!authorName) {
    console.error("No author specified (use --author or a front-matter 'author' field).");
    process.exit(1);
  }

  const title = meta.title || path.basename(filePath, ".md");
  const excerpt = meta.excerpt || "";
  const slug = meta.slug || undefined;
  const contentHtml = markdownToHtml(body.replace(/^#\s+.*\n/, "").trim());

  console.log(`Site:     ${siteUrl}`);
  console.log(`Title:    ${title}`);
  console.log(`Author:   ${authorName}`);
  console.log(`Category: ${meta.category || "(none)"}`);
  console.log(`Status:   draft`);

  const authorId = await findAuthorId(siteUrl, authorName);
  const categoryId = await findCategoryId(siteUrl, meta.category);

  const payload = {
    title,
    content: contentHtml,
    excerpt,
    status: "draft",
    author: authorId,
  };
  if (slug) payload.slug = slug;
  if (categoryId) payload.categories = [categoryId];
  if (Array.isArray(meta.tags) && meta.tags.length) {
    // WordPress tags require term IDs; resolving/creating tags by name is
    // left out of this minimal script to avoid unintended taxonomy writes.
    console.log(`Tags (not sent, resolve term IDs first): ${meta.tags.join(", ")}`);
  }

  if (args.dryRun) {
    console.log("\n--dry-run set, not sending request. Payload:");
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const post = await wpFetch(siteUrl, "posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log(`\nDraft created: id=${post.id}`);
  console.log(`Edit link: ${siteUrl.replace(/\/$/, "")}/wp-admin/post.php?post=${post.id}&action=edit`);
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
});
