<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { ReportData, LoadingState, FetchProgress, Commit, CommitGroup, ReportOptions } from '@/types'
import { formatDate, formatDateTime, formatDateGroup, getDateKey } from '@/utils/dates'

const props = defineProps<{
  report: ReportData | null
  loadingState: LoadingState
  error: string | null
  progress: FetchProgress | null
}>()

// ─── Active author for split-by-author print ──────────────────
const activeAuthor = ref<string | null>(null)

function filterReportByAuthor(report: ReportData, authorName: string): ReportData {
  const commits = report.commits.filter((c) => c.author.name === authorName)

  const groupMap = new Map<string, Commit[]>()
  for (const c of commits) {
    const key = getDateKey(c.author.date)
    const arr = groupMap.get(key) ?? []
    arr.push(c)
    groupMap.set(key, arr)
  }
  const groups: CommitGroup[] = Array.from(groupMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, cs]) => ({ date, commits: cs }))

  return {
    ...report,
    commits,
    groups,
    totalCommits: commits.length,
    totalAdditions: commits.reduce((s, c) => s + (c.stats?.additions ?? 0), 0),
    totalDeletions: commits.reduce((s, c) => s + (c.stats?.deletions ?? 0), 0),
    authors: [authorName],
  }
}

const displayReport = computed<ReportData | null>(() => {
  if (!props.report) return null
  if (activeAuthor.value) return filterReportByAuthor(props.report, activeAuthor.value)
  return props.report
})

const multiRepo = computed(() => (props.report?.repositories.length ?? 0) > 1)

// Watch activeAuthor — when set, trigger print then reset
watch(activeAuthor, (name) => {
  if (!name || !props.report) return
  const prev = document.title
  const d = new Date(props.report.config.dateTo)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  document.title = `${name.replace(/\s+/g, '_')}-${mm}-${yyyy}`
  window.print()
  document.title = prev
  activeAuthor.value = null
})

function handlePrintAll() {
  if (!props.report) return
  const prev = document.title
  const repos = props.report.repositories.map((r) => r.repo).join('+')
  document.title = `evidence-${repos}-${props.report.config.dateFrom}_${props.report.config.dateTo}`
  window.print()
  document.title = prev
}

// ─── Layout helpers ───────────────────────────────────────────
function getRepoGroups(report: ReportData): { name: string; commits: Commit[] }[] {
  const repoOrder = report.repositories.map((r) => r.fullName)
  const byRepo = new Map<string, Commit[]>()
  for (const commit of report.commits) {
    const key = commit.repoFullName ?? ''
    const existing = byRepo.get(key) ?? []
    existing.push(commit)
    byRepo.set(key, existing)
  }
  return repoOrder
    .filter((name) => byRepo.has(name))
    .map((name) => ({ name, commits: byRepo.get(name)! }))
}

// ─── Commit card helpers ──────────────────────────────────────
function commitTitle(commit: Commit): string {
  return commit.message.split('\n')[0]
}

function commitBody(commit: Commit): string {
  return commit.message.split('\n').slice(1).join('\n').trim()
}

function displayHash(commit: Commit, options: ReportOptions): string {
  return options.showFullHashes ? commit.sha : commit.shortSha
}

// ─── File status helpers ──────────────────────────────────────
function fileStatusColor(status: string): string {
  if (status === 'added') return '#166534'
  if (status === 'removed') return '#991b1b'
  if (status === 'renamed') return '#1e40af'
  return '#475569'
}
function fileStatusBg(status: string): string {
  if (status === 'added') return '#f0fdf4'
  if (status === 'removed') return '#fef2f2'
  if (status === 'renamed') return '#eff6ff'
  return '#f8fafc'
}
function fileStatusBorder(status: string): string {
  if (status === 'added') return '#bbf7d0'
  if (status === 'removed') return '#fecaca'
  if (status === 'renamed') return '#bfdbfe'
  return '#e2e8f0'
}

const MAX_FILES = 8
</script>

