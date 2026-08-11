import React, { useState } from 'react';
import type { Category, TransactionType } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { X, Plus, Trash2, Edit2, Tag, Palette, Check } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const PRESET_ICONS = [
  'Briefcase',
  'Laptop',
  'ShoppingBag',
  'HeartHandshake',
  'Gift',
  'PlusCircle',
  'ShoppingCart',
  'Home',
  'Car',
  'Zap',
  'Tv',
  'Coffee',
  'Activity',
  'Tag',
  'Package',
  'MinusCircle',
  'Truck',
  'Box',
  'FileText',
  'UserCheck',
  'Utensils',
  'Store',
  'Heart',
  'Smile',
  'DollarSign',
  'Sparkles',
  'Layers',
];

const PRESET_COLORS = [
  '#5ebc67',
  '#34a84d',
  '#2a8f40',
  '#14b8a6',
  '#3b82f6',
  '#6366f1',
  '#ef4444',
  '#dc2626',
  '#f59e0b',
  '#eab308',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#b91c1c',
  '#64748b',
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('income');
  const [color, setColor] = useState('#5ebc67');
  const [icon, setIcon] = useState('Briefcase');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setName(cat.name);
    setType(cat.type === 'both' ? 'income' : cat.type);
    setColor(cat.color);
    setIcon(cat.icon);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingCatId(null);
    setName('');
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Veuillez saisir un nom de catégorie.');
      return;
    }

    if (editingCatId) {
      const existing = categories.find((c) => c.id === editingCatId);
      if (existing) {
        onUpdateCategory({
          ...existing,
          name: name.trim(),
          type,
          color,
          icon,
        });
      }
      setEditingCatId(null);
      setSuccessMsg('Catégorie modifiée avec succès !');
    } else {
      onAddCategory({
        name: name.trim(),
        type,
        color,
        icon,
        isCustom: true,
      });
      setSuccessMsg('Catégorie ajoutée avec succès !');
    }

    setName('');
    setShowForm(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const filteredCategories = categories.filter((c) => {
    if (filterType === 'income') return c.type === 'income' || c.type === 'both';
    if (filterType === 'expense') return c.type === 'expense' || c.type === 'both';
    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Tag size={22} color="var(--primary-green)" /> Gestion des Catégories
          </h3>
          <button className="close-btn" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        {successMsg && (
          <div style={{
            position: 'fixed',
            top: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--primary-green)',
            color: 'white',
            padding: '0.8rem 1.5rem',
            borderRadius: 'var(--radius-full)',
            zIndex: 9999,
            fontWeight: 700,
            boxShadow: '0 10px 25px rgba(94, 188, 103, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <Check size={20} />
            {successMsg}
          </div>
        )}

        {!showForm && !editingCatId && (
          <button 
            type="button"
            className="btn btn-primary btn-block" 
            onClick={() => setShowForm(true)} 
            style={{ marginBottom: '1.25rem' }}
          >
            <Plus size={18} /> Créer une nouvelle catégorie
          </button>
        )}

        {(showForm || editingCatId) && (
          <form
            onSubmit={handleSubmit}
            style={{
              background: 'var(--bg-card-subtle)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              border: '1.5px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {editingCatId ? <Edit2 size={18} color="var(--primary-green)" /> : <Plus size={18} color="var(--primary-green)" />}
                {editingCatId ? 'Modifier la catégorie' : 'Créer une catégorie'}
              </h4>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>
                {editingCatId ? "Annuler l'édition" : "Annuler"}
              </button>
            </div>

          <div className="form-group">
            <label className="form-label">Nom de la catégorie</label>
            <input
              type="text"
              className="form-input"
              placeholder="ex: Alimentation, Transports, Vente de Jus..."
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
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  style={{
                    width: '32px',
                    height: '32px',
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
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', maxHeight: '110px', overflowY: 'auto' }}>
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-sm)',
                    background: icon === ic ? 'var(--green-bg)' : 'var(--bg-card)',
                    border: icon === ic ? '2px solid var(--primary-green)' : '1px solid var(--border-color)',
                    color: icon === ic ? 'var(--primary-green)' : 'var(--text-main)',
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

          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '0.5rem' }}>
            {editingCatId ? <Check size={18} /> : <Plus size={18} />}
            {editingCatId ? 'Enregistrer les modifications' : 'Ajouter cette catégorie'}
          </button>
        </form>

        {/* Filtrage & Liste des catégories */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
            Catégories ({filteredCategories.length})
          </h4>
          <div className="period-tabs" style={{ marginBottom: 0 }}>
            <button
              type="button"
              className={`period-tab ${filterType === 'all' ? 'active' : ''}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              onClick={() => setFilterType('all')}
            >
              Toutes
            </button>
            <button
              type="button"
              className={`period-tab ${filterType === 'income' ? 'active' : ''}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              onClick={() => setFilterType('income')}
            >
              Revenus
            </button>
            <button
              type="button"
              className={`period-tab ${filterType === 'expense' ? 'active' : ''}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              onClick={() => setFilterType('expense')}
            >
              Dépenses
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.85rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    background: `${cat.color}18`,
                    color: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CategoryIcon name={cat.icon} size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cat.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                    {cat.type === 'income' ? 'Revenu' : cat.type === 'expense' ? 'Dépense' : 'Tous types'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="tx-action-btn"
                  onClick={() => handleStartEdit(cat)}
                  title="Éditer la catégorie"
                >
                  <Edit2 size={16} color="var(--primary-green)" />
                </button>
                <button
                  type="button"
                  className="tx-action-btn"
                  onClick={() => {
                    if (window.confirm(`Supprimer la catégorie "${cat.name}" ?`)) {
                      onDeleteCategory(cat.id);
                    }
                  }}
                  title="Supprimer la catégorie"
                >
                  <Trash2 size={16} color="var(--danger-red)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
