// Copyright 2026 The radiusward Authors
// SPDX-License-Identifier: Apache-2.0
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const docs = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/docs' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		/** the server repository document this page is based on, e.g. docs/architecture.md */
		source: z.string().optional(),
		/** still being written: not indexed, not in the sitemap or the search */
		draft: z.boolean().default(false),
	}),
});

export const collections = { docs };
