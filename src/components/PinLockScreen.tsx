import React, { useState } from 'react';
import { ShieldCheck, Delete } from 'lucide-react';
import type { Settings } from '../types/finance';

interface PinLockScreenProps {
  settings: Settings;
  onSuccess: () => void;
  mode?: 'unlock' | 'set';
  onSetPin?: (newPin: string) => void;
  onCancel?: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  settings,
  onSuccess,
  mode = 'unlock',
  onSetPin,
  onCancel,
}) => {
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [step, setStep] = useState<'enter' | 'confirm'>(mode === 'set' ? 'enter' : 'enter');
  const [error, setError] = useState<string>('');

  const handleDigit = (digit: string) => {
    if (error) setError('');

    if (mode === 'unlock') {
      const nextPin = pin + digit;
      if (nextPin.length <= 4) {
        setPin(nextPin);
        if (nextPin.length === 4) {
          if (nextPin === settings.pinCode) {
            onSuccess();
          } else {
            setError('Code PIN incorrect');
            setTimeout(() => {
              setPin('');
              setError('');
            }, 800);
          }
        }
      }
    } else {
      // Mode configuration de PIN
      if (step === 'enter') {
        const nextPin = pin + digit;
        if (nextPin.length <= 4) {
          setPin(nextPin);
          if (nextPin.length === 4) {
            setStep('confirm');
          }
        }
      } else {
        const nextConfirm = confirmPin + digit;
        if (nextConfirm.length <= 4) {
          setConfirmPin(nextConfirm);
          if (nextConfirm.length === 4) {
            if (nextConfirm === pin) {
              if (onSetPin) onSetPin(pin);
              if (onSuccess) onSuccess();
            } else {
              setError('Les codes PIN ne correspondent pas');
              setTimeout(() => {
                setConfirmPin('');
                setError('');
              }, 800);
            }
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (error) setError('');
    if (mode === 'unlock' || step === 'enter') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const currentDigits = mode === 'unlock' ? pin : step === 'enter' ? pin : confirmPin;

  return (
    <div className="pin-screen-overlay">
      <div className="pin-card">
        <div className="pin-header">
          <div className="pin-icon-badge">
            <ShieldCheck size={32} color="var(--primary-green)" />
          </div>
          <h2>{mode === 'unlock' ? 'Application Verrouillée' : step === 'enter' ? 'Définir un Code PIN' : 'Confirmer votre Code PIN'}</h2>
          <p>
            {mode === 'unlock'
              ? `Bonjour ${settings.ownerName || 'Utilisateur'}, entrez votre PIN pour déverrouiller.`
              : step === 'enter'
              ? 'Choisissez un code PIN à 4 chiffres pour protéger vos données.'
              : 'Saisissez de nouveau votre code PIN à 4 chiffres.'}
          </p>
        </div>

        {/* Indicateurs des 4 chiffres */}
        <div className={`pin-dots ${error ? 'shake' : ''}`}>
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className={`pin-dot ${idx < currentDigits.length ? 'active' : ''}`} />
          ))}
        </div>

        {error && <div className="pin-error-msg">{error}</div>}

        {/* Pavé Numérique */}
        <div className="pin-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button key={num} type="button" className="pin-key" onClick={() => handleDigit(num)}>
              {num}
            </button>
          ))}
          <div className="pin-key-empty">
            {onCancel && (
              <button type="button" className="pin-key-btn-text" onClick={onCancel}>
                Annuler
              </button>
            )}
          </div>
          <button type="button" className="pin-key" onClick={() => handleDigit('0')}>
            0
          </button>
          <button type="button" className="pin-key pin-key-action" onClick={handleDelete} aria-label="Effacer">
            <Delete size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};
