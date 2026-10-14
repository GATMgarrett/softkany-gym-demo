import { NextResponse } from 'next/server';
import { ensureDatabaseSeeded } from '@/lib/seed';

export async function GET() {
  const result = await ensureDatabaseSeeded();
  return NextResponse.json(result);
}

export async function POST() {
  const result = await ensureDatabaseSeeded();
  return NextResponse.json(result);
}
