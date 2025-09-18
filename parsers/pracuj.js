module.exports = async function parsePracuj(page) {
    try {
      console.log('Waiting for [data-test="section-offers"] selector...');
      await page.waitForSelector('[data-test="section-offers"]', { timeout: 60000 }); // Увеличиваем таймаут до 60 секунд
      console.log('[data-test="section-offers"] selector found, extracting jobs...');
  
      let jobs = new Map();
      let hasMoreJobs = true;
  
      while (hasMoreJobs) {
        const newJobs = await page.evaluate(() => {
          const jobItems = Array.from(document.querySelectorAll('[data-test="section-offers"] [data-test="default-offer"]'));
          return jobItems.map(job => {
            const titleElement = job.querySelector('[data-test="offer-title"]');
            const companyElement = job.querySelector('[data-test="section-company"] [data-test="text-company-name"]');
            const urlElement = job.querySelector('a');
            const salaryElement = job.querySelector('[data-test="offer-salary"]');
  
            const title = titleElement ? titleElement.innerText.trim() : 'Нет названия';
            const company = companyElement ? companyElement.innerText.trim() : 'Нет компании';
            const url = urlElement ? urlElement.href : 'No URL';

            const salaryText = salaryElement ? salaryElement.innerText.replace(/\s/g, '').trim() : null; // Удаляем пробелы
            let salaryMin = null;
            let salaryMax = null;
            let salaryType = null;

            if (salaryText) {
                const salaryNumbers = salaryText.match(/\d+/g)?.map(num => parseInt(num, 10)); // Извлекаем числа
                if (salaryText.includes('/godz')) {
                salaryType = 'hourly';
                if (salaryNumbers && salaryNumbers.length === 2) {
                    salaryMin = salaryNumbers[0];
                    salaryMax = salaryNumbers[1];
                } else if (salaryNumbers && salaryNumbers.length === 1) {
                    salaryMin = salaryNumbers[0];
                    salaryMax = salaryNumbers[0];
                }
                } else if (salaryText.includes('/mies')) {
                salaryType = 'monthly';
                if (salaryNumbers && salaryNumbers.length === 2) {
                    salaryMin = salaryNumbers[0];
                    salaryMax = salaryNumbers[1];
                } else if (salaryNumbers && salaryNumbers.length === 1) {
                    salaryMin = salaryNumbers[0];
                    salaryMax = salaryNumbers[0];
                }
                }
            }
  
            return { title, company, url, salaryMin, salaryMax, salaryType };
          });
        });
  
        newJobs.forEach(job => {
          jobs.set(job.url, job); // Используем URL как ключ для уникальности
        });
  
        console.log(`Extracted ${newJobs.length} jobs from pracuj.pl`);
  
        // Проверка наличия кнопки "Pokaż więcej ofert" и клик по ней
        hasMoreJobs = await page.evaluate(() => {
          const nextButton = document.querySelector('button[data-test="bottom-pagination-button-next"]');
          if (nextButton) {
            nextButton.click();
            return true;
          } else {
            return false;
          }
        });
  
        if (hasMoreJobs) {
          await page.waitForNavigation({ waitUntil: 'networkidle2' }); // Ждем завершения навигации
        }
      }
  
      const uniqueJobs = Array.from(jobs.values()).map(job => ({
        ...job,
        source: 'pracuj',
      }));
      console.log(`Total extracted ${uniqueJobs.length} jobs from pracuj.pl`);
      return uniqueJobs;
    } catch (error) {
      console.error('Error in parsePracuj:', error);
      return [];
    }
  }
