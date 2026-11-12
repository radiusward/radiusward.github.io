// Copyright 2026 The radiusward Authors
// SPDX-License-Identifier: Apache-2.0
// Docs pages still being written (front matter `draft: true`): kept out of the sitemap, search engines and the search.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export function draftPaths(base = 'src/content/docs'): string[] {
	const out: string[] = [];
	const walk = (dir: string) => {
		for (const name of readdirSync(dir)) {
			const path = join(dir, name);
			if (statSync(path).isDirectory()) walk(path);
			else if (name.endsWith('.mdx') && /^draft:\s*true\s*$/m.test(readFileSync(path, 'utf8').split('---')[1] ?? '')) {
				out.push(`/docs/${relative(base, path).replace(/\.mdx$/, '')}/`);
			}
		}
	};
	walk(base);
	return out;
}
