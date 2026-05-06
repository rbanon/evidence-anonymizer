<script setup lang="ts">
import { ref } from 'vue'
import { AnonymizationRule, Platform, ReportConfig, ReportOptions } from '@/types'
import { generateId } from '@/utils/text'

const props = defineProps<{
  config: ReportConfig
  isLoading: boolean
}>()

const emit = defineEmits<{
  'update:config': [config: ReportConfig]
  'generate': []
}>()

const repoInput = ref('')
const authorInput = ref('')
const ruleOriginal = ref('')
const ruleReplacement = ref('')

function update(partial: Partial<ReportConfig>) {
  emit('update:config', { ...props.config, ...partial })
}

function updateOption(key: keyof ReportOptions, value: boolean | string) {
  update({ options: { ...props.config.options, [key]: value } })
}

function addRepo() {
  const trimmed = repoInput.value.trim()
  if (!trimmed || props.config.repositories.includes(trimmed)) return
  update({ repositories: [...props.config.repositories, trimmed] })
  repoInput.value = ''
}

function removeRepo(r: string) {
  update({ repositories: props.config.repositories.filter((x) => x !== r) })
}

function addAuthor() {
  const trimmed = authorInput.value.trim()
  if (!trimmed || props.config.authors.includes(trimmed)) return
  update({ authors: [...props.config.authors, trimmed] })
  authorInput.value = ''
}

function removeAuthor(a: string) {
  update({ authors: props.config.authors.filter((x) => x !== a) })
}

function addRule() {
  if (!ruleOriginal.value.trim()) return
  const rule: AnonymizationRule = {
    id: generateId(),
    original: ruleOriginal.value.trim(),
    replacement: ruleReplacement.value.trim() || '[REDACTED]',
    caseSensitive: false,
    enabled: true,
  }
  update({ rules: [...props.config.rules, rule] })
  ruleOriginal.value = ''
  ruleReplacement.value = ''
}

