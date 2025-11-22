fn main() {
    // 验证 dist 目录是否存在（使用绝对路径）
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let dist_path = std::path::Path::new(&manifest_dir).parent().unwrap().join("dist");
    
    println!("cargo:warning=Checking dist directory at: {:?}", dist_path);
    println!("cargo:warning=Current working directory: {:?}", std::env::current_dir().unwrap());
    
    if dist_path.exists() {
        println!("cargo:warning=✓ Found dist directory");
        if dist_path.join("index.html").exists() {
            println!("cargo:warning=✓ Found index.html in dist directory");
        } else {
            println!("cargo:warning=✗ index.html NOT found in dist directory!");
        }
        
        // 列出 dist 目录的内容
        if let Ok(entries) = std::fs::read_dir(&dist_path) {
            println!("cargo:warning=Dist directory contents:");
            for entry in entries.flatten() {
                println!("cargo:warning=  - {:?}", entry.path());
            }
        }
    } else {
        println!("cargo:warning=✗ dist directory NOT found at: {:?}", dist_path);
    }
    
    tauri_build::build()
}

