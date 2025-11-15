import React, { useEffect, useState } from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

interface CountdownEndAnimationProps {
  visible: boolean;
  onComplete: () => void;
}

const CountdownEndAnimation: React.FC<CountdownEndAnimationProps> = ({ visible, onComplete }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      // 播放提示音
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZUhAMT6fj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQYxh9Hz04IzBh5uwO/jmVIQDE+n4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC');
      audio.play().catch(() => {
        // 如果无法播放，使用Web Audio API生成提示音
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      });

      const timer = setTimeout(() => {
        setShow(false);
        onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.8)',
        animation: 'fadeIn 0.3s ease-in',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          animation: 'scaleIn 0.5s ease-out, pulse 1s infinite 0.5s',
        }}
      >
        <Title
          level={1}
          style={{
            color: '#ff4d4f',
            fontSize: '120px',
            margin: 0,
            textShadow: '0 0 20px #ff4d4f, 0 0 40px #ff4d4f, 0 0 60px #ff4d4f',
            fontFamily: 'Arial Black, sans-serif',
          }}
        >
          时间到！
        </Title>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default CountdownEndAnimation;

