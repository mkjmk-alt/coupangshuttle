import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const OWNER = 'mkjmk-alt';
const REPO = 'coupangshuttle';
const DATA_PATH = 'public/data/shuttle_data.json';
const BASE_PATH = 'public/data/shuttle_base.json';
const UPDATE_PATH = 'public/data/shuttle_update.json';
const MANUAL_PATH = 'public/data/shuttle_manual.json';
const META_PATH = 'public/data/shuttle_meta.json';
const CHANGELOG_PATH = 'public/data/shuttle_changelog.json';
const BRANCH = 'main';
const MAX_PATCHES = 100;
const MAX_STOPS_PER_ROUTE = 1_000;
const MAX_CHANGE_LOG_ENTRIES = 100;

type JsonObject = Record<string, unknown>;
type Stop = JsonObject & {
  Order?: string | number;
  Name?: string;
};

interface CenterData extends JsonObject {
  name?: string;
  address?: string;
  lat?: string | number;
  lng?: string | number;
}

interface FcData extends JsonObject {
  code?: string;
  center?: CenterData;
  shifts?: Record<string, Record<string, Stop[]>>;
}

type ShuttleData = Record<string, FcData>;

interface ShuttleMetadata extends JsonObject {
  lastUpdated?: string | null;
  lastAutoDeploy?: string | null;
  lastManualChange?: string | null;
}

interface ChangeStats extends JsonObject {
  centersAdded: number;
  centersRemoved: number;
  centersChanged: number;
  routesAdded: number;
  routesRemoved: number;
  routesChanged: number;
  stopsAdded: number;
  stopsRemoved: number;
  stopsChanged: number;
}

interface AffectedRoute extends JsonObject {
  fc: string;
  shift: string;
  route: string;
  change: 'added' | 'removed' | 'changed';
}

interface ChangeLogEntry extends JsonObject {
  id: string;
  timestamp: string;
  source: 'automatic' | 'manual';
  action: 'auto_deploy' | 'manual_save' | 'manual_merge';
  summary: string;
  stats: ChangeStats;
  affectedCenters: string[];
  affectedRoutes: AffectedRoute[];
}

interface ChangeLogFile extends JsonObject {
  entries: ChangeLogEntry[];
}

interface RoutePatch {
  fc: string;
  shift: string;
  route: string;
  stops: Stop[];
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStop(value: unknown): value is Stop {
  if (!isObject(value)) return false;
  return (
    typeof value['Center (EN)'] === 'string' &&
    typeof value.Shift === 'string' &&
    typeof value['Route Name'] === 'string' &&
    typeof value.Order === 'number' &&
    Number.isInteger(value.Order) &&
    value.Order > 0 &&
    typeof value.Type === 'string' &&
    typeof value.Time === 'string' &&
    /^\d{2}:\d{2}$/.test(value.Time) &&
    typeof value.Name === 'string' &&
    typeof value.Address === 'string' &&
    typeof value.Latitude === 'string' &&
    Number.isFinite(Number(value.Latitude)) &&
    typeof value.Longitude === 'string' &&
    Number.isFinite(Number(value.Longitude))
  );
}

function parseRoutePatches(value: unknown): RoutePatch[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_PATCHES) {
    return null;
  }

  const patches: RoutePatch[] = [];
  for (const item of value) {
    if (!isObject(item)) return null;

    const { fc, shift, route, stops } = item;
    if (
      typeof fc !== 'string' ||
      typeof shift !== 'string' ||
      typeof route !== 'string' ||
      !fc.trim() ||
      !shift.trim() ||
      !route.trim() ||
      fc.length > 100 ||
      shift.length > 100 ||
      route.length > 200 ||
      !Array.isArray(stops) ||
      stops.length > MAX_STOPS_PER_ROUTE ||
      !stops.every(isStop)
    ) {
      return null;
    }

    if (
      !stops.every((stop, index) =>
        stop['Center (EN)'] === fc &&
        stop.Shift === shift &&
        stop['Route Name'] === route &&
        stop.Order === index + 1,
      )
    ) {
      return null;
    }

    patches.push({ fc, shift, route, stops });
  }

