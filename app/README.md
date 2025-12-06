# 🦙 Lama Worlds Annotation Studio

Un outil d'annotation d'images moderne et puissant pour les datasets YOLO, avec une interface utilisateur élégante et des fonctionnalités avancées.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## ✨ Fonctionnalités

### 🎨 Interface Moderne
- **Interface sombre** avec design néon futuriste
- **Canvas interactif** avec zoom, pan et dessin fluide
- **Miniatures d'images** pour navigation rapide
- **Barre de progression** pour suivre votre travail
- **Panel de statistiques** en temps réel

### 📝 Annotation Avancée
- **Annotations rectangulaires** (format YOLO)
- **Système de classes** personnalisables avec couleurs
- **Annuler/Refaire** (Ctrl+Z / Ctrl+Y)
- **Copier/Coller** d'annotations (Ctrl+C / Ctrl+V)
- **Sélection multiple** pour opérations en lot
- **Validation automatique** des annotations

### 🔍 Navigation & Recherche
- **Recherche d'images** en temps réel
- **Filtres** : Toutes / Annotées / Vides
- **Navigation clavier** (flèches gauche/droite)
- **Raccourcis clavier** complets

### 💾 Gestion de Projet
- **Sauvegarde automatique** de l'état
- **Restauration** au redémarrage
- **Import YAML** des classes (format YOLO)
- **Export COCO** et **Pascal VOC**
- **Cache intelligent** pour performance optimale

### 🚀 Performance
- **Lazy loading** des images
- **Cache des annotations**
- **Optimisations** pour grandes datasets

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

> 📖 Pour plus de détails, consultez [BUILD.md](./BUILD.md) ou [QUICK_BUILD.md](./QUICK_BUILD.md)

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
- **Glisser** pour déplacer
- **Redimensionner** avec les poignées
- **Changer la classe** via le menu déroulant dans le panneau de droite
- **Supprimer** avec la touche `Delete` ou le bouton ×

### Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl+Z` | Annuler |
| `Ctrl+Y` | Refaire |
| `Ctrl+C` | Copier l'annotation sélectionnée |
| `Ctrl+V` | Coller l'annotation |
| `Delete` / `Backspace` | Supprimer l'annotation sélectionnée |
| `←` / `→` | Naviguer entre les images |
| `Molette` | Zoomer |
| `Shift+Clic` / `Clic molette` | Pan (déplacer la vue) |

### Importer des Classes depuis YAML

1. Cliquez sur **"Import YAML"** dans la sidebar
2. Sélectionnez votre fichier `data.yaml` (format YOLO)
3. Choisissez de **remplacer** ou **fusionner** avec les classes existantes

### Exporter le Dataset

1. Cliquez sur **"EXPORT COCO"** ou **"EXPORT VOC"** dans le panneau de droite
2. Le fichier sera créé dans le dossier du dataset

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
│       └── hooks/
├── dist/           # Build React (généré)
└── release/        # Build Electron (généré)
```

## 🔧 Technologies Utilisées

- **Frontend** : React 18, Vite, Konva, Framer Motion
- **Backend** : FastAPI, Python 3.10+
- **Desktop** : Electron 28
- **Styling** : CSS moderne avec effets glassmorphism

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

