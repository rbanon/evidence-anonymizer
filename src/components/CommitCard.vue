<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Commit, ReportOptions } from '@/types'
import { formatDateTime } from '@/utils/dates'

const { t } = useI18n()

const props = defineProps<{
  commit: Commit
  options: ReportOptions
  multiRepo: boolean
}>()

const title = computed(() => props.commit.message.split('\n')[0])
const body = computed(() => props.commit.message.split('\n').slice(1).join('\n').trim())
const hash = computed(() => props.options.showFullHashes ? props.commit.sha : props.commit.shortSha)

const MAX_FILES = 8

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
</script>

<template>
  <div class="commit-card">
    <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
      <span v-if="options.showHashes" class="hash-badge">{{ hash }}</span>
      <span v-if="multiRepo && commit.repoFullName" class="repo-badge">{{ commit.repoFullName }}</span>
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 14px; font-weight: 500; color: #1e293b; line-height: 1.4;">{{ title }}</div>
      </div>
    </div>
    <div v-if="body" class="commit-body">{{ body }}</div>
    <div class="commit-meta" :style="{ marginBottom: (commit.files ?? []).length > 0 && options.showFiles ? '8px' : '0' }">
      <span>{{ commit.author.name }}</span>
      <span class="meta-dot">·</span>
      <span>{{ formatDateTime(commit.author.date) }}</span>
      <template v-if="options.showStats && commit.stats">
        <span class="meta-dot">·</span>
        <span class="stat-add">+{{ commit.stats.additions }}</span>
        <span class="stat-del">-{{ commit.stats.deletions }}</span>
      </template>
      <template v-if="options.showLinks">
        <span class="meta-dot">·</span>
        <a :href="commit.htmlUrl" target="_blank" rel="noopener noreferrer" class="commit-link">{{ t('doc.viewOnGitHub') }}</a>
      </template>
    </div>
    <div v-if="options.showFiles && (commit.files ?? []).length > 0" class="file-list">
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
        +{{ (commit.files ?? []).length - MAX_FILES }} {{ t('doc.moreFiles') }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.commit-card {
  padding: 14px 40px;
  border-bottom: 1px solid #f1f5f9;

  @media (max-width: 600px) {
    padding: 12px 16px;
  }
}

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
  overflow-wrap: break-word;
  word-break: break-word;
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
  word-break: break-all;
}

.file-more {
  font-size: 11px;
  color: #94a3b8;
  padding: 1px 4px;
}
</style>
