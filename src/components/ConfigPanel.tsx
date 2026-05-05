'use client';

import { useState } from 'react';
import { AnonymizationRule, ReportConfig, ReportOptions } from '@/types';
import { generateId } from '@/utils/text';

interface Props {
  config: ReportConfig;
  onChange: (config: ReportConfig) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const DEFAULT_OPTIONS: ReportOptions = {
  showHashes: true,
  showFullHashes: false,
  showLinks: true,
  showFiles: true,
  showStats: true,
  groupByDay: true,
  repoLabel: '',
  anonymizeEmails: false,
};

export function ConfigPanel({ config, onChange, onGenerate, isLoading }: Props) {
  const [authorInput, setAuthorInput] = useState('');
  const [ruleOriginal, setRuleOriginal] = useState('');
  const [ruleReplacement, setRuleReplacement] = useState('');
  const [activeSection, setActiveSection] = useState<string>('repo');

  const update = (partial: Partial<ReportConfig>) =>
    onChange({ ...config, ...partial });

  const addAuthor = () => {
    const trimmed = authorInput.trim();
    if (!trimmed || config.authors.includes(trimmed)) return;
    update({ authors: [...config.authors, trimmed] });
    setAuthorInput('');
  };

  const removeAuthor = (a: string) =>
    update({ authors: config.authors.filter((x) => x !== a) });

  const addRule = () => {
    if (!ruleOriginal.trim()) return;
    const rule: AnonymizationRule = {
      id: generateId(),
      original: ruleOriginal.trim(),
      replacement: ruleReplacement.trim() || '[REDACTED]',
      caseSensitive: false,
      enabled: true,
    };
    update({ rules: [...config.rules, rule] });
    setRuleOriginal('');
    setRuleReplacement('');
  };

  const updateRule = (id: string, patch: Partial<AnonymizationRule>) =>
    update({ rules: config.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const removeRule = (id: string) =>
    update({ rules: config.rules.filter((r) => r.id !== id) });

  const updateOption = (key: keyof ReportOptions, value: boolean | string) =>
    update({ options: { ...config.options, [key]: value } });

  const sections = [
    { id: 'repo', label: 'Repository', icon: '⬡' },
    { id: 'filter', label: 'Filter', icon: '◎' },
    { id: 'anon', label: 'Anonymize', icon: '◈' },
    { id: 'options', label: 'Options', icon: '◧' },
  ];

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '24px 24px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            fontWeight: 600,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Evidence
          <br />
          <span style={{ color: 'var(--accent)' }}>Anonymizer</span>
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: 'var(--muted)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          GitHub · Commit Reports
        </div>
      </div>

      {/* Section tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          padding: '0 8px',
        }}
      >
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: activeSection === s.id ? 'var(--accent)' : 'var(--muted)',
              borderBottom: `2px solid ${activeSection === s.id ? 'var(--accent)' : 'transparent'}`,
              fontSize: 11,
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              transition: 'color 0.15s',
            }}
          >
            <div style={{ fontSize: 14, marginBottom: 2 }}>{s.icon}</div>
            {s.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
        {activeSection === 'repo' && (
          <div className="animate-fade-in">
            <Field label="Repository URL or owner/repo">
              <input
                type="text"
                placeholder="e.g. facebook/react or https://github.com/…"
                value={config.repository?.fullName ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({
                    ...config,
                    repository: val
                      ? {
                          owner: '',
                          repo: '',
                          fullName: val,
                          url: '',
                        }
                      : null,
                  });
                }}
              />
            </Field>

            <Field label="GitHub Token (optional — increases rate limit)">
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={(config as ReportConfig & { token?: string }).token ?? ''}
                onChange={(e) =>
                  onChange({ ...config, token: e.target.value } as ReportConfig & {
                    token: string;
                  })
                }
              />
              <HintText>Only used client-side. Never stored.</HintText>
            </Field>

            <Field label="Date range">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>
                    From
                  </label>
                  <input
                    type="date"
                    value={config.dateFrom}
                    onChange={(e) => update({ dateFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, display: 'block' }}>
                    To
                  </label>
                  <input
                    type="date"
                    value={config.dateTo}
                    onChange={(e) => update({ dateTo: e.target.value })}
                  />
                </div>
              </div>
            </Field>

            <Field label="Report label (optional)">
              <input
                type="text"
                placeholder="e.g. Q1 2025 Development Evidence"
                value={config.options.repoLabel}
                onChange={(e) => updateOption('repoLabel', e.target.value)}
              />
              <HintText>Used as the report title if provided.</HintText>
            </Field>
          </div>
        )}

        {activeSection === 'filter' && (
          <div className="animate-fade-in">
            <Field label="Filter by author (name, email or GitHub login)">
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Author name or email…"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addAuthor()}
                  style={{ flex: 1 }}
                />
                <AddButton onClick={addAuthor}>Add</AddButton>
              </div>
              <HintText>Leave empty to include all authors.</HintText>
            </Field>

            {config.authors.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {config.authors.map((a) => (
                  <Tag key={a} onRemove={() => removeAuthor(a)}>
                    {a}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'anon' && (
          <div className="animate-fade-in">
            <Field label="Add substitution rule">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Original text…"
                  value={ruleOriginal}
                  onChange={(e) => setRuleOriginal(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>→</span>
                  <input
                    type="text"
                    placeholder="Replacement (default: [REDACTED])"
                    value={ruleReplacement}
                    onChange={(e) => setRuleReplacement(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRule()}
                    style={{ flex: 1 }}
                  />
                  <AddButton onClick={addRule}>Add</AddButton>
                </div>
              </div>
            </Field>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--muted2)',
              }}
            >
              <input
                type="checkbox"
                checked={config.options.anonymizeEmails}
                onChange={(e) => updateOption('anonymizeEmails', e.target.checked)}
              />
              Auto-anonymize email addresses
            </label>

            {config.rules.length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: 13,
                  border: '1px dashed var(--border)',
                  borderRadius: 8,
                }}
              >
                No rules yet. Add a substitution above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {config.rules.map((rule) => (
                  <RuleRow key={rule.id} rule={rule} onUpdate={updateRule} onRemove={removeRule} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'options' && (
          <div className="animate-fade-in">
            <SectionLabel>Content</SectionLabel>
            <CheckOption
              label="Show commit hashes"
              checked={config.options.showHashes}
              onChange={(v) => updateOption('showHashes', v)}
            />
            {config.options.showHashes && (
              <CheckOption
                label="Show full hashes (40 chars)"
                checked={config.options.showFullHashes}
                onChange={(v) => updateOption('showFullHashes', v)}
              />
            )}
            <CheckOption
              label="Show links to GitHub"
              checked={config.options.showLinks}
              onChange={(v) => updateOption('showLinks', v)}
            />
            <CheckOption
              label="Show modified files"
              checked={config.options.showFiles}
              onChange={(v) => updateOption('showFiles', v)}
            />
            <CheckOption
              label="Show line stats (+/-)"
              checked={config.options.showStats}
              onChange={(v) => updateOption('showStats', v)}
            />
            <SectionLabel style={{ marginTop: 16 }}>Layout</SectionLabel>
            <CheckOption
              label="Group commits by day"
              checked={config.options.groupByDay}
              onChange={(v) => updateOption('groupByDay', v)}
            />
          </div>
        )}
      </div>

      {/* Generate button */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <button
          onClick={onGenerate}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            background: isLoading ? 'var(--surface2)' : 'var(--accent)',
            color: isLoading ? 'var(--muted)' : '#0a0a0a',
            border: 'none',
            borderRadius: 8,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            fontSize: 14,
            letterSpacing: '0.02em',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isLoading ? (
            <>
              <Spinner />
              Fetching…
            </>
          ) : (
            'Generate Evidence Report'
          )}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--muted2)',
          marginBottom: 6,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function HintText({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{children}</div>
  );
}

function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: 11,
        color: 'var(--muted)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: 10,
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CheckOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        cursor: 'pointer',
        fontSize: 13,
        color: 'var(--muted2)',
      }}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function AddButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        background: 'var(--accent-dim)',
        border: '1px solid var(--accent)',
        color: 'var(--accent)',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 13,
        fontFamily: 'var(--font-body)',
        whiteSpace: 'nowrap',
        transition: 'background 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function Tag({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        background: 'var(--blue-dim)',
        border: '1px solid rgba(74,143,222,0.3)',
        borderRadius: 100,
        fontSize: 12,
        color: 'var(--blue)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {children}
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--muted)',
          padding: 0,
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </span>
  );
}

