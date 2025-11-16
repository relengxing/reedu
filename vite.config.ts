import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  // 注意：不要将 HTML 文件包含在 assetsInclude 中
  // 这样 ?raw 导入才能正确工作，将文件内容内联到代码中
  build: {
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
  }
});

