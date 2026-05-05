import { Commit, AnonymizationRule, ReportOptions } from '@/types';
import { applyAnonymizationWithEmailMask } from '@/utils/text';

export function anonymizeCommit(
  commit: Commit,
  rules: AnonymizationRule[],
  options: ReportOptions,
): Commit {
  const anon = (text: string) =>
    applyAnonymizationWithEmailMask(text, rules, options.anonymizeEmails);

  return {
    ...commit,
    message: anon(commit.message),
    author: {
      name: anon(commit.author.name),
      email: options.anonymizeEmails
        ? applyAnonymizationWithEmailMask(commit.author.email, rules, true)
        : anon(commit.author.email),
      date: commit.author.date,
    },
    files: commit.files?.map((f) => ({
      ...f,
      filename: anon(f.filename),
    })),
  };
}

export function anonymizeCommits(
  commits: Commit[],
  rules: AnonymizationRule[],
  options: ReportOptions,
): Commit[] {
  return commits.map((c) => anonymizeCommit(c, rules, options));
}

export function countTotalSubstitutions(
  original: Commit[],
  anonymized: Commit[],
  rules: AnonymizationRule[],
): number {
  if (rules.filter((r) => r.enabled).length === 0) return 0;

  let count = 0;
  for (let i = 0; i < original.length; i++) {
    const orig = original[i];
    const anon = anonymized[i];
    if (orig.message !== anon.message) count++;
    if (orig.author.name !== anon.author.name) count++;
    if (orig.author.email !== anon.author.email) count++;
  }
  return count;
}