function updateRule(id: string, patch: Partial<AnonymizationRule>) {
  update({ rules: props.config.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
}

function removeRule(id: string) {
  update({ rules: props.config.rules.filter((r) => r.id !== id) })
}

function handlePlatformChange(e: Event) {
  const target = e.target as HTMLSelectElement
  emit('update:config', {
    ...props.config,
    platform: target.value as Platform,
    serverUrl: '',
    username: '',
    token: '',
  })
}
</script>

<template>
  <div class="panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="panel-title">
        Evidence<span class="panel-title-accent"> Anonymizer</span>
      </div>
      <div class="panel-subtitle">GitHub · Commit Reports</div>
    </div>

    <!-- Scrollable form -->
    <div class="panel-body">

      <!-- Repositories -->
      <section class="section">
        <div class="section-label">Repositories</div>
        <div class="row-gap">
          <input
            type="text"
            :placeholder="
              config.platform === 'bitbucket-server' ? 'PROJECT/repo or full /scm/… URL' :
              config.platform === 'gitlab' ? 'namespace/repo or full URL' :
              'owner/repo or full GitHub URL'
            "
            v-model="repoInput"
            style="flex: 1"
            @keydown.enter="addRepo"
          />
          <button class="add-btn" @click="addRepo">Add</button>
        </div>
        <p class="hint">Press Enter or click Add. You can add multiple repositories.</p>
        <div v-if="config.repositories.length > 0" class="tag-list">
          <span
            v-for="r in config.repositories"
            :key="r"
            class="tag tag--accent"
          >
            <span class="tag-text">{{ r }}</span>
            <button class="tag-remove" @click="removeRepo(r)">×</button>
          </span>
        </div>
      </section>

      <div class="divider" />

      <!-- Date Range -->
      <section class="section">
        <div class="section-label">Date Range</div>
        <div class="date-grid">
          <div>
            <div class="sub-label">From</div>
            <input
              type="date"
              :value="config.dateFrom"
              @change="(e) => update({ dateFrom: (e.target as HTMLInputElement).value })"
            />
          </div>
          <div>
            <div class="sub-label">To</div>
            <input
              type="date"
              :value="config.dateTo"
              @change="(e) => update({ dateTo: (e.target as HTMLInputElement).value })"
            />
          </div>
        </div>
      </section>

      <div class="divider" />

      <!-- Authors -->
      <section class="section">
        <div class="section-label">Authors</div>
        <div class="row-gap">
          <input
            type="text"
            placeholder="Name or email…"
            v-model="authorInput"
            style="flex: 1"
            @keydown.enter="addAuthor"
          />
          <button class="add-btn" @click="addAuthor">Add</button>
        </div>
        <p class="hint">Leave empty to include all authors.</p>
        <div v-if="config.authors.length > 0" class="tag-list">
          <span
            v-for="a in config.authors"
            :key="a"
            class="tag tag--blue"
          >
            <span class="tag-text">{{ a }}</span>
            <button class="tag-remove" @click="removeAuthor(a)">×</button>
          </span>
        </div>
      </section>

      <div class="divider" />

      <!-- Anonymization Rules -->
      <section class="section">
        <div class="section-label">Anonymization Rules</div>
        <div class="rule-inputs">
          <input
            type="text"
            placeholder="Original text…"
            v-model="ruleOriginal"
          />
          <div class="row-gap row-gap--center">
            <span class="rule-arrow">→</span>
            <input
              type="text"
              placeholder="Replacement (default: [REDACTED])"
              v-model="ruleReplacement"
              style="flex: 1"
              @keydown.enter="addRule"
            />
            <button class="add-btn" @click="addRule">Add</button>
          </div>
        </div>

        <label class="check-opt">
          <input
            type="checkbox"
            :checked="config.options.anonymizeEmails"
            @change="(e) => updateOption('anonymizeEmails', (e.target as HTMLInputElement).checked)"
          />
          Auto-anonymize email addresses
        </label>

        <div v-if="config.rules.length === 0" class="rules-empty">
          No rules yet.
        </div>
        <div v-else class="rules-list">
          <div
            v-for="rule in config.rules"
            :key="rule.id"
            class="rule-row"
            :class="{ 'rule-row--disabled': !rule.enabled }"
          >
            <div class="rule-row-top">
              <input
                type="checkbox"
                :checked="rule.enabled"
                style="flex-shrink: 0"
                @change="(e) => updateRule(rule.id, { enabled: (e.target as HTMLInputElement).checked })"
              />
              <span class="rule-original">{{ rule.original }}</span>
              <span class="rule-sep">→</span>
              <span class="rule-replacement">{{ rule.replacement }}</span>
              <button class="rule-remove" @click="removeRule(rule.id)">×</button>
            </div>
            <label class="rule-case-opt">
              <input
                type="checkbox"
                :checked="rule.caseSensitive"
                @change="(e) => updateRule(rule.id, { caseSensitive: (e.target as HTMLInputElement).checked })"
              />
              Case sensitive
            </label>
          </div>
        </div>
      </section>

      <div class="divider" />

      <!-- Report Options -->
      <section class="section">
        <div class="section-label">Report Options</div>
        <div class="field-label">Title (optional)</div>
        <input
          type="text"
          placeholder="e.g. Q1 2025 Development Evidence"
          :value="config.options.reportTitle"
          style="margin-bottom: 12px"
          @input="(e) => updateOption('reportTitle', (e.target as HTMLInputElement).value)"
        />

        <div class="sub-label" style="margin-bottom: 8px">Content</div>
        <label class="check-opt">
          <input
            type="checkbox"
            :checked="config.options.showHashes"
            @change="(e) => updateOption('showHashes', (e.target as HTMLInputElement).checked)"
          />
          Show commit hashes
        </label>
        <label v-if="config.options.showHashes" class="check-opt">
          <input
            type="checkbox"
            :checked="config.options.showFullHashes"
            @change="(e) => updateOption('showFullHashes', (e.target as HTMLInputElement).checked)"
          />
          Show full hashes (40 chars)
        </label>
        <label class="check-opt">
          <input
            type="checkbox"
            :checked="config.options.showLinks"
            @change="(e) => updateOption('showLinks', (e.target as HTMLInputElement).checked)"
          />
          Show links to GitHub
        </label>
        <label class="check-opt">
          <input
            type="checkbox"
            :checked="config.options.showFiles"
            @change="(e) => updateOption('showFiles', (e.target as HTMLInputElement).checked)"
          />
          Show modified files
        </label>
        <label class="check-opt">
          <input
            type="checkbox"
            :checked="config.options.showStats"
            @change="(e) => updateOption('showStats', (e.target as HTMLInputElement).checked)"
          />
          Show line stats (+/−)
        </label>

        <div class="sub-label" style="margin-top: 12px; margin-bottom: 8px">Layout</div>
        <select
          :value="config.options.layout"
          style="width: 100%; margin-bottom: 8px"
          @change="(e) => updateOption('layout', (e.target as HTMLSelectElement).value)"
        >
          <option value="flat">Flat list</option>
          <option value="day">Group by day</option>
          <option value="repo">Group by repository</option>
        </select>

        <div class="sub-label" style="margin-top: 12px; margin-bottom: 8px">Export</div>
        <label class="check-opt">
          <input
            type="checkbox"
            :checked="config.options.splitByAuthor"
            @change="(e) => updateOption('splitByAuthor', (e.target as HTMLInputElement).checked)"
          />
          One PDF per author
        </label>
      </section>

      <div class="divider" />

      <!-- Connection -->
      <section class="section">
        <div class="section-label">Connection</div>
        <div class="field-label">Platform</div>
        <select style="width: 100%; margin-bottom: 12px" :value="config.platform" @change="handlePlatformChange">
          <option value="github">GitHub</option>
          <option value="bitbucket-server">Bitbucket Server</option>
          <option value="gitlab">GitLab</option>
        </select>

        <template v-if="config.platform === 'bitbucket-server'">
          <div class="field-label">Server URL</div>
          <input
            type="url"
            placeholder="https://bitbucket.company.com"
            :value="config.serverUrl ?? ''"
            style="margin-bottom: 8px"
            @input="(e) => emit('update:config', { ...config, serverUrl: (e.target as HTMLInputElement).value })"
          />
          <div class="field-label">Username</div>
          <input
            type="text"
            placeholder="j.usuario"
            :value="config.username ?? ''"
            style="margin-bottom: 8px"
            @input="(e) => emit('update:config', { ...config, username: (e.target as HTMLInputElement).value })"
          />
          <div class="field-label">Password</div>
          <input
            type="password"
            placeholder="••••••••"
            :value="config.token ?? ''"
            @input="(e) => emit('update:config', { ...config, token: (e.target as HTMLInputElement).value })"
          />
          <p class="hint">Credentials are only used client-side, never stored.</p>
        </template>

        <template v-if="config.platform === 'gitlab'">
          <div class="field-label">Server URL</div>
          <input
            type="url"
            placeholder="https://gitlab.com"
            :value="config.serverUrl ?? ''"
            style="margin-bottom: 8px"
            @input="(e) => emit('update:config', { ...config, serverUrl: (e.target as HTMLInputElement).value })"
          />
          <p class="hint" style="margin-bottom: 8px">Leave empty for gitlab.com.</p>
          <div class="field-label">Personal Access Token</div>
          <input
            type="password"
            placeholder="glpat-xxxxxxxxxxxx"
            :value="config.token ?? ''"
            @input="(e) => emit('update:config', { ...config, token: (e.target as HTMLInputElement).value })"
          />
          <p class="hint">
            Requires <code>read_api</code> scope.&nbsp;
            <a
              href="https://gitlab.com/-/user_settings/personal_access_tokens"
              target="_blank"
              rel="noopener noreferrer"
              class="hint-link"
            >Generate one ↗</a>
          </p>
        </template>

        <template v-if="config.platform === 'github'">
          <div class="field-label">Personal Access Token</div>
          <input
            type="password"
            placeholder="ghp_xxxxxxxxxxxx"
            :value="config.token ?? ''"
            @input="(e) => emit('update:config', { ...config, token: (e.target as HTMLInputElement).value })"
          />
          <p class="hint">
            Optional. Raises limit to 5,000 req/hour. Needed for private repos.&nbsp;
            <a
              href="https://github.com/settings/tokens/new?description=github-evidence-anonymizer&scopes=repo"
              target="_blank"
              rel="noopener noreferrer"
              class="hint-link"
            >Generate one ↗</a>
          </p>
        </template>
      </section>

    </div>

    <!-- Generate button -->
    <div class="panel-footer">
      <button
        class="generate-btn"
        :class="{ 'generate-btn--loading': isLoading }"
        :disabled="isLoading"
        @click="emit('generate')"
      >
        <span v-if="isLoading" class="spinner animate-spin" />
        {{ isLoading ? 'Fetching…' : 'Generate Evidence Report' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel {
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  height: 100%;
}

// ─── Header ───────────────────────────────────────────────────
.panel-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.panel-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.panel-title-accent {
  color: var(--accent);
}

.panel-subtitle {
  margin-top: 3px;
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

// ─── Body ─────────────────────────────────────────────────────
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 8px;
}

// ─── Section ──────────────────────────────────────────────────
.section {
  padding: 16px 24px;
}

.section-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 10px;
}

.divider {
  height: 1px;
  background: var(--border);
  margin: 0 24px;
}

.field-label {
  font-size: 12px;
  color: var(--muted2);
  margin-bottom: 5px;
  font-weight: 500;
}

.sub-label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 500;
}

.hint {
  font-size: 11px;
  color: var(--muted);
  margin-top: 5px;
  margin-bottom: 0;
}

.hint-link {
  color: var(--accent);
  text-decoration: none;
}

// ─── Row helpers ──────────────────────────────────────────────
.row-gap {
  display: flex;
  gap: 8px;

  &--center {
    align-items: center;
  }
}

.date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

// ─── Tags ─────────────────────────────────────────────────────
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px 3px 10px;
  border-radius: 100px;
  font-size: 12px;
  font-family: var(--font-mono);
  max-width: 100%;
  overflow: hidden;

  &--accent {
    background: var(--accent-dim);
    border: 1px solid rgba(232, 160, 32, 0.3);
    color: var(--accent);
  }

  &--blue {
    background: var(--blue-dim);
    border: 1px solid rgba(74, 143, 222, 0.3);
    color: var(--blue);
  }
}

.tag-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
  padding: 0;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

// ─── Add button ───────────────────────────────────────────────
.add-btn {
  padding: 8px 14px;
  background: var(--accent-dim);
  border: 1px solid var(--accent);
  color: var(--accent);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-family: var(--font-body);
  white-space: nowrap;
  flex-shrink: 0;
}

// ─── Checkbox options ─────────────────────────────────────────
.check-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--muted2);
}

