import { useCallback, useRef } from 'react';

/**
 * Custom hook for debouncing function calls
 * @param func The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the function
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    },
    [func, delay]
  ) as T;

  return debouncedFunction;
};

export default useDebounce;
