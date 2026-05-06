import type { Repository, Commit, ReportConfig, FetchProgress } from '@/types';
import { fetchRepository, fetchCommits } from './github';
import { fetchRepositoryBitbucket, fetchCommitsBitbucket } from './bitbucket';
import { fetchRepositoryGitLab, fetchCommitsGitLab } from './gitlab';

export async function platformFetchRepository(
  owner: string,
  repo: string,
  config: ReportConfig,
): Promise<Repository> {
  switch (config.platform) {
    case 'bitbucket-server':
      return fetchRepositoryBitbucket(
        owner, repo,
        config.serverUrl ?? '',
        config.username ?? '',
        config.token ?? '',
      );
    case 'gitlab':
      return fetchRepositoryGitLab(
        owner, repo,
        config.serverUrl ?? 'https://gitlab.com',
        config.token ?? '',
      );
    default:
      return fetchRepository(owner, repo, config.token);
  }
}

export async function platformFetchCommits(
  owner: string,
  repo: string,
  config: ReportConfig,
  opts: { fetchDetails: boolean; onProgress?: (p: FetchProgress) => void },
): Promise<Commit[]> {
  const since = config.dateFrom;
  const until = config.dateTo;
  const authors = config.authors.length > 0 ? config.authors : undefined;

  switch (config.platform) {
    case 'bitbucket-server':
      return fetchCommitsBitbucket(owner, repo, {
        since, until, authors,
        serverUrl: config.serverUrl ?? '',
        username: config.username ?? '',
        password: config.token ?? '',
        onProgress: opts.onProgress,
      });
    case 'gitlab':
      return fetchCommitsGitLab(owner, repo, {
        since, until, authors,
        serverUrl: config.serverUrl ?? 'https://gitlab.com',
        token: config.token ?? '',
        fetchDetails: opts.fetchDetails,
        onProgress: opts.onProgress,
      });
    default:
      return fetchCommits(owner, repo, {
        since, until, authors,
        token: config.token,
        fetchDetails: opts.fetchDetails,
        onProgress: opts.onProgress,
      });
  }
}
