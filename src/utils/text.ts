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

export function parseRepoUrl(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim().replace(/\/$/, '');

  const githubUrl = /github\.com\/([^/]+)\/([^/]+)/;
  const shortForm = /^([a-zA-Z0-9_.\-]+)\/([a-zA-Z0-9_.\-]+)$/;

  const urlMatch = trimmed.match(githubUrl);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
  }

  const shortMatch = trimmed.match(shortForm);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2] };
  }

  return null;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

export function countAnonymizations(original: string, anonymized: string): number {
  if (original === anonymized) return 0;
  let count = 0;
  let i = 0;
  while (i < original.length) {
    if (original[i] !== anonymized[i]) {
      count++;
      while (i < original.length && original[i] !== anonymized[i]) i++;
    } else {
      i++;
    }
  }
  return count;
}
