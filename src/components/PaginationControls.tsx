"use client";

import { useRouter } from "next/navigation";

export default function PaginationControls({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();

  const handlePageChange = (page: number) => {
    router.push(`/?page=${page}`);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  // Генерация номеров страниц
  const getPageNumbers = () => {
    const pages: number[] = [];

    // Всегда добавляем первую страницу
    if (currentPage > 3) {
      pages.push(1);
    }

    // Добавляем "..." перед текущим блоком страниц, если нужно
    if (currentPage > 4) {
      pages.push(-1); // -1 будет обозначать "..."
    }

    // Добавляем до 2 страниц перед текущей
    for (let i = Math.max(1, currentPage - 2); i < currentPage; i++) {
      pages.push(i);
    }

    // Добавляем текущую страницу
    pages.push(currentPage);

    // Добавляем до 2 страниц после текущей
    for (let i = currentPage + 1; i <= Math.min(totalPages, currentPage + 2); i++) {
      pages.push(i);
    }

    // Добавляем "..." после текущего блока страниц, если нужно
    if (currentPage + 2 < totalPages - 1) {
      pages.push(-1); // -1 будет обозначать "..."
    }

    // Всегда добавляем последнюю страницу
    if (currentPage + 2 < totalPages) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center mt-4 space-x-2">
      {/* Кнопка "Previous" */}
      <button
        onClick={handlePrevPage}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      {/* Номера страниц */}
      {pageNumbers.map((page, index) =>
        page === -1 ? (
          // "..." для пропуска страниц
          <span key={index} className="px-3 py-1 text-gray-500">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded ${
              page === currentPage
                ? "bg-indigo-700 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors`}
          >
            {page}
          </button>
        )
      )}

      {/* Кнопка "Next" */}
      <button
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}
