// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// 临时启用控制台以便调试白屏问题
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    println!("Tauri application starting...");
    println!("Current directory: {:?}", std::env::current_dir());
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|_app| {
            println!("Tauri app setup complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

