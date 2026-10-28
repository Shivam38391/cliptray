use tauri::{LogicalPosition, LogicalSize, Manager, PhysicalPosition, PhysicalSize, Position, Rect, Size, WebviewWindow};

/// Toggle window visibility and position it precisely relative to the system tray icon
pub fn toggle_window_at_tray(window: &WebviewWindow, tray_rect: Option<Rect>) -> Result<(), String> {
    if window.is_visible().unwrap_or(false) {
        window.hide().map_err(|e| e.to_string())?;
        return Ok(());
    }

    position_window(window, tray_rect)?;
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

/// Calculate dynamic coordinates and position the window adjacent to the system tray
pub fn position_window(window: &WebviewWindow, tray_rect: Option<Rect>) -> Result<(), String> {
    let scale_factor = window.scale_factor().unwrap_or(1.0);
    let window_size = window.outer_size().map_err(|e| e.to_string())?;

    // Window dimensions in logical pixels
    let win_w = window_size.width as f64 / scale_factor;
    let win_h = window_size.height as f64 / scale_factor;

    // Detect monitor properties
    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| window.primary_monitor().ok().flatten());

    let (screen_x, screen_y, screen_w, screen_h) = if let Some(m) = monitor {
        let pos = m.position();
        let size = m.size();
        let sf = m.scale_factor();
        (
            pos.x as f64 / sf,
            pos.y as f64 / sf,
            size.width as f64 / sf,
            size.height as f64 / sf,
        )
    } else {
        (0.0, 0.0, 1920.0, 1080.0)
    };

    let (target_x, target_y) = if let Some(r) = tray_rect {
        // Extract logical coordinates from tray Rect enum
        let (tray_x, tray_y, tray_w, tray_h) = match (r.position, r.size) {
            (Position::Physical(p), Size::Physical(s)) => (
                p.x as f64 / scale_factor,
                p.y as f64 / scale_factor,
                s.width as f64 / scale_factor,
                s.height as f64 / scale_factor,
            ),
            (Position::Logical(p), Size::Logical(s)) => (p.x, p.y, s.width, s.height),
            (Position::Physical(p), Size::Logical(s)) => (
                p.x as f64 / scale_factor,
                p.y as f64 / scale_factor,
                s.width,
                s.height,
            ),
            (Position::Logical(p), Size::Physical(s)) => (
                p.x,
                p.y,
                s.width as f64 / scale_factor,
                s.height as f64 / scale_factor,
            ),
        };

        let center_x = tray_x + (tray_w / 2.0);
        let mut x = center_x - (win_w / 2.0);

        let y = if cfg!(target_os = "macos") {
            // macOS: Directly beneath the top menu bar icon with a clean 6px margin
            tray_y + tray_h + 6.0
        } else if tray_y > (screen_y + screen_h / 2.0) {
            // Windows / Linux: Bottom taskbar area - directly above the tray icon
            tray_y - win_h - 10.0
        } else {
            // Top taskbar fallback on Windows/Linux
            tray_y + tray_h + 10.0
        };

        (x, y)
    } else {
        // Fallback if OS does not supply tray bounding rect
        if cfg!(target_os = "macos") {
            (screen_x + screen_w - win_w - 20.0, screen_y + 30.0)
        } else {
            (screen_x + screen_w - win_w - 20.0, screen_y + screen_h - win_h - 50.0)
        }
    };

    // Clamp coordinates strictly inside display bounds
    let clamped_x = target_x.clamp(screen_x + 8.0, screen_x + screen_w - win_w - 8.0);
    let clamped_y = target_y.clamp(screen_y + 8.0, screen_y + screen_h - win_h - 8.0);

    window
        .set_position(Position::Logical(LogicalPosition::new(clamped_x, clamped_y)))
        .map_err(|e| e.to_string())?;

    Ok(())
}

