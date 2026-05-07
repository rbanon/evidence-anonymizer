import type { Repository, Commit, FetchProgress } from '@/types';

const API = '/rest/api/1.0';
const BB_CLOUD_API = 'https://api.bitbucket.org/2.0';

function basicAuth(username: string, password: string): string {
  // encodeURIComponent + unescape converts UTF-8 to Latin-1 before btoa,
  // preventing DOMException for non-ASCII characters in credentials.
  return btoa(unescape(encodeURIComponent(`${username}:${password}`)));
}

async function bbFetch<T>(url: string, username: string, password: string): Promise<T> {
  const credentials = basicAuth(username, password);
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${credentials}`, Accept: 'application/json' },
  });

  if (res.status === 401) throw new Error('Authentication failed. Check your username and password.');
  if (res.status === 403) throw new Error('Access forbidden. You may not have permission to this repository.');
  if (res.status === 404) throw new Error('Repository not found. Check server URL, project key, and repo slug.');
  if (!res.ok) throw new Error(`Bitbucket Server error: ${res.status} ${res.statusText}`);

  return res.json() as Promise<T>;
}

export async function fetchRepositoryBitbucket(
  owner: string,
  repo: string,
  serverUrl: string,
  username: string,
  password: string,
): Promise<Repository> {
  const base = serverUrl.replace(/\/$/, '');
  const data = await bbFetch<{
    slug: string;
    project: { key: string };
    links: { self: Array<{ href: string }> };
  }>(`${base}${API}/projects/${owner}/repos/${repo}`, username, password);

  return {
    owner,
    repo: data.slug,
    fullName: `${data.project.key}/${data.slug}`,
    url: data.links.self[0]?.href ?? `${base}/projects/${owner}/repos/${repo}/browse`,
  };
}

interface BBCommit {
  id: string;
  displayId: string;
  message: string;
  author: { name: string; emailAddress: string };
  authorTimestamp: number;
  links: { self: Array<{ href: string }> };
}

interface BBPage {
  values: BBCommit[];
  isLastPage: boolean;
  nextPageStart?: number;
}

async function bbCloudFetch<T>(url: string, username: string, appPassword: string): Promise<T> {
  const credentials = basicAuth(username, appPassword);
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${credentials}`, Accept: 'application/json' },
  });
  if (res.status === 401) throw new Error('Authentication failed. Check your username and app password.');
  if (res.status === 403) throw new Error('Access forbidden. You may not have permission to this repository.');
  if (res.status === 404) throw new Error('Repository not found. Check workspace and repo slug.');
  if (!res.ok) throw new Error(`Bitbucket Cloud error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

function parseAuthorRaw(raw: string): { name: string; email: string } {
  const m = raw.match(/^(.+?)\s*<([^>]+)>$/);
  return m ? { name: m[1].trim(), email: m[2].trim() } : { name: raw, email: '' };
}

export async function fetchRepositoryBitbucketCloud(
  workspace: string,
  repo: string,
  username: string,
  appPassword: string,
): Promise<Repository> {
  const data = await bbCloudFetch<{
    slug: string;
    full_name: string;
    description?: string;
    mainbranch?: { name: string };
    links: { html: { href: string } };
  }>(`${BB_CLOUD_API}/repositories/${workspace}/${repo}`, username, appPassword);

  return {
    owner: workspace,
    repo: data.slug,
    fullName: data.full_name,
    description: data.description,
    defaultBranch: data.mainbranch?.name,
    url: data.links.html.href,
  };
}

interface BBCloudCommit {
  hash: string;
  message: string;
  author: { raw: string };
  date: string;
  links: { html: { href: string } };
}

export async function fetchCommitsBitbucketCloud(
  workspace: string,
  repo: string,
  opts: {
    since?: string;
    until?: string;
    authors?: string[];
    username: string;
    appPassword: string;
    onProgress?: (p: FetchProgress) => void;
  },
): Promise<Commit[]> {
  const { since, until, authors, username, appPassword, onProgress } = opts;
  const sinceMs = since ? new Date(`${since}T00:00:00Z`).getTime() : 0;
  const untilMs = until ? new Date(`${until}T23:59:59Z`).getTime() : Infinity;

  const allCommits: BBCloudCommit[] = [];
  let nextUrl: string | undefined = `${BB_CLOUD_API}/repositories/${workspace}/${repo}/commits?pagelen=100`;
  let pages = 0;

  onProgress?.({ step: 'Fetching commits…', current: 0, total: 0 });

  while (nextUrl && pages < 20) {
    const page: { values: BBCloudCommit[]; next?: string } = await bbCloudFetch<{ values: BBCloudCommit[]; next?: string }>(nextUrl, username, appPassword);
    let done = false;

    for (const c of page.values) {
      const ts = new Date(c.date).getTime();
      if (ts > untilMs) continue;
      if (ts < sinceMs) { done = true; break; }
      allCommits.push(c);
    }

    if (done) break;
    nextUrl = page.next;
    pages++;
  }

  let filtered = allCommits;
  if (authors && authors.length > 0) {
    const norm = authors.map((a) => a.toLowerCase().trim());
    filtered = allCommits.filter((c) => {
      const { name, email } = parseAuthorRaw(c.author.raw);
      return norm.some((a) => name.toLowerCase().includes(a) || email.toLowerCase().includes(a));
    });
  }

  return filtered.map((raw): Commit => {
    const { name, email } = parseAuthorRaw(raw.author.raw);
    return {
      sha: raw.hash,
      shortSha: raw.hash.slice(0, 7),
      message: raw.message,
      author: { name, email, date: raw.date },
      htmlUrl: raw.links.html.href,
    };
  });
}

export async function fetchCommitsBitbucket(
  owner: string,
  repo: string,
  opts: {
    since?: string;
    until?: string;
    authors?: string[];
    serverUrl: string;
    username: string;
    password: string;
    onProgress?: (p: FetchProgress) => void;
  },
): Promise<Commit[]> {
  const { since, until, authors, serverUrl, username, password, onProgress } = opts;
  const base = serverUrl.replace(/\/$/, '');
  const endpoint = `${base}${API}/projects/${owner}/repos/${repo}/commits`;

  const sinceMs = since ? new Date(`${since}T00:00:00Z`).getTime() : 0;
  const untilMs = until ? new Date(`${until}T23:59:59Z`).getTime() : Infinity;

  const allCommits: BBCommit[] = [];
  let start = 0;
  let pages = 0;

  onProgress?.({ step: 'Fetching commits…', current: 0, total: 0 });

  while (pages < 20) {
    const page = await bbFetch<BBPage>(`${endpoint}?limit=100&start=${start}`, username, password);
    let done = false;

    for (const c of page.values) {
      if (c.authorTimestamp > untilMs) continue;
      if (c.authorTimestamp < sinceMs) { done = true; break; }
      allCommits.push(c);
    }

    if (done || page.isLastPage) break;
    start = page.nextPageStart ?? 0;
    pages++;
  }

  let filtered = allCommits;
  if (authors && authors.length > 0) {
    const norm = authors.map((a) => a.toLowerCase().trim());
    filtered = allCommits.filter((c) => {
      const name = c.author.name.toLowerCase();
      const email = c.author.emailAddress.toLowerCase();
      return norm.some((a) => name.includes(a) || email.includes(a));
    });
  }

  return filtered.map((raw): Commit => ({
    sha: raw.id,
    shortSha: raw.displayId,
    message: raw.message,
    author: {
      name: raw.author.name,
      email: raw.author.emailAddress,
      date: new Date(raw.authorTimestamp).toISOString(),
    },
    htmlUrl: raw.links.self[0]?.href ?? '',
  }));
}
