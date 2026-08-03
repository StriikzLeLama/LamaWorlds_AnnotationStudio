//! Shell Tauri : démarrage du backend FastAPI + commandes natives.
//! Le frontend React reste inchangé côté logique métier ; seul le bridge desktop change.

use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager};

/// Processus Python FastAPI (uvicorn via main.py).
struct BackendProcess(Mutex<Option<Child>>);

/// Lit un fichier texte (YAML/JSON templates, etc.).
#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {e}"))
}

/// Indique si le backend HTTP répond déjà sur :8000.
#[tauri::command]
fn backend_status() -> bool {
    is_backend_up()
}

fn is_backend_up() -> bool {
    std::net::TcpStream::connect_timeout(
        &"127.0.0.1:8000"
            .parse()
            .expect("static addr"),
        Duration::from_millis(400),
    )
    .is_ok()
}

fn project_root() -> PathBuf {
    // src-tauri/ → app/
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| PathBuf::from("."))
}

fn resolve_backend_dir(app: &AppHandle) -> PathBuf {
    // Dev : <app>/backend
    let dev = project_root().join("backend");
    if dev.join("main.py").exists() {
        return dev;
    }

    // Prod : resources embarquées
    if let Ok(resource) = app.path().resource_dir() {
        let candidates = [
            resource.join("backend"),
            resource.join("_up_").join("backend"),
        ];
        for c in candidates {
            if c.join("main.py").exists() {
                return c;
            }
        }
    }

    dev
}

fn find_python() -> Option<PathBuf> {
    let try_cmd = |cmd: &str, args: &[&str]| -> Option<PathBuf> {
        let out = Command::new(cmd).args(args).output().ok()?;
        if !out.status.success() {
            return None;
        }
        let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
        if path.is_empty() {
            return None;
        }
        let p = PathBuf::from(&path);
        if p.exists() {
            Some(p)
        } else {
            // `py` / `python` dans le PATH
            Some(PathBuf::from(cmd))
        }
    };

    #[cfg(windows)]
    {
        if let Some(p) = try_cmd("py", &["-c", "import sys; print(sys.executable)"]) {
            return Some(p);
        }
        for cmd in ["python", "python3"] {
            if let Some(p) = try_cmd(cmd, &["-c", "import sys; print(sys.executable)"]) {
                return Some(p);
            }
        }
        let local = std::env::var("LOCALAPPDATA").unwrap_or_default();
        for ver in ["Python313", "Python312", "Python311", "Python310"] {
            let p = PathBuf::from(&local)
                .join("Programs")
                .join("Python")
                .join(ver)
                .join("python.exe");
            if p.exists() {
                return Some(p);
            }
        }
    }

    #[cfg(not(windows))]
    {
        for cmd in ["python3", "python"] {
            if let Some(p) = try_cmd(cmd, &["-c", "import sys; print(sys.executable)"]) {
                return Some(p);
            }
        }
    }

    None
}

fn spawn_backend(app: &AppHandle, state: &BackendProcess) -> Result<(), String> {
    if is_backend_up() {
        let _ = app.emit("backend-ready", ());
        return Ok(());
    }

    let python = find_python().ok_or_else(|| {
        "Python introuvable. Installez Python 3.10+ et ajoutez-le au PATH.".to_string()
    })?;

    let backend_dir = resolve_backend_dir(app);
    if !backend_dir.join("main.py").exists() {
        return Err(format!(
            "Backend introuvable : {}",
            backend_dir.display()
        ));
    }

    let root = project_root();
    let is_dev = cfg!(debug_assertions) && root.join("backend").join("main.py").exists();

    let mut cmd = Command::new(&python);
    if is_dev {
        // Import package `backend` depuis la racine app/
        cmd.args(["-m", "backend.main"]).current_dir(&root);
    } else {
        cmd.arg(backend_dir.join("main.py")).current_dir(&backend_dir);
    }

    cmd.env("PYTHONUNBUFFERED", "1")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Impossible de démarrer Python ({python:?}): {e}"))?;

    // Relayer stdout/stderr vers les logs + événements frontend
    if let Some(stdout) = child.stdout.take() {
        let handle = app.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines().flatten() {
                log::info!("[backend] {line}");
                if line.contains("Uvicorn running") || line.contains("Application startup complete")
                {
                    let _ = handle.emit("backend-ready", ());
                }
            }
        });
    }
    if let Some(stderr) = child.stderr.take() {
        let handle = app.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines().flatten() {
                log::warn!("[backend] {line}");
                let lower = line.to_lowercase();
                if lower.contains("error")
                    || lower.contains("traceback")
                    || lower.contains("modulenotfounderror")
                {
                    let _ = handle.emit("backend-error", line.clone());
                }
                if line.contains("Uvicorn running") || line.contains("Application startup complete")
                {
                    let _ = handle.emit("backend-ready", ());
                }
            }
        });
    }

    *state.0.lock().map_err(|e| e.to_string())? = Some(child);

    // Poll HTTP jusqu'à ready (ou timeout soft)
    let handle = app.clone();
    thread::spawn(move || {
        for _ in 0..60 {
            if is_backend_up() {
                let _ = handle.emit("backend-ready", ());
                return;
            }
            thread::sleep(Duration::from_millis(500));
        }
        let _ = handle.emit(
            "backend-error",
            "Le backend Python n'a pas répondu sur le port 8000.".to_string(),
        );
    });

    Ok(())
}

fn kill_backend(state: &BackendProcess) {
    if let Ok(mut guard) = state.0.lock() {
        if let Some(mut child) = guard.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(BackendProcess(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![read_text_file, backend_status])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let handle = app.handle().clone();
            let state = app.state::<BackendProcess>();
            if let Err(err) = spawn_backend(&handle, &state) {
                log::error!("{err}");
                let _ = handle.emit("backend-error", err);
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                let state = app_handle.state::<BackendProcess>();
                kill_backend(&state);
            }
        });
}

// silence unused import warning on non-windows if Path unused in helpers
#[allow(dead_code)]
fn _path_exists(p: &Path) -> bool {
    p.exists()
}
