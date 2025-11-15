import React, { useEffect, useRef, useState } from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

interface RollCallAnimationProps {
  names: string[];
  visible: boolean;
  onComplete: () => void;
}

const RollCallAnimation: React.FC<RollCallAnimationProps> = ({ names, visible, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const startTimeRef = useRef<number>(0);
  const rotationRef = useRef<number>(0);
  const highlightedIndicesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!visible || names.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    startTimeRef.current = Date.now();
    setShowResult(false);
    setSelectedName('');

    // 随机高亮一些名字
    const updateHighlighted = () => {
      highlightedIndicesRef.current.clear();
      const count = Math.min(5, Math.floor(names.length / 3));
      while (highlightedIndicesRef.current.size < count) {
        highlightedIndicesRef.current.add(Math.floor(Math.random() * names.length));
      }
    };

    updateHighlighted();
    const highlightInterval = setInterval(updateHighlighted, 500);

      const draw3DSphere = () => {
        const currentTime = Date.now();
        const elapsed = (currentTime - startTimeRef.current) / 1000;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) * 0.25;
        
        rotationRef.current += 0.015;
        
        // 创建名字位置数组，按z坐标排序以实现正确的深度效果
        const namePositions = names.map((name, index) => {
          const theta = (index / names.length) * Math.PI * 2;
          const phi = Math.acos((index * 2.0) / names.length - 1.0);
          
          const x = radius * Math.sin(phi) * Math.cos(theta + rotationRef.current);
          const y = radius * Math.sin(phi) * Math.sin(theta + rotationRef.current);
          const z = radius * Math.cos(phi);
          
          return { name, index, x, y, z };
        });
        
        // 按z坐标排序，从后往前绘制
        namePositions.sort((a, b) => b.z - a.z);
        
        // 绘制3D球体上的名字
        namePositions.forEach(({ name, index, x, y, z }) => {
          const screenX = centerX + x;
          const screenY = centerY + y;
          const scale = (z + radius) / (2 * radius);
          const alpha = Math.max(0.4, Math.min(1, scale));
          
          const isHighlighted = highlightedIndicesRef.current.has(index);
          const fontSize = isHighlighted ? Math.max(20, 28 * scale * 1.3) : Math.max(14, 18 * scale);
          
          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.globalAlpha = alpha;
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.fillStyle = isHighlighted ? '#ff4d4f' : '#1890ff';
          ctx.strokeStyle = isHighlighted ? '#fff' : '#000';
          ctx.lineWidth = isHighlighted ? 2 : 1;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          if (isHighlighted) {
            ctx.strokeText(name, 0, 0);
          }
          ctx.fillText(name, 0, 0);
          ctx.restore();
        });
        
        // 5秒后选中一个名字
        if (elapsed >= 5 && !showResult) {
          clearInterval(highlightInterval);
          const selectedIndex = Math.floor(Math.random() * names.length);
          setSelectedName(names[selectedIndex]);
          setShowResult(true);
          
          // 3秒后完成
          setTimeout(() => {
            onComplete();
          }, 3000);
        } else if (elapsed < 5) {
          animationRef.current = requestAnimationFrame(draw3DSphere);
        }
      };

    draw3DSphere();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearInterval(highlightInterval);
    };
  }, [visible, names, showResult, onComplete]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.9)',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      {showResult && selectedName && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            animation: 'zoomIn 0.5s ease-out',
          }}
        >
          <Title
            level={1}
            style={{
              color: '#ff4d4f',
              fontSize: '100px',
              margin: 0,
              textShadow: '0 0 20px #ff4d4f, 0 0 40px #ff4d4f',
              fontFamily: 'Arial Black, sans-serif',
            }}
          >
            {selectedName}
          </Title>
        </div>
      )}
      <style>{`
        @keyframes zoomIn {
          from { transform: translate(-50%, -50%) scale(0); }
          to { transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default RollCallAnimation;

