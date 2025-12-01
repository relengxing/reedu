import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';

// 配置 Live2D 资源路径
(window as any).PIXI = PIXI;

interface Live2DWidgetProps {
  visible: boolean;
  modelUrl: string;
  onClose?: () => void;
}

const Live2DWidget: React.FC<Live2DWidgetProps> = ({ visible, modelUrl, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 拖动相关状态
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('live2d_position');
    return saved ? JSON.parse(saved) : { x: 20, y: window.innerHeight - 420 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!visible || !containerRef.current) {
      return;
    }

    // 创建 PIXI 应用
    const app = new PIXI.Application({
      width: 300,
      height: 400,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      antialias: true,
    });

    containerRef.current.appendChild(app.view as any);
    appRef.current = app;

    // 加载 Live2D 模型
    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 等待 Cubism SDK 加载完成
        let retries = 0;
        while (!(window as any).Live2D && !(window as any).Live2DCubismCore && retries < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }

        if (retries >= 50) {
          throw new Error('Live2D SDK 加载超时');
        }

        // 使用传入的模型 URL
        console.log('加载模型:', modelUrl);
        const model = await Live2DModel.from(modelUrl, {
          autoInteract: true,
          autoUpdate: true,
        });
        console.log('模型加载成功:', modelUrl);
        
        modelRef.current = model;

        // 设置模型大小和位置
        const scale = Math.min(
          app.view.width / model.width,
          app.view.height / model.height
        ) * 0.8;
        
        model.scale.set(scale, scale);
        model.x = app.view.width / 2;
        model.y = app.view.height / 2;
        model.anchor.set(0.5, 0.5);

        // 添加到舞台
        app.stage.addChild(model as any);

        // 添加交互
        model.on('hit', (hitAreas: string[]) => {
          if (hitAreas.includes('body')) {
            model.motion('tap_body');
          }
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load Live2D model:', err);
        setError('加载数字人模型失败');
        setIsLoading(false);
      }
    };

    loadModel();

    // 清理函数
    return () => {
      if (modelRef.current) {
        modelRef.current.destroy();
        modelRef.current = null;
      }
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [visible, modelUrl]);

  // 保存位置到 localStorage
  useEffect(() => {
    localStorage.setItem('live2d_position', JSON.stringify(position));
  }, [position]);

  // 拖动事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return; // 如果点击的是关闭按钮，不触发拖动
    }
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!visible) {
    return null;
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '300px',
        height: '400px',
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
    >
      {/* 关闭按钮 */}
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            zIndex: 1001,
            background: 'rgba(0, 0, 0, 0.6)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s',
            fontWeight: 'bold',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 0, 0, 0.8)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ×
        </button>
      )}

      {/* Loading 状态 */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '14px',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          加载中...
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#fff',
            fontSize: '14px',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <div>{error}</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
            请检查网络连接
          </div>
        </div>
      )}

      {/* Live2D 容器 */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

export default Live2DWidget;

