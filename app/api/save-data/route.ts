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

// Edge-safe base64 encode (UTF-8)
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

// Edge-safe base64 decode
function fromBase64(b64: string): string {
  try {
    const clean = b64.replace(/[\n\r]/g, '');
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', engine: 'v2.0' });
}

export async function POST(request: Request) {
  try {
    const key = request.headers.get('x-editor-key');
    if (key !== 'mkjmkcpstadmin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data, type } = await request.json();
    const token = process.env.GITHUB_TOKEN;
    if (!token) return NextResponse.json({ success: false, message: 'GITHUB_TOKEN 미설정' }, { status: 501 });

    // --- Helper: GitHub에서 파일 읽기 ---
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

    // --- Helper: GitHub에 파일 쓰기 ---
    const pushFile = async (path: string, content: string, message: string) => {
      const getRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      let sha = '';
      if (getRes.ok) sha = (await getRes.json()).sha;

      const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: toBase64(content), sha, branch: BRANCH })
      });
      if (!putRes.ok) {
        const err = await putRes.text();
        throw new Error(`GitHub push failed for ${path}: ${putRes.status} ${err.substring(0, 200)}`);
      }
    };

    // ============================================
    // TYPE: manual — 웹 에디터에서 수정 후 저장
    // 빠르게 shuttle_data.json에 직접 저장 + manual 백업
    // ============================================
    if (type === 'manual') {
      if (!data) return NextResponse.json({ success: false, message: '데이터가 없습니다' }, { status: 400 });
      const jsonStr = JSON.stringify(data, null, 2);
      // shuttle_data.json에 직접 저장 (지도에 바로 반영)
      await pushFile(DATA_PATH, jsonStr, '📝 Manual edit via Admin Editor');
      // manual 백업도 저장 (나중에 머지할 때 참조용)
      await pushFile(MANUAL_PATH, jsonStr, '💾 Backup manual edit');
      return NextResponse.json({ success: true, message: '저장 완료! 지도에 곧 반영됩니다.' });
    }

    // ============================================
    // TYPE: extracted — 파이썬 추출 도구에서 새 데이터 전송
    // update 파일 저장 후 머지 실행
    // ============================================
    if (type === 'extracted') {
      if (!data) return NextResponse.json({ success: false, message: '추출 데이터가 없습니다' }, { status: 400 });
      await pushFile(UPDATE_FILE, JSON.stringify(data, null, 2), '🔄 New extraction data');
    }

    // ============================================
    // TYPE: merge 또는 extracted 이후 — 머지 엔진 실행
    // ============================================
    const [base, update, manual] = await Promise.all([
      fetchFile(BASE_PATH),
      fetchFile(UPDATE_FILE),
      fetchFile(MANUAL_PATH)
    ]);

    // 머지할 데이터가 없으면 스킵
    if (Object.keys(update).length === 0 && Object.keys(base).length === 0) {
      return NextResponse.json({ success: true, message: '머지할 데이터가 없습니다. 먼저 데이터를 추출해주세요.' });
    }

    // 3-layer 머지 엔진
    const getStopKey = (s: any) => `${s.Order}_${s.Name}`;
    const mergedData: any = {};
    const allFCs = new Set([...Object.keys(base), ...Object.keys(update)]);

    for (const fc of allFCs) {
      const uFC = update[fc] || {};
      const bFC = base[fc] || {};
      const mFC = manual[fc] || {};
      if (!uFC.shifts && !bFC.shifts) continue;

      const finalCenter = JSON.stringify(uFC.center) !== JSON.stringify(bFC.center)
        ? uFC.center : (mFC.center || uFC.center);

      const finalShifts: any = {};
      const uShifts = uFC.shifts || {};
      const bShifts = bFC.shifts || {};
      const mShifts = mFC.shifts || {};

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

    await pushFile(DATA_PATH, JSON.stringify(mergedData, null, 2), '🚀 Auto-merged data');

    if (type === 'extracted') {
      await pushFile(BASE_PATH, JSON.stringify(update, null, 2), '🔄 Updated base backup');
    }

    return NextResponse.json({ success: true, message: '머지 완료!' });

  } catch (error: any) {
    console.error('[SaveAPI] Error:', error);
    return NextResponse.json({ success: false, message: `오류: ${error.message}` }, { status: 500 });
  }
}
