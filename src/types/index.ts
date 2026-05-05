export interface Repository {
  owner: string;
  repo: string;
  fullName: string;
  description?: string;
  defaultBranch?: string;
  url: string;
}

export interface CommitAuthor {
  name: string;
  email: string;
  date: string;
}

export interface CommitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}

export interface Commit {
  sha: string;
  shortSha: string;
  message: string;
  author: CommitAuthor;
  htmlUrl: string;
  files?: CommitFile[];
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface AnonymizationRule {
  id: string;
  original: string;
  replacement: string;
  caseSensitive: boolean;
  enabled: boolean;
}

export interface ReportOptions {
  showHashes: boolean;
  showFullHashes: boolean;
  showLinks: boolean;
  showFiles: boolean;
  showStats: boolean;
  groupByDay: boolean;
  repoLabel: string;
  anonymizeEmails: boolean;
}

export interface ReportConfig {
  repository: Repository | null;
  dateFrom: string;
  dateTo: string;
  authors: string[];
  rules: AnonymizationRule[];
  options: ReportOptions;
}

export interface CommitGroup {
  date: string;
  commits: Commit[];
}

export interface ReportData {
  generatedAt: string;
  config: ReportConfig;
  commits: Commit[];
  groups: CommitGroup[];
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  authors: string[];
  firstCommit?: Commit;
  lastCommit?: Commit;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface FetchProgress {
  step: string;
  current: number;
  total: number;
}
