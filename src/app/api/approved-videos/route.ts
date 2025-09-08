
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

interface ApprovedVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  dataAiHint: string;
}

export async function GET() {
  const dataDir = path.join(process.cwd(), 'data');
  const approvedVideosFilePath = path.join(dataDir, 'approved_videos.json');
  try {
    const fileContent = await fs.readFile(approvedVideosFilePath, 'utf-8');
    const videos = JSON.parse(fileContent) as ApprovedVideo[];
    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json([]);
  }
}
