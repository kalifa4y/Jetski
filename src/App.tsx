import React, { useState, useEffect } from 'react';
import type { Transaction, Settings as SettingsType, Category, TransactionType } from './types/finance';
import {
  loadTransactions,
  saveTransactions,
  loadSettings,
  saveSettings,
  loadCategories,
  addCategory as addCategoryStorage,
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
import { Download } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [settings, setSettings] = useState<SettingsType>(loadSettings);
  const [categories, setCategories] = useState<Category[]>(loadCategories);

  // Modale d'ajout/édition de transaction
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<TransactionType>('income');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Modale de gestion des catégories
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState<boolean>(false);

  // Support PWA Installation Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'light');
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions, categories]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    }
  };

  const handleAddCategory = (newCat: Omit<Category, 'id'>) => {
    const updated = addCategoryStorage(newCat);
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

  const handleImportBackup = (data: { settings?: SettingsType; transactions?: Transaction[]; categories?: Category[] }) => {
    if (data.settings) setSettings(data.settings);
    if (data.transactions) setTransactions(data.transactions);
    if (data.categories) setCategories(data.categories);
  };

  const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  return (
    <div className="app-container">
      {/* En-tête mobile native */}
      <header className="app-header">
        <div className="brand-info">
          <div className="brand-icon" style={{ background: 'transparent', boxShadow: 'none', padding: 0, width: '42px', height: '42px' }}>
            <img src="/logo.svg" alt="Logo NekaWari" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div className="brand-title">{settings.businessName || 'NekaWari'}</div>
            <div className="brand-subtitle" style={{ textTransform: 'capitalize' }}>
              {todayFormatted}
            </div>
          </div>
        </div>

        {/* Bouton Installer PWA si disponible */}
        {deferredPrompt && (
          <button
            onClick={handleInstallPWA}
            style={{
              background: 'var(--primary-bg)',
              color: 'var(--primary)',
              border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 0.65rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Download size={14} /> Installer
          </button>
        )}
      </header>

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
          <RevenueStats transactions={transactions} settings={settings} />
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
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  );
};
export default App;
