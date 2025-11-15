declare module 'katex' {
  export interface KatexOptions {
    throwOnError?: boolean;
    displayMode?: boolean;
    [key: string]: any;
  }

  export function render(tex: string, element: HTMLElement, options?: KatexOptions): void;
  export function renderToString(tex: string, options?: KatexOptions): string;

  const katex: {
    render: typeof render;
    renderToString: typeof renderToString;
  };

  export default katex;
}

