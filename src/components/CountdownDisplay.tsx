import React from 'react';
import { Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface CountdownDisplayProps {
  time: number;
  isRunning: boolean;
  onClick: () => void;
}

const CountdownDisplay: React.FC<CountdownDisplayProps> = ({ time, isRunning, onClick }) => {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getColor = () => {
    if (time === 0) return '#ff4d4f';
    if (time <= 60) return '#faad14';
    return '#52c41a';
  };

  return (
    <div
      onClick={onClick}
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transition: 'all 0.3s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.85)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
      }}
    >
      <ClockCircleOutlined style={{ fontSize: '18px' }} />
      <Text
        strong
        style={{
          fontSize: '20px',
          color: getColor(),
          fontFamily: 'monospace',
          minWidth: '60px',
          textAlign: 'center',
        }}
      >
        {formatTime(time)}
      </Text>
      {isRunning && (
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#52c41a',
            animation: 'pulse 1s infinite',
          }}
        />
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default CountdownDisplay;

