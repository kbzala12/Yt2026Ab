
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

interface User {
  id: string;
  username: string;
  coins: number;
}

export async function GET() {
  const dataDir = path.join(process.cwd(), 'data');
  const usersFilePath = path.join(dataDir, 'users.json');
  try {
    const fileContent = await fs.readFile(usersFilePath, 'utf-8');
    const users = JSON.parse(fileContent) as User[];
    // Ensure we don't expose sensitive data, even if it's not currently there
    const safeUsers = users.map(({ id, username, coins }) => ({ id, username, coins }));
    return NextResponse.json(safeUsers);
  } catch (error) {
    return NextResponse.json([]);
  }
}
