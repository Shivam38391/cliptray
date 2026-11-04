use crate::storage::Storage;
use arboard::Clipboard;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub struct ClipboardManager {
    last_content: Arc<Mutex<String>>,
    clipboard: Arc<Mutex<Option<Clipboard>>>,
}

impl ClipboardManager {
    pub fn new() -> Self {
        let cb = Clipboard::new().ok();
        Self {
            last_content: Arc::new(Mutex::new(String::new())),
            clipboard: Arc::new(Mutex::new(cb)),
        }
    }

    /// Write text to clipboard programmatically while updating the internal deduplication buffer
    pub fn write_text(&self, text: &str) -> Result<(), String> {
        let mut last = self.last_content.lock().map_err(|e| e.to_string())?;
        *last = text.to_string();

        let mut cb_guard = self.clipboard.lock().map_err(|e| e.to_string())?;
        if let Some(ref mut cb) = *cb_guard {
            cb.set_text(text).map_err(|e| e.to_string())?;
        } else {
            let mut cb = Clipboard::new().map_err(|e| e.to_string())?;
            cb.set_text(text).map_err(|e| e.to_string())?;
            *cb_guard = Some(cb);
        }
        Ok(())
    }

    /// Start the background polling thread (runs every 500ms to preserve battery & CPU)
    pub fn start_monitoring(&self, app_handle: AppHandle, storage: Storage) {
        let last_content = Arc::clone(&self.last_content);

        thread::spawn(move || {
            let mut clipboard = match Clipboard::new() {
                Ok(cb) => cb,
                Err(err) => {
                    eprintln!("[Cliptray] Failed to initialize clipboard monitor: {}", err);
                    return;
                }
            };

            loop {
                // Smart polling interval: 500ms is the sweet spot for near-instant responsiveness with 0% CPU
                thread::sleep(Duration::from_millis(500));

                if let Ok(current_text) = clipboard.get_text() {
                    let trimmed = current_text.trim();
                    if trimmed.is_empty() {
                        continue;
                    }

                    // Check if content has changed
                    let is_new = {
                        let mut last = match last_content.lock() {
                            Ok(guard) => guard,
                            Err(_) => continue,
                        };

                        if *last != current_text {
                            *last = current_text.clone();
                            true
                        } else {
                            false
                        }
                    };

                    if is_new {
                        match storage.insert_or_bump(&current_text) {
                            Ok(item) => {
                                // Emit to frontend
                                if let Err(err) = app_handle.emit("clipboard-updated", &item) {
                                    eprintln!("[Cliptray] Failed to emit clipboard event: {}", err);
                                }
                            }
                            Err(err) => {
                                eprintln!("[Cliptray] Failed to persist clipboard item: {}", err);
                            }
                        }
                    }
                }
            }
        });
    }
}

