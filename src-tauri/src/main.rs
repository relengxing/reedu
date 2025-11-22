// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// 临时启用控制台以便调试白屏问题
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    println!("Tauri application starting...");
    println!("Current directory: {:?}", std::env::current_dir());
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            println!("Tauri app setup complete");
            
            // 检查资源文件是否存在
            match app.path().resource_dir() {
                Ok(resource_dir) => {
                    println!("Resource directory: {:?}", resource_dir);
                    if let Ok(entries) = std::fs::read_dir(&resource_dir) {
                        println!("Resource directory contents:");
                        for entry in entries.flatten() {
                            println!("  - {:?}", entry.path());
                        }
                    }
                    
                    // 尝试读取 index.html
                    let index_path = resource_dir.join("index.html");
                    println!("Looking for index.html at: {:?}", index_path);
                    if index_path.exists() {
                        println!("✓ index.html found!");
                    } else {
                        println!("✗ index.html NOT found!");
                    }
                }
                Err(e) => {
                    println!("Failed to get resource directory: {:?}", e);
                }
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

