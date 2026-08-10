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
import { uploadToDrive, requestGoogleToken } from './utils/googleDrive';

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

    // Auto-synchronisation Google Drive en arrière-plan
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
      if (settings.googleDrive?.isConnected && settings.googleDrive?.accessToken) {
        setSyncStatus('Sauvegarde sur Google Drive...');
        uploadToDrive(settings.googleDrive.accessToken, { transactions, settings, categories })
          .then((res) => {
            if (res.success) {
              const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              setSyncStatus(`☁️ Synchro Drive OK (${timeStr})`);
            } else {
              setSyncStatus('Échec synchro Drive');
            }
          })
          .catch(() => setSyncStatus('Erreur synchro Drive'));
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('Hors-ligne (Sauvegardé sur le téléphone)');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

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

  const handleGoogleQuickConnect = () => {
    const cid = localStorage.getItem('gdrive_client_id') || '';
    requestGoogleToken(
      cid,
      async (token, uInfo) => {
        const res = await uploadToDrive(token, { transactions, settings, categories });
        const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        setSettings({
          ...settings,
          googleDrive: {
            isConnected: true,
            userEmail: uInfo?.email || 'compte.google@gmail.com',
            userName: uInfo?.name || 'Maman',
            userPicture: uInfo?.picture,
            accessToken: token,
            fileId: res.fileId,
            lastSyncTime: nowStr,
            autoSync: true,
          },
        });
        alert('Compte Google connecté avec succès ! Sauvegarde activée sur Google Drive.');
      },
      (err) => console.error('Erreur Google Connect', err)
    );
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

  const googleUser = settings.googleDrive;

  return (
    <div className="app-container">
      {/* En-tête mobile native avec profil Google */}
      <header className="app-header">
        <div className="brand-info">
          <div className="brand-icon">
            <Store size={24} />
          </div>
          <div>
            <div className="brand-title">{settings.businessName || 'Comptes Maman'}</div>
            <div className="brand-subtitle" style={{ textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>{todayFormatted}</span>
              {googleUser?.isConnected ? (
                <span
                  title={syncStatus || 'Google Drive connecté'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    fontSize: '0.72rem',
                    color: isOnline ? 'var(--income-color)' : 'var(--text-light)',
                    background: isOnline ? 'var(--income-bg)' : 'var(--bg-card-subtle)',
                    padding: '0.1rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                  }}
                >
                  {isOnline ? <Cloud size={11} /> : <CloudOff size={11} />}
                  {isOnline ? 'Drive Sync' : 'Hors-ligne'}
                </span>
              ) : (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>• Local</span>
              )}
            </div>
          </div>
        </div>

        {/* Côté droit de l'en-tête : Avatar Google ou Bouton Se Connecter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {googleUser?.isConnected ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--bg-card-subtle)',
                padding: '0.25rem 0.6rem 0.25rem 0.25rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('settings')}
              title={`Connecté : ${googleUser.userEmail || 'Google Drive'}`}
            >
              {googleUser.userPicture ? (
                <img
                  src={googleUser.userPicture}
                  alt="Google Avatar"
                  style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                />
              ) : (
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                  }}
                >
                  {(googleUser.userEmail || 'G')[0].toUpperCase()}
                </div>
              )}
              <Cloud size={14} color="var(--income-color)" />
            </div>
          ) : (
            <button
              onClick={handleGoogleQuickConnect}
              style={{
                background: '#ffffff',
                color: '#374151',
                border: '1.5px solid #d1d5db',
                borderRadius: 'var(--radius-full)',
                padding: '0.35rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.0 10.04.0 12s.46 3.8 1.27 5.42l4.01-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              Google Drive
            </button>
          )}

          {/* Bouton Installer PWA */}
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
        </div>
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

      {/* Barre de navigation basse (Mobile Native) */}
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
