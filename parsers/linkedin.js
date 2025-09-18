module.exports = async function parseLinkedIn(page) {
    try {
      console.log('LinkedIn parsing - checking if login is required...');
      
      // Проверяем, нужна ли авторизация
      const needsLogin = await page.evaluate(() => {
        return document.querySelector('.authwall, .login-form, [data-test-id="sign-in-form"]') !== null;
      });
      
      if (needsLogin) {
        console.log('LinkedIn requires login. Skipping...');
        return [];
      }
      
      console.log('Waiting for job listings...');
      // Ждем появления контейнера с вакансиями
      await page.waitForSelector('body', { timeout: 30000 });
      
      // Ищем все возможные селекторы для вакансий
      const jobs = await page.evaluate(() => {
        const allJobs = [];
        
        // Пробуем разные селекторы
        const selectors = [
          '.jobs-search-results-list li',
          '.scaffold-layout__list ul li',
          '[data-entity-urn*="job"]',
          '.job-card-container',
          '.job-card-list__item'
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(job => {
            const titleElement = job.querySelector('a span, h3 a, .job-card-list__title a');
            const companyElement = job.querySelector('.artdeco-entity-lockup__subtitle, .job-card-container__company-name');
            const urlElement = job.querySelector('a[href*="/jobs/view/"]');
            
            const title = titleElement ? titleElement.innerText.trim() : '';
            const company = companyElement ? companyElement.innerText.trim() : '';
            const url = urlElement ? urlElement.href : '';
            
            if (title && company && url) {
              allJobs.push({
                title,
                company,
                url,
                location: 'No location',
                salary: 'No salary',
                source: 'linkedin'
              });
            }
          });
        });
        
        return allJobs;
      });
  
      console.log(`Total extracted ${jobs.length} jobs from LinkedIn`);
      return jobs;
    } catch (error) {
      console.error('Error in parseLinkedIn:', error);
      return [];
    }
  }
