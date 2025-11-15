import React, { useRef, useState, useEffect } from 'react';
import { Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, ToolOutlined, FileTextOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useCourseware } from '../context/CoursewareContext';
import ToolsModal from './ToolsModal';

interface TopNavProps {
  onToolsClick?: () => void;
  countdownTime?: number;
  isCountdownRunning?: boolean;
  isCountdownPaused?: boolean;
  onCountdownTimeChange?: (seconds: number) => void;
  onCountdownStart?: () => void;
  onCountdownPause?: () => void;
  onCountdownStop?: () => void;
  toolsModalVisible?: boolean;
  onToolsModalClose?: () => void;
  onRollCallStart?: (names: string[]) => void;
}

const TopNav: React.FC<TopNavProps> = ({
  onToolsClick,
  countdownTime = 0,
  isCountdownRunning = false,
  isCountdownPaused = false,
  onCountdownTimeChange,
  onCountdownStart,
  onCountdownPause,
  onCountdownStop,
  toolsModalVisible = false,
  onToolsModalClose,
  onRollCallStart,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseware } = useCourseware();
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: 'tools',
      icon: <ToolOutlined />,
      label: '工具',
    },
    ...(courseware
      ? courseware.pages.map((page, index) => ({
          key: `/player/${index}`,
          icon: <FileTextOutlined />,
          label: page.title || `第${index + 1}页`,
        }))
      : []),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'tools') {
      if (onToolsClick) {
        onToolsClick();
      }
    } else {
      navigate(key);
    }
  };

  const checkScrollButtons = () => {
    if (menuContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = menuContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = menuContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [courseware]);

  const scrollLeft = () => {
    if (menuContainerRef.current) {
      menuContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (menuContainerRef.current) {
      menuContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
      {canScrollLeft && (
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={scrollLeft}
          style={{
            position: 'absolute',
            left: 0,
            zIndex: 10,
            height: '100%',
            background: 'linear-gradient(to right, rgba(255,255,255,0.95), transparent)',
          }}
        />
      )}
      <div
        ref={menuContainerRef}
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        onScroll={checkScrollButtons}
      >
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ lineHeight: '64px', border: 'none', minWidth: 'max-content' }}
        />
      </div>
      {canScrollRight && (
        <Button
          type="text"
          icon={<RightOutlined />}
          onClick={scrollRight}
          style={{
            position: 'absolute',
            right: 0,
            zIndex: 10,
            height: '100%',
            background: 'linear-gradient(to left, rgba(255,255,255,0.95), transparent)',
          }}
        />
      )}
      <ToolsModal
        visible={toolsModalVisible}
        onClose={onToolsModalClose || (() => {})}
        countdownTime={countdownTime || 0}
        isCountdownRunning={isCountdownRunning || false}
        isCountdownPaused={isCountdownPaused || false}
        onCountdownTimeChange={onCountdownTimeChange || (() => {})}
        onCountdownStart={onCountdownStart || (() => {})}
        onCountdownPause={onCountdownPause || (() => {})}
        onCountdownStop={onCountdownStop || (() => {})}
        onRollCallStart={onRollCallStart}
      />
    </div>
  );
};

export default TopNav;

