; NSIS Installer Script for Lama Worlds Annotation Studio
; Enhanced version with automatic Python dependency installation
!include "LogicLib.nsh"

Var PythonPath
Var PythonFound

; Find Python executable in PATH or registry
Function FindPython
    StrCpy $PythonFound "0"
    
    ; First, try to find Python in PATH
    DetailPrint "Recherche de Python dans le PATH..."
    ClearErrors
    ExecWait 'python --version' $0
    IfErrors CheckPyLauncher
    IntCmp $0 0 0 CheckPyLauncher CheckPyLauncher
    DetailPrint "Python trouvé dans le PATH"
    StrCpy $PythonPath "python"
    StrCpy $PythonFound "1"
    Return
    
    CheckPyLauncher:
    ; Try py launcher
    DetailPrint "Recherche du launcher Python (py)..."
    ClearErrors
    ExecWait 'py --version' $0
    IfErrors CheckRegistry
    IntCmp $0 0 0 CheckRegistry CheckRegistry
    DetailPrint "Launcher Python (py) trouvé"
    StrCpy $PythonPath "py"
    StrCpy $PythonFound "1"
    Return
    
    CheckRegistry:
    
    ; Check registry for Python 3.10
    DetailPrint "Recherche de Python 3.10 dans le registre..."
    ReadRegStr $0 HKLM "SOFTWARE\Python\PythonCore\3.10\InstallPath" ""
    StrCmp $0 "" Check311
    StrCpy $1 "$0python.exe"
    IfFileExists "$1" 0 Check311
    DetailPrint "Python 3.10 trouvé: $1"
    StrCpy $PythonPath "$1"
    StrCpy $PythonFound "1"
    Return
    
    Check311:
    ; Check registry for Python 3.11
    DetailPrint "Recherche de Python 3.11 dans le registre..."
    ReadRegStr $0 HKLM "SOFTWARE\Python\PythonCore\3.11\InstallPath" ""
    StrCmp $0 "" Check312
    StrCpy $1 "$0python.exe"
    IfFileExists "$1" 0 Check312
    DetailPrint "Python 3.11 trouvé: $1"
    StrCpy $PythonPath "$1"
    StrCpy $PythonFound "1"
    Return
    
    Check312:
    ; Check registry for Python 3.12
    DetailPrint "Recherche de Python 3.12 dans le registre..."
    ReadRegStr $0 HKLM "SOFTWARE\Python\PythonCore\3.12\InstallPath" ""
    StrCmp $0 "" Check313
    StrCpy $1 "$0python.exe"
    IfFileExists "$1" 0 Check313
    DetailPrint "Python 3.12 trouvé: $1"
    StrCpy $PythonPath "$1"
    StrCpy $PythonFound "1"
    Return
    
    Check313:
    ; Check registry for Python 3.13
    DetailPrint "Recherche de Python 3.13 dans le registre..."
    ReadRegStr $0 HKLM "SOFTWARE\Python\PythonCore\3.13\InstallPath" ""
    StrCmp $0 "" CheckCommonPaths
    StrCpy $1 "$0python.exe"
    IfFileExists "$1" 0 CheckCommonPaths
    DetailPrint "Python 3.13 trouvé: $1"
    StrCpy $PythonPath "$1"
    StrCpy $PythonFound "1"
    Return
    
    CheckCommonPaths:
    ; Check common installation paths
    DetailPrint "Recherche dans les chemins d'installation courants..."
    IfFileExists "C:\Python310\python.exe" 0 Check311Path
    StrCpy $PythonPath "C:\Python310\python.exe"
    StrCpy $PythonFound "1"
    Return
    
    Check311Path:
    IfFileExists "C:\Python311\python.exe" 0 CheckProg310
    StrCpy $PythonPath "C:\Python311\python.exe"
    StrCpy $PythonFound "1"
    Return
    
    CheckProg310:
    IfFileExists "C:\Program Files\Python310\python.exe" 0 CheckProg311
    StrCpy $PythonPath "C:\Program Files\Python310\python.exe"
    StrCpy $PythonFound "1"
    Return
    
    CheckProg311:
    IfFileExists "C:\Program Files\Python311\python.exe" 0 PythonNotFound
    StrCpy $PythonPath "C:\Program Files\Python311\python.exe"
    StrCpy $PythonFound "1"
    Return
    
    PythonNotFound:
    
    ; Python not found
    DetailPrint "Python non trouvé"
    StrCpy $PythonFound "0"
