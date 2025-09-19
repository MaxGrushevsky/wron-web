'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface JobFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export interface FilterState {
  source: string[];
  workType: string[];
  location: string[];
  dateRange: string;
}

const SOURCES = [
  { id: 'amazon', label: 'Amazon', count: 0 },
  { id: 'nofluffjobs', label: 'NoFluffJobs', count: 0 },
  { id: 'olx', label: 'OLX', count: 0 },
  { id: 'pracuj', label: 'Pracuj', count: 0 },
];

const WORK_TYPES = [
  { id: 'internship', label: 'Стажировка' },
  { id: 'full-time', label: 'Полная занятость' },
  { id: 'part-time', label: 'Подработка' },
  { id: 'contract', label: 'Контракт' },
];

const LOCATIONS = [
  { id: 'wroclaw', label: 'Вроцлав' },
  { id: 'remote', label: 'Удаленно' },
  { id: 'hybrid', label: 'Гибрид' },
];

const DATE_RANGES = [
  { id: 'today', label: 'Сегодня' },
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'all', label: 'Все время' },
];

export default function JobFilters({ onFiltersChange, initialFilters }: JobFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<FilterState>(initialFilters || {
    source: [],
    workType: [],
    location: [],
    dateRange: 'all',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Обновляем фильтры при изменении URL
  useEffect(() => {
    const newFilters: FilterState = {
      source: searchParams.getAll('source'),
      workType: searchParams.getAll('workType'),
      location: searchParams.getAll('location'),
      dateRange: searchParams.get('dateRange') || 'all',
    };
    setFilters(newFilters);
  }, [searchParams]);

  const handleFilterChange = (filterType: keyof FilterState, value: string | string[]) => {
    const newFilters = {
      ...filters,
      [filterType]: value,
    };
    setFilters(newFilters);
    
    // Обновляем URL с новыми фильтрами
    const params = new URLSearchParams(searchParams);
    
    // Очищаем старые параметры фильтров
    params.delete('source');
    params.delete('workType');
    params.delete('location');
    params.delete('dateRange');
    params.delete('page'); // Сбрасываем страницу при изменении фильтров
    
    // Добавляем новые параметры
    if (newFilters.source.length > 0) {
      newFilters.source.forEach(source => {
        params.append('source', source);
      });
    }
    
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
    
    // Вызываем callback если он передан
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const handleSourceToggle = (sourceId: string) => {
    const newSources = filters.source.includes(sourceId)
      ? filters.source.filter(s => s !== sourceId)
      : [...filters.source, sourceId];
    handleFilterChange('source', newSources);
  };

  const handleWorkTypeToggle = (workTypeId: string) => {
    const newWorkTypes = filters.workType.includes(workTypeId)
      ? filters.workType.filter(w => w !== workTypeId)
      : [...filters.workType, workTypeId];
    handleFilterChange('workType', newWorkTypes);
  };

  const handleLocationToggle = (locationId: string) => {
    const newLocations = filters.location.includes(locationId)
      ? filters.location.filter(l => l !== locationId)
      : [...filters.location, locationId];
    handleFilterChange('location', newLocations);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      source: [],
      workType: [],
      location: [],
      dateRange: 'all',
    };
    setFilters(clearedFilters);
    
    // Очищаем URL от всех параметров фильтров
    const params = new URLSearchParams(searchParams);
    params.delete('source');
    params.delete('workType');
    params.delete('location');
    params.delete('dateRange');
    params.delete('page');
    
    // Сохраняем только поисковый запрос
    const search = params.get('search');
    const newUrl = search ? `/?search=${search}` : '/';
    router.push(newUrl);
  };

  const hasActiveFilters = filters.source.length > 0 || filters.workType.length > 0 || filters.location.length > 0 || filters.dateRange !== 'all';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Фильтры
        </h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              Очистить все
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            {isExpanded ? 'Свернуть' : 'Развернуть'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Источники */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Источники
            </h4>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((source) => (
                <button
                  key={source.id}
                  onClick={() => handleSourceToggle(source.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.source.includes(source.id)
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {source.label}
                </button>
              ))}
            </div>
          </div>

          {/* Тип работы */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Тип работы
            </h4>
            <div className="flex flex-wrap gap-2">
              {WORK_TYPES.map((workType) => (
                <button
                  key={workType.id}
                  onClick={() => handleWorkTypeToggle(workType.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.workType.includes(workType.id)
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {workType.label}
                </button>
              ))}
            </div>
          </div>

          {/* Локация */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Локация
            </h4>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleLocationToggle(location.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.location.includes(location.id)
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {location.label}
                </button>
              ))}
            </div>
          </div>

          {/* Дата публикации */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Дата публикации
            </h4>
            <div className="flex flex-wrap gap-2">
              {DATE_RANGES.map((dateRange) => (
                <button
                  key={dateRange.id}
                  onClick={() => handleFilterChange('dateRange', dateRange.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.dateRange === dateRange.id
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {dateRange.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Активные фильтры */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {filters.source.map((sourceId) => {
              const source = SOURCES.find(s => s.id === sourceId);
              return (
                <span
                  key={sourceId}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                >
                  {source?.label}
                  <button
                    onClick={() => handleSourceToggle(sourceId)}
                    className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  >
                    ×
                  </button>
                </span>
              );
            })}
            {filters.workType.map((workTypeId) => {
              const workType = WORK_TYPES.find(w => w.id === workTypeId);
              return (
                <span
                  key={workTypeId}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                >
                  {workType?.label}
                  <button
                    onClick={() => handleWorkTypeToggle(workTypeId)}
                    className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  >
                    ×
                  </button>
                </span>
              );
            })}
            {filters.location.map((locationId) => {
              const location = LOCATIONS.find(l => l.id === locationId);
              return (
                <span
                  key={locationId}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                >
                  {location?.label}
                  <button
                    onClick={() => handleLocationToggle(locationId)}
                    className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  >
                    ×
                  </button>
                </span>
              );
            })}
            {filters.dateRange !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                {DATE_RANGES.find(d => d.id === filters.dateRange)?.label}
                <button
                  onClick={() => handleFilterChange('dateRange', 'all')}
                  className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
