import { Repository, Commit, FetchProgress } from '@/types';

async function glFetch<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'PRIVATE-TOKEN': token, Accept: 'application/json' },
  });

  if (res.status === 401) throw new Error('Authentication failed. Check your GitLab token.');
  if (res.status === 403) throw new Error('Access forbidden. You may not have permission to this repository.');
  if (res.status === 404) throw new Error('Repository not found. Check the namespace and project name.');
  if (!res.ok) throw new Error(`GitLab API error: ${res.status} ${res.statusText}`);

  return res.json() as Promise<T>;
}

function projectPath(owner: string, repo: string): string {
  return encodeURIComponent(`${owner}/${repo}`);
}

export async function fetchRepositoryGitLab(
  owner: string,
  repo: string,
  serverUrl: string,
  token: string,
): Promise<Repository> {
  const base = serverUrl.replace(/\/$/, '');
  const data = await glFetch<{
    path_with_namespace: string;
    description?: string;
    default_branch: string;
    web_url: string;
  }>(`${base}/api/v4/projects/${projectPath(owner, repo)}`, token);

  return {
    owner,
    repo,
    fullName: data.path_with_namespace,
    description: data.description,
    defaultBranch: data.default_branch,
    url: data.web_url,
  };
}

interface GLCommit {
  id: string;
  short_id: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  web_url: string;
  stats?: { additions: number; deletions: number; total: number };
}

export async function fetchCommitsGitLab(
  owner: string,
  repo: string,
  opts: {
    since?: string;
    until?: string;
    authors?: string[];
    serverUrl: string;
    token: string;
    fetchDetails?: boolean;
    onProgress?: (p: FetchProgress) => void;
  },
): Promise<Commit[]> {
  const { since, until, authors, serverUrl, token, fetchDetails = false, onProgress } = opts;
  const base = serverUrl.replace(/\/$/, '');
  const encoded = projectPath(owner, repo);

  const allCommits: GLCommit[] = [];
  let page = 1;

  onProgress?.({ step: 'Fetching commits…', current: 0, total: 0 });

  while (page <= 20) {
    const params = new URLSearchParams({ per_page: '100', page: String(page) });
    if (since) params.set('since', `${since}T00:00:00Z`);
    if (until) params.set('until', `${until}T23:59:59Z`);

    const batch = await glFetch<GLCommit[]>(
      `${base}/api/v4/projects/${encoded}/repository/commits?${params}`,
      token,
    );

    if (!Array.isArray(batch) || batch.length === 0) break;
    allCommits.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  let filtered = allCommits;
  if (authors && authors.length > 0) {
    const norm = authors.map((a) => a.toLowerCase().trim());
    filtered = allCommits.filter((c) => {
      const name = c.author_name.toLowerCase();
      const email = c.author_email.toLowerCase();
      return norm.some((a) => name.includes(a) || email.includes(a));
    });
  }

  const mapCommit = (raw: GLCommit): Commit => ({
    sha: raw.id,
    shortSha: raw.short_id,
    message: raw.message,
    author: { name: raw.author_name, email: raw.author_email, date: raw.authored_date },
    htmlUrl: raw.web_url,
    stats: raw.stats,
  });

  if (!fetchDetails) return filtered.map(mapCommit);

  const withDetails: Commit[] = [];
  const limit = Math.min(filtered.length, 50);
  onProgress?.({ step: 'Loading commit details…', current: 0, total: limit });

  for (let i = 0; i < filtered.length; i++) {
    if (i < limit) {
      onProgress?.({ step: 'Loading commit details…', current: i + 1, total: limit });
      try {
        const detail = await glFetch<GLCommit>(
          `${base}/api/v4/projects/${encoded}/repository/commits/${filtered[i].id}?stats=true`,
          token,
        );
        withDetails.push(mapCommit(detail));
      } catch {
        withDetails.push(mapCommit(filtered[i]));
      }
    } else {
      withDetails.push(mapCommit(filtered[i]));
    }
  }

  return withDetails;
}
