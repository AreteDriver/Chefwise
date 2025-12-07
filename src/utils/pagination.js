/**
 * Pagination utilities for recipe lists and search results
 */

import { useState, useEffect, useMemo } from 'react';

/**
 * Paginate an array of items
 * @param {Array} items - Items to paginate
 * @param {number} page - Current page (1-indexed)
 * @param {number} pageSize - Items per page
 * @returns {Object} Paginated result
 */
export const paginate = (items, page = 1, pageSize = 10) => {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  
  return {
    items: items.slice(startIndex, endIndex),
    pagination: {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
      startIndex,
      endIndex,
    },
  };
};

/**
 * Generate page numbers for pagination UI
 * @param {number} currentPage - Current page
 * @param {number} totalPages - Total pages
 * @param {number} maxVisible - Maximum visible page numbers
 * @returns {Array<number|string>} Array of page numbers or '...'
 */
export const generatePageNumbers = (currentPage, totalPages, maxVisible = 7) => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  const halfVisible = Math.floor(maxVisible / 2);
  
  // Always show first page
  pages.push(1);
  
  // Calculate range around current page
  let start = Math.max(2, currentPage - halfVisible);
  let end = Math.min(totalPages - 1, currentPage + halfVisible);
  
  // Adjust if at the beginning or end
  if (currentPage <= halfVisible) {
    end = maxVisible - 1;
  } else if (currentPage >= totalPages - halfVisible) {
    start = totalPages - maxVisible + 2;
  }
  
  // Add ellipsis if needed
  if (start > 2) {
    pages.push('...');
  }
  
  // Add middle pages
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  // Add ellipsis if needed
  if (end < totalPages - 1) {
    pages.push('...');
  }
  
  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }
  
  return pages;
};

/**
 * Custom hook for pagination state management
 * @param {Array} items - Items to paginate
 * @param {number} initialPageSize - Initial page size
 * @returns {Object} Pagination state and methods
 */
export const usePagination = (items = [], initialPageSize = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const paginatedData = useMemo(() => {
    return paginate(items, currentPage, pageSize);
  }, [items, currentPage, pageSize]);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const nextPage = () => {
    if (paginatedData.pagination.hasNext) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (paginatedData.pagination.hasPrevious) {
      setCurrentPage(currentPage - 1);
    }
  };

  const changePageSize = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
  };

  // Reset to page 1 when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  return {
    ...paginatedData,
    goToPage,
    nextPage,
    previousPage,
    changePageSize,
  };
};

/**
 * Infinite scroll pagination helper
 * @param {Array} items - All items
 * @param {number} itemsPerLoad - Items to load per scroll
 * @returns {Object} Infinite scroll state and methods
 */
export const useInfiniteScroll = (items = [], itemsPerLoad = 20) => {
  const [displayedCount, setDisplayedCount] = useState(itemsPerLoad);

  const displayedItems = useMemo(() => {
    return items.slice(0, displayedCount);
  }, [items, displayedCount]);

  const loadMore = () => {
    setDisplayedCount(prev => Math.min(prev + itemsPerLoad, items.length));
  };

  const hasMore = displayedCount < items.length;
  const reset = () => setDisplayedCount(itemsPerLoad);

  // Reset when items change
  useEffect(() => {
    setDisplayedCount(itemsPerLoad);
  }, [items.length, itemsPerLoad]);

  return {
    items: displayedItems,
    loadMore,
    hasMore,
    reset,
    displayedCount,
    totalCount: items.length,
  };
};
