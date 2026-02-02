// src/hooks/useFormPersistence.js
import { useState, useEffect } from 'react';

/**
 * Custom hook untuk menyimpan dan mengambil state form dari localStorage
 * @param {string} key - Key untuk localStorage
 * @param {object} initialState - State awal jika tidak ada di localStorage
 * @returns {[state, setState]} - State dan setter function
 */
export const useFormPersistence = (key, initialState) => {
  // Helper function untuk membuat storage key yang unik
  const getStorageKey = () => `lab_pb_form_${key}`;

  // Load dari localStorage saat pertama kali mount
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

  // Initialize state dari localStorage atau initialState
  const [state, setState] = useState(loadFromStorage);

  // Simpan ke localStorage setiap kali state berubah
  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [state, key]);

  // Function untuk clear state dan localStorage
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