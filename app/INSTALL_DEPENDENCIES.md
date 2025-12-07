# Guide d'installation des dépendances Python

Si vous obtenez l'erreur "Backend server is not running!" dans l'application compilée, suivez ces étapes :

## Étape 1 : Vérifier que Python est installé

Ouvrez un terminal (PowerShell ou CMD) et tapez :
```bash
python --version
```

Vous devriez voir quelque chose comme `Python 3.10.0` ou supérieur.

Si Python n'est pas trouvé :
1. Téléchargez Python 3.10+ depuis https://www.python.org/downloads/
2. **IMPORTANT** : Cochez "Add Python to PATH" pendant l'installation
3. Redémarrez votre ordinateur après l'installation

## Étape 2 : Installer les dépendances Python

### Option A : Utiliser le script automatique (recommandé)

1. Naviguez vers le dossier de l'application compilée :
   ```powershell
   cd "L:\Logiciel\Visual Studio 2022\VS Studio Project\LamaWorlds_AnnotationStudio\app\release\win-unpacked"
   ```

2. Exécutez le script d'installation :
   ```powershell
   .\install-backend-deps.ps1
   ```
   
   Ou en CMD :
   ```cmd
   install-backend-deps.bat
   ```

### Option B : Installation manuelle

1. Ouvrez un terminal (PowerShell ou CMD)

2. Naviguez vers le dossier backend de l'application :
   ```powershell
   cd "L:\Logiciel\Visual Studio 2022\VS Studio Project\LamaWorlds_AnnotationStudio\app\release\win-unpacked\resources\backend"
   ```

3. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```
   
   Si cela ne fonctionne pas, essayez :
   ```bash
   python -m pip install -r requirements.txt
   ```

## Étape 3 : Vérifier l'installation

Après l'installation, vérifiez que tout est correct :
```bash
python -c "import fastapi, uvicorn, PIL, numpy, cv2; print('All dependencies installed!')"
```

Si vous voyez "All dependencies installed!", c'est bon !

## Étape 4 : Redémarrer l'application

Fermez complètement l'application et relancez-la. Le backend devrait maintenant démarrer correctement.

## Dépannage

### Erreur : "pip is not recognized"
- Python n'est pas dans le PATH
- Réinstallez Python en cochant "Add Python to PATH"
- Redémarrez votre ordinateur

### Erreur : "ModuleNotFoundError" dans la console
- Les dépendances ne sont pas installées
- Suivez l'Étape 2 pour installer les dépendances

### Le backend ne démarre toujours pas
1. Ouvrez la console de l'application (F12 ou Ctrl+Shift+I)
2. Regardez les messages d'erreur dans la console
3. Vérifiez que Python est accessible : `python --version`
4. Vérifiez que les dépendances sont installées dans le bon environnement Python

### Vérifier quel Python est utilisé
```bash
where python
python -c "import sys; print(sys.executable)"
```

Cela vous montrera quel Python est utilisé et où il se trouve.

