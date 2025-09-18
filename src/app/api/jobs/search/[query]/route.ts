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

// GET /api/jobs/search/[query] - поиск вакансий
export async function GET(
  request: Request,
  { params }: { params: { query: string } }
) {
  try {
    const { query } = params;
    const data = await readJsonFile('all-jobs.json');
    
    if (!data) {
      return NextResponse.json({ error: 'No jobs data found' }, { status: 404 });
    }
    
    const filteredJobs = data.jobs.filter((job: any) => 
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.company.toLowerCase().includes(query.toLowerCase())
    );
    
    return NextResponse.json({
      query,
      count: filteredJobs.length,
      jobs: filteredJobs
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