  return patches;
}

function secretsMatch(provided: string, expected: string): boolean {
  const encoder = new TextEncoder();
  const providedBytes = encoder.encode(provided);
  const expectedBytes = encoder.encode(expected);
  if (providedBytes.length !== expectedBytes.length) return false;

  let difference = 0;
  for (let index = 0; index < expectedBytes.length; index += 1) {
    difference |= providedBytes[index] ^ expectedBytes[index];
  }
  return difference === 0;
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const parts: string[] = [];
  const chunkSize = 32_768;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    parts.push(
      String.fromCharCode(...bytes.subarray(index, index + chunkSize)),
    );
  }
  return btoa(parts.join(''));
}

function cloneStops(stops: Stop[]): Stop[] {
  return structuredClone(stops);
}

function jsonEquals(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getStopKey(stop: Stop): string {
  return `${String(stop.Order ?? '')}_${stop.Name ?? ''}`;
}

function applyRoutePatches(target: ShuttleData, source: ShuttleData, patches: RoutePatch[]) {
  for (const patch of patches) {
    const sourceFc = source[patch.fc];
    const sourceRoute = sourceFc?.shifts?.[patch.shift]?.[patch.route];
    if (!sourceFc || !sourceRoute) {
      throw new Error(`존재하지 않는 노선입니다: ${patch.fc}/${patch.shift}/${patch.route}`);
    }

    const targetFc = target[patch.fc] ?? {
      code: sourceFc.code ?? patch.fc,
      center: structuredClone(sourceFc.center ?? {}),
      shifts: {},
    };
    targetFc.shifts ??= {};
    targetFc.shifts[patch.shift] ??= {};
    targetFc.shifts[patch.shift][patch.route] = cloneStops(patch.stops);
    target[patch.fc] = targetFc;
  }
}

function mergeData(base: ShuttleData, update: ShuttleData, manual: ShuttleData): ShuttleData {
  const mergedData: ShuttleData = {};

  for (const [fc, updateFc] of Object.entries(update)) {
    const baseFc = base[fc] ?? {};
    const manualFc = manual[fc] ?? {};
    const updateCenter = updateFc.center ?? {};
    const baseCenter = baseFc.center ?? {};
    const manualCenter = manualFc.center ?? {};
    const finalCenter = !jsonEquals(updateCenter, baseCenter)
      ? updateCenter
      : (Object.keys(manualCenter).length > 0 ? manualCenter : updateCenter);

    const finalShifts: Record<string, Record<string, Stop[]>> = {};
    const updateShifts = updateFc.shifts ?? {};
    const baseShifts = baseFc.shifts ?? {};
    const manualShifts = manualFc.shifts ?? {};

    for (const [shift, updateRoutes] of Object.entries(updateShifts)) {
      const finalRoutes: Record<string, Stop[]> = {};
      for (const [route, updateStops] of Object.entries(updateRoutes)) {
        const baseStops = baseShifts[shift]?.[route] ?? [];
        const manualStops = manualShifts[shift]?.[route] ?? [];
        const baseByKey = new Map(baseStops.map((stop) => [getStopKey(stop), stop]));
        const manualByKey = new Map(manualStops.map((stop) => [getStopKey(stop), stop]));

        finalRoutes[route] = updateStops.map((stop) => {
          const key = getStopKey(stop);
          if (!jsonEquals(baseByKey.get(key), stop)) return stop;
          return manualByKey.get(key) ?? stop;
        });
      }
      finalShifts[shift] = finalRoutes;
    }

    mergedData[fc] = {
      code: fc,
      center: structuredClone(finalCenter),
      shifts: finalShifts,
    };
  }

  return mergedData;
}

function emptyChangeStats(): ChangeStats {
  return {
    centersAdded: 0,
    centersRemoved: 0,
    centersChanged: 0,
    routesAdded: 0,
    routesRemoved: 0,
    routesChanged: 0,
    stopsAdded: 0,
    stopsRemoved: 0,
    stopsChanged: 0,
  };
}

function countStopChanges(beforeStops: Stop[], afterStops: Stop[], stats: ChangeStats) {
  const beforeByKey = new Map(beforeStops.map((stop) => [getStopKey(stop), stop]));
  const afterByKey = new Map(afterStops.map((stop) => [getStopKey(stop), stop]));
  const stopKeys = new Set([...beforeByKey.keys(), ...afterByKey.keys()]);

  for (const key of stopKeys) {
    const beforeStop = beforeByKey.get(key);
    const afterStop = afterByKey.get(key);
    if (!beforeStop && afterStop) {
      stats.stopsAdded += 1;
    } else if (beforeStop && !afterStop) {
      stats.stopsRemoved += 1;
    } else if (!jsonEquals(beforeStop, afterStop)) {
      stats.stopsChanged += 1;
    }
  }
}

function summarizeDataChanges(before: ShuttleData, after: ShuttleData) {
  const stats = emptyChangeStats();
  const affectedCenters = new Set<string>();
  const affectedRoutes: AffectedRoute[] = [];
  const centerCodes = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const fc of centerCodes) {
    const beforeFc = before[fc];
    const afterFc = after[fc];
    if (!beforeFc && afterFc) {
      stats.centersAdded += 1;
      affectedCenters.add(fc);
    } else if (beforeFc && !afterFc) {
      stats.centersRemoved += 1;
      affectedCenters.add(fc);
    } else if (!jsonEquals(beforeFc?.center ?? {}, afterFc?.center ?? {})) {
      stats.centersChanged += 1;
      affectedCenters.add(fc);
    }

    const beforeShifts = beforeFc?.shifts ?? {};
    const afterShifts = afterFc?.shifts ?? {};
    const shifts = new Set([...Object.keys(beforeShifts), ...Object.keys(afterShifts)]);

    for (const shift of shifts) {
      const beforeRoutes = beforeShifts[shift] ?? {};
      const afterRoutes = afterShifts[shift] ?? {};
      const routeNames = new Set([...Object.keys(beforeRoutes), ...Object.keys(afterRoutes)]);

      for (const route of routeNames) {
        const beforeStops = beforeRoutes[route];
        const afterStops = afterRoutes[route];
        let change: AffectedRoute['change'] | null = null;

        if (!beforeStops && afterStops) {
          stats.routesAdded += 1;
          change = 'added';
        } else if (beforeStops && !afterStops) {
          stats.routesRemoved += 1;
          change = 'removed';
        } else if (!jsonEquals(beforeStops, afterStops)) {
          stats.routesChanged += 1;
          change = 'changed';
        }

        if (change) {
          affectedCenters.add(fc);
          if (affectedRoutes.length < 100) {
            affectedRoutes.push({ fc, shift, route, change });
          }
          countStopChanges(beforeStops ?? [], afterStops ?? [], stats);
        }
      }
    }
  }

  const centerCount = stats.centersAdded + stats.centersRemoved + stats.centersChanged;
  const routeCount = stats.routesAdded + stats.routesRemoved + stats.routesChanged;
  const stopCount = stats.stopsAdded + stats.stopsRemoved + stats.stopsChanged;
  const summaryParts: string[] = [];
  if (centerCount > 0) summaryParts.push(`센터 ${centerCount}개`);
  if (routeCount > 0) summaryParts.push(`노선 ${routeCount}개`);
  if (stopCount > 0) summaryParts.push(`정류장 ${stopCount}개`);

  return {
    stats,
    affectedCenters: [...affectedCenters].sort(),
    affectedRoutes,
    summary: summaryParts.length > 0
      ? `${summaryParts.join(' · ')} 변경`
      : '데이터 변경 없음',
  };
}

