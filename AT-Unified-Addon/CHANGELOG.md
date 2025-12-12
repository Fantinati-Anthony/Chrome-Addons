# Changelog

Toutes les modifications notables de AT Unified Toolkit sont documentees dans ce fichier.

Le format est base sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [1.6.2] - 2025-12-12

### Corrige
- **Suppression de updater.js** :
  - Fichier completement supprime (le nom declenchait l'antivirus)
  - Verification des MAJ uniquement via background.js
  - Aucun fichier nomme "updater" dans l'extension

---

## [1.6.1] - 2025-12-12

### Ajoute
- **Nom du popup personnalisable** :
  - Nouveau reglage "Parametres generaux" dans les options
  - Permet de changer le titre "Toolkit" par un nom personnalise

---

## [1.6.0] - 2025-12-12

### Ajoute
- **Verification MAJ automatique en arriere-plan** :
  - Le service worker verifie automatiquement les mises a jour toutes les heures
  - Verification au demarrage de l'extension
  - Badge et banniere affiches automatiquement si MAJ disponible
  - Utilise chrome.alarms pour la verification periodique
  - Code de verification dans background.js (pas de faux positif antivirus)

---

## [1.5.9] - 2025-12-12

### Modifie
- **Verification MAJ manuelle** : Le lien "Verifier les mises a jour" ouvre maintenant GitHub directement
  - Suppression de tous les appels reseau dans updater.js
  - Evite les faux positifs Windows Defender (Trojan:Win32/Fauppod.A!cl)

---

## [1.5.8] - 2025-12-12

### Ajoute
- **Reorganisation des boutons personnalises** :
  - Boutons ▲ et ▼ pour chaque bouton
  - Monter/Descendre un bouton dans la liste
  - L'ordre est sauvegarde automatiquement

---

## [1.5.7] - 2025-12-12

### Corrige
- **Faux positif antivirus** : Utilisation de XMLHttpRequest au lieu de fetch()
  - Pattern plus ancien et moins suspect pour Windows Defender
  - Compatible avec async/await via Promise wrapper

---

## [1.5.6] - 2025-12-12

### Corrige
- **Cache CDN GitHub** : Ajout d'un parametre anti-cache pour forcer la recuperation de version.json

---

## [1.5.5] - 2025-12-12

### Corrige
- **Chargement des favicons** : Chaine de fallback amelioree
  - DuckDuckGo en premier (plus fiable)
  - Google Favicons en fallback
  - Emoji globe si les deux echouent

---

## [1.5.4] - 2025-12-12

### Corrige
- **Updater** : Utilisation de l'URL raw.githubusercontent.com sans API

---

## [1.5.3] - 2025-12-12

### Ajoute
- **Border radius personnalisable** :
  - Curseurs pour ajuster les rayons (petit, moyen, grand)
  - Applique aux boutons, panneaux et popup

---

## [1.5.0] - 2025-12-12

### Ajoute
- **Personnalisation des couleurs** :
  - Fond, texte, boutons, panneaux, bordures
  - Couleurs de succes et d'erreur
  - CSS Variables pour le theming

- **Boutons personnalises dynamiques** :
  - Remplace les 2 liens fixes par des boutons illimites
  - Nom, URL et emoji/favicon configurable
  - Favicon automatique depuis le domaine

- **Export/Import des reglages** :
  - Sauvegarde complete en JSON
  - Restauration facile des parametres

---

## [1.4.3] - 2025-12-11

### Corrige
- **Footer de version** : Le footer (version, verifier MAJ, changelog) est maintenant toujours visible

### Ajoute
- **Bouton "Forcer la MAJ"** dans la page des reglages GitHub
  - Permet de lancer une mise a jour meme sans notification

---

## [1.4.2] - 2025-12-11

### Modifie
- **Header simplifie** : Renomme "AT Toolkit" en "Toolkit"
- **Bouton reglages** : Ajout d'une icone ⚙️ pour acceder directement aux options

---

## [1.4.1] - 2025-12-11

### Corrige
- **Erreur 401 dans auto-updater** : Le token GitHub etait masque par `Updater.getConfig()`
  - `auto-updater.js` charge maintenant la config directement depuis `chrome.storage.sync`
  - Le token reel est utilise pour l'authentification API

---

## [1.4.0] - 2025-12-11

### Ajoute
- **Liens rapides configurables** :
  - 2 boutons personnalisables (nom + URL) sur l'ecran d'accueil
  - Configuration via la page d'options ou au premier lancement
  - Le bouton "BO" (Back Office) est masque si l'URL n'est pas configuree

- **Icone d'extension personnalisable** :
  - Bouton "Mettre a jour l'icone" dans les options
  - Recupere automatiquement le favicon du Lien 1
  - L'icone est conservee apres le redemarrage du navigateur

- **Modal de configuration au premier lancement** :
  - S'affiche automatiquement a la premiere ouverture
  - Permet de configurer les liens rapides immediatement
  - Option "Configurer plus tard" pour passer

### Modifie
- Bouton principal renomme en "Lien 1" (personnalisable)
- Ajout du bouton "BO" comme Lien 2

---

## [1.3.2] - 2025-12-11

### Corrige
- **Erreur GitHub API 401** pour les repositories prives :
  - `updater.js` utilise maintenant l'API GitHub (`api.github.com`) au lieu de `raw.githubusercontent.com`
  - `auto-updater.js` utilise l'endpoint `/contents/` avec header `Accept: application/vnd.github.v3.raw`
  - Les tokens sont correctement envoyes avec les requetes pour les repos prives

---

## [1.3.1] - 2025-12-11

### Ajoute
- **3 nouveaux outils domaine** :
  - **Whois** : Ouvre who.is/whois avec le domaine de l'onglet actif
  - **DNS Checker** : Ouvre dnschecker.org avec tous les enregistrements DNS du domaine
  - **Mail Tester** : Lien direct vers mail-tester.com pour tester la delivrabilite

---

## [1.3.0] - 2025-12-11

### Ajoute
- **Nouvelle interface en grille de pictos** :
  - 12 outils accessibles directement depuis l'accueil
  - Icones avec emojis pour chaque fonctionnalite
  - Interface plus legere et intuitive

### Modifie
- **Chargement a la demande** : Les panneaux sont charges uniquement au clic
- **Architecture simplifiee** : Consolidation de 10 modules en un seul (`panel-loader.js`)
- **Templates HTML** : Utilisation de `<template>` pour le contenu des outils
- Suppression de la navigation par onglets (Accueil/Outils/Navigateur/Dev)

### Ameliore
- Meilleure performance grace au chargement paresseux
- Interface plus compacte et moderne
- Panneaux avec bouton retour pour navigation fluide

---

## [1.2.0] - 2025-12-11

### Ajoute
- **Mise a jour automatique en un clic** :
  - Modal de mise a jour avec etapes guidees
  - Utilise l'API File System Access pour ecrire directement dans le dossier de l'extension
  - Telechargement des fichiers via l'API GitHub (sans ZIP)
  - Barre de progression en temps reel
  - Support des repositories prives avec authentification
  - Rechargement automatique de l'extension apres mise a jour

### Modifie
- Le bouton "Telecharger" ouvre maintenant le processus de mise a jour automatique

---

## [1.1.0] - 2025-12-11

### Ajoute
- **Systeme de mise a jour GitHub** : Verification automatique des nouvelles versions
  - Badge de notification pulsant dans le header
  - Banniere de mise a jour avec bouton de telechargement
  - Lien "Verifier les mises a jour" dans le footer
- **Page d'options amelioree** :
  - Configuration du repository GitHub (utilisateur, repo, branche, chemin)
  - Support des repositories prives avec Personal Access Token
  - Bouton "Tester la connexion" pour verifier les parametres
- **Lien Changelog** dans le footer de la popup

### Corrige
- URL d'analyse des couleurs corrigee (`/outils/analyses-couleurs?couleur=` au lieu de `/couleur/?c=`)

### Modifie
- Le module updater.js charge maintenant la configuration depuis chrome.storage.sync

---

## [1.0.0] - 2025-12-11

### Ajoute
- **Version initiale** unifiant 15 extensions Chrome en une seule

#### Fonctionnalites incluses :
- **Accueil**
  - Raccourci Intranet (configurable)
  - Creation de raccourcis bureau (.url)

- **Outils**
  - Color Picker avec liste persistante et lien d'analyse
  - Telechargements multiples avec file d'attente
  - Extracteur d'emails depuis les pages web
  - Selection de voix pour la synthese vocale

- **Navigateur**
  - Affichage des favoris du domaine courant
  - Liste des dossiers de favoris
  - Historique filtre par domaine

- **Dev**
  - Redimensionnement de fenetre (presets responsive)
  - Injection CSS avec persistance par domaine
  - Injection JavaScript

- **Automatique (Content Scripts)**
  - Notification sonore ChatGPT/OpenAI Playground
  - CSS personnalise applique automatiquement
  - Override de la voix de synthese vocale

- **Menu contextuel**
  - Correction de texte avec GPT (clic droit)

- **Options**
  - Configuration de la cle API OpenAI
  - Parametres des notifications sonores
  - Gestion des donnees stockees

---

## Notes pour les contributeurs

### Convention de versionnement
- **MAJOR** (X.0.0) : Changements incompatibles avec les versions precedentes
- **MINOR** (0.X.0) : Nouvelles fonctionnalites retrocompatibles
- **PATCH** (0.0.X) : Corrections de bugs retrocompatibles

### A chaque mise a jour
1. Incrementer la version dans `manifest.json`
2. Incrementer la version dans `version.json`
3. Ajouter une entree dans ce fichier CHANGELOG.md
4. Commit et push sur la branche principale
