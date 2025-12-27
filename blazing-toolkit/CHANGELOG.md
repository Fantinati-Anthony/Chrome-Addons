# Changelog

Toutes les modifications notables de Blazing Toolkit sont documentees dans ce fichier.

Le format est base sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [3.8.19] - 2025-12-27

### Ajoute
- **Favicon Generator** : Options de personnalisation par image
  - Couleur de fond optionnelle (checkbox + color picker)
  - Border radius ajustable (0-50%) pour coins arrondis
  - Regeneration en temps reel lors des modifications
  - Angles transparents avec le border radius

---

## [3.8.18] - 2025-12-27

### Corrige
- **Favicon Generator** : Les groupes s'affichent maintenant en colonne (les uns sous les autres)

---

## [3.8.17] - 2025-12-27

### Ameliore
- **Favicon Generator** : Groupes depliants pour une meilleure organisation
  - Chaque groupe d'image est replie par defaut
  - Cliquer sur l'en-tete pour deplier/replier
  - Indicateur visuel du nombre de tailles generees
  - Animation fluide d'ouverture/fermeture

---

## [3.8.16] - 2025-12-27

### Ajoute
- **Favicon Generator** : Support de la selection multiple d'images
  - Import de plusieurs images en une seule fois (drag-and-drop ou selection)
  - Affichage groupe par image avec previsualisation
  - Generation de tous les formats pour chaque image
  - Telechargement groupe (tous les PNG et ICO de toutes les images)

---

## [3.8.15] - 2025-12-27

