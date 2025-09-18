module.exports = async function parseAmazon(page) {
    try {
        console.log('Waiting for job list container...');
        await page.waitForSelector('.job-tile-lists', { timeout: 60000 }); // Ждем контейнер с вакансиями
        console.log('Job list container found, extracting jobs...');

        const jobs = await page.evaluate(() => {
            const jobItems = Array.from(document.querySelectorAll('.job-tile'));
            return jobItems.map(job => {
                const titleElement = job.querySelector('h3.job-title a.job-link');
                const locationElement = job.querySelector('.location-and-id ul li.text-nowrap');
                const jobIdElement = job.querySelector('.location-and-id ul li:nth-child(3)');
                const dateElement = job.querySelector('h2.posting-date');
                const urlElement = job.querySelector('h3.job-title a.job-link');

                const title = titleElement ? titleElement.innerText.trim() : 'No title';
                const location = locationElement ? locationElement.innerText.trim() : 'No location';
                const jobId = jobIdElement ? jobIdElement.innerText.replace('Job ID: ', '').trim() : 'No Job ID';
                const datePosted = dateElement ? dateElement.innerText.replace('Posted ', '').trim() : 'No date';
                const url = urlElement ? `https://www.amazon.jobs${urlElement.getAttribute('href')}` : 'No URL';

                return { title, location, jobId, datePosted, url, source: 'amazon' };
            });
        });

        console.log(`Extracted ${jobs.length} jobs from Amazon`);
        return jobs.map(job => ({
            ...job,
            company: 'Amazon',
        }));
    } catch (error) {
        console.error('Error in parseAmazon:', error);
        return [];
    }
};
