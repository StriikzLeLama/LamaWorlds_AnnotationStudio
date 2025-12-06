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
    ReadRegStr $0 HKLM "SOFTWARE\Python\PythonCore\3.10\InstallPath" ""
    IfFileExists "$0python.exe" 0 Check311
    ExecWait '"$0python.exe" -m pip install -r "$INSTDIR\requirements.txt"'
    Goto Done
    Check311:
    ReadRegStr $0 HKLM "SOFTWARE\Python\PythonCore\3.11\InstallPath" ""
    IfFileExists "$0python.exe" 0 Check312
    ExecWait '"$0python.exe" -m pip install -r "$INSTDIR\requirements.txt"'
    Goto Done
    Check312:
    ReadRegStr $0 HKLM "SOFTWARE\Python\PythonCore\3.12\InstallPath" ""
    IfFileExists "$0python.exe" 0 Done
    ExecWait '"$0python.exe" -m pip install -r "$INSTDIR\requirements.txt"'
    Done:
FunctionEnd

Section "Install"
    Call CheckPython
    ; Install files
    SetOutPath "$INSTDIR"
    File /r "dist"
    File /r "electron"
    File /r "backend"
    File "package.json"
    File "requirements.txt"
    
    ; Try to install Python dependencies
    Call InstallPythonDeps
SectionEnd

