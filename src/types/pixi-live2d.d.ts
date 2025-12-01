declare module 'pixi-live2d-display-lipsyncpatch' {
  import * as PIXI from 'pixi.js';

  export class Live2DModel extends PIXI.Container {
    static from(source: string | object, options?: any): Promise<Live2DModel>;
    
    width: number;
    height: number;
    anchor: PIXI.ObservablePoint;
    
    motion(group: string, index?: number, priority?: number): Promise<any>;
    expression(name: string): void;
    
    on(event: 'hit', fn: (hitAreas: string[]) => void, context?: any): this;
    
    destroy(options?: any): void;
  }

  export interface Live2DModelOptions {
    autoInteract?: boolean;
    autoUpdate?: boolean;
  }
}

declare global {
  interface Window {
    PIXI: any;
  }
}

export {};

