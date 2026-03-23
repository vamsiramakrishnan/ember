/**
 * StudentContext — provides the current student and notebook
 * to all components. Handles both local and auth-based sign out.
 *
 * Persists selection to localStorage so refresh retains context.
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { getSupabase } from '@/auth/supabase-client';
import type { ReactNode } from 'react';
import type { StudentRecord, NotebookRecord } from '@/persistence/records';

const STORAGE_KEY_STUDENT = 'ember:student';
const STORAGE_KEY_NOTEBOOK = 'ember:notebook';

function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function saveToStorage<T>(key: string, value: T | null): void {
  try {
    if (value) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // localStorage may be unavailable (private browsing, quota)
  }
}

interface StudentContextValue {
  student: StudentRecord | null;
  notebook: NotebookRecord | null;
  setStudent: (student: StudentRecord | null) => void;
  setNotebook: (notebook: NotebookRecord | null) => void;
  signOut: () => void;
}

const Context = createContext<StudentContextValue>({
  student: null,
  notebook: null,
  setStudent: () => {},
  setNotebook: () => {},
  signOut: () => {},
});

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudentState] = useState<StudentRecord | null>(
    () => loadFromStorage<StudentRecord>(STORAGE_KEY_STUDENT),
  );
  const [notebook, setNotebookState] = useState<NotebookRecord | null>(
    () => loadFromStorage<NotebookRecord>(STORAGE_KEY_NOTEBOOK),
  );

  const setStudent = useCallback((s: StudentRecord | null) => {
    setStudentState(s);
    saveToStorage(STORAGE_KEY_STUDENT, s);
    // Clear notebook when student changes
    if (!s) {
      setNotebookState(null);
      saveToStorage(STORAGE_KEY_NOTEBOOK, null);
    }
  }, []);

  const setNotebook = useCallback((nb: NotebookRecord | null) => {
    setNotebookState(nb);
    saveToStorage(STORAGE_KEY_NOTEBOOK, nb);
  }, []);

  const signOut = useCallback(() => {
    setStudentState(null);
    setNotebookState(null);
    saveToStorage(STORAGE_KEY_STUDENT, null);
    saveToStorage(STORAGE_KEY_NOTEBOOK, null);
    const supabase = getSupabase();
    if (supabase) {
      void supabase.auth.signOut();
    }
  }, []);

  return (
    <Context.Provider value={{
      student,
      notebook,
      setStudent,
      setNotebook,
      signOut,
    }}>
      {children}
    </Context.Provider>
  );
}

export function useStudent(): StudentContextValue {
  return useContext(Context);
}
