# 🦙 Lama Worlds Annotation Studio

Un outil d'annotation d'images moderne et puissant pour les datasets YOLO, avec une interface utilisateur élégante et des fonctionnalités avancées.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## ✨ Fonctionnalités

### 🎨 Interface Moderne
- **Interface sombre** avec design néon futuriste
- **Canvas interactif** avec zoom, pan, rotation et flip
- **Miniatures d'images** avec aperçu des annotations
- **Vue grille et liste** pour navigation rapide
- **Mode plein écran** pour focus maximal
- **Barre de progression** pour suivre votre travail
- **Panel de statistiques** en temps réel
- **Panneau de validation** intégré

### 📝 Annotation Avancée
- **Annotations rectangulaires** (format YOLO)
- **Système de classes** personnalisables avec couleurs
- **Sélection multiple** avec drag rectangle et Ctrl+clic
- **Opérations en lot** (supprimer toutes les annotations d'une classe)
- **Duplication d'annotations** (Ctrl+D)
- **Commentaires sur annotations** pour notes personnelles
- **Validation automatique** des annotations (erreurs, warnings, doublons)
- **Pré-annotation YOLO** avec modèle personnalisé
- **Zoom intelligent** sur sélection (touche Z)

### 🔍 Navigation & Recherche
- **Recherche d'images** en temps réel
- **Recherche dans annotations** (classes, commentaires, tags)
- **Filtres avancés** : Toutes / Annotées / Vides / Par classe
- **Navigation intelligente** : prochaine image non annotée (N)
- **Historique de navigation** (Alt+←/→)
- **Navigation clavier** complète (flèches, Home/End)
- **Raccourcis clavier** complets et personnalisables

### 💾 Gestion de Projet
- **Sauvegarde automatique** de l'état
- **Restauration** au redémarrage
- **Export/Import de projets complets** (backup/restore)
- **Import YAML** des classes (format YOLO)
- **Export COCO** et **Pascal VOC**
- **Templates de classes** (sauvegarde/chargement)
- **Tags/métadonnées** pour images
- **Cache intelligent** pour performance optimale
- **Historique par image** des modifications

### 🚀 Performance & Qualité
- **Optimisations avancées** (React.memo, useCallback, useMemo)
- **Centrage automatique** des images au chargement
- **Lazy loading** des images
- **Cache des annotations**
- **Validation de qualité** en temps réel
- **Rapports statistiques** détaillés
- **Performance fluide** même avec grandes datasets

### 🎯 Fonctionnalités Spéciales
- **Pré-annotation avec YOLO** : Chargez un modèle YOLO pour pré-annoter automatiquement
- **Mode plein écran** : Focus total sur l'annotation (F11)
- **Vue grille** : Navigation visuelle rapide avec aperçu des annotations
- **Statistiques détaillées** : Progression du dataset, annotations par classe, moyennes
- **Validation automatique** : Détection d'erreurs, warnings et doublons
- **Export de rapports** : Statistiques complètes du dataset

## 📋 Prérequis

- **Node.js** 20+ ([Télécharger](https://nodejs.org/))
- **Python** 3.10+ ([Télécharger](https://www.python.org/downloads/))
- **npm** (inclus avec Node.js)

## 🛠️ Installation

### 1. Cloner ou télécharger le projet

```bash
cd app
```

### 2. Installer les dépendances Node.js

```bash
npm install
```

### 3. Installer les dépendances Python

```bash
pip install -r requirements.txt
```

## 🎮 Utilisation

### Mode Développement

```bash
npm run dev
```

Cette commande démarre automatiquement :
- Le backend Python (FastAPI) sur le port 8000
- Le serveur Vite (React) sur le port 5173
- L'application Electron

### Mode Production

```bash
npm start
```

## 📦 Compilation en .exe

### Compilation rapide

```bash
npm run build:win
```

### Étapes détaillées

1. **Compiler le frontend React** :
   ```bash
   npm run build
   ```

2. **Créer l'installateur Windows** :
   ```bash
   npm run build:win
   ```

Le fichier `.exe` sera créé dans le dossier `release/` :
- `Lama Worlds Annotation Studio-1.0.0-Setup.exe`

> 📖 Pour plus de détails, consultez [BUILD.md](../app/BUILD.md) ou [QUICK_BUILD.md](../app/QUICK_BUILD.md)

## 🎯 Guide d'utilisation

### Ouvrir un Dataset

1. Cliquez sur **"Open Dataset Folder"**
2. Sélectionnez le dossier contenant vos images
3. L'application détecte automatiquement la structure :
   - `images/` - Dossier des images
   - `labels/` - Dossier des annotations (créé automatiquement)
   - `classes.txt` - Fichier des classes (créé automatiquement)

### Annoter une Image

1. **Sélectionner une classe** dans la sidebar gauche
2. **Dessiner un rectangle** sur l'image avec la souris
3. L'annotation est **sauvegardée automatiquement**

### Modifier une Annotation

- **Cliquer** sur une annotation pour la sélectionner
- **Ctrl+Clic** pour sélection multiple
- **Drag rectangle** pour sélection multiple
- **Glisser** pour déplacer
- **Redimensionner** avec les poignées
- **Changer la classe** avec les touches 1-9 ou via le menu
- **Dupliquer** avec Ctrl+D
- **Supprimer** avec la touche `Delete` ou le bouton ×
- **Ajouter un commentaire** via le panneau de droite

### Pré-annotation YOLO

1. Dans la sidebar, section **"YOLO Pre-annotation"**
2. Entrez le chemin vers votre modèle YOLO (.pt ou .onnx)
3. Définissez le seuil de confiance (0.0 - 1.0)
4. Cliquez sur **"Load Model"** puis **"Pre-annotate"**
5. Les annotations seront générées automatiquement

### Navigation Intelligente

- **N** : Prochaine image non annotée
- **Shift+N** : Image précédente non annotée
- **Alt+←** : Retour dans l'historique
- **Alt+→** : Avancer dans l'historique
- **Home/End** : Première/Dernière image

### Raccourcis Clavier Complets

#### Navigation
| Raccourci | Action |
|-----------|--------|
| `←` / `→` | Naviguer entre les images |
| `Home` / `End` | Aller à la première/dernière image |
| `N` | Prochaine image non annotée |
| `Shift+N` | Image précédente non annotée |
| `Alt+←` / `Alt+→` | Historique de navigation (retour/avancer) |

#### Annotation
| Raccourci | Action |
|-----------|--------|
| `Click & Drag` | Dessiner une nouvelle annotation |
| `Click` | Sélectionner une annotation |
| `Ctrl+Click` | Sélection multiple |
| `Drag Rectangle` | Sélection multiple par zone |
| `Ctrl+A` | Sélectionner toutes les annotations |
| `Delete` / `Backspace` | Supprimer l'annotation sélectionnée |
| `1-9` | Changer la classe de l'annotation sélectionnée |
| `Ctrl+D` | Dupliquer l'annotation sélectionnée |
| `T` | Masquer/Afficher les annotations |
| `Z` | Zoom intelligent sur sélection |

#### Édition
| Raccourci | Action |
|-----------|--------|
| `Ctrl+Z` | Annuler |
| `Ctrl+Y` | Refaire |
| `Ctrl+C` | Copier l'annotation sélectionnée |
| `Ctrl+V` | Coller l'annotation |

#### Canvas
| Raccourci | Action |
|-----------|--------|
| `Ctrl + / -` | Zoom avant/arrière |
| `Ctrl+0` | Réinitialiser le zoom |
| `Molette` | Zoomer |
| `Middle Click` / `Shift+Drag` | Pan (déplacer la vue) |
| `R` | Rotation horaire |
| `Shift+R` | Rotation anti-horaire |
| `H` | Retourner horizontalement |
| `V` | Retourner verticalement |
| `F11` | Mode plein écran |

#### Aide
| Raccourci | Action |
|-----------|--------|
| `?` / `F1` | Afficher/Masquer l'aide des raccourcis |

### Gestion des Classes

- **Ajouter une classe** : Cliquez sur "+" dans la sidebar
- **Modifier une classe** : Double-cliquez sur le nom
- **Changer la couleur** : Cliquez sur le carré de couleur
- **Supprimer une classe** : Cliquez sur × (supprime aussi toutes ses annotations)
- **Importer depuis YAML** : Bouton "Import YAML"
- **Sauvegarder template** : Bouton "Save Template"
- **Charger template** : Bouton "Load Template"

### Tags et Métadonnées

- **Ajouter des tags** : Cliquez sur l'icône tag dans la liste d'images
- **Rechercher par tag** : Utilisez la recherche avec "tag:nom_du_tag"
- **Tags multiples** : Séparez par des virgules

### Export/Import de Projet

- **Export complet** : Menu → Export Project (sauvegarde tout : images, annotations, classes, tags, commentaires)
- **Import complet** : Menu → Import Project (restaure un projet complet)

### Importer des Classes depuis YAML

1. Cliquez sur **"Import YAML"** dans la sidebar
2. Sélectionnez votre fichier `data.yaml` (format YOLO)
3. Choisissez de **remplacer** ou **fusionner** avec les classes existantes

### Exporter le Dataset

1. Cliquez sur **"EXPORT COCO"** ou **"EXPORT VOC"** dans le panneau de droite
2. Le fichier sera créé dans le dossier du dataset

### Export de Rapports Statistiques

1. Cliquez sur **"Export Report"** dans le panneau de statistiques
2. Un rapport détaillé sera généré avec :
   - Progression du dataset
   - Statistiques par classe
   - Images annotées/non annotées
   - Moyennes et totaux

## 📁 Structure du Dataset

```
mon_dataset/
├── images/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── ...
├── labels/
│   ├── image1.txt
│   ├── image2.txt
│   └── ...
└── classes.txt
```

### Format YOLO

Chaque fichier `.txt` dans `labels/` contient :
```
class_id x_center y_center width height
```

Où toutes les valeurs sont normalisées entre 0 et 1.

## 🏗️ Architecture

```
app/
├── backend/          # Backend Python (FastAPI)
│   ├── main.py      # API principale
│   ├── models.py    # Modèles Pydantic
│   ├── yolo_handler.py  # Gestion format YOLO
│   └── exporter.py  # Export COCO/VOC
├── electron/        # Application Electron
│   ├── main.js     # Processus principal
│   └── preload.js  # Bridge sécurité
├── react/          # Frontend React
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── AnnotationCanvas.jsx
│       │   ├── Sidebar.jsx
│       │   ├── RightPanel.jsx
│       │   ├── StatsPanel.jsx
│       │   ├── ValidationPanel.jsx
│       │   └── KeyboardShortcuts.jsx
│       └── hooks/
│           └── useUndoRedo.js
├── dist/           # Build React (généré)
└── release/        # Build Electron (généré)
```

## 🔧 Technologies Utilisées

- **Frontend** : React 18, Vite, Konva, Framer Motion
- **Backend** : FastAPI, Python 3.10+
- **Desktop** : Electron 28
- **Styling** : CSS moderne avec effets glassmorphism
- **Performance** : React.memo, useCallback, useMemo pour optimisations

## 📝 Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarrer en mode développement |
| `npm start` | Démarrer l'application |
| `npm run build` | Compiler le frontend React |
| `npm run build:win` | Créer l'installateur Windows |
| `npm run build:app` | Build complet (frontend + installer) |
| `npm run electron` | Lancer Electron seul |

## 🐛 Dépannage

### L'application ne démarre pas

1. Vérifiez que Python est installé : `python --version`
2. Vérifiez que les dépendances Python sont installées : `pip install -r requirements.txt`
3. Vérifiez que les dépendances Node.js sont installées : `npm install`

### Le backend ne démarre pas

- Vérifiez que le port 8000 n'est pas utilisé
- Vérifiez les logs dans la console

### Les images ne s'affichent pas

- Vérifiez que les chemins des images sont corrects
- Vérifiez que les images sont dans le bon format (jpg, png, etc.)

### Erreur lors de la compilation

- Assurez-vous d'avoir exécuté `npm run build` avant `npm run build:win`
- Vérifiez que tous les fichiers sont présents

### Performance lente

- L'application est optimisée pour de grandes datasets
- Utilisez le cache des annotations (activé par défaut)
- Fermez les autres applications pour libérer de la mémoire

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des fonctionnalités
- Soumettre des pull requests

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails

## 👤 Auteur

**Antigravity**

## 🙏 Remerciements

- YOLO pour le format d'annotation
- La communauté open-source pour les outils utilisés

## 📞 Support

Pour toute question ou problème :
1. Vérifiez la documentation dans `BUILD.md` et `QUICK_BUILD.md`
2. Consultez les issues GitHub (si applicable)
3. Vérifiez les logs dans la console

---

**Fait avec ❤️ pour la communauté ML/AI**
