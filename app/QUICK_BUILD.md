# 🚀 Compilation rapide en .exe

## Commandes simples

### 1. Compiler le frontend React
```bash
npm run build
```

### 2. Créer l'installateur .exe
```bash
npm run build:win
```

**C'est tout !** Le fichier `.exe` sera dans le dossier `release/`

## Commande tout-en-un

```bash
npm run build:app
```

Cette commande fait tout automatiquement :
1. Compile React (Vite)
2. Vérifie la configuration
3. Crée l'installateur Windows

## Résultat

Après compilation, vous trouverez dans `release/` :
- `Lama Worlds Annotation Studio-1.0.0-Setup.exe` ← **C'est votre installateur !**

## ⚠️ Important : Python requis

L'application nécessite Python 3.10+ installé sur l'ordinateur cible.

L'installateur vérifiera automatiquement si Python est installé et proposera d'installer les dépendances Python.

## Taille du fichier

Le fichier `.exe` fera environ **150-200 MB** car il inclut :
- Electron (Chromium)
- Votre application React
- Le backend Python
- Toutes les dépendances

C'est normal pour une application Electron !

## Dépannage

**Erreur "dist not found"**
→ Exécutez `npm run build` d'abord

**Erreur "electron-builder not found"**
→ Exécutez `npm install`

**Build échoue**
→ Vérifiez que vous êtes dans le dossier `app/`

