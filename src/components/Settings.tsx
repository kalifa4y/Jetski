import React, { useState } from 'react';
import type { Settings as SettingsType, Transaction, Category } from '../types/finance';
import { CURRENCIES } from '../utils/constants';
import { exportToCSV, exportBackupJSON } from '../utils/storage';
import { requestGoogleToken, uploadToDrive, downloadFromDrive } from '../utils/googleDrive';
import { Settings as SettingsIcon, Download, Upload, Sun, Moon, ShieldAlert, Check, Cloud, Tag, Key, HelpCircle } from 'lucide-react';

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

  // Google Drive state & Client ID
  const [googleClientId, setGoogleClientId] = useState(
    localStorage.getItem('gdrive_client_id') || ''
  );
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [driveStatusMsg, setDriveStatusMsg] = useState('');
  const [showDriveGuide, setShowDriveGuide] = useState(false);

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

  const handleSaveClientId = (newCid: string) => {
    setGoogleClientId(newCid);
    localStorage.setItem('gdrive_client_id', newCid.trim());
  };

  const handleConnectGoogleDrive = () => {
    let cid = googleClientId.trim();

    if (!cid) {
      const inputCid = prompt(
        'Pour connecter Google Drive, entrez votre Google Client ID OAuth 2.0 (ex: 12345...apps.googleusercontent.com) :\n\nLaissez vide pour voir les instructions d\'obtention.',
        ''
      );
      if (inputCid && inputCid.trim()) {
        cid = inputCid.trim();
        handleSaveClientId(cid);
      } else {
        setShowDriveGuide(true);
        return;
      }
    }

    setSyncingDrive(true);
    setDriveStatusMsg('Connexion à Google Drive...');

    requestGoogleToken(
      cid,
      async (token, uInfo) => {
        const res = await uploadToDrive(token, { transactions, settings, categories });
        setSyncingDrive(false);
        if (res.success) {
          const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          onUpdateSettings({
            ...settings,
            googleDrive: {
              isConnected: true,
              userEmail: uInfo?.email || 'Google Drive',
              userName: uInfo?.name || 'Maman',
              userPicture: uInfo?.picture,
              accessToken: token,
              fileId: res.fileId,
              lastSyncTime: nowStr,
              autoSync: true,
            },
          });
          setDriveStatusMsg(`Synchronisé à ${nowStr} !`);
          alert('Succès ! Votre compte Google Drive est connecté. Les sauvegardes automatiques sont activées.');
        } else {
          setDriveStatusMsg('Erreur téléversement.');
          alert(`Erreur 401 / Connexion Drive : ${res.error || 'Accès non autorisé'}.\nVérifiez que votre Google Client ID est valide et que l\'origine (ex: http://localhost:5173 ou votre site) est ajoutée dans Google Cloud Console.`);
        }
      },
      (_err) => {
        setSyncingDrive(false);
        setDriveStatusMsg('Erreur d\'autorisation (401)');
        alert(
          'Erreur 401 d\'autorisation Google Drive.\n\n' +
          'Google exige un "Client ID OAuth 2.0" valide pour autoriser l\'accès à Google Drive.\n' +
          'Cliquez sur "Guide Client ID Google" ci-dessous pour voir comment créer votre Client ID gratuitement en 2 minutes !'
        );
        setShowDriveGuide(true);
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
      alert('Toutes les données ont été restaurées depuis Google Drive avec succès !');
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
          Personnalisez la monnaie, Google Drive et vos catégories.
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

      {/* Section Google Drive */}
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
            Sauvegarde Google Drive
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
          Sauvegarde automatique de ses comptes sur son propre espace Google Drive à chaque connexion Internet.
        </p>

        {driveConfig.lastSyncTime && (
          <div style={{ fontSize: '0.8rem', color: 'var(--income-color)', fontWeight: 600, marginBottom: '0.75rem' }}>
            ✓ Dernière sauvegarde : {driveConfig.lastSyncTime}
          </div>
        )}

        {driveStatusMsg && (
          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.75rem' }}>
            {driveStatusMsg}
          </div>
        )}

        {/* Champ Client ID Google */}
        <div style={{ marginBottom: '1rem', background: 'var(--bg-card-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label className="form-label" style={{ marginBottom: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Key size={14} /> Google Client ID (OAuth 2.0)
            </label>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              onClick={() => setShowDriveGuide(!showDriveGuide)}
            >
              <HelpCircle size={14} /> Comment l'obtenir ?
            </button>
          </div>
          <input
            type="text"
            className="form-input"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
            placeholder="ex: 123456789-abc...apps.googleusercontent.com"
            value={googleClientId}
            onChange={(e) => handleSaveClientId(e.target.value)}
          />
        </div>

        {/* Guide rapide pour résoudre l'erreur 401 */}
        {showDriveGuide && (
          <div
            style={{
              background: '#fffbebf',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem',
              fontSize: '0.825rem',
              color: '#92400e',
              marginBottom: '1rem',
              lineHeight: 1.4,
            }}
          >
            <strong>💡 Pourquoi l'erreur 401 ?</strong>
            <p style={{ marginTop: '0.3rem' }}>
              Google exige que chaque application web possède son propre <strong>Client ID OAuth 2.0</strong> gratuit :
            </p>
            <ol style={{ marginLeft: '1.2rem', marginTop: '0.3rem' }}>
              <li>Allez sur <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 700 }}>Google Cloud Console</a>.</li>
              <li>Créez un projet gratuit et activez l'API <strong>Google Drive API</strong>.</li>
              <li>Dans <strong>Identifiants</strong>, créez un <em>ID client OAuth 2.0</em> (Type : Application Web).</li>
              <li>Ajoutez votre URL (ex: <code>http://localhost:5173</code> ou <code>https://votre-site.vercel.app</code>) dans <em>Origines JavaScript autorisées</em>.</li>
              <li>Copiez le Client ID et collez-le ci-dessus !</li>
            </ol>
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
              ? 'Mise à jour...'
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

      {/* Exportation Fichiers */}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
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
