import React from 'react';
import { LayoutDashboard, TrendingUp, History, Settings as SettingsIcon } from 'lucide-react';

export type TabType = 'dashboard' | 'revenue' | 'history' | 'settings';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
        aria-label="Tableau de bord"
      >
        <LayoutDashboard />
        <span>Accueil</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'revenue' ? 'active' : ''}`}
        onClick={() => setActiveTab('revenue')}
        aria-label="Chiffre d'affaires"
      >
        <TrendingUp />
        <span>Mon CA</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => setActiveTab('history')}
        aria-label="Historique"
      >
        <History />
        <span>Historique</span>
      </button>

      <button
        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
        aria-label="Paramètres"
      >
        <SettingsIcon />
        <span>Options</span>
      </button>
    </nav>
  );
};
