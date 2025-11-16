import React, { useState, useEffect, useRef } from 'react';
import { Layout } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import TopNav from './components/TopNav';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import CoursewarePlayer from './pages/CoursewarePlayer';
import CountdownDisplay from './components/CountdownDisplay';
import CountdownEndAnimation from './components/CountdownEndAnimation';
import RollCallAnimation from './components/RollCallAnimation';
import { CoursewareProvider, useCourseware } from './context/CoursewareContext';
import { bundledCoursewaresCount } from './coursewares';

const { Content } = Layout;

// 自动跳转组件：如果有编译期导入的课件，自动跳转到目录页
const AutoRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { coursewares } = useCourseware();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // 如果有编译期导入的课件，且当前在首页，自动跳转到目录页
    if (bundledCoursewaresCount > 0 && coursewares.length > 0 && location.pathname === '/' && !hasRedirected) {
      setHasRedirected(true);
      navigate('/catalog');
    }
  }, [coursewares.length, location.pathname, navigate, hasRedirected]);

  return null;
};

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
    <CoursewareProvider>
      <Router>
        <AppContent />
      </Router>
    </CoursewareProvider>
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
      <AutoRedirect />
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
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/player/:coursewareIndex/:pageIndex" element={<CoursewarePlayer />} />
            <Route path="/player/:pageIndex" element={<CoursewarePlayer />} />
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

