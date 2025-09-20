module.exports = async function parseJustJoin(page) {
    try {
      console.log('Waiting for job list container...');
      
      // Ждем загрузки страницы и пробуем найти контент
      console.log('Waiting for page to load...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Даем время на загрузку
      
      // Пробуем несколько селекторов для поиска списка вакансий
      const selectors = [
        '[data-test-id="virtuoso-item-list"]',
        '[data-testid="job-list"]',
        '.job-list',
        '[role="list"]',
        '.jobs-container',
        'ul[class*="job"]',
        'div[class*="job"]',
        'main',
        '.content',
        '[class*="offer"]',
        '[class*="listing"]'
      ];
      
      let found = false;
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 8000 });
          console.log(`Job list container found with selector: ${selector}`);
          found = true;
          break;
        } catch (e) {
          console.log(`Selector ${selector} not found, trying next...`);
        }
      }
      
      if (!found) {
        console.log('No job container found, trying to extract any job elements...');
        // Дополнительное время для динамической загрузки
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Отладочная информация
        const pageContent = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            bodyText: document.body.innerText.substring(0, 500),
            allElements: document.querySelectorAll('*').length
          };
        });
        console.log('Page debug info:', pageContent);
      }
  
      const allJobs = new Map(); // Используем Map для хранения уникальных вакансий
      let hasMore = true;
  
      let scrollCount = 0;
      const maxScrolls = 10; // Ограничиваем количество скроллов
      
        while (hasMore && scrollCount < maxScrolls) {
        // Проверяем, что страница еще валидна
        if (page.isClosed()) {
          console.log('Page was closed, stopping scroll');
          break;
        }
        
        // Извлекаем данные с текущей видимой области
        if (page.isClosed()) {
          console.log('Page was closed, stopping extraction');
          break;
        }
        
        let newJobs = [];
        try {
          newJobs = await page.evaluate(() => {
            // Пробуем разные селекторы для поиска вакансий
            const selectors = [
              'li[class*="offer"]',
              'li[class*="job"]',
              'li[class*="listing"]',
              'li',
              '[data-test-id="virtuoso-item-list"] [item="[object Object]"]',
              '[data-testid="job-card"]',
              '.job-card',
              '[role="listitem"]',
              'div[class*="job"]',
              'article',
              '.job-item',
              '[class*="offer"]',
              '[class*="listing"]',
              'a[href*="/offers/"]',
              'div[class*="offer"]',
              'div[class*="listing"]'
            ];
            
            let jobItems = [];
            for (const selector of selectors) {
              jobItems = Array.from(document.querySelectorAll(selector));
              if (jobItems.length > 0) {
                console.log(`Found ${jobItems.length} jobs with selector: ${selector}`);
                break;
              }
            }
            
            return jobItems
              .filter(job => {
                // Фильтруем только элементы, которые содержат вакансии
                const hasTitle = job.querySelector('h3, h2, .title, [class*="title"], a[href*="/offers/"], a[href*="/job/"]');
                const hasCompany = job.querySelector('div:has(svg[data-testid="ApartmentRoundedIcon"]) span, .company, [class*="company"], span[class*="company"], strong, b');
                const hasUrl = job.querySelector('a[href*="/offers/"], a[href*="/job/"], a');
                return hasTitle || hasCompany || hasUrl;
              })
              .map(job => {
              // Ищем заголовок вакансии - обычно это первый текст в элементе
              let title = 'No title';
              const titleElement = job.querySelector('h3, h2, .title, [class*="title"], a[href*="/offers/"], a[href*="/job/"]');
              if (titleElement) {
                title = titleElement.innerText.trim();
              } else {
                // Если нет специального элемента заголовка, берем весь текст и разделяем по строкам
                const allText = job.innerText.trim();
                const lines = allText.split('\n').filter(line => line.trim());
                if (lines.length > 0) {
                  title = lines[0].trim();
                }
              }
          
              // Ищем название компании - обычно это текст после заголовка
              let company = 'No company';
              const companyElement = job.querySelector('div:has(svg[data-testid="ApartmentRoundedIcon"]) span, .company, [class*="company"], span[class*="company"], strong, b');
              if (companyElement) {
                company = companyElement.innerText.trim();
              } else {
                // Если нет специального элемента компании, ищем в тексте
                const allText = job.innerText.trim();
                const lines = allText.split('\n').filter(line => line.trim());
                if (lines.length > 1) {
                  company = lines[1].trim();
                }
              }
          
              // Ищем ссылку на вакансию
              const urlElement = job.querySelector('a[href*="/offers/"], a[href*="/job/"], a');
              const url = urlElement ? 
                (urlElement.href.startsWith('http') ? urlElement.href : `https://justjoin.it${urlElement.getAttribute('href')}`) : 'No URL';
          
              // Извлечение зарплаты
              const salaryContainer = job.querySelector('div:has(span)'); // Контейнер с зарплатой
              let salaryMin = null;
              let salaryMax = null;
              let salaryType = null;
              let salaryLog = null;
          
              if (salaryContainer) {
                const salarySpans = Array.from(salaryContainer.querySelectorAll('span'));
                const salaryText = salarySpans.map(span => span.innerText.trim()).join(' '); // Объединяем текст всех <span>
                salaryLog = `Extracted salary text: "${salaryText}"`;
          
                // Извлекаем числа, включая числа с пробелами, запятыми и другими символами
                const salaryNumbers = salaryText
                    .match(/\d+(\.\d+)?K/gi) // Извлекаем числа с возможным суффиксом "K"
                    ?.map(num => {
                    const isThousand = num.toLowerCase().includes('k'); // Проверяем, есть ли "K"
                    const numericValue = parseFloat(num.replace(/k/gi, '').replace(',', '.')); // Убираем "K" и преобразуем в число
                    return isThousand ? numericValue * 1000 : numericValue; // Умножаем на 1000, если есть "K"
                    });

                if (salaryNumbers && salaryNumbers.length === 2) {
                    salaryMin = salaryNumbers[0];
                    salaryMax = salaryNumbers[1];
                } else if (salaryNumbers && salaryNumbers.length === 1) {
                    salaryMin = salaryNumbers[0];
                    salaryMax = salaryNumbers[0];
                }
          
                // Определение типа зарплаты
                if (salaryText.toLowerCase().includes('/month')) {
                  salaryType = 'monthly';
                } else if (salaryText.toLowerCase().includes('/h')) {
                  salaryType = 'hourly';
                }
              } else {
                salaryLog = 'No salary container found for this job.';
              }
          
              return { title, company, url, salaryMin, salaryMax, salaryType, salaryLog };
            });
          });
        } catch (error) {
          console.log('Error during page.evaluate:', error.message);
          newJobs = [];
        }
          
          // Логируем данные зарплаты в Node.js
          newJobs.forEach(job => {
            if (job.salaryLog) {
              console.log(job.salaryLog);
            }
          });
  
        // Добавляем новые вакансии в Map
        newJobs.forEach(job => {
          allJobs.set(job.url, job); // Используем URL как уникальный ключ
        });
  
        console.log(`Extracted ${newJobs.length} jobs, total so far: ${allJobs.size}`);
  
        // Прокручиваем страницу вниз
        try {
          hasMore = await page.evaluate(() => {
            const footer = document.querySelector('footer');
            if (footer && footer.getBoundingClientRect().top < window.innerHeight) {
              return false; // Достигли конца страницы
            }
            window.scrollBy(0, 300); // Прокручиваем вниз
            return true;
          });
        } catch (error) {
          console.log('Error during scroll, stopping:', error.message);
          hasMore = false;
        }

        scrollCount++;
        console.log(`Scroll ${scrollCount}/${maxScrolls}`);

        // Задержка для подгрузки новых элементов
        await new Promise(resolve => setTimeout(resolve, 500));
      }
  
      const jobsArray = Array.from(allJobs.values()); // Преобразуем Map в массив
      console.log(`Total extracted ${jobsArray.length} jobs from justjoin.it`);
      return jobsArray.map(job => ({
        ...job,
        source: 'justjoin.it',
      }));
    } catch (error) {
      console.error('Error in parseJustJoin:', error);
      return [];
    }
  }
