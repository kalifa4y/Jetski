import type { Transaction, Settings, Category } from '../types/finance';
import { DEFAULT_SETTINGS, DEFAULT_CATEGORIES } from './constants';

const TRANSACTIONS_KEY = 'nekawari_transactions_v2';
const SETTINGS_KEY = 'nekawari_settings_v2';
const CATEGORIES_KEY = 'nekawari_categories_v2';

export const loadSettings = (): Settings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch (e) {
    console.error('Erreur chargement paramètres', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: Settings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Erreur sauvegarde paramètres', e);
  }
};

export const loadCategories = (): Category[] => {
  try {
    const saved = localStorage.getItem(CATEGORIES_KEY);
    if (!saved) {
      saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(saved);
  } catch (e) {
    console.error('Erreur chargement catégories', e);
    return DEFAULT_CATEGORIES;
  }
};

export const saveCategories = (categories: Category[]): void => {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Erreur sauvegarde catégories', e);
  }
};

export const addCategory = (newCat: Omit<Category, 'id'>): Category[] => {
  const categories = loadCategories();
  const catWithId: Category = {
    ...newCat,
    id: `custom-cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    isCustom: true,
  };
  const updated = [...categories, catWithId];
  saveCategories(updated);
  return updated;
};

export const updateCategory = (updatedCat: Category): Category[] => {
  const categories = loadCategories();
  const updated = categories.map((c) => (c.id === updatedCat.id ? updatedCat : c));
  saveCategories(updated);
  return updated;
};

export const deleteCategory = (id: string): Category[] => {
  const categories = loadCategories();
  const updated = categories.filter((c) => c.id !== id);
  saveCategories(updated);
  return updated;
};

/**
 * Charge les transactions.
 */
export const loadTransactions = (): Transaction[] => {
  try {
    const saved = localStorage.getItem(TRANSACTIONS_KEY);
    if (!saved) {
      saveTransactions([]);
      return [];
    }
    return JSON.parse(saved);
  } catch (e) {
    console.error('Erreur chargement transactions', e);
    return [];
  }
};

export const saveTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error('Erreur sauvegarde transactions', e);
  }
};

/**
 * Exporter toutes les transactions sous forme de fichier CSV
 */
export const exportToCSV = (transactions: Transaction[], currency: string = 'FCFA'): void => {
  const headers = ['ID', 'Date', 'Type', 'Montant', 'Devise', 'Catégorie', 'Note'];
  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.type === 'income' ? 'Revenu' : 'Dépense',
    t.amount,
    currency,
    t.category,
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `nekawari_budget_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporter toutes les données (sauvegarde JSON complète)
 */
export const exportBackupJSON = (
  transactions: Transaction[],
  settings: Settings,
  categories?: Category[]
): void => {
  const data = {
    version: 2,
    exportDate: new Date().toISOString(),
    settings,
    categories: categories || loadCategories(),
    transactions,
  };
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `nekawari_sauvegarde_complete_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
