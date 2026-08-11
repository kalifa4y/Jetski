# 📊 NekaWari - Application de Gestion Financière & Chiffre d'Affaires

> **NekaWari.** est une Progressive Web App (PWA) moderne, rapide et sécurisée de suivi de budget personnel et professionnel, permettant la gestion des revenus, des dépenses et le calcul en temps réel du Chiffre d'Affaires.

---

## 📸 Aperçu & Identité Visuelle

- **Logo Officiel** : `NekaWari.` (Police *Darker Grotesque*, `NekaWari` en `#5ebc67` et le point `.` en `#000000`)
- **Logo Raccourci & PWA** : `NW.` (Généré en SVG et PNG 512x512 / 192x192)
- **Charte Graphique Unifiée** :
  - **Vert NekaWari** : `#5ebc67` (Couleur primaire unique pour tous les revenus et actions majeures)
  - **Noir Pur** : `#000000` (Accents, textes principaux et carte hero)
  - **Blanc Pur** : `#ffffff` (Fond général et cartes en mode clair)
  - **Typographies** : *Darker Grotesque* (Logo), *Outfit* & *Plus Jakarta Sans* (Interface utilisateur)

---

## 🚀 Fonctionnalités Clés

### 1. Tableau de Bord & Solde Actuel
- **Solde Actuel en Temps Réel** : Calcul dynamique du solde disponible (`Total Revenus - Total Dépenses`).
- **Bandeau de Récapitulatif Mensuel** : Synthèse instantanée des entrées `+` et sorties `-` du mois en cours.
- **Actions Rapides (2 boutons)** : Saisie directe `+ Revenu` et `- Dépense` avec catégories et notes.
- **Dernières Opérations** : Liste des transactions récentes avec icônes Lucide.

### 2. Bilan du Chiffre d'Affaires (CA)
- **Grille 4 Colonnes par Période** : Visualisation sous forme de tuiles colorées pour les **Mois**, **Semaines** et **Années**.
- **Masquage Automatique des Périodes Vides** : Les périodes sans aucune transaction enregistrée sont automatiquement retirées de la grille.
- **Répartition par Catégorie** : Calcul automatique des pourcentages et montants cumulés par poste de dépenses ou de recettes.

### 3. Gestion Complète des Catégories (CRUD)
- **Création, Lecture, Modification & Suppression** : Gestion intégrale des catégories personnalisées.
- **Choix d'Icônes Lucide & Couleurs** : Sélection d'icônes vectorielles (sans aucun emoji) et palettes adaptées.

### 4. Sécurité & Premier Démarrage (Onboarding)
- **Assistant d'Accueil en 3 Étapes** :
  1. Saisie du **Nom / Prénom** de l'utilisateur.
  2. Saisie du **Solde Actuel Initial** (crée automatiquement la transaction de départ).
  3. **Configuration obligatoire du Code PIN à 4 chiffres**.
- **Écran de Déverrouillage PIN** : Verrouillage automatique de l'application à chaque ouverture avec pavé numérique interactif.

---

## 🛠️ Stack Technique

- **Frontend** : React 19, TypeScript 6, Vite 8
- **PWA** : `vite-plugin-pwa` (Mode standalone avec Service Worker & Web Manifest)
- **Icônes & Style** : Lucide React, Vanilla CSS3 (Variables, Glassmorphism, animations CSS)
- **Tests** : Vitest 4, Happy DOM, Testing Library React
- **Gestionnaire de paquets** : `pnpm` (par défaut)

---

## 📜 Historique du Projet & Chronologie des Développements

### Phase 1 : Initialisation & Structure de Base
- Mise en place de l'application React + Vite avec support PWA.
- Définition des structures de données TypeScript (`Transaction`, `Category`, `Settings`, `PeriodSummary`).

### Phase 2 : Refonte UI/UX & Simplification des Fonctionnalités
- **Suppression des Plafonds Budgétaires & Épargne** : Retrait des jauges de limites mensuelles et des objectifs d'épargne à la demande explicite de l'utilisateur.
- **Remplacement des Emojis** : Migration complète vers des icônes SVG propres avec `lucide-react`.
- **En-tête & Date XXL** : Positionnement du logo à gauche, badge de date XXL (`11 AOÛT 2026`) sur la droite, et suppression du bouton d'installation PWA et du bandeau blanc figé.

