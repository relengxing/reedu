import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  // 注意：不要将 HTML 文件包含在 assetsInclude 中
  // 这样 ?raw 导入才能正确工作，将文件内容内联到代码中
  build: {
    // Tauri 使用 Chromium 浏览器，需要设置目标
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    // 不要压缩，让 Tauri 处理
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // 生成 sourcemaps
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      output: {
        // 确保资源文件正确命名
        assetFileNames: (assetInfo) => {
          // HTML 文件如果作为资源（非 ?raw），才需要特殊处理
          // 但使用 ?raw 导入的文件会被内联，不会作为资源
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  preview: {
    // 预览模式也支持history API fallback
    port: 4173
  },
  // Tauri 需要明确设置
  clearScreen: false,
  // 使用环境变量 `TAURI_DEV` 来检测是否在 Tauri 环境中
  envPrefix: ['VITE_', 'TAURI_'],
});

