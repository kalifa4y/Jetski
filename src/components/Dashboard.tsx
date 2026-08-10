import React from 'react';
import type { Transaction, Category, Settings } from '../types/finance';
import { formatCurrency, formatDateFr, calculateSummary, getCategoryBreakdown } from '../utils/financeUtils';
import { CategoryIcon } from './CategoryIcon';
import { Plus, Minus, ArrowUpRight, ArrowDownRight, TrendingUp, Sparkles, ChevronRight, History } from 'lucide-react';

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
  onNavigateToCA,
}) => {
  // Bilan global
  const summary = calculateSummary(transactions);

  // Bilan du mois en cours
  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthSummary = calculateSummary(currentMonthTransactions);

  // Répartition des catégories de dépenses du mois
  const expenseCategories = getCategoryBreakdown(currentMonthTransactions, 'expense');

  // Les 4 dernières transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt)
    .slice(0, 4);

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
    <div>
      {/* Hero Card : Solde Actuel */}
      <div className="balance-hero-card">
        <div className="balance-label">SOLDE DISPONIBLE</div>
        <div className={`balance-amount ${summary.balance < 0 ? 'negative' : ''}`}>
          {formatCurrency(summary.balance, settings.currency)}
        </div>
        <div className="balance-badge">
          <Sparkles size={16} color="#10b981" />
          {monthSummary.totalIncome > 0 ? (
            <span>CA ce mois : <strong>+{formatCurrency(monthSummary.totalIncome, settings.currency)}</strong></span>
          ) : (
            <span>Comptes à jour</span>
          )}
        </div>
      </div>

      {/* Boutons d'actions rapides géants : + REVENU / - DÉPENSE */}
      <div className="quick-actions-grid">
        <button
          className="action-btn action-btn-income"
          onClick={() => onOpenModal('income')}
          aria-label="Ajouter un revenu"
        >
          <div className="action-btn-icon">
            <Plus size={24} />
          </div>
          <span>+ REVENU</span>
        </button>

        <button
          className="action-btn action-btn-expense"
          onClick={() => onOpenModal('expense')}
          aria-label="Ajouter une dépense"
        >
          <div className="action-btn-icon">
            <Minus size={24} />
          </div>
          <span>- DÉPENSE</span>
        </button>
      </div>

      {/* Cartes de synthèse financière du mois */}
      <div className="summary-cards-grid">
        <div className="summary-card income-summary">
          <div className="summary-title">
            <ArrowUpRight size={16} color="var(--income-color)" />
            Revenus du mois
          </div>
          <div className="summary-value income">
            +{formatCurrency(monthSummary.totalIncome, settings.currency)}
          </div>
        </div>

        <div className="summary-card expense-summary">
          <div className="summary-title">
            <ArrowDownRight size={16} color="var(--expense-color)" />
            Dépenses du mois
          </div>
          <div className="summary-value expense">
            -{formatCurrency(monthSummary.totalExpenses, settings.currency)}
          </div>
        </div>
      </div>

      {/* Bannière d'accès rapide au Chiffre d'Affaires (CA) */}
      <div style={{ padding: '0 1rem', marginBottom: '1.25rem' }}>
        <button
          onClick={onNavigateToCA}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            padding: '0.9rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--primary-hover)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrendingUp size={22} color="var(--primary)" />
            <span>Voir mon Chiffre d'Affaires (Semaine, Mois, Année)</span>
          </div>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Section des 4 dernières opérations */}
      <div className="transactions-section">
        <div className="section-header">
          <h3 className="section-title">Dernières Opérations</h3>
          <button
            onClick={onNavigateToHistory}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
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

      {/* Aperçu des dépenses par catégorie si disponible */}
      {expenseCategories.length > 0 && (
        <div style={{ padding: '0 1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
            Où va l'argent ce mois-ci ?
          </h3>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {expenseCategories.slice(0, 3).map((item) => {
              const cat = getCategoryDetails(item.category);
              return (
                <div key={item.category} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color }} />
                      {cat.name}
                    </span>
                    <span>{formatCurrency(item.amount, settings.currency)} ({item.percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-card-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.percentage}%`, height: '100%', background: cat.color }} />
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
