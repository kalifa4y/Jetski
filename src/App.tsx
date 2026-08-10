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
import { uploadToDrive } from './utils/googleDrive';

import { Navbar } from './components/Navbar';
import type { TabType } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { RevenueStats } from './components/RevenueStats';
import { TransactionList } from './components/TransactionList';
import { Settings } from './components/Settings';
import { TransactionModal } from './components/TransactionModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { Store, Download, Cloud, CloudOff } from 'lucide-react';

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

  // État Réseau / Cloud Drive
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // Support PWA Installation Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'light');
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveTransactions(transactions);

    // Auto-synchronisation Google Drive en arrière-plan si en ligne et connecté
    if (navigator.onLine && settings.googleDrive?.isConnected && settings.googleDrive?.accessToken) {
      uploadToDrive(settings.googleDrive.accessToken, { transactions, settings, categories })
        .then((res) => {
          if (res.success) {
            const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            setSyncStatus(`Sauvegardé sur Drive (${timeStr})`);
          }
        })
        .catch((err) => console.log('Auto sync error', err));
    }
  }, [transactions, categories]);

  // Détection du changement d'état réseau (en ligne / hors-ligne)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('Connecté à Internet !');
      // Synchroniser immédiatement sur Google Drive dès le retour de la connexion Internet !
      if (settings.googleDrive?.isConnected && settings.googleDrive?.accessToken) {
        setSyncStatus('Sauvegarde automatique sur Google Drive...');
        uploadToDrive(settings.googleDrive.accessToken, { transactions, settings, categories })
          .then((res) => {
            if (res.success) {
              const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              setSyncStatus(`☁️ Synchronisé sur Drive (${timeStr})`);
            } else {
              setSyncStatus('Échec de la synchro Drive');
            }
          })
          .catch(() => setSyncStatus('Erreur synchro Drive'));
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('Hors-ligne (Mode stockage local)');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service Worker PWA
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('Service Worker PWA enregistré', reg))
        .catch((err) => console.log('Erreur SW', err));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [settings.googleDrive, transactions, categories]);

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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <div className="app-container">
      {/* En-tête supérieur avec status Cloud / Réseau */}
      <header className="app-header">
        <div className="brand-info">
          <div className="brand-icon">
            <Store size={26} />
          </div>
          <div>
            <div className="brand-title">{settings.businessName || 'Comptes Maman'}</div>
            <div className="brand-subtitle" style={{ textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>{todayFormatted}</span>
              {settings.googleDrive?.isConnected && (
                <span
                  title={syncStatus || 'Google Drive connecté'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    fontSize: '0.75rem',
                    color: isOnline ? 'var(--income-color)' : 'var(--text-light)',
                    background: isOnline ? 'var(--income-bg)' : 'var(--bg-card-subtle)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 600,
                  }}
                >
                  {isOnline ? <Cloud size={12} /> : <CloudOff size={12} />}
                  {isOnline ? 'Drive Sync' : 'Hors-ligne'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bouton d'installation PWA si disponible */}
        {deferredPrompt && (
          <button
            onClick={handleInstallPWA}
            style={{
              background: 'var(--primary-bg)',
              color: 'var(--primary)',
              border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-full)',
              padding: '0.4rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <Download size={14} /> Installer l'App
          </button>
        )}
      </header>

      {/* Vues de l'application */}
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
