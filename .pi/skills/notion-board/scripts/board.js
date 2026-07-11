#!/usr/bin/env node
// Notion kanban board CLI for the Hüseyin Ajuz CRM project board.
// Zero deps — uses global fetch (Node 18+). Token: NOTION_API_KEY env or ~/.secrets.

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DATABASE_ID = "8b4eb459-1241-8394-8bba-81715aee14b6";
const STATUSES = ["Not started", "In development", "Testing", "Reviewing", "Done"];
const TEAMS = ["Engineering", "Design"];
const API = "https://api.notion.com/v1";

function getToken() {
  if (process.env.NOTION_API_KEY) return process.env.NOTION_API_KEY;
  try {
    const secrets = readFileSync(join(homedir(), ".secrets"), "utf8");
    const m = secrets.match(/NOTION_API_KEY="?([^"\n]+)"?/);
    if (m) return m[1];
  } catch {
    /* fall through */
  }
  fail("NOTION_API_KEY not found in env or ~/.secrets");
}

function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) fail(`${res.status} ${json.code}: ${json.message}`);
  return json;
}

const rt = (text) => [{ type: "text", text: { content: text } }];
const titleOf = (page) => page.properties.Name.title.map((t) => t.plain_text).join("") || "(untitled)";
const statusOf = (page) => page.properties.Status.status?.name ?? "?";

async function queryAll() {
  const pages = [];
  let cursor;
  do {
    const res = await api("POST", `/databases/${DATABASE_ID}/query`, {
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

async function findCard(query) {
  const pages = await queryAll();
  const q = query.toLowerCase();
  const matches = pages.filter((p) => titleOf(p).toLowerCase().includes(q));
  if (matches.length === 0) fail(`no card matches "${query}"`);
  if (matches.length > 1)
    fail(`ambiguous "${query}" — matches: ${matches.map(titleOf).join(" | ")}`);
  return matches[0];
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) args[argv[i].slice(2)] = argv[++i] ?? "";
    else args._.push(argv[i]);
  }
  return args;
}

function validateStatus(status) {
  if (!STATUSES.includes(status))
    fail(`invalid status "${status}" — use one of: ${STATUSES.join(" | ")}`);
}

async function cmdList(args) {
  const pages = await queryAll();
  const byStatus = new Map(STATUSES.map((s) => [s, []]));
  for (const p of pages) {
    const s = statusOf(p);
    if (!byStatus.has(s)) byStatus.set(s, []);
    byStatus.get(s).push(p);
  }
  for (const [status, cards] of byStatus) {
    if (args.status && args.status !== status) continue;
    console.log(`== ${status} (${cards.length}) ==`);
    for (const c of cards) {
      const kw = c.properties["AI keywords"].multi_select.map((k) => k.name).join(", ");
      console.log(`  - ${titleOf(c)}${kw ? `  [${kw}]` : ""}`);
    }
  }
}

async function cmdShow(args) {
  const [query] = args._;
  if (!query) fail("usage: board.js show <name-query>");
  const card = await findCard(query);
  const props = card.properties;
  console.log(`Title:    ${titleOf(card)}`);
  console.log(`Status:   ${statusOf(card)}`);
  console.log(`Team:     ${props.Team.select?.name ?? "—"}`);
  console.log(`Keywords: ${props["AI keywords"].multi_select.map((k) => k.name).join(", ") || "—"}`);
  console.log(`URL:      ${card.url}`);
  console.log("--- body ---");
  const blocks = await api("GET", `/blocks/${card.id}/children?page_size=100`);
  for (const b of blocks.results) {
    const content = b[b.type]?.rich_text?.map((t) => t.plain_text).join("") ?? "";
    const prefix =
      b.type === "to_do" ? (b.to_do.checked ? "[x] " : "[ ] ") :
      b.type === "bulleted_list_item" ? "• " :
      b.type.startsWith("heading") ? "## " : "";
    if (content) console.log(prefix + content);
  }
}

async function cmdAdd(args) {
  const [name] = args._;
  if (!name) fail('usage: board.js add "Card name" [--status S] [--team T] [--keywords a,b] [--body "text"]');
  const status = args.status ?? "Not started";
  validateStatus(status);
  const team = args.team ?? "Engineering";
  if (!TEAMS.includes(team)) fail(`invalid team "${team}" — use: ${TEAMS.join(" | ")}`);
  const keywords = (args.keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean);
  const children = args.body
    ? [{ object: "block", type: "paragraph", paragraph: { rich_text: rt(args.body) } }]
    : [];
  const page = await api("POST", "/pages", {
    parent: { database_id: DATABASE_ID },
    properties: {
      Name: { title: rt(name) },
      Status: { status: { name: status } },
      Team: { select: { name: team } },
      "AI keywords": { multi_select: keywords.map((k) => ({ name: k })) },
    },
    children,
  });
  console.log(`created: ${name} (${status})\n${page.url}`);
}

async function cmdMove(args) {
  const [query] = args._;
  if (!query || !args.status) fail('usage: board.js move <name-query> --status "In development"');
  validateStatus(args.status);
  const card = await findCard(query);
  await api("PATCH", `/pages/${card.id}`, {
    properties: { Status: { status: { name: args.status } } },
  });
  console.log(`moved: ${titleOf(card)} → ${args.status}`);
}

async function cmdAppend(args) {
  const [query] = args._;
  if (!query || !args.body) fail('usage: board.js append <name-query> --body "text"');
  const card = await findCard(query);
  await api("PATCH", `/blocks/${card.id}/children`, {
    children: [{ object: "block", type: "paragraph", paragraph: { rich_text: rt(args.body) } }],
  });
  console.log(`appended to: ${titleOf(card)}`);
}

async function cmdArchive(args) {
  const [query] = args._;
  if (!query) fail("usage: board.js archive <name-query>");
  const card = await findCard(query);
  await api("PATCH", `/pages/${card.id}`, { archived: true });
  console.log(`archived: ${titleOf(card)} (recoverable from Notion Trash)`);
}

const commands = { list: cmdList, show: cmdShow, add: cmdAdd, move: cmdMove, append: cmdAppend, archive: cmdArchive };

const [cmd, ...rest] = process.argv.slice(2);
if (!cmd || !commands[cmd]) {
  console.log(`Notion board CLI — commands:
  list [--status "Not started"]                 List cards grouped by column
  show <name-query>                             Show one card's props + body
  add "Name" [--status S] [--team T]            Create a card
      [--keywords a,b] [--body "text"]
  move <name-query> --status "Done"             Move a card to a column
  append <name-query> --body "text"             Append a paragraph to a card
  archive <name-query>                          Archive a card (reversible)

Statuses: ${STATUSES.join(" | ")}
Teams: ${TEAMS.join(" | ")}`);
  process.exit(cmd ? 1 : 0);
}
await commands[cmd](parseArgs(rest));
