import { Container } from "@/components/Container";
import PaginationControls from "@/components/PaginationControls";
import SearchBar from "@/components/SearchBar";
import JobFilters, { FilterState } from "@/components/JobFilters";
import CompanyLogo from "@/components/CompanyLogo";
import PageLoader from "@/components/PageLoader";
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

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

async function fetchItems(page: number, limit: number, searchQuery: string = "", filters: FilterState = { workType: [], location: [], dateRange: 'all' }) {
  try {
    const data = await readJsonFile('all-jobs.json');
    if (!data) {
      return {
        items: [],
        totalItems: 0,
      };
    }
    
    let items = data.jobs || [];
    
    // Фильтрация по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter((job: any) => 
        job.title?.toLowerCase().includes(query) ||
        job.company?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query)
      );
    }

    // Применяем фильтры
    if (filters.workType.length > 0) {
      items = items.filter((job: any) => {
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        const text = `${title} ${description}`;
        
        return filters.workType.some(type => {
          switch (type) {
            case 'internship':
              return text.includes('staż') || text.includes('intern') || text.includes('praktyk') || text.includes('stażysta');
            case 'full-time':
              return text.includes('pełny etat') || text.includes('full-time') || text.includes('pełny wymiar') || text.includes('pełnoetatowy');
            case 'part-time':
              return text.includes('część etatu') || text.includes('part-time') || text.includes('dorywcz') || text.includes('częściowy');
            case 'contract':
              return text.includes('kontrakt') || text.includes('contract') || text.includes('umowa') || text.includes('umowa zlecenie');
            default:
              return false;
          }
        });
      });
    }

    if (filters.location.length > 0) {
      items = items.filter((job: any) => {
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        const location = job.location?.toLowerCase() || '';
        const text = `${title} ${description} ${location}`;
        
        return filters.location.some(loc => {
          switch (loc) {
            case 'wroclaw':
              return text.includes('wrocław') || text.includes('wroclaw') || text.includes('wrocławski');
            case 'remote':
              return text.includes('zdalnie') || text.includes('remote') || text.includes('home office') || text.includes('praca zdalna');
            case 'hybrid':
              return text.includes('hybrydowo') || text.includes('hybrid') || text.includes('częściowo zdalnie') || text.includes('mieszany');
            default:
              return false;
          }
        });
      });
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      items = items.filter((job: any) => {
        if (!job.date) return true;
        const jobDate = new Date(job.date);
        return jobDate >= filterDate;
      });
    }
    
    // Сортируем: сначала все источники кроме OLX, потом OLX в конце
    items.sort((a: any, b: any) => {
      if (a.source === 'olx' && b.source !== 'olx') return 1;
      if (a.source !== 'olx' && b.source === 'olx') return -1;
      return 0; // Сохраняем исходный порядок для одинаковых источников
    });
    
    // Пагинация
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);
    
    console.log(`Page ${page}: showing items ${startIndex}-${endIndex} of ${items.length} total items`);
    console.log(`First 3 items on page ${page}:`, paginatedItems.slice(0, 3).map(item => ({ title: item.title, company: item.company })));
    
    return {
      items: paginatedItems,
      totalItems: items.length,
    };
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return {
      items: [],
      totalItems: 0,
    };
  }
}

export const revalidate = 0; // Отключаем кэширование для отладки

export default async function Home({ searchParams }: { searchParams: { page?: string; search?: string; workType?: string | string[]; location?: string | string[]; dateRange?: string } }) {
  const page = parseInt(searchParams.page || "1", 10); // Получить текущую страницу из URL
  const limit = 10; // Количество элементов на странице
  const searchQuery = searchParams.search || ""; // Получить текст поиска из URL
  
  // Парсим фильтры из URL параметров
  const filters: FilterState = {
    workType: searchParams.workType ? (Array.isArray(searchParams.workType) ? searchParams.workType : [searchParams.workType]) : [],
    location: searchParams.location ? (Array.isArray(searchParams.location) ? searchParams.location : [searchParams.location]) : [],
    dateRange: searchParams.dateRange || 'all',
  };
  
  console.log('🔍 Search params:', { page, searchQuery, filters });
  
  const { items, totalItems } = await fetchItems(page, limit, searchQuery, filters);

  const totalPages = Math.ceil(totalItems / limit); // Рассчитать общее количество страниц
  
  console.log('📊 Results:', { itemsCount: items.length, totalItems, totalPages, currentPage: page });

  return (
    <Container>
      <div className="my-4 md:my-6 text-center px-4">
        <h1 className="text-xl md:text-2xl lg:text-3xl text-gray-800 dark:text-gray-100 leading-tight">
          Wroniak to platforma stworzona specjalnie dla studentów, którzy szukają pracy dorywczej, stażu lub pierwszego doświadczenia zawodowego.
        </h1>
        <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed">
          Naszym celem jest łączenie młodych, ambitnych osób z pracodawcami oferującymi elastyczne i przyjazne studentom oferty. Znajdziesz tutaj ogłoszenia z różnych branż — od gastronomii i sprzedaży, po IT, marketing czy pracę zdalną.
        </p>
      </div>
      {/* Основной контент с местом для Auto Ads */}
      <div className="min-h-[600px] px-4">
        {/* Контейнер с ограниченной шириной для лучшей читаемости */}
        <div className="max-w-4xl mx-auto">
          <SearchBar initialQuery={searchQuery} />
          
          {/* Фильтры */}
          <JobFilters 
            initialFilters={filters}
          />
          <PageLoader key={`page-loader-${page}`} isLoading={false}>
            {items.length > 0 ? (
              <div key={`jobs-list-${page}`} className="relative">
                <ul className="space-y-3 md:space-y-4">
                  {items.map((item: any, index: number) => (
                    <li key={`${item._id}-${page}-${index}`} className="block p-3 md:p-4 border rounded-lg shadow hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="flex items-start space-x-3">
                        <CompanyLogo 
                          key={`${item.company}-${item._id}-${page}`}
                          companyName={item.company}
                          logoUrl={item.logoUrl}
                          className="flex-shrink-0 mt-1" 
                        />
                          <div className="flex-1 min-w-0">
                            <h2 className="text-base md:text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2 line-clamp-2">
                              {item.title}
                            </h2>
                            {item.company && item.company !== "No company" && (
                              <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-1">
                                <span className="font-medium">Firma:</span> {item.company}
                              </p>
                            )}
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-medium">Źródło:</span> {item.source}
                            </p>
                          </div>
                        </div>
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-4">
                <div className="text-4xl md:text-6xl mb-4">🔍</div>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Nie znaleziono ofert pracy
                </h2>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-6 max-w-md">
                  Spróbuj zmienić kryteria wyszukiwania lub sprawdź ponownie później.
                </p>
                <div className="text-xs md:text-sm text-gray-500 dark:text-gray-500">
                  {totalItems === 0 ? 'Brak ofert pracy' : `Znaleziono ${totalItems} ofert pracy`}
                </div>
              </div>
            )}
          </PageLoader>
          
          {/* Показываем пагинацию только если есть результаты */}
          {items.length > 0 && (
            <div className="mt-6 md:mt-8 mb-12 md:mb-16">
              <PaginationControls 
                currentPage={page} 
                totalPages={totalPages}
                searchQuery={searchQuery}
                filters={filters}
              />
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}