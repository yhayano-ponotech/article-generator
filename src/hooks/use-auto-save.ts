import { useEffect, useRef } from "react";

/**
 * Auto-save hook with debounce
 * Automatically saves data after a delay when it changes
 */
export function useAutoSave<T>(
  data: T,
  onSave: (data: T) => void | Promise<void>,
  delay: number = 2000,
  enabled: boolean = true
) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const previousDataRef = useRef<T>(data);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check if data actually changed
    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return;
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      onSave(data);
      previousDataRef.current = data;
    }, delay);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, delay, enabled]);
}
