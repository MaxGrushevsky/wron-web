import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

// Функция для чтения JSON файлов
async function readJsonFile(filename: string) {
  try {
    const filepath = path.join(DATA_DIR, filename);
    const content = await fs.readFile(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

// GET /api/jobs - все вакансии
export async function GET() {
  try {
    const data = await readJsonFile('all-jobs.json');
    if (!data) {
      return NextResponse.json({ error: 'No jobs data found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
