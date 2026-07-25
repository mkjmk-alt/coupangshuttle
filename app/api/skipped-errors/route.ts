import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const MAX_SKIPPED_ITEMS = 2_000;

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

interface D1DatabaseBinding {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

interface CloudflareEnv {
  SKIP_DB?: D1DatabaseBinding;
}

interface SkippedErrorItem {
  key: string;
  fc: string;
  fcName: string;
  shift: string;
  route: string;
  stopIndex: number;
  stopName: string;
  errorType: 'SPEED' | 'TIME' | 'DISTANCE';
  skippedAt?: string;
}

interface SkippedErrorRow {
  error_key: string;
  fc: string;
  fc_name: string;
  shift_name: string;
  route_name: string;
  stop_index: number;
  stop_name: string;
  error_type: 'SPEED' | 'TIME' | 'DISTANCE';
  skipped_at: string;
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isErrorType(value: unknown): value is SkippedErrorItem['errorType'] {
  return value === 'SPEED' || value === 'TIME' || value === 'DISTANCE';
}

function parseItem(value: unknown): SkippedErrorItem | null {
  if (!isObject(value)) return null;

  const item: SkippedErrorItem = {
    key: typeof value.key === 'string' ? value.key.trim() : '',
    fc: typeof value.fc === 'string' ? value.fc.trim() : '',
    fcName: typeof value.fcName === 'string' ? value.fcName.trim() : '',
    shift: typeof value.shift === 'string' ? value.shift.trim() : '',
    route: typeof value.route === 'string' ? value.route.trim() : '',
    stopIndex:
      typeof value.stopIndex === 'number' && Number.isInteger(value.stopIndex)
        ? value.stopIndex
        : -1,
    stopName: typeof value.stopName === 'string' ? value.stopName.trim() : '',
    errorType: isErrorType(value.errorType) ? value.errorType : 'SPEED',
    skippedAt: typeof value.skippedAt === 'string' ? value.skippedAt : undefined,
  };

  if (
    !item.key ||
    item.key.length > 600 ||
    !item.fc ||
    !item.shift ||
    !item.route ||
    item.stopIndex < 0 ||
    !item.stopName ||
    !isErrorType(value.errorType)
  ) {
    return null;
  }
  return item;
}

function getDatabase(): D1DatabaseBinding | null {
  try {
    return (getRequestContext().env as CloudflareEnv).SKIP_DB ?? null;
  } catch {
    return null;
  }
}

async function ensureSchema(database: D1DatabaseBinding) {
  await database
    .prepare(
      `CREATE TABLE IF NOT EXISTS skipped_errors (
        error_key TEXT PRIMARY KEY,
        fc TEXT NOT NULL,
        fc_name TEXT NOT NULL,
        shift_name TEXT NOT NULL,
        route_name TEXT NOT NULL,
        stop_index INTEGER NOT NULL,
        stop_name TEXT NOT NULL,
        error_type TEXT NOT NULL,
        skipped_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
    )
    .run();

  await database
    .prepare(
      'CREATE INDEX IF NOT EXISTS idx_skipped_errors_skipped_at ON skipped_errors(skipped_at DESC)',
    )
    .run();
}

function authenticate(request: Request): NextResponse | null {
  const editorKey = process.env.EDITOR_KEY;
  if (!editorKey) {
    return NextResponse.json(
      { success: false, message: '서버 편집키가 설정되지 않았습니다.' },
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
  return null;
}

function unavailableResponse() {
  return NextResponse.json(
    {
      success: false,
      message: 'Cloudflare D1 바인딩(SKIP_DB)이 설정되지 않았습니다.',
    },
    { status: 503 },
  );
}

function rowToItem(row: SkippedErrorRow): SkippedErrorItem {
  return {
    key: row.error_key,
    fc: row.fc,
    fcName: row.fc_name,
    shift: row.shift_name,
    route: row.route_name,
    stopIndex: row.stop_index,
    stopName: row.stop_name,
    errorType: row.error_type,
    skippedAt: row.skipped_at,
  };
}

export async function GET(request: Request) {
  const authFailure = authenticate(request);
  if (authFailure) return authFailure;

  const database = getDatabase();
  if (!database) return unavailableResponse();

  try {
    await ensureSchema(database);
    const result = await database
      .prepare(
        `SELECT error_key, fc, fc_name, shift_name, route_name, stop_index,
                stop_name, error_type, skipped_at
         FROM skipped_errors
         ORDER BY skipped_at DESC
         LIMIT ?`,
      )
      .bind(MAX_SKIPPED_ITEMS)
      .all<SkippedErrorRow>();

    return NextResponse.json({
      success: true,
      items: (result.results ?? []).map(rowToItem),
    });
  } catch (error) {
    console.error('Error reading skipped errors from D1:', error);
    return NextResponse.json(
      { success: false, message: '스킵 목록을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authFailure = authenticate(request);
  if (authFailure) return authFailure;

  const database = getDatabase();
  if (!database) return unavailableResponse();

  try {
    await ensureSchema(database);
    const body: unknown = await request.json();
    if (!isObject(body) || typeof body.action !== 'string') {
      return NextResponse.json(
        { success: false, message: '올바르지 않은 요청입니다.' },
        { status: 400 },
      );
    }

    if (body.action === 'skip') {
      const item = parseItem(body.item);
      if (!item) {
        return NextResponse.json(
          { success: false, message: '스킵 항목 정보가 올바르지 않습니다.' },
          { status: 400 },
        );
      }
      const now = new Date().toISOString();
      await database
        .prepare(
          `INSERT INTO skipped_errors (
             error_key, fc, fc_name, shift_name, route_name, stop_index,
             stop_name, error_type, skipped_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(error_key) DO UPDATE SET
             fc = excluded.fc,
             fc_name = excluded.fc_name,
             shift_name = excluded.shift_name,
             route_name = excluded.route_name,
             stop_index = excluded.stop_index,
             stop_name = excluded.stop_name,
             error_type = excluded.error_type,
             updated_at = excluded.updated_at`,
        )
        .bind(
          item.key,
          item.fc,
          item.fcName,
          item.shift,
          item.route,
          item.stopIndex,
          item.stopName,
          item.errorType,
          item.skippedAt ?? now,
          now,
        )
        .run();
      return NextResponse.json({ success: true, item: { ...item, skippedAt: item.skippedAt ?? now } });
    }

    if (body.action === 'import') {
      const values = Array.isArray(body.items) ? body.items.slice(0, MAX_SKIPPED_ITEMS) : [];
      const items = values.map(parseItem).filter((item): item is SkippedErrorItem => item !== null);
      if (values.length !== items.length) {
        return NextResponse.json(
          { success: false, message: '가져올 스킵 항목 일부가 올바르지 않습니다.' },
          { status: 400 },
        );
      }
      if (items.length > 0) {
        const now = new Date().toISOString();
        await database.batch(
          items.map(item =>
            database
              .prepare(
                `INSERT INTO skipped_errors (
                   error_key, fc, fc_name, shift_name, route_name, stop_index,
                   stop_name, error_type, skipped_at, updated_at
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(error_key) DO UPDATE SET updated_at = excluded.updated_at`,
              )
              .bind(
                item.key,
                item.fc,
                item.fcName,
                item.shift,
                item.route,
                item.stopIndex,
                item.stopName,
                item.errorType,
                item.skippedAt ?? now,
                now,
              ),
          ),
        );
      }
      return NextResponse.json({ success: true, imported: items.length });
    }

    if (body.action === 'restore') {
      const keys = Array.isArray(body.keys)
        ? [...new Set(body.keys.filter((key): key is string => typeof key === 'string' && key.length <= 600))]
            .slice(0, MAX_SKIPPED_ITEMS)
        : [];
      if (keys.length === 0) {
        return NextResponse.json(
          { success: false, message: '복원할 스킵 항목을 선택해주세요.' },
          { status: 400 },
        );
      }
      await database.batch(
        keys.map(key =>
          database.prepare('DELETE FROM skipped_errors WHERE error_key = ?').bind(key),
        ),
      );
      return NextResponse.json({ success: true, restored: keys.length });
    }

    if (body.action === 'restore-all') {
      await database.prepare('DELETE FROM skipped_errors').run();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: '지원하지 않는 작업입니다.' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Error updating skipped errors in D1:', error);
    return NextResponse.json(
      { success: false, message: '스킵 상태를 저장하지 못했습니다.' },
      { status: 500 },
    );
  }
}
