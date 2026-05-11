import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const OWNER = 'mkjmk-alt';
const REPO = 'coupangshuttle';
const DATA_PATH = 'public/data/shuttle_data.json';
const BASE_PATH = 'public/data/shuttle_base.json';
const UPDATE_FILE = 'public/data/shuttle_update.json';
const MANUAL_PATH = 'public/data/shuttle_manual.json';
const BRANCH = 'main';

function fromBase64(b64: string): string {
  try {
    const binary = atob(b64.replace(/[\n\r]/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch { return ''; }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', engine: 'v3.0' });
}

export async function POST(request: Request) {
  try {
    const key = request.headers.get('x-editor-key');
    if (key !== 'mkjmkcpstadmin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;
    const token = process.env.GITHUB_TOKEN;
    if (!token) return NextResponse.json({ success: false, message: 'GITHUB_TOKEN 미설정' }, { status: 501 });

    // --- Helper: SHA 가져오기 ---
    const getSha = async (path: string): Promise<string> => {
      const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!res.ok) return '';
      return (await res.json()).sha || '';
    };

    // --- Helper: 파일 쓰기 (base64 content를 직접 받음) ---
    const pushBase64 = async (path: string, b64: string, message: string) => {
      const sha = await getSha(path);
      const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: b64, sha: sha || undefined, branch: BRANCH })
      });
      if (!putRes.ok) {
        const err = await putRes.text();
        throw new Error(`Push failed ${path}: ${putRes.status}`);
      }
    };

    // --- Helper: 파일 읽기 ---
    const fetchFile = async (path: string): Promise<any> => {
      try {
        const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (!res.ok) return {};
        const json = await res.json();
        if (!json.content) return {};
        const text = fromBase64(json.content);
        if (!text.trim()) return {};
        return JSON.parse(text);
      } catch { return {}; }
    };

    // ============================================
    // TYPE: manual — 클라이언트에서 base64 인코딩 완료된 데이터 수신
    // ============================================
    if (type === 'manual') {
      const b64 = body.base64Content;
      if (!b64) return NextResponse.json({ success: false, message: '데이터가 없습니다' }, { status: 400 });
      await pushBase64(DATA_PATH, b64, '📝 Manual edit via Admin Editor');
      return NextResponse.json({ success: true, message: '저장 완료!' });
    }

    // ============================================
    // TYPE: extracted — 파이썬에서 base64 인코딩 완료된 데이터 수신
    // ============================================
    if (type === 'extracted') {
      const b64 = body.base64Content;
      if (!b64) return NextResponse.json({ success: false, message: '데이터 없음' }, { status: 400 });
      await pushBase64(UPDATE_FILE, b64, '🔄 New extraction data');
      // extracted 후 자동 머지는 아래로 이어짐
    }

    // ============================================
    // TYPE: merge 또는 extracted 후속 — 머지 엔진
    // ============================================
    if (type === 'merge' || type === 'extracted') {
      const [base, update, manual] = await Promise.all([
        fetchFile(BASE_PATH), fetchFile(UPDATE_FILE), fetchFile(MANUAL_PATH)
      ]);

      if (Object.keys(update).length === 0 && Object.keys(base).length === 0) {
        return NextResponse.json({ success: true, message: '머지할 데이터가 없습니다.' });
      }

      const getStopKey = (s: any) => `${s.Order}_${s.Name}`;
      const mergedData: any = {};
      const allFCs = new Set([...Object.keys(base), ...Object.keys(update)]);

      for (const fc of allFCs) {
        const uFC = update[fc] || {}, bFC = base[fc] || {}, mFC = manual[fc] || {};
        if (!uFC.shifts && !bFC.shifts) continue;

        const finalCenter = JSON.stringify(uFC.center) !== JSON.stringify(bFC.center)
          ? uFC.center : (mFC.center || uFC.center);

        const finalShifts: any = {};
        const uShifts = uFC.shifts || {}, bShifts = bFC.shifts || {}, mShifts = mFC.shifts || {};

        for (const shift of Object.keys(uShifts)) {
          const finalRoutes: any = {};
          for (const route of Object.keys(uShifts[shift] || {})) {
            const uStops = uShifts[shift][route] || [];
            const bStops = (bShifts[shift] || {})[route] || [];
            const mStops = (mShifts[shift] || {})[route] || [];
            const bDict = Object.fromEntries(bStops.map((s: any) => [getStopKey(s), s]));
            const mDict = Object.fromEntries(mStops.map((s: any) => [getStopKey(s), s]));
            finalRoutes[route] = uStops.map((s: any) => {
              const key = getStopKey(s);
              if (JSON.stringify(bDict[key]) !== JSON.stringify(s)) return s;
              if (mDict[key]) return mDict[key];
              return s;
            });
          }
          finalShifts[shift] = finalRoutes;
        }
        mergedData[fc] = { code: fc, center: finalCenter, shifts: finalShifts };
      }

      // 머지 결과를 base64로 인코딩 (작은 데이터일 때만 여기서 처리)
      const mergeJson = JSON.stringify(mergedData, null, 2);
      const mergeBytes = new TextEncoder().encode(mergeJson);
      const chunkSize = 32768;
      const parts: string[] = [];
      for (let i = 0; i < mergeBytes.length; i += chunkSize) {
        const slice = mergeBytes.subarray(i, i + chunkSize);
        parts.push(String.fromCharCode(...slice));
      }
      const mergeB64 = btoa(parts.join(''));

      await pushBase64(DATA_PATH, mergeB64, '🚀 Auto-merged data');

      if (type === 'extracted') {
        const updateB64 = body.base64Content;
        await pushBase64(BASE_PATH, updateB64, '🔄 Updated base backup');
      }

      return NextResponse.json({ success: true, message: '머지 완료!' });
    }

    return NextResponse.json({ success: false, message: `알 수 없는 type: ${type}` }, { status: 400 });

  } catch (error: any) {
    console.error('[SaveAPI] Error:', error);
    return NextResponse.json({ success: false, message: `오류: ${error.message}` }, { status: 500 });
  }
}
