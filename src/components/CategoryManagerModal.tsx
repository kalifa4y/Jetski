import React, { useState } from 'react';
import type { Category, TransactionType } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { X, Plus, Trash2, Tag, Palette } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
}

const PRESET_ICONS = [
  'ShoppingBag',
  'Gift',
  'Truck',
  'Package',
  'Box',
  'Zap',
  'Car',
  'FileText',
  'UserCheck',
  'Coffee',
  'Utensils',
  'Store',
  'Heart',
  'Smile',
  'Briefcase',
  'DollarSign',
  'Sparkles',
  'Layers',
];

const PRESET_COLORS = [
  '#16a34a',
  '#0d9488',
  '#2563eb',
  '#059669',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#7c3aed',
  '#e11d48',
  '#9333ea',
  '#0284c7',
  '#475569',
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('income');
  const [color, setColor] = useState('#16a34a');
  const [icon, setIcon] = useState('ShoppingBag');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Veuillez saisir un nom de catégorie.');
      return;
    }

    onAddCategory({
      name: name.trim(),
      type,
      color,
      icon,
      isCustom: true,
    });

    setName('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Tag size={22} color="var(--primary)" /> Gestion des Catégories
          </h3>
          <button className="close-btn" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        {/* Formulaire de création de catégorie */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--bg-card-subtle)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-color)',
          }}
        >
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={18} color="var(--primary)" /> Ajouter une nouvelle catégorie
          </h4>

          <div className="form-group">
            <label className="form-label">Nom de la catégorie</label>
            <input
              type="text"
              className="form-input"
              placeholder="ex: Vente de Jus, Emballages spéciaux..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Type d'opération</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                className={`period-tab ${type === 'income' ? 'active' : ''}`}
                style={{
                  padding: '0.65rem',
                  fontSize: '0.85rem',
                  color: type === 'income' ? 'var(--income-color)' : undefined,
                }}
                onClick={() => setType('income')}
              >
                + Revenu (Entrée)
              </button>
              <button
                type="button"
                className={`period-tab ${type === 'expense' ? 'active' : ''}`}
                style={{
                  padding: '0.65rem',
                  fontSize: '0.85rem',
                  color: type === 'expense' ? 'var(--expense-color)' : undefined,
                }}
                onClick={() => setType('expense')}
              >
                - Dépense (Sortie)
              </button>
            </div>
          </div>

          {/* Choix de la couleur */}
          <div className="form-group">
            <label className="form-label">
              <Palette size={14} style={{ display: 'inline', marginRight: '0.2rem' }} /> Couleur
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '3px solid var(--text-main)' : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Choix de l'icône */}
          <div className="form-group">
            <label className="form-label">Icône</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto' }}>
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    background: icon === ic ? 'var(--primary-bg)' : 'var(--bg-card)',
                    border: icon === ic ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    color: icon === ic ? 'var(--primary)' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => setIcon(ic)}
                >
                  <CategoryIcon name={ic} size={18} />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '0.5rem',
            }}
          >
            Créer cette catégorie
          </button>
        </form>

        {/* Liste des catégories existantes */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Toutes les catégories disponibles ({categories.length})
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: cat.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CategoryIcon name={cat.icon} size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{cat.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    {cat.type === 'income' ? 'Revenu' : cat.type === 'expense' ? 'Dépense' : 'Les deux'}
                    {cat.isCustom && ' • Personnalisée'}
                  </div>
                </div>
              </div>

              {cat.isCustom && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                  onClick={() => {
                    if (window.confirm(`Supprimer la catégorie "${cat.name}" ?`)) {
                      onDeleteCategory(cat.id);
                    }
                  }}
                  title="Supprimer la catégorie"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
