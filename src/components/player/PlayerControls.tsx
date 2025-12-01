import React, { useState, useEffect, useRef, useCallback } from 'react';
import FloatingToolButton from './FloatingToolButton';
import PlayerDrawer, { LIVE2D_MODELS } from './PlayerDrawer';
import CatalogFloatingButton from './CatalogFloatingButton';
import CatalogDrawer from './CatalogDrawer';
import CountdownDisplay from '../CountdownDisplay';
import CountdownEndAnimation from '../CountdownEndAnimation';
import Live2DWidget from '../Live2DWidget';
import type { CoursewareData } from '../../types';

interface PlayerControlsProps {
  coursewares: CoursewareData[];
  currentCoursewareIndex: number;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  coursewares,
  currentCoursewareIndex,
}) => {
  // 从 localStorage 读取初始设置
  const [showPageButtons, setShowPageButtons] = useState(() => {
    const saved = localStorage.getItem('player_showPageButtons');
    return saved === null ? true : saved === 'true';
  });
  
  const [showCatalog, setShowCatalog] = useState(() => {
    const saved = localStorage.getItem('player_showCatalog');
    return saved === 'true';
  });

  const [showLive2D, setShowLive2D] = useState(() => {
    const saved = localStorage.getItem('player_showLive2D');
    return saved === 'true';
  });

  const [live2DModel, setLive2DModel] = useState(() => {
    const saved = localStorage.getItem('player_live2DModel');
    return saved || LIVE2D_MODELS[0].value;
  });

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [catalogDrawerVisible, setCatalogDrawerVisible] = useState(false);

  // 倒计时相关状态
  const [countdownTime, setCountdownTime] = useState<number>(0);
  const [isCountdownRunning, setIsCountdownRunning] = useState<boolean>(false);
  const [isCountdownPaused, setIsCountdownPaused] = useState<boolean>(false);
  const [showCountdownEndAnimation, setShowCountdownEndAnimation] = useState<boolean>(false);
  const countdownIntervalRef = useRef<number | null>(null);

  // 倒计时逻辑
  useEffect(() => {
    if (isCountdownRunning) {
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdownTime((prev) => {
          if (prev <= 1) {
            setIsCountdownRunning(false);
            setIsCountdownPaused(false);
            setShowCountdownEndAnimation(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isCountdownRunning]);

  const handleCountdownTimeChange = useCallback((seconds: number) => {
    setCountdownTime(seconds);
  }, []);

  const handleCountdownStart = useCallback(() => {
    setIsCountdownRunning(true);
    setIsCountdownPaused(false);
  }, []);

  const handleCountdownPause = useCallback(() => {
    setIsCountdownRunning(false);
    setIsCountdownPaused(true);
  }, []);

  const handleCountdownStop = useCallback(() => {
    setIsCountdownRunning(false);
    setIsCountdownPaused(false);
    setCountdownTime(0);
  }, []);

  const handleCountdownEndAnimationComplete = useCallback(() => {
    setShowCountdownEndAnimation(false);
  }, []);

  const handleLive2DModelChange = (model: string) => {
    setLive2DModel(model);
    localStorage.setItem('player_live2DModel', model);
  };

  return (
    <>
      {/* 右上角工具按钮 */}
      <FloatingToolButton onClick={() => setDrawerVisible(true)} />

      {/* 左侧目录按钮 */}
      <CatalogFloatingButton
        visible={showCatalog}
        onClick={() => setCatalogDrawerVisible(true)}
      />

      {/* 右侧工具抽屉 */}
      <PlayerDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        showPageButtons={showPageButtons}
        onShowPageButtonsChange={setShowPageButtons}
        showCatalog={showCatalog}
        onShowCatalogChange={setShowCatalog}
        showLive2D={showLive2D}
        onShowLive2DChange={setShowLive2D}
        live2DModel={live2DModel}
        onLive2DModelChange={handleLive2DModelChange}
        countdownTime={countdownTime}
        isCountdownRunning={isCountdownRunning}
        isCountdownPaused={isCountdownPaused}
        onCountdownTimeChange={handleCountdownTimeChange}
        onCountdownStart={handleCountdownStart}
        onCountdownPause={handleCountdownPause}
        onCountdownStop={handleCountdownStop}
      />

      {/* 左侧目录抽屉 */}
      <CatalogDrawer
        visible={catalogDrawerVisible}
        onClose={() => setCatalogDrawerVisible(false)}
        coursewares={coursewares}
        currentCoursewareIndex={currentCoursewareIndex}
      />

      {/* 倒计时显示 */}
      {countdownTime > 0 && (
        <CountdownDisplay
          time={countdownTime}
          isRunning={isCountdownRunning}
          onClick={() => setDrawerVisible(true)}
        />
      )}

      {/* 倒计时结束动画 */}
      <CountdownEndAnimation
        visible={showCountdownEndAnimation}
        onComplete={handleCountdownEndAnimationComplete}
      />

      {/* Live2D 数字人 */}
      <Live2DWidget
        visible={showLive2D}
        modelUrl={live2DModel}
        onClose={() => setShowLive2D(false)}
      />

      {/* 导出显示设置供父组件使用 */}
      <div style={{ display: 'none' }} data-show-page-buttons={showPageButtons} />
    </>
  );
};

export default PlayerControls;
export type { PlayerControlsProps };

