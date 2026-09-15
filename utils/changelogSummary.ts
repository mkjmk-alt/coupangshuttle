import fs from 'node:fs';

export interface PublicChangeEntry {
  id: string;
  timestamp: string;
  source: string;
  sourceLabel: string;
  summary: string;
  affectedCenters: string[];
  centersChanged: number;
  routesChanged: number;
  stopsChanged: number;
}

interface ChangelogPayload {
  entries?: unknown;
}

interface RawChangelogEntry {
  id?: unknown;
  timestamp?: unknown;
  source?: unknown;
  summary?: unknown;
  affectedCenters?: unknown;
  stats?: unknown;
}

const SOURCE_LABELS: Record<string, string> = {
  automatic: '자동 배포',
  manual: '관리자 수정',
};

function textValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function timestampValue(value: unknown): string {
  return textValue(value) || '확인되지 않은 날짜';
}

function toTimestamp(value: string): number {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(`${normalized}+09:00`);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function summarizeEntry(entry: RawChangelogEntry): PublicChangeEntry | null {
  const id = textValue(entry.id);
  const source = textValue(entry.source) || 'unknown';
  if (!id && !textValue(entry.timestamp) && !textValue(entry.summary)) return null;

  const stats = entry.stats && typeof entry.stats === 'object' ? entry.stats as Record<string, unknown> : {};
  const affectedCenters = Array.isArray(entry.affectedCenters)
    ? entry.affectedCenters.filter((center): center is string => typeof center === 'string' && center.trim().length > 0)
    : [];

  return {
    id: id || `change-${timestampValue(entry.timestamp)}`,
    timestamp: timestampValue(entry.timestamp),
    source,
    sourceLabel: SOURCE_LABELS[source] ?? '데이터 변경',
    summary: textValue(entry.summary) || '변경 내역 요약이 없습니다.',
    affectedCenters,
    centersChanged: numberValue(stats.centersChanged),
    routesChanged: numberValue(stats.routesChanged),
    stopsChanged: numberValue(stats.stopsChanged),
  };
}

export function summarizeChangelogPayload(payload: ChangelogPayload, limit = 30): PublicChangeEntry[] {
  const entries = Array.isArray(payload.entries) ? payload.entries : [];
  return entries
    .filter((entry): entry is RawChangelogEntry => Boolean(entry && typeof entry === 'object'))
    .map(summarizeEntry)
    .filter((entry): entry is PublicChangeEntry => Boolean(entry))
    .sort((a, b) => toTimestamp(b.timestamp) - toTimestamp(a.timestamp))
    .slice(0, Math.max(0, limit));
}

export function readPublicChangelog(filePath: string, limit = 30): PublicChangeEntry[] {
  try {
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8')) as ChangelogPayload;
    return summarizeChangelogPayload(payload, limit);
  } catch {
    return [];
  }
}
