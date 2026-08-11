import React, { useState } from 'react';
import type { Transaction, Settings, Category } from '../types/finance';
import {
  formatCurrency,
  getRevenueByWeekList,
  getRevenueByMonthList,
  getRevenueByYearList,
  getCategoryBreakdown,
} from '../utils/financeUtils';
import { CategoryIcon } from './CategoryIcon';
import { TrendingUp, Calendar, CalendarRange, BarChart3, Tag, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface RevenueStatsProps {
  transactions: Transaction[];
  categories: Category[];
  settings: Settings;
}

type ModeType = 'week' | 'month' | 'year';

const PRESET_TILE_COLORS = [
  '#5ebc67', // NekaWari Vert Vif
  '#f43f5e', // Corail
  '#f59e0b', // Ambre / Orange
  '#5ebc67', // NekaWari Vert Vif
  '#5ebc67', // NekaWari Vert Vif
  '#5ebc67', // NekaWari Vert Vif
  '#f59e0b', // Ambre
  '#f43f5e', // Corail
  '#5ebc67', // NekaWari Vert Vif
  '#f43f5e', // Corail
  '#f59e0b', // Ambre
  '#5ebc67', // NekaWari Vert Vif
];

export const RevenueStats: React.FC<RevenueStatsProps> = ({ transactions, categories, settings }) => {
  const [mode, setMode] = useState<ModeType>('month');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [categoryTypeTab, setCategoryTypeTab] = useState<'income' | 'expense'>('income');

  const weekList = getRevenueByWeekList(transactions, 10);
  const monthList = getRevenueByMonthList(transactions, selectedYear);
  const yearList = getRevenueByYearList(transactions);

  const rawDataList =
    mode === 'week' ? weekList : mode === 'month' ? monthList : yearList;

  // N'afficher que les mois, semaines ou années qui ont au moins une transaction enregistrée
  const currentDataList = rawDataList.filter((item) => item.income > 0 || item.expense > 0);

  // Calcul du CA total de la sélection
  const totalIncomeSelected = currentDataList.reduce((acc, item) => acc + item.income, 0);
  const totalExpenseSelected = currentDataList.reduce((acc, item) => acc + item.expense, 0);
  const totalNetSelected = totalIncomeSelected - totalExpenseSelected;

  // Breakdown par catégorie pour la liste filtrée
  const incomeCategoryBreakdown = getCategoryBreakdown(transactions, 'income');
  const expenseCategoryBreakdown = getCategoryBreakdown(transactions, 'expense');

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

  const activeCategoryBreakdown =
    categoryTypeTab === 'income' ? incomeCategoryBreakdown : expenseCategoryBreakdown;

  return (
    <div style={{ padding: '0 1rem' }}>
      {/* Header section Mon CA */}
      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp style={{ color: 'var(--income-color)' }} size={28} />
          Chiffre d'Affaires & Bilan
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Suivi des recettes, des ventes et des résultats par période et catégorie.
        </p>
      </div>

      {/* Boutons de sélection de période : Semaine, Mois, Année */}
      <div className="period-tabs">
        <button
          className={`period-tab ${mode === 'week' ? 'active' : ''}`}
          onClick={() => setMode('week')}
        >
          <Calendar size={14} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
          Par Semaine
        </button>
        <button
          className={`period-tab ${mode === 'month' ? 'active' : ''}`}
          onClick={() => setMode('month')}
        >
          <CalendarRange size={14} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
          Par Mois
        </button>
        <button
          className={`period-tab ${mode === 'year' ? 'active' : ''}`}
          onClick={() => setMode('year')}
        >
          <BarChart3 size={14} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
          Par Année
        </button>
      </div>

      {/* Si mode Mois, filtre d'année disponible */}
      {mode === 'month' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '1rem', gap: '0.5rem' }}>
          <label htmlFor="year-filter" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Année :</label>
          <select
            id="year-filter"
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Résumé global du CA pour la période sélectionnée */}
      <div
        style={{
          background: 'linear-gradient(145deg, #000000 0%, #171717 60%, rgba(94, 188, 103, 0.2) 100%)',
          color: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid rgba(94, 188, 103, 0.3)',
        }}
      >
        <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', opacity: 0.9, fontWeight: 600 }}>
          Chiffre d'Affaires Total ({mode === 'week' ? '10 dernières semaines' : mode === 'month' ? `Année ${selectedYear}` : 'Toutes les années'})
        </div>
        <div style={{ fontSize: 'clamp(1.6rem, 4.5vw, 2.4rem)', fontWeight: 800, margin: '0.4rem 0' }}>
          {formatCurrency(totalIncomeSelected, settings.currency)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '0.875rem' }}>
          <div>
            <span style={{ opacity: 0.8 }}>Total Dépenses : </span>
            <strong style={{ fontWeight: 700 }}>{formatCurrency(totalExpenseSelected, settings.currency)}</strong>
          </div>
          <div>
            <span style={{ opacity: 0.8 }}>Bénéfice Net : </span>
            <strong style={{ fontWeight: 700 }}>{formatCurrency(totalNetSelected, settings.currency)}</strong>
          </div>
        </div>
      </div>

      {/* Section : Répartition du CA et des Dépenses par Catégorie (Grille 4 Colonnes comme le Dessin) */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Tag size={20} color="var(--primary-green)" /> CA & Bilan par Catégorie
          </h3>

          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button
              type="button"
              className={`period-tab ${categoryTypeTab === 'income' ? 'active' : ''}`}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
                color: categoryTypeTab === 'income' ? 'var(--income-color)' : undefined,
              }}
              onClick={() => setCategoryTypeTab('income')}
            >
              <ArrowUpRight size={14} style={{ display: 'inline', marginRight: '0.2rem' }} /> Revenus
            </button>
            <button
              type="button"
              className={`period-tab ${categoryTypeTab === 'expense' ? 'active' : ''}`}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
                color: categoryTypeTab === 'expense' ? 'var(--expense-color)' : undefined,
              }}
              onClick={() => setCategoryTypeTab('expense')}
            >
              <ArrowDownRight size={14} style={{ display: 'inline', marginRight: '0.2rem' }} /> Dépenses
            </button>
          </div>
        </div>

        {activeCategoryBreakdown.length === 0 ? (
          <div className="empty-state">
            <Tag size={36} color="var(--text-light)" />
            <p>Aucune transaction de {categoryTypeTab === 'income' ? 'revenu' : 'dépense'} enregistrée.</p>
          </div>
        ) : (
          /* Grille de Tuiles 4 Colonnes (Représentation exacte du croquis) */
          <div className="category-tiles-grid">
            {activeCategoryBreakdown.map((item) => {
              const cat = getCategoryDetails(item.category);
              return (
                <div
                  key={item.category}
                  className="category-tile-card"
                  style={{
                    backgroundColor: cat.color,
                  }}
                >
                  <div className="category-tile-icon">
                    <CategoryIcon name={cat.icon} size={20} />
                  </div>
                  <div className="category-tile-name">{cat.name}</div>
                  <div className="category-tile-amount">
                    {categoryTypeTab === 'income' ? '+' : '-'} {formatCurrency(item.amount, settings.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grille 4 Colonnes pour Mois, Semaines et Années (Représentation exacte du dessin utilisateur Image 1) */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={20} color="var(--primary-green)" /> Détail par {mode === 'week' ? 'Semaine' : mode === 'month' ? 'Mois' : 'Année'}
        </h3>

        {currentDataList.length === 0 ? (
          <div className="empty-state">
            <Calendar size={36} color="var(--text-light)" />
            <p>Aucune transaction enregistrée pour cette période.</p>
          </div>
        ) : (
          <div className="period-tiles-grid">
            {currentDataList.map((item, idx) => {
              const cardBg = PRESET_TILE_COLORS[idx % PRESET_TILE_COLORS.length];
              return (
                <div
                  key={idx}
                  className="period-tile-card"
                  style={{
                    backgroundColor: cardBg,
                  }}
                >
                  <div className="period-tile-title">
                    {item.dateRange || item.periodLabel}
                  </div>
                  <div className="period-tile-income">
                    + {formatCurrency(item.income, settings.currency)}
                  </div>
                  {item.expense > 0 && (
                    <div className="period-tile-expense">
                      - {formatCurrency(item.expense, settings.currency)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
