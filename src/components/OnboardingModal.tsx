import React, { useState } from 'react';
import { Wallet, ShieldCheck, ArrowRight, Delete, AlertCircle } from 'lucide-react';
import { CURRENCIES } from '../utils/constants';
import type { Settings } from '../types/finance';

interface OnboardingModalProps {
  settings: Settings;
  onComplete: (data: {
    ownerName: string;
    currency: string;
    currencySymbol: string;
    initialBalance: number;
    pinCode: string;
  }) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ settings, onComplete }) => {
  const [step, setStep] = useState<'info' | 'pin_set' | 'pin_confirm'>('info');

  // Étape 1 : Nom et Solde Actuel
  const [ownerName, setOwnerName] = useState<string>('');
  const [initialBalanceInput, setInitialBalanceInput] = useState<string>('');
  const [currency, setCurrency] = useState<string>(settings.currency || 'FCFA');

  // Étape 2 & 3 : Code PIN
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  const selectedCurr = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim()) {
      setError('Veuillez saisir votre nom ou prénom.');
      return;
    }
    setError('');
    setStep('pin_set');
  };

  const handleDigit = (digit: string) => {
    if (error) setError('');

    if (step === 'pin_set') {
      const nextPin = pin + digit;
      if (nextPin.length <= 4) {
        setPin(nextPin);
        if (nextPin.length === 4) {
          setTimeout(() => {
            setStep('pin_confirm');
          }, 200);
        }
      }
    } else if (step === 'pin_confirm') {
      const nextConfirm = confirmPin + digit;
      if (nextConfirm.length <= 4) {
        setConfirmPin(nextConfirm);
        if (nextConfirm.length === 4) {
          if (nextConfirm === pin) {
            // Validation et finalisation
            const balanceNum = parseFloat(initialBalanceInput.replace(/\s/g, '').replace(',', '.')) || 0;
            onComplete({
              ownerName: ownerName.trim(),
              currency: selectedCurr.code,
              currencySymbol: selectedCurr.symbol,
              initialBalance: balanceNum,
              pinCode: pin,
            });
          } else {
            setError('Les codes PIN ne correspondent pas. Réessayez.');
            setTimeout(() => {
              setConfirmPin('');
              setError('');
            }, 900);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (error) setError('');
    if (step === 'pin_set') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const currentDigits = step === 'pin_set' ? pin : confirmPin;

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(16px)' }}>
      <div className="onboarding-card">
        {/* Barre de progression des étapes */}
        <div className="onboarding-steps">
          <div className={`onboarding-step-pill ${step === 'info' ? 'active' : 'done'}`} />
          <div className={`onboarding-step-pill ${step === 'pin_set' ? 'active' : step === 'pin_confirm' ? 'done' : ''}`} />
          <div className={`onboarding-step-pill ${step === 'pin_confirm' ? 'active' : ''}`} />
        </div>

        {/* ÉTAPE 1 : Nom et Solde Actuel */}
        {step === 'info' && (
          <form onSubmit={handleInfoSubmit} className="onboarding-body">
            <div className="onboarding-icon-wrapper">
              <Wallet size={48} color="var(--primary-green)" />
            </div>
            <h2 className="onboarding-title">Bienvenue sur NekaWari</h2>
            <p className="onboarding-subtitle">Configurez vos informations de départ</p>

            {error && (
              <div className="onboarding-error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="onboarding-form" style={{ marginTop: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Votre Nom ou Prénom *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Alex, Kouassi..."
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    if (error) setError('');
                  }}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Votre Solde Actuel (de départ)</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="Ex: 100000"
                  value={initialBalanceInput}
                  onChange={(e) => setInitialBalanceInput(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem', display: 'block' }}>
                  Montant disponible sur votre compte ou en espèces aujourd'hui.
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="onboarding-currency" className="form-label">Devise de l'application</label>
                <select id="onboarding-currency" className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="onboarding-footer" style={{ marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary btn-block">
                Continuer <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}

        {/* ÉTAPE 2 & 3 : Configuration du Code PIN */}
        {(step === 'pin_set' || step === 'pin_confirm') && (
          <div className="onboarding-body" style={{ textAlign: 'center' }}>
            <div className="onboarding-icon-wrapper" style={{ margin: '0 auto 0.75rem' }}>
              <ShieldCheck size={48} color="var(--primary-green)" />
            </div>
            <h2 className="onboarding-title">
              {step === 'pin_set' ? 'Créez votre Code PIN' : 'Confirmez votre Code PIN'}
            </h2>
            <p className="onboarding-subtitle">
              {step === 'pin_set'
                ? 'Définissez un code secret à 4 chiffres pour protéger l’accès à NekaWari.'
                : 'Tapez de nouveau votre code PIN à 4 chiffres pour valider.'}
            </p>

            {/* Dots */}
            <div className={`pin-dots ${error ? 'shake' : ''}`} style={{ margin: '1.25rem 0 0.5rem' }}>
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className={`pin-dot ${idx < currentDigits.length ? 'active' : ''}`} />
              ))}
            </div>

            {error && <div className="pin-error-msg" style={{ marginBottom: '0.75rem' }}>{error}</div>}

            {/* Clavier numérique */}
            <div className="pin-keypad" style={{ marginTop: '0.75rem' }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button key={num} type="button" className="pin-key" onClick={() => handleDigit(num)}>
                  {num}
                </button>
              ))}
              <div className="pin-key-empty" />
              <button type="button" className="pin-key" onClick={() => handleDigit('0')}>
                0
              </button>
              <button type="button" className="pin-key pin-key-action" onClick={handleDelete} aria-label="Effacer">
                <Delete size={22} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