function buildChangeLogEntry(
  source: ChangeLogEntry['source'],
  action: ChangeLogEntry['action'],
  timestamp: string,
  before: ShuttleData,
  after: ShuttleData,
): ChangeLogEntry {
  const changes = summarizeDataChanges(before, after);
  return {
    id: crypto.randomUUID(),
    timestamp,
    source,
    action,
    summary: changes.summary,
    stats: changes.stats,
    affectedCenters: changes.affectedCenters,
    affectedRoutes: changes.affectedRoutes,
  };
}

function kstTimestamp(): string {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date()).replace('T', ' ');
}

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function fetchFile(path: string, token: string, allowMissing = false): Promise<ShuttleData> {
  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    {
      headers: {
        ...githubHeaders(token),
        Accept: 'application/vnd.github.raw+json',
      },
      cache: 'no-store',
    },
  );

  if (allowMissing && response.status === 404) return {};
  if (!response.ok) {
    throw new Error(`GitHub 파일 읽기 실패 (${path}, HTTP ${response.status})`);
  }

  const parsed: unknown = JSON.parse(await response.text());
  if (!isObject(parsed)) {
    throw new Error(`JSON 루트 형식 오류: ${path}`);
  }
  return parsed as ShuttleData;
}

async function getSha(path: string, token: string): Promise<string | undefined> {
  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: githubHeaders(token), cache: 'no-store' },
  );
  if (response.status === 404) return undefined;
  if (!response.ok) {
    throw new Error(`GitHub SHA 조회 실패 (${path}, HTTP ${response.status})`);
  }

  const payload: unknown = await response.json();
  if (!isObject(payload) || typeof payload.sha !== 'string') {
    throw new Error(`GitHub SHA 응답 형식 오류: ${path}`);
  }
  return payload.sha;
}

