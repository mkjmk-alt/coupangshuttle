import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Force use of Node.js runtime for file system access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: 'API is alive', message: 'Use POST to save data' });
}

export async function POST(request: Request) {
  try {
    const key = request.headers.get('x-editor-key');
    if (key !== 'mkjmkcpstadmin') {
      return NextResponse.json({ success: false, message: 'Unauthorized: 비밀 키가 올바르지 않거나 없습니다.' }, { status: 401 });
    }

    // Read the text stream directly. More memory-robust for huge 16MB+ strings.
    const bodyText = await request.text();
    
    if (!bodyText || bodyText.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'Empty JSON body' }, { status: 400 });
    }

    // Basic validity check (should start with { and end with })
    const trimmed = bodyText.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      return NextResponse.json({ success: false, message: 'Invalid JSON structure (must start with { and end with })' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'data', 'shuttle_data.json');
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Atomic / Direct write using text format.
    // This removes the JSON.parse/stringify overhead which causes 413 or memory spikes
    fs.writeFileSync(filePath, bodyText, 'utf-8');
    
    const sizeMB = (bodyText.length / 1024 / 1024).toFixed(2);
    console.log(`[SaveAPI] Saved ${sizeMB} MB to ${filePath}`);
    
    return NextResponse.json({ success: true, message: `Data saved successfully (${sizeMB}MB)` });
  } catch (error: any) {
    console.error('[SaveAPI] Critical error:', error);
    return NextResponse.json(
      { success: false, message: `Server Runtime Error: ${error.message}` },
      { status: 500 }
    );
  }
}
