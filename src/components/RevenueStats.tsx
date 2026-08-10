import React, { useState } from 'react';
import type { Transaction, Settings } from '../types/finance';
import {
  formatCurrency,
  getRevenueByWeekList,
  getRevenueByMonthList,
  getRevenueByYearList,
} from '../utils/financeUtils';
import { TrendingUp, Calendar } from 'lucide-react';

interface RevenueStatsProps {
  transactions: Transaction[];
  settings: Settings;
}

type ModeType = 'week' | 'month' | 'year';

export const RevenueStats: React.FC<RevenueStatsProps> = ({ transactions, settings }) => {
  const [mode, setMode] = useState<ModeType>('month');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const weekList = getRevenueByWeekList(transactions, 10);
  const monthList = getRevenueByMonthList(transactions, selectedYear);
  const yearList = getRevenueByYearList(transactions);

  const currentDataList =
    mode === 'week' ? weekList : mode === 'month' ? monthList : yearList;

  // Calcul du CA total de la sélection
  const totalIncomeSelected = currentDataList.reduce((acc, item) => acc + item.income, 0);
  const totalExpenseSelected = currentDataList.reduce((acc, item) => acc + item.expense, 0);
  const totalNetSelected = totalIncomeSelected - totalExpenseSelected;

  // Recherche du CA maximum pour l'échelle des barres visuelles
  const maxIncome = Math.max(...currentDataList.map((d) => d.income), 1);

  return (
    <div style={{ padding: '0 1rem' }}>
      {/* Header section Mon CA */}
      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp style={{ color: 'var(--income-color)' }} size={28} />
          Chiffre d'Affaires (CA)
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Suivi des ventes et recettes cumulées par période.
        </p>
      </div>

      {/* Boutons de sélection de période : Semaine, Mois, Année */}
      <div className="period-tabs">
        <button
          className={`period-tab ${mode === 'week' ? 'active' : ''}`}
          onClick={() => setMode('week')}
        >
          📅 Par Semaine
        </button>
        <button
          className={`period-tab ${mode === 'month' ? 'active' : ''}`}
          onClick={() => setMode('month')}
        >
          🗓️ Par Mois
        </button>
        <button
          className={`period-tab ${mode === 'year' ? 'active' : ''}`}
          onClick={() => setMode('year')}
        >
          📊 Par Année
        </button>
      </div>

      {/* Si mode Mois, filtre d'année disponible */}
      {mode === 'month' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '1rem', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Année :</span>
          <select
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
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', opacity: 0.9, fontWeight: 600 }}>
          Chiffre d'Affaires Total ({mode === 'week' ? '10 dernières semaines' : mode === 'month' ? `Année ${selectedYear}` : 'Toutes les années'})
        </div>
        <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.4rem 0' }}>
          {formatCurrency(totalIncomeSelected, settings.currency)}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '0.875rem' }}>
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

      {/* Liste détaillée des périodes avec barres visuelles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          Détail par {mode === 'week' ? 'Semaine' : mode === 'month' ? 'Mois' : 'Année'}
        </h3>

        {currentDataList.length === 0 ? (
          <div className="empty-state">
            <Calendar size={36} color="var(--text-light)" />
            <p>Aucune transaction enregistrée pour cette période.</p>
          </div>
        ) : (
          currentDataList.map((item, idx) => {
            const barWidthPercent = Math.min(Math.round((item.income / maxIncome) * 100), 100);

            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                      {item.periodLabel}
                    </div>
                    {item.dateRange !== item.periodLabel && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                        {item.dateRange}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--income-color)' }}>
                      + {formatCurrency(item.income, settings.currency)}
                    </div>
                    {item.expense > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--expense-color)', fontWeight: 600 }}>
                        - {formatCurrency(item.expense, settings.currency)} (Dépenses)
                      </div>
                    )}
                  </div>
                </div>

                {/* Jauge / Barre visuelle du CA */}
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-card-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${barWidthPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
