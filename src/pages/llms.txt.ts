// Copyright 2026 The radiusward Authors
// SPDX-License-Identifier: Apache-2.0
// /llms.txt (https://llmstxt.org): a plain-text map of the site for AI tools, built from the same data as the navigation.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { DOCS_NAV } from '../nav';
import { REPO, REPORTS, RELEASE } from '../consts';

export const GET: APIRoute = async ({ site }) => {
	const base = site!.toString().replace(/\/$/, '');
	const docs = new Map((await getCollection('docs')).map((d) => [d.id, d.data]));
	const lines: string[] = [
		'# radiusward',
		'',
		'> radiusward is an open-source RADIUS server (Apache-2.0, Java) for Wi‑Fi, VPN and subscriber networks: it',
		'> authenticates users and devices against a users file, SQL, LDAP or Active Directory, and stores every session',
		'> record (RADIUS accounting) on two of three cluster servers before confirming it to the device, so a crash never',
		'> loses or double-counts a record. A failed leader is replaced in about two seconds.',
		'',
		`Everything on this site may be crawled, quoted and used for training; the text is CC BY 4.0. Source code and`,
		`canonical technical documentation: ${REPO}. Current release: ${RELEASE.label} ${RELEASE.tag}.`,
		'',
		'## Pages',
		'',
		`- [Home](${base}/): what radiusward is for, the problem with RADIUS accounting, what it works with`,
		`- [Product](${base}/product/): logins, session records, operations, where it runs, fit and trade-offs`,
		`- [Reliability](${base}/reliability/): what happens when a server, a gateway, the majority, a disk or a database fails`,
		`- [Documentation](${base}/docs/): the documentation front page`,
		'',
	];
	for (const section of DOCS_NAV) {
		lines.push(`## ${section.label}`, '');
		for (const item of section.items) {
			if ('slug' in item) lines.push(`- [${item.label}](${base}/docs/${item.slug}/): ${docs.get(item.slug)?.description ?? ''}`);
			else lines.push(`- [${item.label.replace(' ↗', '')}](${item.href}): in the server repository`);
		}
		lines.push('');
	}
	lines.push('## Evidence', '', `- [Test reports and benchmarks](${REPORTS}/): fault injection, Kubernetes scenarios, end-to-end and integration tests, benchmarks`, '');
	return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