FunctionEnd

; Install Python dependencies
Function InstallPythonDeps
    ; Check if requirements.txt exists
    IfFileExists "$INSTDIR\resources\backend\requirements.txt" UseBackendRequirements
    IfFileExists "$INSTDIR\requirements.txt" UseRootRequirements
    DetailPrint "requirements.txt non trouvé, dépendances Python non installées"
    Return
    
    UseBackendRequirements:
    StrCpy $0 "$INSTDIR\resources\backend\requirements.txt"
    Goto InstallDeps
    
    UseRootRequirements:
    StrCpy $0 "$INSTDIR\requirements.txt"
    
    InstallDeps:
    DetailPrint "Installation des dépendances Python depuis: $0"
    DetailPrint "Utilisation de Python: $PythonPath"
    
    ; Upgrade pip first (silent)
    DetailPrint "Mise à jour de pip..."
    ExecWait '"$PythonPath" -m pip install --upgrade pip --quiet' $1
    IntCmp $1 0 InstallRequirements
    DetailPrint "⚠ Avertissement: pip n'a pas pu être mis à jour (code: $1)"
    
    InstallRequirements:
    ; Install dependencies
    DetailPrint "Installation des dépendances Python (cela peut prendre quelques minutes)..."
    DetailPrint "Veuillez patienter..."
    ExecWait '"$PythonPath" -m pip install -r "$0" --quiet' $1
    
    IntCmp $1 0 Success
    DetailPrint "⚠ Erreur lors de l'installation des dépendances (code: $1)"
    DetailPrint "Tentative avec affichage des erreurs..."
    ExecWait '"$PythonPath" -m pip install -r "$0"' $2
    IntCmp $2 0 Success
    DetailPrint "⚠ Les dépendances n'ont pas pu être installées automatiquement"
    DetailPrint "Les dépendances peuvent être installées manuellement plus tard."
    MessageBox MB_OK|MB_ICONINFORMATION "Les dépendances Python n'ont pas pu être installées automatiquement.$\n$\nVous pouvez les installer manuellement:$\n1. Ouvrez un terminal$\n2. Naviguez vers: $INSTDIR\resources\backend$\n3. Exécutez: pip install -r requirements.txt$\n$\nL'application peut toujours fonctionner si Python et les dépendances sont déjà installés."
    Return
    
    Success:
    DetailPrint "✓ Dépendances Python installées avec succès!"
FunctionEnd

; Main installation section
Section -Post
    DetailPrint "=== Installation des dépendances Python ==="
    
    ; Find Python
    Call FindPython
    
    StrCmp $PythonFound "0" PythonNotFoundMsg
    DetailPrint "Python trouvé: $PythonPath"
    ; Install dependencies
    Call InstallPythonDeps
    Goto Done
    
    PythonNotFoundMsg:
    MessageBox MB_YESNO|MB_ICONQUESTION "Python 3.10+ n'est pas détecté.$\n$\nL'application nécessite Python pour fonctionner.$\n$\nVoulez-vous continuer l'installation ?$\n(Vous devrez installer Python manuellement)" IDYES PythonContinue
    Abort
    
    PythonContinue:
    DetailPrint "Installation continuée sans Python (installation manuelle requise)"
    
    Done:
    DetailPrint "=== Installation terminée ==="
SectionEnd

