import { NextResponse } from 'next/server';

// Edge Runtime is required for Cloudflare Pages with API
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// GitHub Settings
const OWNER = 'mkjmk-alt';
const REPO = 'coupangshuttle';
const DATA_PATH = 'public/data/shuttle_data.json';
const BASE_PATH = 'public/data/shuttle_base.json';
const UPDATE_FILE = 'public/data/shuttle_update.json';
const MANUAL_PATH = 'public/data/shuttle_manual.json';
const BRANCH = 'main';

export async function GET() {
  return NextResponse.json({ 
    status: 'Sync Logic Active', 
    engine: 'Python-Parity Merger v1.0'
  });
}

export async function POST(request: Request) {
  try {
    const key = request.headers.get('x-editor-key');
    if (key !== 'mkjmkcpstadmin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data, type } = await request.json(); // type: 'manual' | 'extracted' | 'merge'
    const token = process.env.GITHUB_TOKEN;

    if (!token) return NextResponse.json({ success: false, message: 'No GitHub Token' }, { status: 501 });

    const fetchFile = async (path: string) => {
        const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (!res.ok) return {};
        const json = await res.json();
        return JSON.parse(Buffer.from(json.content, 'base64').toString('utf8'));
    };

    const pushFile = async (path: string, content: string, message: string) => {
        const getRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        let sha = '';
        if (getRes.ok) sha = (await getRes.json()).sha;

        await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                content: Buffer.from(content).toString('base64'),
                sha,
                branch: BRANCH
            })
        });
    };

    // 1. 저장 요청 처리 (type이 'merge'가 아닐 때만 실행)
    if (type !== 'merge' && data) {
        const targetPath = type === 'extracted' ? UPDATE_FILE : MANUAL_PATH;
        await pushFile(targetPath, JSON.stringify(data, null, 2), `Update ${type} data via API`);
    }

    // 2. 모든 데이터 로드 (Parity with Python script)
    const [base, update, manual] = await Promise.all([
        fetchFile(BASE_PATH),
        fetchFile(UPDATE_FILE),
        fetchFile(MANUAL_PATH)
    ]);

    // 3. 머지 엔진 (shuttle_merger.py 논리 복제)
    const getStopKey = (s: any) => `${s.Order}_${s.Name}`;
    const mergedData: any = {};
    const allFCs = new Set([...Object.keys(base), ...Object.keys(update)]);

    for (const fc of allFCs) {
        const uFC = update[fc] || {};
        const bFC = base[fc] || {};
        const mFC = manual[fc] || {};

        if (!uFC.shifts && !bFC.shifts) continue;

        // Center info merge
        const finalCenter = JSON.stringify(uFC.center) !== JSON.stringify(bFC.center) ? uFC.center : (mFC.center || uFC.center);

        const finalShifts: any = {};
        const uShifts = uFC.shifts || {};
        const bShifts = bFC.shifts || {};
        const mShifts = mFC.shifts || {};

        for (const shift of Object.keys(uShifts)) {
            const finalRoutes: any = {};
            const uRoutes = uShifts[shift] || {};
            const bRoutes = bShifts[shift] || {};
            const mRoutes = mShifts[shift] || {};

            for (const route of Object.keys(uRoutes)) {
                const uStops = uRoutes[route] || [];
                const bStops = bRoutes[route] || [];
                const mStops = mRoutes[route] || [];

                // Stop level merge logic
                const bDict = Object.fromEntries(bStops.map((s: any) => [getStopKey(s), s]));
                const mDict = Object.fromEntries(mStops.map((s: any) => [getStopKey(s), s]));

                finalRoutes[route] = uStops.map((s: any) => {
                    const key = getStopKey(s);
                    const bMatch = bDict[key];
                    const mMatch = mDict[key];

                    if (JSON.stringify(bMatch) !== JSON.stringify(s)) return s; // [1순위] 공식 업데이트
                    if (mMatch) return mMatch; // [2순위] 수동 수정
                    return s; // [3순위] 유지
                });
            }
            finalShifts[shift] = finalRoutes;
        }

        mergedData[fc] = {
            code: fc,
            center: finalCenter,
            shifts: finalShifts
        };
    }

    // 4. 최종 파일 업데이트
    await pushFile(DATA_PATH, JSON.stringify(mergedData, null, 2), "🚀 Auto-merged final data (Python-parity)");
    
    if (type === 'extracted') {
        await pushFile(BASE_PATH, JSON.stringify(update, null, 2), "🔄 Updated backup base");
    }

    return NextResponse.json({ success: true, message: 'Merge complete!' });

      } catch (ghError: any) {
        console.error('[SaveAPI] GitHub Error:', ghError);
        return NextResponse.json({ success: false, message: `깃허브 연동 실패: ${ghError.message}` }, { status: 502 });
      }
    }

    // --- 2. LOCAL FILE SYSTEM MODE (Disabled on Edge) ---
    console.warn('[SaveAPI] Local FS Mode is disabled in this environment.');
    return NextResponse.json({ 
        success: false, 
        message: '저장 실패: 클라우드 환경에서는 깃허브 토큰이 활성화되어야 합니다.'
    }, { status: 501 });

  } catch (error: any) {
    console.error('[SaveAPI] Fatal Error:', error);
    return NextResponse.json(
      { success: false, message: `Critical Runtime Error: ${error.message}` },
      { status: 500 }
    );
  }
}
