import { useState, useEffect } from 'react';

/**
 * @param {string} key 
 * @param {object} initialState 
 * @returns {[state, setState]} 
 */
export const useFormPersistence = (key, initialState) => {
  const getStorageKey = () => `lab_pb_form_${key}`;

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
    }
    return initialState;
  };

  const [state, setState] = useState(loadFromStorage);

  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [state, key]);

  const clearState = () => {
    setState(initialState);
    try {
      localStorage.removeItem(getStorageKey());
    } catch (error) {
      console.error(`Error clearing ${key} from localStorage:`, error);
    }
  };

  return [state, setState, clearState];
};