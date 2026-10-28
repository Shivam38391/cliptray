/// Simulates native Command+V on macOS or Control+V on Windows/Linux
pub fn simulate_paste_keystroke() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation};
        use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

        unsafe {
            let source = CGEventSource::new(CGEventSourceStateID::CombinedSessionState)
                .map_err(|_| "Failed to initialize CGEventSource".to_string())?;

            // Virtual key code 9 is 'v' on ANSI macOS keyboard layout
            let key_down = CGEvent::new_keyboard_event(source.clone(), 9, true)
                .map_err(|_| "Failed to create key-down event".to_string())?;
            let key_up = CGEvent::new_keyboard_event(source, 9, false)
                .map_err(|_| "Failed to create key-up event".to_string())?;

            key_down.set_flags(CGEventFlags::CGEventFlagCommand);
            key_up.set_flags(CGEventFlags::CGEventFlagCommand);

            key_down.post(CGEventTapLocation::HID);
            key_up.post(CGEventTapLocation::HID);
        }
        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        use enigo::{Direction, Enigo, Key, Keyboard, Settings};

        let mut enigo = Enigo::new(&Settings::default())
            .map_err(|e| format!("Failed to initialize Enigo: {:?}", e))?;

        enigo
            .key(Key::Control, Direction::Press)
            .map_err(|e| format!("Enigo key press error: {:?}", e))?;
        enigo
            .key(Key::Unicode('v'), Direction::Click)
            .map_err(|e| format!("Enigo key click error: {:?}", e))?;
        enigo
            .key(Key::Control, Direction::Release)
            .map_err(|e| format!("Enigo key release error: {:?}", e))?;

        Ok(())
    }
}

