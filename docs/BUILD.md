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

### Mode Développement (Recommandé)

Pour éviter les problèmes de détection de Python en mode build, vous pouvez utiliser le mode développement :

```bash
npm run dev
```

Cette commande démarre automatiquement :
- Le backend Python (FastAPI) sur le port 8000
- Le serveur Vite (React) sur le port 5173
- L'application Electron

**Avantages du mode dev :**
- ✅ Détection Python automatique et fiable
- ✅ Hot-reload pour le développement
- ✅ Logs détaillés en temps réel
- ✅ Pas de problème de PATH
- ✅ Performance optimale avec optimisations React

### Mode Production (Build)

Pour créer un .exe, suivez les étapes ci-dessus, mais notez que :
- L'utilisateur final doit avoir Python installé
- Les dépendances doivent être installées avec `install-backend-deps.bat`
- La détection de Python peut être problématique selon l'environnement

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
- L'application est optimisée pour les performances avec React.memo, useCallback et useMemo
- Pour utiliser Vision LLM avec des modèles GGUF, installez `llama-cpp-python` : `pip install llama-cpp-python`
- Les dépendances Python sont listées dans `requirements.txt`

## Dépannage

### Erreur : "dist folder not found"
→ Exécutez `npm run build` d'abord

### Erreur : "electron-builder not found"
→ Exécutez `npm install`

### Build trop volumineux
→ Normal, Electron inclut Chromium (~100-200 MB)

### Erreur réseau lors de l'ouverture de fichier ou import YAML

Si vous obtenez une erreur réseau ("Network Error" ou "ECONNREFUSED") dans l'application compilée :

1. **Vérifiez que Python est installé** :
   - Python 3.7+ doit être installé et accessible dans votre PATH
   - Téléchargez depuis : https://www.python.org/downloads/
   - Lors de l'installation, cochez "Add Python to PATH"

2. **Installez les dépendances Python** :
   ```bash
   pip install -r requirements.txt
   ```
   Ou si vous avez l'app compilée, naviguez vers `resources/backend` et exécutez :
   ```bash
   pip install fastapi uvicorn pillow numpy opencv-python python-multipart watchdog pyyaml
   ```

3. **Vérifiez les logs du backend** :
   - La console de l'application devrait afficher les messages de démarrage du backend
   - Si vous voyez des erreurs sur des modules manquants, installez-les avec pip

4. **Vérifiez que le backend démarre** :
   - Le backend devrait démarrer automatiquement au lancement de l'application
   - Vérifiez la console pour le message "Backend is ready!"

5. **Vérifiez le port 8000** :
   - Le backend utilise le port 8000 par défaut
   - Assurez-vous qu'aucune autre application n'utilise ce port

## Optimisations incluses

L'application inclut plusieurs optimisations de performance :
- **React.memo** pour éviter les re-renders inutiles
- **useCallback** pour mémoriser les fonctions
- **useMemo** pour mémoriser les calculs coûteux
- **Cache intelligent** des annotations
- **Lazy loading** des images
- **Centrage automatique** des images pour meilleure UX
