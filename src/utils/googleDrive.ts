import type { Transaction, Settings, Category } from '../types/finance';

declare global {
  interface Window {
    google?: any;
  }
}

const DRIVE_FILE_NAME = 'comptes_maman_backup.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

/**
 * Charge dynamiquement le script Google Identity Services si pas présent
 */
export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.getElementById('google-gis-script');
    if (existing) {
      existing.onload = () => resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
};

/**
 * Crée le client de jeton OAuth2 Google
 */
export const requestGoogleToken = (
  clientId: string,
  onTokenReceived: (token: string) => void,
  onError?: (error: any) => void
) => {
  loadGoogleScript()
    .then(() => {
      if (!window.google?.accounts?.oauth2) {
        alert('Impossible de charger le service d\'authentification Google.');
        return;
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPE,
        callback: (response: any) => {
          if (response.access_token) {
            onTokenReceived(response.access_token);
          } else if (onError) {
            onError(response);
          }
        },
      });
      client.requestAccessToken();
    })
    .catch((err) => {
      console.error('Erreur chargement Google GIS', err);
      if (onError) onError(err);
    });
};

/**
 * Cherche si le fichier de sauvegarde existe déjà dans Google Drive
 */
export const findBackupFileInDrive = async (accessToken: string): Promise<string | null> => {
  try {
    const query = encodeURIComponent(`name = '${DRIVE_FILE_NAME}' and trashed = false`);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (err) {
    console.error('Erreur recherche fichier Google Drive', err);
    return null;
  }
};

/**
 * Sauvegarde les données sur Google Drive (Téléversement / Mise à jour)
 */
export const uploadToDrive = async (
  accessToken: string,
  payload: { transactions: Transaction[]; settings: Settings; categories: Category[] }
): Promise<{ success: boolean; fileId?: string; error?: string }> => {
  try {
    const existingFileId = await findBackupFileInDrive(accessToken);
    const content = JSON.stringify(
      {
        version: 1,
        lastUpdated: new Date().toISOString(),
        ...payload,
      },
      null,
      2
    );

    const blob = new Blob([content], { type: 'application/json' });

    if (existingFileId) {
      // Mise à jour (PATCH / PUT content)
      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: blob,
        }
      );

      if (res.ok) {
        return { success: true, fileId: existingFileId };
      } else {
        const errText = await res.text();
        return { success: false, error: errText };
      }
    } else {
      // Création d'un nouveau fichier multipart (metadata + content)
      const metadata = {
        name: DRIVE_FILE_NAME,
        mimeType: 'application/json',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: form,
        }
      );

      if (res.ok) {
        const json = await res.json();
        return { success: true, fileId: json.id };
      } else {
        const errText = await res.text();
        return { success: false, error: errText };
      }
    }
  } catch (err: any) {
    console.error('Erreur upload Drive', err);
    return { success: false, error: err.message || 'Erreur réseau' };
  }
};

/**
 * Télécharge la sauvegarde depuis Google Drive
 */
export const downloadFromDrive = async (
  accessToken: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const fileId = await findBackupFileInDrive(accessToken);
    if (!fileId) {
      return { success: false, error: 'Aucun fichier de sauvegarde trouvé sur Google Drive.' };
    }

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      return { success: false, error: 'Échec de la récupération des données depuis Google Drive.' };
    }

    const json = await res.json();
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors du téléchargement' };
  }
};
