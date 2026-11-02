#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Emitter;

mod clipboard;
mod input;
mod position;
mod storage;
mod tray;

use clipboard::ClipboardManager;
use storage::{ClipboardItem, Storage};
use std::path::PathBuf;
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager, State, WindowEvent};

pub struct AppState {
    pub storage: Storage,
    pub clipboard: Arc<ClipboardManager>,
}

#[tauri::command]
fn get_history(state: State<'_, AppState>) -> Result<Vec<ClipboardItem>, String> {
    state.storage.get_items(100)
}

#[tauri::command]
fn toggle_pin(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state.storage.toggle_pin(&id)
}

#[tauri::command]
fn delete_item(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state.storage.delete_item(&id)
}

#[tauri::command]
fn clear_history(state: State<'_, AppState>) -> Result<(), String> {
    state.storage.clear_unpinned()
}

#[tauri::command]
fn hide_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn paste_item(app: AppHandle, state: State<'_, AppState>, content: String) -> Result<(), String> {
    // 1. Write content to system clipboard without re-triggering monitor
    state.clipboard.write_text(&content)?;

    // 2. Hide clipboard dropdown panel
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }

    // 3. Delay to allow OS window manager (especially on Linux X11) to return focus to target application
    thread::spawn(move || {
        #[cfg(target_os = "macos")]
        thread::sleep(Duration::from_millis(70));
        #[cfg(not(target_os = "macos"))]
        thread::sleep(Duration::from_millis(180));

        if let Err(err) = input::simulate_paste_keystroke() {
            eprintln!("[Cliptray] Keystroke simulation error: {}", err);
        }
    });

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // macOS: Configure app as an Accessory to completely hide it from the Dock
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            // Prepare local persistent SQLite storage
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| PathBuf::from("./data"));
            let _ = std::fs::create_dir_all(&app_data_dir);
            let db_path = app_data_dir.join("history.db");

            let storage = Storage::new(db_path)
                .map_err(|e| Box::<dyn std::error::Error>::from(e))?;

            let clipboard_manager = Arc::new(ClipboardManager::new());

            // Start continuous 500ms smart clipboard polling thread
            clipboard_manager.start_monitoring(app.handle().clone(), storage.clone());

            // Initialize custom tray icon with doc.on.clipboard template
            let _tray = tray::create_tray(&app.handle())
                .map_err(|e| Box::<dyn std::error::Error>::from(e))?;

            // Configure main window properties & vibrancy
            if let Some(window) = app.get_webview_window("main") {
                // Apply Apple native vibrancy HUD window effect on macOS / Acrylic on Windows
                #[cfg(target_os = "macos")]
                {
                    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                    let _ = apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, Some(16.0));
                }

                #[cfg(target_os = "windows")]
                {
                    use window_vibrancy::apply_acrylic;
                    let _ = apply_acrylic(&window, Some((20, 20, 20, 140)));
                }

                // Center, show, and focus window on startup
                let _ = window.center();
                let _ = window.show();
                let _ = window.set_focus();

                // Hide on blur (focus lost) listener
                let win_clone = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::Focused(focused) = event {
                        if !focused {
                            let _ = win_clone.hide();
                        }
                    }
                });
            }

            // Register global shortcut (Super+V / Windows+V)
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{Builder, GlobalShortcutExt, Shortcut, ShortcutState};

                #[cfg(target_os = "macos")]
                let shortcut_str = "Command+Shift+V";

                #[cfg(target_os = "linux")]
                let shortcut_str = "Super+V";

                #[cfg(target_os = "windows")]
                let shortcut_str = "Super+V";

                let shortcut = shortcut_str.parse::<Shortcut>().map_err(|e| Box::<dyn std::error::Error>::from(e.to_string()))?;

                app.handle().plugin(
                    Builder::new()
                        .with_handler(move |app_handle, sc, event| {
                            if sc == &shortcut && event.state() == ShortcutState::Pressed {
                                if let Some(window) = app_handle.get_webview_window("main") {
                                    if window.is_visible().unwrap_or(false) {
                                        let _ = window.set_always_on_top(false);
                                        let _ = window.hide();
                                    } else {
                                        let _ = window.center();
                                        let _ = window.show();
                                        let _ = window.unminimize();
                                        let _ = window.set_always_on_top(true);
                                        let _ = window.set_focus();
                                        let _ = window.emit("window-opened", ());

                                        #[cfg(target_os = "linux")]
                                        {
                                            std::thread::spawn(|| {
                                                std::thread::sleep(std::time::Duration::from_millis(50));
                                                let _ = std::process::Command::new("xdotool")
                                                    .args(["search", "--onlyvisible", "--name", "Cliptray", "windowraise", "windowactivate"])
                                                    .status();
                                            });
                                        }
                                    }
                                }
                            }
                        })
                        .build(),
                )?;

                app.global_shortcut().register(shortcut).map_err(|e| Box::<dyn std::error::Error>::from(e.to_string()))?;
            }

            // Manage global application state
            app.manage(AppState {
                storage,
                clipboard: clipboard_manager,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_history,
            paste_item,
            toggle_pin,
            delete_item,
            clear_history,
            hide_window,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Cliptray application");
}

