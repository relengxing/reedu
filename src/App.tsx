import React, { useState, useEffect, useRef } from 'react';
import { Layout } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TopNav from './components/TopNav';
import HomePage from './pages/HomePage';
import NavigationPage from './pages/NavigationPage';
import CatalogPage from './pages/CatalogPage';
import CoursewarePlayer from './pages/CoursewarePlayer';
import CoursePage from './pages/CoursePage';
import ConfigPage from './pages/ConfigPage';
import DynamicCoursePage from './pages/DynamicCoursePage';
import CoursewareSquare from './pages/CoursewareSquare';
import AuthPage from './pages/AuthPage';
import CountdownDisplay from './components/CountdownDisplay';
import CountdownEndAnimation from './components/CountdownEndAnimation';
import RollCallAnimation from './components/RollCallAnimation';
import { CoursewareProvider } from './context/CoursewareContext';
import { AuthProvider } from './context/AuthContext';

const { Content } = Layout;


const App: React.FC = () => {
  const [countdownTime, setCountdownTime] = useState<number>(0);
  const [isCountdownRunning, setIsCountdownRunning] = useState<boolean>(false);
  const [isCountdownPaused, setIsCountdownPaused] = useState<boolean>(false);
  const [toolsModalVisible, setToolsModalVisible] = useState<boolean>(false);
  const [showCountdownEndAnimation, setShowCountdownEndAnimation] = useState<boolean>(false);
  const [rollCallNames, setRollCallNames] = useState<string[]>([]);
  const [showRollCallAnimation, setShowRollCallAnimation] = useState<boolean>(false);
  const countdownIntervalRef = useRef<number | null>(null);

  // 倒计时逻辑
  useEffect(() => {
    if (isCountdownRunning && countdownTime > 0) {
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdownTime((prev) => {
          if (prev <= 1) {
            setIsCountdownRunning(false);
            setIsCountdownPaused(false);
            // 倒计时结束，显示动画
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
  }, [isCountdownRunning, countdownTime]);

  const handleCountdownTimeChange = (seconds: number) => {
    setCountdownTime(seconds);
  };

  const handleCountdownStart = () => {
    if (countdownTime > 0) {
      setIsCountdownRunning(true);
      setIsCountdownPaused(false);
      // 开始倒计时后自动关闭模态框
      setToolsModalVisible(false);
    }
  };

  const handleCountdownPause = () => {
    setIsCountdownRunning(false);
    setIsCountdownPaused(true);
  };

  const handleCountdownStop = () => {
    setIsCountdownRunning(false);
    setIsCountdownPaused(false);
    setCountdownTime(0);
  };

  const handleCountdownEndAnimationComplete = () => {
    setShowCountdownEndAnimation(false);
  };

  const handleRollCallStart = (names: string[]) => {
    setRollCallNames(names);
    setShowRollCallAnimation(true);
    setToolsModalVisible(false);
  };

  const handleRollCallComplete = () => {
    setShowRollCallAnimation(false);
    setRollCallNames([]);
  };

  const handleToolsClick = () => {
    setToolsModalVisible(true);
  };

  return (
    <AuthProvider>
      <CoursewareProvider>
        <Router>
          <AppContent />
        </Router>
      </CoursewareProvider>
    </AuthProvider>
  );
};

// 应用内容组件，需要在 Router 和 CoursewareProvider 内部
const AppContent: React.FC = () => {
  const [countdownTime, setCountdownTime] = useState<number>(0);
  const [isCountdownRunning, setIsCountdownRunning] = useState<boolean>(false);
  const [isCountdownPaused, setIsCountdownPaused] = useState<boolean>(false);
  const [toolsModalVisible, setToolsModalVisible] = useState<boolean>(false);
  const [showCountdownEndAnimation, setShowCountdownEndAnimation] = useState<boolean>(false);
  const [rollCallNames, setRollCallNames] = useState<string[]>([]);
  const [showRollCallAnimation, setShowRollCallAnimation] = useState<boolean>(false);
  const countdownIntervalRef = useRef<number | null>(null);

  // 倒计时逻辑
  useEffect(() => {
    if (isCountdownRunning && countdownTime > 0) {
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdownTime((prev) => {
          if (prev <= 1) {
            setIsCountdownRunning(false);
            setIsCountdownPaused(false);
            // 倒计时结束，显示动画
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
  }, [isCountdownRunning, countdownTime]);

  const handleCountdownTimeChange = (seconds: number) => {
    setCountdownTime(seconds);
  };

  const handleCountdownStart = () => {
    if (countdownTime > 0) {
      setIsCountdownRunning(true);
      setIsCountdownPaused(false);
      // 开始倒计时后自动关闭模态框
      setToolsModalVisible(false);
    }
  };

  const handleCountdownPause = () => {
    setIsCountdownRunning(false);
    setIsCountdownPaused(true);
  };

  const handleCountdownStop = () => {
    setIsCountdownRunning(false);
    setIsCountdownPaused(false);
    setCountdownTime(0);
  };

  const handleCountdownEndAnimationComplete = () => {
    setShowCountdownEndAnimation(false);
  };

  const handleRollCallStart = (names: string[]) => {
    setRollCallNames(names);
    setShowRollCallAnimation(true);
    setToolsModalVisible(false);
  };

  const handleRollCallComplete = () => {
    setShowRollCallAnimation(false);
    setRollCallNames([]);
  };

  const handleToolsClick = () => {
    setToolsModalVisible(true);
  };

  return (
    <>
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        <TopNav
          onToolsClick={handleToolsClick}
          countdownTime={countdownTime}
          isCountdownRunning={isCountdownRunning}
          isCountdownPaused={isCountdownPaused}
          onCountdownTimeChange={handleCountdownTimeChange}
          onCountdownStart={handleCountdownStart}
          onCountdownPause={handleCountdownPause}
          onCountdownStop={handleCountdownStop}
          toolsModalVisible={toolsModalVisible}
          onToolsModalClose={() => setToolsModalVisible(false)}
          onRollCallStart={handleRollCallStart}
        />
        <Content style={{ height: 'calc(100vh - 64px)', overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<NavigationPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/square" element={<CoursewareSquare />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/player/:coursewareIndex/:pageIndex" element={<CoursewarePlayer />} />
            <Route path="/player/:pageIndex" element={<CoursewarePlayer />} />
            {/* 新路由格式：/:platform/:owner/:repo/:folder/:course/:pageIndex? */}
            <Route path="/github/:owner/:repo/*" element={<DynamicCoursePage />} />
            <Route path="/gitee/:owner/:repo/*" element={<DynamicCoursePage />} />
            {/* 课程URL：32位MD5字符串 + 页面索引，格式：/:courseId/:pageIndex */}
            <Route path="/:courseId/:pageIndex" element={<CoursePage />} />
            {/* 课程URL：32位MD5字符串（无页面索引时跳转到第0页），放在其他路由之后，避免与固定路由冲突 */}
            <Route path="/:courseId" element={<CoursePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
        {/* 倒计时显示在右上角 */}
        {countdownTime > 0 && (
          <CountdownDisplay
            time={countdownTime}
            isRunning={isCountdownRunning}
            onClick={handleToolsClick}
          />
        )}
        {/* 倒计时结束动画 */}
        <CountdownEndAnimation
          visible={showCountdownEndAnimation}
          onComplete={handleCountdownEndAnimationComplete}
        />
        {/* 点名动画 */}
        <RollCallAnimation
          names={rollCallNames}
          visible={showRollCallAnimation}
          onComplete={handleRollCallComplete}
        />
      </Layout>
    </>
  );
};

export default App;

