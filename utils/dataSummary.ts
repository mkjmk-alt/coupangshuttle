export type RawStopRecord = Record<string, unknown>;

export interface CenterDataLike {
  code?: unknown;
  center?: {
    name?: unknown;
    address?: unknown;
  };
  shifts?: Record<string, Record<string, RawStopRecord[]>>;
}

export type DataFreshnessStatus = 'current' | 'stale' | 'unknown';

export interface DataFreshness {
  status: DataFreshnessStatus;
  reviewedAt: string;
  ageDays: number | null;
  label: string;
}

export type QualityWarningCode =
  | 'missing-name'
  | 'missing-address'
  | 'placeholder'
  | 'invalid-coordinate'
  | 'time-order';

export interface QualityWarning {
  code: QualityWarningCode;
  message: string;
  shift?: string;
  route?: string;
  stopIndex?: number;
}

export interface CenterSummary {
  code: string;
  name: string;
  address: string;
  shiftCount: number;
  routeCount: number;
  stopCount: number;
  warningCount: number;
  freshness: DataFreshness;
}

const PLACEHOLDER_VALUES = new Set(['none', 'null', 'undefined', '미정', '정보 없음']);

function textValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.includes('T')
    ? trimmed
    : trimmed.replace(' ', 'T');
  const iso = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized)
    ? normalized
    : `${normalized}+09:00`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetween(later: Date, earlier: Date): number {
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / 86_400_000));
}

function parseTime(value: unknown): number | null {
  const match = textValue(value).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function isPlaceholder(value: unknown): boolean {
  return PLACEHOLDER_VALUES.has(textValue(value).toLocaleLowerCase('ko-KR'));
}

function hasInvalidCoordinate(stop: RawStopRecord): boolean {
  const latitude = Number(stop.Latitude);
  const longitude = Number(stop.Longitude);
  return (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  );
}

export function getDataFreshness(
  reviewedAt: string,
  now = new Date(),
  maxAgeDays = 30,
): DataFreshness {
  const reviewedDate = parseDate(reviewedAt);
  if (!reviewedDate) {
    return {
      status: 'unknown',
      reviewedAt,
      ageDays: null,
      label: '데이터 확인일을 알 수 없습니다.',
    };
  }

  const ageDays = daysBetween(now, reviewedDate);
  if (ageDays > maxAgeDays) {
    return {
      status: 'stale',
      reviewedAt,
      ageDays,
      label: `마지막 확인 후 ${ageDays}일이 지나 재확인이 필요합니다.`,
    };
  }

  return {
    status: 'current',
    reviewedAt,
    ageDays,
    label: '최근 확인된 데이터입니다. 탑승 전 공식 공지를 확인해 주세요.',
  };
}

export function collectQualityWarnings(data: CenterDataLike): QualityWarning[] {
  const warnings: QualityWarning[] = [];

  for (const [shift, routes] of Object.entries(data.shifts ?? {})) {
    for (const [route, stops] of Object.entries(routes ?? {})) {
      let previousTime: number | null = null;

      stops.forEach((stop, index) => {
        const name = textValue(stop.Name);
        const address = textValue(stop.Address);

        if (!name) {
          warnings.push({ code: 'missing-name', message: '정류장명이 비어 있습니다.', shift, route, stopIndex: index });
        } else if (isPlaceholder(name)) {
          warnings.push({ code: 'placeholder', message: '정류장명에 placeholder가 남아 있습니다.', shift, route, stopIndex: index });
        }

        if (!address) {
          warnings.push({ code: 'missing-address', message: '주소가 비어 있습니다.', shift, route, stopIndex: index });
        } else if (isPlaceholder(address)) {
          warnings.push({ code: 'placeholder', message: '주소에 placeholder가 남아 있습니다.', shift, route, stopIndex: index });
        }

        if (hasInvalidCoordinate(stop)) {
          warnings.push({ code: 'invalid-coordinate', message: '위도 또는 경도가 유효하지 않습니다.', shift, route, stopIndex: index });
        }

        const time = parseTime(stop.Time);
        if (time !== null && previousTime !== null && time < previousTime) {
          warnings.push({ code: 'time-order', message: '같은 노선의 시간이 앞 정류장보다 빠릅니다.', shift, route, stopIndex: index });
        }
        if (time !== null) previousTime = time;
      });
    }
  }

  return warnings;
}

export function summarizeCenter(
  data: CenterDataLike,
  reviewedAt: string,
  now = new Date(),
): CenterSummary {
  const shifts = data.shifts ?? {};
  const routes = Object.values(shifts).flatMap((shiftRoutes) => Object.values(shiftRoutes ?? {}));
  const warnings = collectQualityWarnings(data);

  return {
    code: textValue(data.code),
    name: textValue(data.center?.name) || textValue(data.code) || '이름 없는 센터',
    address: textValue(data.center?.address),
    shiftCount: Object.keys(shifts).length,
    routeCount: routes.length,
    stopCount: routes.reduce((total, stops) => total + stops.length, 0),
    warningCount: warnings.length,
    freshness: getDataFreshness(reviewedAt, now),
  };
}
