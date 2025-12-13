import { createContext, useContext, useState, useCallback } from 'react';

/**
 * PageStateContext - Provides state persistence across page navigations
 * This is similar to Flutter's IndexedStack in that it preserves component state
 * when navigating between pages
 */
const PageStateContext = createContext();

export function usePageState() {
  const context = useContext(PageStateContext);
  if (!context) {
    throw new Error('usePageState must be used within PageStateProvider');
  }
  return context;
}

export function PageStateProvider({ children }) {
  // Store state for each page separately
  const [pageStates, setPageStates] = useState({});

  /**
   * Save state for a specific page
   * @param {string} pageKey - Unique identifier for the page (e.g., 'home', 'pantry')
   * @param {object} state - State object to persist
   */
  const savePageState = useCallback((pageKey, state) => {
    setPageStates((prev) => ({
      ...prev,
      [pageKey]: state,
    }));
  }, []);

  /**
   * Get saved state for a specific page
   * @param {string} pageKey - Unique identifier for the page
   * @returns {object|null} Saved state or null if none exists
   */
  const getPageState = useCallback(
    (pageKey) => {
      return pageStates[pageKey] || null;
    },
    [pageStates]
  );

  /**
   * Clear state for a specific page
   * @param {string} pageKey - Unique identifier for the page
   */
  const clearPageState = useCallback((pageKey) => {
    setPageStates((prev) => {
      const newState = { ...prev };
      delete newState[pageKey];
      return newState;
    });
  }, []);

  /**
   * Clear all page states
   */
  const clearAllPageStates = useCallback(() => {
    setPageStates({});
  }, []);

  const value = {
    savePageState,
    getPageState,
    clearPageState,
    clearAllPageStates,
  };

  return (
    <PageStateContext.Provider value={value}>
      {children}
    </PageStateContext.Provider>
  );
}
