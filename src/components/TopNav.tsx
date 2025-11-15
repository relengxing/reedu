import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Menu, Button, Modal, List } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, ToolOutlined, FileTextOutlined, LeftOutlined, RightOutlined, UnorderedListOutlined } from '@ant-design/icons';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [menuItemColors, setMenuItemColors] = useState<Map<number, string>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [chaptersModalVisible, setChaptersModalVisible] = useState(false);

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

  // 获取滚动容器
  const getScrollContainer = () => {
    return scrollContainerRef.current;
  };

  const checkScrollButtons = () => {
    const scrollContainer = getScrollContainer();
    if (scrollContainer) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // 滚动到当前菜单项并居中
  const scrollToCurrentItem = () => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;
    const selectedItem = scrollContainer.querySelector('.ant-menu-item-selected') as HTMLElement;
    if (selectedItem) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const itemRect = selectedItem.getBoundingClientRect();
      const itemLeft = itemRect.left - containerRect.left + scrollContainer.scrollLeft;
      const itemWidth = itemRect.width;
      const containerWidth = scrollContainer.clientWidth;
      const scrollPosition = itemLeft - (containerWidth / 2) + (itemWidth / 2);
      scrollContainer.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  };

  // 当路由变化时，滚动到当前菜单项
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToCurrentItem();
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, coursewares]);

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

  const handleScrollLeft = () => {
    const scrollContainer = getScrollContainer();
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    const scrollContainer = getScrollContainer();
    if (scrollContainer) {
      scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // 鼠标拖动滚动处理 - 参考 Tabs 的实现
  const handleMouseDown = (e: React.MouseEvent) => {
    // 如果点击的是菜单项或其子元素，不启用拖动
    const target = e.target as HTMLElement;
    if (target.closest('.ant-menu-item') || target.closest('.ant-menu-item-icon') || target.closest('.ant-menu-title-content')) {
      return;
    }
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setScrollLeft(scrollContainer.scrollLeft);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const scrollContainer = getScrollContainer();
      if (!scrollContainer) return;
      e.preventDefault();
      const deltaX = startX - e.clientX;
      scrollContainer.scrollLeft = scrollLeft + deltaX;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setStartX(0);
      setScrollLeft(0);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startX, scrollLeft]);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: '#fff', borderBottom: '1px solid #f0f0f0', height: '33px' }}>
      {canScrollLeft && (
        <Button
          type="text"
          icon={<LeftOutlined />}
          onClick={handleScrollLeft}
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
          minWidth: 0,
          // overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          ref={scrollContainerRef}
          style={{
            overflowX: 'auto',
            // overflowY: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          onScroll={checkScrollButtons}
          onMouseDown={handleMouseDown}
          onWheel={(e) => {
            // 支持鼠标滚轮水平滚动，参考 Tabs 的实现
            const scrollContainer = getScrollContainer();
            if (scrollContainer) {
              e.preventDefault();
              scrollContainer.scrollLeft += e.deltaY;
            }
          }}
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
            // overflowedIndicator={null}
            style={{ 
              lineHeight: '48px', 
              border: 'none', 
              minWidth: 'max-content', 
              height: '48px',
            }}
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
      </div>
      {canScrollRight && (
        <Button
          type="text"
          icon={<RightOutlined />}
          onClick={handleScrollRight}
          style={{
            position: 'absolute',
            right: '40px',
            zIndex: 10,
            height: '100%',
            background: 'linear-gradient(to left, rgba(255,255,255,0.95), transparent)',
          }}
        />
      )}
      {/* 所有章节按钮 */}
      <Button
        type="text"
        icon={<UnorderedListOutlined />}
        onClick={() => setChaptersModalVisible(true)}
        style={{
          position: 'absolute',
          right: 0,
          zIndex: 10,
          height: '100%',
          padding: '0 12px',
        }}
        title="查看所有章节"
      />
      {/* 所有章节Modal */}
      <Modal
        title="所有章节"
        open={chaptersModalVisible}
        onCancel={() => setChaptersModalVisible(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={menuItems.filter(item => item.key.startsWith('/player/'))}
          renderItem={(item) => {
            const match = item.key.match(/\/player\/(\d+)\/(\d+)/);
            if (!match) return null;
            const cwIndex = parseInt(match[1], 10);
            const pageIndex = parseInt(match[2], 10);
            const courseware = coursewares[cwIndex];
            if (!courseware) return null;
            const page = courseware.pages[pageIndex];
            if (!page) return null;
            
            return (
              <List.Item
                style={{
                  cursor: 'pointer',
                  backgroundColor: location.pathname === item.key ? '#e6f7ff' : 'transparent',
                }}
                onClick={() => {
                  setCurrentCoursewareIndex(cwIndex);
                  navigate(item.key);
                  setChaptersModalVisible(false);
                }}
              >
                <List.Item.Meta
                  title={
                    <span>
                      {courseware.title} - {page.title || `第${pageIndex + 1}页`}
                    </span>
                  }
                  description={`课件 ${cwIndex + 1} / 页面 ${pageIndex + 1}`}
                />
              </List.Item>
            );
          }}
        />
      </Modal>
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