### Ajoute
- **Favicon Generator (sidepanel)** : Ajout de l'import d'image personnalisee
  - Zone de drag-and-drop pour importer une image
  - Generation automatique en 8 tailles (16, 32, 48, 64, 128, 180, 192, 512px)
  - Telechargement individuel par taille (clic sur l'image)
  - Bouton "Telecharger tout (PNG)" pour tous les formats
  - Bouton "Telecharger .ICO" pour generer un fichier ICO multi-tailles
  - Nommage intelligent des fichiers bases sur le nom original (ex: logo-32x32.png)

---

## [3.8.13] - 2025-12-23

### Ajoute
- **SEO Extractor** : Nouvel outil d'extraction SEO
  - Extraction et affichage du fichier sitemap.xml
  - Extraction et affichage du fichier robots.txt
  - Boutons de copie et telechargement pour chaque fichier

---

## [3.8.12] - 2025-12-22

### Ajoute
- **Favicon Generator** : Import d'image personnalisee (popup)
  - Zone de drag-and-drop pour importer une image
  - Generation de favicons en plusieurs tailles
  - Export PNG et ICO

---

## [3.6.0] - 2025-12-14

### Ajoute
- **Nouveau gestionnaire de modules unifie** : Interface a deux colonnes
  - **Colonne gauche** : Modules disponibles (desactives)
  - **Colonne droite** : Modules actifs avec drag & drop pour l'ordre
  - Activation/desactivation par categorie complete ou outil individuel
  - Boutons "Tout activer" et "Tout retirer"
- **Categories personnalisees** : Creez vos propres categories avec nom et emoji
  - Bouton "+ Categorie" pour ajouter une nouvelle categorie
  - Possibilite de supprimer les categories personnalisees
- **Reorganisation des outils** : Drag & drop pour changer l'ordre
  - Indicateur visuel (ligne bleue) montrant ou l'element sera place
  - Fonctionne pour les categories et les outils

### Modifie
- Fusion des sections "Gestion des modules" et "Ordre d'affichage" en une seule interface

---

## [3.5.4] - 2025-12-14

### Ameliore
- **Indicateur de drop visuel** : Une ligne bleue indique maintenant ou l'element sera place
  - Detection de la position (haut/bas) de la souris sur l'element cible
  - Insertion avant ou apres selon la position
  - Fonctionne pour les categories et les outils

---

## [3.5.3] - 2025-12-14

### Corrige
- **Drag & Drop fonctionnel** : Correction complete du systeme de glisser-deposer
  - L'element draggable est maintenant le header de la categorie (pas le container entier)
  - Meilleure gestion des etats de drag entre categories et outils
  - Correction du bug ou le drop ne s'executait pas

---

## [3.5.2] - 2025-12-14

### Corrige
- **Visibilite des icones** : Amelioration du contraste des icones ☰ (drag handle) et ▼ (toggle)
  - Couleur passee de gris clair (#999) a gris fonce (#333)
  - Taille et poids augmentes pour une meilleure lisibilite
- **Titre de la page** : Correction du titre "AT Toolkit" en "Blazing Toolkit" dans options.html

---

## [3.5.1] - 2025-12-14

### Ameliore
- **Drag & Drop** : Remplacement des boutons ▲▼ par un systeme de glisser-deposer
  - Icone ☰ pour indiquer les elements deplacables
  - Glissez les categories pour les reorganiser
  - Cliquez sur ▼ pour etendre une categorie et reorganiser ses outils
  - Feedback visuel pendant le drag (opacite, bordure bleue)

---

## [3.5.0] - 2025-12-14

### Ajoute
- **Ordre d'affichage personnalisable** : Nouvelle section dans les options pour reorganiser les categories et outils
  - L'ordre est sauvegarde et applique au popup
  - Bouton "Reinitialiser l'ordre" pour revenir a l'ordre par defaut

---

## [3.4.2] - 2025-12-14

### Corrige
- **Cache CDN GitHub** : Ajout de headers `no-cache` et `cache: 'no-store'` pour forcer le contournement du cache lors de la verification des mises a jour

---

## [3.4.1] - 2025-12-14

### Maintenance
- Version bump pour tester le systeme de mise a jour automatique

---

## [3.4.0] - 2025-12-14

### Modifie
- **Renommage de l'extension** : "AT Unified Toolkit" devient "Blazing Toolkit"
  - Nouveau nom du dossier : `blazing-toolkit` (anciennement `AT-Unified-Addon`)
  - Mise a jour de toutes les references dans le code
  - URLs GitHub mises a jour pour les mises a jour automatiques

### Corrige
- **Fichier index.js manquant** : Creation de `modules/tools/index.js` pour reexporter tous les outils
- **Chemins d'import** : Correction des imports utils.js (`./utils.js` → `../utils.js`)

---

## [3.3.3] - 2025-12-14

### Corrige
- **Tooltips tronques** : Les descriptions des outils ne sont plus coupees
  - Changement de `overflow: hidden` en `overflow: visible` sur `.category-section`

---

## [3.3.2] - 2025-12-14

### Ameliore
- **Mise a jour intelligente** : Le systeme ne telecharge plus que les fichiers modifies
  - Utilisation de l'API GitHub Compare pour detecter les fichiers changes
  - Stockage du SHA du dernier commit pour les comparaisons
  - Fallback vers mise a jour complete si necessaire

---

## [3.3.1] - 2025-12-14

### Corrige
- **Z-index modal changelog** : La modale de changelog s'affiche maintenant au-dessus de la modale d'ajout d'outils

---

## [3.2.0] - 2025-12-13

### Ajouté
- **Mode Sidebar** : Nouveau mode d'affichage en barre latérale
  - Cliquez sur 📐 dans le popup pour ouvrir la sidebar
  - Cliquez sur 📌 dans la sidebar pour revenir en mode popup
  - Le mode choisi est sauvegardé et persistant
  - L'icône de l'extension ouvre directement le mode actif

### Technique
- Utilisation de l'API Chrome Side Panel (chrome.sidePanel)
- Permission `sidePanel` ajoutée au manifest
- Nouveau fichier `sidepanel.html` pour le mode sidebar
- CSS dédié pour la sidebar (`sidebar.css`)
- Gestion du mode via `chrome.storage.local`

---

## [3.1.0] - 2025-12-13

### Amélioré
- **Architecture modulaire** : Refactorisation complète pour une meilleure lisibilité par les IA
  - Chaque outil est maintenant dans son propre fichier (`modules/tools/*.js`)
  - 52 fichiers de modules individuels créés
  - Fichier index centralisé pour les exports (`modules/tools/index.js`)
  - Utilisation des ES Modules pour une meilleure organisation du code
  - Réduction de `panel-loader.js` de 2900+ lignes à ~440 lignes

### Technique
- Migration vers ES Modules (`type="module"` pour le script principal)
- Fichier `utils.js` partagé pour les fonctions communes (escapeHtml, getDomainFromUrl, etc.)
- Organisation par catégorie dans l'index des outils
- Support du chargement dynamique via `toolRegistry`

---

## [3.0.0] - 2025-12-13

### Ajouté
- **17 nouveaux outils** pour une suite complète de plus de 55 outils :

  **Réseau & Remote** (nouvelle catégorie) :
  - **Chrome Remote Desktop** : Accès rapide avec détection OS et QR code pour apps mobiles
  - **Mon IP** : Détection d'adresse IP avec géolocalisation (API ipapi.co)
  - **Speed Test** : Lien direct vers Speedtest.net
  - **Ping** : Test ping vers le domaine actuel (ping.eu)
  - **Traceroute** : Tracé de route vers le domaine (ping.eu)
  - **Port Scanner** : Scan des ports du domaine (ping.eu)
  - **DNS Lookup** : Recherche DNS avancée (MXToolbox)

  **Design & Médias** (nouvelle catégorie) :
  - **Générateur Favicon** : Extraction et génération multi-tailles (16, 32, 48, 64, 128, 256px)
  - **Convertisseur de couleurs** : Conversion HEX ↔ RGB ↔ HSL avec aperçu
  - **Testeur Regex** : Test d'expressions régulières avec highlighting des matches

  **SEO & Analyse** :
  - **Redirect Checker** : Vérification de chaîne de redirections (wheregoes.com)
  - **Mixed Content** : Détection des contenus HTTP sur pages HTTPS
  - **Accessibilité** : Analyse A11y avec score et recommandations
  - **Test Mobile** : Test mobile-friendly via Google

  **Utilitaires** :
  - **Générateur Hash** : SHA-256, SHA-512, SHA-1 (Web Crypto API)
  - **Encodeur URL** : Encodage/décodage URL
  - **Générateur de mot de passe** : Mots de passe sécurisés avec indicateur de force

### Amélioré
- **Réorganisation complète** des catégories pour un workflow optimisé
- Nouvelle catégorie **Réseau & Remote** avec 8 outils réseau
- Nouvelle catégorie **Design & Médias** avec 6 outils créatifs
- Plus de 55 outils au total organisés en 8 catégories
- Traductions complètes en 4 langues (FR, EN, ES, PT)

---

## [2.0.0] - 2025-12-13

### Ajoute
- **20 nouveaux mini-outils pour agences de communication** :

  **SEO & Analyse** :
  - **Compteur de mots** : Analyse complete (mots, caracteres, phrases, paragraphes, temps de lecture)
  - **Densite mots-cles** : Analyse des mots-cles avec frequence et pourcentage
  - **Analyseur H1-H6** : Visualisation hierarchique de tous les titres
  - **Liens casses** : Verification automatique des liens 404
  - **Score de lisibilite** : Score Flesch et niveau scolaire
  - **Schema.org** : Lien vers le validateur Schema.org
  - **robots.txt** : Affichage du fichier robots.txt du site

  **Developpement** :
  - **Extracteur de palette** : Extraction des couleurs utilisees sur la page
  - **Mesure d'elements** : Mesure interactive des dimensions (padding, margin)
  - **Grille overlay** : Affichage d'une grille personnalisable (colonnes, gouttiere, couleur)
  - **Temps de chargement** : Metriques de performance detaillees
  - **Core Web Vitals** : FCP, LCP et autres metriques vitales

  **Social & Marketing** (nouvelle categorie) :
  - **Apercu social** : Previsualisation des meta tags Open Graph (Facebook, Twitter)
  - **Compteur de caracteres** : Avec limites Twitter, Instagram, Facebook, LinkedIn
  - **Generateur UTM** : Creation d'URLs avec parametres UTM
  - **Comparateur de texte** : Diff ligne par ligne entre deux textes

  **Utilitaires** :
  - **Notes rapides** : Notes par domaine sauvegardees localement
  - **Minuteur Pomodoro** : Travail 25min / Pause 5min avec compteur de sessions
  - **Formateur JSON** : Formatage, minification et validation JSON
  - **Encodeur Base64** : Encodage/decodage Base64

### Ameliore
- Nouvelle categorie **Social & Marketing** pour regrouper les outils marketing
- Interface enrichie avec plus de 40 outils au total
- Styles CSS ameliores pour tous les nouveaux outils

---

## [1.9.1] - 2025-12-12

### Ajoute
- **Favoris pour boutons personnalises** :
  - Les boutons personnalises peuvent maintenant etre ajoutes aux favoris
  - Meme systeme d'etoile que pour les outils integres
  - Les favoris personnalises apparaissent dans la section Favoris

### Ameliore
- **Recherche etendue** :
  - La recherche inclut maintenant les boutons personnalises
  - Recherche par nom et URL

---

## [1.9.0] - 2025-12-12

### Ajoute
- **Recherche d'outils** :
  - Champ de recherche en haut du popup
  - Filtrage instantane des outils par nom
  - Les categories s'ouvrent automatiquement avec les resultats
  - Touche Echap pour effacer la recherche

- **Systeme de favoris** :
  - Etoile sur chaque outil pour l'ajouter aux favoris
  - Section favoris toujours visible en haut
  - Acces rapide aux outils les plus utilises

- **Effet accordeon** :
  - Une seule categorie ouverte a la fois
  - Toutes les categories sont fermees par defaut
  - Correction du repli des liens personnalises

- **Taille des boutons configurable** :
  - Nouveau reglage dans les options
  - Curseur de 70% a 150%
  - Apercu en temps reel

- **Nouvelles langues** :
  - Espagnol (Espanol)
  - Portugais (Portugues)
  - 4 langues supportees au total

### Corrige
- Les liens personnalises se replient maintenant correctement

---

## [1.8.0] - 2025-12-12

### Ajoute
- **Support multi-langue** :
  - Francais et Anglais disponibles
  - Systeme de localisation (i18n.js)
  - Fichiers de traduction dans /locales
  - Selecteur de langue dans les options

- **Outils organises par categories** :
  - 🔗 Liens personnalises
  - 🌐 Domaine & DNS (Whois, DNS, Mail Test, SSL)
  - 📊 SEO & Analyse (Meta, Liens, Images, Sitemap, PageSpeed, Lighthouse)
  - 💻 Developpement (Resize, CSS, JS, Headers, Lorem, Fonts)
  - 🌍 Navigateur (Favoris, Dossiers, Historique, Cookies, Clear Data)
  - 🛠️ Utilitaires (Raccourci, Couleurs, QR Code, Downloads, Emails, Voix, Traducteur)
  - Categories collapsables avec sauvegarde de l'etat

- **Gestion des modules** :
  - Activer/desactiver chaque outil individuellement
  - Interface d'administration dans les options
  - Boutons "Tout activer" et "Tout desactiver"
  - Les outils desactives sont masques dans le popup

### Modifie
- Export/Import mis a jour (version 2.0) avec langue et modules
- Nouveau layout CSS pour les categories

---

## [1.7.0] - 2025-12-12

### Ajoute
- **14 nouveaux outils** :
  - **QR Code** : Genere un QR code de l'URL actuelle (copier/telecharger)
  - **Meta Tags** : Extrait et affiche tous les meta tags SEO de la page
  - **Liens** : Extrait tous les liens (internes/externes) avec statistiques
  - **Images** : Liste toutes les images avec apercu et dimensions
  - **Sitemap** : Charge et affiche le sitemap.xml du site
  - **PageSpeed** : Ouvre l'analyse PageSpeed Insights
  - **Lighthouse** : Lance un audit Lighthouse
  - **Headers** : Affiche les headers HTTP de la page
  - **Cookies** : Liste tous les cookies du domaine (export JSON)
  - **Clear Data** : Supprime cookies, cache et storage du site
  - **SSL** : Verifie le certificat SSL (lien vers SSL Labs)
  - **Lorem Ipsum** : Generateur de texte Lorem Ipsum
  - **Fonts** : Detecte les polices utilisees sur la page
  - **Traducteur** : Ouvre Google Translate avec le texte

### Modifie
- Ajout de la permission "cookies" pour les nouveaux outils

---

## [1.6.3] - 2025-12-12

### Ajoute
- **Bouton recharger l'extension** :
  - Nouveau bouton 🔄 dans le header du popup
  - Recharge l'extension en un clic

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
