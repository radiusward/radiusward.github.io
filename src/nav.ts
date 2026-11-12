// Copyright 2026 The radiusward Authors
// SPDX-License-Identifier: Apache-2.0

import { REPO } from './consts';

type Item = { slug: string; label: string } | { href: string; label: string };

/** The documentation navigation, in reading order; also gives the previous/next links. Items with href lead elsewhere. */
export const DOCS_NAV: { label: string; items: Item[] }[] = [
	{
		label: 'Start',
		items: [
			{ slug: 'start/overview', label: 'What radiusward is' },
			{ slug: 'start/fit', label: 'Is it a fit?' },
			{ slug: 'start/quickstart', label: 'Quickstart: first accounting' },
			{ slug: 'start/first-authentication', label: 'First authentication' },
		],
	},
	{ label: 'Concepts', items: [{ slug: 'concepts/architecture', label: 'Architecture' }] },
	{
		label: 'Reliability',
		items: [
			{ slug: 'reliability/accounting-contract', label: 'The accounting contract' },
			{ slug: 'reliability/failure-behaviour', label: 'Failure behaviour' },
			{ slug: 'reliability/evidence', label: 'Evidence: tests and benchmarks' },
		],
	},
	{ label: 'Authentication', items: [{ slug: 'authentication/choosing-a-method', label: 'Choosing a method' }] },
	{
		label: 'Deployment',
		items: [
			{ slug: 'deployment/docker', label: 'Docker' },
			{ slug: 'deployment/kubernetes', label: 'Kubernetes' },
		],
	},
	{ label: 'Operate', items: [{ slug: 'operate/overview', label: 'Operating radiusward' }] },
	{ label: 'Security', items: [{ slug: 'security/overview', label: 'Security and limitations' }] },
	{
		label: 'Community',
		items: [
			{ slug: 'community/contributing', label: 'Contributing' },
			{ slug: 'community/roadmap', label: 'Roadmap' },
		],
	},
	{
		label: 'Reference',
		items: [
			{ href: `${REPO}/blob/main/docs/configuration.md`, label: 'Configuration ↗' },
			{ href: `${REPO}/blob/main/docs/operations/monitoring.md`, label: 'Metrics and alerts ↗' },
			{ href: `${REPO}/blob/main/SECURITY.md`, label: 'Security policy ↗' },
		],
	},
];

export const DOCS_ORDER = DOCS_NAV.flatMap((s) =>
	s.items.flatMap((i) => ('slug' in i ? [{ slug: i.slug, label: i.label, section: s.label }] : [])),
);
