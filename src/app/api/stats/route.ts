import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

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

// GET /api/stats - статистика
export async function GET() {
  try {
    const files = await fs.readdir(DATA_DIR);
    const jobFiles = files.filter(file => file.endsWith('-jobs.json'));
    
    const stats = {
      lastUpdated: null as string | null,
      sources: [] as any[],
      totalJobs: 0
    };
    
    for (const file of jobFiles) {
      const data = await readJsonFile(file);
      if (data) {
        stats.sources.push({
          name: data.source,
          count: data.count,
          lastUpdated: data.lastUpdated
        });
        stats.totalJobs += data.count;
        
        if (!stats.lastUpdated || new Date(data.lastUpdated) > new Date(stats.lastUpdated)) {
          stats.lastUpdated = data.lastUpdated;
        }
      }
    }
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
