import type { Category, Settings } from '../types/finance';

export const DEFAULT_CATEGORIES: Category[] = [
  // Income categories (Revenus d'activité)
  { id: 'sales', name: 'Vente de produits / Glaces', icon: 'ShoppingBag', color: '#16a34a', type: 'income' },
  { id: 'orders', name: 'Commandes & Événements', icon: 'Gift', color: '#0d9488', type: 'income' },
  { id: 'delivery', name: 'Livraisons', icon: 'Truck', color: '#2563eb', type: 'income' },
  { id: 'other_income', name: 'Autre Revenu', icon: 'PlusCircle', color: '#059669', type: 'income' },

  // Expense categories (Dépenses & Retraits)
  { id: 'ingredients', name: 'Matériel & Ingrédients', icon: 'Package', color: '#dc2626', type: 'expense' },
  { id: 'packaging', name: 'Emballages & Pots', icon: 'Box', color: '#ea580c', type: 'expense' },
  { id: 'electricity', name: 'Électricité & Froid', icon: 'Zap', color: '#ca8a04', type: 'expense' },
  { id: 'transport', name: 'Transport & Déplacements', icon: 'Car', color: '#7c3aed', type: 'expense' },
  { id: 'bills', name: 'Factures & Loyer', icon: 'FileText', color: '#e11d48', type: 'expense' },
  { id: 'personal_withdrawal', name: 'Retrait Personnel / Salaire', icon: 'UserCheck', color: '#9333ea', type: 'expense' },
  { id: 'other_expense', name: 'Autre Dépense', icon: 'MinusCircle', color: '#64748b', type: 'expense' },
];

export const DEFAULT_SETTINGS: Settings = {
  currency: 'FCFA',
  currencySymbol: 'FCFA',
  businessName: 'Gestion Glaces & Activité',
  ownerName: 'Maman',
  theme: 'light',
  defaultPeriod: 'month',
};

export const CURRENCIES = [
  { code: 'FCFA', symbol: 'FCFA', label: 'Franc CFA (FCFA)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'USD', symbol: '$', label: 'Dollar ($)' },
  { code: 'MAD', symbol: 'DH', label: 'Dirham (DH)' },
  { code: 'DZD', symbol: 'DA', label: 'Dinar (DA)' },
  { code: 'TND', symbol: 'DT', label: 'Dinar Tunisien (DT)' },
  { code: 'GNF', symbol: 'FG', label: 'Franc Guinéen (FG)' },
];
