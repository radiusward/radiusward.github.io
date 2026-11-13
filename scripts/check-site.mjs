// Copyright 2026 The radiusward Authors
// SPDX-License-Identifier: Apache-2.0
// Checks the built site in dist/: robots.txt syntax, the sitemap (well-formed, every URL present, canonical and
// indexable), every page's title, description, preview image, language and structured data, llms.txt links, and
// that only noindex pages are missing from the sitemap. Run after `npm run build`; CI fails on any problem.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://radiusward.com';
const dist = 'dist';
const problems = [];
const read = (p) => readFileSync(join(dist, p), 'utf8');
const pageFile = (path) => join(dist, path.replace(/^\//, ''), 'index.html');

// robots.txt
const robots = read('robots.txt');
for (const line of robots.split('\n')) {
	const t = line.trim();
	if (t && !t.startsWith('#') && !/^(User-agent|Allow|Disallow|Sitemap):/.test(t)) problems.push(`robots.txt: unexpected line "${t}"`);
	if (/^Disallow:\s*\S/.test(t)) problems.push(`robots.txt: a Disallow rule — nothing on this site is meant to be blocked ("${t}")`);
}
if (!robots.includes(`Sitemap: ${SITE}/sitemap-index.xml`)) problems.push('robots.txt: sitemap line missing');

// sitemap
const index = read('sitemap-index.xml');
const subs = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (subs.length === 0) problems.push('sitemap-index.xml lists no sitemap');
const locs = [];
for (const sub of subs) {
	const xml = read(sub.replace(`${SITE}/`, ''));
	if (!xml.startsWith('<?xml')) problems.push(`${sub}: not XML`);
	locs.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
}
if (new Set(locs).size !== locs.length) problems.push('sitemap: duplicate URLs');
const titles = new Map();
for (const url of locs) {
	if (!url.startsWith(`${SITE}/`) || !url.endsWith('/')) problems.push(`sitemap: unexpected URL form ${url}`);
	const path = url.slice(SITE.length);
	const file = pageFile(path);
	if (!existsSync(file)) { problems.push(`${path}: in the sitemap but not built`); continue; }
	const html = readFileSync(file, 'utf8');
	const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
	if (canonical !== url) problems.push(`${path}: canonical ${canonical} ≠ ${url}`);
	if (/<meta name="robots" content="noindex"/.test(html)) problems.push(`${path}: noindex but in the sitemap`);
	const title = html.match(/<title>([^<]{5,})<\/title>/)?.[1];
	if (!title) problems.push(`${path}: no title`);
	else titles.set(title, [...(titles.get(title) ?? []), path]);
	if (!/<meta name="description" content="[^"]{20,}"/.test(html)) problems.push(`${path}: no description`);
	if (!html.includes('property="og:image"')) problems.push(`${path}: no og:image`);
	if (!html.includes('<html lang="en"')) problems.push(`${path}: no lang`);
	const ld = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1];
	try { JSON.parse(ld); } catch (e) { problems.push(`${path}: structured data does not parse (${e.message})`); }
}
for (const [title, paths] of titles) if (paths.length > 1) problems.push(`duplicate title "${title}": ${paths.join(', ')}`);

// every built page is either in the sitemap or noindex
const pages = [];
const walk = (dir, rel) => {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) { if (name !== 'pagefind') walk(p, `${rel}${name}/`); }
		else if (name === 'index.html') pages.push(rel);
		else if (name.endsWith('.html')) pages.push(`${rel}${name}`);
	}
};
walk(dist, '/');
const inSitemap = new Set(locs.map((u) => u.slice(SITE.length)));
for (const p of pages) {
	if (inSitemap.has(p)) continue;
	const html = readFileSync(p.endsWith('.html') ? join(dist, p) : pageFile(p), 'utf8');
	if (!/<meta name="robots" content="noindex"/.test(html)) problems.push(`${p}: built, indexable, but not in the sitemap`);
}

// llms.txt
if (!existsSync(join(dist, 'llms.txt'))) problems.push('llms.txt missing');
else {
	const llms = read('llms.txt');
	if (!llms.startsWith('# radiusward')) problems.push('llms.txt: does not start with the H1');
	for (const [, url] of llms.matchAll(/\]\((https:\/\/radiusward\.com[^)]+)\)/g)) {
		const path = url.slice(SITE.length);
		if (!existsSync(path.endsWith('.txt') || path.endsWith('.xml') ? join(dist, path) : pageFile(path))) problems.push(`llms.txt: ${url} is not built`);
	}
}

if (problems.length) {
	console.error(`check-site: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`);
	process.exit(1);
}
console.log(`check-site: ok — ${locs.length} pages in the sitemap, ${pages.length} built, robots.txt and llms.txt valid`);
