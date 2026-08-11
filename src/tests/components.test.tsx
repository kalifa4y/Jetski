import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Dashboard } from '../components/Dashboard';
import { OnboardingModal } from '../components/OnboardingModal';
import { PinLockScreen } from '../components/PinLockScreen';
import { DEFAULT_SETTINGS, DEFAULT_CATEGORIES } from '../utils/constants';
import type { Transaction } from '../types/finance';

describe('Component Integration Tests', () => {
  afterEach(() => {
    cleanup();
  });

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      amount: 100000,
      category: 'salary',
      date: '2026-08-11',
      note: 'Vente produit',
      createdAt: 1,
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 30000,
      category: 'groceries',
      date: '2026-08-11',
      note: 'Achat fourniture',
      createdAt: 2,
    },
  ];

  describe('<Dashboard />', () => {
    it('renders SOLDE ACTUEL and correct net balance', () => {
      render(
        <Dashboard
          transactions={mockTransactions}
          categories={DEFAULT_CATEGORIES}
          settings={DEFAULT_SETTINGS}
          onOpenModal={vi.fn()}
          onNavigateToHistory={vi.fn()}
          onNavigateToCA={vi.fn()}
        />
      );

      expect(screen.getByText('SOLDE ACTUEL')).toBeDefined();
      expect(screen.getByText(/70\s*000/)).toBeDefined(); // 100000 - 30000 = 70000
    });

    it('triggers modal when clicking action buttons (+ Revenu / - Dépense)', () => {
      const handleOpenModal = vi.fn();

      render(
        <Dashboard
          transactions={mockTransactions}
          categories={DEFAULT_CATEGORIES}
          settings={DEFAULT_SETTINGS}
          onOpenModal={handleOpenModal}
          onNavigateToHistory={vi.fn()}
          onNavigateToCA={vi.fn()}
        />
      );

      const incomeBtn = screen.getByRole('button', { name: /Ajouter un revenu/i });
      fireEvent.click(incomeBtn);
      expect(handleOpenModal).toHaveBeenCalledWith('income');

      const expenseBtn = screen.getByRole('button', { name: /Ajouter une dépense/i });
      fireEvent.click(expenseBtn);
      expect(handleOpenModal).toHaveBeenCalledWith('expense');
    });
  });

  describe('<OnboardingModal />', () => {
    it('requires Nom, allows Solde Actuel, then transitions to PIN configuration', () => {
      const handleComplete = vi.fn();

      render(
        <OnboardingModal
          settings={DEFAULT_SETTINGS}
          onComplete={handleComplete}
        />
      );

      expect(screen.getByText('Bienvenue sur NekaWari')).toBeDefined();

      const nameInput = screen.getByPlaceholderText(/Ex: Alex, Kouassi/i);
      const balanceInput = screen.getByPlaceholderText(/Ex: 100000/i);

      fireEvent.change(nameInput, { target: { value: 'Jean' } });
      fireEvent.change(balanceInput, { target: { value: '50000' } });

      const continueBtn = screen.getByRole('button', { name: /Continuer/i });
      fireEvent.click(continueBtn);

      // Transition vers la configuration du Code PIN
      expect(screen.getByText('Créez votre Code PIN')).toBeDefined();
    });
  });

  describe('<PinLockScreen />', () => {
    it('unlocks application when correct 4-digit PIN is entered', () => {
      const handleSuccess = vi.fn();
      const settingsWithPin = {
        ...DEFAULT_SETTINGS,
        isPinEnabled: true,
        pinCode: '1234',
      };

      const { getByText } = render(
        <PinLockScreen
          settings={settingsWithPin}
          mode="unlock"
          onSuccess={handleSuccess}
        />
      );

      expect(getByText('Application Verrouillée')).toBeDefined();

      // Tap 1, 2, 3, 4
      fireEvent.click(getByText('1'));
      fireEvent.click(getByText('2'));
      fireEvent.click(getByText('3'));
      fireEvent.click(getByText('4'));

      expect(handleSuccess).toHaveBeenCalled();
    });
  });
});
