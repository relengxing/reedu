// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// 临时启用控制台以便调试白屏问题
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