async function pushJson(path: string, data: JsonObject, message: string, token: string) {
  const sha = await getSha(path, token);
  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: githubHeaders(token),
      body: JSON.stringify({
        message,
        content: encodeBase64(JSON.stringify(data, null, 2)),
        sha,
        branch: BRANCH,
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    console.error(`[SaveAPI] GitHub write failed for ${path}:`, details.slice(0, 500));
    throw new Error(`GitHub 파일 쓰기 실패 (${path}, HTTP ${response.status})`);
  }
}

async function fetchMetadata(token: string): Promise<ShuttleMetadata> {
  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${META_PATH}?ref=${BRANCH}`,
    {
      headers: {
        ...githubHeaders(token),
        Accept: 'application/vnd.github.raw+json',
      },
      cache: 'no-store',
    },
  );

  if (response.status === 404) return {};
  if (!response.ok) {
    throw new Error(`메타데이터 읽기 실패 (HTTP ${response.status})`);
  }

  const parsed: unknown = JSON.parse(await response.text());
  if (!isObject(parsed)) {
    throw new Error('메타데이터 JSON 형식이 올바르지 않습니다.');
  }
  return parsed as ShuttleMetadata;
}

async function fetchChangeLog(token: string): Promise<ChangeLogFile> {
  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${CHANGELOG_PATH}?ref=${BRANCH}`,
    {
      headers: {
        ...githubHeaders(token),
        Accept: 'application/vnd.github.raw+json',
      },
      cache: 'no-store',
    },
  );

  if (response.status === 404) return { entries: [] };
  if (!response.ok) {
    throw new Error(`변경 로그 읽기 실패 (HTTP ${response.status})`);
  }

  const parsed: unknown = JSON.parse(await response.text());
  if (!isObject(parsed) || !Array.isArray(parsed.entries)) {
    throw new Error('변경 로그 JSON 형식이 올바르지 않습니다.');
  }
  return { entries: parsed.entries as ChangeLogEntry[] };
}

async function pushChangeLog(token: string, entry: ChangeLogEntry) {
  const current = await fetchChangeLog(token);
  const changeLog: ChangeLogFile = {
    entries: [entry, ...current.entries].slice(0, MAX_CHANGE_LOG_ENTRIES),
  };
  await pushJson(
    CHANGELOG_PATH,
    changeLog,
    `Record ${entry.action} change log`,
    token,
  );
}

