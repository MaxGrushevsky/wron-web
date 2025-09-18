import { Container } from "@/components/Container";
import PaginationControls from "@/components/PaginationControls";
import SearchBar from "@/components/SearchBar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

async function fetchItems(page: number, limit: number, searchQuery: string = "") {
  try {
    let url = `${API_BASE_URL}/api/jobs`;
    
    if (searchQuery) {
      url = `${API_BASE_URL}/api/jobs/search/${encodeURIComponent(searchQuery)}`;
    }
    
    const response = await fetch(url, {
      next: { revalidate: 3600 } // Кэшируем на 1 час
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch jobs');
    }
    
    const data = await response.json();
    const items = data.jobs || [];
    
    // Пагинация на клиенте
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);
    
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

export default async function Home({ searchParams }: { searchParams: { page?: string; search?: string } }) {
  const page = parseInt(searchParams.page || "1", 10); // Получить текущую страницу из URL
  const limit = 10; // Количество элементов на странице
  const searchQuery = searchParams.search || ""; // Получить текст поиска из URL
  const { items, totalItems } = await fetchItems(page, limit, searchQuery); // Загрузить данные с сервера

  const totalPages = Math.ceil(totalItems / limit); // Рассчитать общее количество страниц

  return (
    <Container>
      <div className="my-6 text-center">
        <h1 className="text-2xl text-gray-800 dark:text-gray-100">
          Wroniak to prosta i intuicyjna platforma stworzona specjalnie dla studentów, którzy szukają pracy dorywczej, stażu lub pierwszego doświadczenia zawodowego.
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Naszym celem jest łączenie młodych, ambitnych osób z pracodawcami oferującymi elastyczne i przyjazne studentom oferty. Znajdziesz tutaj ogłoszenia z różnych branż — od gastronomii i sprzedaży, po IT, marketing czy pracę zdalną.
        </p>
      </div>
      <SearchBar initialQuery={searchQuery} />
      <ul className="space-y-4">
        {items.map((item: any) => (
          <li
            key={item._id}
            className="block p-4 border rounded-lg shadow hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                {item.title}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Firma: {item.company}
              </p>
              <p className="text-gray-500 text-sm dark:text-gray-400">
                Source: {item.source}
              </p>
            </a>
          </li>
        ))}
      </ul>
      <PaginationControls currentPage={page} totalPages={totalPages} />
    </Container>
  );
}