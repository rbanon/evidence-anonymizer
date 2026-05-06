<script setup lang="ts">
import { ref } from 'vue'
import ConfigPanel from '@/components/ConfigPanel.vue'
import ReportPreview from '@/components/ReportPreview.vue'
import { ReportConfig, ReportData, Repository, Commit, LoadingState, FetchProgress } from '@/types'
import { parseRepoInput } from '@/utils/text'
import { platformFetchRepository, platformFetchCommits } from '@/services/platform'
import { buildReport } from '@/services/reportGenerator'
import { toISODateString } from '@/utils/dates'

function defaultDateFrom(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return toISODateString(d)
}

const DEFAULT_CONFIG: ReportConfig = {
  repositories: [],
  dateFrom: defaultDateFrom(),
  dateTo: toISODateString(new Date()),
  authors: [],
  rules: [],
  options: {
    showHashes: true,
    showFullHashes: false,
    showLinks: true,
    showFiles: true,
    showStats: true,
    layout: 'day',
    reportTitle: '',
    anonymizeEmails: false,
    splitByAuthor: false,
  },
  platform: 'github',
}

interface FailedRepo {
  input: string
  error: string
}

interface PartialFailure {
  failedRepos: FailedRepo[]
  commits: Commit[]
  repositories: Repository[]
  safeConfig: ReportConfig
}

const config = ref<ReportConfig>({ ...DEFAULT_CONFIG, options: { ...DEFAULT_CONFIG.options } })
const report = ref<ReportData | null>(null)
const loadingState = ref<LoadingState>('idle')
const error = ref<string | null>(null)
const progress = ref<FetchProgress | null>(null)
const partialFailure = ref<PartialFailure | null>(null)

function finishReport(commits: Commit[], repositories: Repository[], cfg: ReportConfig) {
  const sorted = [...commits].sort(
    (a, b) => new Date(a.author.date).getTime() - new Date(b.author.date).getTime(),
  )
  const reportData = buildReport(sorted, cfg, repositories)
  report.value = reportData
  loadingState.value = 'success'
  progress.value = null
  partialFailure.value = null
}

async function handleGenerate() {
  if (config.value.repositories.length === 0) {
    error.value = 'Add at least one repository.'
    loadingState.value = 'error'
    return
  }
  if (!config.value.dateFrom || !config.value.dateTo) {
    error.value = 'Please select a valid date range.'
    loadingState.value = 'error'
    return
  }
  if (config.value.platform === 'bitbucket-server') {
    if (!config.value.serverUrl?.trim()) {
      error.value = 'Server URL is required for Bitbucket Server.'
      loadingState.value = 'error'
      return
    }
    if (!config.value.username?.trim()) {
      error.value = 'Username is required for Bitbucket Server.'
      loadingState.value = 'error'
      return
    }
  }

  loadingState.value = 'loading'
  error.value = null
  progress.value = null
  partialFailure.value = null

  // Strip all credentials so they are never stored in the report object.
  const safeConfig: ReportConfig = { ...config.value, token: undefined, username: undefined }
  const repositories: Repository[] = []
  const allCommits: Commit[] = []
  const failedRepos: FailedRepo[] = []

  for (let i = 0; i < config.value.repositories.length; i++) {
    const repoInput = config.value.repositories[i]

    const parsed = parseRepoInput(repoInput, config.value.platform, config.value.serverUrl)
    if (!parsed) {
      failedRepos.push({ input: repoInput, error: 'Invalid repository format.' })
      continue
    }

    progress.value = {
      step: `Fetching ${parsed.owner}/${parsed.repo}…`,
      current: i + 1,
      total: config.value.repositories.length,
    }

    try {
      const repo = await platformFetchRepository(parsed.owner, parsed.repo, config.value)
      repositories.push(repo)

      const commits = await platformFetchCommits(parsed.owner, parsed.repo, config.value, {
        fetchDetails: config.value.options.showFiles || config.value.options.showStats,
        onProgress: (p) => { progress.value = p },
      })

      allCommits.push(...commits.map((c) => ({ ...c, repoFullName: repo.fullName })))
    } catch (err) {
      failedRepos.push({
        input: repoInput,
        error: err instanceof Error ? err.message : 'Unknown error.',
      })
    }
  }

  // All repos failed
  if (repositories.length === 0) {
    error.value =
      failedRepos.length === 1
        ? failedRepos[0].error
        : `All repositories failed:\n${failedRepos.map((f) => `• ${f.input}: ${f.error}`).join('\n')}`
    loadingState.value = 'error'
    return
  }

  // Some repos failed → show modal
  if (failedRepos.length > 0) {
    loadingState.value = 'idle'
    progress.value = null
    partialFailure.value = { failedRepos, commits: allCommits, repositories, safeConfig }
    return
  }

  // All succeeded
  finishReport(allCommits, repositories, safeConfig)
}

