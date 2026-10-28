use regex::Regex;
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardItem {
    pub id: String,
    pub content: String,
    pub item_type: String,
    pub char_count: usize,
    pub preview: String,
    pub pinned: i32,
    pub created_at: i64,
}

#[derive(Clone)]
pub struct Storage {
    conn: Arc<Mutex<Connection>>,
}

impl Storage {
    pub fn new(db_path: PathBuf) -> Result<Self, String> {
        let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

        // Initialize schema
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS clipboard_history (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL UNIQUE,
                item_type TEXT NOT NULL,
                char_count INTEGER NOT NULL,
                preview TEXT NOT NULL,
                pinned INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_history_created_at ON clipboard_history(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_history_pinned ON clipboard_history(pinned DESC);
            ",
        )
        .map_err(|e| format!("Database initialization failed: {}", e))?;

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    /// Insert a new item or bump existing content to top if already present
    pub fn insert_or_bump(&self, raw_content: &str) -> Result<ClipboardItem, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as i64)
            .unwrap_or(0);

        let item_type = detect_type(raw_content);
        let char_count = raw_content.chars().count();
        let preview = make_preview(raw_content);

        // Check if content already exists
        let mut stmt = conn
            .prepare("SELECT id, pinned FROM clipboard_history WHERE content = ?1")
            .map_err(|e| e.to_string())?;

        let existing = stmt
            .query_row(params![raw_content], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, i32>(1)?))
            })
            .ok();

        let (item_id, pinned_status) = if let Some((id, pinned)) = existing {
            // Bump timestamp
            conn.execute(
                "UPDATE clipboard_history SET created_at = ?1 WHERE id = ?2",
                params![now, id],
            )
            .map_err(|e| e.to_string())?;
            (id, pinned)
        } else {
            // Insert fresh item
            let new_id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO clipboard_history (id, content, item_type, char_count, preview, pinned, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6)",
                params![new_id, raw_content, item_type, char_count, preview, now],
            )
            .map_err(|e| e.to_string())?;

            // Prune excess non-pinned items past 100 limit
            let _ = conn.execute(
                "DELETE FROM clipboard_history 
                 WHERE pinned = 0 
                 AND id NOT IN (
                     SELECT id FROM clipboard_history 
                     WHERE pinned = 0 
                     ORDER BY created_at DESC 
                     LIMIT 100
                 )",
                [],
            );

            (new_id, 0)
        };

        Ok(ClipboardItem {
            id: item_id,
            content: raw_content.to_string(),
            item_type: item_type.to_string(),
            char_count,
            preview,
            pinned: pinned_status,
            created_at: now,
        })
    }

    /// Retrieve items up to limit, prioritizing pinned entries
    pub fn get_items(&self, limit: usize) -> Result<Vec<ClipboardItem>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, content, item_type, char_count, preview, pinned, created_at 
                 FROM clipboard_history 
                 ORDER BY pinned DESC, created_at DESC 
                 LIMIT ?1",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![limit as i64], |row| {
                Ok(ClipboardItem {
                    id: row.get(0)?,
                    content: row.get(1)?,
                    item_type: row.get(2)?,
                    char_count: row.get(3)?,
                    preview: row.get(4)?,
                    pinned: row.get(5)?,
                    created_at: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut items = Vec::new();
        for r in rows {
            if let Ok(item) = r {
                items.push(item);
            }
        }
        Ok(items)
    }

    /// Toggle pinned status of an item
    pub fn toggle_pin(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE clipboard_history SET pinned = CASE WHEN pinned = 1 THEN 0 ELSE 1 END WHERE id = ?1",
            params![id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Delete a single item by id
    pub fn delete_item(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM clipboard_history WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Clear all unpinned items
    pub fn clear_unpinned(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM clipboard_history WHERE pinned = 0", [])
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}

/// Classify clipboard content into: link, color, json, code, or text
fn detect_type(content: &str) -> &'static str {
    let trimmed = content.trim();

    // Link check
    if trimmed.starts_with("http://") || trimmed.starts_with("https://") || trimmed.starts_with("www.") {
        return "link";
    }

    // Color check
    let hex_re = Regex::new(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$").unwrap();
    if hex_re.is_match(trimmed) || trimmed.starts_with("rgb(") || trimmed.starts_with("rgba(") || trimmed.starts_with("hsl(") {
        return "color";
    }

    // JSON check
    if (trimmed.starts_with('{') && trimmed.ends_with('}')) || (trimmed.starts_with('[') && trimmed.ends_with(']')) {
        if serde_json::from_str::<serde_json::Value>(trimmed).is_ok() {
            return "json";
        }
    }

    // Code indicators
    let code_keywords = [
        "fn ", "pub fn ", "function ", "const ", "let ", "var ", "class ", "def ", "import ", "from ",
        "SELECT ", "FROM ", "WHERE ", "<div", "/>", "return ", "async ", "await ",
    ];
    if code_keywords.iter().any(|k| trimmed.contains(k)) || trimmed.contains("=>") || trimmed.contains("::") {
        return "code";
    }

    "text"
}

/// Generate a tidy, single-line preview string
fn make_preview(content: &str) -> String {
    let flat = content.lines().map(|l| l.trim()).filter(|l| !l.is_empty()).collect::<Vec<_>>().join(" ");
    let chars: Vec<char> = flat.chars().collect();
    if chars.len() > 140 {
        format!("{}…", chars[..140].iter().collect::<String>())
    } else {
        flat
    }
}

