use crate::position::toggle_window_at_tray;
use tauri::image::Image;
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager};

pub fn create_tray(app: &AppHandle) -> Result<TrayIcon, String> {
    // Embed the monochrome template clipboard icon
    let icon_bytes = include_bytes!("../icons/tray-icon.png");
    let icon_image = Image::from_bytes(icon_bytes).map_err(|e| e.to_string())?;

    let tray = TrayIconBuilder::new()
        .icon(icon_image)
        .icon_as_template(true) // Treats icon as macOS system template for light/dark mode adaptation
        .tooltip("Cliptray - Clipboard Manager")
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                rect,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = toggle_window_at_tray(&window, Some(rect));
                }
            }
        })
        .build(app)
        .map_err(|e| e.to_string())?;

    Ok(tray)
}

