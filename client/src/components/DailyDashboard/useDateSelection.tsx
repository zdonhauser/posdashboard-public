import { useState, useEffect, useRef, useCallback } from 'react';
import moment from 'moment-timezone';

interface UseDateSelectionReturn {
  selectedDate: string;
  tempDate: string;
  isEditingDate: boolean;
  setSelectedDate: (date: string) => void;
  handleDateChange: (newDate: string, immediate?: boolean) => void;
  handleDateEditCancel: () => void;
  handleStartEditingDate: () => void;
  isHistoricalDate: boolean;
}

const DEBOUNCE_DELAY = 2000; // 2 seconds
const TIMEZONE = 'America/Chicago';

export function useDateSelection(initialDate?: string): UseDateSelectionReturn {
  // Get today's date in Chicago timezone
  const todayDate = moment.tz(TIMEZONE).format('YYYY-MM-DD');

  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || todayDate
  );
  const [tempDate, setTempDate] = useState<string>(
    initialDate || todayDate
  );
  const [isEditingDate, setIsEditingDate] = useState<boolean>(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate if the selected date is historical (not today)
  const isHistoricalDate = selectedDate !== todayDate;

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  // Handle date changes with optional immediate application
  const handleDateChange = useCallback((newDate: string, immediate: boolean = false) => {
    if (immediate) {
      // Clear any pending timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      setSelectedDate(newDate);
      setTempDate(newDate);
      setIsEditingDate(false);
    } else {
      // Just update the temp date, debounce will handle the actual change
      setTempDate(newDate);
    }
  }, []);

  // Cancel date editing and reset to current selected date
  const handleDateEditCancel = useCallback(() => {
    // Clear any pending timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    // Reset temp date to selected date
    setTempDate(selectedDate);
    setIsEditingDate(false);
  }, [selectedDate]);

  // Start editing mode
  const handleStartEditingDate = useCallback(() => {
    setTempDate(selectedDate);
    setIsEditingDate(true);
  }, [selectedDate]);

  // Debounce effect for auto-applying date changes after inactivity
  useEffect(() => {
    if (isEditingDate && tempDate !== selectedDate) {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for auto-application
      debounceTimerRef.current = setTimeout(() => {
        setSelectedDate(tempDate);
        setIsEditingDate(false);
      }, DEBOUNCE_DELAY);
    }

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [tempDate, isEditingDate, selectedDate]);

  return {
    selectedDate,
    tempDate,
    isEditingDate,
    setSelectedDate,
    handleDateChange,
    handleDateEditCancel,
    handleStartEditingDate,
    isHistoricalDate,
  };
}