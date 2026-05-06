import type { Commit, Repository, ReportConfig, ReportData, CommitGroup } from '@/types';
import { getDateKey } from '@/utils/dates';
import { anonymizeCommits } from './anonymizer';

export function buildReport(
  commits: Commit[],
  config: ReportConfig,
  repositories: Repository[],
): ReportData {
  const anonymized = anonymizeCommits(commits, config.rules, config.options);

  const groupMap = new Map<string, Commit[]>();
  for (const commit of anonymized) {
    const key = getDateKey(commit.author.date);
    const existing = groupMap.get(key) ?? [];
    existing.push(commit);
    groupMap.set(key, existing);
  }

  const groups: CommitGroup[] = Array.from(groupMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, commits]) => ({ date, commits }));

  const totalAdditions = anonymized.reduce((s, c) => s + (c.stats?.additions ?? 0), 0);
  const totalDeletions = anonymized.reduce((s, c) => s + (c.stats?.deletions ?? 0), 0);

  const authorSet = new Set(anonymized.map((c) => c.author.name));

  const sorted = [...anonymized].sort(
    (a, b) => new Date(a.author.date).getTime() - new Date(b.author.date).getTime(),
  );

  return {
    generatedAt: new Date().toISOString(),
    config,
    repositories,
    commits: anonymized,
    groups,
    totalCommits: anonymized.length,
    totalAdditions,
    totalDeletions,
    authors: Array.from(authorSet),
    firstCommit: sorted[0],
    lastCommit: sorted[sorted.length - 1],
  };
}
