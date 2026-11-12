// Copyright 2026 The radiusward Authors
// SPDX-License-Identifier: Apache-2.0
// The failure scenarios, shared by the Reliability page and the docs page "Failure behaviour".
import { REPO, REPORTS } from '../consts';
const DOCS = `${REPO}/blob/main/docs`;
export const MATRIX = `${DOCS}/testing/failure-matrix.md`;

export type S = 'ok' | 'down' | 'leader' | 'seeding' | 'restored';
export interface Scenario {
	id: string;
	tab: string;
	title: string;
	diagram: { gateways: [S, S]; members: [S, S, S]; sink?: S; acks: 'continue' | 'pause' | 'stop'; caption: string };
	expect: string;
	assumptions: string;
	recovery: string;
	limits: string;
	evidence: string;
	source: { label: string; href: string };
}
export const scenarios: Scenario[] = [
	{
		id: 'leader',
		tab: 'Leader loss',
		title: 'The leader is killed',
		diagram: { gateways: ['ok', 'ok'], members: ['down', 'leader', 'ok'], acks: 'pause', caption: 'Server 1 was the leader; server 2 is elected, the gateways resubmit what was pending.' },
		expect: 'The remaining two servers elect a new leader — about 2.2 seconds after the crash with the default timeouts. The gateways resubmit commands that were pending. The device waits briefly (at most about 2.5 seconds in the benchmarks); nothing that was confirmed is lost, and a retry of a record that was already stored is answered once more, not stored twice.',
		assumptions: 'Two of the three servers remain and reach each other. Leader failure is detected after cluster.leader.heartbeat.timeout (1.5 s by default; the Helm chart uses 2.5 s).',
		recovery: 'Automatic. The killed server rejoins as a follower when it restarts and catches up from the log.',
		limits: 'Requests in flight wait for the election; a device with a timeout shorter than the failover retransmits, which is counted once.',
		evidence: 'End-to-end leader failover test on every change; the leader killed under load nightly on Kubernetes and in every benchmark run.',
		source: { label: 'Failure matrix: leader killed under load', href: MATRIX },
	},
	{
		id: 'gateway',
		tab: 'Gateway loss',
		title: 'A gateway fails',
		diagram: { gateways: ['down', 'ok'], members: ['leader', 'ok', 'ok'], acks: 'continue', caption: 'Gateway A is down; the device sends its retries to gateway B.' },
		expect: 'Requests in flight on the failed gateway are not answered. The device retries through the other gateway; a record that was already stored is recognised and counted once.',
		assumptions: 'Each device has both gateways configured, as primary and secondary server (on Kubernetes each gateway has its own address).',
		recovery: 'Restart the gateway; it reconnects to the cluster. For planned restarts, gateway.shutdown.drain keeps it answering while a load balancer stops sending to it.',
		limits: 'Whatever was in flight on that gateway depends on the device retrying it. An EAP conversation in progress there starts over, because each conversation stays on the gateway that began it.',
		evidence: 'End-to-end test: a gateway killed between the commit and the response, the retry through the other gateway applied once; gateways rolled under load nightly on Kubernetes.',
		source: { label: 'Failure matrix: gateway killed after commit', href: MATRIX },
	},
	{
		id: 'majority',
		tab: 'No majority',
		title: 'The majority is lost',
		diagram: { gateways: ['ok', 'ok'], members: ['down', 'down', 'ok'], acks: 'stop', caption: 'Only one server is left: session records are no longer confirmed; authentication goes on.' },
		expect: 'Session records are no longer confirmed — the device keeps the records and retries. Authentication goes on, by design, except for simultaneous-use limits and EAP-SIM/AKA sequence numbers, which need the cluster.',
		assumptions: 'The device buffers or retries its session records while there is no answer, as RADIUS devices do.',
		recovery: 'Bring a server back. Once two servers reach each other, the retries are confirmed and applied once. If their data is gone, see "Lost quorum".',
		limits: 'This is the trade-off radiusward makes on purpose: consistency before availability for accounting. How long a device can buffer depends on its maker.',
		evidence: 'End-to-end test: no confirmation without a majority, the retry applied once after recovery. A dedicated test that authentication continues without a majority is planned.',
		source: { label: 'Failure matrix: no majority', href: MATRIX },
	},
	{
		id: 'sink',
		tab: 'Sink down',
		title: 'A database (sink) is down',
		diagram: { gateways: ['ok', 'ok'], members: ['leader', 'ok', 'ok'], sink: 'down', acks: 'continue', caption: 'The export to PostgreSQL is down; the log on disk holds what it has not received yet.' },
		expect: 'Records keep being confirmed; the log on disk is the buffer, and the exporter catches up from its checkpoint when the sink is back.',
		assumptions: 'Enough disk for the log to grow while the sink is down; a server below cluster.disk.min.free reports not ready.',
		recovery: 'Automatic once the sink is reachable. An optional sink that was detached is repaired with radiusward admin resync while the log still holds the position.',
		limits: 'A required sink further behind than sink.<name>.max.lag (4 hours by default) stops confirming new records until it catches up — by design, so the log cannot grow without bound.',
		evidence: 'Fault injection nightly on Linux: a PostgreSQL outage under load, a blocking and a detached sink.',
		source: { label: 'Fault-injection report', href: `${REPORTS}/linux/` },
	},
	{
		id: 'disk',
		tab: 'Lost disk',
		title: 'A server loses its disk',
		diagram: { gateways: ['ok', 'ok'], members: ['leader', 'ok', 'seeding'], acks: 'continue', caption: 'Server 3 starts with an empty disk and copies the snapshot and log from the others.' },
		expect: 'The server starts empty, copies the latest snapshot and the log after it from the other two, and rejoins. The cluster keeps confirming records meanwhile.',
		assumptions: 'The other two servers are up, and seeding is on (cluster.seed.timeout; the Helm chart sets it).',
		recovery: 'Automatic.',
		limits: 'Until the server has rejoined, the cluster cannot tolerate another loss.',
		evidence: 'Integration test for seeding; a server’s volume replaced under load nightly on Kubernetes.',
		source: { label: 'Kubernetes report', href: `${REPORTS}/k8s/` },
	},
	{
		id: 'quorum',
		tab: 'Lost quorum',
		title: 'Two servers are lost',
		diagram: { gateways: ['ok', 'ok'], members: ['restored', 'restored', 'restored'], acks: 'stop', caption: 'All three servers are restored from the same backup and go on from its position.' },
		expect: 'No confirmations until a majority is back. If the servers’ data is gone, all three are restored from the continuous backup outside the cluster and go on from the backup’s position.',
		assumptions: 'The continuous backup (radiusward cluster-backup) was running and is reachable.',
		recovery: 'radiusward cluster-restore on each server, or automatically with cluster.restore.from; on Kubernetes scripts/k8s-restore.sh does the whole restore.',
		limits: 'What was confirmed after the backup’s position is lost; the backup normally trails the cluster by a moment, and its lag is a metric with an alert.',
		evidence: 'Integration test: a cluster that lost every server restored with every confirmed record; a lost quorum restored nightly on Kubernetes.',
		source: { label: 'Backup and restore guide', href: `${DOCS}/operations/backup.md` },
	},
];

