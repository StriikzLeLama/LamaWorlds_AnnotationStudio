# Guide d'Installation Automatique

## Installation via le Setup.exe

L'installateur `.exe` installe automatiquement :

1. ✅ **L'application Electron** (interface graphique)
2. ✅ **Le backend Python** (dans `resources/backend`)
3. ✅ **Les dépendances Python** (automatiquement via pip)

### Prérequis

- **Python 3.10+** doit être installé sur votre système
- Python doit être dans le PATH ou détectable par l'installateur

### Processus d'Installation

1. **Lancez le fichier `.exe`** (`Lama Worlds Annotation Studio-1.0.0-Setup.exe`)

2. **Suivez l'assistant d'installation** :
   - Choisissez le dossier d'installation
   - L'installateur détecte automatiquement Python
   - Les dépendances Python sont installées automatiquement

3. **Si Python n'est pas détecté** :
   - Un message vous demandera si vous voulez continuer
   - Vous pouvez installer Python manuellement après
   - Téléchargez Python depuis https://www.python.org/downloads/
   - **Important** : Cochez "Add Python to PATH" lors de l'installation

4. **Après l'installation** :
   - Lancez l'application depuis le menu Démarrer ou le raccourci
   - Le backend démarre automatiquement
   - Si le backend ne démarre pas, vérifiez que Python est installé

## Installation Manuelle des Dépendances

Si les dépendances n'ont pas été installées automatiquement :

1. Ouvrez un terminal (PowerShell ou CMD)

2. Naviguez vers le dossier d'installation :
   ```powershell
   cd "C:\Program Files\Lama Worlds Annotation Studio\resources\backend"
   ```

3. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

   Ou utilisez le script fourni :
   ```powershell
   cd "C:\Program Files\Lama Worlds Annotation Studio"
   .\install-backend-deps.ps1
   ```

## Vérification de l'Installation

Pour vérifier que tout est correctement installé :

1. **Vérifiez Python** :
   ```bash
   python --version
   ```

2. **Vérifiez les dépendances** :
   ```bash
   python -c "import fastapi, uvicorn, PIL, numpy, cv2; print('OK')"
   ```

3. **Lancez l'application** et ouvrez un dataset

## Fonctionnalités Incluses

L'application inclut de nombreuses fonctionnalités avancées :

### Annotation
- ✅ Annotations rectangulaires (format YOLO)
- ✅ Sélection multiple (drag rectangle, Ctrl+clic)
- ✅ Duplication d'annotations (Ctrl+D)
- ✅ Commentaires sur annotations
- ✅ Validation automatique

### Navigation
- ✅ Navigation intelligente (prochaine image non annotée)
- ✅ Historique de navigation (Alt+←/→)
- ✅ Vue grille et liste
- ✅ Recherche avancée

### Gestion
- ✅ Export/Import de projets complets
- ✅ Pré-annotation YOLO
- ✅ Templates de classes
- ✅ Tags/métadonnées pour images
- ✅ Statistiques détaillées

### Performance
- ✅ Optimisations React (memo, useCallback, useMemo)
- ✅ Cache intelligent
- ✅ Centrage automatique des images
- ✅ Performance fluide même avec grandes datasets

## Dépannage

### Le backend ne démarre pas

1. Vérifiez que Python est installé : `python --version`
2. Vérifiez que les dépendances sont installées (voir ci-dessus)
3. Ouvrez la console de l'application (F12) pour voir les erreurs détaillées
4. Redémarrez l'application

### Les dépendances ne s'installent pas automatiquement

1. Vérifiez que Python est dans le PATH
2. Installez manuellement (voir section ci-dessus)
3. Redémarrez l'application

### Python n'est pas détecté

1. Réinstallez Python en cochant "Add Python to PATH"
2. Redémarrez votre ordinateur
3. Réinstallez l'application

### Performance lente

1. Fermez les autres applications
2. Vérifiez que vous avez assez de RAM
3. L'application utilise un cache intelligent pour optimiser les performances

## Support

Pour plus d'aide, consultez :
- `INSTALL_DEPENDENCIES.md` pour les détails techniques
- `docs/README.md` pour la documentation complète
- Les logs de l'application (console F12)
- Les messages d'erreur dans l'interface

## Raccourcis Clavier

Appuyez sur `?` ou `F1` dans l'application pour voir tous les raccourcis clavier disponibles.