function handleContinue() {
  if (!partialFailure.value) return
  finishReport(partialFailure.value.commits, partialFailure.value.repositories, partialFailure.value.safeConfig)
}

function handleCloseModal() {
  partialFailure.value = null
  loadingState.value = 'idle'
}
</script>

<template>
  <div class="app-layout">
    <div class="sidebar no-print">
      <ConfigPanel
        :config="config"
        :is-loading="loadingState === 'loading'"
        @update:config="config = $event"
        @generate="handleGenerate"
      />
    </div>
    <div class="main-panel">
      <ReportPreview
        :report="report"
        :loading-state="loadingState"
        :error="error"
        :progress="progress"
      />
    </div>

    <Teleport to="body">
      <div
        v-if="partialFailure"
        class="modal-backdrop"
        @click.self="handleCloseModal"
      >
        <div class="modal-box">
          <div class="modal-title">
            {{ partialFailure.failedRepos.length === 1 ? '1 repository' : `${partialFailure.failedRepos.length} repositories` }} could not be accessed
          </div>
          <div class="modal-desc">
            <template v-if="partialFailure.repositories.length > 0">
              You can continue generating the report without {{ partialFailure.failedRepos.length === 1 ? 'it' : 'them' }}, or go back to fix the list.
            </template>
            <template v-else>
              No repositories could be accessed. Go back and fix the list.
            </template>
          </div>

          <div class="modal-failed-list">
            <div
              v-for="item in partialFailure.failedRepos"
              :key="item.input"
              class="modal-failed-item"
            >
              <div class="modal-failed-input">{{ item.input }}</div>
              <div class="modal-failed-error">{{ item.error }}</div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-close" @click="handleCloseModal">Close and fix</button>
            <button
              v-if="partialFailure.repositories.length > 0"
              class="btn-continue"
              @click="handleContinue"
            >
              Generate without {{ partialFailure.failedRepos.length === 1 ? 'it' : 'them' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 360px;
  flex-shrink: 0;
}

.main-panel {
  flex: 1;
  overflow-y: auto;
  background: var(--bg);
}

// ─── Modal ────────────────────────────────────────────────────
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}

.modal-box {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 12px;
  padding: 28px 32px;
  max-width: 460px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}

.modal-desc {
  font-size: 13px;
  color: var(--muted2);
  margin-bottom: 18px;
  line-height: 1.6;
}

.modal-failed-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.modal-failed-item {
  padding: 10px 14px;
  background: rgba(224, 82, 82, 0.07);
  border: 1px solid rgba(224, 82, 82, 0.2);
  border-radius: 8px;
}

.modal-failed-input {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--red);
  margin-bottom: 3px;
}

.modal-failed-error {
  font-size: 12px;
  color: var(--muted);
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-close {
  padding: 9px 18px;
  background: var(--surface2);
  border: 1px solid var(--border2);
  color: var(--muted2);
  border-radius: 7px;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
}

.btn-continue {
  padding: 9px 18px;
  background: var(--accent);
  border: none;
  color: #0a0a0a;
  border-radius: 7px;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
}
</style>
