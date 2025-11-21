import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'antd';
import { ToolOutlined } from '@ant-design/icons';

interface FloatingToolButtonProps {
  onClick: () => void;
}

const FloatingToolButton: React.FC<FloatingToolButtonProps> = ({ onClick }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 只响应左键
    
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // 限制在窗口范围内
      const maxX = window.innerWidth - 48;
      const maxY = window.innerHeight - 48;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);
        
        // 判断是否为点击（移动距离小于5px）
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
          const moveDistance = Math.sqrt(
            Math.pow(e.clientX - (rect.left + dragOffset.x), 2) +
            Math.pow(e.clientY - (rect.top + dragOffset.y), 2)
          );
          
          if (moveDistance < 5) {
            onClick();
          }
        }
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onClick]);

  return (
    <div
      ref={buttonRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<ToolOutlined />}
        style={{
          width: '48px',
          height: '48px',
          backgroundColor: 'rgba(24, 144, 255, 0.9)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: isDragging ? 'none' : 'all 0.3s',
          transform: isDragging ? 'scale(0.95)' : 'scale(1)',
          opacity: isDragging ? 0.8 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'scale(1.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      />
    </div>
  );
};

export default FloatingToolButton;