### Phase 3 : Grille Bilan 4 Colonnes & Filtrage des Périodes Vides
- Implémentation du bilan par périodes sous forme de grille à 4 colonnes.
- Ajout du filtre excluant les périodes sans aucune transaction (`income === 0 && expense === 0`).

### Phase 4 : Identité Visuelle `NekaWari.` & Unification des Couleurs
- Création du logo textuel **`NekaWari.`** avec la police Google Font **Darker Grotesque**.
- Unification de **toutes les nuances de vert** vers la couleur maîtresse unique **`#5ebc67`**.
- Mise à jour du raccourci PWA vers **`NW.`** et des icônes SVG/PNG (512x512, 192x192).

### Phase 5 : Onboarding & Sécurité PIN Obligatoire
- Implémentation de l'assistant de démarrage exigeant le **Nom**, le **Solde actuel initial** et la **création d'un Code PIN à 4 chiffres**.
- Activation automatique du verrouillage PIN dès la réouverture de l'application.

---

## 🐛 Bugs Rencontrés & Corrections Apportées

| Bug / Problème détecté | Cause Racine | Solution Appliquée |
| :--- | :--- | :--- |
| **Erreur TypeScript `TS6133`** (variables non utilisées) | Importations inutilisées de Lucide (`TrendingUp`, `Check`, `useEffect`, etc.) | Nettoyage rigoureux des imports et suppression des variables inutilisées. |
| **Affichage de mois/semaines vides à 0 FCFA** | Les fonctions de groupement généraient 12 mois indépendamment des transactions. | Ajout d'un filtre `.filter(item => item.income > 0 \|\| item.expense > 0)` dans `RevenueStats.tsx`. |
| **Incohérence des nuances de vert** | Mélange de `#10b981`, `#059669`, `#34d366` et `#34d399`. | Unification globale vers `#5ebc67` dans `index.css`, `constants.ts`, `RevenueStats.tsx` et `CategoryManagerModal.tsx`. |
| **Erreur `ReferenceError: localStorage is not defined` dans les tests** | Vitest s'exécutait dans un environnement Node pur. | Installation de `happy-dom` et configuration de Vitest avec `--environment happy-dom`. |
| **Conflit d'éléments multiples dans les tests React** | Rendu de plusieurs boutons `1` ou absence de `cleanup()`. | Ajout de `afterEach(cleanup)` et affinement des sélecteurs `Testing Library`. |

---

## 🧪 Tests Automatisés

Une suite de **27 tests automatisés** a été créée pour garantir la fiabilité de l'application :

```bash
pnpm test
```

### Détail de la couverture des tests :
- **`financeUtils.test.ts` (15 tests)** :
  - Formattage monétaire et de date en français.
  - Calculs des totaux de revenus, dépenses, solde net et catégories dominantes.
  - Groupement du Chiffre d'Affaires par Semaines, Mois et Années.
  - Calcul des pourcentages par catégorie.
- **`storage.test.ts` (8 tests)** :
  - Persistence `localStorage` des paramètres, transactions et catégories.
  - Operations CRUD sur les catégories (Ajout, Édition, Suppression).
- **`components.test.tsx` (4 tests)** :
  - Rendu du `Dashboard` (Solde actuel, boutons d'action).
  - Assistant d'accueil `OnboardingModal` (Saisie Nom/Solde puis étape Code PIN).
  - Verrouillage `PinLockScreen` (Saisie et validation du code PIN 4 chiffres).

---

## 💻 Installation & Exécution Locale

### Prerequisites
- Node.js (version 18 ou supérieure)
- `pnpm` (recommandé)

### 1. Cloner le projet et installer les dépendances
```bash
git clone <repository-url>
cd glaces
pnpm install
```

### 2. Lancer le serveur de développement Vite
```bash
pnpm run dev
```

### 3. Lancer les tests automatisés
```bash
pnpm test
```

### 4. Compiler l'application pour la production (PWA)
```bash
pnpm run build
```

---

## 📄 Licence

Projet développé pour **NekaWari** - Droits réservés.
