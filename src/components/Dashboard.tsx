import React from 'react';
import type { Transaction, Category, Settings } from '../types/finance';
import { formatCurrency, formatDateFr, calculateSummary, getCategoryBreakdown } from '../utils/financeUtils';
import { CategoryIcon } from './CategoryIcon';
import { Plus, Minus, ArrowUpRight, ArrowDownRight, ChevronRight, History, Wallet } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  settings: Settings;
  onOpenModal: (type: 'income' | 'expense') => void;
  onNavigateToHistory: () => void;
  onNavigateToCA: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  categories,
  settings,
  onOpenModal,
  onNavigateToHistory,
}) => {
  const summary = calculateSummary(transactions);

  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthSummary = calculateSummary(currentMonthTransactions);

  const incomeCategories = getCategoryBreakdown(currentMonthTransactions, 'income');
  const expenseCategories = getCategoryBreakdown(currentMonthTransactions, 'expense');

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt)
    .slice(0, 5);

  const getCategoryDetails = (catId: string): Category => {
    const found = categories.find((c) => c.id === catId);
    if (found) return found;
    return {
      id: catId,
      name: catId,
      icon: 'CircleDollarSign',
      color: '#64748b',
      type: 'both',
    };
  };



  return (
    <div className="dashboard-root">
      <div className="dashboard-responsive-row">
        <div>
          {/* Hero Balance Card */}
          <div className="balance-hero-card">
            <div className="balance-hero-inner">
              <div className="balance-icon-wrap">
                <Wallet size={20} />
              </div>
              <div className="balance-label">SOLDE ACTUEL</div>
              <div className={`balance-amount ${summary.balance < 0 ? 'negative' : ''}`}>
                {formatCurrency(summary.balance, settings.currency)}
              </div>
            </div>

            {/* Mini résumé du mois intégré */}
            <div className="balance-month-strip">
              <div className="month-strip-item income">
                <ArrowUpRight size={14} />
                <span>+{formatCurrency(monthSummary.totalIncome, settings.currency)}</span>
              </div>
              <div className="month-strip-separator" />
              <div className="month-strip-item expense">
                <ArrowDownRight size={14} />
                <span>-{formatCurrency(monthSummary.totalExpenses, settings.currency)}</span>
              </div>
            </div>
          </div>

          {/* Boutons rapides */}
          <div className="quick-actions-grid">
            <button
              className="action-btn action-btn-income"
              onClick={() => onOpenModal('income')}
              aria-label="Ajouter un revenu"
            >
              <div className="action-btn-icon">
                <Plus size={22} strokeWidth={3} />
              </div>
              <span>Revenu</span>
            </button>

            <button
              className="action-btn action-btn-expense"
              onClick={() => onOpenModal('expense')}
              aria-label="Ajouter une dépense"
            >
              <div className="action-btn-icon">
                <Minus size={22} strokeWidth={3} />
              </div>
              <span>Dépense</span>
            </button>
          </div>
        </div>

        {/* Dernières transactions */}
        <div className="transactions-section">
          <div className="section-header">
          <h3 className="section-title">Dernières Opérations</h3>
          <button
            onClick={onNavigateToHistory}
            className="section-header-link"
          >
            Tout voir <ChevronRight size={16} />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="empty-state">
            <History size={36} color="var(--text-light)" />
            <p>Aucune transaction enregistrée.</p>
          </div>
        ) : (
          recentTransactions.map((tx) => {
            const cat = getCategoryDetails(tx.category);
            return (
              <div key={tx.id} className="transaction-card">
                <div className="tx-left">
                  <div
                    className={`tx-icon ${tx.type}`}
                    style={{ background: `${cat.color}18`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} size={22} />
                  </div>
                  <div className="tx-info">
                    <span className="tx-category">{cat.name}</span>
                    <span className="tx-date">{formatDateFr(tx.date)}</span>
                    {tx.note && <span className="tx-note">"{tx.note}"</span>}
                  </div>
                </div>

                <div className="tx-right">
                  <span className={`tx-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount, settings.currency)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      </div>

      {/* Répartition des dépenses ce mois-ci */}
      {expenseCategories.length > 0 && (
        <div style={{ padding: '0 1rem', marginBottom: '1.5rem' }}>
          <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>
            Dépenses par catégorie
          </h3>
          <div className="category-tiles-grid">
            {expenseCategories.slice(0, 8).map((item) => {
              const cat = getCategoryDetails(item.category);
              return (
                <div
                  key={item.category}
                  className="category-tile-card"
                  style={{ backgroundColor: cat.color }}
                >
                  <div className="category-tile-icon">
                    <CategoryIcon name={cat.icon} size={20} />
                  </div>
                  <div className="category-tile-name">{cat.name}</div>
                  <div className="category-tile-amount">
                    - {formatCurrency(item.amount, settings.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Répartition des revenus ce mois-ci */}
      {incomeCategories.length > 0 && (
        <div style={{ padding: '0 1rem', marginBottom: '1.5rem' }}>
          <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>
            Revenus par catégorie
          </h3>
          <div className="category-tiles-grid">
            {incomeCategories.slice(0, 8).map((item) => {
              const cat = getCategoryDetails(item.category);
              return (
                <div
                  key={item.category}
                  className="category-tile-card"
                  style={{ backgroundColor: cat.color }}
                >
                  <div className="category-tile-icon">
                    <CategoryIcon name={cat.icon} size={20} />
                  </div>
                  <div className="category-tile-name">{cat.name}</div>
                  <div className="category-tile-amount">
                    + {formatCurrency(item.amount, settings.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
