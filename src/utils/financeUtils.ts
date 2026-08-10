import type { Transaction, PeriodFilter, PeriodSummary, RevenueBreakdown } from '../types/finance';

export const formatCurrency = (amount: number, currency: string = 'FCFA'): string => {
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  return `${sign}${formatted} ${currency}`;
};

export const formatDateFr = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const formatDateShort = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
};

export const getWeekNumber = (date: Date): { year: number; week: number } => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
};

export const getWeekDateRange = (year: number, week: number): { start: Date; end: Date } => {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + (8 - simple.getDay()));
  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
  return { start: ISOweekStart, end: ISOweekEnd };
};

export const filterTransactionsByPeriod = (
  transactions: Transaction[],
  period: PeriodFilter,
  targetDate: Date = new Date()
): Transaction[] => {
  const refDate = new Date(targetDate);
  refDate.setHours(0, 0, 0, 0);

  return transactions.filter((t) => {
    const tDate = new Date(t.date + 'T00:00:00');
    tDate.setHours(0, 0, 0, 0);

    if (period === 'week') {
      const { year: refYear, week: refWeek } = getWeekNumber(refDate);
      const { year: tYear, week: tWeek } = getWeekNumber(tDate);
      return refYear === tYear && refWeek === tWeek;
    }

    if (period === 'month') {
      return (
        tDate.getMonth() === refDate.getMonth() &&
        tDate.getFullYear() === refDate.getFullYear()
      );
    }

    if (period === 'year') {
      return tDate.getFullYear() === refDate.getFullYear();
    }

    return true; // 'all'
  });
};

export const calculateSummary = (transactions: Transaction[]): PeriodSummary => {
  let totalIncome = 0;
  let totalExpenses = 0;
  const incomeCategoryTotals: Record<string, number> = {};
  const expenseCategoryTotals: Record<string, number> = {};

  transactions.forEach((t) => {
    if (t.type === 'income') {
      totalIncome += t.amount;
      incomeCategoryTotals[t.category] = (incomeCategoryTotals[t.category] || 0) + t.amount;
    } else {
      totalExpenses += t.amount;
      expenseCategoryTotals[t.category] = (expenseCategoryTotals[t.category] || 0) + t.amount;
    }
  });

  const getTopCat = (totals: Record<string, number>) => {
    let topName = '';
    let maxVal = 0;
    Object.entries(totals).forEach(([cat, val]) => {
      if (val > maxVal) {
        maxVal = val;
        topName = cat;
      }
    });
    return maxVal > 0 ? { name: topName, amount: maxVal } : undefined;
  };

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    topIncomeCategory: getTopCat(incomeCategoryTotals),
    topExpenseCategory: getTopCat(expenseCategoryTotals),
  };
};

/**
 * Group revenue (Chiffre d'Affaires) by week for a given year/month context
 */
export const getRevenueByWeekList = (
  transactions: Transaction[],
  weeksCount: number = 8
): RevenueBreakdown[] => {
  const now = new Date();
  const results: RevenueBreakdown[] = [];

  for (let i = 0; i < weeksCount; i++) {
    const target = new Date();
    target.setDate(now.getDate() - i * 7);
    const { year, week } = getWeekNumber(target);
    const { start, end } = getWeekDateRange(year, week);

    const weekTx = transactions.filter((t) => {
      const d = new Date(t.date + 'T00:00:00');
      return d >= start && d <= end;
    });

    const income = weekTx.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = weekTx.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    const startStr = `${start.getDate()} ${start.toLocaleDateString('fr-FR', { month: 'short' })}`;
    const endStr = `${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'short' })}`;

    results.push({
      periodLabel: `Semaine ${week} (${year})`,
      dateRange: `Du ${startStr} au ${endStr}`,
      income,
      expense,
      net: income - expense,
    });
  }

  return results;
};

/**
 * Group revenue (Chiffre d'Affaires) by month for a given year
 */
export const getRevenueByMonthList = (
  transactions: Transaction[],
  year: number = new Date().getFullYear()
): RevenueBreakdown[] => {
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return monthNames.map((monthName, idx) => {
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getFullYear() === year && d.getMonth() === idx;
    });

    const income = monthTx.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthTx.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    return {
      periodLabel: `${monthName} ${year}`,
      dateRange: monthName,
      income,
      expense,
      net: income - expense,
    };
  });
};

/**
 * Group revenue (Chiffre d'Affaires) by year
 */
export const getRevenueByYearList = (transactions: Transaction[]): RevenueBreakdown[] => {
  const yearsSet = new Set<number>();
  const currentYear = new Date().getFullYear();
  yearsSet.add(currentYear);

  transactions.forEach((t) => {
    const y = new Date(t.date + 'T00:00:00').getFullYear();
    if (!isNaN(y)) yearsSet.add(y);
  });

  const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);

  return sortedYears.map((year) => {
    const yearTx = transactions.filter((t) => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getFullYear() === year;
    });

    const income = yearTx.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = yearTx.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    return {
      periodLabel: `Année ${year}`,
      dateRange: `1 Jan - 31 Déc ${year}`,
      income,
      expense,
      net: income - expense,
    };
  });
};

export const getCategoryBreakdown = (
  transactions: Transaction[],
  type: 'income' | 'expense'
) => {
  const totals: Record<string, number> = {};
  let totalSum = 0;

  transactions
    .filter((t) => t.type === type)
    .forEach((t) => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
      totalSum += t.amount;
    });

  return Object.entries(totals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSum > 0 ? Math.round((amount / totalSum) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
};
