; NSIS Installer Script for Lama Worlds Annotation Studio

; Check for Python installation
Function CheckPython
    ReadRegStr $0 HKLM "SOFTWARE\Python\PythonCore\3.10\InstallPath" ""
    IfFileExists "$0python.exe" PythonFound
    ReadRegStr $0 HKLM "SOFTWARE\Python\PythonCore\3.11\InstallPath" ""
    IfFileExists "$0python.exe" PythonFound
    ReadRegStr $0 HKLM "SOFTWARE\Python\PythonCore\3.12\InstallPath" ""
    IfFileExists "$0python.exe" PythonFound
    
    MessageBox MB_YESNO|MB_ICONQUESTION "Python 3.10+ n'est pas détecté.$\n$\nL'application nécessite Python pour fonctionner.$\n$\nVoulez-vous continuer l'installation ?$\n(Vous devrez installer Python manuellement)" IDYES PythonContinue
    Abort
    PythonContinue:
    Return
    
    PythonFound:
    DetailPrint "Python détecté: $0"
FunctionEnd

; Install Python dependencies
Function InstallPythonDeps
    ; Check if requirements.txt exists
    IfFileExists "$INSTDIR\requirements.txt" 0 SkipDeps
    
    ReadRegStr $0 HKLM "SOFTWARE\Python\PythonCore\3.10\InstallPath" ""
    IfFileExists "$0python.exe" 0 Check311
    DetailPrint "Installation des dépendances Python..."
    ExecWait '"$0python.exe" -m pip install -r "$INSTDIR\requirements.txt"' $1
    IfErrors 0 Done
    DetailPrint "Erreur lors de l'installation des dépendances Python (code: $1)"
    Goto Done
    
    Check311:
    ReadRegStr $0 HKLM "SOFTWARE\Python\PythonCore\3.11\InstallPath" ""
    IfFileExists "$0python.exe" 0 Check312
    DetailPrint "Installation des dépendances Python..."
    ExecWait '"$0python.exe" -m pip install -r "$INSTDIR\requirements.txt"' $1
    IfErrors 0 Done
    DetailPrint "Erreur lors de l'installation des dépendances Python (code: $1)"
    Goto Done
    
    Check312:
    ReadRegStr $0 HKLM "SOFTWARE\Python\PythonCore\3.12\InstallPath" ""
    IfFileExists "$0python.exe" 0 SkipDeps
    DetailPrint "Installation des dépendances Python..."
    ExecWait '"$0python.exe" -m pip install -r "$INSTDIR\requirements.txt"' $1
    IfErrors 0 Done
    DetailPrint "Erreur lors de l'installation des dépendances Python (code: $1)"
    Goto Done
    
    SkipDeps:
    DetailPrint "requirements.txt non trouvé, dépendances Python non installées automatiquement"
    
    Done:
FunctionEnd

; Note: Files are automatically installed by electron-builder
; based on the "files" configuration in package.json
; We only need to add custom installation steps here

Section -Post
    ; Check for Python and install dependencies after files are installed
    Call CheckPython
    Call InstallPythonDeps
SectionEnd