<template>
  <!-- Loading -->
  <div v-if="loadingState === 'loading'" class="center-view">
    <div
      class="animate-spin"
      style="width: 40px; height: 40px; border: 3px solid var(--border2); border-top-color: var(--accent); border-radius: 50%;"
    />
    <div style="text-align: center">
      <div style="font-size: 15px; color: var(--text); margin-bottom: 6px">
        {{ progress?.step ?? 'Connecting to GitHub…' }}
      </div>
      <div v-if="progress && progress.total > 1" style="font-size: 13px; color: var(--muted)">
        Repository {{ progress.current }} of {{ progress.total }}
      </div>
    </div>
  </div>

  <!-- Error -->
  <div v-else-if="loadingState === 'error' && error" class="center-view">
    <div class="error-icon">✕</div>
    <div>
      <div style="font-size: 16px; font-weight: 500; color: var(--text); margin-bottom: 6px">
        Could not fetch report
      </div>
      <div style="font-size: 13px; color: var(--muted2); max-width: 400px; line-height: 1.6">
        {{ error }}
      </div>
    </div>
    <div style="font-size: 12px; color: var(--muted)">
      Check the repository URL and date range. Add a GitHub token if you hit the rate limit.
    </div>
  </div>

  <!-- Empty state -->
  <div v-else-if="!report" class="center-view" style="gap: 32px;">
    <div class="empty-icon">◈</div>
    <div>
      <div class="empty-title">Ready to generate</div>
      <div class="empty-desc">
        Configure your repository, date range and authors in the panel on the left, then click
        <span style="color: var(--accent)">Generate Evidence Report</span>.
      </div>
    </div>
    <div class="steps-list">
      <div class="step-item">
        <span class="step-icon">⬡</span>
        Add one or more public GitHub repositories
      </div>
      <div class="step-item">
        <span class="step-icon">◎</span>
        Set a date range and optional author filter
      </div>
      <div class="step-item">
        <span class="step-icon">◈</span>
        Add anonymization rules to redact sensitive text
      </div>
      <div class="step-item">
        <span class="step-icon">↓</span>
        Download the result as a PDF
      </div>
    </div>
  </div>

  <!-- Report -->
  <div v-else class="report-outer">
    <!-- Action bar -->
    <div class="action-bar no-print">
      <div class="stat-chips">
        <span class="stat-chip" style="--chip-color: var(--accent)">
          {{ report.totalCommits }} commit{{ report.totalCommits !== 1 ? 's' : '' }}
        </span>
        <span v-if="report.repositories.length > 0" class="stat-chip" style="--chip-color: var(--blue)">
          {{ report.repositories.length }} repo{{ report.repositories.length !== 1 ? 's' : '' }}
        </span>
        <span v-if="report.authors.length > 0" class="stat-chip" style="--chip-color: var(--green)">
          {{ report.authors.length }} author{{ report.authors.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div class="print-btns">
        <template v-if="report.config.options.splitByAuthor">
          <button
            v-for="author in report.authors"
            :key="author"
            class="pdf-btn"
            @click="activeAuthor = author"
          >
            ↓ {{ author }}
          </button>
        </template>
        <button v-else class="pdf-btn" @click="handlePrintAll">
          ↓ Download PDF
        </button>
      </div>
    </div>

    <!-- Printable document -->
    <div
      class="report-document"
      style="background: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 4px 32px rgba(0,0,0,0.35); max-width: 900px; margin: 0 auto; overflow: hidden; font-family: 'DM Sans', system-ui, sans-serif;"
    >
      <!-- Doc header -->
      <div class="doc-header">
        <div class="doc-eyebrow">Evidence Report · GitHub Activity</div>
        <div class="doc-title">{{ displayReport!.config.options.reportTitle || 'GitHub Activity Report' }}</div>
        <div class="doc-meta">
          <div class="meta-item">
            <span class="meta-label">Period:</span>
            <span class="meta-value">{{ formatDate(displayReport!.config.dateFrom) }} – {{ formatDate(displayReport!.config.dateTo) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Generated:</span>
            <span class="meta-value">{{ formatDate(displayReport!.generatedAt) }}</span>
          </div>
          <div v-if="displayReport!.config.authors.length > 0" class="meta-item">
            <span class="meta-label">Authors:</span>
            <span class="meta-value">{{ displayReport!.config.authors.join(', ') }}</span>
          </div>
        </div>
        <div v-if="displayReport!.repositories.length > 0" class="repo-chips">
          <a
            v-for="repo in displayReport!.repositories"
            :key="repo.fullName"
            :href="repo.url"
            target="_blank"
            rel="noopener noreferrer"
            class="repo-chip"
          >
            ⬡ {{ repo.fullName }}
          </a>
        </div>
      </div>

      <!-- Summary grid -->
      <div class="summary-grid">
        <div class="summary-cell">
          <div class="summary-value">{{ displayReport!.totalCommits }}</div>
          <div class="summary-key">Commits</div>
        </div>
        <div class="summary-cell">
          <div class="summary-value">{{ displayReport!.authors.length }}</div>
          <div class="summary-key">Authors</div>
        </div>
        <div class="summary-cell">
          <div class="summary-value" style="color: #16a34a">
            {{ displayReport!.totalAdditions > 0 ? `+${displayReport!.totalAdditions.toLocaleString()}` : '—' }}
          </div>
          <div class="summary-key">Additions</div>
        </div>
        <div class="summary-cell summary-cell--last">
          <div class="summary-value" style="color: #dc2626">
            {{ displayReport!.totalDeletions > 0 ? `-${displayReport!.totalDeletions.toLocaleString()}` : '—' }}
          </div>
          <div class="summary-key">Deletions</div>
        </div>
      </div>

      <!-- Evidence section -->
      <div v-if="displayReport!.totalCommits === 0" class="empty-report">
        No commits found for the selected date range and author filter.
      </div>
      <div v-else>
        <div class="evidence-header">Commit Evidence</div>

        <!-- Day layout -->
        <template v-if="displayReport!.config.options.layout === 'day'">
          <div
            v-for="group in displayReport!.groups"
            :key="group.date"
            class="day-group"
          >
            <div class="group-header group-header--day">
              {{ formatDateGroup(group.date) }}
              <span class="group-count">{{ group.commits.length }} commit{{ group.commits.length !== 1 ? 's' : '' }}</span>
            </div>
            <div
              v-for="commit in group.commits"
              :key="`${commit.repoFullName}-${commit.sha}`"
              class="commit-card"
              style="padding: 14px 40px; border-bottom: 1px solid #f1f5f9;"
            >
              <!-- Title row -->
              <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
                <span v-if="displayReport!.config.options.showHashes" class="hash-badge">
                  {{ displayHash(commit, displayReport!.config.options) }}
                </span>
                <span v-if="multiRepo && commit.repoFullName" class="repo-badge">
                  {{ commit.repoFullName }}
                </span>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 14px; font-weight: 500; color: #1e293b; line-height: 1.4;">{{ commitTitle(commit) }}</div>
                </div>
              </div>
              <div v-if="commitBody(commit)" class="commit-body">{{ commitBody(commit) }}</div>
              <div class="commit-meta" :style="{ marginBottom: (commit.files ?? []).length > 0 && displayReport!.config.options.showFiles ? '8px' : '0' }">
                <span>{{ commit.author.name }}</span>
                <span class="meta-dot">·</span>
                <span>{{ formatDateTime(commit.author.date) }}</span>
                <template v-if="displayReport!.config.options.showStats && commit.stats">
                  <span class="meta-dot">·</span>
                  <span class="stat-add">+{{ commit.stats.additions }}</span>
                  <span class="stat-del">-{{ commit.stats.deletions }}</span>
                </template>
                <template v-if="displayReport!.config.options.showLinks">
                  <span class="meta-dot">·</span>
                  <a :href="commit.htmlUrl" target="_blank" rel="noopener noreferrer" class="commit-link">View on GitHub ↗</a>
                </template>
              </div>
              <div v-if="displayReport!.config.options.showFiles && (commit.files ?? []).length > 0" class="file-list">
                <span
                  v-for="f in (commit.files ?? []).slice(0, MAX_FILES)"
                  :key="f.filename"
                  class="file-badge"
                  :style="{
                    color: fileStatusColor(f.status),
                    background: fileStatusBg(f.status),
                    border: `1px solid ${fileStatusBorder(f.status)}`
                  }"
                >{{ f.filename }}</span>
                <span v-if="(commit.files ?? []).length - MAX_FILES > 0" class="file-more">
                  +{{ (commit.files ?? []).length - MAX_FILES }} more
                </span>
              </div>
            </div>
          </div>
        </template>

        <!-- Repo layout -->
        <template v-else-if="displayReport!.config.options.layout === 'repo'">
          <div
            v-for="group in getRepoGroups(displayReport!)"
            :key="group.name"
            class="day-group"
          >
            <div class="group-header group-header--repo">
              ⬡ {{ group.name }}
              <span class="group-count group-count--repo">{{ group.commits.length }} commit{{ group.commits.length !== 1 ? 's' : '' }}</span>
            </div>
            <div
              v-for="commit in group.commits"
              :key="`${commit.repoFullName}-${commit.sha}`"
              class="commit-card"
              style="padding: 14px 40px; border-bottom: 1px solid #f1f5f9;"
            >
              <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
                <span v-if="displayReport!.config.options.showHashes" class="hash-badge">
                  {{ displayHash(commit, displayReport!.config.options) }}
                </span>
                <span v-if="multiRepo && commit.repoFullName" class="repo-badge">
                  {{ commit.repoFullName }}
                </span>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 14px; font-weight: 500; color: #1e293b; line-height: 1.4;">{{ commitTitle(commit) }}</div>
                </div>
              </div>
              <div v-if="commitBody(commit)" class="commit-body">{{ commitBody(commit) }}</div>
              <div class="commit-meta" :style="{ marginBottom: (commit.files ?? []).length > 0 && displayReport!.config.options.showFiles ? '8px' : '0' }">
                <span>{{ commit.author.name }}</span>
                <span class="meta-dot">·</span>
                <span>{{ formatDateTime(commit.author.date) }}</span>
                <template v-if="displayReport!.config.options.showStats && commit.stats">
                  <span class="meta-dot">·</span>
                  <span class="stat-add">+{{ commit.stats.additions }}</span>
                  <span class="stat-del">-{{ commit.stats.deletions }}</span>
                </template>
                <template v-if="displayReport!.config.options.showLinks">
                  <span class="meta-dot">·</span>
                  <a :href="commit.htmlUrl" target="_blank" rel="noopener noreferrer" class="commit-link">View on GitHub ↗</a>
                </template>
              </div>
              <div v-if="displayReport!.config.options.showFiles && (commit.files ?? []).length > 0" class="file-list">
                <span
                  v-for="f in (commit.files ?? []).slice(0, MAX_FILES)"
                  :key="f.filename"
                  class="file-badge"
                  :style="{
                    color: fileStatusColor(f.status),
                    background: fileStatusBg(f.status),
                    border: `1px solid ${fileStatusBorder(f.status)}`
                  }"
                >{{ f.filename }}</span>
                <span v-if="(commit.files ?? []).length - MAX_FILES > 0" class="file-more">
                  +{{ (commit.files ?? []).length - MAX_FILES }} more
                </span>
              </div>
            </div>
          </div>
        </template>

        <!-- Flat layout -->
        <template v-else>
          <div
            v-for="commit in displayReport!.commits"
            :key="`${commit.repoFullName}-${commit.sha}`"
            class="commit-card"
            style="padding: 14px 40px; border-bottom: 1px solid #f1f5f9;"
          >
            <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
              <span v-if="displayReport!.config.options.showHashes" class="hash-badge">
                {{ displayHash(commit, displayReport!.config.options) }}
              </span>
              <span v-if="multiRepo && commit.repoFullName" class="repo-badge">
                {{ commit.repoFullName }}
              </span>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 14px; font-weight: 500; color: #1e293b; line-height: 1.4;">{{ commitTitle(commit) }}</div>
              </div>
            </div>
            <div v-if="commitBody(commit)" class="commit-body">{{ commitBody(commit) }}</div>
            <div class="commit-meta" :style="{ marginBottom: (commit.files ?? []).length > 0 && displayReport!.config.options.showFiles ? '8px' : '0' }">
              <span>{{ commit.author.name }}</span>
              <span class="meta-dot">·</span>
              <span>{{ formatDateTime(commit.author.date) }}</span>
              <template v-if="displayReport!.config.options.showStats && commit.stats">
                <span class="meta-dot">·</span>
                <span class="stat-add">+{{ commit.stats.additions }}</span>
                <span class="stat-del">-{{ commit.stats.deletions }}</span>
              </template>
              <template v-if="displayReport!.config.options.showLinks">
                <span class="meta-dot">·</span>
                <a :href="commit.htmlUrl" target="_blank" rel="noopener noreferrer" class="commit-link">View on GitHub ↗</a>
              </template>
            </div>
            <div v-if="displayReport!.config.options.showFiles && (commit.files ?? []).length > 0" class="file-list">
              <span
                v-for="f in (commit.files ?? []).slice(0, MAX_FILES)"
                :key="f.filename"
                class="file-badge"
                :style="{
                  color: fileStatusColor(f.status),
                  background: fileStatusBg(f.status),
                  border: `1px solid ${fileStatusBorder(f.status)}`
                }"
              >{{ f.filename }}</span>
              <span v-if="(commit.files ?? []).length - MAX_FILES > 0" class="file-more">
                +{{ (commit.files ?? []).length - MAX_FILES }} more
              </span>
            </div>
          </div>
        </template>
      </div>

      <!-- Doc footer -->
      <div class="doc-footer">
        <div class="doc-footer-left">
          <div
            v-if="displayReport!.config.rules.some(r => r.enabled) || displayReport!.config.options.anonymizeEmails"
            class="footer-anon-notice"
          >
            This report may contain anonymized content. Some names, emails or identifiers may have been substituted.
          </div>
          <div>Generated by GitHub Evidence Anonymizer on {{ formatDateTime(displayReport!.generatedAt) }}.</div>
        </div>
        <div class="doc-footer-right">
          <div v-for="r in displayReport!.repositories" :key="r.fullName">{{ r.fullName }}</div>
          <div>{{ formatDate(displayReport!.config.dateFrom) }} – {{ formatDate(displayReport!.config.dateTo) }}</div>
          <div>{{ displayReport!.totalCommits }} commit{{ displayReport!.totalCommits !== 1 ? 's' : '' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ─── Shared center view ───────────────────────────────────────
.center-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 100vh;
  gap: 20px;
  padding: 40px 24px;
  text-align: center;
}

// ─── Error icon ───────────────────────────────────────────────
.error-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(224, 82, 82, 0.12);
  border: 1px solid rgba(224, 82, 82, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--red);
}

// ─── Empty state ──────────────────────────────────────────────
.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--accent-dim);
  border: 1px solid var(--accent-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.empty-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.empty-desc {
  font-size: 14px;
  color: var(--muted);
  max-width: 360px;
  line-height: 1.7;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 340px;
  width: 100%;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  color: var(--muted2);
  text-align: left;
}

.step-icon {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 14px;
}

// ─── Report outer ─────────────────────────────────────────────
.report-outer {
  padding: 24px;
  min-height: 100vh;
}

// ─── Action bar ───────────────────────────────────────────────
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-chips {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-chip {
  padding: 4px 12px;
  background: color-mix(in srgb, var(--chip-color) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--chip-color) 30%, transparent);
  border-radius: 100px;
  font-size: 12px;
  color: var(--chip-color);
  font-family: var(--font-body);
}

.print-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.pdf-btn {
  padding: 8px 20px;
  background: var(--accent);
  color: #0a0a0a;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
}

// ─── Document structure ───────────────────────────────────────
.doc-header {
  padding: 36px 40px 28px;
  border-bottom: 2px solid #e2e8f0;
  background: #f8fafc;
}

.doc-eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 10px;
}