async function pushMetadata(token: string, timestamp: string): Promise<ShuttleMetadata> {
  const current = await fetchMetadata(token);
  const metadata: ShuttleMetadata = {
    ...current,
    lastUpdated: timestamp,
    lastAutoDeploy:
      current.lastAutoDeploy ?? current.lastUpdated ?? null,
    lastManualChange: timestamp,
  };

  await pushJson(
    META_PATH,
    metadata,
    'Update manual change timestamp',
    token,
  );
  return metadata;
}

export async function GET() {
  return NextResponse.json({ status: 'ok', engine: 'v4.0' });
}

export async function POST(request: Request) {
  try {
    const editorKey = process.env.EDITOR_KEY;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!editorKey || !githubToken) {
      return NextResponse.json(
        { success: false, message: '서버 환경 변수가 설정되지 않았습니다.' },
        { status: 503 },
      );
    }

    const providedKey = request.headers.get('x-editor-key') ?? '';
    if (!secretsMatch(providedKey, editorKey)) {
      return NextResponse.json(
        { success: false, message: '인증에 실패했습니다.' },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();
    if (!isObject(body) || typeof body.type !== 'string') {
      return NextResponse.json(
        { success: false, message: '잘못된 요청입니다.' },
        { status: 400 },
      );
    }

    if (body.type === 'verify') {
      return NextResponse.json({ success: true });
    }

    if (body.type === 'manual') {
      const patches = parseRoutePatches(body.changes);
      if (!patches) {
        return NextResponse.json(
          { success: false, message: '저장할 노선 변경분이 올바르지 않습니다.' },
          { status: 400 },
        );
      }

      const [current, manual] = await Promise.all([
        fetchFile(DATA_PATH, githubToken),
        fetchFile(MANUAL_PATH, githubToken, true),
      ]);

      const before = structuredClone(current);
      applyRoutePatches(current, current, patches);
      applyRoutePatches(manual, current, patches);
      const timestamp = kstTimestamp();
      const changeLogEntry = buildChangeLogEntry(
        'manual',
        'manual_save',
        timestamp,
        before,
        current,
      );

      // 수동 보정본을 먼저 저장해 다음 자동 병합에서도 수정값이 유지되게 한다.
      await pushJson(MANUAL_PATH, manual, '📝 Update manual shuttle overrides', githubToken);
      await pushJson(DATA_PATH, current, '📝 Manual edit via Admin Editor', githubToken);
      const metadata = await pushMetadata(githubToken, timestamp);
      await pushChangeLog(githubToken, changeLogEntry);

      return NextResponse.json({
        success: true,
        message: `${patches.length}개 노선을 저장했습니다.`,
        metadata,
        changeLogEntry,
      });
    }

    if (body.type === 'merge') {
      const [base, update, manual, current] = await Promise.all([
        fetchFile(BASE_PATH, githubToken),
        fetchFile(UPDATE_PATH, githubToken),
        fetchFile(MANUAL_PATH, githubToken, true),
        fetchFile(DATA_PATH, githubToken),
      ]);

      if (Object.keys(update).length === 0) {
        return NextResponse.json(
          { success: false, message: '업데이트 데이터가 비어 있습니다.' },
          { status: 400 },
        );
      }

      const merged = mergeData(base, update, manual);
      const timestamp = kstTimestamp();
      const changeLogEntry = buildChangeLogEntry(
        'manual',
        'manual_merge',
        timestamp,
        current,
        merged,
      );
      await pushJson(DATA_PATH, merged, '🚀 Auto-merged data', githubToken);
      await pushJson(BASE_PATH, update, '🔄 Update official shuttle baseline', githubToken);
      const metadata = await pushMetadata(githubToken, timestamp);
      await pushChangeLog(githubToken, changeLogEntry);

      return NextResponse.json({
        success: true,
        message: '머지 완료!',
        metadata,
        changeLogEntry,
      });
    }

    return NextResponse.json(
      { success: false, message: `알 수 없는 type: ${body.type}` },
      { status: 400 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('[SaveAPI] Error:', error);
    return NextResponse.json(
      { success: false, message: `오류: ${message}` },
      { status: 500 },
    );
  }
}
