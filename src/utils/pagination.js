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
  const slotsForMiddle = maxVisible - 2; // Reserve slots for first and last page
  let start = Math.max(2, currentPage - Math.floor(slotsForMiddle / 2));
  let end = Math.min(totalPages - 1, currentPage + Math.floor(slotsForMiddle / 2));

  // Adjust start and end if they go out of bounds
  if (start < 2) {
    end = end + (2 - start);
    start = 2;
  }
  if (end > totalPages - 1) {
    start = start - (end - (totalPages - 1));
    end = totalPages - 1;
    if (start < 2) start = 2;
  }

  // Always show first page
  pages.push(1);

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
  pages.push(totalPages);

  // If we have more than maxVisible items, remove from middle pages
  while (pages.length > maxVisible) {
    // Remove from the middle, prefer removing from start if possible
    if (pages.includes('...')) {
      // Remove an ellipsis if possible
      const firstEllipsis = pages.indexOf('...');
      const lastEllipsis = pages.lastIndexOf('...');
      if (lastEllipsis !== firstEllipsis) {
        // Remove the first ellipsis
        pages.splice(firstEllipsis, 1);
      } else {
        // Remove the only ellipsis
        pages.splice(firstEllipsis, 1);
      }
    } else {
      // Remove from the middle pages
      pages.splice(2, 1); // Remove after first page and possible ellipsis
    }
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
