import React, { useState } from 'react';
import type { Settings as SettingsType, Transaction, Category } from '../types/finance';
import { CURRENCIES } from '../utils/constants';
import { exportToCSV, exportBackupJSON } from '../utils/storage';
import { PinLockScreen } from './PinLockScreen';
import { Settings as SettingsIcon, Download, Upload, Sun, Moon, ShieldAlert, Check, Tag, ShieldCheck, KeyRound } from 'lucide-react';

interface SettingsProps {
  settings: SettingsType;
  onUpdateSettings: (newSettings: SettingsType) => void;
  transactions: Transaction[];
  categories: Category[];
  onOpenCategoryManager: () => void;
  onClearData: () => void;
  onImportBackup: (importedData: { settings?: SettingsType; transactions?: Transaction[]; categories?: Category[] }) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  transactions,
  categories,
  onOpenCategoryManager,
  onClearData,
  onImportBackup,
}) => {
  const [businessName, setBusinessName] = useState(settings.businessName || 'Mon Budget');
  const [ownerName, setOwnerName] = useState(settings.ownerName || 'Utilisateur');
  const [userEmail, setUserEmail] = useState(settings.userEmail || '');
  const [currency, setCurrency] = useState(settings.currency);
  const [theme, setTheme] = useState(settings.theme);
  const [isPinEnabled, setIsPinEnabled] = useState<boolean>(!!settings.isPinEnabled);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modal de changement de PIN
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCurr = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
    onUpdateSettings({
      ...settings,
      businessName,
      ownerName,
      userEmail,
      currency: selectedCurr.code,
      currencySymbol: selectedCurr.symbol,
      isPinEnabled,
      theme,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.transactions && Array.isArray(json.transactions)) {
          onImportBackup(json);
          alert('Sauvegarde restaurée avec succès !');
        } else {
          alert('Fichier de sauvegarde invalide.');
        }
      } catch (err) {
        alert('Erreur lors du traitement du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: '0 1rem 2rem' }}>
      <div style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SettingsIcon size={26} color="var(--primary-green)" />
          Options & Paramètres
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Personnalisez la sécurité, vos plafonds de budget et vos données.
        </p>
      </div>

      <div className="settings-grid">
        {/* Security PIN Code Section */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--green-bg)' }}>
              <ShieldCheck size={24} color="var(--primary-green)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Sécurité Code PIN</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isPinEnabled ? 'Code PIN activé à l’ouverture' : 'Application non verrouillée'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={`btn-pill-sm ${isPinEnabled ? 'active-add' : ''}`}
            onClick={() => {
              if (!isPinEnabled && !settings.pinCode) {
                setIsPinModalOpen(true);
              } else {
                const nextVal = !isPinEnabled;
                setIsPinEnabled(nextVal);
                onUpdateSettings({ ...settings, isPinEnabled: nextVal });
              }
            }}
          >
            {isPinEnabled ? 'Activé' : 'Désactivé'}
          </button>
        </div>

        {isPinEnabled && (
          <button
            type="button"
            className="btn btn-secondary btn-sm btn-block"
            onClick={() => setIsPinModalOpen(true)}
          >
            <KeyRound size={16} /> Modifier mon Code PIN
          </button>
        )}
      </div>

      {/* Section Catégories */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Tag size={20} color="var(--primary-green)" /> Catégories d'Opérations
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Personnalisez vos catégories de revenus et de dépenses.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenCategoryManager}
          >
            Gérer ({categories.length})
          </button>
        </div>
      </div>

      {/* Profil, Devise & Plafond */}
      <form
        onSubmit={handleSaveGeneral}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
          Profil & Préférences
        </h3>

        <div className="form-group">
          <label className="form-label">Titre du Compte / Commerce</label>
          <input
            type="text"
            className="form-input"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="ex: Mon Budget Personnel"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Prénom ou Pseudo</label>
          <input
            type="text"
            className="form-input"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="ex: Alex"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Adresse Email (Optionnelle)</label>
          <input
            type="email"
            className="form-input"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="ex: alex@email.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Devise principale</label>
          <select
            className="form-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Thème d'affichage</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              className={`period-tab ${theme === 'light' ? 'active' : ''}`}
              style={{ padding: '0.75rem', fontSize: '0.9rem' }}
              onClick={() => setTheme('light')}
            >
              <Sun size={18} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
              Thème Clair
            </button>
            <button
              type="button"
              className={`period-tab ${theme === 'dark' ? 'active' : ''}`}
              style={{ padding: '0.75rem', fontSize: '0.9rem' }}
              onClick={() => setTheme('dark')}
            >
              <Moon size={18} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
              Thème Sombre
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '0.5rem' }}>
          {savedSuccess ? <Check size={20} /> : null}
          {savedSuccess ? 'Modifications enregistrées !' : 'Sauvegarder les préférences'}
        </button>
      </form>

      {/* Exportation Fichiers (Excel & JSON) */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          Sauvegardes Fichiers (Excel & JSON)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Téléchargez vos comptes sous forme de fichier local ou restaurez une sauvegarde.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => exportToCSV(transactions, settings.currency)}
          >
            <Download size={18} color="var(--primary-green)" />
            Exporter l'Historique en Excel / CSV
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => exportBackupJSON(transactions, settings, categories)}
          >
            <Download size={18} color="var(--primary-green)" />
            Télécharger une Sauvegarde JSON Complète
          </button>

          <label className="btn btn-secondary btn-block" style={{ cursor: 'pointer' }}>
            <Upload size={18} color="var(--text-muted)" />
            Restaurer depuis un fichier JSON
            <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Zone de réinitialisation */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--red-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--danger-red)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldAlert size={18} /> Zone de Réinitialisation
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-block"
            style={{
              background: 'var(--red-bg)',
              color: 'var(--danger-red)',
              border: '1px solid var(--red-border)',
            }}
            onClick={() => {
              if (window.confirm('ATTENTION: Cela effacera toutes les transactions enregistrées. Voulez-vous continuer ?')) {
                onClearData();
              }
            }}
          >
            Effacer toutes les transactions
          </button>
        </div>
      </div>
      </div>

      {/* Modal de définition / modification de PIN */}
      {isPinModalOpen && (
        <PinLockScreen
          settings={settings}
          mode="set"
          onSetPin={(newPin) => {
            setIsPinEnabled(true);
            onUpdateSettings({ ...settings, isPinEnabled: true, pinCode: newPin });
            setIsPinModalOpen(false);
          }}
          onSuccess={() => setIsPinModalOpen(false)}
          onCancel={() => setIsPinModalOpen(false)}
        />
      )}
    </div>
  );
};

