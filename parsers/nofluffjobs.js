module.exports = async function parseNoFluffJobs(page) {
  try {
      console.log('Waiting for job listings...');
      // Ждем появления контейнера с вакансиями
      await page.waitForSelector('nfj-main-content', { timeout: 60000 });
      console.log('Job listings container found, extracting jobs...');

      let allJobs = new Map();
      let hasMoreJobs = true;
      let loadMoreClicks = 0;

      while (hasMoreJobs && loadMoreClicks < 10) { // Ограничиваем количество кликов
          // Извлекаем вакансии с текущей страницы
          const newJobs = await page.evaluate(() => {
              const mainContainer = document.querySelector('nfj-main-content');
              if (!mainContainer) return [];
              const jobItems = Array.from(mainContainer.querySelectorAll('a.posting-list-item'));
              return jobItems.map(job => {
                  const titleElement = job.querySelector('h3.posting-title__position, h2 a, h3 a, [data-testid="job-title"] a, .posting-title__position');
                  const companyElement = job.querySelector('h4.company-name, [data-testid="company-name"], .company-name, h4');
                  const salaryElement = job.querySelector('span[data-cy="salary ranges on the job offer listing"], [data-testid="salary"], .salary, [data-cy*="salary"]');
                  const locationElement = job.querySelector('nfj-posting-item-city span, [data-testid="location"], .location, .city');
                  const urlElement = job.querySelector('a[href*="/job/"], a');

                  const title = titleElement ? titleElement.innerText.trim() : 'No title';
                  const company = companyElement ? companyElement.innerText.trim() : 'No company';
                  const salaryText = salaryElement ? salaryElement.innerText.trim() : 'No salary';
                  const location = locationElement ? locationElement.innerText.trim() : 'No location';
                  const url = urlElement ? urlElement.href : job.href;

                  // Разделяем зарплату на мин, макс и тип
                  let minSalary = null;
                  let maxSalary = null;
                  let salaryType = null;
                  
                  if (salaryText && salaryText !== 'No salary') {
                      // Ищем диапазон зарплаты
                      const salaryMatch = salaryText.match(/(\d+(?:\s?\d+)*)\s*[-–]\s*(\d+(?:\s?\d+)*)/);
                      if (salaryMatch) {
                          minSalary = parseInt(salaryMatch[1].replace(/\s/g, ''), 10);
                          maxSalary = parseInt(salaryMatch[2].replace(/\s/g, ''), 10);
                      } else {
                          // Если только одно число
                          const singleSalary = salaryText.match(/(\d+(?:\s?\d+)*)/);
                          if (singleSalary) {
                              minSalary = parseInt(singleSalary[1].replace(/\s/g, ''), 10);
                              maxSalary = minSalary;
                          }
                      }
                      
                      // Определяем тип зарплаты
                      if (salaryText.toLowerCase().includes('pln') || salaryText.toLowerCase().includes('zł')) {
                          salaryType = 'monthly';
                      } else if (salaryText.toLowerCase().includes('hour') || salaryText.toLowerCase().includes('godz')) {
                          salaryType = 'hourly';
                      }
                  }

                  return { 
                      title, 
                      company, 
                      salary: salaryText, 
                      salaryMin: minSalary, 
                      salaryMax: maxSalary, 
                      salaryType: salaryType, 
                      location, 
                      url, 
                      source: 'nofluffjobs' 
                  };
              });
          });

          // Добавляем новые вакансии
          newJobs.forEach(job => {
              if (job.url && job.url !== 'No URL' && job.title !== 'No title') {
                  allJobs.set(job.url, job);
              }
          });

          console.log(`Extracted ${newJobs.length} jobs from current page, total: ${allJobs.size}`);
          if (newJobs.length > 0) {
              console.log('Sample job:', JSON.stringify(newJobs[0], null, 2));
          }

          // Ищем кнопку "Load More" или "Pokaż więcej"
          hasMoreJobs = await page.evaluate(() => {
              const loadMoreButton = document.querySelector('button[data-testid="load-more"], .load-more-button');
              if (loadMoreButton && !loadMoreButton.disabled) {
                  loadMoreButton.click();
                  return true;
              }
              return false;
          });

          if (hasMoreJobs) {
              loadMoreClicks++;
              console.log(`Clicked "Load More" ${loadMoreClicks} times`);
              await new Promise(resolve => setTimeout(resolve, 3000)); // Ждем 3 секунды для подгрузки
          }
      }

      const jobs = Array.from(allJobs.values());
      console.log(`Total extracted ${jobs.length} unique jobs from NoFluffJobs`);
      return jobs;
  } catch (error) {
      console.error('Error in parseNoFluffJobs:', error);
      return [];
  }
};








