import React, { useState } from 'react';
import type { Settings as SettingsType, Transaction, Category } from '../types/finance';
import { CURRENCIES } from '../utils/constants';
import { exportToCSV, exportBackupJSON } from '../utils/storage';
import { requestGoogleToken, uploadToDrive, downloadFromDrive } from '../utils/googleDrive';
import { Settings as SettingsIcon, Download, Upload, Sun, Moon, ShieldAlert, Check, Cloud, Tag } from 'lucide-react';

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

  // Google Drive state
  const [googleClientId, setGoogleClientId] = useState(
    localStorage.getItem('gdrive_client_id') || ''
  );
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [driveStatusMsg, setDriveStatusMsg] = useState('');

  const driveConfig = settings.googleDrive || {
    isConnected: false,
    autoSync: true,
  };

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

  const handleConnectGoogleDrive = () => {
    let cid = googleClientId.trim();
    if (!cid) {
      const inputCid = prompt(
        'Veuillez entrer votre Google Client ID OAuth 2.0 (obtenu sur Google Cloud Console) :\n\nPour tester rapidement sans Client ID, vous pouvez utiliser votre propre ID ou laisser vide pour une démo.',
        ''
      );
      if (inputCid) {
        cid = inputCid.trim();
        setGoogleClientId(cid);
        localStorage.setItem('gdrive_client_id', cid);
      } else {
        return;
      }
    }

    setSyncingDrive(true);
    setDriveStatusMsg('Connexion à Google Drive...');

    requestGoogleToken(
      cid,
      async (token) => {
        // Sauvegarde immédiate du premier jeton
        const res = await uploadToDrive(token, { transactions, settings, categories });
        setSyncingDrive(false);
        if (res.success) {
          const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          onUpdateSettings({
            ...settings,
            googleDrive: {
              isConnected: true,
              accessToken: token,
              fileId: res.fileId,
              lastSyncTime: nowStr,
              autoSync: true,
            },
          });
          setDriveStatusMsg(`Synchronisé à ${nowStr} !`);
          alert('Votre compte Google Drive est connecté ! Vos données seront désormais automatiquement sauvegardées dès que vous vous connectez à Internet.');
        } else {
          setDriveStatusMsg('Échec du téléversement.');
          alert(`Erreur de connexion Drive : ${res.error}`);
        }
      },
      (_err) => {
        setSyncingDrive(false);
        setDriveStatusMsg('Erreur d\'autorisation.');
        alert('Erreur d\'autorisation Google Drive.');
      }
    );
  };

  const handleSyncDriveManual = async () => {
    if (!driveConfig.accessToken) {
      handleConnectGoogleDrive();
      return;
    }
    setSyncingDrive(true);
    setDriveStatusMsg('Mise à jour sur Google Drive...');
    const res = await uploadToDrive(driveConfig.accessToken, { transactions, settings, categories });
    setSyncingDrive(false);
    if (res.success) {
      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      onUpdateSettings({
        ...settings,
        googleDrive: {
          ...driveConfig,
          lastSyncTime: nowStr,
        },
      });
      setDriveStatusMsg(`Synchronisé à ${nowStr} !`);
    } else {
      setDriveStatusMsg('Jeton expiré. Reconnexion requise.');
      handleConnectGoogleDrive();
    }
  };

  const handleRestoreFromDrive = async () => {
    if (!driveConfig.accessToken) {
      alert('Veuillez d\'abord vous connecter à Google Drive.');
      return;
    }
    setSyncingDrive(true);
    const res = await downloadFromDrive(driveConfig.accessToken);
    setSyncingDrive(false);
    if (res.success && res.data) {
      onImportBackup(res.data);
      alert('Toutes les transactions ont été restaurées depuis Google Drive avec succès !');
    } else {
      alert(`Impossible de restaurer depuis Drive: ${res.error}`);
    }
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
          Personnalisez la monnaie, la synchronisation Google Drive et vos catégories.
        </p>
      </div>

      {/* Section Gestion des Catégories Personnalisées */}
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
              Créez des catégories sur-mesure pour son activité (Vente de jus, Glaces...).
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

      {/* Section Synchronisation Google Drive (Dès qu'elle est en ligne) */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cloud size={24} color="var(--primary)" />
            Sauvegarde Automatique Google Drive
          </h3>
          <span
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: driveConfig.isConnected ? 'var(--income-bg)' : 'var(--bg-card-subtle)',
              color: driveConfig.isConnected ? 'var(--income-color)' : 'var(--text-muted)',
              border: `1px solid ${driveConfig.isConnected ? 'var(--income-border)' : 'var(--border-color)'}`,
            }}
          >
            {driveConfig.isConnected ? '☁️ Connecté & Synchro' : 'Non connecté'}
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Connectez son compte Google Drive. Dès que son téléphone sera en ligne (Internet actif), ses comptes seront automatiquement sauvegardés sur son Google Drive.
        </p>

        {driveConfig.lastSyncTime && (
          <div style={{ fontSize: '0.8rem', color: 'var(--income-color)', fontWeight: 600, marginBottom: '0.75rem' }}>
            ✓ Dernière sauvegarde automatique : {driveConfig.lastSyncTime}
          </div>
        )}

        {driveStatusMsg && (
          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.75rem' }}>
            {driveStatusMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button
            type="button"
            style={{
              width: '100%',
              padding: '0.85rem',
              background: driveConfig.isConnected ? 'var(--income-color)' : 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
            onClick={driveConfig.isConnected ? handleSyncDriveManual : handleConnectGoogleDrive}
            disabled={syncingDrive}
          >
            <Cloud size={20} />
            {syncingDrive
              ? 'Synchronisation en cours...'
              : driveConfig.isConnected
              ? 'Sauvegarder sur Google Drive maintenant'
              : 'Se Connecter à Google Drive'}
          </button>

          {driveConfig.isConnected && (
            <button
              type="button"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
              onClick={handleRestoreFromDrive}
              disabled={syncingDrive}
            >
              <Download size={16} /> Restaurer les données depuis Google Drive
            </button>
          )}
        </div>
      </div>

      {/* Formulaire des préférences générales */}
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
              Thème Clair (Recommandé)
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

      {/* Section Exportation et Sauvegarde Fichier */}
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
          Téléchargez vos comptes sous forme de fichier local ou importez un fichier.
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
