import React, { useState } from 'react';
import type { Settings as SettingsType, Transaction, Category } from '../types/finance';
import { CURRENCIES } from '../utils/constants';
import { exportToCSV, exportBackupJSON } from '../utils/storage';
import { Settings as SettingsIcon, Download, Upload, Sun, Moon, ShieldAlert, Check, Tag } from 'lucide-react';

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
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [currency, setCurrency] = useState(settings.currency);
  const [theme, setTheme] = useState(settings.theme);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCurr = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
    onUpdateSettings({
      ...settings,
      businessName,
      ownerName,
      currency: selectedCurr.code,
      currencySymbol: selectedCurr.symbol,
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
          <SettingsIcon size={26} color="var(--primary)" />
          Options & Paramètres
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Personnalisez la monnaie, vos catégories et sauvegardez vos données.
        </p>
      </div>

      {/* Section Catégories sur-mesure */}
      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-hover)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Tag size={20} /> Catégories d'Opérations
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Créez des catégories sur-mesure (Vente de jus, Glaces...).
            </p>
          </div>
          <button
            type="button"
            style={{
              padding: '0.65rem 1rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onClick={onOpenCategoryManager}
          >
            Gérer ({categories.length})
          </button>
        </div>
      </div>

      {/* Profil et Devise */}
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
          Profil & Devise
        </h3>

        <div className="form-group">
          <label className="form-label">Nom de l'Activité / Commerce</label>
          <input
            type="text"
            className="form-input"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="ex: Les Glaces de Maman"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Prénom ou Titre</label>
          <input
            type="text"
            className="form-input"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="ex: Maman"
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

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '0.85rem',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            marginTop: '0.5rem',
          }}
        >
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
            style={{
              padding: '0.85rem 1rem',
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
            onClick={() => exportToCSV(transactions, settings.currency)}
          >
            <Download size={18} color="var(--income-color)" />
            Exporter l'Historique en Excel / CSV
          </button>

          <button
            type="button"
            style={{
              padding: '0.85rem 1rem',
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
            onClick={() => exportBackupJSON(transactions, settings, categories)}
          >
            <Download size={18} color="var(--primary)" />
            Télécharger un fichier de Sauvegarde JSON
          </button>

          <label
            style={{
              padding: '0.85rem 1rem',
              background: 'var(--bg-card-subtle)',
              border: '1px dashed var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              textAlign: 'center',
            }}
          >
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
          border: '1px solid var(--expense-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--expense-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldAlert size={18} /> Zone de Réinitialisation
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="button"
            style={{
              padding: '0.75rem',
              background: 'var(--expense-bg)',
              border: '1px solid var(--expense-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--expense-color)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
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
  );
};
