module.exports = async function parseOlx(page) {
    try {
        console.log('Starting OLX job parsing...');
        const allJobs = new Map();
        let hasNextPage = true;
        let pageCount = 0;
        const maxPages = 10; // Ограничиваем количество страниц

        while (hasNextPage && pageCount < maxPages) {
            console.log(`Processing page ${pageCount + 1}...`);
            
            // Ждем загрузки контейнера с вакансиями
            await page.waitForSelector('[data-testid="listing-grid"]', { timeout: 30000 });

            const jobs = await page.evaluate(() => {
                // Ищем вакансии в контейнере
                const jobItems = Array.from(document.querySelectorAll('[data-testid="listing-grid"] > div'));

                return jobItems.map(job => {
                    // Ищем заголовок вакансии
                    const titleElement = job.querySelector('a h4, a h3, .title a, [data-testid="ad-title"] a, .offer-title a');
                    const title = titleElement ? titleElement.innerText.trim() : 'No title';

                    // Ищем компанию/работодателя
                    const companyElement = job.querySelector(
                        'p.css-1rpfcm7, ' +
                        '.company-name, ' +
                        '.employer, ' +
                        '[data-testid="company-name"], ' +
                        '.offer-company'
                    );
                    const company = companyElement ? companyElement.innerText.trim() : 'No company';

                    // Ищем зарплату
                    const salaryElement = job.querySelector(
                        'p.css-zgm539, ' +
                        '.salary, ' +
                        '.offer-salary, ' +
                        '[data-testid="salary"]'
                    );
                    const salary = salaryElement ? salaryElement.innerText.trim() : 'No salary';

                    // Ищем ссылку на вакансию
                    const urlElement = job.querySelector('a[href*="/praca/"], a[href*="/oferta/"]');
                    let url = 'No URL';
                    if (urlElement) {
                        const href = urlElement.getAttribute('href');
                        url = href.startsWith('http') ? href : `https://www.olx.pl${href}`;
                    }

                    // Ищем локацию
                    const locationElement = job.querySelector(
                        '.location, ' +
                        '.offer-location, ' +
                        '[data-testid="location"]'
                    );
                    const location = locationElement ? locationElement.innerText.trim() : 'No location';

                    // Парсим зарплату
                    let salaryMin = null;
                    let salaryMax = null;
                    let salaryType = null;

                    if (salary && salary !== 'No salary') {
                        const salaryMatch = salary.match(/(\d+(?:\s?\d+)*)\s*[-–]\s*(\d+(?:\s?\d+)*)/);
                        if (salaryMatch) {
                            salaryMin = parseInt(salaryMatch[1].replace(/\s/g, ''), 10);
                            salaryMax = parseInt(salaryMatch[2].replace(/\s/g, ''), 10);
                        } else {
                            const singleSalary = salary.match(/(\d+(?:\s?\d+)*)/);
                            if (singleSalary) {
                                salaryMin = parseInt(singleSalary[1].replace(/\s/g, ''), 10);
                                salaryMax = salaryMin;
                            }
                        }

                        if (salary.toLowerCase().includes('godz') || salary.toLowerCase().includes('h')) {
                            salaryType = 'hourly';
                        } else if (salary.toLowerCase().includes('mies') || salary.toLowerCase().includes('miesiąc')) {
                            salaryType = 'monthly';
                        }
                    }

                    return { 
                        title, 
                        company, 
                        salary, 
                        salaryMin,
                        salaryMax,
                        salaryType,
                        location,
                        url, 
                        source: 'olx' 
                    };
                });
            });

            // Добавляем новые вакансии
            jobs.forEach(job => {
                if (job.url && job.url !== 'No URL' && job.title !== 'No title') {
                    allJobs.set(job.url, job);
                }
            });

            console.log(`Extracted ${jobs.length} jobs from page ${pageCount + 1}, total: ${allJobs.size}`);

            // Ищем кнопку "Следующая страница"
            const nextPageUrl = await page.evaluate(() => {
                const nextPageButton = document.querySelector(
                    'a[data-testid="pagination-forward"], ' +
                    'a[aria-label="Next page"], ' +
                    '.pager .next a'
                );
                return nextPageButton ? nextPageButton.href : null;
            });

            if (nextPageUrl && nextPageUrl !== page.url()) {
                console.log(`Navigating to the next page: ${nextPageUrl}`);
                try {
                    await page.goto(nextPageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    pageCount++;
                } catch (e) {
                    console.log('Failed to navigate to next page:', e.message);
                    hasNextPage = false;
                }
            } else {
                hasNextPage = false;
            }
        }

        const jobsArray = Array.from(allJobs.values());
        console.log(`Extracted a total of ${jobsArray.length} unique jobs from OLX`);
        return jobsArray;
    } catch (error) {
        console.error('Error in parseOlx:', error);
        return [];
    }
};

