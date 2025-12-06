# Guide de compilation en .exe

## Prérequis

1. **Node.js** installé (v20+)
2. **Python 3.10+** installé sur le système
3. **npm** installé

## Étapes de compilation

### 1. Installer les dépendances (si pas déjà fait)

```bash
npm install
```

### 2. Compiler le frontend React

```bash
npm run build
```

Cette commande compile React avec Vite et crée le dossier `dist/`.

### 3. Compiler l'application Electron

```bash
npm run build:win
```

Ou pour une compilation complète :

```bash
npm run build:app
```

## Résultat

Le fichier `.exe` sera créé dans le dossier `release/` :
- `Lama Worlds Annotation Studio-1.0.0-Setup.exe` (installateur NSIS)

## Installation Python requise

⚠️ **Important** : L'application nécessite Python installé sur le système cible.

L'utilisateur doit avoir :
- Python 3.10+ installé
- Les dépendances Python installées : `pip install -r requirements.txt`

### Option 1 : Installer Python automatiquement

Pour inclure Python dans l'installateur, vous pouvez utiliser un script d'installation personnalisé.

### Option 2 : Créer un launcher qui vérifie Python

L'application vérifie automatiquement si Python est installé au démarrage.

## Structure du build

```
release/
├── Lama Worlds Annotation Studio-1.0.0-Setup.exe
└── win-unpacked/ (dossier de développement)
```

## Notes

- Le build inclut le backend Python mais **pas** l'interpréteur Python
- L'utilisateur final doit installer Python séparément
- Pour un build autonome, considérez PyInstaller pour le backend

## Dépannage

### Erreur : "dist folder not found"
→ Exécutez `npm run build` d'abord

### Erreur : "electron-builder not found"
→ Exécutez `npm install`

### Build trop volumineux
→ Normal, Electron inclut Chromium (~100-200 MB)

