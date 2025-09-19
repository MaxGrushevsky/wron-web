'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FilterState } from './JobFilters';

interface FilterHandlerProps {
  children: React.ReactNode;
}

export default function FilterHandler({ children }: FilterHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = (newFilters: FilterState) => {
    const params = new URLSearchParams(searchParams);
    
    // Очищаем старые параметры фильтров
    params.delete('source');
    params.delete('workType');
    params.delete('location');
    params.delete('dateRange');
    params.delete('page'); // Сбрасываем страницу при изменении фильтров
    
    // Добавляем новые параметры
    if (newFilters.workType.length > 0) {
      newFilters.workType.forEach(workType => {
        params.append('workType', workType);
      });
    }
    
    if (newFilters.location.length > 0) {
      newFilters.location.forEach(location => {
        params.append('location', location);
      });
    }
    
    if (newFilters.dateRange !== 'all') {
      params.set('dateRange', newFilters.dateRange);
    }
    
    // Обновляем URL
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.push(newUrl);
  };

  return (
    <div>
      {children}
    </div>
  );
}

export { updateFilters };
