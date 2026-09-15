import fs from 'node:fs';
import path from 'node:path';
import {
  collectQualityWarnings,
  summarizeCenter,
  type CenterDataLike,
  type CenterSummary,
} from '@/utils/dataSummary';

const CENTERS_DIR = path.join(process.cwd(), 'public', 'data', 'centers');
const META_PATH = path.join(process.cwd(), 'public', 'data', 'shuttle_meta.json');
const SAFE_CODE = /^[A-Za-z0-9_-]+$/;

export interface DataMetadata {
  lastUpdated?: string;
  lastAutoDeploy?: string;
  lastManualChange?: string | null;
}

export interface CenterDirectoryItem extends CenterSummary {
  region: string;
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

export function readDataMetadata(): DataMetadata {
  return readJsonFile<DataMetadata>(META_PATH) ?? {};
}

export function getCenterCodes(): string[] {
  try {
    return fs
      .readdirSync(CENTERS_DIR)
      .filter((fileName) => fileName.endsWith('.json'))
      .map((fileName) => fileName.slice(0, -5))
      .filter((code) => SAFE_CODE.test(code))
      .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  } catch {
    return [];
  }
}

export function readCenter(code: string): CenterDataLike | null {
  if (!SAFE_CODE.test(code)) return null;
  const data = readJsonFile<CenterDataLike>(path.join(CENTERS_DIR, `${code}.json`));
  if (!data) return null;
  return {
    ...data,
    code: data.code || code,
  };
}

function getRegion(address: string): string {
  return address.split(/\s+/).filter(Boolean).slice(0, 2).join(' ') || '지역 미상';
}

export function getCenterDirectory(): CenterDirectoryItem[] {
  const reviewedAt = readDataMetadata().lastUpdated ?? '';

  return getCenterCodes().flatMap((code) => {
    const data = readCenter(code);
    if (!data) return [];
    const summary = summarizeCenter(data, reviewedAt);
    return [{ ...summary, region: getRegion(summary.address) }];
  });
}

export function getCenterWarnings(code: string) {
  const data = readCenter(code);
  return data ? collectQualityWarnings(data) : [];
}
