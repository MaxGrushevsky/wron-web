module.exports = async function parseRocketJobs(page) {
      try {
        console.log('Waiting for [data-test-id="virtuoso-item-list"] selector...');
        await page.waitForSelector('[data-test-id="virtuoso-item-list"]', { timeout: 60000 });
        console.log('[data-test-id="virtuoso-item-list"] selector found, starting to scroll and extract jobs...');
    
        const allJobs = new Map(); // Используем Map для хранения уникальных вакансий
        let hasMore = true;
    
        while (hasMore) {
          // Извлекаем данные с текущей видимой области
          const newJobs = await page.evaluate(() => {
              const jobItems = Array.from(document.querySelectorAll('[data-test-id="virtuoso-item-list"] [item="[object Object]"]'));
              return jobItems.map(job => {
                const titleElement = job.querySelector('h3');
                const title = titleElement ? titleElement.innerText.trim() : 'No title';
            
                const companyElement = job.querySelector('div:has(svg[data-testid="ApartmentRoundedIcon"]) span');
                const company = companyElement ? companyElement.innerText.trim() : 'No company';
            
                const urlElement = job.querySelector('a');
                const url = urlElement ? urlElement.href : 'No URL';
            
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

                  // Извлекаем числа, которые идут подряд, и убираем пробелы в тысячах
                  const salaryNumbers = salaryText
                    .match(/\d+(\s\d+)?/g) // Ищем числа, включая числа с пробелами (например, "5 000")
                    ?.map(num => parseInt(num.replace(/\s/g, ''), 10)) // Удаляем пробелы и преобразуем в числа
                    .filter(num => {
                      // Исключаем числа, которые относятся к локациям
                      const locationPattern = new RegExp(`\\+${num}\\s+(Lokalizacje|Lokalizacji|Lokalizacja)`, 'i');
                      return !locationPattern.test(salaryText);
                    });

                  if (salaryNumbers && salaryNumbers.length >= 2) {
                    // Если есть два числа, это диапазон
                    salaryMin = salaryNumbers[0];
                    salaryMax = salaryNumbers[1];
                  } else if (salaryNumbers && salaryNumbers.length === 1) {
                    // Если есть только одно число
                    salaryMin = salaryNumbers[0];
                    salaryMax = salaryNumbers[0];
                  }

                  // Определение типа зарплаты
                  if (salaryText.toLowerCase().includes('/mies')) {
                    salaryType = 'monthly';
                  } else if (salaryText.toLowerCase().includes('/godz')) {
                    salaryType = 'hourly';
                  }
                } else {
                  salaryLog = 'No salary container found for this job.';
                }
            
                return { title, company, url, salaryMin, salaryMax, salaryType, salaryLog };
              });
            });
            
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
          hasMore = await page.evaluate(() => {
            const footer = document.querySelector('footer');
            if (footer && footer.getBoundingClientRect().top < window.innerHeight) {
              return false; // Достигли конца страницы
            }
            window.scrollBy(0, 300); // Прокручиваем вниз
            return true;
          });
    
          // Задержка для подгрузки новых элементов
          await new Promise(resolve => setTimeout(resolve, 500));
        }
    
        const jobsArray = Array.from(allJobs.values()); // Преобразуем Map в массив
        console.log(`Total extracted ${jobsArray.length} jobs from rocketJobs`);
        return jobsArray.map(job => ({
          ...job,
          source: 'rocketjobs',
        }));
      } catch (error) {
        console.error('Error in parseJustJoin:', error);
        return [];
      }
    }
