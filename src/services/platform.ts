import type { Repository, Commit, ReportConfig, FetchProgress } from '@/types';
import { fetchRepository, fetchCommits } from './github';
import { fetchRepositoryBitbucket, fetchCommitsBitbucket, fetchRepositoryBitbucketCloud, fetchCommitsBitbucketCloud } from './bitbucket';
import { fetchRepositoryGitLab, fetchCommitsGitLab } from './gitlab';

function gheBase(serverUrl?: string): string | undefined {
  return serverUrl ? `${serverUrl.replace(/\/$/, '')}/api/v3` : undefined;
}

export async function platformFetchRepository(
  owner: string,
  repo: string,
  config: ReportConfig,
): Promise<Repository> {
  switch (config.platform) {
    case 'github-enterprise':
      return fetchRepository(owner, repo, config.token, gheBase(config.serverUrl));
    case 'bitbucket-server':
      return fetchRepositoryBitbucket(
        owner, repo,
        config.serverUrl ?? '',
        config.username ?? '',
        config.token ?? '',
      );
    case 'bitbucket-cloud':
      return fetchRepositoryBitbucketCloud(
        owner, repo,
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
    case 'github-enterprise':
      return fetchCommits(owner, repo, {
        since, until, authors,
        token: config.token,
        baseUrl: gheBase(config.serverUrl),
        fetchDetails: opts.fetchDetails,
        onProgress: opts.onProgress,
      });
    case 'bitbucket-server':
      return fetchCommitsBitbucket(owner, repo, {
        since, until, authors,
        serverUrl: config.serverUrl ?? '',
        username: config.username ?? '',
        password: config.token ?? '',
        onProgress: opts.onProgress,
      });
    case 'bitbucket-cloud':
      return fetchCommitsBitbucketCloud(owner, repo, {
        since, until, authors,
        username: config.username ?? '',
        appPassword: config.token ?? '',
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
