import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// This API must run in Node.js runtime, not Edge, to use child_process
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (key !== 'mkjmkcpstadmin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Paths
  const pythonExe = 'C:\\Users\\JEONG\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
  const extractorPath = 'c:\\Users\\JEONG\\.gemini\\antigravity\\scratch\\CoupangShuttleTool\\shuttle_extractor_gui.py';
  const cwd = 'c:\\Users\\JEONG\\.gemini\\antigravity\\scratch\\CoupangShuttleTool';

  // We will run the python script with a special flag --no-gui if we can, 
  // but for now, let's assume we can trigger a specific function.
  // Actually, let's modify the GUI script to support a --cli mode.

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // We run the python script with the new CLI flags.
      const child = spawn(pythonExe, [extractorPath, '--cli', '--extract-all', '--deploy'], {
        cwd: cwd,
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: trimmed })}\n\n`));
          }
        }
      });

      child.stderr.on('data', (data) => {
        const trimmed = data.toString().trim();
        if (trimmed) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: `⚠️ ${trimmed}` })}\n\n`));
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: '✅ All processes finished successfully.', done: true })}\n\n`));
        } else {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: `❌ Process failed with code ${code}`, done: true })}\n\n`));
        }
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
}
