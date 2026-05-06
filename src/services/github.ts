import { Repository, Commit, FetchProgress } from '@/types';

const BASE = 'https://api.github.com';

async function ghFetch<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { headers });

  if (res.status === 403) {
    const remaining = res.headers.get('X-RateLimit-Remaining');
    if (remaining === '0') {
      const reset = res.headers.get('X-RateLimit-Reset');
      const resetTime = reset ? new Date(parseInt(reset) * 1000).toLocaleTimeString() : 'soon';
      throw new Error(`GitHub API rate limit exceeded. Resets at ${resetTime}.`);
    }
    throw new Error('GitHub API access forbidden. The repository may be private.');
  }

  if (res.status === 404) {
    throw new Error('Repository not found. Check the URL and make sure it is public.');
  }

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchRepository(
  owner: string,
  repo: string,
  token?: string,
): Promise<Repository> {
  const data = await ghFetch<{
    full_name: string;
    description: string;
    default_branch: string;
    html_url: string;
  }>(`/repos/${owner}/${repo}`, token);

  return {
    owner,
    repo,
    fullName: data.full_name,
    description: data.description,
    defaultBranch: data.default_branch,
    url: data.html_url,
  };
}

interface GHCommit {
  sha: string;
  commit: {
    author: { name: string; email: string; date: string };
    message: string;
  };
  html_url: string;
  author: { login: string } | null;
  stats?: { additions: number; deletions: number; total: number };
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
  }>;
}

function mapCommit(raw: GHCommit): Commit {
  return {
    sha: raw.sha,
    shortSha: raw.sha.slice(0, 7),
    message: raw.commit.message,
    author: {
      name: raw.commit.author.name,
      email: raw.commit.author.email,
      date: raw.commit.author.date,
    },
    htmlUrl: raw.html_url,
    files: raw.files?.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
    })),
    stats: raw.stats,
  };
}

export async function fetchCommits(
  owner: string,
  repo: string,
  opts: {
    since?: string;
    until?: string;
    authors?: string[];
    token?: string;
    fetchDetails?: boolean;
    onProgress?: (p: FetchProgress) => void;
  },
): Promise<Commit[]> {
  const { since, until, authors, token, fetchDetails = false, onProgress } = opts;

  const allCommits: GHCommit[] = [];
  let page = 1;
  const perPage = 100;

  onProgress?.({ step: 'Fetching commits…', current: 0, total: 0 });

  while (page <= 5) {
    const params = new URLSearchParams({ per_page: String(perPage), page: String(page) });
    if (since) params.set('since', `${since}T00:00:00Z`);
    if (until) params.set('until', `${until}T23:59:59Z`);

    const batch = await ghFetch<GHCommit[]>(
      `/repos/${owner}/${repo}/commits?${params}`,
      token,
    );

    if (!Array.isArray(batch) || batch.length === 0) break;
    allCommits.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }

  // Filter by author (name or email match)
  let filtered = allCommits;
  if (authors && authors.length > 0) {
    const normalizedAuthors = authors.map((a) => a.toLowerCase().trim()).filter(Boolean);
    filtered = allCommits.filter((c) => {
      const name = c.commit.author.name.toLowerCase();
      const email = c.commit.author.email.toLowerCase();
      const login = c.author?.login?.toLowerCase() ?? '';
      return normalizedAuthors.some(
        (a) => name.includes(a) || email.includes(a) || login.includes(a),
      );
    });
  }

  if (!fetchDetails) {
    return filtered.map(mapCommit);
  }

  // Fetch per-commit detail (stats + files) — only when the report needs them.
  // Capped at 50 to keep API usage reasonable.
  const withDetails: Commit[] = [];
  const limit = Math.min(filtered.length, 50);

  onProgress?.({ step: 'Loading commit details…', current: 0, total: limit });

  for (let i = 0; i < filtered.length; i++) {
    const raw = filtered[i];

    if (i < limit) {
      onProgress?.({ step: 'Loading commit details…', current: i + 1, total: limit });
      try {
        const detail = await ghFetch<GHCommit>(
          `/repos/${owner}/${repo}/commits/${raw.sha}`,
          token,
        );
        withDetails.push(mapCommit(detail));
      } catch {
        withDetails.push(mapCommit(raw));
      }
    } else {
      withDetails.push(mapCommit(raw));
    }
  }

  return withDetails;
}
