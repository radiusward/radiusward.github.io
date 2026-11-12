// Copyright 2026 The radiusward Authors
// SPDX-License-Identifier: Apache-2.0

/** Links and facts used across pages; one place to change them (the release becomes build-time data in W2). */
export const REPO = 'https://github.com/radiusward/radiusward-server';
export const DOCS = `${REPO}/blob/main/docs`;
/** The test reports and benchmarks published by the server repo (moves with the domain, decision D2). */
export const REPORTS = 'https://radiusward.github.io/radiusward-server';
export const RELEASE = { tag: 'v0.1.0-rc.1', label: 'Release candidate', date: '2026-11-11' };
export const RELEASE_URL = `${REPO}/releases/tag/${RELEASE.tag}`;
