import React, { useState } from 'react';
import type { Transaction, Category, Settings, PeriodFilter } from '../types/finance';
import { formatCurrency, formatDateFr } from '../utils/financeUtils';
import { CategoryIcon } from './CategoryIcon';
import { Search, Filter, Trash2, Edit2, History, ArrowDownRight, ArrowUpRight, Tag } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  settings: Settings;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  settings,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');

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

  // Filtrage combiné
  const filtered = transactions.filter((tx) => {
    // Filtre type
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

    // Filtre catégorie spécifique
    if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

    // Filtre recherche textuelle
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const cat = getCategoryDetails(tx.category);
      const matchCat = cat.name.toLowerCase().includes(term);
      const matchNote = (tx.note || '').toLowerCase().includes(term);
      const matchAmount = tx.amount.toString().includes(term);
      if (!matchCat && !matchNote && !matchAmount) return false;
    }

    // Filtre période
    if (periodFilter !== 'all') {
      const txDate = new Date(tx.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (periodFilter === 'week') {
        const d = new Date(today);
        const day = d.getDay() || 7;
        d.setDate(d.getDate() - day + 1); // Lundi de cette semaine
        if (txDate < d) return false;
      } else if (periodFilter === 'month') {
        if (txDate.getMonth() !== today.getMonth() || txDate.getFullYear() !== today.getFullYear()) {
          return false;
        }
      } else if (periodFilter === 'year') {
        if (txDate.getFullYear() !== today.getFullYear()) return false;
      }
    }

    return true;
  });

  // Tri par date décroissante (plus récents en premier)
  const sortedTransactions = [...filtered].sort((a, b) => {
    const dA = new Date(a.date).getTime();
    const dB = new Date(b.date).getTime();
    if (dA === dB) return b.createdAt - a.createdAt;
    return dB - dA;
  });

  return (
    <div className="transactions-section">
      {/* Titre et sous-titre */}
      <div className="section-header" style={{ marginTop: '1rem' }}>
        <h2 className="section-title" style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <History size={24} color="var(--primary-green)" />
          Historique des Opérations
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {sortedTransactions.length} transaction(s)
        </span>
      </div>

      {/* Barre de recherche instantanée */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: '2.5rem', fontSize: '0.95rem' }}
          placeholder="Rechercher par libellé, catégorie ou montant..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search
          size={18}
          color="var(--text-light)"
          style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>

      {/* Boutons de filtres Type (Tout / Revenus / Dépenses) */}
      <div className="type-filters-row">
        <button
          className={`period-tab ${typeFilter === 'all' ? 'active' : ''}`}
          style={{ padding: '0.45rem 0.85rem', flex: 'none', fontSize: '0.85rem' }}
          onClick={() => setTypeFilter('all')}
        >
          Toutes
        </button>
        <button
          className={`period-tab ${typeFilter === 'income' ? 'active' : ''}`}
          style={{ padding: '0.45rem 0.85rem', flex: 'none', fontSize: '0.85rem', color: typeFilter === 'income' ? 'var(--income-color)' : undefined }}
          onClick={() => setTypeFilter('income')}
        >
          <ArrowUpRight size={14} style={{ display: 'inline', marginRight: '0.2rem' }} />
          Revenus uniquement
        </button>
        <button
          className={`period-tab ${typeFilter === 'expense' ? 'active' : ''}`}
          style={{ padding: '0.45rem 0.85rem', flex: 'none', fontSize: '0.85rem', color: typeFilter === 'expense' ? 'var(--expense-color)' : undefined }}
          onClick={() => setTypeFilter('expense')}
        >
          <ArrowDownRight size={14} style={{ display: 'inline', marginRight: '0.2rem' }} />
          Dépenses uniquement
        </button>
      </div>

      {/* Filtre par Catégorie & Filtre Période */}
      <div className="filters-select-grid">
        <div>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.2rem' }}>
            <Tag size={12} /> Catégorie :
          </label>
          <select
            className="form-select"
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.825rem' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
            Période :
          </label>
          <select
            className="form-select"
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.825rem' }}
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
          >
            <option value="all">Tout l'historique</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois-ci</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </div>

      {/* Liste des cartes de transaction */}
      {sortedTransactions.length === 0 ? (
        <div className="empty-state">
          <Filter size={36} color="var(--text-light)" />
          <p style={{ fontWeight: 600 }}>Aucune opération ne correspond à vos critères.</p>
        </div>
      ) : (
        sortedTransactions.map((tx) => {
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
                <div className="tx-actions">
                  <button
                    className="tx-action-btn"
                    onClick={() => onEdit(tx)}
                    title="Modifier"
                    aria-label="Modifier"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="tx-action-btn"
                    onClick={() => {
                      if (window.confirm('Voulez-vous vraiment supprimer cette opération ?')) {
                        onDelete(tx.id);
                      }
                    }}
                    title="Supprimer"
                    aria-label="Supprimer"
                    style={{ color: 'var(--danger-red)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
