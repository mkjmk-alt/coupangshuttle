import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Force use of Node.js runtime for file system & GitHub API access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GitHub Settings
const OWNER = 'mkjmk-alt';
const REPO = 'coupangshuttle';
const FILE_PATH = 'public/data/shuttle_data.json';
const BRANCH = 'main';

export async function GET() {
  return NextResponse.json({ 
    status: 'API is alive', 
    mode: process.env.GITHUB_TOKEN ? 'GitHub Mode' : 'Local Mode' 
  });
}

export async function POST(request: Request) {
  try {
    const key = request.headers.get('x-editor-key');
    if (key !== 'mkjmkcpstadmin') {
      return NextResponse.json({ success: false, message: 'Unauthorized: 비밀 키가 올바르지 않습니다.' }, { status: 401 });
    }

    // Performance: Read raw text to handle large files efficiently
    const bodyText = await request.text();
    const token = process.env.GITHUB_TOKEN;

    // --- 1. GITHUB API MODE (Used in Production/Web) ---
    // If GITHUB_TOKEN is present, we push the change directly to git repo
    if (token) {
      console.log('[SaveAPI] GitHub Integration Mode active.');
      
      try {
        // Step A: Get the latest file SHA from GitHub (Required for Update)
        const getFileRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'NextJS-DataEditor'
          }
        });
        
        let sha = '';
        if (getFileRes.ok) {
          const fileInfo = await getFileRes.json();
          sha = fileInfo.sha;
        } else if (getFileRes.status !== 404) {
          const errData = await getFileRes.json();
          throw new Error(`GitHub GET Error: ${errData.message}`);
        }

        // Step B: Encode to Base64 (GitHub requirement)
        // 16MB -> ~22MB Base64. Ensure environment has enough RAM.
        const contentBase64 = Buffer.from(bodyText).toString('base64');
        
        // Step C: Create/Update file on GitHub
        const commitRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'NextJS-DataEditor'
          },
          body: JSON.stringify({
            message: '📝 Update shuttle_data.json via Web Editor',
            content: contentBase64,
            sha: sha,
            branch: BRANCH,
          })
        });

        const commitData = await commitRes.json();
        
        if (commitRes.ok) {
          console.log('[SaveAPI] GitHub Commit Success!');
          return NextResponse.json({ 
            success: true, 
            message: '🎉 깃허브 저장소에 직접 저장되었습니다. (수분 내에 주소창 정보가 최신화됩니다)' 
          });
        } else {
          throw new Error(`GitHub Commit Error: ${commitData.message}`);
        }
      } catch (ghError: any) {
        console.error('[SaveAPI] GitHub Error:', ghError);
        return NextResponse.json({ success: false, message: `깃허브 연동 실패: ${ghError.message}` }, { status: 502 });
      }
    }

    // --- 2. LOCAL FILE SYSTEM MODE (Used in Development) ---
    console.log('[SaveAPI] Local FS Mode active.');
    const filePath = path.join(process.cwd(), 'public', 'data', 'shuttle_data.json');
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, bodyText, 'utf-8');
    
    const sizeMB = (bodyText.length / 1024 / 1024).toFixed(2);
    console.log(`[SaveAPI] Saved ${sizeMB} MB to local disk.`);
    
    return NextResponse.json({ 
        success: true, 
        message: `로컬 컴퓨터에 저장되었습니다. (${sizeMB}MB)` 
    });

  } catch (error: any) {
    console.error('[SaveAPI] Fatal Error:', error);
    return NextResponse.json(
      { success: false, message: `Critical Runtime Error: ${error.message}` },
      { status: 500 }
    );
  }
}
