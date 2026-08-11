import type { Transaction, Settings, Category } from '../types/finance';

declare global {
  interface Window {
    google?: any;
  }
}

const DRIVE_FILE_NAME = 'comptes_maman_backup.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

/**
 * Client ID par défaut pour la démo/utilisation locale si l'utilisateur n'en fournit pas
 */
export const DEFAULT_CLIENT_ID = '904583726194-maman-app.apps.googleusercontent.com';

/**
 * Charge dynamiquement le script Google Identity Services
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
 * Décode le jeton JWT d'authentification Google One-Tap pour récupérer le profil
 */
export const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * Crée la demande d'autorisation OAuth2 pour Google Drive API
 */
export const requestGoogleToken = (
  clientId: string,
  onTokenReceived: (token: string, userInfo?: { name?: string; email?: string; picture?: string }) => void,
  onError?: (error: any) => void
) => {
  loadGoogleScript()
    .then(() => {
      if (!window.google?.accounts?.oauth2) {
        alert('Service Google indisponible. Vérifiez votre connexion Internet.');
        return;
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId || DEFAULT_CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: async (response: any) => {
          if (response.access_token) {
            // Tenter de récupérer l'email utilisateur via l'API Google Userinfo
            try {
              const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              if (uRes.ok) {
                const uInfo = await uRes.json();
                onTokenReceived(response.access_token, {
                  name: uInfo.name,
                  email: uInfo.email,
                  picture: uInfo.picture,
                });
                return;
              }
            } catch {
              // Ignore fallback
            }
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
 * Cherche si le fichier de sauvegarde existe sur Google Drive
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
 * Sauvegarde les données sur Google Drive (Création ou Mise à jour)
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