function RuleRow({
  rule,
  onUpdate,
  onRemove,
}: {
  rule: AnonymizationRule;
  onUpdate: (id: string, patch: Partial<AnonymizationRule>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      style={{
        background: 'var(--surface2)',
        border: `1px solid ${rule.enabled ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 8,
        padding: '10px 12px',
        opacity: rule.enabled ? 1 : 0.5,
        transition: 'opacity 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={(e) => onUpdate(rule.id, { enabled: e.target.checked })}
          style={{ flexShrink: 0 }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--red)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {rule.original}
        </span>
        <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>→</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--green)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {rule.replacement}
        </span>
        <button
          onClick={() => onRemove(rule.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            padding: '0 4px',
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: 'var(--muted)',
          cursor: 'pointer',
          paddingLeft: 22,
        }}
      >
        <input
          type="checkbox"
          checked={rule.caseSensitive}
          onChange={(e) => onUpdate(rule.id, { caseSensitive: e.target.checked })}
        />
        Case sensitive
      </label>
    </div>
  );
}

function Spinner() {
  return (
    <div
      className="animate-spin"
      style={{
        width: 14,
        height: 14,
        border: '2px solid rgba(0,0,0,0.3)',
        borderTopColor: 'rgba(0,0,0,0.8)',
        borderRadius: '50%',
      }}
    />
  );
}