.doc-title {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 30px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 18px;
}

.doc-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 24px;
  margin-bottom: 14px;
}

.meta-item {
  font-size: 13px;
}

.meta-label {
  color: #94a3b8;
  margin-right: 4px;
}

.meta-value {
  color: #1e293b;
}

.repo-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.repo-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-size: 12px;
  color: #1d4ed8;
  text-decoration: none;
  font-family: 'JetBrains Mono', monospace;
}

// ─── Summary grid ─────────────────────────────────────────────
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid #e2e8f0;
}

.summary-cell {
  padding: 20px 24px;
  border-right: 1px solid #e2e8f0;
  text-align: center;

  &--last {
    border-right: none;
  }
}

.summary-value {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 28px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 4px;
}

.summary-key {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

// ─── Evidence section ─────────────────────────────────────────
.evidence-header {
  padding: 18px 40px 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #94a3b8;
  border-bottom: 1px solid #f1f5f9;
}

.empty-report {
  padding: 48px 40px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

// ─── Groups ───────────────────────────────────────────────────
.group-header {
  padding: 12px 40px 8px;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
  font-weight: 600;

  &--day {
    background: #f8fafc;
    color: #475569;
  }

  &--repo {
    background: #eff6ff;
    border-top-color: #bfdbfe;
    border-bottom-color: #bfdbfe;
    color: #1d4ed8;
    font-family: 'JetBrains Mono', monospace;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.group-count {
  margin-left: 10px;
  font-weight: 400;
  color: #94a3b8;

  &--repo {
    margin-left: 8px;
    color: #64748b;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
}

// ─── Commit card internals ────────────────────────────────────
.hash-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}

.repo-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #1d4ed8;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #bfdbfe;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}

.commit-body {
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 6px;
  white-space: pre-wrap;
  font-family: 'JetBrains Mono', monospace;
}

.commit-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #94a3b8;
}

.meta-dot {
  color: #cbd5e1;
}

.stat-add {
  color: #16a34a;
  font-family: 'JetBrains Mono', monospace;
}

.stat-del {
  color: #dc2626;
  font-family: 'JetBrains Mono', monospace;
}

.commit-link {
  color: #2563eb;
  text-decoration: none;
  font-size: 11px;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 6px;
}

.file-badge {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  padding: 1px 6px;
  border-radius: 3px;
}

.file-more {
  font-size: 11px;
  color: #94a3b8;
  padding: 1px 4px;
}

// ─── Doc footer ───────────────────────────────────────────────
.doc-footer {
  padding: 14px 40px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 11px;
  color: #94a3b8;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.doc-footer-left {
  max-width: 480px;
}

.footer-anon-notice {
  margin-bottom: 4px;
  color: #b45309;
}

.doc-footer-right {
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
}
</style>
