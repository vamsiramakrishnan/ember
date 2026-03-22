/**
 * StudentContext — provides the current student and notebook
 * to all components. Manages student selection and switching.
 */
import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { StudentRecord, NotebookRecord } from '@/persistence/records';

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
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [notebook, setNotebook] = useState<NotebookRecord | null>(null);

  const signOut = useCallback(() => {
    setStudent(null);
    setNotebook(null);
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
