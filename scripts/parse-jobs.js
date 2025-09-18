const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Импортируем парсеры
const parsePracuj = require('../parsers/pracuj');
const parseJustJoin = require('../parsers/justjoin');
const parseRocketJobs = require('../parsers/rocketjobs');
const parseGoogle = require('../parsers/google');
const parseAmazon = require('../parsers/amazon');
const parseNoFluffJobs = require('../parsers/nofluffjobs');
const parseLinkedIn = require('../parsers/linkedin');
const parseOlx = require('../parsers/olx');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Создаем директорию для данных
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating data directory:', error);
    }
}

// Сохраняем данные в JSON файл
async function saveJobs(jobs, source) {
    const filename = `${source}-jobs.json`;
    const filepath = path.join(DATA_DIR, filename);
    
    const data = {
        source,
        lastUpdated: new Date().toISOString(),
        count: jobs.length,
        jobs
    };
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    console.log(`Saved ${jobs.length} jobs from ${source} to ${filename}`);
}

// Парсим все сайты и сохраняем в файлы
async function parseAllSites() {
    console.log('🚀 Starting job parsing...');
    await ensureDataDir();
    
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const urls = [
        { 
            url: 'https://www.pracuj.pl/praca/wroclaw;wp?rd=10&et=1,3,17&wm=hybrid,full-office&campaignid=18376894232&adgroupid=144457199267', 
            source: 'pracuj',
            parser: parsePracuj
        },
        { 
            url: 'https://justjoin.it/job-offers/wroclaw?experience-level=junior&orderBy=DESC&sortBy=published', 
            source: 'justjoinit',
            parser: parseJustJoin
        },
        { 
            url: 'https://rocketjobs.pl/oferty-pracy/wroclaw?doswiadczenie=staz-junior&orderBy=DESC&sortBy=published', 
            source: 'rocketJobs',
            parser: parseRocketJobs
        },
        { 
            url: 'https://www.google.com/about/careers/applications/jobs/results?location=Wroclaw%20Poland&target_level=EARLY&target_level=INTERN_AND_APPRENTICE', 
            source: 'google',
            parser: parseGoogle
        },
        { 
            url: 'https://amazon.jobs/en/search?offset=0&result_limit=10&sort=relevant&distanceType=Mi&radius=24km&industry_experience=less_than_1_year&latitude=51.10825&longitude=17.02691&loc_group_id=&loc_query=Wroclaw,%20Lower%20Silesian%20Voivodeship,%20Poland&base_query=&city=Wroclaw&country=POL&region=Lower%20Silesian%20Voivodeship&county=Wroclaw&query_options=&', 
            source: 'amazon',
            parser: parseAmazon
        },
        { 
            url: 'https://nofluffjobs.com/pl/wroclaw?criteria=seniority%3Dtrainee,junior', 
            source: 'nofluffjobs',
            parser: parseNoFluffJobs
        },
        { 
            url: 'https://www.linkedin.com/jobs/search/?currentJobId=4179844273&distance=25&f_E=1,2&f_PP=101832192&geoId=90009834&origin=JOB_SEARCH_PAGE_JOB_FILTER&sortBy=R', 
            source: 'linkedin',
            parser: parseLinkedIn
        },
        { 
            url: 'https://www.olx.pl/praca/wroclaw/?search%5Bdist%5D=2&search%5Bfilter_enum_agreement%5D%5B0%5D=practice', 
            source: 'olx',
            parser: parseOlx
        }
    ];
    
    let totalJobs = 0;
    
    for (const { url, source, parser } of urls) {
        try {
            console.log(`\n📊 Parsing ${source}...`);
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            const jobs = await parser(page);
            
            if (jobs.length > 0) {
                await saveJobs(jobs, source);
                totalJobs += jobs.length;
            } else {
                console.log(`❌ No jobs found for ${source}`);
            }
            
            await page.close();
        } catch (error) {
            console.error(`❌ Error parsing ${source}:`, error.message);
        }
    }
    
    await browser.close();
    
    // Создаем общий файл со всеми вакансиями
    await createCombinedFile();
    
    console.log(`\n🎯 Total jobs parsed: ${totalJobs}`);
    console.log(`📁 Data saved to: ${DATA_DIR}`);
}

// Создаем объединенный файл со всеми вакансиями
async function createCombinedFile() {
    try {
        const files = await fs.readdir(DATA_DIR);
        const jobFiles = files.filter(file => file.endsWith('-jobs.json'));
        
        const allJobs = [];
        let totalCount = 0;
        
        for (const file of jobFiles) {
            const filepath = path.join(DATA_DIR, file);
            const content = await fs.readFile(filepath, 'utf8');
            const data = JSON.parse(content);
            
            allJobs.push(...data.jobs);
            totalCount += data.count;
        }
        
        // Удаляем дубликаты по URL
        const uniqueJobs = allJobs.filter((job, index, self) =>
            index === self.findIndex(j => j.url === job.url)
        );
        
        const combinedData = {
            lastUpdated: new Date().toISOString(),
            totalCount: uniqueJobs.length,
            sources: jobFiles.length,
            jobs: uniqueJobs
        };
        
        const combinedPath = path.join(DATA_DIR, 'all-jobs.json');
        await fs.writeFile(combinedPath, JSON.stringify(combinedData, null, 2));
        
        console.log(`📄 Created combined file with ${uniqueJobs.length} unique jobs`);
    } catch (error) {
        console.error('Error creating combined file:', error);
    }
}

// Если файл запускается напрямую
if (require.main === module) {
    parseAllSites().catch(console.error);
}

module.exports = { parseAllSites, saveJobs, createCombinedFile };
