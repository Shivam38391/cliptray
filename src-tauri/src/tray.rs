use crate::position::toggle_window_at_tray;
use tauri::image::Image;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager};

pub fn create_tray(app: &AppHandle) -> Result<TrayIcon, String> {
    #[cfg(target_os = "macos")]
    let icon_bytes = include_bytes!("../icons/tray-icon.png");
    #[cfg(not(target_os = "macos"))]
    let icon_bytes = include_bytes!("../icons/32x32.png");

    let icon_image = Image::from_bytes(icon_bytes).map_err(|e| e.to_string())?;

    let toggle_i = MenuItemBuilder::with_id("toggle", "Open / Close Cliptray").build(app).map_err(|e| e.to_string())?;
    let quit_i = MenuItemBuilder::with_id("quit", "Quit").build(app).map_err(|e| e.to_string())?;
    let menu = MenuBuilder::new(app)
        .item(&toggle_i)
        .separator()
        .item(&quit_i)
        .build()
        .map_err(|e| e.to_string())?;

    #[allow(unused_mut)]
    let mut builder = TrayIconBuilder::new()
        .icon(icon_image)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("Cliptray - Clipboard Manager");

    #[cfg(target_os = "macos")]
    {
        builder = builder.icon_as_template(true);
    }

    let tray = builder
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "toggle" => {
                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.center();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
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