// ─── Anonymization rules ──────────────────────────────────────
.rule-inputs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.rule-arrow {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 12px;
  flex-shrink: 0;
}

.rules-empty {
  padding: 14px;
  text-align: center;
  color: var(--muted);
  font-size: 12px;
  border: 1px dashed var(--border);
  border-radius: 6px;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rule-row {
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: 6px;
  padding: 8px 10px;
  opacity: 1;
  transition: opacity 0.15s;

  &--disabled {
    opacity: 0.5;
    border-color: var(--border);
  }
}

.rule-row-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.rule-original {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--red);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-sep {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 10px;
  flex-shrink: 0;
}

.rule-replacement {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--green);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
  padding: 0 2px;
  font-size: 15px;
  line-height: 1;
  flex-shrink: 0;
}

.rule-case-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--muted);
  cursor: pointer;
  padding-left: 20px;
}

// ─── Footer / Generate button ─────────────────────────────────
.panel-footer {
  padding: 14px 24px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.generate-btn {
  width: 100%;
  padding: 11px;
  background: var(--accent);
  color: #0a0a0a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &--loading {
    background: var(--surface2);
    color: var(--muted);
    cursor: not-allowed;
  }
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.3);
  border-top-color: rgba(0, 0, 0, 0.8);
  border-radius: 50%;
}
</style>
