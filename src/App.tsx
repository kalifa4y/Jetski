import React, { useState, useEffect } from 'react';
import type { Transaction, Settings as SettingsType, Category, TransactionType } from './types/finance';
import {
  loadTransactions,
  saveTransactions,
  loadSettings,
  saveSettings,
  loadCategories,
  addCategory as addCategoryStorage,
  updateCategory as updateCategoryStorage,
  deleteCategory as deleteCategoryStorage,
} from './utils/storage';

import { Navbar } from './components/Navbar';
import type { TabType } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { RevenueStats } from './components/RevenueStats';
import { TransactionList } from './components/TransactionList';
import { Settings } from './components/Settings';
import { TransactionModal } from './components/TransactionModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { PinLockScreen } from './components/PinLockScreen';
import { OnboardingModal } from './components/OnboardingModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [settings, setSettings] = useState<SettingsType>(loadSettings);
  const [categories, setCategories] = useState<Category[]>(loadCategories);

  // Verrouillage de sécurité PIN
  const [isLocked, setIsLocked] = useState<boolean>(
    !!(settings.onboardingCompleted && settings.isPinEnabled && settings.pinCode)
  );

  // Modale d'ajout/édition de transaction
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<TransactionType>('income');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Modale de gestion des catégories
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'light');
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions, categories]);

  const handleOnboardingComplete = (data: {
    ownerName: string;
    currency: string;
    currencySymbol: string;
    initialBalance: number;
    pinCode: string;
  }) => {
    setSettings((prev) => ({
      ...prev,
      ownerName: data.ownerName,
      currency: data.currency,
      currencySymbol: data.currencySymbol,
      pinCode: data.pinCode,
      isPinEnabled: true,
      onboardingCompleted: true,
    }));

    if (data.initialBalance > 0) {
      const initialTx: Transaction = {
        id: `tx-init-${Date.now()}`,
        type: 'income',
        amount: data.initialBalance,
        category: categories[0]?.id || 'cat-1',
        date: new Date().toISOString().split('T')[0],
        note: 'Solde initial de départ',
        createdAt: Date.now(),
      };
      setTransactions((prev) => [initialTx, ...prev]);
    }
  };

  const handleAddCategory = (newCat: Omit<Category, 'id'>) => {
    const updated = addCategoryStorage(newCat);
    setCategories(updated);
  };

  const handleUpdateCategory = (cat: Category) => {
    const updated = updateCategoryStorage(cat);
    setCategories(updated);
  };

  const handleDeleteCategory = (id: string) => {
    const updated = deleteCategoryStorage(id);
    setCategories(updated);
  };

  const handleOpenAddModal = (type: TransactionType) => {
    setEditingTransaction(null);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalType(tx.type);
    setIsModalOpen(true);
  };

  const handleSaveTransaction = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editingTransaction) {
      const updated = transactions.map((t) =>
        t.id === editingTransaction.id ? { ...t, ...data } : t
      );
      setTransactions(updated);
    } else {
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...data,
        createdAt: Date.now(),
      };
      setTransactions([newTx, ...transactions]);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const handleClearData = () => {
    setTransactions([]);
    alert('Toutes les transactions ont été effacées.');
  };

  const handleImportBackup = (data: {
    settings?: SettingsType;
    transactions?: Transaction[];
    categories?: Category[];
  }) => {
    if (data.settings) setSettings(data.settings);
    if (data.transactions) setTransactions(data.transactions);
    if (data.categories) setCategories(data.categories);
  };

  const now = new Date();
  const dayNumber = now.getDate();
  const monthName = now.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '');
  const yearNumber = now.getFullYear();

  return (
    <div className="app-container">
      {/* Écran de déverrouillage PIN si activé */}
      {isLocked && (
        <PinLockScreen
          settings={settings}
          mode="unlock"
          onSuccess={() => setIsLocked(false)}
        />
      )}

      {/* Assistant d'accueil Onboarding si première visite */}
      {!settings.onboardingCompleted && (
        <OnboardingModal
          settings={settings}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Logo et nom à gauche, date à droite */}
      <div className="top-header-banner">
        <div className="brand-header-left">
          <h1 className="logo-text-brand">
            <span className="logo-text-green">NekaWari</span>
            <span className="logo-text-dot">.</span>
          </h1>
        </div>

        <div className="side-large-date-badge">
          <span className="big-day-number">{dayNumber}</span>
          <div className="date-stack">
            <span className="date-month-text">{monthName}</span>
            <span className="date-weekday-text">{yearNumber}</span>
          </div>
        </div>
      </div>

      {/* Vues principales de l'application */}
      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            categories={categories}
            settings={settings}
            onOpenModal={handleOpenAddModal}
            onNavigateToHistory={() => setActiveTab('history')}
            onNavigateToCA={() => setActiveTab('revenue')}
          />
        )}

        {activeTab === 'revenue' && (
          <RevenueStats transactions={transactions} categories={categories} settings={settings} />
        )}

        {activeTab === 'history' && (
          <TransactionList
            transactions={transactions}
            categories={categories}
            settings={settings}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteTransaction}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            settings={settings}
            onUpdateSettings={setSettings}
            transactions={transactions}
            categories={categories}
            onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
            onClearData={handleClearData}
            onImportBackup={handleImportBackup}
          />
        )}
      </main>

      {/* Barre de navigation basse */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Formulaire Modal (Ajout / Édition) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
        initialType={modalType}
        editingTransaction={editingTransaction}
        settings={settings}
        onOpenCategoryManager={() => {
          setIsModalOpen(false);
          setIsCategoryManagerOpen(true);
        }}
      />

      {/* Modale de Gestion des Catégories Personnalisées */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  );
};
export default App;
