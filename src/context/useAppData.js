import { useContext } from 'react';
import { DataContext } from './dataContext.js';

export function useAppData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useAppData debe utilizarse dentro de DataProvider');
  return context;
}