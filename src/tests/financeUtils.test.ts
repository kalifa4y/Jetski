import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDateFr,
  calculateSummary,
  filterTransactionsByPeriod,
  getRevenueByMonthList,
  getRevenueByYearList,
  getCategoryBreakdown,
  getWeekNumber,
} from '../utils/financeUtils';
import type { Transaction } from '../types/finance';

describe('financeUtils tests', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      amount: 150000,
      category: 'salary',
      date: '2026-08-01',
      note: 'Salaire mensuel',
      createdAt: 1000,
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 40000,
      category: 'groceries',
      date: '2026-08-05',
      note: 'Supermarché',
      createdAt: 2000,
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 10000,
      category: 'transport',
      date: '2026-08-08',
      note: 'Carburant',
      createdAt: 3000,
    },
    {
      id: 'tx-4',
      type: 'income',
      amount: 50000,
      category: 'freelance',
      date: '2026-07-15',
      note: 'Projet client',
      createdAt: 4000,
    },
  ];

  describe('formatCurrency', () => {
    it('formats positive amount correctly', () => {
      const res = formatCurrency(150000, 'FCFA');
      expect(res).toContain('150');
      expect(res).toContain('FCFA');
    });

    it('formats negative amount correctly with minus sign', () => {
      const res = formatCurrency(-5000, 'EUR');
      expect(res).toContain('-5');
      expect(res).toContain('EUR');
    });

    it('formats zero correctly', () => {
      const res = formatCurrency(0, 'FCFA');
      expect(res).toContain('0 FCFA');
    });
  });

  describe('formatDateFr', () => {
    it('formats ISO date to French long date', () => {
      const formatted = formatDateFr('2026-08-11');
      expect(formatted.toLowerCase()).toContain('août');
      expect(formatted).toContain('2026');
    });

    it('handles empty date string gracefully', () => {
      expect(formatDateFr('')).toBe('');
    });
  });

  describe('calculateSummary', () => {
    it('calculates total income, expenses, and net balance correctly', () => {
      const summary = calculateSummary(sampleTransactions);
      expect(summary.totalIncome).toBe(200000);
      expect(summary.totalExpenses).toBe(50000);
      expect(summary.balance).toBe(150000);
      expect(summary.transactionCount).toBe(4);
    });

    it('identifies top income and top expense categories correctly', () => {
      const summary = calculateSummary(sampleTransactions);
      expect(summary.topIncomeCategory?.name).toBe('salary');
      expect(summary.topIncomeCategory?.amount).toBe(150000);

      expect(summary.topExpenseCategory?.name).toBe('groceries');
      expect(summary.topExpenseCategory?.amount).toBe(40000);
    });

    it('returns 0 balance for empty transactions array', () => {
      const summary = calculateSummary([]);
      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.balance).toBe(0);
      expect(summary.transactionCount).toBe(0);
      expect(summary.topIncomeCategory).toBeUndefined();
      expect(summary.topExpenseCategory).toBeUndefined();
    });
  });

  describe('filterTransactionsByPeriod', () => {
    const targetAugust = new Date('2026-08-11T00:00:00');

    it('filters by month correctly', () => {
      const filtered = filterTransactionsByPeriod(sampleTransactions, 'month', targetAugust);
      expect(filtered.length).toBe(3);
      expect(filtered.every((t) => t.date.startsWith('2026-08'))).toBe(true);
    });

    it('filters by year correctly', () => {
      const filtered = filterTransactionsByPeriod(sampleTransactions, 'year', targetAugust);
      expect(filtered.length).toBe(4);
    });

    it('returns all transactions when period is all', () => {
      const filtered = filterTransactionsByPeriod(sampleTransactions, 'all');
      expect(filtered.length).toBe(4);
    });
  });

  describe('getRevenueByMonthList & getRevenueByYearList', () => {
    it('groups 12 months for a given year', () => {
      const monthList = getRevenueByMonthList(sampleTransactions, 2026);
      expect(monthList.length).toBe(12);

      const august = monthList[7]; // August is index 7
      expect(august.income).toBe(150000);
      expect(august.expense).toBe(50000);
      expect(august.net).toBe(100000);
    });

    it('groups by year correctly', () => {
      const yearList = getRevenueByYearList(sampleTransactions);
      expect(yearList.length).toBeGreaterThanOrEqual(1);
      const y2026 = yearList.find((y) => y.periodLabel.includes('2026'));
      expect(y2026?.income).toBe(200000);
      expect(y2026?.expense).toBe(50000);
      expect(y2026?.net).toBe(150000);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('computes expenses category breakdown with percentages sorted descending', () => {
      const breakdown = getCategoryBreakdown(sampleTransactions, 'expense');
      expect(breakdown.length).toBe(2);
      expect(breakdown[0].category).toBe('groceries');
      expect(breakdown[0].amount).toBe(40000);
      expect(breakdown[0].percentage).toBe(80); // 40000 / 50000 * 100

      expect(breakdown[1].category).toBe('transport');
      expect(breakdown[1].amount).toBe(10000);
      expect(breakdown[1].percentage).toBe(20);
    });
  });

  describe('getWeekNumber', () => {
    it('returns valid week and year numbers', () => {
      const res = getWeekNumber(new Date('2026-08-11T00:00:00'));
      expect(res.year).toBe(2026);
      expect(res.week).toBeGreaterThan(0);
    });
  });
});
