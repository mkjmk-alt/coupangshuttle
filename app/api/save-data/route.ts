import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const key = request.headers.get('x-editor-key');
    if (key !== 'mkjmkcpstadmin') {
      return NextResponse.json({ success: false, message: 'Unauthorized (Access Denied)' }, { status: 401 });
    }

    // High performance approach: Get raw text stream
    // Using .text() followed by writeFileSync is much more memory efficient than manual JSON parse/stringify cycles
    const bodyText = await request.text();
    
    if (!bodyText || bodyText.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'Empty JSON body' }, { status: 400 });
    }

    // Basic validity check (should start with { and end with })
    if (!bodyText.trim().startsWith('{')) {
      return NextResponse.json({ success: false, message: 'Invalid JSON format received' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'data', 'shuttle_data.json');
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write raw text directly to file. This avoids memory overhead of JSON objects (up to 3x the text size)
    fs.writeFileSync(filePath, bodyText, 'utf-8');
    
    console.log(`[SaveAPI] Saved ${Math.round(bodyText.length / 1024 / 1024 * 100) / 100} MB of data.`);
    
    return NextResponse.json({ success: true, message: 'Data saved successfully' });
  } catch (error: any) {
    console.error('[SaveAPI] Critical error:', error);
    return NextResponse.json(
      { success: false, message: `System Error: ${error.message}` },
      { status: 500 }
    );
  }
}
