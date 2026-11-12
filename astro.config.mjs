// @ts-check
// Copyright 2026 The radiusward Authors
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { draftPaths } from './src/drafts.ts';

const drafts = new Set(draftPaths());

// https://astro.build/config
export default defineConfig({
	site: 'https://radiusward.io',
	trailingSlash: 'always',
	integrations: [mdx(), sitemap({ filter: (page) => !drafts.has(new URL(page).pathname) })],
	markdown: {
		shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false },
	},
});
