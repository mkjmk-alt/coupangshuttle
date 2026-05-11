import { NextResponse } from 'next/server';

// This API must run in Node.js runtime, not Edge, to use child_process
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (key !== 'mkjmkcpstadmin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Check if we are in a real Node.js environment
  // This bypasses Cloudflare's static analysis
  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

  if (!isNode) {
    return new Response(JSON.stringify({ 
      error: '이 기능은 로컬 PC(Node.js) 환경에서만 지원됩니다.',
      isLocal: false 
    }), { status: 400 });
  }

  try {
    // We use eval('require') to hide this from the Cloudflare/Edge bundler
    const { spawn } = eval('require')('child_process');
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const pythonExe = 'C:\\Users\\JEONG\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
        const extractorPath = 'C:\\Users\\JEONG\\.gemini\\antigravity\\scratch\\CoupangShuttleTool\\shuttle_extractor_gui.py';
        const cwd = 'C:\\Users\\JEONG\\.gemini\\antigravity\\scratch\\CoupangShuttleTool';

        const child = spawn(pythonExe, ['-u', extractorPath, '--cli', '--extract-all', '--deploy'], {
          cwd: cwd,
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        });

        child.stdout.on('data', (data: any) => {
          const lines = data.toString().split('\n');
          lines.forEach((line: string) => {
            if (line.trim()) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: line.trim() })}\n\n`));
            }
          });
        });

        child.stderr.on('data', (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: `⚠️ ${data.toString()}` })}\n\n`));
        });

        child.on('close', (code: number) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: `🏁 Process finished with code ${code}`, done: true })}\n\n`));
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Local execution failed: ' + err.message }), { status: 500 });
  }
}
