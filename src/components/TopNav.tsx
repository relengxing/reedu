import React, { useRef, useState, useEffect, useMemo } from 'react';
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

// 淡色背景颜色数组，每个课件使用不同颜色
const COURSEWARE_COLORS = [
  '#f0f5ff', // 淡蓝色
  '#f6ffed', // 淡绿色
  '#fff7e6', // 淡橙色
  '#fff0f6', // 淡粉色
  '#f0f9ff', // 淡青色
  '#f9f0ff', // 淡紫色
  '#fffbf0', // 淡黄色
  '#f0fff4', // 淡薄荷绿
];

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
  const { coursewares, currentCoursewareIndex, setCurrentCoursewareIndex } = useCourseware();
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [menuItemColors, setMenuItemColors] = useState<Map<number, string>>(new Map());

  // 构建菜单项：首页、工具、每个课件的页面
  const { menuItems, menuItemColors: computedColors } = useMemo(() => {
    const items: Array<{ key: string; icon: React.ReactNode; label: string }> = [
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
    ];

    const colorMap = new Map<number, string>();
    let itemIndex = items.length;
    
    // 为每个课件添加页面菜单项，使用不同的背景颜色
    coursewares.forEach((cw, cwIndex) => {
      const bgColor = COURSEWARE_COLORS[cwIndex % COURSEWARE_COLORS.length];
      cw.pages.forEach((page) => {
        items.push({
          key: `/player/${cwIndex}/${page.index}`,
          icon: <FileTextOutlined />,
          label: page.title || `第${page.index + 1}页`,
        });
        colorMap.set(itemIndex, bgColor);
        itemIndex++;
      });
    });

    return { menuItems: items, menuItemColors: colorMap };
  }, [coursewares]);

  // 更新颜色映射状态
  useEffect(() => {
    setMenuItemColors(computedColors);
  }, [computedColors]);

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'tools') {
      if (onToolsClick) {
        onToolsClick();
      }
      } else if (key.startsWith('/player/')) {
        // 解析路径：/player/{coursewareIndex}/{pageIndex}
        const match = key.match(/\/player\/(\d+)\/(\d+)/);
        if (match) {
          const cwIndex = parseInt(match[1], 10);
          if (cwIndex >= 0 && cwIndex < coursewares.length) {
            setCurrentCoursewareIndex(cwIndex);
            navigate(key);
          }
        } else {
          navigate(key);
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
  }, [coursewares, currentCoursewareIndex]);

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
          items={menuItems.map((item, index) => ({
            ...item,
            className: menuItemColors.has(index) ? `courseware-menu-item-${index}` : undefined,
          }))}
          onClick={handleMenuClick}
          style={{ lineHeight: '64px', border: 'none', minWidth: 'max-content' }}
        />
        <style>{`
          ${Array.from(menuItemColors.entries()).map(([index, bgColor]) => `
            .courseware-menu-item-${index} {
              background: ${bgColor} !important;
            }
            .courseware-menu-item-${index}:hover {
              background: ${bgColor} !important;
              opacity: 0.85;
            }
            .courseware-menu-item-${index}.ant-menu-item-selected {
              background: ${bgColor} !important;
              opacity: 1;
            }
          `).join('')}
        `}</style>
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

