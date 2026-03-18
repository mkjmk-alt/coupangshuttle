import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const key = request.headers.get('x-editor-key');
    if (key !== 'mkjmkcpstadmin') {
      return NextResponse.json({ success: false, message: 'Unauthorized (비밀 키가 올바르지 않습니다)' }, { status: 401 });
    }

    // Use .text() for large body as .json() might have internal limits or fail mid-stream
    const bodyText = await request.text();
    if (!bodyText) {
      return NextResponse.json({ success: false, message: 'Request body is empty' }, { status: 400 });
    }

    const data = JSON.parse(bodyText);
    const filePath = path.join(process.cwd(), 'public', 'data', 'shuttle_data.json');
    
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file - using JSON.stringify with indent 2 makes it very large but easy to read (16MB+)
    // If memory is tight, stringify can be slow
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`Successfully saved ${bodyText.length} bytes to ${filePath}`);
    return NextResponse.json({ success: true, message: 'Data saved successfully' });
  } catch (error: any) {
    console.error('Error saving shuttle data:', error);
    return NextResponse.json(
      { success: false, message: `Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}

// Next.js App Router does not support exports named `config` for body parser limits.
// It relies on the runtime (e.g. Vercel, Node.js stand-alone) limits.
// For local execution, it should be high by default in Node, but let's be careful.
