
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

interface Submission {
  id: string;
  videoUrl: string;
  title: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
}

export async function GET() {
  const dataDir = path.join(process.cwd(), 'data');
  const submissionsFilePath = path.join(dataDir, 'submissions.json');
  try {
    const fileContent = await fs.readFile(submissionsFilePath, 'utf-8');
    const submissions = JSON.parse(fileContent) as Submission[];
    // Return submissions in reverse chronological order
    return NextResponse.json(submissions.reverse());
  } catch (error) {
    // If the file doesn't exist or is empty, return an empty array
    return NextResponse.json([]);
  }
}
