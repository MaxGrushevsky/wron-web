module.exports = async function parseGoogle(page) {
    try {
        console.log('Waiting for job list container...');
        await page.waitForSelector('ul.spHGqe', { timeout: 60000 }); // Ждем контейнер с вакансиями
        console.log('Job list container found, extracting jobs...');

        const jobs = await page.evaluate(() => {
            const jobItems = Array.from(document.querySelectorAll('ul.spHGqe > li.lLd3Je'));
            return jobItems.map(job => {
                const titleElement = job.querySelector('h3.QJPWVe');
                const companyElement = job.querySelector('span.RP7SMd span');
                const locationElement = job.querySelector('span.pwO9Dc span.r0wTof');
                const urlElement = job.querySelector('a.WpHeLc');

                const title = titleElement ? titleElement.innerText.trim() : 'No title';
                const company = companyElement ? companyElement.innerText.trim() : 'No company';
                const location = locationElement ? locationElement.innerText.trim() : 'No location';
                const url = urlElement ? urlElement.href : 'No URL';

                return { title, company, location, url, source: 'google' };
            });
        });

        console.log(`Extracted ${jobs.length} jobs from Google Jobs`);
        return jobs.map(job => ({
            ...job,
            company: 'Google',
        }));
    } catch (error) {
        console.error('Error in parseGoogle:', error);
        return [];
    }
};
