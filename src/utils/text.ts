import { AnonymizationRule } from '@/types';

export function applyAnonymization(text: string, rules: AnonymizationRule[]): string {
  let result = text;
  const activeRules = rules.filter((r) => r.enabled && r.original.trim());

  for (const rule of activeRules) {
    if (!rule.original) continue;
    const flags = rule.caseSensitive ? 'g' : 'gi';
    const escaped = rule.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, flags);
    result = result.replace(pattern, rule.replacement);
  }

  return result;
}

export function anonymizeEmail(email: string): string {
  const atIdx = email.indexOf('@');
  if (atIdx < 0) return email;
  const domain = email.slice(atIdx + 1);
  return `redacted@${domain}`;
}

export function applyAnonymizationWithEmailMask(
  text: string,
  rules: AnonymizationRule[],
  maskEmails: boolean,
): string {
  let result = applyAnonymization(text, rules);

  if (maskEmails) {
    result = result.replace(
      /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
      (match) => anonymizeEmail(match),
    );
  }

  return result;
}

export function parseRepoInput(
  input: string,
  platform: 'github' | 'bitbucket-server' | 'gitlab',
  serverUrl?: string,
): { owner: string; repo: string } | null {
  const trimmed = input.trim().replace(/\.git$/, '').replace(/\/$/, '');

  if (platform === 'github') {
    const urlMatch = trimmed.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] };
    const shortMatch = trimmed.match(/^([a-zA-Z0-9_.\-]+)\/([a-zA-Z0-9_.\-]+)$/);
    if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] };
    return null;
  }

  if (platform === 'bitbucket-server') {
    // Full URL: https://bitbucket.company.com/scm/PROJECT/repo
    const scmMatch = trimmed.match(/\/scm\/([^/]+)\/([^/]+)$/);
    if (scmMatch) return { owner: scmMatch[1], repo: scmMatch[2] };
    // Short form: PROJECT/repo
    const shortMatch = trimmed.match(/^([a-zA-Z0-9_.\-]+)\/([a-zA-Z0-9_.\-]+)$/);
    if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] };
    return null;
  }

  if (platform === 'gitlab') {
    // Full URL (any hostname): extract path after domain
    if (trimmed.startsWith('http')) {
      const pathMatch = trimmed.match(/^https?:\/\/[^/]+\/(.+)/);
      if (pathMatch) {
        const parts = pathMatch[1].split('/').filter(Boolean);
        if (parts.length >= 2) {
          return { owner: parts.slice(0, -1).join('/'), repo: parts[parts.length - 1] };
        }
      }
      return null;
    }
    // Short form: namespace/repo or namespace/subgroup/repo
    const parts = trimmed.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return { owner: parts.slice(0, -1).join('/'), repo: parts[parts.length - 1] };
    }
    return null;
  }

  return null;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

