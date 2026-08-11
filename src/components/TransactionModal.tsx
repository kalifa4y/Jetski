import React, { useState, useEffect } from 'react';
import type { Transaction, TransactionType, Category, Settings } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { X, Plus, Minus, Calendar, FileText, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  categories: Category[];
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  settings: Settings;
  onOpenCategoryManager: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialType = 'income',
  editingTransaction = null,
  settings,
  onOpenCategoryManager,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setSelectedCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setNote(editingTransaction.note || '');
    } else {
      setType(initialType);
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');

      // Catégorie par défaut en fonction du type
      const available = categories.filter((c) => c.type === initialType || c.type === 'both');
      if (available.length > 0) {
        setSelectedCategory(available[0].id);
      }
    }
  }, [isOpen, editingTransaction, initialType, categories]);

  // Si le type change, mettre à jour la catégorie sélectionnée
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const available = categories.filter((c) => c.type === newType || c.type === 'both');
    if (available.length > 0) {
      setSelectedCategory(available[0].id);
    }
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Veuillez entrer un montant valide supérieur à 0.');
      return;
    }

    if (!selectedCategory) {
      alert('Veuillez choisir une catégorie.');
      return;
    }

    // Animation de confettis si c'est un Revenu
    if (type === 'income' && !editingTransaction) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignorer si indisponible
      }
    }

    onSave({
      type,
      amount: numAmount,
      category: selectedCategory,
      date,
      note: note.trim(),
    });

    onClose();
  };

  const addPresetAmount = (value: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + value).toString());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* En-tête de la modale */}
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: type === 'income' ? 'var(--income-color)' : 'var(--expense-color)' }}>
            {type === 'income' ? (
              <>
                <Plus size={24} /> Nouveau Revenu (Entrée d'argent)
              </>
            ) : (
              <>
                <Minus size={24} /> Nouvelle Dépense (Sortie d'argent)
              </>
            )}
          </h3>
          <button className="close-btn" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Bascule Type : Revenu vs Dépense */}
          <div className="form-group">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'var(--bg-card-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
              <button
                type="button"
                style={{
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  background: type === 'income' ? 'var(--income-color)' : 'transparent',
                  color: type === 'income' ? 'white' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => handleTypeChange('income')}
              >
                <Plus size={18} /> + REVENU
              </button>
              <button
                type="button"
                style={{
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  background: type === 'expense' ? 'var(--expense-color)' : 'transparent',
                  color: type === 'expense' ? 'white' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => handleTypeChange('expense')}
              >
                <Minus size={18} /> - DÉPENSE
              </button>
            </div>
          </div>

          {/* Saisie du Montant */}
          <div className="form-group">
            <label className="form-label">Montant ({settings.currency}) *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="any"
                min="0"
                className="form-input form-input-amount"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
              />
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-light)', fontSize: '1rem' }}>
                {settings.currencySymbol}
              </span>
            </div>

            {/* Raccourcis de montants rapides */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              {[1000, 5000, 10000, 25000, 50000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  style={{
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card-subtle)',
                    color: 'var(--text-main)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => addPresetAmount(preset)}
                >
                  +{preset.toLocaleString('fr-FR')}
                </button>
              ))}
              <button
                type="button"
                style={{
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card-subtle)',
                  color: 'var(--text-muted)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => setAmount('')}
              >
                Effacer
              </button>
            </div>
          </div>

          {/* Choix de la Catégorie */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Catégorie *</label>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onClick={onOpenCategoryManager}
              >
                + Nouvelle catégorie
              </button>
            </div>
            <div className="categories-grid">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-chip ${selectedCategory === cat.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: cat.color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CategoryIcon name={cat.icon} size={16} />
                  </div>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Saisie de la Date */}
          <div className="form-group">
            <label className="form-label">
              <Calendar size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />
              Date de l'opération
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <button
                type="button"
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  color: 'var(--text-main)',
                }}
                onClick={() => setDate(new Date().toISOString().split('T')[0])}
              >
                Aujourd'hui
              </button>
            </div>
          </div>

          {/* Remarque ou Note */}
          <div className="form-group">
            <label className="form-label">
              <FileText size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />
              Remarque / Note (Optionnel)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="ex: Client Mr Koffi, Achat sucre & lait..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Bouton de validation Géant */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '1rem',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: type === 'income' ? 'var(--income-color)' : 'var(--expense-color)',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '1.25rem',
            }}
          >
            <CheckCircle size={22} />
            {editingTransaction ? 'Enregistrer les modifications' : type === 'income' ? 'Ajouter ce Revenu' : 'Ajouter cette Dépense'}
          </button>
        </form>
      </div>
    </div>
  );
};
