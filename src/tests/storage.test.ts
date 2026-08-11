import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSettings,
  saveSettings,
  loadCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  loadTransactions,
  saveTransactions,
} from '../utils/storage';
import { DEFAULT_SETTINGS } from '../utils/constants';
import type { Category, Transaction } from '../types/finance';

describe('storage.ts tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Settings Storage', () => {
    it('returns DEFAULT_SETTINGS if localStorage is empty', () => {
      const settings = loadSettings();
      expect(settings.businessName).toBe('NekaWari');
      expect(settings.currency).toBe('FCFA');
    });

    it('saves and loads settings correctly', () => {
      const customSettings = {
        ...DEFAULT_SETTINGS,
        ownerName: 'TestUser',
        currency: 'EUR',
      };
      saveSettings(customSettings);
      const loaded = loadSettings();
      expect(loaded.ownerName).toBe('TestUser');
      expect(loaded.currency).toBe('EUR');
    });
  });

  describe('Categories CRUD Storage', () => {
    it('initializes with DEFAULT_CATEGORIES if empty', () => {
      const categories = loadCategories();
      expect(categories.length).toBeGreaterThan(0);
    });

    it('adds a new custom category correctly', () => {
      const initialCats = loadCategories();
      const initialLength = initialCats.length;

      const updated = addCategory({
        name: 'Voyage Pro',
        icon: 'Plane',
        color: '#5ebc67',
        type: 'expense',
      });

      expect(updated.length).toBe(initialLength + 1);
      const added = updated.find((c) => c.name === 'Voyage Pro');
      expect(added).toBeDefined();
      expect(added?.isCustom).toBe(true);
      expect(added?.color).toBe('#5ebc67');
    });

    it('updates an existing category correctly', () => {
      const initialCats = loadCategories();
      const catToUpdate = initialCats[0];
      const updatedCat: Category = {
        ...catToUpdate,
        name: 'Salaire Modifié',
        color: '#ff0000',
      };

      const updatedList = updateCategory(updatedCat);
      const found = updatedList.find((c) => c.id === catToUpdate.id);
      expect(found?.name).toBe('Salaire Modifié');
      expect(found?.color).toBe('#ff0000');
    });

    it('deletes a category correctly by id', () => {
      const initialCats = loadCategories();
      const catToDelete = initialCats[0];

      const updatedList = deleteCategory(catToDelete.id);
      expect(updatedList.length).toBe(initialCats.length - 1);
      expect(updatedList.find((c) => c.id === catToDelete.id)).toBeUndefined();
    });
  });

  describe('Transactions Storage', () => {
    it('returns empty array if no transactions stored', () => {
      expect(loadTransactions()).toEqual([]);
    });

    it('saves and loads transactions correctly', () => {
      const txs: Transaction[] = [
        {
          id: 't-1',
          type: 'income',
          amount: 50000,
          category: 'salary',
          date: '2026-08-11',
          createdAt: Date.now(),
        },
      ];
      saveTransactions(txs);
      const loaded = loadTransactions();
      expect(loaded.length).toBe(1);
      expect(loaded[0].amount).toBe(50000);
    });
  });
});
