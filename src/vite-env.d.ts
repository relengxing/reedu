/// <reference types="vite/client" />

// 确保 import.meta.glob 的类型支持
declare module '*.html?raw' {
  const content: string;
  export default content;
}

