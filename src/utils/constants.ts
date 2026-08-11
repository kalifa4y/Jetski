import type { Category, Settings } from '../types/finance';

export const DEFAULT_CATEGORIES: Category[] = [
  // Income categories (Revenus & Rentrées d'argent) - Green/Teal shades
  { id: 'salary', name: 'Salaire / Revenu Principal', icon: 'Briefcase', color: '#5ebc67', type: 'income' },
  { id: 'freelance', name: 'Projets & Freelance', icon: 'Laptop', color: '#5ebc67', type: 'income' },
  { id: 'sales', name: 'Ventes & Commerce', icon: 'ShoppingBag', color: '#5ebc67', type: 'income' },
  { id: 'allowance', name: 'Allocations & Aides', icon: 'HeartHandshake', color: '#5ebc67', type: 'income' },
  { id: 'gifts', name: 'Cadeaux & Entrées occasionnelles', icon: 'Gift', color: '#3b82f6', type: 'income' },
  { id: 'other_income', name: 'Autre Revenu', icon: 'PlusCircle', color: '#6366f1', type: 'income' },

  // Expense categories (Dépenses & Charges) - Red/Coral/Amber/Purple shades
  { id: 'groceries', name: 'Alimentation & Courses', icon: 'ShoppingCart', color: '#ef4444', type: 'expense' },
  { id: 'housing', name: 'Logement & Loyer', icon: 'Home', color: '#dc2626', type: 'expense' },
  { id: 'transport', name: 'Transport & Carburant', icon: 'Car', color: '#f59e0b', type: 'expense' },
  { id: 'bills', name: 'Factures & Électricité', icon: 'Zap', color: '#eab308', type: 'expense' },
  { id: 'subscriptions', name: 'Abonnements & Internet', icon: 'Tv', color: '#8b5cf6', type: 'expense' },
  { id: 'leisure', name: 'Loisirs, Sorties & Resto', icon: 'Coffee', color: '#ec4899', type: 'expense' },
  { id: 'health', name: 'Santé & Bien-être', icon: 'Activity', color: '#06b6d4', type: 'expense' },
  { id: 'shopping', name: 'Shopping & Vêtements', icon: 'Tag', color: '#f97316', type: 'expense' },
  { id: 'business_expense', name: 'Stock & Activité Pro', icon: 'Package', color: '#b91c1c', type: 'expense' },
  { id: 'other_expense', name: 'Autre Dépense', icon: 'MinusCircle', color: '#64748b', type: 'expense' },
];

export const DEFAULT_SETTINGS: Settings = {
  currency: 'FCFA',
  currencySymbol: 'FCFA',
  businessName: 'NekaWari',
  ownerName: 'Utilisateur',
  userEmail: '',
  theme: 'light',
  defaultPeriod: 'month',
  isPinEnabled: false,
  pinCode: '',
  onboardingCompleted: false,
};

export const CURRENCIES = [
  { code: 'FCFA', symbol: 'FCFA', label: 'Franc CFA (FCFA)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'USD', symbol: '$', label: 'Dollar ($)' },
  { code: 'MAD', symbol: 'DH', label: 'Dirham (DH)' },
  { code: 'DZD', symbol: 'DA', label: 'Dinar (DA)' },
  { code: 'TND', symbol: 'DT', label: 'Dinar Tunisien (DT)' },
  { code: 'GNF', symbol: 'FG', label: 'Franc Guinéen (FG)' },
  { code: 'HTG', symbol: 'G', label: 'Gourde Haïtienne (G)' },
];

